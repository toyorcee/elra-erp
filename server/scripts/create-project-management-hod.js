import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "../models/User.js";
import Role from "../models/Role.js";
import Department from "../models/Department.js";

dotenv.config();

// Department and Role IDs
const PROJECT_MANAGEMENT_DEPT_ID = "68b6ce10f9fd51efbd41d1a5"
;
const HOD_ROLE_LEVEL = 700;

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

async function createProjectManagementHOD() {
  try {
    await connectDB();

    // Verify Project Management department exists
    const projectDept = await Department.findById(PROJECT_MANAGEMENT_DEPT_ID);
    if (!projectDept) {
      throw new Error(
        `Project Management department not found with ID: ${PROJECT_MANAGEMENT_DEPT_ID}`
      );
    }
    console.log("✅ Project Management department found:", projectDept.name);

    // Find HOD role (level 700)
    const hodRole = await Role.findOne({ level: HOD_ROLE_LEVEL });
    if (!hodRole) {
      throw new Error(`HOD role (level ${HOD_ROLE_LEVEL}) not found`);
    }
    console.log(
      "✅ HOD role found:",
      hodRole.name,
      "(level",
      hodRole.level + ")"
    );

    // Check if Project Management HOD already exists
    const existingHOD = await User.findOne({
      department: PROJECT_MANAGEMENT_DEPT_ID,
      "role.level": HOD_ROLE_LEVEL,
    }).populate("role");

    if (existingHOD) {
      console.log("⚠️ Project Management HOD already exists:");
      console.log("   Name:", existingHOD.firstName, existingHOD.lastName);
      console.log("   Email:", existingHOD.email);
      console.log("   Role:", existingHOD.role.name);
      return;
    }

    // Create Project Management HOD
    // Note: User model will automatically hash the password in pre-save hook
    const projectHOD = new User({
      username: "pm.hod",
      firstName: "Project",
      lastName: "Management HOD",
      email: "pm.hod@elra.com",
      password: "HODelra@2025", // Plain text - will be hashed automatically
      role: hodRole._id,
      department: projectDept._id,
      position: "Head of Department",
      jobTitle: "Project Management HOD",
      employeeId: "PM-HOD-001",
      isActive: true,
      isEmailVerified: true,
      phone: "+2348012345678",
    });

    await projectHOD.save();
    console.log("✅ Project Management HOD created successfully!");
    console.log("   Name:", projectHOD.firstName, projectHOD.lastName);
    console.log("   Email:", projectHOD.email);
    console.log("   Username:", projectHOD.username);
    console.log("   Password: HODelra@2025");
    console.log("   Department:", projectDept.name);
    console.log("   Role:", hodRole.name);

    // Update department manager
    projectDept.manager = projectHOD._id;
    await projectDept.save();
    console.log("✅ Department manager updated");
  } catch (error) {
    console.error("❌ Error creating Project Management HOD:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

// Run the script
createProjectManagementHOD();
