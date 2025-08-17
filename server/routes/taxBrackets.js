import express from "express";
import {
  getActiveTaxBrackets,
  getPAYEInfo,
} from "../controllers/taxBracketController.js";
import { protect, checkPayrollAccess } from "../middleware/auth.js";

const router = express.Router();

// Protect all routes
router.use(protect);
router.use(checkPayrollAccess);

// Get all active tax brackets
router.get("/", getActiveTaxBrackets);

// Get PAYE info for tooltip
router.get("/paye-info", getPAYEInfo);

export default router;
