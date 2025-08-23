import React, { useState, useEffect } from "react";
import {
  WrenchScrewdriverIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../../../context/AuthContext";
import { toast } from "react-toastify";

const MaintenanceSchedule = () => {
  const { user } = useAuth();
  const [maintenanceSchedules, setMaintenanceSchedules] = useState([]);
  const [loading, setLoading] = useState(false);

  // Access control - only Manager+ can access
  if (!user || user.role.level < 600) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Access Denied
          </h2>
          <p className="text-gray-600">
            You don't have permission to access Maintenance Schedule.
          </p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    loadMaintenanceSchedules();
  }, []);

  const loadMaintenanceSchedules = async () => {
    setLoading(true);
    try {
      // Mock data for now
      setMaintenanceSchedules([
        {
          id: 1,
          item: "Excavator",
          type: "Preventive",
          dueDate: "2024-02-15",
          status: "Scheduled",
          technician: "John Smith",
        },
        {
          id: 2,
          item: "Laptop",
          type: "Repair",
          dueDate: "2024-02-10",
          status: "In Progress",
          technician: "Jane Doe",
        },
        {
          id: 3,
          item: "Office Chair",
          type: "Inspection",
          dueDate: "2024-02-20",
          status: "Completed",
          technician: "Mike Johnson",
        },
      ]);
    } catch (error) {
      console.error("Error loading maintenance schedules:", error);
      toast.error("Error loading maintenance schedules");
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
              Maintenance Schedule
            </h1>
            <p className="text-gray-600">
              Track maintenance schedules and records
            </p>
          </div>
          <button className="bg-[var(--elra-primary)] text-white px-4 py-2 rounded-lg hover:bg-[var(--elra-primary-dark)] flex items-center">
            <PlusIcon className="h-5 w-5 mr-2" />
            New Schedule
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {maintenanceSchedules.map((schedule) => (
          <div
            key={schedule.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center mb-4">
              <div className="p-3 rounded-lg bg-orange-500">
                <WrenchScrewdriverIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  {schedule.item}
                </h3>
                <p className="text-sm text-gray-600">
                  {schedule.type} Maintenance
                </p>
              </div>
            </div>
            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm">
                <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-gray-600">Due Date:</span>
                <span className="font-medium ml-1">
                  {new Date(schedule.dueDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center text-sm">
                <ClockIcon className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-gray-600">Status:</span>
                <span className="font-medium ml-1">{schedule.status}</span>
              </div>
              <div className="flex items-center text-sm">
                <CheckCircleIcon className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-gray-600">Technician:</span>
                <span className="font-medium ml-1">{schedule.technician}</span>
              </div>
            </div>
            <div className="flex space-x-2">
              <button className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded-md text-sm hover:bg-blue-100">
                View Details
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <PencilIcon className="h-4 w-4" />
              </button>
              <button className="p-2 text-gray-400 hover:text-red-600">
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MaintenanceSchedule;
