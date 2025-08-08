import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  HiDocumentText,
  HiShieldCheck,
  HiExclamation,
  HiCheckCircle,
  HiMenu,
  HiX,
} from "react-icons/hi";
import ELRALogo from "../../components/ELRALogo";

const TermsConditions = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 relative">
      {/* Fixed Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900"></div>
      {/* Header */}
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-xl border-b border-white/10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/">
                <ELRALogo />
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link
                to="/"
                className="text-white/80 hover:text-white transition-colors duration-300 font-medium relative group"
              >
                Home
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link
                to="/privacy"
                className="text-white/80 hover:text-white transition-colors duration-300 font-medium relative group"
              >
                Privacy
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link
                to="/login"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-full font-semibold transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/25"
              >
                Sign In
              </Link>
            </div>

            {/* Mobile Hamburger Button */}
            <div className="md:hidden">
              <motion.button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-white p-2 rounded-lg hover:bg-white/10 transition-colors duration-300"
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  animate={{ rotate: mobileMenuOpen ? 90 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {mobileMenuOpen ? (
                    <HiX className="w-6 h-6" />
                  ) : (
                    <HiMenu className="w-6 h-6" />
                  )}
                </motion.div>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="md:hidden bg-slate-900/98 backdrop-blur-xl border-t border-white/10 overflow-hidden"
            >
              <div className="px-4 py-6 space-y-4">
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <Link
                    to="/"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-white/80 hover:text-white font-medium py-3 px-4 rounded-lg hover:bg-white/5 transition-all duration-300"
                  >
                    Home
                  </Link>
                </motion.div>

                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <Link
                    to="/privacy"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-white/80 hover:text-white font-medium py-3 px-4 rounded-lg hover:bg-white/5 transition-all duration-300"
                  >
                    Privacy Policy
                  </Link>
                </motion.div>

                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-white/80 hover:text-white font-medium py-3 px-4 rounded-lg hover:bg-white/5 transition-all duration-300"
                  >
                    Sign In
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Main Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-20">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-6 sm:p-8 lg:p-12"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center">
                <HiDocumentText className="w-8 h-8 text-purple-400" />
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Terms & Conditions
            </h1>
            <p className="text-white/70 text-lg">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </motion.div>

          {/* Content */}
          <motion.div variants={itemVariants} className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">
                1. Acceptance of Terms
              </h2>
              <div className="space-y-4 text-white/80">
                <p>
                  By accessing and using the EDMS (Electronic Document
                  Management System) platform, you accept and agree to be bound
                  by the terms and provision of this agreement. If you do not
                  agree to abide by the above, please do not use this service.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">
                2. Description of Service
              </h2>
              <div className="space-y-4 text-white/80">
                <p>
                  EDMS provides a cloud-based document management system that
                  allows users to:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Upload, store, and organize documents</li>
                  <li>Create and manage approval workflows</li>
                  <li>Collaborate with team members</li>
                  <li>Search and retrieve documents</li>
                  <li>Manage user permissions and access control</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">
                3. User Accounts & Registration
              </h2>
              <div className="space-y-4 text-white/80">
                <p>
                  To use our services, you must register for an account. You
                  agree to:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Provide accurate and complete information</li>
                  <li>Maintain the security of your account credentials</li>
                  <li>Notify us immediately of any unauthorized use</li>
                  <li>
                    Accept responsibility for all activities under your account
                  </li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">
                4. Acceptable Use Policy
              </h2>
              <div className="space-y-4 text-white/80">
                <p>You agree not to use the service to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Upload illegal, harmful, or offensive content</li>
                  <li>Violate intellectual property rights</li>
                  <li>Attempt to gain unauthorized access to our systems</li>
                  <li>Interfere with the service or other users</li>
                  <li>Use the service for spam or malicious purposes</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">
                5. Data & Privacy
              </h2>
              <div className="space-y-4 text-white/80">
                <div className="flex items-start space-x-3">
                  <HiShieldCheck className="w-6 h-6 text-green-400 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Data Protection
                    </h3>
                    <p>
                      We are committed to protecting your data. Our data
                      practices are governed by our Privacy Policy, which is
                      incorporated into these terms by reference.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">
                6. Intellectual Property
              </h2>
              <div className="space-y-4 text-white/80">
                <p>
                  The EDMS platform, including its software, design, and
                  content, is protected by intellectual property laws. You
                  retain ownership of your uploaded content, but grant us a
                  license to store and process it for service delivery.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">
                7. Service Availability
              </h2>
              <div className="space-y-4 text-white/80">
                <p>
                  We strive to maintain high service availability but cannot
                  guarantee uninterrupted access. We may perform maintenance,
                  updates, or modifications that temporarily affect service
                  availability.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">
                8. Limitation of Liability
              </h2>
              <div className="space-y-4 text-white/80">
                <div className="flex items-start space-x-3">
                  <HiExclamation className="w-6 h-6 text-yellow-400 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Liability Disclaimer
                    </h3>
                    <p>
                      To the maximum extent permitted by law, EDMS shall not be
                      liable for any indirect, incidental, special,
                      consequential, or punitive damages arising from your use
                      of the service.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">
                9. Termination
              </h2>
              <div className="space-y-4 text-white/80">
                <p>
                  Either party may terminate this agreement at any time. Upon
                  termination:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Your access to the service will be suspended</li>
                  <li>
                    We will retain your data for 30 days for recovery purposes
                  </li>
                  <li>You may request data export before permanent deletion</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">
                10. Governing Law
              </h2>
              <div className="space-y-4 text-white/80">
                <p>
                  These terms shall be governed by and construed in accordance
                  with the laws of the jurisdiction where EDMS is incorporated,
                  without regard to conflict of law principles.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">
                11. Changes to Terms
              </h2>
              <div className="space-y-4 text-white/80">
                <p>
                  We reserve the right to modify these terms at any time. We
                  will notify users of material changes via email or through the
                  platform. Continued use after changes constitutes acceptance
                  of the new terms.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">
                12. Contact Information
              </h2>
              <div className="space-y-4 text-white/80">
                <p>
                  If you have questions about these terms, please contact us:
                </p>
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-white">
                    <strong>Email:</strong> legal@edms.com
                  </p>
                  <p className="text-white">
                    <strong>Address:</strong> EDMS Platform, Legal Team
                  </p>
                </div>
              </div>
            </section>

            {/* Important Notice */}
            <motion.div
              variants={itemVariants}
              className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6"
            >
              <div className="flex items-start space-x-3">
                <HiCheckCircle className="w-6 h-6 text-blue-400 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Important Notice
                  </h3>
                  <p className="text-white/80">
                    By using our service, you acknowledge that you have read,
                    understood, and agree to be bound by these Terms &
                    Conditions and our Privacy Policy.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Footer */}
          <motion.div
            variants={itemVariants}
            className="mt-12 pt-8 border-t border-white/20 text-center"
          >
            <Link
              to="/"
              className="inline-flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors"
            >
              <HiDocumentText className="w-5 h-5" />
              <span>Back to Home</span>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default TermsConditions;
