import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Star, Heart, Reply, Send, Loader2 } from "lucide-react";
import { commentsAPI } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CommentSectionProps {
  recipeId: string;
}

export const CommentSection = ({ recipeId }: CommentSectionProps) => {
  const { user, isAuthenticated } = useAuth();
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentContent, setCommentContent] = useState("");
  const [rating, setRating] = useState<number | undefined>(undefined);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadComments();
  }, [recipeId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const data = await commentsAPI.getByRecipe(recipeId);
      if (data.success) {
        setComments(data.data);
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de charger les commentaires",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour commenter",
        variant: "destructive",
      });
      return;
    }

    try {
      const data = await commentsAPI.create({
        recipe: recipeId,
        content: commentContent,
        rating: rating,
      });
      if (data.success) {
        setCommentContent("");
        setRating(undefined);
        loadComments();
        toast({
          title: "Succès",
          description: "Commentaire ajouté",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'ajouter le commentaire",
        variant: "destructive",
      });
    }
  };

  // Handle "like" action on a comment
const handleLikeComment = async (commentId: string) => {
  // Check if the user is authenticated before allowing likes
  if (!isAuthenticated) {
    toast({
      title: "Connexion requise",
      description: "Vous devez être connecté pour aimer un commentaire",
      variant: "destructive",
    });
    return;
  }

  try {
    // Send a like request to the API
    await commentsAPI.like(commentId, recipeId);
    // Reload the comment list to update like counts
    loadComments();
  } catch (error: any) {
    // Handle any error that occurs during the like action
    toast({
      title: "Erreur",
      description: error.message || "Impossible d'aimer le commentaire",
      variant: "destructive",
    });
  }
};

// Handle submission of a reply to a comment
const handleSubmitReply = async (commentId: string) => {
  // Ignore if the reply field is empty
  if (!replyContent.trim()) return;

  try {
    // Send the reply to the API
    await commentsAPI.addReply(commentId, replyContent, recipeId);
    // Reset reply state and input field
    setReplyingTo(null);
    setReplyContent("");
    // Refresh comments to show the new reply
    loadComments();
  } catch (error: any) {
    // Handle errors when adding a reply
    toast({
      title: "Erreur",
      description: error.message || "Impossible d'ajouter la réponse",
      variant: "destructive",
    });
  }
};


  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-2xl font-semibold mb-4">Commentaires</h2>

        {/* Add Comment Form */}
        {isAuthenticated && (
          <form onSubmit={handleSubmitComment} className="mb-6 space-y-4">
            <div className="flex items-center gap-2">
              <Select
                value={rating?.toString() || ""}
                onValueChange={(value) => setRating(value ? parseInt(value) : undefined)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Note (optionnel)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 étoiles</SelectItem>
                  <SelectItem value="4">4 étoiles</SelectItem>
                  <SelectItem value="3">3 étoiles</SelectItem>
                  <SelectItem value="2">2 étoiles</SelectItem>
                  <SelectItem value="1">1 étoile</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Textarea
              placeholder="Ajouter un commentaire..."
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              rows={3}
            />
            <Button type="submit" disabled={!commentContent.trim()}>
              <Send className="h-4 w-4 mr-2" />
              Publier
            </Button>
          </form>
        )}

        <Separator className="mb-6" />

        {/* Comments List */}
        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground">Chargement des commentaires...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Aucun commentaire pour le moment</p>
          </div>
        ) : (
          <div className="space-y-6">
            {comments.map((comment) => (
              <div key={comment._id} className="space-y-4">
                <div className="flex gap-4">
                  <Avatar>
                    <AvatarImage src={comment.user?.avatar} />
                    <AvatarFallback>
                      {comment.user?.username?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold"> 
                        {comment.createdAt?.toDate
                              ? comment.createdAt.toDate().toLocaleDateString("fr-FR", {
                               year: "numeric",
                               month: "long",
                               day: "numeric",
                               hour: "2-digit",
                               minute: "2-digit",
                              })
                       : "Date inconnue"}
                       </p>
                      {comment.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-accent fill-accent" />
                          <span className="text-sm">{comment.rating}</span>
                        </div>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {comment.createdAt?.toDate
  ? comment.createdAt.toDate().toLocaleDateString("fr-FR")
  : "Date inconnue"}
                      </span>
                    </div>
                    <p className="text-sm mb-2">{comment.content}</p>
                    <div className="flex items-center gap-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLikeComment(comment._id)}
                      >
                        <Heart
                          className={`h-4 w-4 mr-1 ${
                            comment.likes?.some((id: string) => id === user?.id)
                              ? "fill-red-500 text-red-500"
                              : ""
                          }`}
                        />
                        {comment.likes?.length || 0}
                      </Button>
                      {isAuthenticated && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)}
                        >
                          <Reply className="h-4 w-4 mr-1" />
                          Répondre
                        </Button>
                      )}
                    </div>

                    {/* Reply Form */}
                    {replyingTo === comment._id && (
                      <div className="mt-4 space-y-2">
                        <Textarea
                          placeholder="Écrire une réponse..."
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSubmitReply(comment._id)}
                            disabled={!replyContent.trim()}
                          >
                            Envoyer
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setReplyingTo(null);
                              setReplyContent("");
                            }}
                          >
                            Annuler
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="mt-4 ml-8 space-y-3 border-l-2 border-border pl-4">
                        {comment.replies.map((reply: any, index: number) => (
                          <div key={index} className="flex gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={reply.user?.avatar} />
                              <AvatarFallback className="text-xs">
                                {reply.user?.username?.[0]?.toUpperCase() || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold text-sm">{reply.user?.username}</p>
                                <span className="text-xs text-muted-foreground">
                                  {reply.createdAt?.toDate
  ? reply.createdAt.toDate().toLocaleDateString("fr-FR")
  : "Date inconnue"}
                                </span>
                              </div>
                              <p className="text-sm">{reply.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <Separator />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};




