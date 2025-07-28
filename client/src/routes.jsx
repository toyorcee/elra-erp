import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Login, Register, Unauthorized } from "./pages/auth";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import RetrieveCredentials from "./pages/auth/RetrieveCredentials";
import EmailVerification from "./pages/auth/EmailVerification";
import EmailVerificationSuccess from "./pages/auth/EmailVerificationSuccess";
import { Dashboard, Profile, Documents, Upload, Approvals } from "./pages/user";
import Notifications from "./pages/shared/Notifications";
import UserSettings from "./pages/user/Settings";
import {
  Dashboard as AdminDashboard,
  Users,
  Departments,
  AuditLogs,
  Settings as AdminSettings,
} from "./pages/admin";
import SuperAdminDashboard from "./pages/admin/SuperAdminDashboard";
import ApprovalLevels from "./pages/admin/ApprovalLevels";
import WorkflowTemplates from "./pages/admin/WorkflowTemplates";
import {
  PlatformAdminDashboard,
  IndustryInstances,
  CreateIndustryInstance,
  CompanyList,
  CreateCompany,
  SubscriptionManagement,
  PricingManagement,
} from "./pages/platform-admin";
import LandingPage from "./pages/shared/LandingPage";
import WelcomeOnboarding from "./pages/shared/WelcomeOnboarding";
import SystemSetupOnboarding from "./pages/shared/SystemSetupOnboarding";
import DashboardLayout from "./layouts/DashboardLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleRedirect from "./components/common/RoleRedirect";
import { SidebarProvider } from "./context/SidebarContext";
import PrivacyPolicy from "./pages/legal/PrivacyPolicy";
import TermsConditions from "./pages/legal/TermsConditions";

// Placeholder components for missing admin pages
const RolesManagement = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold mb-4">Roles Management</h1>
    <p className="text-gray-600">
      Roles management functionality coming soon...
    </p>
  </div>
);

const Analytics = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold mb-4">Analytics</h1>
    <p className="text-gray-600">Analytics dashboard coming soon...</p>
  </div>
);

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/welcome" element={<WelcomeOnboarding />} />
      <Route path="/system-setup" element={<SystemSetupOnboarding />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/retrieve-credentials" element={<RetrieveCredentials />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/verify-email" element={<EmailVerification />} />
      <Route
        path="/verify-email-success"
        element={<EmailVerificationSuccess />}
      />

      {/* Legal pages */}
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsConditions />} />

      {/* Authenticated routes - role redirect for authenticated users */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <RoleRedirect />
          </ProtectedRoute>
        }
      />

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
        <Route path="notifications" element={<Notifications />} />
        <Route path="settings" element={<UserSettings />} />
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
        <Route path="dashboard" element={<SuperAdminDashboard />} />
        <Route path="users" element={<Users />} />
        <Route path="departments" element={<Departments />} />
        <Route path="approval-levels" element={<ApprovalLevels />} />
        <Route path="workflow-templates" element={<WorkflowTemplates />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="roles" element={<RolesManagement />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="approvals" element={<Approvals />} />
        <Route path="documents" element={<Documents />} />
        <Route path="upload" element={<Upload />} />
        <Route path="audit" element={<AuditLogs />} />
        <Route path="profile" element={<Profile />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>

      {/* Platform Admin routes - also use DashboardLayout */}
      <Route
        path="/platform-admin"
        element={
          <ProtectedRoute>
            <SidebarProvider>
              <DashboardLayout />
            </SidebarProvider>
          </ProtectedRoute>
        }
      >
        <Route index element={<PlatformAdminDashboard />} />
        <Route path="dashboard" element={<PlatformAdminDashboard />} />
        <Route path="instances" element={<IndustryInstances />} />
        <Route path="create-instance" element={<CreateIndustryInstance />} />
        <Route path="companies" element={<CompanyList />} />
        <Route path="create-company" element={<CreateCompany />} />
        <Route path="subscriptions" element={<SubscriptionManagement />} />
        <Route path="pricing" element={<PricingManagement />} />
        <Route path="profile" element={<Profile />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>

      {/* Fallback redirects */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
