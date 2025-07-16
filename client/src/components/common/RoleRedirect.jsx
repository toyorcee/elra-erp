import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import GradientSpinner from "./GradientSpinner";

const RoleRedirect = () => {
  const { user, loading, initialized } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (initialized && !loading && user) {
      // Super Admin (level 100+) - redirect to admin dashboard
      if (user.role?.level >= 100) {
        navigate("/admin");
      }
      // Admin (level 90+) - redirect to admin dashboard
      else if (user.role?.level >= 90) {
        navigate("/admin");
      }
      // Regular users - redirect to user dashboard
      else {
        navigate("/dashboard");
      }
    }
  }, [user, loading, initialized, navigate]);

  if (!initialized || loading) {
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

  return null;
};

export default RoleRedirect;
