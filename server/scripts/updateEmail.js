import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env") });

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.error("❌ MONGODB_URI is not defined in environment variables");
      process.exit(1);
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    process.exit(1);
  }
};

const updateEmail = async (oldEmail, newEmail) => {
  try {
    // Find user by old email
    const user = await User.findOne({ email: oldEmail });
    if (!user) {
      console.error(`❌ User with email ${oldEmail} not found`);
      return false;
    }

    console.log(`✅ Found user: ${user.username} (${user.email})`);

    // Update email
    user.email = newEmail;
    await user.save();

    console.log(`✅ Email updated successfully!`);
    console.log(`📧 Old email: ${oldEmail}`);
    console.log(`📧 New email: ${newEmail}`);
    return true;
  } catch (error) {
    console.error("❌ Error updating email:", error);
    return false;
  }
};

const main = async () => {
  const args = process.argv.slice(2);
  
  if (args.length !== 2) {
    console.log("Usage: node updateEmail.js <old-email> <new-email>");
    console.log("Example: node updateEmail.js admin@edms.com oluwatoyosiolaniyan@gmail.com");
    process.exit(1);
  }

  const [oldEmail, newEmail] = args;

  console.log("🔧 Updating user email...\n");

  await connectDB();
  const success = await updateEmail(oldEmail, newEmail);

  if (success) {
    console.log("\n🎉 Email update completed successfully!");
  } else {
    console.log("\n❌ Email update failed!");
    process.exit(1);
  }

  await mongoose.disconnect();
  console.log("🔌 Database disconnected");
};

main().catch(console.error); 