import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import Department from "../models/Department.js";

dotenv.config();

const checkDepartments = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const systemAdmin = await Department.findOne({
      name: "System Administration",
    });
    console.log("System Administration Department:", systemAdmin._id);

    const usersInSystemAdmin = await User.find({
      department: systemAdmin._id,
    }).populate("department");
    console.log("Users in System Administration:");
    usersInSystemAdmin.forEach((user) => {
      console.log(
        `- ${user.firstName} ${user.lastName} (${user.employeeId}) - Dept: ${user.department?.name}`
      );
    });

    const allUsers = await User.find({}).populate("department");
    console.log("\nAll Users:");
    allUsers.forEach((user) => {
      console.log(
        `- ${user.firstName} ${user.lastName} (${user.employeeId}) - Dept: ${user.department?.name}`
      );
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error("Error:", error);
  }
};

checkDepartments();
