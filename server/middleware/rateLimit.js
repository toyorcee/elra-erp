import rateLimit from "express-rate-limit";

// Rate limiter for password reset attempts
export const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Limit each IP to 3 password reset requests per 15 minutes
  message: {
    success: false,
    message:
      "Too many password reset attempts. Please try again in 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.log(`🚨 Rate limit exceeded for password reset: ${req.ip}`);
    res.status(429).json({
      success: false,
      message:
        "Too many password reset attempts. Please try again in 15 minutes.",
    });
  },
});

// Rate limiter for login attempts
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per 15 minutes
  message: {
    success: false,
    message: "Too many login attempts. Please try again in 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.log(`🚨 Rate limit exceeded for login: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: "Too many login attempts. Please try again in 15 minutes.",
    });
  },
});

// Rate limiter for registration attempts
export const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 registration attempts per hour
  message: {
    success: false,
    message: "Too many registration attempts. Please try again in 1 hour.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.log(`🚨 Rate limit exceeded for registration: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: "Too many registration attempts. Please try again in 1 hour.",
    });
  },
});
