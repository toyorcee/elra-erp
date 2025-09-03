import mongoose from "mongoose";
import dotenv from "dotenv";
import Department from "../models/Department.js";

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

const createProjectManagementDepartment = async () => {
  try {
    console.log("🏗️ Creating Project Management Department...");

    // Check if department already exists
    const existingDept = await Department.findOne({
      name: "Project Management",
    });
    if (existingDept) {
      console.log("⚠️ Project Management department already exists");
      return existingDept;
    }

    // Create the department
    const projectManagementDept = new Department({
      name: "Project Management",
      code: "PM",
      description:
        "Project management and coordination department responsible for overseeing all projects across the organization",
      level: 80, // Between Operations (75) and Finance (85)
      parentDepartment: null,
      manager: null,
      isActive: true,
      settings: {
        allowDocumentUpload: true,
        requireApproval: true,
        maxFileSize: 10,
        allowedFileTypes: [],
      },
    });

    await projectManagementDept.save();
    console.log("✅ Project Management department created successfully");
    console.log(`   ID: ${projectManagementDept._id}`);
    console.log(`   Name: ${projectManagementDept.name}`);
    console.log(`   Code: ${projectManagementDept.code}`);
    console.log(`   Level: ${projectManagementDept.level}`);

    return projectManagementDept;
  } catch (error) {
    console.error("❌ Error creating Project Management department:", error);
    throw error;
  }
};

// Run the script
connectDB().then(() => {
  createProjectManagementDepartment()
    .then(() => {
      console.log("✅ Script completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Script failed:", error);
      process.exit(1);
    });
});
