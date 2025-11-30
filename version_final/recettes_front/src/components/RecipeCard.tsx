import { Card, CardContent } from "@/components/ui/card";
import { Star, Clock, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";

interface RecipeCardProps {
  _id?: string;
  id?: string;
  title: string;
  author?: {
    username: string;
    avatar?: string;
  } | string;
  image?: string;
  prepTime?: number;
  cookTime?: number;
  totalTime?: number;
  time?: string;
  rating?: {
    average: number;
    count: number;
  } | number;
  reviews?: number;
  comments?: number;
}

export const RecipeCard = (props: RecipeCardProps) => {
  const id = props._id || props.id || '';
  const title = props.title;
  const authorName = typeof props.author === 'string' 
    ? props.author 
    : props.author?.username || 'Auteur inconnu';
  const image = props.image && props.image.trim() !== ""
  ? props.image
  : '/placeholder.svg';
  const totalTime = props.totalTime || (props.prepTime || 0) + (props.cookTime || 0);
  const timeDisplay = props.time || `${totalTime} min`;
  const rating = typeof props.rating === 'number' 
    ? props.rating 
    : props.rating?.average || 0;
  const reviews = props.reviews || (typeof props.rating === 'object' ? props.rating?.count : 0) || 0;
  const comments = props.comments || 0;

  return (
    <Link to={`/recipe/${id}`}>
      <Card className="group overflow-hidden transition-all duration-300 hover:shadow-soft-lg hover:scale-[1.02] cursor-pointer">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <img
            src={image}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder.svg';
            }}
          />
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg mb-1 line-clamp-2">{title}</h3>
          <p className="text-sm text-muted-foreground mb-3">Par {authorName}</p>
          
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-primary" />
                <span>{timeDisplay}</span>
              </div>
              {rating > 0 && (
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-accent fill-accent" />
                  <span className="font-medium">{rating.toFixed(1)}</span>
                  {reviews > 0 && (
                <span className="text-muted-foreground">({reviews})</span>
                  )}
              </div>
              )}
            </div>
            {comments > 0 && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <MessageCircle className="h-4 w-4" />
              <span>{comments}</span>
            </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
