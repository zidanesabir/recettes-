import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Bell, User, Plus, Search, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { notificationsAPI } from "@/services/api";
import { useEffect, useState } from "react";
import logo from "@/assets/logo.png";

export const Header = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isAuthenticated) {
      loadUnreadCount();
      // Refresh count every 30 seconds
      const interval = setInterval(loadUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const loadUnreadCount = async () => {
    try {
      const data = await notificationsAPI.getUnreadCount();
      if (data && data.success) {
        setUnreadCount(data.count || 0);
      }
    } catch (error) {
      console.error("Error loading unread count:", error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card shadow-soft">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="RecettesCloud" className="h-10 w-10" />
          <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            RecettesCloud
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/search">
              <Search className="h-5 w-5" />
            </Link>
          </Button>
          
          {isAuthenticated ? (
            <>
              <Button variant="ghost" size="icon" asChild className="relative">
                <Link to="/notifications">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
              </Button>

              <Button className="bg-gradient-primary" asChild>
                <Link to="/create">
                  <Plus className="h-5 w-5 mr-2" />
                  Créer une recette
                </Link>
              </Button>

              <Button variant="ghost" size="icon" asChild>
                <Link to="/profile">
                  <User className="h-5 w-5" />
                </Link>
              </Button>

              <Button variant="ghost" size="icon" onClick={handleLogout} title="Déconnexion">
                <LogOut className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" asChild>
                <Link to="/login">Se connecter</Link>
              </Button>
              <Button className="bg-gradient-primary" asChild>
                <Link to="/register">S'inscrire</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
