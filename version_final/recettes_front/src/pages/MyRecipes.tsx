import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { CategorySidebar } from "@/components/CategorySidebar";
import { RecipeCard } from "@/components/RecipeCard";
import { recipesAPI } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const MyRecipes = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();


  useEffect(() => {
    if (user) {
      loadMyRecipes();
    } else {
      navigate('/login');
    }
  }, [user]);

  const loadMyRecipes = async () => {
    try {
      setLoading(true);
      setRecipes([]);
      const data = await recipesAPI.getMyRecipes({ page: 1, limit: 50 });
      console.log('My recipes response:', data);
      if (data && data.success && data.data) {
        setRecipes(Array.isArray(data.data) ? data.data : []);
      } else {
        setRecipes([]);
        console.log('No recipes found or invalid response:', data);
      }
    } catch (error: any) {
      console.error('Error loading my recipes:', error);
      setRecipes([]);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de charger vos recettes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <CategorySidebar />
        <main className="flex-1 p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Mes Recettes</h1>
            <Button asChild className="bg-gradient-primary">
              <Link to="/create">
                <Plus className="mr-2 h-4 w-4" />
                Créer une recette
              </Link>
            </Button>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : recipes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">Vous n'avez pas encore créé de recette</p>
              <Button asChild className="bg-gradient-primary">
                <Link to="/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Créer ma première recette
                </Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recipes.map((recipe) => (
                <RecipeCard key={recipe._id || recipe.id} {...recipe} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default MyRecipes;

