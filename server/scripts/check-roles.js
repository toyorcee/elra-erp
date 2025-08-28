import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Import models
import Role from "../models/Role.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

const checkRoles = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Get all roles
    const roles = await Role.find().sort({ level: -1 });

    console.log(`\n🔑 ALL ROLES (${roles.length} roles):`);
    console.log("=".repeat(60));

    roles.forEach((role, index) => {
      console.log(`\n${index + 1}. ${role.name}`);
      console.log(`   Level: ${role.level}`);
      console.log(`   ID: ${role._id}`);
      console.log(`   Description: ${role.description}`);
      console.log(`   Active: ${role.isActive}`);
    });

    // Find HOD role specifically
    const hodRole = roles.find((role) => role.level === 700);
    if (hodRole) {
      console.log(`\n🎯 HOD ROLE FOUND:`);
      console.log(`   Name: ${hodRole.name}`);
      console.log(`   Level: ${hodRole.level}`);
      console.log(`   ID: ${hodRole._id}`);
    } else {
      console.log(`\n❌ HOD ROLE NOT FOUND (level 700)`);
    }
  } catch (error) {
    console.error("❌ Error checking roles:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Disconnected from MongoDB");
  }
};

checkRoles();
