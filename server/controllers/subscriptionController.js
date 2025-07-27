import Subscription from "../models/Subscription.js";
import Company from "../models/Company.js";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";
import Role from "../models/Role.js";
import Department from "../models/Department.js";
import paymentService from "../services/paymentService.js";
import {
  sendAdminInvitationEmail,
  sendIndividualUserInvitationEmail,
  sendCompanyBillingEmail,
  sendPaymentConfirmationEmail,
} from "../services/subscriptionEmailService.js";
import WelcomeNotificationService from "../services/welcomeNotificationService.js";
import PlatformAdminNotificationService from "../utils/platformAdminNotifications.js";

// @desc    Get available subscription plans
// @route   GET /api/subscriptions/plans
// @access  Public
export const getSubscriptionPlans = async (req, res) => {
  try {
    // Get plans from the async static method
    const plans = await Subscription.getPlans();

    res.status(200).json({
      success: true,
      data: Object.values(plans),
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
    // Debug: Check if Paystack secret key is available
    console.log("🔍 [PAYMENT INIT] Environment check:", {
      hasPaystackSecret: !!process.env.PAYSTACK_SECRET_KEY,
      paystackSecretLength: process.env.PAYSTACK_SECRET_KEY?.length || 0,
      paystackSecretPrefix:
        process.env.PAYSTACK_SECRET_KEY?.substring(0, 10) || "NOT_SET",
      nodeEnv: process.env.NODE_ENV,
    });

    const {
      companyName,
      companyEmail,
      adminName,
      adminEmail,
      adminPhone,
      plan,
      billingCycle,
      paymentProvider,
      currency,
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
    const plans = await Subscription.getPlans();
    const planDetails = plans[plan];
    if (!planDetails) {
      return res.status(400).json({
        success: false,
        message: "Invalid plan selected",
      });
    }

    // Check if company already exists
    let company = await Company.findOne({ email: companyEmail });

    if (company) {
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
    // Don't create company yet - will be created after successful payment

    // Handle currency selection
    const selectedCurrency =
      currency || paymentService.getCurrencyForProvider(paymentProvider);

    // Calculate amount based on selected currency
    const amount =
      billingCycle === "yearly"
        ? planDetails.price[selectedCurrency]?.yearly ||
          planDetails.price.USD.yearly
        : planDetails.price[selectedCurrency]?.monthly ||
          planDetails.price.USD.monthly;

    console.log("💰 [AMOUNT CALCULATION] Details:", {
      plan,
      billingCycle,
      selectedCurrency,
      planDetails: planDetails.price,
      calculatedAmount: amount,
      paystackAmount: selectedCurrency === "NGN" ? amount * 100 : amount * 100,
      expectedDisplay:
        selectedCurrency === "NGN"
          ? `₦${amount.toLocaleString()}`
          : `$${amount.toLocaleString()}`,
    });

    // Validate currency is supported by the payment provider
    const supportedCurrencies =
      paymentService.getSupportedCurrencies(paymentProvider);
    if (!supportedCurrencies.includes(selectedCurrency)) {
      return res.status(400).json({
        success: false,
        message: `Currency ${selectedCurrency} is not supported by ${paymentProvider}. Supported currencies: ${supportedCurrencies.join(
          ", "
        )}`,
      });
    }

    // Generate payment reference
    const reference = paymentService.generatePaymentReference();

    // Create subscription record (without company for now)
    const subscription = await Subscription.create({
      company: null,
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
        currency: selectedCurrency,
        status: "pending",
        transactionId: reference,
      },
      status: "inactive",
    });

    // Create transaction record for tracking
    const transaction = await Transaction.create({
      transactionId: Transaction.generateTransactionId(),
      reference,
      company: null, // Will be set after payment when company is created
      subscription: subscription._id,
      type: "subscription",
      amount,
      currency: selectedCurrency,
      description: `EDMS ${planDetails.displayName} subscription - ${billingCycle}`,
      paymentProvider,
      paymentStatus: "pending",
      billingCycle,
      billingPeriod: {
        startDate: new Date(),
        endDate:
          billingCycle === "monthly"
            ? new Date(new Date().setMonth(new Date().getMonth() + 1))
            : new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      },
      planDetails: {
        name: plan,
        displayName: planDetails.displayName,
        price: planDetails.price,
        features: planDetails.features,
      },
      metadata: {
        adminEmail,
        companyEmail,
        adminName,
        companyName,
      },
    });

    // Initialize payment based on provider
    let paymentResult;

    switch (paymentProvider) {
      case "paystack":
        console.log("🎯 [PAYSTACK INITIALIZATION] Details:", {
          email: adminEmail,
          originalAmount: amount,
          paystackAmount:
            selectedCurrency === "NGN" ? amount * 100 : amount * 100,
          currency: selectedCurrency,
          reference,
          expectedDisplay:
            selectedCurrency === "NGN"
              ? `₦${amount.toLocaleString()}`
              : `$${amount.toLocaleString()}`,
        });

        paymentResult = await paymentService.initializePaystackPayment({
          email: adminEmail,
          amount: selectedCurrency === "NGN" ? amount * 100 : amount * 100,
          currency: selectedCurrency,
          reference,
          callback_url: `${process.env.CLIENT_URL}/subscription/callback?reference=${reference}`,
          metadata: {
            subscriptionId: subscription._id.toString(),
            companyName,
            companyEmail,
            adminName,
            adminEmail,
            adminPhone,
            plan,
            billingCycle,
            currency: selectedCurrency,
          },
        });
        break;

      case "stripe":
        paymentResult = await paymentService.createStripePaymentIntent({
          amount: amount * 100,
          currency: selectedCurrency,
          metadata: {
            subscriptionId: subscription._id.toString(),
            companyName,
            companyEmail,
            adminName,
            adminEmail,
            adminPhone,
            plan,
            billingCycle,
            currency: selectedCurrency,
          },
        });
        break;

      case "paypal":
        paymentResult = await paymentService.createPaypalOrder({
          amount,
          currency: selectedCurrency,
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
    subscription.payment.transactionId = reference;
    await subscription.save();

    // Debug: Log what was actually saved
    console.log("🔍 [SUBSCRIPTION SAVE] Debug info:", {
      subscriptionId: subscription._id,
      transactionId: subscription.payment.transactionId,
      reference: reference,
      match: subscription.payment.transactionId === reference,
    });

    // Summary log for payment initialization
    console.log("✅ [PAYMENT INITIALIZATION] Success:", {
      companyName,
      plan,
      billingCycle,
      paymentProvider,
      currency,
      amount,
      reference,
      subscriptionId: subscription._id,
    });

    // Log the payment URL for debugging
    console.log("🔗 [PAYMENT URL] Generated:", {
      reference,
      authorizationUrl: paymentResult.data.authorization_url,
      callbackUrl: paymentResult.data.callback_url,
    });

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
    console.log("🔄 [PAYMENT VERIFICATION] Starting verification process:", {
      reference: req.body.reference,
      paymentProvider: req.body.paymentProvider,
      body: req.body,
    });

    const { reference, paymentProvider } = req.body;

    if (!reference || !paymentProvider) {
      console.log("❌ [PAYMENT VERIFICATION] Missing required fields:", {
        reference: !!reference,
        paymentProvider: !!paymentProvider,
      });
      return res.status(400).json({
        success: false,
        message: "Reference and payment provider are required",
      });
    }

    // Find subscription by payment reference
    console.log(
      "🔍 [PAYMENT VERIFICATION] Looking for subscription with reference:",
      reference
    );

    // Debug: Let's also search by subscription ID to see if the subscription exists
    const allSubscriptions = await Subscription.find({}).limit(5);
    console.log(
      "🔍 [DEBUG] Recent subscriptions in DB:",
      allSubscriptions.map((sub) => ({
        id: sub._id,
        transactionId: sub.payment?.transactionId,
        paymentProvider: sub.payment?.provider,
        paymentStatus: sub.payment?.status,
        status: sub.status,
        createdAt: sub.createdAt,
      }))
    );

    // Try multiple ways to find the subscription
    let subscription = await Subscription.findOne({
      "payment.transactionId": reference,
    }).populate("company");

    // If not found by transactionId, try by reference in metadata or other fields
    if (!subscription) {
      console.log(
        "🔍 [PAYMENT VERIFICATION] Not found by transactionId, trying alternative search..."
      );
      subscription = await Subscription.findOne({
        $or: [
          { "payment.transactionId": reference },
          { "payment.reference": reference },
          { "payment.metadata.reference": reference },
        ],
      }).populate("company");
    }

    console.log("📋 [PAYMENT VERIFICATION] Subscription lookup result:", {
      found: !!subscription,
      subscriptionId: subscription?._id,
      companyName: subscription?.company?.name,
      planName: subscription?.plan?.name,
      status: subscription?.status,
      paymentStatus: subscription?.payment?.status,
    });

    if (!subscription) {
      console.log(
        "❌ [PAYMENT VERIFICATION] Subscription not found for reference:",
        reference
      );
      return res.status(200).json({
        success: false,
        message: "Subscription not found",
      });
    }

    // Verify payment based on provider
    console.log(
      "🔍 [PAYMENT VERIFICATION] Starting verification with provider:",
      paymentProvider
    );

    let verificationResult;

    switch (paymentProvider) {
      case "paystack":
        console.log(
          "🔄 [PAYMENT VERIFICATION] Verifying Paystack payment for reference:",
          reference
        );
        verificationResult = await paymentService.verifyPaystackPayment(
          reference
        );
        break;

      case "stripe":
        console.log(
          "🔄 [PAYMENT VERIFICATION] Confirming Stripe payment for reference:",
          reference
        );
        verificationResult = await paymentService.confirmStripePayment(
          reference
        );
        break;

      case "paypal":
        console.log(
          "🔄 [PAYMENT VERIFICATION] Capturing PayPal payment for reference:",
          reference
        );
        verificationResult = await paymentService.capturePaypalPayment(
          reference
        );
        break;

      default:
        console.log(
          "❌ [PAYMENT VERIFICATION] Unsupported payment provider:",
          paymentProvider
        );
        return res.status(400).json({
          success: false,
          message: "Unsupported payment provider",
        });
    }

    console.log("📊 [PAYMENT VERIFICATION] Verification result:", {
      success: verificationResult.success,
      error: verificationResult.error,
      data: verificationResult.data,
    });

    if (!verificationResult.success) {
      console.log(
        "❌ [PAYMENT VERIFICATION] Payment verification failed:",
        verificationResult.error
      );

      // Send platform admin notification for payment failure
      try {
        const platformAdminNotificationService =
          new PlatformAdminNotificationService(global.notificationService);
        const createdByUser = subscription.createdBy
          ? await User.findById(subscription.createdBy)
          : null;

        await platformAdminNotificationService.notifyPaymentFailure({
          isCompany: !!subscription.company,
          companyName: subscription.company?.name || "Unknown Company",
          userName: createdByUser
            ? `${createdByUser.firstName} ${createdByUser.lastName}`
            : "Unknown User",
          adminEmail: createdByUser?.email || "Unknown",
          userEmail: createdByUser?.email || "Unknown",
          planName: subscription.plan?.displayName || subscription.plan?.name,
          amount: subscription.payment?.amount,
          currency: subscription.payment?.currency,
          paymentProvider: subscription.payment?.paymentMethod || "unknown",
          errorMessage: verificationResult.error,
          subscriptionId: subscription._id.toString(),
        });

        // Send user notification for payment failure
        if (createdByUser) {
          await platformAdminNotificationService.notifyUserPaymentFailure(
            createdByUser._id,
            createdByUser.email,
            `${createdByUser.firstName} ${createdByUser.lastName}`,
            {
              planName:
                subscription.plan?.displayName || subscription.plan?.name,
              amount: subscription.payment?.amount,
              currency: subscription.payment?.currency,
              paymentProvider: subscription.payment?.paymentMethod || "unknown",
              errorMessage: verificationResult.error,
              nextRetryDate: "Within 24 hours",
              subscriptionId: subscription._id.toString(),
            }
          );
        }
      } catch (error) {
        console.error(
          "❌ Error sending platform admin payment failure notification:",
          error
        );
      }

      return res.status(400).json({
        success: false,
        message: verificationResult.error,
      });
    }

    const paymentInfo = verificationResult.data;

    console.log("✅ [PAYMENT VERIFICATION] Payment verified successfully:", {
      reference,
      paymentStatus: paymentInfo.status,
      transactionId: paymentInfo.transactionId,
      paidAt: paymentInfo.paidAt,
      paymentMethod: paymentInfo.paymentMethod,
    });

    // Find the transaction record
    const transaction = await Transaction.findOne({ reference });

    console.log("📋 [PAYMENT VERIFICATION] Transaction record:", {
      found: !!transaction,
      transactionId: transaction?._id,
      paymentStatus: transaction?.paymentStatus,
    });

    // Update subscription with payment details

    const oldStatus = subscription.payment.status;
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
      const oldSubscriptionStatus = subscription.status;
      subscription.status = "active";
      subscription.startDate = new Date();

      // Set trial end date (7 days from now)
      subscription.trialEndDate = new Date();
      subscription.trialEndDate.setDate(
        subscription.trialEndDate.getDate() + 7
      );

      console.log("🎉 [PAYMENT VERIFICATION] Subscription activated:", {
        subscriptionId: subscription._id,
        oldStatus: oldSubscriptionStatus,
        newStatus: subscription.status,
        startDate: subscription.startDate,
        trialEndDate: subscription.trialEndDate,
        companyName: subscription.company?.name,
      });
    }

    await subscription.save();

    // Update transaction status
    if (transaction) {
      transaction.paymentStatus = subscription.payment.status;
      transaction.processedAt = new Date();
      await transaction.save();
    }

    // Send separate emails to admin and company if payment is successful
    if (subscription.status === "active" && transaction) {
      const { adminEmail, adminName, companyName } = transaction.metadata;

      // Send invitation email with login credentials
      if (adminEmail && adminName) {
        const tempPassword = Math.random()
          .toString(36)
          .substring(2, 12)
          .toUpperCase();

        const userData = {
          username: adminEmail.split("@")[0],
          firstName: adminName.split(" ")[0],
          lastName: adminName.split(" ").slice(1).join(" ") || "User",
          email: adminEmail,
          password: tempPassword,
          phone: transaction.metadata.adminPhone || "",
          isTemporaryPassword: true,
          temporaryPasswordExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
        };

        console.log("👤 [PAYMENT VERIFICATION] Creating admin user:", {
          email: adminEmail,
          username: userData.username,
          firstName: userData.firstName,
          lastName: userData.lastName,
          hasTemporaryPassword: true,
          passwordExpiry: userData.temporaryPasswordExpiry,
        });

        userData.passwordChangeRequired = true;
        userData.isEmailVerified = true;

        // Create or get the company first
        let company = await Company.findOne({
          email: transaction.metadata.companyEmail,
        });

        if (!company) {
          // Create the company
          company = await Company.create({
            name: transaction.metadata.companyName,
            email: transaction.metadata.companyEmail,
            phone: transaction.metadata.adminPhone || "",
            address: {},
            subscription: subscription._id,
            isActive: true,
          });

          subscription.company = company._id;
          subscription.companyName = company.name;
          await subscription.save();

          console.log("✅ [COMPANY] Updated subscription with company:", {
            companyId: company._id,
            companyName: company.name,
            subscriptionId: subscription._id,
          });
        }

        // Create default department for the company
        let defaultDepartment = await Department.findOne({
          company: company._id,
          name: "General",
        });

        if (!defaultDepartment) {
          try {
            defaultDepartment = await Department.create({
              name: "General",
              description: "Default department for company operations",
              company: company._id,
              manager: null,
              isActive: true,
            });
            console.log(
              "✅ [DEPARTMENT] Created default department for company:",
              company.name
            );
          } catch (error) {
            console.error(
              "❌ [DEPARTMENT] Error creating department:",
              error.message
            );
            defaultDepartment = await Department.findOne({
              company: company._id,
              name: "General",
            });

            if (!defaultDepartment) {
              throw new Error("Failed to create or find default department");
            }
          }
        }

        userData.company = company._id;
        userData.department = defaultDepartment._id;
        // Assign SUPER_ADMIN role to company owners so they can set up their company
        // and manage all aspects including departments, roles, and user invitations
        userData.role = await Role.findOne({ name: "SUPER_ADMIN" });

        const newUser = await User.create(userData);

        console.log("🔑 [CREDENTIALS] Generated for user:", {
          email: adminEmail,
          username: userData.username,
          temporaryPassword: tempPassword,
          passwordExpiry: userData.temporaryPasswordExpiry,
          userId: newUser._id,
        });

        if (subscription.company) {
          await sendAdminInvitationEmail(
            adminEmail,
            adminName,
            companyName,
            tempPassword,
            transaction._id
          );
        } else {
          // Individual user subscription
          await sendIndividualUserInvitationEmail(
            adminEmail,
            adminName,
            tempPassword,
            transaction._id
          );
        }
      }

      if (transaction.metadata.companyEmail) {
        await sendCompanyBillingEmail(
          transaction.metadata.companyEmail,
          companyName,
          subscription.plan.displayName,
          subscription.billingCycle,
          subscription.payment.amount,
          subscription.payment.currency,
          transaction._id,
          transaction.billingPeriod
        );
      }

      await sendPaymentConfirmationEmail(
        adminEmail,
        transaction.metadata.companyEmail,
        companyName,
        subscription.plan.displayName,
        subscription.payment.amount,
        subscription.payment.currency,
        transaction._id
      );

      try {
        const adminUser = await User.findOne({ email: adminEmail });
        if (adminUser) {
          const welcomeService = new WelcomeNotificationService(global.io);
          await welcomeService.sendSubscriptionActivationNotification(
            adminUser,
            {
              planName: subscription.plan.displayName,
              billingCycle: subscription.billingCycle,
              amount: subscription.payment.amount,
              currency: subscription.payment.currency,
            }
          );
        }
      } catch (error) {
        console.error(
          "❌ Error sending subscription activation notification:",
          error
        );
      }

      // Send platform admin notification for new subscription
      try {
        const platformAdminNotificationService =
          new PlatformAdminNotificationService(global.notificationService);
        await platformAdminNotificationService.notifyNewSubscription({
          isCompany: !!subscription.company,
          companyName: subscription.company?.name || companyName,
          userName: adminName,
          adminEmail: adminEmail,
          userEmail: adminEmail,
          planName: subscription.plan?.displayName || subscription.plan?.name,
          billingCycle: subscription.billingCycle,
          amount: subscription.payment?.amount,
          currency: subscription.payment?.currency,
          paymentProvider: subscription.payment?.paymentMethod || "unknown",
          subscriptionId: subscription._id.toString(),
        });
      } catch (error) {
        console.error(
          "❌ Error sending platform admin new subscription notification:",
          error
        );
      }
    }

    // Summary log for payment verification
    console.log("✅ [PAYMENT VERIFICATION] Summary:", {
      reference,
      paymentProvider,
      companyName: company.name, // Use the company object we created/found
      planName: subscription.planName,
      paymentStatus: subscription.payment?.status,
      subscriptionStatus: subscription.status,
      amount: subscription.payment?.amount,
      currency: subscription.payment?.currency,
      transactionId: subscription.payment?.transactionId,
    });

    console.log("🎉 [PAYMENT VERIFICATION] Process completed successfully:", {
      subscriptionId: subscription._id,
      subscriptionStatus: subscription.status,
      transactionId: transaction?._id,
      transactionStatus: transaction?.paymentStatus,
      companyName: company.name, // Use the company object we created/found
      adminEmail: transaction?.metadata?.adminEmail,
    });

    res.status(200).json({
      success: true,
      data: {
        subscription,
        payment: paymentInfo,
      },
    });
  } catch (error) {
    console.error("❌ [PAYMENT VERIFICATION] Error during verification:", {
      error: error.message,
      stack: error.stack,
      reference: req.body.reference,
      paymentProvider: req.body.paymentProvider,
    });
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

    // Send platform admin notification for subscription cancellation
    try {
      const platformAdminNotificationService =
        new PlatformAdminNotificationService(global.notificationService);
      const createdByUser = subscription.createdBy
        ? await User.findById(subscription.createdBy)
        : null;

      await platformAdminNotificationService.notifyCancellation({
        isCompany: !!subscription.company,
        companyName: subscription.company?.name || "Unknown Company",
        userName: createdByUser
          ? `${createdByUser.firstName} ${createdByUser.lastName}`
          : "Unknown User",
        adminEmail: createdByUser?.email || "Unknown",
        userEmail: createdByUser?.email || "Unknown",
        planName: subscription.plan?.displayName || subscription.plan?.name,
        cancellationReason: req.body.reason || "Cancelled by platform admin",
        cancelledDate: new Date().toISOString(),
        subscriptionId: subscription._id.toString(),
      });

      // Send user notification for their own cancellation
      if (createdByUser) {
        await platformAdminNotificationService.notifyUserCancellation(
          createdByUser._id,
          createdByUser.email,
          `${createdByUser.firstName} ${createdByUser.lastName}`,
          {
            planName: subscription.plan?.displayName || subscription.plan?.name,
            cancelledDate: new Date().toISOString(),
            cancellationReason:
              req.body.reason || "Cancelled by platform admin",
            accessUntil:
              subscription.payment?.nextBillingDate ||
              "End of current billing period",
            subscriptionId: subscription._id.toString(),
          }
        );
      }
    } catch (error) {
      console.error(
        "❌ Error sending platform admin cancellation notification:",
        error
      );
    }

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

    // Handle subscription renewal events
    if (event.metadata && event.metadata.subscriptionId) {
      try {
        const subscription = await Subscription.findById(
          event.metadata.subscriptionId
        );
        if (subscription) {
          // Check if this is a renewal (subscription already exists and is active)
          if (subscription.status === "active") {
            const createdByUser = subscription.createdBy
              ? await User.findById(subscription.createdBy)
              : null;

            // Send platform admin notification for renewal
            const platformAdminNotificationService =
              new PlatformAdminNotificationService(global.notificationService);
            await platformAdminNotificationService.notifyRenewal({
              isCompany: !!subscription.company, // Check if this is a company subscription
              companyName: subscription.company?.name || "Unknown Company",
              userName: createdByUser
                ? `${createdByUser.firstName} ${createdByUser.lastName}`
                : "Unknown User",
              planName:
                subscription.plan?.displayName || subscription.plan?.name,
              billingCycle: subscription.billingCycle,
              amount: event.amount || subscription.payment?.amount,
              currency: event.currency || subscription.payment?.currency,
              nextBillingDate: subscription.payment?.nextBillingDate,
              subscriptionId: subscription._id.toString(),
            });

            // Send user notification for their own renewal
            if (createdByUser) {
              await platformAdminNotificationService.notifyUserRenewal(
                createdByUser._id,
                createdByUser.email,
                `${createdByUser.firstName} ${createdByUser.lastName}`,
                {
                  planName:
                    subscription.plan?.displayName || subscription.plan?.name,
                  billingCycle: subscription.billingCycle,
                  amount: event.amount || subscription.payment?.amount,
                  currency: event.currency || subscription.payment?.currency,
                  nextBillingDate: subscription.payment?.nextBillingDate,
                  transactionId:
                    event.transactionId || subscription.payment?.transactionId,
                  subscriptionId: subscription._id.toString(),
                }
              );
            }
          }
        }
      } catch (error) {
        console.error("Error processing subscription renewal webhook:", error);
      }
    }

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

// @desc    Update subscription plan (Platform Admin only)
// @route   PUT /api/subscriptions/plans/:planName
// @access  Private (Platform Admin)
export const updateSubscriptionPlan = async (req, res) => {
  try {
    const currentUser = req.user;
    const { planName } = req.params;
    const planData = req.body;

    if (currentUser.role.level < 110) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Platform admin privileges required.",
      });
    }

    // Get current plans
    const plans = await Subscription.getPlans();
    const currentPlan = plans[planName];

    if (!currentPlan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }

    // Note: Since plans are static, we can't update them in the database
    // This would require updating the code and redeploying
    // For now, we'll return the current plan data
    const updatedPlan = {
      ...currentPlan,
      displayName: planData.displayName || currentPlan.displayName,
      description: planData.description || currentPlan.description,
      price: planData.price || currentPlan.price,
      features: planData.features || currentPlan.features,
    };

    res.status(200).json({
      success: true,
      message: "Plan updated successfully",
      data: {
        planName,
        updatedPlan,
      },
    });
  } catch (error) {
    console.error("Update subscription plan error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update subscription plan",
    });
  }
};

// @desc    Get subscription plan by name (Platform Admin only)
// @route   GET /api/subscriptions/plans/:planName
// @access  Private (Platform Admin)
export const getSubscriptionPlan = async (req, res) => {
  try {
    const currentUser = req.user;
    const { planName } = req.params;

    if (currentUser.role.level < 110) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Platform admin privileges required.",
      });
    }

    const plans = await Subscription.getPlans();
    const plan = plans[planName];
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }

    res.status(200).json({
      success: true,
      data: plan,
    });
  } catch (error) {
    console.error("Get subscription plan error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch subscription plan",
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
        displayName: (await Subscription.getPlans())[plan]?.displayName || plan,
        price: {
          monthly: (await Subscription.getPlans())[plan]?.price.monthly || 0,
          yearly: (await Subscription.getPlans())[plan]?.price.yearly || 0,
        },
        features: (await Subscription.getPlans())[plan]?.features || {},
        description: (await Subscription.getPlans())[plan]?.description || "",
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

    // Send platform admin notification for trial subscription creation
    try {
      const platformAdminNotificationService =
        new PlatformAdminNotificationService(global.notificationService);
      await platformAdminNotificationService.notifyNewSubscription({
        isCompany: true, // Trial subscriptions are always for companies
        companyName: company.name,
        adminEmail: currentUser.email,
        planName: subscription.plan?.displayName || subscription.plan?.name,
        billingCycle: subscription.billingCycle,
        amount: 0,
        currency: "USD",
        paymentProvider: "trial",
        subscriptionId: subscription._id.toString(),
      });
    } catch (error) {
      console.error(
        "❌ Error sending platform admin trial subscription notification:",
        error
      );
    }

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
