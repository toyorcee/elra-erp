import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "../models/User.js";
import Role from "../models/Role.js";
import Department from "../models/Department.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the correct path
dotenv.config({ path: path.join(__dirname, "../.env") });

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.error("❌ MONGODB_URI is not defined in environment variables");
      console.log(
        "💡 Please make sure you have a .env file in the server directory"
      );
      console.log(
        "💡 The .env file should contain: MONGODB_URI=your_mongodb_connection_string"
      );
      process.exit(1);
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      maxPoolSize: 10,
      minPoolSize: 1,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    console.log("🔄 Retrying in 5 seconds...");
    setTimeout(connectDB, 5000);
  }
};

const createDefaultRoles = async () => {
  const roles = [
    {
      name: "SUPER_ADMIN",
      level: 100,
      description: "Full system access and control",
      permissions: [
        "document.upload",
        "document.view",
        "document.edit",
        "document.delete",
        "document.approve",
        "document.reject",
        "document.share",
        "document.export",
        "document.archive",
        "user.create",
        "user.view",
        "user.edit",
        "user.delete",
        "user.assign_role",
        "user.view_permissions",
        "workflow.create",
        "workflow.start",
        "workflow.approve",
        "workflow.reject",
        "workflow.delegate",
        "workflow.view",
        "system.settings",
        "system.reports",
        "system.audit",
        "system.backup",
      ],
      departmentAccess: ["All"],
      isActive: true,
    },
    {
      name: "ADMIN",
      level: 90,
      description: "Administrative access with user management",
      permissions: [
        "document.upload",
        "document.view",
        "document.edit",
        "document.delete",
        "document.approve",
        "document.reject",
        "document.share",
        "document.export",
        "user.create",
        "user.view",
        "user.edit",
        "user.assign_role",
        "workflow.create",
        "workflow.start",
        "workflow.approve",
        "workflow.reject",
        "workflow.view",
        "system.reports",
      ],
      departmentAccess: ["All"],
      isActive: true,
    },
    {
      name: "MANAGER",
      level: 80,
      description: "Department management and approval",
      permissions: [
        "document.upload",
        "document.view",
        "document.edit",
        "document.approve",
        "document.reject",
        "document.share",
        "user.view",
        "workflow.start",
        "workflow.approve",
        "workflow.reject",
        "workflow.view",
      ],
      departmentAccess: ["All"],
      isActive: true,
    },
    {
      name: "SUPERVISOR",
      level: 70,
      description: "Document approval and team supervision",
      permissions: [
        "document.upload",
        "document.view",
        "document.edit",
        "document.approve",
        "document.reject",
        "workflow.approve",
        "workflow.reject",
        "workflow.view",
      ],
      departmentAccess: ["All"],
      isActive: true,
    },
    {
      name: "SENIOR_STAFF",
      level: 60,
      description: "Senior staff with editing capabilities",
      permissions: [
        "document.upload",
        "document.view",
        "document.edit",
        "workflow.view",
      ],
      departmentAccess: ["All"],
      isActive: true,
    },
    {
      name: "STAFF",
      level: 50,
      description: "Regular staff member",
      permissions: ["document.upload", "document.view"],
      departmentAccess: ["All"],
      isActive: true,
    },
    {
      name: "JUNIOR_STAFF",
      level: 40,
      description: "Junior staff member",
      permissions: ["document.view"],
      departmentAccess: ["All"],
      isActive: true,
    },
    {
      name: "EXTERNAL_USER",
      level: 30,
      description: "External user or contractor",
      permissions: ["document.view"],
      departmentAccess: ["All"],
      isActive: true,
    },
    {
      name: "GUEST",
      level: 20,
      description: "Guest user with limited access",
      permissions: ["document.view"],
      departmentAccess: ["All"],
      isActive: true,
    },
    {
      name: "READ_ONLY",
      level: 10,
      description: "Read-only access",
      permissions: ["document.view"],
      departmentAccess: ["All"],
      isActive: true,
    },
  ];

  for (const roleData of roles) {
    const existingRole = await Role.findOne({ name: roleData.name });
    if (!existingRole) {
      const role = new Role(roleData);
      await role.save();
      console.log(`✅ Created role: ${roleData.name}`);
    } else {
      console.log(`⏭️  Role already exists: ${roleData.name}`);
    }
  }
};

const createDefaultDepartments = async (superAdminId) => {
  const departments = [
    {
      name: "Information Technology",
      code: "IT",
      description: "IT department handling technology infrastructure",
      level: 1,
      color: "#3B82F6",
      isActive: true,
      createdBy: superAdminId,
    },
    {
      name: "Human Resources",
      code: "HR",
      description: "HR department managing personnel",
      level: 2,
      color: "#10B981",
      isActive: true,
      createdBy: superAdminId,
    },
    {
      name: "Finance",
      code: "FIN",
      description: "Finance department handling financial operations",
      level: 3,
      color: "#F59E0B",
      isActive: true,
      createdBy: superAdminId,
    },
    {
      name: "Operations",
      code: "OPS",
      description: "Operations department managing day-to-day activities",
      level: 4,
      color: "#8B5CF6",
      isActive: true,
      createdBy: superAdminId,
    },
    {
      name: "External",
      code: "EXT",
      description: "External users and contractors",
      level: 10,
      color: "#6B7280",
      isActive: true,
      createdBy: superAdminId,
    },
  ];

  for (const deptData of departments) {
    const existingDept = await Department.findOne({ name: deptData.name });
    if (!existingDept) {
      const dept = new Department(deptData);
      await dept.save();
      console.log(`✅ Created department: ${deptData.name}`);
    } else {
      console.log(`⏭️  Department already exists: ${deptData.name}`);
    }
  }
};

const createTemporaryDepartment = async () => {
  try {
    // Check if temporary department already exists
    const existingTempDept = await Department.findOne({ code: "TEMP" });
    if (existingTempDept) {
      console.log("⏭️  Temporary department already exists");
      return existingTempDept;
    }

    // Create a temporary department for initial setup
    // We'll bypass the createdBy requirement temporarily
    const tempDeptData = {
      name: "Temporary Setup",
      code: "TEMP",
      description: "Temporary department for initial system setup",
      level: 1,
      color: "#6B7280",
      isActive: true,
    };

    // Use insertOne to bypass mongoose validation temporarily
    const result = await Department.collection.insertOne(tempDeptData);
    const tempDept = await Department.findById(result.insertedId);

    console.log("✅ Created temporary department for setup");
    return tempDept;
  } catch (error) {
    console.error("❌ Error creating temporary department:", error);
    return null;
  }
};

const createSuperAdmin = async () => {
  try {
    // Get SUPER_ADMIN role
    const superAdminRole = await Role.findOne({ name: "SUPER_ADMIN" });
    if (!superAdminRole) {
      console.error(
        "❌ SUPER_ADMIN role not found. Please run role creation first."
      );
      return null;
    }

    // Check if super admin already exists and delete it to recreate with new schema
    const existingSuperAdmin = await User.findOne({ email: "admin@edms.com" });
    if (existingSuperAdmin) {
      console.log(
        "🗑️  Deleting existing super admin to recreate with new schema..."
      );
      await User.deleteOne({ _id: existingSuperAdmin._id });
      console.log("✅ Existing super admin deleted");
    }

    // Create temporary department first
    const tempDept = await createTemporaryDepartment();
    if (!tempDept) {
      console.error("❌ Failed to create temporary department");
      return null;
    }

    // Create super admin with temporary department
    const hashedPassword = await bcrypt.hash("admin123", 12);
    const superAdmin = new User({
      username: "admin",
      firstName: "System",
      lastName: "Administrator",
      email: "admin@edms.com",
      password: hashedPassword,
      phone: "+1234567890",
      position: "System Administrator",
      role: superAdminRole._id,
      department: tempDept._id, // Required field
      employeeId: "SUPER001",
      isActive: true,
      isEmailVerified: true,
    });

    await superAdmin.save();
    console.log("✅ Super Admin created successfully!");
    console.log("📧 Email: admin@edms.com");
    console.log("🔑 Password: admin123");
    console.log(
      "⚠️  IMPORTANT: Change this password immediately after first login!"
    );

    // Update temporary department with super admin as creator
    tempDept.createdBy = superAdmin._id;
    await tempDept.save();

    return superAdmin;
  } catch (error) {
    console.error("❌ Error creating super admin:", error);
    return null;
  }
};

const cleanupExistingData = async () => {
  console.log("\n🧹 Checking for existing data...");

  const rolesCount = await Role.countDocuments();
  const departmentsCount = await Department.countDocuments();
  const usersCount = await User.countDocuments();

  if (rolesCount > 0 || departmentsCount > 0 || usersCount > 0) {
    console.log(
      `⚠️  Found existing data: ${rolesCount} roles, ${departmentsCount} departments, ${usersCount} users`
    );
    console.log(
      "💡 The script will skip existing items and only create missing ones"
    );
  } else {
    console.log("✅ No existing data found - clean setup");
  }
};

const setupSystem = async () => {
  try {
    console.log("🚀 Setting up EDMS system...\n");

    await connectDB();

    await cleanupExistingData();

    console.log("\n📋 Creating default roles...");
    await createDefaultRoles();

    console.log("\n👑 Creating super admin account...");
    const superAdmin = await createSuperAdmin();

    console.log("\n🏢 Creating default departments...");
    await createDefaultDepartments(superAdmin?._id);

    // Update super admin with IT department and clean up temporary department
    if (superAdmin) {
      const itDepartment = await Department.findOne({
        name: "Information Technology",
      });
      if (itDepartment) {
        superAdmin.department = itDepartment._id;
        await superAdmin.save();
        console.log("✅ Updated super admin with IT department");

        // Clean up temporary department
        const tempDept = await Department.findOne({ code: "TEMP" });
        if (tempDept) {
          await Department.deleteOne({ _id: tempDept._id });
          console.log("✅ Cleaned up temporary department");
        }
      }
    }

    // Get summary of what was created
    const rolesCount = await Role.countDocuments();
    const departmentsCount = await Department.countDocuments();
    const usersCount = await User.countDocuments();

    console.log("\n" + "=".repeat(60));
    console.log("🎉 EDMS SYSTEM SETUP COMPLETED SUCCESSFULLY!");
    console.log("=".repeat(60));

    console.log("\n📊 SYSTEM SUMMARY:");
    console.log(
      `   👥 Roles Created: ${rolesCount} (SUPER_ADMIN to READ_ONLY)`
    );
    console.log(
      `   🏢 Departments Created: ${departmentsCount} (IT, HR, Finance, Operations, External)`
    );
    console.log(`   👤 Users Created: ${usersCount} (Super Admin)`);

    console.log("\n🔑 SUPER ADMIN CREDENTIALS:");
    console.log("   📧 Email: admin@edms.com");
    console.log("   🔐 Password: admin123");
    console.log(
      "   ⚠️  IMPORTANT: Change password immediately after first login!"
    );

    console.log("\n🎯 NEXT STEPS:");
    console.log("   1. Start the server: npm run dev (in server directory)");
    console.log("   2. Start the client: npm run dev (in client directory)");
    console.log("   3. Open browser: http://localhost:5173");
    console.log("   4. Login with super admin credentials");
    console.log("   5. Test system settings and department management");
    console.log("   6. Create additional users and configure permissions");

    console.log("\n🔧 AVAILABLE FEATURES:");
    console.log("   ✅ Role-based access control (10 levels)");
    console.log("   ✅ Department management");
    console.log("   ✅ System settings configuration");
    console.log("   ✅ Dynamic registration form (department toggle)");
    console.log("   ✅ Beautiful animated stat cards");
    console.log("   ✅ Dual layout system (User/Admin)");
    console.log("   ✅ Professional brand color system");

    console.log("\n" + "=".repeat(60));
    console.log("🚀 Your EDMS system is ready to use!");
    console.log("=".repeat(60));
  } catch (error) {
    console.error("❌ Setup failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Database disconnected");
  }
};

// Run the setup
setupSystem();
