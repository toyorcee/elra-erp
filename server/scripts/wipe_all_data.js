import mongoose from "mongoose";
import dotenv from "dotenv";

// Import models
import "../models/Project.js";
import "../models/Document.js";
import "../models/Task.js";
import "../models/Inventory.js";
import "../models/Notification.js";
import "../models/AuditLog.js";

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

// Wipe all data
const wipeAllData = async () => {
  try {
    console.log("🧹 Starting database cleanup...");

    // Get all collections
    const collections = await mongoose.connection.db
      .listCollections()
      .toArray();

    console.log(
      "📋 Found collections:",
      collections.map((c) => c.name)
    );

    // Delete all projects
    const Project = mongoose.model("Project");
    const projectCount = await Project.countDocuments();
    if (projectCount > 0) {
      await Project.deleteMany({});
      console.log(`🗑️ Deleted ${projectCount} projects`);
    } else {
      console.log("ℹ️ No projects found to delete");
    }

    // Delete all documents
    const Document = mongoose.model("Document");
    const documentCount = await Document.countDocuments();
    if (documentCount > 0) {
      await Document.deleteMany({});
      console.log(`🗑️ Deleted ${documentCount} documents`);
    } else {
      console.log("ℹ️ No documents found to delete");
    }

    // Delete all tasks
    const Task = mongoose.model("Task");
    const taskCount = await Task.countDocuments();
    if (taskCount > 0) {
      await Task.deleteMany({});
      console.log(`🗑️ Deleted ${taskCount} tasks`);
    } else {
      console.log("ℹ️ No tasks found to delete");
    }

    // Delete all inventory items
    const Inventory = mongoose.model("Inventory");
    const inventoryCount = await Inventory.countDocuments();
    if (inventoryCount > 0) {
      await Inventory.deleteMany({});
      console.log(`🗑️ Deleted ${inventoryCount} inventory items`);
    } else {
      console.log("ℹ️ No inventory items found to delete");
    }

    // Delete all notifications
    const Notification = mongoose.model("Notification");
    const notificationCount = await Notification.countDocuments();
    if (notificationCount > 0) {
      await Notification.deleteMany({});
      console.log(`🗑️ Deleted ${notificationCount} notifications`);
    } else {
      console.log("ℹ️ No notifications found to delete");
    }

    // Delete all audit logs
    const AuditLog = mongoose.model("AuditLog");
    const auditCount = await AuditLog.countDocuments();
    if (auditCount > 0) {
      await AuditLog.deleteMany({});
      console.log(`🗑️ Deleted ${auditCount} audit logs`);
    } else {
      console.log("ℹ️ No audit logs found to delete");
    }

    console.log("✅ Database cleanup completed successfully!");
    console.log("🎯 Ready for fresh testing!");
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
    process.exit(0);
  }
};

// Run the script
const runScript = async () => {
  await connectDB();
  await wipeAllData();
};

runScript();
