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
import User from "../models/User.js";
import Role from "../models/Role.js";

const updateHODRoleModules = async () => {
  try {
    console.log(
      "🔧 Updating HOD role moduleAccess to include only relevant modules for Legal HOD..."
    );

    // Find the HOD role
    const hodRole = await Role.findOne({ name: "HOD" });

    if (!hodRole) {
      console.error("❌ HOD role not found");
      return;
    }

    console.log(`👤 Found HOD role: ${hodRole.name} (Level: ${hodRole.level})`);

    // Show current moduleAccess
    console.log("\n📋 Current Module Access:");
    hodRole.moduleAccess.forEach((access, index) => {
      console.log(
        `   ${index + 1}. ${access.module}: ${access.permissions.join(", ")}`
      );
    });

    // Define the correct modules for HOD role (only relevant modules for Legal HOD)
    const correctModules = [
      {
        module: "SELF_SERVICE",
        permissions: ["view", "create", "edit", "approve"],
      },
      {
        module: "CUSTOMER_CARE",
        permissions: ["view", "create", "edit", "approve"],
      },
      {
        module: "PROJECTS",
        permissions: ["view", "create", "edit", "approve"],
      },
      {
        module: "LEGAL",
        permissions: ["view", "create", "edit", "approve"],
      },
      {
        module: "COMMUNICATION",
        permissions: ["view", "create", "edit", "approve"],
      },
    ];

    // Replace the entire moduleAccess array
    hodRole.moduleAccess = correctModules;
    await hodRole.save();
    console.log("💾 Saved updated HOD role");

    // Show updated moduleAccess
    console.log("\n📋 Updated Module Access:");
    hodRole.moduleAccess.forEach((access, index) => {
      console.log(
        `   ${index + 1}. ${access.module}: ${access.permissions.join(", ")}`
      );
    });

    // Find all Legal & Compliance department users to show who will be affected
    const legalUsers = await User.find({
      "department.code": "LEGAL",
    }).populate("role");

    console.log(
      `\n👥 Legal & Compliance Department Users (${legalUsers.length}):`
    );
    legalUsers.forEach((user, index) => {
      console.log(
        `   ${index + 1}. ${user.firstName} ${user.lastName} (${
          user.username
        }) - Role: ${user.role?.name || "Unknown"} (Level: ${
          user.role?.level || "Unknown"
        })`
      );
    });
  } catch (error) {
    console.error("❌ Error updating HOD role modules:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
};

// Run the script
updateHODRoleModules();
