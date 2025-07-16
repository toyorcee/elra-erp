import express from "express";
import { protect } from "../middleware/auth.js";
import {
  uploadProfilePicture,
  handleUploadError,
} from "../middleware/upload.js";
import {
  updateProfile,
  getProfile,
  deleteProfilePicture,
} from "../controllers/profileController.js";

const router = express.Router();

router.use(protect);

// @route   GET /api/profile
// @desc    Get user profile
// @access  Private
router.get("/", getProfile);

// @route   PUT /api/profile
// @desc    Update user profile (with optional file upload)
// @access  Private
router.put("/", uploadProfilePicture, handleUploadError, updateProfile);

// @route   DELETE /api/profile/avatar
// @desc    Delete profile picture
// @access  Private
router.delete("/avatar", deleteProfilePicture);

export default router;
