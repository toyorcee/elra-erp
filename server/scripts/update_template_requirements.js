import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import DocumentTemplate from "../models/DocumentTemplate.js";

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

async function updateTemplateRequirements() {
  try {
    await connectDB();

    console.log("🔧 Updating template requirements...");
    console.log("=".repeat(70));

    // Core required documents (3-4 essential ones)
    const requiredTemplates = [
      "PROJ_PROPOSAL", // Project Proposal - ALWAYS required
      "BUDGET_BREAKDOWN", // Budget Breakdown - ALWAYS required
      "RISK_ASSESS", // Risk Assessment - ALWAYS required
      "TECH_SPECS", // Technical Specs - ALWAYS required
    ];

    // Optional documents (can be submitted later or waived)
    const optionalTemplates = [
      "FIN_ANALYSIS", // Financial Analysis - Optional
      "LEGAL_REVIEW", // Legal Review - Optional
      "VENDOR_QUOTES", // Vendor Quotes - Optional
    ];

    // Update required templates (keep default behavior)
    for (const code of requiredTemplates) {
      await DocumentTemplate.updateOne(
        { code },
        { $unset: { "triggers.isRequired": "" } } // Remove isRequired field to use default (true)
      );
      console.log(`✅ Required: ${code}`);
    }

    // Update optional templates
    for (const code of optionalTemplates) {
      await DocumentTemplate.updateOne(
        { code },
        { $set: { "triggers.isRequired": false } }
      );
      console.log(`📋 Optional: ${code}`);
    }

    console.log("\n📊 Summary:");
    console.log(`   Required documents: ${requiredTemplates.length}`);
    console.log(`   Optional documents: ${optionalTemplates.length}`);
    console.log(
      `   Total: ${requiredTemplates.length + optionalTemplates.length}`
    );

    console.log("\n✅ Template requirements updated!");
  } catch (error) {
    console.error("❌ Error updating templates:", error);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
  }
}

updateTemplateRequirements();
