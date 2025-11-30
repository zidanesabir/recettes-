import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  Clock, 
  Users, 
  ChefHat, 
  Star, 
  Heart, 
  Bookmark, 
  Share2,
  Loader2
} from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { recipesAPI, usersAPI } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { CommentSection } from "@/components/CommentSection";

const RecipeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [recipe, setRecipe] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      loadRecipe();
    }
  }, [id]);

  useEffect(() => {
    if (recipe && user) {
      const currentUserId = (user as any).uid || (user as any).id || (user as any)._id;
      setIsLiked(recipe.likes?.some((likeId: string) => likeId === currentUserId) || false);
      const recipeId = recipe.id || recipe._id;
      const userBookmarks = (user as any).bookmarks || [];
      setIsBookmarked(userBookmarks.some((bookmarkId: string) => bookmarkId === recipeId) || false);
      const userFavorites = (user as any).favorites || [];
      setIsFavorite(userFavorites.some((favoriteId: string) => favoriteId === recipeId) || false);
    }
  }, [recipe, user]);

  const loadRecipe = async () => {
    try {
      setLoading(true);
      const data = await recipesAPI.getById(id!);
      if (data.success) {
        setRecipe(data.data);
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de charger la recette",
        variant: "destructive",
      });
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour aimer une recette",
        variant: "destructive",
      });
      return;
    }

    try {
      const data = await recipesAPI.like(id!);
      if (data.success) {
        setIsLiked(data.liked || data.isLiked || false);
        setRecipe((prev: any) => ({
          ...prev,
          likes: data.data?.likes || prev.likes,
        }));
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'aimer la recette",
        variant: "destructive",
      });
    }
  };

  const handleBookmark = async () => {
    if (!isAuthenticated || !user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour ajouter aux signets",
        variant: "destructive",
      });
      return;
    }

    try {
      const data = await usersAPI.toggleBookmark(user.uid, id!);
      if (data.success) {
        setIsBookmarked(data.isBookmarked);
        toast({
          title: "Succès",
          description: data.isBookmarked ? "Recette ajoutée aux signets" : "Recette retirée des signets",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'ajouter aux signets",
        variant: "destructive",
      });
    }
  };

  const handleFavorite = async () => {
    if (!isAuthenticated || !user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour ajouter aux favoris",
        variant: "destructive",
      });
      return;
    }

    try {
      const userId = user.uid || user.id || user._id;
      if (!userId) {
        toast({
          title: "Erreur",
          description: "ID utilisateur non trouvé",
          variant: "destructive",
        });
        return;
      }
      const data = await usersAPI.toggleFavorite(userId, id!);
      if (data.success) {
        setIsFavorite(data.isFavorite);
        // Update user favorites in local state
        if (user) {
          const updatedUser = { ...user };
          if (data.isFavorite) {
            if (!updatedUser.favorites) {
              updatedUser.favorites = [];
            }
            if (!updatedUser.favorites.includes(id!)) {
              updatedUser.favorites.push(id!);
            }
          } else {
            if (updatedUser.favorites) {
              updatedUser.favorites = updatedUser.favorites.filter((favId: string) => favId !== id);
            }
          }
          // Update localStorage
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
        toast({
          title: "Succès",
          description: data.isFavorite ? "Recette ajoutée aux favoris" : "Recette retirée des favoris",
        });
      }
    } catch (error: any) {
      console.error('Error toggling favorite:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'ajouter aux favoris",
        variant: "destructive",
      });
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: recipe?.title,
        text: recipe?.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Lien copié",
        description: "Le lien a été copié dans le presse-papiers",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container max-w-6xl mx-auto py-8 px-4">
          <p className="text-center text-muted-foreground">Recette non trouvée</p>
        </div>
      </div>
    );
  }

  const totalTime = recipe.prepTime + recipe.cookTime;
  const author = typeof recipe.author === 'object' ? recipe.author : { username: recipe.author };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero Image */}
            <div className="relative aspect-video rounded-xl overflow-hidden shadow-soft-lg bg-muted">
              <img
                src={recipe.image || '/placeholder.svg'}
                alt={recipe.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder.svg';
                }}
              />
            </div>

            {/* Title and Meta */}
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-4xl font-bold mb-2">{recipe.title}</h1>
                  <div className="flex items-center gap-4 text-muted-foreground">
                    {recipe.rating?.average > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-accent fill-accent" />
                        <span className="font-medium">{recipe.rating.average.toFixed(1)}</span>
                        <span>({recipe.rating.count} avis)</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleFavorite}
                    className={isFavorite ? "text-pink-500" : ""}
                    title="Ajouter aux favoris"
                  >
                    <Heart className={`h-5 w-5 ${isFavorite ? "fill-pink-500" : ""}`} />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleLike}
                    className={isLiked ? "text-red-500" : ""}
                    title="J'aime"
                  >
                    <Star className={`h-5 w-5 ${isLiked ? "fill-red-500" : ""}`} />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleBookmark}
                    className={isBookmarked ? "text-primary" : ""}
                    title="Ajouter aux signets"
                  >
                    <Bookmark className={`h-5 w-5 ${isBookmarked ? "fill-primary" : ""}`} />
                  </Button>
                  <Button variant="outline" size="icon" onClick={handleShare} title="Partager">
                    <Share2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {recipe.tags && recipe.tags.length > 0 && (
                <div className="flex gap-2 mb-4 flex-wrap">
                  {recipe.tags.map((tag: string, index: number) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              <Link
                to={`/profile/${author._id || author.id}`}
                className="flex items-center gap-3 hover:bg-muted/50 rounded-lg p-2 -ml-2 transition-colors w-fit"
              >
                <Avatar className="h-12 w-12 border-2 border-primary/20">
                  <AvatarImage src={author.avatar} />
                  <AvatarFallback>
                    {author.username?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{author.username}</p>
                </div>
              </Link>
            </div>

            <Separator />

            {/* Description */}
            {recipe.description && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-semibold mb-3">Description</h2>
                  <p className="text-muted-foreground leading-relaxed">{recipe.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Ingredients */}
            {recipe.ingredients && recipe.ingredients.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-semibold mb-4">Ingrédients</h2>
                  <ul className="space-y-2">
                    {recipe.ingredients.map((ingredient: any, index: number) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <div className="h-2 w-2 rounded-full bg-primary"></div>
                        </div>
                        <span>
                          {ingredient.quantity && `${ingredient.quantity} `}
                          {ingredient.unit && `${ingredient.unit} de `}
                          {ingredient.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Instructions */}
            {recipe.instructions && recipe.instructions.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-semibold mb-4">Étapes de préparation</h2>
                  <ol className="space-y-6">
                    {recipe.instructions
                      .sort((a: any, b: any) => a.step - b.step)
                      .map((instruction: any) => (
                        <li key={instruction.step} className="flex gap-4">
                          <div className="flex-shrink-0">
                            <div className="h-8 w-8 rounded-full bg-gradient-primary text-primary-foreground flex items-center justify-center font-bold">
                              {instruction.step}
                            </div>
                          </div>
                          <p className="pt-1">{instruction.description}</p>
                        </li>
                      ))}
                  </ol>
                </CardContent>
              </Card>
            )}

            {/* Comments Section */}
            <CommentSection recipeId={id!} />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardContent className="p-6 space-y-6">
                <div>
                  <h3 className="font-semibold mb-4">Informations</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Clock className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Temps total</p>
                        <p className="font-medium">{totalTime} minutes</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Portions</p>
                        <p className="font-medium">{recipe.servings} personnes</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <ChefHat className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Difficulté</p>
                        <p className="font-medium capitalize">{recipe.difficulty}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {recipe.nutrition && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-semibold mb-3">Valeurs nutritionnelles</h3>
                      <div className="space-y-2 text-sm">
                        {recipe.nutrition.calories > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Calories</span>
                            <span className="font-medium">{recipe.nutrition.calories} kcal</span>
                          </div>
                        )}
                        {recipe.nutrition.proteins > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Protéines</span>
                            <span className="font-medium">{recipe.nutrition.proteins}g</span>
                          </div>
                        )}
                        {recipe.nutrition.carbs > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Glucides</span>
                            <span className="font-medium">{recipe.nutrition.carbs}g</span>
                          </div>
                        )}
                        {recipe.nutrition.fats > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Lipides</span>
                            <span className="font-medium">{recipe.nutrition.fats}g</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeDetail;
