import React, { useState, useEffect } from "react";
import {
  DocumentChartBarIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../../../context/AuthContext";
import { toast } from "react-toastify";

const FinancialReports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);

    // Access control - only Finance HOD+ can access
  if (
    !user ||
    user.role.level >= 700 ||
    user.department?.name !== "Finance & Accounting"
  ) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Access Denied
          </h2>
          <p className="text-gray-600">
            Only Finance HOD & Super Admin can access Financial Reports.
          </p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      // Mock data for now
      setReports([
        {
          id: 1,
          name: "Profit & Loss Statement",
          type: "financial",
          date: "2024-01-15",
          status: "Generated",
        },
        {
          id: 2,
          name: "Cash Flow Statement",
          type: "financial",
          date: "2024-01-10",
          status: "Generated",
        },
        {
          id: 3,
          name: "Balance Sheet",
          type: "financial",
          date: "2024-01-05",
          status: "Generated",
        },
        {
          id: 4,
          name: "Revenue Analysis Report",
          type: "analytics",
          date: "2024-01-12",
          status: "Generated",
        },
        {
          id: 5,
          name: "Expense Breakdown Report",
          type: "analytics",
          date: "2024-01-08",
          status: "Generated",
        },
      ]);
    } catch (error) {
      console.error("Error loading reports:", error);
      toast.error("Error loading reports");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--elra-primary)]"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Financial Reports
            </h1>
            <p className="text-gray-600">
              Generate comprehensive financial reports
            </p>
          </div>
          <div className="flex space-x-3">
            <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center">
              <FunnelIcon className="h-5 w-5 mr-2" />
              Filter
            </button>
            <button className="bg-[var(--elra-primary)] text-white px-4 py-2 rounded-lg hover:bg-[var(--elra-primary-dark)] flex items-center">
              <DocumentChartBarIcon className="h-5 w-5 mr-2" />
              Generate Report
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Available Reports
          </h2>
          <div className="space-y-4">
            {reports.map((report) => (
              <div
                key={report.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center">
                  <DocumentChartBarIcon className="h-8 w-8 text-blue-500 mr-4" />
                  <div>
                    <h3 className="font-medium text-gray-900">{report.name}</h3>
                    <p className="text-sm text-gray-600 flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      {new Date(report.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button className="bg-blue-50 text-blue-600 px-3 py-2 rounded-md text-sm hover:bg-blue-100">
                    View
                  </button>
                  <button className="bg-green-50 text-green-600 px-3 py-2 rounded-md text-sm hover:bg-green-100 flex items-center">
                    <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialReports;
