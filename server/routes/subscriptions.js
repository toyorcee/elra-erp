import express from "express";
import {
  getSubscriptionPlans,
  initializeSubscriptionPayment,
  verifySubscriptionPayment,
  getCompanySubscription,
  getAllSubscriptions,
  cancelSubscription,
  updateSubscriptionUsage,
  getSubscriptionStatistics,
  handlePaymentWebhook,
  createTrialSubscription,
  updateSubscriptionPlan,
  getSubscriptionPlan,
} from "../controllers/subscriptionController.js";
import { protect, restrictTo } from "../middleware/auth.js";

const router = express.Router();

// Public routes
router.get("/plans", getSubscriptionPlans);
router.post("/webhook/:provider", handlePaymentWebhook);
router.post("/initialize-payment", initializeSubscriptionPayment);
router.post("/verify-payment", verifySubscriptionPayment);

// Protected routes (Platform Admin only)
router.use(protect);
router.use(restrictTo("PLATFORM_ADMIN"));
router.get("/company/:companyId", getCompanySubscription);
router.get("/", getAllSubscriptions);
router.put("/:id/cancel", cancelSubscription);
router.get("/statistics", getSubscriptionStatistics);
router.post("/trial", createTrialSubscription);

// Plan Management Routes (Platform Admin only)
router.get("/plans/:planName", getSubscriptionPlan);
router.put("/plans/:planName", updateSubscriptionPlan);

// System routes (for internal usage tracking)
router.put("/:id/usage", updateSubscriptionUsage);

export default router;
