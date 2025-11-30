import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PublicRoute } from "@/components/PublicRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CreateRecipe from "./pages/CreateRecipe";
import Profile from "./pages/Profile";
import Search from "./pages/Search";
import RecipeDetail from "./pages/RecipeDetail";
import MyRecipes from "./pages/MyRecipes";
import Notifications from "./pages/Notifications";
import NotFound from "./pages/NotFound";
import FirestoreTest from "@/components/FirestoreTest";

// Inside your App/Home JSX, for example under the main title: <FirestoreTest />


const queryClient = new QueryClient();

// Wrapper components for routes
const ProtectedIndex = () => <ProtectedRoute><Index /></ProtectedRoute>;
const ProtectedCreateRecipe = () => <ProtectedRoute><CreateRecipe /></ProtectedRoute>;
const ProtectedProfile = () => <ProtectedRoute><Profile /></ProtectedRoute>;
const ProtectedProfileId = () => <ProtectedRoute><Profile /></ProtectedRoute>;
const ProtectedSearch = () => <ProtectedRoute><Search /></ProtectedRoute>;
const ProtectedRecipeDetail = () => <ProtectedRoute><RecipeDetail /></ProtectedRoute>;
const ProtectedMyRecipes = () => <ProtectedRoute><MyRecipes /></ProtectedRoute>;
const ProtectedNotifications = () => <ProtectedRoute><Notifications /></ProtectedRoute>;
const PublicLogin = () => <PublicRoute><Login /></PublicRoute>;
const PublicRegister = () => <PublicRoute><Register /></PublicRoute>;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <Routes>
              {/* Routes publiques - redirigent vers / si déjà connecté */}
              <Route path="/login" element={<PublicLogin />} />
              <Route path="/register" element={<PublicRegister />} />
              
              {/* Routes protégées - redirigent vers /login si non connecté */}
              <Route path="/" element={<ProtectedIndex />} />
              <Route path="/create" element={<ProtectedCreateRecipe />} />
              <Route path="/profile" element={<ProtectedProfile />} />
              <Route path="/profile/:id" element={<ProtectedProfileId />} />
              <Route path="/search" element={<ProtectedSearch />} />
              <Route path="/recipe/:id" element={<ProtectedRecipeDetail />} />
              <Route path="/my-recipes" element={<ProtectedMyRecipes />} />
              <Route path="/notifications" element={<ProtectedNotifications />} />
              
              {/* Route par défaut - redirige vers /login si non connecté, sinon vers / */}
              <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
