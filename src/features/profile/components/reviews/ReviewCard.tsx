import React, { useState } from 'react';
import { supabase } from '@/api/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import StarRating from './StarRating';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { User, MoreHorizontal, Trash2, Edit, Loader2, Star } from 'lucide-react';
import { toast } from 'sonner';
import { censorText } from '@/lib/profanity-filter';

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

interface ReviewCardProps {
  review: Review;
  currentProfileId: string;
  onAction: () => void;
}

const ReviewCard = ({ review, currentProfileId, onAction }: ReviewCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  // State for editing
  const [editedRating, setEditedRating] = useState(review.rating);
  const [editedComment, setEditedComment] = useState(review.comment || '');
  const [editedIsAnonymous, setEditedIsAnonymous] = useState(review.is_anonymous);
  const [hoverRating, setHoverRating] = useState(0);

  const isOwner = currentProfileId === review.reviewer.id;
  const isAnonymous = review.is_anonymous;
  const reviewerName = isAnonymous ? 'Usuário Anônimo' : review.reviewer?.full_name;
  const reviewerAvatar = isAnonymous ? null : review.reviewer?.avatar_url;

  const handleUpdate = async () => {
    setIsEditing(true);
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ 
          rating: editedRating,
          comment: censorText(editedComment),
          is_anonymous: editedIsAnonymous
        })
        .eq('id', review.id);
      if (error) throw error;
      toast.success('Avaliação atualizada com sucesso!');
      onAction(); // Refresh list
      setIsEditing(false);
    } catch (error: Error) {
      toast.error(error.message || 'Erro ao atualizar avaliação.');
    } finally {
      setIsEditing(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('reviews').delete().eq('id', review.id);
      if (error) throw error;
      toast.success('Avaliação excluída com sucesso!');
      onAction(); // Refresh list
    } catch (error: Error) {
      toast.error(error.message || 'Erro ao excluir avaliação.');
    } finally {
      setIsDeleting(false);
      setShowDeleteAlert(false);
    }
  };

  if (isEditing) {
    return (
      <Card className="bg-muted/50">
        <CardContent className="p-6">
          <h5 className="font-semibold mb-4">Editando sua avaliação</h5>
          <div className="flex items-center mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className="cursor-pointer transition-colors"
                size={28}
                fill={(hoverRating || editedRating) >= star ? '#FFC107' : '#E0E0E0'}
                strokeWidth={0}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setEditedRating(star)}
              />
            ))}
          </div>
          <Textarea
            value={editedComment}
            onChange={(e) => setEditedComment(e.target.value)}
            rows={4}
          />
          <div className="flex items-center space-x-2 mt-4">
            <Checkbox id={`anonymous-edit-${review.id}`} checked={editedIsAnonymous} onCheckedChange={setEditedIsAnonymous} />
            <Label htmlFor={`anonymous-edit-${review.id}`} className="text-sm text-muted-foreground cursor-pointer">Avaliar anonimamente</Label>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancelar</Button>
            <Button onClick={handleUpdate} disabled={isEditing}> 
              {isEditing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salvar
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-muted/50">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <Avatar>
            <AvatarImage src={reviewerAvatar} alt={reviewerName} />
            <AvatarFallback>
              {isAnonymous ? <User className="w-4 h-4" /> : (reviewerName?.charAt(0) || 'U')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div className='flex-1'>
                <h5 className="font-semibold">{reviewerName}</h5>
                <StarRating rating={review.rating} size={16} className="mt-1" />
              </div>
              <div className='flex items-center'>
                <span className="text-xs text-muted-foreground mr-4">
                  {formatDistanceToNow(new Date(review.created_at), { addSuffix: true, locale: ptBR })}
                </span>
                {isOwner && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setIsEditing(true)}><Edit className="mr-2 h-4 w-4"/>Editar</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setShowDeleteAlert(true)} className="text-red-500"><Trash2 className="mr-2 h-4 w-4"/>Excluir</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
            {review.comment && <p className="text-sm text-foreground mt-3 whitespace-pre-wrap">{review.comment}</p>}
          </div>
        </div>
      </CardContent>
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Sua avaliação será permanentemente excluída.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-red-500 hover:bg-red-600">
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default ReviewCard;
