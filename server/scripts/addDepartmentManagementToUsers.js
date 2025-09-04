import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import Module from "../models/Module.js";
import Role from "../models/Role.js";
import Department from "../models/Department.js";

dotenv.config();

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined");
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
    });

    console.log(`🟢 MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    process.exit(1);
  }
};

const addDepartmentManagementToUsers = async () => {
  try {
    console.log(
      "🚀 [SCRIPT] Adding Department Management module to existing users..."
    );

    // Connect to MongoDB
    await connectDB();

    // Get the Department Management module
    const deptManagementModule = await Module.findOne({
      code: "DEPARTMENT_MANAGEMENT",
    });
    if (!deptManagementModule) {
      console.log(
        "❌ [SCRIPT] Department Management module not found. Run createDepartmentManagementModule.js first!"
      );
      return;
    }

    console.log(
      "✅ [SCRIPT] Found Department Management module:",
      deptManagementModule.name
    );

    // Get all HOD users (role level 700+)
    // First get the HOD role ID
    const hodRole = await Role.findOne({ name: "HOD" });
    const superAdminRole = await Role.findOne({ name: "SUPER_ADMIN" });

    if (!hodRole) {
      console.log("❌ [SCRIPT] HOD role not found in database");
      return;
    }

    const hodUsers = await User.find({
      role: { $in: [hodRole._id, superAdminRole?._id].filter(Boolean) },
    }).populate("role department");

    console.log(`\n👥 Found ${hodUsers.length} HOD+ users to update`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const user of hodUsers) {
      console.log(
        `\n🔍 Processing user: ${user.username} (${
          user.department?.name || "No Department"
        })`
      );

      // Check if user already has Department Management access
      const hasDeptManagement = user.moduleAccess?.some(
        (access) =>
          access.module === "DEPARTMENT_MANAGEMENT" ||
          access.code === "DEPARTMENT_MANAGEMENT"
      );

      if (hasDeptManagement) {
        console.log(
          `   ⏭️  Already has Department Management access - skipping`
        );
        skippedCount++;
        continue;
      }

      // Check if user meets the role level requirement
      const userRoleLevel = user.role?.level || 300;
      if (userRoleLevel < 700) {
        console.log(`   ❌ Role level ${userRoleLevel} < 700 - skipping`);
        skippedCount++;
        continue;
      }

      // Add Department Management module access
      const newModuleAccess = {
        module: "DEPARTMENT_MANAGEMENT",
        code: "DEPARTMENT_MANAGEMENT",
        permissions: ["view", "create", "edit", "delete", "approve", "admin"],
        _id: new mongoose.Types.ObjectId(),
      };

      if (!user.moduleAccess) {
        user.moduleAccess = [];
      }

      user.moduleAccess.push(newModuleAccess);
      await user.save();

      console.log(`   ✅ Added Department Management access`);
      updatedCount++;
    }

    console.log("\n🎯 [SCRIPT] Summary:");
    console.log(`   ✅ Users updated: ${updatedCount}`);
    console.log(`   ⏭️  Users skipped: ${skippedCount}`);
    console.log(`   📊 Total processed: ${hodUsers.length}`);

    if (updatedCount > 0) {
      console.log(
        "\n💡 [SCRIPT] Department Management module access has been added to HOD+ users!"
      );
      console.log(
        "   Users can now access the Department Management module in the sidebar."
      );
    } else {
      console.log(
        "\nℹ️  [SCRIPT] No users needed updating - all HOD+ users already have access."
      );
    }
  } catch (error) {
    console.error(
      "❌ [SCRIPT] Error adding Department Management to users:",
      error
    );
  } finally {
    // Close connection
    await mongoose.disconnect();
    console.log("🔌 [SCRIPT] MongoDB connection closed");
  }
};

// Run the script
addDepartmentManagementToUsers();
