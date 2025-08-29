import { useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";

export const useDebouncedNavigation = (delay = 300) => {
  const navigate = useNavigate();
  const lastNavigationTime = useRef(0);
  const isNavigating = useRef(false);

  const debouncedNavigate = useCallback(
    (path, options = {}) => {
      const now = Date.now();

      // Prevent rapid successive navigations
      if (now - lastNavigationTime.current < delay || isNavigating.current) {
        return;
      }

      isNavigating.current = true;
      lastNavigationTime.current = now;

      // Navigate immediately for better UX
      navigate(path, options);

      // Reset the flag after a short delay
      setTimeout(() => {
        isNavigating.current = false;
      }, 100);
    },
    [navigate, delay]
  );

  return debouncedNavigate;
};
