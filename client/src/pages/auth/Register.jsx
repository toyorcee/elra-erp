import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";
import signupBg from "../../assets/signup.jpg";
import EDMSLogo from "../../components/EDMSLogo";
import { HiOutlineEye, HiOutlineEyeOff } from "react-icons/hi";
import { GradientSpinner } from "../../components/common";
import { getAvailableDepartments } from "../../services/admin/systemSettings";
import "../../styles/Register.css";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    department: "",
  });
  const [errors, setErrors] = useState({});
  const { register, isAuthenticated, error, clearError, initialized } =
    useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [showDepartmentField, setShowDepartmentField] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const handleNavigate = useCallback(() => {
    if (isAuthenticated && initialized) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, initialized, navigate]);

  useEffect(() => {
    if (isAuthenticated && initialized) {
      handleNavigate();
    }
  }, [isAuthenticated, initialized, handleNavigate]);

  useEffect(() => {
    clearError();
  }, [clearError]);

  useEffect(() => {
    const fetchRegistrationData = async () => {
      try {
        setLoading(true);
        const response = await getAvailableDepartments();

        if (response.success) {
          setDepartments(response.data.departments || []);
          setShowDepartmentField(response.data.requireSelection || false);

          if (!response.data.requireSelection) {
            setFormData((prev) => ({
              ...prev,
              department: response.data.defaultDepartment || "External",
            }));
          }
        }
      } catch (error) {
        console.error("Error fetching registration data:", error);
        setFormData((prev) => ({
          ...prev,
          department: "External",
        }));
      } finally {
        setLoading(false);
      }
    };

    fetchRegistrationData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.username) newErrors.username = "Username is required";
    if (!formData.firstName) newErrors.firstName = "First name is required";
    if (!formData.lastName) newErrors.lastName = "Last name is required";
    if (!formData.email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Email is invalid";
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 6)
      newErrors.password = "Password must be at least 6 characters";
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password))
      newErrors.password =
        "Password must contain uppercase, lowercase, and number";
    if (!formData.confirmPassword)
      newErrors.confirmPassword = "Please confirm your password";
    else if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    const userData = {
      username: formData.username,
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      password: formData.password,
      department: formData.department,
    };
    const response = await register(userData);
    setSubmitting(false);

    if (response.success) {
      toast.success("Registration successful! Welcome to EDMS.");
      handleNavigate();
    } else {
      toast.error(response.message || "Registration failed. Please try again.");
    }
  };

  // Show loading while auth is being initialized
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-cyan-800 to-purple-900">
        <GradientSpinner
          size="xl"
          variant="secondary"
          text="Initializing..."
          showText={true}
        />
      </div>
    );
  }

  // If already authenticated, show loading while redirecting
  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-cyan-800 to-purple-900">
        <GradientSpinner
          size="xl"
          variant="secondary"
          text="Redirecting to dashboard..."
          showText={true}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-blue-800 to-purple-900">
      {/* Fixed Background Image */}
      <img
        src={signupBg}
        alt="Signup background"
        className="fixed inset-0 w-full h-full object-cover object-center opacity-20"
      />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-md lg:max-w-lg xl:max-w-xl mx-auto pt-20 pb-20 px-6">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-blue-600 p-8 text-center">
            <div className="mx-auto h-20 w-20 flex items-center justify-center rounded-full bg-white/20 mb-6 shadow-lg">
              <svg
                className="h-10 w-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
            </div>
            <EDMSLogo variant="light" className="mb-3" />
            <h2 className="text-3xl font-bold text-white mb-2 cursor-pointer">
              Create your account
            </h2>
            <p className="text-green-100 text-base">
              Join EDMS - Secure Document Management
            </p>
          </div>
          {/* Form */}
          <div className="p-8">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="mb-6">
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm text-center">
                    {error}
                  </div>
                </div>
              )}

              {/* Form Fields Container */}
              <div className="space-y-6">
                {/* Username */}
                <div>
                  <label
                    htmlFor="username"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Username
                  </label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    required
                    value={formData.username}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-lg border text-gray-900 placeholder-gray-500 transition-all duration-200 ${
                      errors.username
                        ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                        : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
                    } focus:outline-none focus:ring-2`}
                    placeholder="Enter your username"
                  />
                  {errors.username && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.username}
                    </p>
                  )}
                </div>

                {/* Name Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="firstName"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      First Name
                    </label>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      autoComplete="given-name"
                      required
                      value={formData.firstName}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-lg border text-gray-900 placeholder-gray-500 transition-all duration-200 ${
                        errors.firstName
                          ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                          : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
                      } focus:outline-none focus:ring-2`}
                      placeholder="Enter your first name"
                    />
                    {errors.firstName && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.firstName}
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="lastName"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Last Name
                    </label>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      autoComplete="family-name"
                      required
                      value={formData.lastName}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-lg border text-gray-900 placeholder-gray-500 transition-all duration-200 ${
                        errors.lastName
                          ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                          : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
                      } focus:outline-none focus:ring-2`}
                      placeholder="Enter your last name"
                    />
                    {errors.lastName && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.lastName}
                      </p>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-lg border text-gray-900 placeholder-gray-500 transition-all duration-200 ${
                      errors.email
                        ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                        : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
                    } focus:outline-none focus:ring-2`}
                    placeholder="Enter your email"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-lg border pr-12 text-gray-900 placeholder-gray-500 transition-all duration-200 ${
                        errors.password
                          ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                          : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
                      } focus:outline-none focus:ring-2`}
                      placeholder="Create a password"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none transition-colors"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <HiOutlineEyeOff className="w-5 h-5" />
                      ) : (
                        <HiOutlineEye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-lg border pr-12 text-gray-900 placeholder-gray-500 transition-all duration-200 ${
                        errors.confirmPassword
                          ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                          : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
                      } focus:outline-none focus:ring-2`}
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none transition-colors"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      aria-label={
                        showConfirmPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showConfirmPassword ? (
                        <HiOutlineEyeOff className="w-5 h-5" />
                      ) : (
                        <HiOutlineEye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>

                {/* Department Field */}
                {showDepartmentField && (
                  <div>
                    <label
                      htmlFor="department"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Department
                    </label>
                    <select
                      id="department"
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none text-gray-900 transition-all duration-200"
                    >
                      {departments.map((dept) => (
                        <option key={dept._id} value={dept.name}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 px-6 rounded-lg bg-gradient-to-r from-green-600 to-blue-500 text-white font-semibold shadow-md hover:from-green-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-green-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <div className="flex items-center justify-center space-x-2">
                      <GradientSpinner size="sm" variant="light" />
                      <span>Creating account...</span>
                    </div>
                  ) : (
                    "Create Account"
                  )}
                </button>
              </div>

              {/* Sign In Link */}
              <div className="text-center pt-4">
                <p className="text-sm text-gray-600">
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
