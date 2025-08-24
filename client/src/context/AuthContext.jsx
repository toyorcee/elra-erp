import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
} from "react";
import { authAPI, handleApiError, setHasLoggedIn } from "../services/api";

const getInitialState = () => {
  return {
    user: null,
    isAuthenticated: false,
    loading: true,
    error: null,
    initialized: false,
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
      const newState = {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        loading: false,
        error: null,
        initialized: true,
      };
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
      dispatch({ type: AUTH_ACTIONS.INIT_START });

      // Simple check - if we have any cookies, try to get user data
      if (!document.cookie.includes("token")) {
        dispatch({ type: AUTH_ACTIONS.INIT_FAILURE });
        return;
      }

      const response = await authAPI.getMe();

      const userData = response.data.data?.user || response.data.user;

      setHasLoggedIn(true);
      dispatch({
        type: AUTH_ACTIONS.INIT_SUCCESS,
        payload: { user: userData },
      });
    } catch (error) {
      if (error.response?.status === 401) {
        try {
          await authAPI.refreshToken();
          const response = await authAPI.getMe();
          const userData = response.data.data?.user || response.data.user;

          setHasLoggedIn(true);
          dispatch({
            type: AUTH_ACTIONS.INIT_SUCCESS,
            payload: { user: userData },
          });
          return;
        } catch (refreshError) {
          // Handle refresh error silently
        }
      }

      dispatch({ type: AUTH_ACTIONS.INIT_FAILURE });
    }
  }, []);

  // Initialize auth on mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const login = useCallback(async (credentials) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });

    try {
      const response = await authAPI.login(credentials);
      setHasLoggedIn(true); // Set login flag

      // Handle the correct response structure
      const userData = response.data.data?.user || response.data.user;

      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user: userData },
      });
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

      if (window.queryClient) {
        window.queryClient.clear();
      }

      setHasLoggedIn(false);
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  }, []);

  const getMe = useCallback(async () => {
    try {
      const response = await authAPI.getMe();

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
    dispatch({
      type: AUTH_ACTIONS.UPDATE_PROFILE,
      payload: { user: updatedUser },
    });
  }, []);

  const setSubscriptionPlans = useCallback((plans) => {
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

          if (timeUntilExpiry < 60000) {
            authAPI.refreshToken().catch((error) => {
              // Handle token refresh error silently
            });
          }
        } catch (error) {
          // Handle token parsing error silently
        }
      }
    };

    checkTokenExpiry();

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
