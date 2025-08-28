import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

const flushProjectsAndDocuments = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Import the models
    const Project = (await import("../models/Project.js")).default;
    const Document = (await import("../models/Document.js")).default;
    const Approval = (await import("../models/Approval.js")).default;
    const TeamMember = (await import("../models/TeamMember.js")).default;

    console.log("🗑️ FLUSHING PROJECTS AND DOCUMENTS...");
    console.log("=".repeat(50));

    // Count before deletion
    const projectCount = await Project.countDocuments();
    const documentCount = await Document.countDocuments();
    const approvalCount = await Approval.countDocuments();
    const teamMemberCount = await TeamMember.countDocuments();

    console.log(`📊 BEFORE DELETION:`);
    console.log(`   Projects: ${projectCount}`);
    console.log(`   Documents: ${documentCount}`);
    console.log(`   Approvals: ${approvalCount}`);
    console.log(`   Team Members: ${teamMemberCount}`);

    // Delete in order (respecting foreign key relationships)
    console.log(`\n🗑️ DELETING TEAM MEMBERS...`);
    const deletedTeamMembers = await TeamMember.deleteMany({});
    console.log(
      `   ✅ Deleted ${deletedTeamMembers.deletedCount} team members`
    );

    console.log(`\n🗑️ DELETING APPROVALS...`);
    const deletedApprovals = await Approval.deleteMany({});
    console.log(`   ✅ Deleted ${deletedApprovals.deletedCount} approvals`);

    console.log(`\n🗑️ DELETING DOCUMENTS...`);
    const deletedDocuments = await Document.deleteMany({});
    console.log(`   ✅ Deleted ${deletedDocuments.deletedCount} documents`);

    console.log(`\n🗑️ DELETING PROJECTS...`);
    const deletedProjects = await Project.deleteMany({});
    console.log(`   ✅ Deleted ${deletedProjects.deletedCount} projects`);

    // Count after deletion
    const projectCountAfter = await Project.countDocuments();
    const documentCountAfter = await Document.countDocuments();
    const approvalCountAfter = await Approval.countDocuments();
    const teamMemberCountAfter = await TeamMember.countDocuments();

    console.log(`\n📊 AFTER DELETION:`);
    console.log(`   Projects: ${projectCountAfter}`);
    console.log(`   Documents: ${documentCountAfter}`);
    console.log(`   Approvals: ${approvalCountAfter}`);
    console.log(`   Team Members: ${teamMemberCountAfter}`);

    console.log(`\n🎉 SUCCESSFULLY FLUSHED PROJECTS AND DOCUMENTS!`);
    console.log(`   Total deleted:`);
    console.log(`   - ${deletedProjects.deletedCount} projects`);
    console.log(`   - ${deletedDocuments.deletedCount} documents`);
    console.log(`   - ${deletedApprovals.deletedCount} approvals`);
    console.log(`   - ${deletedTeamMembers.deletedCount} team members`);

    console.log(`\n📋 READY FOR FRESH START!`);
    console.log(`   Next steps:`);
    console.log(`   1. Login as IT HOD`);
    console.log(`   2. Create a new project`);
    console.log(`   3. Test the complete workflow from creation to compliance`);
  } catch (error) {
    console.error("❌ Error flushing projects and documents:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Disconnected from MongoDB");
  }
};

flushProjectsAndDocuments();
