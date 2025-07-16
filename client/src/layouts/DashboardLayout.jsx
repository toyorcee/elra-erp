import React, { useState, createContext, useContext } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { MdNotifications, MdMenu } from "react-icons/md";
import Sidebar from "../components/Sidebar";
import ProfileMenu from "../components/ProfileMenu";
import EDMSLogo from "../components/EDMSLogo";
import { useAuth } from "../context/AuthContext";

// Create context for sidebar state
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
  const { user } = useAuth();
  const navigate = useNavigate();

  const isSidebarActuallyExpanded = sidebarPinned ? true : sidebarExpanded;

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
                  <EDMSLogo variant="dark" className="text-xl" />
                </button>
              </div>

              {/* Right side */}
              <div className="flex items-center space-x-4">
                {/* Notifications */}
                <button className="relative p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors">
                  <MdNotifications size={22} />
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                </button>

                {/* Profile Menu */}
                <ProfileMenu />
              </div>
            </div>
          </div>
        </nav>

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
    </SidebarContext.Provider>
  );
};

export default DashboardLayout;
