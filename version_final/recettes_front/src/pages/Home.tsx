import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { CategorySidebar } from "@/components/CategorySidebar";
import { RecipeCard } from "@/components/RecipeCard";
import { recipesAPI, usersAPI, categoriesAPI } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const Home = () => {
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [title, setTitle] = useState("Recettes Populaires");
  const [categories, setCategories] = useState<any[]>([]);
  const { toast } = useToast();

  const filter = searchParams.get('filter');
  const category = searchParams.get('category');

  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await categoriesAPI.getAll();
        if (data && data.success && data.data) {
          setCategories(Array.isArray(data.data) ? data.data : []);
        }
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    };
    loadCategories();
  }, []);

  useEffect(() => {
    setPage(1);
    setRecipes([]);
    
    if (filter === 'favorites' || filter === 'following') {
      // Only load if authenticated
      if (isAuthenticated) {
        loadRecipes();
      } else {
        setLoading(false);
        setRecipes([]);
      }
    } else {
      loadRecipes();
    }
  }, [filter, category, isAuthenticated, categories]);

  useEffect(() => {
    if (page > 1) {
      loadRecipes();
    }
  }, [page]);

  // Update title based on filter and category
  useEffect(() => {
    if (filter === 'recent') {
      setTitle("Recettes Récentes");
    } else if (filter === 'popular') {
      setTitle("Recettes Populaires");
    } else if (filter === 'favorites') {
      setTitle("Mes Recettes Favorites");
    } else if (filter === 'following') {
      setTitle("Recettes des Utilisateurs Suivis");
    } else if (category) {
      // Find category name from loaded categories
      const foundCategory = categories.find(cat => cat.slug === category);
      const categoryName = foundCategory ? foundCategory.name : category;
      setTitle(`Recettes - ${categoryName}`);
    } else {
      setTitle("Toutes les Recettes");
    }
  }, [filter, category, categories]);

  const loadRecipes = async () => {
    try {
      setLoading(true);
      setRecipes([]);
      
      let data;

      // Load recipes based on filter (title is set by useEffect)
      if (filter === 'recent') {
        data = await recipesAPI.getRecent(12);
        console.log('Recent recipes response:', data);
        if (data && data.success && data.data) {
          setRecipes(Array.isArray(data.data) ? data.data : []);
          setHasMore(false);
        } else {
          setRecipes([]);
          setHasMore(false);
        }
      } else if (filter === 'popular') {
        data = await recipesAPI.getPopular(12);
        console.log('Popular recipes response:', data);
        if (data && data.success && data.data) {
          setRecipes(Array.isArray(data.data) ? data.data : []);
          setHasMore(false);
        } else {
          setRecipes([]);
          setHasMore(false);
        }
      } else if (filter === 'favorites' && isAuthenticated) {
        data = await recipesAPI.getFavorites(12);
        console.log('Favorites recipes response:', data);
        if (data && data.success) {
          if (data.data && Array.isArray(data.data) && data.data.length > 0) {
            setRecipes(data.data);
            setHasMore(false);
          } else {
            // Empty favorites - this is normal, don't show error
            setRecipes([]);
            setHasMore(false);
            if (data.message) {
              console.log('Favorites message:', data.message);
            }
          }
        } else {
          // API returned success: false
          setRecipes([]);
          setHasMore(false);
          const errorMsg = data?.message || data?.error || "Erreur lors du chargement des favoris";
          console.error('Favorites API error:', errorMsg);
          toast({
            title: "Erreur",
            description: errorMsg,
            variant: "destructive",
          });
        }
      } else if (filter === 'following' && isAuthenticated) {
        data = await recipesAPI.getFollowed(12);
        console.log('Followed recipes response:', data);
        if (data && data.success && data.data) {
          setRecipes(Array.isArray(data.data) ? data.data : []);
          setHasMore(false);
        } else {
          setRecipes([]);
          setHasMore(false);
          if (data && data.message) {
            // Don't show error toast for empty followed, it's normal
            console.log('Followed message:', data.message);
          }
        }
      } else {
        // Default: all recipes with pagination
        // Title is set by useEffect, no need to set it here
        const params: any = {
          page: page,
          limit: 12,
        };
        if (category) {
          params.category = category;
        }
        data = await recipesAPI.getAll(params);
        console.log('All recipes response:', data);
        if (data && data.success && data.data) {
          if (page === 1) {
            setRecipes(Array.isArray(data.data) ? data.data : []);
          } else {
            setRecipes((prev) => [...prev, ...(Array.isArray(data.data) ? data.data : [])]);
          }
          setHasMore(data.page < data.pages);
        } else {
          setRecipes([]);
          setHasMore(false);
        }
      }
    } catch (error: any) {
      console.error('Error loading recipes:', error);
      setRecipes([]);
      setHasMore(false);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de charger les recettes",
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
          <h1 className="text-3xl font-bold mb-6">{title}</h1>
          
          {loading && recipes.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : recipes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                {filter === 'following' && "Vous ne suivez aucun utilisateur"}
                {filter === 'favorites' && "Vous n'avez aucune recette favorite. Ajoutez des recettes à vos favoris pour les voir ici !"}
                {!filter && "Aucune recette trouvée"}
              </p>
              {filter === 'favorites' && (
                <p className="text-sm text-muted-foreground">
                  Cliquez sur l'icône cœur sur une recette pour l'ajouter à vos favoris
                </p>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recipes.map((recipe) => (
                  <RecipeCard key={recipe._id || recipe.id} {...recipe} />
                ))}
              </div>
              
              {hasMore && (
                <div className="mt-8 text-center">
                  <Button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={loading}
                    variant="outline"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Chargement...
                      </>
                    ) : (
                      "Charger plus"
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Home;
