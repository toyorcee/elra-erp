import mongoose from "mongoose";
import dotenv from "dotenv";
import "../models/User.js";
import "../models/Department.js";
import "../models/Role.js";

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("🔌 Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

const checkUsersState = async () => {
  try {
    console.log("🔍 COMPREHENSIVE USER STATE ANALYSIS");
    console.log("=".repeat(80));

    // Get all users with their departments and roles
    const User = mongoose.model("User");
    const Department = mongoose.model("Department");
    const Role = mongoose.model("Role");

    const users = await User.find({ isActive: true })
      .populate("department")
      .populate("role")
      .lean();

    console.log(`📊 TOTAL USERS IN DATABASE: ${users.length}`);

    if (users.length === 0) {
      console.log("❌ No users found in database");
      return;
    }

    // Group users by department
    const usersByDepartment = {};
    const hodUsers = [];
    const roleCounts = {};

    users.forEach(user => {
      const deptName = user.department?.name || "Unknown";
      const roleName = user.role?.name || "Unknown";
      
      if (!usersByDepartment[deptName]) {
        usersByDepartment[deptName] = [];
      }
      usersByDepartment[deptName].push(user);

      if (roleName === "HOD") {
        hodUsers.push(user);
      }

      roleCounts[roleName] = (roleCounts[roleName] || 0) + 1;
    });

    console.log("\n👥 USERS BY ROLE:");
    console.log("-".repeat(50));
    Object.entries(roleCounts).forEach(([role, count]) => {
      console.log(`${role}: ${count} users`);
    });

    console.log("\n🏢 USERS BY DEPARTMENT:");
    console.log("-".repeat(50));
    Object.entries(usersByDepartment).forEach(([dept, deptUsers]) => {
      console.log(`${dept}: ${deptUsers.length} users`);
      deptUsers.forEach(user => {
        console.log(`  - ${user.firstName} ${user.lastName} (${user.role?.name}) - ${user.email}`);
      });
    });

    console.log("\n👔 HOD USERS:");
    console.log("-".repeat(50));
    if (hodUsers.length === 0) {
      console.log("❌ No HOD users found");
    } else {
      hodUsers.forEach(user => {
        console.log(`✅ ${user.firstName} ${user.lastName} - ${user.department?.name} - ${user.email}`);
      });
    }

    // Check for Finance HOD specifically
    const financeHOD = hodUsers.find(user => user.department?.name === "Finance & Accounting");
    if (financeHOD) {
      console.log("\n💰 FINANCE HOD FOUND:");
      console.log("-".repeat(50));
      console.log(`✅ ${financeHOD.firstName} ${financeHOD.lastName} - ${financeHOD.email}`);
      console.log(`   Role Level: ${financeHOD.role?.level}`);
      console.log(`   Department: ${financeHOD.department?.name}`);
    } else {
      console.log("\n❌ NO FINANCE HOD FOUND");
    }

    // Check for Executive HOD
    const executiveHOD = hodUsers.find(user => user.department?.name === "Executive Office");
    if (executiveHOD) {
      console.log("\n👔 EXECUTIVE HOD FOUND:");
      console.log("-".repeat(50));
      console.log(`✅ ${executiveHOD.firstName} ${executiveHOD.lastName} - ${executiveHOD.email}`);
    } else {
      console.log("\n❌ NO EXECUTIVE HOD FOUND");
    }

    console.log("\n" + "=".repeat(80));
    console.log("✅ USER ANALYSIS COMPLETE");
    console.log("=".repeat(80));

  } catch (error) {
    console.error("❌ Error checking user state:", error);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
  }
};

// Run the analysis
connectDB().then(() => {
  checkUsersState();
});
