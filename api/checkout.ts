//==========================
// Título : Stripe Checkout — sessão de assinatura para o plano escolhido
//==========================

import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { rateLimit, getClientIp } from './_lib/rateLimit.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // --- Rate Limiting: 5 tentativas por minuto por IP ---
    const ip = getClientIp(req.headers as Record<string, string | string[] | undefined>);
    if (!rateLimit(ip, 5, 60_000)) {
      return res.status(429).json({ error: 'Muitas tentativas. Aguarde 1 minuto antes de tentar novamente.' });
    }

    // --- JWT ---
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('[checkout] Auth header ausente ou inválido');
      return res.status(401).json({ error: 'Acesso não autorizado. Por favor, faça login novamente.' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      console.error('[checkout] Token ausente');
      return res.status(401).json({ error: 'Token não encontrado.' });
    }

    // --- Config Validation ---
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!stripeSecretKey) {
      console.error('[checkout] Erro: STRIPE_SECRET_KEY não definida');
      return res.status(500).json({ error: 'Configuração do Stripe ausente no servidor.' });
    }

    if (!supabaseUrl || !supabaseKey) {
      console.error('[checkout] Erro: Supabase URL ou Service Key não definidas');
      return res.status(500).json({ error: 'Configuração do banco de dados ausente no servidor.' });
    }

    const stripe = new Stripe(stripeSecretKey);

    const supabase = createClient(supabaseUrl, supabaseKey);

    // --- User Validation ---
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      console.error('[checkout] Erro ao validar usuário:', authError);
      return res.status(401).json({ error: 'Sessão inválida ou expirada.' });
    }

    const { plan_slug } = req.body as { plan_slug?: string };
    if (!plan_slug) {
      return res.status(400).json({ error: 'Nenhum plano foi selecionado.' });
    }

    // --- Plano e price_id no Supabase ---
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('slug, display_name, stripe_price_id')
      .eq('slug', plan_slug)
      .eq('is_active', true)
      .single();

    if (planError || !plan) {
      console.error('[checkout] Plano não encontrado:', plan_slug, planError);
      return res.status(400).json({ error: 'O plano selecionado não foi encontrado ou está inativo.' });
    }

    if (!plan.stripe_price_id) {
      console.error('[checkout] Plano sem stripe_price_id:', plan_slug);
      return res.status(400).json({ error: 'Este plano ainda não está pronto para receber pagamentos.' });
    }

    // Determine Frontend URL dynamically if not set
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers['host'] || 'localhost:5173';
    const baseUrl = `${protocol}://${host}`;
    const frontendUrl = (process.env.FRONTEND_URL || baseUrl).replace(/\/$/, '');

    // Encode URLs to handle non-ASCII characters (like "ç")
    const successUrl = new URL(`${frontendUrl}/portal?session_id={CHECKOUT_SESSION_ID}&success=true`).toString();
    const cancelUrl = new URL(`${frontendUrl}/planos`).toString();

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: plan.stripe_price_id, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: user.email || '',
      metadata: { user_id: user.id, plan_slug },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
    });

    return res.status(200).json({ checkout_url: session.url });

  } catch (err) {
    console.error('[checkout] Fatal error:', err instanceof Error ? err.message : err);
    return res.status(500).json({ 
      error: 'Ocorreu um erro ao processar o seu pagamento. Tente novamente.'
    });
  }
}
