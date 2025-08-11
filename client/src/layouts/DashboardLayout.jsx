import React, { useState, createContext, useContext, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";
import Sidebar from "../components/Sidebar";
import ProfileMenu from "../components/ProfileMenu";
import NotificationBell from "../components/NotificationBell";
import MessageDropdown from "../components/MessageDropdown";
import PasswordChangeModal from "../components/common/PasswordChangeModal";
import { useAuth } from "../context/AuthContext";
import { useMessages } from "../hooks/useMessages";
import { DynamicSidebarProvider } from "../context/DynamicSidebarContext";
import ELRALogo from "../components/ELRALogo";

const SidebarContext = createContext();

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showMessageDropdown, setShowMessageDropdown] = useState(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { getTotalUnreadCount } = useMessages();

  const totalUnreadMessages = getTotalUnreadCount ? getTotalUnreadCount() : 0;

  // Check if user is on mobile
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (user && !loading) {
      if (
        user.role?.level < 300 &&
        location.pathname.startsWith("/dashboard")
      ) {
        console.log(
          "🚨 DashboardLayout: User doesn't have access to dashboard, redirecting to /"
        );
        navigate("/");
      }
    }
  }, [user, loading, location.pathname, navigate]);

  useEffect(() => {
    if (user && (user.passwordChangeRequired || user.isTemporaryPassword)) {
      console.log(
        "🔐 User has temporary password, showing password change modal"
      );
      setShowPasswordModal(true);
    }
  }, [user]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  // Handle logo click - navigate to modules page for logged-in users
  const handleLogoClick = () => {
    if (user && !loading) {
      navigate("/modules");
    } else {
      navigate("/");
    }
  };

  return (
    <SidebarContext.Provider
      value={{
        sidebarOpen,
        toggleSidebar,
        isMobile,
      }}
    >
      <div className="min-h-screen bg-[var(--elra-bg-light)]">
        {/* Fixed Navbar */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-[var(--elra-border-primary)] shadow-lg shadow-[var(--elra-primary)]/10">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Left side */}
              <div className="flex items-center">
                {/* Mobile hamburger menu */}
                <button
                  onClick={toggleSidebar}
                  className="lg:hidden p-2 rounded-xl text-[var(--elra-primary)] hover:bg-[var(--elra-secondary-3)] transition-all duration-200 hover:scale-105 mr-4"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>

                {/* Spacer for desktop sidebar toggle */}
                <div className="hidden lg:block w-12 mr-2"></div>

                {/* ELRA Logo - Now clickable */}
                <div
                  className="cursor-pointer hover:scale-105 transition-transform duration-200"
                  onClick={handleLogoClick}
                  title={user && !loading ? "Go to Modules" : "Go to Home"}
                >
                  <ELRALogo variant="dark" size="sm" />
                </div>
              </div>

              {/* Right side */}
              <div className="flex items-center space-x-4">
                {/* Message Icon - Always visible like other icons */}
                <div className="relative">
                  <button
                    onClick={() => setShowMessageDropdown(!showMessageDropdown)}
                    className="p-2 rounded-xl text-[var(--elra-primary)] hover:bg-[var(--elra-secondary-3)] transition-all duration-200 hover:scale-105 relative cursor-pointer"
                  >
                    <ChatBubbleLeftRightIcon className="h-6 w-6" />
                    <span
                      className={`absolute -top-1 -right-1 w-5 h-5 text-white text-xs rounded-full flex items-center justify-center font-bold transition-all duration-200 ${
                        totalUnreadMessages === 0
                          ? "bg-[var(--elra-primary)] scale-90"
                          : "bg-red-500 scale-100 animate-pulse"
                      }`}
                    >
                      {totalUnreadMessages > 99 ? "99+" : totalUnreadMessages}
                    </span>
                  </button>
                </div>

                <NotificationBell />

                <ProfileMenu />
              </div>
            </div>
          </div>
        </nav>

        {/* Message Dropdown */}
        <MessageDropdown
          isOpen={showMessageDropdown}
          onClose={() => setShowMessageDropdown(false)}
        />

        {/* Main Content Area */}
        <div className="flex flex-1 pt-16 min-h-screen">
          <DynamicSidebarProvider>
            {/* Sidebar */}
            <Sidebar
              isOpen={sidebarOpen}
              onToggle={toggleSidebar}
              isMobile={isMobile}
            />
            {/* Content - Now responsive to sidebar state and mobile */}
            <div
              className={`flex-1 transition-all duration-300 ease-in-out ${
                sidebarOpen ? "lg:ml-64" : "lg:ml-16"
              } ${isMobile ? "ml-0" : ""}`}
            >
              {/* Mobile overlay */}
              {isMobile && sidebarOpen && (
                <div
                  className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                  onClick={toggleSidebar}
                />
              )}

              {/* Main content area */}
              <div className="min-h-screen bg-gray-50">
                <Outlet />
              </div>
            </div>
          </DynamicSidebarProvider>
        </div>
      </div>

      {/* Password Change Modal */}
      <PasswordChangeModal
        isOpen={showPasswordModal}
        onClose={() => {
          if (user?.passwordChangeRequired || user?.isTemporaryPassword) {
            return;
          }
          setShowPasswordModal(false);
        }}
        onSuccess={() => {
          console.log("✅ Password changed successfully");
          setShowPasswordModal(false);
        }}
        userData={user}
      />
    </SidebarContext.Provider>
  );
};

export default DashboardLayout;
