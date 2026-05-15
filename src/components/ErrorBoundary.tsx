import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import * as Sentry from "@sentry/react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

//==========================
// Título : Error boundary — erros de render filhos → UI de recuperação
//==========================

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // produção: integrar Sentry / similar
    console.error('[ErrorBoundary]', error, info.componentStack);
    Sentry.captureException(error, { extra: { componentStack: info.componentStack } });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 p-8 text-center">
          <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <div>
            <h2 className="text-xl font-bold mb-2">Algo deu errado</h2>
            <p className="text-sm text-muted-foreground max-w-sm">
              Ocorreu um erro inesperado. Tente recarregar a página. Se o problema persistir, entre em contato com o suporte.
            </p>
            {import.meta.env.DEV && this.state.error && (
              <pre className="mt-4 text-left text-xs bg-muted p-3 rounded-md max-w-lg overflow-auto text-destructive">
                {this.state.error.message}
              </pre>
            )}
          </div>
          <Button onClick={() => window.location.reload()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar novamente
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
