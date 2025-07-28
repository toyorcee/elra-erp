import React, { useState, useRef, useEffect } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  useSpring,
} from "framer-motion";
import { useNavigate } from "react-router-dom";
import Lottie from "lottie-react";
import {
  HiOfficeBuilding,
  HiShieldCheck,
  HiCog,
  HiUserGroup,
  HiDocumentText,
  HiArrowRight,
  HiArrowLeft,
  HiSparkles,
  HiCheck,
  HiX,
} from "react-icons/hi";
import EDMSLogo from "../../components/EDMSLogo";
import { systemSetupAPI } from "../../services/api.js";
import { toast } from "react-toastify";

// Beautiful blue loading animation URL from LottieFiles
const loadingAnimationUrl =
  "https://assets5.lottiefiles.com/packages/lf20_p8bfn2to.json";

const SystemSetupOnboarding = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedIndustry, setSelectedIndustry] = useState(null);
  const [selectedSetup, setSelectedSetup] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [industryTemplates, setIndustryTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lottieLoaded, setLottieLoaded] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchIndustryTemplates();
  }, []);

  const fetchIndustryTemplates = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await systemSetupAPI.getIndustryTemplates();

      if (response.data.success) {
        // Transform backend data to match frontend structure
        const transformedTemplates = response.data.data.map(
          (template, index) => ({
            ...template,
            icon: getIconForIndustry(template.id),
            gradient: getGradientForIndustry(template.id),
            particles: getParticlesForIndustry(template.id),
            tiltIntensity: getTiltIntensityForIndustry(template.id),
          })
        );

        setIndustryTemplates(transformedTemplates);
      } else {
        setError("Failed to load industry templates");
        toast.error("Failed to load industry templates");
      }
    } catch (error) {
      console.error("Error fetching industry templates:", error);
      setError("Failed to load industry templates");
      toast.error("Failed to load industry templates. Please try again.");

      // Fallback to default templates if API fails
      setIndustryTemplates(getDefaultTemplates());
    } finally {
      setLoading(false);
    }
  };

  // Helper functions to add frontend-specific properties
  const getIconForIndustry = (industryId) => {
    const iconMap = {
      court_system: HiShieldCheck,
      banking_system: HiOfficeBuilding,
      healthcare_system: HiShieldCheck,
      manufacturing_system: HiCog,
      custom: HiSparkles,
    };
    return iconMap[industryId] || HiOfficeBuilding;
  };

  const getGradientForIndustry = (industryId) => {
    const gradientMap = {
      court_system: "from-blue-500 via-indigo-500 to-purple-500",
      banking_system: "from-green-500 via-emerald-500 to-teal-500",
      healthcare_system: "from-red-500 via-pink-500 to-purple-500",
      manufacturing_system: "from-orange-500 via-amber-500 to-yellow-500",
      custom: "from-purple-500 via-pink-500 to-indigo-500",
    };
    return (
      gradientMap[industryId] || "from-blue-500 via-cyan-500 to-purple-500"
    );
  };

  const getParticlesForIndustry = (industryId) => {
    const particleMap = {
      court_system: 12,
      banking_system: 10,
      healthcare_system: 14,
      manufacturing_system: 16,
      custom: 20,
    };
    return particleMap[industryId] || 10;
  };

  const getTiltIntensityForIndustry = (industryId) => {
    const tiltMap = {
      court_system: 15,
      banking_system: 18,
      healthcare_system: 12,
      manufacturing_system: 20,
      custom: 25,
    };
    return tiltMap[industryId] || 15;
  };

  // Fallback default templates in case API fails
  const getDefaultTemplates = () => [
    {
      id: "court_system",
      name: "Court System",
      description:
        "Document management and approval workflows for judicial systems",
      icon: HiShieldCheck,
      gradient: "from-blue-500 via-indigo-500 to-purple-500",
      features: [
        "Case Filing Workflows",
        "Legal Document Management",
        "Judge Approval System",
        "Evidence Tracking",
        "Settlement Processing",
      ],
      approvalLevels: [
        "Court Clerk",
        "Senior Clerk",
        "Magistrate Judge",
        "District Judge",
      ],
      particles: 12,
      tiltIntensity: 15,
    },
    {
      id: "banking_system",
      name: "Banking System",
      description: "Financial document management and compliance workflows",
      icon: HiOfficeBuilding,
      gradient: "from-green-500 via-emerald-500 to-teal-500",
      features: [
        "Loan Application Processing",
        "Transaction Documentation",
        "Compliance Reporting",
        "Customer Document Management",
        "Audit Trail System",
      ],
      approvalLevels: [
        "Teller",
        "Senior Teller",
        "Branch Manager",
        "Regional Manager",
      ],
      particles: 10,
      tiltIntensity: 18,
    },
    {
      id: "healthcare_system",
      name: "Healthcare System",
      description: "Medical document management and patient care workflows",
      icon: HiShieldCheck,
      gradient: "from-red-500 via-pink-500 to-purple-500",
      features: [
        "Patient Record Management",
        "Medical Report Processing",
        "Treatment Plan Approval",
        "Prescription Tracking",
        "HIPAA Compliance",
      ],
      approvalLevels: ["Nurse", "Senior Nurse", "Doctor", "Chief of Medicine"],
      particles: 14,
      tiltIntensity: 12,
    },
    {
      id: "manufacturing_system",
      name: "Manufacturing System",
      description:
        "Production document management and quality control workflows",
      icon: HiCog,
      gradient: "from-orange-500 via-amber-500 to-yellow-500",
      features: [
        "Production Documentation",
        "Quality Control Processes",
        "Safety Report Management",
        "Budget Approval Workflows",
        "Policy Management",
      ],
      approvalLevels: [
        "Production Worker",
        "Supervisor",
        "Manager",
        "Plant Director",
      ],
      particles: 16,
      tiltIntensity: 20,
    },
    {
      id: "custom",
      name: "Custom Setup",
      description: "Create your own approval levels and workflow templates",
      icon: HiSparkles,
      gradient: "from-purple-500 via-pink-500 to-indigo-500",
      features: [
        "Custom Approval Levels",
        "Flexible Workflow Design",
        "Department-Specific Rules",
        "Role-Based Permissions",
        "Tailored Document Types",
      ],
      approvalLevels: [
        "Define Your Own",
        "Custom Hierarchy",
        "Flexible Permissions",
        "Adaptive Workflows",
      ],
      particles: 20,
      tiltIntensity: 25,
    },
  ];

  const setupOptions = [
    {
      id: "template",
      name: "Use Industry Template",
      description:
        "Quick setup with pre-configured approval levels and workflows",
      icon: HiCheck,
      gradient: "from-green-500 via-emerald-500 to-teal-500",
      features: [
        "Pre-built Approval Levels",
        "Industry-Specific Workflows",
        "Best Practice Templates",
        "Quick Deployment",
      ],
      particles: 8,
      tiltIntensity: 10,
    },
    {
      id: "manual",
      name: "Manual Setup",
      description: "Create everything from scratch with full customization",
      icon: HiCog,
      gradient: "from-blue-500 via-cyan-500 to-purple-500",
      features: [
        "Custom Approval Levels",
        "Flexible Workflow Design",
        "Complete Control",
        "Tailored Permissions",
      ],
      particles: 12,
      tiltIntensity: 15,
    },
  ];

  // 4D Animation Card Component
  const AnimatedCard = ({ card, index, isActive, onClick, isSelected }) => {
    const cardRef = useRef(null);
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    // 4D Transform calculations
    const rotateX = useTransform(
      mouseY,
      [-300, 300],
      [card.tiltIntensity, -card.tiltIntensity]
    );
    const rotateY = useTransform(
      mouseX,
      [-300, 300],
      [-card.tiltIntensity, card.tiltIntensity]
    );

    const handleMouseMove = (e) => {
      const rect = cardRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      mouseX.set(e.clientX - centerX);
      mouseY.set(e.clientY - centerY);
    };

    const handleMouseLeave = () => {
      mouseX.set(0);
      mouseY.set(0);
    };

    return (
      <motion.div
        ref={cardRef}
        className={`relative cursor-pointer ${
          isSelected ? "ring-4 ring-blue-400 ring-opacity-50" : ""
        }`}
        style={{
          transformStyle: "preserve-3d",
          perspective: "1000px",
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={onClick}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <motion.div
          className="relative bg-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-8 h-full"
          style={{
            rotateX,
            rotateY,
            transformStyle: "preserve-3d",
          }}
        >
          {/* Background Particles */}
          <div className="absolute inset-0 overflow-hidden rounded-3xl">
            {Array.from({ length: card.particles }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white/20 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  opacity: [0.2, 0.8, 0.2],
                  scale: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>

          {/* Content */}
          <div className="relative z-10">
            {/* Icon */}
            <div
              className={`w-20 h-20 rounded-2xl bg-gradient-to-r ${card.gradient} flex items-center justify-center mx-auto mb-6 shadow-lg`}
            >
              <card.icon className="w-10 h-10 text-white" />
            </div>

            {/* Title */}
            <h3 className="text-2xl font-bold text-white mb-3 text-center">
              {card.name}
            </h3>

            {/* Description */}
            <p className="text-white/70 text-center mb-6 leading-relaxed">
              {card.description}
            </p>

            {/* Features */}
            <div className="space-y-2 mb-6">
              {card.features.map((feature, index) => (
                <motion.div
                  key={index}
                  className="flex items-center space-x-2 text-sm text-white/80"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <HiCheck className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span>{feature}</span>
                </motion.div>
              ))}
            </div>

            {/* Approval Levels Preview */}
            {card.approvalLevels && (
              <div className="bg-white/5 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-white mb-2">
                  Approval Levels:
                </h4>
                <div className="flex flex-wrap gap-1">
                  {card.approvalLevels.map((level, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-white/10 rounded-lg text-xs text-white/80"
                    >
                      {level}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Selection Indicator */}
            {isSelected && (
              <motion.div
                className="absolute top-4 right-4 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <HiCheck className="w-5 h-5 text-white" />
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    );
  };

  const handleCardClick = (cardIndex) => {
    if (isAnimating) return;
    setIsAnimating(true);

    if (currentStep === 0) {
      setSelectedIndustry(industryTemplates[cardIndex]);
    } else if (currentStep === 1) {
      setSelectedSetup(setupOptions[cardIndex]);
    }

    setTimeout(() => {
      setIsAnimating(false);
    }, 300);
  };

  const handleNext = () => {
    if (isAnimating) return;
    setIsAnimating(true);

    setTimeout(() => {
      setCurrentStep(currentStep + 1);
      setIsAnimating(false);
    }, 300);
  };

  const handleBack = () => {
    if (isAnimating) return;
    setIsAnimating(true);

    setTimeout(() => {
      setCurrentStep(currentStep - 1);
      setIsAnimating(false);
    }, 300);
  };

  const handleSkip = () => {
    navigate("/app/dashboard");
  };

  const handleComplete = async () => {
    try {
      // Get user's company ID from localStorage or context
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const companyId = user.company?._id || user.company;

      if (!companyId) {
        toast.error(
          "Company information not found. Please try logging in again."
        );
        return;
      }

      const config = {
        industryType: selectedIndustry.id,
        setupMethod: selectedSetup.id,
      };

      const response = await systemSetupAPI.saveSystemSetup(companyId, config);

      if (response.data.success) {
        toast.success("System setup completed successfully!");
        navigate("/app/dashboard");
      } else {
        toast.error("Failed to complete system setup");
      }
    } catch (error) {
      console.error("System setup error:", error);
      toast.error("Failed to complete system setup. Please try again.");
    }
  };

  const steps = [
    {
      title: "Choose Your Industry",
      subtitle: "Select the industry template that best fits your organization",
      cards: industryTemplates,
      selected: selectedIndustry,
    },
    {
      title: "Setup Method",
      subtitle: "Choose how you want to configure your approval workflows",
      cards: setupOptions,
      selected: selectedSetup,
    },
  ];

  const currentStepData = steps[currentStep];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900" />
        <div className="absolute inset-0 bg-[url('/src/assets/ElectronicDocument1.jpg')] bg-cover bg-center opacity-10" />
      </div>

      {/* Header */}
      <motion.header
        className="relative z-10 bg-white/5 backdrop-blur-xl border-b border-white/10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <EDMSLogo />
              <div className="hidden md:block">
                <h1 className="text-lg font-semibold text-white">
                  System Setup
                </h1>
                <p className="text-sm text-white/70">
                  Configure your organization's workflows
                </p>
              </div>
            </div>

            {/* Progress Indicator */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                      index <= currentStep ? "bg-blue-500" : "bg-white/20"
                    }`}
                  />
                ))}
              </div>

              {/* Skip Button */}
              <motion.button
                onClick={handleSkip}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Skip Setup
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Loading State */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="flex justify-center mb-6">
              <Lottie
                src={loadingAnimationUrl}
                loop={true}
                autoplay={true}
                style={{ width: "200px", height: "200px" }}
                onLoad={() => setLottieLoaded(true)}
                onError={() => {
                  console.log(
                    "Lottie animation failed to load, using fallback"
                  );
                  setLottieLoaded(false);
                }}
              />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Loading Templates
            </h2>
            <p className="text-white/70">
              Fetching industry templates from server...
            </p>
          </motion.div>
        )}

        {/* Error State */}
        {error && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mb-6">
              <HiX className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Failed to Load Templates
            </h2>
            <p className="text-white/70 mb-6">{error}</p>
            <button
              onClick={fetchIndustryTemplates}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all duration-300 transform hover:scale-105"
            >
              Try Again
            </button>
          </motion.div>
        )}

        {/* Content when loaded */}
        {!loading && !error && (
          <>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.5 }}
                className="text-center mb-12"
              >
                <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
                  {currentStepData.title}
                </h2>
                <p className="text-xl text-white/70 max-w-3xl mx-auto">
                  {currentStepData.subtitle}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {currentStepData.cards.map((card, index) => (
                <AnimatedCard
                  key={card.id}
                  card={card}
                  index={index}
                  isActive={currentStep === index}
                  onClick={() => handleCardClick(index)}
                  isSelected={currentStepData.selected?.id === card.id}
                />
              ))}
            </div>
          </>
        )}

        {/* Navigation - Only show when content is loaded */}
        {!loading && !error && (
          <div className="flex items-center justify-between">
            <motion.button
              onClick={handleBack}
              disabled={currentStep === 0}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                currentStep === 0
                  ? "text-white/30 cursor-not-allowed"
                  : "text-white hover:bg-white/10"
              }`}
              whileHover={currentStep > 0 ? { scale: 1.05 } : {}}
              whileTap={currentStep > 0 ? { scale: 0.95 } : {}}
            >
              <HiArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </motion.button>

            <motion.button
              onClick={
                currentStep === steps.length - 1 ? handleComplete : handleNext
              }
              disabled={!currentStepData.selected}
              className={`flex items-center space-x-2 px-8 py-3 rounded-lg font-medium transition-all duration-300 ${
                currentStepData.selected
                  ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600"
                  : "bg-white/10 text-white/30 cursor-not-allowed"
              }`}
              whileHover={currentStepData.selected ? { scale: 1.05 } : {}}
              whileTap={currentStepData.selected ? { scale: 0.95 } : {}}
            >
              <span>
                {currentStep === steps.length - 1 ? "Complete Setup" : "Next"}
              </span>
              <HiArrowRight className="w-5 h-5" />
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemSetupOnboarding;
