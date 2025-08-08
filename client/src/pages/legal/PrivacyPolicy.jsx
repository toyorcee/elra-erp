import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  HiShieldCheck,
  HiLockClosed,
  HiEye,
  HiDocumentText,
  HiMenu,
  HiX,
} from "react-icons/hi";
import ELRALogo from "../../components/ELRALogo";

const PrivacyPolicy = () => {
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
                to="/terms"
                className="text-white/80 hover:text-white transition-colors duration-300 font-medium relative group"
              >
                Terms
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
                    to="/terms"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-white/80 hover:text-white font-medium py-3 px-4 rounded-lg hover:bg-white/5 transition-all duration-300"
                  >
                    Terms & Conditions
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
              <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center">
                <HiShieldCheck className="w-8 h-8 text-blue-400" />
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Privacy Policy
            </h1>
            <p className="text-white/70 text-lg">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </motion.div>

          {/* Content */}
          <motion.div variants={itemVariants} className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">
                1. Information We Collect
              </h2>
              <div className="space-y-4 text-white/80">
                <p>
                  We collect information you provide directly to us, such as
                  when you:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Create an account or register for our services</li>
                  <li>Upload documents and files to our platform</li>
                  <li>Communicate with us through email or support channels</li>
                  <li>Participate in surveys or provide feedback</li>
                </ul>
                <p>
                  This information may include your name, email address, company
                  information, and any documents or files you upload to our
                  platform.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">
                2. How We Use Your Information
              </h2>
              <div className="space-y-4 text-white/80">
                <p>We use the information we collect to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Provide, maintain, and improve our services</li>
                  <li>Process and store your documents securely</li>
                  <li>Send you important updates and notifications</li>
                  <li>Respond to your questions and support requests</li>
                  <li>Ensure compliance with legal obligations</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">
                3. Data Security
              </h2>
              <div className="space-y-4 text-white/80">
                <div className="flex items-start space-x-3">
                  <HiLockClosed className="w-6 h-6 text-green-400 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Encryption & Protection
                    </h3>
                    <p>
                      We implement industry-standard security measures to
                      protect your data, including encryption at rest and in
                      transit, secure data centers, and regular security audits.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">
                4. Data Sharing & Disclosure
              </h2>
              <div className="space-y-4 text-white/80">
                <p>
                  We do not sell, trade, or otherwise transfer your personal
                  information to third parties without your consent, except in
                  the following circumstances:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>With your explicit consent</li>
                  <li>To comply with legal obligations</li>
                  <li>To protect our rights and safety</li>
                  <li>In connection with a business transfer or merger</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">
                5. Your Rights & Choices
              </h2>
              <div className="space-y-4 text-white/80">
                <p>You have the right to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Access and review your personal information</li>
                  <li>Update or correct your information</li>
                  <li>Request deletion of your data</li>
                  <li>Opt-out of marketing communications</li>
                  <li>Export your data in a portable format</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">
                6. Data Retention
              </h2>
              <div className="space-y-4 text-white/80">
                <p>
                  We retain your personal information for as long as necessary
                  to provide our services and comply with legal obligations.
                  When you delete your account, we will delete or anonymize your
                  personal information within 30 days, except where retention is
                  required by law.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">
                7. Cookies & Tracking
              </h2>
              <div className="space-y-4 text-white/80">
                <p>
                  We use cookies and similar technologies to enhance your
                  experience, analyze usage patterns, and improve our services.
                  You can control cookie settings through your browser
                  preferences.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">
                8. International Data Transfers
              </h2>
              <div className="space-y-4 text-white/80">
                <p>
                  Your information may be transferred to and processed in
                  countries other than your own. We ensure appropriate
                  safeguards are in place to protect your data in accordance
                  with this Privacy Policy.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">
                9. Children's Privacy
              </h2>
              <div className="space-y-4 text-white/80">
                <p>
                  Our services are not intended for children under 13 years of
                  age. We do not knowingly collect personal information from
                  children under 13. If you believe we have collected such
                  information, please contact us.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">
                10. Changes to This Policy
              </h2>
              <div className="space-y-4 text-white/80">
                <p>
                  We may update this Privacy Policy from time to time. We will
                  notify you of any material changes by posting the new policy
                  on this page and updating the "Last updated" date.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">
                11. Contact Us
              </h2>
              <div className="space-y-4 text-white/80">
                <p>
                  If you have any questions about this Privacy Policy or our
                  data practices, please contact us:
                </p>
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-white">
                    <strong>Email:</strong> privacy@edms.com
                  </p>
                  <p className="text-white">
                    <strong>Address:</strong> EDMS Platform, Privacy Team
                  </p>
                </div>
              </div>
            </section>
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

export default PrivacyPolicy;
