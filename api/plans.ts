//==========================
// Título : Listagem pública de planos ativos (sem stripe_price_id)
//==========================

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export interface Plan {
  id: string;
  slug: string;
  display_name: string;
  description: string | null;
  price_brl: number | null;
  period: string | null;
  features: string[] | null;
  is_active: boolean;
  created_at: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('[plans] Missing Supabase credentials in environment variables.');
    return res.status(500).json({ error: 'Erro de configuração do servidor.' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: plans, error } = await supabase
    .from('plans')
    .select('id, slug, display_name, description, price_brl, period, features, is_active, created_at')
    .eq('is_active', true)
    .order('price_brl', { ascending: true });

  if (error) {
    console.error('[plans] Supabase error:', error.message);
    return res.status(200).json({ plans: [] }); // Retorna array vazio em vez de 500 para evitar quebra no front
  }

  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
  return res.status(200).json({ plans: plans ?? [] });
}
