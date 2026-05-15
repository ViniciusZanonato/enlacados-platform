import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ThankYou = () => {
  return (
    <div className="bg-muted min-h-screen flex items-center justify-center">
      <Card className="max-w-lg mx-auto text-center p-8">
        <CardHeader>
          <CardTitle className="text-3xl">Obrigado por responder!</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg text-muted-foreground mb-8">Sua participação é muito importante para nós.</p>
          <Button asChild>
            <Link to="/">Voltar para a página inicial</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ThankYou;
