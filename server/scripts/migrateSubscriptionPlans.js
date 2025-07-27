import mongoose from "mongoose";
import dotenv from "dotenv";
import SystemSettings from "../models/SystemSettings.js";

dotenv.config();

console.log("🔧 Migration script starting...");
console.log("📁 Current directory:", process.cwd());
console.log("🔑 Environment check:", {
  hasMongoUri: !!process.env.MONGODB_URI,
  mongoUriLength: process.env.MONGODB_URI?.length || 0,
});

const migrateSubscriptionPlans = async () => {
  try {
    console.log("🚀 Starting subscription plans migration...");

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Get or create system settings
    const settings = await SystemSettings.getInstance();
    console.log("📋 Retrieved system settings");

    // Check if subscription plans already exist
    if (
      settings.subscriptionPlans &&
      Object.keys(settings.subscriptionPlans).length > 0
    ) {
      console.log("⚠️ Subscription plans already exist in system settings");
      console.log("📋 Current plans:", Object.keys(settings.subscriptionPlans));
      return;
    }

    console.log("🔄 No existing plans found, creating new ones...");

    // Default subscription plans configuration
    const defaultSubscriptionPlans = {
      starter: {
        displayName: "Starter Plan",
        description:
          "Perfect for small teams and startups getting started with document management",
        price: {
          USD: {
            monthly: 19.99,
            yearly: 199.99,
          },
          NGN: {
            monthly: 29985, // 19.99 * 1500
            yearly: 299985, // 199.99 * 1500
          },
        },
        features: {
          maxUsers: 10,
          maxStorage: 10,
          maxDepartments: 5,
          customWorkflows: false,
          advancedAnalytics: false,
          prioritySupport: false,
          customBranding: false,
          apiAccess: false,
          sso: false,
        },
        isActive: true,
      },
      business: {
        displayName: "Business Plan",
        description: "Ideal for growing businesses and medium organizations",
        price: {
          USD: {
            monthly: 49.99,
            yearly: 499.99,
          },
          NGN: {
            monthly: 74985, // 49.99 * 1500
            yearly: 749985, // 499.99 * 1500
          },
        },
        features: {
          maxUsers: 50,
          maxStorage: 50,
          maxDepartments: 15,
          customWorkflows: true,
          advancedAnalytics: false,
          prioritySupport: false,
          customBranding: false,
          apiAccess: true,
          sso: false,
        },
        isActive: true,
      },
      professional: {
        displayName: "Professional Plan",
        description:
          "For established organizations with advanced workflow needs",
        price: {
          USD: {
            monthly: 99.99,
            yearly: 999.99,
          },
          NGN: {
            monthly: 149985, // 99.99 * 1500
            yearly: 1499850, // 999.99 * 1500
          },
        },
        features: {
          maxUsers: 150,
          maxStorage: 200,
          maxDepartments: 30,
          customWorkflows: true,
          advancedAnalytics: true,
          prioritySupport: true,
          customBranding: true,
          apiAccess: true,
          sso: false,
        },
        isActive: true,
      },
      enterprise: {
        displayName: "Enterprise Plan",
        description:
          "Complete solution for large enterprises with unlimited scalability and dedicated support",
        price: {
          USD: {
            monthly: 199.99,
            yearly: 1999.99,
          },
          NGN: {
            monthly: 299985, // 199.99 * 1500
            yearly: 2999985, // 1999.99 * 1500
          },
        },
        features: {
          maxUsers: -1, // unlimited
          maxStorage: 1000,
          maxDepartments: -1, // unlimited
          customWorkflows: true,
          advancedAnalytics: true,
          prioritySupport: true,
          customBranding: true,
          apiAccess: true,
          sso: true,
        },
        isActive: true,
      },
    };

    console.log("💾 Saving subscription plans to database...");

    // Update system settings with subscription plans
    settings.subscriptionPlans = defaultSubscriptionPlans;
    await settings.save();

    console.log(
      "✅ Successfully migrated subscription plans to system settings"
    );
    console.log("📋 Plans added:", Object.keys(defaultSubscriptionPlans));

    // Log the plans for verification
    Object.keys(defaultSubscriptionPlans).forEach((planKey) => {
      const plan = defaultSubscriptionPlans[planKey];
      console.log(`\n📦 ${plan.displayName}:`);
      console.log(
        `   USD: $${plan.price.USD.monthly}/month, $${plan.price.USD.yearly}/year`
      );
      console.log(
        `   NGN: ₦${plan.price.NGN.monthly.toLocaleString()}/month, ₦${plan.price.NGN.yearly.toLocaleString()}/year`
      );
      console.log(
        `   Features: ${
          plan.features.maxUsers === -1 ? "Unlimited" : plan.features.maxUsers
        } users, ${plan.features.maxStorage}GB storage`
      );
    });
  } catch (error) {
    console.error("❌ Migration failed:", error);
    console.error("Stack trace:", error.stack);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
};

// Run migration if called directly
console.log("🎯 Script loaded, checking execution...");
console.log("📄 import.meta.url:", import.meta.url);
console.log("📄 process.argv[1]:", process.argv[1]);

if (
  import.meta.url.includes(process.argv[1]) ||
  process.argv[1]?.includes("migrateSubscriptionPlans")
) {
  console.log("🎯 Running migration directly...");
  migrateSubscriptionPlans();
} else {
  console.log("⚠️ Script imported but not executed directly");
}

export default migrateSubscriptionPlans;
