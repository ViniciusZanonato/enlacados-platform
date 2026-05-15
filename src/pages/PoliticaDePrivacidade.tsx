import { Shield } from "lucide-react";

const PoliticaDePrivacidade = () => {
  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Shield className="w-16 h-16 mx-auto text-primary mb-4" />
            <h1 className="text-4xl font-bold mb-2 gradient-text">
              Política de Privacidade
            </h1>
            <p className="text-muted-foreground">
              Última atualização: 29 de outubro de 2025
            </p>
          </div>

          <div className="space-y-8 text-lg text-muted-foreground leading-relaxed">
            <p>
              A Enlaçados (“nós”, “nosso”) opera o site{" "}
              <a href="https://enlacados.com.br" className="text-primary">
                enlacados.com.br
              </a>{" "}
              (o “Serviço”). Esta página informa sobre nossas políticas
              relacionadas à coleta, uso e divulgação de informações pessoais
              quando você usa nosso Serviço.
            </p>

            <h2 className="text-2xl font-bold text-foreground">
              1. Coleta e Uso de Informações
            </h2>
            <p>
              Coletamos vários tipos de informações para diversos fins, a fim de
              fornecer e melhorar nosso Serviço para você.
            </p>

            <h3 className="text-xl font-semibold text-foreground">
              Tipos de Dados Coletados
            </h3>
            <ul className="list-disc list-inside space-y-2">
              <li>
                <strong>Informações Pessoais:</strong> Ao usar nosso Serviço,
                podemos solicitar que você nos forneça algumas informações
                pessoais que podem ser usadas para contatá-lo ou identificá-lo
                (“Dados Pessoais”). Essas informações podem incluir, mas não se
                limitam a: e-mail, nome completo, número de telefone, endereço.
              </li>
              <li>
                <strong>Dados de Uso:</strong> Podemos coletar informações sobre
                como o Serviço é acessado e usado (“Dados de Uso”). Estes Dados
                de Uso podem incluir informações como o endereço de Protocolo de
                Internet do seu computador (por exemplo, endereço IP), tipo de
                navegador, versão do navegador, as páginas do nosso Serviço que
                você visita, a hora e a data da sua visita, o tempo gasto
                nessas páginas e outros dados de diagnóstico.
              </li>
            </ul>

            <h2 className="text-2xl font-bold text-foreground">
              2. Uso de Dados
            </h2>
            <p>
              A Enlaçados usa os dados coletados para diversos fins:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>Para fornecer e manter nosso Serviço;</li>
              <li>Para notificá-lo sobre alterações em nosso Serviço;</li>
              <li>
                Para permitir que você participe de recursos interativos do
                nosso Serviço quando você optar por fazê-lo;
              </li>
              <li>Para fornecer suporte ao cliente;</li>
              <li>
                Para coletar análises ou informações valiosas para que possamos
                melhorar nosso Serviço;
              </li>
              <li>Para monitorar o uso do nosso Serviço;</li>
              <li>Para detectar, prevenir e resolver problemas técnicos.</li>
            </ul>

            <h2 className="text-2xl font-bold text-foreground">
              3. Segurança dos Dados
            </h2>
            <p>
              A segurança de seus dados é importante para nós, mas lembre-se de
              que nenhum método de transmissão pela Internet ou método de
              armazenamento eletrônico é 100% seguro. Embora nos esforcemos
              para usar meios comercialmente aceitáveis para proteger seus
              Dados Pessoais, não podemos garantir sua segurança absoluta.
            </p>

            <h2 className="text-2xl font-bold text-foreground">
              4. Seus Direitos de Proteção de Dados sob a LGPD
            </h2>
            <p>
              Se você for um residente do Brasil, você tem certos direitos de
              proteção de dados. A Enlaçados visa tomar medidas razoáveis para
              permitir que você corrija, altere, exclua ou limite o uso de seus
              Dados Pessoais.
            </p>

            <h2 className="text-2xl font-bold text-foreground">
              5. Contato
            </h2>
            <p>
              Se você tiver alguma dúvida sobre esta Política de Privacidade,
              entre em contato conosco:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>
                Por e-mail:{" "}
                <a href="mailto:privacidade@enlacados.com.br" className="text-primary">
                  privacidade@enlacados.com.br
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PoliticaDePrivacidade;