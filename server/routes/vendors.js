import express from "express";
import {
  getApprovedVendors,
  getVendorsByCategory,
  getVendorById,
  getVendorCategories,
} from "../controllers/vendorController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// All routes are protected
router.use(protect);

// Get vendor categories
router.get("/categories", getVendorCategories);

// Get all approved vendors
router.get("/approved", getApprovedVendors);

// Get vendors by service category
router.get("/category/:category", getVendorsByCategory);

// Get vendor by ID
router.get("/:id", getVendorById);

export default router;
