// ─────────────────────────────────────────────────────────────────
// Sprint 3 — TCK-2026-03-27-S3-005
// Adiciona autenticação JWT à edge function de convite.
// Apenas usuários autenticados com perfil institucional podem
// disparar e-mails de convite.
// Owner: Giovanna (Backend) + Marcos (Segurança)
// ─────────────────────────────────────────────────────────────────

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { Resend } from "resend";
import { corsHeaders } from "../_shared/cors.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

serve(async (req) => {
  // Preflight CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // ── Validação de autenticação ─────────────────────────────────
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: "Token de autenticação obrigatório." }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Valida o JWT via Supabase Auth (não decodifica manualmente)
  const userClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) {
    return new Response(
      JSON.stringify({ error: "Token inválido ou expirado." }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // ── Verificação de autorização: precisa ter perfil institucional ──
  const adminClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const { data: institutionalProfile } = await adminClient
    .from("institutional_profiles")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (!institutionalProfile) {
    console.warn(`[send-invitation-email] Acesso negado: user ${user.id} sem perfil institucional`);
    return new Response(
      JSON.stringify({ error: "Apenas administradores institucionais podem enviar convites." }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // ── Processamento do e-mail ───────────────────────────────────
  let body: { student_email?: string; institution_name?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Corpo da requisição inválido." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { student_email, institution_name } = body;

  if (!student_email || !institution_name) {
    return new Response(
      JSON.stringify({ error: "student_email e institution_name são obrigatórios." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // CRIT-02 FIX: escapar institution_name antes de interpolar no HTML.
  // Um admin malicioso poderia registrar um nome com tags HTML/script
  // e injetar conteúdo no cliente de e-mail do destinatário.
  const escapeHtml = (s: string) =>
    s.replace(/&/g, "&amp;")
     .replace(/</g, "&lt;")
     .replace(/>/g, "&gt;")
     .replace(/"/g, "&quot;")
     .replace(/'/g, "&#39;");

  const safeInstitutionName = escapeHtml(institution_name);

  const SITE_URL = "https://xn--enlacados-r5a.com.br"; // https://enlaçados.com.br

  try {
    const { error } = await resend.emails.send({
      from: "Enlaçados <noreply@enlacados.dev>",
      to: [student_email],
      subject: `Convite para se juntar à ${safeInstitutionName}`,
      html: `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <body style="font-family:sans-serif;background:#f9f9f9;margin:0;padding:0;">
          <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;padding:40px;border:1px solid #e5e7eb;">
            <h1 style="color:#7c3aed;margin-top:0;">Você foi convidado!</h1>
            <p style="color:#374151;">A instituição <strong>${safeInstitutionName}</strong> convidou você
            para se juntar à sua comunidade na plataforma <strong>Enlaçados</strong>.</p>
            <p style="margin:32px 0;">
              <a href="${SITE_URL}"
                 style="background:#7c3aed;color:#fff;padding:14px 28px;border-radius:8px;
                        text-decoration:none;font-weight:600;display:inline-block;">
                Acessar a Plataforma
              </a>
            </p>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0;" />
            <p style="color:#9ca3af;font-size:12px;margin:0;">
              Enlaçados — Onde cada conexão faz a educação acontecer.<br/>
              <a href="${SITE_URL}" style="color:#7c3aed;">${SITE_URL}</a>
            </p>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error("[send-invitation-email] Erro ao enviar via Resend:", error);
      return new Response(
        JSON.stringify({ error: "Falha ao enviar e-mail." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ message: "E-mail enviado com sucesso." }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[send-invitation-email] Erro inesperado:", err);
    return new Response(
      JSON.stringify({ error: "Erro inesperado." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
