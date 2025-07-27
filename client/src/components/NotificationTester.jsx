import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const NotificationTester = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const { user } = useAuth();

  const testNotification = async (type) => {
    if (!user) {
      setMessage("Please login first");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await api.post("/notifications/test", {
        type: type || "WELCOME",
        priority: "high",
      });

      setMessage(`✅ ${response.data.message}`);
    } catch (error) {
      setMessage(`❌ Error: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testWelcomeNotification = async () => {
    if (!user) {
      setMessage("Please login first");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await api.post("/notifications/test-welcome");
      setMessage(`✅ ${response.data.message}`);
    } catch (error) {
      setMessage(`❌ Error: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
        Please login to test notifications
      </div>
    );
  }

  return (
    <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 mb-4">
      <h3 className="text-lg font-semibold mb-3">🔔 Notification Tester</h3>

      <div className="space-y-2 mb-4">
        <button
          onClick={() => testNotification("WELCOME")}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50 mr-2"
        >
          Test Welcome Notification
        </button>

        <button
          onClick={() => testNotification("SYSTEM_ALERT")}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50 mr-2"
        >
          Test System Alert
        </button>

        <button
          onClick={testWelcomeNotification}
          disabled={loading}
          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50"
        >
          Test Full Welcome Flow
        </button>
      </div>

      {loading && (
        <div className="text-blue-600">
          <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin inline-block mr-2"></div>
          Testing notification...
        </div>
      )}

      {message && (
        <div
          className={`p-3 rounded ${
            message.startsWith("✅")
              ? "bg-green-100 text-green-700 border border-green-300"
              : "bg-red-100 text-red-700 border border-red-300"
          }`}
        >
          {message}
        </div>
      )}

      <div className="text-sm text-gray-600 mt-3">
        <p>• Check browser console for Socket.IO logs</p>
        <p>• Look for toast notifications</p>
        <p>• Check notification bell for new notifications</p>
      </div>
    </div>
  );
};

export default NotificationTester;
