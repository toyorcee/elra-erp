import express from "express";
import {
  createBudgetAllocation,
  getBudgetAllocations,
  getBudgetAllocationById,
  approveBudgetAllocation,
  rejectBudgetAllocation,
  getBudgetAllocationStats,
  getProjectsNeedingBudgetAllocation,
  getBudgetAllocationHistory,
} from "../controllers/budgetAllocationController.js";
import { protect, checkBudgetAllocationAccess } from "../middleware/auth.js";

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// Apply budget allocation access restrictions to admin routes
router.use(checkBudgetAllocationAccess);

// Budget allocation routes
router.post("/", createBudgetAllocation);
router.get("/", getBudgetAllocations);
router.get("/history", getBudgetAllocationHistory);
router.get("/stats", getBudgetAllocationStats);
router.get("/projects-needing-allocation", getProjectsNeedingBudgetAllocation);
router.get("/:id", getBudgetAllocationById);
router.put("/:id/approve", approveBudgetAllocation);
router.put("/:id/reject", rejectBudgetAllocation);

export default router;
