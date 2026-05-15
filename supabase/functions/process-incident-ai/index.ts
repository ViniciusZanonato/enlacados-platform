import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend";
import { corsHeaders } from "../_shared/cors.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { record } = await req.json(); // Supabase webhook sends the 'record' object

    if (!record) {
      return new Response(JSON.stringify({ error: "No record found" }), { status: 400 });
    }

    const {
      id,
      title,
      description,
      impact_level,
      reported_at,
      metadata = {}
    } = record;

    // Build Extensive Detailed Email
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px;">
        <div style="background: #f8fafc; border-left: 4px solid #ef4444; padding: 20px; border-radius: 8px;">
          <h1 style="color: #1e293b; margin-top: 0;">🚨 Alerta de Incidente Crítico: ${title}</h1>
          <p><strong>ID do Sistema:</strong> <code>${id}</code></p>
          <p><strong>Nível de Impacto:</strong> <span style="background: #fee2e2; color: #991b1b; padding: 2px 8px; border-radius: 4px; font-weight: bold; text-transform: uppercase;">${impact_level}</span></p>
          <p><strong>Horário do Evento:</strong> ${new Date(reported_at).toLocaleString('pt-BR')}</p>
        </div>

        <h2 style="border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; margin-top: 30px;">📄 Descrição do Ocorrido</h2>
        <div style="background: #fff; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; white-space: pre-wrap;">
          ${description}
        </div>

        <h2 style="border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; margin-top: 30px;">🛠️ Contexto Técnico (Metadata)</h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <tr style="background: #f1f5f9;">
            <th style="text-align: left; padding: 10px; border: 1px solid #e2e8f0;">Campo</th>
            <th style="text-align: left; padding: 10px; border: 1px solid #e2e8f0;">Valor</th>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>URL de Origem</strong></td>
            <td style="padding: 10px; border: 1px solid #e2e8f0;"><code>${metadata.url || 'Não informado'}</code></td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>User Agent</strong></td>
            <td style="padding: 10px; border: 1px solid #e2e8f0;">${metadata.userAgent || 'Não informado'}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>Stack Trace / Detalhes</strong></td>
            <td style="padding: 10px; border: 1px solid #e2e8f0;"><pre style="font-size: 11px;">${metadata.stack || 'Nenhum log técnico anexado'}</pre></td>
          </tr>
        </table>

        <div style="margin-top: 40px; padding: 20px; background: #1e293b; color: #fff; border-radius: 8px;">
          <h3 style="margin-top: 0; color: #38bdf8;">🤖 Instrução para Processamento por IA</h3>
          <p style="font-size: 14px;">Este incidente deve ser analisado prioritariamente. Verifique os logs do Supabase para o record_id fornecido. Se houver falha de código, identifique o arquivo via stack trace acima.</p>
          <hr style="border: none; border-top: 1px solid #334155; margin: 15px 0;" />
          <p style="font-size: 12px; opacity: 0.7;">Enlaçados Security Orchestrator — Automated Report</p>
        </div>
      </body>
      </html>
    `;

    const { error } = await resend.emails.send({
      from: "Enlaçados Security <alerts@enlacados.dev>",
      to: ["enlacados.jornadaeducacional@gmail.com"], // Conta central enlaçados
      subject: `[INCIDENTE ${impact_level.toUpperCase()}] ${title}`,
      html: emailHtml,
    });

    if (error) throw error;

    return new Response(JSON.stringify({ message: "Relatório enviado com sucesso" }), { 
      status: 200, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });

  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});
