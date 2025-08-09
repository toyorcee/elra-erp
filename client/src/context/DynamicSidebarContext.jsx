import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getModuleSidebarConfig, moduleExists } from '../config/moduleSidebarConfig';

const DynamicSidebarContext = createContext();

export const useDynamicSidebar = () => {
  const context = useContext(DynamicSidebarContext);
  if (!context) {
    throw new Error('useDynamicSidebar must be used within a DynamicSidebarProvider');
  }
  return context;
};

export const DynamicSidebarProvider = ({ children }) => {
  const location = useLocation();
  const [currentModule, setCurrentModule] = useState(null);
  const [moduleSidebarItems, setModuleSidebarItems] = useState([]);
  const [isModuleView, setIsModuleView] = useState(false);

  // Detect current module from URL
  useEffect(() => {
    const pathSegments = location.pathname.split('/');
    const moduleIndex = pathSegments.findIndex(segment => segment === 'modules');
    
    if (moduleIndex !== -1 && pathSegments[moduleIndex + 1]) {
      const moduleKey = pathSegments[moduleIndex + 1];
      
      if (moduleExists(moduleKey)) {
        setCurrentModule(moduleKey);
        setIsModuleView(true);
        
        // Get module-specific sidebar configuration
        const moduleConfig = getModuleSidebarConfig(moduleKey);
        if (moduleConfig) {
          setModuleSidebarItems(moduleConfig.sections || []);
        }
      } else {
        setCurrentModule(null);
        setIsModuleView(false);
        setModuleSidebarItems([]);
      }
    } else {
      // Not in a module - show main dashboard sidebar
      setCurrentModule(null);
      setIsModuleView(false);
      setModuleSidebarItems([]);
    }
  }, [location.pathname]);

  // Get current module info
  const getCurrentModuleInfo = () => {
    if (!currentModule) return null;
    return getModuleSidebarConfig(currentModule);
  };

  // Check if we're currently viewing a specific module
  const isInModuleView = () => {
    return isModuleView && currentModule !== null;
  };

  // Get module-specific navigation items
  const getModuleNavigationItems = () => {
    return moduleSidebarItems;
  };

  // Switch to a different module
  const switchToModule = (moduleKey) => {
    if (moduleExists(moduleKey)) {
      setCurrentModule(moduleKey);
      setIsModuleView(true);
      
      const moduleConfig = getModuleSidebarConfig(moduleKey);
      if (moduleConfig) {
        setModuleSidebarItems(moduleConfig.sections || []);
      }
    }
  };

  // Return to main dashboard view
  const returnToMainDashboard = () => {
    setCurrentModule(null);
    setIsModuleView(false);
    setModuleSidebarItems([]);
  };

  const value = {
    currentModule,
    moduleSidebarItems,
    isModuleView,
    isInModuleView,
    getCurrentModuleInfo,
    getModuleNavigationItems,
    switchToModule,
    returnToMainDashboard,
  };

  return (
    <DynamicSidebarContext.Provider value={value}>
      {children}
    </DynamicSidebarContext.Provider>
  );
};

export default DynamicSidebarContext;
