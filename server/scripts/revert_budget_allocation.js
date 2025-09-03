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

// Import models
import BudgetAllocation from "../models/BudgetAllocation.js";
import Project from "../models/Project.js";
import Notification from "../models/Notification.js";

// Project ID to revert (Davis Groups - Training System Implementation)
const PROJECT_ID = "68b32d060d6123f154d4be0e";

const revertBudgetAllocation = async () => {
  try {
    console.log("🔄 Starting budget allocation revert process...");

    // 1. Find and delete budget allocation
    console.log("🔍 Looking for budget allocation for project:", PROJECT_ID);
    const budgetAllocation = await BudgetAllocation.findOne({
      project: PROJECT_ID,
      allocationType: "project_budget",
    });

    if (budgetAllocation) {
      console.log(
        "🗑️ Found budget allocation:",
        budgetAllocation.allocationCode
      );
      await BudgetAllocation.findByIdAndDelete(budgetAllocation._id);
      console.log("✅ Budget allocation deleted");
    } else {
      console.log("⚠️ No budget allocation found for this project");
    }

    // 2. Find project
    console.log("🔍 Finding project...");
    const project = await Project.findById(PROJECT_ID);
    if (project) {
      console.log("📋 Found project:", project.name);

      // 3. Calculate original budget (items total)
      const projectItemsTotal = project.projectItems.reduce((sum, item) => {
        return sum + (item.totalPrice || 0);
      }, 0);

      console.log("💰 Project items total:", projectItemsTotal);
      console.log("💰 Current project budget:", project.budget);

      // 4. Reset project status and budget
      project.budget = projectItemsTotal;
      project.status = "pending_budget_allocation";
      project.workflowTriggers.procurementInitiated = false;
      project.workflowTriggers.procurementCompleted = false;

      await project.save();
      console.log("✅ Project reset to pending_budget_allocation status");
      console.log("✅ Project budget reset to items total:", projectItemsTotal);
      console.log("✅ Procurement triggers reset to false");
    } else {
      console.log("❌ Project not found");
    }

    // 5. Clean up related notifications
    console.log("🧹 Cleaning up related notifications...");
    const deletedNotifications = await Notification.deleteMany({
      $or: [
        { "data.budgetAllocationId": budgetAllocation?._id },
        { "data.projectId": PROJECT_ID },
        {
          type: {
            $in: [
              "BUDGET_ALLOCATION_PENDING",
              "BUDGET_ALLOCATION_APPROVED",
              "BUDGET_ALLOCATION_REJECTED",
              "PROCUREMENT_INITIATION_REQUIRED",
            ],
          },
          "data.projectId": PROJECT_ID,
        },
      ],
    });

    console.log(
      `✅ Deleted ${deletedNotifications.deletedCount} related notifications`
    );

    console.log("🎉 Budget allocation revert completed successfully!");
    console.log("📊 Summary:");
    console.log("   - Budget allocation: DELETED");
    console.log("   - Project status: RESET to pending_budget_allocation");
    console.log("   - Project budget: RESET to items total");
    console.log("   - Procurement triggers: RESET to false");
    console.log("   - Related notifications: CLEANED UP");
  } catch (error) {
    console.error("❌ Error during revert:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
};

// Run the script
revertBudgetAllocation();
