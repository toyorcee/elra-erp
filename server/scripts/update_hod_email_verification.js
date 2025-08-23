import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Import models
import User from "../models/User.js";
import Role from "../models/Role.js";
import Department from "../models/Department.js";

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

const updateHODEmailVerification = async () => {
  try {
    await connectDB();

    console.log("🔍 [HOD UPDATE] Updating HOD email verification status...");

    // First, let's check what roles exist
    const roles = await Role.find({});
    console.log("📋 [HOD UPDATE] Available roles:");
    roles.forEach((role) => {
      console.log(`   - ${role.name} (Level: ${role.level})`);
    });

    // Find HOD role
    const hodRole = await Role.findOne({ name: "HOD" });
    if (!hodRole) {
      console.log("❌ [HOD UPDATE] HOD role not found");
      return;
    }

    console.log(
      `\n🔍 [HOD UPDATE] Found HOD role: ${hodRole.name} (Level: ${hodRole.level})`
    );

    // Find all HOD users by role ID
    const hodUsers = await User.find({ role: hodRole._id }).populate(
      "role department"
    );

    console.log(`📋 [HOD UPDATE] Found ${hodUsers.length} HOD users`);

    if (hodUsers.length === 0) {
      console.log("⚠️ [HOD UPDATE] No HOD users found");
      return;
    }

    // Show current status
    console.log("\n📋 [HOD UPDATE] Current HOD Users:");
    console.log("=====================================");

    hodUsers.forEach((hod, index) => {
      console.log(`${index + 1}. ${hod.firstName} ${hod.lastName}`);
      console.log(`   Email: ${hod.email}`);
      console.log(`   Department: ${hod.department?.name || "Not Assigned"}`);
      console.log(`   Email Verified: ${hod.emailVerified}`);
      console.log(`   Is Email Verified: ${hod.isEmailVerified}`);
      console.log(`   Status: ${hod.status}`);
      console.log("");
    });

    // Update all HOD users to have email verification true
    const updateResult = await User.updateMany(
      { role: hodRole._id },
      {
        emailVerified: true,
        isEmailVerified: true,
      }
    );

    console.log("✅ [HOD UPDATE] Email verification updated successfully");
    console.log(`   Updated ${updateResult.modifiedCount} HOD users`);

    // Verify the update
    const updatedHODs = await User.find({ role: hodRole._id }).populate(
      "role department"
    );
    console.log("\n📋 [HOD UPDATE] Updated HOD Users:");
    console.log("=====================================");

    updatedHODs.forEach((hod, index) => {
      console.log(`${index + 1}. ${hod.firstName} ${hod.lastName}`);
      console.log(`   Email: ${hod.email}`);
      console.log(`   Department: ${hod.department?.name || "Not Assigned"}`);
      console.log(`   Email Verified: ${hod.emailVerified}`);
      console.log(`   Is Email Verified: ${hod.isEmailVerified}`);
      console.log(`   Status: ${hod.status}`);
      console.log("");
    });

    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
  } catch (error) {
    console.error("❌ Error updating HOD email verification:", error);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
  }
};

updateHODEmailVerification();
