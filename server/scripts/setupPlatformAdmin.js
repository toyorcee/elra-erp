import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "../models/User.js";
import Role from "../models/Role.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

const PLATFORM_ADMIN_EMAIL = "Oluwatoyosi.crane@gmail.com";
const PLATFORM_ADMIN_PASSWORD = "Sbpdojddme4";

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

async function createPlatformAdmin() {
  await connectDB();

  let role = await Role.findOne({ name: "PLATFORM_ADMIN" });
  if (!role) {
    role = await Role.create({
      name: "PLATFORM_ADMIN",
      level: 110,
      description: "Platform-level administrator with full control.",
      permissions: [
        "system.settings",
        "system.reports",
        "system.audit",
        "system.backup",
        "user.create",
        "user.view",
        "user.edit",
        "user.delete",
        "user.assign_role",
        "user.view_permissions",
        "company.create",
        "company.view",
        "company.edit",
        "company.delete",
      ],
      departmentAccess: ["All"],
      isActive: true,
    });
    console.log("✅ PLATFORM_ADMIN role created");
  } else {
    console.log("⏭️  PLATFORM_ADMIN role already exists");
  }

  let user = await User.findOne({ email: PLATFORM_ADMIN_EMAIL });
  const hashedPassword = await bcrypt.hash(PLATFORM_ADMIN_PASSWORD, 10);
  if (!user) {
    user = await User.create({
      username: "platformadmin",
      firstName: "Platform",
      lastName: "Admin",
      email: PLATFORM_ADMIN_EMAIL,
      password: hashedPassword,
      role: role._id,
      isSuperadmin: false,
      isActive: true,
      isEmailVerified: true,
    });
    console.log("✅ Platform admin created:", user.email);
    console.log("🔑 Password:", PLATFORM_ADMIN_PASSWORD);
  } else {
    // Update password and status fields if user exists
    user.password = hashedPassword;
    user.isActive = true;
    user.isEmailVerified = true;
    user.role = role._id;
    user.username = "platformadmin";
    user.firstName = "Platform";
    user.lastName = "Admin";
    user.isSuperadmin = false;
    await user.save();
    console.log("✅ Platform admin updated:", user.email);
    console.log("🔑 Password:", PLATFORM_ADMIN_PASSWORD);
  }

  await mongoose.disconnect();
  console.log("🔌 Database disconnected");
}

createPlatformAdmin().catch((err) => {
  console.error("Error creating platform admin:", err);
  process.exit(1);
});
