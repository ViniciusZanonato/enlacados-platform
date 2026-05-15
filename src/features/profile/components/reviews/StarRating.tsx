import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  size?: number;
  className?: string;
}

const StarRating: React.FC<StarRatingProps> = ({ rating, size = 20, className }) => {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 !== 0;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

  return (
    <div className={cn('flex items-center', className)}>
      {[...Array(fullStars)].map((_, i) => (
        <Star key={`full-${i}`} fill="#FFC107" strokeWidth={0} style={{ width: size, height: size }} />
      ))}
      {halfStar && (
        <div style={{ position: 'relative', width: size, height: size }}>
          <Star key="half" fill="#FFC107" strokeWidth={0} style={{ position: 'absolute', clipPath: 'inset(0 50% 0 0)' }} />
          <Star key="half-empty" fill="#E0E0E0" strokeWidth={0} style={{ position: 'absolute', clipPath: 'inset(0 0 0 50%)' }} />
        </div>
      )}
      {[...Array(emptyStars)].map((_, i) => (
        <Star key={`empty-${i}`} fill="#E0E0E0" strokeWidth={0} style={{ width: size, height: size }} />
      ))}
    </div>
  );
};

export default StarRating;
