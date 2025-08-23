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
  updateAvatar,
} from "../controllers/profileController.js";

const router = express.Router();

router.use(protect);

// @route   GET /api/profile
// @desc    Get user profile
// @access  Private
router.get("/", getProfile);

// @route   PUT /api/profile
// @desc    Update user profile (text fields only)
// @access  Private
router.put("/", updateProfile);

// @route   PUT /api/profile/avatar
// @desc    Update profile avatar only
// @access  Private
router.put("/avatar", uploadProfilePicture, handleUploadError, updateAvatar);

// @route   DELETE /api/profile/avatar
// @desc    Delete profile picture
// @access  Private
router.delete("/avatar", deleteProfilePicture);

export default router;
