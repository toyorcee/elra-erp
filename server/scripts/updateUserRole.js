import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import Role from "../models/Role.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the correct path
dotenv.config({ path: path.join(__dirname, "../.env") });

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.error("❌ MONGODB_URI is not defined in environment variables");
      console.log(
        "💡 Please make sure you have a .env file in the server directory"
      );
      console.log(
        "💡 The .env file should contain: MONGODB_URI=your_mongodb_connection_string"
      );
      process.exit(1);
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      maxPoolSize: 10,
      minPoolSize: 1,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    console.log("🔄 Retrying in 5 seconds...");
    setTimeout(connectDB, 5000);
  }
};

async function updateUserRole() {
  try {
    console.log("🔧 Updating User Role to SUPER_ADMIN...");

    await connectDB();

    // Find the SUPER_ADMIN role
    console.log("\n📋 Step 1: Finding SUPER_ADMIN role");
    const superAdminRole = await Role.findOne({ name: "SUPER_ADMIN" });

    if (!superAdminRole) {
      console.log("❌ SUPER_ADMIN role not found!");
      return;
    }

    console.log(
      `✅ Found SUPER_ADMIN role: ${superAdminRole._id} (level: ${superAdminRole.level})`
    );

    // Find the user to update
    console.log("\n📋 Step 2: Finding user to update");
    const userId = "688699d2a3eccfc91f458ac0"; // Your user ID
    const user = await User.findById(userId).populate("role");

    if (!user) {
      console.log("❌ User not found!");
      return;
    }

    console.log(`✅ Found user: ${user.email}`);
    console.log(
      `   Current role: ${user.role?.name} (level: ${user.role?.level})`
    );

    // Update the user's role
    console.log("\n📋 Step 3: Updating user role");
    user.role = superAdminRole._id;
    await user.save();

    // Verify the update
    console.log("\n📋 Step 4: Verifying the update");
    const updatedUser = await User.findById(userId).populate("role");

    console.log(`✅ User updated successfully!`);
    console.log(`   Email: ${updatedUser.email}`);
    console.log(
      `   New role: ${updatedUser.role?.name} (level: ${updatedUser.role?.level})`
    );
    console.log(`   Role ID: ${updatedUser.role?._id}`);

    console.log("\n🎉 Role update completed successfully!");
  } catch (error) {
    console.error("❌ Update failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

// Run the update
updateUserRole();
