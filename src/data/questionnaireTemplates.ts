import { QuestionData } from "@/components/QuestionEditorModal";

interface TemplateQuestion extends Partial<QuestionData> {
  answer_options?: { option_text: string }[];
}

interface QuestionnaireTemplate {
  id: string;
  title: string;
  description: string;
  target_audience: string;
  questions: TemplateQuestion[];
}

export const questionnaireTemplates: QuestionnaireTemplate[] = [
  {
    id: "template-1",
    title: "Avaliação Institucional Geral",
    description: "Questionário padrão para avaliação institucional abrangente de todos os cursos e departamentos.",
    target_audience: "Alunos, Professores, Funcionários",
    questions: [
              { question_type: "textarea", question_text: "Qual sua percepção geral sobre a qualidade do ensino na instituição?", is_required: true },      { question_type: "radio", question_text: "Como você avalia a infraestrutura (salas, laboratórios, biblioteca)?", is_required: true, answer_options: [{ option_text: "Excelente" }, { option_text: "Bom" }, { option_text: "Regular" }, { option_text: "Ruim" }] },
      { question_type: "number", question_text: "Em uma escala de 1 a 10, qual a probabilidade de você recomendar esta instituição?", is_required: true },
    ],
  },
  {
    id: "template-2",
    title: "Avaliação de Curso Específico",
    description: "Template para avaliação detalhada de um curso específico, focando em didática, infraestrutura e corpo docente.",
    target_audience: "Alunos do Curso X",
    questions: [
              { question_type: "text", question_text: "Qual o ponto mais positivo do seu curso?", is_required: true },      { question_type: "text", question_text: "Qual o ponto que mais precisa de melhoria no seu curso?", is_required: true },
      { question_type: "checkbox", question_text: "Quais recursos didáticos você mais utiliza?", answer_options: [{ option_text: "Livros" }, { option_text: "Artigos científicos" }, { option_text: "Plataformas online" }, { option_text: "Outros" }] },
    ],
  },
  {
    id: "template-3",
    title: "Pesquisa de Clima Organizacional",
    description: "Questionário para medir a satisfação e o ambiente de trabalho entre os funcionários da instituição.",
    target_audience: "Funcionários Administrativos e Docentes",
    questions: [
      { question_type: "radio", question_text: "Você se sente valorizado(a) em seu ambiente de trabalho?", is_required: true, answer_options: [{ option_text: "Sempre" }, { option_text: "Na maioria das vezes" }, { option_text: "Às vezes" }, { option_text: "Raramente" }, { option_text: "Nunca" }] },
      { question_type: "textarea", question_text: "Quais sugestões você tem para melhorar o clima organizacional?", is_required: false },
    ],
  },
];
