// Handles routes that should be accessible only to unauthenticated users
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ReactNode } from "react";

// Define the props expected by the PublicRoute component
interface PublicRouteProps {
  children: ReactNode; // The child components to render if the user is not authenticated
}

// Component that restricts access to unauthenticated users (e.g., login/register pages)
export const PublicRoute = ({ children }: PublicRouteProps) => {
  // Retrieve authentication status and loading state from context
  const { isAuthenticated, loading } = useAuth();

  // Display a loading spinner while authentication state is being determined
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If the user is already authenticated, redirect them to the home page
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // If not authenticated, render the public route content
  return <>{children}</>;
};

// Export the component as default for easy import across the app
export default PublicRoute;


