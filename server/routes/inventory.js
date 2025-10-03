import express from "express";
import { body } from "express-validator";
import {
  getAllInventory,
  getInventoryById,
  createInventory,
  updateInventory,
  deleteInventory,
  getInventoryStats,
  getAvailableItems,
  getByType,
  getMaintenanceDue,
  addMaintenanceRecord,
  addNote,
  updateStatus,
  // Project-specific inventory endpoints
  getProjectInventoryWorkflow,
  createProjectEquipment,
  allocateProjectBudget,
  assignProjectLocations,
  completeProjectInventory,
  getEquipmentCategories,
  resendInventoryNotifications,
  // Reports
  exportInventoryReport,
} from "../controllers/inventoryController.js";
import { protect, checkRole } from "../middleware/auth.js";

const router = express.Router();

// Validation middleware
const validateInventory = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage("Item name must be between 2 and 200 characters"),
  body("description")
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage("Description must be between 10 and 1000 characters"),
  body("type")
    .isIn([
      "equipment",
      "vehicle",
      "property",
      "furniture",
      "electronics",
      "other",
    ])
    .withMessage("Invalid item type"),
  body("category")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Category must be between 2 and 100 characters"),
  body("purchasePrice")
    .isFloat({ min: 0 })
    .withMessage("Purchase price must be a positive number"),
  body("currentValue")
    .isFloat({ min: 0 })
    .withMessage("Current value must be a positive number"),
  body("leaseRate.daily")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Daily lease rate must be a positive number"),
  body("leaseRate.weekly")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Weekly lease rate must be a positive number"),
  body("leaseRate.monthly")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Monthly lease rate must be a positive number"),
];

const validateMaintenanceRecord = [
  body("type")
    .isIn(["routine", "repair", "inspection", "upgrade", "other"])
    .withMessage("Invalid maintenance type"),
  body("description")
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage("Description must be between 10 and 500 characters"),
  body("cost")
    .isFloat({ min: 0 })
    .withMessage("Cost must be a positive number"),
  body("performedBy")
    .isMongoId()
    .withMessage("Performed by must be a valid user ID"),
];

const validateNote = [
  body("content")
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage("Note content must be between 1 and 1000 characters"),
  body("isPrivate")
    .optional()
    .isBoolean()
    .withMessage("isPrivate must be a boolean"),
];

// All routes require authentication
router.use(protect);

// Get all inventory (with role-based filtering) - Manager+
router.get("/", checkRole(600), getAllInventory);

// Get inventory statistics - Manager+
router.get("/stats", checkRole(600), getInventoryStats);

// Get available items - Manager+
router.get("/available", checkRole(600), getAvailableItems);

// Get equipment categories for dropdowns - All authenticated users
router.get("/categories", getEquipmentCategories);

// Get items by type - Manager+
router.get("/type/:type", checkRole(600), getByType);

// Get maintenance due items - Manager+
router.get("/maintenance-due", checkRole(600), getMaintenanceDue);

// Get inventory by ID - Manager+
router.get("/:id", checkRole(600), getInventoryById);

// Create new inventory item - Manager+
router.post("/", checkRole(600), validateInventory, createInventory);

// Update inventory item - Manager+
router.put("/:id", checkRole(600), validateInventory, updateInventory);

// Delete inventory item - HOD+
router.delete("/:id", checkRole(700), deleteInventory);

// Maintenance routes - Manager+
router.post(
  "/:id/maintenance",
  checkRole(600),
  validateMaintenanceRecord,
  addMaintenanceRecord
);

// Notes routes - Manager+
router.post("/:id/notes", checkRole(600), validateNote, addNote);

// Status update - Manager+
router.patch("/:id/status", checkRole(600), updateStatus);

// ============================================================================
// PROJECT-SPECIFIC INVENTORY WORKFLOW ROUTES
// ============================================================================

// Get project inventory workflow data - Operations HOD+
router.get(
  "/project/:projectId/workflow",
  checkRole(700),
  getProjectInventoryWorkflow
);

// Create equipment for specific project - Operations HOD+
router.post(
  "/project/:projectId/equipment",
  checkRole(700),
  createProjectEquipment
);

// Allocate budget for project equipment - Operations HOD+
router.post(
  "/project/:projectId/budget",
  checkRole(700),
  allocateProjectBudget
);

// Assign locations for project equipment - Operations HOD+
router.post(
  "/project/:projectId/locations",
  checkRole(700),
  assignProjectLocations
);

// Complete project inventory phase - Operations HOD+
router.post(
  "/project/:projectId/complete",
  checkRole(700),
  completeProjectInventory
);

// Resend inventory completion notifications - HOD+
router.post(
  "/:id/resend-notifications",
  checkRole(700),
  resendInventoryNotifications
);

// Export inventory reports - Manager+
router.get("/reports/export", checkRole(600), exportInventoryReport);

// Note: Document uploads are now handled via the centralized /api/documents/upload endpoint

export default router;
