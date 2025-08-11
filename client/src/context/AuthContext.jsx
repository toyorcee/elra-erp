import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
} from "react";
import { authAPI, handleApiError, setHasLoggedIn } from "../services/api";

// Get initial state from localStorage if available
const getInitialState = () => {
  try {
    const savedAuth = localStorage.getItem("authState");
    if (savedAuth) {
      const parsed = JSON.parse(savedAuth);
      return {
        user: parsed.user,
        isAuthenticated: !!parsed.user,
        loading: false,
        error: null,
        initialized: true,
        subscriptionPlans: [],
      };
    }
  } catch (error) {
    console.log("Failed to parse saved auth state:", error);
  }

  return {
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null,
    initialized: true,
    subscriptionPlans: [],
  };
};

const initialState = getInitialState();

const AUTH_ACTIONS = {
  LOGIN_START: "LOGIN_START",
  LOGIN_SUCCESS: "LOGIN_SUCCESS",
  LOGIN_FAILURE: "LOGIN_FAILURE",
  LOGOUT: "LOGOUT",
  CLEAR_ERROR: "CLEAR_ERROR",
  SET_LOADING: "SET_LOADING",
  INIT_START: "INIT_START",
  INIT_SUCCESS: "INIT_SUCCESS",
  INIT_FAILURE: "INIT_FAILURE",
  UPDATE_PROFILE: "UPDATE_PROFILE",
  SET_SUBSCRIPTION_PLANS: "SET_SUBSCRIPTION_PLANS",
};

const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.INIT_START:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case AUTH_ACTIONS.INIT_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        loading: false,
        error: null,
        initialized: true,
      };

    case AUTH_ACTIONS.INIT_FAILURE:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null,
        initialized: true,
      };

    case AUTH_ACTIONS.LOGIN_START:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
      console.log("🔍 AuthContext: LOGIN_SUCCESS reducer - setting user:", {
        user: action.payload.user,
        roleName: action.payload.user?.role?.name,
        roleLevel: action.payload.user?.role?.level,
        roleId: action.payload.user?.role?._id,
      });
      console.log("🔍 AuthContext: Previous state:", {
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        loading: state.loading,
        initialized: state.initialized,
      });
      const newState = {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        loading: false,
        error: null,
        initialized: true,
      };
      console.log("🔍 AuthContext: New state after LOGIN_SUCCESS:", {
        isAuthenticated: newState.isAuthenticated,
        user: newState.user,
        loading: newState.loading,
        initialized: newState.initialized,
      });
      return newState;

    case AUTH_ACTIONS.LOGIN_FAILURE:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loading: false,
        error: action.payload,
        initialized: true,
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null,
        initialized: true,
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      };

    case AUTH_ACTIONS.UPDATE_PROFILE:
      return {
        ...state,
        user: action.payload.user,
      };

    case AUTH_ACTIONS.SET_SUBSCRIPTION_PLANS:
      return {
        ...state,
        subscriptionPlans: Array.isArray(action.payload) ? action.payload : [],
      };

    default:
      return state;
  }
};

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const initializeAuth = useCallback(async () => {
    try {
      console.log("🚀 AuthContext: Initializing authentication...");
      dispatch({ type: AUTH_ACTIONS.INIT_START });

      // Debug: Let's see what cookies we actually have
      console.log("🔍 AuthContext: All cookies:", document.cookie);
      console.log("🔍 AuthContext: Cookie length:", document.cookie.length);
      console.log(
        "🔍 AuthContext: Includes token:",
        document.cookie.includes("token")
      );
      console.log(
        "🔍 AuthContext: Includes refreshToken:",
        document.cookie.includes("refreshToken")
      );

      // Simple check - if we have any cookies, try to get user data
      if (!document.cookie.includes("token")) {
        console.log("🔍 AuthContext: No access token found");
        dispatch({ type: AUTH_ACTIONS.INIT_FAILURE });
        return;
      }

      console.log("🔍 AuthContext: Attempting to get user data...");
      const response = await authAPI.getMe();

      const userData = response.data.data?.user || response.data.user;

      console.log("✅ AuthContext: Initialization successful:", {
        user: userData,
        roleName: userData?.role?.name,
        roleLevel: userData?.role?.level,
        responseStructure: {
          hasDataProperty: !!response.data.data,
          userFromData: !!response.data.data?.user,
          userFromRoot: !!response.data.user,
        },
      });

      setHasLoggedIn(true); // Set login flag after successful auth
      dispatch({
        type: AUTH_ACTIONS.INIT_SUCCESS,
        payload: { user: userData },
      });
    } catch (error) {
      console.log("❌ AuthContext: Initialization failed:", error.message);
      console.log(
        "❌ Error details:",
        error.response?.status,
        error.response?.data
      );

      // If it's a 401, try to refresh the token
      if (error.response?.status === 401) {
        console.log("🔍 AuthContext: 401 error - attempting token refresh...");
        try {
          await authAPI.refreshToken();
          // If refresh successful, try to get user data again
          const response = await authAPI.getMe();
          const userData = response.data.data?.user || response.data.user;

          setHasLoggedIn(true);
          dispatch({
            type: AUTH_ACTIONS.INIT_SUCCESS,
            payload: { user: userData },
          });
          return;
        } catch (refreshError) {
          console.log(
            "❌ AuthContext: Token refresh failed:",
            refreshError.message
          );
        }
      }

      dispatch({ type: AUTH_ACTIONS.INIT_FAILURE });
    }
  }, []);

  // Initialize auth on mount
  useEffect(() => {
    console.log("🔄 AuthContext: Component mounted - starting initialization");
    console.log("🔄 AuthContext: Current state before init:", {
      isAuthenticated: state.isAuthenticated,
      user: state.user,
      loading: state.loading,
      initialized: state.initialized,
    });

    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        console.log("👁️ Page became visible - checking auth state");
        console.log("👁️ Current auth state:", {
          isAuthenticated: state.isAuthenticated,
          user: state.user,
          cookies: document.cookie,
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [state.isAuthenticated, state.user]);

  const login = useCallback(async (credentials) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });

    try {
      const response = await authAPI.login(credentials);
      setHasLoggedIn(true); // Set login flag

      // Handle the correct response structure
      const userData = response.data.data?.user || response.data.user;

      console.log("🔍 Login response structure:", {
        hasDataProperty: !!response.data.data,
        userFromData: !!response.data.data?.user,
        userFromRoot: !!response.data.user,
        finalUser: userData,
      });

      console.log("🔍 AuthContext: User logged in successfully:", {
        id: userData?.id,
        email: userData?.email,
        role: userData?.role?.name,
        roleLevel: userData?.role?.level,
        permissions: userData?.role?.permissions?.length || 0,
      });

      console.log(
        "🔍 AuthContext: About to dispatch LOGIN_SUCCESS with user:",
        userData
      );
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user: userData },
      });
      console.log(
        "🔍 AuthContext: LOGIN_SUCCESS dispatched, returning success"
      );
      return { success: true };
    } catch (error) {
      const errorData = handleApiError(error);
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: errorData.message,
      });
      return { success: false, error: errorData.message };
    }
  }, []);

  const register = useCallback(async (userData) => {
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

    try {
      const response = await authAPI.register(userData);

      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      return { success: true };
    } catch (error) {
      const errorData = handleApiError(error);
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      return { success: false, error: errorData.message };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });

      localStorage.removeItem("authState");
      localStorage.removeItem("redirectAfterLogin");

      sessionStorage.clear();

      setHasLoggedIn(false);
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  }, []);

  const getMe = useCallback(async () => {
    try {
      console.log("🔍 AuthContext: Fetching current user data...");
      const response = await authAPI.getMe();
      console.log("✅ AuthContext: User data received:", {
        user: response.data.user,
        roleName: response.data.user?.role?.name,
        roleLevel: response.data.user?.role?.level,
        roleId: response.data.user?.role?._id,
      });

      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user: response.data.user },
      });
      return { success: true };
    } catch (error) {
      console.error("❌ AuthContext: Failed to get user data:", error);
      const errorData = handleApiError(error);
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: errorData.message,
      });
      return { success: false, error: errorData.message };
    }
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  }, []);

  const updateProfile = useCallback((updatedUser) => {
    console.log("🔄 AuthContext: Updating profile in context:", updatedUser);
    dispatch({
      type: AUTH_ACTIONS.UPDATE_PROFILE,
      payload: { user: updatedUser },
    });
  }, []);

  const setSubscriptionPlans = useCallback((plans) => {
    console.log("🔄 AuthContext: Setting subscription plans:", plans);
    const validPlans = Array.isArray(plans) ? plans : [];
    dispatch({
      type: AUTH_ACTIONS.SET_SUBSCRIPTION_PLANS,
      payload: validPlans,
    });
  }, []);

  // Monitor token expiry
  useEffect(() => {
    if (!state.isAuthenticated) return;

    const checkTokenExpiry = () => {
      const cookies = document.cookie.split(";").reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split("=");
        if (key && value) {
          acc[key] = value;
        }
        return acc;
      }, {});

      if (cookies.token) {
        try {
          const payload = JSON.parse(atob(cookies.token.split(".")[1]));
          const expiryTime = payload.exp * 1000;
          const currentTime = Date.now();
          const timeUntilExpiry = expiryTime - currentTime;

          console.log("⏰ Token expiry check:", {
            currentTime: new Date(currentTime).toISOString(),
            expiryTime: new Date(expiryTime).toISOString(),
            timeUntilExpiry: Math.round(timeUntilExpiry / 1000) + " seconds",
            willExpireSoon: timeUntilExpiry < 60000,
          });

          if (timeUntilExpiry < 60000) {
            console.log("⚠️ Token expiring soon - attempting refresh");
            authAPI.refreshToken().catch((error) => {
              console.log("❌ Failed to refresh token:", error);
            });
          }
        } catch (error) {
          console.log("❌ Error checking token expiry:", error);
        }
      }
    };

    // Check immediately
    checkTokenExpiry();

    // Check every 30 seconds
    const interval = setInterval(checkTokenExpiry, 30000);

    return () => clearInterval(interval);
  }, [state.isAuthenticated]);

  const value = {
    ...state,
    login,
    register,
    logout,
    getMe,
    clearError,
    initializeAuth,
    updateProfile,
    setSubscriptionPlans,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
