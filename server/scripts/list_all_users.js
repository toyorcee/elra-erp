import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Import models
import User from "../models/User.js";
import Role from "../models/Role.js";
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

const listAllUsers = async () => {
  try {
    console.log("\n🔍 Fetching all users from the system...\n");

    // Find all users with populated role and department
    const users = await User.find({})
      .select("+password") // Include password field
      .populate("role", "name level")
      .populate("department", "name")
      .lean();

    if (users.length === 0) {
      console.log("❌ No users found in the system");
      return;
    }

    console.log(`📊 Found ${users.length} user(s) in the system:\n`);
    console.log("=".repeat(120));
    console.log("USER LISTING");
    console.log("=".repeat(120));

    users.forEach((user, index) => {
      console.log(`\n👤 User #${index + 1}:`);
      console.log(`   ID: ${user._id}`);
      console.log(`   Name: ${user.name || "N/A"}`);
      console.log(`   Email: ${user.email || "N/A"}`);
      console.log(`   Password: ${user.password ? "***HIDDEN***" : "N/A"}`);
      console.log(
        `   Role: ${user.role ? user.role.name : "N/A"} (Level: ${
          user.role ? user.role.level : "N/A"
        })`
      );
      console.log(
        `   Department: ${user.department ? user.department.name : "N/A"}`
      );
      console.log(`   Status: ${user.isActive ? "✅ Active" : "❌ Inactive"}`);
      console.log(
        `   Email Verified: ${user.isEmailVerified ? "✅ Yes" : "❌ No"}`
      );
      console.log(
        `   Created: ${
          user.createdAt ? new Date(user.createdAt).toLocaleString() : "N/A"
        }`
      );
      console.log(
        `   Last Updated: ${
          user.updatedAt ? new Date(user.updatedAt).toLocaleString() : "N/A"
        }`
      );
      console.log("-".repeat(80));
    });

    // Summary statistics
    console.log("\n📈 SUMMARY STATISTICS:");
    console.log("=".repeat(50));

    const activeUsers = users.filter((u) => u.isActive);
    const inactiveUsers = users.filter((u) => !u.isActive);
    const verifiedUsers = users.filter((u) => u.isEmailVerified);
    const unverifiedUsers = users.filter((u) => !u.isEmailVerified);

    console.log(`Total Users: ${users.length}`);
    console.log(`Active Users: ${activeUsers.length}`);
    console.log(`Inactive Users: ${inactiveUsers.length}`);
    console.log(`Email Verified: ${verifiedUsers.length}`);
    console.log(`Email Unverified: ${unverifiedUsers.length}`);

    // Role distribution
    const roleDistribution = {};
    users.forEach((user) => {
      const roleName = user.role ? user.role.name : "No Role";
      roleDistribution[roleName] = (roleDistribution[roleName] || 0) + 1;
    });

    console.log("\n👥 ROLE DISTRIBUTION:");
    console.log("-".repeat(30));
    Object.entries(roleDistribution).forEach(([role, count]) => {
      console.log(`${role}: ${count} user(s)`);
    });

    // Department distribution
    const deptDistribution = {};
    users.forEach((user) => {
      const deptName = user.department ? user.department.name : "No Department";
      deptDistribution[deptName] = (deptDistribution[deptName] || 0) + 1;
    });

    console.log("\n🏢 DEPARTMENT DISTRIBUTION:");
    console.log("-".repeat(30));
    Object.entries(deptDistribution).forEach(([dept, count]) => {
      console.log(`${dept}: ${count} user(s)`);
    });

    // Users without passwords
    const usersWithoutPassword = users.filter((u) => !u.password);
    if (usersWithoutPassword.length > 0) {
      console.log("\n⚠️  USERS WITHOUT PASSWORDS:");
      console.log("-".repeat(30));
      usersWithoutPassword.forEach((user) => {
        console.log(`- ${user.name || "N/A"} (${user.email || "N/A"})`);
      });
    }

    // Users without roles
    const usersWithoutRole = users.filter((u) => !u.role);
    if (usersWithoutRole.length > 0) {
      console.log("\n⚠️  USERS WITHOUT ROLES:");
      console.log("-".repeat(30));
      usersWithoutRole.forEach((user) => {
        console.log(`- ${user.name || "N/A"} (${user.email || "N/A"})`);
      });
    }

    // Users without departments
    const usersWithoutDept = users.filter((u) => !u.department);
    if (usersWithoutDept.length > 0) {
      console.log("\n⚠️  USERS WITHOUT DEPARTMENTS:");
      console.log("-".repeat(30));
      usersWithoutDept.forEach((user) => {
        console.log(`- ${user.name || "N/A"} (${user.email || "N/A"})`);
      });
    }

    console.log("\n✅ User listing completed successfully!\n");
  } catch (error) {
    console.error("❌ Error listing users:", error);
  }
};

const main = async () => {
  try {
    await connectDB();
    await listAllUsers();
  } catch (error) {
    console.error("❌ Script execution failed:", error);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Disconnected from MongoDB");
    process.exit(0);
  }
};

// Run the script
main();
