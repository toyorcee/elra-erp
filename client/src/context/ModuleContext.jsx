import React, { createContext, useContext, useState, useCallback } from "react";
import { userModulesAPI } from "../services/userModules.js";

const ModuleContext = createContext();

export const useModuleContext = () => {
  const context = useContext(ModuleContext);
  if (!context) {
    throw new Error("useModuleContext must be used within a ModuleProvider");
  }
  return context;
};

export const ModuleProvider = ({ children }) => {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Fetch user modules and store them in context
  const fetchUserModules = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("🔍 [ModuleContext] Fetching user modules...");

      const response = await userModulesAPI.getUserModules();
      console.log("✅ [ModuleContext] API response:", response);
      console.log("✅ [ModuleContext] API response.data:", response.data);
      console.log(
        "✅ [ModuleContext] API response.data type:",
        typeof response.data
      );
      console.log(
        "✅ [ModuleContext] API response.data length:",
        response.data?.length
      );

      const transformedModules = userModulesAPI.transformModules(response.data);
      console.log(
        "✅ [ModuleContext] Transformed modules:",
        transformedModules
      );
      console.log(
        "✅ [ModuleContext] Transformed modules type:",
        typeof transformedModules
      );
      console.log(
        "✅ [ModuleContext] Transformed modules length:",
        transformedModules?.length
      );

      // Log first module structure if available
      if (transformedModules && transformedModules.length > 0) {
        console.log(
          "🔍 [ModuleContext] First module structure:",
          transformedModules[0]
        );
        console.log(
          "🔍 [ModuleContext] First module keys:",
          Object.keys(transformedModules[0])
        );
      }

      setModules(transformedModules);
      setIsInitialized(true);

      console.log(
        "✅ [ModuleContext] Modules stored in context:",
        transformedModules.length
      );

      return transformedModules;
    } catch (error) {
      console.error("❌ [ModuleContext] Error fetching modules:", error);
      setError(error.message);
      setModules([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Get a specific module by code
  const getModuleByCode = useCallback(
    (code) => {
      return modules.find((module) => module.code === code);
    },
    [modules]
  );

  // Check if user has access to a specific module
  const hasModuleAccess = useCallback(
    (moduleCode) => {
      return modules.some((module) => module.code === moduleCode);
    },
    [modules]
  );

  // Get modules by category/type
  const getModulesByCategory = useCallback(
    (category) => {
      return modules.filter((module) => module.category === category);
    },
    [modules]
  );

  // Clear modules (useful for logout)
  const clearModules = useCallback(() => {
    setModules([]);
    setIsInitialized(false);
    setError(null);
  }, []);

  const value = {
    modules,
    loading,
    error,
    isInitialized,
    fetchUserModules,
    getModuleByCode,
    hasModuleAccess,
    getModulesByCategory,
    clearModules,
  };

  return (
    <ModuleContext.Provider value={value}>{children}</ModuleContext.Provider>
  );
};
