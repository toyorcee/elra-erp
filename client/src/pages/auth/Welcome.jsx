import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import {
  HiKey,
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
import ELRAHero3 from "../../assets/ELRAHero3.jpg";
import elraImage from "../../assets/ELRA.png";
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

  // Draggable modal state
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const modalRef = useRef(null);

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

  // Draggable modal handlers
  const handleMouseDown = (e) => {
    if (e.target.closest("input, button, select, textarea")) return;

    setIsDragging(true);
    const rect = modalRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;

    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;

    // Keep modal within viewport bounds
    const maxX = window.innerWidth - modalRef.current.offsetWidth;
    const maxY = window.innerHeight - modalRef.current.offsetHeight;

    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY)),
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  if (!invitationCode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-900 via-green-800 to-emerald-900">
        <div className="text-center text-white">
          <HiExclamation className="h-16 w-16 mx-auto mb-4 text-yellow-400" />
          <h1 className="text-2xl font-bold mb-2">Invalid Invitation Link</h1>
          <p className="text-gray-300 mb-6">No invitation code provided.</p>
          <button
            onClick={() => navigate("/login")}
            className="bg-white text-green-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:block lg:w-1/2 relative">
        <img
          src={ELRAHero3}
          alt="ELRA Background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30"></div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-8 relative overflow-hidden">
        <div className="absolute top-8 left-8 z-20">
          <ELRALogo size="lg" />
        </div>

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <img
            src={elraImage}
            alt="ELRA Decorative"
            className="w-[60%] max-w-[400px] opacity-15 object-contain"
          />
        </div>

        <div className="absolute inset-0 bg-white/85"></div>

        <div className="w-full max-w-md relative z-10">
          <div className="lg:hidden text-center mb-8">
            <ELRALogo size="xl" className="mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-[var(--elra-primary)] mb-2">
              Welcome to ELRA
            </h2>
            <p className="text-sm text-[var(--elra-secondary-1)] font-medium tracking-wide">
              Complete Your Registration
            </p>
          </div>

          <div
            ref={modalRef}
            className="bg-white rounded-xl shadow-lg border border-[var(--elra-border-primary)] relative cursor-move max-h-[90vh] flex flex-col"
            style={{
              transform: `translate(${position.x}px, ${position.y}px)`,
              userSelect: isDragging ? "none" : "auto",
            }}
            onMouseDown={handleMouseDown}
          >
            <div className="absolute inset-0 flex items-center justify-center opacity-3 pointer-events-none">
              <div className="text-[var(--elra-primary)] transform rotate-12 scale-150">
                <ELRALogo size="xl" />
              </div>
            </div>

            {/* Fixed Header */}
            <div className="text-center p-8 pb-4 relative z-10 flex-shrink-0">
              {/* Drag handle indicator */}
              <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-[var(--elra-primary)] rounded-full opacity-30"></div>

              <h2 className="text-3xl font-bold text-[var(--elra-primary)] mb-3">
                {step === 1 && "Verifying Invitation"}
                {step === 2 && "Complete Your Profile"}
                {step === 3 && "Welcome to ELRA!"}
              </h2>
              <p className="text-[var(--elra-text-secondary)] text-lg mb-2">
                {step === 1 && "Please wait while we verify your invitation..."}
                {step === 2 && "Set up your account to get started"}
                {step === 3 && "Your account has been created successfully!"}
              </p>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-8 pb-8">
              {/* Step 1: Loading/Verification */}
              {step === 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center relative z-10"
                >
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
                        className="bg-[var(--elra-primary)] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[var(--elra-primary-dark)] transition-colors"
                      >
                        Go to Login
                      </button>
                    </div>
                  ) : null}
                </motion.div>
              )}

              {/* Step 2: Registration Form */}
              {step === 2 && invitationData && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative z-10"
                >
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
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <HiUser className="h-4 w-4 text-[var(--elra-secondary-2)]" />
                          </div>
                          <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            className={`w-full pl-10 pr-4 py-3 bg-white border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] ${
                              errors.firstName
                                ? "border-red-400"
                                : "border-[var(--elra-border-primary)]"
                            }`}
                            placeholder="Enter your first name"
                          />
                        </div>
                        {errors.firstName && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.firstName}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-[var(--elra-text-primary)] mb-2">
                          Last Name
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <HiUser className="h-4 w-4 text-[var(--elra-secondary-2)]" />
                          </div>
                          <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            className={`w-full pl-10 pr-4 py-3 bg-white border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] ${
                              errors.lastName
                                ? "border-red-400"
                                : "border-[var(--elra-border-primary)]"
                            }`}
                            placeholder="Enter your last name"
                          />
                        </div>
                        {errors.lastName && (
                          <p className="mt-1 text-sm text-red-600">
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
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <HiLockClosed className="h-4 w-4 text-[var(--elra-secondary-2)]" />
                        </div>
                        <input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          className={`w-full pl-10 pr-12 py-3 bg-white border-2 rounded-lg focus:outline-none focus:ring-2 ${
                            errors.password
                              ? "border-red-400"
                              : "border-[var(--elra-border-primary)]"
                          }`}
                          placeholder="Create a password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showPassword ? (
                            <MdVisibilityOff />
                          ) : (
                            <MdVisibility />
                          )}
                        </button>
                      </div>
                      {errors.password && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.password}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[var(--elra-text-primary)] mb-2">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <HiLockClosed className="h-4 w-4 text-[var(--elra-secondary-2)]" />
                        </div>
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          className={`w-full pl-10 pr-12 py-3 bg-white border-2 rounded-lg focus:outline-none focus:ring-2 ${
                            errors.confirmPassword
                              ? "border-red-400"
                              : "border-[var(--elra-border-primary)]"
                          }`}
                          placeholder="Confirm your password"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showConfirmPassword ? (
                            <MdVisibilityOff />
                          ) : (
                            <MdVisibility />
                          )}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.confirmPassword}
                        </p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-[var(--elra-primary-dark)] hover:bg-[var(--elra-primary)] text-white py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
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
                </motion.div>
              )}

              {/* Step 3: Success */}
              {step === 3 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center relative z-10"
                >
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
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
