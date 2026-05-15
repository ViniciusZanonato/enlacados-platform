import { useState, useRef } from 'react';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Pen, Plus, Trash2, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { AIInsights } from './AIInsights';
import { ReportExportButtons } from './ReportExportButtons';
import { Loader } from '@/components/ui/loader';


import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { ChartBuilderModal } from './ChartBuilderModal';
import CustomChartRenderer from './CustomChartRenderer';
import { SaveTemplateModal } from './SaveTemplateModal';
import { ApplyTemplateModal } from './ApplyTemplateModal';
import { Responsive, WidthProvider } from 'react-grid-layout';
import type { Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

import * as cpaApi from '@/features/cpa/api';
import { ChartConfig, Template, Question } from '@/features/cpa/types';
import { DashboardSummaryCards } from './DashboardSummaryCards';
import { RatedQuestions } from './RatedQuestions';
import { RecentResponses } from './RecentResponses';

//==========================
// Título : Painel de resultados CPA — gráficos, templates, exportação
//==========================

// crypto.randomUUID em contexto não seguro (HTTP)
const generateUUID = () => {
  if (crypto && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

interface ResponseDashboardProps {
  questionnaireId: string;
  dashboardRef: React.RefObject<HTMLDivElement>;
}

const ResponsiveGridLayout = WidthProvider(Responsive);

const ResponseDashboard = ({ questionnaireId, dashboardRef }: ResponseDashboardProps) => {
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaveTemplateModalOpen, setIsSaveTemplateModalOpen] = useState(false);
  const [isApplyTemplateModalOpen, setIsApplyTemplateModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingChart, setEditingChart] = useState<ChartConfig | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  // --- dados (queries) ---
  const { data: responseCount, isLoading: countLoading, error: countError } = useQuery({
    queryKey: ['responseCount', questionnaireId],
    queryFn: () => cpaApi.getResponseCount(questionnaireId),
    enabled: !!questionnaireId,
  });

  const { data: npsData, isLoading: npsLoading, error: npsError } = useQuery({
    queryKey: ['npsScore', questionnaireId],
    queryFn: () => cpaApi.getNpsScore(questionnaireId),
    enabled: !!questionnaireId,
  });

  const { data: latestResponses, isLoading: latestLoading, error: latestError } = useQuery({
    queryKey: ['latestResponses', questionnaireId],
    queryFn: () => cpaApi.getLatestResponses(questionnaireId, 3),
    enabled: !!questionnaireId,
  });

  const { data: avgTimeData, isLoading: avgTimeLoading, error: avgTimeError } = useQuery({
    queryKey: ['avgCompletionTime', questionnaireId],
    queryFn: () => cpaApi.getAvgCompletionTime(questionnaireId),
    enabled: !!questionnaireId,
  });

  const { data: ratedQuestionsData, isLoading: ratedQuestionsLoading, error: ratedQuestionsError } = useQuery({
    queryKey: ['highestLowestRatedQuestions', questionnaireId],
    queryFn: () => cpaApi.getHighestLowestRatedQuestions(questionnaireId),
    enabled: !!questionnaireId,
  });

  const { data: questions, isLoading: isLoadingQuestions } = useQuery({
    queryKey: ['questionsForBuilder', questionnaireId],
    queryFn: () => cpaApi.getQuestionsForBuilder(questionnaireId),
    enabled: !!questionnaireId,
  });

  const { data: customCharts, isLoading: isLoadingCharts } = useQuery({
    queryKey: ['dashboardCharts', questionnaireId],
    queryFn: () => cpaApi.getDashboardCharts(questionnaireId),
    enabled: !!questionnaireId,
  });

  const { data: templates, isLoading: isLoadingTemplates } = useQuery({
    queryKey: ['dashboardTemplates'],
    queryFn: cpaApi.getDashboardTemplates,
  });

  const { data: questionnaireTitle, isLoading: isLoadingQuestionnaireTitle } = useQuery({
    queryKey: ['questionnaireTitle', questionnaireId],
    queryFn: () => cpaApi.getQuestionnaireTitle(questionnaireId),
    enabled: !!questionnaireId,
  });

  // --- mutações ---
  const upsertChartMutation = useMutation({
    mutationFn: (chartConfig: ChartConfig) => cpaApi.upsertDashboardChart(chartConfig, questionnaireId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboardCharts', questionnaireId] });
      toast.success('Gráfico salvo com sucesso!');
    },
    onError: (e: Error) => toast.error(`Erro ao salvar o gráfico: ${e.message}`)
  });

  const deleteChartMutation = useMutation({
    mutationFn: (chartId: string) => cpaApi.deleteDashboardChart(chartId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboardCharts', questionnaireId] });
      toast.success('Gráfico excluído com sucesso!');
    },
    onError: (e: Error) => toast.error(`Erro ao excluir o gráfico: ${e.message}`)
  });

  const saveTemplateMutation = useMutation({
    mutationFn: (data: { name: string, charts: ChartConfig[] }) => cpaApi.saveDashboardTemplate(data.name, data.charts),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboardTemplates'] });
      toast.success('Template salvo com sucesso!');
    },
    onError: (e: Error) => toast.error(`Erro ao salvar o template: ${e.message}`)
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (templateId: string) => cpaApi.deleteDashboardTemplate(templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboardTemplates'] });
      toast.success('Template excluído com sucesso!');
    },
    onError: (e: Error) => toast.error(`Erro ao excluir o template: ${e.message}`)
  });

  // --- handlers ---
  const onLayoutChange = (layout: Layout[]) => {
    if (isEditing) {
      customCharts?.forEach(chart => {
        const layoutItem = layout.find(item => item.i === chart.id);
        if (layoutItem && (chart.x !== layoutItem.x || chart.y !== layoutItem.y || chart.w !== layoutItem.w || chart.h !== layoutItem.h)) {
          upsertChartMutation.mutate({ ...chart, ...layoutItem });
        }
      });
    }
  };

  const handleAddOrUpdateChart = (chartConfig: ChartConfig) => {
    const newChart = { ...chartConfig, id: editingChart?.id || generateUUID() };
    upsertChartMutation.mutate(newChart);
    setEditingChart(null);
  };

  const handleApplyTemplate = (mappedCharts: ChartConfig[]) => {
    mappedCharts.forEach(chart => {
      upsertChartMutation.mutate({ ...chart, id: generateUUID() });
    });
    toast.success(`Template aplicado com sucesso!`);
  };

  const { data: pyAnalytics, isLoading: pyLoading } = useQuery({
    queryKey: ['cpaAnalytics', questionnaireId],
    queryFn: () => cpaApi.getCPAAnalytics(questionnaireId),
    enabled: !!questionnaireId,
  });

  const refreshAnalyticsMutation = useMutation({
    mutationFn: () => cpaApi.refreshAllStaleMetrics(),
    onSuccess: () => {
      toast.success('Processamento solicitado! As métricas serão atualizadas no banco em instantes.');
      setTimeout(() => queryClient.invalidateQueries({ queryKey: ['cpaAnalytics'] }), 3000);
    },
    onError: (e: Error) => toast.error(`Erro ao processar métricas: ${e.message}`)
  });

  // --- render ---
  const isEssentialLoading = isLoadingQuestionnaireTitle || isLoadingCharts || isLoadingTemplates;
  
  if (isEssentialLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-4 text-lg">Carregando painel...</span>
      </div>
    );
  }

  // Se o questionário não tem respostas, mostramos a mensagem amigável, mas permitimos editar o painel (adicionar gráficos vazios etc)
  if (responseCount === 0 && !isEditing) {
    return (
      <div className="space-y-4 pt-10">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Resultados do Questionário</h1>
            <p className="text-muted-foreground">{questionnaireTitle}</p>
          </div>
          <Button variant="outline" onClick={() => setIsEditing(true)}>
            <Pen className="mr-2 h-4 w-4" />
            Editar Painel
          </Button>
        </div>
        <div className="text-center text-muted-foreground py-20 border-2 border-dashed rounded-xl">
          Nenhum resultado encontrado para este questionário.
        </div>
      </div>
    );
  }

  if (responseCount === 0) {
    return <div className="text-center text-muted-foreground py-20">Nenhum resultado encontrado para este questionário.</div>;
  }

  return (
    <div className="space-y-8" ref={dashboardRef}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Resultados do Questionário</h1>
          <p className="text-muted-foreground">{questionnaireTitle}</p>
        </div>
        <div className="pdf-export-ignore flex gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>Cancelar</Button>
              <Button onClick={() => setIsEditing(false)}>Concluir Edição</Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                onClick={() => refreshAnalyticsMutation.mutate()}
                disabled={refreshAnalyticsMutation.isPending}
              >
                {refreshAnalyticsMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lightbulb className="mr-2 h-4 w-4" />}
                IA
              </Button>
              <ReportExportButtons
                questionnaireId={questionnaireId}
                questionnaireTitle={questionnaireTitle || ""}
              />
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Pen className="mr-2 h-4 w-4" />
                Painel
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">Templates</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {templates?.map(template => (
                    <div key={template.id} className="flex items-center justify-between pr-2">
                      <DropdownMenuItem onSelect={() => {
                        const selected = templates.find(t => t.id === template.id);
                        if (selected) {
                          setSelectedTemplate(selected);
                          setIsApplyTemplateModalOpen(true);
                        }
                      }} className="flex-grow cursor-pointer">
                        {template.name}
                      </DropdownMenuItem>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); deleteTemplateMutation.mutate(template.id); }}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => setIsSaveTemplateModalOpen(true)} className="cursor-pointer">
                    <Plus className="mr-2 h-4 w-4" />
                    Salvar template atual...
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>

      <DashboardSummaryCards
        responseCount={responseCount}
        avgTimeData={avgTimeData}
        npsData={pyAnalytics ? {
          nps_score: pyAnalytics.nps_score,
          total_responses: pyAnalytics.total_responses_analyzed,
          nps_question_text: 'Score calculado a partir das respostas (analytics)'
        } : npsData}
      />

      {/* AI Insights Section */}
      <AIInsights insights={pyAnalytics?.insights} />

      <RatedQuestions ratedQuestionsData={ratedQuestionsData} />

      <RecentResponses latestResponses={latestResponses} />


      <hr className="my-8" />

      {/* Custom Charts Section */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Painel de Gráficos Personalizados</h2>
        <Button onClick={() => { setEditingChart(null); setIsModalOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Gráfico
        </Button>
      </div>

      <ResponsiveGridLayout
        className="layout"
        layouts={{ lg: customCharts?.map(c => ({ i: c.id, x: c.x, y: c.y, w: c.w, h: c.h })) || [] }}
        onLayoutChange={onLayoutChange}
        isDraggable={isEditing}
        isResizable={isEditing}
        draggableCancel=".no-drag"
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={100}
      >
        {customCharts?.map(chart => (
          <div key={chart.id} className="bg-card rounded-lg shadow-md overflow-hidden">
            <CustomChartRenderer
              chartConfig={chart}
              questionnaireId={questionnaireId}
              onEdit={() => { setEditingChart(chart); setIsModalOpen(true); }}
              onDelete={() => deleteChartMutation.mutate(chart.id)}
              isEditing={isEditing}
            />
          </div>
        ))}
      </ResponsiveGridLayout>

      {/* Modals */}
      <ChartBuilderModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingChart(null); }}
        onSave={handleAddOrUpdateChart}
        questionnaireId={questionnaireId}
        initialConfig={editingChart}
      />
      <SaveTemplateModal
        isOpen={isSaveTemplateModalOpen}
        onClose={() => setIsSaveTemplateModalOpen(false)}
        onSave={(name) => saveTemplateMutation.mutate({ name, charts: customCharts || [] })}
      />
      <ApplyTemplateModal
        isOpen={isApplyTemplateModalOpen}
        onClose={() => setIsApplyTemplateModalOpen(false)}
        onApply={handleApplyTemplate}
        template={selectedTemplate}
        questions={questions || []}
      />

    </div>
  );
};

export default ResponseDashboard;