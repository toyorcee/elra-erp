import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../../../context/AuthContext";
import { useDynamicSidebar } from "../../../../context/DynamicSidebarContext";
import {
  CalendarIcon,
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  MapPinIcon,
  UserGroupIcon,
  BellIcon,
} from "@heroicons/react/24/outline";

const EventsCalendar = () => {
  const { user } = useAuth();
  const { setSidebarConfig } = useDynamicSidebar();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [events, setEvents] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Communication module sidebar configuration
  const communicationSidebarConfig = {
    label: "Communication",
    icon: "ChatBubbleLeftRightIcon",
    path: "/dashboard/modules/communication",
    color: "text-pink-600",
    bgColor: "bg-pink-50",
    borderColor: "border-pink-200",
    sections: [
      {
        title: "Messaging & Collaboration",
        items: [
          {
            label: "Internal Messages",
            icon: "ChatBubbleLeftIcon",
            path: "/dashboard/modules/communication/messages",
            required: { minLevel: 300 },
            description: "Send and receive internal messages",
          },
          {
            label: "Team Chats",
            icon: "UsersIcon",
            path: "/dashboard/modules/communication/teams",
            required: { minLevel: 300 },
            description: "Collaborate in team chat rooms",
          },
          {
            label: "File Sharing",
            icon: "DocumentIcon",
            path: "/dashboard/modules/communication/files",
            required: { minLevel: 300 },
            description: "Share files and documents",
          },
        ],
      },
      {
        title: "Announcements & Events",
        items: [
          {
            label: "Announcements",
            icon: "MegaphoneIcon",
            path: "/dashboard/modules/communication/announcements",
            required: { minLevel: 700 },
            description: "Create and manage announcements",
          },
          {
            label: "Events Calendar",
            icon: "CalendarIcon",
            path: "/dashboard/modules/communication/events",
            required: { minLevel: 300 },
            description: "View and manage company events",
          },
        ],
      },
    ],
  };

  useEffect(() => {
    setSidebarConfig(communicationSidebarConfig);
  }, [setSidebarConfig]);

  // Sample events data
  const sampleEvents = [
    {
      id: 1,
      title: "Team Meeting",
      date: new Date(2024, 11, 15),
      time: "10:00 AM",
      location: "Conference Room A",
      attendees: ["John Doe", "Jane Smith", "Mike Johnson"],
      description: "Weekly team sync meeting",
      type: "meeting",
    },
    {
      id: 2,
      title: "Company All Hands",
      date: new Date(2024, 11, 20),
      time: "2:00 PM",
      location: "Main Auditorium",
      attendees: ["All Employees"],
      description: "Monthly company-wide meeting",
      type: "company",
    },
    {
      id: 3,
      title: "Training Session",
      date: new Date(2024, 11, 25),
      time: "9:00 AM",
      location: "Training Room B",
      attendees: ["HR Team", "New Hires"],
      description: "New employee orientation",
      type: "training",
    },
  ];

  useEffect(() => {
    setEvents(sampleEvents);
  }, []);

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

  // Get events for a specific date
  const getEventsForDate = (date) => {
    return events.filter(
      (event) => event.date.toDateString() === date.toDateString()
    );
  };

  // Navigate months
  const navigateMonth = (direction) => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1)
    );
  };

  // Get event type color
  const getEventTypeColor = (type) => {
    const colors = {
      meeting: "bg-blue-100 text-blue-800 border-blue-200",
      company: "bg-purple-100 text-purple-800 border-purple-200",
      training: "bg-green-100 text-green-800 border-green-200",
      default: "bg-gray-100 text-gray-800 border-gray-200",
    };
    return colors[type] || colors.default;
  };

  const calendarDays = generateCalendarDays(currentDate);
  const monthName = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gray-50 p-6"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Events Calendar
            </h1>
            <p className="text-gray-600">
              View and manage company events and meetings
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create Event
          </button>
        </div>

        {/* Calendar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Calendar Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">{monthName}</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigateMonth(-1)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Today
              </button>
              <button
                onClick={() => navigateMonth(1)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="p-6">
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-4">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div
                  key={day}
                  className="p-2 text-center text-sm font-medium text-gray-500"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => {
                const isCurrentMonth =
                  day.getMonth() === currentDate.getMonth();
                const isToday =
                  day.toDateString() === new Date().toDateString();
                const isSelected =
                  selectedDate?.toDateString() === day.toDateString();
                const dayEvents = getEventsForDate(day);

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.01 }}
                    className={`min-h-[120px] p-2 border border-gray-100 cursor-pointer transition-all duration-200 ${
                      isCurrentMonth
                        ? "bg-white hover:bg-gray-50"
                        : "bg-gray-50 text-gray-400"
                    } ${isToday ? "bg-pink-50 border-pink-200" : ""} ${
                      isSelected ? "bg-pink-100 border-pink-300" : ""
                    }`}
                    onClick={() => setSelectedDate(day)}
                  >
                    <div
                      className={`text-sm font-medium mb-1 ${
                        isToday ? "text-pink-600" : "text-gray-900"
                      }`}
                    >
                      {day.getDate()}
                    </div>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 2).map((event) => (
                        <div
                          key={event.id}
                          className={`text-xs px-2 py-1 rounded border ${getEventTypeColor(
                            event.type
                          )} truncate`}
                          title={event.title}
                        >
                          {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-xs text-gray-500">
                          +{dayEvents.length - 2} more
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Event Details Sidebar */}
        {selectedDate && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl border-l border-gray-200 z-50"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedDate.toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </h3>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                {getEventsForDate(selectedDate).length === 0 ? (
                  <div className="text-center py-8">
                    <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No events scheduled</p>
                  </div>
                ) : (
                  getEventsForDate(selectedDate).map((event) => (
                    <div
                      key={event.id}
                      className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <h4 className="font-semibold text-gray-900 mb-2">
                        {event.title}
                      </h4>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center">
                          <ClockIcon className="h-4 w-4 mr-2" />
                          {event.time}
                        </div>
                        <div className="flex items-center">
                          <MapPinIcon className="h-4 w-4 mr-2" />
                          {event.location}
                        </div>
                        <div className="flex items-center">
                          <UserGroupIcon className="h-4 w-4 mr-2" />
                          {event.attendees.join(", ")}
                        </div>
                        <p className="text-gray-700 mt-2">
                          {event.description}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default EventsCalendar;
