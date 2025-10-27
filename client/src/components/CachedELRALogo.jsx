import React, { useState, useEffect, useRef } from "react";
import indexedDBService from "../services/indexedDBService.js";

const CachedELRALogo = ({ variant = "dark", className = "", size = "md" }) => {
  const [logoUrl, setLogoUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const mountedRef = useRef(true);

  const sizeClasses = {
    sm: "h-8 w-12",
    md: "h-12 w-16",
    lg: "h-16 w-20",
    xl: "h-20 w-24",
  };

  const LOGO_CACHE_KEY = "elra-logo-v2";
  const LOGO_SOURCE_URL = "/src/assets/elra-logo.png";

  useEffect(() => {
    let isMounted = true;

    const loadLogo = async () => {
      try {
        setIsLoading(true);
        setHasError(false);

        console.log("🔍 [CachedELRALogo] Checking cache for logo...");
        const cachedLogo = await indexedDBService.getAsset(LOGO_CACHE_KEY);

        if (cachedLogo && isMounted) {
          const cachedUrl = URL.createObjectURL(cachedLogo);
          setLogoUrl(cachedUrl);
          setIsLoading(false);
          console.log("✅ [CachedELRALogo] Logo loaded from cache");
          return;
        }

        // If not in cache, fetch from source
        console.log("📥 [CachedELRALogo] Fetching logo from source...");
        const response = await fetch(LOGO_SOURCE_URL);

        if (!response.ok) {
          throw new Error(`Failed to fetch logo: ${response.status}`);
        }

        const logoBlob = await response.blob();

        if (isMounted) {
          // Create object URL for immediate display
          const objectUrl = URL.createObjectURL(logoBlob);
          setLogoUrl(objectUrl);
          setIsLoading(false);

          // Cache the logo for future use (don't await to avoid blocking)
          indexedDBService
            .storeAsset(
              LOGO_CACHE_KEY,
              logoBlob,
              "logo",
              30 * 24 * 60 * 60 * 1000
            ) // 30 days
            .then(() => {
              console.log("✅ [CachedELRALogo] Logo cached successfully");
            })
            .catch((error) => {
              console.warn("⚠️ [CachedELRALogo] Failed to cache logo:", error);
            });
        }
      } catch (error) {
        console.error("❌ [CachedELRALogo] Error loading logo:", error);
        if (isMounted) {
          setHasError(true);
          setIsLoading(false);
        }
      }
    };

    loadLogo();

    // Cleanup function
    return () => {
      isMounted = false;
      mountedRef.current = false;
      // Clean up object URL to prevent memory leaks
      if (logoUrl) {
        URL.revokeObjectURL(logoUrl);
      }
    };
  }, []);

  // Cleanup object URL when component unmounts or logo changes
  useEffect(() => {
    return () => {
      if (logoUrl) {
        URL.revokeObjectURL(logoUrl);
      }
    };
  }, [logoUrl]);

  // Loading state
  if (isLoading) {
    return (
      <div className={`flex items-center ${className}`}>
        <div
          className={`relative ${sizeClasses[size]} flex items-center justify-center`}
        >
          <div className="animate-pulse bg-gray-200 rounded w-full h-full flex items-center justify-center">
            <div className="text-xs text-gray-400 font-medium">ELRA</div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (hasError) {
    return (
      <div className={`flex items-center ${className}`}>
        <div
          className={`relative ${sizeClasses[size]} flex items-center justify-center`}
        >
          <div className="bg-gray-100 rounded w-full h-full flex items-center justify-center border border-gray-200">
            <div className="text-xs text-gray-500 font-medium">ELRA</div>
          </div>
        </div>
      </div>
    );
  }

  // Success state with cached logo
  return (
    <div className={`flex items-center ${className}`}>
      <div
        className={`relative ${sizeClasses[size]} flex items-center justify-center`}
      >
        <img
          src={logoUrl}
          alt="ELRA Logo"
          className="w-full h-full object-contain"
          onLoad={() => {
            console.log("✅ [CachedELRALogo] Logo image loaded successfully");
          }}
          onError={() => {
            console.error("❌ [CachedELRALogo] Logo image failed to load");
            setHasError(true);
          }}
        />
      </div>
    </div>
  );
};

export default CachedELRALogo;
