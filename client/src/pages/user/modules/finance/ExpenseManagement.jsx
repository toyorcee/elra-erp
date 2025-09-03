import React, { useState, useEffect } from "react";
import {
  ArrowTrendingDownIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  ChartBarIcon,
  EyeIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../../../context/AuthContext";
import { toast } from "react-toastify";

const ExpenseManagement = () => {
  const { user } = useAuth();
  const [expenseData, setExpenseData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    period: "monthly",
    category: "all",
  });
  
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
            Only Finance HOD & Super Admin can access Expense Management.
          </p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    loadExpenseData();
  }, []);

  const loadExpenseData = async () => {
    setLoading(true);
    try {
      // Mock data for now
      setExpenseData([
        {
          id: 1,
          month: "January 2024",
          totalExpenses: 1200000,
          operationalExpenses: 800000,
          maintenanceExpenses: 250000,
          administrativeExpenses: 150000,
          change: -5.2,
        },
        {
          id: 2,
          month: "February 2024",
          totalExpenses: 1150000,
          operationalExpenses: 750000,
          maintenanceExpenses: 220000,
          administrativeExpenses: 180000,
          change: -4.1,
        },
        {
          id: 3,
          month: "March 2024",
          totalExpenses: 1300000,
          operationalExpenses: 850000,
          maintenanceExpenses: 300000,
          administrativeExpenses: 150000,
          change: 13.0,
        },
      ]);
    } catch (error) {
      console.error("Error loading expense data:", error);
      toast.error("Error loading expense data");
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
              Expense Management
            </h1>
            <p className="text-gray-600">
              Track and analyze expense performance
            </p>
          </div>
          <button className="bg-[var(--elra-primary)] text-white px-4 py-2 rounded-lg hover:bg-[var(--elra-primary-dark)] flex items-center">
            <PlusIcon className="h-5 w-5 mr-2" />
            Generate Report
          </button>
        </div>

        {/* Expense Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-red-500">
                <ArrowTrendingDownIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Expenses
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  ₦{new Intl.NumberFormat().format(3650000)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-500">
                <CurrencyDollarIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Operational</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₦{new Intl.NumberFormat().format(2400000)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-orange-500">
                <ChartBarIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Maintenance</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₦{new Intl.NumberFormat().format(770000)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-purple-500">
                <CalendarIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Change Rate</p>
                <p className="text-2xl font-bold text-gray-900">+1.2%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Period
              </label>
              <select
                value={filters.period}
                onChange={(e) =>
                  setFilters({ ...filters, period: e.target.value })
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) =>
                  setFilters({ ...filters, category: e.target.value })
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
              >
                <option value="all">All Categories</option>
                <option value="operational">Operational Expenses</option>
                <option value="maintenance">Maintenance Expenses</option>
                <option value="administrative">Administrative Expenses</option>
              </select>
            </div>
          </div>
        </div>

        {/* Expense Data Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Expense Breakdown
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Expenses
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Operational
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Maintenance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Administrative
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Change
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {expenseData.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900">
                            {item.month}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">
                          ₦{new Intl.NumberFormat().format(item.totalExpenses)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          ₦
                          {new Intl.NumberFormat().format(
                            item.operationalExpenses
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          ₦
                          {new Intl.NumberFormat().format(
                            item.maintenanceExpenses
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          ₦
                          {new Intl.NumberFormat().format(
                            item.administrativeExpenses
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`text-sm font-medium ${
                            item.change >= 0 ? "text-red-600" : "text-green-600"
                          }`}
                        >
                          {item.change >= 0 ? "+" : ""}
                          {item.change}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button className="text-blue-600 hover:text-blue-800">
                          <EyeIcon className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseManagement;
