import express from "express";
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  assignRole,
  getManageableUsers,
  getUserProfile,
  updateUserProfile,
  getPendingRegistrationUsers,
  getAssignmentGuidanceForUser,
  getOnboardedMembers,
} from "../controllers/userController.js";
import { protect } from "../middleware/auth.js";
import { hasPermission } from "../utils/permissionUtils.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// User management routes
router.get("/", getAllUsers);
router.get("/pending", getPendingRegistrationUsers);
router.get("/manageable", getManageableUsers);
router.get("/onboarded", getOnboardedMembers);
router.get("/profile", getUserProfile);
router.put("/profile", updateUserProfile);
router.get("/assignment-guidance", getAssignmentGuidanceForUser);
router.get("/:id", getUserById);
router.post("/", createUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);
router.post("/assign-role", assignRole);

export default router;
