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
    companies: 0,
    users: 0,
    modules: 0,
    uptime: 0,
  });

  // Background images for hero carousel
  const heroImages = [
    "/src/assets/hero1.jpg",
    "/src/assets/hero2.jpg",
    "/src/assets/Office1.jpg",
    "/src/assets/Office2.jpg",
    "/src/assets/Office3.jpg",
    "/src/assets/cloud1.jpg",
    "/src/assets/cloud2.jpg",
  ];

  const heroContent = [
    {
      word: "Human Resources",
      description:
<<<<<<< HEAD
        "Streamline employee management, recruitment, onboarding, and performance tracking with intelligent HR workflows and automated processes.",
      icon: HiUsers,
=======
        "Transform paper chaos into digital clarity. Organize, search, and access millions of documents instantly with AI-powered categorization and enterprise-grade security.",
      image: electronicDocument1,
>>>>>>> 6c7feb4fac477c4675022f11e738e492b13675b4
    },
    {
      word: "Payroll",
      description:
<<<<<<< HEAD
        "Automated salary processing, benefits management, and payroll reporting with tax calculations and payment tracking.",
      icon: HiCurrencyDollar,
=======
        "Intelligent approval workflows with real-time routing and notifications. Parallel processing, automated escalation, and zero bottlenecks keep decisions flowing smoothly.",
      image: office1,
>>>>>>> 6c7feb4fac477c4675022f11e738e492b13675b4
    },
    {
      word: "Procurement",
      description:
<<<<<<< HEAD
        "End-to-end procurement management from purchase requisitions to vendor management and inventory tracking.",
      icon: HiShoppingCart,
=======
        "Securely powered instant communication within document contexts. Chat, collaborate, and make decisions faster with seamless team messaging integration.",
      image: office2,
>>>>>>> 6c7feb4fac477c4675022f11e738e492b13675b4
    },
    {
      word: "Accounting",
      description:
<<<<<<< HEAD
        "Complete financial management with expense tracking, revenue management, and comprehensive financial reporting.",
      icon: HiChartBar,
=======
        "Never miss critical updates with intelligent email and in-app alerts. Customizable notifications for approvals, deadlines, messages, and document changes.",
      image: office3,
>>>>>>> 6c7feb4fac477c4675022f11e738e492b13675b4
    },
    {
      word: "Communication",
      description:
<<<<<<< HEAD
        "Internal messaging, announcements, and collaboration tools to keep your team connected and informed.",
      icon: HiChat,
=======
        "Military-grade protection for your most sensitive data. Zero-trust architecture, end-to-end encryption, and comprehensive audit trails you can trust.",
      image: encryption1,
    },
    {
      word: "Cloud Platform",
      description:
        "Access your documents anywhere, anytime. Global CDN, 99.9% uptime, and seamless synchronization across all your devices and locations.",
      image: cloud1,
>>>>>>> 6c7feb4fac477c4675022f11e738e492b13675b4
    },
    {
      word: "Business Intelligence",
      description:
<<<<<<< HEAD
        "Advanced analytics and reporting to drive data-driven decisions and optimize your business operations.",
      icon: HiTrendingUp,
=======
        "Lead your industry into the future. Replace legacy processes with intelligent workflows that scale with your ambitions and adapt to your growth.",
      image: hero1,
>>>>>>> 6c7feb4fac477c4675022f11e738e492b13675b4
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
      companies: 500,
      users: 10000,
      modules: 10,
      uptime: 99.9,
    };
    const duration = 2500;
    const steps = 100;
    const interval = duration / steps;

    const timer = setInterval(() => {
      setAnimatedStats((prev) => {
        const newStats = {
          companies: Math.min(
            prev.companies + Math.ceil(targets.companies / steps),
            targets.companies
          ),
          users: Math.min(
            prev.users + Math.ceil(targets.users / steps),
            targets.users
          ),
          modules: Math.min(
            prev.modules + Math.ceil(targets.modules / steps),
            targets.modules
          ),
          uptime: Math.min(
            Math.round((prev.uptime + targets.uptime / steps) * 10) / 10,
            targets.uptime
          ),
        };

        // Stop animation when all targets are reached
        if (
          newStats.companies >= targets.companies &&
          newStats.users >= targets.users &&
          newStats.modules >= targets.modules &&
          newStats.uptime >= targets.uptime
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
<<<<<<< HEAD
=======
      icon: HiDocumentText,
      title: "Intelligent Document Hub",
      description:
        "AI-powered categorization, OCR text extraction, and lightning-fast search across all your business documents.",
      gradient: "from-blue-500 to-cyan-500",
      backgroundImage: electronicDocument2,
    },
    {
>>>>>>> 6c7feb4fac477c4675022f11e738e492b13675b4
      icon: HiUsers,
      title: "Human Resources",
      description:
<<<<<<< HEAD
        "Complete HR management with recruitment, onboarding, performance tracking, and employee self-service portal.",
      gradient: "from-purple-500 to-teal-500",
=======
        "Scale across departments and subsidiaries with isolated workspaces and customizable organizational structures.",
      gradient: "from-cyan-500 to-purple-500",
      backgroundImage: office2,
>>>>>>> 6c7feb4fac477c4675022f11e738e492b13675b4
    },
    {
      icon: HiCurrencyDollar,
      title: "Payroll & Benefits",
      description:
        "Automated payroll processing, benefits administration, tax calculations, and comprehensive reporting.",
      gradient: "from-teal-500 to-purple-500",
    },
    {
      icon: HiShoppingCart,
      title: "Procurement",
      description:
        "End-to-end procurement management from requisitions to vendor management and inventory tracking.",
      gradient: "from-purple-500 to-blue-500",
<<<<<<< HEAD
=======
      backgroundImage: encryption2,
>>>>>>> 6c7feb4fac477c4675022f11e738e492b13675b4
    },
    {
      icon: HiChartBar,
      title: "Accounting",
      description:
<<<<<<< HEAD
        "Complete financial management with expense tracking, revenue management, and financial reporting.",
      gradient: "from-blue-500 to-purple-500",
    },
    {
      icon: HiChat,
      title: "Communication",
      description:
        "Internal messaging, announcements, and collaboration tools to keep your team connected and informed.",
      gradient: "from-purple-500 to-pink-500",
=======
        "Intelligent approval routing with real-time email and in-app notifications. Automated escalation, parallel approvals, and conditional logic ensure documents never get stuck in bottlenecks.",
      gradient: "from-green-500 to-blue-500",
      backgroundImage: office3,
>>>>>>> 6c7feb4fac477c4675022f11e738e492b13675b4
    },
    {
      icon: HiTrendingUp,
      title: "Business Intelligence",
      description:
<<<<<<< HEAD
        "Advanced analytics and reporting to drive data-driven decisions and optimize your business operations.",
      gradient: "from-pink-500 to-purple-500",
    },
    {
      icon: HiShieldCheck,
      title: "Security & Compliance",
      description:
        "Enterprise-grade security with role-based access control, audit trails, and compliance management.",
      gradient: "from-purple-500 to-green-500",
=======
        "Real-time dashboards, usage analytics, and performance metrics to optimize your document processes.",
      gradient: "from-blue-500 to-purple-500",
      backgroundImage: graphs1,
    },
    {
      icon: HiBell,
      title: "Smart Notifications Hub",
      description:
        "Never miss critical updates with intelligent email and in-app notifications. Customizable alerts for approvals, deadlines, document changes, and system events keep your team synchronized.",
      gradient: "from-orange-500 to-red-500",
      backgroundImage: office1,
    },
    {
      icon: HiChat,
      title: "Real-Time Messaging",
      description:
        "Seamless team communication with instant messaging, document discussions, and Socket.IO-powered real-time collaboration. Chat directly within document contexts for faster decision-making.",
      gradient: "from-pink-500 to-purple-500",
      backgroundImage: office2,
>>>>>>> 6c7feb4fac477c4675022f11e738e492b13675b4
    },
    {
      icon: HiGlobe,
      title: "Cloud-Native Platform",
      description:
        "99.9% uptime, global CDN, and seamless mobile access for your distributed workforce.",
<<<<<<< HEAD
      gradient: "from-green-500 to-purple-500",
=======
      gradient: "from-cyan-500 to-green-500",
      backgroundImage: cloud2,
>>>>>>> 6c7feb4fac477c4675022f11e738e492b13675b4
    },
  ];

  const testimonials = [
    {
      name: "Keisha Williams",
      role: "VP of Operations",
      company: "Metropolitan Healthcare Group",
      content:
        "Before ELRA, our HR processes were scattered across different systems. Now we've streamlined employee management and cut onboarding time by 60%. Our compliance team loves the automated audit trails.",
      avatar: "/src/assets/blackwoman1.jpg",
    },
    {
      name: "David Thompson",
      role: "Chief Technology Officer",
      company: "Riverside Manufacturing",
      content:
        "We were drowning in manual processes across our 12 facilities. ELRA gave us a unified ERP platform that scales beautifully. The workflow automation alone has eliminated 3 full-time positions worth of manual work.",
      avatar: "/src/assets/whitemansmiling.jpg",
    },
    {
      name: "Angela Martinez",
      role: "Director of Finance",
      company: "Summit Financial Services",
      content:
        "In financial services, data security isn't optional - it's everything. ELRA's enterprise-grade security and granular permissions give me peace of mind. When auditors ask for specific reports, I can generate them instantly.",
      avatar: "/src/assets/smilingwhitewoman.jpg",
    },
    {
      name: "Marcus Johnson",
      role: "Senior Project Manager",
      company: "Urban Development Corporation",
      content:
        "Managing procurement across multiple sites was a nightmare. ELRA transformed our operations - vendors, contractors, and stakeholders now collaborate seamlessly. We've reduced project delays by 35%.",
      avatar: "/src/assets/blackmale1.jpg",
    },
    {
      name: "Dr. Patricia Chen",
      role: "Research Director",
      company: "BioTech Innovations Lab",
      content:
        "Data integrity is critical in our field. ELRA's integrated approach has revolutionized how our global team manages research data. The analytics features help us make data-driven decisions faster than ever.",
      avatar: "/src/assets/blackwoman2.jpg",
    },
    {
      name: "Robert Anderson",
      role: "Executive Vice President",
      company: "Anderson & Associates",
      content:
        "After 25 years in business, I thought I'd seen every ERP system. ELRA is different - it actually understands how modern businesses work. Our team is 40% more efficient with the integrated workflows.",
      avatar: "/src/assets/ceo.jpg",
    },
  ];

  const benefits = [
    "Integrated ERP modules for seamless business operations",
    "Real-time analytics and business intelligence",
    "Enterprise-grade security and compliance",
    "Cloud-native platform with 99.9% uptime",
    "Mobile-first design for remote work",
    "Customizable workflows and automation",
    "Multi-tenant architecture for scalability",
    "24/7 customer support and training",
  ];

  const handleGetStarted = () => {
    navigate("/modules");
  };

  const handleSignIn = () => {
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-teal-900 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-20 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        <motion.div
          className="absolute top-40 right-20 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl"
          animate={{
            x: [0, -80, 0],
            y: [0, 60, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        <motion.div
          className="absolute bottom-20 left-1/3 w-64 h-64 bg-purple-400/10 rounded-full blur-3xl"
          animate={{
            x: [0, 60, 0],
            y: [0, -40, 0],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <ELRALogo variant="light" size="md" />

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="#features"
              className="text-white/80 hover:text-white transition-colors font-medium"
            >
              Features
            </Link>
            <Link
              to="#benefits"
              className="text-white/80 hover:text-white transition-colors font-medium"
            >
              Benefits
            </Link>
            <Link
              to="#testimonials"
              className="text-white/80 hover:text-white transition-colors font-medium"
            >
              Testimonials
            </Link>
            <button
              onClick={handleSignIn}
              className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-6 py-2 rounded-full hover:bg-white/20 transition-all duration-300 font-medium"
            >
              Sign In
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-white p-2"
          >
            {mobileMenuOpen ? (
              <HiX className="w-6 h-6" />
            ) : (
              <HiMenu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg mt-4 overflow-hidden"
            >
              <div className="px-4 py-4 space-y-4">
                <Link
                  to="#features"
                  className="block text-white/80 hover:text-white transition-colors font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Features
                </Link>
                <Link
                  to="#benefits"
                  className="block text-white/80 hover:text-white transition-colors font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Benefits
                </Link>
                <Link
                  to="#testimonials"
                  className="block text-white/80 hover:text-white transition-colors font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Testimonials
                </Link>
                <button
                  onClick={() => {
                    handleSignIn();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full bg-white/10 border border-white/20 text-white px-6 py-2 rounded-full hover:bg-white/20 transition-all duration-300 font-medium"
                >
                  Sign In
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 px-6 py-20 overflow-hidden">
        {/* Background Image Carousel */}
        <div className="absolute inset-0 z-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentBgImage}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="absolute inset-0"
            >
              <img
                src={heroImages[currentBgImage]}
                alt="ELRA ERP Background"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-purple-900/80 via-purple-800/70 to-teal-900/80"></div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              ELRA{" "}
              <span className="bg-gradient-to-r from-purple-400 to-teal-400 bg-clip-text text-transparent">
                ERP System
              </span>
            </h1>

            {/* Static Subtext */}
            <p className="text-lg md:text-xl text-white/90 mb-3 font-medium">
              Explore Seamless
            </p>

            {/* Animated Changing Module Headers */}
            <div className="h-16 md:h-20 mb-2 flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentWordIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                  className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 to-teal-400 bg-clip-text text-transparent"
                >
                  {heroContent[currentWordIndex].word}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Static Management Text */}
            <p className="text-lg md:text-xl text-white/90 mb-6 font-medium">
              Management
            </p>

            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
              Transform your business with our comprehensive Enterprise Resource
              Planning solution. Manage HR, payroll, procurement, accounting,
              and communication in one unified platform.
            </p>
          </motion.div>

          {/* Animated Feature Cards */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-12"
          >
            {heroContent.slice(0, 4).map((content, index) => (
              <motion.div
                key={index}
                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 text-center"
                whileHover={{ scale: 1.05, y: -5 }}
                transition={{ duration: 0.3 }}
              >
                <content.icon className="w-8 h-8 text-purple-300 mx-auto mb-2" />
                <p className="text-white/90 text-sm font-medium">
                  {content.word}
                </p>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <button
              onClick={handleGetStarted}
              className="bg-gradient-to-r from-purple-500 to-teal-500 text-white px-8 py-4 rounded-full font-semibold text-lg hover:from-purple-600 hover:to-teal-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2"
            >
              <span>Get Started</span>
              <HiArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={handleSignIn}
              className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-white/20 transition-all duration-300 flex items-center space-x-2"
            >
              <HiStar className="w-5 h-5" />
              <span>Sign In</span>
            </button>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section ref={statsRef} className="relative z-10 px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            <div className="text-center">
              <motion.div
                className="text-4xl md:text-5xl font-bold text-white mb-2"
                initial={{ scale: 0 }}
                animate={statsVisible ? { scale: 1 } : { scale: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                {animatedStats.companies.toLocaleString()}+
              </motion.div>
              <p className="text-white/70">Companies</p>
            </div>
            <div className="text-center">
              <motion.div
                className="text-4xl md:text-5xl font-bold text-white mb-2"
                initial={{ scale: 0 }}
                animate={statsVisible ? { scale: 1 } : { scale: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                {animatedStats.users.toLocaleString()}+
              </motion.div>
              <p className="text-white/70">Users</p>
            </div>
            <div className="text-center">
              <motion.div
                className="text-4xl md:text-5xl font-bold text-white mb-2"
                initial={{ scale: 0 }}
                animate={statsVisible ? { scale: 1 } : { scale: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                {animatedStats.modules}
              </motion.div>
              <p className="text-white/70">Modules</p>
            </div>
            <div className="text-center">
              <motion.div
                className="text-4xl md:text-5xl font-bold text-white mb-2"
                initial={{ scale: 0 }}
                animate={statsVisible ? { scale: 1 } : { scale: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                {animatedStats.uptime}%
              </motion.div>
              <p className="text-white/70">Uptime</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Complete{" "}
              <span className="bg-gradient-to-r from-purple-400 to-teal-400 bg-clip-text text-transparent">
                ERP Solution
              </span>
            </h2>
            <p className="text-xl text-white/80 max-w-3xl mx-auto">
              Everything you need to run your business efficiently in one
              integrated platform
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
                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 hover:bg-white/20 transition-all duration-300 group"
                whileHover={{ y: -5 }}
              >
                <div
                  className={`w-12 h-12 bg-gradient-to-r ${feature.gradient} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                >
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-white/70 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
<<<<<<< HEAD
      <section id="benefits" className="relative z-10 px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Why Choose{" "}
              <span className="bg-gradient-to-r from-purple-400 to-teal-400 bg-clip-text text-transparent">
                ELRA
              </span>
            </h2>
            <p className="text-xl text-white/80 max-w-3xl mx-auto">
              Experience the power of integrated business management
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
                className="flex items-start space-x-4"
              >
                <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-teal-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <HiCheckCircle className="w-4 h-4 text-white" />
                </div>
                <p className="text-white/90 text-lg">{benefit}</p>
              </motion.div>
            ))}
=======
      <section
        id="benefits"
        className="relative py-24 bg-white/2 overflow-hidden"
      >
        {/* Background Image */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url(${office4})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl lg:text-4xl font-bold mb-6">
                Why Industry Leaders Choose EDMS
              </h2>
              <p className="text-lg lg:text-xl text-white/70 mb-8 leading-relaxed">
                Trusted by Fortune 500 companies and growing enterprises
                worldwide to transform their document workflows
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={index}
                    className="flex items-center space-x-4 p-4 bg-white/5 backdrop-blur-sm rounded-xl hover:bg-white/8 transition-all duration-300 hover:translate-x-2 group border border-white/5"
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <HiCheckCircle className="text-2xl text-green-400 flex-shrink-0 group-hover:scale-110 transition-transform duration-300" />
                    <span className="text-white font-medium">{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl shadow-black/20 border border-white/10">
                <div className="bg-white/10 px-6 py-4 flex items-center space-x-4">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <span className="text-white/80 font-semibold">
                    EDMS Dashboard
                  </span>
                </div>
                <div
                  className="h-80 relative"
                  style={{
                    backgroundImage: `url(${graphs2})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm">
                    <div className="flex h-full">
                      <div className="w-48 bg-white/5 p-6 space-y-4">
                        <div className="h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg"></div>
                        <div className="h-10 bg-white/10 rounded-lg"></div>
                        <div className="h-10 bg-white/10 rounded-lg"></div>
                        <div className="h-10 bg-white/10 rounded-lg"></div>
                      </div>
                      <div className="flex-1 p-6">
                        <div className="h-16 bg-white/10 rounded-xl mb-6"></div>
                        <div className="grid grid-cols-2 gap-4 h-44">
                          <div className="bg-white/10 rounded-xl animate-pulse"></div>
                          <div
                            className="bg-white/10 rounded-xl animate-pulse"
                            style={{ animationDelay: "0.5s" }}
                          ></div>
                          <div
                            className="bg-white/10 rounded-xl animate-pulse"
                            style={{ animationDelay: "1s" }}
                          ></div>
                          <div
                            className="bg-white/10 rounded-xl animate-pulse"
                            style={{ animationDelay: "1.5s" }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
>>>>>>> 6c7feb4fac477c4675022f11e738e492b13675b4
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
<<<<<<< HEAD
      <section id="testimonials" className="relative z-10 px-6 py-20">
        <div className="max-w-6xl mx-auto">
=======
      <section id="testimonials" className="relative py-24 overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url(${hero2})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
>>>>>>> 6c7feb4fac477c4675022f11e738e492b13675b4
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              What Our{" "}
              <span className="bg-gradient-to-r from-purple-400 to-teal-400 bg-clip-text text-transparent">
                Clients Say
              </span>
            </h2>
            <p className="text-xl text-white/80 max-w-3xl mx-auto">
              Join thousands of satisfied customers who have transformed their
              business with ELRA
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
                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 md:p-12"
              >
                <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
                  <div className="flex-shrink-0">
                    <img
                      src={testimonials[currentSlide].avatar}
                      alt={testimonials[currentSlide].name}
                      className="w-20 h-20 rounded-full object-cover border-4 border-white/20"
                    />
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <p className="text-white/90 text-lg md:text-xl leading-relaxed mb-6 italic">
                      "{testimonials[currentSlide].content}"
                    </p>
                    <div>
                      <h4 className="text-white font-semibold text-lg">
                        {testimonials[currentSlide].name}
                      </h4>
                      <p className="text-white/70">
                        {testimonials[currentSlide].role} at{" "}
                        {testimonials[currentSlide].company}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Testimonial Indicators */}
            <div className="flex justify-center mt-8 space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentSlide
                      ? "bg-gradient-to-r from-purple-400 to-teal-400"
                      : "bg-white/30"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
<<<<<<< HEAD
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
=======
      <section className="relative py-24 overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${illustration1})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 via-purple-900/80 to-cyan-900/80"></div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
>>>>>>> 6c7feb4fac477c4675022f11e738e492b13675b4
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Transform Your{" "}
              <span className="bg-gradient-to-r from-purple-400 to-teal-400 bg-clip-text text-transparent">
                Business?
              </span>
            </h2>
            <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              Join thousands of companies that have already streamlined their
              operations with ELRA ERP
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-purple-500 to-teal-500 text-white px-8 py-4 rounded-full font-semibold text-lg hover:from-purple-600 hover:to-teal-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
              >
                <span>Start Your Free Trial</span>
                <HiArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={handleSignIn}
                className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-white/20 transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <HiStar className="w-5 h-5" />
                <span>Sign In</span>
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <ELRALogo variant="light" size="md" />
              <p className="text-white/70 mt-4 max-w-md">
                Transform your business with our comprehensive Enterprise
                Resource Planning solution. Manage HR, payroll, procurement,
                accounting, and communication in one unified platform.
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#features"
                    className="text-white/70 hover:text-white transition-colors"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#benefits"
                    className="text-white/70 hover:text-white transition-colors"
                  >
                    Benefits
                  </a>
                </li>
                <li>
                  <a
                    href="#testimonials"
                    className="text-white/70 hover:text-white transition-colors"
                  >
                    Testimonials
                  </a>
                </li>
                <li>
                  <Link
                    to="/modules"
                    className="text-white/70 hover:text-white transition-colors"
                  >
                    Modules
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    to="/legal/privacy"
                    className="text-white/70 hover:text-white transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    to="/legal/terms"
                    className="text-white/70 hover:text-white transition-colors"
                  >
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-white/70 hover:text-white transition-colors"
                  >
                    Support
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-white/70 hover:text-white transition-colors"
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 mt-8 pt-8 text-center">
            <p className="text-white/50">
              &copy; {new Date().getFullYear()} ELRA ERP System. All rights
              reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
