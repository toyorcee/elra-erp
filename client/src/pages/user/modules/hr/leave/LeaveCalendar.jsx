import React, { useState, useEffect } from "react";
import {
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UserIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-toastify";
import { userModulesAPI } from "../../../../../services/userModules.js";
import { useAuth } from "../../../../../context/AuthContext.jsx";
import { getActiveDepartments } from "../../../../../services/departments.js";

const LeaveCalendar = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [filters, setFilters] = useState({
    department: "",
    leaveType: "",
    status: "Approved", // Only show approved leaves on calendar
  });
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);

  const canViewAllDepartments = user?.role?.level >= 600;

  // Get current month's start and end dates
  const getMonthDates = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    return { firstDay, lastDay };
  };

  // Generate calendar days
  const generateCalendarDays = (date) => {
    const { firstDay, lastDay } = getMonthDates(date);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay()); // Start from Sunday

    const days = [];
    const currentDate = new Date(startDate);

    while (currentDate <= lastDay || days.length < 42) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  };

  // Get leave events for a specific date
  const getEventsForDate = (date) => {
    const dateStr = date.toISOString().split("T")[0];
    return leaveRequests.filter((request) => {
      const startDate = new Date(request.startDate).toISOString().split("T")[0];
      const endDate = new Date(request.endDate).toISOString().split("T")[0];
      return dateStr >= startDate && dateStr <= endDate;
    });
  };

  // Get leave type color
  const getLeaveTypeColor = (leaveType) => {
    switch (leaveType) {
      case "Annual Leave":
        return "bg-blue-500";
      case "Sick Leave":
        return "bg-red-500";
      case "Maternity Leave":
        return "bg-pink-500";
      case "Paternity Leave":
        return "bg-purple-500";
      case "Bereavement Leave":
        return "bg-gray-500";
      default:
        return "bg-green-500";
    }
  };

  // Get leave type icon
  const getLeaveTypeIcon = (leaveType) => {
    switch (leaveType) {
      case "Annual Leave":
        return "🏖️";
      case "Sick Leave":
        return "🏥";
      case "Maternity Leave":
        return "👶";
      case "Paternity Leave":
        return "👨‍👩‍👧‍👦";
      case "Bereavement Leave":
        return "🕊️";
      default:
        return "📅";
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [requestsRes, departmentsRes] = await Promise.all([
        userModulesAPI.leave.getRequests({
          status: "Approved",
          limit: 100,
          ...filters,
        }),
        getActiveDepartments(),
      ]);

      setLeaveRequests(requestsRes.data.docs || []);
      setDepartments(departmentsRes.data.departments || []);
    } catch (error) {
      console.error("Error fetching leave calendar data:", error);
      toast.error("Failed to fetch leave calendar data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  const handleDateClick = (date) => {
    setSelectedDate(date);
    const events = getEventsForDate(date);
    if (events.length > 0) {
      setSelectedEvent(events[0]);
      setShowEventModal(true);
    }
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const calendarDays = generateCalendarDays(currentDate);
  const monthName = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

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
          <h1 className="text-2xl font-bold text-gray-900">Leave Calendar</h1>
          <p className="text-gray-600">
            View employee leave schedules and availability
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          <FunnelIcon className="w-5 h-5 text-[var(--elra-primary)]" />
        </div>
        <div className="flex flex-wrap gap-4">
          {canViewAllDepartments && (
            <select
              value={filters.department}
              onChange={(e) =>
                setFilters({ ...filters, department: e.target.value })
              }
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] min-w-[200px]"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept._id}>
                  {dept.name}
                </option>
              ))}
            </select>
          )}

          <select
            value={filters.leaveType}
            onChange={(e) =>
              setFilters({ ...filters, leaveType: e.target.value })
            }
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] min-w-[150px]"
          >
            <option value="">All Leave Types</option>
            <option value="Annual Leave">Annual Leave</option>
            <option value="Sick Leave">Sick Leave</option>
            <option value="Maternity Leave">Maternity Leave</option>
            <option value="Paternity Leave">Paternity Leave</option>
            <option value="Bereavement Leave">Bereavement Leave</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">{monthName}</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-4 py-2 text-sm bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => navigateMonth(1)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Day Headers */}
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="p-3 text-center text-sm font-medium text-gray-500 bg-gray-50 rounded-lg"
            >
              {day}
            </div>
          ))}

          {/* Calendar Days */}
          {calendarDays.map((day, index) => {
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            const isToday = day.toDateString() === new Date().toDateString();
            const events = getEventsForDate(day);
            const isSelected =
              selectedDate &&
              day.toDateString() === selectedDate.toDateString();

            return (
              <div
                key={index}
                onClick={() => handleDateClick(day)}
                className={`min-h-[120px] p-2 border border-gray-200 rounded-lg cursor-pointer transition-colors ${
                  isCurrentMonth ? "bg-white" : "bg-gray-50"
                } ${isToday ? "ring-2 ring-[var(--elra-primary)]" : ""} ${
                  isSelected ? "bg-blue-50 border-blue-300" : "hover:bg-gray-50"
                }`}
              >
                <div
                  className={`text-sm font-medium mb-1 ${
                    isCurrentMonth ? "text-gray-900" : "text-gray-400"
                  } ${isToday ? "text-[var(--elra-primary)] font-bold" : ""}`}
                >
                  {day.getDate()}
                </div>

                {/* Events */}
                <div className="space-y-1">
                  {events.slice(0, 3).map((event, eventIndex) => (
                    <div
                      key={eventIndex}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEventClick(event);
                      }}
                      className={`text-xs p-1 rounded cursor-pointer text-white ${getLeaveTypeColor(
                        event.leaveType
                      )} hover:opacity-80 transition-opacity`}
                      title={`${event.employee.firstName} ${event.employee.lastName} - ${event.leaveType}`}
                    >
                      <div className="flex items-center space-x-1">
                        <span>{getLeaveTypeIcon(event.leaveType)}</span>
                        <span className="truncate">
                          {event.employee.firstName}
                        </span>
                      </div>
                    </div>
                  ))}
                  {events.length > 3 && (
                    <div className="text-xs text-gray-500 text-center">
                      +{events.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Event Detail Modal */}
      {showEventModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Leave Event Details
              </h3>
              <button
                onClick={() => setShowEventModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <EyeIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div
                  className={`p-2 rounded-lg ${getLeaveTypeColor(
                    selectedEvent.leaveType
                  )}`}
                >
                  <span className="text-white text-lg">
                    {getLeaveTypeIcon(selectedEvent.leaveType)}
                  </span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">
                    {selectedEvent.employee.firstName}{" "}
                    {selectedEvent.employee.lastName}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {selectedEvent.department.name}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Leave Type
                  </label>
                  <p className="mt-1 text-gray-900">
                    {selectedEvent.leaveType}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Days
                  </label>
                  <p className="mt-1 text-gray-900">
                    {selectedEvent.days} days
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Start Date
                  </label>
                  <p className="mt-1 text-gray-900">
                    {new Date(selectedEvent.startDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    End Date
                  </label>
                  <p className="mt-1 text-gray-900">
                    {new Date(selectedEvent.endDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Reason
                </label>
                <p className="mt-1 text-gray-900 text-sm">
                  {selectedEvent.reason}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveCalendar;
