import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Document from "../models/Document.js";
import Project from "../models/Project.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

const updateExistingDocumentSubmissions = async () => {
  try {
    console.log(
      "🔍 Finding documents that are linked to projects but not marked as submitted..."
    );

    // Find documents that are linked to projects
    const documents = await Document.find({
      project: { $exists: true, $ne: null },
      isActive: true,
    }).populate("project", "code name requiredDocuments");

    console.log(`📊 Found ${documents.length} documents linked to projects`);

    if (documents.length === 0) {
      console.log("✅ No documents found that need updating");
      return;
    }

    let updatedCount = 0;
    let projectUpdates = new Set(); // Track unique projects that need updating

    for (const document of documents) {
      console.log(
        `\n📄 Processing document: ${document.title} (${document.documentType})`
      );
      console.log(
        `   Project: ${document.project?.name} (${document.project?.code})`
      );

      if (!document.project) {
        console.log("   ⚠️ Document has no project, skipping...");
        continue;
      }

      // Check if this document type is in the project's required documents
      const requiredDoc = document.project.requiredDocuments?.find(
        (reqDoc) => reqDoc.documentType === document.documentType
      );

      if (!requiredDoc) {
        console.log(
          `   ⚠️ Document type ${document.documentType} not found in project's required documents`
        );
        continue;
      }

      // Check if already marked as submitted
      if (requiredDoc.isSubmitted) {
        console.log(`   ✅ Document already marked as submitted`);
        continue;
      }

      // Update the project's requiredDocuments array
      const project = await Project.findById(document.project._id);
      if (!project) {
        console.log("   ❌ Project not found, skipping...");
        continue;
      }

      const docIndex = project.requiredDocuments.findIndex(
        (reqDoc) => reqDoc.documentType === document.documentType
      );

      if (docIndex !== -1) {
        project.requiredDocuments[docIndex].isSubmitted = true;
        project.requiredDocuments[docIndex].submittedAt = document.createdAt;
        project.requiredDocuments[docIndex].submittedBy = document.createdBy;
        project.requiredDocuments[docIndex].documentId = document._id;
        project.requiredDocuments[docIndex].fileName = document.fileName;
        project.requiredDocuments[docIndex].fileUrl = document.fileUrl;

        await project.save();
        projectUpdates.add(project._id.toString());
        updatedCount++;

        console.log(
          `   ✅ Updated project ${project.code} - marked ${document.documentType} as submitted`
        );
      } else {
        console.log(
          `   ❌ Document type not found in project's required documents`
        );
      }
    }

    console.log(`\n🎉 Migration completed successfully!`);
    console.log(`📈 Updated ${updatedCount} document submissions`);
    console.log(`📊 Updated ${projectUpdates.size} unique projects`);

    // Verify the updates
    console.log("\n🔍 Verifying updates...");
    const projectsWithUpdates = await Project.find({
      _id: { $in: Array.from(projectUpdates) },
    });

    for (const project of projectsWithUpdates) {
      const submittedDocs = project.requiredDocuments.filter(
        (doc) => doc.isSubmitted
      );
      console.log(
        `   ${project.code}: ${submittedDocs.length}/${project.requiredDocuments.length} documents submitted`
      );
    }
  } catch (error) {
    console.error("❌ Error updating document submissions:", error);
  }
};

const main = async () => {
  try {
    await connectDB();
    await updateExistingDocumentSubmissions();
  } catch (error) {
    console.error("❌ Script failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
    process.exit(0);
  }
};

// Run the script
main();
