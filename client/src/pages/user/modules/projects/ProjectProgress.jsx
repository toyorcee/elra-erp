import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../../../../context/AuthContext";

const ProjectProgress = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      // Mock data for now
      setProjects([
        {
          _id: "1",
          name: "Website Redesign",
          progress: 75,
          status: "In Progress",
          startDate: "2024-01-15",
          endDate: "2024-03-15",
          milestones: [
            { name: "Design Phase", completed: true, progress: 100 },
            { name: "Development Phase", completed: false, progress: 75 },
            { name: "Testing Phase", completed: false, progress: 0 },
            { name: "Deployment", completed: false, progress: 0 },
          ],
        },
        {
          _id: "2",
          name: "Mobile App Development",
          progress: 45,
          status: "In Progress",
          startDate: "2024-02-01",
          endDate: "2024-05-01",
          milestones: [
            { name: "Planning", completed: true, progress: 100 },
            { name: "UI/UX Design", completed: true, progress: 100 },
            { name: "Frontend Development", completed: false, progress: 60 },
            { name: "Backend Development", completed: false, progress: 30 },
            { name: "Testing & QA", completed: false, progress: 0 },
          ],
        },
      ]);
    } catch (error) {
      console.error("Error loading projects:", error);
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return "text-green-600 bg-green-100";
    if (progress >= 60) return "text-blue-600 bg-blue-100";
    if (progress >= 40) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800";
      case "In Progress":
        return "bg-blue-100 text-blue-800";
      case "On Hold":
        return "bg-yellow-100 text-yellow-800";
      case "Cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--elra-primary)]"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Project Progress Tracking
        </h1>
        <p className="text-gray-600">
          Monitor and track the progress of all active projects
        </p>
      </div>

      <div className="grid gap-6">
        {projects.map((project) => (
          <div
            key={project._id}
            className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {project.name}
                </h3>
                <div className="flex items-center space-x-4 mt-1">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      project.status
                    )}`}
                  >
                    {project.status}
                  </span>
                  <span className="text-sm text-gray-500">
                    {project.startDate} - {project.endDate}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  {project.progress}%
                </div>
                <div className="text-sm text-gray-500">Overall Progress</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Progress</span>
                <span>{project.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    project.progress >= 80
                      ? "bg-green-500"
                      : project.progress >= 60
                      ? "bg-blue-500"
                      : project.progress >= 40
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${project.progress}%` }}
                ></div>
              </div>
            </div>

            {/* Milestones */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Milestones</h4>
              <div className="space-y-2">
                {project.milestones.map((milestone, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          milestone.completed ? "bg-green-500" : "bg-gray-300"
                        }`}
                      ></div>
                      <span
                        className={`text-sm ${
                          milestone.completed
                            ? "text-gray-900"
                            : "text-gray-600"
                        }`}
                      >
                        {milestone.name}
                      </span>
                    </div>
                    <span
                      className={`text-sm font-medium ${getProgressColor(
                        milestone.progress
                      )} px-2 py-1 rounded`}
                    >
                      {milestone.progress}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {projects.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Projects Found
          </h3>
          <p className="text-gray-500">
            There are no active projects to track progress for.
          </p>
        </div>
      )}
    </div>
  );
};

export default ProjectProgress;
