import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

// Eixos e Dimensões do SINAES — dados normativos estáticos (Nota Técnica INEP/DAES nº 14/2014).
// Não requerem fetch: são definidos por lei e não mudam sem alteração regulatória.
const AXES = [
  { id: 1, name: "Eixo 1: Planejamento e Avaliação Institucional", description: "Esta dimensão aborda o planejamento estratégico da instituição, seus processos de autoavaliação e a utilização dos resultados para a melhoria contínua." },
  { id: 2, name: "Eixo 2: Desenvolvimento Institucional", description: "Foca na missão da instituição, seu Plano de Desenvolvimento Institucional (PDI) e sua responsabilidade social, incluindo a relação com a comunidade e o desenvolvimento sustentável." },
  { id: 3, name: "Eixo 3: Políticas Acadêmicas", description: "Engloba as políticas e ações relacionadas ao ensino, pesquisa e extensão, bem como a comunicação com a sociedade e o atendimento aos discentes." },
  { id: 4, name: "Eixo 4: Políticas de Gestão", description: "Trata das políticas de pessoal, a organização e gestão da instituição, e sua sustentabilidade financeira." },
  { id: 5, name: "Eixo 5: Infraestrutura Física", description: "Avalia a adequação e a qualidade da infraestrutura física da instituição para o desenvolvimento de suas atividades acadêmicas e administrativas." },
];

const DIMENSIONS = [
  { id: 8, axis_id: 1, name: "Dimensão 8: Planejamento e Avaliação", description: "Análise dos processos de planejamento, autoavaliação e avaliação externa, e como seus resultados são utilizados para o aprimoramento da instituição." },
  { id: 1, axis_id: 2, name: "Dimensão 1: Missão e Plano de Desenvolvimento Institucional (PDI)", description: "Verifica a clareza da missão institucional e a coerência do PDI com os objetivos e a realidade da instituição." },
  { id: 3, axis_id: 2, name: "Dimensão 3: Responsabilidade Social da Instituição", description: "Avalia a contribuição da instituição para o desenvolvimento social, ambiental e cultural da comunidade, por meio de suas ações e projetos." },
  { id: 2, axis_id: 3, name: "Dimensão 2: Políticas para o Ensino, a Pesquisa e a Extensão", description: "Examina as políticas e programas que orientam as atividades de ensino, pesquisa e extensão, e sua efetividade na formação dos estudantes." },
  { id: 4, axis_id: 3, name: "Dimensão 4: Comunicação com a Sociedade", description: "Analisa a forma como a instituição se comunica com a sociedade, divulgando suas ações, resultados e contribuições." },
  { id: 9, axis_id: 3, name: "Dimensão 9: Política de Atendimento aos Discentes", description: "Avalia as políticas e programas de apoio aos estudantes, incluindo bolsas, assistência estudantil, orientação psicopedagógica, entre outros." },
  { id: 5, axis_id: 4, name: "Dimensão 5: Políticas de Pessoal", description: "Verifica as políticas de gestão de pessoas, incluindo a qualificação, desenvolvimento e valorização dos docentes e técnico-administrativos." },
  { id: 6, axis_id: 4, name: "Dimensão 6: Organização e Gestão da Instituição", description: "Analisa a estrutura organizacional, os processos de gestão, a participação da comunidade acadêmica e a transparência da gestão." },
  { id: 10, axis_id: 4, name: "Dimensão 10: Sustentabilidade Financeira", description: "Avalia a capacidade da instituição de manter sua sustentabilidade financeira, garantindo a qualidade de suas atividades e investimentos." },
  { id: 7, axis_id: 5, name: "Dimensão 7: Infraestrutura Física", description: "Examina a adequação e a qualidade das instalações físicas, incluindo salas de aula, laboratórios, bibliotecas, áreas de convivência, entre outros." },
];

const CPAAxesAndDimensions = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Eixos e Dimensões do SINAES</h2>
      <p className="text-muted-foreground">
        Visualize os eixos e dimensões que norteiam a avaliação institucional, conforme o SINAES.
      </p>

      <Accordion type="multiple" className="w-full">
        {AXES.map((axis) => (
          <AccordionItem key={axis.id} value={`axis-${axis.id}`}>
            <AccordionTrigger className="text-lg font-semibold">
              {axis.name}
            </AccordionTrigger>
            <AccordionContent className="pl-4">
              {axis.description && <p className="mb-2 text-muted-foreground">{axis.description}</p>}
              <div className="space-y-2">
                {DIMENSIONS
                  .filter((dim) => dim.axis_id === axis.id)
                  .map((dimension) => (
                    <div key={dimension.id} className="p-3 border rounded-md bg-secondary/30">
                      <h4 className="font-medium">{dimension.name}</h4>
                      {dimension.description && <p className="text-sm text-muted-foreground">{dimension.description}</p>}
                    </div>
                  ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default CPAAxesAndDimensions;
