import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../../../context/AuthContext";
import { useSocket } from "../../../../context/SocketContext";
import communicationAPI from "../../../../services/communication";
import { userModulesAPI } from "../../../../services/userModules";
import { toast } from "react-toastify";
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
import ELRALogo from "../../../../components/ELRALogo.jsx";
import AnimatedBubbles from "../../../../components/ui/AnimatedBubbles.jsx";
import DataTable from "../../../../components/common/DataTable.jsx";

const EventsCalendar = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [period, setPeriod] = useState("month");
  const [viewMode, setViewMode] = useState("calendar");

  useEffect(() => {
    if (
      user?.role?.level < 700 ||
      user?.department?.name !== "Human Resources"
    ) {
      setViewMode("calendar");
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      const from = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      );
      const to = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0,
        23,
        59,
        59,
        999
      );
      loadEvents(from.toISOString(), to.toISOString());
    }
  }, [user]);
  const [editingEvent, setEditingEvent] = useState(null);
  const [saving, setSaving] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [showUpdateConfirm, setShowUpdateConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [eventToUpdate, setEventToUpdate] = useState(null);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: "",
    startTime: "09:00",
    startMeridiem: "AM",
    endDate: "",
    endTime: "10:00",
    endMeridiem: "AM",
    location: "",
    category: "meeting",
    audienceScope: "all",
    selectedDepartment: "",
  });

  const fetchDepartments = async () => {
    try {
      setLoadingDepartments(true);
      const response = await userModulesAPI.departments.getAllDepartments();
      if (response.success) {
        setDepartments(response.data || []);
      } else {
        console.error("Failed to fetch departments:", response.error);
        setDepartments([]);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
      setDepartments([]);
    } finally {
      setLoadingDepartments(false);
    }
  };

  const openCreateModal = () => {
    const base = selectedDate || new Date();
    const isoDate = new Date(base).toISOString().slice(0, 10);
    setEditingEvent(null);
    setFormData({
      title: "",
      description: "",
      startDate: isoDate,
      startTime: "09:00",
      startMeridiem: "AM",
      endDate: isoDate,
      endTime: "10:00",
      endMeridiem: "AM",
      location: "",
      category: "meeting",
      audienceScope: "all",
      selectedDepartment: "",
    });
    setShowCreateModal(true);
    fetchDepartments();
  };

  const openEditModal = (event) => {
    const s = event.start || event.date || new Date();
    const e = event.end || s;
    const sh = new Date(s).getHours();
    const sm = new Date(s).getMinutes();
    const eh = new Date(e).getHours();
    const em = new Date(e).getMinutes();
    const to12 = (h, m) => {
      const mer = h >= 12 ? "PM" : "AM";
      const hh = ((h + 11) % 12) + 1;
      const hhStr = hh.toString().padStart(2, "0");
      const mmStr = m.toString().padStart(2, "0");
      return { time: `${hhStr}:${mmStr}`, meridiem: mer };
    };
    const s12 = to12(sh, sm);
    const e12 = to12(eh, em);
    setEditingEvent(event);
    setFormData({
      title: event.title || "",
      description: event.description || "",
      startDate: new Date(s).toISOString().slice(0, 10),
      startTime: s12.time,
      startMeridiem: s12.meridiem,
      endDate: new Date(e).toISOString().slice(0, 10),
      endTime: e12.time,
      endMeridiem: e12.meridiem,
      location: event.location || "",
      category: event.category || "meeting",
      audienceScope: event.audienceScope || "all",
      selectedDepartment: event.department || "",
    });
    setShowCreateModal(true);
    fetchDepartments();
  };

  const refreshCurrentPeriod = async () => {
    let from;
    let to;
    if (period === "month") {
      from = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      to = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0,
        23,
        59,
        59,
        999
      );
    } else if (period === "7d") {
      to = new Date();
      from = new Date();
      from.setDate(to.getDate() - 7);
    } else if (period === "30d") {
      to = new Date();
      from = new Date();
      from.setDate(to.getDate() - 30);
    } else if (period === "all") {
      // For "All Events", we don't set from/to - loadEvents will handle this
      await loadEvents();
      return;
    } else {
      from = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      to = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    }
    await loadEvents(from.toISOString(), to.toISOString());
  };

  const handleSaveEvent = async () => {
    try {
      setSaving(true);
      const to24 = (timeStr, mer) => {
        if (!timeStr) return "00:00";
        const [hhStr, mmStr] = timeStr.split(":");
        let hh = parseInt(hhStr || "0", 10);
        const mm = parseInt(mmStr || "0", 10);
        if (mer === "PM" && hh < 12) hh += 12;
        if (mer === "AM" && hh === 12) hh = 0;
        return `${hh.toString().padStart(2, "0")}:${mm
          .toString()
          .padStart(2, "0")}`;
      };
      const start24 = to24(formData.startTime, formData.startMeridiem);
      const end24 = to24(formData.endTime, formData.endMeridiem);
      const startISO = new Date(
        `${formData.startDate}T${start24}:00`
      ).toISOString();
      const endISO = new Date(`${formData.endDate}T${end24}:00`).toISOString();
      const payload = {
        title: formData.title,
        description: formData.description,
        startDate: formData.startDate,
        startTime: formData.startTime,
        startMeridiem: formData.startMeridiem,
        endDate: formData.endDate,
        endTime: formData.endTime,
        endMeridiem: formData.endMeridiem,
        location: formData.location,
        category: formData.category,
        audienceScope: formData.audienceScope,
        ...(formData.audienceScope === "department" && {
          department: formData.selectedDepartment,
        }),
      };
      if (editingEvent?.id) {
        // Show confirmation modal for updates
        setEventToUpdate({ ...editingEvent, payload });
        setShowUpdateConfirm(true);
        setShowCreateModal(false);
        setEditingEvent(null);
      } else {
        // Create new event directly
        await communicationAPI.createEvent(payload);
        await refreshCurrentPeriod();
        setShowCreateModal(false);
        setEditingEvent(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      setIsDeleting(true);
      console.log("🔄 [EventsCalendar] Starting delete event:", eventId);
      await communicationAPI.deleteEvent(eventId);
      await refreshCurrentPeriod();
      toast.success("Event deleted successfully");
      console.log("✅ [EventsCalendar] Delete successful, closing modal");
      setShowDeleteConfirm(false);
      setEventToDelete(null);
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete event");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdateEvent = async () => {
    try {
      setIsUpdating(true);
      console.log("🔄 [EventsCalendar] Starting update event:", eventToUpdate);
      await communicationAPI.updateEvent(
        eventToUpdate.id,
        eventToUpdate.payload
      );
      await refreshCurrentPeriod();
      toast.success("Event updated successfully");
      console.log("✅ [EventsCalendar] Update successful, closing modal");

      // Clear all modal states
      setShowUpdateConfirm(false);
      setEventToUpdate(null);
      setShowCreateModal(false);
      setEditingEvent(null);
    } catch (error) {
      console.error("Update event error:", error);
      toast.error("Failed to update event");
    } finally {
      setIsUpdating(false);
    }
  };

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

  const loadEvents = async (fromISO, toISO) => {
    try {
      setLoading(true);
      setError("");
      const params = {};
      if (fromISO && toISO) {
        params.from = fromISO;
        params.to = toISO;
      }
      const { data } = await communicationAPI.getAllEvents(params);

      const mapped = (Array.isArray(data) ? data : data?.items || []).map(
        (e) => ({
          id: e._id,
          title: e.title,
          date: new Date(e.start),
          start: new Date(e.start),
          end: new Date(e.end),
          time: new Date(e.start).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          }),
          location: e.location || "",
          category: e.category || "meeting",
          attendees: [],
          description: e.description || "",
          type: e.audienceScope === "all" ? "company" : "meeting",
          audienceScope: e.audienceScope,
          eventState: e.eventState || "created",
          lastUpdatedBy: e.lastUpdatedBy,
          originalStart: e.originalStart,
          originalEnd: e.originalEnd,
          updateHistory: e.updateHistory || [],
        })
      );
      setEvents(mapped);
    } catch (err) {
      setError("Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  // Fetch events based on selected period
  useEffect(() => {
    let from;
    let to;
    if (period === "month") {
      from = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      to = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0,
        23,
        59,
        59,
        999
      );
    } else if (period === "7d") {
      to = new Date();
      from = new Date();
      from.setDate(to.getDate() - 7);
    } else if (period === "30d") {
      to = new Date();
      from = new Date();
      from.setDate(to.getDate() - 30);
    } else if (period === "all") {
      // For "All Events", load without date range
      loadEvents();
      return;
    } else {
      from = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      to = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    }
    loadEvents(from.toISOString(), to.toISOString());
  }, [currentDate, period]);

  useEffect(() => {
    if (!socket) return;

    const refreshEvents = () => {
      let from;
      let to;
      if (period === "month") {
        from = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        to = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      } else if (period === "7d") {
        to = new Date();
        from = new Date();
        from.setDate(to.getDate() - 7);
      } else if (period === "30d") {
        to = new Date();
        from = new Date();
        from.setDate(to.getDate() - 30);
      } else if (period === "all") {
        // For "All Events", load without date range
        loadEvents();
        return;
      }
      if (from && to) {
        loadEvents(from.toISOString(), to.toISOString());
      }
    };

    // Listen for event creation
    socket.on("communication:eventCreated", (data) => {
      console.log("📡 [EventsCalendar] Event created via socket:", data);
      refreshEvents();
    });

    // Listen for event updates
    socket.on("communication:eventUpdated", (data) => {
      console.log("📡 [EventsCalendar] Event updated via socket:", data);
      refreshEvents();
    });

    // Listen for event deletion
    socket.on("communication:eventDeleted", (data) => {
      console.log("📡 [EventsCalendar] Event deleted via socket:", data);
      refreshEvents();
    });

    return () => {
      socket.off("communication:eventCreated");
      socket.off("communication:eventUpdated");
      socket.off("communication:eventDeleted");
    };
  }, [socket, period, currentDate]);

  // Get current month's start and end dates
  const getMonthDates = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    return { firstDay, lastDay };
  };

  // Get event background color based on state
  const getEventBackgroundColor = (event) => {
    switch (event.eventState) {
      case "created":
        return "bg-[var(--elra-primary)]";
      case "updated":
        return "bg-blue-500";
      case "rescheduled":
        return "bg-orange-500";
      default:
        return "bg-[var(--elra-primary)]";
    }
  };

  // Get event border color based on state
  const getEventBorderColor = (event) => {
    switch (event.eventState) {
      case "created":
        return "border-[var(--elra-primary)]";
      case "updated":
        return "border-blue-500";
      case "rescheduled":
        return "border-orange-500";
      default:
        return "border-[var(--elra-primary)]";
    }
  };

  // Generate calendar days
  const generateCalendarDays = (date) => {
    const { firstDay, lastDay } = getMonthDates(date);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

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

  const getHistoricalEventsForDate = (date) => {
    const historicalEvents = [];

    events.forEach((event) => {
      if (event.updateHistory && event.updateHistory.length > 0) {
        event.updateHistory.forEach((update) => {
          if (update.previousStart) {
            const previousDate = new Date(update.previousStart);
            if (previousDate.toDateString() === date.toDateString()) {
              console.log(
                "✅ [getHistoricalEventsForDate] Found historical event match!"
              );
              historicalEvents.push({
                ...event,
                historicalInfo: {
                  wasOn: previousDate,
                  movedTo: event.date,
                  updatedAt: update.updatedAt,
                  updatedBy: update.updatedBy,
                  changes: update.changes,
                },
              });
            }
          }
        });
      }
    });

    return historicalEvents;
  };

  // Navigate months
  const navigateMonth = (direction) => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1)
    );
  };

  const getEventTypeColor = (type) => {
    const colors = {
      meeting: "bg-blue-100 text-blue-800 border-blue-200",
      company_event: "bg-purple-100 text-purple-800 border-purple-200",
      training: "bg-green-100 text-green-800 border-green-200",
      onboarding: "bg-orange-100 text-orange-800 border-orange-200",
      entertainment: "bg-pink-100 text-pink-800 border-pink-200",
      department_event: "bg-indigo-100 text-indigo-800 border-indigo-200",
      conference: "bg-yellow-100 text-yellow-800 border-yellow-200",
      workshop: "bg-teal-100 text-teal-800 border-teal-200",
      social: "bg-rose-100 text-rose-800 border-rose-200",
      other: "bg-gray-100 text-gray-800 border-gray-200",
      default: "bg-gray-100 text-gray-800 border-gray-200",
    };
    return colors[type] || colors.default;
  };

  const getDayBackgroundColor = (day, dayEvents) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayDate = new Date(day);
    dayDate.setHours(0, 0, 0, 0);

    if (dayDate >= today && dayEvents.length > 0) {
      const eventStates = dayEvents.map(
        (event) => event.eventState || "created"
      );

      if (eventStates.length > 1) {
        return "bg-gradient-to-br from-green-100 via-blue-100 to-orange-100 border-2 border-green-300";
      }

      const primaryState = eventStates[0];
      const stateColors = {
        created:
          "bg-gradient-to-br from-green-100 to-green-200 border-2 border-green-300",
        updated:
          "bg-gradient-to-br from-blue-100 to-blue-200 border-2 border-blue-300",
        rescheduled:
          "bg-gradient-to-br from-orange-100 to-orange-200 border-2 border-orange-300",
      };

      return stateColors[primaryState] || stateColors.created;
    }

    return "";
  };

  // Table columns for events
  const eventsTableColumns = [
    {
      header: "Event Details",
      accessor: "title",
      renderer: (row) => (
        <div>
          <div className="text-sm font-semibold text-gray-900">{row.title}</div>
          {row.description && (
            <div className="text-sm text-gray-600 mt-1 line-clamp-2">
              {row.description}
            </div>
          )}
        </div>
      ),
    },
    {
      header: "Date & Time",
      accessor: "start",
      renderer: (row) => (
        <div className="text-sm text-gray-900">
          <div className="font-medium">
            {new Date(row.start).toLocaleDateString()}
          </div>
          <div className="text-gray-600">
            {new Date(row.start).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}{" "}
            -
            {new Date(row.end).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      ),
    },
    {
      header: "Location",
      accessor: "location",
      renderer: (row) => (
        <div className="text-sm text-gray-900 flex items-center">
          <MapPinIcon className="h-4 w-4 mr-2 text-gray-400" />
          {row.location || "TBD"}
        </div>
      ),
    },
    {
      header: "Category",
      accessor: "category",
      renderer: (row) => (
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getEventTypeColor(
            row.category
          )}`}
        >
          {row.category?.replace("_", " ").toUpperCase() || "MEETING"}
        </span>
      ),
    },
    {
      header: "Audience",
      accessor: "audienceScope",
      renderer: (row) => (
        <div className="flex items-center text-sm text-gray-900">
          <UserGroupIcon className="h-4 w-4 mr-2 text-gray-400" />
          {row.audienceScope === "all" ? "All Employees" : "Department Only"}
        </div>
      ),
    },
  ];

  const calendarDays = useMemo(
    () => generateCalendarDays(currentDate),
    [currentDate]
  );
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
      <div className="p-4 mx-auto">
        {/* Enhanced Header */}
        <div className="bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] rounded-2xl p-8 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center">
                <CalendarIcon className="h-10 w-10 mr-4" />
                Events Calendar
              </h1>
              <p className="text-white/90 text-lg">
                View and manage company events and meetings
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {/* View Mode Toggle */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-1 flex">
                <button
                  onClick={() => setViewMode("calendar")}
                  className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                    viewMode === "calendar"
                      ? "bg-white text-[var(--elra-primary)] shadow-lg"
                      : "text-white/80 hover:text-white"
                  }`}
                >
                  <CalendarIcon className="h-5 w-5 mr-2 inline" />
                  Calendar
                </button>
                {user?.role?.level >= 700 &&
                  user?.department?.name === "Human Resources" && (
                    <button
                      onClick={() => setViewMode("events")}
                      className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                        viewMode === "events"
                          ? "bg-white text-[var(--elra-primary)] shadow-lg"
                          : "text-white/80 hover:text-white"
                      }`}
                    >
                      <svg
                        className="h-5 w-5 mr-2 inline"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Events
                    </button>
                  )}
              </div>

              {/* Period Selector */}
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-2 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/30"
              >
                <option value="month" className="text-gray-900">
                  This Month
                </option>
                <option value="7d" className="text-gray-900">
                  Last 7 days
                </option>
                <option value="30d" className="text-gray-900">
                  Last 30 days
                </option>
                <option value="all" className="text-gray-900">
                  All Events
                </option>
              </select>

              {/* Create Event Button - Fixed ELRA Green */}
              {user?.role?.level >= 700 &&
                user?.department?.name === "Human Resources" && (
                  <button
                    onClick={openCreateModal}
                    className="inline-flex items-center px-6 py-3 bg-white text-[var(--elra-primary)] rounded-xl hover:bg-white/90 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Create Event
                  </button>
                )}
            </div>
          </div>
        </div>

        {/* Color Legend */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Event Status Legend
          </h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-[var(--elra-primary)] rounded border border-[var(--elra-primary)]"></div>
              <span className="text-sm text-gray-600">New Event</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-500 rounded border border-blue-500"></div>
              <span className="text-sm text-gray-600">Updated Event</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-orange-500 rounded border border-orange-500"></div>
              <span className="text-sm text-gray-600">Rescheduled Event</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Hover over events or click to see details.
          </p>
        </div>

        {/* Conditional View Rendering */}
        {viewMode === "events" ? (
          /* Events Table View */
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <svg
                  className="h-6 w-6 mr-3 text-[var(--elra-primary)]"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Events List ({events.length} events)
              </h2>
            </div>

            <DataTable
              data={events}
              columns={eventsTableColumns}
              loading={loading}
              className="bg-white"
              actions={{
                showEdit: true,
                showDelete: true,
                showToggle: false,
                onEdit: (rowData) => {
                  console.log("🔍 [EventsCalendar] Edit clicked:", rowData);
                  openEditModal(rowData);
                },
                onDelete: (rowData) => {
                  console.log("🔍 [EventsCalendar] Delete clicked:", rowData);
                  setEventToDelete(rowData);
                  setShowDeleteConfirm(true);
                },
              }}
              emptyMessage="No events found. Try adjusting your date range or create a new event."
              emptyIcon={
                <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              }
            />
          </div>
        ) : (
          /* Calendar View */
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Calendar Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {monthName}
              </h2>
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
              {error && (
                <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                  {error}
                </div>
              )}
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 mb-4">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                  (day) => (
                    <div
                      key={day}
                      className="p-2 text-center text-sm font-medium text-gray-500"
                    >
                      {day}
                    </div>
                  )
                )}
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
                          ? getDayBackgroundColor(day, dayEvents) ||
                            "bg-white hover:bg-gray-50"
                          : "bg-gray-50 text-gray-400"
                      } ${
                        isToday
                          ? "bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200 shadow-md"
                          : ""
                      } ${
                        isSelected
                          ? "bg-gradient-to-br from-pink-100 to-pink-200 border-pink-300 shadow-lg"
                          : ""
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
                            className={`text-xs px-2 py-1 rounded border text-white ${getEventBackgroundColor(
                              event
                            )} ${getEventBorderColor(event)} truncate`}
                            title={`${event.title} (${
                              event.eventState || "created"
                            })`}
                            onDoubleClick={() => {
                              if (
                                user?.role?.level >= 700 &&
                                user?.department?.name === "Human Resources"
                              ) {
                                openEditModal(event);
                              }
                            }}
                          >
                            {event.title}
                          </div>
                        ))}

                        {/* Show historical event indicator if no current events but has historical ones */}
                        {dayEvents.length === 0 &&
                          getHistoricalEventsForDate(day).length > 0 && (
                            <div className="text-xs px-2 py-1 rounded border border-amber-300 bg-amber-100 text-amber-700 truncate">
                              📅 Historical Event
                            </div>
                          )}
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
        )}

        {/* Event Details Sidebar */}
        {selectedDate && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl border-l border-gray-200 z-50 flex flex-col"
          >
            <div className="p-6 flex-shrink-0">
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

              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {getEventsForDate(selectedDate).length === 0 ? (
                  getHistoricalEventsForDate(selectedDate).length > 0 ? (
                    // Show historical events
                    <div className="space-y-4">
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <div className="flex items-center mb-2">
                          <svg
                            className="h-5 w-5 text-amber-600 mr-2"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <h3 className="text-amber-800 font-semibold">
                            Historical Event Information
                          </h3>
                        </div>
                        <p className="text-amber-700 text-sm">
                          This event was previously scheduled for this date but
                          has been moved or updated.
                        </p>
                      </div>
                      {getHistoricalEventsForDate(selectedDate).map((event) => (
                        <div
                          key={`historical-${event.id}`}
                          className="p-4 border border-amber-200 rounded-lg bg-amber-50"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="font-semibold text-gray-900">
                              {event.title}
                            </h4>
                            <span className="text-xs bg-amber-200 text-amber-800 px-2 py-1 rounded-full">
                              Historical
                            </span>
                          </div>

                          <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex items-center">
                              <svg
                                className="h-4 w-4 text-gray-400 mr-2"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <span>
                                <strong>Was scheduled:</strong>{" "}
                                {event.historicalInfo.wasOn.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <svg
                                className="h-4 w-4 text-gray-400 mr-2"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <span>
                                <strong>Now scheduled:</strong>{" "}
                                {event.historicalInfo.movedTo.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <svg
                                className="h-4 w-4 text-gray-400 mr-2"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <span>
                                <strong>Change:</strong>{" "}
                                {event.historicalInfo.changes}
                              </span>
                            </div>
                            {event.location && (
                              <div className="flex items-center">
                                <svg
                                  className="h-4 w-4 text-gray-400 mr-2"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                <span>
                                  <strong>Location:</strong> {event.location}
                                </span>
                              </div>
                            )}
                            {event.description && (
                              <div className="mt-2">
                                <p className="text-gray-600">
                                  {event.description}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No events scheduled</p>
                    </div>
                  )
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

        {/* Enhanced Create/Edit Event Modal with Beautiful Design */}
        <AnimatePresence>
          {showCreateModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowCreateModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 30 }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[95vh] flex flex-col border border-gray-100 relative"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header - Fixed Position */}
                <div className="bg-gradient-to-br from-[var(--elra-primary)] via-[var(--elra-primary-dark)] to-[var(--elra-primary)] text-white p-8 rounded-t-3xl flex-shrink-0 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-6">
                        <div className="p-4 bg-white/20 rounded-3xl backdrop-blur-sm border border-white/20">
                          <ELRALogo variant="dark" size="lg" />
                        </div>
                        <div>
                          <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                            {editingEvent ? "Edit Event" : "Create Event"}
                          </h2>
                          <p className="text-white/90 mt-2 text-lg">
                            {editingEvent
                              ? "Update your event information and settings"
                              : "Create a new company event or meeting"}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowCreateModal(false)}
                        className="p-3 hover:bg-white/20 rounded-2xl transition-all duration-200 backdrop-blur-sm border border-white/20 hover:border-white/30"
                      >
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Form Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6">
                  <form
                    id="create-event-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSaveEvent();
                    }}
                  >
                    {/* SECTION 1: BASIC EVENT INFORMATION */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="bg-gray-50 border border-gray-200 rounded-xl p-6"
                    >
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <svg
                          className="w-5 h-5 mr-2"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Basic Event Information
                      </h3>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-800 mb-2">
                            Event Title <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.title}
                            onChange={(e) =>
                              setFormData((f) => ({
                                ...f,
                                title: e.target.value,
                              }))
                            }
                            placeholder="Enter event title (e.g., Monthly Team Meeting)"
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                            required
                            disabled={saving}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-800 mb-2">
                            Category <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={formData.category}
                            onChange={(e) =>
                              setFormData((f) => ({
                                ...f,
                                category: e.target.value,
                              }))
                            }
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                            required
                            disabled={saving}
                          >
                            <option value="meeting">Meeting</option>
                            <option value="training">Training</option>
                            <option value="onboarding">Onboarding</option>
                            <option value="entertainment">Entertainment</option>
                            <option value="company_event">Company Event</option>
                            <option value="department_event">
                              Department Event
                            </option>
                            <option value="conference">Conference</option>
                            <option value="workshop">Workshop</option>
                            <option value="social">Social</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                      </div>

                      {/* Description Field */}
                      <div className="mt-6">
                        <label className="block text-sm font-semibold text-gray-800 mb-2">
                          Event Description{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          value={formData.description}
                          onChange={(e) =>
                            setFormData((f) => ({
                              ...f,
                              description: e.target.value,
                            }))
                          }
                          rows={4}
                          placeholder="Describe the event purpose, agenda, and any important details..."
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                          required
                          disabled={saving}
                        />
                      </div>
                    </motion.div>

                    {/* SECTION 2: DATE & TIME */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                      className="bg-gray-50 border border-gray-200 rounded-xl p-6 mt-6"
                    >
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <svg
                          className="w-5 h-5 mr-2"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Date & Time
                      </h3>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-800 mb-2">
                            Start Date <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="date"
                            value={formData.startDate}
                            onChange={(e) =>
                              setFormData((f) => ({
                                ...f,
                                startDate: e.target.value,
                              }))
                            }
                            min={new Date().toISOString().split("T")[0]}
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                            required
                            disabled={saving}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-800 mb-2">
                            End Date <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="date"
                            value={formData.endDate}
                            onChange={(e) =>
                              setFormData((f) => ({
                                ...f,
                                endDate: e.target.value,
                              }))
                            }
                            min={
                              formData.startDate ||
                              new Date().toISOString().split("T")[0]
                            }
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                            required
                            disabled={saving}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-800 mb-2">
                            Start Time <span className="text-red-500">*</span>
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="hh:mm"
                              className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                              value={formData.startTime}
                              onChange={(e) =>
                                setFormData((f) => ({
                                  ...f,
                                  startTime: e.target.value,
                                }))
                              }
                              required
                              disabled={saving}
                            />
                            <select
                              className="w-24 border border-gray-300 rounded-lg px-3 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                              value={formData.startMeridiem}
                              onChange={(e) =>
                                setFormData((f) => ({
                                  ...f,
                                  startMeridiem: e.target.value,
                                }))
                              }
                              disabled={saving}
                            >
                              <option>AM</option>
                              <option>PM</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-800 mb-2">
                            End Time <span className="text-red-500">*</span>
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="hh:mm"
                              className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                              value={formData.endTime}
                              onChange={(e) =>
                                setFormData((f) => ({
                                  ...f,
                                  endTime: e.target.value,
                                }))
                              }
                              required
                              disabled={saving}
                            />
                            <select
                              className="w-24 border border-gray-300 rounded-lg px-3 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                              value={formData.endMeridiem}
                              onChange={(e) =>
                                setFormData((f) => ({
                                  ...f,
                                  endMeridiem: e.target.value,
                                }))
                              }
                              disabled={saving}
                            >
                              <option>AM</option>
                              <option>PM</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    {/* SECTION 3: LOCATION & AUDIENCE */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.2 }}
                      className="bg-gray-50 border border-gray-200 rounded-xl p-6 mt-6"
                    >
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <svg
                          className="w-5 h-5 mr-2"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Location & Audience
                      </h3>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-800 mb-2">
                            Location <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.location}
                            onChange={(e) =>
                              setFormData((f) => ({
                                ...f,
                                location: e.target.value,
                              }))
                            }
                            placeholder="Enter event location (e.g., Conference Room A, Zoom Meeting)"
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                            required
                            disabled={saving}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-800 mb-2">
                            Audience Scope{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={formData.audienceScope}
                            onChange={(e) =>
                              setFormData((f) => ({
                                ...f,
                                audienceScope: e.target.value,
                              }))
                            }
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                            required
                            disabled={saving}
                          >
                            <option value="all">All Employees</option>
                            <option value="department">Department Only</option>
                          </select>
                        </div>
                      </div>

                      {/* Department Selection - Show when "department" is selected */}
                      {formData.audienceScope === "department" && (
                        <div className="mt-6">
                          <label className="block text-sm font-semibold text-gray-800 mb-2">
                            Select Department{" "}
                            <span className="text-red-500">*</span>
                            {loadingDepartments && (
                              <span className="ml-2 inline-flex items-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[var(--elra-primary)]"></div>
                              </span>
                            )}
                          </label>
                          <div className="relative">
                            {loadingDepartments ? (
                              <div className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-50 flex items-center justify-center">
                                <AnimatedBubbles
                                  isVisible={true}
                                  variant="spinner"
                                />
                                <span className="ml-3 text-gray-600">
                                  Loading departments...
                                </span>
                              </div>
                            ) : (
                              <select
                                value={formData.selectedDepartment || ""}
                                onChange={(e) =>
                                  setFormData((f) => ({
                                    ...f,
                                    selectedDepartment: e.target.value,
                                  }))
                                }
                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-[var(--elra-primary)] transition-all duration-200"
                                required
                                disabled={saving || loadingDepartments}
                              >
                                <option value="">Select a department</option>
                                {departments.map((dept) => (
                                  <option key={dept._id} value={dept._id}>
                                    {dept.name}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                          {departments.length === 0 && !loadingDepartments && (
                            <p className="mt-2 text-sm text-gray-500">
                              No departments available. Please contact your
                              administrator.
                            </p>
                          )}
                        </div>
                      )}
                    </motion.div>
                  </form>
                </div>

                {/* Fixed Footer with Submit Button */}
                <div className="bg-white border-t border-gray-200 p-6 flex-shrink-0">
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      form="create-event-form"
                      className={`px-6 py-3 rounded-lg transition-all duration-200 flex items-center space-x-2 ${
                        saving
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-[var(--elra-primary)] text-white hover:bg-[var(--elra-primary-dark)]"
                      }`}
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>
                            {editingEvent
                              ? "Updating Event..."
                              : "Creating Event..."}
                          </span>
                        </>
                      ) : (
                        <>
                          <span>
                            {editingEvent ? "Update Event" : "Create Event"}
                          </span>
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                            />
                          </svg>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Update Confirmation Modal */}
      <AnimatePresence>
        {showUpdateConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4"
            >
              {/* Header */}
              <div className="bg-[var(--elra-primary)] p-6 rounded-t-2xl">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white rounded-lg">
                    <svg
                      className="w-6 h-6 text-[var(--elra-primary)]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      Update Event
                    </h3>
                    <p className="text-white text-opacity-90 text-sm">
                      Confirm event update
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Event: {eventToUpdate?.title}
                  </h4>
                  <p className="text-gray-600 text-sm mb-4">
                    Are you sure you want to update this event? All attendees
                    will be notified about the changes.
                  </p>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <svg
                          className="w-5 h-5 text-blue-600 mt-0.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-blue-900">
                          Notification Impact
                        </h5>
                        <p className="text-sm text-blue-700 mt-1">
                          {eventToUpdate?.audienceScope === "all"
                            ? "All employees will receive an update notification"
                            : "Department employees will receive an update notification"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowUpdateConfirm(false);
                      setEventToUpdate(null);
                    }}
                    disabled={isUpdating}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateEvent}
                    disabled={isUpdating}
                    className="flex-1 px-4 py-2 bg-[var(--elra-primary)] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {isUpdating ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Updating...</span>
                      </div>
                    ) : (
                      "Update Event"
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4"
            >
              {/* Header */}
              <div className="bg-red-600 p-6 rounded-t-2xl">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white rounded-lg">
                    <svg
                      className="w-6 h-6 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      Delete Event
                    </h3>
                    <p className="text-white text-opacity-90 text-sm">
                      This action cannot be undone
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Event: {eventToDelete?.title}
                  </h4>
                  <p className="text-gray-600 text-sm mb-4">
                    Are you sure you want to delete this event? This action
                    cannot be undone and all attendees will be notified.
                  </p>

                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <svg
                          className="w-5 h-5 text-red-600 mt-0.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                          />
                        </svg>
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-red-900">
                          Warning
                        </h5>
                        <p className="text-sm text-red-700 mt-1">
                          {eventToDelete?.audienceScope === "all"
                            ? "All employees will receive a cancellation notification"
                            : "Department employees will receive a cancellation notification"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setEventToDelete(null);
                    }}
                    disabled={isDeleting}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteEvent(eventToDelete._id)}
                    disabled={isDeleting}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {isDeleting ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Deleting...</span>
                      </div>
                    ) : (
                      "Delete Event"
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default EventsCalendar;
