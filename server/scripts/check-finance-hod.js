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

const checkFinanceHOD = async () => {
  try {
    console.log("🔍 Checking Finance HOD users...");

    // Find all users in Finance department
    const financeUsers = await User.find({
      "department.name": { $regex: /finance/i },
    });

    console.log(`📊 Found ${financeUsers.length} users in Finance department:`);

    financeUsers.forEach((user) => {
      console.log(`\n👤 User: ${user.firstName} ${user.lastName}`);
      console.log(`   Username: ${user.username}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Department: ${user.department?.name}`);
      console.log(`   Role: ${user.role?.name} (Level: ${user.role?.level})`);
      console.log(
        `   Module Access: ${user.role?.moduleAccess?.length || 0} modules`
      );

      if (user.role?.moduleAccess) {
        user.role.moduleAccess.forEach((access) => {
          console.log(
            `     - ${access.module}: ${access.permissions.join(", ")}`
          );
        });
      }
    });

    // Also check for users with username containing 'fin'
    const finUsers = await User.find({
      username: { $regex: /fin/i },
    });

    console.log(`\n🔍 Found ${finUsers.length} users with 'fin' in username:`);
    finUsers.forEach((user) => {
      console.log(
        `   ${user.username} - ${user.firstName} ${user.lastName} - ${user.department?.name}`
      );
    });
  } catch (error) {
    console.error("❌ Error checking Finance HOD:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
};

// Run the script
checkFinanceHOD();

