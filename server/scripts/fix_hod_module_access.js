import mongoose from "mongoose";
import dotenv from "dotenv";
import Role from "../models/Role.js";
import Department from "../models/Department.js";

dotenv.config();

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined");
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
    });

    console.log(`🟢 MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    process.exit(1);
  }
};

async function fixHODModuleAccess() {
  try {
    await connectDB();

    console.log("🔧 FIXING HOD MODULE ACCESS - DEPARTMENT SPECIFIC");
    console.log("=".repeat(80));

    // Get the HOD role
    const hodRole = await Role.findOne({ name: "HOD" });
    if (!hodRole) {
      console.log("❌ HOD role not found");
      return;
    }

    console.log(
      `📋 Current HOD role has ${hodRole.moduleAccess.length} modules`
    );
    console.log(
      "Current modules:",
      hodRole.moduleAccess.map((m) => m.module)
    );

    // Define department-specific module access for HODs
    const departmentModuleMapping = {
      "Finance & Accounting": [
        "SELF_SERVICE",
        "CUSTOMER_CARE",
        "FINANCE",
        "PROCUREMENT",
        "PAYROLL",
        "PROJECTS",
        "INVENTORY",
      ],
      "Human Resources": [
        "SELF_SERVICE",
        "CUSTOMER_CARE",
        "HR",
        "PAYROLL",
        "PROJECTS",
      ],
      "Information Technology": [
        "SELF_SERVICE",
        "CUSTOMER_CARE",
        "IT",
        "SYSTEM_ADMIN",
        "PROJECTS",
      ],
      Operations: [
        "SELF_SERVICE",
        "CUSTOMER_CARE",
        "OPERATIONS",
        "PROJECTS",
        "INVENTORY",
        "PROCUREMENT",
      ],
      "Sales & Marketing": [
        "SELF_SERVICE",
        "CUSTOMER_CARE",
        "SALES",
        "PROJECTS",
      ],
      "Legal & Compliance": [
        "SELF_SERVICE",
        "CUSTOMER_CARE",
        "LEGAL",
        "PROJECTS",
      ],
      "Customer Service": ["SELF_SERVICE", "CUSTOMER_CARE", "PROJECTS"],
      "Executive Office": [
        "SELF_SERVICE",
        "CUSTOMER_CARE",
        "SYSTEM_ADMIN",
        "PROJECTS",
      ],
      "System Administration": [
        "SELF_SERVICE",
        "CUSTOMER_CARE",
        "SYSTEM_ADMIN",
        "PROJECTS",
      ],
    };

    // Create a new HOD role for each department
    console.log("\n🔧 Creating department-specific HOD roles...");

    for (const [departmentName, allowedModules] of Object.entries(
      departmentModuleMapping
    )) {
      const department = await Department.findOne({ name: departmentName });
      if (!department) {
        console.log(`⚠️  Department "${departmentName}" not found, skipping`);
        continue;
      }

      // Create department-specific module access
      const departmentModuleAccess = allowedModules.map((moduleCode) => ({
        module: moduleCode,
        permissions: ["view", "create", "edit", "approve"],
      }));

      // Create new role name for this department
      const roleName = `HOD_${
        department.code || departmentName.replace(/\s+/g, "_").toUpperCase()
      }`;

      // Check if role already exists
      let existingRole = await Role.findOne({ name: roleName });

      if (existingRole) {
        console.log(`📝 Updating existing role: ${roleName}`);
        existingRole.moduleAccess = departmentModuleAccess;
        await existingRole.save();
      } else {
        console.log(`➕ Creating new role: ${roleName} for ${departmentName}`);
        const newRole = new Role({
          name: roleName,
          level: 700, // Same level as HOD
          description: `Head of ${departmentName} Department`,
          permissions: [
            "user.approve_department",
            "user.manage_staff",
            "user.manage_manager",
            "document.approve_department",
            "workflow.approve_department",
            "user.view_department_users",
            "user.edit_department_users",
          ],
          departmentAccess: [department._id],
          canManageRoles: [],
          isActive: true,
          autoApproval: false,
          canApproveDepartment: true,
          moduleAccess: departmentModuleAccess,
        });
        await newRole.save();
      }

      console.log(
        `✅ ${roleName}: ${
          allowedModules.length
        } modules (${allowedModules.join(", ")})`
      );
    }

    // Keep the original HOD role but make it clear it's for system-wide use
    console.log("\n🔧 Updating original HOD role for system-wide use...");
    hodRole.description =
      "HOD - System-wide access (use department-specific roles instead)";
    hodRole.isActive = false; // Disable the generic HOD role
    await hodRole.save();
    console.log("✅ Original HOD role disabled");

    console.log("\n" + "=".repeat(80));
    console.log("✅ HOD MODULE ACCESS FIXED");
    console.log("=".repeat(80));
    console.log("\n📋 NEXT STEPS:");
    console.log("1. Update Finance HOD user to use HOD_FIN role");
    console.log(
      "2. Update other HOD users to use their department-specific roles"
    );
    console.log("3. Test the module access for each department");
  } catch (error) {
    console.error("❌ Error fixing HOD module access:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Database connection closed");
  }
}

fixHODModuleAccess();
