import { ShieldCheck, History, ListChecks, ShieldAlert } from "lucide-react";

const LGPD = () => {
  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <ShieldCheck className="w-16 h-16 mx-auto text-primary mb-4" />
            <h1 className="text-4xl font-bold mb-2 gradient-text">
              Conformidade com a LGPD
            </h1>
            <p className="text-muted-foreground">
              Proteção de dados, transparência e segurança jurídica
            </p>
          </div>

          <div className="space-y-12 text-lg text-muted-foreground leading-relaxed">
            <section className="space-y-4">
                <p>
                A Enlaçados opera em conformidade estrita com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), adotando o princípio de *Privacy by Design* em todas as suas funcionalidades.
                </p>
            </section>

            <div className="grid gap-6 md:grid-cols-2">
                <div className="p-6 bg-card rounded-xl border border-muted shadow-sm space-y-3">
                    <History className="text-primary h-8 w-8" />
                    <h3 className="font-bold text-foreground">Rastreabilidade (Logs)</h3>
                    <p className="text-sm">
                        Implementamos auditoria contínua de ações. Cada alteração em dados sensíveis ou financeiros é registrada para garantir a segurança e defesa dos direitos do titular e da instituição.
                    </p>
                </div>
                <div className="p-6 bg-card rounded-xl border border-muted shadow-sm space-y-3">
                    <ShieldAlert className="text-primary h-8 w-8" />
                    <h3 className="font-bold text-foreground">Gestão de Incidentes</h3>
                    <p className="text-sm">
                        Possuímos um portal administrativo de resposta a incidentes, permitindo que nossos gestores documentem e mitiguem vulnerabilidades com agilidade, conforme o Art. 48.
                    </p>
                </div>
            </div>

            <section className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <ListChecks className="text-primary h-6 w-6" />
                    Seus Direitos como Titular
                </h2>
                <p>
                    Para exercer os direitos listados abaixo, você pode entrar em contato com nosso DPO a qualquer momento:
                </p>
                <ul className="list-disc list-inside space-y-2 text-base">
                  <li>Confirmar a existência de tratamento e acessar seus dados;</li>
                  <li>Corrigir dados incompletos ou inexatos;</li>
                  <li>Solicitar a anonimização ou exclusão de dados desnecessários;</li>
                  <li>Portabilidade dos dados a outro fornecedor;</li>
                  <li>Revogar o consentimento e obter informações sobre uso compartilhado.</li>
                </ul>
            </section>

            <div className="p-6 bg-primary/5 rounded-xl border border-primary/20">
                <h2 className="text-xl font-bold text-primary mb-2">Canal Direto com o DPO</h2>
                <p className="text-sm">
                    Para solicitações relativas à LGPD, reporte de vulnerabilidades ou dúvidas sobre o tratamento de seus dados, utilize o canal oficial:
                </p>
                <p className="mt-4">
                    <a href="mailto:dpo@enlacados.com.br" className="text-foreground font-bold hover:text-primary transition-colors">
                        dpo@enlacados.com.br
                    </a>
                </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LGPD;