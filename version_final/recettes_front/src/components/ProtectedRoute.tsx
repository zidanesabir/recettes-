// Protects routes that require authentication
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ReactNode } from "react";

// Define the props expected by the ProtectedRoute component
interface ProtectedRouteProps {
  children: ReactNode; // React elements to render if user is authenticated
}

// Component that restricts access to authenticated users only
export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  // Retrieve authentication status and loading state from context
  const { isAuthenticated, loading } = useAuth();

  // While authentication status is still loading, show a simple spinner
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If the user is not authenticated, redirect to the login page
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If authenticated, render the protected child components
  return <>{children}</>;
};

// Export the component as default for easy import elsewhere
export default ProtectedRoute;


