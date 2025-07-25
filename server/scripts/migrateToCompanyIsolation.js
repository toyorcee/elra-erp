import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const runScript = async (scriptPath) => {
  try {
    console.log(`\n🔄 Running ${scriptPath}...`);
    const { stdout, stderr } = await execAsync(`node ${scriptPath}`, {
      cwd: process.cwd(),
    });

    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);

    console.log(`✅ ${scriptPath} completed successfully`);
  } catch (error) {
    console.error(`❌ Error running ${scriptPath}:`, error.message);
    throw error;
  }
};

const migrateToCompanyIsolation = async () => {
  console.log("🚀 Starting migration to company-based data isolation...\n");

  try {
    // Step 1: Update existing Super Admin with company
    await runScript("scripts/updateExistingSuperAdmin.js");

    // Step 2: Update existing audit logs with company
    await runScript("scripts/updateExistingAuditLogs.js");

    // Step 3: Update existing users, documents, and departments with company
    await runScript("scripts/updateExistingData.js");

    console.log("\n🎉 Migration completed successfully!");
    console.log("\n📋 Summary:");
    console.log("✅ Existing Super Admin now has company association");
    console.log("✅ Existing audit logs now have company field");
    console.log(
      "✅ Existing users, documents, and departments now have company field"
    );
    console.log("✅ Data isolation is now fully functional");

    console.log("\n🧪 Next Steps:");
    console.log("1. Restart your server");
    console.log("2. Log in as Olaniyan Toyosi (existing Super Admin)");
    console.log("3. Verify he can see his data properly");
    console.log("4. Log in as John Smith (new Super Admin)");
    console.log("5. Verify he only sees his company's data");
  } catch (error) {
    console.error("\n❌ Migration failed:", error.message);
    console.log("\n🔧 Troubleshooting:");
    console.log("1. Check your MongoDB connection");
    console.log("2. Ensure all models are properly imported");
    console.log("3. Run scripts individually if needed");
  }
};

// Run the migration
migrateToCompanyIsolation();
