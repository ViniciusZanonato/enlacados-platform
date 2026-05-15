import React from 'react';
import { useReviews } from '../../hooks/useReviews';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import ReviewCard from './ReviewCard';
import StarRating from './StarRating';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ReviewForm from './ReviewForm';

interface ReviewsTabContentProps {
  profileId: string;
}

const ReviewsTabContent: React.FC<ReviewsTabContentProps> = ({ profileId }) => {
  const { reviews, loading, averageRating, totalReviews, fetchReviews } = useReviews(profileId);
  const { user, profile: currentProfile } = useAuth();

  const canSubmitReview = () => {
    if (!user || !currentProfile) return false; // Not logged in
    if (currentProfile.id === profileId) return false; // Can't review yourself
    // Check if user has already reviewed
    return !reviews.some(review => review.reviewer.id === currentProfile.id);
  };

  return (
    <Card className="shadow-lg rounded-3xl">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <CardTitle className="mb-2 md:mb-0">Avaliações ({totalReviews})</CardTitle>
            {totalReviews > 0 && (
                <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">{averageRating.toFixed(1)}</span>
                    <StarRating rating={averageRating} />
                    <span className="text-muted-foreground text-sm">de {totalReviews} avaliações</span>
                </div>
            )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {canSubmitReview() && (
            <ReviewForm 
              reviewedProfileId={profileId} 
              currentProfileId={currentProfile.id}
              onReviewSubmit={fetchReviews} // Pass the fetch function to refresh the list
            />
          )}

          <div className="space-y-6">
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : reviews.length > 0 ? (
              reviews.map((review) => (
                <ReviewCard 
                  key={review.id} 
                  review={review} 
                  currentProfileId={currentProfile?.id}
                  onAction={fetchReviews} // Pass refresh function
                />
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Este perfil ainda não tem nenhuma avaliação.</p>
                {!canSubmitReview() && <p className="text-sm text-muted-foreground">Seja o primeiro a avaliar!</p>}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReviewsTabContent;
