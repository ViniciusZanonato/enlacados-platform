import React, { useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { supabase } from '@/api/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Star } from 'lucide-react';
import { censorText } from '@/lib/profanity-filter';

const ReviewForm = ({ reviewedProfileId, currentProfileId, onReviewSubmit }) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || !currentProfileId) {
      toast.error('Você precisa estar logado para avaliar.');
      return;
    }
    if (rating === 0) {
      toast.error('Por favor, selecione uma nota (de 1 a 5 estrelas).');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('reviews').insert({
        reviewer_profile_id: currentProfileId,
        reviewed_profile_id: reviewedProfileId,
        rating: rating,
        comment: censorText(comment),
        is_anonymous: isAnonymous,
      });

      if (error) throw error;

      toast.success('Obrigado pela sua avaliação!');
      setRating(0);
      setComment('');
      setIsAnonymous(false);
      onReviewSubmit(); // Callback to refresh the reviews list
    } catch (error: Error) {
      toast.error(error.message || 'Erro ao enviar avaliação.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 border rounded-2xl bg-background">
      <h5 className="font-semibold mb-4">Deixe sua avaliação</h5>
      <div className="flex items-center mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className="cursor-pointer transition-colors"
            size={28}
            fill={(hoverRating || rating) >= star ? '#FFC107' : '#E0E0E0'}
            strokeWidth={0}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => setRating(star)}
          />
        ))}
      </div>
      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Compartilhe sua experiência... (opcional)"
        rows={4}
      />
      <div className="flex items-center space-x-2 mt-4">
        <Checkbox id="anonymous" checked={isAnonymous} onCheckedChange={setIsAnonymous} />
        <Label htmlFor="anonymous" className="text-sm text-muted-foreground cursor-pointer">
          Quero avaliar anonimamente
        </Label>
      </div>
      <Button type="submit" disabled={isSubmitting || rating === 0} className="mt-4">
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Enviar Avaliação
      </Button>
    </form>
  );
};

export default ReviewForm;
