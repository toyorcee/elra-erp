import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../../../../context/AuthContext";

const ProjectResources = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

  // Access control - only Manager+ can access
  if (!user || user.role.level < 600) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Access Denied
          </h2>
          <p className="text-gray-600">
            You don't have permission to access Resource Allocation.
          </p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Mock data for now
      setProjects([
        {
          _id: "1",
          name: "Website Redesign",
          status: "In Progress",
          allocatedResources: [
            {
              id: "1",
              name: "John Doe",
              role: "Frontend Developer",
              hours: 40,
              utilization: 85,
            },
            {
              id: "2",
              name: "Jane Smith",
              role: "UI/UX Designer",
              hours: 30,
              utilization: 70,
            },
          ],
        },
        {
          _id: "2",
          name: "Mobile App Development",
          status: "In Progress",
          allocatedResources: [
            {
              id: "3",
              name: "Mike Johnson",
              role: "Mobile Developer",
              hours: 35,
              utilization: 90,
            },
            {
              id: "4",
              name: "Sarah Wilson",
              role: "Backend Developer",
              hours: 25,
              utilization: 60,
            },
          ],
        },
      ]);

      setResources([
        {
          id: "1",
          name: "John Doe",
          role: "Frontend Developer",
          department: "Engineering",
          availability: 85,
          skills: ["React", "Vue.js", "TypeScript"],
        },
        {
          id: "2",
          name: "Jane Smith",
          role: "UI/UX Designer",
          department: "Design",
          availability: 70,
          skills: ["Figma", "Adobe XD", "Sketch"],
        },
        {
          id: "3",
          name: "Mike Johnson",
          role: "Mobile Developer",
          department: "Engineering",
          availability: 90,
          skills: ["React Native", "Flutter", "iOS"],
        },
        {
          id: "4",
          name: "Sarah Wilson",
          role: "Backend Developer",
          department: "Engineering",
          availability: 60,
          skills: ["Node.js", "Python", "MongoDB"],
        },
        {
          id: "5",
          name: "Alex Brown",
          role: "Project Manager",
          department: "Management",
          availability: 95,
          skills: ["Agile", "Scrum", "JIRA"],
        },
      ]);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load resource data");
    } finally {
      setLoading(false);
    }
  };

  const getAvailabilityColor = (availability) => {
    if (availability >= 80) return "text-green-600 bg-green-100";
    if (availability >= 60) return "text-blue-600 bg-blue-100";
    if (availability >= 40) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  const getUtilizationColor = (utilization) => {
    if (utilization >= 80) return "text-red-600 bg-red-100";
    if (utilization >= 60) return "text-yellow-600 bg-yellow-100";
    return "text-green-600 bg-green-100";
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
          Resource Allocation
        </h1>
        <p className="text-gray-600">
          Manage and allocate resources across projects
        </p>
      </div>

      {/* Resource Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Total Resources
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {resources.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Available</p>
              <p className="text-2xl font-semibold text-gray-900">
                {resources.filter((r) => r.availability > 60).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg
                className="w-6 h-6 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Overloaded</p>
              <p className="text-2xl font-semibold text-gray-900">
                {resources.filter((r) => r.availability < 40).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg
                className="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Active Projects
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {projects.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Projects with Resource Allocation */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Project Resource Allocation
          </h2>
        </div>
        <div className="p-6">
          {projects.map((project) => (
            <div key={project._id} className="mb-6 last:mb-0">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-medium text-gray-900">
                  {project.name}
                </h3>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                  {project.status}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {project.allocatedResources.map((resource) => (
                  <div
                    key={resource.id}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">
                        {resource.name}
                      </h4>
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded ${getUtilizationColor(
                          resource.utilization
                        )}`}
                      >
                        {resource.utilization}% utilized
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {resource.role}
                    </p>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Hours/week:</span>
                      <span className="font-medium">{resource.hours}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Available Resources */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Available Resources
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Resource
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Availability
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Skills
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {resources.map((resource) => (
                <tr key={resource.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {resource.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{resource.role}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {resource.department}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAvailabilityColor(
                        resource.availability
                      )}`}
                    >
                      {resource.availability}%
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {resource.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
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

export default ProjectResources;
