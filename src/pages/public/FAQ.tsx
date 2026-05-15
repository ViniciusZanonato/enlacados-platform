import { HelpCircle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ = () => {
  const faqs = [
    {
      question: "O que é a Enlaçados?",
      answer:
        "A Enlaçados é um ecossistema digital educacional que conecta famílias, instituições de ensino e profissionais de apoio para promover o desenvolvimento integral dos estudantes.",
    },
    {
      question: "Como faço para me cadastrar?",
      answer:
        'Para se cadastrar, clique no botão "Entrar" no canto superior direito da página e, em seguida, escolha a opção "Criar Conta". Preencha o formulário e siga as instruções.',
    },
    {
      question: "A plataforma é gratuita?",
      answer:
        "Oferecemos um plano gratuito para famílias com acesso a recursos essenciais. Para instituições e profissionais, temos planos pagos com funcionalidades avançadas. Consulte nossa página de Planos para mais detalhes.",
    },
    {
      question: "Como encontro uma escola ou profissional?",
      answer:
        'Utilize a barra de busca no topo da página ou acesse a página "Busca" para filtrar por categoria, localização e especialidade.',
    },
    {
      question: "Meus dados estão seguros?",
      answer:
        "Sim, a segurança dos seus dados é nossa prioridade. Utilizamos as melhores práticas de segurança e estamos em conformidade com a LGPD. Para mais informações, consulte nossa Política de Privacidade.",
    },
  ];

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12" style={{ animation: 'fadeInUp 0.6s cubic-bezier(0.16,1,0.3,1) both' }}>
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <HelpCircle className="w-6 h-6 text-primary" />
            </div>
            <span className="label-pill text-primary/70 inline-block mb-3">Central de Ajuda</span>
            <h1 className="text-5xl font-black leading-none mb-3">
              Perguntas Frequentes
            </h1>
            <p className="text-muted-foreground font-thin">
              Tudo o que você precisa saber sobre a Enlaçados.
            </p>
          </div>

          <div className="bg-card rounded-2xl p-8 border border-border/50">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem value={`item-${index}`} key={index}>
                  <AccordionTrigger className="text-base font-black text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-base">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQ;