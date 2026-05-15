import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabase/client';
import { Loader2, Pen, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ScatterChart, Scatter, Legend } from 'recharts';
import { DynamicResponsesTable } from './DynamicResponsesTable';
import WordCloudChart from './WordCloudChart';
import { getWordCloudPy } from '@/features/cpa/api';

interface ChartConfig {
  id: string;
  title: string;
  type: string;
  dimension: string;
  dimensionY?: string | null;
  question_type?: string;
  columns?: string[];
  metric?: string;
  palette: string;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
}

interface CustomChartRendererProps {
  chartConfig: ChartConfig;
  questionnaireId: string;
  isEditing: boolean;
  onDelete: (chartId: string) => void;
  onEdit: (chart: ChartConfig) => void;
}

const PALETTES: { [key: string]: string[] } = {
  default: ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF1919'],
  blueGreen: ['#003f5c', '#2f4b7c', '#665191', '#a05195', '#d4b9da', '#f95d6a'],
  warm: ['#FFC300', '#FF5733', '#C70039', '#900C3F', '#581845', '#FF8C00'],
  cool: ['#1E90FF', '#87CEEB', '#ADD8E6', '#B0E0E6', '#E0FFFF', '#6495ED'],
};

interface PieChartEntry {
  answer: string;
  value: number;
}

const CustomChartRenderer = ({ chartConfig, questionnaireId, isEditing, onDelete, onEdit }: CustomChartRendererProps) => {
  const { id, title, type, dimension, dimensionY, metric, columns, palette } = chartConfig;

  const { data: chartData, isLoading: isLoadingChartData } = useQuery({
    queryKey: ['customChartData', id, questionnaireId, dimension, dimensionY, type, metric, columns],
    queryFn: async () => {
      if (!questionnaireId) return null;

      switch (type) {
        case 'table': {
          if (!columns || columns.length === 0) return [];
          const { data: tableData, error: tableError } = await supabase.rpc('get_pivoted_responses', { p_questionnaire_id: questionnaireId, p_question_ids: columns });
          if (tableError) throw tableError;
          return tableData;
        }
        case 'scatter': {
          if (!dimension || !dimensionY) return null;
          const { data: scatterData, error: scatterError } = await supabase.rpc('get_scatter_chart_data', { p_questionnaire_id: questionnaireId, p_dimension_x: dimension, p_dimension_y: dimensionY });
          if (scatterError) throw scatterError;
          return scatterData;
        }
        case 'radar': {
          if (!dimension) return null;
          const { data: radarData, error: radarError } = await supabase.rpc('get_radar_chart_data', { p_questionnaire_id: questionnaireId, p_axis_id: parseInt(dimension) });
          if (radarError) throw radarError;
          return radarData;
        }
        case 'word_cloud': {
          if (!dimension) return null;
          // texto bruto → placeholder (nuvem)
          const { data: rawData, error: rawError } = await supabase.rpc('get_pivoted_responses', {
            p_questionnaire_id: questionnaireId,
            p_question_ids: [dimension]
          });
          if (rawError) throw rawError;

          const rows = rawData as any[];
          if (!rows || rows.length === 0) return [];
          const texts = rows.map((row: any) => Object.values(row)[0] as string).filter(Boolean);

          if (texts.length === 0) return [];

          const wcData = await getWordCloudPy(texts);
          return wcData;
        }

        default: { // bar, pie, kpi
          if (!dimension) return null;
          const { data: defaultData, error: defaultError } = await supabase.rpc('get_chart_data', {
            p_questionnaire_id: questionnaireId,
            p_dimension: dimension,
            p_chart_type: type,
            p_metric: metric || 'count'
          });
          if (defaultError) throw defaultError;
          return defaultData;
        }
      }
    },
    enabled: !!questionnaireId,
  });


  const COLORS = PALETTES[palette] || PALETTES.default;

  const renderContent = () => {
    if (isLoadingChartData) {
      return <div className="flex items-center justify-center h-full"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
    }

    const hasData = () => {
      if (!chartData) return false;
      if (type === 'kpi') return chartData.value !== null && chartData.value !== undefined;
      if (Array.isArray(chartData)) return chartData.length > 0;
      // nuvem: objeto {palavra: n} ou array
      if (type === 'word_cloud' && typeof chartData === 'object') return Object.keys(chartData).length > 0;
      return false;
    };

    if (!hasData()) {
      return <div className="flex items-center justify-center h-full"><p className="text-muted-foreground">Sem dados.</p></div>;
    }

    if (type === 'kpi') {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <div className="text-6xl font-bold" style={{ color: COLORS[0] }}>
            {chartData.value.toLocaleString('pt-BR')}
          </div>
        </div>
      );
    }

    if (type === 'table') {
      return <DynamicResponsesTable data={chartData} />;
    }

    return (
      <ResponsiveContainer width="100%" height="100%">
        {type === 'bar' ? (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="answer" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill={COLORS[0]} name="Contagem" />
          </BarChart>
        ) : type === 'pie' ? (
          <PieChart>
            <Pie data={chartData} dataKey="value" nameKey="answer" cx="50%" cy="50%" outerRadius={80} label>
              {chartData.map((entry: PieChartEntry, index: number) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        ) : type === 'radar' ? (
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="dimension" />
            <PolarRadiusAxis />
            <Radar name="Pontuação Média" dataKey="avg_score" stroke={COLORS[0]} fill={COLORS[0]} fillOpacity={0.6} />
            <Tooltip />
          </RadarChart>
        ) : type === 'word_cloud' ? (
          <WordCloudChart
            data={Array.isArray(chartData) ? chartData : Object.entries(chartData).map(([word, count]) => ({ answer: word, value: count as number }))}
            colors={COLORS}
          />
        ) : type === 'scatter' ? (
          <ScatterChart width={400} height={400}>
            <CartesianGrid />
            <XAxis type="number" dataKey="x" name="Eixo X" />
            <YAxis type="number" dataKey="y" name="Eixo Y" />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Scatter name="Respostas" data={chartData} fill={COLORS[0]} />
          </ScatterChart>
        ) : (
          <p className="text-muted-foreground">Tipo de gráfico não suportado.</p>
        )}
      </ResponsiveContainer>
    );
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold truncate">{title}</CardTitle>
        {isEditing && (
          <div className="flex gap-1 no-drag">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onEdit(chartConfig); }}>
              <Pen className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onDelete(id); }}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-grow min-h-[200px]">
        {renderContent()}
      </CardContent>
    </Card>
  );
};

export default CustomChartRenderer;
