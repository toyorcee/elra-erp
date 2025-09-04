import axios from "axios";

// Test configuration
const API_BASE_URL = "http://localhost:5000/api";
const TEST_EMAIL = "test@example.com";
const TEST_DEPARTMENT_ID = "68b6ce10f9fd51efbd41d1a5";
const TEST_ROLE_ID = "68947420543fa23af10c7c19";

// Test data for single invitation
const singleInvitationData = {
  email: TEST_EMAIL,
  firstName: "Test",
  lastName: "User",
  position: "Test Position",
  departmentId: TEST_DEPARTMENT_ID,
  roleId: TEST_ROLE_ID,
  notes: "Test invitation from script",
};

// Test data for bulk invitation
const bulkInvitationData = {
  emails: [TEST_EMAIL, "test2@example.com"],
  departmentId: TEST_DEPARTMENT_ID,
  roleId: TEST_ROLE_ID,
  isBatch: true,
  batchName: "TEST_BATCH_001",
};

async function testSingleInvitation() {
  console.log("🚀 Testing Single Invitation API...");
  console.log("📤 Request data:", singleInvitationData);
  console.log("🔗 Endpoint:", `${API_BASE_URL}/invitations/create-single`);

  try {
    const response = await axios.post(
      `${API_BASE_URL}/invitations/create-single`,
      singleInvitationData,
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 10000, // 10 second timeout
      }
    );

    console.log("✅ Single invitation successful!");
    console.log("📥 Response:", response.data);
    return true;
  } catch (error) {
    console.error("❌ Single invitation failed!");
    console.error("🔍 Error details:", {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      code: error.code,
    });
    return false;
  }
}

async function testBulkInvitation() {
  console.log("\n🚀 Testing Bulk Invitation API...");
  console.log("📤 Request data:", bulkInvitationData);
  console.log("🔗 Endpoint:", `${API_BASE_URL}/invitations/bulk-create`);

  try {
    const response = await axios.post(
      `${API_BASE_URL}/invitations/bulk-create`,
      bulkInvitationData,
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 10000, // 10 second timeout
      }
    );

    console.log("✅ Bulk invitation successful!");
    console.log("📥 Response:", response.data);
    return true;
  } catch (error) {
    console.error("❌ Bulk invitation failed!");
    console.error("🔍 Error details:", {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      code: error.code,
    });
    return false;
  }
}

async function testHealthCheck() {
  console.log("🏥 Testing API Health Check...");
  console.log("🔗 Endpoint:", `${API_BASE_URL}/health`);

  try {
    const response = await axios.get(`${API_BASE_URL}/health`, {
      timeout: 5000,
    });

    console.log("✅ Health check successful!");
    console.log("📥 Response:", response.data);
    return true;
  } catch (error) {
    console.error("❌ Health check failed!");
    console.error("🔍 Error details:", {
      message: error.message,
      status: error.response?.status,
      code: error.code,
    });
    return false;
  }
}

async function testSimpleEndpoint() {
  console.log("🔍 Testing simple endpoint first...");
  console.log("🔗 Endpoint:", `${API_BASE_URL}/invitations`);

  try {
    const response = await axios.post(
      `${API_BASE_URL}/invitations`,
      {
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
        departmentId: TEST_DEPARTMENT_ID,
        roleId: TEST_ROLE_ID,
      },
      {
        timeout: 5000,
      }
    );

    console.log("✅ Simple endpoint works!");
    console.log("📥 Response status:", response.status);
    return true;
  } catch (error) {
    console.error("❌ Simple endpoint failed!");
    console.error("🔍 Error details:", {
      message: error.message,
      status: error.response?.status,
      code: error.code,
    });
    return false;
  }
}

async function runTests() {
  console.log("🧪 Starting API Tests...\n");

  // Test 0: Simple endpoint first
  console.log("🔍 Testing basic connectivity...");
  const simpleOk = await testSimpleEndpoint();

  if (!simpleOk) {
    console.log(
      "❌ Basic connectivity failed. Server might not be accessible."
    );
    return;
  }

  console.log("\n" + "=".repeat(50) + "\n");

  // Test 1: Single invitation
  const singleOk = await testSingleInvitation();

  console.log("\n" + "=".repeat(50) + "\n");

  // Test 2: Bulk invitation
  const bulkOk = await testBulkInvitation();

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("📊 TEST SUMMARY:");
  console.log("👤 Single Invitation:", singleOk ? "✅ PASS" : "❌ FAIL");
  console.log("👥 Bulk Invitation:", bulkOk ? "✅ PASS" : "❌ FAIL");
  console.log("=".repeat(50));

  if (singleOk && bulkOk) {
    console.log(
      "🎉 All invitation tests passed! The backend is working correctly."
    );
    console.log(
      "🔍 The issue might be in the frontend or API service configuration."
    );
  } else {
    console.log(
      "❌ Some invitation tests failed. Check the backend logs for errors."
    );
  }
}

// Run the tests
runTests().catch(console.error);
