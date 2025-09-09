import mongoose from "mongoose";
import dotenv from "dotenv";
import Project from "../models/Project.js";
import BudgetAllocation from "../models/BudgetAllocation.js";

dotenv.config();

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined");
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

const resetProjectForReallocation = async () => {
  try {
    console.log("🔧 Resetting project for fresh budget allocation...");

    // Project ID from the user's data
    const projectId = "68baf980799c3681ca1451b6";

    // Find the project
    const project = await Project.findById(projectId);
    if (!project) {
      console.error("❌ Project not found:", projectId);
      return;
    }

    console.log("📋 Project found:", project.name);
    console.log("📊 Current status:", project.status);
    console.log("💰 Current budget:", project.budget.toLocaleString());

    // Reset project budget to items total only (no extra allocation)
    const itemsTotal = project.projectItems.reduce(
      (sum, item) => sum + (item.totalPrice || 0),
      0
    );

    console.log("📦 Items total:", itemsTotal.toLocaleString());

    // Reset project to original state
    project.budget = itemsTotal; // Reset to items total only
    project.budgetVariance = itemsTotal;
    project.status = "pending_budget_allocation";

    // Reset workflow triggers
    project.workflowTriggers = {
      inventoryCreated: false,
      inventoryCompleted: false,
      procurementInitiated: false,
      procurementCompleted: false,
      regulatoryComplianceInitiated: false,
      regulatoryComplianceCompleted: false,
    };

    // Reset workflow phase and step
    project.workflowPhase = "planning";
    project.workflowStep = 1;

    // Clear workflow history related to procurement and budget allocation
    project.workflowHistory = project.workflowHistory.filter(
      (entry) =>
        !entry.action.includes("procurement") &&
        !entry.action.includes("implementation") &&
        !entry.action.includes("budget")
    );

    await project.save();

    // Find and delete any existing budget allocations for this project
    const existingAllocations = await BudgetAllocation.find({
      project: projectId,
    });
    console.log(
      `🗑️ Found ${existingAllocations.length} existing budget allocations to delete`
    );

    if (existingAllocations.length > 0) {
      await BudgetAllocation.deleteMany({ project: projectId });
      console.log("✅ Deleted existing budget allocations");
    }

    console.log("🎉 Project reset for fresh budget allocation!");
    console.log("📊 New status:", project.status);
    console.log("💰 New budget:", project.budget.toLocaleString());
    console.log("🔄 Workflow phase:", project.workflowPhase);
    console.log("📋 Workflow step:", project.workflowStep);
    console.log("💡 Project is now ready for fresh budget allocation");
  } catch (error) {
    console.error("❌ Error resetting project:", error);
  }
};

const main = async () => {
  try {
    await connectDB();
    await resetProjectForReallocation();
    console.log("✅ Script completed successfully!");
  } catch (error) {
    console.error("❌ Script failed:", error);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
    process.exit(0);
  }
};

main();
