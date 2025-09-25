import express from "express";
import {
  createComplianceProgram,
  getCompliancePrograms,
  getComplianceProgramById,
  updateComplianceProgram,
  deleteComplianceProgram,
  getComplianceProgramStats,
  getComplianceProgramCategories,
} from "../controllers/complianceProgramController.js";
import { protect } from "../middleware/auth.js";
import {
  checkLegalAccess,
  checkComplianceWriteAccess,
  checkLegalDeleteAccess,
} from "../middleware/legalAccess.js";

const router = express.Router();

router.use(protect);

router.post("/", checkComplianceWriteAccess, createComplianceProgram);

router.get("/", checkLegalAccess, getCompliancePrograms);

router.get("/:id", checkLegalAccess, getComplianceProgramById);

router.put("/:id", checkComplianceWriteAccess, updateComplianceProgram);

router.delete("/:id", checkLegalDeleteAccess, deleteComplianceProgram);

router.get("/stats/overview", checkLegalAccess, getComplianceProgramStats);

router.get(
  "/categories/available",
  checkLegalAccess,
  getComplianceProgramCategories
);

export default router;
