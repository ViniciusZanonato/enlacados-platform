import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      `404 Error: User attempted to access non-existent route: ${location.pathname}`
    );
  }, [location.pathname]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-gradient-subtle p-4">
      <div className="text-center space-y-4">
        <h1 className="text-8xl font-bold gradient-text">404</h1>
        <h2 className="text-2xl font-semibold text-foreground">Página Não Encontrada</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Oops! Parece que o caminho que você seguiu está incorreto ou a página foi movida. Que tal voltar para um lugar seguro?
        </p>
        <Button asChild variant="hero" size="lg">
          <Link to="/">Voltar para o Início</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;