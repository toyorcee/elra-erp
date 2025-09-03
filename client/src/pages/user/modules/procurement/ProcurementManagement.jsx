import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../../context/AuthContext";

const ProcurementManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Access control - only Manager+ can access
  if (!user || user.role.level < 600) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Access Denied
          </h2>
          <p className="text-gray-600">
            You don't have permission to access Procurement Management.
          </p>
        </div>
      </div>
    );
  }

  // Redirect to Purchase Orders (main functionality)
  useEffect(() => {
    navigate("/dashboard/modules/procurement/orders", { replace: true });
  }, [navigate]);

  // Loading state while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--elra-primary)]"></div>
    </div>
  );
};

export default ProcurementManagement;