import express from "express";
import { body } from "express-validator";
import {
  getAllTeamMembers,
  getTeamMembersByProject,
  addTeamMember,
  updateTeamMember,
  removeTeamMember,
  getAvailableUsers,
} from "../controllers/teamMemberController.js";
import { protect, checkRole } from "../middleware/auth.js";

const router = express.Router();

// Validation middleware
const validateTeamMember = [
  body("projectId")
    .isMongoId()
    .withMessage("Project ID must be a valid MongoDB ID"),
  body("userId").isMongoId().withMessage("User ID must be a valid MongoDB ID"),
  body("role")
    .isIn([
      "project_manager",
      "team_lead",
      "developer",
      "designer",
      "analyst",
      "tester",
      "consultant",
      "support",
      "other",
    ])
    .withMessage("Invalid team member role"),
  body("allocationPercentage")
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage("Allocation percentage must be between 0 and 100"),
];

const validateTeamMemberUpdate = [
  body("role")
    .optional()
    .isIn([
      "project_manager",
      "team_lead",
      "developer",
      "designer",
      "analyst",
      "tester",
      "consultant",
      "support",
      "other",
    ])
    .withMessage("Invalid team member role"),
  body("allocationPercentage")
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage("Allocation percentage must be between 0 and 100"),
  body("status")
    .optional()
    .isIn(["active", "inactive", "removed"])
    .withMessage("Invalid status"),
];

// All routes require authentication
router.use(protect);

// Get all team members (with role-based filtering) - Viewer+
router.get("/", checkRole(100), getAllTeamMembers);

// Get team members by project - Viewer+
router.get("/project/:projectId", checkRole(100), getTeamMembersByProject);

// Get available users for team assignment - Manager+
router.get("/available/:projectId", checkRole(600), getAvailableUsers);

// Add team member to project - Manager+
router.post("/", checkRole(600), validateTeamMember, addTeamMember);

// Update team member - Manager+
router.put("/:id", checkRole(600), validateTeamMemberUpdate, updateTeamMember);

// Remove team member from project - Manager+
router.delete("/:id", checkRole(600), removeTeamMember);

export default router;
