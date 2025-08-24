import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import Role from "../models/Role.js";
import Department from "../models/Department.js";

dotenv.config();

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined");
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
    });

    console.log(`🟢 MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    process.exit(1);
  }
};

// Simulate the frontend getModulesForUser function
const getModulesForUser = (user) => {
  if (!user) return [];

  const { role, department } = user;
  const roleLevel = role?.level || 300;
  const departmentName = department?.name || "";

  // Always include these modules (universal access)
  const baseModules = [
    {
      label: "Dashboard",
      icon: "HiOutlineHome",
      path: "/dashboard",
      required: { minLevel: 0 },
      section: "main",
    },
    {
      label: "Self-Service",
      icon: "HiOutlineUser",
      path: "/dashboard/modules/self-service",
      required: { minLevel: 0 },
      section: "erp",
      badge: "Personal",
    },
    {
      label: "Customer Care",
      icon: "HiOutlinePhone",
      path: "/dashboard/modules/customer-care",
      required: { minLevel: 0 },
      section: "erp",
      badge: "Care",
    },
  ];

  // Department-specific modules mapping
  const departmentModuleMapping = {
    "Finance & Accounting": [
      {
        label: "Finance Management",
        icon: "HiOutlineCalculator",
        path: "/dashboard/modules/finance",
        required: { minLevel: 300 },
        section: "erp",
        badge: "Finance",
      },
      {
        label: "Procurement",
        icon: "HiOutlineShoppingCart",
        path: "/dashboard/modules/procurement",
        required: { minLevel: 600 },
        section: "erp",
        badge: "Proc",
      },
      {
        label: "Payroll Management",
        icon: "HiOutlineCurrencyDollar",
        path: "/dashboard/modules/payroll",
        required: { minLevel: 700 },
        section: "erp",
        badge: "Payroll",
      },
    ],
    "Human Resources": [
      {
        label: "HR Management",
        icon: "HiOutlineUsers",
        path: "/dashboard/modules/hr",
        required: { minLevel: 300 },
        section: "erp",
        badge: "HR",
      },
      {
        label: "Payroll Management",
        icon: "HiOutlineCurrencyDollar",
        path: "/dashboard/modules/payroll",
        required: { minLevel: 700 },
        section: "erp",
        badge: "Payroll",
      },
    ],
    "Information Technology": [
      {
        label: "IT Management",
        icon: "HiOutlineCog6Tooth",
        path: "/dashboard/modules/it",
        required: { minLevel: 300 },
        section: "erp",
        badge: "IT",
      },
      {
        label: "System Administration",
        icon: "HiOutlineCog6Tooth",
        path: "/dashboard/modules/system-admin",
        required: { minLevel: 700 },
        section: "erp",
        badge: "Admin",
      },
    ],
    Operations: [
      {
        label: "Operations Management",
        icon: "HiOutlineCog",
        path: "/dashboard/modules/operations",
        required: { minLevel: 300 },
        section: "erp",
        badge: "Ops",
      },
      {
        label: "Project Management",
        icon: "HiOutlineFolder",
        path: "/dashboard/modules/projects",
        required: { minLevel: 600 },
        section: "erp",
        badge: "Proj",
      },
      {
        label: "Inventory Management",
        icon: "HiOutlineCube",
        path: "/dashboard/modules/inventory",
        required: { minLevel: 600 },
        section: "erp",
        badge: "Inv",
      },
    ],
    "Sales & Marketing": [
      {
        label: "Sales & Marketing",
        icon: "HiOutlineChartBar",
        path: "/dashboard/modules/sales",
        required: { minLevel: 300 },
        section: "erp",
        badge: "Sales",
      },
    ],
    "Legal & Compliance": [
      {
        label: "Legal & Compliance",
        icon: "HiOutlineShieldCheck",
        path: "/dashboard/modules/legal",
        required: { minLevel: 300 },
        section: "erp",
        badge: "Legal",
      },
    ],
  };

  // Get department-specific modules
  const departmentModules = departmentModuleMapping[departmentName] || [];

  // Filter modules based on role level
  const filteredDepartmentModules = departmentModules.filter((module) => {
    return roleLevel >= module.required.minLevel;
  });

  // SUPER_ADMIN gets access to everything
  if (roleLevel === 1000) {
    return [...baseModules, ...Object.values(departmentModuleMapping).flat()];
  }

  // Return base modules + department-specific modules
  return [...baseModules, ...filteredDepartmentModules];
};

async function testModuleFiltering() {
  try {
    await connectDB();

    console.log("🧪 TESTING MODULE FILTERING FOR DIFFERENT DEPARTMENTS");
    console.log("=".repeat(80));

    // Get departments and roles
    const departments = await Department.find().sort({ name: 1 });
    const roles = await Role.find().sort({ level: -1 });

    console.log("\n🎯 TESTING DIFFERENT SCENARIOS:");
    console.log("-".repeat(50));

    // Test 1: Finance HOD
    console.log("\n1️⃣ FINANCE HOD TEST:");
    console.log("-".repeat(30));
    const financeDept = departments.find(
      (d) => d.name === "Finance & Accounting"
    );
    const hodRole = roles.find((r) => r.name === "HOD");

    if (financeDept && hodRole) {
      const financeHOD = {
        firstName: "Test",
        lastName: "Finance HOD",
        role: hodRole,
        department: financeDept,
      };

      const accessibleModules = getModulesForUser(financeHOD);
      console.log(`User: ${financeHOD.firstName} ${financeHOD.lastName}`);
      console.log(
        `Role: ${financeHOD.role.name} (Level: ${financeHOD.role.level})`
      );
      console.log(`Department: ${financeHOD.department.name}`);
      console.log(`Accessible Modules: ${accessibleModules.length}`);

      accessibleModules.forEach((module, index) => {
        console.log(`  ${index + 1}. ${module.label} (${module.path})`);
      });

      // Check if HR module is accessible (should NOT be)
      const hasHRModule = accessibleModules.some((m) => m.path.includes("/hr"));
      console.log(`❌ Has HR Module: ${hasHRModule} (Should be FALSE)`);

      // Check if Finance module is accessible (should be)
      const hasFinanceModule = accessibleModules.some((m) =>
        m.path.includes("/finance")
      );
      console.log(
        `✅ Has Finance Module: ${hasFinanceModule} (Should be TRUE)`
      );
    }

    // Test 2: HR HOD
    console.log("\n2️⃣ HR HOD TEST:");
    console.log("-".repeat(30));
    const hrDept = departments.find((d) => d.name === "Human Resources");

    if (hrDept && hodRole) {
      const hrHOD = {
        firstName: "Test",
        lastName: "HR HOD",
        role: hodRole,
        department: hrDept,
      };

      const accessibleModules = getModulesForUser(hrHOD);
      console.log(`User: ${hrHOD.firstName} ${hrHOD.lastName}`);
      console.log(`Role: ${hrHOD.role.name} (Level: ${hrHOD.role.level})`);
      console.log(`Department: ${hrHOD.department.name}`);
      console.log(`Accessible Modules: ${accessibleModules.length}`);

      accessibleModules.forEach((module, index) => {
        console.log(`  ${index + 1}. ${module.label} (${module.path})`);
      });

      // Check if HR module is accessible (should be)
      const hasHRModule = accessibleModules.some((m) => m.path.includes("/hr"));
      console.log(`✅ Has HR Module: ${hasHRModule} (Should be TRUE)`);

      // Check if Finance module is accessible (should NOT be)
      const hasFinanceModule = accessibleModules.some((m) =>
        m.path.includes("/finance")
      );
      console.log(
        `❌ Has Finance Module: ${hasFinanceModule} (Should be FALSE)`
      );
    }

    // Test 3: IT HOD
    console.log("\n3️⃣ IT HOD TEST:");
    console.log("-".repeat(30));
    const itDept = departments.find((d) => d.name === "Information Technology");

    if (itDept && hodRole) {
      const itHOD = {
        firstName: "Test",
        lastName: "IT HOD",
        role: hodRole,
        department: itDept,
      };

      const accessibleModules = getModulesForUser(itHOD);
      console.log(`User: ${itHOD.firstName} ${itHOD.lastName}`);
      console.log(`Role: ${itHOD.role.name} (Level: ${itHOD.role.level})`);
      console.log(`Department: ${itHOD.department.name}`);
      console.log(`Accessible Modules: ${accessibleModules.length}`);

      accessibleModules.forEach((module, index) => {
        console.log(`  ${index + 1}. ${module.label} (${module.path})`);
      });

      // Check if IT module is accessible (should be)
      const hasITModule = accessibleModules.some((m) => m.path.includes("/it"));
      console.log(`✅ Has IT Module: ${hasITModule} (Should be TRUE)`);

      // Check if System Admin module is accessible (should be for HOD)
      const hasSystemAdminModule = accessibleModules.some((m) =>
        m.path.includes("/system-admin")
      );
      console.log(
        `✅ Has System Admin Module: ${hasSystemAdminModule} (Should be TRUE)`
      );
    }

    // Test 4: Finance Staff (lower level)
    console.log("\n4️⃣ FINANCE STAFF TEST:");
    console.log("-".repeat(30));
    const staffRole = roles.find((r) => r.name === "STAFF");

    if (financeDept && staffRole) {
      const financeStaff = {
        firstName: "Test",
        lastName: "Finance Staff",
        role: staffRole,
        department: financeDept,
      };

      const accessibleModules = getModulesForUser(financeStaff);
      console.log(`User: ${financeStaff.firstName} ${financeStaff.lastName}`);
      console.log(
        `Role: ${financeStaff.role.name} (Level: ${financeStaff.role.level})`
      );
      console.log(`Department: ${financeStaff.department.name}`);
      console.log(`Accessible Modules: ${accessibleModules.length}`);

      accessibleModules.forEach((module, index) => {
        console.log(`  ${index + 1}. ${module.label} (${module.path})`);
      });

      // Check if Finance module is accessible (should be for STAFF level 300)
      const hasFinanceModule = accessibleModules.some((m) =>
        m.path.includes("/finance")
      );
      console.log(
        `✅ Has Finance Module: ${hasFinanceModule} (Should be TRUE)`
      );

      // Check if Payroll module is accessible (should NOT be for STAFF level 300, requires 700)
      const hasPayrollModule = accessibleModules.some((m) =>
        m.path.includes("/payroll")
      );
      console.log(
        `❌ Has Payroll Module: ${hasPayrollModule} (Should be FALSE - requires level 700)`
      );
    }

    // Test 5: SUPER_ADMIN (should have everything)
    console.log("\n5️⃣ SUPER_ADMIN TEST:");
    console.log("-".repeat(30));
    const superAdminRole = roles.find((r) => r.name === "SUPER_ADMIN");

    if (superAdminRole) {
      const superAdmin = {
        firstName: "Test",
        lastName: "Super Admin",
        role: superAdminRole,
        department: null,
      };

      const accessibleModules = getModulesForUser(superAdmin);
      console.log(`User: ${superAdmin.firstName} ${superAdmin.lastName}`);
      console.log(
        `Role: ${superAdmin.role.name} (Level: ${superAdmin.role.level})`
      );
      console.log(`Department: ${superAdmin.department?.name || "None"}`);
      console.log(`Accessible Modules: ${accessibleModules.length}`);

      // Check if they have access to all major modules
      const hasHRModule = accessibleModules.some((m) => m.path.includes("/hr"));
      const hasFinanceModule = accessibleModules.some((m) =>
        m.path.includes("/finance")
      );
      const hasITModule = accessibleModules.some((m) => m.path.includes("/it"));
      const hasSystemAdminModule = accessibleModules.some((m) =>
        m.path.includes("/system-admin")
      );

      console.log(`✅ Has HR Module: ${hasHRModule} (Should be TRUE)`);
      console.log(
        `✅ Has Finance Module: ${hasFinanceModule} (Should be TRUE)`
      );
      console.log(`✅ Has IT Module: ${hasITModule} (Should be TRUE)`);
      console.log(
        `✅ Has System Admin Module: ${hasSystemAdminModule} (Should be TRUE)`
      );
    }

    console.log("\n" + "=".repeat(80));
    console.log("✅ MODULE FILTERING TEST COMPLETE");
    console.log("=".repeat(80));
  } catch (error) {
    console.error("❌ Error during module filtering test:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Database connection closed");
  }
}

testModuleFiltering();
