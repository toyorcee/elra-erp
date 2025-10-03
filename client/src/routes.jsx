import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Login, Unauthorized } from "./pages/auth";
import Welcome from "./pages/auth/Welcome";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import RetrieveCredentials from "./pages/auth/RetrieveCredentials";
import EmailVerification from "./pages/auth/EmailVerification";
import EmailVerificationSuccess from "./pages/auth/EmailVerificationSuccess";
import { Dashboard } from "./pages/user";
import HRInvitations from "./pages/user/modules/hr/HRInvitations";
import OnboardingManagement from "./pages/user/modules/hr/onboarding/OnboardingManagement";
import OffboardingManagement from "./pages/user/modules/hr/offboarding/OffboardingManagement";
import LeaveManagement from "./pages/user/modules/hr/leave/LeaveManagement";
import LeaveRequests from "./pages/user/modules/hr/leave/LeaveRequests";
import AttendanceTracking from "./pages/user/modules/hr/attendance/AttendanceTracking";
import LeaveCalendar from "./pages/user/modules/hr/leave/LeaveCalendar";
import DepartmentManagement from "./pages/user/modules/hr/DepartmentManagement";
import HRRoles from "./pages/user/modules/hr/HRRoles";
import HRUsers from "./pages/user/modules/hr/HRUsers";
import PolicyManagement from "./pages/user/modules/hr/policies/PolicyManagement";
import ComplianceManagement from "./pages/user/modules/hr/compliance/ComplianceManagement";
import SalaryGradeManagement from "./pages/user/modules/payroll/SalaryGradeManagement";
import PerformanceAllowances from "./pages/user/modules/payroll/PerformanceAllowances";
import PerformanceBonuses from "./pages/user/modules/payroll/PerformanceBonuses";
import DeductionsManagement from "./pages/user/modules/payroll/DeductionsManagement";
import PayrollProcessing from "./pages/user/modules/payroll/PayrollProcessing";
import PaySlips from "./pages/user/modules/payroll/PaySlips";
import MyPayslips from "./pages/user/modules/self-service/MyPayslips";
import {
  CustomerCareDashboard,
  StaffComplaints,
  ComplaintManagement,
  CustomerCareReports,
} from "./pages/user/modules/customer-care";
import SubmitComplaint from "./pages/user/modules/customer-care/SubmitComplaint";
import MyAssignments from "./pages/user/modules/customer-care/MyAssignments";
import AssignComplaints from "./pages/user/modules/customer-care/AssignComplaints";
import MyComplaints from "./pages/user/modules/customer-care/MyComplaints";
import MyTickets from "./pages/user/modules/self-service/MyTickets";
import MyLeaveRequests from "./pages/user/modules/self-service/MyLeaveRequests";
import MyDocuments from "./pages/user/modules/self-service/MyDocuments";
import MyArchive from "./pages/user/modules/self-service/MyArchive";
import MyProjectTasks from "./pages/user/modules/self-service/MyProjectTasks";
import MyProjects from "./pages/user/modules/self-service/MyProjects";
import {
  DepartmentManagement as DeptManagement,
  LeaveManagement as DeptLeaveManagement,
  ProjectApprovals,
  ApprovalHistory,
  TeamManagement,
  Analytics,
  UserManagement,
  CreateDepartmentProject,
  DepartmentProjects,
  DepartmentLeaveCalendar,
  DepartmentAnnouncements,
} from "./pages/user/modules/department-management";
import {
  Communication,
  InternalMessages,
  Announcements,
  EventsCalendar,
} from "./pages/user/modules/communication";
import PayrollReports from "./pages/user/modules/payroll/PayrollReports";
import Notifications from "./pages/shared/Notifications";
import Settings from "./pages/shared/Settings";
import ProjectList from "./pages/user/modules/projects/ProjectList";
import ProjectAnalytics from "./pages/user/modules/projects/ProjectAnalytics";
import ProjectTeams from "./pages/user/modules/projects/ProjectTeams";
import ProjectReports from "./pages/user/modules/projects/ProjectReports";
import ProjectProgress from "./pages/user/modules/projects/ProjectProgress";
import ProjectResources from "./pages/user/modules/projects/ProjectResources";
import ApprovalDashboard from "./pages/user/modules/projects/ApprovalDashboard";
import ComplianceCertificate from "./pages/user/modules/projects/ComplianceCertificate";
import ExternalProjectManagement from "./pages/user/modules/projects/ExternalProjectManagement";
import TaskList from "./pages/user/modules/tasks/TaskList";
import TaskAnalytics from "./pages/user/modules/tasks/TaskAnalytics";
import TaskAssignments from "./pages/user/modules/tasks/TaskAssignments";
import TaskReports from "./pages/user/modules/tasks/TaskReports";
import FinancialManagement from "./pages/user/modules/finance/FinancialManagement";
import ELRAWalletManagement from "./pages/user/modules/finance/ELRAWalletManagement";
import TransactionHistoryAndReports from "./pages/user/modules/finance/TransactionHistoryAndReports";
import BudgetAllocation from "./pages/user/modules/finance/BudgetAllocation";
import PayrollApprovals from "./pages/user/modules/finance/PayrollApprovals";
import SalesMarketingApprovals from "./pages/user/modules/finance/SalesMarketingApprovals";
import ProjectManagement from "./pages/user/modules/projects/ProjectManagement";
import HRModule from "./pages/user/modules/hr/HRModule";
import SelfService from "./pages/user/modules/self-service/SelfService";
import InventoryModule from "./pages/user/modules/inventory/InventoryModule";
import PayrollManagement from "./pages/user/modules/payroll/PayrollManagement";
import ProcurementModule from "./pages/user/modules/procurement/ProcurementModule";
import SalesMarketingModule from "./pages/user/modules/sales-marketing/SalesMarketingModule";
import LegalModule from "./pages/user/modules/legal/LegalModule";
import {
  SalesMarketingDashboard,
  SalesMarketingTransactions,
  SalesMarketingReports,
} from "./pages/user/modules/sales-marketing";
import ProcurementManagement from "./pages/user/modules/procurement/ProcurementManagement";
import {
  LegalDashboard,
  PendingReviews,
  ComplianceHistory,
  LegalPolicies,
  LegalCompliance,
  ComplianceItems,
} from "./pages/user/modules/legal";
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
import PurchaseOrders from "./pages/user/modules/procurement/PurchaseOrders";
import ProcurementTracking from "./pages/user/modules/procurement/ProcurementTracking";
import ProcurementReports from "./pages/user/modules/procurement/ProcurementReports";
// Inventory Module imports
import InventoryList from "./pages/user/modules/inventory/InventoryList";
import InventoryTracking from "./pages/user/modules/inventory/InventoryTracking";
import InventoryReports from "./pages/user/modules/inventory/InventoryReports";

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
        <Route path="notifications" element={<Notifications />} />
        <Route path="settings" element={<Settings />} />
        <Route path="profile" element={<Profile />} />

        {/* Sales & Marketing Module Routes - MUST come before generic module route */}
        <Route path="modules/sales">
          <Route index element={<SalesMarketingModule />} />
          <Route path="overview" element={<SalesMarketingDashboard />} />
          <Route path="transactions" element={<SalesMarketingTransactions />} />
          <Route path="approvals" element={<SalesMarketingApprovals />} />
          <Route path="reports" element={<SalesMarketingReports />} />
        </Route>

        {/* HR Module Routes */}
        <Route path="modules/hr" element={<HRModule />} />
        <Route path="modules/hr/users" element={<HRUsers />} />
        <Route
          path="modules/hr/departments"
          element={<DepartmentManagement />}
        />
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
        <Route path="modules/hr/leave/requests" element={<LeaveRequests />} />
        <Route
          path="modules/hr/leave/management"
          element={<LeaveManagement />}
        />
        <Route path="modules/hr/attendance" element={<AttendanceTracking />} />
        <Route path="modules/hr/leave/calendar" element={<LeaveCalendar />} />
        <Route path="modules/hr/policies" element={<PolicyManagement />} />
        <Route
          path="modules/hr/compliance"
          element={<ComplianceManagement />}
        />
        <Route
          path="modules/payroll/salary-grades"
          element={<SalaryGradeManagement />}
        />
        <Route
          path="modules/payroll/allowances"
          element={<PerformanceAllowances />}
        />
        <Route
          path="modules/payroll/bonuses"
          element={<PerformanceBonuses />}
        />
        <Route
          path="modules/payroll/deductions"
          element={<DeductionsManagement />}
        />
        <Route
          path="modules/payroll/processing"
          element={<PayrollProcessing />}
        />
        <Route path="modules/payroll" element={<PayrollManagement />} />
        <Route path="modules/payroll/payslips" element={<PaySlips />} />

        {/* Self-Service Module routes */}
        <Route path="modules/self-service" element={<SelfService />} />
        <Route path="modules/self-service/payslips" element={<MyPayslips />} />
        <Route
          path="modules/self-service/my-projects"
          element={<MyProjects />}
        />
        <Route
          path="modules/self-service/leave-requests"
          element={<MyLeaveRequests />}
        />
        <Route
          path="modules/self-service/documents"
          element={<MyDocuments />}
        />
        <Route
          path="modules/self-service/my-documents"
          element={<MyDocuments />}
        />
        <Route path="modules/self-service/my-archive" element={<MyArchive />} />
        <Route path="modules/self-service/my-tickets" element={<MyTickets />} />
        <Route
          path="modules/self-service/project-tasks"
          element={<MyProjectTasks />}
        />

        {/* Customer Care Module Routes */}
        <Route
          path="modules/customer-care"
          element={<CustomerCareDashboard />}
        />
        <Route
          path="modules/customer-care/overview"
          element={<CustomerCareDashboard />}
        />
        <Route
          path="modules/customer-care/complaints"
          element={<StaffComplaints />}
        />
        <Route
          path="modules/customer-care/management"
          element={<ComplaintManagement />}
        />
        <Route
          path="modules/customer-care/reports"
          element={<CustomerCareReports />}
        />
        <Route
          path="modules/customer-care/submit-complaint"
          element={<SubmitComplaint />}
        />
        <Route
          path="modules/customer-care/assignments"
          element={<MyAssignments />}
        />
        <Route
          path="modules/customer-care/assign-complaints"
          element={<AssignComplaints />}
        />
        <Route
          path="modules/customer-care/my-complaints"
          element={<MyComplaints />}
        />

        {/* Department Management Module Routes */}
        <Route
          path="modules/department-management"
          element={<DeptManagement />}
        />
        <Route
          path="modules/department-management/project-approvals"
          element={<ProjectApprovals />}
        />
        <Route
          path="modules/department-management/approval-history"
          element={<ApprovalHistory />}
        />
        <Route
          path="modules/department-management/leave-management"
          element={<DeptLeaveManagement />}
        />
        <Route
          path="modules/department-management/leave-calendar"
          element={<DepartmentLeaveCalendar />}
        />
        <Route
          path="modules/department-management/team-management"
          element={<TeamManagement />}
        />
        <Route
          path="modules/department-management/analytics"
          element={<Analytics />}
        />
        <Route
          path="modules/department-management/users"
          element={<UserManagement />}
        />
        {/* Department Announcements (HOD) */}
        <Route
          path="modules/department-management/announcements"
          element={<DepartmentAnnouncements />}
        />
        <Route
          path="modules/department-management/create-department-project"
          element={<CreateDepartmentProject />}
        />
        <Route
          path="modules/department-management/projects"
          element={<DepartmentProjects />}
        />

        <Route path="modules/communication" element={<Communication />} />
        <Route
          path="modules/communication/messages"
          element={<InternalMessages />}
        />
        {/* TeamChats and FileSharing disabled */}
        <Route
          path="modules/communication/announcements"
          element={<Announcements />}
        />
        <Route
          path="modules/communication/events"
          element={<EventsCalendar />}
        />

        <Route path="modules/payroll/reports" element={<PayrollReports />} />

        {/* New ERP Module Routes */}
        <Route path="modules/projects" element={<ProjectManagement />} />
        <Route path="modules/projects/list" element={<ProjectList />} />
        <Route
          path="modules/projects/analytics"
          element={<ProjectAnalytics />}
        />
        <Route
          path="modules/projects/external"
          element={<ExternalProjectManagement />}
        />
        <Route path="modules/projects/teams" element={<ProjectTeams />} />
        <Route path="modules/projects/reports" element={<ProjectReports />} />
        <Route path="modules/projects/progress" element={<ProjectProgress />} />
        <Route
          path="modules/projects/resources"
          element={<ProjectResources />}
        />
        <Route
          path="modules/projects/approvals"
          element={<ApprovalDashboard />}
        />
        <Route
          path="modules/projects/certificate/:projectId"
          element={<ComplianceCertificate />}
        />

        <Route path="modules/tasks/list" element={<TaskList />} />
        <Route path="modules/tasks/analytics" element={<TaskAnalytics />} />
        <Route path="modules/tasks/assignments" element={<TaskAssignments />} />
        <Route path="modules/tasks/reports" element={<TaskReports />} />

        {/* Finance Module Routes */}
        <Route path="modules/finance" element={<FinancialManagement />} />
        <Route
          path="modules/finance/elra-wallet"
          element={<ELRAWalletManagement />}
        />
        <Route
          path="modules/finance/transaction-history"
          element={<TransactionHistoryAndReports />}
        />
        <Route
          path="modules/finance/budget-allocation"
          element={<BudgetAllocation />}
        />
        <Route
          path="modules/finance/payroll-approvals"
          element={<PayrollApprovals />}
        />
        <Route
          path="modules/finance/sales-marketing-approvals"
          element={<SalesMarketingApprovals />}
        />

        {/* Procurement Module Routes */}
        <Route path="modules/procurement" element={<ProcurementModule />} />
        <Route path="modules/procurement/orders" element={<PurchaseOrders />} />
        <Route
          path="modules/procurement/tracking"
          element={<ProcurementTracking />}
        />
        <Route
          path="modules/procurement/reports"
          element={<ProcurementReports />}
        />

        {/* Legal Module Routes */}
        <Route path="modules/legal" element={<LegalModule />} />
        <Route path="modules/legal/policies" element={<LegalPolicies />} />
        <Route
          path="modules/legal/compliance-programs"
          element={<LegalCompliance />}
        />
        <Route
          path="modules/legal/compliance-items"
          element={<ComplianceItems />}
        />
        <Route
          path="modules/legal/pending-reviews"
          element={<PendingReviews />}
        />
        <Route
          path="modules/legal/compliance-history"
          element={<ComplianceHistory />}
        />

        {/* Inventory Module Routes */}
        <Route path="modules/inventory" element={<InventoryModule />} />
        <Route path="modules/inventory/list" element={<InventoryList />} />
        <Route
          path="modules/inventory/tracking"
          element={<InventoryTracking />}
        />
        <Route
          path="modules/inventory/reports"
          element={<InventoryReports />}
        />
      </Route>

      {/* Remove conflicting procurement routes - they're already defined above */}

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
