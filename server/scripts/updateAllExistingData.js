import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import Company from "../models/Company.js";
import Document from "../models/Document.js";
import Department from "../models/Department.js";
import AuditLog from "../models/AuditLog.js";
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
      serverSelectionTimeoutMS: 60000,
      socketTimeoutMS: 60000,
      connectTimeoutMS: 60000,
      maxPoolSize: 10,
      minPoolSize: 1,
      retryWrites: true,
      w: "majority",
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    console.log("🔄 Retrying in 5 seconds...");
    setTimeout(connectDB, 5000);
  }
};

const updateAllExistingData = async () => {
  try {
    console.log("🚀 Updating all existing data to Olaniyan's company...\n");

    await connectDB();

    // Find Olaniyan Toyosi (the original Super Admin)
    const olaniyan = await User.findOne({
      email: "oluwatoyosiolaniyan@gmail.com",
    }).populate("company");

    if (!olaniyan) {
      console.log(
        "❌ Olaniyan Toyosi not found. Please run updateExistingSuperAdmin.js first"
      );
      return;
    }

    if (!olaniyan.company) {
      console.log(
        "❌ Olaniyan doesn't have a company. Please run updateExistingSuperAdmin.js first"
      );
      return;
    }

    console.log("✅ Found Olaniyan:", olaniyan.email);
    console.log("✅ Company:", olaniyan.company.name);
    console.log("✅ Company ID:", olaniyan.company._id);

    const companyId = olaniyan.company._id;

    // 1. Update Documents
    console.log("\n📄 Updating Documents...");
    const documentsWithoutCompany = await Document.find({
      company: { $exists: false },
    });

    console.log(
      `Found ${documentsWithoutCompany.length} documents without company field`
    );

    if (documentsWithoutCompany.length > 0) {
      const documentResult = await Document.updateMany(
        { company: { $exists: false } },
        { $set: { company: companyId } }
      );
      console.log(`✅ Updated ${documentResult.modifiedCount} documents`);
    } else {
      console.log("✅ All documents already have company field");
    }

    // 2. Update Departments
    console.log("\n🏢 Updating Departments...");
    const departmentsWithoutCompany = await Department.find({
      company: { $exists: false },
    });

    console.log(
      `Found ${departmentsWithoutCompany.length} departments without company field`
    );

    if (departmentsWithoutCompany.length > 0) {
      const departmentResult = await Department.updateMany(
        { company: { $exists: false } },
        { $set: { company: companyId } }
      );
      console.log(`✅ Updated ${departmentResult.modifiedCount} departments`);
    } else {
      console.log("✅ All departments already have company field");
    }

    // 3. Update Audit Logs
    console.log("\n📋 Updating Audit Logs...");
    const auditLogsWithoutCompany = await AuditLog.find({
      company: { $exists: false },
    });

    console.log(
      `Found ${auditLogsWithoutCompany.length} audit logs without company field`
    );

    if (auditLogsWithoutCompany.length > 0) {
      const auditLogResult = await AuditLog.updateMany(
        { company: { $exists: false } },
        { $set: { company: companyId } }
      );
      console.log(`✅ Updated ${auditLogResult.modifiedCount} audit logs`);
    } else {
      console.log("✅ All audit logs already have company field");
    }

    // 4. Verification
    console.log("\n🔍 Verification...");

    const remainingDocs = await Document.find({ company: { $exists: false } });
    const remainingDepts = await Department.find({
      company: { $exists: false },
    });
    const remainingLogs = await AuditLog.find({ company: { $exists: false } });

    console.log(`📄 Documents without company: ${remainingDocs.length}`);
    console.log(`🏢 Departments without company: ${remainingDepts.length}`);
    console.log(`📋 Audit logs without company: ${remainingLogs.length}`);

    // 5. Show summary of what belongs to Olaniyan's company
    console.log("\n📊 Summary - Data belonging to Olaniyan's company:");

    const olaniyanDocs = await Document.countDocuments({ company: companyId });
    const olaniyanDepts = await Department.countDocuments({
      company: companyId,
    });
    const olaniyanLogs = await AuditLog.countDocuments({ company: companyId });

    console.log(`📄 Documents: ${olaniyanDocs}`);
    console.log(`🏢 Departments: ${olaniyanDepts}`);
    console.log(`📋 Audit logs: ${olaniyanLogs}`);

    console.log("\n" + "=".repeat(60));
    console.log("🎉 ALL DATA UPDATE COMPLETED SUCCESSFULLY!");
    console.log("=".repeat(60));
    console.log(
      `✅ All existing data now belongs to: ${olaniyan.company.name}`
    );
    console.log(`✅ Company ID: ${companyId}`);
    console.log("=".repeat(60));
  } catch (error) {
    console.error("❌ Error updating existing data:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Database disconnected");
  }
};

// Run the setup
updateAllExistingData();
