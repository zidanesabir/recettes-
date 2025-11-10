import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { RecipeCard } from "@/components/RecipeCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Search as SearchIcon, Grid3x3, List, SlidersHorizontal, Loader2 } from "lucide-react";
import { recipesAPI, categoriesAPI } from "@/services/api";
import { useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [recipes, setRecipes] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "");
  const [selectedDifficulty, setSelectedDifficulty] = useState(searchParams.get("difficulty") || "");
  const [sortBy, setSortBy] = useState("pertinence");
  const { toast } = useToast();

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    performSearch();
  }, [searchParams]);

  const loadCategories = async () => {
    try {
      const data = await categoriesAPI.getAll();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const performSearch = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: 1,
        limit: 12,
      };

      if (searchParams.get("q")) {
        params.search = searchParams.get("q");
      }
      if (searchParams.get("category")) {
        params.category = searchParams.get("category");
      }
      if (searchParams.get("difficulty")) {
        params.difficulty = searchParams.get("difficulty");
      }

      let sort = "-createdAt";
      if (sortBy === "rating") sort = "-rating.average";
      if (sortBy === "recent") sort = "-createdAt";
      params.sort = sort;

      const data = await recipesAPI.getAll(params);
      if (data.success) {
        setRecipes(data.data);
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la recherche",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (selectedCategory) params.set("category", selectedCategory);
    if (selectedDifficulty) params.set("difficulty", selectedDifficulty);
    setSearchParams(params);
  };

  const handleFilterChange = (filter: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(filter, value);
    } else {
      params.delete(filter);
    }
    setSearchParams(params);
  };

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("");
    setSelectedDifficulty("");
    setSearchParams({});
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto py-8 px-4">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="relative max-w-2xl mx-auto">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Rechercher une recette..."
              className="pl-10 h-12 text-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>

        <div className="flex gap-6">
          {/* Filters Sidebar */}
          <Card className="w-64 flex-shrink-0 p-4 h-fit sticky top-24">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5" />
                Filtres
              </h2>
            </div>

            <div className="space-y-6">
              <div>
                <Label className="mb-3 block font-semibold">Catégories</Label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {categories.map((cat) => (
                    <div key={cat._id} className="flex items-center space-x-2">
                      <Checkbox
                        id={cat._id}
                        checked={selectedCategory === cat.slug}
                        onCheckedChange={(checked) =>
                          handleFilterChange("category", checked ? cat.slug : "")
                        }
                      />
                      <label htmlFor={cat._id} className="text-sm cursor-pointer">
                        {cat.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="mb-3 block font-semibold">Difficulté</Label>
                <div className="space-y-2">
                  {["facile", "moyenne", "difficile"].map((diff) => (
                    <div key={diff} className="flex items-center space-x-2">
                      <Checkbox
                        id={diff}
                        checked={selectedDifficulty === diff}
                        onCheckedChange={(checked) =>
                          handleFilterChange("difficulty", checked ? diff : "")
                        }
                      />
                      <label htmlFor={diff} className="text-sm cursor-pointer capitalize">
                        {diff}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <Button variant="outline" className="w-full" onClick={resetFilters}>
                Réinitialiser les filtres
              </Button>
            </div>
          </Card>

          {/* Results */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold">
                  {searchParams.get("q")
                    ? `Résultats pour "${searchParams.get("q")}"`
                    : "Toutes les recettes"}
                </h1>
                <p className="text-muted-foreground">{recipes.length} recettes trouvées</p>
              </div>

              <div className="flex items-center gap-4">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pertinence">Pertinence</SelectItem>
                    <SelectItem value="recent">Plus récent</SelectItem>
                    <SelectItem value="rating">Mieux notées</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex gap-1 border border-border rounded-lg p-1">
                  <Button
                    variant={viewMode === "grid" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid3x3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : recipes.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Aucune recette trouvée</p>
              </div>
            ) : (
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    : "space-y-4"
                }
              >
                {recipes.map((recipe) => (
                  <RecipeCard key={recipe._id || recipe.id} {...recipe} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Search;
