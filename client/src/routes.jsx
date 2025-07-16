import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Login, Register, Unauthorized } from "./pages/auth";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import { Dashboard, Profile, Documents, Upload, Approvals } from "./pages/user";
import {
  Dashboard as AdminDashboard,
  Users,
  Departments,
  Settings,
} from "./pages/admin";
import SuperAdminDashboard from "./pages/admin/SuperAdminDashboard";
import DashboardLayout from "./layouts/DashboardLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleRedirect from "./components/common/RoleRedirect";
import { SidebarProvider } from "./context/SidebarContext";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* All authenticated routes use DashboardLayout */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <SidebarProvider>
              <DashboardLayout />
            </SidebarProvider>
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="documents" element={<Documents />} />
        <Route path="upload" element={<Upload />} />
        <Route path="approvals" element={<Approvals />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      {/* Admin routes - also use DashboardLayout */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <SidebarProvider>
              <DashboardLayout />
            </SidebarProvider>
          </ProtectedRoute>
        }
      >
        <Route index element={<SuperAdminDashboard />} />
        <Route path="users" element={<Users />} />
        <Route path="departments" element={<Departments />} />
        <Route path="settings" element={<Settings />} />
        <Route path="system-settings" element={<Settings />} />
        <Route path="roles" element={<Settings />} />
        <Route path="analytics" element={<Settings />} />
        <Route path="approvals" element={<Settings />} />
        <Route path="documents" element={<Settings />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      {/* Role-based redirect for authenticated users */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <RoleRedirect />
          </ProtectedRoute>
        }
      />

      {/* Fallback redirects */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;
