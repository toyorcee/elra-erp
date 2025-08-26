import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
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

async function checkAllProjects() {
  try {
    await connectDB();

    console.log("🔍 Checking All Projects in Database...");
    console.log("=".repeat(50));

    // Get all projects
    const projects = await Project.find({})
      .populate("department", "name code")
      .populate("createdBy", "firstName lastName email department")
      .sort({ createdAt: -1 });

    console.log(`📊 Total Projects Found: ${projects.length}`);

    if (projects.length === 0) {
      console.log("❌ No projects found in database");
      console.log("💡 This means either:");
      console.log("   1. Project creation failed");
      console.log("   2. Projects were deleted");
      console.log("   3. Database was reset");
      return;
    }

    projects.forEach((project, index) => {
      console.log(`\n📋 Project ${index + 1}:`);
      console.log(`   Name: ${project.name}`);
      console.log(`   Code: ${project.code}`);
      console.log(`   Budget: ${project.budget}`);
      console.log(`   Status: ${project.status}`);
      console.log(`   Category: ${project.category}`);
      console.log(`   Created: ${project.createdAt}`);
      console.log(`   Department: ${project.department?.name || "Not Assigned"}`);
      console.log(`   Creator: ${project.createdBy?.firstName} ${project.createdBy?.lastName}`);
      console.log(`   Creator Dept: ${project.createdBy?.department?.name || "Not Assigned"}`);
      
      if (project.approvalChain && project.approvalChain.length > 0) {
        console.log(`   Approval Chain: ${project.approvalChain.length} levels`);
        project.approvalChain.forEach((step, stepIndex) => {
          console.log(`     Level ${stepIndex + 1}: ${step.level} - ${step.status}`);
        });
      } else {
        console.log(`   Approval Chain: None`);
      }
    });

    console.log("\n" + "=".repeat(50));

  } catch (error) {
    console.error("❌ Error checking projects:", error);
  } finally {
    await mongoose.connection.close();
    console.log("\n🔌 Database connection closed");
  }
}

checkAllProjects();
