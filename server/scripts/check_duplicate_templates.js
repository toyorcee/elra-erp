import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
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

async function checkDuplicateTemplates() {
  try {
    await connectDB();

    console.log("🔍 Checking for duplicate document templates...");
    console.log("=".repeat(70));

    // Get all templates
    const allTemplates = await DocumentTemplate.find({});
    console.log(`📊 Total templates found: ${allTemplates.length}`);

    // Check for duplicates by templateType
    const templateTypes = {};
    const duplicates = [];

    allTemplates.forEach((template) => {
      const type = template.templateType;
      if (!templateTypes[type]) {
        templateTypes[type] = [];
      }
      templateTypes[type].push(template);
    });

    // Find duplicates
    Object.entries(templateTypes).forEach(([type, templates]) => {
      if (templates.length > 1) {
        duplicates.push({
          type,
          count: templates.length,
          templates: templates.map((t) => ({
            id: t._id,
            name: t.name,
            code: t.code,
            category: t.category,
          })),
        });
      }
    });

    if (duplicates.length === 0) {
      console.log("✅ No duplicate templates found!");
    } else {
      console.log(`⚠️ Found ${duplicates.length} duplicate template types:`);
      duplicates.forEach((dup) => {
        console.log(`\n📄 ${dup.type} (${dup.count} templates):`);
        dup.templates.forEach((t) => {
          console.log(`   - ${t.name} (${t.code}) - ${t.category}`);
        });
      });
    }

    // Test template matching for software_development project
    console.log("\n" + "=".repeat(70));
    console.log(
      "🧪 Testing template matching for software_development project:"
    );

    const testTemplates = await DocumentTemplate.getTemplatesForProject(
      "software_development",
      15000000, // 15M budget
      "HOD",
      "executive"
    );

    console.log(
      `📄 Found ${testTemplates.length} templates for software_development project:`
    );
    testTemplates.forEach((template) => {
      console.log(`   - ${template.name} (${template.templateType})`);
    });

    console.log("\n" + "=".repeat(70));
    console.log("🎯 Analysis Complete!");
  } catch (error) {
    console.error("❌ Error checking templates:", error);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
  }
}

// Run the script
checkDuplicateTemplates();
