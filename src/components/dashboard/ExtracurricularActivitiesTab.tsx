
import { useState } from 'react';
import { supabase } from '@/api/supabase/client';
import { toast } from 'sonner';
import { ExtracurricularActivity } from '@/types/student-journey';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

interface ExtracurricularActivitiesTabProps {
  activities: ExtracurricularActivity[];
  studentProfileId: string;
  onActivityAdded: () => void;
}

const ExtracurricularActivitiesTab = ({ activities, studentProfileId, onActivityAdded }: ExtracurricularActivitiesTabProps) => {
  const [newActivity, setNewActivity] = useState({ name: '', description: '', startDate: '', endDate: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddActivity = async () => {
    if (!newActivity.name.trim()) {
      toast.error('O nome da atividade não pode estar vazio.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('extracurricular_activities').insert({
        student_profile_id: studentProfileId,
        activity_name: newActivity.name,
        description: newActivity.description,
        start_date: newActivity.startDate || null,
        end_date: newActivity.endDate || null,
      });

      if (error) throw error;

      toast.success('Atividade adicionada com sucesso!');
      setNewActivity({ name: '', description: '', startDate: '', endDate: '' });
      onActivityAdded();
    } catch (error: any) {
      console.error('Error adding activity:', error.message);
      toast.error('Erro ao adicionar atividade.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 mt-4">
      <div className="space-y-4 p-4 border rounded-lg">
        <h3 className="text-lg font-semibold">Adicionar Nova Atividade</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            placeholder="Nome da Atividade"
            value={newActivity.name}
            onChange={(e) => setNewActivity({ ...newActivity, name: e.target.value })}
          />
          <Textarea
            placeholder="Descrição (opcional)"
            value={newActivity.description}
            onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
            rows={1}
          />
          <Input
            type="date"
            placeholder="Data de Início"
            value={newActivity.startDate}
            onChange={(e) => setNewActivity({ ...newActivity, startDate: e.target.value })}
          />
          <Input
            type="date"
            placeholder="Data de Fim"
            value={newActivity.endDate}
            onChange={(e) => setNewActivity({ ...newActivity, endDate: e.target.value })}
          />
        </div>
        <Button onClick={handleAddActivity} disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Adicionar Atividade
        </Button>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Atividades Anteriores</h3>
        {activities.length === 0 ? (
          <p className="text-muted-foreground">Nenhuma atividade extracurricular encontrada.</p>
        ) : (
          <ul className="space-y-4">
            {activities.map((activity) => (
              <li key={activity.id} className="p-4 rounded-lg bg-muted/50">
                <p className="font-semibold">{activity.activity_name}</p>
                <p className="text-sm text-muted-foreground">{activity.description}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {activity.start_date ? new Date(activity.start_date).toLocaleDateString() : ''}
                  {activity.start_date && activity.end_date ? ' - ' : ''}
                  {activity.end_date ? new Date(activity.end_date).toLocaleDateString() : ''}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ExtracurricularActivitiesTab;
