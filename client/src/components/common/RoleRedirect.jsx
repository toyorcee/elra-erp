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

      // Platform Admin (level 110+) - redirect to platform dashboard
      if (user.role?.level >= 110) {
        if (!location.pathname.startsWith("/platform-admin")) {
          console.log(
            "🚀 RoleRedirect: Redirecting Platform Admin to /platform-admin/dashboard"
          );
          navigate("/platform-admin/dashboard");
        } else {
          console.log(
            "✅ RoleRedirect: Platform Admin already on correct route"
          );
        }
      }
      // Super Admin (level 100+) - redirect to admin dashboard
      else if (user.role?.level >= 100) {
        if (location.pathname !== "/admin/dashboard") {
          console.log(
            "🚀 RoleRedirect: Redirecting Super Admin to /admin/dashboard"
          );
          navigate("/admin/dashboard");
        } else {
          console.log("✅ RoleRedirect: Super Admin already on correct route");
        }
      }
      // Admin (level 90+) - redirect to admin dashboard
      else if (user.role?.level >= 90) {
        if (location.pathname !== "/admin/dashboard") {
          console.log("🚀 RoleRedirect: Redirecting Admin to /admin/dashboard");
          navigate("/admin/dashboard");
        } else {
          console.log("✅ RoleRedirect: Admin already on correct route");
        }
      }
      // Regular users - redirect to user dashboard
      else {
        if (location.pathname !== "/dashboard") {
          console.log("🚀 RoleRedirect: Redirecting User to /dashboard");
          navigate("/dashboard");
        } else {
          console.log("✅ RoleRedirect: User already on correct route");
        }
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
