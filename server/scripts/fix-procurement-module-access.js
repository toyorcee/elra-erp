import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Import models
import User from "../models/User.js";
import Department from "../models/Department.js";
import Module from "../models/Module.js";
import Role from "../models/Role.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

const fixProcurementModuleAccess = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Find Procurement department
    const procurementDept = await Department.findOne({
      name: { $regex: /procurement/i },
    });

    if (!procurementDept) {
      console.log("❌ Procurement department not found");
      return;
    }

    console.log(
      `\n📋 PROCUREMENT DEPARTMENT: ${procurementDept.name} (${procurementDept.code})`
    );

    // Find Procurement HOD user
    const procurementUser = await User.findOne({
      department: procurementDept._id,
      email: "hod.proc@elra.com",
    }).populate("role");

    if (!procurementUser) {
      console.log("❌ Procurement HOD user not found");
      return;
    }

    console.log(`\n👤 PROCUREMENT HOD USER:`);
    console.log(
      `   Name: ${procurementUser.firstName} ${procurementUser.lastName}`
    );
    console.log(`   Email: ${procurementUser.email}`);
    console.log(
      `   Role: ${procurementUser.role?.name} (Level: ${procurementUser.role?.level})`
    );

    // Get all modules
    const allModules = await Module.find().sort({ order: 1 });
    console.log(`\n📦 ALL MODULES (${allModules.length}):`);
    allModules.forEach((module, index) => {
      console.log(
        `${index + 1}. ${module.name} (${module.code}) - Order: ${module.order}`
      );
    });

    // Define which modules Procurement HOD should have access to
    const procurementModules = [
      "PROCUREMENT", // Primary module
      "PROJECTS", // Project procurement
      "SELF_SERVICE", // Personal features
      "CUSTOMER_CARE", // Support tickets
    ];

    console.log(`\n🎯 MODULES PROCUREMENT HOD SHOULD HAVE ACCESS TO:`);
    procurementModules.forEach((moduleCode, index) => {
      const module = allModules.find((m) => m.code === moduleCode);
      if (module) {
        console.log(`${index + 1}. ✅ ${module.name} (${module.code})`);
      } else {
        console.log(`${index + 1}. ❌ ${moduleCode} - NOT FOUND`);
      }
    });

    // Update Procurement module to include Procurement department
    const procurementModule = await Module.findOne({ code: "PROCUREMENT" });
    if (procurementModule) {
      // Check if Procurement department is already in the module's department access
      const hasAccess = procurementModule.departmentAccess.includes(
        procurementDept._id
      );

      if (!hasAccess) {
        procurementModule.departmentAccess.push(procurementDept._id);
        await procurementModule.save();
        console.log(
          `\n✅ Added Procurement department to PROCUREMENT module access`
        );
      } else {
        console.log(
          `\nℹ️ Procurement department already has access to PROCUREMENT module`
        );
      }
    }

    // Update Projects module to include Procurement department
    const projectsModule = await Module.findOne({ code: "PROJECTS" });
    if (projectsModule) {
      const hasAccess = projectsModule.departmentAccess.includes(
        procurementDept._id
      );

      if (!hasAccess) {
        projectsModule.departmentAccess.push(procurementDept._id);
        await projectsModule.save();
        console.log(
          `\n✅ Added Procurement department to PROJECTS module access`
        );
      } else {
        console.log(
          `\nℹ️ Procurement department already has access to PROJECTS module`
        );
      }
    }

    // Update Self-Service module to include Procurement department
    const selfServiceModule = await Module.findOne({ code: "SELF_SERVICE" });
    if (selfServiceModule) {
      const hasAccess = selfServiceModule.departmentAccess.includes(
        procurementDept._id
      );

      if (!hasAccess) {
        selfServiceModule.departmentAccess.push(procurementDept._id);
        await selfServiceModule.save();
        console.log(
          `\n✅ Added Procurement department to SELF_SERVICE module access`
        );
      } else {
        console.log(
          `\nℹ️ Procurement department already has access to SELF_SERVICE module`
        );
      }
    }

    // Update Customer Care module to include Procurement department
    const customerCareModule = await Module.findOne({ code: "CUSTOMER_CARE" });
    if (customerCareModule) {
      const hasAccess = customerCareModule.departmentAccess.includes(
        procurementDept._id
      );

      if (!hasAccess) {
        customerCareModule.departmentAccess.push(procurementDept._id);
        await customerCareModule.save();
        console.log(
          `\n✅ Added Procurement department to CUSTOMER_CARE module access`
        );
      } else {
        console.log(
          `\nℹ️ Procurement department already has access to CUSTOMER_CARE module`
        );
      }
    }

    console.log(`\n📋 CORRECT MODULE ACCESS FOR PROCUREMENT HOD:`);
    console.log(
      `   ✅ PROCUREMENT - Primary module (purchase orders, suppliers)`
    );
    console.log(`   ✅ PROJECTS - Project procurement and related tasks`);
    console.log(`   ✅ SELF_SERVICE - Personal features (payslips, documents)`);
    console.log(`   ✅ CUSTOMER_CARE - Support tickets and service requests`);
    console.log(`   ❌ FINANCE - Handled by Finance HOD`);
    console.log(`   ❌ INVENTORY - Handled by Operations HOD`);

    console.log(`\n🎉 Procurement HOD module access updated successfully!`);
    console.log(`   Login credentials:`);
    console.log(`   Email: ${procurementUser.email}`);
    console.log(`   Password: HODelra@2025`);
  } catch (error) {
    console.error("❌ Error fixing Procurement module access:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Disconnected from MongoDB");
  }
};

fixProcurementModuleAccess();
