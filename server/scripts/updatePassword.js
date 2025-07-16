import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "../models/User.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env") });

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.error("❌ MONGODB_URI is not defined in environment variables");
      process.exit(1);
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    process.exit(1);
  }
};

const updatePassword = async (email, newPassword) => {
  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      console.error(`❌ User with email ${email} not found`);
      return false;
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    user.password = hashedPassword;
    await user.save();

    console.log(`✅ Password updated successfully for ${email}`);
    console.log(`🔑 New password: ${newPassword}`);
    return true;
  } catch (error) {
    console.error("❌ Error updating password:", error);
    return false;
  }
};

const main = async () => {
  const args = process.argv.slice(2);

  if (args.length !== 2) {
    console.log("Usage: node updatePassword.js <email> <new-password>");
    console.log(
      "Example: node updatePassword.js admin@edms.com newpassword123"
    );
    process.exit(1);
  }

  const [email, newPassword] = args;

  console.log("🔧 Updating user password...\n");

  await connectDB();
  const success = await updatePassword(email, newPassword);

  if (success) {
    console.log("\n🎉 Password update completed successfully!");
  } else {
    console.log("\n❌ Password update failed!");
    process.exit(1);
  }

  await mongoose.disconnect();
  console.log("🔌 Database disconnected");
};

main().catch(console.error);
