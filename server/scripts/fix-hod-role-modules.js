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
const User = mongoose.model("User", new mongoose.Schema({}, { strict: false }));
const Role = mongoose.model("Role", new mongoose.Schema({}, { strict: false }));

const fixHODRoleModules = async () => {
  try {
    console.log("🔧 Fixing HOD role moduleAccess...");

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

    // Define the correct modules for HOD role
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
        module: "HR",
        permissions: ["view", "create", "edit", "approve"],
      },
      {
        module: "PAYROLL",
        permissions: ["view", "create", "edit", "approve"],
      },
    ];

    // Update the role's moduleAccess
    hodRole.moduleAccess = correctModules;
    await hodRole.save();

    console.log("✅ Updated HOD role moduleAccess");

    // Show updated moduleAccess
    console.log("\n📋 Updated Module Access:");
    hodRole.moduleAccess.forEach((access, index) => {
      console.log(
        `   ${index + 1}. ${access.module}: ${access.permissions.join(", ")}`
      );
    });

    console.log("\n🎯 Changes made:");
    console.log("   ✅ Removed INVENTORY module");
    console.log("   ✅ Added HR module");
    console.log("   ✅ Added PAYROLL module");
  } catch (error) {
    console.error("❌ Error fixing HOD role modules:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
};

// Run the script
fixHODRoleModules();

