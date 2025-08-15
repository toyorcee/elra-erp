import express from "express";
import {
  createPolicy,
  getPolicies,
  getPolicyById,
  updatePolicy,
  deletePolicy,
  getPolicyStats,
  updatePolicyVersion,
  getPoliciesByDepartment,
  getPolicyOptions,
} from "../controllers/policyController.js";
import { protect, checkRole } from "../middleware/auth.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// Create policy (HOD and Super Admin only)
router.post("/", checkRole(700), createPolicy);

// Get all policies (all authenticated users can view)
router.get("/", checkRole(100), getPolicies);

// Get policy by ID (all authenticated users can view)
router.get("/:id", checkRole(100), getPolicyById);

// Update policy (HOD and Super Admin only)
router.put("/:id", checkRole(700), updatePolicy);

// Delete policy (Super Admin only)
router.delete("/:id", checkRole(1000), deletePolicy);

// Get policy statistics (all authenticated users can view)
router.get("/stats/overview", checkRole(100), getPolicyStats);

// Update policy version (HOD and Super Admin only)
router.put("/:id/version", checkRole(700), updatePolicyVersion);

// Get policies by department (all authenticated users can view)
router.get(
  "/department/:departmentId",
  checkRole(100),
  getPoliciesByDepartment
);

router.get("/options/available", checkRole(100), getPolicyOptions);

export default router;
