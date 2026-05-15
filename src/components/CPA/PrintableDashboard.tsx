import React from 'react';
import CustomChartRenderer from './CustomChartRenderer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Clock, TrendingUp, TrendingDown, Heart } from 'lucide-react';

const formatInterval = (interval: string) => {
  if (!interval) return 'N/A';
  const parts = interval.split(':');
  if (parts.length !== 3) return 'N/A';
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  const seconds = Math.round(parseFloat(parts[2]));

  let result = '';
  if (hours > 0) result += `${hours}h `;
  if (minutes > 0) result += `${minutes}m `;
  if (seconds > 0 || (hours === 0 && minutes === 0)) result += `${seconds}s`;
  
  return result.trim();
};

const PrintableDashboard = React.forwardRef(({ dashboardData }, ref) => {
  const {
    questionnaireTitle,
    responseCount,
    avgTimeData,
    npsData,
    ratedQuestionsData,
    latestResponses,
    customCharts,
    questionnaireId,
  } = dashboardData;

  return (
    <div ref={ref} style={{ position: 'absolute', left: '-9999px', top: 0, backgroundColor: 'white', padding: '20px', width: '1200px' }}>
      <h1 style={{ fontSize: '2em', fontWeight: 'bold', marginBottom: '20px' }}>{questionnaireTitle}</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
        <Card style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
          <CardHeader style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px' }}>
            <CardTitle style={{ fontSize: '0.875em', fontWeight: '500' }}>Total de Respostas</CardTitle>
            <Users style={{ height: '1em', width: '1em', color: '#64748b' }} />
          </CardHeader>
          <CardContent>
            <div style={{ fontSize: '1.5em', fontWeight: 'bold' }}>{responseCount ?? 0}</div>
            <p style={{ fontSize: '0.75em', color: '#64748b' }}>participantes concluíram o questionário</p>
          </CardContent>
        </Card>
        <Card style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
          <CardHeader style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px' }}>
            <CardTitle style={{ fontSize: '0.875em', fontWeight: '500' }}>Tempo Médio de Resposta</CardTitle>
            <Clock style={{ height: '1em', width: '1em', color: '#64748b' }} />
          </CardHeader>
          <CardContent>
            <div style={{ fontSize: '1.5em', fontWeight: 'bold' }}>
              {avgTimeData ? formatInterval(avgTimeData.avg_time) : 'N/A'}
            </div>
            <p style={{ fontSize: '0.75em', color: '#64748b' }}>tempo médio para concluir</p>
          </CardContent>
        </Card>
        {npsData && npsData.total_responses > 0 && (
          <Card style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
            <CardHeader style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px' }}>
              <CardTitle style={{ fontSize: '0.875em', fontWeight: '500' }}>Net Promoter Score (NPS)</CardTitle>
              <Heart style={{ height: '1em', width: '1em', color: '#ef4444' }} />
            </CardHeader>
            <CardContent>
              <div style={{ fontSize: '1.5em', fontWeight: 'bold' }}>{npsData.nps_score}</div>
              <p style={{ fontSize: '0.75em', color: '#64748b' }}>
                Baseado em {npsData.total_responses} respostas
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '20px' }}>
        {ratedQuestionsData?.find(q => q.type === 'highest') && (
          <Card style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
            <CardHeader style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px' }}>
              <CardTitle style={{ fontSize: '0.875em', fontWeight: '500' }}>Questão com Maior Média</CardTitle>
              <TrendingUp style={{ height: '1em', width: '1em', color: '#22c55e' }} />
            </CardHeader>
            <CardContent>
              <div style={{ fontSize: '1.5em', fontWeight: 'bold' }}>
                {ratedQuestionsData.find(q => q.type === 'highest')?.avg_score.toFixed(2)}
              </div>
              <p style={{ fontSize: '0.75em', color: '#64748b' }}>
                {ratedQuestionsData.find(q => q.type === 'highest')?.question_text}
              </p>
            </CardContent>
          </Card>
        )}
        {ratedQuestionsData?.find(q => q.type === 'lowest') && (
          <Card style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
            <CardHeader style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px' }}>
              <CardTitle style={{ fontSize: '0.875em', fontWeight: '500' }}>Questão com Menor Média</CardTitle>
              <TrendingDown style={{ height: '1em', width: '1em', color: '#ef4444' }} />
            </CardHeader>
            <CardContent>
              <div style={{ fontSize: '1.5em', fontWeight: 'bold' }}>
                {ratedQuestionsData.find(q => q.type === 'lowest')?.avg_score.toFixed(2)}
              </div>
              <p style={{ fontSize: '0.75em', color: '#64748b' }}>
                {ratedQuestionsData.find(q => q.type === 'lowest')?.question_text}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.5em', fontWeight: 'bold', marginBottom: '10px' }}>Últimas Respostas Recebidas</h2>
        {latestResponses && latestResponses.length > 0 ? (
          latestResponses.map((response, index) => (
            <Card key={response.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', marginBottom: '10px' }}>
              <CardHeader style={{ paddingBottom: '8px' }}>
                <CardTitle style={{ fontSize: '1em', fontWeight: '500' }}>Resposta de {new Date(response.submitted_at).toLocaleString('pt-BR')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {response.answers?.map((answer, ansIndex) => (
                    <li key={ansIndex} style={{ fontSize: '0.875em', marginBottom: '4px' }}>
                      <span style={{ fontWeight: '600' }}>{answer.question}:</span>
                      <span style={{ color: '#64748b', marginLeft: '8px' }}>{answer.answer || 'Não respondido'}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))
        ) : (
          <p style={{ color: '#64748b' }}>Nenhuma resposta recente encontrada.</p>
        )}
      </div>

      <hr style={{ margin: '32px 0', borderTop: '1px solid #e2e8f0' }} />

      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.5em', fontWeight: 'bold', marginBottom: '10px' }}>Painel de Gráficos Personalizados</h2>
        {customCharts && customCharts.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            {customCharts.map(chart => (
              <div key={chart.id} style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)', padding: '16px', pageBreakInside: 'avoid' }}>
                <CustomChartRenderer
                  chartConfig={chart}
                  questionnaireId={questionnaireId}
                  isEditing={false}
                />
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#64748b' }}>Nenhum gráfico personalizado encontrado.</p>
        )}
      </div>
    </div>
  );
});

export default PrintableDashboard;
