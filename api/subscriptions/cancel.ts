//==========================
// Título : Cancelar assinatura Stripe no fim do período (cancel_at_period_end)
//==========================

import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // --- JWT ---
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return res.status(401).json({ error: 'Token inválido' });
  }

  // --- subscription_id no perfil ---
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('stripe_subscription_id, subscription_status, plan')
    .eq('user_id', user.id)
    .single();

  if (profileError || !profile) {
    return res.status(404).json({ error: 'Perfil não encontrado' });
  }

  if (!profile.stripe_subscription_id) {
    return res.status(400).json({ error: 'Nenhuma assinatura ativa encontrada' });
  }

  if (profile.subscription_status === 'cancelled') {
    return res.status(400).json({ error: 'Assinatura já está cancelada' });
  }

  try {
    // acesso até o fim do período pago
    const subscription = await stripe.subscriptions.update(
      profile.stripe_subscription_id,
      { cancel_at_period_end: true },
    );

    // --- status cancelling no Supabase ---
    await supabase
      .from('profiles')
      .update({ subscription_status: 'cancelling' })
      .eq('user_id', user.id);

    const cancelDate = subscription.cancel_at
      ? new Date(subscription.cancel_at * 1000).toLocaleDateString('pt-BR')
      : null;

    return res.status(200).json({
      success: true,
      message: cancelDate
        ? `Assinatura cancelada. Acesso mantido até ${cancelDate}.`
        : 'Cancelamento agendado para o fim do período atual.',
      cancel_at: subscription.cancel_at,
    });
  } catch (err: any) {
    console.error('[subscriptions/cancel] Stripe error:', err.message);
    return res.status(500).json({ error: 'Falha ao cancelar assinatura. Tente novamente.' });
  }
}
