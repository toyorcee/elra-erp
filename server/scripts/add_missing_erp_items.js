import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Import models
import Role from "../models/Role.js";
import Module from "../models/Module.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

async function addMissingERPItems() {
  try {
    await connectDB();

    console.log("🔧 Adding Missing ERP Items to Database...");
    console.log("=".repeat(70));

    // Step 1: Add VIEWER role
    console.log("\n👤 Step 1: Adding VIEWER role...");
    const existingViewerRole = await Role.findOne({ name: "VIEWER" });

    if (existingViewerRole) {
      console.log("  ⚠️  VIEWER role already exists, updating...");
      existingViewerRole.level = 100;
      existingViewerRole.description =
        "Read-only access to reports and announcements";
      existingViewerRole.permissions = [
        "document.view",
        "communication.view",
        "system.reports",
      ];
      await existingViewerRole.save();
      console.log("  ✅ VIEWER role updated");
    } else {
      console.log("  ✅ Creating VIEWER role...");
      const viewerRole = new Role({
        name: "VIEWER",
        level: 100,
        description: "Read-only access to reports and announcements",
        permissions: ["document.view", "communication.view", "system.reports"],
        departmentAccess: ["All"],
        isActive: true,
        moduleAccess: [
          {
            module: "DOCUMENTS",
            permissions: ["view"],
          },
          {
            module: "COMMUNICATION",
            permissions: ["view"],
          },
        ],
      });
      await viewerRole.save();
      console.log("  ✅ VIEWER role created");
    }

    // Step 2: Add CUSTOMER_CARE module
    console.log("\n📞 Step 2: Adding CUSTOMER_CARE module...");
    const existingCustomerCareModule = await Module.findOne({
      code: "CUSTOMER_CARE",
    });

    if (existingCustomerCareModule) {
      console.log("  ⚠️  CUSTOMER_CARE module already exists, updating...");
      existingCustomerCareModule.name = "Customer Care";
      existingCustomerCareModule.description =
        "Customer support, ticket management, and service requests";
      existingCustomerCareModule.icon = "CustomerServiceIcon";
      existingCustomerCareModule.color = "#10B981"; // Green
      existingCustomerCareModule.permissions = [
        "view",
        "create",
        "edit",
        "admin",
      ];
      existingCustomerCareModule.order = 8;
      await existingCustomerCareModule.save();
      console.log("  ✅ CUSTOMER_CARE module updated");
    } else {
      console.log("  ✅ Creating CUSTOMER_CARE module...");
      const customerCareModule = new Module({
        name: "Customer Care",
        code: "CUSTOMER_CARE",
        description:
          "Customer support, ticket management, and service requests",
        icon: "CustomerServiceIcon",
        color: "#10B981", // Green
        isActive: true,
        permissions: ["view", "create", "edit", "admin"],
        order: 8,
      });
      await customerCareModule.save();
      console.log("  ✅ CUSTOMER_CARE module created");
    }

    // Step 3: Update existing roles to include CUSTOMER_CARE access
    console.log("\n🔗 Step 3: Updating role module access...");

    const rolesToUpdate = ["SUPER_ADMIN", "HOD", "MANAGER", "STAFF"];

    for (const roleName of rolesToUpdate) {
      const role = await Role.findOne({ name: roleName });
      if (role) {
        // Check if CUSTOMER_CARE access already exists
        const hasCustomerCareAccess = role.moduleAccess?.some(
          (access) => access.module === "CUSTOMER_CARE"
        );

        if (!hasCustomerCareAccess) {
          // Add CUSTOMER_CARE access based on role level
          const customerCarePermissions =
            role.level >= 600
              ? ["view", "create", "edit", "admin"]
              : role.level >= 300
              ? ["view", "create", "edit"]
              : ["view"];

          role.moduleAccess.push({
            module: "CUSTOMER_CARE",
            permissions: customerCarePermissions,
          });

          await role.save();
          console.log(`  ✅ Added CUSTOMER_CARE access to ${roleName}`);
        } else {
          console.log(`  ⚠️  ${roleName} already has CUSTOMER_CARE access`);
        }
      }
    }

    console.log("\n✅ All missing ERP items added successfully!");
    console.log("=".repeat(70));

    // Verify the changes
    console.log("\n🔍 Verification:");
    const viewerRole = await Role.findOne({ name: "VIEWER" });
    const customerCareModule = await Module.findOne({ code: "CUSTOMER_CARE" });

    if (viewerRole) {
      console.log(
        `✅ VIEWER role: Level ${viewerRole.level} - ${viewerRole.description}`
      );
    }

    if (customerCareModule) {
      console.log(
        `✅ CUSTOMER_CARE module: ${customerCareModule.name} - ${customerCareModule.description}`
      );
    }
  } catch (error) {
    console.error("❌ Error adding missing ERP items:", error);
  } finally {
    await mongoose.connection.close();
    console.log("\n🔌 Database connection closed");
  }
}

addMissingERPItems();
