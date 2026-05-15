//==========================
// Título : Moderação de texto — lista padrão + termos custom (máx. 50), JWT obrigatório
//==========================

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const DEFAULT_BLOCKED = [
  'idiota', 'burro', 'imbecil', 'otario', 'merda', 'porra', 'caralho',
  'bosta', 'racista', 'preconceito', 'odio', 'matar', 'morrer',
  'verme', 'lixo', 'inutil', 'stupid', 'idiot',
];

const MAX_CUSTOM_WORDS = 50;

function escapeRegex(word: string) {
  return word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

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

  const { text, custom_blocked_words } = req.body as {
    text?: string;
    custom_blocked_words?: string[];
  };

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: '"text" é obrigatório' });
  }

  // --- limite de termos custom ---
  const customWords = Array.isArray(custom_blocked_words)
    ? custom_blocked_words.slice(0, MAX_CUSTOM_WORDS)
    : [];

  const textLower = text.toLowerCase();
  const allWords = [...DEFAULT_BLOCKED, ...customWords];
  const flaggedWords: string[] = [];

  for (const word of allWords) {
    const pattern = new RegExp(`\\b${escapeRegex(word.toLowerCase())}\\b`);
    if (pattern.test(textLower)) {
      flaggedWords.push(word);
    }
  }

  const unique = [...new Set(flaggedWords)];

  if (unique.length > 0) {
    return res.status(200).json({
      flagged: true,
      reason: `Conteúdo detectado: ${unique.join(', ')}`,
      flagged_words: unique,
    });
  }

  return res.status(200).json({ flagged: false, reason: null, flagged_words: [] });
}
