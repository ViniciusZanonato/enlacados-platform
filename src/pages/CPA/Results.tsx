import { useParams, useNavigate } from 'react-router-dom';
import { useRef } from 'react';
import ResponseDashboard from '@/components/CPA/ResponseDashboard';
import { Button } from '@/components/ui/button';

const ResultsPage = () => {
  const { questionnaireId } = useParams<{ questionnaireId: string }>();
  const navigate = useNavigate();
  const dashboardRef = useRef<HTMLDivElement>(null);

  if (!questionnaireId) {
    return <div className="container mx-auto py-10 text-center text-red-500">ID do Questionário não encontrado.</div>;
  }

  return (
    <div ref={dashboardRef} className="container mx-auto py-10">
      <div className="flex gap-4 mb-6">
        <Button variant="outline" onClick={() => navigate('/portal/cpa')}>Voltar para o Painel CPA</Button>
        <Button onClick={() => navigate(`/questionnaire/builder/${questionnaireId}`)}>Editar Questionário</Button>
      </div>
      <ResponseDashboard questionnaireId={questionnaireId} dashboardRef={dashboardRef} />
    </div>
  );
};

export default ResultsPage;
