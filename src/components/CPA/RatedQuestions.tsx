import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface RatedQuestion {
    type: string;
    question_text: string;
    avg_score: number;
}

interface RatedQuestionsProps {
  ratedQuestionsData: RatedQuestion[] | null | undefined;
}

export const RatedQuestions = ({ ratedQuestionsData }: RatedQuestionsProps) => {
  const highestRated = ratedQuestionsData?.find(q => q.type === 'highest');
  const lowestRated = ratedQuestionsData?.find(q => q.type === 'lowest');

  if (!highestRated && !lowestRated) {
    return null; // Don't render anything if there's no data
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {highestRated && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Questão com Maior Média</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {highestRated.avg_score.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground truncate" title={highestRated.question_text}>
              {highestRated.question_text}
            </p>
          </CardContent>
        </Card>
      )}
      {lowestRated && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Questão com Menor Média</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {lowestRated.avg_score.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground truncate" title={lowestRated.question_text}>
              {lowestRated.question_text}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
