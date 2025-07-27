import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import Role from "../models/Role.js";
import NotificationService from "../services/notificationService.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the correct path
dotenv.config({ path: path.join(__dirname, "../.env") });

// Mock Socket.IO for testing
const mockIO = {
  to: () => ({
    emit: () => {},
  }),
};

const notificationService = new NotificationService(mockIO);

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

async function testPlatformAdminLookup() {
  try {
    console.log("🔍 Testing Platform Admin Lookup...");

    await connectDB();

    // Test 1: Find all users with role level >= 110
    console.log("\n📋 Test 1: Finding users with role.level >= 110");
    const usersWithLevel110 = await User.find({
      "role.level": { $gte: 110 },
    })
      .populate("role")
      .select("_id email firstName lastName role");

    console.log("Found users with level >= 110:", usersWithLevel110.length);
    usersWithLevel110.forEach((user) => {
      console.log(
        `- ${user.email} (${user.role?.name}, level: ${user.role?.level})`
      );
    });

    // Test 2: Find users with role name PLATFORM_ADMIN or SUPER_ADMIN
    console.log(
      "\n📋 Test 2: Finding users with role name PLATFORM_ADMIN or SUPER_ADMIN"
    );
    const usersWithRoleName = await User.find({
      "role.name": { $in: ["PLATFORM_ADMIN", "SUPER_ADMIN"] },
    })
      .populate("role")
      .select("_id email firstName lastName role");

    console.log("Found users with role name:", usersWithRoleName.length);
    usersWithRoleName.forEach((user) => {
      console.log(
        `- ${user.email} (${user.role?.name}, level: ${user.role?.level})`
      );
    });

    // Test 3: Find specific platform admin by ID
    console.log("\n📋 Test 3: Finding specific platform admin by ID");
    const specificAdmin = await User.findById("68823e6996e49078159dbe91")
      .populate("role")
      .select("_id email firstName lastName role");

    if (specificAdmin) {
      console.log(
        `✅ Found specific admin: ${specificAdmin.email} (${specificAdmin.role?.name}, level: ${specificAdmin.role?.level})`
      );
    } else {
      console.log("❌ Specific admin not found");
    }

    // Test 4: Use the notification service method
    console.log(
      "\n📋 Test 4: Using notification service getPlatformAdminUsers()"
    );
    const platformAdmins = await notificationService.getPlatformAdminUsers();
    console.log("Platform admins found by service:", platformAdmins.length);
    platformAdmins.forEach((admin) => {
      console.log(
        `- ${admin.email} (${admin.role?.name}, level: ${admin.role?.level})`
      );
    });

    // Test 5: Test sending a notification
    if (platformAdmins.length > 0) {
      console.log("\n📋 Test 5: Testing notification sending");
      const testSubscriptionData = {
        subscriptionId: "test123",
        planName: "Test Plan",
        companyName: "Test Company",
        amount: 99999,
        currency: "NGN",
        adminEmail: "test@example.com",
      };

      try {
        await notificationService.notifyAllPlatformAdmins(
          notificationService.sendPlatformAdminNewSubscriptionNotification,
          testSubscriptionData
        );
        console.log("✅ Notification test completed");
      } catch (error) {
        console.error("❌ Notification test failed:", error.message);
      }
    }

    console.log("\n✅ All tests completed!");
  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

// Run the test
testPlatformAdminLookup();
