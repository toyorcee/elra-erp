import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import Department from "../models/Department.js";

dotenv.config();

/**
 * Script to remove PROJECTS module access from all users
 * who are NOT in the Project Management department
 */
async function removeProjectsModuleAccess() {
  try {
    console.log("🚀 Starting PROJECTS module access cleanup...");

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Find the Project Management department
    const projectManagementDept = await Department.findOne({
      name: { $regex: /project management/i },
    });

    if (!projectManagementDept) {
      console.log(
        "⚠️  Project Management department not found. Creating it..."
      );

      // Create Project Management department if it doesn't exist
      const newDept = new Department({
        name: "Project Management",
        code: "PM",
        description: "Project management and coordination",
        level: 100,
        isActive: true,
      });

      await newDept.save();
      console.log("✅ Created Project Management department");
    } else {
      console.log(
        `✅ Found Project Management department: ${projectManagementDept.name}`
      );
    }

    const projectManagementDeptId =
      projectManagementDept?._id ||
      (await Department.findOne({ name: { $regex: /project management/i } }))
        ._id;

    // Find all users who are NOT in Project Management department
    const usersToUpdate = await User.find({
      "department._id": { $ne: projectManagementDeptId },
    }).populate("department");

    console.log(
      `📊 Found ${usersToUpdate.length} users NOT in Project Management department`
    );

    if (usersToUpdate.length === 0) {
      console.log("✅ No users found that need updating");
      return;
    }

    let updatedCount = 0;
    let skippedCount = 0;

    // Process each user
    for (const user of usersToUpdate) {
      try {
        const originalModuleAccess = user.moduleAccess || [];
        const hasProjectsModule = originalModuleAccess.some(
          (module) => module.module === "PROJECTS"
        );

        if (!hasProjectsModule) {
          console.log(
            `⏭️  User ${user.username} (${user.department?.name}) already has no PROJECTS access - skipping`
          );
          skippedCount++;
          continue;
        }

        // Remove PROJECTS module from moduleAccess
        const updatedModuleAccess = originalModuleAccess.filter(
          (module) => module.module !== "PROJECTS"
        );

        // Update the user
        await User.updateOne(
          { _id: user._id },
          {
            $set: {
              moduleAccess: updatedModuleAccess,
            },
          }
        );

        console.log(
          `✅ Removed PROJECTS access from ${user.username} (${user.department?.name})`
        );
        updatedCount++;
      } catch (error) {
        console.error(
          `❌ Error updating user ${user.username}:`,
          error.message
        );
      }
    }

    // Summary
    console.log("\n📋 CLEANUP SUMMARY:");
    console.log(`🔍 Total users checked: ${usersToUpdate.length}`);
    console.log(`✅ Users updated: ${updatedCount}`);
    console.log(`⏭️  Users skipped (no changes needed): ${skippedCount}`);
    console.log(
      `❌ Errors: ${usersToUpdate.length - updatedCount - skippedCount}`
    );

    // Verify the changes
    console.log("\n🔍 Verifying changes...");
    const usersWithProjectsAccess = await User.find({
      "moduleAccess.module": "PROJECTS",
    }).populate("department");

    console.log(
      `📊 Users still with PROJECTS access: ${usersWithProjectsAccess.length}`
    );

    if (usersWithProjectsAccess.length > 0) {
      console.log("📝 Users still with PROJECTS access:");
      usersWithProjectsAccess.forEach((user) => {
        console.log(`   - ${user.username} (${user.department?.name})`);
      });

      // Check if remaining users are actually in Project Management
      const nonProjectManagementUsers = usersWithProjectsAccess.filter(
        (user) =>
          user.department?._id.toString() !== projectManagementDeptId.toString()
      );

      if (nonProjectManagementUsers.length > 0) {
        console.log(
          "\n⚠️  WARNING: Some users still have PROJECTS access but are NOT in Project Management:"
        );
        nonProjectManagementUsers.forEach((user) => {
          console.log(`   - ${user.username} (${user.department?.name})`);
        });
      } else {
        console.log(
          "✅ All remaining users with PROJECTS access are correctly in Project Management department"
        );
      }
    } else {
      console.log("✅ No users have PROJECTS access - cleanup complete!");
    }
  } catch (error) {
    console.error("❌ Script failed:", error);
    process.exit(1);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log("🔌 MongoDB connection closed");
    console.log("🏁 Script completed");
  }
}

// Run the script if called directly
removeProjectsModuleAccess()
  .then(() => {
    console.log("🎉 Script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Script failed:", error);
    process.exit(1);
  });
