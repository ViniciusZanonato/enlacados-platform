import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LatestResponse, Answer } from '@/features/cpa/types';

interface RecentResponsesProps {
  latestResponses: LatestResponse[] | null | undefined;
}

export const RecentResponses = ({ latestResponses }: RecentResponsesProps) => {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Últimas Respostas Recebidas</h2>
      {latestResponses && latestResponses.length > 0 ? (
        latestResponses.map((response: LatestResponse) => (
          <Card key={response.id}>
            <CardHeader>
              <CardTitle className="text-base font-medium">Resposta de {new Date(response.submitted_at).toLocaleString('pt-BR')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {response.answers?.map((answer: Answer, index: number) => (
                  <li key={index} className="text-sm">
                    <span className="font-semibold">{answer.question}:</span>
                    <span className="text-muted-foreground ml-2">{answer.answer || 'Não respondido'}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))
      ) : (
        <p className="text-muted-foreground">Nenhuma resposta recente encontrada.</p>
      )}
    </div>
  );
};
