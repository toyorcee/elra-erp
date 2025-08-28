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

const checkProcurementUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Find Procurement department
    const procurementDept = await Department.findOne({
      name: { $regex: /procurement/i },
    });

    if (!procurementDept) {
      console.log("❌ Procurement department not found");
      return;
    }

    console.log(
      `\n📋 PROCUREMENT DEPARTMENT: ${procurementDept.name} (${procurementDept.code})`
    );
    console.log(`   ID: ${procurementDept._id}`);

    // Find all users in Procurement department
    const procurementUsers = await User.find({
      department: procurementDept._id,
    }).populate("department");

    console.log(
      `\n👥 ALL USERS IN PROCUREMENT DEPARTMENT (${procurementUsers.length} users):`
    );
    console.log("=".repeat(60));

    if (procurementUsers.length === 0) {
      console.log("❌ No users found in Procurement department");
    } else {
      procurementUsers.forEach((user, index) => {
        console.log(`\n${index + 1}. ${user.firstName} ${user.lastName}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Employee ID: ${user.employeeId}`);
        console.log(`   Role Level: ${user.roleLevel}`);
        console.log(
          `   Department: ${user.department?.name || "Not assigned"}`
        );
        console.log(`   Active: ${user.isActive}`);
        console.log(`   ID: ${user._id}`);
      });
    }

    // Check all users with roleLevel 700 (HOD level)
    const allHODs = await User.find({ roleLevel: 700 }).populate("department");
    console.log(
      `\n🔍 ALL HOD LEVEL USERS (roleLevel: 700) - ${allHODs.length} users:`
    );
    console.log("=".repeat(60));

    allHODs.forEach((user, index) => {
      console.log(
        `${index + 1}. ${user.firstName} ${user.lastName} (${user.email})`
      );
      console.log(`   Department: ${user.department?.name || "Not assigned"}`);
      console.log(`   Employee ID: ${user.employeeId}`);
    });
  } catch (error) {
    console.error("❌ Error checking Procurement users:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Disconnected from MongoDB");
  }
};

checkProcurementUsers();
