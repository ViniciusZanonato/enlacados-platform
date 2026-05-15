import { useState } from 'react';
import { supabase } from '@/api/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AuthError } from '@supabase/supabase-js'; // Import AuthError

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error }: { error: AuthError | null } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });

    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
      setSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Enlaçados Logo" className="w-24 h-24 mx-auto mb-4" />
          <h1 className="text-4xl font-bold gradient-text mb-2">Redefinir Senha</h1>
          <p className="text-muted-foreground">
            Enviaremos um link para o seu e-mail para você poder redefinir sua senha.
          </p>
        </div>

        <div className="bg-card rounded-3xl p-8 shadow-elegant border border-border">
          {submitted ? (
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                Se um usuário com este e-mail existir, um link de redefinição de senha foi enviado. Por favor, verifique sua caixa de entrada e pasta de spam.
              </p>
              <Button asChild variant="hero" className="w-full">
                <Link to="/auth">Voltar para o Login</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Seu E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="mt-2"
                />
              </div>

              <Button
                type="submit"
                variant="hero"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Enviar Link de Recuperação'
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
