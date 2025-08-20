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
  updateUserSalary,
} from "../controllers/userController.js";
import { protect, checkRole } from "../middleware/auth.js";
import { hasPermission } from "../utils/permissionUtils.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// User management routes - All require HOD (700) or Super Admin (1000) level
router.get("/", checkRole(700), getAllUsers);
router.get("/pending", checkRole(700), getPendingRegistrationUsers);
router.get("/manageable", checkRole(700), getManageableUsers);
router.get("/onboarded", checkRole(700), getOnboardedMembers);
router.get("/profile", getUserProfile);
router.put("/profile", updateUserProfile);
router.get(
  "/assignment-guidance",
  checkRole(700),
  getAssignmentGuidanceForUser
);
router.get("/:id", checkRole(700), getUserById);
router.post("/", checkRole(700), createUser);
router.put("/:id", checkRole(700), updateUser);
router.delete("/:id", checkRole(700), deleteUser);
router.post("/assign-role", checkRole(700), assignRole);
router.put("/:id/salary", checkRole(700), updateUserSalary);

export default router;
