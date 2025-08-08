import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Import models
import Role from "../models/Role.js";

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

async function checkRolePermissions() {
  try {
    await connectDB();

    console.log("🔍 Checking Actual Role Permissions in Database...");
    console.log("=".repeat(70));

    // Get all roles
    const roles = await Role.find().sort({ level: -1 });

    console.log(`📋 Found ${roles.length} roles\n`);

    for (const role of roles) {
      console.log(`\n${"=".repeat(60)}`);
      console.log(`🧪 Role: ${role.name} (Level ${role.level})`);
      console.log(`${"=".repeat(60)}`);

      console.log(`📝 Description: ${role.description}`);
      console.log(`🔑 Total Permissions: ${role.permissions.length}`);

      // Check specific permissions
      const hasUploadPermission = role.permissions.includes("document.upload");
      const hasScanPermission = role.permissions.includes("document.scan");
      const hasViewPermission = role.permissions.includes("document.view");
      const hasEditPermission = role.permissions.includes("document.edit");
      const hasDeletePermission = role.permissions.includes("document.delete");

      console.log(`\n📄 Document Permissions:`);
      console.log(`   📤 Upload: ${hasUploadPermission ? "✅" : "❌"}`);
      console.log(`   📷 Scan: ${hasScanPermission ? "✅" : "❌"}`);
      console.log(`   👁️ View: ${hasViewPermission ? "✅" : "❌"}`);
      console.log(`   ✏️ Edit: ${hasEditPermission ? "✅" : "❌"}`);
      console.log(`   🗑️ Delete: ${hasDeletePermission ? "✅" : "❌"}`);

      // Show all permissions
      console.log(`\n🔑 All Permissions:`);
      role.permissions.forEach((permission, index) => {
        console.log(`   ${index + 1}. ${permission}`);
      });

      // Check what sidebar items this role should see
      console.log(`\n📋 Sidebar Access Analysis:`);

      // Check Upload Documents access
      const canSeeUpload = role.level >= 20 && hasUploadPermission;
      console.log(
        `   📤 Upload Documents: ${canSeeUpload ? "✅" : "❌"} (Level: ${
          role.level >= 20 ? "✅" : "❌"
        }, Permission: ${hasUploadPermission ? "✅" : "❌"})`
      );

      // Check Scan Documents access
      const canSeeScan = role.level >= 20 && hasScanPermission;
      console.log(
        `   📷 Scan Documents: ${canSeeScan ? "✅" : "❌"} (Level: ${
          role.level >= 20 ? "✅" : "❌"
        }, Permission: ${hasScanPermission ? "✅" : "❌"})`
      );

      // Check My Documents access
      const canSeeDocuments = role.level >= 10 && role.level <= 89;
      console.log(
        `   📄 My Documents: ${canSeeDocuments ? "✅" : "❌"} (Level: ${
          role.level >= 10 && role.level <= 89 ? "✅" : "❌"
        })`
      );
    }

    // Summary analysis
    console.log(`\n${"=".repeat(70)}`);
    console.log("📊 SUMMARY ANALYSIS");
    console.log(`${"=".repeat(70)}`);

    console.log("\n📋 Role Permission Matrix:");
    console.log(
      "Role Level | Role Name      | Upload | Scan | View | Edit | Delete | Sidebar Upload | Sidebar Scan"
    );
    console.log(
      "-----------|----------------|--------|------|------|------|--------|----------------|-------------"
    );

    roles.forEach((role) => {
      const hasUpload = role.permissions.includes("document.upload");
      const hasScan = role.permissions.includes("document.scan");
      const hasView = role.permissions.includes("document.view");
      const hasEdit = role.permissions.includes("document.edit");
      const hasDelete = role.permissions.includes("document.delete");

      const sidebarUpload = role.level >= 20 && hasUpload;
      const sidebarScan = role.level >= 20 && hasScan;

      console.log(
        `${role.level.toString().padStart(10)} | ${role.name.padEnd(14)} | ${
          hasUpload ? "✅" : "❌".padEnd(6)
        } | ${hasScan ? "✅" : "❌".padEnd(4)} | ${
          hasView ? "✅" : "❌".padEnd(4)
        } | ${hasEdit ? "✅" : "❌".padEnd(4)} | ${
          hasDelete ? "✅" : "❌".padEnd(6)
        } | ${sidebarUpload ? "✅" : "❌".padEnd(14)} | ${
          sidebarScan ? "✅" : "❌"
        }`
      );
    });

    // Identify problems
    console.log("\n🚨 PROBLEMS IDENTIFIED:");
    console.log("=".repeat(50));

    const problems = [];

    roles.forEach((role) => {
      const hasUpload = role.permissions.includes("document.upload");
      const hasScan = role.permissions.includes("document.scan");

      // Problem 1: JUNIOR_STAFF and EXTERNAL_USER should NOT have upload/scan
      if (
        (role.name === "JUNIOR_STAFF" || role.name === "EXTERNAL_USER") &&
        (hasUpload || hasScan)
      ) {
        problems.push(
          `❌ ${role.name} has upload/scan permissions but shouldn't`
        );
      }

      // Problem 2: STAFF and above should have BOTH upload AND scan
      if (
        ["STAFF", "SENIOR_STAFF", "SUPERVISOR", "MANAGER"].includes(role.name)
      ) {
        if (!hasUpload || !hasScan) {
          problems.push(`❌ ${role.name} missing upload or scan permissions`);
        }
      }
    });

    if (problems.length === 0) {
      console.log(
        "✅ No problems found - permissions are correctly configured!"
      );
    } else {
      problems.forEach((problem) => console.log(problem));
    }

    console.log(`\n${"=".repeat(70)}`);
  } catch (error) {
    console.error("❌ Error checking role permissions:", error);
  } finally {
    await mongoose.connection.close();
    console.log("\n🔌 Database connection closed");
  }
}

checkRolePermissions();
