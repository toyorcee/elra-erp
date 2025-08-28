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

// Import User model
const User = mongoose.model("User", new mongoose.Schema({}, { strict: false }));

const addProjectsToHRUser = async () => {
  try {
    console.log("🔧 Adding PROJECTS module to HR user...");

    // Find the HR user by username
    const hrUser = await User.findOne({ username: "hr001" });

    if (!hrUser) {
      console.error("❌ HR user not found");
      return;
    }

    console.log(`👤 Found HR user: ${hrUser.firstName} ${hrUser.lastName} (${hrUser.username})`);

    // Check if PROJECTS already exists in user's moduleAccess
    const hasProjects = hrUser.moduleAccess.some(access => access.module === "PROJECTS");
    
    if (!hasProjects) {
      // Add PROJECTS module to user's moduleAccess
      hrUser.moduleAccess.push({
        module: "PROJECTS",
        permissions: ["view", "create", "edit", "approve"],
      });
      await hrUser.save();
      console.log("✅ Added PROJECTS to HR user's moduleAccess");
    } else {
      console.log("ℹ️  HR user already has PROJECTS in moduleAccess");
    }

    // Show current moduleAccess
    console.log("\n📋 Current Module Access:");
    hrUser.moduleAccess.forEach((access, index) => {
      console.log(`   ${index + 1}. ${access.module}: ${access.permissions.join(", ")}`);
    });

  } catch (error) {
    console.error("❌ Error adding PROJECTS to HR user:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
};

// Run the script
addProjectsToHRUser();
