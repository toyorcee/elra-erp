import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Document from "../models/Document.js";
import DocumentTemplate from "../models/DocumentTemplate.js";

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

async function clearAllDocuments() {
  try {
    await connectDB();

    console.log("🗑️ Clearing all documents from ELRA system...");
    console.log("=".repeat(70));

    // Get document count before deletion
    const totalDocuments = await Document.countDocuments();
    console.log(`📊 Total documents found: ${totalDocuments}`);

    if (totalDocuments === 0) {
      console.log("✅ No documents to clear - system is already empty!");
      return;
    }

    // Clear all documents
    const deleteResult = await Document.deleteMany({});

    console.log(
      `🗑️ Deleted ${deleteResult.deletedCount} documents successfully!`
    );

    // Verify deletion
    const remainingDocuments = await Document.countDocuments();
    console.log(`📊 Remaining documents: ${remainingDocuments}`);

    if (remainingDocuments === 0) {
      console.log("✅ All documents cleared successfully!");
    } else {
      console.log("⚠️ Some documents may still exist - check manually");
    }

    console.log("\n" + "=".repeat(70));
    console.log("🎯 System Ready for Fresh Document Creation:");
    console.log("   • All old documents removed");
    console.log("   • New improved templates are ready");
    console.log("   • Create new projects to generate fresh documents");
    console.log("   • Documents will use the new professional templates");
  } catch (error) {
    console.error("❌ Error clearing documents:", error);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
  }
}

// Run the script
clearAllDocuments();
