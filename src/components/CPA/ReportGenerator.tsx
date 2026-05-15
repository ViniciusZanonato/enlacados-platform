import { useState, useEffect } from 'react';
import { supabase } from '@/api/supabase/client';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, Download, BarChart3, CalendarIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { exportQuestionnaireResponsesXlsx } from '@/lib/cpa-export-xlsx';

//==========================
// Título : Aba Relatórios CPA — lista por mandato + export XLSX
//==========================

interface Questionnaire {
  id: string;
  title: string;
  description: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
  target_audience: string;
  created_at: string;
}

const ReportGenerator = () => {
  const { profile, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [commissions, setCommissions] = useState<{ id: string, start_date: string, end_date: string }[]>([]);
  const navigate = useNavigate();

  const statusVariants: { [key: string]: "default" | "secondary" | "destructive" } = {
    draft: "default",
    active: "secondary",
    closed: "destructive",
  };

  useEffect(() => {
    const fetchData = async () => {
      if (authLoading || !profile) return;

      setLoading(true);
      try {
        const { data: instProfileData, error: instProfileError } = await (supabase as any)
          .from('institutional_profiles')
          .select('id')
          .eq('profile_id', profile.id)
          .single();

        if (instProfileError) throw instProfileError;
        if (!instProfileData) {
          setQuestionnaires([]);
          return;
        }

        // --- questionários ---
        const { data: qData, error: qError } = await (supabase as any)
          .from('cpa_questionnaires')
          .select('id, title, description, status, created_at, start_date, end_date, target_audience')
          .eq('institutional_profile_id', instProfileData.id)
          .order('created_at', { ascending: false });

        if (qError) throw qError;
        setQuestionnaires(qData || []);

        // --- mandatos CPA ---
        const { data: cData, error: cError } = await (supabase as any)
          .from('cpa_commissions')
          .select('id, start_date, end_date')
          .eq('institutional_profile_id', instProfileData.id)
          .order('start_date', { ascending: false });

        if (cError) throw cError;
        setCommissions(cData || []);

      } catch (error: any) {
        console.error('Error fetching data:', error.message);
        toast.error('Erro ao carregar dados.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [profile, authLoading]);

  const handleExport = async (questionnaireId: string, questionnaireTitle: string) => {
    setExportingId(questionnaireId);
    try {
      await exportQuestionnaireResponsesXlsx(questionnaireId, questionnaireTitle);
      toast.success("Exportação concluída com sucesso!");
    } catch (error: unknown) {
      if (error instanceof Error && error.message === 'EMPTY') {
        toast.info("Nenhuma resposta para exportar.");
      } else {
        console.error('Error exporting report:', error);
        toast.error('Erro ao exportar relatório.');
      }
    } finally {
      setExportingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  // --- agrupar por mandato ---
  const groupedQuestionnaires = commissions.map(commission => {
    const commissionStart = new Date(commission.start_date);
    const commissionEnd = new Date(commission.end_date);
    // fim do dia no intervalo
    commissionEnd.setHours(23, 59, 59, 999);

    const items = questionnaires.filter(q => {
      // data preferida: start_date, senão created_at
      const dateToCheckStr = q.start_date || q.created_at;
      const dateToCheck = new Date(dateToCheckStr);

      return dateToCheck >= commissionStart && dateToCheck <= commissionEnd;
    });

    return {
      commission,
      items
    };
  }); // We do NOT filter out empty groups anymore, to show full history

  // --- fora de qualquer mandato ---
  const assignedIds = new Set(groupedQuestionnaires.flatMap(g => g.items.map(i => i.id)));
  const unassignedItems = questionnaires.filter(q => !assignedIds.has(q.id));

  return (
    <div className="mt-6 space-y-8">
      {groupedQuestionnaires.map(group => (
        <div key={group.commission.id} className="space-y-4">
          <div className="flex items-center gap-2 border-b pb-2">
            <CalendarIcon className="h-5 w-5 text-muted-foreground" />
            <div className="flex flex-col">
              <h3 className="text-xl font-semibold text-foreground">
                Mandato
              </h3>
              <span className="text-sm text-muted-foreground">
                {format(new Date(group.commission.start_date), "dd/MM/yyyy")} a {format(new Date(group.commission.end_date), "dd/MM/yyyy")}
              </span>
            </div>
          </div>

          {group.items.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {group.items.map(q => (
                <QuestionnaireCard key={q.id} q={q} statusVariants={statusVariants} exportingId={exportingId} handleExport={handleExport} navigate={navigate} />
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground italic pl-2 border-l-2 border-muted">
              Nenhum relatório associado a este mandato.
            </div>
          )}
        </div>
      ))}

      {unassignedItems.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b pb-2">
            <h3 className="text-xl font-semibold text-foreground">Outros Relatórios</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {unassignedItems.map(q => (
              <QuestionnaireCard key={q.id} q={q} statusVariants={statusVariants} exportingId={exportingId} handleExport={handleExport} navigate={navigate} />
            ))}
          </div>
        </div>
      )}

      {questionnaires.length === 0 && (
        <div className="text-center py-10 border-2 border-dashed rounded-lg">
          <h3 className="text-lg font-semibold">Nenhum Relatório Encontrado</h3>
          <p className="text-muted-foreground mt-2">Crie um questionário e colete respostas para gerar relatórios.</p>
        </div>
      )}
    </div>
  );
};

const QuestionnaireCard = ({ q, statusVariants, exportingId, handleExport, navigate }: any) => (
  <Card className="flex flex-col">
    <CardHeader>
      <CardTitle className="flex justify-between items-start">
        <span>{q.title}</span>
        <Badge variant={statusVariants[q.status] || 'default'}>{q.status}</Badge>
      </CardTitle>
      <CardDescription>{q.description || "Sem descrição."}</CardDescription>
    </CardHeader>
    <CardContent className="flex-grow">
      <div className="text-sm text-muted-foreground space-y-2">
        <p><strong>Público-alvo:</strong> {q.target_audience}</p>
        <p><strong>Início:</strong> {q.start_date ? format(new Date(q.start_date), "dd/MM/yyyy") : "N/A"}</p>
        <p><strong>Fim:</strong> {q.end_date ? format(new Date(q.end_date), "dd/MM/yyyy") : "N/A"}</p>
      </div>
    </CardContent>
    <CardFooter className="grid grid-cols-2 gap-2">
      <Button
        onClick={() => handleExport(q.id, q.title)}
        disabled={exportingId === q.id || q.status === 'draft'}
        className="w-full"
      >
        {exportingId === q.id ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Exportando...</>
        ) : (
          <><Download className="mr-2 h-4 w-4" /> Exportar XLSX</>
        )}
      </Button>
      <Button
        onClick={() => navigate(`/portal/cpa/results/${q.id}`)}
        disabled={q.status === 'draft'}
        className="w-full"
        variant="outline"
      >
        <BarChart3 className="mr-2 h-4 w-4" />
        Visualizar
      </Button>
    </CardFooter>
  </Card>
);
export default ReportGenerator;
