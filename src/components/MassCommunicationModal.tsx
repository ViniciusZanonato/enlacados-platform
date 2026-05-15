import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Send, Users } from "lucide-react";
import { supabase } from '@/api/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/hooks/useAuth';

interface MassCommunicationModalProps {
    isOpen: boolean;
    onClose: () => void;
    recipientIds: string[];
    recipientCount: number;
    institutionalProfileId: string;
}

export function MassCommunicationModal({ isOpen, onClose, recipientIds, recipientCount, institutionalProfileId }: MassCommunicationModalProps) {
    const [message, setMessage] = useState('');
    const [link, setLink] = useState('');
    const [isSending, setIsSending] = useState(false);
    const { session: authSession } = useAuth();

    function isValidHttpUrl(url: string): boolean {
        try {
            const parsed = new URL(url);
            return ['http:', 'https:'].includes(parsed.protocol);
        } catch {
            return false;
        }
    }

    const handleSend = async () => {
        if (!message.trim()) {
            toast.error('A mensagem não pode estar vazia.');
            return;
        }

        if (link && !isValidHttpUrl(link)) {
            toast.error('URL inválida. Use apenas http:// ou https://');
            return;
        }

        if (recipientIds.length === 0 && recipientCount === 0) {
            // exige lista de IDs preenchida
            toast.error('Nenhum destinatário selecionado.');
            return;
        }

        setIsSending(true);

        try {
            // --- palavras bloqueadas da instituição ---
            const { data: settings } = await supabase
                .from('institutional_settings')
                .select('blocked_words')
                .eq('institution_profile_id', institutionalProfileId)
                .maybeSingle();

            const customWords: string[] = settings?.blocked_words || [];

            // --- moderação: POST /api/moderation ---
            let isFlagged = false;
            let moderationFailed = false;
            let moderationResponse: any = null;
            if (true) {
                try {
                    const token = authSession?.access_token;
                    const response = await fetch('/api/moderation', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            ...(token ? { Authorization: `Bearer ${token}` } : {}),
                        },
                        body: JSON.stringify({ text: message, custom_blocked_words: customWords })
                    });

                    if (response.ok) {
                        moderationResponse = await response.json();
                        isFlagged = moderationResponse.flagged;
                    } else {
                        moderationFailed = true;
                        toast.warning(`Erro na moderação (Status ${response.status}). A mensagem será revisada manualmente.`);
                    }
                } catch (err) {
                    moderationFailed = true;
                    console.error("Moderation API failed to connect.", err);
                    toast.warning('Moderação indisponível — mensagem ficará pendente de revisão manual.');
                }
            } else {
                moderationFailed = true;
            }

            // --- envio em massa (RPC); se moderação falhar → pending_review ---
            const status = isFlagged ? 'flagged' : moderationFailed ? 'pending_review' : 'approved';

            const { data, error } = await supabase.rpc('send_mass_notifications', {
                p_recipient_ids: recipientIds,
                p_message: message,
                p_link: link || null,
                p_institution_profile_id: institutionalProfileId,
                p_forced_status: status
            });

            if (error) throw error;
            // @ts-ignore
            if (data && data.success === false) throw new Error(data.error || "Erro ao enviar.");

            if (isFlagged) {
                const reason = moderationResponse?.flagged_words?.join(', ') || 'conteúdo suspeito';
                toast.warning(`Sua mensagem foi retida para análise pois contém termos inadequados: ${reason}.`, { duration: 6000 });
            } else {
                toast.success(`${recipientCount} mensagens enviadas com sucesso!`);
            }

            setMessage('');
            setLink('');
            onClose();
        } catch (error: any) {
            toast.error(`Erro ao enviar: ${error.message}`);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Comunicação em Massa
                    </DialogTitle>
                    <DialogDescription>
                        Enviando mensagem para <strong>{recipientCount}</strong> alunos selecionados pelo filtro atual.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="message">Mensagem</Label>
                        <Textarea
                            id="message"
                            placeholder="Digite sua mensagem aqui... (Ex: 'Lembrete: Prazo de rematrícula encerra amanhã!')"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="min-h-[100px]"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="link">Link (Opcional)</Label>
                        <Input
                            id="link"
                            placeholder="https://... ou /portal/..."
                            value={link}
                            onChange={(e) => setLink(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">O aluno será redirecionado para este link ao clicar na notificação.</p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSending}>Cancel</Button>
                    <Button onClick={handleSend} disabled={isSending}>
                        {isSending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Enviando...
                            </>
                        ) : (
                            <>
                                <Send className="mr-2 h-4 w-4" />
                                Enviar Mensagem
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
