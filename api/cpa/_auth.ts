//==========================
// Título : CPA — JWT + verificação de dono do questionário (instituição ou admin)
//==========================

import type { VercelRequest } from '@vercel/node';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface AuthResult {
  user: { id: string; email?: string } | null;
  error: string | null;
}

export interface OwnershipResult {
  authorized: boolean;
  error?: string;
  status?: number;
  questionnaireTitle?: string;
  institutionalProfileId?: string;
}

// Lê Bearer e valida sessão (getUser)
export async function authenticate(
  req: VercelRequest,
  supabase: SupabaseClient,
): Promise<AuthResult> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return { user: null, error: 'Unauthorized' };
  }

  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return { user: null, error: 'Token inválido' };
  }

  return { user, error: null };
}

// Questionário → instituição → profile_id === perfil do user (ou admin)
export async function verifyQuestionnaireOwnership(
  supabase: SupabaseClient,
  userId: string,
  questionnaireId: string,
): Promise<OwnershipResult> {
  // --- questionário ---
  const { data: questionnaire, error: qErr } = await supabase
    .from('cpa_questionnaires')
    .select('id, title, institutional_profile_id')
    .eq('id', questionnaireId)
    .single();

  if (qErr || !questionnaire) {
    return { authorized: false, error: 'Questionário não encontrado', status: 404 };
  }

  // --- perfil logado ---
  const { data: userProfile, error: upErr } = await supabase
    .from('profiles')
    .select('id, profile_type')
    .eq('user_id', userId)
    .single();

  if (upErr || !userProfile) {
    return { authorized: false, error: 'Perfil do usuário não encontrado', status: 403 };
  }

  // --- atalho admin ---
  if (userProfile.profile_type === 'admin') {
    return {
      authorized: true,
      questionnaireTitle: questionnaire.title,
      institutionalProfileId: questionnaire.institutional_profile_id,
    };
  }

  // --- mesmo profile_id da instituição ---
  const { data: institutionalProfile, error: ipErr } = await supabase
    .from('institutional_profiles')
    .select('profile_id')
    .eq('id', questionnaire.institutional_profile_id)
    .single();

  if (ipErr || !institutionalProfile) {
    return { authorized: false, error: 'Acesso negado: instituição não encontrada', status: 403 };
  }

  if (institutionalProfile.profile_id !== userProfile.id) {
    return { authorized: false, error: 'Acesso negado: você não pertence a esta instituição', status: 403 };
  }

  return {
    authorized: true,
    questionnaireTitle: questionnaire.title,
    institutionalProfileId: questionnaire.institutional_profile_id,
  };
}

// Cliente service_role (só servidor)
export function createServiceClient(): SupabaseClient {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}
