import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Import models
import Department from "../models/Department.js";
import Role from "../models/Role.js";
import Company from "../models/Company.js";

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

async function naicSummary() {
  try {
    await connectDB();

    // Find your company
    const companies = await Company.find({});
    if (companies.length === 0) {
      console.log("❌ No companies found.");
      return;
    }

    const company = companies[0];
    console.log(`🏢 Company: ${company.name}`);
    console.log("=".repeat(80));

    // Get departments
    const departments = await Department.find({ company: company._id }).sort({
      level: 1,
    });
    console.log("\n📋 NAIC Department Structure:");
    console.log("-".repeat(60));

    departments.forEach((dept) => {
      console.log(
        `🏛️ ${dept.name.padEnd(25)} | Level: ${dept.level
          .toString()
          .padStart(2)} | Code: ${dept.code}`
      );
    });

    // Get roles (roles are global, not company-specific)
    const roles = await Role.find({}).sort({ level: 1 });
    console.log("\n👥 NAIC Role Structure (Global):");
    console.log("-".repeat(60));

    roles.forEach((role) => {
      console.log(
        `👤 ${role.name.padEnd(15)} | Level: ${role.level
          .toString()
          .padStart(3)} | Permissions: ${role.permissions.length}`
      );
    });

    console.log("\n🎯 NAIC System Status:");
    console.log("=".repeat(80));
    console.log(`✅ Departments: ${departments.length}/8 tied to NAIC`);
    console.log(`✅ Roles: ${roles.length}/7 (Global roles for NAIC)`);
    console.log(`✅ Company: ${company.name}`);

    console.log("\n🚀 Ready for NAIC Operations!");
    console.log("📋 Document Types to Configure:");
    console.log("   • Insurance Policies");
    console.log("   • Claims Documents");
    console.log("   • Financial Reports");
    console.log("   • Client Correspondence");
    console.log("   • Regulatory Compliance");

    console.log("\n🔄 Workflow Types to Set Up:");
    console.log("   • Claims Processing Workflow");
    console.log("   • Policy Approval Workflow");
    console.log("   • Financial Report Review");
    console.log("   • Compliance Audit Workflow");
  } catch (error) {
    console.error("❌ Error during summary:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Database connection closed");
  }
}

naicSummary();
