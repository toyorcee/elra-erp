import { useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";

export const useModulePreloader = () => {
  const { user } = useAuth();
  const preloadedModules = useRef(new Set());

  useEffect(() => {
    if (!user) return;

    // Preload module data in the background
    const preloadModules = async () => {
      try {
        // Preload common module data
        const modulesToPreload = [
          "projects",
          "tasks",
          "finance",
          "hr",
          "self-service",
        ];

        for (const module of modulesToPreload) {
          if (!preloadedModules.current.has(module)) {
            // Preload module data without blocking UI
            preloadedModules.current.add(module);

            // You can add specific preloading logic here
            // For example, prefetching API calls or loading module configs
            console.log(`🔄 Preloading module: ${module}`);
          }
        }
      } catch (error) {
        console.error("Error preloading modules:", error);
      }
    };

    // Preload modules after a short delay to not block initial render
    const timeoutId = setTimeout(preloadModules, 100);

    return () => clearTimeout(timeoutId);
  }, [user]);

  return {
    isModulePreloaded: (moduleName) => preloadedModules.current.has(moduleName),
    preloadedModules: Array.from(preloadedModules.current),
  };
};
