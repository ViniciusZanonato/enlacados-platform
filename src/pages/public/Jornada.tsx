import { useState, useEffect } from 'react';
import { supabase } from '@/api/supabase/client';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Plus, Trash2, Flag } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from "react-router-dom";
import journeyIllustration from '@/assets/journey-illustration.jpg';

// Define the type for a goal
interface Goal {
  id: string;
  title: string;
  description?: string;
  type?: string;
  status: string;
  due_date?: string;
  created_at: string;
}

const JornadaPublic = () => {
  return (
    <div className="container mx-auto py-16 px-4 text-center">
      <span className="label-pill text-primary/70 inline-block mb-3" style={{ animation: 'fadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) both' }}>
        Planejamento
      </span>
      <h1 className="text-6xl md:text-7xl font-black leading-none mb-6" style={{ animation: 'fadeInUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.05s both' }}>
        Sua Jornada <span className="gradient-text">Começa Aqui</span>
      </h1>
      <p className="text-xl text-muted-foreground font-thin max-w-3xl mx-auto mb-10" style={{ animation: 'fadeInUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.1s both' }}>
        Mapeie seu caminho para o sucesso. A Enlaçados ajuda você a visualizar e planejar sua trajetória acadêmica e profissional, conectando seus estudos aos seus objetivos de carreira.
      </p>
      <div className="flex justify-center mb-14">
        <img src={journeyIllustration} alt="Ilustração da Jornada Educacional" className="rounded-2xl shadow-elegant max-w-full md:max-w-2xl border border-border/30" />
      </div>
      <div className="space-y-6">
        <span className="label-pill text-primary/70 inline-block mb-1">Processo</span>
        <h2 className="text-4xl font-black leading-none">Como Funciona?</h2>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto text-left mt-8">
          <div className="group relative p-6 border border-border/50 rounded-2xl hover:border-primary/30 transition-all duration-300 hover:-translate-y-0.5 overflow-hidden">
            <div className="absolute left-0 top-4 bottom-4 w-0.5 rounded-full bg-primary/20 group-hover:bg-primary/60 transition-colors duration-300" />
            <span className="absolute -top-2 -right-1 text-[5rem] font-black text-primary/5 leading-none select-none pointer-events-none" aria-hidden>1</span>
            <h3 className="text-lg font-black mb-2 relative">Defina seus Interesses</h3>
            <p className="text-sm text-muted-foreground font-thin relative">Explore áreas de conhecimento e carreiras que te inspiram. Nossa plataforma te ajuda a descobrir suas paixões.</p>
          </div>
          <div className="group relative p-6 border border-border/50 rounded-2xl hover:border-primary/30 transition-all duration-300 hover:-translate-y-0.5 overflow-hidden">
            <div className="absolute left-0 top-4 bottom-4 w-0.5 rounded-full bg-primary/20 group-hover:bg-primary/60 transition-colors duration-300" />
            <span className="absolute -top-2 -right-1 text-[5rem] font-black text-primary/5 leading-none select-none pointer-events-none" aria-hidden>2</span>
            <h3 className="text-lg font-black mb-2 relative">Trace sua Rota</h3>
            <p className="text-sm text-muted-foreground font-thin relative">Com base nos seus interesses, criamos um mapa visual com cursos, especializações e habilidades necessárias.</p>
          </div>
          <div className="group relative p-6 border border-border/50 rounded-2xl hover:border-primary/30 transition-all duration-300 hover:-translate-y-0.5 overflow-hidden">
            <div className="absolute left-0 top-4 bottom-4 w-0.5 rounded-full bg-primary/20 group-hover:bg-primary/60 transition-colors duration-300" />
            <span className="absolute -top-2 -right-1 text-[5rem] font-black text-primary/5 leading-none select-none pointer-events-none" aria-hidden>3</span>
            <h3 className="text-lg font-black mb-2 relative">Alcance seus Objetivos</h3>
            <p className="text-sm text-muted-foreground font-thin relative">Acompanhe seu progresso, conecte-se com mentores e encontre as melhores oportunidades para sua carreira.</p>
          </div>
        </div>
      </div>
      <div className="mt-14">
        <p className="text-muted-foreground font-thin mb-4">Pronto para começar a construir seu futuro?</p>
        <Button asChild size="lg" className="font-black">
          <Link to="/auth">Crie sua conta gratuitamente</Link>
        </Button>
      </div>
    </div>
  );
};

const JornadaLoggedIn = ({ user }) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newGoal, setNewGoal] = useState({ title: '', description: '', type: 'academic', due_date: '' });

  useEffect(() => {
    if (user) {
      fetchGoals();
    }
  }, [user]);

  const fetchGoals = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('get_student_goals');
    if (error) {
      toast.error('Erro ao buscar suas metas.');
      console.error(error);
    }
    setGoals(data || []);
    setLoading(false);
  };

  const handleAddGoal = async () => {
    if (!newGoal.title) {
      toast.warning('O título da meta é obrigatório.');
      return;
    }
    const { error } = await supabase.rpc('add_student_goal', {
      title: newGoal.title,
      description: newGoal.description,
      type: newGoal.type,
      due_date: newGoal.due_date || null,
    });

    if (error) {
      toast.error('Erro ao adicionar a meta.');
    } else {
      toast.success('Meta adicionada com sucesso!');
      fetchGoals(); // Refetch goals to get the new one
      setNewGoal({ title: '', description: '', type: 'academic', due_date: '' });
      setIsFormOpen(false);
    }
  };

  const handleUpdateStatus = async (goalId: string, status: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    const { error } = await supabase.rpc('update_student_goal', {
      goal_id: goalId,
      new_title: goal.title,
      new_description: goal.description,
      new_type: goal.type,
      new_status: status,
      new_due_date: goal.due_date,
    });

    if (error) {
      toast.error('Erro ao atualizar a meta.');
    } else {
      toast.success('Meta atualizada!');
      fetchGoals(); // Refetch goals
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    const { error } = await supabase.rpc('delete_student_goal', { goal_id: goalId });
    if (error) {
      toast.error('Erro ao deletar a meta.');
    } else {
      toast.success('Meta deletada.');
      setGoals(goals.filter(g => g.id !== goalId));
    }
  };
  
  const timelineItems = [...goals]
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Minha Jornada</h1>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Adicionar Meta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Nova Meta</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Input
                placeholder="Título da meta"
                value={newGoal.title}
                onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
              />
              <Textarea
                placeholder="Descrição (opcional)"
                value={newGoal.description}
                onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
              />
              <Input
                type="date"
                value={newGoal.due_date}
                onChange={(e) => setNewGoal({ ...newGoal, due_date: e.target.value })}
              />
              <Button onClick={handleAddGoal} className="w-full">Salvar Meta</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      ) : (
        <div className="relative pl-8">
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border -translate-x-1/2"></div>

          {timelineItems.length > 0 ? timelineItems.map((item) => (
            <div key={item.id} className="mb-8 flex items-center w-full">
              <div className="absolute left-8 -translate-x-1/2 z-10 p-2 bg-background rounded-full border-2 border-primary">
                <Flag className="text-primary" />
              </div>
              <div className="pl-12 w-full">
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-start justify-between">
                    <div>
                      <CardTitle>{item.title}</CardTitle>
                      <p className={`text-sm mt-2 font-semibold ${item.status === 'completed' ? 'text-green-500' : 'text-yellow-500'}`}>
                        {item.status}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.status !== 'completed' && (
                        <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(item.id, 'completed')}>
                          Concluir
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteGoal(item.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{item.description}</p>
                    {item.due_date && <p className="text-sm mt-2">Prazo: {new Date(item.due_date).toLocaleDateString()}</p>}
                  </CardContent>
                </Card>
              </div>
            </div>
          )) : (
            <div className="text-center py-16">
                <p className="text-muted-foreground">Nenhuma meta adicionada ainda.</p>
                <p className="text-muted-foreground">Comece a planejar sua jornada clicando em "Adicionar Meta".</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const Jornada = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return user ? <JornadaLoggedIn user={user} /> : <JornadaPublic />;
};

export default Jornada;