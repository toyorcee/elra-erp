import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
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

async function getUserPassword() {
  try {
    console.log("🔍 Getting User Password Information...");

    await connectDB();

    // Find the user by ID
    console.log("\n📋 Step 1: Finding user by ID");
    const userId = "688699d2a3eccfc91f458ac0";
    const user = await User.findById(userId).select("+password");

    if (!user) {
      console.log("❌ User not found!");
      return;
    }

    console.log(`✅ Found user: ${user.email}`);
    console.log(`   Role: ${user.role?.name} (level: ${user.role?.level})`);
    console.log(`   Is Temporary Password: ${user.isTemporaryPassword}`);
    console.log(`   Password Change Required: ${user.passwordChangeRequired}`);
    console.log(
      `   Temporary Password Expiry: ${user.temporaryPasswordExpiry}`
    );
    console.log(`   Last Password Change: ${user.lastPasswordChange}`);
    console.log(`   Password Changed At: ${user.passwordChangedAt}`);

    // Get the stored password hash
    console.log("\n📋 Step 2: Password Information");
    console.log(`   Stored Password Hash: ${user.password}`);

    // Test some common passwords
    console.log("\n📋 Step 3: Testing Common Passwords");
    const testPasswords = [
      "5G92Y1S8T8", // From your logs
      "Sbpdojddme4", // From your logs
      "Sbpdojddme4*", // From your logs
      "5G92Y1S8T8*", // With asterisk
      "Sbpdojddme40*", // From the modal image
    ];

    for (const testPassword of testPasswords) {
      try {
        const isMatch = await bcrypt.compare(testPassword, user.password);
        console.log(
          `   Testing "${testPassword}": ${
            isMatch ? "✅ MATCH" : "❌ NO MATCH"
          }`
        );
      } catch (error) {
        console.log(
          `   Testing "${testPassword}": ❌ ERROR - ${error.message}`
        );
      }
    }

    // Check if we can find the original temporary password in the database
    console.log("\n📋 Step 4: Checking for Original Temporary Password");

    // Look for any recent password changes or temporary password info
    const recentUsers = await User.find({
      email: user.email,
      isTemporaryPassword: true,
    }).select("+password");

    if (recentUsers.length > 0) {
      console.log(
        `   Found ${recentUsers.length} users with temporary passwords`
      );
      recentUsers.forEach((u, index) => {
        console.log(`   User ${index + 1}: ${u.password}`);
      });
    } else {
      console.log("   No users with temporary passwords found");
    }

    console.log("\n🎉 Password analysis completed!");
  } catch (error) {
    console.error("❌ Analysis failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

// Run the analysis
getUserPassword();
