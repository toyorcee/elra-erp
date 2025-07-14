import { body, validationResult } from "express-validator";

// Basic validation middleware
export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }
  next();
};

// User registration validation
export const validateRegistration = [
  body("name")
    .trim()
    .isLength({ min: 2 })
    .withMessage("Name must be at least 2 characters"),
  body("email").isEmail().withMessage("Please enter a valid email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("phone")
    .optional()
    .isMobilePhone()
    .withMessage("Please enter a valid phone number"),
  validateRequest,
];

// Login validation
export const validateLogin = [
  body("email").isEmail().withMessage("Please enter a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
  validateRequest,
];

// Document upload validation
export const validateDocumentUpload = [
  body("title")
    .trim()
    .isLength({ min: 1 })
    .withMessage("Document title is required"),
  body("description").optional().trim(),
  body("category").optional().trim(),
  validateRequest,
];

// Simple email validation
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Simple phone validation (Nigerian format)
export const isValidPhone = (phone) => {
  const phoneRegex = /^(\+234|0)[789][01]\d{8}$/;
  return phoneRegex.test(phone);
};

// Simple password strength check
export const isStrongPassword = (password) => {
  return password.length >= 6;
};

// Validate Nigerian NIN (National Identity Number)
export const isValidNIN = (nin) => {
  const ninRegex = /^\d{11}$/;
  return ninRegex.test(nin);
};

// Validate Nigerian BVN (Bank Verification Number)
export const isValidBVN = (bvn) => {
  const bvnRegex = /^\d{11}$/;
  return bvnRegex.test(bvn);
};
