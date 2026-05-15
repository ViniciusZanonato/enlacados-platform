import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, Star, Target, MessageSquare, ClipboardCheck } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// This will be a union of all possible event types
interface NoteEventData {
  note: string;
}

interface GoalEventData {
  goal_description: string;
  is_completed: boolean;
  target_date?: string;
}

interface ActivityEventData {
  activity_name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
}

interface GradeUpdateEventData {
  course_name: string;
  grade?: number | string;
  absences?: number;
}

interface ExamEventData {
  course_name: string;
  topic?: string;
  exam_date: string;
}

export type TimelineEvent =
  | { type: 'note'; timestamp: string; data: NoteEventData }
  | { type: 'goal'; timestamp: string; data: GoalEventData }
  | { type: 'activity'; timestamp: string; data: ActivityEventData }
  | { type: 'grade_update'; timestamp: string; data: GradeUpdateEventData }
  | { type: 'exam'; timestamp: string; data: ExamEventData };

const iconMap = {
  note: <MessageSquare className="h-5 w-5" />,
  goal: <Target className="h-5 w-5" /> ,
  activity: <Star className="h-5 w-5" />,
  grade_update: <BookOpen className="h-5 w-5" />,
  exam: <ClipboardCheck className="h-5 w-5" />,
};

const TimelineItem = ({ event }: { event: TimelineEvent }) => {
  let title = '';
  let description = '';

  switch (event.type) {
    case 'note':
      title = 'Nota de Mentoria Adicionada';
      description = event.data.note;
      break;
    case 'goal':
      title = `Meta "${event.data.goal_description}" foi atualizada`;
      description = `Status: ${event.data.is_completed ? 'Concluída' : 'Pendente'}. Data Alvo: ${event.data.target_date ? format(parseISO(event.data.target_date), 'dd/MM/yyyy') : 'N/A'}`;
      break;
    case 'activity':
        title = `Atividade Extracurricular: ${event.data.activity_name}`;
        description = `${event.data.description || 'Sem descrição.'} - De ${event.data.start_date ? format(parseISO(event.data.start_date), 'dd/MM/yyyy') : 'N/A'} a ${event.data.end_date ? format(parseISO(event.data.end_date), 'dd/MM/yyyy') : 'N/A'}`;
        break;
    case 'grade_update':
        title = `Boletim Atualizado em ${event.data.course_name}`;
        description = `Nota: ${event.data.grade ?? 'N/A'}, Faltas: ${event.data.absences ?? 'N/A'}`;
        break;
    case 'exam':
        title = `Prova Agendada: ${event.data.course_name}`;
        description = `Tópico: ${event.data.topic || 'Não especificado'}. Data: ${format(parseISO(event.data.exam_date), "dd/MM/yyyy 'às' HH:mm")}`;
        break;
    default:
      return null;
  }

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="bg-primary text-primary-foreground rounded-full h-10 w-10 flex items-center justify-center">
          {iconMap[event.type]}
        </div>
        <div className="flex-grow w-px bg-border my-2"></div>
      </div>
      <div className="pb-8 flex-1">
        <div className="flex items-center gap-2">
            <h4 className="font-semibold">{title}</h4>
            <span className="text-xs text-muted-foreground">
                {format(parseISO(event.timestamp), "dd MMM, yyyy 'às' HH:mm", { locale: ptBR })}
            </span>
        </div>
        <p className="text-sm text-muted-foreground mt-1 truncate">{description}</p>
      </div>
    </div>
  );
};


const ActivityTimeline = ({ events }: { events: TimelineEvent[] }) => {
  if (events.length === 0) {
    return <p className="text-center text-muted-foreground py-12">Nenhuma atividade registrada ainda.</p>;
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div>
          {events.map((event, index) => (
            <TimelineItem key={index} event={event} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivityTimeline;