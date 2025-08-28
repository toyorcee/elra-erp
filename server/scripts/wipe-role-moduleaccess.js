import mongoose from "mongoose";
import dotenv from "dotenv";
import Role from "../models/Role.js";

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

const wipeRoleModuleAccess = async () => {
  try {
    console.log("🗑️  WIPING ALL ROLE MODULEACCESS...");

    // Get all roles
    const roles = await Role.find({});

    console.log(`\n👥 Found ${roles.length} roles to wipe`);

    // Wipe moduleAccess for each role
    for (const role of roles) {
      console.log(`\n🗑️  Wiping ${role.name} role moduleAccess...`);

      // Wipe the moduleAccess
      role.moduleAccess = [];
      await role.save();

      console.log(`✅ Wiped ${role.name} role moduleAccess`);
    }

    console.log("\n✅ COMPLETE! All role moduleAccess has been wiped!");
    console.log("\n📊 Summary:");
    console.log("   - All roles now have empty moduleAccess arrays");
    console.log("   - No more role-level moduleAccess data");
  } catch (error) {
    console.error("❌ Error wiping role moduleAccess:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 MongoDB disconnected");
  }
};

// Run the script
connectDB().then(() => {
  wipeRoleModuleAccess().then(() => {
    console.log("✅ Script completed");
    process.exit(0);
  });
});
