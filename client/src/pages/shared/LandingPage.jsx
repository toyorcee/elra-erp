import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiDocumentText,
  HiUsers,
  HiShieldCheck,
  HiCog,
  HiTrendingUp,
  HiGlobe,
  HiLightningBolt,
  HiCheckCircle,
  HiArrowRight,
  HiPlay,
  HiMenu,
  HiX,
  HiBell,
  HiChat,
  HiStar,
  HiSparkles,
} from "react-icons/hi";
import EDMSLogo from "../../components/EDMSLogo";
import { getSubscriptionPlans } from "../../services/subscriptions.js";
import SubscriptionForm from "./SubscriptionForm.jsx";

const LandingPage = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [subscriptionPlans, setSubscriptionPlans] = useState({});
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [showSubscriptionForm, setShowSubscriptionForm] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [animatedStats, setAnimatedStats] = useState({
    documents: 0,
    users: 0,
    companies: 0,
    uptime: 0,
  });

  // Sliding words and contextual content for hero section
  const heroContent = [
    {
      word: "Document Workflows",
      description:
        "Transform paper chaos into digital clarity. Organize, search, and access millions of documents instantly with AI-powered categorization and enterprise-grade security.",
      image: "/src/assets/ElectronicDocument1.jpg",
    },
    {
      word: "Approval Systems",
      description:
        "Intelligent approval workflows with real-time routing and notifications. Parallel processing, automated escalation, and zero bottlenecks keep decisions flowing smoothly.",
      image: "/src/assets/Office1.jpg",
    },
    {
      word: "Team Collaboration",
      description:
        "Securely powered instant communication within document contexts. Chat, collaborate, and make decisions faster with seamless team messaging integration.",
      image: "/src/assets/Office2.jpg",
    },
    {
      word: "Smart Automation",
      description:
        "Never miss critical updates with intelligent email and in-app alerts. Customizable notifications for approvals, deadlines, messages, and document changes.",
      image: "/src/assets/Office3.jpg",
    },
    {
      word: "Enterprise Security",
      description:
        "Military-grade protection for your most sensitive data. Zero-trust architecture, end-to-end encryption, and comprehensive audit trails you can trust.",
      image: "/src/assets/Encryption1.jpg",
    },
    {
      word: "Cloud Platform",
      description:
        "Access your documents anywhere, anytime. Global CDN, 99.9% uptime, and seamless synchronization across all your devices and locations.",
      image: "/src/assets/cloud1.jpg",
    },
    {
      word: "Business Intelligence",
      description:
        "Lead your industry into the future. Replace legacy processes with intelligent workflows that scale with your ambitions and adapt to your growth.",
      image: "/src/assets/hero1.jpg",
    },
  ];

  // Animated statistics with intersection observer
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef(null);

  // Fetch subscription plans
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const data = await getSubscriptionPlans();
        if (data.success) {
          setSubscriptionPlans(data.data);
        }
      } catch (error) {
        console.error("Error fetching subscription plans:", error);
      } finally {
        setLoadingPlans(false);
      }
    };

    fetchPlans();
  }, []);

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
      documents: 50000,
      users: 2500,
      companies: 150,
      uptime: 99.9,
    };
    const duration = 2500;
    const steps = 100;
    const interval = duration / steps;

    const timer = setInterval(() => {
      setAnimatedStats((prev) => {
        const newStats = {
          documents: Math.min(
            prev.documents + Math.ceil(targets.documents / steps),
            targets.documents
          ),
          users: Math.min(
            prev.users + Math.ceil(targets.users / steps),
            targets.users
          ),
          companies: Math.min(
            prev.companies + Math.ceil(targets.companies / steps),
            targets.companies
          ),
          uptime: Math.min(
            prev.uptime + targets.uptime / steps,
            targets.uptime
          ),
        };

        // Stop animation when all targets are reached
        if (
          newStats.documents >= targets.documents &&
          newStats.users >= targets.users &&
          newStats.companies >= targets.companies &&
          newStats.uptime >= targets.uptime
        ) {
          clearInterval(timer);
        }

        return newStats;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [statsVisible]);

  // Auto-slide for testimonials
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Auto-slide for hero content
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentWordIndex((prev) => (prev + 1) % heroContent.length);
      setCurrentImageIndex((prev) => (prev + 1) % heroContent.length);
    }, 4000); // Increased to 4 seconds for better readability
    return () => clearInterval(timer);
  }, [heroContent.length]);

  const features = [
    {
      icon: HiDocumentText,
      title: "Intelligent Document Hub",
      description:
        "AI-powered categorization, OCR text extraction, and lightning-fast search across all your business documents.",
      gradient: "from-blue-500 to-cyan-500",
      backgroundImage: "/src/assets/ElectronicDocument2.jpg",
    },
    {
      icon: HiUsers,
      title: "Enterprise Multi-Tenancy",
      description:
        "Scale across departments and subsidiaries with isolated workspaces and customizable organizational structures.",
      gradient: "from-cyan-500 to-purple-500",
      backgroundImage: "/src/assets/Office2.jpg",
    },
    {
      icon: HiShieldCheck,
      title: "Zero-Trust Security",
      description:
        "Military-grade encryption, granular permissions, and comprehensive audit trails for complete document security.",
      gradient: "from-purple-500 to-blue-500",
      backgroundImage: "/src/assets/Encryption2.jpg",
    },
    {
      icon: HiCog,
      title: "Seamless Approval Workflows",
      description:
        "Intelligent approval routing with real-time email and in-app notifications. Automated escalation, parallel approvals, and conditional logic ensure documents never get stuck in bottlenecks.",
      gradient: "from-green-500 to-blue-500",
      backgroundImage: "/src/assets/Office3.jpg",
    },
    {
      icon: HiTrendingUp,
      title: "Business Intelligence",
      description:
        "Real-time dashboards, usage analytics, and performance metrics to optimize your document processes.",
      gradient: "from-blue-500 to-purple-500",
      backgroundImage: "/src/assets/graphs1.jpg",
    },
    {
      icon: HiBell,
      title: "Smart Notifications Hub",
      description:
        "Never miss critical updates with intelligent email and in-app notifications. Customizable alerts for approvals, deadlines, document changes, and system events keep your team synchronized.",
      gradient: "from-orange-500 to-red-500",
      backgroundImage: "/src/assets/Office1.jpg",
    },
    {
      icon: HiChat,
      title: "Real-Time Messaging",
      description:
        "Seamless team communication with instant messaging, document discussions, and Socket.IO-powered real-time collaboration. Chat directly within document contexts for faster decision-making.",
      gradient: "from-pink-500 to-purple-500",
      backgroundImage: "/src/assets/Office2.jpg",
    },
    {
      icon: HiGlobe,
      title: "Cloud-Native Platform",
      description:
        "99.9% uptime, global CDN, and seamless mobile access for your distributed workforce.",
      gradient: "from-cyan-500 to-green-500",
      backgroundImage: "/src/assets/cloud2.jpg",
    },
  ];

  const testimonials = [
    {
      name: "Keisha Williams",
      role: "VP of Operations",
      company: "Metropolitan Healthcare Group",
      content:
        "Before EDMS, our patient records were scattered across different systems. Now we've cut document retrieval time from 15 minutes to under 30 seconds. Our compliance team loves the automated audit trails - it's saved us countless hours during regulatory reviews.",
      avatar: "/src/assets/blackwoman1.jpg",
    },
    {
      name: "David Thompson",
      role: "Chief Technology Officer",
      company: "Riverside Manufacturing",
      content:
        "We were drowning in paper processes across our 12 facilities. EDMS gave us a unified digital workspace that scales beautifully. The workflow automation alone has eliminated 3 full-time positions worth of manual document routing. ROI was evident within 6 months.",
      avatar: "/src/assets/whitemansmiling.jpg",
    },
    {
      name: "Angela Martinez",
      role: "Director of Legal Affairs",
      company: "Summit Financial Services",
      content:
        "In financial services, document security isn't optional - it's everything. EDMS's zero-trust architecture and granular permissions give me peace of mind. When auditors ask for specific documents from 2019, I can pull them up in seconds instead of days.",
      avatar: "/src/assets/smilingwhitewoman.jpg",
    },
    {
      name: "Marcus Johnson",
      role: "Senior Project Manager",
      company: "Urban Development Corporation",
      content:
        "Managing construction documents across multiple sites was a nightmare. EDMS transformed our project delivery - architects, contractors, and city officials now collaborate seamlessly. We've reduced project delays by 35% just from better document coordination.",
      avatar: "/src/assets/blackmale1.jpg",
    },
    {
      name: "Dr. Patricia Chen",
      role: "Research Director",
      company: "BioTech Innovations Lab",
      content:
        "Research data integrity is critical in our field. EDMS's version control and collaboration features have revolutionized how our global team shares findings. The AI-powered search finds relevant research papers in our 50TB database instantly - it's like having a research assistant.",
      avatar: "/src/assets/blackwoman2.jpg",
    },
    {
      name: "Robert Anderson",
      role: "Executive Vice President",
      company: "Anderson & Associates Law Firm",
      content:
        "After 25 years in legal practice, I thought I'd seen every document management system. EDMS is different - it actually understands how lawyers work. Case file organization, client confidentiality, and billable hour tracking are seamlessly integrated. Our junior associates are 40% more efficient.",
      avatar: "/src/assets/ceo.jpg",
    },
  ];

  const benefits = [
    "Seamless approval workflows with intelligent routing",
    "Real-time messaging and Socket.IO-powered collaboration",
    "Instant email and in-app notifications for all stakeholders",
    "Document-context chat for faster decision-making",
    "Automated escalation and parallel approval processes",
    "Reduce document search time by 90% with AI-powered search",
    "Meet SOX, GDPR, and industry compliance requirements",
    "Enterprise-grade 99.9% uptime with global redundancy",
    "Smart notification preferences and customizable alerts",
    "Zero bottlenecks with conditional workflow logic",
  ];

  const handlePlanSelection = (plan) => {
    setSelectedPlan(plan);
    setShowSubscriptionForm(true);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <EDMSLogo />
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a
                href="#features"
                className="text-white/80 hover:text-white transition-colors duration-300 font-medium relative group"
              >
                Features
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 group-hover:w-full transition-all duration-300"></span>
              </a>
              <a
                href="#pricing"
                className="text-white/80 hover:text-white transition-colors duration-300 font-medium relative group"
              >
                Pricing
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 group-hover:w-full transition-all duration-300"></span>
              </a>
              <a
                href="#benefits"
                className="text-white/80 hover:text-white transition-colors duration-300 font-medium relative group"
              >
                Benefits
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 group-hover:w-full transition-all duration-300"></span>
              </a>
              <a
                href="#testimonials"
                className="text-white/80 hover:text-white transition-colors duration-300 font-medium relative group"
              >
                Testimonials
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 group-hover:w-full transition-all duration-300"></span>
              </a>
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
                {/* Mobile Navigation Links */}
                <motion.a
                  href="#features"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-white/80 hover:text-white font-medium py-3 px-4 rounded-lg hover:bg-white/5 transition-all duration-300"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  Features
                </motion.a>
                <motion.a
                  href="#pricing"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-white/80 hover:text-white font-medium py-3 px-4 rounded-lg hover:bg-white/5 transition-all duration-300"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  Pricing
                </motion.a>
                <motion.a
                  href="#benefits"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-white/80 hover:text-white font-medium py-3 px-4 rounded-lg hover:bg-white/5 transition-all duration-300"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  Benefits
                </motion.a>
                <motion.a
                  href="#testimonials"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-white/80 hover:text-white font-medium py-3 px-4 rounded-lg hover:bg-white/5 transition-all duration-300"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  Testimonials
                </motion.a>

                {/* Mobile Action Buttons */}
                <div className="pt-4 space-y-3 border-t border-white/10">
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <Link
                      to="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-center py-3 px-6 rounded-full font-semibold transition-all duration-300 transform hover:scale-105"
                    >
                      Get Started Free
                    </Link>
                  </motion.div>
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block w-full bg-transparent border-2 border-white/20 hover:border-white/40 hover:bg-white/10 text-white text-center py-3 px-6 rounded-full font-semibold transition-all duration-300"
                    >
                      Sign In
                    </Link>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background Image Slider */}
        <div className="absolute inset-0">
          {heroContent.map((content, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentImageIndex ? "opacity-100" : "opacity-0"
              }`}
              style={{
                backgroundImage: `url(${content.image})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
              }}
            />
          ))}
          {/* Dark overlay for text clarity */}
          <div className="absolute inset-0 bg-slate-900/70"></div>
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-slate-900/40 to-transparent"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center lg:text-left"
            >
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Revolutionize Your
                <div className="h-16 sm:h-20 overflow-hidden mt-2">
                  <motion.span
                    key={currentWordIndex}
                    initial={{ y: 100, opacity: 0, scale: 0.8 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: -100, opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="block bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent"
                  >
                    {heroContent[currentWordIndex]?.word}
                  </motion.span>
                </div>
              </h1>
              <motion.p
                key={`desc-${currentWordIndex}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-lg sm:text-xl text-white/90 mb-8 leading-relaxed max-w-2xl"
              >
                {heroContent[currentWordIndex]?.description}
              </motion.p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  to="/register"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-full font-semibold transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/25 flex items-center justify-center"
                >
                  <span>Get Started Free</span>
                  <HiArrowRight className="ml-2" />
                </Link>
                <button className="bg-transparent border-2 border-white/20 hover:border-white/40 hover:bg-white/10 text-white px-8 py-4 rounded-full font-semibold transition-all duration-300 flex items-center justify-center">
                  <HiPlay className="mr-2" />
                  Watch Demo
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative h-96 lg:h-[500px] hidden lg:block"
            >
              <div className="relative w-full h-full">
                <motion.div
                  animate={{ y: [0, -20, 0] }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute top-10 left-10 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 flex flex-col items-center space-y-3"
                >
                  <HiDocumentText className="text-3xl text-blue-400" />
                  <span className="text-white font-semibold">
                    Smart Organization
                  </span>
                </motion.div>
                <motion.div
                  animate={{ y: [0, -15, 0] }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 2,
                  }}
                  className="absolute top-40 right-20 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 flex flex-col items-center space-y-3"
                >
                  <HiShieldCheck className="text-3xl text-green-400" />
                  <span className="text-white font-semibold">
                    Secure Access
                  </span>
                </motion.div>
                <motion.div
                  animate={{ y: [0, -25, 0] }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 4,
                  }}
                  className="absolute bottom-20 left-30 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 flex flex-col items-center space-y-3"
                >
                  <HiUsers className="text-3xl text-purple-400" />
                  <span className="text-white font-semibold">
                    Team Collaboration
                  </span>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section ref={statsRef} className="py-16 bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <motion.div
                className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2"
                animate={statsVisible ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.3, delay: 0.5 }}
              >
                {animatedStats.documents.toLocaleString()}+
              </motion.div>
              <div className="text-white/70 font-medium text-sm uppercase tracking-wide">
                Documents Managed
              </div>
            </motion.div>
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <motion.div
                className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2"
                animate={statsVisible ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.3, delay: 0.7 }}
              >
                {animatedStats.users.toLocaleString()}+
              </motion.div>
              <div className="text-white/70 font-medium text-sm uppercase tracking-wide">
                Active Users
              </div>
            </motion.div>
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <motion.div
                className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2"
                animate={statsVisible ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.3, delay: 0.9 }}
              >
                {animatedStats.companies}+
              </motion.div>
              <div className="text-white/70 font-medium text-sm uppercase tracking-wide">
                Companies Trust Us
              </div>
            </motion.div>
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <motion.div
                className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2"
                animate={statsVisible ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.3, delay: 1.1 }}
              >
                {animatedStats.uptime.toFixed(1)}%
              </motion.div>
              <div className="text-white/70 font-medium text-sm uppercase tracking-wide">
                Uptime Guarantee
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Enterprise-Grade Document Management
            </h2>
            <p className="text-lg lg:text-xl text-white/70 max-w-3xl mx-auto leading-relaxed">
              Comprehensive features designed for organizations that demand
              security, scalability, and efficiency
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center hover:bg-white/8 hover:border-white/20 transition-all duration-300 hover:shadow-2xl hover:shadow-black/20 group overflow-hidden"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
              >
                {/* Background Image */}
                <div
                  className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-300"
                  style={{
                    backgroundImage: `url(${feature.backgroundImage})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
                <div className="relative z-10">
                  <div
                    className={`w-20 h-20 rounded-2xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}
                  >
                    <feature.icon className="text-2xl text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-4">{feature.title}</h3>
                  <p className="text-white/70 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-white/2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Choose Your Perfect Plan
            </h2>
            <p className="text-lg lg:text-xl text-white/70 max-w-3xl mx-auto leading-relaxed mb-8">
              Scale with confidence. Start small and grow with flexible plans
              designed for every stage of your business.
            </p>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center space-x-4 mb-12">
              <span
                className={`text-sm font-medium transition-colors duration-300 ${
                  billingCycle === "monthly" ? "text-white" : "text-white/60"
                }`}
              >
                Monthly
              </span>
              <button
                onClick={() =>
                  setBillingCycle(
                    billingCycle === "monthly" ? "yearly" : "monthly"
                  )
                }
                className="relative w-16 h-8 bg-white/10 backdrop-blur-sm rounded-full p-1 transition-all duration-300 hover:bg-white/20"
              >
                <motion.div
                  className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full shadow-lg"
                  animate={{ x: billingCycle === "yearly" ? 32 : 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                />
              </button>
              <span
                className={`text-sm font-medium transition-colors duration-300 ${
                  billingCycle === "yearly" ? "text-white" : "text-white/60"
                }`}
              >
                Yearly
                <span className="ml-2 px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                  Save 17%
                </span>
              </span>
            </div>
          </motion.div>

          {loadingPlans ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[1, 2, 3, 4].map((index) => (
                <motion.div
                  key={index}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 animate-pulse"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <div className="h-8 bg-white/10 rounded mb-4"></div>
                  <div className="h-12 bg-white/10 rounded mb-6"></div>
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-4 bg-white/10 rounded"></div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 auto-rows-fr">
              {Object.entries(subscriptionPlans).map(
                ([planKey, plan], index) => (
                  <motion.div
                    key={planKey}
                    className={`relative bg-white/5 backdrop-blur-sm border rounded-2xl p-8 transition-all duration-300 hover:shadow-2xl hover:shadow-black/20 group overflow-hidden flex flex-col ${
                      planKey === "professional"
                        ? "border-purple-500/50 bg-gradient-to-b from-purple-500/10 to-transparent scale-105"
                        : "border-white/10 hover:border-white/20"
                    }`}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    whileHover={{ y: -5 }}
                  >
                    {/* Header Section - Fixed Height */}
                    <div className="flex-shrink-0">
                      {/* Popular Badge */}
                      {planKey === "professional" && (
                        <div className="text-center mb-4">
                          <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center justify-center space-x-2 inline-block">
                            <HiStar className="w-4 h-4" />
                            <span>Most Popular</span>
                          </div>
                        </div>
                      )}

                      {/* Plan Icon */}
                      <div className="text-center mb-6">
                        {planKey === "starter" && (
                          <HiArrowRight className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                        )}
                        {planKey === "business" && (
                          <HiSparkles className="w-12 h-12 text-green-400 mx-auto mb-4" />
                        )}
                        {planKey === "professional" && (
                          <HiStar className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                        )}
                        {planKey === "enterprise" && (
                          <HiStar className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                        )}

                        <h3 className="text-2xl font-bold mb-2">
                          {plan.displayName}
                        </h3>
                        <p className="text-white/60 text-sm">
                          {plan.description}
                        </p>
                      </div>

                      {/* Price */}
                      <div className="text-center mb-8">
                        <div className="flex items-center justify-center space-x-2 mb-2">
                          <span className="text-4xl font-bold">
                            $
                            {billingCycle === "yearly"
                              ? plan.price.yearly
                              : plan.price.monthly}
                          </span>
                          <span className="text-white/60">
                            /{billingCycle === "yearly" ? "year" : "month"}
                          </span>
                        </div>
                        {billingCycle === "yearly" && (
                          <p className="text-green-400 text-sm font-medium">
                            Save $
                            {(
                              plan.price.monthly * 12 -
                              plan.price.yearly
                            ).toFixed(2)}{" "}
                            annually
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Features Section - Flexible Height */}
                    <div className="flex-grow space-y-4 mb-8">
                      <div className="flex items-center space-x-3">
                        <HiCheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                        <span className="text-sm">
                          {plan.features.maxUsers === -1
                            ? "Unlimited"
                            : plan.features.maxUsers}{" "}
                          Users
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <HiCheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                        <span className="text-sm">
                          {plan.features.maxStorage}GB Storage
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <HiCheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                        <span className="text-sm">
                          {plan.features.maxDepartments === -1
                            ? "Unlimited"
                            : plan.features.maxDepartments}{" "}
                          Departments
                        </span>
                      </div>
                      {plan.features.customWorkflows && (
                        <div className="flex items-center space-x-3">
                          <HiCheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                          <span className="text-sm">Custom Workflows</span>
                        </div>
                      )}
                      {plan.features.advancedAnalytics && (
                        <div className="flex items-center space-x-3">
                          <HiCheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                          <span className="text-sm">Advanced Analytics</span>
                        </div>
                      )}
                      {plan.features.prioritySupport && (
                        <div className="flex items-center space-x-3">
                          <HiCheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                          <span className="text-sm">Priority Support</span>
                        </div>
                      )}
                      {plan.features.customBranding && (
                        <div className="flex items-center space-x-3">
                          <HiCheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                          <span className="text-sm">Custom Branding</span>
                        </div>
                      )}
                      {plan.features.apiAccess && (
                        <div className="flex items-center space-x-3">
                          <HiCheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                          <span className="text-sm">API Access</span>
                        </div>
                      )}
                      {plan.features.sso && (
                        <div className="flex items-center space-x-3">
                          <HiCheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                          <span className="text-sm">SSO Integration</span>
                        </div>
                      )}
                    </div>

                    {/* CTA Button - Fixed at Bottom */}
                    <div className="flex-shrink-0">
                      <button
                        onClick={() => handlePlanSelection(plan)}
                        className={`block w-full py-3 px-6 rounded-xl font-semibold text-center transition-all duration-300 transform hover:scale-105 ${
                          planKey === "professional"
                            ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg shadow-purple-500/25"
                            : "bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/40"
                        }`}
                      >
                        Get Started
                      </button>
                    </div>
                  </motion.div>
                )
              )}
            </div>
          )}
        </div>
      </section>

      {/* Benefits Section */}
      <section
        id="benefits"
        className="relative py-24 bg-white/2 overflow-hidden"
      >
        {/* Background Image */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url('/src/assets/Office4.jpg')`,
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
                    backgroundImage: `url('/src/assets/graphs2.jpg')`,
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
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="relative py-24 overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url('/src/assets/hero2.jpg')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Trusted by Industry Leaders
            </h2>
            <p className="text-lg lg:text-xl text-white/70 max-w-3xl mx-auto leading-relaxed">
              See how organizations are transforming their document management
              with EDMS
            </p>
          </motion.div>
          <div className="relative overflow-hidden rounded-2xl">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {testimonials.map((testimonial, index) => (
                <div key={index} className="w-full flex-shrink-0 px-4">
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 lg:p-12 text-center max-w-4xl mx-auto">
                    <div className="mb-8">
                      <p className="text-lg lg:text-xl text-white/90 italic leading-relaxed">
                        "{testimonial.content}"
                      </p>
                    </div>
                    <div className="flex items-center justify-center space-x-4">
                      <img
                        src={testimonial.avatar}
                        alt={testimonial.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                      <div className="text-left">
                        <h4 className="font-bold text-white">
                          {testimonial.name}
                        </h4>
                        <p className="text-white/70">{testimonial.role}</p>
                        <span className="text-white/50 text-sm">
                          {testimonial.company}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-center space-x-2 mt-8">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentSlide
                      ? "bg-gradient-to-r from-blue-500 to-purple-500 scale-125"
                      : "bg-white/30 hover:bg-white/50"
                  }`}
                  onClick={() => setCurrentSlide(index)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url('/src/assets/illustration1.jpg')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 via-purple-900/80 to-cyan-900/80"></div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl lg:text-5xl font-bold mb-6 leading-tight">
              Ready to Transform Your Document Workflows?
            </h2>
            <p className="text-lg lg:text-xl text-white/80 mb-10 leading-relaxed max-w-2xl mx-auto">
              Choose the perfect plan for your organization. Start with our
              flexible pricing and scale as you grow. Experience the future of
              document management today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-10 py-4 rounded-full font-semibold text-lg transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/25 flex items-center justify-center"
              >
                Start Your Free Trial
                <HiArrowRight className="ml-2" />
              </Link>
              <Link
                to="/login"
                className="bg-transparent border-2 border-white/20 hover:border-white/40 hover:bg-white/10 text-white px-10 py-4 rounded-full font-semibold text-lg transition-all duration-300 flex items-center justify-center"
              >
                Sign In
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
            <div className="lg:col-span-1">
              <EDMSLogo />
              <p className="text-white/70 mt-4 leading-relaxed">
                Transforming document management for modern enterprises
              </p>
            </div>
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h4 className="font-bold text-white mb-4">Product</h4>
                <div className="space-y-2">
                  <a
                    href="#features"
                    className="block text-white/70 hover:text-white transition-colors duration-300"
                  >
                    Features
                  </a>
                  <a
                    href="#pricing"
                    className="block text-white/70 hover:text-white transition-colors duration-300"
                  >
                    Pricing
                  </a>
                  <a
                    href="#benefits"
                    className="block text-white/70 hover:text-white transition-colors duration-300"
                  >
                    Benefits
                  </a>
                </div>
              </div>
              <div>
                <h4 className="font-bold text-white mb-4">Company</h4>
                <div className="space-y-2">
                  <a
                    href="#about"
                    className="block text-white/70 hover:text-white transition-colors duration-300"
                  >
                    About
                  </a>
                  <a
                    href="#contact"
                    className="block text-white/70 hover:text-white transition-colors duration-300"
                  >
                    Contact
                  </a>
                  <a
                    href="#careers"
                    className="block text-white/70 hover:text-white transition-colors duration-300"
                  >
                    Careers
                  </a>
                </div>
              </div>
              <div>
                <h4 className="font-bold text-white mb-4">Support</h4>
                <div className="space-y-2">
                  <a
                    href="#help"
                    className="block text-white/70 hover:text-white transition-colors duration-300"
                  >
                    Help Center
                  </a>
                  <a
                    href="#docs"
                    className="block text-white/70 hover:text-white transition-colors duration-300"
                  >
                    Documentation
                  </a>
                  <a
                    href="#api"
                    className="block text-white/70 hover:text-white transition-colors duration-300"
                  >
                    API
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 text-center">
            <p className="text-white/50">
              &copy; {new Date().getFullYear()} EDMS. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Subscription Form Modal */}
      {showSubscriptionForm && selectedPlan && (
        <SubscriptionForm
          selectedPlan={selectedPlan}
          billingCycle={billingCycle}
          onClose={() => {
            setShowSubscriptionForm(false);
            setSelectedPlan(null);
          }}
          onSuccess={() => {
            setShowSubscriptionForm(false);
            setSelectedPlan(null);
          }}
        />
      )}
    </div>
  );
};

export default LandingPage;
