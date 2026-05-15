import { useState, useEffect } from 'react';
import { supabase } from '@/api/supabase/client';
import KPICard from './KPICard';
import { Eye, Star, ThumbsUp, GraduationCap } from 'lucide-react';

interface KPIDashboardProps {
  profileId: string;
}

interface KpiData {
  average_rating: number;
  positive_feedback_ratio: number;
  total_students?: number;
}

const KPIDashboard: React.FC<KPIDashboardProps> = ({ profileId }) => {
  const [kpiData, setKpiData] = useState<KpiData | null>(null);
  const [viewsData, setViewsData] = useState<number | null>(null);
  const [studentCount, setStudentCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!profileId) return;
      setLoading(true);

      const [kpiResult, viewsResult, studentsResult] = await Promise.all([
        supabase.rpc('get_institution_kpis', { p_profile_id: profileId }),
        supabase
          .from('profile_views')
          .select('*', { count: 'exact', head: true })
          .eq('profile_id', profileId),
        supabase
          .from('institution_students')
          .select('*', { count: 'exact', head: true })
          .eq('institution_profile_id', profileId)
          .eq('status', 'active'),
      ]);

      if (kpiResult.error) console.error('Error fetching KPIs:', kpiResult.error);
      if (kpiResult.data && kpiResult.data.length > 0) setKpiData(kpiResult.data[0]);

      if (viewsResult.error) console.error('Error fetching views:', viewsResult.error);
      setViewsData(viewsResult.count ?? 0);

      if (studentsResult.error) console.error('Error fetching students:', studentsResult.error);
      setStudentCount(studentsResult.count ?? 0);

      setLoading(false);
    };

    fetchData();
  }, [profileId]);

  return (
    <div>
      <span className="label-pill text-primary/70 block mb-2">Métricas em tempo real</span>
      <h2 className="text-3xl mb-5">Painel de Desempenho</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Visualizações do Perfil"
          value={loading ? '—' : (viewsData ?? 0).toLocaleString('pt-BR')}
          description="Total de acessos ao perfil"
          icon={<Eye className="h-4 w-4" />}
          isLoading={loading}
        />
        <KPICard
          title="Avaliação Média"
          value={loading ? '—' : `${Number(kpiData?.average_rating || 0).toFixed(1)} / 5`}
          description="Média de notas das avaliações recebidas"
          icon={<Star className="h-4 w-4" />}
          isLoading={loading}
        />
        <KPICard
          title="Feedback Positivo"
          value={loading ? '—' : `${Number(kpiData?.positive_feedback_ratio || 0).toFixed(0)}%`}
          description="Avaliações com 4 ou 5 estrelas"
          icon={<ThumbsUp className="h-4 w-4" />}
          isLoading={loading}
        />
        <KPICard
          title="Alunos Ativos"
          value={loading ? '—' : (studentCount ?? 0).toLocaleString('pt-BR')}
          description="Estudantes vinculados ativos"
          icon={<GraduationCap className="h-4 w-4" />}
          isLoading={loading}
        />
      </div>
    </div>
  );
};

export default KPIDashboard;
