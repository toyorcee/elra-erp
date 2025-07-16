import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
} from "react";
import { authAPI, handleApiError } from "../services/api";

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null,
  initialized: false,
};

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
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        loading: false,
        error: null,
        initialized: true,
      };

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

    default:
      return state;
  }
};

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize authentication on app startup
  const initializeAuth = useCallback(async () => {
    try {
      console.log("🚀 AuthContext: Initializing authentication...");
      dispatch({ type: AUTH_ACTIONS.INIT_START });

      const response = await authAPI.getMe();
      console.log("✅ AuthContext: Initialization successful:", {
        user: response.data.user,
        roleName: response.data.user?.role?.name,
        roleLevel: response.data.user?.role?.level,
      });

      dispatch({
        type: AUTH_ACTIONS.INIT_SUCCESS,
        payload: { user: response.data.user },
      });
    } catch (error) {
      console.log("❌ AuthContext: Initialization failed:", error.message);
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
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user: response.data.user },
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
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });

    try {
      const response = await authAPI.register(userData);
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user: response.data.user },
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

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
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

  const value = {
    ...state,
    login,
    register,
    logout,
    getMe,
    clearError,
    initializeAuth,
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
