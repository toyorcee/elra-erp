# ELRA ERP Frontend Architecture Plan

## 🎯 **Overview**

This document outlines the complete frontend architecture for ELRA ERP, focusing on a **single user folder** with **role-based routing** and **granular permissions**. This approach ensures maintainability, scalability, and ease of collaboration with your development team.

---

## 🏗️ **Folder Structure**

```
client/src/
├── pages/
│   ├── auth/                    # Authentication pages
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── ForgotPassword.jsx
│   │   ├── ResetPassword.jsx
│   │   ├── EmailVerification.jsx
│   │   └── EmailVerificationSuccess.jsx
│   │
│   ├── shared/                  # Public/shared pages
│   │   ├── LandingPage.jsx
│   │   ├── ModuleSelector.jsx
│   │   ├── Notifications.jsx
│   │   └── ComingSoon.jsx
│   │
│   └── user/                    # 🎯 SINGLE USER FOLDER - All authenticated users
│       ├── Dashboard.jsx        # Role-based dashboard
│       ├── Profile.jsx          # User profile management
│       ├── Settings.jsx         # User settings
│       │
│       ├── hr/                  # HR Module
│       │   ├── Dashboard.jsx
│       │   ├── employees/
│       │   │   ├── List.jsx
│       │   │   ├── Create.jsx
│       │   │   ├── Edit.jsx
│       │   │   └── View.jsx
│       │   ├── recruitment/
│       │   │   ├── List.jsx
│       │   │   ├── Create.jsx
│       │   │   └── View.jsx
│       │   ├── performance/
│       │   │   ├── List.jsx
│       │   │   ├── Create.jsx
│       │   │   └── View.jsx
│       │   └── leave/
│       │       ├── List.jsx
│       │       ├── Create.jsx
│       │       └── View.jsx
│       │
│       ├── payroll/             # Payroll Module
│       │   ├── Dashboard.jsx
│       │   ├── salary/
│       │   │   ├── List.jsx
│       │   │   ├── Create.jsx
│       │   │   └── View.jsx
│       │   ├── process/
│       │   │   ├── List.jsx
│       │   │   ├── Create.jsx
│       │   │   └── View.jsx
│       │   └── deductions/
│       │       ├── List.jsx
│       │       ├── Create.jsx
│       │       └── View.jsx
│       │
│       ├── procurement/         # Procurement Module
│       │   ├── Dashboard.jsx
│       │   ├── requisitions/
│       │   │   ├── List.jsx
│       │   │   ├── Create.jsx
│       │   │   └── View.jsx
│       │   ├── purchase-orders/
│       │   │   ├── List.jsx
│       │   │   ├── Create.jsx
│       │   │   └── View.jsx
│       │   └── vendors/
│       │       ├── List.jsx
│       │       ├── Create.jsx
│       │       └── View.jsx
│       │
│       ├── accounts/            # Accounts Module
│       │   ├── Dashboard.jsx
│       │   ├── expenses/
│       │   │   ├── List.jsx
│       │   │   ├── Create.jsx
│       │   │   └── View.jsx
│       │   ├── revenue/
│       │   │   ├── List.jsx
│       │   │   ├── Create.jsx
│       │   │   └── View.jsx
│       │   └── budget/
│       │       ├── List.jsx
│       │       ├── Create.jsx
│       │       └── View.jsx
│       │
│       ├── communication/       # Communication Module
│       │   ├── Dashboard.jsx
│       │   ├── messages/
│       │   │   ├── List.jsx
│       │   │   ├── Create.jsx
│       │   │   └── View.jsx
│       │   ├── announcements/
│       │   │   ├── List.jsx
│       │   │   ├── Create.jsx
│       │   │   └── View.jsx
│       │   └── meetings/
│       │       ├── List.jsx
│       │       ├── Create.jsx
│       │       └── View.jsx
│       │
│       └── system/              # System Administration
│           ├── Dashboard.jsx
│           ├── users/
│           │   ├── List.jsx
│           │   ├── Create.jsx
│           │   └── Edit.jsx
│           ├── roles/
│           │   ├── List.jsx
│           │   ├── Create.jsx
│           │   └── Edit.jsx
│           └── departments/
│               ├── List.jsx
│               ├── Create.jsx
│               └── Edit.jsx
│
├── components/
│   ├── common/                  # Shared components
│   │   ├── ELRALogo.jsx
│   │   ├── GradientSpinner.jsx
│   │   ├── ProtectedRoute.jsx
│   │   ├── RoleRedirect.jsx
│   │   └── StatCard.jsx
│   │
│   ├── layout/                  # Layout components
│   │   ├── DashboardLayout.jsx
│   │   ├── Sidebar.jsx
│   │   ├── Header.jsx
│   │   └── Footer.jsx
│   │
│   ├── modules/                 # Module-specific components
│   │   ├── hr/
│   │   │   ├── EmployeeCard.jsx
│   │   │   ├── RecruitmentForm.jsx
│   │   │   └── PerformanceChart.jsx
│   │   ├── payroll/
│   │   │   ├── SalaryCard.jsx
│   │   │   ├── PayrollTable.jsx
│   │   │   └── DeductionForm.jsx
│   │   ├── procurement/
│   │   │   ├── RequisitionCard.jsx
│   │   │   ├── VendorTable.jsx
│   │   │   └── PurchaseOrderForm.jsx
│   │   ├── accounts/
│   │   │   ├── ExpenseCard.jsx
│   │   │   ├── RevenueChart.jsx
│   │   │   └── BudgetForm.jsx
│   │   └── communication/
│   │       ├── MessageCard.jsx
│   │       ├── AnnouncementForm.jsx
│   │       └── MeetingScheduler.jsx
│   │
│   └── forms/                   # Reusable form components
│       ├── UserForm.jsx
│       ├── RoleForm.jsx
│       ├── DepartmentForm.jsx
│       └── SearchForm.jsx
│
├── hooks/                       # Custom hooks
│   ├── useAuth.js
│   ├── usePermissions.js
│   ├── useModules.js
│   └── useNotifications.js
│
├── context/                     # React context
│   ├── AuthContext.jsx
│   ├── PermissionContext.jsx
│   └── NotificationContext.jsx
│
├── services/                    # API services
│   ├── api.js
│   ├── auth.js
│   ├── hr.js
│   ├── payroll.js
│   ├── procurement.js
│   ├── accounts.js
│   ├── communication.js
│   └── system.js
│
├── utils/                       # Utility functions
│   ├── permissions.js
│   ├── roleUtils.js
│   ├── dateUtils.js
│   └── validation.js
│
└── constants/                   # Constants
    ├── routes.js
    ├── permissions.js
    └── modules.js
```

---

## 🔐 **Role-Based Routing System**

### **1. Permission-Based Route Protection**

```javascript
// utils/permissions.js
export const checkModuleAccess = (user, module) => {
  if (!user || !user.role) return false;

  const modulePermissions = {
    hr: "hr.view",
    payroll: "payroll.view",
    procurement: "procurement.view",
    accounts: "accounts.view",
    communication: "communication.view",
    system: "system.view",
  };

  return hasPermission(user, modulePermissions[module]);
};

export const getAccessibleModules = (user) => {
  const modules = [
    "hr",
    "payroll",
    "procurement",
    "accounts",
    "communication",
    "system",
  ];
  return modules.filter((module) => checkModuleAccess(user, module));
};
```

### **2. Dynamic Route Generation**

```javascript
// routes.jsx
import { useAuth } from "./hooks/useAuth";
import { getAccessibleModules } from "./utils/permissions";

const AppRoutes = () => {
  const { user, isAuthenticated } = useAuth();

  const generateModuleRoutes = () => {
    if (!user) return [];

    const accessibleModules = getAccessibleModules(user);

    return accessibleModules.map((module) => ({
      path: `/${module}`,
      element: (
        <ProtectedRoute>
          <ModuleDashboard module={module} />
        </ProtectedRoute>
      ),
    }));
  };

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/modules" element={<ModuleSelector />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />

      {/* Dynamic module routes */}
      {generateModuleRoutes()}

      {/* Catch all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};
```

### **3. Module-Specific Route Protection**

```javascript
// components/ProtectedModuleRoute.jsx
import { useAuth } from "../hooks/useAuth";
import { checkModuleAccess } from "../utils/permissions";

const ProtectedModuleRoute = ({ module, children }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!checkModuleAccess(user, module)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};
```

---

## 🎨 **Component Architecture**

### **1. Dashboard Layout System**

```javascript
// components/layout/DashboardLayout.jsx
const DashboardLayout = ({ children, module }) => {
  const { user } = useAuth();
  const accessibleModules = getAccessibleModules(user);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar modules={accessibleModules} activeModule={module} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
        <Footer />
      </div>
    </div>
  );
};
```

### **2. Module Dashboard Components**

```javascript
// pages/user/hr/Dashboard.jsx
const HRDashboard = () => {
  const { user } = useAuth();
  const hasEmployeePermission = hasPermission(user, "hr.employee.view");
  const hasRecruitmentPermission = hasPermission(user, "hr.recruitment.view");

  return (
    <DashboardLayout module="hr">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">HR Dashboard</h1>

        {/* Permission-based content */}
        {hasEmployeePermission && <EmployeeStats />}
        {hasRecruitmentPermission && <RecruitmentStats />}

        {/* Role-based quick actions */}
        <QuickActions user={user} />
      </div>
    </DashboardLayout>
  );
};
```

### **3. Permission-Aware Components**

```javascript
// components/common/PermissionGate.jsx
const PermissionGate = ({ permission, children, fallback = null }) => {
  const { user } = useAuth();

  if (!hasPermission(user, permission)) {
    return fallback;
  }

  return children;
};

// Usage
<PermissionGate permission="hr.employee.create">
  <button className="btn-primary">Add Employee</button>
</PermissionGate>;
```

---

## 🚀 **Implementation Strategy**

### **Phase 1: Foundation (Week 1)**

1. **Clean up existing structure**

   - Remove admin/ and platform-admin/ folders
   - Consolidate all user pages into single user/ folder
   - Update imports and routes

2. **Set up RBAC system**

   - Create permission utilities
   - Implement role-based routing
   - Add permission-aware components

3. **Create base layouts**
   - DashboardLayout component
   - Sidebar with dynamic module navigation
   - Header with user info and notifications

### **Phase 2: Module Development (Week 2)**

1. **HR Module**

   - Employee management
   - Recruitment workflow
   - Performance tracking
   - Leave management

2. **Payroll Module**

   - Salary management
   - Payroll processing
   - Deductions handling

3. **Procurement Module**
   - Purchase requisitions
   - Vendor management
   - Purchase orders

### **Phase 3: Advanced Features (Week 3)**

1. **Accounts Module**

   - Expense tracking
   - Revenue management
   - Budget control

2. **Communication Module**

   - Internal messaging
   - Announcements
   - Meeting scheduling

3. **System Administration**
   - User management
   - Role management
   - Department management

---

## 🔧 **Development Guidelines**

### **1. Component Structure**

```javascript
// Standard component template
const ModuleComponent = () => {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Permission checks
  const canCreate = hasPermission(user, "module.item.create");
  const canEdit = hasPermission(user, "module.item.edit");
  const canDelete = hasPermission(user, "module.item.delete");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Module Title</h1>
        {canCreate && <button className="btn-primary">Create New</button>}
      </div>

      {loading ? (
        <GradientSpinner />
      ) : (
        <div className="grid gap-4">
          {data.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              canEdit={canEdit}
              canDelete={canDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};
```

### **2. Permission Patterns**

```javascript
// Always check permissions before rendering
const canAccess = hasPermission(user, "module.action");

// Use PermissionGate for conditional rendering
<PermissionGate permission="module.action">
  <Component />
</PermissionGate>;

// Handle unauthorized access gracefully
if (!canAccess) {
  return <UnauthorizedMessage />;
}
```

### **3. API Integration**

```javascript
// services/module.js
export const moduleAPI = {
  // Always include permission checks in API calls
  getItems: async () => {
    const response = await api.get("/module/items");
    return response.data;
  },

  createItem: async (data) => {
    const response = await api.post("/module/items", data);
    return response.data;
  },

  updateItem: async (id, data) => {
    const response = await api.put(`/module/items/${id}`, data);
    return response.data;
  },

  deleteItem: async (id) => {
    const response = await api.delete(`/module/items/${id}`);
    return response.data;
  },
};
```

---

## 📋 **Next Steps**

1. **Immediate Actions**

   - Run the ERP role setup script
   - Clean up admin/ and platform-admin/ folders
   - Create the new folder structure
   - Implement permission utilities

2. **Development Workflow**

   - Create components with permission checks
   - Test role-based access control
   - Implement module-specific features
   - Add comprehensive error handling

3. **Testing Strategy**
   - Test each role with different permissions
   - Verify unauthorized access is blocked
   - Test cross-module permissions
   - Validate role inheritance

---

## 🎯 **Success Criteria**

- ✅ Single user folder structure
- ✅ Role-based routing system
- ✅ Granular permission control
- ✅ Module-specific access control
- ✅ Scalable component architecture
- ✅ Easy collaboration for development team
- ✅ Comprehensive error handling
- ✅ Performance optimized

---

**This architecture ensures a maintainable, scalable, and secure ERP system that your development team can easily work with! 🚀**
