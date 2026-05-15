import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  GraduationCap, Building2, Briefcase,
  CheckCircle2, Loader2, ChevronRight, ChevronLeft,
  AlertCircle, BadgeCheck, Users, Search,
} from 'lucide-react';
import { format } from 'date-fns';

// ─── Utils ──────────────────────────────────────────────────────────────────
async function encodeSHA256(message: string) {
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// ─── Types ──────────────────────────────────────────────────────────────────

type ProfileType = 'personal' | 'professional' | 'institutional' | 'family';
const VALID_PROFILE_TYPES: ProfileType[] = ['personal', 'professional', 'institutional', 'family'];

type VisibilitySettings = {
  show_full_name: boolean;
  show_city: boolean;
  show_email: boolean;
  show_phone: boolean;
  show_cnpj: boolean;
  show_professional_register: boolean;
  show_legal_term?: boolean;
};

type WizardData = {
  profile_type: ProfileType | null;
  phone: string;
  // profissional
  profession: string;
  professional_register: string;
  bio: string;
  city: string;
  state: string;
  // institucional
  institution_name: string;
  cnpj: string;
  institution_type: string;
  contact_email: string;
  responsible_name: string;
  // relacional familia
  family_cpf: string;
  student_cpf: string;
  personal_cpf: string;
  personal_lgpd: boolean;
  selected_institution_id: string;
  institution_search_query: string;
  // visibilidade
  visibility_settings: VisibilitySettings;
};

type CnpjResult = {
  valid: boolean;
  razao_social?: string;
  municipio?: string;
  uf?: string;
  situacao?: string;
} | null;

const INITIAL_DATA: WizardData = {
  profile_type: null,
  phone: '',
  profession: '',
  professional_register: '',
  bio: '',
  city: '',
  state: '',
  institution_name: '',
  cnpj: '',
  institution_type: '',
  contact_email: '',
  responsible_name: '',
  family_cpf: '',
  student_cpf: '',
  personal_cpf: '',
  personal_lgpd: false,
  selected_institution_id: '',
  institution_search_query: '',
  visibility_settings: {
    show_full_name: true,
    show_city: true,
    show_email: false,
    show_phone: false,
    show_cnpj: true,
    show_professional_register: true,
    show_legal_term: false,
  },
};

const INSTITUTION_TYPES = [
  'IES - Universidade Pública',
  'IES - Universidade Privada',
  'IES - Centro Universitário',
  'IES - Faculdade Pública',
  'IES - Faculdade Privada',
  'IES - Instituto Federal (IF/CEFET)',
  'Escola Pública (Estadual/Municipal)',
  'Escola Privada / Colégio',
  'Cursos Livres / Profissionalizantes',
  'ONG / Terceiro setor',
  'Outro',
];

const PROFESSIONS = [
  'Pedagogo(a)',
  'Psicólogo(a)',
  'Psicopedagogo(a)',
  'Professor(a)',
  'Orientador(a) educacional',
  'Coordenador(a) pedagógico(a)',
  'Nutricionista',
  'Assistente social',
  'Fonoaudiólogo(a)',
  'Terapeuta ocupacional',
  'Outro',
];

// ─── CNPJ validation ────────────────────────────────────────────────────────

function formatCnpj(value: string) {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
    .slice(0, 18);
}

function formatCpf(value: string) {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    .slice(0, 14);
}

function formatPhone(value: string) {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length <= 10) {
    return cleaned
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .slice(0, 14);
  }
  return cleaned
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .slice(0, 15);
}

async function fetchCnpj(cnpj: string): Promise<CnpjResult> {
  const cleaned = cnpj.replace(/\D/g, '');
  if (cleaned.length !== 14) return null;
  try {
    const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleaned}`);
    if (!res.ok) return { valid: false };
    const data = await res.json();
    return {
      valid: data.situacao_cadastral === 'ATIVA',
      razao_social: data.razao_social,
      municipio: data.municipio,
      uf: data.uf,
      situacao: data.situacao_cadastral,
    };
  } catch {
    return null;
  }
}

// ─── Step 1: Tipo de perfil ──────────────────────────────────────────────────

function StepType({
  selected,
  onSelect,
  currentRoles = [],
}: {
  selected: ProfileType | null;
  onSelect: (t: ProfileType) => void;
  currentRoles?: string[];
}) {
  const types = [
    {
      key: 'personal' as ProfileType,
      icon: GraduationCap,
      title: 'Estudante / Pessoa física',
      description: 'Acesse cursos, conecte-se com instituições e acompanhe sua jornada educacional.',
    },
    {
      key: 'professional' as ProfileType,
      icon: Briefcase,
      title: 'Profissional autônomo',
      description: 'Ofereça serviços, crie cursos e alcance alunos e instituições.',
    },
    {
      key: 'institutional' as ProfileType,
      icon: Building2,
      title: 'Instituição de ensino',
      description: 'Gerencie sua CPA, alunos, comunicados e relatórios em um só lugar.',
    },
    {
      key: 'family' as ProfileType,
      icon: Users,
      title: 'Familiar / Responsável',
      description: 'Estabeleça laços oficiais com escolas para acompanhar os relatórios de alunos.',
    },
  ];

  return (
    <div className="space-y-3">
      {types.map(({ key, icon: Icon, title, description }) => {
        const hasInstitutional = currentRoles.includes('institutional');
        const isAlreadyAdded = currentRoles.includes(key);
        
        // Regra: Se for institucional, não pode ter mais nada. 
        // Se já tiver outras coisas, ao escolher institucional avisamos no Onboarding (lógica de troca).
        const isDisabled = isAlreadyAdded || (hasInstitutional && key !== 'institutional');

        return (
          <button
            key={key}
            onClick={() => !isDisabled && onSelect(key)}
            disabled={isDisabled}
            className={`w-full text-left flex items-start gap-4 p-4 rounded-xl border-2 transition-all duration-200 relative overflow-hidden ${
              selected === key
                ? 'border-primary bg-primary/5'
                : isDisabled
                  ? 'border-muted bg-muted/20 opacity-60 cursor-not-allowed'
                  : 'border-border hover:border-primary/40 hover:bg-muted/40'
            }`}
          >
            {isAlreadyAdded ? (
              <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/20 text-green-600 border border-green-500/30">
                <CheckCircle2 className="h-3 w-3" />
                <span className="text-[10px] font-bold uppercase">Já Ativo</span>
              </div>
            ) : hasInstitutional && (
              <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
                <span className="text-[10px] font-bold uppercase">Restrito</span>
              </div>
            )}
            <div className={`mt-1 p-2 rounded-lg transition-colors ${
              selected === key || isAlreadyAdded ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
            }`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-sm">{title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                {description}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ─── Step 2: Dados específicos ───────────────────────────────────────────────

function StepData({
  data,
  onChange,
  cnpjResult,
  cnpjLoading,
}: {
  data: WizardData;
  onChange: (partial: Partial<WizardData>) => void;
  cnpjResult: CnpjResult;
  cnpjLoading: boolean;
}) {
  if (data.profile_type === 'personal') {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Complete seu perfil básico para começar. Seu CPF é necessário para vincular sua conta a seus familiares de forma segura.
        </p>
        <div className="space-y-1.5">
          <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Seu CPF *</Label>
          <Input 
            value={data.personal_cpf} 
            onChange={e => onChange({ personal_cpf: formatCpf(e.target.value) })} 
            placeholder="000.000.000-00" 
          />
          <div className="flex items-center gap-2 p-2 bg-primary/5 rounded border border-primary/10">
            <BadgeCheck className="h-4 w-4 text-primary" />
            <p className="text-[10px] text-muted-foreground leading-tight">
              <strong>Segurança Garantida:</strong> Seu CPF será transformado em uma "impressão digital" (hash) anônima. Ninguém terá acesso ao seu número real.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-thin tracking-widest uppercase text-muted-foreground">Cidade</Label>
            <Input value={data.city} onChange={e => onChange({ city: e.target.value })} placeholder="São Paulo" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-thin tracking-widest uppercase text-muted-foreground">Estado</Label>
            <Input value={data.state} onChange={e => onChange({ state: e.target.value })} placeholder="SP" maxLength={2} />
          </div>
        </div>
        <div className="flex items-start gap-2 pt-2">
          <Checkbox 
            id="personal_lgpd"
            checked={data.personal_lgpd}
            onCheckedChange={(checked) => onChange({ personal_lgpd: !!checked })}
          />
          <Label htmlFor="personal_lgpd" className="text-[10px] leading-tight text-muted-foreground cursor-pointer">
            Autorizo o uso do meu CPF para fins de **auditoria de identidade e vínculo familiar**. Declaro estar ciente de que meus dados serão tratados conforme a LGPD e a política de privacidade da plataforma.
          </Label>
        </div>
      </div>
    );
  }

  if (data.profile_type === 'family') {
    return (
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-thin tracking-widest uppercase text-muted-foreground">Seu CPF (Responsável) *</Label>
          <Input 
            value={data.family_cpf} 
            onChange={e => onChange({ family_cpf: formatCpf(e.target.value) })} 
            placeholder="000.000.000-00" 
          />
          <p className="text-[10px] text-muted-foreground">Necessário para auditoria legal do vínculo familiar.</p>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-thin tracking-widest uppercase text-muted-foreground">Seu Telefone *</Label>
          <Input 
            value={data.phone} 
            onChange={e => onChange({ phone: formatPhone(e.target.value) })} 
            placeholder="(00) 00000-0000" 
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-thin tracking-widest uppercase text-muted-foreground">Cidade</Label>
            <Input value={data.city} onChange={e => onChange({ city: e.target.value })} placeholder="Sua cidade" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-thin tracking-widest uppercase text-muted-foreground">Estado</Label>
            <Input value={data.state} onChange={e => onChange({ state: e.target.value })} placeholder="UF" maxLength={2} />
          </div>
        </div>
      </div>
    );
  }

  if (data.profile_type === 'professional') {
    return (
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-thin tracking-widest uppercase text-muted-foreground">Profissão *</Label>
          <select
            value={data.profession}
            onChange={e => onChange({ profession: e.target.value })}
            className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
          >
            <option value="">Selecione sua profissão</option>
            {PROFESSIONS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-thin tracking-widest uppercase text-muted-foreground">
            Nº de registro profissional
          </Label>
          <Input
            value={data.professional_register}
            onChange={e => onChange({ professional_register: e.target.value })}
            placeholder="CRP 06/12345, CRN 3/12345..."
          />
          <p className="text-xs text-muted-foreground">CRP, CRN, CFP, CREFITO etc. Usado para verificação.</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-thin tracking-widest uppercase text-muted-foreground">Cidade</Label>
            <Input value={data.city} onChange={e => onChange({ city: e.target.value })} placeholder="São Paulo" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-thin tracking-widest uppercase text-muted-foreground">Estado</Label>
            <Input value={data.state} onChange={e => onChange({ state: e.target.value })} placeholder="SP" maxLength={2} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-thin tracking-widest uppercase text-muted-foreground">Bio</Label>
          <textarea
            value={data.bio}
            onChange={e => onChange({ bio: e.target.value })}
            placeholder="Conte um pouco sobre você e sua área de atuação..."
            rows={3}
            className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm resize-none"
          />
        </div>
      </div>
    );
  }

  // institutional
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs font-thin tracking-widest uppercase text-muted-foreground">CNPJ *</Label>
        <div className="relative">
          <Input
            value={data.cnpj}
            onChange={e => onChange({ cnpj: formatCnpj(e.target.value) })}
            placeholder="00.000.000/0000-00"
          />
          {cnpjLoading && (
            <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
          )}
          {!cnpjLoading && cnpjResult !== null && (
            cnpjResult.valid
              ? <BadgeCheck className="absolute right-3 top-2.5 h-4 w-4 text-green-600" />
              : <AlertCircle className="absolute right-3 top-2.5 h-4 w-4 text-destructive" />
          )}
        </div>
        {cnpjResult && (
          <p className={`text-xs ${cnpjResult.valid ? 'text-green-600' : 'text-destructive'}`}>
            {cnpjResult.valid
              ? `✓ ${cnpjResult.razao_social} — ${cnpjResult.municipio}/${cnpjResult.uf}`
              : `CNPJ com situação irregular (${cnpjResult.situacao ?? 'inválido'})`
            }
          </p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-thin tracking-widest uppercase text-muted-foreground">Nome da instituição *</Label>
        <Input
          value={data.institution_name}
          onChange={e => onChange({ institution_name: e.target.value })}
          placeholder={cnpjResult?.razao_social ?? 'Nome como aparece para os usuários'}
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-thin tracking-widest uppercase text-muted-foreground">Tipo de instituição *</Label>
        <select
          value={data.institution_type}
          onChange={e => onChange({ institution_type: e.target.value })}
          className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
        >
          <option value="">Selecione o tipo</option>
          {INSTITUTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-thin tracking-widest uppercase text-muted-foreground">Nome do responsável</Label>
          <Input value={data.responsible_name} onChange={e => onChange({ responsible_name: e.target.value })} placeholder="Nome completo" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-thin tracking-widest uppercase text-muted-foreground">E-mail institucional</Label>
          <Input type="email" value={data.contact_email} onChange={e => onChange({ contact_email: e.target.value })} placeholder="cpa@instituicao.edu.br" />
        </div>
      </div>
    </div>
  );
}

// ─── Step 3: Verificação ─────────────────────────────────────────────────────

function StepVerification({ data, cnpjResult, institutionResults, onChange }: { data: WizardData; cnpjResult: CnpjResult; institutionResults: any[]; onChange: (p: Partial<WizardData>) => void }) {
  if (data.profile_type === 'personal') {
    return (
      <div className="text-center space-y-4 py-4">
        <div className="h-14 w-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <GraduationCap className="h-7 w-7 text-primary" />
        </div>
        <div>
          <p className="font-semibold">Perfil de estudante não precisa de verificação</p>
          <p className="text-sm text-muted-foreground mt-1">Você já pode acessar todos os recursos disponíveis.</p>
        </div>
      </div>
    );
  }

  if (data.profile_type === 'family') {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
          <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Vincular Estudante</p>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-thin tracking-widest uppercase text-muted-foreground">Instituição do Aluno *</Label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  className="pl-9"
                  value={data.institution_search_query} 
                  onChange={e => onChange({ institution_search_query: e.target.value })} 
                  placeholder="Busque pelo nome da escola/faculdade..."
                />
              </div>
              {institutionResults.length > 0 && (
                <div className="mt-2 border rounded-md divide-y bg-card overflow-hidden">
                  {institutionResults.map(inst => (
                    <button
                      key={inst.id}
                      onClick={() => onChange({ selected_institution_id: inst.id, institution_search_query: inst.institution_name })}
                      className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center justify-between ${
                        data.selected_institution_id === inst.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                      }`}
                    >
                      {inst.institution_name}
                      {data.selected_institution_id === inst.id && <BadgeCheck className="h-4 w-4" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-thin tracking-widest uppercase text-muted-foreground">CPF do Aluno *</Label>
              <Input 
                value={data.student_cpf} 
                onChange={e => onChange({ student_cpf: formatCpf(e.target.value) })} 
                placeholder="000.000.000-00" 
              />
              <p className="text-[10px] text-muted-foreground italic">O vínculo será enviado para a secretaria da instituição validar.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (data.profile_type === 'professional') {
    const hasRegister = !!data.professional_register.trim();
    return (
      <div className="space-y-4">
        <div className={`rounded-xl border-2 p-4 ${hasRegister ? 'border-yellow-300 bg-yellow-50 dark:bg-yellow-950/20' : 'border-border bg-muted/30'}`}>
          <div className="flex items-start gap-3">
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${hasRegister ? 'bg-yellow-400' : 'bg-muted'}`}>
              <BadgeCheck className={`h-5 w-5 ${hasRegister ? 'text-yellow-900' : 'text-muted-foreground'}`} />
            </div>
            <div>
              <p className="font-semibold text-sm">
                {hasRegister ? 'Verificação em análise em até 48h' : 'Verificação pendente de registro'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                {hasRegister
                  ? `Seu registro "${data.professional_register}" será validado pela equipe Enlaçados. Você receberá o badge "Verificado" no perfil.`
                  : 'Informe seu nº de registro profissional no passo anterior para iniciar a verificação.'
                }
              </p>
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Você pode usar a plataforma normalmente enquanto aguarda. O badge aparece após aprovação.
        </p>
      </div>
    );
  }

  // institutional
  const verified = cnpjResult?.valid === true;
  return (
    <div className="space-y-4">
      <div className={`rounded-xl border-2 p-4 ${verified ? 'border-green-300 bg-green-50 dark:bg-green-950/20' : 'border-destructive/30 bg-destructive/5'}`}>
        <div className="flex items-start gap-3">
          <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${verified ? 'bg-green-500' : 'bg-destructive/20'}`}>
            {verified
              ? <CheckCircle2 className="h-5 w-5 text-white" />
              : <AlertCircle className="h-5 w-5 text-destructive" />
            }
          </div>
          <div>
            <p className="font-semibold text-sm">
              {verified ? 'CNPJ verificado automaticamente' : 'CNPJ não verificado'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              {verified
                ? `${cnpjResult?.razao_social} — situação ATIVA na Receita Federal. Badge "Verificado" ativado.`
                : data.cnpj
                  ? 'O CNPJ informado está irregular ou inativo. Verifique e retorne ao passo anterior.'
                  : 'Nenhum CNPJ informado. Retorne ao passo anterior para adicionar.'
              }
            </p>
          </div>
        </div>
      </div>
      {verified && (
        <p className="text-xs text-muted-foreground">
          A Receita Federal confirma o CNPJ como ativo. Seu perfil institucional está verificado.
        </p>
      )}
    </div>
  );
}

// ─── Step 4: Visibilidade ────────────────────────────────────────────────────

function StepVisibility({
  settings,
  profileType,
  onChange,
}: {
  settings: VisibilitySettings;
  profileType: ProfileType | null;
  onChange: (s: VisibilitySettings) => void;
}) {
  const toggles: { key: keyof VisibilitySettings; label: string; description: string; show: boolean }[] = [
    { key: 'show_full_name', label: 'Nome completo', description: 'Exibir seu nome no perfil público', show: true },
    { key: 'show_city', label: 'Cidade / Estado', description: 'Exibir sua localização', show: true },
    { key: 'show_email', label: 'E-mail', description: 'Exibir e-mail para contato', show: true },
    { key: 'show_phone', label: 'Telefone', description: 'Exibir número de telefone', show: true },
    {
      key: 'show_professional_register',
      label: 'Nº de registro profissional',
      description: 'Exibir seu registro no perfil',
      show: profileType === 'professional',
    },
    {
      key: 'show_cnpj',
      label: 'CNPJ',
      description: 'Exibir CNPJ da instituição',
      show: profileType === 'institutional',
    },
  ];

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Controle o que aparece no seu perfil público. Você pode alterar isso a qualquer momento nas configurações.
      </p>
      {toggles.filter(t => t.show).map(({ key, label, description }) => (
        <div key={key} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
          <div>
            <p className="text-sm font-medium">{label}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          <Switch
            checked={settings[key as keyof VisibilitySettings] as boolean}
            onCheckedChange={checked => onChange({ ...settings, [key]: checked })}
          />
        </div>
      ))}
      
      {profileType === 'family' && (
        <div className="mt-6 p-4 bg-muted/20 rounded-xl border border-border">
          <p className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-primary" /> Termo Legal Expresso (LGPD)
          </p>
          <div className="flex items-start gap-3 mt-3">
            <Switch
              checked={!!settings.show_legal_term}
              onCheckedChange={checked => onChange({ ...settings, show_legal_term: checked })}
            />
            <p className="text-xs text-muted-foreground leading-relaxed pt-0.5">
              Pela proteção estatutária do menor de idade, <strong>eu autorizo e dou consentimento voluntário</strong> para o compartilhamento dos meus dados estritos de contato (Nome Público, CPF e Telefone) única e exclusivamente com a Instituição selecionada neste formulário, para uso em auditoria de identidade civil e aprovação do meu vínculo.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Wizard ─────────────────────────────────────────────────────────────

const STEPS = ['Tipo de conta', 'Seus dados', 'Verificação', 'Privacidade'];

export default function OnboardingWizard() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const isAdmin = profile?.profile_type?.includes('admin');
  const isSkipped = profile?.verification_status === 'skipped';

  useEffect(() => {
    if (isAdmin) {
      navigate('/admin', { replace: true });
    }
  }, [isAdmin, navigate]);

  const [data, setData] = useState<WizardData>(() => ({
    ...INITIAL_DATA,
    profile_type: (profile?.profile_type?.[0] && VALID_PROFILE_TYPES.includes(profile.profile_type[0] as any)
      ? (profile.profile_type[0] as ProfileType)
      : null),
    institution_name: (profile as any)?.institution_name ?? '',
    bio: (profile as any)?.bio ?? '',
    city: (profile as any)?.city ?? '',
    state: (profile as any)?.state ?? '',
  }));

  const [cnpjResult, setCnpjResult] = useState<CnpjResult>(null);
  const [cnpjLoading, setCnpjLoading] = useState(false);
  const [institutionResults, setInstitutionResults] = useState<any[]>([]);

  useEffect(() => {
    const cleaned = data.cnpj.replace(/\D/g, '');
    if (cleaned.length !== 14) {
      setCnpjResult(null);
      return;
    }
    setCnpjLoading(true);
    const timer = setTimeout(async () => {
      const result = await fetchCnpj(data.cnpj);
      setCnpjResult(result);
      setCnpjLoading(false);
      if (result?.valid && result.razao_social && !data.institution_name) {
        setData(prev => ({ ...prev, institution_name: result.razao_social! }));
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [data.cnpj]);

  useEffect(() => {
    if (!data.institution_search_query || data.institution_search_query.length < 3) {
      setInstitutionResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const { data: results } = await supabase
        .from('institutional_profiles')
        .select('id, institution_name')
        .ilike('institution_name', `%${data.institution_search_query}%`)
        .limit(5);
      setInstitutionResults(results || []);
    }, 500);
    return () => clearTimeout(timer);
  }, [data.institution_search_query]);

  const update = useCallback((partial: Partial<WizardData>) => {
    setData(prev => ({ ...prev, ...partial }));
  }, []);

  function canAdvance() {
    if (step === 0) return !!data.profile_type;
    if (step === 1) {
      if (data.profile_type === 'professional') return !!data.profession;
      if (data.profile_type === 'institutional') return !!data.cnpj && !!data.institution_name && !!data.institution_type;
      if (data.profile_type === 'family') return !!data.phone && !!data.family_cpf;
      if (data.profile_type === 'personal') return !!data.personal_cpf && data.personal_cpf.length >= 14 && !!data.personal_lgpd;
      return true;
    }
    if (step === 2) {
      if (data.profile_type === 'family') return !!data.student_cpf && !!data.selected_institution_id;
      return true;
    }
    if (step === 3 && data.profile_type === 'family') {
      return !!data.visibility_settings.show_legal_term;
    }
    return true;
  }

  async function handleFinish() {
    if (!user || isAdmin) return;
    setSaving(true);
    try {
      let verification_status = 'unverified';
      if (data.profile_type === 'professional' && data.professional_register) verification_status = 'pending_review';
      else if (data.profile_type === 'institutional' && data.cnpj) verification_status = 'pending_review';
      else if (data.profile_type === 'family') verification_status = 'pending_review';

      const updates: Record<string, unknown> = {
        bio: data.bio,
        city: data.city,
        state: data.state,
        visibility_settings: data.visibility_settings,
        onboarding_completed: true,
        verification_status,
        verification_submitted_at: new Date().toISOString(),
      };

      if (data.profile_type === 'professional') {
        updates.professional_register = data.professional_register;
        updates.institution_name = null;
        updates.cnpj = null;
      }

      if (data.profile_type === 'institutional') {
        updates.institution_name = data.institution_name;
        updates.cnpj = data.cnpj.replace(/\D/g, '');
      }

      if (data.profile_type === 'family') {
        updates.phone = data.phone;
        updates.cpf = data.family_cpf;
      }

      if (data.profile_type === 'personal') {
        const cleanCpf = data.personal_cpf.replace(/\D/g, '');
        updates.cpf = cleanCpf;
        updates.cpf_hash = await encodeSHA256(cleanCpf);
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      const { error: roleError } = await supabase.rpc('add_profile_role', {
        p_user_id: user.id,
        p_new_role: data.profile_type
      });

      if (roleError) throw roleError;

      const { data: profileRow } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (data.profile_type === 'family' && data.student_cpf && data.selected_institution_id) {
        const { data: studentProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('cpf_hash', await encodeSHA256(data.student_cpf.replace(/\D/g, '')))
          .single();

        const { error: linkError } = await supabase.from('family_links').insert({
            family_profile_id: profileRow?.id,
            student_profile_id: studentProfile?.id,
            institution_profile_id: data.selected_institution_id,
            status: 'pending'
          });
        if (linkError) throw linkError;
      }

      if (data.profile_type === 'institutional') {
        if (profileRow?.id) {
          await supabase.from('institutional_profiles').upsert({
            profile_id: profileRow.id,
            institution_name: data.institution_name,
            institution_type: data.institution_type,
            contact_email: data.contact_email,
          }, { onConflict: 'profile_id' });
        }
      }

      // --- NEW: Claim Institutional Invitations for Students ---
      if (data.profile_type === 'personal' && profileRow?.id) {
        try {
          const { data: claimResult } = await supabase.rpc('claim_institutional_invitations', {
            p_profile_id: profileRow.id,
            p_email: user.email,
            p_cpf_hash: updates.cpf_hash
          });
          
          if (claimResult?.claimed > 0) {
            toast.success(`Vinculado com sucesso a ${claimResult.claimed} instituição(ões)! Suas turmas e histórico foram carregados.`);
          }
        } catch (claimErr) {
          console.error('Error claiming invitations:', claimErr);
          // Don't block onboarding finish if claiming fails, just log it.
        }
      }

      await queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
      toast.success('Perfil configurado com sucesso!');

      const destinations: Record<ProfileType, string> = {
        personal: '/portal/student',
        professional: '/portal/professional',
        institutional: '/portal/institutional',
        family: '/portal/family',
      };
      navigate(destinations[data.profile_type!] ?? '/portal');
    } catch (err: any) {
      toast.error('Erro ao salvar perfil. Tente novamente.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function handleSkip() {
    if (!user) return;
    const confirmed = window.confirm('Pular a configuração? Você poderá completar nas configurações do perfil. Sua conta permanecerá com acesso limitado até ser verificada.');
    if (!confirmed) return;
    setSaving(true);
    await supabase.from('profiles').update({ 
      verification_status: 'skipped',
      onboarding_completed: false 
    }).eq('user_id', user.id);
    
    await queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
    toast.info('Você pode completar seu perfil a qualquer momento para liberar todos os recursos.');
    navigate('/portal'); 
    setSaving(false);
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">

        <div className="mb-8 text-center">
          <div className="h-12 w-12 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-black leading-none">Configure seu perfil</h1>
          <p className="text-sm text-muted-foreground mt-2">Leva menos de 2 minutos</p>
        </div>

        <div className="mb-6">
          {isSkipped && (
            <div className="mb-6 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-center">
               <p className="text-sm font-semibold text-yellow-600">Sua conta está com acesso limitado</p>
               <p className="text-xs text-yellow-700/80">Complete as 4 etapas abaixo para ativar todos os recursos.</p>
            </div>
          )}
          <div className="flex items-center justify-between mb-2">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center gap-1">
                <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  i < step ? 'bg-primary text-white' :
                  i === step ? 'bg-primary/10 text-primary border-2 border-primary' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {i < step ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-0.5 w-8 md:w-16 transition-colors ${i < step ? 'bg-primary' : 'bg-border'}`} />
                )}
              </div>
            ))}
          </div>
          <p className="text-center text-xs font-thin tracking-widest uppercase text-muted-foreground">
            {STEPS[step]}
          </p>
        </div>

        <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
          {step === 0 && <StepType selected={data.profile_type} onSelect={t => setData({ ...data, profile_type: t })} currentRoles={profile?.profile_type} />}
          {step === 1 && <StepDetails data={data} onChange={update} cnpjResult={cnpjResult} cnpjLoading={cnpjLoading} institutionResults={institutionResults} />}
          {step === 2 && <StepVerification data={data} cnpjResult={cnpjResult} institutionResults={institutionResults} onChange={update} />}
          {step === 3 && (
            <StepVisibility
              settings={data.visibility_settings}
              profileType={data.profile_type}
              onChange={vs => update({ visibility_settings: vs })}
            />
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setStep(s => s - 1)} disabled={saving}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
              </Button>
            )}
            <Button variant="ghost" size="sm" className="text-muted-foreground text-xs" onClick={handleSkip} disabled={saving}>
              Pular por agora
            </Button>
          </div>

          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(s => s + 1)} disabled={!canAdvance()}>
              Próximo <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleFinish} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Concluir
            </Button>
          )}
        </div>

      </div>
    </div>
  );
}
