import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Award, Plus, Trash2, Calendar, ExternalLink } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useState } from 'react';

const AwardsView = ({ awards, setAwards, isEditing }) => {
    const [openCertificateDialog, setOpenCertificateDialog] = useState(false);
    const [currentCertificateUrl, setCurrentCertificateUrl] = useState('');

    const handleAdd = () => {
        setAwards([...awards, { award_name: '', issuer: '', issue_date: '', description: '', certificate_url: '' }]);
    };

    const handleRemove = (index) => {
        setAwards(awards.filter((_, i) => i !== index));
    };

    const handleChange = (index, field, value) => {
        const newAwards = [...awards];
        newAwards[index][field] = value;
        setAwards(newAwards);
    };

    const handleViewCertificate = (url) => {
        if (!url) return;
        setCurrentCertificateUrl(url);
        setOpenCertificateDialog(true);
    };

    return (
        <Card className="shadow-lg rounded-3xl bg-transparent border-none">
            <CardHeader>
                <CardTitle className="flex items-center text-xl"><Award className="mr-3 h-6 w-6"/> Prêmios e Reconhecimentos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {awards.length > 0 ? (
                    awards.map((award, index) => (
                        <div key={index} className="pl-6 border-l-2 border-primary/20 relative">
                            <div className="absolute -left-[11px] top-1 w-5 h-5 bg-primary rounded-full border-4 border-background"></div>
                            {isEditing ? (
                                <div className="space-y-3">
                                    <Input placeholder="Nome do Prêmio" value={award.award_name} onChange={(e) => handleChange(index, 'award_name', e.target.value)} />
                                    <Input placeholder="Instituição Emissora" value={award.issuer} onChange={(e) => handleChange(index, 'issuer', e.target.value)} />
                                    <Input type="date" placeholder="Data de Emissão" value={award.issue_date} onChange={(e) => handleChange(index, 'issue_date', e.target.value)} />
                                    <Input placeholder="URL do Certificado" value={award.certificate_url} onChange={(e) => handleChange(index, 'certificate_url', e.target.value)} />
                                    <Textarea placeholder="Descrição" value={award.description} onChange={(e) => handleChange(index, 'description', e.target.value)} />
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" size="icon"><Trash2 className="w-4 h-4"/></Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Tem certeza que deseja remover este prêmio? Esta ação não pode ser desfeita.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleRemove(index)}>Remover</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            ) : (
                                <div onClick={() => handleViewCertificate(award.certificate_url)} className={award.certificate_url ? 'cursor-pointer' : ''}>
                                    <h4 className="font-bold text-lg">{award.award_name}</h4>
                                    <p className="font-semibold text-primary">{award.issuer}</p>
                                    <p className="text-xs text-muted-foreground mt-1 flex items-center"><Calendar className="w-3 h-3 mr-1.5"/>{award.issue_date}</p>
                                    <p className="text-sm mt-3 whitespace-pre-wrap text-muted-foreground">{award.description}</p>
                                    {award.certificate_url && (
                                        <span className="flex items-center text-primary text-sm mt-2 font-semibold">
                                            <ExternalLink className="w-4 h-4 mr-1" /> Ver Certificado
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    !isEditing && <p className="text-sm text-muted-foreground text-center p-4">Nenhum prêmio ou reconhecimento adicionado.</p>
                )}
                {isEditing && <Button onClick={handleAdd} className="w-full"><Plus className="w-4 h-4 mr-2"/>Adicionar Prêmio</Button>}
            </CardContent>
            <AlertDialog open={openCertificateDialog} onOpenChange={setOpenCertificateDialog}>
                {/* ... AlertDialog content remains the same ... */}
            </AlertDialog>
        </Card>
    );
};

export default AwardsView;