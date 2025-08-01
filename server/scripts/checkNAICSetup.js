import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import WorkflowTemplate from "../models/WorkflowTemplate.js";
import ApprovalLevel from "../models/ApprovalLevel.js";
import Department from "../models/Department.js";
import Role from "../models/Role.js";
import User from "../models/User.js";

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

const checkNAICSetup = async () => {
  try {
    await connectDB();

    console.log("🔍 Checking NAIC Setup Status...\n");

    // Check Workflow Templates
    const workflows = await WorkflowTemplate.find().populate(
      "createdBy",
      "firstName lastName"
    );
    console.log(`📋 Workflow Templates: ${workflows.length}`);
    workflows.forEach((w) => {
      console.log(
        `   • ${w.name} - ${w.documentType} - Steps: ${w.steps.length}`
      );
    });

    // Check Approval Levels
    const approvalLevels = await ApprovalLevel.find().populate(
      "createdBy",
      "firstName lastName"
    );
    console.log(`\n🎯 Approval Levels: ${approvalLevels.length}`);
    approvalLevels.forEach((a) => {
      console.log(
        `   • ${a.name} - Level ${a.level} - ${a.documentTypes.join(", ")}`
      );
    });

    // Check Departments
    const departments = await Department.find();
    console.log(`\n🏛️ Departments: ${departments.length}`);
    departments.forEach((d) => {
      console.log(`   • ${d.name} - Level ${d.level} - Code: ${d.code}`);
    });

    // Check Roles
    const roles = await Role.find();
    console.log(`\n👥 Roles: ${roles.length}`);
    roles.forEach((r) => {
      console.log(
        `   • ${r.name} - Level ${r.level} - Permissions: ${r.permissions.length}`
      );
    });

    // Check Users
    const users = await User.find().populate("role", "name level");
    console.log(`\n👤 Users: ${users.length}`);
    users.forEach((u) => {
      console.log(
        `   • ${u.firstName} ${u.lastName} - ${u.email} - Role: ${
          u.role?.name || "None"
        }`
      );
    });

    console.log("\n🎯 NAIC Setup Assessment:");
    if (workflows.length > 0) {
      console.log("✅ Workflow Templates: READY");
    } else {
      console.log("❌ Workflow Templates: NEEDED");
    }

    if (approvalLevels.length > 0) {
      console.log("✅ Approval Levels: READY");
    } else {
      console.log("❌ Approval Levels: NEEDED");
    }

    if (departments.length >= 8) {
      console.log("✅ Departments: READY");
    } else {
      console.log("❌ Departments: NEEDED");
    }

    if (roles.length >= 7) {
      console.log("✅ Roles: READY");
    } else {
      console.log("❌ Roles: NEEDED");
    }

    const usersWithRoles = users.filter((u) => u.role);
    if (usersWithRoles.length > 0) {
      console.log("✅ Users with Roles: READY");
    } else {
      console.log("❌ Users with Roles: NEEDED");
    }

    console.log("\n🚀 Next Steps:");
    if (workflows.length === 0) {
      console.log("1. Create NAIC Workflow Templates");
    }
    if (approvalLevels.length === 0) {
      console.log("2. Create NAIC Approval Levels");
    }
    if (usersWithRoles.length < 3) {
      console.log("3. Invite NAIC Staff Members");
    }
    if (
      workflows.length > 0 &&
      approvalLevels.length > 0 &&
      usersWithRoles.length >= 3
    ) {
      console.log("🎉 NAIC EDMS is READY for production!");
      console.log("   • Start uploading documents");
      console.log("   • Test workflow processes");
      console.log("   • Train staff on system usage");
    }
  } catch (error) {
    console.error("❌ Error checking NAIC setup:", error);
  } finally {
    await mongoose.connection.close();
    console.log("\n🔌 Database connection closed");
  }
};

checkNAICSetup();
