import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/api/supabase/client';
import { toast } from 'sonner';

interface Reviewer {
  id: string;
  full_name: string;
  avatar_url: string;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  is_anonymous: boolean;
  created_at: string;
  reviewer: Reviewer;
}

export const useReviews = (profileId: string) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  const fetchReviews = useCallback(async () => {
    if (!profileId) return;

    setLoading(true);
    try {
      // Fetch reviews and reviewer's profile info
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          reviewer:reviewer_profile_id ( id, full_name, avatar_url )
        `)
        .eq('reviewed_profile_id', profileId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);

      // Calculate average rating and total
      if (data && data.length > 0) {
        const total = data.length;
        const sum = data.reduce((acc, review) => acc + review.rating, 0);
        setTotalReviews(total);
        setAverageRating(sum / total);
      } else {
        setTotalReviews(0);
        setAverageRating(0);
      }

    } catch (error: Error) {
      toast.error(error.message || 'Erro ao buscar as avaliações.');
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  return { reviews, loading, averageRating, totalReviews, fetchReviews };
};
