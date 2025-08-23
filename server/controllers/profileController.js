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
    console.log("📝 Raw updates received:", updates);
    console.log(
      "📁 Uploaded file:",
      uploadedFile ? uploadedFile.filename : "None"
    );

    // Get current user data BEFORE update
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    console.log("🔍 Current user data BEFORE update:", {
      city: currentUser.city,
      state: currentUser.state,
      zipCode: currentUser.zipCode,
      dateOfBirth: currentUser.dateOfBirth,
      emergencyContact: currentUser.emergencyContact,
      skills: currentUser.skills,
      certifications: currentUser.certifications,
      workExperience: currentUser.workExperience,
      education: currentUser.education,
    });

    // Validate only the fields that are being updated
    const validationErrors = [];

    // Only validate firstName if it's being updated
    if (updates.firstName !== undefined) {
      if (!updates.firstName || updates.firstName.trim() === "") {
        validationErrors.push("First name is required");
      }
    }

    // Only validate lastName if it's being updated
    if (updates.lastName !== undefined) {
      if (!updates.lastName || updates.lastName.trim() === "") {
        validationErrors.push("Last name is required");
      }
    }

    // Only validate email if it's being updated
    if (updates.email !== undefined) {
      if (!updates.email || updates.email.trim() === "") {
        validationErrors.push("Email is required");
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(updates.email)) {
          validationErrors.push("Invalid email format");
        }
      }
    }

    // Phone number validation (only if being updated)
    if (
      updates.phone !== undefined &&
      updates.phone &&
      updates.phone.trim() !== ""
    ) {
      const phoneRegex = /^[\+]?[0-9\s\-\(\)]{7,15}$/;
      const cleanPhone = updates.phone.replace(/[\s\-\(\)]/g, "");
      if (cleanPhone.length < 7 || cleanPhone.length > 15) {
        validationErrors.push("Phone number must be between 7-15 digits");
      }
    }

    // Date of birth validation (only if being updated)
    if (
      updates.dateOfBirth !== undefined &&
      updates.dateOfBirth &&
      updates.dateOfBirth.trim() !== ""
    ) {
      const dateFormats = [
        /^\d{2}\/\d{2}\/\d{4}$/,
        /^\d{4}-\d{2}-\d{2}$/,
        /^\d{2}-\d{2}-\d{4}$/,
        /^\d{1,2}\/\d{1,2}\/\d{4}$/,
      ];

      const isValidDate = dateFormats.some((format) =>
        format.test(updates.dateOfBirth)
      );
      if (!isValidDate) {
        validationErrors.push(
          "Date of birth must be in DD/MM/YYYY, YYYY-MM-DD, or DD-MM-YYYY format"
        );
      }
    }

    // Return validation errors if any
    if (validationErrors.length > 0) {
      console.log("❌ Validation errors:", validationErrors);
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationErrors,
        fieldErrors: {
          firstName:
            updates.firstName !== undefined &&
            (!updates.firstName || updates.firstName.trim() === "")
              ? "First name is required"
              : null,
          lastName:
            updates.lastName !== undefined &&
            (!updates.lastName || updates.lastName.trim() === "")
              ? "Last name is required"
              : null,
          email:
            updates.email !== undefined &&
            (!updates.email || updates.email.trim() === "")
              ? "Email is required"
              : updates.email !== undefined &&
                updates.email &&
                !emailRegex.test(updates.email)
              ? "Invalid email format"
              : null,
          phone:
            updates.phone !== undefined &&
            updates.phone &&
            updates.phone.trim() !== "" &&
            (() => {
              const cleanPhone = updates.phone.replace(/[\s\-\(\)]/g, "");
              return cleanPhone.length < 7 || cleanPhone.length > 15;
            })()
              ? "Phone number must be between 7-15 digits"
              : null,
          dateOfBirth:
            updates.dateOfBirth !== undefined &&
            updates.dateOfBirth &&
            updates.dateOfBirth.trim() !== "" &&
            (() => {
              const dateFormats = [
                /^\d{2}\/\d{2}\/\d{4}$/, // DD/MM/YYYY
                /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
                /^\d{2}-\d{2}-\d{4}$/, // DD-MM-YYYY
                /^\d{1,2}\/\d{1,2}\/\d{4}$/, // D/M/YYYY or DD/MM/YYYY
              ];
              return !dateFormats.some((format) =>
                format.test(updates.dateOfBirth)
              );
            })()
              ? "Date of birth must be in DD/MM/YYYY, YYYY-MM-DD, or DD-MM-YYYY format"
              : null,
        },
      });
    }

    // Remove protected fields that should not be updated via profile
    delete updates.position; // Position is set during invitation and cannot be changed
    delete updates.employeeId; // Employee ID is auto-generated and cannot be changed
    delete updates.role; // Role cannot be changed via profile update
    delete updates.department; // Department cannot be changed via profile update

    console.log("🔧 Updates after removing protected fields:", updates);

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

    // Handle emergencyContact if it's a string (JSON)
    if (
      updates.emergencyContact &&
      typeof updates.emergencyContact === "string"
    ) {
      try {
        updates.emergencyContact = JSON.parse(updates.emergencyContact);
        console.log("🔧 Parsed emergencyContact:", updates.emergencyContact);
      } catch (error) {
        console.log("⚠️ Failed to parse emergencyContact JSON:", error.message);
        delete updates.emergencyContact;
      }
    }

    // Handle skills, certifications, workExperience, education if they're arrays
    if (updates.skills && Array.isArray(updates.skills)) {
      updates.skills = updates.skills[0] || "";
    }
    if (updates.certifications && Array.isArray(updates.certifications)) {
      updates.certifications = updates.certifications[0] || "";
    }
    if (updates.workExperience && Array.isArray(updates.workExperience)) {
      updates.workExperience = updates.workExperience[0] || "";
    }
    if (updates.education && Array.isArray(updates.education)) {
      updates.education = updates.education[0] || "";
    }

    console.log("🔧 Final updates to be saved:", updates);

    const updatedUser = await User.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true,
    }).populate("role department");

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found or update failed",
      });
    }

    console.log("✅ Profile updated successfully");
    console.log("📊 Updated fields:", Object.keys(updates));
    console.log("📝 Raw updates received:", updates);
    console.log("🔍 Database update result - User fields:");
    console.log("  - city:", updatedUser.city);
    console.log("  - state:", updatedUser.state);
    console.log("  - zipCode:", updatedUser.zipCode);
    console.log("  - dateOfBirth:", updatedUser.dateOfBirth);
    console.log("  - emergencyContact:", updatedUser.emergencyContact);
    console.log("  - skills:", updatedUser.skills);
    console.log("  - certifications:", updatedUser.certifications);
    console.log("  - workExperience:", updatedUser.workExperience);
    console.log("  - education:", updatedUser.education);
    console.log("  - bio:", updatedUser.bio);
    console.log("  - phone:", updatedUser.phone);
    console.log("🔍 User data AFTER update:", {
      city: updatedUser.city,
      state: updatedUser.state,
      zipCode: updatedUser.zipCode,
      dateOfBirth: updatedUser.dateOfBirth,
      emergencyContact: updatedUser.emergencyContact,
      skills: updatedUser.skills,
      certifications: updatedUser.certifications,
      workExperience: updatedUser.workExperience,
      education: updatedUser.education,
    });

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: updatedUser,
        updatedFields: Object.keys(updates),
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ Profile update error:", error);

    // Handle specific validation errors
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map(
        (err) => err.message
      );
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationErrors,
      });
    }

    // Handle file upload errors
    if (error.message && error.message.includes("Unexpected file field")) {
      return res.status(400).json({
        success: false,
        message:
          "File upload error: Please ensure you're uploading a valid image file",
        error:
          "Unexpected file field detected. Make sure the file field is named 'avatar' and contains a valid image.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Update user avatar only
// @route   PUT /api/profile/avatar
// @access  Private
export const updateAvatar = async (req, res) => {
  try {
    const userId = req.user.id;
    const uploadedFile = req.file;

    console.log(
      "🖼️ Avatar Update - User:",
      req.user.username,
      "(",
      req.user.email,
      ")"
    );

    if (!uploadedFile) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    // Get current user data
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Delete old avatar if exists
    if (currentUser.avatar) {
      const oldAvatarPath = path.join(
        process.cwd(),
        "uploads",
        "profile-pictures",
        path.basename(currentUser.avatar)
      );
      deleteFile(oldAvatarPath);
    }

    // Update avatar URL
    const avatarUrl = getFileUrl(uploadedFile.filename, "profile-pictures");

    // Update user avatar
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { avatar: avatarUrl },
      { new: true, runValidators: true }
    ).populate("role department");

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found or update failed",
      });
    }

    console.log("✅ Avatar updated successfully:", avatarUrl);

    res.status(200).json({
      success: true,
      message: "Avatar updated successfully",
      data: {
        user: updatedUser,
        avatarUrl: avatarUrl,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ Avatar update error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update avatar",
      error: error.message,
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

    console.log("🔍 [getProfile] User data from database:");
    console.log("  - city:", user.city);
    console.log("  - state:", user.state);
    console.log("  - zipCode:", user.zipCode);
    console.log("  - dateOfBirth:", user.dateOfBirth);
    console.log("  - emergencyContact:", user.emergencyContact);
    console.log("  - skills:", user.skills);
    console.log("  - certifications:", user.certifications);
    console.log("  - workExperience:", user.workExperience);
    console.log("  - education:", user.education);
    console.log("  - bio:", user.bio);
    console.log("  - phone:", user.phone);

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
          // Add the missing fields
          city: user.city,
          state: user.state,
          zipCode: user.zipCode,
          dateOfBirth: user.dateOfBirth,
          emergencyContact: user.emergencyContact,
          skills: user.skills,
          certifications: user.certifications,
          workExperience: user.workExperience,
          education: user.education,
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
