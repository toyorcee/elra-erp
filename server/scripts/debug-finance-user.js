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

const debugFinanceUser = async () => {
  try {
    console.log("🔍 Debugging Finance user...");

    // Find the specific user
    const user = await User.findOne({ username: "fin001" });

    if (!user) {
      console.error("❌ User fin001 not found");
      return;
    }

    console.log("👤 User found:");
    console.log(`   Name: ${user.firstName} ${user.lastName}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Email: ${user.email}`);
    
    console.log("\n📋 Role Info:");
    console.log(`   Role Object:`, JSON.stringify(user.role, null, 2));
    console.log(`   Role Level: ${user.role?.level}`);
    console.log(`   Role Name: ${user.role?.name}`);
    console.log(`   Role Module Access: ${user.role?.moduleAccess?.length || 0} modules`);
    
    if (user.role?.moduleAccess) {
      user.role.moduleAccess.forEach((access, index) => {
        console.log(`     ${index + 1}. ${access.module}: ${access.permissions.join(", ")}`);
      });
    }
    
    console.log("\n📋 User Module Access:");
    console.log(`   User Module Access: ${user.moduleAccess?.length || 0} modules`);
    
    if (user.moduleAccess) {
      user.moduleAccess.forEach((access, index) => {
        console.log(`     ${index + 1}. ${access.module}: ${access.permissions.join(", ")}`);
      });
    }
    
    console.log("\n📋 Department Info:");
    console.log(
      `   Department Object:`,
      JSON.stringify(user.department, null, 2)
    );
    console.log(`   Department Name: ${user.department?.name}`);
    console.log(`   Department Code: ${user.department?.code}`);
    console.log(`   Department ID: ${user.department?._id}`);

  } catch (error) {
    console.error("❌ Error debugging finance user:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
};

// Run the script
debugFinanceUser();
