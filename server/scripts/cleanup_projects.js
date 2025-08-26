import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Project from "../models/Project.js";
import Document from "../models/Document.js";
import DocumentTemplate from "../models/DocumentTemplate.js";
import Approval from "../models/Approval.js";
import TeamMember from "../models/TeamMember.js";

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

async function cleanupProjects() {
  try {
    await connectDB();

    console.log("🧹 Starting Project Cleanup...");
    console.log("=".repeat(50));

    // Get counts before deletion
    const projectCount = await Project.countDocuments();
    const documentCount = await Document.countDocuments();
    const templateCount = await DocumentTemplate.countDocuments();
    const approvalCount = await Approval.countDocuments();
    const teamMemberCount = await TeamMember.countDocuments();

    console.log("📊 Current Database State:");
    console.log(`   Projects: ${projectCount}`);
    console.log(`   Documents: ${documentCount}`);
    console.log(`   Document Templates: ${templateCount}`);
    console.log(`   Approvals: ${approvalCount}`);
    console.log(`   Team Members: ${teamMemberCount}`);

    if (projectCount === 0) {
      console.log("✅ No projects to clean up!");
      return;
    }

    console.log("\n🗑️ Starting deletion process...");

    // Delete team members first (they reference projects)
    console.log("🗑️ Deleting team members...");
    const teamMemberResult = await TeamMember.deleteMany({});
    console.log(`   ✅ Deleted ${teamMemberResult.deletedCount} team members`);

    // Delete project-related approvals (only those that reference projects)
    console.log("🗑️ Deleting project approvals...");
    const approvalResult = await Approval.deleteMany({
      entityType: "project",
    });
    console.log(
      `   ✅ Deleted ${approvalResult.deletedCount} project approvals`
    );

    // Delete project-related documents (only those that reference projects)
    console.log("🗑️ Deleting project documents...");
    const documentResult = await Document.deleteMany({
      project: { $exists: true, $ne: null },
    });
    console.log(
      `   ✅ Deleted ${documentResult.deletedCount} project documents`
    );

    // Delete projects
    console.log("🗑️ Deleting projects...");
    const projectResult = await Project.deleteMany({});
    console.log(`   ✅ Deleted ${projectResult.deletedCount} projects`);

    // Delete document templates (optional - you might want to keep these)
    console.log("🗑️ Deleting document templates...");
    const templateResult = await DocumentTemplate.deleteMany({});
    console.log(
      `   ✅ Deleted ${templateResult.deletedCount} document templates`
    );

    // Verify cleanup
    const finalProjectCount = await Project.countDocuments();
    const finalDocumentCount = await Document.countDocuments();
    const finalTemplateCount = await DocumentTemplate.countDocuments();
    const finalApprovalCount = await Approval.countDocuments();
    const finalTeamMemberCount = await TeamMember.countDocuments();

    console.log("\n✅ Cleanup Complete!");
    console.log("📊 Final Database State:");
    console.log(`   Projects: ${finalProjectCount}`);
    console.log(`   Documents: ${finalDocumentCount}`);
    console.log(`   Document Templates: ${finalTemplateCount}`);
    console.log(`   Approvals: ${finalApprovalCount}`);
    console.log(`   Team Members: ${finalTeamMemberCount}`);

    console.log("\n🎉 Database cleaned successfully!");
    console.log(
      "💡 You can now create new projects with the updated approval logic"
    );
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
  } finally {
    await mongoose.connection.close();
    console.log("\n🔌 Database connection closed");
  }
}

cleanupProjects();
