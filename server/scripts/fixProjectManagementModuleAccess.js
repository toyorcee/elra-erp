import mongoose from "mongoose";
import dotenv from "dotenv";
import Module from "../models/Module.js";
import Department from "../models/Department.js";
import User from "../models/User.js";
import Role from "../models/Role.js";

// Load environment variables
dotenv.config();

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

// Main function to fix module access
const fixProjectManagementModuleAccess = async () => {
  try {
    console.log("🚀 Starting Project Management module access fix...");

    // Get the Project Management module
    const ProjectManagementModule = await Module.findOne({
      code: "PROJECTS",
    });

    if (!ProjectManagementModule) {
      console.error("❌ Project Management module not found!");
      return;
    }

    console.log(
      "✅ Found Project Management module:",
      ProjectManagementModule.name
    );

    // Find all departments that need access to Project Management module
    const departmentsNeedingAccess = await Department.find({
      name: {
        $in: [
          "Project Management",
          "Legal & Compliance",
          "Finance & Accounting",
          "Executive Office",
          "System Administration",
        ],
      },
    });

    console.log(
      "📋 Departments needing access:",
      departmentsNeedingAccess.map((d) => d.name)
    );

    // Find all HODs in these departments
    const hodUsers = await User.find({
      department: { $in: departmentsNeedingAccess.map((d) => d._id) },
      isActive: true,
    }).populate("department role");

    // Filter for HODs only
    const hodUsersFiltered = hodUsers.filter(
      (user) => user.role?.name === "HOD"
    );

    console.log("👥 Found HODs needing access:");
    hodUsersFiltered.forEach((user) => {
      console.log(
        `  - ${user.firstName} ${user.lastName} (${user.department?.name}) - ${user.email}`
      );
    });

    // Find Super Admin users
    const superAdmins = await User.find({
      isActive: true,
    }).populate("role");

    // Filter for Super Admins only
    const superAdminsFiltered = superAdmins.filter(
      (user) => user.role?.name === "SUPER_ADMIN"
    );

    console.log("👑 Found Super Admins:");
    superAdminsFiltered.forEach((user) => {
      console.log(`  - ${user.firstName} ${user.lastName} - ${user.email}`);
    });

    // Combine all users who need access
    const allUsersNeedingAccess = [...hodUsersFiltered, ...superAdminsFiltered];

    // Update module access for each user
    let updatedCount = 0;
    for (const user of allUsersNeedingAccess) {
      try {
        // Check if user already has access to PROJECTS module
        const hasProjectManagementAccess = user.moduleAccess?.some(
          (access) => access.module === "PROJECTS"
        );

        if (hasProjectManagementAccess) {
          console.log(
            `⏭️  User ${user.firstName} ${user.lastName} already has PROJECTS access`
          );
          continue;
        }

        // Add PROJECTS module access to user's moduleAccess array
        const newModuleAccess = {
          module: "PROJECTS",
          permissions: ["view", "create", "edit", "delete", "approve"], // Full access for HODs and Super Admins
          _id: new mongoose.Types.ObjectId(),
        };

        // Initialize moduleAccess array if it doesn't exist
        if (!user.moduleAccess) {
          user.moduleAccess = [];
        }

        // Add the new module access
        user.moduleAccess.push(newModuleAccess);
        await user.save();

        console.log(
          `✅ Granted Project Management access to ${user.firstName} ${
            user.lastName
          } (${user.department?.name || "Super Admin"})`
        );
        updatedCount++;
      } catch (error) {
        console.error(
          `❌ Error updating access for ${user.firstName} ${user.lastName}:`,
          error.message
        );
      }
    }

    console.log(`\n🎉 Module access fix completed!`);
    console.log(`📊 Summary:`);
    console.log(`  - Total users processed: ${allUsersNeedingAccess.length}`);
    console.log(`  - New access granted: ${updatedCount}`);
    console.log(
      `  - Already had access: ${allUsersNeedingAccess.length - updatedCount}`
    );

    // Also update the module's department access
    const allDepartmentIds = departmentsNeedingAccess.map((d) => d._id);

    // Update module department access
    await Module.findByIdAndUpdate(ProjectManagementModule._id, {
      departmentAccess: allDepartmentIds,
      updatedAt: new Date(),
    });

    console.log(
      `✅ Updated module department access for ${allDepartmentIds.length} departments`
    );
  } catch (error) {
    console.error("❌ Error in fixProjectManagementModuleAccess:", error);
  }
};

// Run the script
const runScript = async () => {
  try {
    await connectDB();
    await fixProjectManagementModuleAccess();
    console.log("\n✅ Script completed successfully!");
  } catch (error) {
    console.error("❌ Script failed:", error);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
    process.exit(0);
  }
};

runScript();
