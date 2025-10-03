import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  XMarkIcon,
  UserGroupIcon,
  PlusIcon,
  FolderIcon,
  CheckCircleIcon,
  UserGroupIcon as UserGroupSolid,
  EyeIcon,
  TrashIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { UserGroupIcon as UserGroupFilled } from "@heroicons/react/24/solid";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  fetchComprehensiveProjectData,
  fetchProjectsAvailableForTeams,
  fetchAllTeamMembers,
  fetchTeamMembersByProject,
  fetchAvailableUsers,
  addTeamMemberNew,
  removeTeamMemberNew,
  fetchProjects,
} from "../../../../services/projectAPI";
import { getUsers } from "../../../../services/users";
import { useAuth } from "../../../../context/AuthContext";
import DataTable from "../../../../components/common/DataTable";

const ProjectTeams = () => {
  const { user } = useAuth();

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .animate-fade-in {
        animation: fadeIn 0.5s ease-out;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);
  const [loading, setLoading] = useState(true);
  const [projectData, setProjectData] = useState(null);
  const [availableProjects, setAvailableProjects] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberData, setNewMemberData] = useState({
    projectId: "",
    selectedUsers: [],
    role: "developer",
    allocationPercentage: 0,
  });
  const [selectedProjectManager, setSelectedProjectManager] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingMemberId, setDeletingMemberId] = useState(null);
  const [showEmptyState, setShowEmptyState] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [selectedProjectTeam, setSelectedProjectTeam] = useState(null);
  const [projectTeamMembers, setProjectTeamMembers] = useState([]);
  const [loadingTeamMembers, setLoadingTeamMembers] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const usersResponse = await getUsers();
      setAllUsers(usersResponse.data || []);

      if (
        user.role.level >= 1000 ||
        (user.role.level >= 700 &&
          user.department?.name === "Project Management")
      ) {
        const comprehensiveData = await fetchComprehensiveProjectData();
        const availableProjectsData = await fetchProjectsAvailableForTeams();

        setProjectData(comprehensiveData.data);
        setAvailableProjects(availableProjectsData.data || []);
        setTeamMembers(comprehensiveData.data.teamMembers || []);
      } else {
        const projectsData = await fetchProjects();
        const teamData = await fetchAllTeamMembers();

        setProjectData({
          projects: projectsData.data || [],
          teamMembers: teamData.data || [],
          statistics: {
            totalProjects: projectsData.data?.length || 0,
            activeProjects:
              projectsData.data?.filter((p) => p.status === "active")?.length ||
              0,
            completedProjects:
              projectsData.data?.filter((p) => p.status === "completed")
                ?.length || 0,
            totalTeamMembers: teamData.data?.length || 0,
          },
        });
        setTeamMembers(teamData.data || []);

        if (projectsData.data && teamData.data) {
          const projectsWithMembers = new Set();
          teamData.data.forEach((member) => {
            const projectId =
              typeof member.project === "object"
                ? member.project._id
                : member.project;
            projectsWithMembers.add(projectId);
          });

          const availableProjectsForHOD = projectsData.data.filter(
            (project) => !projectsWithMembers.has(project._id)
          );
          setAvailableProjects(availableProjectsForHOD);
        }
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load project data");
    } finally {
      setLoading(false);
    }
  };

  const handleProjectSelect = async (projectId) => {
    try {
      setSelectedProject(projectId);
      setNewMemberData((prev) => ({ ...prev, projectId }));

      const availableData = await fetchAvailableUsers(projectId);
      setAvailableUsers(availableData.data || []);
    } catch (error) {
      console.error("Error loading available users:", error);
      toast.error("Failed to load available users");
    }
  };

  const handleProjectChange = (projectId) => {
    const projectsToSearch =
      user.role.level >= 1000 ? availableProjects : projectData?.projects;
    const selectedProject = projectsToSearch?.find((p) => p._id === projectId);
    setSelectedProjectManager(selectedProject?.projectManager || null);

    setNewMemberData((prev) => ({
      ...prev,
      projectId,
      selectedUsers: [],
    }));
  };

  const handleAddTeamMember = async () => {
    try {
      if (
        !newMemberData.projectId ||
        newMemberData.selectedUsers.length === 0
      ) {
        toast.error("Please select both project and at least one employee");
        return;
      }

      setIsSubmitting(true);

      const promises = newMemberData.selectedUsers.map((userId) =>
        addTeamMemberNew({
          ...newMemberData,
          userId,
          allocationPercentage: newMemberData.allocationPercentage || 0,
        })
      );

      await Promise.all(promises);
      toast.success(
        `${newMemberData.selectedUsers.length} team member(s) added successfully`
      );

      setNewMemberData({
        projectId: "",
        selectedUsers: [],
        role: "developer",
        allocationPercentage: 0,
      });
      setSelectedProjectManager(null);
      setShowAddMember(false);
      loadData();
    } catch (error) {
      console.error("Error adding team member:", error);
      toast.error("Failed to add team member(s)");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveTeamMember = (member) => {
    setMemberToDelete(member);
    setShowTeamModal(false);
    setShowDeleteConfirm(true);
  };

  const confirmRemoveTeamMember = async () => {
    if (!memberToDelete) return;

    try {
      setDeletingMemberId(memberToDelete._id);
      await removeTeamMemberNew(memberToDelete._id);
      toast.success("Team member removed successfully");
      loadData();
      setShowDeleteConfirm(false);
      setMemberToDelete(null);
      setShowTeamModal(true);
    } catch (error) {
      console.error("Error removing team member:", error);
      toast.error("Failed to remove team member");
    } finally {
      setDeletingMemberId(null);
    }
  };

  const handleEmployeeToggle = (userId) => {
    setNewMemberData((prev) => ({
      ...prev,
      selectedUsers: prev.selectedUsers.includes(userId)
        ? prev.selectedUsers.filter((id) => id !== userId)
        : [...prev.selectedUsers, userId],
    }));
  };

  const handleViewTeamMembers = async (project) => {
    setSelectedProjectTeam(project);
    setShowTeamModal(true);
    setLoadingTeamMembers(true);

    try {
      const result = await fetchTeamMembersByProject(project._id);
      if (result.success) {
        setProjectTeamMembers(result.data);
        console.log("🔍 Fetched team members for project:", result.data);
      } else {
        console.error("Failed to fetch team members:", result.message);
        setProjectTeamMembers([]);
      }
    } catch (error) {
      console.error("Error fetching team members:", error);
      setProjectTeamMembers([]);
    } finally {
      setLoadingTeamMembers(false);
    }
  };

  const handleCloseTeamModal = () => {
    setShowTeamModal(false);
    setSelectedProjectTeam(null);
    setProjectTeamMembers([]);
    setLoadingTeamMembers(false);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setMemberToDelete(null);
    setShowTeamModal(true);
  };

  const matchesAnyField = (obj, term) => {
    if (!term) return true;
    try {
      const haystack = JSON.stringify(obj || {}).toLowerCase();
      return haystack.includes(term.toLowerCase());
    } catch (e) {
      return false;
    }
  };

  const filteredTeamMembers = projectTeamMembers.filter((member) =>
    matchesAnyField(member, searchTerm)
  );

  const filteredProjects = (projectData?.projects || []).filter((project) =>
    matchesAnyField(project, searchTerm)
  );

  const getDefaultAvatar = (user = null) => {
    if (user && user.firstName && user.lastName) {
      const firstName = user.firstName.charAt(0).toUpperCase();
      const lastName = user.lastName.charAt(0).toUpperCase();
      return `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=random&color=fff&size=40&rounded=true`;
    }
    return "https://ui-avatars.com/api/?name=Unknown+User&background=random&color=fff&size=40&rounded=true";
  };

  const getImageUrl = (avatarPath, user = null) => {
    if (!avatarPath) return getDefaultAvatar(user);

    let path = avatarPath;
    if (typeof avatarPath === "object" && avatarPath.url) {
      path = avatarPath.url;
    }

    if (path.startsWith("http")) return path;

    const baseUrl = (
      import.meta.env.VITE_API_URL || "http://localhost:5000/api"
    ).replace("/api", "");

    return `${baseUrl}${path}`;
  };

  const getAvatarDisplay = (user) => {
    if (user && user.avatar) {
      return (
        <img
          src={getImageUrl(user.avatar, user)}
          alt={`${user.firstName} ${user.lastName}`}
          className="w-10 h-10 rounded-full object-cover"
          onError={(e) => {
            e.target.style.display = "none";
            e.target.nextSibling.style.display = "flex";
          }}
        />
      );
    }
    return (
      <div className="w-10 h-10 bg-[var(--elra-primary)] rounded-full flex items-center justify-center text-white font-bold text-sm">
        {user?.firstName?.[0]}
        {user?.lastName?.[0]}
      </div>
    );
  };

  const getRoleDisplayName = (role) => {
    const roleMap = {
      project_manager: "Project Manager",
      team_lead: "Team Lead",
      developer: "Developer",
      designer: "Designer",
      analyst: "Analyst",
      tester: "Tester",
      consultant: "Consultant",
      support: "Support",
      other: "Other",
    };
    return roleMap[role] || role;
  };

  // Projects table columns (for SUPER_ADMIN)
  const projectColumns = [
    {
      header: "Project",
      accessor: "name",
      renderer: (project) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900 break-words">
            {project.name}
          </div>
          <div className="text-gray-500">{project.code}</div>
        </div>
      ),
    },
    {
      header: "Team Name",
      accessor: "teamName",
      renderer: (project) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900 break-words">
            {project.teamName || `${project.name} Team`}
          </div>
          <div className="text-gray-500">Team Tag</div>
        </div>
      ),
    },
    {
      header: "Manager",
      accessor: "projectManager",
      renderer: (project) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900 break-words">
            {project.projectManager?.firstName}{" "}
            {project.projectManager?.lastName}
          </div>
          <div className="text-gray-500 break-words">
            {project.projectManager?.email}
          </div>
        </div>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      renderer: (project) => {
        const formatStatus = (status) => {
          return status
            .split("_")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
        };

        const getStatusColor = (status) => {
          if (status === "implementation" || status === "in_progress") {
            return "bg-green-100 text-green-800";
          } else if (status === "completed") {
            return "bg-blue-100 text-blue-800";
          } else if (status.includes("pending")) {
            return "bg-yellow-100 text-yellow-800";
          } else {
            return "bg-gray-100 text-gray-800";
          }
        };

        return (
          <span
            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
              project.status
            )}`}
          >
            {formatStatus(project.status)}
          </span>
        );
      },
    },
    {
      header: "Team Size",
      accessor: "teamMemberCount",
      renderer: (project) => (
        <span className="text-sm text-gray-900">
          {project.teamMemberCount || 0} members
        </span>
      ),
    },
    {
      header: "Actions",
      accessor: "actions",
      renderer: (project) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleViewTeamMembers(project)}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-[var(--elra-primary)] bg-[var(--elra-primary)]/10 rounded-lg hover:bg-[var(--elra-primary)]/20 transition-colors cursor-pointer"
          >
            <EyeIcon className="h-4 w-4 mr-1" />
            View Team
          </button>
        </div>
      ),
    },
  ];

  // Team members table columns
  const teamMemberColumns = [
    {
      header: "Member",
      accessor: "user",
      renderer: (member) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10 relative">
            {getAvatarDisplay(member.user)}
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900 break-words">
              {member.user?.firstName} {member.user?.lastName}
            </div>
            <div className="text-sm text-gray-500 break-words">
              {member.user?.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: "Project",
      accessor: "project",
      renderer: (member) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900 break-words">
            {member.project?.name || "N/A"}
          </div>
          <div className="text-gray-500">{member.project?.code || ""}</div>
        </div>
      ),
    },
    {
      header: "Role",
      accessor: "role",
      renderer: (member) => (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
          {getRoleDisplayName(member.role)}
        </span>
      ),
    },
    {
      header: "Assigned By",
      accessor: "assignedBy",
      renderer: (member) => (
        <div className="text-sm text-gray-900 break-words">
          {member.assignedBy?.firstName} {member.assignedBy?.lastName}
        </div>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      renderer: (member) => (
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            member.status === "active"
              ? "bg-green-100 text-green-800"
              : member.status === "inactive"
              ? "bg-yellow-100 text-yellow-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {member.status}
        </span>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--elra-primary)]"></div>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Project Teams Management
        </h1>
        <p className="text-gray-600">
          {user.role.level >= 1000 ||
          (user.role.level >= 700 &&
            user.department?.name === "Project Management")
            ? "Manage all project teams across the organization"
            : "View and manage your project teams"}
        </p>
      </div>

      {/* Statistics Cards (SUPER_ADMIN or PM HOD) */}
      {(user.role.level >= 1000 ||
        (user.role.level >= 700 &&
          user.department?.name === "Project Management")) &&
        projectData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Total Projects
              </h3>
              <p className="text-3xl font-bold text-blue-600">
                {projectData?.statistics?.total?.totalProjects ||
                  projectData?.projects?.length ||
                  0}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Active Projects
              </h3>
              <p className="text-3xl font-bold text-green-600">
                {projectData?.statistics?.activeProjects ||
                  projectData?.projects?.filter(
                    (p) =>
                      p.status === "implementation" ||
                      p.status === "in_progress"
                  )?.length ||
                  0}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Completed Projects
              </h3>
              <p className="text-3xl font-bold text-purple-600">
                {projectData?.statistics?.byStatus?.find(
                  (s) => s._id === "completed"
                )?.count ||
                  projectData?.projects?.filter((p) => p.status === "completed")
                    ?.length ||
                  0}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Total Team Members
              </h3>
              <p className="text-3xl font-bold text-orange-600">
                {projectData?.statistics?.totalTeamMembers ||
                  projectData?.projects?.reduce(
                    (total, project) => total + (project.teamMemberCount || 0),
                    0
                  ) ||
                  0}
              </p>
            </div>
          </div>
        )}

      {/* Team Members List */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {selectedProject ? "Project Team Members" : "Team Members"}
            </h2>
          </div>
          {user.role.level >= 600 && (
            <button
              onClick={() => {
                setShowAddMember(true);
                const projectsToCheck =
                  user.role.level >= 1000
                    ? availableProjects
                    : projectData?.projects;
                if (projectsToCheck?.length > 0) {
                  const firstProject = projectsToCheck[0];
                  handleProjectChange(firstProject._id);
                  setShowEmptyState(false);
                } else {
                  setShowEmptyState(true);
                }
              }}
              className="flex items-center px-4 py-2 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Team Member
            </button>
          )}
        </div>

        {/* Global Search Input */}
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search anything (projects or team members)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-4 w-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <svg
                  className="h-4 w-4 text-gray-400 hover:text-gray-600"
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
            )}
          </div>
        </div>
      </div>

      {/* Projects List (SUPER_ADMIN or PM HOD) */}
      {(user.role.level >= 1000 ||
        (user.role.level >= 700 &&
          user.department?.name === "Project Management")) &&
        projectData && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Projects
                </h2>
                <div className="text-sm text-gray-500">
                  {filteredProjects?.length || 0} of{" "}
                  {projectData?.projects?.length || 0} projects
                </div>
              </div>
            </div>

            {/* Projects use the global search above */}

            <DataTable
              data={filteredProjects}
              columns={projectColumns}
              loading={false}
              actions={{
                showEdit: false,
                showDelete: false,
                showToggle: false,
              }}
              onRowClick={(project) => handleProjectSelect(project._id)}
              emptyState={{
                icon: <UserGroupIcon className="h-12 w-12 text-white" />,
                title: "No projects found",
                description: "No projects are available to display",
              }}
            />
          </div>
        )}

      {/* Add Team Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div
            className={`bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto transition-all duration-300 ${
              showEmptyState ? "scale-105" : "scale-100"
            }`}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Add Team Member
                </h3>
                <button
                  onClick={() => {
                    setShowAddMember(false);
                    setSearchTerm("");
                    setNewMemberData({
                      projectId: "",
                      selectedUsers: [],
                      role: "developer",
                      allocationPercentage: 0,
                    });
                  }}
                  disabled={isSubmitting}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAddTeamMember();
                }}
                className="space-y-6"
              >
                {(() => {
                  const projectsToCheck =
                    user.role.level >= 1000
                      ? availableProjects
                      : projectData?.projects;
                  return projectsToCheck && projectsToCheck.length > 0;
                })() ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Project
                        </label>
                        <select
                          value={newMemberData.projectId}
                          onChange={(e) => handleProjectChange(e.target.value)}
                          disabled={isSubmitting}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] disabled:opacity-50 disabled:cursor-not-allowed"
                          required
                        >
                          <option value="">Select Project</option>
                          {(() => {
                            const projectsToShow =
                              user.role.level >= 1000
                                ? availableProjects
                                : projectData?.projects;
                            return (
                              projectsToShow?.map((project) => (
                                <option key={project._id} value={project._id}>
                                  {project.name} ({project.code})
                                </option>
                              )) || []
                            );
                          })()}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Role
                        </label>
                        <select
                          value={newMemberData.role}
                          onChange={(e) =>
                            setNewMemberData((prev) => ({
                              ...prev,
                              role: e.target.value,
                            }))
                          }
                          disabled={isSubmitting}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] disabled:opacity-50 disabled:cursor-not-allowed"
                          required
                        >
                          <option value="project_manager">
                            Project Manager
                          </option>
                          <option value="team_lead">Team Lead</option>
                          <option value="developer">Developer</option>
                          <option value="designer">Designer</option>
                          <option value="analyst">Analyst</option>
                          <option value="tester">Tester</option>
                          <option value="consultant">Consultant</option>
                          <option value="support">Support</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>

                    {/* Project Manager Info */}
                    {selectedProjectManager && (
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">
                          Project Manager Information
                        </h4>
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0 h-10 w-10 relative">
                            {getAvatarDisplay(selectedProjectManager)}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {selectedProjectManager.firstName}{" "}
                              {selectedProjectManager.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {selectedProjectManager.email}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Select Team Members
                      </label>
                      <div className="mb-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <p className="text-sm text-blue-800">
                          <strong>Role Restrictions:</strong>{" "}
                          {user.role?.level === 300 &&
                            "You can only select other STAFF from your department"}
                          {user.role?.level === 600 &&
                            "You can only select STAFF from your department"}
                          {user.role?.level === 700 &&
                            user.department?.name === "Project Management" &&
                            "You can select anyone from any department (PM HOD privileges)"}
                          {user.role?.level === 700 &&
                            user.department?.name !== "Project Management" &&
                            "You can select STAFF and MANAGER from your department"}
                          {user.role?.level >= 1000 && "You can select anyone"}
                        </p>
                      </div>

                      {/* Search Input */}
                      <div className="mb-4">
                        <input
                          type="text"
                          placeholder="Search employees by name or email..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
                        />
                      </div>

                      {/* Available Users */}
                      <div className="border border-gray-300 rounded-md max-h-60 overflow-y-auto">
                        {(() => {
                          const filteredUsers = allUsers
                            .filter((potentialMember) => {
                              // Exclude project manager
                              if (
                                selectedProjectManager &&
                                selectedProjectManager._id ===
                                  potentialMember._id
                              ) {
                                return false;
                              }

                              // Apply role restrictions
                              const currentUserRoleLevel =
                                user.role?.level || 0;
                              const potentialMemberRoleLevel =
                                potentialMember.role?.level || 0;

                              if (currentUserRoleLevel >= 1000) {
                                return true;
                              }

                              // PM HOD can select anyone
                              if (
                                currentUserRoleLevel >= 700 &&
                                user.department?.name === "Project Management"
                              ) {
                                return true;
                              }

                              if (currentUserRoleLevel === 300) {
                                return (
                                  potentialMemberRoleLevel === 300 &&
                                  potentialMember.department?._id ===
                                    user.department?._id
                                );
                              }

                              if (currentUserRoleLevel === 600) {
                                return (
                                  potentialMemberRoleLevel === 300 &&
                                  potentialMember.department?._id ===
                                    user.department?._id
                                );
                              }

                              if (currentUserRoleLevel === 700) {
                                return (
                                  (potentialMemberRoleLevel === 300 ||
                                    potentialMemberRoleLevel === 600) &&
                                  potentialMember.department?._id ===
                                    user.department?._id
                                );
                              }

                              return false;
                            })
                            .filter((user) => {
                              // Apply search filter
                              if (!searchTerm) return true;
                              const searchLower = searchTerm.toLowerCase();
                              return (
                                user.firstName
                                  ?.toLowerCase()
                                  .includes(searchLower) ||
                                user.lastName
                                  ?.toLowerCase()
                                  .includes(searchLower) ||
                                user.email?.toLowerCase().includes(searchLower)
                              );
                            });

                          if (filteredUsers.length === 0) {
                            return (
                              <div className="p-4 text-center text-gray-500">
                                {searchTerm
                                  ? "No employees found matching your search."
                                  : "No available employees to select."}
                              </div>
                            );
                          }

                          return filteredUsers.map((potentialMember) => (
                            <div
                              key={potentialMember._id}
                              className={`flex items-center space-x-3 p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                                newMemberData.selectedUsers.includes(
                                  potentialMember._id
                                )
                                  ? "bg-blue-50 border-blue-200"
                                  : ""
                              }`}
                            >
                              <input
                                type="checkbox"
                                id={potentialMember._id}
                                checked={newMemberData.selectedUsers.includes(
                                  potentialMember._id
                                )}
                                onChange={() =>
                                  handleEmployeeToggle(potentialMember._id)
                                }
                                disabled={isSubmitting}
                                className="h-4 w-4 text-[var(--elra-primary)] focus:ring-[var(--elra-primary)] border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                              />
                              <div className="flex-1">
                                <div className="flex items-center space-x-3">
                                  <div className="flex-shrink-0 h-8 w-8 relative">
                                    {getAvatarDisplay(potentialMember)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-gray-900 truncate">
                                      {potentialMember.firstName}{" "}
                                      {potentialMember.lastName}
                                    </div>
                                    <div className="text-sm text-gray-500 truncate">
                                      {potentialMember.email}
                                    </div>
                                  </div>
                                  <div className="flex-shrink-0 text-right">
                                    <div className="text-xs font-medium text-gray-700">
                                      {potentialMember.role?.name}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {potentialMember.department?.name}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ));
                        })()}
                      </div>

                      {/* Selected Users Summary */}
                      {newMemberData.selectedUsers.length > 0 && (
                        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-green-800">
                              Selected: {newMemberData.selectedUsers.length}{" "}
                              employee(s)
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setNewMemberData((prev) => ({
                                  ...prev,
                                  selectedUsers: [],
                                }))
                              }
                              className="text-xs text-green-600 hover:text-green-800 underline"
                            >
                              Clear All
                            </button>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {newMemberData.selectedUsers.map((userId) => {
                              const user = allUsers.find(
                                (u) => u._id === userId
                              );
                              return user ? (
                                <span
                                  key={userId}
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800"
                                >
                                  {user.firstName} {user.lastName}
                                  <button
                                    type="button"
                                    onClick={() => handleEmployeeToggle(userId)}
                                    className="ml-1 text-green-600 hover:text-green-800"
                                  >
                                    ×
                                  </button>
                                </span>
                              ) : null;
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Work Allocation Percentage
                      </label>
                      <div className="mb-2 p-3 bg-green-50 border border-green-200 rounded-md">
                        <p className="text-sm text-green-800">
                          <strong>What is Work Allocation?</strong>
                          <br />
                          This represents how much of the team member's time
                          will be dedicated to this project.
                        </p>
                        <ul className="text-xs text-green-700 mt-2 space-y-1">
                          <li>
                            • <strong>100%</strong> = Full-time on this project
                          </li>
                          <li>
                            • <strong>50%</strong> = Half-time (can work on
                            other projects)
                          </li>
                          <li>
                            • <strong>25%</strong> = Part-time involvement
                          </li>
                          <li>
                            • <strong>0%</strong> = No time allocation
                            (consultant/advisory role)
                          </li>
                        </ul>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={newMemberData.allocationPercentage || ""}
                          onChange={(e) => {
                            const value =
                              e.target.value === ""
                                ? 0
                                : parseInt(e.target.value) || 0;
                            setNewMemberData((prev) => ({
                              ...prev,
                              allocationPercentage: value,
                            }));
                          }}
                          onBlur={(e) => {
                            // Ensure value is set to 0 if empty
                            if (e.target.value === "") {
                              setNewMemberData((prev) => ({
                                ...prev,
                                allocationPercentage: 0,
                              }));
                            }
                          }}
                          disabled={isSubmitting}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] disabled:opacity-50 disabled:cursor-not-allowed"
                          placeholder="0"
                        />
                        {newMemberData.allocationPercentage > 0 && (
                          <button
                            type="button"
                            onClick={() =>
                              setNewMemberData((prev) => ({
                                ...prev,
                                allocationPercentage: 0,
                              }))
                            }
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            disabled={isSubmitting}
                          >
                            <svg
                              className="w-4 h-4"
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
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        <strong>Note:</strong> This helps with resource planning
                        and workload management. Each team member can have their
                        own allocation percentage.
                      </p>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowAddMember(false)}
                        disabled={isSubmitting}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-4 py-2 text-sm font-medium text-white bg-[var(--elra-primary)] rounded-md hover:bg-[var(--elra-primary-dark)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 cursor-pointer"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin cursor-pointer"></div>
                            <span>Adding...</span>
                          </>
                        ) : (
                          "Add Member"
                        )}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <div className="animate-bounce mb-6">
                      <div className="relative">
                        <UserGroupFilled className="h-16 w-16 text-green-500 mx-auto" />
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full animate-ping"></div>
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      All Projects Are Fully Staffed! 🎉
                    </h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto leading-relaxed">
                      Great news! All your projects already have team members
                      assigned.
                      <br />
                      Create a new project first to add more team members.
                    </p>
                    <div className="flex items-center justify-center space-x-2 text-sm text-green-600 bg-green-50 rounded-full px-4 py-2 shadow-sm">
                      <CheckCircleIcon className="h-5 w-5" />
                      <span className="font-medium">
                        All teams are complete
                      </span>
                    </div>

                    <div className="mt-8">
                      <button
                        type="button"
                        onClick={() => setShowAddMember(false)}
                        className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Team Members Modal */}
      <Transition appear show={showTeamModal} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={handleCloseTeamModal}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-white bg-opacity-50 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-2xl transition-all">
                  {/* ELRA Branded Header */}
                  <div className="bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] text-white p-6 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>

                    <div className="relative z-10 flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm border border-white/20">
                          <UserGroupIcon className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <Dialog.Title
                            as="h3"
                            className="text-2xl font-bold text-white"
                          >
                            {selectedProjectTeam?.name} Team
                          </Dialog.Title>
                          <p className="text-white/80 text-sm">
                            {selectedProjectTeam?.code} •{" "}
                            {selectedProjectTeam?.teamMemberCount || 0} team
                            members
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleCloseTeamModal}
                        className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-all duration-200"
                      >
                        <XMarkIcon className="h-6 w-6" />
                      </button>
                    </div>
                  </div>

                  {/* Team Members Content */}
                  <div className="p-6 max-h-[70vh] overflow-y-auto">
                    {selectedProjectTeam && (
                      <div className="space-y-6">
                        {/* Project Info */}
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <h4 className="text-lg font-semibold text-gray-800 mb-3">
                            Project Information
                          </h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium text-gray-600">
                                Project Manager
                              </label>
                              <p className="text-gray-900 font-semibold">
                                {selectedProjectTeam.projectManager?.firstName}{" "}
                                {selectedProjectTeam.projectManager?.lastName}
                              </p>
                              <p className="text-sm text-gray-500">
                                {selectedProjectTeam.projectManager?.email}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-600">
                                Status
                              </label>
                              <span
                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  selectedProjectTeam.status ===
                                    "implementation" ||
                                  selectedProjectTeam.status === "in_progress"
                                    ? "bg-green-100 text-green-800"
                                    : selectedProjectTeam.status === "completed"
                                    ? "bg-blue-100 text-blue-800"
                                    : selectedProjectTeam.status.includes(
                                        "pending"
                                      )
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {selectedProjectTeam.status
                                  ?.split("_")
                                  .map(
                                    (word) =>
                                      word.charAt(0).toUpperCase() +
                                      word.slice(1)
                                  )
                                  .join(" ")}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Team Members List */}
                        <div>
                          {/* Search Input */}
                          <div className="mb-4">
                            <div className="relative">
                              <input
                                type="text"
                                placeholder="Search team members by name, email, department, or role..."
                                value={teamMemberSearchTerm}
                                onChange={(e) =>
                                  setTeamMemberSearchTerm(e.target.value)
                                }
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
                              />
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg
                                  className="h-4 w-4 text-gray-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                  />
                                </svg>
                              </div>
                              {teamMemberSearchTerm && (
                                <button
                                  onClick={() => setTeamMemberSearchTerm("")}
                                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                >
                                  <svg
                                    className="h-4 w-4 text-gray-400 hover:text-gray-600"
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
                              )}
                            </div>
                          </div>
                          {(() => {
                            console.log(
                              "🔍 Debug - selectedProjectTeam:",
                              selectedProjectTeam
                            );
                            console.log(
                              "🔍 Debug - projectTeamMembers:",
                              projectTeamMembers
                            );

                            if (loadingTeamMembers) {
                              return (
                                <div className="text-center py-12">
                                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--elra-primary)] mx-auto mb-4"></div>
                                  <p className="text-gray-500">
                                    Loading team members...
                                  </p>
                                </div>
                              );
                            }

                            if (filteredTeamMembers.length === 0) {
                              return (
                                <div className="text-center py-12">
                                  <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    {teamMemberSearchTerm
                                      ? "No Matching Team Members"
                                      : "No Team Members Found"}
                                  </h3>
                                  <p className="text-gray-500 mb-4">
                                    {teamMemberSearchTerm
                                      ? `No team members match "${teamMemberSearchTerm}". Try adjusting your search terms.`
                                      : "This project doesn't have any team members assigned yet."}
                                  </p>
                                  {teamMemberSearchTerm && (
                                    <button
                                      onClick={() =>
                                        setTeamMemberSearchTerm("")
                                      }
                                      className="mt-2 px-4 py-2 text-sm text-[var(--elra-primary)] hover:text-[var(--elra-primary-dark)] transition-colors"
                                    >
                                      Clear Search
                                    </button>
                                  )}
                                  <div className="text-xs text-gray-400 bg-gray-50 p-3 rounded">
                                    <p>Debug Info:</p>
                                    <p>
                                      Fetched team members:{" "}
                                      {projectTeamMembers.length}
                                    </p>
                                    <p>
                                      Selected project ID:{" "}
                                      {selectedProjectTeam._id}
                                    </p>
                                  </div>
                                </div>
                              );
                            }

                            return (
                              <div className="grid gap-4">
                                {filteredTeamMembers.map((member) => (
                                  <div
                                    key={member._id}
                                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-4">
                                        <div className="flex-shrink-0">
                                          {getAvatarDisplay(member.user)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center space-x-2">
                                            <h5 className="text-sm font-medium text-gray-900 truncate">
                                              {member.user?.firstName}{" "}
                                              {member.user?.lastName}
                                            </h5>
                                            <span
                                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                member.status === "active"
                                                  ? "bg-green-100 text-green-800"
                                                  : member.status === "inactive"
                                                  ? "bg-yellow-100 text-yellow-800"
                                                  : "bg-red-100 text-red-800"
                                              }`}
                                            >
                                              {member.status}
                                            </span>
                                          </div>
                                          <p className="text-sm text-gray-500 truncate">
                                            {member.user?.email}
                                          </p>
                                          <p className="text-xs text-gray-400">
                                            {member.department?.name} •{" "}
                                            {member.role?.name}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex items-center space-x-3">
                                        <div className="text-right">
                                          <div className="text-sm font-medium text-gray-900">
                                            {getRoleDisplayName(member.role)}
                                          </div>
                                          <div className="text-xs text-gray-500">
                                            {member.allocationPercentage || 0}%
                                            allocation
                                          </div>
                                        </div>
                                        {user.role.level >= 600 && (
                                          <button
                                            onClick={() =>
                                              handleRemoveTeamMember(member)
                                            }
                                            disabled={
                                              deletingMemberId === member._id
                                            }
                                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                          >
                                            {deletingMemberId === member._id ? (
                                              <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                                            ) : (
                                              <TrashIcon className="h-4 w-4" />
                                            )}
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Modal Footer */}
                  <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
                    <button
                      onClick={handleCloseTeamModal}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Close
                    </button>
                    {user.role.level >= 600 && (
                      <button
                        onClick={() => {
                          handleCloseTeamModal();
                          setShowAddMember(true);
                          handleProjectChange(selectedProjectTeam._id);
                        }}
                        className="px-4 py-2 text-sm font-medium text-white bg-[var(--elra-primary)] rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors"
                      >
                        <PlusIcon className="h-4 w-4 inline mr-1" />
                        Add Member
                      </button>
                    )}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Delete Team Member Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && memberToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-[9999] p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
            >
              <div className="bg-red-600 p-6 rounded-t-2xl">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white rounded-lg">
                    <TrashIcon className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      Remove Team Member
                    </h3>
                    <p className="text-white/80 text-sm">
                      This action will notify the team member
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex-shrink-0">
                    {getAvatarDisplay(memberToDelete.user)}
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">
                      {memberToDelete.user?.firstName}{" "}
                      {memberToDelete.user?.lastName}
                    </h4>
                    <p className="text-xs text-gray-400">
                      {getRoleDisplayName(memberToDelete.role)}
                    </p>
                  </div>
                </div>

                <p className="text-gray-700 mb-4">
                  Are you sure you want to remove this team member from the
                  project? They will be notified about this change and can focus
                  on other important tasks.
                </p>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start space-x-3">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-medium text-red-800">
                        Important Notice
                      </h4>
                      <p className="text-sm text-red-700 mt-1">
                        This action will send a positive notification to the
                        team member and cannot be undone. The team member will
                        be marked as inactive but their contribution history
                        will be preserved.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={handleCancelDelete}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    disabled={deletingMemberId === memberToDelete._id}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmRemoveTeamMember}
                    disabled={deletingMemberId === memberToDelete._id}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    {deletingMemberId === memberToDelete._id ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Removing...</span>
                      </>
                    ) : (
                      <>
                        <TrashIcon className="w-4 h-4" />
                        <span>Remove Member</span>
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
  );
};

export default ProjectTeams;
