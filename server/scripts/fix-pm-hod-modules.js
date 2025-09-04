import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import Role from "../models/Role.js";
import Department from "../models/Department.js";

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

async function fixPMHODModules() {
  try {
    await connectDB();

    console.log("🔍 Finding Project Management HOD...");
    
    // Find the Project Management HOD
    const pmHOD = await User.findOne({
      email: "pm.hod@elra.com",
      username: "pm.hod"
    }).populate("role").populate("department");

    if (!pmHOD) {
      console.log("❌ Project Management HOD not found!");
      return;
    }

    console.log("✅ Found PM HOD:", pmHOD.firstName, pmHOD.lastName);
    console.log("📧 Email:", pmHOD.email);
    console.log("🏢 Department:", pmHOD.department?.name);
    console.log("👑 Role:", pmHOD.role?.name, "(level", pmHOD.role?.level + ")");
    console.log("🔍 Current moduleAccess:", pmHOD.moduleAccess?.length || 0, "modules");

    // Check current moduleAccess structure
    if (pmHOD.moduleAccess && pmHOD.moduleAccess.length > 0) {
      console.log("\n📋 Current moduleAccess structure:");
      pmHOD.moduleAccess.forEach((mod, index) => {
        console.log(`   ${index + 1}. Module: ${mod.module}, Permissions: ${mod.permissions?.join(", ")}`);
      });
    }

    // Fix the moduleAccess structure - change "module" to "code"
    if (pmHOD.moduleAccess && pmHOD.moduleAccess.length > 0) {
      console.log("\n🔧 Fixing moduleAccess structure...");
      
      // Add code field to each moduleAccess item
      pmHOD.moduleAccess.forEach(mod => {
        mod.code = mod.module; // Add code field (required by API)
      });

      await pmHOD.save();
      console.log("✅ ModuleAccess structure fixed!");
      
      console.log("\n📋 New moduleAccess structure:");
      pmHOD.moduleAccess.forEach((mod, index) => {
        console.log(`   ${index + 1}. Code: ${mod.code}, Permissions: ${mod.permissions?.join(", ")}`);
      });
    } else {
      console.log("⚠️ No moduleAccess found, creating new one...");
      
      // Create new moduleAccess based on department and role
      const departmentModuleConfig = {
        "Project Management": {
          modules: [
            "SELF_SERVICE",
            "CUSTOMER_CARE", 
            "PROJECTS",
            "COMMUNICATION",
          ],
          permissions: {
            HOD: ["view", "create", "edit", "delete", "approve"],
          },
        },
      };

      const config = departmentModuleConfig[pmHOD.department.name];
      if (config) {
        const permissions = config.permissions[pmHOD.role.name];
        if (permissions) {
          pmHOD.moduleAccess = config.modules.map((module) => ({
            module: module,    // Required by User model
            code: module,      // Required by API
            permissions: permissions,
            _id: new mongoose.Types.ObjectId(),
          }));

          await pmHOD.save();
          console.log("✅ New moduleAccess created!");
          
          console.log("\n📋 New moduleAccess structure:");
          pmHOD.moduleAccess.forEach((mod, index) => {
            console.log(`   ${index + 1}. Code: ${mod.code}, Permissions: ${mod.permissions?.join(", ")}`);
          });
        }
      }
    }

    console.log("\n✅ Project Management HOD modules fixed successfully!");

  } catch (error) {
    console.error("❌ Error fixing PM HOD modules:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

// Run the script
fixPMHODModules();
