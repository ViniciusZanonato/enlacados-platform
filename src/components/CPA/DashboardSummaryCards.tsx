import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Clock, Heart } from 'lucide-react';

interface DashboardSummaryCardsProps {
  responseCount: number | null | undefined;
  avgTimeData: { avg_time: string } | null | undefined;
  npsData: {
    nps_score: number;
    total_responses: number;
    nps_question_text: string;
  } | null | undefined;
}

const formatInterval = (interval: string) => {
  if (!interval) return 'N/A';
  const parts = interval.split(':');
  if (parts.length < 2) return 'N/A';
  const hours = parts.length === 3 ? parseInt(parts[0], 10) : 0;
  const minutes = parseInt(parts[parts.length - 2], 10);
  const seconds = Math.round(parseFloat(parts[parts.length - 1]));
  let result = '';
  if (hours > 0) result += `${hours}h `;
  if (minutes > 0) result += `${minutes}m `;
  if (seconds > 0 || (hours === 0 && minutes === 0)) result += `${seconds}s`;
  return result.trim() || '0s';
};

export const DashboardSummaryCards = ({ responseCount, avgTimeData, npsData }: DashboardSummaryCardsProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Respostas</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{responseCount ?? 0}</div>
          <p className="text-xs text-muted-foreground">participantes concluíram o questionário</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tempo Médio de Resposta</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {avgTimeData ? formatInterval(avgTimeData.avg_time) : 'N/A'}
          </div>
          <p className="text-xs text-muted-foreground">tempo médio para concluir</p>
        </CardContent>
      </Card>
      {npsData && npsData.total_responses > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Promoter Score (NPS)</CardTitle>
            <Heart className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{npsData.nps_score}</div>
            <p className="text-xs text-muted-foreground" title={npsData.nps_question_text}>
              Baseado em {npsData.total_responses} respostas
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
