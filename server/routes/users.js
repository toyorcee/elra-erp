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
} from "../controllers/userController.js";
import { protect } from "../middleware/auth.js";
import { checkPlanLimits } from "../middleware/planLimits.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// User management routes
router.get("/", getAllUsers);
router.get("/manageable", getManageableUsers);
router.get("/profile", getUserProfile);
router.put("/profile", updateUserProfile);
router.get("/:id", getUserById);
router.post("/", checkPlanLimits("createUser"), createUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);
router.post("/assign-role", assignRole);

export default router;
