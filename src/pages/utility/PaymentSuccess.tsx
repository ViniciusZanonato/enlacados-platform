import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ROUTES } from "@/lib/constants";

const PaymentSuccess = () => {
    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="max-w-md w-full text-center space-y-8 bg-card p-8 rounded-2xl border shadow-lg">
                <div className="flex justify-center">
                    <CheckCircle2 className="w-20 h-20 text-green-500 animate-bounce" />
                </div>
                
                <div className="space-y-4">
                    <h1 className="text-4xl font-black gradient-text">Muito Obrigado!</h1>
                    <p className="text-muted-foreground font-thin text-lg">
                        Seu pagamento foi processado com sucesso. Bem-vindo(a) ao Enlaçados!
                    </p>
                </div>

                <div className="pt-4">
                    <Button asChild className="w-full font-black" size="lg">
                        <Link to={ROUTES.PORTAL}>Acessar Meu Portal</Link>
                    </Button>
                </div>

                <p className="text-xs text-muted-foreground">
                    Um recibo foi enviado para o seu e-mail cadastrado.
                </p>
            </div>
        </div>
    );
};

export default PaymentSuccess;
