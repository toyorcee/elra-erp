import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import GradientSpinner from "./GradientSpinner";

const RoleRedirect = () => {
  const { user, loading, initialized } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (initialized && !loading && user) {
      console.log("🔄 RoleRedirect: User role level:", user.role?.level);
      console.log("🔄 RoleRedirect: Current path:", location.pathname);

      // All users go to module selector
      if (!location.pathname.startsWith("/modules")) {
        console.log("🚀 RoleRedirect: Redirecting User to /modules");
        navigate("/modules");
      } else {
        console.log("✅ RoleRedirect: User already on correct route");
      }
    }
  }, [user, loading, initialized, navigate, location.pathname]);

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

  if (!user) {
    navigate("/");
    return null;
  }

  return null;
};

export default RoleRedirect;
