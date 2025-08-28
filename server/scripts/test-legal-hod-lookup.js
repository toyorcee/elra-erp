import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, "../.env") });

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Import models
import Department from "../models/Department.js";
import Role from "../models/Role.js";
import User from "../models/User.js";

const testLegalHODLookup = async () => {
  try {
    console.log("🔍 Testing Legal HOD lookup logic from controller...\n");

    // Test 1: Find Legal & Compliance department
    console.log("1️⃣ Looking for Legal & Compliance department...");
    const legalDept = await Department.findOne({ name: "Legal & Compliance" });
    
    if (legalDept) {
      console.log(`✅ Found department: ${legalDept.name} (${legalDept.code}) - ID: ${legalDept._id}`);
    } else {
      console.log("❌ Legal & Compliance department not found!");
      
      // Let's see what departments exist
      const allDepts = await Department.find({ isActive: true });
      console.log("📋 Available departments:");
      allDepts.forEach(dept => {
        console.log(`   - ${dept.name} (${dept.code})`);
      });
      return;
    }

    // Test 2: Find HOD role
    console.log("\n2️⃣ Looking for HOD role...");
    const hodRole = await Role.findOne({ name: "HOD" });
    
    if (hodRole) {
      console.log(`✅ Found HOD role: ${hodRole.name} (Level: ${hodRole.level}) - ID: ${hodRole._id}`);
    } else {
      console.log("❌ HOD role not found!");
      return;
    }

    // Test 3: Build the exact query from controller
    console.log("\n3️⃣ Building approver query...");
    const approverQuery = {
      role: hodRole._id,
      department: legalDept._id,
    };

    console.log(`🔍 Query: ${JSON.stringify(approverQuery)}`);

    // Test 4: Find Legal HOD user
    console.log("\n4️⃣ Finding Legal HOD user...");
    const approver = await User.findOne(approverQuery).populate("department role");

    if (approver) {
      console.log(`✅ Found Legal HOD: ${approver.firstName} ${approver.lastName} (${approver.username})`);
      console.log(`   Department: ${approver.department?.name} (${approver.department?.code})`);
      console.log(`   Role: ${approver.role?.name} (Level: ${approver.role?.level})`);
    } else {
      console.log("❌ No Legal HOD found with that query!");
      
      // Let's see what users exist in Legal department
      const legalUsers = await User.find({ 
        department: legalDept._id,
        isActive: true 
      }).populate("role");
      
      console.log("📋 Users in Legal & Compliance department:");
      legalUsers.forEach(user => {
        console.log(`   - ${user.firstName} ${user.lastName} (${user.username}) - Role: ${user.role?.name}`);
      });
    }

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
};

// Run the script
testLegalHODLookup();
