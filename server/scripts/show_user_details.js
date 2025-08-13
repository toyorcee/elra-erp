import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Import models
import User from "../models/User.js";
import Role from "../models/Role.js";
import Department from "../models/Department.js";

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

const showUserDetails = async () => {
  try {
    console.log("\n🔍 Fetching detailed user information...\n");

    // Find all users with populated role and department
    const users = await User.find({})
      .select("+password") // Include password field
      .populate("role", "name level description")
      .populate("department", "name description")
      .lean();

    if (users.length === 0) {
      console.log("❌ No users found in the system");
      return;
    }

    console.log(`📊 Found ${users.length} user(s) in the system:\n`);
    console.log("=".repeat(120));
    console.log("DETAILED USER INFORMATION");
    console.log("=".repeat(120));

    users.forEach((user, index) => {
      console.log(`\n👤 User #${index + 1}:`);
      console.log(`   ID: ${user._id}`);
      console.log(`   Name: ${user.name || "N/A"}`);
      console.log(`   Email: ${user.email || "N/A"}`);
      console.log(`   Password: ${user.password || "N/A"}`);
      console.log(`   Phone: ${user.phone || "N/A"}`);
      console.log(`   Address: ${user.address || "N/A"}`);
      console.log(`   Position: ${user.position || "N/A"}`);
      console.log(`   Employee ID: ${user.employeeId || "N/A"}`);
      console.log(`   Date of Birth: ${user.dateOfBirth || "N/A"}`);
      console.log(`   Gender: ${user.gender || "N/A"}`);
      console.log(`   Nationality: ${user.nationality || "N/A"}`);
      console.log(`   Emergency Contact: ${user.emergencyContact || "N/A"}`);
      console.log(`   Emergency Phone: ${user.emergencyPhone || "N/A"}`);
      console.log(`   Blood Group: ${user.bloodGroup || "N/A"}`);
      console.log(`   Marital Status: ${user.maritalStatus || "N/A"}`);
      console.log(`   Join Date: ${user.joinDate || "N/A"}`);
      console.log(`   Salary: ${user.salary || "N/A"}`);
      console.log(`   Bank Name: ${user.bankName || "N/A"}`);
      console.log(`   Account Number: ${user.accountNumber || "N/A"}`);
      console.log(`   Tax ID: ${user.taxId || "N/A"}`);
      console.log(`   Social Security: ${user.socialSecurity || "N/A"}`);
      console.log(`   Skills: ${user.skills ? user.skills.join(", ") : "N/A"}`);
      console.log(`   Certifications: ${user.certifications ? user.certifications.join(", ") : "N/A"}`);
      console.log(`   Languages: ${user.languages ? user.languages.join(", ") : "N/A"}`);
      console.log(`   Profile Picture: ${user.profilePicture || "N/A"}`);
      console.log(`   Cover Photo: ${user.coverPhoto || "N/A"}`);
      console.log(`   Bio: ${user.bio || "N/A"}`);
      console.log(`   Website: ${user.website || "N/A"}`);
      console.log(`   LinkedIn: ${user.linkedin || "N/A"}`);
      console.log(`   Twitter: ${user.twitter || "N/A"}`);
      console.log(`   Facebook: ${user.facebook || "N/A"}`);
      console.log(`   Instagram: ${user.instagram || "N/A"}`);
      console.log(`   Role: ${user.role ? user.role.name : "N/A"} (Level: ${user.role ? user.role.level : "N/A"})`);
      console.log(`   Role Description: ${user.role ? user.role.description : "N/A"}`);
      console.log(`   Department: ${user.department ? user.department.name : "N/A"}`);
      console.log(`   Department Description: ${user.department ? user.department.description : "N/A"}`);
      console.log(`   Status: ${user.isActive ? "✅ Active" : "❌ Inactive"}`);
      console.log(`   Email Verified: ${user.isEmailVerified ? "✅ Yes" : "❌ No"}`);
      console.log(`   Two Factor Enabled: ${user.twoFactorEnabled ? "✅ Yes" : "❌ No"}`);
      console.log(`   Last Login: ${user.lastLogin ? new Date(user.lastLogin).toLocaleString() : "N/A"}`);
      console.log(`   Login Attempts: ${user.loginAttempts || 0}`);
      console.log(`   Locked Until: ${user.lockedUntil ? new Date(user.lockedUntil).toLocaleString() : "N/A"}`);
      console.log(`   Password Changed At: ${user.passwordChangedAt ? new Date(user.passwordChangedAt).toLocaleString() : "N/A"}`);
      console.log(`   Password Reset Token: ${user.passwordResetToken || "N/A"}`);
      console.log(`   Password Reset Expires: ${user.passwordResetExpires ? new Date(user.passwordResetExpires).toLocaleString() : "N/A"}`);
      console.log(`   Email Verification Token: ${user.emailVerificationToken || "N/A"}`);
      console.log(`   Email Verification Expires: ${user.emailVerificationExpires ? new Date(user.emailVerificationExpires).toLocaleString() : "N/A"}`);
      console.log(`   Created: ${user.createdAt ? new Date(user.createdAt).toLocaleString() : "N/A"}`);
      console.log(`   Last Updated: ${user.updatedAt ? new Date(user.updatedAt).toLocaleString() : "N/A"}`);
      console.log("=".repeat(120));
    });

    // Show login credentials for development
    console.log("\n🔑 LOGIN CREDENTIALS FOR DEVELOPMENT:");
    console.log("=".repeat(50));
    users.forEach((user, index) => {
      console.log(`\n👤 User #${index + 1}:`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Password: ${user.password}`);
      console.log(`   Role: ${user.role ? user.role.name : "N/A"}`);
    });

    console.log("\n✅ Detailed user information completed successfully!\n");

  } catch (error) {
    console.error("❌ Error showing user details:", error);
  }
};

const main = async () => {
  try {
    await connectDB();
    await showUserDetails();
  } catch (error) {
    console.error("❌ Script execution failed:", error);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Disconnected from MongoDB");
    process.exit(0);
  }
};

// Run the script
main();















