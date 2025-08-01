import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Import models
import Department from "../models/Department.js";
import Company from "../models/Company.js";

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

async function fixDepartmentHierarchy() {
  try {
    await connectDB();

    // Find your company
    const companies = await Company.find({});
    if (companies.length === 0) {
      console.log("❌ No companies found.");
      return;
    }

    const company = companies[0];
    console.log(`🏢 Company: ${company.name}`);
    console.log("=".repeat(80));

    // Get all departments
    const departments = await Department.find({ company: company._id }).sort({
      level: 1,
    });

    console.log("\n📋 Current Department Structure:");
    console.log("-".repeat(60));
    departments.forEach((dept) => {
      console.log(
        `🏛️ ${dept.name.padEnd(25)} | Level: ${dept.level
          .toString()
          .padStart(2)} | Parent: ${dept.parentDepartment || "None"}`
      );
    });

    // Find Executive Management (Level 50)
    const executiveManagement = departments.find((dept) => dept.level === 50);
    if (!executiveManagement) {
      console.log("❌ Executive Management (Level 50) not found!");
      return;
    }

    console.log(
      `\n🎯 Setting Executive Management as parent for all departments...`
    );
    console.log(
      `📌 Parent Department: ${executiveManagement.name} (ID: ${executiveManagement._id})`
    );

    // Update all other departments to have Executive Management as parent
    const departmentsToUpdate = departments.filter((dept) => dept.level !== 50);

    let updatedCount = 0;
    for (const dept of departmentsToUpdate) {
      try {
        await Department.findByIdAndUpdate(dept._id, {
          parentDepartment: executiveManagement._id,
        });
        console.log(
          `✅ Updated ${dept.name} → Parent: ${executiveManagement.name}`
        );
        updatedCount++;
      } catch (error) {
        console.log(`❌ Failed to update ${dept.name}: ${error.message}`);
      }
    }

    console.log(`\n🎉 Hierarchy Update Complete!`);
    console.log(`✅ Updated ${updatedCount} departments`);
    console.log(`✅ Executive Management remains as top-level parent`);

    // Show final structure
    console.log("\n📋 Final Department Hierarchy:");
    console.log("-".repeat(60));
    const updatedDepartments = await Department.find({
      company: company._id,
    }).sort({
      level: 1,
    });

    updatedDepartments.forEach((dept) => {
      const parentName = dept.parentDepartment
        ? updatedDepartments.find(
            (p) => p._id.toString() === dept.parentDepartment.toString()
          )?.name || "Unknown"
        : "None (Top Level)";

      console.log(
        `🏛️ ${dept.name.padEnd(25)} | Level: ${dept.level
          .toString()
          .padStart(2)} | Parent: ${parentName}`
      );
    });

    console.log("\n🚀 Approval Flow Now Works:");
    console.log(
      "📋 Document Submission → Department Review → Executive Management → Final Approval"
    );
    console.log(
      "📋 All departments now report to Executive Management for final approval"
    );
  } catch (error) {
    console.error("❌ Error during hierarchy fix:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Database connection closed");
  }
}

fixDepartmentHierarchy();
