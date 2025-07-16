import User from "../models/User.js";
import { deleteFile, getFileUrl } from "../middleware/upload.js";
import path from "path";

// @desc    Update user profile
// @route   PUT /api/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const updates = req.body;
    const uploadedFile = req.file;

    console.log(
      "🔧 Profile Update - User:",
      req.user.username,
      "(",
      req.user.email,
      ")"
    );
    console.log("📝 Updates:", updates);
    console.log(
      "📁 Uploaded file:",
      uploadedFile ? uploadedFile.filename : "None"
    );

    // Get current user data
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (uploadedFile) {
      if (currentUser.avatar) {
        const oldAvatarPath = path.join(
          process.cwd(),
          "uploads",
          "profile-pictures",
          path.basename(currentUser.avatar)
        );
        deleteFile(oldAvatarPath);
      }

      updates.avatar = getFileUrl(uploadedFile.filename, "profile-pictures");
      console.log("🖼️ Profile picture updated:", updates.avatar);
    }

    if (updates.email && updates.email !== currentUser.email) {
      const existingUser = await User.findOne({ email: updates.email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email already exists",
        });
      }
    }

    // Update user profile
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate("role department");

    console.log("✅ Profile updated successfully");
    console.log("📊 Updated fields:", Object.keys(updates));

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: {
          id: updatedUser._id,
          username: updatedUser.username,
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          phone: updatedUser.phone,
          position: updatedUser.position,
          bio: updatedUser.bio,
          address: updatedUser.address,
          employeeId: updatedUser.employeeId,
          avatar: updatedUser.avatar,
          department: updatedUser.department,
          role: updatedUser.role,
          isActive: updatedUser.isActive,
          lastLogin: updatedUser.lastLogin,
          createdAt: updatedUser.createdAt,
        },
        updatedFields: Object.keys(updates),
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ Profile update error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Get user profile
// @route   GET /api/profile
// @access  Private
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).populate("role department");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          position: user.position,
          bio: user.bio,
          address: user.address,
          employeeId: user.employeeId,
          avatar: user.avatar,
          department: user.department,
          role: user.role,
          isActive: user.isActive,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    console.error("❌ Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get profile",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Delete profile picture
// @route   DELETE /api/profile/avatar
// @access  Private
export const deleteProfilePicture = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.avatar) {
      return res.status(400).json({
        success: false,
        message: "No profile picture to delete",
      });
    }

    // Delete file from filesystem
    const avatarPath = path.join(
      process.cwd(),
      "uploads",
      "profile-pictures",
      path.basename(user.avatar)
    );
    const fileDeleted = deleteFile(avatarPath);

    // Update user record
    user.avatar = null;
    await user.save();

    console.log("🗑️ Profile picture deleted:", {
      user: user.username,
      fileDeleted,
      avatarPath,
    });

    res.status(200).json({
      success: true,
      message: "Profile picture deleted successfully",
      data: {
        avatar: null,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ Delete profile picture error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete profile picture",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
