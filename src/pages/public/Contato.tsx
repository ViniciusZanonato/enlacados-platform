import { Mail, Phone, MapPin, MessageCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useState } from "react";
import { supabase } from "@/api/supabase/client";

const Contato = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase.from("messages").insert(formData);

      if (error) throw error;

      toast.success(
        "Mensagem enviada com sucesso! Entraremos em contato em breve."
      );
      setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (error: Error) {
      console.error("Error sending message:", error);
      toast.error("Erro ao enviar mensagem");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const contactInfo = [
    {
      icon: Mail,
      title: "Email",
      content: "enlacados.jornadaeducacional@gmail.com",
      link: "mailto:enlacados.jornadaeducacional@gmail.com",
    },
    {
      icon: Phone,
      title: "Telefone",
      content: "(55) 99640-5707",
      link: "tel:+5555996405707",
    },
    {
      icon: MessageCircle,
      title: "WhatsApp",
      content: "(55) 99640-5707",
      link: "https://wa.me/5555996405707",
    },
    {
      icon: MapPin,
      title: "Endereço",
      content: "Estrada Recanto Maestro, nº 338, Distrito Recanto Maestro, Restinga Sêca-RS, Cep: 97200-000, Brasil",
      link: null,
    },
  ];

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16" style={{ animation: 'fadeInUp 0.6s cubic-bezier(0.16,1,0.3,1) both' }}>
          <span className="label-pill text-primary/70 inline-block mb-3">Fale Conosco</span>
          <h1 className="text-6xl md:text-7xl font-black leading-none mb-4">
            Entre em <span className="gradient-text">Contato</span>
          </h1>
          <p className="text-xl text-muted-foreground font-thin max-w-2xl mx-auto">
            Estamos prontos para ajudar você. Escolha a melhor forma de falar
            conosco.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 max-w-6xl mx-auto">
          {/* Contact Form */}
          <div className="relative bg-card rounded-2xl p-8 border border-border/50 overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl bg-primary/40" />
            <h2 className="text-2xl font-black mb-6 ml-3">
              Envie sua Mensagem
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Seu nome"
                  required
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="seu@email.com"
                  required
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="(11) 99999-9999"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="subject">Assunto</Label>
                <Input
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="Como podemos ajudar?"
                  required
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="message">Mensagem</Label>
                <Textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Conte-nos mais sobre o que você precisa..."
                  required
                  rows={5}
                  className="mt-2"
                />
              </div>

              <Button
                type="submit"
                variant="hero"
                size="lg"
                className="w-full"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar Mensagem"
                )}
              </Button>
            </form>
          </div>

          {/* Contact Info */}
          <div
            className="space-y-6 animate-fade-in-up"
            style={{ animationDelay: "0.1s" }}
          >
            <div className="bg-card rounded-3xl p-8 shadow-elegant border border-border">
              <h2 className="text-3xl font-bold mb-6 text-foreground">
                Informações de Contato
              </h2>
              <div className="space-y-6">
                {contactInfo.map((info, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="w-12 h-12 rounded-xl gradient-hero flex items-center justify-center flex-shrink-0">
                      <info.icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1 text-foreground">
                        {info.title}
                      </h3>
                      {info.link ? (
                        <a
                          href={info.link}
                          className="text-muted-foreground hover:text-primary transition-smooth"
                        >
                          {info.content}
                        </a>
                      ) : (
                        <p className="text-muted-foreground">{info.content}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQ Quick Links */}
            <div className="bg-secondary rounded-3xl p-8 border border-border">
              <h3 className="text-2xl font-bold mb-4 text-foreground">
                Perguntas Frequentes
              </h3>
              <p className="text-muted-foreground mb-6">
                Antes de entrar em contato, veja se sua dúvida já foi respondida
                em nossa base de conhecimento.
              </p>
              <Button variant="outline" className="w-full">
                Acessar FAQ
              </Button>
            </div>


          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center bg-card rounded-3xl p-12 shadow-elegant border border-border animate-fade-in">
          <h3 className="text-3xl font-bold mb-4 gradient-text">
            Precisa de ajuda urgente?
          </h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Nosso time de suporte está disponível via WhatsApp para atendimento
            rápido durante o horário comercial.
          </p>
          <Button variant="hero" size="lg" asChild>
            <a
              href="https://wa.me/5511999999999"
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="mr-2" />
              Falar no WhatsApp
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Contato;