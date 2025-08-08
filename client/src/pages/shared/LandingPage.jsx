import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiUsers,
  HiShieldCheck,
  HiTrendingUp,
  HiGlobe,
  HiCheckCircle,
  HiArrowRight,
  HiMenu,
  HiX,
  HiChat,
  HiStar,
  HiCurrencyDollar,
  HiShoppingCart,
  HiOfficeBuilding,
  HiChartBar,
  HiLockClosed,
  HiDocumentText,
  HiCog,
  HiKey,
} from "react-icons/hi";
import ELRALogo from "../../components/ELRALogo";
import { useAuth } from "../../context/AuthContext";
// Import all assets
import electronicDocument1 from "../../assets/ElectronicDocument1.jpg";
import office1 from "../../assets/Office1.jpg";
import office2 from "../../assets/Office2.jpg";
import office3 from "../../assets/Office3.jpg";
import encryption1 from "../../assets/Encryption1.jpg";
import cloud1 from "../../assets/cloud1.jpg";
import hero1 from "../../assets/hero1.jpg";
import electronicDocument2 from "../../assets/ElectronicDocument2.jpg";
import encryption2 from "../../assets/Encryption2.jpg";
import office4 from "../../assets/Office4.jpg";
import graphs1 from "../../assets/graphs1.jpg";
import cloud2 from "../../assets/cloud2.jpg";
import graphs2 from "../../assets/graphs2.jpg";
import hero2 from "../../assets/hero2.jpg";
import illustration1 from "../../assets/illustration1.jpg";

const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Scroll to top on component mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [animatedStats, setAnimatedStats] = useState({
    users: 0,
    modules: 0,
    departments: 0,
    roles: 0,
  });

  // Background images for hero carousel
  const heroImages = [hero1, hero2, office1, office2, office3, cloud1, cloud2];

  const heroContent = [
    {
      word: "Human Resources",
      description:
        "Streamline employee management, recruitment, onboarding, and performance tracking with intelligent HR workflows and automated processes.",
      icon: HiUsers,
    },
    {
      word: "Payroll",
      description:
        "Automated salary processing, benefits management, and payroll reporting with tax calculations and payment tracking.",
      icon: HiCurrencyDollar,
    },
    {
      word: "Procurement",
      description:
        "End-to-end procurement management from purchase requisitions to vendor management and inventory tracking.",
      icon: HiShoppingCart,
    },
    {
      word: "Accounting",
      description:
        "Complete financial management with expense tracking, revenue management, and comprehensive financial reporting.",
      icon: HiChartBar,
    },
    {
      word: "Communication",
      description:
        "Internal messaging, announcements, and collaboration tools to keep your team connected and informed.",
      icon: HiChat,
    },
    {
      word: "Business Intelligence",
      description:
        "Advanced analytics and reporting to drive data-driven decisions and optimize your business operations.",
      icon: HiTrendingUp,
    },
  ];

  // Animated statistics with intersection observer
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !statsVisible) {
          setStatsVisible(true);
        }
      },
      { threshold: 0.5 }
    );

    if (statsRef.current) {
      observer.observe(statsRef.current);
    }

    return () => observer.disconnect();
  }, [statsVisible]);

  useEffect(() => {
    if (!statsVisible) return;

    const targets = {
      users: 250,
      modules: 8,
      departments: 12,
      roles: 15,
    };
    const duration = 2500;
    const steps = 100;
    const interval = duration / steps;

    const timer = setInterval(() => {
      setAnimatedStats((prev) => {
        const newStats = {
          users: Math.min(
            prev.users + Math.ceil(targets.users / steps),
            targets.users
          ),
          modules: Math.min(
            prev.modules + Math.ceil(targets.modules / steps),
            targets.modules
          ),
          departments: Math.min(
            prev.departments + Math.ceil(targets.departments / steps),
            targets.departments
          ),
          roles: Math.min(
            prev.roles + Math.ceil(targets.roles / steps),
            targets.roles
          ),
        };

        // Stop animation when all targets are reached
        if (
          newStats.users >= targets.users &&
          newStats.modules >= targets.modules &&
          newStats.departments >= targets.departments &&
          newStats.roles >= targets.roles
        ) {
          clearInterval(timer);
        }

        return newStats;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [statsVisible]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Synchronized background image and word carousel
  const [currentBgImage, setCurrentBgImage] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBgImage((prev) => (prev + 1) % heroImages.length);
      setCurrentWordIndex((prev) => (prev + 1) % heroContent.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroImages.length, heroContent.length]);

  const features = [
    {
      icon: HiUsers,
      title: "Human Resources",
      description:
        "Complete HR management with recruitment, onboarding, performance tracking, and employee self-service portal.",
      gradient: "from-green-500 to-emerald-500",
    },
    {
      icon: HiCurrencyDollar,
      title: "Payroll & Benefits",
      description:
        "Automated payroll processing, benefits administration, tax calculations, and comprehensive reporting.",
      gradient: "from-emerald-500 to-green-500",
    },
    {
      icon: HiShoppingCart,
      title: "Procurement",
      description:
        "End-to-end procurement management from requisitions to vendor management and inventory tracking.",
      gradient: "from-green-500 to-emerald-600",
    },
    {
      icon: HiChartBar,
      title: "Accounting",
      description:
        "Complete financial management with expense tracking, revenue management, and financial reporting.",
      gradient: "from-emerald-600 to-green-500",
    },
    {
      icon: HiChat,
      title: "Communication",
      description:
        "Internal messaging, announcements, and collaboration tools to keep your team connected and informed.",
      gradient: "from-green-500 to-emerald-700",
    },
    {
      icon: HiTrendingUp,
      title: "Business Intelligence",
      description:
        "Advanced analytics and reporting to drive data-driven decisions and optimize your business operations.",
      gradient: "from-emerald-700 to-green-500",
    },
    {
      icon: HiShieldCheck,
      title: "Security & Compliance",
      description:
        "Enterprise-grade security with role-based access control, audit trails, and compliance management.",
      gradient: "from-green-500 to-emerald-800",
    },
    {
      icon: HiGlobe,
      title: "Cloud-Native Platform",
      description:
        "99.9% uptime, global CDN, and seamless mobile access for your distributed workforce.",
      gradient: "from-emerald-800 to-green-500",
    },
  ];

  const testimonials = [
    {
      name: "Keisha Williams",
      role: "VP of Operations",
      company: "Metropolitan Healthcare Group",
      content:
        "Before ELRA, our HR processes were scattered across different systems. Now we've streamlined employee management and cut onboarding time by 60%. Our compliance team loves the automated audit trails.",
    },
    {
      name: "David Thompson",
      role: "Chief Technology Officer",
      company: "Riverside Manufacturing",
      content:
        "We were drowning in manual processes across our 12 facilities. ELRA gave us a unified ERP platform that scales beautifully. The workflow automation alone has eliminated 3 full-time positions worth of manual work.",
    },
    {
      name: "Angela Martinez",
      role: "Director of Finance",
      company: "Summit Financial Services",
      content:
        "In financial services, data security isn't optional - it's everything. ELRA's enterprise-grade security and granular permissions give me peace of mind. When auditors ask for specific reports, I can generate them instantly.",
    },
    {
      name: "Marcus Johnson",
      role: "Senior Project Manager",
      company: "Urban Development Corporation",
      content:
        "Managing procurement across multiple sites was a nightmare. ELRA transformed our operations - vendors, contractors, and stakeholders now collaborate seamlessly. We've reduced project delays by 35%.",
    },
    {
      name: "Dr. Patricia Chen",
      role: "Research Director",
      company: "BioTech Innovations Lab",
      content:
        "Data integrity is critical in our field. ELRA's integrated approach has revolutionized how our global team manages research data. The analytics features help us make data-driven decisions faster than ever.",
    },
    {
      name: "Robert Anderson",
      role: "Executive Vice President",
      company: "Global Manufacturing Corp",
      content:
        "ELRA has been a game-changer for our international operations. The multi-language support and compliance features ensure we meet regulatory requirements across all jurisdictions.",
    },
  ];

  const benefits = [
    "Enterprise-grade security with SOC 2 Type II compliance",
    "Role-based access control and audit trails",
    "Real-time data synchronization across all modules",
    "Customizable workflows and approval processes",
    "Comprehensive reporting and analytics dashboard",
    "Mobile-responsive design for field operations",
    "24/7 technical support and system monitoring",
    "Seamless integration with existing enterprise systems",
  ];

  const handleGetStarted = () => {
    navigate("/login");
  };

  const handleSignIn = () => {
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <ELRALogo variant="dark" size="md" />
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a
                href="#features"
                className="text-gray-700 hover:text-green-600 font-medium transition-colors"
              >
                Features
              </a>
              <a
                href="#benefits"
                className="text-gray-700 hover:text-green-600 font-medium transition-colors"
              >
                Benefits
              </a>
              <a
                href="#testimonials"
                className="text-gray-700 hover:text-green-600 font-medium transition-colors"
              >
                Testimonials
              </a>
              <Link
                to="/modules"
                className="text-gray-700 hover:text-green-600 font-medium transition-colors"
              >
                Modules
              </Link>
              <button
                onClick={handleSignIn}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Sign In
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-700 hover:text-green-600"
              >
                {mobileMenuOpen ? (
                  <HiX className="h-6 w-6" />
                ) : (
                  <HiMenu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <a
                href="#features"
                className="block px-3 py-2 text-gray-700 hover:text-green-600 font-medium"
              >
                Features
              </a>
              <a
                href="#benefits"
                className="block px-3 py-2 text-gray-700 hover:text-green-600 font-medium"
              >
                Benefits
              </a>
              <a
                href="#testimonials"
                className="block px-3 py-2 text-gray-700 hover:text-green-600 font-medium"
              >
                Testimonials
              </a>
              <Link
                to="/modules"
                className="block px-3 py-2 text-gray-700 hover:text-green-600 font-medium"
              >
                Modules
              </Link>
              <button
                onClick={handleSignIn}
                className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Sign In
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-16 overflow-hidden bg-gradient-to-br from-green-600 via-green-700 to-emerald-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 drop-shadow-2xl">
                Federal Ministry of{" "}
                <span className="bg-gradient-to-r from-green-300 via-emerald-300 to-green-400 bg-clip-text text-transparent animate-pulse">
                  Finance
                </span>
              </h1>

              {/* Static Subtext */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="text-xl md:text-2xl text-white/95 mb-6 font-semibold drop-shadow-lg"
              >
                Internal ERP System
              </motion.p>

              {/* Animated Changing Module Headers */}
              <div className="h-24 md:h-28 mb-6 flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentWordIndex}
                    initial={{ opacity: 0, y: 30, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -30, scale: 0.8 }}
                    transition={{ duration: 1.2, ease: "easeInOut" }}
                    className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-green-200 via-emerald-200 to-green-300 bg-clip-text text-transparent text-center drop-shadow-xl"
                  >
                    {heroContent[currentWordIndex].word}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Animated Description */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="mb-8"
              >
                <AnimatePresence mode="wait">
                  <motion.p
                    key={currentWordIndex}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 1, ease: "easeInOut" }}
                    className="text-lg md:text-xl text-white/90 max-w-4xl mx-auto leading-relaxed font-medium"
                  >
                    {heroContent[currentWordIndex].description}
                  </motion.p>
                </AnimatePresence>
              </motion.div>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="flex flex-col sm:flex-row gap-6 justify-center items-center"
            >
              <motion.button
                onClick={handleGetStarted}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 text-white px-10 py-5 rounded-xl font-bold text-xl hover:from-green-600 hover:via-emerald-600 hover:to-green-700 transition-all duration-300 shadow-2xl hover:shadow-green-500/25 flex items-center space-x-3 border-2 border-green-400/20"
              >
                <span>Internal Access</span>
                <HiArrowRight className="w-6 h-6 animate-pulse" />
              </motion.button>
              <motion.button
                onClick={handleSignIn}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white px-10 py-5 rounded-xl font-bold text-xl hover:bg-white/20 transition-all duration-300 shadow-2xl hover:shadow-white/25 flex items-center space-x-3"
              >
                <HiLockClosed className="w-6 h-6" />
                <span>Secure Login</span>
              </motion.button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section ref={statsRef} className="relative z-10 px-6 py-16 bg-green-50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              System Overview
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Comprehensive ERP platform serving the Federal Ministry of
              Finance's internal operations and regulatory functions
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            <div className="text-center bg-white rounded-xl p-6 shadow-lg border border-green-100">
              <motion.div
                className="text-4xl md:text-5xl font-bold text-green-600 mb-2"
                initial={{ scale: 0 }}
                animate={statsVisible ? { scale: 1 } : { scale: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                {animatedStats.users}
              </motion.div>
              <p className="text-gray-600 font-medium">Active Users</p>
            </div>
            <div className="text-center bg-white rounded-xl p-6 shadow-lg border border-green-100">
              <motion.div
                className="text-4xl md:text-5xl font-bold text-green-600 mb-2"
                initial={{ scale: 0 }}
                animate={statsVisible ? { scale: 1 } : { scale: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                {animatedStats.modules}
              </motion.div>
              <p className="text-gray-600 font-medium">System Modules</p>
            </div>
            <div className="text-center bg-white rounded-xl p-6 shadow-lg border border-green-100">
              <motion.div
                className="text-4xl md:text-5xl font-bold text-green-600 mb-2"
                initial={{ scale: 0 }}
                animate={statsVisible ? { scale: 1 } : { scale: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                {animatedStats.departments}
              </motion.div>
              <p className="text-gray-600 font-medium">Departments</p>
            </div>
            <div className="text-center bg-white rounded-xl p-6 shadow-lg border border-green-100">
              <motion.div
                className="text-4xl md:text-5xl font-bold text-green-600 mb-2"
                initial={{ scale: 0 }}
                animate={statsVisible ? { scale: 1 } : { scale: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                {animatedStats.roles}
              </motion.div>
              <p className="text-gray-600 font-medium">User Roles</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 px-6 py-20 bg-green-600">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Complete{" "}
              <span className="bg-gradient-to-r from-green-200 to-emerald-200 bg-clip-text text-transparent">
                ERP Solution
              </span>
            </h2>
            <p className="text-xl text-white/90 max-w-3xl mx-auto">
              Comprehensive enterprise management platform designed for
              government compliance and security
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 group border border-gray-100"
                whileHover={{ y: -5 }}
              >
                <div
                  className={`w-12 h-12 bg-gradient-to-r ${feature.gradient} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                >
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Security & Compliance Section */}
      <section className="relative z-10 px-6 py-20 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Enterprise{" "}
                <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  Security & Compliance
                </span>
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Built for government agencies and regulated industries with the
                highest security standards
              </p>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <HiShieldCheck className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      SOC 2 Type II Certified
                    </h3>
                    <p className="text-gray-600">
                      Enterprise-grade security with comprehensive audit trails
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <HiKey className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Role-Based Access Control
                    </h3>
                    <p className="text-gray-600">
                      Granular permissions and multi-factor authentication
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <HiDocumentText className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Compliance Ready
                    </h3>
                    <p className="text-gray-600">
                      Built-in compliance frameworks for government regulations
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-100">
                <div className="space-y-6">
                  <div className="flex items-center space-x-3">
                    <HiShieldCheck className="w-8 h-8 text-green-600" />
                    <h3 className="text-xl font-semibold text-gray-900">
                      Security Features
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 font-medium">
                          Data Encryption
                        </span>
                        <HiCheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 font-medium">
                          Audit Logging
                        </span>
                        <HiCheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 font-medium">
                          Access Monitoring
                        </span>
                        <HiCheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 font-medium">
                          Backup & Recovery
                        </span>
                        <HiCheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="relative z-10 px-6 py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              System{" "}
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Benefits
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive features designed for government efficiency and
              compliance
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="flex items-start space-x-4 bg-gradient-to-r from-green-600 to-emerald-600 p-6 rounded-xl shadow-lg border border-green-500/20"
              >
                <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                  <HiCheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <p className="text-white text-lg font-medium">{benefit}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="relative z-10 px-6 py-20 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Trusted by{" "}
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Government Leaders
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See how government agencies are transforming their operations with
              ELRA
            </p>
          </motion.div>

          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.5 }}
                className="bg-gray-50 rounded-2xl p-8 md:p-12 border border-gray-200"
              >
                <div className="text-center max-w-4xl mx-auto">
                  <div className="mb-8">
                    <p className="text-xl md:text-2xl text-gray-700 leading-relaxed italic">
                      "{testimonials[currentSlide].content}"
                    </p>
                  </div>

                  <div className="flex items-center justify-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-xl">
                        {testimonials[currentSlide].name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </span>
                    </div>
                    <div className="text-left">
                      <h4 className="text-lg font-semibold text-gray-900">
                        {testimonials[currentSlide].name}
                      </h4>
                      <p className="text-gray-600">
                        {testimonials[currentSlide].role}
                      </p>
                      <p className="text-green-600 font-medium">
                        {testimonials[currentSlide].company}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-center mt-8 space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentSlide ? "bg-green-600" : "bg-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-6 py-20 bg-gradient-to-r from-green-600 to-emerald-600">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Transform Your{" "}
              <span className="text-green-100">Operations?</span>
            </h2>
            <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
              Join government agencies that have already streamlined their
              operations with ELRA ERP
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleGetStarted}
                className="bg-white text-green-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
              >
                <span>Request Access</span>
                <HiArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={handleSignIn}
                className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white/10 transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <HiLockClosed className="w-5 h-5" />
                <span>Secure Login</span>
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-12 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <ELRALogo variant="light" size="md" />
              <p className="text-white/90 mt-4 max-w-md">
                ELRA - Equipment Leasing Registration Authority. Secure,
                compliant enterprise resource planning for government agencies
                and regulated industries.
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">System</h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#features"
                    className="text-white/80 hover:text-white transition-colors"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#benefits"
                    className="text-white/80 hover:text-white transition-colors"
                  >
                    Benefits
                  </a>
                </li>
                <li>
                  <a
                    href="#testimonials"
                    className="text-white/80 hover:text-white transition-colors"
                  >
                    Testimonials
                  </a>
                </li>
                <li>
                  <Link
                    to="/modules"
                    className="text-white/80 hover:text-white transition-colors"
                  >
                    Modules
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Support</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    to="/legal/privacy"
                    className="text-white/80 hover:text-white transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    to="/legal/terms"
                    className="text-white/80 hover:text-white transition-colors"
                  >
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-white/80 hover:text-white transition-colors"
                  >
                    System Status
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-white/80 hover:text-white transition-colors"
                  >
                    Contact Support
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/20 mt-8 pt-8 text-center">
            <p className="text-white/70">
              © {new Date().getFullYear()} ELRA - Equipment Leasing Registration
              Authority. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
