import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import User from "../models/User.js";
import Role from "../models/Role.js";
import Company from "../models/Company.js";
import Department from "../models/Department.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

const createSuperAdmin = async () => {
  try {
    console.log("🚀 Starting Super Admin creation script...");

    await connectDB();

    // Delete all existing users
    console.log("🗑️  Deleting all existing users...");
    const deleteResult = await User.deleteMany({});
    console.log(`✅ Deleted ${deleteResult.deletedCount} existing users`);

    // Create or find SUPER_ADMIN role
    let superAdminRole = await Role.findOne({ name: "SUPER_ADMIN" });
    if (!superAdminRole) {
      console.log("🔧 Creating SUPER_ADMIN role...");
      superAdminRole = await Role.create({
        name: "SUPER_ADMIN",
        level: 1000,
        description: "Super Administrator with full system access",
        permissions: [
          // Document permissions
          "document.upload",
          "document.view",
          "document.edit",
          "document.delete",
          "document.approve",
          "document.reject",
          "document.share",
          "document.export",
          "document.archive",

          // User management permissions
          "user.create",
          "user.view",
          "user.edit",
          "user.delete",
          "user.assign_role",
          "user.view_permissions",

          // Workflow permissions
          "workflow.create",
          "workflow.start",
          "workflow.approve",
          "workflow.reject",
          "workflow.delegate",
          "workflow.view",

          // System permissions
          "system.settings",
          "system.reports",
          "system.audit",
          "system.backup",
        ],
        canApproveDepartment: true,
        canApproveSuperAdmin: true,
        canManageUsers: true,
        canManageRoles: true,
        canManageDepartments: true,
        canManageCompanies: true,
        canAccessAllModules: true,
        isSystemRole: true,
      });
      console.log("✅ SUPER_ADMIN role created");
    } else {
      console.log("✅ SUPER_ADMIN role already exists");
    }

    // Create default company if it doesn't exist
    let defaultCompany = await Company.findOne({ name: "ELRA System" });
    if (!defaultCompany) {
      console.log("🏢 Creating default company...");
      defaultCompany = await Company.create({
        name: "ELRA System",
        description: "Default company for ELRA ERP System",
        industry: "Technology",
        size: "Enterprise",
        website: "https://elra.centuryinfo.com",
        address: {
          street: "123 ERP Street",
          city: "Lagos",
          state: "Lagos",
          country: "Nigeria",
          postalCode: "100001",
        },
        contact: {
          email: "info@elra.centuryinfo.com",
          phone: "+234-1-234-5678",
        },
        isActive: true,
        isDefault: true,
      });
      console.log("✅ Default company created");
    } else {
      console.log("✅ Default company already exists");
    }

    // Create default department if it doesn't exist
    let defaultDepartment = await Department.findOne({
      name: "System Administration",
    });
    if (!defaultDepartment) {
      console.log("🏢 Creating default department...");
      defaultDepartment = await Department.create({
        name: "System Administration",
        description: "System administration and management",
        company: defaultCompany._id,
        manager: null, // Will be set to superadmin
        isActive: true,
        isDefault: true,
      });
      console.log("✅ Default department created");
    } else {
      console.log("✅ Default department already exists");
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash("Sbpdojddme4*", saltRounds);

    // Create Super Admin user with your details
    console.log("👤 Creating Super Admin user...");
    const superAdmin = await User.create({
      username: "oluwasegun",
      firstName: "Olaniyan",
      lastName: "Oluwasegun",
      email: "oluwasegun@elra.com",
      password: hashedPassword,
      role: superAdminRole._id,
      company: defaultCompany._id,
      department: defaultDepartment._id,
      isActive: true,
      isEmailVerified: true,
      isSuperadmin: true,
      status: "ACTIVE",
      position: "Super Administrator",
      employeeId: "SA001",
      phone: "+234-1-234-5678",
      address: {
        street: "123 Admin Street",
        city: "Lagos",
        state: "Lagos",
        country: "Nigeria",
        postalCode: "100001",
      },
      bio: "Super Administrator for ELRA ERP System",
      lastLogin: new Date(),
      permissions: [
        // Document permissions
        "document.upload",
        "document.view",
        "document.edit",
        "document.delete",
        "document.approve",
        "document.reject",
        "document.share",
        "document.export",
        "document.archive",

        // User management permissions
        "user.create",
        "user.view",
        "user.edit",
        "user.delete",
        "user.assign_role",
        "user.view_permissions",

        // Workflow permissions
        "workflow.create",
        "workflow.start",
        "workflow.approve",
        "workflow.reject",
        "workflow.delegate",
        "workflow.view",

        // System permissions
        "system.settings",
        "system.reports",
        "system.audit",
        "system.backup",
      ],
      canApproveDepartment: true,
      canApproveSuperAdmin: true,
      canManageUsers: true,
      canManageRoles: true,
      canManageDepartments: true,
      canManageCompanies: true,
      canAccessAllModules: true,
    });

    // Update department manager
    await Department.findByIdAndUpdate(defaultDepartment._id, {
      manager: superAdmin._id,
    });

    console.log("🎉 Super Admin created successfully!");
    console.log("");
    console.log("📋 Login Credentials:");
    console.log("   Email: oluwasegun@elra.com");
    console.log("   Password: Sbpdojddme4*");
    console.log("");
    console.log("🔑 User Details:");
    console.log("   Name: Olaniyan Oluwasegun");
    console.log("   Username: oluwasegun");
    console.log("   Role: SUPER_ADMIN");
    console.log("   Company: ELRA System");
    console.log("   Department: System Administration");
    console.log("   Status: ACTIVE");
    console.log("   Email Verified: YES");
    console.log("");
    console.log("🚀 You can now login to the ELRA ERP System!");
  } catch (error) {
    console.error("❌ Error creating Super Admin:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
};

// Run the script
createSuperAdmin();
