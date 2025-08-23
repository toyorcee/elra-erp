import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Import models
import Role from "../models/Role.js";
import Department from "../models/Department.js";
import User from "../models/User.js";
import Project from "../models/Project.js";

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

const analyzeLeasingMinistryProjects = async () => {
  try {
    await connectDB();

    console.log("🏢 LEASING MINISTRY PROJECT ANALYSIS:");
    console.log("=====================================");

    // Check project creation permissions
    console.log("\n📋 PROJECT CREATION PERMISSIONS:");
    console.log("=================================");
    console.log("✅ Required Role Level: 600+ (Manager and above)");
    console.log("✅ Route Permission: checkRole(600)");
    console.log("✅ Controller Check: role.level >= 700 (HOD and above)");
    console.log(
      "⚠️  Note: There's a discrepancy - route allows 600+ but controller requires 700+"
    );
    console.log("");

    // Get all roles and check their project creation ability
    const roles = await Role.find({}).sort({ level: -1 });
    console.log("👥 ROLE ANALYSIS FOR PROJECT CREATION:");
    console.log("======================================");

    roles.forEach((role) => {
      const canCreateByRoute = role.level >= 600;
      const canCreateByController = role.level >= 700;
      const status = canCreateByController
        ? "✅ CAN CREATE"
        : canCreateByRoute
        ? "⚠️  ROUTE ALLOWS BUT CONTROLLER BLOCKS"
        : "❌ CANNOT CREATE";

      console.log(`${role.name} (Level ${role.level}):`);
      console.log(`  - Status: ${status}`);
      console.log(`  - Route Access: ${canCreateByRoute ? "✅" : "❌"}`);
      console.log(
        `  - Controller Access: ${canCreateByController ? "✅" : "❌"}`
      );
      console.log("");
    });

    // Get all departments
    const departments = await Department.find({}).sort({ name: 1 });
    console.log("🏢 DEPARTMENT ANALYSIS:");
    console.log("======================");

    for (const dept of departments) {
      console.log(`\n📋 Department: ${dept.name}`);
      console.log(`   ID: ${dept._id}`);
      console.log(`   Code: ${dept.code || "N/A"}`);
      console.log(`   Status: ${dept.isActive ? "✅ Active" : "❌ Inactive"}`);

      // Find users in this department
      const usersInDept = await User.find({
        department: dept._id,
        isActive: true,
      })
        .populate("role")
        .populate("department");

      console.log(`   👥 Users in Department: ${usersInDept.length}`);

      if (usersInDept.length > 0) {
        const canCreateProjects = usersInDept.filter(
          (user) => user.role?.level >= 700
        );
        const routeCanCreate = usersInDept.filter(
          (user) => user.role?.level >= 600
        );

        console.log(
          `   ✅ Can Create Projects (700+): ${canCreateProjects.length} users`
        );
        console.log(
          `   ⚠️  Route Allows (600+): ${routeCanCreate.length} users`
        );

        if (canCreateProjects.length > 0) {
          console.log("   👤 Users who can create projects:");
          canCreateProjects.forEach((user) => {
            console.log(
              `      - ${user.firstName} ${user.lastName} (${user.employeeId}) - ${user.role?.name} (Level ${user.role?.level})`
            );
          });
        }

        if (routeCanCreate.length > canCreateProjects.length) {
          console.log(
            "   ⚠️  Users blocked by controller but allowed by route:"
          );
          routeCanCreate.forEach((user) => {
            if (user.role?.level < 700) {
              console.log(
                `      - ${user.firstName} ${user.lastName} (${user.employeeId}) - ${user.role?.name} (Level ${user.role?.level})`
              );
            }
          });
        }
      }
    }

    // Check existing projects
    console.log("\n📊 EXISTING PROJECTS ANALYSIS:");
    console.log("==============================");

    const projects = await Project.find({ isActive: true })
      .populate("createdBy", "firstName lastName employeeId role")
      .populate("department", "name code")
      .sort({ createdAt: -1 });

    console.log(`Total Active Projects: ${projects.length}`);

    if (projects.length > 0) {
      console.log("\n📋 Recent Projects:");
      projects.slice(0, 10).forEach((project, index) => {
        console.log(`   ${index + 1}. ${project.name}`);
        console.log(
          `      Created by: ${project.createdBy?.firstName} ${project.createdBy?.lastName} (${project.createdBy?.employeeId})`
        );
        console.log(`      Department: ${project.department?.name || "N/A"}`);
        console.log(`      Created: ${project.createdAt.toLocaleDateString()}`);
        console.log(
          `      Budget: ₦${project.budget?.toLocaleString() || "0"}`
        );
        console.log("");
      });
    }

    // Summary for leasing ministry
    console.log("\n🎯 LEASING MINISTRY RECOMMENDATIONS:");
    console.log("=====================================");

    const departmentsWithCreators = [];
    const departmentsWithoutCreators = [];

    for (const dept of departments) {
      const usersInDept = await User.find({
        department: dept._id,
        isActive: true,
      }).populate("role");

      const canCreate = usersInDept.some((user) => user.role?.level >= 700);

      if (canCreate) {
        departmentsWithCreators.push(dept.name);
      } else {
        departmentsWithoutCreators.push(dept.name);
      }
    }

    console.log("✅ Departments that CAN create projects:");
    if (departmentsWithCreators.length > 0) {
      departmentsWithCreators.forEach((dept) => console.log(`   - ${dept}`));
    } else {
      console.log("   ❌ No departments can create projects!");
    }

    console.log("\n❌ Departments that CANNOT create projects:");
    if (departmentsWithoutCreators.length > 0) {
      departmentsWithoutCreators.forEach((dept) => console.log(`   - ${dept}`));
    } else {
      console.log("   ✅ All departments can create projects!");
    }

    // Permission discrepancy warning
    console.log("\n⚠️  IMPORTANT NOTICE:");
    console.log("=====================");
    console.log("There is a discrepancy in the project creation permissions:");
    console.log("- Route allows: Role level 600+ (Manager and above)");
    console.log("- Controller requires: Role level 700+ (HOD and above)");
    console.log(
      "This means Managers (level 600) can access the route but will be blocked by the controller."
    );
    console.log("Recommendation: Align the permission requirements.");

    await mongoose.connection.close();
    console.log("\n🔌 Database connection closed");
  } catch (error) {
    console.error("❌ Error analyzing leasing ministry projects:", error);
  } finally {
    await mongoose.connection.close();
    console.log("\n🔌 Database connection closed");
  }
};

analyzeLeasingMinistryProjects();
