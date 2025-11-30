import { useEffect, useState } from "react";
import { Link, useLocation, useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { categoriesAPI } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Home, 
  Clock, 
  TrendingUp, 
  Users, 
  Heart, 
  ChefHat, 
  Bell,
  Loader2
} from "lucide-react";

const navItems = [
  { icon: Home, label: "Accueil", href: "/", filter: null },
  { icon: Clock, label: "Récentes", href: "/", filter: "recent" },
  { icon: TrendingUp, label: "Populaires", href: "/", filter: "popular" },
  { icon: Users, label: "Suivis", href: "/", filter: "following" },
  { icon: Heart, label: "Favoris", href: "/", filter: "favorites" },
  { icon: ChefHat, label: "Mes Recettes", href: "/my-recipes", filter: null },
  { icon: Bell, label: "Notifications", href: "/notifications", filter: null },
];

export const CategorySidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await categoriesAPI.getAll();
      if (data.success && data.data) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error("Error loading categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNavClick = (e: React.MouseEvent, item: typeof navItems[0]) => {
    // For items with href (like /my-recipes, /notifications), let Link handle navigation
    if (!item.filter && item.href !== '/') {
      return; // Let Link handle it
    }
    
    // For items with filters or home, prevent default and set search params
    e.preventDefault();
    if (item.filter) {
      const params = new URLSearchParams();
      params.set('filter', item.filter);
      if (location.pathname !== '/') {
        navigate(`/?${params.toString()}`);
      } else {
        setSearchParams(params);
      }
    } else {
      if (location.pathname !== '/') {
        navigate('/');
      } else {
        setSearchParams({});
      }
    }
  };

  const handleCategoryClick = (categorySlug: string) => {
    const params = new URLSearchParams();
    params.set('category', categorySlug);
    if (location.pathname !== '/') {
      navigate(`/?${params.toString()}`);
    } else {
      setSearchParams(params);
    }
  };

  const currentFilter = searchParams.get('filter');
  const currentCategory = searchParams.get('category');

  return (
    <aside className="sticky top-20 h-[calc(100vh-6rem)] w-64 flex-shrink-0 border-r border-border bg-card p-4 overflow-y-auto">
      <nav className="space-y-6">
        <div>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Navigation
          </h2>
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.filter 
                ? currentFilter === item.filter
                : location.pathname === item.href;
              
              // Hide some items if not authenticated
              if (!isAuthenticated && (item.filter === 'following' || item.filter === 'favorites' || item.href === '/my-recipes')) {
                return null;
              }

              // For items with direct href (like /my-recipes, /notifications), use Link
              if (!item.filter && item.href !== '/') {
                return (
                  <Link
                    key={item.href + (item.filter || '')}
                    to={item.href}
                  >
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start",
                        isActive && "bg-secondary text-secondary-foreground font-medium"
                      )}
                    >
                      <Icon className="mr-3 h-5 w-5" />
                      {item.label}
                    </Button>
                  </Link>
                );
              }

              // For items with filters or home, use Button with onClick
              return (
                <Button
                  key={item.href + (item.filter || '')}
                  variant="ghost"
                  onClick={(e) => handleNavClick(e, item)}
                  className={cn(
                    "w-full justify-start",
                    isActive && "bg-secondary text-secondary-foreground font-medium"
                  )}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.label}
                </Button>
              );
            })}
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Catégories
          </h2>
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-1">
              {categories.length === 0 ? (
                <p className="text-sm text-muted-foreground p-2">
                  Aucune catégorie disponible
                </p>
              ) : (
                categories.map((category) => {
                  const isActive = currentCategory === category.slug;
                  return (
                    <Button
                      key={category._id || category.id}
                      variant="ghost"
                      onClick={() => handleCategoryClick(category.slug)}
                      className={cn(
                        "w-full justify-start",
                        isActive && "bg-secondary text-secondary-foreground font-medium"
                      )}
                    >
                      {category.name}
                    </Button>
                  );
                })
              )}
            </div>
          )}
        </div>
      </nav>
    </aside>
  );
};
