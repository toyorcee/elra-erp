import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Import models
import Department from "../models/Department.js";
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

const checkSystem = async () => {
  try {
    await connectDB();

    // Check departments
    console.log("\n=== CURRENT DEPARTMENTS ===");
    const departments = await Department.find({}).sort({ level: -1 });
    departments.forEach((dept) => {
      console.log(`Level ${dept.level}: ${dept.name} (${dept.code})`);
    });

    // Check roles
    console.log("\n=== CURRENT ROLES ===");
    const roles = await Role.find({}).sort({ level: -1 });
    roles.forEach((role) => {
      console.log(`Level ${role.level}: ${role.name}`);
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error("Error:", error);
  }
};

checkSystem();
