import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import Company from "../models/Company.js";
import Role from "../models/Role.js";
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

const updateExistingSuperAdmin = async () => {
  try {
    console.log("🚀 Updating existing Super Admin...\n");

    await connectDB();
    // Find the existing Super Admin user (Olaniyan Toyosi)
    const existingSuperAdmin = await User.findOne({
      email: "oluwatoyosiolaniyan@gmail.com",
    }).populate("role");

    if (!existingSuperAdmin) {
      console.log("❌ Existing Super Admin user not found");
      return;
    }

    console.log("Found existing Super Admin:", existingSuperAdmin.email);

    // Check if user already has a company
    if (existingSuperAdmin.company) {
      console.log(
        "✅ User already has a company associated:",
        existingSuperAdmin.company
      );
      return;
    }

    // Find or create a default company for the existing Super Admin
    let defaultCompany = await Company.findOne({ name: "EDMS Platform" });

    if (!defaultCompany) {
      console.log("Creating default company for existing Super Admin...");

      defaultCompany = new Company({
        name: "EDMS Platform",
        description: "Default company for existing Super Admin user",
        industry: "Technology",
        address: {
          street: "123 Main Street",
          city: "Lagos",
          state: "Lagos",
          postalCode: "100001",
          country: "Nigeria",
        },
        contactInfo: {
          email: "admin@edmsplatform.com",
          phone: "+2341234567890",
          website: "https://edmsplatform.com",
        },
        settings: {
          maxFileSize: 10 * 1024 * 1024, // 10MB
          allowedFileTypes: [
            "pdf",
            "doc",
            "docx",
            "xls",
            "xlsx",
            "ppt",
            "pptx",
            "txt",
          ],
          sessionTimeout: 30 * 60, // 30 minutes
          passwordPolicy: {
            minLength: 8,
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
            requireSpecialChars: true,
          },
        },
        isActive: true,
        createdBy: existingSuperAdmin._id,
      });

      await defaultCompany.save();
      console.log("✅ Created default company:", defaultCompany.name);
    } else {
      console.log("✅ Found existing default company:", defaultCompany.name);
    }

    // Update the Super Admin user with the company
    existingSuperAdmin.company = defaultCompany._id;
    await existingSuperAdmin.save();

    console.log("✅ Successfully updated Super Admin with company association");
    console.log("User:", existingSuperAdmin.email);
    console.log("Company:", defaultCompany.name);
    console.log("Company ID:", defaultCompany._id);

    // Verify the update
    const updatedUser = await User.findById(existingSuperAdmin._id).populate(
      "company"
    );
    console.log(
      "Verification - Updated user company:",
      updatedUser.company?.name
    );

    console.log("\n" + "=".repeat(60));
    console.log("🎉 SUPER ADMIN UPDATE COMPLETED SUCCESSFULLY!");
    console.log("=".repeat(60));
  } catch (error) {
    console.error("❌ Error updating existing Super Admin:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Database disconnected");
  }
};

// Run the setup
updateExistingSuperAdmin();
