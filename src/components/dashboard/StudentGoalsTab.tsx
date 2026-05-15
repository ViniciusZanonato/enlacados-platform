
import { useState } from 'react';
import { supabase } from '@/api/supabase/client';
import { toast } from 'sonner';
import { StudentGoal } from '@/types/student-journey';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Check, X } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface StudentGoalsTabProps {
  goals: StudentGoal[];
  studentProfileId: string;
  onGoalAdded: () => void;
}

const StudentGoalsTab = ({ goals, studentProfileId, onGoalAdded }: StudentGoalsTabProps) => {
  const [newGoal, setNewGoal] = useState({ description: '', targetDate: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddGoal = async () => {
    if (!newGoal.description.trim()) {
      toast.error('A descrição da meta não pode estar vazia.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('student_goals').insert({
        student_profile_id: studentProfileId,
        goal_description: newGoal.description,
        target_date: newGoal.targetDate || null,
      });

      if (error) throw error;

      toast.success('Meta adicionada com sucesso!');
      setNewGoal({ description: '', targetDate: '' });
      onGoalAdded();
    } catch (error: Error) {
      console.error('Error adding goal:', error.message);
      toast.error('Erro ao adicionar meta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleCompletion = async (goal: StudentGoal) => {
    try {
      const { error } = await supabase
        .from('student_goals')
        .update({ is_completed: !goal.is_completed })
        .eq('id', goal.id);

      if (error) throw error;

      toast.success(`Meta ${goal.is_completed ? 'desmarcada' : 'concluída'}!`);
      onGoalAdded(); // Refetch to update the list
    } catch (error: Error) {
      console.error('Error updating goal:', error.message);
      toast.error('Erro ao atualizar a meta.');
    }
  };

  return (
    <div className="space-y-6 mt-4">
      <div className="space-y-4 p-4 border rounded-lg">
        <h3 className="text-lg font-semibold">Adicionar Nova Meta</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Textarea
            placeholder="Descrição da meta"
            value={newGoal.description}
            onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
            rows={1}
          />
          <Input
            type="date"
            placeholder="Data Alvo"
            value={newGoal.targetDate}
            onChange={(e) => setNewGoal({ ...newGoal, targetDate: e.target.value })}
          />
        </div>
        <Button onClick={handleAddGoal} disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Adicionar Meta
        </Button>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Metas do Aluno</h3>
        {goals.length === 0 ? (
          <p className="text-muted-foreground">Nenhuma meta encontrada.</p>
        ) : (
          <ul className="space-y-4">
            {goals.map((goal) => (
              <li key={goal.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-4">
                  <Checkbox
                    checked={goal.is_completed}
                    onCheckedChange={() => handleToggleCompletion(goal)}
                  />
                  <div>
                    <p className={`font-semibold ${goal.is_completed ? 'line-through text-muted-foreground' : ''}`}>
                      {goal.goal_description}
                    </p>
                    {goal.target_date && (
                      <p className="text-xs text-muted-foreground">
                        Até {new Date(goal.target_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                {goal.is_completed ? (
                  <span className="text-green-500 flex items-center gap-1 text-sm"><Check size={16} /> Concluída</span>
                ) : (
                  <span className="text-yellow-500 flex items-center gap-1 text-sm"><X size={16} /> Pendente</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default StudentGoalsTab;
