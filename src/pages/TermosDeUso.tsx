import { FileText } from "lucide-react";

const TermosDeUso = () => {
  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <FileText className="w-16 h-16 mx-auto text-primary mb-4" />
            <h1 className="text-4xl font-bold mb-2 gradient-text">
              Termos de Uso
            </h1>
            <p className="text-muted-foreground">
              Última atualização: 29 de outubro de 2025
            </p>
          </div>

          <div className="space-y-8 text-lg text-muted-foreground leading-relaxed">
            <p>
              Estes Termos de Uso (“Termos”) regem seu acesso e uso do site{" "}
              <a href="https://enlacados.com.br" className="text-primary">
                enlacados.com.br
              </a>{" "}
              (o “Serviço”), operado pela Enlaçados (“nós”, “nosso”).
            </p>

            <h2 className="text-2xl font-bold text-foreground">
              1. Aceitação dos Termos
            </h2>
            <p>
              Ao acessar ou usar o Serviço, você concorda em ficar vinculado por
              estes Termos. Se você não concordar com qualquer parte dos termos,
              não poderá acessar o Serviço.
            </p>

            <h2 className="text-2xl font-bold text-foreground">
              2. Contas
            </h2>
            <p>
              Ao criar uma conta conosco, você deve nos fornecer informações
              precisas, completas e atuais em todos os momentos. A falha em
              fazer isso constitui uma violação dos Termos, o que pode resultar
              na rescisão imediata de sua conta em nosso Serviço.
            </p>

            <h2 className="text-2xl font-bold text-foreground">
              3. Propriedade Intelectual
            </h2>
            <p>
              O Serviço e seu conteúdo original, recursos e funcionalidades são
              e permanecerão propriedade exclusiva da Enlaçados e de seus
              licenciadores.
            </p>

            <h2 className="text-2xl font-bold text-foreground">
              4. Links para Outros Sites
            </h2>
            <p>
              Nosso Serviço pode conter links para sites ou serviços de
              terceiros que não são de propriedade ou controlados pela
              Enlaçados. Não temos controle e não assumimos responsabilidade
              pelo conteúdo, políticas de privacidade ou práticas de quaisquer
              sites ou serviços de terceiros.
            </p>

            <h2 className="text-2xl font-bold text-foreground">
              5. Rescisão
            </h2>
            <p>
              Podemos rescindir ou suspender sua conta imediatamente, sem aviso
              prévio ou responsabilidade, por qualquer motivo, incluindo, sem
              limitação, se você violar os Termos.
            </p>

            <h2 className="text-2xl font-bold text-foreground">
              6. Alterações
            </h2>
            <p>
              Reservamo-nos o direito, a nosso exclusivo critério, de modificar
              ou substituir estes Termos a qualquer momento. Se uma revisão for
              material, tentaremos fornecer um aviso com pelo menos 30 dias de
              antecedência antes que quaisquer novos termos entrem em vigor.
            </p>

            <h2 className="text-2xl font-bold text-foreground">
              7. Contato
            </h2>
            <p>
              Se você tiver alguma dúvida sobre estes Termos, entre em contato
              conosco:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>
                Por e-mail:{" "}
                <a href="mailto:contato@enlacados.com.br" className="text-primary">
                  contato@enlacados.com.br
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermosDeUso;