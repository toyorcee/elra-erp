import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import GradientSpinner from "./GradientSpinner";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, initialized } = useAuth();

  // Show loading spinner while checking authentication or not yet initialized
  if (loading || !initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-cyan-800 to-purple-900">
        <GradientSpinner
          size="xl"
          variant="secondary"
          text="Loading your dashboard..."
          showText={true}
        />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Render children if authenticated
  return children;
};

export default ProtectedRoute;
