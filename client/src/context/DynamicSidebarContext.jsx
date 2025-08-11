import React, { createContext, useContext, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  getModuleSidebarConfig,
  moduleExists,
} from "../config/moduleSidebarConfig";

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
  const [currentModule, setCurrentModule] = useState(null);
  const [moduleSidebarItems, setModuleSidebarItems] = useState([]);
  const [isModuleView, setIsModuleView] = useState(false);
  const [isModuleLoading, setIsModuleLoading] = useState(false);
  const [previousModule, setPreviousModule] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const startModuleLoading = () => {
    setIsModuleLoading(true);
  };

  const stopModuleLoading = () => {
    setTimeout(() => {
      setIsModuleLoading(false);
    }, 1000);
  };

  useEffect(() => {
    const pathSegments = location.pathname.split("/");
    const moduleIndex = pathSegments.findIndex(
      (segment) => segment === "modules"
    );

    if (moduleIndex !== -1 && pathSegments[moduleIndex + 1]) {
      const moduleKey = pathSegments[moduleIndex + 1];

      if (moduleExists(moduleKey)) {
        if (currentModule !== moduleKey) {
          setPreviousModule(currentModule);

          if (!isInitialLoad) {
            startModuleLoading();
          }

          setTimeout(
            () => {
              setCurrentModule(moduleKey);
              setIsModuleView(true);

              const moduleConfig = getModuleSidebarConfig(moduleKey);
              if (moduleConfig) {
                setModuleSidebarItems(moduleConfig.sections || []);
              }

              if (!isInitialLoad) {
                stopModuleLoading();
              }
            },
            isInitialLoad ? 0 : 500
          );
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

        setTimeout(
          () => {
            setCurrentModule(null);
            setIsModuleView(false);
            setModuleSidebarItems([]);

            if (!isInitialLoad) {
              stopModuleLoading();
            }
          },
          isInitialLoad ? 0 : 500
        );
      }
    }

    if (isInitialLoad) {
      setIsInitialLoad(false);
    }
  }, [location.pathname, currentModule, isInitialLoad]);

  const getCurrentModuleInfo = () => {
    if (!currentModule) return null;
    return getModuleSidebarConfig(currentModule);
  };

  const isInModuleView = () => {
    return isModuleView && currentModule !== null;
  };

  const getModuleNavigationItems = () => {
    return moduleSidebarItems;
  };

  const switchToModule = (moduleKey) => {
    if (moduleExists(moduleKey)) {
      setPreviousModule(currentModule);
      startModuleLoading();

      setTimeout(() => {
        setCurrentModule(moduleKey);
        setIsModuleView(true);

        const moduleConfig = getModuleSidebarConfig(moduleKey);
        if (moduleConfig) {
          setModuleSidebarItems(moduleConfig.sections || []);
        }

        stopModuleLoading();
      }, 500);
    }
  };

  const returnToMainDashboard = () => {
    setPreviousModule(currentModule);
    startModuleLoading();

    setTimeout(() => {
      setCurrentModule(null);
      setIsModuleView(false);
      setModuleSidebarItems([]);
      stopModuleLoading();
    }, 500);
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

export default DynamicSidebarContext;
