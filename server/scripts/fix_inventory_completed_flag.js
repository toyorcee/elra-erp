import mongoose from "mongoose";
import dotenv from "dotenv";
import Project from "../models/Project.js";

dotenv.config();

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined");
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`🟢 MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    process.exit(1);
  }
};

async function fixInventoryCompletedFlag() {
  try {
    await connectDB();

    console.log("\n🔧 FIXING INVENTORY COMPLETED FLAG");
    console.log("=".repeat(50));

    // Find the Employee Training project that has inventoryCompleted: true
    const project = await Project.findOne({
      name: "Employee Training Program 2025",
    });

    if (!project) {
      console.log("❌ Employee Training project not found!");
      return;
    }

    console.log(`📋 Found Project: ${project.name}`);
    console.log(
      `📊 Current inventoryCompleted: ${project.workflowTriggers.inventoryCompleted}`
    );
    console.log(
      `📊 Current inventoryCreated: ${project.workflowTriggers.inventoryCreated}`
    );

    // Fix the inventoryCompleted flag
    if (project.workflowTriggers.inventoryCompleted === true) {
      project.workflowTriggers.inventoryCompleted = false;
      project.workflowTriggers.inventoryCompletedAt = undefined;
      project.workflowTriggers.inventoryCompletedBy = undefined;

      await project.save();

      console.log("✅ Fixed inventoryCompleted flag!");
      console.log(
        `📊 Updated inventoryCompleted: ${project.workflowTriggers.inventoryCompleted}`
      );
      console.log(
        `📊 inventoryCreated remains: ${project.workflowTriggers.inventoryCreated}`
      );

      console.log("\n🎯 FIX COMPLETE!");
      console.log(
        "Now Operations HOD can manually mark inventory as completed after verification"
      );
    } else {
      console.log("ℹ️  inventoryCompleted is already false - no fix needed");
    }
  } catch (error) {
    console.error("❌ Error during fix:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Database connection closed");
  }
}

fixInventoryCompletedFlag();
