import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Login, Unauthorized } from "./pages/auth";
import Welcome from "./pages/auth/Welcome";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import RetrieveCredentials from "./pages/auth/RetrieveCredentials";
import EmailVerification from "./pages/auth/EmailVerification";
import EmailVerificationSuccess from "./pages/auth/EmailVerificationSuccess";
import { Dashboard, Documents } from "./pages/user";
import HRInvitations from "./pages/user/modules/hr/HRInvitations";
import OnboardingManagement from "./pages/user/modules/hr/onboarding/OnboardingManagement";
import OffboardingManagement from "./pages/user/modules/hr/offboarding/OffboardingManagement";
import LeaveManagement from "./pages/user/modules/hr/leave/LeaveManagement";
import AttendanceTracking from "./pages/user/modules/hr/attendance/AttendanceTracking";
import LeaveCalendar from "./pages/user/modules/hr/leave/LeaveCalendar";
import HRDepartments from "./pages/user/modules/hr/HRDepartments";
import HRRoles from "./pages/user/modules/hr/HRRoles";
import HRUsers from "./pages/user/modules/hr/HRUsers";
import SalaryGradeManagement from "./pages/user/modules/payroll/SalaryGradeManagement";
import Notifications from "./pages/shared/Notifications";
import Settings from "./pages/shared/Settings";
// Admin imports commented out - admin folder deleted
// import {
//   Dashboard as AdminDashboard,
//   Users,
//   Departments,
//   AuditLogs,
//   Settings as AdminSettings,
//   RoleManagement,
// } from "./pages/admin";

// import SuperAdminDashboard from "./pages/admin/SuperAdminDashboard";
// import ApprovalLevels from "./pages/admin/ApprovalLevels";
// import WorkflowTemplates from "./pages/admin/WorkflowTemplates";
// import {
//   CompanyList,
//   CreateCompany,
//   SubscriptionManagement,
//   PricingManagement,
// } from "./pages/platform-admin";

import SystemSetupOnboarding from "./pages/shared/SystemSetupOnboarding";
import DashboardLayout from "./layouts/DashboardLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleRedirect from "./components/common/RoleRedirect";
import { SidebarProvider } from "./context/SidebarContext";
import PrivacyPolicy from "./pages/legal/PrivacyPolicy";
import TermsConditions from "./pages/legal/TermsConditions";
import ModuleSelector from "./components/ModuleSelector";
import Wireframe from "./pages/Wireframe";
import ERPFlowchart from "./pages/ERPFlowchart";
import Profile from "./pages/user/Profile";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/welcome" element={<Welcome />} />
      <Route path="/system-setup" element={<SystemSetupOnboarding />} />
      {/* Register route disabled for internal ministry system */}
      {/* <Route path="/register" element={<Register />} /> */}
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/retrieve-credentials" element={<RetrieveCredentials />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/verify-email" element={<EmailVerification />} />
      <Route
        path="/verify-email-success"
        element={<EmailVerificationSuccess />}
      />

      {/* Wireframe route */}
      <Route path="/wireframe" element={<Wireframe />} />

      {/* ERP Flowchart route */}
      <Route path="/erp-flowchart" element={<ERPFlowchart />} />

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

      {/* Module Selector - Entry point for ERP modules */}
      <Route
        path="/modules"
        element={
          <ProtectedRoute>
            <ModuleSelector />
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
        <Route path="notifications" element={<Notifications />} />
        <Route path="settings" element={<Settings />} />
        <Route path="profile" element={<Profile />} />

        {/* Module routes - dynamic module dashboards */}
        <Route path="modules/:module" element={<Dashboard />} />

        {/* HR Module specific sub-routes */}
        <Route path="modules/hr/users" element={<HRUsers />} />
        <Route path="modules/hr/departments" element={<HRDepartments />} />
        <Route path="modules/hr/roles" element={<HRRoles />} />
        <Route path="modules/hr/invitation" element={<HRInvitations />} />
        <Route
          path="modules/hr/onboarding"
          element={<OnboardingManagement />}
        />
        <Route
          path="modules/hr/offboarding"
          element={<OffboardingManagement />}
        />
        <Route path="modules/hr/leave/requests" element={<LeaveManagement />} />
        <Route path="modules/hr/attendance" element={<AttendanceTracking />} />
        <Route path="modules/hr/leave/calendar" element={<LeaveCalendar />} />
        <Route
          path="modules/payroll/salary-grades"
          element={<SalaryGradeManagement />}
        />
      </Route>

      {/* Admin routes - commented out - admin folder deleted */}
      {/* <Route
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
      </Route> */}

      {/* Fallback redirects */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
