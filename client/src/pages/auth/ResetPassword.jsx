import React, { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  HiLockClosed,
  HiEye,
  HiEyeOff,
  HiArrowRight,
  HiCheckCircle,
  HiExclamation,
} from "react-icons/hi";
import { authAPI, handleApiError } from "../../services/api";
import ELRALogo from "../../components/ELRALogo";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [token, setToken] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const tokenParam = searchParams.get("token");
    if (!tokenParam) {
      setError("Invalid reset link. Please request a new password reset.");
    } else {
      setToken(tokenParam);
    }
  }, [searchParams]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const validatePassword = (password) => {
    if (!password) {
      setPasswordError("Password is required");
      return false;
    } else if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return false;
    } else {
      setPasswordError("");
      return true;
    }
  };

  const validateConfirmPassword = (confirmPass) => {
    if (!confirmPass) {
      setConfirmPasswordError("Please confirm your password");
      return false;
    } else if (confirmPass !== newPassword) {
      setConfirmPasswordError("Passwords do not match");
      return false;
    } else {
      setConfirmPasswordError("");
      return true;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const isPasswordValid = validatePassword(newPassword);
    const isConfirmPasswordValid = validateConfirmPassword(confirmPassword);

    if (!isPasswordValid || !isConfirmPasswordValid) {
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.post("/auth/reset-password", {
        token,
        newPassword,
      });

      if (response.data.success) {
        setSuccess(true);
        toast.success("Password updated successfully!");

        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } else {
        setError(response.data.message || "Failed to update password");
      }
    } catch (error) {
      const errorMessage = handleApiError(error);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = (e) => {
    setNewPassword(e.target.value);
    if (passwordError) {
      setPasswordError("");
    }
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
    if (confirmPasswordError) {
      setConfirmPasswordError("");
    }
  };

  // Success State
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-gray-50">
        <div className="relative z-10 w-full max-w-md">
          <div className="flex justify-center mb-6">
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <ELRALogo className="h-14 w-auto" />
            </div>
          </div>

          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <HiCheckCircle className="h-10 w-10 text-green-500" />
            </div>

            <h1 className="text-2xl font-bold text-[var(--elra-primary)] mb-2">
              Password Updated Successfully!
            </h1>
            <p className="text-[var(--elra-text-secondary)] mb-6">
              Your password has been successfully updated. You will be
              redirected to the login page in a few seconds.
            </p>

            <Link
              to="/login"
              className="w-full bg-[var(--elra-primary)] hover:bg-[var(--elra-primary-dark)] text-white py-3 px-4 text-base rounded-lg font-semibold transition-all duration-300 shadow-lg flex items-center justify-center space-x-2"
            >
              <HiArrowRight className="h-5 w-5" />
              <span>Go to Login</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Error State (Invalid Token)
  if (error && !token) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-gray-50">
        <div className="relative z-10 w-full max-w-md">
          <div className="flex justify-center mb-6">
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <ELRALogo className="h-14 w-auto" />
            </div>
          </div>

          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-8 text-center">
            <HiExclamation className="h-16 w-16 mx-auto mb-4 text-red-500" />
            <h1 className="text-2xl font-bold text-[var(--elra-primary)] mb-2">
              Invalid Reset Link
            </h1>
            <p className="text-[var(--elra-text-secondary)] mb-6">{error}</p>

            <div className="space-y-4">
              <Link
                to="/forgot-password"
                className="w-full bg-[var(--elra-primary)] hover:bg-[var(--elra-primary-dark)] text-white py-3 px-4 text-base rounded-lg font-semibold transition-all duration-300 shadow-lg flex items-center justify-center space-x-2"
              >
                <HiArrowRight className="h-5 w-5" />
                <span>Request New Link</span>
              </Link>

              <Link
                to="/login"
                className="w-full border-2 border-[var(--elra-primary)] text-[var(--elra-primary)] hover:bg-[var(--elra-primary)] hover:text-white py-3 px-4 text-base rounded-lg font-semibold transition-all duration-300"
              >
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main Form State
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-gray-50">
      <div className="relative z-10 w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <ELRALogo className="h-14 w-auto" />
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-6 md:p-8">
          <h2 className="text-xl font-bold text-center text-[var(--elra-primary)] mb-6">
            Reset Password
          </h2>

          <p className="text-center text-[var(--elra-text-secondary)] mb-6">
            Create a new secure password for your account
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm text-center">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-[var(--elra-text-primary)] mb-2">
                New Password
              </label>
              <div className="relative">
                <HiLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--elra-secondary-2)]" />
                <input
                  type={showPassword ? "text" : "password"}
                  id="newPassword"
                  value={newPassword}
                  onChange={handlePasswordChange}
                  className={`w-full pl-10 pr-10 py-3 text-base border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] ${
                    passwordError
                      ? "border-red-400 focus:ring-red-200"
                      : "border-[var(--elra-border-primary)]"
                  }`}
                  placeholder="Enter your new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[var(--elra-primary)]"
                >
                  {showPassword ? <HiEyeOff /> : <HiEye />}
                </button>
              </div>
              {passwordError && (
                <p className="mt-2 text-sm text-red-600">{passwordError}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-[var(--elra-text-primary)] mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <HiLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--elra-secondary-2)]" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  className={`w-full pl-10 pr-10 py-3 text-base border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] ${
                    confirmPasswordError
                      ? "border-red-400 focus:ring-red-200"
                      : "border-[var(--elra-border-primary)]"
                  }`}
                  placeholder="Confirm your new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[var(--elra-primary)]"
                >
                  {showConfirmPassword ? <HiEyeOff /> : <HiEye />}
                </button>
              </div>
              {confirmPasswordError && (
                <p className="mt-2 text-sm text-red-600">
                  {confirmPasswordError}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--elra-primary-dark)] hover:bg-[var(--elra-primary)] text-white py-3 px-4 text-base rounded-lg font-semibold transition-all duration-300 disabled:opacity-50 shadow-lg flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <span>Update Password</span>
                  <HiArrowRight className="h-5 w-5" />
                </>
              )}
            </button>

            <div className="text-center">
              <Link
                to="/login"
                className="text-sm text-[var(--elra-primary)] hover:text-[var(--elra-primary-dark)] font-medium transition-all duration-300 hover:underline"
              >
                ← Back to Login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
