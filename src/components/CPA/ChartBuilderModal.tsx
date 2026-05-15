import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ScatterChart, Scatter, ZAxis } from 'recharts';
import WordCloudComponent from '@/components/WordCloudComponent';
import { TextResponsesTable } from './TextResponsesTable';
import { DynamicResponsesTable } from './DynamicResponsesTable';

const PALETTES: { [key: string]: string[] } = {
  default: ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF1919'],
  blueGreen: ['#003f5c', '#2f4b7c', '#665191', '#a05195', '#d4b9da', '#f95d6a'],
  warm: ['#FFC300', '#FF5733', '#C70039', '#900C3F', '#581845', '#FF8C00'],
  cool: ['#1E90FF', '#87CEEB', '#ADD8E6', '#B0E0E6', '#E0FFFF', '#6495ED'],
};

interface Question {
  id: string;
  question_text: string;
  question_type: string;
}

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
  x: number;
  y: number;
  w: number;
  h: number;
}

interface CpaAxis {
  id: string;
  name: string;
}

interface ChartBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (chartConfig: ChartConfig) => void;
  questionnaireId: string;
  initialConfig?: ChartConfig | null;
}

interface PieChartEntry {
  answer: string;
  value: number;
}

export const ChartBuilderModal = ({ isOpen, onClose, onSave, questionnaireId, initialConfig }: ChartBuilderModalProps) => {
  const [title, setTitle] = useState('');
  const [chartType, setChartType] = useState('bar');
  const [dimension, setDimension] = useState<string | null>(null);
  const [dimensionY, setDimensionY] = useState<string | null>(null);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [selectedPalette, setSelectedPalette] = useState<string>('default');
  const [metric, setMetric] = useState<string>('count');

  const COLORS = PALETTES[selectedPalette];

  useEffect(() => {
    if (isOpen) {
      if (initialConfig) {
        setTitle(initialConfig.title || '');
        setChartType(initialConfig.type || 'bar');
        setDimension(initialConfig.dimension || null);
        setDimensionY(initialConfig.dimensionY || null);
        setSelectedColumns(initialConfig.columns || []);
        setSelectedPalette(initialConfig.palette || 'default');
        setMetric(initialConfig.metric || 'count');
      } else {
        // Reset state for new chart
        setTitle('');
        setChartType('bar');
        setDimension(null);
        setDimensionY(null);
        setSelectedColumns([]);
        setSelectedPalette('default');
        setMetric('count');
      }
    }
  }, [initialConfig, isOpen]);

  const { data: questions, isLoading: isLoadingQuestions } = useQuery<Question[]>({
    queryKey: ['questionsForBuilder', questionnaireId],
    queryFn: async () => {
      if (!questionnaireId) return [];
      const { data, error } = await supabase
        .from('cpa_questions')
        .select('id, question_text, question_type')
        .eq('questionnaire_id', questionnaireId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!questionnaireId && isOpen, // Only fetch when modal is open
  });

  const { data: cpaAxes, isLoading: isLoadingAxes } = useQuery<CpaAxis[]>({
    queryKey: ['cpaAxes'],
    queryFn: async () => {
      const { data, error } = await supabase.from('cpa_axes').select('*');
      if (error) throw error;
      return data || [];
    },
    enabled: isOpen && chartType === 'radar',
  });

  const { data: chartData, isLoading: isLoadingChartData, error: chartDataError } = useQuery({
    queryKey: ['chartPreviewData', questionnaireId, dimension, chartType],
    queryFn: async () => {
      if (!questionnaireId) return null;

      if (chartType === 'table') {
        if (selectedColumns.length === 0) return [];
        const { data, error } = await supabase.rpc('get_pivoted_responses', { p_questionnaire_id: questionnaireId, p_question_ids: selectedColumns });
        if (error) throw error;
        return data;
      }

      if (!dimension) return null;

      if (chartType === 'scatter') {
        if (!dimensionY) return null;
        const { data, error } = await supabase.rpc('get_scatter_chart_data', { p_questionnaire_id: questionnaireId, p_dimension_x: dimension, p_dimension_y: dimensionY });
        if (error) throw error;
        return data;
      }

      if (chartType === 'radar') {
        const { data, error } = await supabase.rpc('get_radar_chart_data', { p_questionnaire_id: questionnaireId, p_axis_id: dimension });
        if (error) throw error;
        return data;
      }

      const selectedQuestion = questions?.find(q => q.id === dimension);

      if (dimension === 'total_time') {
        if (chartType === 'bar' || chartType === 'pie' || chartType === 'kpi') {
          const { data, error } = await supabase.rpc('get_chart_data', { p_questionnaire_id: questionnaireId, p_dimension: dimension, p_chart_type: chartType });
          if (error) throw error;
          return data;
        }
        throw new Error(`Gráfico do tipo '${chartType}' não é compatível com a dimensão 'Tempo de Resposta'.`);
      }

      if (selectedQuestion) {
        const { question_type } = selectedQuestion;
        if (chartType === 'wordcloud' && (question_type === 'text' || question_type === 'textarea')) {
          const { data, error } = await supabase.rpc('get_word_cloud_data', { p_question_id: dimension });
          if (error) throw error;
          return data;
        } 
        if (chartType === 'table' && (selectedQuestion.question_type === 'text' || selectedQuestion.question_type === 'textarea')) {
          const { data, error } = await supabase
            .from('cpa_answer_values')
            .select('answer:answer_text')
            .eq('question_id', dimension);
          if (error) throw error;
          return data;
        } 

        if ((chartType === 'bar' || chartType === 'pie' || chartType === 'table' || chartType === 'kpi') && ['radio', 'select', 'checkbox', 'likert', 'text', 'textarea', 'number', 'email', 'url'].includes(question_type)) {
          const { data, error } = await supabase.rpc('get_chart_data', { p_questionnaire_id: questionnaireId, p_dimension: dimension, p_chart_type: chartType });
          if (error) throw error;
          return data;
        }
        throw new Error(`O tipo de gráfico selecionado não é compatível com o tipo desta pergunta.`);
      }

      return null;
    },
    enabled: !!questionnaireId && !!dimension && isOpen,
    retry: false,
  });

  const handleSave = () => {
    if (chartType === 'table') {
      if (!title || selectedColumns.length === 0) {
        toast.error("O título e pelo menos uma coluna são obrigatórios.");
        return;
      }
    } else if (!title || !chartType || !dimension) {
      toast.error("Por favor, preencha todos os campos.");
      return;
    }

    const selectedQuestion = questions?.find(q => q.id === dimension);

    const chartConfig: ChartConfig = {
      id: initialConfig?.id || new Date().getTime().toString(), // Use existing ID if editing
      title,
      type: chartType,
      dimension: dimension,
      dimensionY: chartType === 'scatter' ? dimensionY : null,
      question_type: selectedQuestion?.question_type,
      columns: chartType === 'table' ? selectedColumns : null,
      metric: metric,
      palette: selectedPalette,
      x: initialConfig?.x ?? 0,
      y: initialConfig?.y ?? Infinity,
      w: initialConfig?.w ?? 4,
      h: initialConfig?.h ?? 8, // Default height for new charts
    };
    
    onSave(chartConfig);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Construtor de Gráficos</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {isLoadingQuestions ? (
            <div className="flex justify-center items-center h-full"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <Label htmlFor="chart-title">Título do Gráfico/Tabela</Label>
                  <Input id="chart-title" placeholder="Ex: Satisfação por Curso" className="mt-2" value={title} onChange={e => setTitle(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="chart-type">Tipo de Gráfico</Label>
                  <Select value={chartType} onValueChange={setChartType}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bar">Gráfico de Barras</SelectItem>
                      <SelectItem value="pie">Gráfico de Pizza</SelectItem>
                      <SelectItem value="radar">Gráfico de Radar</SelectItem>
                      <SelectItem value="scatter">Gráfico de Dispersão</SelectItem>
                      <SelectItem value="table">Tabela</SelectItem>
                      <SelectItem value="wordcloud">Nuvem de Palavras</SelectItem>
                      <SelectItem value="kpi">Número (KPI)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {chartType === 'table' ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium">Colunas da Tabela</h3>
                    <p className="text-sm text-muted-foreground">Selecione as perguntas que você quer exibir como colunas.</p>
                    <div className="mt-4 space-y-2 max-h-60 overflow-y-auto border p-4 rounded-md">
                      {questions?.map(q => (
                        <div key={q.id} className="flex items-center space-x-2">
                          <Checkbox 
                            id={q.id}
                            checked={selectedColumns.includes(q.id)}
                            onCheckedChange={(checked) => {
                              setSelectedColumns(prev => 
                                checked ? [...prev, q.id] : prev.filter(id => id !== q.id)
                              );
                            }}
                          />
                          <Label htmlFor={q.id} className="font-normal">{q.question_text}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="chart-dimension">{chartType === 'scatter' ? 'Dimensão (Eixo X)' : chartType === 'radar' ? 'Eixo SINAES' : 'Dimensão (Eixo X)'}</Label>
                    <Select value={dimension || ''} onValueChange={setDimension}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder={chartType === 'radar' ? 'Selecione o eixo' : 'Selecione a pergunta ou métrica'} />
                      </SelectTrigger>
                      <SelectContent>
                        {chartType === 'radar' ? (
                          cpaAxes?.map(axis => (
                            <SelectItem key={axis.id} value={axis.id}>{axis.name}</SelectItem>
                          ))
                        ) : (
                          <>
                            <SelectItem value="total_time">Tempo de Resposta</SelectItem>
                            {questions && questions.length > 0 ? (
                              questions.map(q => (
                                <SelectItem key={q.id} value={q.id}>{q.question_text}</SelectItem>
                              ))
                            ) : (
                              <p className="p-4 text-sm text-muted-foreground">Nenhuma pergunta encontrada.</p>
                            )}
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  {chartType === 'scatter' && (
                    <div>
                      <Label htmlFor="chart-dimension-y">Dimensão (Eixo Y)</Label>
                      <Select value={dimensionY || ''} onValueChange={setDimensionY}>
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Selecione a pergunta ou métrica" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="total_time">Tempo de Resposta</SelectItem>
                          {questions && questions.length > 0 ? (
                            questions.map(q => (
                              <SelectItem key={q.id} value={q.id}>{q.question_text}</SelectItem>
                            ))
                          ) : (
                            <p className="p-4 text-sm text-muted-foreground">Nenhuma pergunta encontrada.</p>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div>
                    <Label htmlFor="chart-metric">Métrica (Eixo Y)</Label>
                    <Select defaultValue="count" onValueChange={setMetric}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Selecione a métrica" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="count">Contagem de Respostas</SelectItem>
                        <SelectItem value="percentage">Porcentagem de Respostas</SelectItem>
                        <SelectItem value="avg">Média (para notas)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div className="pt-6">
                <h3 className="text-lg font-medium">Cores</h3>
                <div className="mt-2 flex gap-2">
                  {Object.keys(PALETTES).map(paletteName => (
                    <Button 
                      key={paletteName} 
                      variant={selectedPalette === paletteName ? 'secondary' : 'outline'} 
                      onClick={() => setSelectedPalette(paletteName)}
                      className="flex gap-1 p-1 h-auto"
                    >
                      {PALETTES[paletteName].map((color, index) => (
                        <div key={index} className="w-4 h-4 rounded-full" style={{ backgroundColor: color }}></div>
                      ))}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="pt-6">
                <h3 className="text-lg font-medium">Pré-visualização</h3>
                <div className="p-4 mt-2 border-2 border-dashed rounded-lg min-h-[350px] flex items-center justify-center">
                  {isLoadingChartData ? (
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  ) : chartDataError ? (
                    <p className="text-destructive">{chartDataError.message}</p>
                  ) : chartData ? (
                                            <div className="w-full h-[300px]"> {/* Fixed height div for the component to fill */}
                                              {chartType === 'bar' ? (
                                                <BarChart data={chartData}>
                                                  <CartesianGrid strokeDasharray="3 3" />
                                                  <XAxis dataKey="answer" />
                                                  <YAxis />
                                                  <Tooltip />
                                                  <Bar dataKey="value" fill={COLORS[0]} name="Contagem" />
                                                </BarChart>
                                              ) : chartType === 'pie' ? (
                                                <PieChart>
                                                  <Pie data={chartData} dataKey="value" nameKey="answer" cx="50%" cy="50%" outerRadius={100} label>
                                                    {chartData.map((entry: PieChartEntry, index: number) => (
                                                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                  </Pie>
                                                  <Tooltip />
                                                  <Legend />
                                                </PieChart>
                                              ) : chartType === 'radar' ? (
                                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                                                  <PolarGrid />
                                                  <PolarAngleAxis dataKey="dimension" />
                                                  <PolarRadiusAxis />
                                                  <Radar name="Pontuação Média" dataKey="avg_score" stroke={COLORS[0]} fill={COLORS[0]} fillOpacity={0.6} />
                                                  <Tooltip />
                                                </RadarChart>
                                              ) : chartType === 'scatter' ? (
                                                <ScatterChart width={400} height={400}>
                                                  <CartesianGrid />
                                                  <XAxis type="number" dataKey="x" name="Eixo X" />
                                                  <YAxis type="number" dataKey="y" name="Eixo Y" />
                                                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                                                  <Scatter name="Respostas" data={chartData} fill={COLORS[0]} />
                                                </ScatterChart>
                                              ) : chartType === 'table' ? (
                                                <DynamicResponsesTable data={chartData || []} />
                                              ) : chartType === 'kpi' ? (
                                                <div className="flex flex-col items-center justify-center h-full w-full">
                                                  <div className="text-6xl font-bold" style={{ color: COLORS[0] }}>
                                                    {chartData.value.toLocaleString('pt-BR')}
                                                  </div>
                                                </div>
                                              ) : (
                                                <WordCloudComponent
                                                  data={chartData}
                                                  font="sans-serif"
                                                  fontSize={(word) => Math.sqrt(word.value) * 5}
                                                  padding={2}
                                                  rotate={() => (Math.random() - 0.5) * 30}
                                                  width={500} // Pass a default width
                                                  height={300} // Pass a default height
                                                />
                                              )}
                                            </div>
                  ) : (
                    <p className="text-muted-foreground">Selecione uma dimensão para ver a pré-visualização.</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar Gráfico</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ChartBuilderModal;
