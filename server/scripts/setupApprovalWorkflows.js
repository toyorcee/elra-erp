import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Import models
import Company from "../models/Company.js";
import Department from "../models/Department.js";
import ApprovalLevel from "../models/ApprovalLevel.js";
import WorkflowTemplate from "../models/WorkflowTemplate.js";
import User from "../models/User.js";

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

async function setupApprovalWorkflows() {
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

    // Find super admin user
    const superAdmin = await User.findOne({ isSuperadmin: true });
    if (!superAdmin) {
      console.log("❌ No super admin found.");
      return;
    }

    // Get departments
    const departments = await Department.find({ company: company._id }).sort({
      level: 1,
    });

    console.log("\n📋 Setting up Approval Levels...");
    console.log("-".repeat(60));

    // Create approval levels based on department hierarchy
    const approvalLevels = [
      {
        name: "Department Level",
        level: 10,
        description: "Department-level approval for routine documents",
        permissions: {
          canApprove: true,
          canReject: true,
          canRoute: true,
          canView: true,
          canEdit: true,
          canDelete: false,
        },
        documentTypes: [
          "insurance_policy",
          "claims_document",
          "financial_report",
          "client_correspondence",
          "regulatory_compliance",
          "underwriting_document",
          "general",
        ],
      },
      {
        name: "Executive Management",
        level: 50,
        description: "Final approval level for all documents",
        permissions: {
          canApprove: true,
          canReject: true,
          canRoute: false,
          canView: true,
          canEdit: false,
          canDelete: false,
        },
        documentTypes: [
          "insurance_policy",
          "claims_document",
          "financial_report",
          "client_correspondence",
          "regulatory_compliance",
          "underwriting_document",
          "general",
        ],
      },
    ];

    // Create approval levels
    const createdApprovalLevels = [];
    for (const levelData of approvalLevels) {
      try {
        const existingLevel = await ApprovalLevel.findOne({
          company: company._id,
          name: levelData.name,
        });

        if (existingLevel) {
          console.log(`✅ Approval Level "${levelData.name}" already exists`);
          createdApprovalLevels.push(existingLevel);
        } else {
          const approvalLevel = await ApprovalLevel.create({
            ...levelData,
            company: company._id,
            createdBy: superAdmin._id,
          });
          console.log(
            `✅ Created Approval Level: ${approvalLevel.name} (Level ${approvalLevel.level})`
          );
          createdApprovalLevels.push(approvalLevel);
        }
      } catch (error) {
        console.log(
          `❌ Failed to create approval level "${levelData.name}": ${error.message}`
        );
      }
    }

    console.log("\n📋 Setting up Workflow Templates...");
    console.log("-".repeat(60));

    // Create workflow templates
    const workflowTemplates = [
      {
        name: "Claims Processing Workflow",
        description: "Standard workflow for claims documents",
        documentType: "claims_document",
        steps: [
          {
            order: 1,
            approvalLevel: createdApprovalLevels.find(
              (l) => l.name === "Department Level"
            )._id,
            isRequired: true,
            canSkip: false,
            autoApprove: false,
          },
          {
            order: 2,
            approvalLevel: createdApprovalLevels.find(
              (l) => l.name === "Executive Management"
            )._id,
            isRequired: true,
            canSkip: false,
            autoApprove: false,
          },
        ],
      },
      {
        name: "Policy Approval Workflow",
        description: "Standard workflow for insurance policies",
        documentType: "insurance_policy",
        steps: [
          {
            order: 1,
            approvalLevel: createdApprovalLevels.find(
              (l) => l.name === "Department Level"
            )._id,
            isRequired: true,
            canSkip: false,
            autoApprove: false,
          },
          {
            order: 2,
            approvalLevel: createdApprovalLevels.find(
              (l) => l.name === "Executive Management"
            )._id,
            isRequired: true,
            canSkip: false,
            autoApprove: false,
          },
        ],
      },
      {
        name: "Financial Report Workflow",
        description: "Standard workflow for financial reports",
        documentType: "financial_report",
        steps: [
          {
            order: 1,
            approvalLevel: createdApprovalLevels.find(
              (l) => l.name === "Department Level"
            )._id,
            isRequired: true,
            canSkip: false,
            autoApprove: false,
          },
          {
            order: 2,
            approvalLevel: createdApprovalLevels.find(
              (l) => l.name === "Executive Management"
            )._id,
            isRequired: true,
            canSkip: false,
            autoApprove: false,
          },
        ],
      },
      {
        name: "General Document Workflow",
        description: "Default workflow for all other documents",
        documentType: "general",
        steps: [
          {
            order: 1,
            approvalLevel: createdApprovalLevels.find(
              (l) => l.name === "Department Level"
            )._id,
            isRequired: true,
            canSkip: false,
            autoApprove: false,
          },
          {
            order: 2,
            approvalLevel: createdApprovalLevels.find(
              (l) => l.name === "Executive Management"
            )._id,
            isRequired: true,
            canSkip: false,
            autoApprove: false,
          },
        ],
      },
    ];

    // Create workflow templates
    for (const templateData of workflowTemplates) {
      try {
        const existingTemplate = await WorkflowTemplate.findOne({
          company: company._id,
          name: templateData.name,
        });

        if (existingTemplate) {
          console.log(
            `✅ Workflow Template "${templateData.name}" already exists`
          );
        } else {
          const workflowTemplate = await WorkflowTemplate.create({
            ...templateData,
            company: company._id,
            createdBy: superAdmin._id,
          });
          console.log(`✅ Created Workflow Template: ${workflowTemplate.name}`);
        }
      } catch (error) {
        console.log(
          `❌ Failed to create workflow template "${templateData.name}": ${error.message}`
        );
      }
    }

    console.log("\n🎉 Approval Workflow Setup Complete!");
    console.log("=".repeat(80));
    console.log("📋 Document Flow Now Works:");
    console.log("1. User creates document → PENDING_APPROVAL");
    console.log("2. Department Level reviews → Can approve/reject/route");
    console.log("3. Executive Management gives final approval → APPROVED");
    console.log("4. Document becomes available to all authorized users");

    console.log("\n🚀 Ready for Testing:");
    console.log("- Create a document in any department");
    console.log("- Submit for approval");
    console.log("- Approve at department level");
    console.log("- Final approval by Executive Management");
  } catch (error) {
    console.error("❌ Error during workflow setup:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Database connection closed");
  }
}

setupApprovalWorkflows();
