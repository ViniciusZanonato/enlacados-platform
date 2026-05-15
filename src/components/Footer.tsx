import { Link } from "react-router-dom";
import { Facebook, Instagram, Linkedin, Mail, Phone } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-secondary border-t border-border mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <img src="/logo.png" alt="Enlaçados Logo" className="w-10 h-10" />
              <span className="text-xl font-bold gradient-text">Enlaçados</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Onde cada conexão faz a educação acontecer.
            </p>
            <div className="flex space-x-3">
              <a href="https://www.instagram.com/enlacados.oficial/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-smooth">
                <Instagram size={20} />
              </a>
            </div>
          </div>

          {/* Links Rápidos */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Links Rápidos</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-smooth">
                  Início
                </Link>
              </li>
              <li>
                <Link to="/jornada" className="text-sm text-muted-foreground hover:text-primary transition-smooth">
                  Jornada Educacional
                </Link>
              </li>
              <li>
                <Link to="/planos" className="text-sm text-muted-foreground hover:text-primary transition-smooth">
                  Planos
                </Link>
              </li>
              <li>
                <Link to="/sobre" className="text-sm text-muted-foreground hover:text-primary transition-smooth">
                  Sobre Nós
                </Link>
              </li>
            </ul>
          </div>

          {/* Institucional */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Institucional</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/politica-de-privacidade" className="text-sm text-muted-foreground hover:text-primary transition-smooth">
                  Política de Privacidade
                </Link>
              </li>
              <li>
                <Link to="/termos-de-uso" className="text-sm text-muted-foreground hover:text-primary transition-smooth">
                  Termos de Uso
                </Link>
              </li>
              <li>
                <Link to="/lgpd" className="text-sm text-muted-foreground hover:text-primary transition-smooth">
                  LGPD
                </Link>
              </li>
              <li>
                <Link to="/contato" className="text-sm text-muted-foreground hover:text-primary transition-smooth">
                  Suporte
                </Link>
              </li>
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Contato</h3>
            <ul className="space-y-3">
              <li className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Mail size={16} />
                <span>enlacados.jornadaeducacional@gmail.com</span>
              </li>
              <li className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Phone size={16} />
                <span>(55) 99640-5707</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>© 2025 Enlaçados. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
