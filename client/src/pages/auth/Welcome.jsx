import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  HiUser,
  HiLockClosed,
  HiCheckCircle,
  HiExclamation,
  HiArrowRight,
  HiMail,
  HiOfficeBuilding,
  HiUserGroup,
} from "react-icons/hi";
import { MdVisibility, MdVisibilityOff } from "react-icons/md";
import ELRALogo from "../../components/ELRALogo";
import { useAuth } from "../../context/AuthContext";

const Welcome = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [invitationData, setInvitationData] = useState(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const invitationCode = searchParams.get("code");

  useEffect(() => {
    if (invitationCode) {
      verifyInvitationCode(invitationCode);
    } else {
      setError("No invitation code provided");
    }
  }, [invitationCode]);

  const verifyInvitationCode = async (code) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/invitations/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: code.toUpperCase() }),
      });

      const data = await response.json();

      if (data.success) {
        setInvitationData(data.data.invitation);
        // Don't auto-prefill names - users need to enter them manually
        setFormData((prev) => ({
          ...prev,
          firstName: "",
          lastName: "",
        }));
        setStep(2);
        toast.success("Invitation verified successfully!");
      } else {
        setError(data.message || "Invalid invitation code");
      }
    } catch (error) {
      console.error("Error verifying invitation:", error);
      setError("Failed to verify invitation. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setError("");

    const requestData = {
      invitationCode: invitationCode.toUpperCase(),
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      password: formData.password,
      confirmPassword: formData.confirmPassword,
    };

    console.log("📤 Sending registration data:", requestData);

    try {
      const response = await fetch("/api/user-registration/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      console.log("📥 Response status:", response.status);
      const data = await response.json();
      console.log("📥 Response data:", data);

      if (data.success) {
        setStep(3);
        toast.success("Account created successfully! Welcome to ELRA!");

        // Auto-login the user
        setTimeout(async () => {
          try {
            const loginResult = await login({
              identifier: invitationData.email,
              password: formData.password,
            });

            if (loginResult.success) {
              navigate("/modules");
            } else {
              navigate("/login");
            }
          } catch (error) {
            navigate("/login");
          }
        }, 2000);
      } else {
        setError(data.message || "Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      setError("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  if (!invitationCode) {
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
              Invalid Invitation Link
            </h1>
            <p className="text-[var(--elra-text-secondary)] mb-6">
              No invitation code provided.
            </p>
            <button
              onClick={() => navigate("/login")}
              className="w-full bg-[var(--elra-primary)] hover:bg-[var(--elra-primary-dark)] text-white py-3 px-4 text-base rounded-lg font-semibold transition-all duration-300 shadow-lg"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-gray-50">
      {/* Content */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <ELRALogo className="h-14 w-auto" />
          </div>
        </div>

        {/* Card Form */}
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-6 md:p-8">
          <h2 className="text-xl font-bold text-center text-[var(--elra-primary)] mb-6">
            {step === 1 && "Verifying Invitation"}
            {step === 2 && "Complete Your Profile"}
            {step === 3 && "Welcome to ELRA!"}
          </h2>

          <p className="text-center text-[var(--elra-text-secondary)] mb-6">
            {step === 1 && "Please wait while we verify your invitation..."}
            {step === 2 && "Set up your account to get started"}
            {step === 3 && "Your account has been created successfully!"}
          </p>

          {/* Step 1: Loading/Verification */}
          {step === 1 && (
            <div className="text-center">
              {loading ? (
                <div className="space-y-6">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[var(--elra-primary)] mx-auto"></div>
                  <p className="text-[var(--elra-text-secondary)]">
                    Verifying your invitation...
                  </p>
                </div>
              ) : error ? (
                <div className="space-y-6">
                  <HiExclamation className="h-16 w-16 mx-auto text-red-500" />
                  <p className="text-red-600 font-medium">{error}</p>
                  <button
                    onClick={() => navigate("/login")}
                    className="w-full bg-[var(--elra-primary)] text-white py-3 px-4 text-base rounded-lg font-semibold hover:bg-[var(--elra-primary-dark)] transition-colors"
                  >
                    Go to Login
                  </button>
                </div>
              ) : null}
            </div>
          )}

          {/* Step 2: Registration Form */}
          {step === 2 && invitationData && (
            <div>
              {/* Invitation Preview */}
              <div className="bg-white border-2 border-[var(--elra-primary)] rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-3 mb-3">
                  <HiCheckCircle className="h-5 w-5 text-[var(--elra-primary)]" />
                  <h3 className="font-semibold text-[var(--elra-primary)]">
                    Invitation Details
                  </h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <HiMail className="h-4 w-4 text-[var(--elra-primary)]" />
                    <span className="text-[var(--elra-primary)] font-medium">
                      {invitationData.email}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <HiOfficeBuilding className="h-4 w-4 text-[var(--elra-primary)]" />
                    <span className="text-[var(--elra-primary)]">
                      {invitationData.department.name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <HiUserGroup className="h-4 w-4 text-[var(--elra-primary)]" />
                    <span className="text-[var(--elra-primary)]">
                      {invitationData.role.name}
                    </span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm text-center">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-[var(--elra-text-primary)] mb-2">
                      First Name
                    </label>
                    <div className="relative">
                      <HiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--elra-secondary-2)]" />
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-4 py-3 text-base border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] ${
                          errors.firstName
                            ? "border-red-400 focus:ring-red-200"
                            : "border-[var(--elra-border-primary)]"
                        }`}
                        placeholder="Enter your first name"
                      />
                    </div>
                    {errors.firstName && (
                      <p className="mt-2 text-sm text-red-600">
                        {errors.firstName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[var(--elra-text-primary)] mb-2">
                      Last Name
                    </label>
                    <div className="relative">
                      <HiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--elra-secondary-2)]" />
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-4 py-3 text-base border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] ${
                          errors.lastName
                            ? "border-red-400 focus:ring-red-200"
                            : "border-[var(--elra-border-primary)]"
                        }`}
                        placeholder="Enter your last name"
                      />
                    </div>
                    {errors.lastName && (
                      <p className="mt-2 text-sm text-red-600">
                        {errors.lastName}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[var(--elra-text-primary)] mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <HiLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--elra-secondary-2)]" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-10 py-3 text-base border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] ${
                        errors.password
                          ? "border-red-400 focus:ring-red-200"
                          : "border-[var(--elra-border-primary)]"
                      }`}
                      placeholder="Create a password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[var(--elra-primary)]"
                    >
                      {showPassword ? <MdVisibilityOff /> : <MdVisibility />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-2 text-sm text-red-600">
                      {errors.password}
                    </p>
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
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-10 py-3 text-base border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] ${
                        errors.confirmPassword
                          ? "border-red-400 focus:ring-red-200"
                          : "border-[var(--elra-border-primary)]"
                      }`}
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[var(--elra-primary)]"
                    >
                      {showConfirmPassword ? (
                        <MdVisibilityOff />
                      ) : (
                        <MdVisibility />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-2 text-sm text-red-600">
                      {errors.confirmPassword}
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
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Complete Registration</span>
                      <HiArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Step 3: Success */}
          {step === 3 && (
            <div className="text-center">
              <div className="space-y-6">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <HiCheckCircle className="h-10 w-10 text-green-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[var(--elra-text-primary)] mb-2">
                    Account Created Successfully!
                  </h3>
                  <p className="text-[var(--elra-text-secondary)]">
                    Welcome to ELRA! You'll be redirected to your dashboard
                    shortly.
                  </p>
                </div>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--elra-primary)] mx-auto"></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Welcome;
