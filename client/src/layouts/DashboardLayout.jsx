import React, { useState, createContext, useContext, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { MdMenu, MdChat } from "react-icons/md";
import Sidebar from "../components/Sidebar";
import ProfileMenu from "../components/ProfileMenu";
import ELRALogo from "../components/ELRALogo";
import NotificationBell from "../components/NotificationBell";
import MessageDropdown from "../components/MessageDropdown";
import PasswordChangeModal from "../components/common/PasswordChangeModal";
import { useAuth } from "../context/AuthContext";
import { useMessages } from "../hooks/useMessages";

const SidebarContext = createContext();

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [sidebarPinned, setSidebarPinned] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isSidebarActuallyExpanded = sidebarPinned ? true : sidebarExpanded;
  const totalUnreadMessages = getTotalUnreadCount ? getTotalUnreadCount() : 0;

  console.log("🔍 Message icon debug:", {
    messagesHook: !!messagesHook,
    getTotalUnreadCount: !!getTotalUnreadCount,
    totalUnreadMessages,
    showMessageDropdown,
  });

  useEffect(() => {
    if (user && !loading) {
      // Check if user is trying to access dashboard routes they shouldn't
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

  // Check for temporary password and show modal
  useEffect(() => {
    if (user && (user.passwordChangeRequired || user.isTemporaryPassword)) {
      console.log(
        "🔐 User has temporary password, showing password change modal"
      );
      setShowPasswordModal(true);
    }
  }, [user]);

  return (
    <SidebarContext.Provider
      value={{
        sidebarExpanded,
        setSidebarExpanded,
        sidebarPinned,
        setSidebarPinned,
        isSidebarActuallyExpanded,
      }}
    >
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-cyan-800 to-purple-900">
        {/* Fixed Navbar */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-white/20 shadow-lg">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Left side */}
              <div className="flex items-center">
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="lg:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors mr-3"
                >
                  <MdMenu size={24} />
                </button>

                <button
                  onClick={() => navigate("/dashboard")}
                  className="flex items-center space-x-3 focus:outline-none"
                >
                  <ELRALogo variant="dark" className="text-xl" />
                </button>
              </div>

              {/* Right side */}
              <div className="flex items-center space-x-4">
                {/* Message Icon - Always visible like other icons */}
                <div className="relative">
                  <button
                    onClick={() => setShowMessageDropdown(!showMessageDropdown)}
                    className="p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors relative cursor-pointer"
                  >
                    <MdChat size={24} />
                    <span
                      className={`absolute -top-1 -right-1 w-5 h-5 text-white text-xs rounded-full flex items-center justify-center font-bold ${
                        totalUnreadMessages === 0 ? "bg-gray-400" : "bg-red-500"
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
          {/* Sidebar */}
          <div
            className={`fixed top-16 left-0 z-40 transition-all duration-300 ease-in-out ${
              isSidebarOpen
                ? "translate-x-0"
                : "-translate-x-full lg:translate-x-0"
            }`}
          >
            <Sidebar
              onExpandedChange={setSidebarExpanded}
              onPinnedChange={setSidebarPinned}
            />
          </div>

          {/* Content - Now responsive to sidebar state */}
          <div
            className={`flex-1 flex flex-col min-h-0 transition-all duration-300 ease-in-out ${
              isSidebarActuallyExpanded ? "lg:ml-64" : "lg:ml-16"
            }`}
          >
            <main className="flex-1 p-4 md:p-8 min-h-0 overflow-y-auto">
              <div className="glass-card rounded-2xl p-6 md:p-8">
                <Outlet />
              </div>
            </main>
          </div>

          {/* Mobile Overlay */}
          {isSidebarOpen && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
              style={{ top: "4rem" }}
            />
          )}
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
