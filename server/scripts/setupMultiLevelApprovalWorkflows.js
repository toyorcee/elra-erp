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

async function setupMultiLevelApprovalWorkflows() {
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

    // Get departments sorted by level
    const departments = await Department.find({ company: company._id }).sort({
      level: 1,
    });

    console.log("\n📋 Setting up Multi-Level Approval Levels...");
    console.log("-".repeat(60));

    // Create approval levels for each department level
    const approvalLevels = [
      {
        name: "Claims Department Approval",
        level: 10,
        description: "Claims Department (Level 10) - Initial document review",
        department: "Claims Department",
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
        name: "Underwriting Department Approval",
        level: 15,
        description: "Underwriting Department (Level 15) - Policy review",
        department: "Underwriting Department",
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
        name: "Regional Operations Approval",
        level: 20,
        description: "Regional Operations (Level 20) - Operational review",
        department: "Regional Operations",
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
        name: "Compliance & Audit Approval",
        level: 25,
        description: "Compliance & Audit (Level 25) - Compliance review",
        department: "Compliance & Audit",
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
        name: "Finance & Accounting Approval",
        level: 30,
        description: "Finance & Accounting (Level 30) - Financial review",
        department: "Finance & Accounting",
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
        name: "Human Resources Approval",
        level: 35,
        description: "Human Resources (Level 35) - HR policy review",
        department: "Human Resources",
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
        name: "Information Technology Approval",
        level: 40,
        description: "Information Technology (Level 40) - Technical review",
        department: "Information Technology",
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
        name: "Executive Management Final Approval",
        level: 50,
        description: "Executive Management (Level 50) - Final approval",
        department: "Executive Management",
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

    console.log("\n📋 Setting up Multi-Level Workflow Templates...");
    console.log("-".repeat(60));

    // Create comprehensive workflow templates
    const workflowTemplates = [
      {
        name: "Claims Processing Workflow (8-Level)",
        description: "Complete 8-level approval workflow for claims documents",
        documentType: "claims_document",
        steps: [
          {
            order: 1,
            approvalLevel: createdApprovalLevels.find(
              (l) => l.name === "Claims Department Approval"
            )._id,
            isRequired: true,
            canSkip: false,
            autoApprove: false,
          },
          {
            order: 2,
            approvalLevel: createdApprovalLevels.find(
              (l) => l.name === "Underwriting Department Approval"
            )._id,
            isRequired: true,
            canSkip: false,
            autoApprove: false,
          },
          {
            order: 3,
            approvalLevel: createdApprovalLevels.find(
              (l) => l.name === "Regional Operations Approval"
            )._id,
            isRequired: true,
            canSkip: false,
            autoApprove: false,
          },
          {
            order: 4,
            approvalLevel: createdApprovalLevels.find(
              (l) => l.name === "Compliance & Audit Approval"
            )._id,
            isRequired: true,
            canSkip: false,
            autoApprove: false,
          },
          {
            order: 5,
            approvalLevel: createdApprovalLevels.find(
              (l) => l.name === "Finance & Accounting Approval"
            )._id,
            isRequired: true,
            canSkip: false,
            autoApprove: false,
          },
          {
            order: 6,
            approvalLevel: createdApprovalLevels.find(
              (l) => l.name === "Human Resources Approval"
            )._id,
            isRequired: true,
            canSkip: false,
            autoApprove: false,
          },
          {
            order: 7,
            approvalLevel: createdApprovalLevels.find(
              (l) => l.name === "Information Technology Approval"
            )._id,
            isRequired: true,
            canSkip: false,
            autoApprove: false,
          },
          {
            order: 8,
            approvalLevel: createdApprovalLevels.find(
              (l) => l.name === "Executive Management Final Approval"
            )._id,
            isRequired: true,
            canSkip: false,
            autoApprove: false,
          },
        ],
      },
      {
        name: "Policy Approval Workflow (8-Level)",
        description:
          "Complete 8-level approval workflow for insurance policies",
        documentType: "insurance_policy",
        steps: [
          {
            order: 1,
            approvalLevel: createdApprovalLevels.find(
              (l) => l.name === "Claims Department Approval"
            )._id,
            isRequired: true,
            canSkip: false,
            autoApprove: false,
          },
          {
            order: 2,
            approvalLevel: createdApprovalLevels.find(
              (l) => l.name === "Underwriting Department Approval"
            )._id,
            isRequired: true,
            canSkip: false,
            autoApprove: false,
          },
          {
            order: 3,
            approvalLevel: createdApprovalLevels.find(
              (l) => l.name === "Regional Operations Approval"
            )._id,
            isRequired: true,
            canSkip: false,
            autoApprove: false,
          },
          {
            order: 4,
            approvalLevel: createdApprovalLevels.find(
              (l) => l.name === "Compliance & Audit Approval"
            )._id,
            isRequired: true,
            canSkip: false,
            autoApprove: false,
          },
          {
            order: 5,
            approvalLevel: createdApprovalLevels.find(
              (l) => l.name === "Finance & Accounting Approval"
            )._id,
            isRequired: true,
            canSkip: false,
            autoApprove: false,
          },
          {
            order: 6,
            approvalLevel: createdApprovalLevels.find(
              (l) => l.name === "Human Resources Approval"
            )._id,
            isRequired: true,
            canSkip: false,
            autoApprove: false,
          },
          {
            order: 7,
            approvalLevel: createdApprovalLevels.find(
              (l) => l.name === "Information Technology Approval"
            )._id,
            isRequired: true,
            canSkip: false,
            autoApprove: false,
          },
          {
            order: 8,
            approvalLevel: createdApprovalLevels.find(
              (l) => l.name === "Executive Management Final Approval"
            )._id,
            isRequired: true,
            canSkip: false,
            autoApprove: false,
          },
        ],
      },
      {
        name: "Financial Report Workflow (8-Level)",
        description: "Complete 8-level approval workflow for financial reports",
        documentType: "financial_report",
        steps: [
          {
            order: 1,
            approvalLevel: createdApprovalLevels.find(
              (l) => l.name === "Claims Department Approval"
            )._id,
            isRequired: true,
            canSkip: false,
            autoApprove: false,
          },
          {
            order: 2,
            approvalLevel: createdApprovalLevels.find(
              (l) => l.name === "Underwriting Department Approval"
            )._id,
            isRequired: true,
            canSkip: false,
            autoApprove: false,
          },
          {
            order: 3,
            approvalLevel: createdApprovalLevels.find(
              (l) => l.name === "Regional Operations Approval"
            )._id,
            isRequired: true,
            canSkip: false,
            autoApprove: false,
          },
          {
            order: 4,
            approvalLevel: createdApprovalLevels.find(
              (l) => l.name === "Compliance & Audit Approval"
            )._id,
            isRequired: true,
            canSkip: false,
            autoApprove: false,
          },
          {
            order: 5,
            approvalLevel: createdApprovalLevels.find(
              (l) => l.name === "Finance & Accounting Approval"
            )._id,
            isRequired: true,
            canSkip: false,
            autoApprove: false,
          },
          {
            order: 6,
            approvalLevel: createdApprovalLevels.find(
              (l) => l.name === "Human Resources Approval"
            )._id,
            isRequired: true,
            canSkip: false,
            autoApprove: false,
          },
          {
            order: 7,
            approvalLevel: createdApprovalLevels.find(
              (l) => l.name === "Information Technology Approval"
            )._id,
            isRequired: true,
            canSkip: false,
            autoApprove: false,
          },
          {
            order: 8,
            approvalLevel: createdApprovalLevels.find(
              (l) => l.name === "Executive Management Final Approval"
            )._id,
            isRequired: true,
            canSkip: false,
            autoApprove: false,
          },
        ],
      },
      {
        name: "General Document Workflow (8-Level)",
        description:
          "Complete 8-level approval workflow for all other documents",
        documentType: "general",
        steps: [
          {
            order: 1,
            approvalLevel: createdApprovalLevels.find(
              (l) => l.name === "Claims Department Approval"
            )._id,
            isRequired: true,
            canSkip: false,
            autoApprove: false,
          },
          {
            order: 2,
            approvalLevel: createdApprovalLevels.find(
              (l) => l.name === "Underwriting Department Approval"
            )._id,
            isRequired: true,
            canSkip: false,
            autoApprove: false,
          },
          {
            order: 3,
            approvalLevel: createdApprovalLevels.find(
              (l) => l.name === "Regional Operations Approval"
            )._id,
            isRequired: true,
            canSkip: false,
            autoApprove: false,
          },
          {
            order: 4,
            approvalLevel: createdApprovalLevels.find(
              (l) => l.name === "Compliance & Audit Approval"
            )._id,
            isRequired: true,
            canSkip: false,
            autoApprove: false,
          },
          {
            order: 5,
            approvalLevel: createdApprovalLevels.find(
              (l) => l.name === "Finance & Accounting Approval"
            )._id,
            isRequired: true,
            canSkip: false,
            autoApprove: false,
          },
          {
            order: 6,
            approvalLevel: createdApprovalLevels.find(
              (l) => l.name === "Human Resources Approval"
            )._id,
            isRequired: true,
            canSkip: false,
            autoApprove: false,
          },
          {
            order: 7,
            approvalLevel: createdApprovalLevels.find(
              (l) => l.name === "Information Technology Approval"
            )._id,
            isRequired: true,
            canSkip: false,
            autoApprove: false,
          },
          {
            order: 8,
            approvalLevel: createdApprovalLevels.find(
              (l) => l.name === "Executive Management Final Approval"
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

    console.log("\n🎉 Multi-Level Approval Workflow Setup Complete!");
    console.log("=".repeat(80));
    console.log("📋 Complete 8-Level Document Flow:");
    console.log("1. Document Created → Claims Department (Level 10)");
    console.log(
      "2. Underwriting Department (Level 15) → SENIOR_STAFF can approve"
    );
    console.log("3. Regional Operations (Level 20) → SUPERVISOR can approve");
    console.log("4. Compliance & Audit (Level 25) → SENIOR_STAFF can approve");
    console.log(
      "5. Finance & Accounting (Level 30) → SENIOR_STAFF can approve"
    );
    console.log("6. Human Resources (Level 35) → SUPERVISOR can approve");
    console.log(
      "7. Information Technology (Level 40) → SUPERVISOR can approve"
    );
    console.log(
      "8. Executive Management (Level 50) → MANAGER/SUPER_ADMIN final approval"
    );

    console.log("\n🚀 Ready for Testing:");
    console.log("- Create a document in any department");
    console.log("- Document will flow through all 8 levels");
    console.log("- Each level requires appropriate user role to approve");
    console.log("- Final approval by Executive Management");
  } catch (error) {
    console.error("❌ Error during multi-level workflow setup:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Database connection closed");
  }
}

setupMultiLevelApprovalWorkflows();
