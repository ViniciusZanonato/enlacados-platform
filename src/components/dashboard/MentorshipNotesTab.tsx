import { useState } from 'react';
import { supabase } from '@/api/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { MentorshipNote as BaseMentorshipNote } from '@/types/student-journey'; // Import the base type
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'; // Import Avatar components

// Extend the MentorshipNote interface to include mentor details
interface MentorshipNoteWithMentor extends BaseMentorshipNote {
  mentor: {
    full_name: string;
    avatar_url?: string;
  };
}

interface MentorshipNotesTabProps {
  studentProfileId: string;
}

const MentorshipNotesTab = ({ studentProfileId }: MentorshipNotesTabProps) => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [newNote, setNewNote] = useState('');

  // Fetch mentorship notes
  const { data: notes, isLoading } = useQuery<MentorshipNoteWithMentor[]>({ // Use the extended interface here
    queryKey: ['mentorshipNotes', studentProfileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mentorship_notes')
        .select('*, mentor:profiles!mentor_id(full_name, avatar_url)') // Explicitly join on mentor_id
        .eq('student_profile_id', studentProfileId)
        .order('created_at', { ascending: false });
      
      if (error) {
        toast.error('Falha ao carregar anotações de mentoria.');
        throw error;
      }
      return data || [];
    },
    enabled: !!studentProfileId,
  });

  // Mutation for adding a new note
  const addNoteMutation = useMutation({
    mutationFn: async (noteText: string) => {
      if (!profile) throw new Error('Perfil do mentor não encontrado.');

      const { error } = await supabase.from('mentorship_notes').insert({
        student_profile_id: studentProfileId,
        mentor_id: profile.id,
        note: noteText.trim(),
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Anotação adicionada com sucesso!');
      setNewNote('');
      // Invalidate the query to refetch the notes
      queryClient.invalidateQueries({ queryKey: ['mentorshipNotes', studentProfileId] });
    },
    onError: (error: Error) => {
      console.error('Error adding mentorship note:', error.message);
      toast.error('Erro ao adicionar anotação.');
    }
  });

  const handleAddNote = () => {
    if (!newNote.trim()) {
      toast.error('A anotação não pode estar vazia.');
      return;
    }
    addNoteMutation.mutate(newNote);
  };

  return (
    <div className="space-y-6 mt-4">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Adicionar Nova Anotação de Mentoria</h3>
        <Textarea
          placeholder="Digite sua anotação aqui..."
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          rows={4}
        />
        <Button onClick={handleAddNote} disabled={addNoteMutation.isPending}>
          {addNoteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Adicionar Anotação
        </Button>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Anotações Anteriores</h3>
        {isLoading ? (
          <div className="flex justify-center items-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : !notes || notes.length === 0 ? (
          <p className="text-muted-foreground">Nenhuma anotação de mentoria encontrada.</p>
        ) : (
          <ul className="space-y-4">
            {notes.map((note) => (
              <li key={note.id} className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center space-x-3 mb-2">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={note.mentor?.avatar_url ?? undefined} />
                        <AvatarFallback>{note.mentor?.full_name?.charAt(0) || '?'}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold text-sm">{note.mentor?.full_name || 'Mentor Desconhecido'}</p>
                        <p className="text-xs text-muted-foreground">
                            {new Date(note.created_at).toLocaleDateString()}
                        </p>
                    </div>
                </div>
                <p className="text-sm">{note.note}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default MentorshipNotesTab;
