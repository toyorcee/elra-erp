import React, { useState } from "react";
import {
  HiEye,
  HiEyeOff,
  HiCheckCircle,
  HiMail,
  HiArrowRight,
} from "react-icons/hi";
import { getSuperAdminCredentials } from "../../services/industryInstances";
import ELRALogo from "../../components/ELRALogo";

const RetrieveCredentials = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState(null);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setCredentials(null);

    try {
      const response = await getSuperAdminCredentials(email);
      setCredentials(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to retrieve credentials");
    } finally {
      setLoading(false);
    }
  };

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
            Retrieve Credentials
          </h2>

          <p className="text-center text-[var(--elra-text-secondary)] mb-6">
            Enter your email to retrieve your login credentials
          </p>

          {!credentials ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-[var(--elra-text-primary)] mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <HiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--elra-secondary-2)]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 text-base border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] border-[var(--elra-border-primary)]"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm text-center">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[var(--elra-primary-dark)] hover:bg-[var(--elra-primary)] text-white py-3 px-4 text-base rounded-lg font-semibold transition-all duration-300 disabled:opacity-50 shadow-lg flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Retrieving...</span>
                  </>
                ) : (
                  <>
                    <span>Retrieve Credentials</span>
                    <HiArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <HiCheckCircle className="h-10 w-10 text-green-500" />
                </div>
                <h2 className="text-xl font-semibold text-[var(--elra-text-primary)] mb-2">
                  Credentials Retrieved
                </h2>
                <p className="text-[var(--elra-text-secondary)]">
                  Here are your login credentials for {credentials.companyName}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-[var(--elra-text-primary)] mb-1">
                    Company
                  </label>
                  <p className="text-[var(--elra-text-primary)] font-medium">
                    {credentials.companyName}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--elra-text-primary)] mb-1">
                    Email
                  </label>
                  <p className="text-[var(--elra-text-primary)] font-mono">
                    {credentials.email}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--elra-text-primary)] mb-1">
                    Temporary Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={credentials.tempPassword}
                      readOnly
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded font-mono text-[var(--elra-text-primary)]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-[var(--elra-primary)]"
                    >
                      {showPassword ? (
                        <HiEyeOff className="h-5 w-5" />
                      ) : (
                        <HiEye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--elra-text-primary)] mb-1">
                    Industry Type
                  </label>
                  <p className="text-[var(--elra-text-primary)]">
                    {credentials.industryType}
                  </p>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-yellow-800 text-sm">
                  <strong>Important:</strong> Please change your password after
                  your first login for security.
                </p>
              </div>

              <button
                onClick={() => {
                  setCredentials(null);
                  setEmail("");
                  setError("");
                }}
                className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-700 transition-colors"
              >
                Retrieve Different Credentials
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RetrieveCredentials;
