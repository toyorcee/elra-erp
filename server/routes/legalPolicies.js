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
  getLegalPolicyCategories,
} from "../controllers/legalPolicyController.js";
import { protect } from "../middleware/auth.js";
import {
  checkLegalAccess,
  checkPolicyWriteAccess,
  checkLegalDeleteAccess,
} from "../middleware/legalAccess.js";

const router = express.Router();

router.use(protect);

router.post("/", checkPolicyWriteAccess, createPolicy);

router.get("/", checkLegalAccess, getPolicies);

router.get("/:id", checkLegalAccess, getPolicyById);

router.put("/:id", checkPolicyWriteAccess, updatePolicy);

router.delete("/:id", checkLegalDeleteAccess, deletePolicy);

router.get("/stats/overview", checkLegalAccess, getPolicyStats);

router.put("/:id/version", checkPolicyWriteAccess, updatePolicyVersion);

router.get(
  "/department/:departmentId",
  checkLegalAccess,
  getPoliciesByDepartment
);

router.get("/options/available", checkLegalAccess, getPolicyOptions);

router.get("/categories/available", checkLegalAccess, getLegalPolicyCategories);

export default router;
