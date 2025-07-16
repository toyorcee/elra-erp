import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
} from "react";
import { authAPI, handleApiError, setHasLoggedIn } from "../services/api";

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
  UPDATE_PROFILE: "UPDATE_PROFILE",
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

    case AUTH_ACTIONS.UPDATE_PROFILE:
      return {
        ...state,
        user: action.payload.user,
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

      const hasCookies = document.cookie.length > 0;
      console.log("🔍 AuthContext: Cookie check - has cookies:", hasCookies);
      console.log("🔍 AuthContext: All cookies:", document.cookie);

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

      // Don't fail immediately on 401 - might be expired token
      if (error.response?.status === 401) {
        console.log(
          "🔍 AuthContext: 401 error - likely expired token, clearing auth"
        );
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

      console.log("🔍 Login response structure:", {
        hasDataProperty: !!response.data.data,
        userFromData: !!response.data.data?.user,
        userFromRoot: !!response.data.user,
        finalUser: userData,
      });

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

  const value = {
    ...state,
    login,
    register,
    logout,
    getMe,
    clearError,
    initializeAuth,
    updateProfile,
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
