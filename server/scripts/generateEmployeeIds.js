import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import User from "../models/User.js";
import Department from "../models/Department.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

const generateEmployeeId = (departmentCode, sequence) => {
  const year = new Date().getFullYear().toString().slice(-2);
  const deptCode = departmentCode
    ? departmentCode.toUpperCase().slice(0, 3)
    : "GEN";
  const seq = sequence.toString().padStart(3, "0");
  return `${deptCode}${year}${seq}`;
};

const generateEmployeeIds = async () => {
  try {
    console.log("🔧 Starting employee ID generation...");

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Get all users without employee IDs
    const usersWithoutIds = await User.find({
      employeeId: { $exists: false },
    }).populate("department");

    console.log(
      `📊 Found ${usersWithoutIds.length} users without employee IDs`
    );

    if (usersWithoutIds.length === 0) {
      console.log("✅ All users already have employee IDs");
      return;
    }

    // Group users by department
    const usersByDepartment = {};
    usersWithoutIds.forEach((user) => {
      const deptCode =
        user.department?.code || user.department?.name?.slice(0, 3) || "GEN";
      if (!usersByDepartment[deptCode]) {
        usersByDepartment[deptCode] = [];
      }
      usersByDepartment[deptCode].push(user);
    });

    console.log(
      "📋 Users grouped by department:",
      Object.keys(usersByDepartment)
    );

    // Generate employee IDs for each department
    for (const [deptCode, users] of Object.entries(usersByDepartment)) {
      console.log(`\n🏢 Processing department: ${deptCode}`);

      // Get the highest sequence number for this department
      const existingUsers = await User.find({
        employeeId: { $regex: `^${deptCode}`, $options: "i" },
      });

      let maxSequence = 0;
      existingUsers.forEach((user) => {
        if (user.employeeId) {
          const match = user.employeeId.match(
            new RegExp(`^${deptCode}\\d{2}(\\d{3})$`, "i")
          );
          if (match) {
            const seq = parseInt(match[1]);
            if (seq > maxSequence) {
              maxSequence = seq;
            }
          }
        }
      });

      console.log(`📈 Starting sequence for ${deptCode}: ${maxSequence + 1}`);

      // Generate IDs for users in this department
      for (let i = 0; i < users.length; i++) {
        const user = users[i];
        const sequence = maxSequence + i + 1;
        const employeeId = generateEmployeeId(deptCode, sequence);

        // Update user with new employee ID
        await User.findByIdAndUpdate(user._id, {
          employeeId: employeeId,
        });

        console.log(
          `✅ Generated ${employeeId} for ${user.firstName} ${user.lastName}`
        );
      }
    }

    console.log("\n🎉 Employee ID generation completed successfully!");

    // Show summary
    const updatedUsers = await User.find({ employeeId: { $exists: true } });
    console.log(`📊 Total users with employee IDs: ${updatedUsers.length}`);

    // Show some examples
    const examples = await User.find({ employeeId: { $exists: true } }).limit(
      5
    );
    console.log("\n📝 Example employee IDs:");
    examples.forEach((user) => {
      console.log(
        `   ${user.employeeId} - ${user.firstName} ${user.lastName} (${
          user.department?.name || "No Department"
        })`
      );
    });
  } catch (error) {
    console.error("❌ Error generating employee IDs:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
};

// Run the script
generateEmployeeIds();
