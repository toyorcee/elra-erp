import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import Document from "../models/Document.js";
import Department from "../models/Department.js";
import Company from "../models/Company.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.error("❌ MONGODB_URI is not defined in environment variables");
      console.log(
        "💡 Please make sure you have a .env file in the server directory"
      );
      console.log(
        "💡 The .env file should contain: MONGODB_URI=your_mongodb_connection_string"
      );
      process.exit(1);
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      maxPoolSize: 10,
      minPoolSize: 1,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    console.log("🔄 Retrying in 5 seconds...");
    setTimeout(connectDB, 5000);
  }
};

const updateExistingData = async () => {
  try {
    console.log("🚀 Updating existing data...\n");

    await connectDB();
    // Get the default company for existing Super Admin
    const defaultCompany = await Company.findOne({ name: "EDMS Platform" });

    if (!defaultCompany) {
      console.log(
        "❌ Default company not found. Please run updateExistingSuperAdmin.js first"
      );
      return;
    }

    console.log("Using default company:", defaultCompany.name);

    // Update Users without company field
    const usersWithoutCompany = await User.find({
      company: { $exists: false },
    });

    console.log(
      `Found ${usersWithoutCompany.length} users without company field`
    );

    if (usersWithoutCompany.length > 0) {
      const userUpdateResult = await User.updateMany(
        { company: { $exists: false } },
        { company: defaultCompany._id }
      );
      console.log(
        `✅ Updated ${userUpdateResult.modifiedCount} users with company field`
      );
    }

    // Update Documents without company field
    const documentsWithoutCompany = await Document.find({
      company: { $exists: false },
    });

    console.log(
      `Found ${documentsWithoutCompany.length} documents without company field`
    );

    if (documentsWithoutCompany.length > 0) {
      const documentUpdateResult = await Document.updateMany(
        { company: { $exists: false } },
        { company: defaultCompany._id }
      );
      console.log(
        `✅ Updated ${documentUpdateResult.modifiedCount} documents with company field`
      );
    }

    // Update Departments without company field
    const departmentsWithoutCompany = await Department.find({
      company: { $exists: false },
    });

    console.log(
      `Found ${departmentsWithoutCompany.length} departments without company field`
    );

    if (departmentsWithoutCompany.length > 0) {
      const departmentUpdateResult = await Department.updateMany(
        { company: { $exists: false } },
        { company: defaultCompany._id }
      );
      console.log(
        `✅ Updated ${departmentUpdateResult.modifiedCount} departments with company field`
      );
    }

    // Verification
    const remainingUsersWithoutCompany = await User.countDocuments({
      company: { $exists: false },
    });
    const remainingDocumentsWithoutCompany = await Document.countDocuments({
      company: { $exists: false },
    });
    const remainingDepartmentsWithoutCompany = await Department.countDocuments({
      company: { $exists: false },
    });

    console.log("\n📊 Verification Results:");
    console.log(`Users without company: ${remainingUsersWithoutCompany}`);
    console.log(
      `Documents without company: ${remainingDocumentsWithoutCompany}`
    );
    console.log(
      `Departments without company: ${remainingDepartmentsWithoutCompany}`
    );

    if (
      remainingUsersWithoutCompany === 0 &&
      remainingDocumentsWithoutCompany === 0 &&
      remainingDepartmentsWithoutCompany === 0
    ) {
      console.log(
        "✅ All existing data has been successfully updated with company field"
      );
    } else {
      console.log(
        "⚠️  Some data still needs company field. Please check manually."
      );
    }

    console.log("\n" + "=".repeat(60));
    console.log("🎉 DATA UPDATE COMPLETED SUCCESSFULLY!");
    console.log("=".repeat(60));
  } catch (error) {
    console.error("❌ Error updating existing data:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Database disconnected");
  }
};

// Run the setup
updateExistingData();
