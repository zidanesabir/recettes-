import { Header } from "@/components/Header";
import { CategorySidebar } from "@/components/CategorySidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Heart, MessageCircle, Star, UserPlus, Loader2, CheckCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { notificationsAPI } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale/fr";

const Notifications = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    } else {
      loadNotifications();
      loadUnreadCount();
    }
  }, [isAuthenticated, navigate]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setNotifications([]);
      const data = await notificationsAPI.getAll({ limit: 50 });
      console.log('Notifications response:', data);
      if (data && data.success && data.data) {
        const normalized = (Array.isArray(data.data) ? data.data : []).map((n: any) => ({
          id: n.id || n._id,
          message: n.message || "",
          type: n.type || "generic",
          createdAt: n.createdAt,
          isRead: n.read ?? n.isRead ?? false,
        }));
        setNotifications(normalized);
        setUnreadCount(data.unreadCount ?? normalized.filter((n) => !n.isRead).length);
      } else {
        setNotifications([]);
        setUnreadCount(0);
        console.log('No notifications found or invalid response:', data);
      }
    } catch (error: any) {
      console.error('Error loading notifications:', error);
      setNotifications([]);
      setUnreadCount(0);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de charger les notifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const data = await notificationsAPI.getUnreadCount();
      if (data && data.success) {
        setUnreadCount(data.count || 0);
      }
    } catch (error) {
      console.error("Error loading unread count:", error);
      setUnreadCount(0);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsAPI.markAsRead(id);
      setNotifications((prev) =>
        prev.map((notif) =>
          (notif.id === id || notif._id === id) ? { ...notif, isRead: true } : notif
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de marquer la notification comme lue",
        variant: "destructive",
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, isRead: true }))
      );
      setUnreadCount(0);
      toast({
        title: "Succès",
        description: "Toutes les notifications ont été marquées comme lues",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de marquer toutes les notifications comme lues",
        variant: "destructive",
      });
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'recipe_like':
        return Heart;
      case 'recipe_comment':
      case 'comment_reply':
        return MessageCircle;
      case 'recipe_favorite':
        return Heart;
      case 'new_follower':
        return UserPlus;
      default:
        return Bell;
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'recipe_like':
        return 'text-red-500';
      case 'recipe_comment':
      case 'comment_reply':
        return 'text-blue-500';
      case 'recipe_favorite':
        return 'text-yellow-500';
      case 'new_follower':
        return 'text-green-500';
      default:
        return 'text-muted-foreground';
    }
  };

  const formatTime = (date: any) => {
    try {
      if (!date) return "";
      if (date.seconds || date._seconds) {
        const ms =
          (date.seconds ?? date._seconds) * 1000 +
          Math.floor((date.nanoseconds ?? date._nanoseconds ?? 0) / 1e6);
        return formatDistanceToNow(new Date(ms), { addSuffix: true, locale: fr });
      }
      return formatDistanceToNow(new Date(date), { addSuffix: true, locale: fr });
    } catch {
      return date;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <CategorySidebar />
        <main className="flex-1 p-8">
          <h1 className="text-3xl font-bold mb-6">Notifications</h1>
          
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Mes notifications
                  {unreadCount > 0 && (
                    <span className="ml-2 px-2 py-1 text-xs font-semibold rounded-full bg-primary text-primary-foreground">
                      {unreadCount}
                    </span>
                  )}
                </CardTitle>
                {unreadCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                  >
                    <CheckCheck className="mr-2 h-4 w-4" />
                    Tout marquer comme lu
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Aucune notification</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {notifications.map((notification) => {
                    const Icon = getIcon(notification.type);
                    const iconColor = getIconColor(notification.type);
                    
                    return (
                      <div
                        key={notification._id || notification.id}
                        className={`flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${
                          !notification.isRead
                            ? 'bg-primary/5 border-primary/20'
                            : 'bg-muted/50 border-border'
                        }`}
                        onClick={() => !notification.isRead && handleMarkAsRead(notification._id || notification.id)}
                      >
                        <div className={`p-2 rounded-full bg-muted ${iconColor}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{notification.message}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {formatTime(notification.createdAt)}
                          </p>
                        </div>
                        {!notification.isRead && (
                          <div className="h-2 w-2 rounded-full bg-primary mt-2"></div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default Notifications;
