import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import User from "../models/User.js";
import Department from "../models/Department.js";
import Role from "../models/Role.js";
import EmployeeLifecycle from "../models/EmployeeLifecycle.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, "../.env") });

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

const checkUsers = async () => {
  try {
    await connectDB();

    console.log("🔍 Checking Users in Database...");
    console.log("=".repeat(70));

    // Get all users with populated department and role
    const users = await User.find()
      .populate("department", "name code")
      .populate("role", "name level")
      .sort({ createdAt: 1 });

    console.log(`👥 Found ${users.length} users\n`);

    console.log("👤 DETAILED USER OBJECTS:");
    console.log("=".repeat(50));

    users.forEach((user, index) => {
      console.log(`\n${index + 1}. USER OBJECT:`);
      console.log(JSON.stringify(user.toObject(), null, 2));
      console.log("");
    });

    // Check existing lifecycles with full details
    console.log("🔄 DETAILED LIFECYCLE OBJECTS:");
    console.log("=".repeat(50));

    const lifecycles = await EmployeeLifecycle.find()
      .populate("employee", "firstName lastName email employeeId")
      .populate("department", "name")
      .sort({ createdAt: 1 });

    console.log(`📋 Found ${lifecycles.length} existing lifecycles\n`);

    lifecycles.forEach((lifecycle, index) => {
      console.log(`\n${index + 1}. LIFECYCLE OBJECT:`);
      console.log(JSON.stringify(lifecycle.toObject(), null, 2));
      console.log("");
    });

    // Check departments
    console.log("🏢 AVAILABLE DEPARTMENTS:");
    console.log("=".repeat(50));

    const departments = await Department.find().sort({ name: 1 });
    departments.forEach((dept, index) => {
      console.log(`${index + 1}. ${dept.name} (${dept.code})`);
    });

    console.log("");

    // Check roles
    console.log("👔 AVAILABLE ROLES:");
    console.log("=".repeat(50));

    const roles = await Role.find().sort({ level: -1 });
    roles.forEach((role, index) => {
      console.log(`${index + 1}. ${role.name} (Level: ${role.level})`);
    });

    console.log(`\n${"=".repeat(70)}`);
  } catch (error) {
    console.error("❌ Error checking users:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Database connection closed");
  }
};

checkUsers();
