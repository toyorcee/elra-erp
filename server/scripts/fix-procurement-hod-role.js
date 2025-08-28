import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Import models
import User from "../models/User.js";
import Department from "../models/Department.js";
import Role from "../models/Role.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

const fixProcurementHODRole = async () => {
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

    // Find Peter Johnson in Procurement department
    const procurementUser = await User.findOne({
      department: procurementDept._id,
      email: "hod.proc@elra.com",
    }).populate("role");

    if (!procurementUser) {
      console.log("❌ Procurement HOD user not found");
      return;
    }

    console.log(`\n👤 CURRENT USER STATE:`);
    console.log(
      `   Name: ${procurementUser.firstName} ${procurementUser.lastName}`
    );
    console.log(`   Email: ${procurementUser.email}`);
    console.log(`   Employee ID: ${procurementUser.employeeId}`);
    console.log(`   Current Role Level: ${procurementUser.roleLevel}`);
    console.log(
      `   Role: ${procurementUser.role?.name || "None"} (Level: ${
        procurementUser.role?.level || "None"
      })`
    );
    console.log(`   Department: ${procurementUser.department}`);

    // Update role to HOD (level 700)
    const updatedUser = await User.findByIdAndUpdate(
      procurementUser._id,
      {
        role: "68947420543fa23af10c7c19", // HOD role ID
      },
      { new: true }
    ).populate("role");

    console.log(`\n✅ UPDATED USER STATE:`);
    console.log(`   Name: ${updatedUser.firstName} ${updatedUser.lastName}`);
    console.log(`   Email: ${updatedUser.email}`);
    console.log(`   Employee ID: ${updatedUser.employeeId}`);
    console.log(`   New Role Level: ${updatedUser.roleLevel}`);
    console.log(
      `   Role: ${updatedUser.role?.name} (Level: ${updatedUser.role?.level})`
    );
    console.log(`   Department: ${updatedUser.department}`);

    console.log(`\n🎉 Procurement HOD role fixed successfully!`);
    console.log(`   Login credentials:`);
    console.log(`   Email: ${updatedUser.email}`);
    console.log(`   Password: HODelra@2025`);
  } catch (error) {
    console.error("❌ Error fixing Procurement HOD role:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Disconnected from MongoDB");
  }
};

fixProcurementHODRole();
