import React, { createContext, useContext, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  getModuleSidebarConfig,
  moduleExists,
  getModuleNavigationForRole,
} from "../config/moduleSidebarConfig";
import { useAuth } from "./AuthContext";

const DynamicSidebarContext = createContext();

export const useDynamicSidebar = () => {
  const context = useContext(DynamicSidebarContext);
  if (!context) {
    throw new Error(
      "useDynamicSidebar must be used within a DynamicSidebarProvider"
    );
  }
  return context;
};

export const DynamicSidebarProvider = ({ children }) => {
  const location = useLocation();
  const { user } = useAuth();
  const [currentModule, setCurrentModule] = useState(null);
  const [moduleSidebarItems, setModuleSidebarItems] = useState([]);
  const [isModuleView, setIsModuleView] = useState(false);
  const [isModuleLoading, setIsModuleLoading] = useState(false);
  const [previousModule, setPreviousModule] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Get user role level for filtering
  const getUserRoleLevel = () => {
    if (!user) return 300;

    const roleValue = user.role?.name || user.role;

    switch (roleValue) {
      case "SUPER_ADMIN":
        return 1000;
      case "HOD":
        return 700;
      case "MANAGER":
        return 600;
      case "STAFF":
        return 300;
      case "VIEWER":
        return 100;
      default:
        return 300;
    }
  };

  const startModuleLoading = () => {
    setIsModuleLoading(true);
  };

  const stopModuleLoading = () => {
    setIsModuleLoading(false);
  };

  useEffect(() => {
    if (!user) return;

    const pathSegments = location.pathname.split("/");
    const moduleIndex = pathSegments.findIndex(
      (segment) => segment === "modules"
    );

    if (moduleIndex !== -1 && pathSegments[moduleIndex + 1]) {
      const moduleKey = pathSegments[moduleIndex + 1];

      let normalizedModuleKey = moduleKey;
      if (moduleKey.includes("_")) {
        normalizedModuleKey = moduleKey.replace(/_/g, "-");
      }

      const configKey = normalizedModuleKey.replace(/-([a-z])/g, (g) =>
        g[1].toUpperCase()
      );

      if (moduleExists(configKey)) {
        if (currentModule !== normalizedModuleKey) {
          setPreviousModule(currentModule);

          if (!isInitialLoad) {
            startModuleLoading();
          }

          // Immediate module switching for instant response
          setCurrentModule(normalizedModuleKey);
          setIsModuleView(true);

          const moduleConfig = getModuleSidebarConfig(configKey);
          if (moduleConfig) {
            const roleLevel = getUserRoleLevel();
            const userDepartment = user?.department?.name;
            const filteredSections = getModuleNavigationForRole(
              configKey,
              roleLevel,
              userDepartment,
              user
            );
            setModuleSidebarItems(filteredSections);
          }

          if (!isInitialLoad) {
            stopModuleLoading();
          }
        }
      } else {
        setCurrentModule(null);
        setIsModuleView(false);
        setModuleSidebarItems([]);
      }
    } else {
      if (currentModule !== null) {
        setPreviousModule(currentModule);

        if (!isInitialLoad) {
          startModuleLoading();
        }

        setCurrentModule(null);
        setIsModuleView(false);
        setModuleSidebarItems([]);

        if (!isInitialLoad) {
          stopModuleLoading();
        }
      }
    }

    if (isInitialLoad) {
      setIsInitialLoad(false);
    }
  }, [location.pathname, currentModule, isInitialLoad, user]);

  const getCurrentModuleInfo = () => {
    if (!currentModule) return null;
    const configKey = currentModule.replace(/-([a-z])/g, (g) =>
      g[1].toUpperCase()
    );
    return getModuleSidebarConfig(configKey);
  };

  const isInModuleView = () => {
    return isModuleView && currentModule !== null;
  };

  const getModuleNavigationItems = () => {
    return moduleSidebarItems;
  };

  const switchToModule = (moduleKey) => {
    const configKey = moduleKey.replace(/-([a-z])/g, (g) => g[1].toUpperCase());

    if (moduleExists(configKey)) {
      setPreviousModule(currentModule);
      startModuleLoading();

      setCurrentModule(moduleKey);
      setIsModuleView(true);

      const moduleConfig = getModuleSidebarConfig(configKey);
      if (moduleConfig) {
        const roleLevel = getUserRoleLevel();
        const userDepartment = user?.department?.name;
        const filteredSections = getModuleNavigationForRole(
          configKey,
          roleLevel,
          userDepartment,
          user
        );
        setModuleSidebarItems(filteredSections);
      }

      stopModuleLoading();
    }
  };

  const returnToMainDashboard = () => {
    setPreviousModule(currentModule);
    startModuleLoading();

    // Immediate state update for better UX
    setCurrentModule(null);
    setIsModuleView(false);
    setModuleSidebarItems([]);
    stopModuleLoading();
  };

  const value = {
    currentModule,
    moduleSidebarItems,
    isModuleView,
    isModuleLoading,
    previousModule,
    isInModuleView,
    getCurrentModuleInfo,
    getModuleNavigationItems,
    switchToModule,
    returnToMainDashboard,
    startModuleLoading,
    stopModuleLoading,
  };

  return (
    <DynamicSidebarContext.Provider value={value}>
      {children}
    </DynamicSidebarContext.Provider>
  );
};
