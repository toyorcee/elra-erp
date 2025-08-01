import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Import models
import User from "../models/User.js";
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

async function analyzeUsers() {
  try {
    await connectDB();

    console.log("🔍 Analyzing user-department assignments...\n");

    // Get all users with their department info
    const users = await User.find({}).populate("department", "name level");

    // Get all departments
    const departments = await Department.find({});

    console.log(`📊 Total Users: ${users.length}`);
    console.log(`🏢 Total Departments: ${departments.length}\n`);

    // Analyze user assignments
    const userAssignments = {
      assigned: [],
      unassigned: [],
      superadmins: [],
    };

    users.forEach((user) => {
      if (user.isSuperadmin) {
        userAssignments.superadmins.push({
          id: user._id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          department: user.department,
          status: user.status,
          isActive: user.isActive,
          isEmailVerified: user.isEmailVerified,
        });
      } else if (user.department) {
        userAssignments.assigned.push({
          id: user._id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          role: user.role,
          department: user.department,
          status: user.status,
          isActive: user.isActive,
          isEmailVerified: user.isEmailVerified,
        });
      } else {
        userAssignments.unassigned.push({
          id: user._id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          role: user.role,
          status: user.status,
          isActive: user.isActive,
          isEmailVerified: user.isEmailVerified,
        });
      }
    });

    // Display results
    console.log("👑 Superadmins:");
    if (userAssignments.superadmins.length === 0) {
      console.log("   No superadmins found");
    } else {
      userAssignments.superadmins.forEach((user) => {
        console.log(`   - ${user.name} (${user.email})`);
        console.log(
          `     Status: ${user.status} | Active: ${user.isActive} | Email Verified: ${user.isEmailVerified}`
        );
        console.log(
          `     Department: ${
            user.department ? user.department.name : "None (Global Access)"
          }`
        );
      });
    }

    console.log("\n✅ Assigned Users:");
    if (userAssignments.assigned.length === 0) {
      console.log("   No assigned users found");
    } else {
      userAssignments.assigned.forEach((user) => {
        console.log(`   - ${user.name} (${user.email})`);
        console.log(
          `     Status: ${user.status} | Active: ${user.isActive} | Email Verified: ${user.isEmailVerified}`
        );
        console.log(
          `     Department: ${user.department.name} (Level ${user.department.level})`
        );
      });
    }

    console.log("\n❌ Unassigned Users:");
    if (userAssignments.unassigned.length === 0) {
      console.log("   No unassigned users found");
    } else {
      userAssignments.unassigned.forEach((user) => {
        console.log(`   - ${user.name} (${user.email})`);
        console.log(
          `     Status: ${user.status} | Active: ${user.isActive} | Email Verified: ${user.isEmailVerified}`
        );
      });
    }

    // Department summary
    console.log("\n🏢 Department Summary:");
    departments.forEach((dept) => {
      const deptUsers = userAssignments.assigned.filter(
        (user) =>
          user.department &&
          user.department._id.toString() === dept._id.toString()
      );
      console.log(
        `   ${dept.name} (Level ${dept.level}): ${deptUsers.length} users`
      );
    });

    // User status summary
    console.log("\n📈 User Status Summary:");
    const activeUsers = users.filter((u) => u.isActive).length;
    const verifiedUsers = users.filter((u) => u.isEmailVerified).length;
    const pendingUsers = users.filter(
      (u) => u.status === "PENDING_REGISTRATION"
    ).length;

    console.log(`   Active Users: ${activeUsers}/${users.length}`);
    console.log(`   Email Verified: ${verifiedUsers}/${users.length}`);
    console.log(`   Pending Registration: ${pendingUsers}/${users.length}`);

    // Recommendations
    console.log("\n💡 Recommendations:");
    if (userAssignments.unassigned.length > 0) {
      console.log("   - Assign unassigned users to departments");
    }
    if (userAssignments.superadmins.some((user) => user.department)) {
      console.log(
        "   - Consider removing superadmins from departments (they have global access)"
      );
    }
    if (userAssignments.superadmins.length === 0) {
      console.log("   - No superadmin found - consider creating one");
    }
    if (pendingUsers > 0) {
      console.log("   - Users pending registration need to verify their email");
    }

    console.log("\n✅ Analysis complete!");
  } catch (error) {
    console.error("❌ Error analyzing users:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Database connection closed");
  }
}

analyzeUsers();
