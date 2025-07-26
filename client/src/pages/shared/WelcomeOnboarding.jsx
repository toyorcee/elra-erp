import React, { useState, useEffect, useRef } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  useSpring,
} from "framer-motion";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  HiOfficeBuilding,
  HiUserGroup,
  HiPlay,
  HiInformationCircle,
  HiArrowRight,
  HiSparkles,
  HiUser,
  HiHome,
} from "react-icons/hi";
import EDMSLogo from "../../components/EDMSLogo";
import SubscriptionForm from "./SubscriptionForm";
import ComingSoon from "./ComingSoon";
import { getSubscriptionPlans } from "../../services/subscriptions.js";

const WelcomeOnboarding = () => {
  const [searchParams] = useSearchParams();
  const flow = searchParams.get("flow") || "default";
  const [currentCard, setCurrentCard] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showSubscriptionForm, setShowSubscriptionForm] = useState(false);
  const [showJoinCompanyModal, setShowJoinCompanyModal] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [comingSoonData, setComingSoonData] = useState({});
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [subscriptionPlans, setSubscriptionPlans] = useState({});
  const navigate = useNavigate();

  // Fetch subscription plans
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const data = await getSubscriptionPlans();
        setSubscriptionPlans(data);
      } catch (error) {
        console.error("Error fetching subscription plans:", error);
      }
    };
    fetchPlans();
  }, []);

  // 4D Animation Cards Data - Different cards based on flow
  const getCards = () => {
    if (flow === "individual") {
      return [
        {
          id: 0,
          title: "Individual Account",
          subtitle: "Personal document management",
          description:
            "Create your personal account to manage documents, collaborate with teams, and access shared resources.",
          icon: HiUser,
          gradient: "from-blue-500 via-cyan-500 to-purple-500",
          action: "Create Account",
          route: "/register",
          features: [
            "Personal Dashboard",
            "Document Access",
            "Team Collaboration",
          ],
          particles: 12,
          tiltIntensity: 15,
        },
        {
          id: 1,
          title: "Join Existing Company",
          subtitle: "Connect to your team",
          description:
            "Enter your invitation code to join an existing organization and collaborate with your team.",
          icon: HiUserGroup,
          gradient: "from-green-500 via-emerald-500 to-teal-500",
          action: "Enter Code",
          route: "/join-company",
          features: ["Team Access", "Shared Documents", "Collaboration"],
          particles: 8,
          tiltIntensity: 12,
        },
        {
          id: 2,
          title: "Explore Demo",
          subtitle: "Try before you commit",
          description:
            "Experience the full power of EDMS with limited features. Perfect for testing and evaluation.",
          icon: HiPlay,
          gradient: "from-orange-500 via-red-500 to-pink-500",
          action: "Start Demo",
          route: "/demo",
          features: ["Limited Features", "Sample Data", "No Commitment"],
          particles: 6,
          tiltIntensity: 10,
        },
        {
          id: 3,
          title: "Back to Home",
          subtitle: "Return to main page",
          description:
            "Go back to the main landing page to explore more options and learn about our platform.",
          icon: HiHome,
          gradient: "from-purple-500 via-pink-500 to-indigo-500",
          action: "Go Back",
          route: "/",
          features: ["Feature Overview", "Pricing Details", "Use Cases"],
          particles: 10,
          tiltIntensity: 18,
        },
      ];
    } else if (flow === "company") {
      return [
        {
          id: 0,
          title: "Start My Company",
          subtitle: "Create your organization's workspace",
          description:
            "Set up your own document management system with custom workflows, departments, and team collaboration.",
          icon: HiOfficeBuilding,
          gradient: "from-blue-500 via-cyan-500 to-purple-500",
          action: "Subscribe Now",
          route: "/subscription",
          features: [
            "Custom Workflows",
            "Department Management",
            "Team Collaboration",
          ],
          particles: 12,
          tiltIntensity: 15,
        },
        {
          id: 1,
          title: "Join Existing Company",
          subtitle: "Connect to your team",
          description:
            "Enter your invitation code to join an existing organization and collaborate with your team.",
          icon: HiUserGroup,
          gradient: "from-green-500 via-emerald-500 to-teal-500",
          action: "Enter Code",
          route: "/join-company",
          features: ["Team Access", "Shared Documents", "Collaboration"],
          particles: 8,
          tiltIntensity: 12,
        },
        {
          id: 2,
          title: "Explore Demo",
          subtitle: "Try before you commit",
          description:
            "Experience the full power of EDMS with limited features. Perfect for testing and evaluation.",
          icon: HiPlay,
          gradient: "from-orange-500 via-red-500 to-pink-500",
          action: "Start Demo",
          route: "/demo",
          features: ["Limited Features", "Sample Data", "No Commitment"],
          particles: 6,
          tiltIntensity: 10,
        },
        {
          id: 3,
          title: "Back to Home",
          subtitle: "Return to main page",
          description:
            "Go back to the main landing page to explore more options and learn about our platform.",
          icon: HiHome,
          gradient: "from-purple-500 via-pink-500 to-indigo-500",
          action: "Go Back",
          route: "/",
          features: ["Feature Overview", "Pricing Details", "Use Cases"],
          particles: 10,
          tiltIntensity: 18,
        },
      ];
    } else {
      // Default cards (fallback)
      return [
        {
          id: 0,
          title: "Start My Company",
          subtitle: "Create your organization's workspace",
          description:
            "Set up your own document management system with custom workflows, departments, and team collaboration.",
          icon: HiOfficeBuilding,
          gradient: "from-blue-500 via-cyan-500 to-purple-500",
          action: "Subscribe Now",
          route: "/subscription",
          features: [
            "Custom Workflows",
            "Department Management",
            "Team Collaboration",
          ],
          particles: 12,
          tiltIntensity: 15,
        },
        {
          id: 1,
          title: "Join Existing Company",
          subtitle: "Connect to your team",
          description:
            "Enter your invitation code to join an existing organization and collaborate with your team.",
          icon: HiUserGroup,
          gradient: "from-green-500 via-emerald-500 to-teal-500",
          action: "Enter Code",
          route: "/join-company",
          features: ["Team Access", "Shared Documents", "Collaboration"],
          particles: 8,
          tiltIntensity: 12,
        },
        {
          id: 2,
          title: "Explore Demo",
          subtitle: "Try before you commit",
          description:
            "Experience the full power of EDMS with limited features. Perfect for testing and evaluation.",
          icon: HiPlay,
          gradient: "from-orange-500 via-red-500 to-pink-500",
          action: "Start Demo",
          route: "/demo",
          features: ["Limited Features", "Sample Data", "No Commitment"],
          particles: 6,
          tiltIntensity: 10,
        },
        {
          id: 3,
          title: "Learn More",
          subtitle: "Discover our features",
          description:
            "Explore detailed information about our platform, pricing, and how EDMS can transform your workflow.",
          icon: HiInformationCircle,
          gradient: "from-purple-500 via-pink-500 to-indigo-500",
          action: "Explore",
          route: "/features",
          features: ["Feature Overview", "Pricing Details", "Use Cases"],
          particles: 10,
          tiltIntensity: 18,
        },
      ];
    }
  };

  const cards = getCards();

  // 4D Animation Card Component
  const AnimatedCard = ({ card, index, isActive, onClick }) => {
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
    const scale = useSpring(isActive ? 1.05 : 1, {
      stiffness: 300,
      damping: 30,
    });
    const z = useSpring(isActive ? 50 : 0, { stiffness: 300, damping: 30 });

    // Mouse tracking for 4D tilt
    const handleMouseMove = (e) => {
      if (!cardRef.current) return;
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

    // Particle animation
    const particles = Array.from({ length: card.particles }, (_, i) => (
      <motion.div
        key={i}
        className="absolute w-1 h-1 bg-white/30 rounded-full"
        initial={{
          x: Math.random() * 200 - 100,
          y: Math.random() * 200 - 100,
          opacity: 0,
        }}
        animate={{
          x: Math.random() * 200 - 100,
          y: Math.random() * 200 - 100,
          opacity: [0, 1, 0],
        }}
        transition={{
          duration: 3 + Math.random() * 2,
          repeat: Infinity,
          delay: Math.random() * 2,
        }}
      />
    ));

    return (
      <motion.div
        ref={cardRef}
        className={`relative w-full max-w-sm h-96 cursor-pointer perspective-1000 ${
          isActive ? "z-20" : "z-10"
        }`}
        style={{
          rotateX,
          rotateY,
          scale,
          z,
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={onClick}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.3 }}
      >
        {/* 4D Card Container */}
        <motion.div
          className="relative w-full h-full bg-white/5 backdrop-blur-xl border border-white/20 rounded-3xl overflow-hidden shadow-2xl"
          style={{
            transformStyle: "preserve-3d",
          }}
        >
          {/* Animated Background Gradient */}
          <motion.div
            className="absolute inset-0 opacity-20"
            style={{
              background: `linear-gradient(135deg, ${card.gradient})`,
            }}
            animate={{
              background: [
                `linear-gradient(135deg, ${card.gradient})`,
                `linear-gradient(225deg, ${card.gradient})`,
                `linear-gradient(315deg, ${card.gradient})`,
                `linear-gradient(45deg, ${card.gradient})`,
              ],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "linear",
            }}
          />

          {/* Floating Particles */}
          <div className="absolute inset-0 overflow-hidden">{particles}</div>

          {/* Card Content */}
          <div className="relative z-10 p-8 h-full flex flex-col justify-between">
            {/* Header */}
            <div className="text-center">
              <motion.div
                className="mx-auto w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center mb-6"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <card.icon className="w-8 h-8 text-white" />
              </motion.div>

              <motion.h3
                className="text-2xl font-bold text-white mb-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {card.title}
              </motion.h3>

              <motion.p
                className="text-white/70 text-sm mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {card.subtitle}
              </motion.p>
            </div>

            {/* Description */}
            <motion.p
              className="text-white/80 text-sm leading-relaxed mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {card.description}
            </motion.p>

            {/* Features */}
            <div className="mb-6">
              {card.features.map((feature, index) => (
                <motion.div
                  key={feature}
                  className="flex items-center space-x-2 mb-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                >
                  <HiSparkles className="w-4 h-4 text-yellow-400" />
                  <span className="text-white/70 text-sm">{feature}</span>
                </motion.div>
              ))}
            </div>

            {/* Action Button */}
            <motion.button
              className={`w-full py-3 px-6 rounded-xl font-semibold text-white transition-all duration-300 flex items-center justify-center space-x-2 bg-gradient-to-r ${card.gradient} hover:shadow-lg hover:shadow-white/20 transform hover:scale-105`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span>{card.action}</span>
              <HiArrowRight className="w-4 h-4" />
            </motion.button>
          </div>

          {/* 4D Glow Effect */}
          <motion.div
            className="absolute inset-0 rounded-3xl opacity-0"
            style={{
              background: `linear-gradient(135deg, ${card.gradient})`,
              filter: "blur(20px)",
            }}
            animate={{
              opacity: isActive ? 0.3 : 0,
            }}
            transition={{ duration: 0.3 }}
          />
        </motion.div>
      </motion.div>
    );
  };

  // Navigation functions
  const handleCardClick = (cardIndex) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentCard(cardIndex);

    setTimeout(() => {
      setIsAnimating(false);
      // Handle navigation based on card
      const card = cards[cardIndex];
      if (card.route === "/subscription") {
        // Show subscription form modal with professional plan
        setShowSubscriptionForm(true);
        setSelectedPlan(
          subscriptionPlans.professional || {
            name: "professional",
            displayName: "Professional Plan",
            price: { monthly: 99, yearly: 990 },
            description:
              "Perfect for growing businesses with advanced document management needs.",
            features: {
              maxUsers: 50,
              maxStorage: 500,
              maxDepartments: 10,
            },
          }
        );
      } else if (card.route === "/register") {
        // Navigate to registration page
        navigate("/register");
      } else if (card.route === "/join-company") {
        // Show join company modal
        setShowJoinCompanyModal(true);
      } else if (card.route === "/demo") {
        // Show coming soon for demo
        setComingSoonData({
          feature: "Demo Mode",
          description:
            "Experience the full power of EDMS with limited features. Perfect for testing and evaluation before committing to a subscription.",
          icon: HiPlay,
        });
        setShowComingSoon(true);
      } else if (card.route === "/") {
        // Navigate back to landing page
        navigate("/");
      } else if (card.route === "/features") {
        // Navigate to features page
        navigate("/");
      }
    }, 500);
  };

  const handleSwipe = (direction) => {
    if (isAnimating) return;

    if (direction === "left" && currentCard < cards.length - 1) {
      handleCardClick(currentCard + 1);
    } else if (direction === "right" && currentCard > 0) {
      handleCardClick(currentCard - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 overflow-hidden relative">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute inset-0 opacity-20"
          animate={{
            background: [
              "radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%)",
              "radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%)",
              "radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.3) 0%, transparent 50%)",
              "radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%)",
            ],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </div>

      {/* Floating Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 20 }, (_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/10 rounded-full"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            animate={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            transition={{
              duration: 20 + Math.random() * 10,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-8">
          <EDMSLogo variant="light" className="h-8" />
          <Link
            to="/login"
            className="text-white/70 hover:text-white transition-colors"
          >
            Sign In
          </Link>
        </div>

        {/* Welcome Message */}
        <div className="flex-1 flex flex-col items-center justify-center px-8">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.h1
              className="text-4xl md:text-6xl font-bold text-white mb-6"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Welcome to{" "}
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
                EDMS
              </span>
            </motion.h1>
            <motion.p
              className="text-xl text-white/70 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              {flow === "individual"
                ? "Choose how you'd like to get started with EDMS"
                : flow === "company"
                ? "Choose your path to revolutionize document management"
                : "Choose your path to revolutionize document management"}
            </motion.p>
          </motion.div>

          {/* 4D Animated Cards */}
          <div className="relative w-full max-w-7xl mx-auto px-4">
            {/* Desktop Layout - Horizontal Cards */}
            <div className="hidden lg:flex justify-center items-center space-x-6 xl:space-x-8">
              {cards.map((card, index) => (
                <AnimatePresence key={card.id}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, rotateY: -45 }}
                    animate={{
                      opacity: 1,
                      scale: currentCard === index ? 1 : 0.9,
                      rotateY: currentCard === index ? 0 : -15,
                      x: (index - currentCard) * 30,
                      z: currentCard === index ? 0 : -50,
                    }}
                    exit={{ opacity: 0, scale: 0.8, rotateY: 45 }}
                    transition={{
                      duration: 0.6,
                      ease: "easeInOut",
                    }}
                    className="flex-shrink-0 w-80"
                  >
                    <AnimatedCard
                      card={card}
                      index={index}
                      isActive={currentCard === index}
                      onClick={() => handleCardClick(index)}
                    />
                  </motion.div>
                </AnimatePresence>
              ))}
            </div>

            {/* Mobile/Tablet Layout - Single Card with Navigation */}
            <div className="lg:hidden">
              <div className="flex justify-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentCard}
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: -20 }}
                    transition={{
                      duration: 0.5,
                      ease: "easeInOut",
                    }}
                    className="w-full max-w-sm"
                  >
                    <AnimatedCard
                      card={cards[currentCard]}
                      index={currentCard}
                      isActive={true}
                      onClick={() => handleCardClick(currentCard)}
                    />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Navigation Dots */}
          <motion.div
            className="flex space-x-3 mt-8 lg:mt-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            {cards.map((_, index) => (
              <motion.button
                key={index}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  currentCard === index
                    ? "bg-white scale-125"
                    : "bg-white/30 hover:bg-white/50"
                }`}
                onClick={() => handleCardClick(index)}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
              />
            ))}
          </motion.div>

          {/* Mobile Navigation Arrows */}
          <div className="lg:hidden flex justify-center items-center space-x-8 mt-6">
            <motion.button
              onClick={() => handleSwipe("right")}
              disabled={currentCard === 0}
              className={`p-3 rounded-full transition-all duration-300 ${
                currentCard === 0
                  ? "bg-white/10 text-white/30"
                  : "bg-white/20 text-white hover:bg-white/30"
              }`}
              whileHover={currentCard > 0 ? { scale: 1.1 } : {}}
              whileTap={currentCard > 0 ? { scale: 0.9 } : {}}
            >
              <HiArrowRight className="w-6 h-6 rotate-180" />
            </motion.button>
            <motion.button
              onClick={() => handleSwipe("left")}
              disabled={currentCard === cards.length - 1}
              className={`p-3 rounded-full transition-all duration-300 ${
                currentCard === cards.length - 1
                  ? "bg-white/10 text-white/30"
                  : "bg-white/20 text-white hover:bg-white/30"
              }`}
              whileHover={currentCard < cards.length - 1 ? { scale: 1.1 } : {}}
              whileTap={currentCard < cards.length - 1 ? { scale: 0.9 } : {}}
            >
              <HiArrowRight className="w-6 h-6" />
            </motion.button>
          </div>

          {/* Swipe Instructions */}
          <motion.div
            className="text-center mt-8 text-white/50 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <p>Swipe or click to explore options</p>
          </motion.div>
        </div>
      </div>

      {/* Subscription Form Modal */}
      {showSubscriptionForm && (
        <SubscriptionForm
          isOpen={showSubscriptionForm}
          selectedPlan={selectedPlan}
          onClose={() => {
            setShowSubscriptionForm(false);
            setSelectedPlan(null);
          }}
        />
      )}

      {/* Join Company Modal - Coming Soon */}
      <AnimatePresence>
        {showJoinCompanyModal && (
          <ComingSoon
            feature="Join Company"
            description="Enter your invitation code to join an existing organization and collaborate with your team. This feature is coming soon!"
            icon={HiUserGroup}
            onClose={() => setShowJoinCompanyModal(false)}
          />
        )}
      </AnimatePresence>

      {/* Coming Soon Modal */}
      <AnimatePresence>
        {showComingSoon && (
          <ComingSoon
            feature={comingSoonData.feature}
            description={comingSoonData.description}
            icon={comingSoonData.icon}
            onClose={() => setShowComingSoon(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default WelcomeOnboarding;
