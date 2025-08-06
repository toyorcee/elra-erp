import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Login, Register, Unauthorized } from "./pages/auth";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import RetrieveCredentials from "./pages/auth/RetrieveCredentials";
import EmailVerification from "./pages/auth/EmailVerification";
import EmailVerificationSuccess from "./pages/auth/EmailVerificationSuccess";
import { Dashboard, Documents, Upload } from "./pages/user";
import DepartmentDocuments from "./pages/user/DepartmentDocuments";
import DepartmentDashboard from "./pages/user/DepartmentDashboard";
import Workflows from "./pages/user/Workflows";
import DepartmentStaff from "./pages/user/DepartmentStaff";
import Archive from "./pages/user/Archive";
import Notifications from "./pages/shared/Notifications";
import UserSettings from "./pages/user/Settings";
import {
  Dashboard as AdminDashboard,
  Users,
  Departments,
  AuditLogs,
  Settings as AdminSettings,
  RoleManagement,
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
        <Route index element={<DepartmentDashboard />} />
        <Route path="documents" element={<DepartmentDocuments />} />
        <Route path="upload" element={<Upload />} />
        <Route path="workflows" element={<Workflows />} />
        <Route path="department/staff" element={<DepartmentStaff />} />
        <Route path="archive" element={<Archive />} />

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
        <Route path="roles" element={<RoleManagement />} />

        <Route path="documents" element={<Documents />} />
        <Route path="upload" element={<Upload />} />
        <Route path="workflows" element={<Workflows />} />
        <Route path="staff" element={<DepartmentStaff />} />
        <Route path="audit-logs" element={<AuditLogs />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="archive" element={<Documents />} />
        <Route path="audit" element={<AuditLogs />} />
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
        <Route path="documents" element={<Documents />} />
        <Route path="upload" element={<Upload />} />
        <Route path="archive" element={<Documents />} />
        <Route path="workflows" element={<Workflows />} />
        <Route path="staff" element={<DepartmentStaff />} />
        <Route path="subscriptions" element={<SubscriptionManagement />} />
        <Route path="pricing" element={<PricingManagement />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>

      {/* Fallback redirects */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
