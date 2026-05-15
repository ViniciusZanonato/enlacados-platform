import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/api/supabase/client';
import { Loader2, Search, UserPlus, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface AddDependentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  familyProfileId: string;
}

export function AddDependentDialog({ isOpen, onClose, onSuccess, familyProfileId }: AddDependentDialogProps) {
  const [step, setStep] = useState(1);
  const [studentCpf, setStudentCpf] = useState('');
  const [institutionQuery, setInstitutionQuery] = useState('');
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [findingStudent, setFindingStudent] = useState(false);
  const [relationship, setRelationship] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [lgpdAccepted, setLgpdAccepted] = useState(false);

  // Formatação de CPF
  const formatCpf = (val: string) => {
    return val
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  // Hashing SHA-256 (compatível com o banco)
  const encodeSHA256 = async (text: string) => {
    const msgBuffer = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  // Busca de Instituições
  useEffect(() => {
    if (institutionQuery.length < 3) {
      setInstitutions([]);
      return;
    }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('institutional_profiles')
        .select('id, institution_name')
        .ilike('institution_name', `%${institutionQuery}%`)
        .limit(5);
      setInstitutions(data || []);
    }, 500);
    return () => clearTimeout(timer);
  }, [institutionQuery]);

  const handleLink = async () => {
    if (!selectedInstitutionId || !studentCpf) return;

    setLoading(true);
    try {
      const cleanCpf = studentCpf.replace(/\D/g, '');
      const cpfHash = await encodeSHA256(cleanCpf);

      // 1. Tentar encontrar o aluno pelo hash (OBRIGATÓRIO)
      setFindingStudent(true);
      const { data: student, error: studentError } = await supabase
        .from('profiles')
        .select('id')
        .eq('cpf_hash', cpfHash)
        .maybeSingle();
      
      if (studentError) throw studentError;
      
      if (!student) {
        toast.error('Vínculo Recusado', {
            description: 'Não foi encontrado nenhum aluno com este CPF no sistema. Verifique o dado informado.'
        });
        setLoading(false);
        setFindingStudent(false);
        return;
      }
      
      // 2. Criar o vínculo (Apenas se o aluno existir)
       const { error: linkError } = await supabase.from('family_links').insert({
        family_profile_id: familyProfileId,
        student_profile_id: student.id,
        institution_profile_id: selectedInstitutionId,
        student_cpf_hash: cpfHash,
        status: 'pending',
        relationship_type: relationship,
        parent_phone: parentPhone,
        lgpd_accepted: lgpdAccepted
      });

      if (linkError) throw linkError;

      toast.success('Solicitação de vínculo enviada!');
      
      onSuccess();
      onClose();
      // Reset
      setStep(1);
      setStudentCpf('');
      setInstitutionQuery('');
      setSelectedInstitutionId(null);
    } catch (err: any) {
      console.error('Error linking dependent:', err);
      toast.error('Erro ao solicitar vínculo', {
        description: err.message || 'Ocorreu um erro inesperado.'
      });
    } finally {
      setLoading(false);
      setFindingStudent(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            Vincular Novo Dependente
          </DialogTitle>
          <DialogDescription>
            Informe os dados do aluno para solicitar acesso aos relatórios acadêmicos.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="cpf" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              CPF do Aluno (Dependente)
            </Label>
            <Input
              id="cpf"
              placeholder="000.000.000-00"
              value={studentCpf}
              onChange={(e) => setStudentCpf(formatCpf(e.target.value))}
              className="font-mono"
            />
            <p className="text-[10px] text-muted-foreground">
              Usamos o CPF para localizar o perfil do aluno de forma segura.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="institution" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Instituição de Ensino
            </Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="institution"
                placeholder="Ex: Escola Estadual..."
                className="pl-9"
                value={institutionQuery}
                onChange={(e) => setInstitutionQuery(e.target.value)}
              />
            </div>
            
            <div className="mt-2 space-y-1">
              {institutions.map((inst) => (
                <button
                  key={inst.id}
                  onClick={() => {
                    setSelectedInstitutionId(inst.id);
                    setInstitutionQuery(inst.institution_name);
                    setInstitutions([]);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    selectedInstitutionId === inst.id 
                      ? 'bg-primary/10 border-primary/20 text-primary font-medium' 
                      : 'hover:bg-muted text-muted-foreground'
                  } border`}
                >
                  {inst.institution_name}
                </button>
              ))}
              {institutionQuery.length >= 3 && institutions.length === 0 && !selectedInstitutionId && (
                <p className="text-[10px] text-amber-600 bg-amber-50 p-2 rounded border border-amber-100 italic">
                  Nenhuma instituição encontrada com este nome.
                </p>
              )}
            </div>
          </div>
           <div className="space-y-2 mt-4">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Seu Vínculo / Parentesco
            </Label>
            <select 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
            >
              <option value="">Selecione...</option>
              <option value="Pai">Pai</option>
              <option value="Mãe">Mãe</option>
              <option value="Tutor Legal">Tutor Legal / Responsável</option>
              <option value="Avô/Avó">Avô/Avó</option>
              <option value="Outro">Outro</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="parentPhone" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Seu Telefone de Contato
            </Label>
            <Input
              id="parentPhone"
              placeholder="(00) 00000-0000"
              value={parentPhone}
              onChange={(e) => setParentPhone(e.target.value)}
            />
          </div>

          <div className="flex items-start gap-2 pt-2">
            <input 
              type="checkbox" 
              id="lgpd"
              className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              checked={lgpdAccepted}
              onChange={(e) => setLgpdAccepted(e.target.checked)}
            />
            <Label htmlFor="lgpd" className="text-[10px] leading-tight text-muted-foreground cursor-pointer">
              Declaro que os dados informados são verídicos e <strong>dou consentimento voluntário (LGPD)</strong> para o compartilhamento do meu contato com a instituição para fins de auditoria de identidade.
            </Label>
          </div>
          
          <div className="rounded-lg bg-muted/40 p-3 border border-border/50">
             <div className="flex gap-2">
                <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-[10px] leading-relaxed text-muted-foreground">
                  A aprovação é feita pela secretaria da instituição selecionada. Você receberá uma notificação quando o vínculo for ativado.
                </p>
             </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
           <Button 
            onClick={handleLink} 
            disabled={!selectedInstitutionId || studentCpf.length < 14 || !relationship || !lgpdAccepted || loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : 'Solicitar Vínculo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
