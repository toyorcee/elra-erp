import express from "express";
import {
  getAllSalaryGrades,
  getSalaryGradeById,
  createSalaryGrade,
  updateSalaryGrade,
  deleteSalaryGrade,
  getSalaryGradesForDropdown,
} from "../controllers/salaryGradeController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// Get all salary grades
router.get("/", getAllSalaryGrades);

// Get salary grades for dropdown (simplified data)
router.get("/dropdown", getSalaryGradesForDropdown);

// Get single salary grade by ID
router.get("/:id", getSalaryGradeById);

// Create new salary grade (Super Admin/HOD only)
router.post("/", createSalaryGrade);

// Update salary grade (Super Admin/HOD only)
router.put("/:id", updateSalaryGrade);

// Delete salary grade (Super Admin/HOD only)
router.delete("/:id", deleteSalaryGrade);

export default router;
