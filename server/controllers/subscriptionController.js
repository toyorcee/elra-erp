import Subscription from "../models/Subscription.js";
import Company from "../models/Company.js";
import User from "../models/User.js";
import paymentService from "../services/paymentService.js";
import { sendSubscriptionEmail } from "../services/emailService.js";

// @desc    Get available subscription plans
// @route   GET /api/subscriptions/plans
// @access  Public
export const getSubscriptionPlans = async (req, res) => {
  try {
    const plans = Subscription.getPlans();

    res.status(200).json({
      success: true,
      data: plans,
    });
  } catch (error) {
    console.error("Get subscription plans error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch subscription plans",
    });
  }
};

// @desc    Initialize subscription payment (Self-service)
// @route   POST /api/subscriptions/initialize-payment
// @access  Public
export const initializeSubscriptionPayment = async (req, res) => {
  try {
    const {
      companyName,
      companyEmail,
      adminName,
      adminEmail,
      adminPhone,
      plan,
      billingCycle,
      paymentProvider,
    } = req.body;

    // Validate required fields
    if (
      !companyName ||
      !companyEmail ||
      !adminName ||
      !adminEmail ||
      !plan ||
      !billingCycle ||
      !paymentProvider
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Validate plan exists
    const availablePlans = Subscription.getPlans();
    if (!availablePlans[plan]) {
      return res.status(400).json({
        success: false,
        message: "Invalid plan selected",
      });
    }

    // Check if company already exists
    let company = await Company.findOne({ email: companyEmail });

    if (!company) {
      // Create new company
      company = await Company.create({
        name: companyName,
        email: companyEmail,
        industry: "general",
        status: "pending",
        createdBy: null, // Will be set after payment
      });
    } else {
      // Check if company already has an active subscription
      const existingSubscription = await Subscription.findOne({
        company: company._id,
        status: { $in: ["active", "trial"] },
      });

      if (existingSubscription) {
        return res.status(400).json({
          success: false,
          message: "Company already has an active subscription",
        });
      }
    }

    // Calculate amount
    const planDetails = availablePlans[plan];
    const amount =
      billingCycle === "yearly"
        ? planDetails.price.yearly
        : planDetails.price.monthly;
    const currency = paymentService.getCurrencyForProvider(paymentProvider);

    // Generate payment reference
    const reference = paymentService.generatePaymentReference();

    // Create subscription record
    const subscription = await Subscription.create({
      company: company._id,
      plan: {
        name: plan,
        displayName: planDetails.displayName,
        price: planDetails.price,
        features: planDetails.features,
        description: planDetails.description,
      },
      billingCycle,
      payment: {
        provider: paymentProvider,
        amount,
        currency,
        status: "pending",
      },
      status: "inactive",
      createdBy: null, // Will be set after payment
    });

    // Initialize payment based on provider
    let paymentResult;

    switch (paymentProvider) {
      case "paystack":
        paymentResult = await paymentService.initializePaystackPayment({
          email: adminEmail,
          amount: amount * 100, // Paystack expects amount in kobo (smallest currency unit)
          reference,
          callback_url: `${process.env.CLIENT_URL}/subscription/callback?reference=${reference}`,
          metadata: {
            subscriptionId: subscription._id.toString(),
            companyId: company._id.toString(),
            plan,
            billingCycle,
            companyName,
            adminName,
            adminEmail,
            adminPhone,
          },
        });
        break;

      case "stripe":
        paymentResult = await paymentService.createStripePaymentIntent({
          amount: amount * 100, // Stripe expects amount in cents
          currency,
          metadata: {
            subscriptionId: subscription._id.toString(),
            companyId: company._id.toString(),
            plan,
            billingCycle,
            companyName,
            adminName,
            adminEmail,
            adminPhone,
          },
        });
        break;

      case "paypal":
        paymentResult = await paymentService.createPaypalOrder({
          amount,
          currency,
          description: `EDMS ${planDetails.displayName} subscription - ${billingCycle}`,
          custom_id: subscription._id.toString(),
        });
        break;

      default:
        return res.status(400).json({
          success: false,
          message: "Unsupported payment provider",
        });
    }

    if (!paymentResult.success) {
      // Delete the subscription record if payment initialization failed
      await Subscription.findByIdAndDelete(subscription._id);

      return res.status(400).json({
        success: false,
        message: paymentResult.error,
      });
    }

    // Update subscription with payment details
    subscription.payment.transactionId =
      paymentResult.data.transactionId ||
      paymentResult.data.paymentIntentId ||
      paymentResult.data.orderId;
    await subscription.save();

    res.status(200).json({
      success: true,
      data: {
        subscription,
        payment: paymentResult.data,
        redirectUrl:
          paymentResult.authorization_url || paymentResult.data.approvalUrl,
        reference,
      },
    });
  } catch (error) {
    console.error("Initialize subscription payment error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to initialize payment",
    });
  }
};

// @desc    Verify payment and activate subscription (Self-service)
// @route   POST /api/subscriptions/verify-payment
// @access  Public
export const verifySubscriptionPayment = async (req, res) => {
  try {
    const { reference, paymentProvider } = req.body;

    if (!reference || !paymentProvider) {
      return res.status(400).json({
        success: false,
        message: "Reference and payment provider are required",
      });
    }

    // Find subscription by payment reference
    const subscription = await Subscription.findOne({
      "payment.transactionId": reference,
    }).populate("company");

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found",
      });
    }

    // Verify payment based on provider
    let verificationResult;

    switch (paymentProvider) {
      case "paystack":
        verificationResult = await paymentService.verifyPaystackPayment(
          reference
        );
        break;

      case "stripe":
        verificationResult = await paymentService.confirmStripePayment(
          reference
        );
        break;

      case "paypal":
        verificationResult = await paymentService.capturePaypalPayment(
          reference
        );
        break;

      default:
        return res.status(400).json({
          success: false,
          message: "Unsupported payment provider",
        });
    }

    if (!verificationResult.success) {
      return res.status(400).json({
        success: false,
        message: verificationResult.error,
      });
    }

    const paymentInfo = verificationResult.data;

    // Update subscription with payment details
    subscription.payment.status =
      paymentInfo.status === "success" || paymentInfo.status === "succeeded"
        ? "completed"
        : "failed";
    subscription.payment.transactionId = paymentInfo.transactionId || reference;
    subscription.payment.paymentMethod = paymentInfo.paymentMethod;
    subscription.payment.lastBillingDate = paymentInfo.paidAt || new Date();
    subscription.payment.nextBillingDate = new Date(
      paymentInfo.paidAt || new Date()
    );

    if (subscription.billingCycle === "monthly") {
      subscription.payment.nextBillingDate.setMonth(
        subscription.payment.nextBillingDate.getMonth() + 1
      );
    } else {
      subscription.payment.nextBillingDate.setFullYear(
        subscription.payment.nextBillingDate.getFullYear() + 1
      );
    }

    // Activate subscription if payment is successful
    if (subscription.payment.status === "completed") {
      subscription.status = "active";
      subscription.startDate = new Date();

      // Set trial end date (7 days from now)
      subscription.trialEndDate = new Date();
      subscription.trialEndDate.setDate(
        subscription.trialEndDate.getDate() + 7
      );
    }

    await subscription.save();

    // Send subscription activation email
    if (subscription.status === "active") {
      await sendSubscriptionEmail(
        subscription.company.email ||
          "admin@" +
            subscription.company.name.toLowerCase().replace(/\s+/g, "") +
            ".com",
        subscription.company.name,
        subscription.plan.displayName,
        subscription.billingCycle
      );
    }

    res.status(200).json({
      success: true,
      data: {
        subscription,
        payment: paymentInfo,
      },
    });
  } catch (error) {
    console.error("Verify subscription payment error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify payment",
    });
  }
};

// @desc    Get company subscription
// @route   GET /api/subscriptions/company/:companyId
// @access  Private (Platform Admin)
export const getCompanySubscription = async (req, res) => {
  try {
    const currentUser = req.user;
    const { companyId } = req.params;

    // Check if user is platform admin
    if (currentUser.role.level < 110) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Platform admin privileges required.",
      });
    }

    const subscription = await Subscription.findOne({ company: companyId })
      .populate("company", "name email")
      .populate("createdBy", "firstName lastName email")
      .populate("updatedBy", "firstName lastName email");

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found",
      });
    }

    res.status(200).json({
      success: true,
      data: subscription,
    });
  } catch (error) {
    console.error("Get company subscription error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch subscription",
    });
  }
};

// @desc    Get all subscriptions
// @route   GET /api/subscriptions
// @access  Private (Platform Admin)
export const getAllSubscriptions = async (req, res) => {
  try {
    const currentUser = req.user;
    const { page = 1, limit = 10, status, plan } = req.query;

    // Check if user is platform admin
    if (currentUser.role.level < 110) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Platform admin privileges required.",
      });
    }

    // Build query
    const query = {};
    if (status) query.status = status;
    if (plan) query["plan.name"] = plan;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get subscriptions
    const subscriptions = await Subscription.find(query)
      .populate("company", "name email")
      .populate("createdBy", "firstName lastName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await Subscription.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        subscriptions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error("Get all subscriptions error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch subscriptions",
    });
  }
};

// @desc    Cancel subscription
// @route   PUT /api/subscriptions/:id/cancel
// @access  Private (Platform Admin)
export const cancelSubscription = async (req, res) => {
  try {
    const currentUser = req.user;
    const { id } = req.params;

    // Check if user is platform admin
    if (currentUser.role.level < 110) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Platform admin privileges required.",
      });
    }

    const subscription = await Subscription.findById(id);
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found",
      });
    }

    subscription.status = "cancelled";
    subscription.autoRenew = false;
    subscription.updatedBy = currentUser._id;
    await subscription.save();

    res.status(200).json({
      success: true,
      message: "Subscription cancelled successfully",
      data: subscription,
    });
  } catch (error) {
    console.error("Cancel subscription error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel subscription",
    });
  }
};

// @desc    Update subscription usage
// @route   PUT /api/subscriptions/:id/usage
// @access  Private (System)
export const updateSubscriptionUsage = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      currentUsers,
      currentStorage,
      currentDepartments,
      documentsUploaded,
    } = req.body;

    const subscription = await Subscription.findById(id);
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found",
      });
    }

    // Update usage
    subscription.usage.currentUsers =
      currentUsers || subscription.usage.currentUsers;
    subscription.usage.currentStorage =
      currentStorage || subscription.usage.currentStorage;
    subscription.usage.currentDepartments =
      currentDepartments || subscription.usage.currentDepartments;
    subscription.usage.documentsUploaded =
      documentsUploaded || subscription.usage.documentsUploaded;
    subscription.usage.lastUsageUpdate = new Date();

    await subscription.save();

    res.status(200).json({
      success: true,
      data: subscription.usage,
    });
  } catch (error) {
    console.error("Update subscription usage error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update usage",
    });
  }
};

// @desc    Get subscription statistics
// @route   GET /api/subscriptions/statistics
// @access  Private (Platform Admin)
export const getSubscriptionStatistics = async (req, res) => {
  try {
    const currentUser = req.user;

    // Check if user is platform admin
    if (currentUser.role.level < 110) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Platform admin privileges required.",
      });
    }

    // Get subscription statistics
    const totalSubscriptions = await Subscription.countDocuments();
    const activeSubscriptions = await Subscription.countDocuments({
      status: "active",
    });
    const trialSubscriptions = await Subscription.countDocuments({
      status: "trial",
    });
    const cancelledSubscriptions = await Subscription.countDocuments({
      status: "cancelled",
    });

    // Get subscriptions by plan
    const subscriptionsByPlan = await Subscription.aggregate([
      {
        $group: {
          _id: "$plan.name",
          count: { $sum: 1 },
          totalRevenue: { $sum: "$payment.amount" },
        },
      },
    ]);

    // Get monthly revenue
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const monthlyRevenue = await Subscription.aggregate([
      {
        $match: {
          createdAt: { $gte: currentMonth },
          "payment.status": "completed",
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$payment.amount" },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalSubscriptions,
        activeSubscriptions,
        trialSubscriptions,
        cancelledSubscriptions,
        subscriptionsByPlan,
        monthlyRevenue: monthlyRevenue[0]?.total || 0,
      },
    });
  } catch (error) {
    console.error("Get subscription statistics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
    });
  }
};

// @desc    Webhook handler for payment providers
// @route   POST /api/subscriptions/webhook/:provider
// @access  Public
export const handlePaymentWebhook = async (req, res) => {
  try {
    const { provider } = req.params;
    const signature =
      req.headers["x-paystack-signature"] ||
      req.headers["stripe-signature"] ||
      req.headers["paypal-transmission-id"];
    const body = req.body;

    let isValid = false;
    let event = null;

    // Verify webhook signature based on provider
    switch (provider) {
      case "paystack":
        isValid = paymentService.verifyPaystackWebhook(signature, body);
        if (isValid && body.event === "charge.success") {
          event = body.data;
        }
        break;

      case "stripe":
        const stripeResult = paymentService.verifyStripeWebhook(
          signature,
          body,
          process.env.STRIPE_WEBHOOK_SECRET
        );
        isValid = stripeResult.valid;
        if (isValid && stripeResult.event.type === "payment_intent.succeeded") {
          event = stripeResult.event.data.object;
        }
        break;

      case "paypal":
        // PayPal webhook verification would go here
        isValid = true; // Simplified for now
        if (body.event_type === "PAYMENT.CAPTURE.COMPLETED") {
          event = body.resource;
        }
        break;

      default:
        return res.status(400).json({
          success: false,
          message: "Unsupported payment provider",
        });
    }

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid webhook signature",
      });
    }

    if (!event) {
      return res.status(200).json({
        success: true,
        message: "Webhook received but no action needed",
      });
    }

    // Process the payment event
    // This would typically involve updating the subscription status
    // and sending notifications

    res.status(200).json({
      success: true,
      message: "Webhook processed successfully",
    });
  } catch (error) {
    console.error("Payment webhook error:", error);
    res.status(500).json({
      success: false,
      message: "Webhook processing failed",
    });
  }
};

// @desc    Create trial subscription
// @route   POST /api/subscriptions/trial
// @access  Private (Platform Admin)
export const createTrialSubscription = async (req, res) => {
  try {
    const currentUser = req.user;
    const { companyId, plan, trialDays = 7 } = req.body;

    // Check if user is platform admin
    if (currentUser.role.level < 110) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Platform admin privileges required.",
      });
    }

    // Validate company exists
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    // Check if company already has an active subscription
    const existingSubscription = await Subscription.findOne({
      company: companyId,
      status: { $in: ["active", "trial"] },
    });

    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        message: "Company already has an active subscription",
      });
    }

    // Create trial subscription
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + trialDays);

    const subscription = await Subscription.create({
      company: companyId,
      plan: {
        name: plan,
        displayName: Subscription.getPlans()[plan]?.displayName || plan,
        price: {
          monthly: Subscription.getPlans()[plan]?.price.monthly || 0,
          yearly: Subscription.getPlans()[plan]?.price.yearly || 0,
        },
        features: Subscription.getPlans()[plan]?.features || {},
        description: Subscription.getPlans()[plan]?.description || "",
      },
      billingCycle: "monthly",
      payment: {
        provider: "trial",
        amount: 0,
        currency: "USD",
        status: "completed",
      },
      status: "trial",
      trialEndDate,
      createdBy: currentUser._id,
    });

    res.status(201).json({
      success: true,
      data: subscription,
      message: `Trial subscription created for ${trialDays} days`,
    });
  } catch (error) {
    console.error("Create trial subscription error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create trial subscription",
    });
  }
};
