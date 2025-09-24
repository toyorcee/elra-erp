import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarIcon,
  UserGroupIcon,
  FunnelIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { useAuth } from "../../../../context/AuthContext";
import { userModulesAPI } from "../../../../services/userModules";
import defaultAvatar from "../../../../assets/defaulticon.jpg";

const DepartmentLeaveCalendar = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [monthCursor, setMonthCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [error, setError] = useState(null);

  const getImageUrl = (avatarPath) => {
    if (!avatarPath) return defaultAvatar;
    if (avatarPath.startsWith("http")) return avatarPath;
    const baseUrl = (
      import.meta.env.VITE_API_URL || "http://localhost:5000/api"
    ).replace("/api", "");
    return `${baseUrl}${avatarPath}`;
  };

  const departmentId =
    user?.department?._id || user?.department?.id || user?.department;

  const visibleRange = useMemo(() => {
    const start = new Date(
      monthCursor.getFullYear(),
      monthCursor.getMonth(),
      1
    );
    const end = new Date(
      monthCursor.getFullYear(),
      monthCursor.getMonth() + 1,
      0,
      23,
      59,
      59
    );
    return { start, end };
  }, [monthCursor]);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await userModulesAPI.leave.getDepartmentCalendar({
        startDate: visibleRange.start.toISOString(),
        endDate: visibleRange.end.toISOString(),
        status: "Approved",
      });
      const list = Array.isArray(res?.data) ? res.data : [];
      const mapped = list.map((lv) => ({
        id: lv._id,
        title: `${lv.type || lv.leaveType || "Leave"}`,
        start: new Date(lv.startDate || lv.start),
        end: new Date(lv.endDate || lv.end),
        status: lv.status || lv.approvalStatus || "approved",
        employeeName:
          `${
            lv.employee?.firstName || lv.employee?.name || lv.employeeName || ""
          }`.trim() + (lv.employee?.lastName ? ` ${lv.employee.lastName}` : ""),
        employeeRole: lv.employee?.role?.name || lv.employeeRole || "",
        reason: lv.reason || lv.leaveReason || "",
        avatar: lv.employee?.avatar || null,
      }));
      setEvents(mapped);
    } catch (e) {
      console.error("Error loading department leaves", e);
      setError("Failed to load department leave calendar");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!departmentId) return;
    fetchLeaves();
  }, [departmentId, visibleRange.start.getTime(), visibleRange.end.getTime()]);

  const goPrev = () =>
    setMonthCursor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const goNext = () =>
    setMonthCursor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  const weeks = useMemo(() => {
    const start = new Date(visibleRange.start);
    const firstWeekDay = new Date(start);
    firstWeekDay.setDate(
      firstWeekDay.getDate() - ((firstWeekDay.getDay() + 6) % 7)
    ); // Monday-first grid
    const grid = [];
    let cursor = new Date(firstWeekDay);
    for (let w = 0; w < 6; w++) {
      const week = [];
      for (let d = 0; d < 7; d++) {
        week.push(new Date(cursor));
        cursor.setDate(cursor.getDate() + 1);
      }
      grid.push(week);
    }
    return grid;
  }, [visibleRange.start]);

  const eventsByDate = useMemo(() => {
    const map = {};
    events.forEach((ev) => {
      const day = new Date(ev.start);
      const end = new Date(ev.end);
      for (let d = new Date(day); d <= end; d.setDate(d.getDate() + 1)) {
        const key = d.toISOString().slice(0, 10);
        if (!map[key]) map[key] = [];
        map[key].push(ev);
      }
    });
    return map;
  }, [events]);

  return (
    <div className="space-y-6 p-4">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-[var(--elra-primary)] bg-opacity-10 rounded-lg">
            <CalendarIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Department Leave Calendar
            </h1>
            <p className="text-gray-600">Approved leaves for your department</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={goPrev}
            className="px-3 py-2 rounded-lg bg-[var(--elra-primary)] text-white hover:bg-[var(--elra-primary-dark)] transition-colors flex items-center gap-1"
          >
            <ChevronLeftIcon className="w-4 h-4" />
            Prev
          </button>
          <div className="text-sm font-semibold">
            {monthCursor.toLocaleString(undefined, {
              month: "long",
              year: "numeric",
            })}
          </div>
          <button
            onClick={goNext}
            className="px-3 py-2 rounded-lg bg-[var(--elra-primary)] text-white hover:bg-[var(--elra-primary-dark)] transition-colors flex items-center gap-1"
          >
            Next
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--elra-primary)]"></div>
        </div>
      ) : error ? (
        <div className="text-center text-red-600">{error}</div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
        >
          <div className="grid grid-cols-7 gap-2 text-xs font-medium text-gray-600 mb-2">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div key={d} className="text-center">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {weeks.map((week, i) => (
              <React.Fragment key={i}>
                {week.map((day, j) => {
                  const isCurrentMonth =
                    day.getMonth() === monthCursor.getMonth();
                  const key = day.toISOString().slice(0, 10);
                  const dayEvents = eventsByDate[key] || [];
                  return (
                    <div
                      key={`${i}-${j}`}
                      className={`h-28 border rounded-lg p-1 ${
                        isCurrentMonth ? "bg-white" : "bg-gray-50"
                      }`}
                    >
                      <div className="text-[10px] text-gray-500">
                        {day.getDate()}
                      </div>
                      <div className="space-y-1 mt-1 overflow-visible max-h-20">
                        {dayEvents.slice(0, 3).map((ev) => (
                          <div
                            key={ev.id + key}
                            className="group relative flex items-center gap-1 text-[10px] px-1 py-0.5 rounded bg-[var(--elra-secondary-3)] text-[var(--elra-primary)] truncate"
                          >
                            <span className="w-4 h-4 rounded-full overflow-hidden bg-gray-100 shrink-0">
                              {ev.avatar ? (
                                <img
                                  src={getImageUrl(ev.avatar)}
                                  alt={ev.employeeName || "Employee"}
                                  className="w-full h-full object-cover"
                                  onError={(e) =>
                                    (e.currentTarget.src = defaultAvatar)
                                  }
                                />
                              ) : (
                                <span className="w-full h-full flex items-center justify-center text-[9px] font-semibold text-gray-600">
                                  {(ev.employeeName || " ")
                                    .trim()
                                    .charAt(0)
                                    .toUpperCase()}
                                </span>
                              )}
                            </span>
                            <span className="truncate">{ev.title}</span>
                            <div className="pointer-events-none absolute left-0 top-full mt-1 hidden group-hover:block z-20 bg-white border border-gray-200 shadow-lg rounded p-2 text-[10px] w-56 text-gray-700">
                              <div className="font-semibold text-gray-900 truncate">
                                {ev.employeeName || "Employee"}
                              </div>
                              {ev.employeeRole && (
                                <div className="text-gray-500">
                                  {ev.employeeRole}
                                </div>
                              )}
                              {ev.reason && (
                                <div className="mt-1 text-gray-600 line-clamp-3">
                                  {ev.reason}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-[10px] text-gray-500">
                            +{dayEvents.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default DepartmentLeaveCalendar;
