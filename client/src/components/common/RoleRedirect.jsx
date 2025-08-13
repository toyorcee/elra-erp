import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

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

  // Don't show loading spinner here - let ProtectedRoute handle it
  if (!initialized || loading || !user) {
    return null;
  }

  return null;
};

export default RoleRedirect;
