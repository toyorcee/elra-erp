import express from "express";
import {
  getAllBonuses,
  getBonusById,
  createBonus,
  updateBonus,
  deleteBonus,
  getBonusCategories,
  getBonusTypes,
} from "../controllers/bonusController.js";
import { protect, checkPayrollAccess } from "../middleware/auth.js";

const router = express.Router();

// Protect all routes
router.use(protect);

// Use the reusable payroll access middleware
router.use(checkPayrollAccess);

// Routes
router.route("/").get(getAllBonuses).post(createBonus);

router.route("/categories").get(getBonusCategories);

router.route("/types").get(getBonusTypes);

router.route("/:id").get(getBonusById).put(updateBonus).delete(deleteBonus);

export default router;
