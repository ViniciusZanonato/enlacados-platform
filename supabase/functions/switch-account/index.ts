// ─────────────────────────────────────────────────────────────────
// Sprint 3 — TCK-2026-03-27-S3-006
// Rate limiting: máximo de 10 trocas de conta por usuário por hora
//               e 30 trocas por IP por hora.
// Usa tabela rate_limit_log no Supabase (sem Redis no MVP).
// Owner: Jax (DevOps) + Diego (Arquitetura)
// ─────────────────────────────────────────────────────────────────

import { createClient } from 'npm:@supabase/supabase-js@2'
import * as jose from 'https://deno.land/x/jose@v4.14.4/index.ts'
import { corsHeaders } from '../_shared/cors.ts'

const RATE_LIMIT_USER_MAX = 10;   // por user_id
const RATE_LIMIT_IP_MAX   = 30;   // por IP
const RATE_LIMIT_WINDOW   = '1 hour';

interface RequestBody {
  target_user_id: string;
}

/**
 * Extrai o IP real do cliente.
 * ALTO-01 FIX: Supabase Edge Functions rodam exclusivamente no Cloudflare.
 * O header cf-connecting-ip é injetado pelo Cloudflare e não pode ser forjado
 * pelo cliente. x-forwarded-for é controlável pelo cliente e NÃO deve ser
 * usado como fonte primária de IP — um atacante pode enviar qualquer valor
 * nesse header para bypassar o rate limit por IP.
 */
function getClientIp(req: Request): string {
  // cf-connecting-ip: injetado pelo Cloudflare, confiável neste ambiente
  // x-real-ip: fallback para ambientes não-Cloudflare (testes locais)
  // Nunca confiar em x-forwarded-for como fonte primária de IP
  return (
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

Deno.serve(async (req) => {
  console.log('Function invoked.');
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // ── Passo 1: parse do body ────────────────────────────────
    console.log('Step 1: Parsing request body.');
    const { target_user_id }: RequestBody = await req.json();
    if (!target_user_id) throw new Error('target_user_id is missing from request body.');
    console.log(`Step 1 successful. Target User ID: ${target_user_id}`);

    // ── Passo 2: valida usuário pelo token ────────────────────
    console.log('Step 2: Getting primary user from auth header.');
    const userSupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    const { data: { user: primaryUser }, error: userError } = await userSupabaseClient.auth.getUser();
    if (userError) throw userError;
    if (!primaryUser) throw new Error('Could not get primary user from Authorization header.');
    console.log(`Step 2 successful. Primary User ID: ${primaryUser.id}`);

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const clientIp = getClientIp(req);

    // ── Passo 3a: rate limiting por usuário ───────────────────
    console.log('Step 3a: Checking per-user rate limit.');
    const { count: userCount, error: userCountError } = await adminClient
      .from('rate_limit_log')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', primaryUser.id)
      .eq('endpoint', 'switch-account')
      .gte('created_at', `now() - interval '${RATE_LIMIT_WINDOW}'`);

    if (userCountError) {
      console.error('Per-user rate limit check failed:', userCountError);
      // Falha aberta — não bloqueia o usuário se o banco tiver problema
    } else if ((userCount ?? 0) >= RATE_LIMIT_USER_MAX) {
      console.warn(`[switch-account] Rate limit por usuário atingido: user ${primaryUser.id} (${userCount} req/hora)`);
      return new Response(
        JSON.stringify({ error: 'Limite de trocas de conta atingido. Tente novamente em 1 hora.' }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Retry-After': '3600',
          },
        }
      );
    }

    // ── Passo 3b: rate limiting por IP ───────────────────────
    console.log('Step 3b: Checking per-IP rate limit.');
    if (clientIp !== 'unknown') {
      const { count: ipCount, error: ipCountError } = await adminClient
        .from('rate_limit_log')
        .select('id', { count: 'exact', head: true })
        .eq('ip_address', clientIp)
        .eq('endpoint', 'switch-account')
        .gte('created_at', `now() - interval '${RATE_LIMIT_WINDOW}'`);

      if (ipCountError) {
        console.error('Per-IP rate limit check failed:', ipCountError);
        // Falha aberta
      } else if ((ipCount ?? 0) >= RATE_LIMIT_IP_MAX) {
        console.warn(`[switch-account] Rate limit por IP atingido: ip ${clientIp} (${ipCount} req/hora)`);
        return new Response(
          JSON.stringify({ error: 'Limite de trocas de conta atingido para este IP. Tente novamente em 1 hora.' }),
          {
            status: 429,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
              'Retry-After': '3600',
            },
          }
        );
      }
    }

    // Registra a tentativa atual (user_id + ip_address)
    await adminClient
      .from('rate_limit_log')
      .insert({ user_id: primaryUser.id, endpoint: 'switch-account', ip_address: clientIp });

    console.log('Step 3 successful. Rate limit OK.');

    // ── Passo 4: verifica vínculo entre contas ────────────────
    console.log('Step 4: Verifying link in database.');
    const { data: link, error: linkError } = await adminClient
      .from('account_links')
      .select('id')
      .eq('primary_user_id', primaryUser.id)
      .eq('linked_user_id', target_user_id)
      .single();

    if (linkError || !link) {
      return new Response(JSON.stringify({ error: 'Não autorizado a trocar para esta conta.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }
    console.log('Step 4 successful. Link verified.');

    // ── Passo 5: gera JWT de curta duração ───────────────────
    console.log('Step 5: Creating custom JWT.');
    const jwtSecret = Deno.env.get('JWT_SECRET');
    if (typeof jwtSecret !== 'string' || jwtSecret.length === 0) {
      throw new Error('JWT Secret não configurado corretamente.');
    }

    const customJwt = await new jose.SignJWT({
      sub: target_user_id,
      role: 'authenticated',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('1m')
      .setIssuedAt()
      .sign(new TextEncoder().encode(jwtSecret));

    console.log('Step 5 successful. JWT created.');

    return new Response(JSON.stringify({ jwt: customJwt }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in Edge Function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
