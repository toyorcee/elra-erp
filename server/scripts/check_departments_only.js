import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Import models
import Department from "../models/Department.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

const checkDepartments = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB connected successfully");

    console.log("🏢 CURRENT DEPARTMENTS IN SYSTEM:");
    console.log("==================================");

    const departments = await Department.find({}).sort({ name: 1 });

    console.log(`\n📋 Total Departments: ${departments.length}`);
    console.log("");

    departments.forEach((dept, index) => {
      console.log(`${index + 1}. ${dept.name}`);
      console.log(`   Code: ${dept.code || "N/A"}`);
      console.log(`   Status: ${dept.isActive ? "✅ Active" : "❌ Inactive"}`);
      console.log(`   ID: ${dept._id}`);
      console.log("");
    });

    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
  } catch (error) {
    console.error("❌ Error:", error);
  }
};

checkDepartments();
