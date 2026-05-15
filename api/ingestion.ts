//==========================
// Título : Importação em lote — alunos ou histórico acadêmico (multipart → RPC Supabase)
// POST /api/ingestion?type=students | academic-history
//==========================

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';

export const config = { api: { bodyParser: false } };

function getRawBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function parseBoundary(contentType: string): string | null {
  const match = contentType.match(/boundary=([^\s;]+)/);
  return match ? match[1] : null;
}

// Extrai um único arquivo do multipart (buffer + nome)
function extractFile(body: Buffer, boundary: string): { buffer: Buffer; filename: string } | null {
  const sep = Buffer.from(`--${boundary}`);
  const parts = [];
  let start = 0;

  for (let i = 0; i <= body.length - sep.length; i++) {
    if (body.slice(i, i + sep.length).equals(sep)) {
      if (start > 0) parts.push(body.slice(start, i - 2)); // strip \r\n before boundary
      start = i + sep.length + 2; // skip \r\n after boundary
    }
  }

  for (const part of parts) {
    const headerEnd = part.indexOf('\r\n\r\n');
    if (headerEnd === -1) continue;
    const headers = part.slice(0, headerEnd).toString();
    const fileData = part.slice(headerEnd + 4);
    const nameMatch = headers.match(/name="([^"]+)"/);
    const filenameMatch = headers.match(/filename="([^"]+)"/);
    if (nameMatch?.[1] === 'file' && filenameMatch) {
      return { buffer: fileData, filename: filenameMatch[1] };
    }
  }
  return null;
}

// Remove células vazias/nulas das linhas importadas
function cleanRecords(records: Record<string, unknown>[]): Record<string, unknown>[] {
  return records.map(r =>
    Object.fromEntries(
      Object.entries(r).filter(([, v]) => v !== null && v !== undefined && v !== '')
    )
  );
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

  // --- tipo na query ---
  const type = (req.query.type as string) ?? 'students';
  if (!['students', 'academic-history'].includes(type)) {
    return res.status(400).json({ error: 'type deve ser "students" ou "academic-history"' });
  }

  // --- corpo multipart ---
  const contentType = req.headers['content-type'] ?? '';
  const boundary = parseBoundary(contentType);
  if (!boundary) {
    return res.status(400).json({ error: 'Content-Type multipart/form-data com boundary esperado' });
  }

  const rawBody = await getRawBody(req);
  const file = extractFile(rawBody, boundary);
  if (!file) {
    return res.status(400).json({ error: 'Arquivo não encontrado no body (campo "file")' });
  }

  const { buffer, filename } = file;
  const isExcel = /\.(xlsx|xls)$/i.test(filename);
  const isCsv = /\.csv$/i.test(filename);

  if (!isExcel && !isCsv) {
    return res.status(400).json({ error: 'Formato inválido. Use .csv, .xlsx ou .xls' });
  }

  let records: Record<string, unknown>[];
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null });
    records = cleanRecords(raw);

    // --- CPF só dígitos (alunos) ---
    if (type === 'students' && records.length > 0 && 'cpf' in records[0]) {
      records = records.map(r => ({
        ...r,
        cpf: String(r.cpf ?? '').replace(/\D/g, ''),
      }));
    }
  } catch (err) {
    return res.status(400).json({ error: `Erro ao processar arquivo: ${err instanceof Error ? err.message : err}` });
  }

  if (records.length === 0) {
    return res.status(400).json({ error: 'Arquivo vazio ou sem dados válidos' });
  }

  // --- RPC bulk_upsert_* ---
  const rpcName = type === 'students' ? 'bulk_upsert_students' : 'bulk_upsert_academic_history';
  const rpcPayload = type === 'students'
    ? { students_data: records, p_user_id: user.id }
    : { records_data: records, p_user_id: user.id };

  try {
    const { data, error: rpcError } = await supabase.rpc(rpcName, rpcPayload);
    if (rpcError) throw rpcError;

    return res.status(200).json({
      status: 'success',
      processed_rows: records.length,
      db_response: data,
    });
  } catch (err) {
    // [SEC-PII-001] Safe logging pattern
    const errorMessage = err instanceof Error ? err.message : String(err);
    const sanitizedError = errorMessage.replace(/\b\d{11}\b/g, '***.***.***-**'); // Mask CPFs (11 digits)
    console.error(`[ingestion] RPC ${rpcName} error:`, sanitizedError);
    return res.status(500).json({ error: 'Erro ao importar dados. Tente novamente.' });
  }
}
