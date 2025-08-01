import React, { useState, useRef, useEffect } from "react";
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
  HiArrowRight,
  HiSparkles,
  HiUser,
  HiHome,
  HiPlay,
  HiUserAdd,
} from "react-icons/hi";
import EDMSLogo from "../../components/EDMSLogo";
import JoinCompanyModal from "./JoinCompanyModal";
import ComingSoon from "./ComingSoon";

const WelcomeOnboarding = () => {
  const flow = "default";
  const [currentCard, setCurrentCard] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showJoinCompanyModal, setShowJoinCompanyModal] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [comingSoonData, setComingSoonData] = useState({});
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Check for invitation code in URL parameters
  useEffect(() => {
    const invitationCode = searchParams.get("code");
    if (invitationCode) {
      setShowJoinCompanyModal(true);
    }
  }, [searchParams]);

  // Get invitation code from URL
  const invitationCode = searchParams.get("code");

  const getCards = () => {
    return [
      {
        id: 0,
        title: "Watch Demo",
        subtitle: "See how it works",
        description:
          "Watch a quick demonstration of how EDMS transforms document management with intelligent workflows and seamless collaboration.",
        icon: HiPlay,
        gradient: "from-red-500 via-pink-500 to-purple-500",
        action: "Watch Demo",
        route: "demo",
        features: ["System Overview", "Workflow Demo", "User Experience"],
        particles: 15,
        tiltIntensity: 20,
      },
      {
        id: 1,
        title: "Join Company",
        subtitle: "Enter invitation code",
        description:
          "You've been invited to join your organization's document management system. Enter the invitation code provided by your administrator to get started.",
        icon: HiUserGroup,
        gradient: "from-blue-500 via-cyan-500 to-purple-500",
        action: "Enter Code",
        route: "/join-company",
        features: [
          "Secure Access",
          "Team Collaboration",
          "Document Management",
        ],
        particles: 12,
        tiltIntensity: 15,
      },
      {
        id: 2,
        title: "Register",
        subtitle: "Create your account",
        description:
          "New to the organization? Register as the first superadmin to set up your company's document management system and invite your team.",
        icon: HiUserAdd,
        gradient: "from-green-500 via-emerald-500 to-teal-500",
        action: "Create Account",
        route: "/register",
        features: [
          "Superadmin Setup",
          "Company Configuration",
          "Team Invitation",
        ],
        particles: 8,
        tiltIntensity: 12,
      },
      {
        id: 3,
        title: "Sign In",
        subtitle: "Access your workspace",
        description:
          "Already have an account? Sign in to access your documents, approvals, and team collaboration tools.",
        icon: HiHome,
        gradient: "from-purple-500 via-pink-500 to-indigo-500",
        action: "Sign In",
        route: "/login",
        features: ["Document Access", "Approval Workflows", "Team Messaging"],
        particles: 10,
        tiltIntensity: 18,
      },
    ];
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
      const card = cards[cardIndex];

      if (card.route === "/join-company") {
        setShowJoinCompanyModal(true);
      } else if (card.route === "demo") {
        setComingSoonData({
          feature: "Interactive Demo",
          description:
            "Our comprehensive demo system is currently in development. It will showcase all EDMS features including document workflows, approval systems, team collaboration, and smart automation.",
          icon: HiPlay,
        });
        setShowComingSoon(true);
      } else {
        navigate(card.route);
      }
    }, 300);
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
      <div className="fixed inset-0">
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
      <div className="fixed inset-0 overflow-hidden">
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
              Access your organization's document management system
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

      {/* Join Company Modal */}
      <JoinCompanyModal
        isOpen={showJoinCompanyModal}
        onClose={() => setShowJoinCompanyModal(false)}
        onSuccess={(data) => {
          setShowJoinCompanyModal(false);
          navigate("/dashboard");
        }}
        initialCode={invitationCode}
      />

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
