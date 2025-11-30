import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RecipeCard } from "@/components/RecipeCard";
import { useAuth } from "@/contexts/AuthContext";
import { usersAPI, recipesAPI } from "@/services/api";
import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { uploadImage } from "@/utils/uploadImage";


const Profile = () => {
  const { user: currentUser } = useAuth();
  const { id } = useParams();
  const [profileUser, setProfileUser] = useState<any>(null);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowingLoading, setIsFollowingLoading] = useState(false);
  const { toast } = useToast();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);


  const userId = id || currentUser?.uid || currentUser?.id || currentUser?._id;

  useEffect(() => {
    if (userId) {
      loadProfile();
      loadUserRecipes();
    } else {
      setLoading(false);
    }
  }, [userId, id]);
  
  // Check follow status when profile user is loaded
  useEffect(() => {
    if (profileUser && currentUser) {
      checkFollowStatus();
    }
  }, [profileUser, currentUser]);
  
  const checkFollowStatus = async () => {
    if (!currentUser || !profileUser) return;
    
    const currentUserId = currentUser.uid || currentUser.id || currentUser._id;
    const profileUserId = profileUser._id || profileUser.id;
    
    // Don't check if it's own profile
    if (currentUserId?.toString() === profileUserId?.toString()) {
      setIsFollowing(false);
      return;
    }
    
    try {
      // Get current user's following list
      const followingData = await usersAPI.getFollowing(currentUserId!);
      if (followingData.success && followingData.data) {
        const isFollowingUser = followingData.data.some(
          (followed: any) => {
            const followedId = followed._id || followed.id || followed;
            return followedId.toString() === profileUserId?.toString();
          }
        );
        setIsFollowing(isFollowingUser);
      }
    } catch (error) {
      console.error("Error checking follow status:", error);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  try {
    setUploadingAvatar(true);
    const url = await uploadImage(file, "avatars");

    // Update user in DB
    const updated = await usersAPI.update(userId, { avatar: url });

    if (updated.success) {
      toast({ title: "Photo mise à jour !" });
      setProfileUser((prev: any) => ({ ...prev, avatar: url }));
    }
  } catch (e) {
    toast({ title: "Erreur", description: "Impossible de changer l'avatar", variant: "destructive" });
  } finally {
    setUploadingAvatar(false);
  }
};


  const loadProfile = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const data = await usersAPI.getById(userId);
      if (data.success) {
        setProfileUser(data.data);
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de charger le profil",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUserRecipes = async () => {
    if (!userId) return;
    try {
      const data = await recipesAPI.getUserRecipes(userId);
      if (data.success) {
        setRecipes(data.data);
      }
    } catch (error) {
      console.error("Error loading user recipes:", error);
    }
  };

  const handleToggleFollow = async () => {
    if (!userId || !currentUser) return;
    
    try {
      setIsFollowingLoading(true);
      const data = await usersAPI.toggleFollow(userId);
      if (data.success) {
        setIsFollowing(data.isFollowing);
        // Reload profile to update followers count
        await loadProfile();
        toast({
          title: "Succès",
          description: data.isFollowing 
            ? "Vous suivez maintenant cet utilisateur" 
            : "Vous ne suivez plus cet utilisateur",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de modifier le suivi",
        variant: "destructive",
      });
    } finally {
      setIsFollowingLoading(false);
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

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container max-w-6xl mx-auto py-8 px-4">
          <p className="text-center text-muted-foreground">Profil non trouvé</p>
        </div>
      </div>
    );
  }

  const isOwnProfile =
    !!currentUser &&
    (currentUser.uid || currentUser.id || currentUser._id) === (profileUser?._id || profileUser?.id);

  const formattedCreatedAt = () => {
    const ts = profileUser?.createdAt;
    if (!ts) return "";
    try {
      if (ts.seconds || ts._seconds) {
        const ms =
          (ts.seconds ?? ts._seconds) * 1000 +
          Math.floor((ts.nanoseconds ?? ts._nanoseconds ?? 0) / 1e6);
        return new Date(ms).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
      }
      return new Date(ts).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
    } catch {
      return "";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="relative w-32 h-32 mx-auto mb-4">
                  <Avatar className="w-32 h-32 border-4 border-primary/20">
                    <AvatarImage src={profileUser.avatar} />
                    <AvatarFallback className="text-2xl">
                      {profileUser.username?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  {isOwnProfile && (
                    <label className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full cursor-pointer hover:bg-primary/80 text-xs">
                      <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                      {uploadingAvatar ? "..." : "✏️"}
                    </label>
                  )}
                </div>
                <h1 className="text-2xl font-bold mb-1">{profileUser.username}</h1>
                <p className="text-muted-foreground mb-4">
                  @{profileUser.username} • Membre depuis{" "}
                  {formattedCreatedAt()}
                </p>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-2xl font-bold text-primary">{recipes.length}</p>
                    <p className="text-sm text-muted-foreground">Recettes</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">
                      {profileUser.favorites?.length || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Favoris</p>
                  </div>
                </div>

                {isOwnProfile ? (
                  <Button className="w-full" variant="outline">
                    Modifier le profil
                  </Button>
                ) : (
                  <Button 
                    className="w-full bg-gradient-primary" 
                    onClick={handleToggleFollow}
                    disabled={isFollowingLoading}
                  >
                    {isFollowingLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {isFollowing ? "Ne plus suivre..." : "Suivre..."}
                      </>
                    ) : (
                      isFollowing ? "Ne plus suivre" : "Suivre"
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>

            {profileUser.bio && (
              <Card>
                <CardHeader>
                  <CardTitle>À propos</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{profileUser.bio}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Recipes */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold mb-6">
              {isOwnProfile ? "Mes recettes" : `Recettes de ${profileUser.username}`}
            </h2>
            {recipes.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Aucune recette publiée</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

export default Profile;
