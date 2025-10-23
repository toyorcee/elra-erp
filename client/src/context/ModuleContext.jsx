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

  const fetchUserModules = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await userModulesAPI.getUserModules();
      const transformedModules = userModulesAPI.transformModules(response.data);

      setModules(transformedModules);
      setIsInitialized(true);

      console.log(
        "✅ [ModuleContext] Loaded",
        transformedModules.length,
        "modules"
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

  const getModuleByCode = useCallback(
    (code) => {
      return modules.find((module) => module.code === code);
    },
    [modules]
  );

  const hasModuleAccess = useCallback(
    (moduleCode) => {
      return modules.some((module) => module.code === moduleCode);
    },
    [modules]
  );

  const getModulesByCategory = useCallback(
    (category) => {
      return modules.filter((module) => module.category === category);
    },
    [modules]
  );

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
