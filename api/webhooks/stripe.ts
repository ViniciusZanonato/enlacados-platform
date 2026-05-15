//==========================
// Título : Webhook Stripe — sincroniza assinatura e pagamentos com perfis
//==========================

import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { rateLimit, getClientIp } from '../_lib/rateLimit.js';

// body bruto obrigatório para validar assinatura do webhook
export const config = { api: { bodyParser: false } };

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

function getRawBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limit: 30 req/min por IP (Stripe envia múltiplos eventos em bursts)
  const ip = getClientIp(req.headers as Record<string, string | string[] | undefined>);
  if (!rateLimit(ip, 30, 60_000)) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  const sig = req.headers['stripe-signature'];
  if (!sig) {
    return res.status(400).json({ error: 'Stripe-Signature header ausente' });
  }

  const rawBody = await getRawBody(req);

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[webhook] Erro: STRIPE_WEBHOOK_SECRET não definida');
    return res.status(500).json({ error: 'Configuração do Webhook ausente no servidor.' });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: any) {
    console.error('[webhook] Assinatura inválida:', err.message);
    return res.status(400).json({ error: 'Assinatura inválida' });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const planSlug = session.metadata?.plan_slug;

        if (!userId || !planSlug) {
          console.warn('[webhook] checkout.session.completed sem user_id/plan_slug:', event.id);
          break;
        }

        // 1. Buscar o tipo de perfil associado ao plano para liberação automática
        const { data: planData, error: planError } = await supabase
          .from('plans')
          .select('profile_type')
          .eq('slug', planSlug)
          .single();

        if (planError || !planData) {
          console.error('[webhook] Erro ao buscar dados do plano %s:', planSlug, planError);
        } else {
          // 2. Aplicar Regras de Negócio de Cargos
          if (planData.profile_type === 'institutional') {
            // Regra: Instituição é isolada (sobrescreve papéis anteriores)
            await supabase
              .from('profiles')
              .update({ profile_type: ['institutional'] })
              .eq('user_id', userId);
            console.info('[webhook] Cargo INSTITUCIONAL forçado por pagamento (Isolamento ativado)');
          } else {
            // Regra: Profissional/Outros são acumuláveis
            const { error: roleError } = await supabase.rpc('add_profile_role', {
              p_user_id: userId,
              p_new_role: planData.profile_type
            });
            if (roleError) console.error('[webhook] Erco ao adicionar cargo acumulável:', roleError);
          }
        }

        // 3. Atualizar status da assinatura e slug do plano
        await supabase
          .from('profiles')
          .update({
            plan: planSlug,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            subscription_status: 'active',
          })
          .eq('user_id', userId);

        console.info('[webhook] Assinatura ativada e Portal liberado: user=%s plan=%s', userId, planSlug);
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const price = sub.items.data[0]?.price;

        let planSlug = null;
        if (price && typeof price.product === 'string') {
          // Busca o produto no Stripe para ler os metadados ("pro", "premium") inseridos via dashboard
          const product = await stripe.products.retrieve(price.product);
          planSlug = product.metadata?.plan ?? null;
        }

        await supabase
          .from('profiles')
          .update({
            plan: planSlug,
            subscription_status: sub.status,
          })
          .eq('stripe_subscription_id', sub.id);

        console.info('[webhook] Assinatura atualizada: sub=%s status=%s', sub.id, sub.status);
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;

        await supabase
          .from('profiles')
          .update({ plan: 'free', subscription_status: 'inactive' })
          .eq('stripe_subscription_id', sub.id);

        console.info('[webhook] Assinatura cancelada (inactive): sub=%s', sub.id);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = (invoice as any).subscription as string | null;

        if (subId) {
          await supabase
            .from('profiles')
            .update({ subscription_status: 'past_due' })
            .eq('stripe_subscription_id', subId);
        }

        console.warn('[webhook] Pagamento falhou: invoice=%s sub=%s', invoice.id, subId);
        break;
      }

      default:
        // eventos não tratados: ignorar
        break;
    }
  } catch (err: any) {
    console.error('[webhook] Erro ao processar evento %s: %s', event.type, err.message);
    return res.status(500).json({ error: 'Falha ao processar evento' });
  }

  return res.status(200).json({ received: true });
}
