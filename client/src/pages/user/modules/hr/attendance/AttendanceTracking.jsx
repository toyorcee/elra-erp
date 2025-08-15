import React, { useState, useEffect } from "react";
import {
  ClockIcon,
  UserIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  ChartBarIcon,
  FunnelIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-toastify";

const AttendanceTracking = () => {
  const [loading, setLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState([]);
  const [filters, setFilters] = useState({
    department: "",
    date: new Date().toISOString().split("T")[0],
    status: "",
  });
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Mock data for demonstration
  const mockAttendanceData = [
    {
      id: 1,
      employee: {
        name: "John Doe",
        email: "john.doe@elra.com",
        department: "Information Technology",
        employeeId: "IT001",
      },
      date: "2025-01-15",
      checkIn: "08:30",
      checkOut: "17:30",
      totalHours: 8.5,
      status: "Present",
      late: false,
      earlyDeparture: false,
      overtime: 0.5,
    },
    {
      id: 2,
      employee: {
        name: "Jane Smith",
        email: "jane.smith@elra.com",
        department: "Human Resources",
        employeeId: "HR002",
      },
      date: "2025-01-15",
      checkIn: "09:15",
      checkOut: "17:00",
      totalHours: 7.75,
      status: "Late",
      late: true,
      earlyDeparture: false,
      overtime: 0,
    },
    {
      id: 3,
      employee: {
        name: "Mike Johnson",
        email: "mike.johnson@elra.com",
        department: "Finance",
        employeeId: "FIN003",
      },
      date: "2025-01-15",
      checkIn: "08:00",
      checkOut: "16:30",
      totalHours: 8.5,
      status: "Present",
      late: false,
      earlyDeparture: true,
      overtime: 0,
    },
    {
      id: 4,
      employee: {
        name: "Sarah Wilson",
        email: "sarah.wilson@elra.com",
        department: "Marketing",
        employeeId: "MKT004",
      },
      date: "2025-01-15",
      checkIn: null,
      checkOut: null,
      totalHours: 0,
      status: "Absent",
      late: false,
      earlyDeparture: false,
      overtime: 0,
    },
  ];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setAttendanceData(mockAttendanceData);
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case "Present":
        return "bg-green-100 text-green-800";
      case "Late":
        return "bg-yellow-100 text-yellow-800";
      case "Absent":
        return "bg-red-100 text-red-800";
      case "Half Day":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Present":
        return <CheckCircleIcon className="w-4 h-4" />;
      case "Late":
        return <ExclamationTriangleIcon className="w-4 h-4" />;
      case "Absent":
        return <XCircleIcon className="w-4 h-4" />;
      default:
        return <ClockIcon className="w-4 h-4" />;
    }
  };

  const calculateStats = () => {
    const total = attendanceData.length;
    const present = attendanceData.filter(
      (item) => item.status === "Present"
    ).length;
    const late = attendanceData.filter((item) => item.status === "Late").length;
    const absent = attendanceData.filter(
      (item) => item.status === "Absent"
    ).length;
    const averageHours =
      attendanceData.reduce((sum, item) => sum + item.totalHours, 0) / total;

    return {
      total,
      present,
      late,
      absent,
      averageHours: averageHours.toFixed(1),
    };
  };

  const stats = calculateStats();

  const handleViewDetails = (employee) => {
    setSelectedEmployee(employee);
    toast.success(`Viewing details for ${employee.name}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--elra-primary)]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Attendance Tracking
          </h1>
          <p className="text-gray-600">
            Monitor employee attendance and punctuality
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
            <ChartBarIcon className="w-5 h-5 mr-2" />
            Reports
          </button>
          <button className="inline-flex items-center px-4 py-2 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors">
            <CalendarIcon className="w-5 h-5 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UserIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Total Employees
              </p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircleIcon className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Present</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.present}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Late</p>
              <p className="text-2xl font-bold text-gray-900">{stats.late}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircleIcon className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Absent</p>
              <p className="text-2xl font-bold text-gray-900">{stats.absent}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <ClockIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Hours</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.averageHours}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          <button className="text-[var(--elra-primary)] hover:text-[var(--elra-primary-dark)]">
            <FunnelIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={filters.department}
            onChange={(e) =>
              setFilters({ ...filters, department: e.target.value })
            }
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
          >
            <option value="">All Departments</option>
            <option value="IT">Information Technology</option>
            <option value="HR">Human Resources</option>
            <option value="Finance">Finance</option>
            <option value="Marketing">Marketing</option>
          </select>

          <input
            type="date"
            value={filters.date}
            onChange={(e) => setFilters({ ...filters, date: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
          />

          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
          >
            <option value="">All Status</option>
            <option value="Present">Present</option>
            <option value="Late">Late</option>
            <option value="Absent">Absent</option>
            <option value="Half Day">Half Day</option>
          </select>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Attendance Records
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Check In
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Check Out
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Hours
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {attendanceData.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-[var(--elra-primary)] flex items-center justify-center">
                          <UserIcon className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {record.employee.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {record.employee.department}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(record.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.checkIn || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.checkOut || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.totalHours} hrs
                    {record.overtime > 0 && (
                      <span className="text-green-600 ml-1">
                        (+{record.overtime} OT)
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        record.status
                      )}`}
                    >
                      {getStatusIcon(record.status)}
                      <span className="ml-1">{record.status}</span>
                    </span>
                    {record.late && (
                      <span className="ml-2 text-xs text-yellow-600">Late</span>
                    )}
                    {record.earlyDeparture && (
                      <span className="ml-2 text-xs text-orange-600">
                        Early
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleViewDetails(record.employee)}
                      className="text-[var(--elra-primary)] hover:text-[var(--elra-primary-dark)]"
                    >
                      <EyeIcon className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AttendanceTracking;
