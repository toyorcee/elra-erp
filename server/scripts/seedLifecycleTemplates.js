import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import TaskTemplate from "../models/TaskTemplate.js";
import ChecklistTemplate from "../models/ChecklistTemplate.js";
import DocumentType from "../models/DocumentType.js";
import EmployeeLifecycle from "../models/EmployeeLifecycle.js";
import User from "../models/User.js";
import Department from "../models/Department.js";
import Role from "../models/Role.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, "../.env") });

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

// Seed task templates for leasing company
const seedTaskTemplates = async () => {
  console.log("🌱 Seeding task templates...");

  const departments = await Department.find();
  const roles = await Role.find();
  const allUsers = await User.find().populate("role");
  const superAdmin = allUsers.find((user) => user.role?.level === 1000);

  if (!superAdmin) {
    console.error("❌ No Super Admin found. Please create one first.");
    return;
  }

  const taskTemplates = [
    // HR Tasks
    {
      name: "Complete Employment Contract",
      description: "Prepare and sign employment contract with new employee",
      taskType: "Onboarding",
      defaultPriority: "High",
      defaultDueDateOffset: 1,
      isRequired: true,
      instructions: "Ensure all terms are clearly stated and both parties sign",
    },
    {
      name: "Setup Employee Profile",
      description: "Create employee profile in HR system",
      taskType: "Onboarding",
      defaultPriority: "High",
      defaultDueDateOffset: 1,
      isRequired: true,
      instructions: "Enter all employee details and upload required documents",
    },
    {
      name: "Schedule Orientation",
      description: "Arrange company orientation session",
      taskType: "Onboarding",
      defaultPriority: "Medium",
      defaultDueDateOffset: 3,
      isRequired: true,
      instructions: "Coordinate with HR team for orientation scheduling",
    },
    {
      name: "Assign Mentor",
      description: "Assign a mentor to the new employee",
      taskType: "Onboarding",
      defaultPriority: "Medium",
      defaultDueDateOffset: 5,
      isRequired: true,
      instructions: "Select experienced employee from same department",
    },

    // IT Tasks
    {
      name: "Setup Computer & Software",
      description: "Configure computer and install required software",
      taskType: "Onboarding",
      defaultPriority: "High",
      defaultDueDateOffset: 2,
      isRequired: true,
      instructions: "Install all necessary software and configure email",
    },
    {
      name: "Create Email Account",
      description: "Setup company email account",
      taskType: "Onboarding",
      defaultPriority: "High",
      defaultDueDateOffset: 1,
      isRequired: true,
      instructions: "Create email with standard naming convention",
    },
    {
      name: "Setup Access Cards",
      description: "Issue building and system access cards",
      taskType: "Onboarding",
      defaultPriority: "Medium",
      defaultDueDateOffset: 2,
      isRequired: true,
      instructions: "Program access cards for building and system access",
    },

    // Finance Tasks
    {
      name: "Setup Payroll",
      description: "Add employee to payroll system",
      taskType: "Onboarding",
      defaultPriority: "High",
      defaultDueDateOffset: 1,
      isRequired: true,
      instructions: "Enter salary details and banking information",
    },
    {
      name: "Setup Benefits",
      description: "Enroll employee in benefits program",
      taskType: "Onboarding",
      defaultPriority: "Medium",
      defaultDueDateOffset: 7,
      isRequired: true,
      instructions: "Complete benefits enrollment forms",
    },

    // Offboarding Tasks
    {
      name: "Exit Interview",
      description: "Conduct exit interview with departing employee",
      taskType: "Offboarding",
      defaultPriority: "High",
      defaultDueDateOffset: 1,
      isRequired: true,
      instructions: "Schedule and conduct comprehensive exit interview",
    },
    {
      name: "Collect Company Assets",
      description: "Retrieve all company equipment and assets",
      taskType: "Offboarding",
      defaultPriority: "High",
      defaultDueDateOffset: 1,
      isRequired: true,
      instructions: "Collect laptop, phone, access cards, and other equipment",
    },
    {
      name: "Revoke System Access",
      description: "Remove all system and building access",
      taskType: "Offboarding",
      defaultPriority: "Critical",
      defaultDueDateOffset: 0,
      isRequired: true,
      instructions: "Immediately revoke all system and building access",
    },
    {
      name: "Final Payroll Processing",
      description: "Process final salary and benefits",
      taskType: "Offboarding",
      defaultPriority: "High",
      defaultDueDateOffset: 3,
      isRequired: true,
      instructions:
        "Calculate and process final salary, unused leave, and benefits",
    },
  ];

  for (const template of taskTemplates) {
    const existingTemplate = await TaskTemplate.findOne({
      name: template.name,
      taskType: template.taskType,
    });

    if (!existingTemplate) {
      await TaskTemplate.create({
        ...template,
        createdBy: superAdmin._id,
      });
      console.log(`✅ Created task template: ${template.name}`);
    } else {
      console.log(`⏭️ Task template already exists: ${template.name}`);
    }
  }
};

// Seed checklist templates
const seedChecklistTemplates = async () => {
  console.log("🌱 Seeding checklist templates...");

  const allUsers = await User.find().populate("role");
  const superAdmin = allUsers.find((user) => user.role?.level === 1000);

  const checklistTemplates = [
    {
      name: "HR Onboarding Checklist",
      description: "Complete HR onboarding requirements",
      checklistType: "Onboarding",
      items: [
        {
          item: "Employment contract signed",
          description: "Employee has signed employment contract",
          isRequired: true,
          instructions: "Ensure contract is properly signed and filed",
          order: 1,
        },
        {
          item: "Employee profile created",
          description: "Employee profile setup in HR system",
          isRequired: true,
          instructions: "Complete all required fields in HR system",
          order: 2,
        },
        {
          item: "Emergency contacts added",
          description: "Emergency contact information recorded",
          isRequired: true,
          instructions: "Add at least two emergency contacts",
          order: 3,
        },
        {
          item: "Banking details provided",
          description: "Employee banking information for payroll",
          isRequired: true,
          instructions: "Collect and verify banking details",
          order: 4,
        },
        {
          item: "Tax forms completed",
          description: "All required tax forms submitted",
          isRequired: true,
          instructions: "Complete W-4 or equivalent tax forms",
          order: 5,
        },
      ],
    },
    {
      name: "IT Setup Checklist",
      description: "Complete IT equipment and access setup",
      checklistType: "Onboarding",
      items: [
        {
          item: "Computer assigned and configured",
          description: "Employee has working computer with required software",
          isRequired: true,
          instructions: "Install all necessary software and configure settings",
          order: 1,
        },
        {
          item: "Email account created",
          description: "Company email account is active",
          isRequired: true,
          instructions: "Create email with standard naming convention",
          order: 2,
        },
        {
          item: "Access cards issued",
          description: "Building and system access cards provided",
          isRequired: true,
          instructions: "Program and issue access cards",
          order: 3,
        },
        {
          item: "VPN access configured",
          description: "Remote access VPN is working",
          isRequired: false,
          instructions: "Configure VPN if remote work is required",
          order: 4,
        },
        {
          item: "Phone extension assigned",
          description: "Company phone extension is active",
          isRequired: false,
          instructions: "Assign phone extension if required",
          order: 5,
        },
      ],
    },
    {
      name: "Offboarding Checklist",
      description: "Complete offboarding process",
      checklistType: "Offboarding",
      items: [
        {
          item: "Exit interview conducted",
          description: "Exit interview completed with HR",
          isRequired: true,
          instructions: "Schedule and conduct comprehensive exit interview",
          order: 1,
        },
        {
          item: "Company assets returned",
          description: "All company equipment collected",
          isRequired: true,
          instructions:
            "Collect laptop, phone, access cards, and other equipment",
          order: 2,
        },
        {
          item: "System access revoked",
          description: "All system and building access removed",
          isRequired: true,
          instructions: "Immediately revoke all access",
          order: 3,
        },
        {
          item: "Final payroll processed",
          description: "Final salary and benefits calculated",
          isRequired: true,
          instructions: "Process final salary, unused leave, and benefits",
          order: 4,
        },
        {
          item: "Exit documentation completed",
          description: "All exit forms and documentation filed",
          isRequired: true,
          instructions: "Complete and file all exit documentation",
          order: 5,
        },
      ],
    },
  ];

  for (const template of checklistTemplates) {
    const existingTemplate = await ChecklistTemplate.findOne({
      name: template.name,
      checklistType: template.checklistType,
    });

    if (!existingTemplate) {
      await ChecklistTemplate.create({
        ...template,
        createdBy: superAdmin._id,
      });
      console.log(`✅ Created checklist template: ${template.name}`);
    } else {
      console.log(`⏭️ Checklist template already exists: ${template.name}`);
    }
  }
};

// Seed document types
const seedDocumentTypes = async () => {
  console.log("🌱 Seeding document types...");

  const allUsers = await User.find().populate("role");
  const superAdmin = allUsers.find((user) => user.role?.level === 1000);

  const documentTypes = [
    {
      name: "Employment Contract",
      description: "Signed employment contract",
      category: "Employment",
      isRequired: true,
      requiresVerification: true,
      allowedFileTypes: ["pdf", "doc", "docx"],
      maxFileSize: 5,
      instructions: "Upload signed employment contract",
    },
    {
      name: "Government ID",
      description: "Valid government-issued identification",
      category: "Personal",
      isRequired: true,
      requiresVerification: true,
      allowedFileTypes: ["pdf", "jpg", "jpeg", "png"],
      maxFileSize: 2,
      instructions: "Upload clear copy of government ID",
    },
    {
      name: "Resume/CV",
      description: "Current resume or curriculum vitae",
      category: "Employment",
      isRequired: true,
      requiresVerification: false,
      allowedFileTypes: ["pdf", "doc", "docx"],
      maxFileSize: 3,
      instructions: "Upload current resume or CV",
    },
    {
      name: "Educational Certificates",
      description: "Relevant educational certificates and degrees",
      category: "Employment",
      isRequired: false,
      requiresVerification: true,
      allowedFileTypes: ["pdf", "jpg", "jpeg", "png"],
      maxFileSize: 5,
      instructions: "Upload relevant educational certificates",
    },
    {
      name: "Professional Certifications",
      description: "Professional certifications and licenses",
      category: "Employment",
      isRequired: false,
      requiresVerification: true,
      allowedFileTypes: ["pdf", "jpg", "jpeg", "png"],
      maxFileSize: 5,
      instructions: "Upload professional certifications if applicable",
    },
    {
      name: "Banking Information",
      description: "Bank account details for payroll",
      category: "Financial",
      isRequired: true,
      requiresVerification: false,
      allowedFileTypes: ["pdf", "jpg", "jpeg", "png"],
      maxFileSize: 2,
      instructions: "Upload bank account details or void check",
    },
    {
      name: "Emergency Contact Form",
      description: "Emergency contact information form",
      category: "Personal",
      isRequired: true,
      requiresVerification: false,
      allowedFileTypes: ["pdf", "doc", "docx"],
      maxFileSize: 1,
      instructions: "Complete and upload emergency contact form",
    },
  ];

  for (const docType of documentTypes) {
    const existingDocType = await DocumentType.findOne({
      name: docType.name,
      category: docType.category,
    });

    if (!existingDocType) {
      await DocumentType.create({
        ...docType,
        createdBy: superAdmin._id,
      });
      console.log(`✅ Created document type: ${docType.name}`);
    } else {
      console.log(`⏭️ Document type already exists: ${docType.name}`);
    }
  }
};

// Initialize lifecycles for existing users
const initializeLifecyclesForExistingUsers = async () => {
  console.log("🔄 Initializing lifecycles for existing users...");

  const users = await User.find({ status: "ACTIVE" }).populate(
    "department role"
  );
  const allUsers = await User.find().populate("role");
  const superAdmin = allUsers.find((user) => user.role?.level === 1000);

  console.log(`👥 Found ${users.length} active users to process`);
  console.log(
    `👑 Super Admin: ${superAdmin?.firstName} ${superAdmin?.lastName}`
  );

  let createdCount = 0;
  let skippedCount = 0;

  for (const user of users) {
    console.log(
      `\n🔍 Processing user: ${user.firstName} ${user.lastName} (${user.email})`
    );
    console.log(
      `   🏢 Department: ${user.department?.name} (${user.department?.code})`
    );
    console.log(`   👔 Role: ${user.role?.name} (Level: ${user.role?.level})`);
    console.log(`   🆔 Employee ID: ${user.employeeId || "Not assigned"}`);

    // Check if user already has an onboarding lifecycle
    const existingOnboarding = await EmployeeLifecycle.findOne({
      employee: user._id,
      type: "Onboarding",
    });

    const existingOffboarding = await EmployeeLifecycle.findOne({
      employee: user._id,
      type: "Offboarding",
    });

    if (existingOnboarding && existingOffboarding) {
      console.log(
        `   ⏭️ Both lifecycles already exist for ${user.firstName} ${user.lastName}`
      );
      skippedCount++;
      continue;
    }

    try {
      // Create Onboarding lifecycle if it doesn't exist
      if (!existingOnboarding) {
        console.log(`   🔄 Creating Onboarding lifecycle...`);
        const onboardingLifecycle = await EmployeeLifecycle.createFromTemplates(
          user._id,
          "Onboarding",
          user.department._id,
          user.role._id,
          superAdmin._id,
          superAdmin._id
        );

        // Mark as completed since they're already active employees
        onboardingLifecycle.status = "Completed";
        onboardingLifecycle.actualCompletionDate = user.createdAt || new Date();

        // Mark all checklist items as completed
        if (onboardingLifecycle.checklist) {
          onboardingLifecycle.checklist.forEach((item) => {
            item.isCompleted = true;
            item.completedBy = superAdmin._id;
            item.completedAt = user.createdAt || new Date();
          });
        }

        await onboardingLifecycle.save();
        console.log(
          `   ✅ Onboarding lifecycle created and marked as completed`
        );
        createdCount++;
      }

      // Create Offboarding lifecycle if it doesn't exist
      if (!existingOffboarding) {
        console.log(`   🔄 Creating Offboarding lifecycle...`);
        const offboardingLifecycle =
          await EmployeeLifecycle.createFromTemplates(
            user._id,
            "Offboarding",
            user.department._id,
            user.role._id,
            superAdmin._id,
            superAdmin._id
          );

        // Mark offboarding as "On Hold" since employee is just starting
        offboardingLifecycle.status = "On Hold";
        offboardingLifecycle.notes =
          "Offboarding lifecycle created for future use when employee leaves the company";
        await offboardingLifecycle.save();
        console.log(
          `   ✅ Offboarding lifecycle created and marked as pending`
        );
        createdCount++;
      }
    } catch (error) {
      console.error(
        `   ❌ Error creating lifecycles for ${user.firstName} ${user.lastName}:`,
        error.message
      );
    }
  }

  console.log(`\n📊 Lifecycle initialization complete:`);
  console.log(`   ✅ Created: ${createdCount} lifecycles`);
  console.log(`   ⏭️ Skipped: ${skippedCount} users (already had lifecycles)`);
};

// Main execution
const main = async () => {
  try {
    await connectDB();

    console.log(
      "🚀 Starting lifecycle template seeding and user initialization..."
    );

    // Seed templates
    await seedTaskTemplates();
    await seedChecklistTemplates();
    await seedDocumentTypes();

    // Initialize lifecycles for existing users
    await initializeLifecyclesForExistingUsers();

    console.log("🎉 All seeding and initialization completed successfully!");
  } catch (error) {
    console.error("❌ Error during seeding:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
    process.exit(0);
  }
};

// Run the script
main();
