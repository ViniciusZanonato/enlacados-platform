import { Shield, Clock, Gavel } from "lucide-react";

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
              Última atualização: {new Date().toLocaleDateString('pt-BR')} (Em conformidade com a LGPD)
            </p>
          </div>

          <div className="space-y-12 text-lg text-muted-foreground leading-relaxed">
            <section className="space-y-4">
                <p>
                A Enlaçados (“nós”, “nosso”) opera o site{" "}
                <a href="https://enlacados.com.br" className="text-primary font-semibold">
                    enlacados.com.br
                </a>{" "}
                (o “Serviço”). Esta página informa sobre nossas políticas
                relacionadas à coleta, uso e divulgação de informações pessoais
                quando você usa nosso Serviço, em total conformidade com a Lei nº 13.709/2018.
                </p>
            </section>

            <section className="space-y-6">
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <Gavel className="text-primary h-6 w-6" />
                    1. Base Legal para o Tratamento de Dados
                </h2>
                <p>
                    Nos termos do Artigo 7º da LGPD, o tratamento de seus dados é fundamentado nos seguintes requisitos legais:
                </p>
                
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-muted rounded-lg overflow-hidden text-sm lg:text-base">
                        <thead className="bg-muted">
                            <tr>
                                <th className="p-4 text-left border border-muted-foreground/20 font-bold">Dado Pessoal</th>
                                <th className="p-4 text-left border border-muted-foreground/20 font-bold">Finalidade</th>
                                <th className="p-4 text-left border border-muted-foreground/20 font-bold">Base Legal (Art. 7º)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="p-4 border border-muted-foreground/10">Nome Completo, E-mail</td>
                                <td className="p-4 border border-muted-foreground/10">Identificação e Comunicação</td>
                                <td className="p-4 border border-muted-foreground/10">Inciso V (Execução de Contrato)</td>
                            </tr>
                            <tr>
                                <td className="p-4 border border-muted-foreground/10">CPF / RG</td>
                                <td className="p-4 border border-muted-foreground/10">Seguridade Jurídica e Fiscal</td>
                                <td className="p-4 border border-muted-foreground/10">Inciso II (Cumprimento de Obrigação Legal)</td>
                            </tr>
                            <tr>
                                <td className="p-4 border border-muted-foreground/10">Dados Financeiros (Transações)</td>
                                <td className="p-4 border border-muted-foreground/10">Gestão de Pagamentos e Recebimento</td>
                                <td className="p-4 border border-muted-foreground/10">Inciso V (Execução de Contrato)</td>
                            </tr>
                            <tr>
                                <td className="p-4 border border-muted-foreground/10">Dados de Menores</td>
                                <td className="p-4 border border-muted-foreground/10">Histórico Acadêmico e Familiar</td>
                                <td className="p-4 border border-muted-foreground/10">Art. 14 (Melhor Interesse do Menor)</td>
                            </tr>
                            <tr>
                                <td className="p-4 border border-muted-foreground/10">Logs de Acesso e Auditoria</td>
                                <td className="p-4 border border-muted-foreground/10">Prevenção a Fraude e Auditoria</td>
                                <td className="p-4 border border-muted-foreground/10">Inciso IX (Legítimo Interesse)</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="space-y-6">
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <Clock className="text-primary h-6 w-6" />
                    2. Retenção e Descarte (Regra dos 5 Anos)
                </h2>
                <p>
                    Mantemos seus dados pessoais apenas pelo tempo necessário para cumprir as finalidades descritas nesta política. 
                    Estabelecemos um **Prazo de Retenção de 5 Anos de inatividade**. 
                </p>
                <div className="bg-primary/5 p-6 rounded-lg border border-primary/20">
                    <p className="text-base leading-relaxed">
                        Contas sem login ou movimentação financeira/acadêmica por mais de **5 anos** são automaticamente **anonimizadas**. 
                        Neste processo, dados identificáveis (como nome e CPF) são removidos ou alterados para que não possam ser vinculados a um indivíduo, mantendo-se apenas o registro das transações para fins estatísticos institucionais, conforme permite a LGPD.
                    </p>
                </div>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground">
                    3. Segurança dos Dados e Auditoria
                </h2>
                <p>
                    Para garantir a rastreabilidade e a proteção contra acessos não autorizados, a Enlaçados implementa auditoria contínua de ações (Audit Logs). Todas as modificações em dados sensíveis ou financeiros são registradas com a identificação do operador, data e hora, servindo como meio de prova para defesa jurídica.
                </p>
            </section>

            <section className="space-y-4 pt-12 border-t">
              <h2 className="text-2xl font-bold text-foreground">
                4. Contato e DPO
              </h2>
              <p>
                Para exercer seus direitos de exclusão, acesso ou portabilidade, entre em contato com nosso Encarregado de Proteção de Dados (DPO):
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>
                  Por e-mail:{" "}
                  <a href="mailto:privacidade@enlacados.com.br" className="text-primary font-bold hover:underline">
                    privacidade@enlacados.com.br
                  </a>
                </li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PoliticaDePrivacidade;