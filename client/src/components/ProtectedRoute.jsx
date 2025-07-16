import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import GradientSpinner from "./common/GradientSpinner";

const ProtectedRoute = ({ children, required }) => {
  const { user, isAuthenticated, loading, initialized } = useAuth();

  if (!initialized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-cyan-900">
        <GradientSpinner
          size="xl"
          variant="secondary"
          text="Initializing your dashboard..."
          showText={true}
        />
      </div>
    );
  }

  // Check role requirements if specified
  if (required) {
    if (required.minLevel && user?.role?.level < required.minLevel)
      return <Navigate to="/unauthorized" />;
    if (
      required.permission &&
      !user?.permissions?.includes(required.permission)
    )
      return <Navigate to="/unauthorized" />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
