import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import User from "../models/User.js";
import SalaryGrade from "../models/SalaryGrade.js";
import PersonalAllowance from "../models/PersonalAllowance.js";
import PersonalBonus from "../models/PersonalBonus.js";
import Deduction from "../models/Deduction.js";
import Department from "../models/Department.js";

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

const updateUsersWithSteps = async () => {
  try {
    await connectDB();

    console.log("🔄 UPDATING USERS WITH STEP DATA");
    console.log("=".repeat(70));

    // Get all active users
    const users = await User.find({ isActive: true })
      .populate("role", "name level")
      .populate("department", "name code");

    console.log(`📊 Found ${users.length} active users to update\n`);

    let updatedCount = 0;
    let errors = [];

    for (const user of users) {
      try {
        console.log(
          `👤 Processing: ${user.firstName} ${user.lastName} (${user.employeeId})`
        );

        // Determine salary grade based on role
        let salaryGrade = null;
        let baseSalary = 0;
        let salaryStep = "Step 1";
        let yearsOfService = 0;

        if (user.role) {
          // Map role to salary grade based on our analysis
          if (user.role.name === "SUPER_ADMIN") {
            salaryGrade = await SalaryGrade.findOne({ grade: "Grade 1" });
            baseSalary = 800000;
          } else if (user.role.name === "HOD") {
            salaryGrade = await SalaryGrade.findOne({ grade: "Grade 2" });
            baseSalary = 500000;
          } else if (user.role.name === "MANAGER") {
            salaryGrade = await SalaryGrade.findOne({ grade: "Grade 3" });
            baseSalary = 300000;
          } else if (user.role.name === "STAFF") {
            salaryGrade = await SalaryGrade.findOne({ grade: "Grade 4" });
            baseSalary = 150000;
          } else if (user.role.name === "VIEWER") {
            salaryGrade = await SalaryGrade.findOne({ grade: "Grade 5" });
            baseSalary = 80000;
          }
        }

        // Calculate years of service based on createdAt
        if (user.createdAt) {
          const now = new Date();
          const hireDate = new Date(user.createdAt);
          yearsOfService = Math.floor(
            (now - hireDate) / (1000 * 60 * 60 * 24 * 365)
          );
        }

        // Determine step based on years of service
        if (yearsOfService >= 5) salaryStep = "Step 5";
        else if (yearsOfService >= 4) salaryStep = "Step 4";
        else if (yearsOfService >= 3) salaryStep = "Step 3";
        else if (yearsOfService >= 2) salaryStep = "Step 2";
        else salaryStep = "Step 1";

        // Calculate step-adjusted salary
        let stepAdjustedSalary = baseSalary;
        if (salaryGrade && salaryGrade.steps && salaryGrade.steps.length > 0) {
          const stepData = salaryGrade.steps.find((s) => s.step === salaryStep);
          if (stepData) {
            const increment = (baseSalary * stepData.increment) / 100;
            stepAdjustedSalary = baseSalary + increment;
          }
        }

        // Update user with step data
        const updateData = {
          baseSalary: stepAdjustedSalary,
          salaryStep: salaryStep,
          yearsOfService: yearsOfService,
          stepEffectiveDate: new Date(),
          nextStepReviewDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
          useStepCalculation: true,
        };

        await User.findByIdAndUpdate(user._id, updateData);

        console.log(
          `   ✅ Updated: Base Salary: ₦${stepAdjustedSalary.toLocaleString()}, Step: ${salaryStep}, Years: ${yearsOfService}`
        );
        updatedCount++;
      } catch (error) {
        console.error(
          `   ❌ Error updating ${user.firstName} ${user.lastName}:`,
          error.message
        );
        errors.push({ user: user.employeeId, error: error.message });
      }
    }

    console.log(`\n📋 UPDATE SUMMARY:`);
    console.log(`- Total users processed: ${users.length}`);
    console.log(`- Successfully updated: ${updatedCount}`);
    console.log(`- Errors: ${errors.length}`);

    if (errors.length > 0) {
      console.log(`\n❌ ERRORS:`);
      errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.user}: ${error.error}`);
      });
    }

    // Fix undefined percentages
    console.log(`\n🔧 FIXING UNDEFINED PERCENTAGES`);
    console.log("=".repeat(50));

    // Fix Personal Allowances
    const allowances = await PersonalAllowance.find({
      status: "active",
      calculationType: "percentage",
      $or: [
        { percentage: { $exists: false } },
        { percentage: null },
        { percentage: undefined },
      ],
    });

    console.log(
      `📊 Found ${allowances.length} allowances with undefined percentages`
    );

    for (const allowance of allowances) {
      try {
        // Set default percentages based on allowance type
        let defaultPercentage = 5; // Default 5%

        if (allowance.type === "housing") defaultPercentage = 10;
        else if (allowance.type === "transport") defaultPercentage = 8;
        else if (allowance.type === "meal") defaultPercentage = 5;
        else if (allowance.type === "other") defaultPercentage = 3;

        await PersonalAllowance.findByIdAndUpdate(allowance._id, {
          percentage: defaultPercentage,
        });

        console.log(
          `   ✅ Fixed: ${allowance.name} - Set to ${defaultPercentage}%`
        );
      } catch (error) {
        console.error(`   ❌ Error fixing ${allowance.name}:`, error.message);
      }
    }

    // Fix Personal Bonuses
    const bonuses = await PersonalBonus.find({
      status: "active",
      calculationType: "percentage",
      $or: [
        { percentage: { $exists: false } },
        { percentage: null },
        { percentage: undefined },
      ],
    });

    console.log(
      `📊 Found ${bonuses.length} bonuses with undefined percentages`
    );

    for (const bonus of bonuses) {
      try {
        // Set default percentages based on bonus type
        let defaultPercentage = 10; // Default 10%

        if (bonus.type === "performance") defaultPercentage = 15;
        else if (bonus.type === "retention") defaultPercentage = 8;
        else if (bonus.type === "year_end") defaultPercentage = 20;

        await PersonalBonus.findByIdAndUpdate(bonus._id, {
          percentage: defaultPercentage,
        });

        console.log(
          `   ✅ Fixed: ${bonus.name} - Set to ${defaultPercentage}%`
        );
      } catch (error) {
        console.error(`   ❌ Error fixing ${bonus.name}:`, error.message);
      }
    }

    // Fix Deductions
    const deductions = await Deduction.find({
      status: "active",
      calculationType: "percentage",
      $or: [
        { percentage: { $exists: false } },
        { percentage: null },
        { percentage: undefined },
      ],
    });

    console.log(
      `📊 Found ${deductions.length} deductions with undefined percentages`
    );

    for (const deduction of deductions) {
      try {
        // Set default percentages based on deduction type and category
        let defaultPercentage = 5; // Default 5%

        if (deduction.category === "pension") defaultPercentage = 8;
        else if (deduction.category === "nhis") defaultPercentage = 5;
        else if (deduction.category === "paye")
          defaultPercentage = 0; // PAYE is calculated by tax brackets
        else if (deduction.category === "training_fund") defaultPercentage = 2;
        else if (deduction.category === "welfare") defaultPercentage = 3;

        await Deduction.findByIdAndUpdate(deduction._id, {
          percentage: defaultPercentage,
        });

        console.log(
          `   ✅ Fixed: ${deduction.name} - Set to ${defaultPercentage}%`
        );
      } catch (error) {
        console.error(`   ❌ Error fixing ${deduction.name}:`, error.message);
      }
    }

    console.log(`\n✅ ALL UPDATES COMPLETED!`);
    console.log(`- Users updated with step data: ${updatedCount}`);
    console.log(`- Allowances fixed: ${allowances.length}`);
    console.log(`- Bonuses fixed: ${bonuses.length}`);
    console.log(`- Deductions fixed: ${deductions.length}`);
  } catch (error) {
    console.error("❌ Error updating users with steps:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Database connection closed");
  }
};

updateUsersWithSteps();

