import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  XMarkIcon,
  UserGroupIcon,
  PlusIcon,
  FolderIcon,
  CheckCircleIcon,
  UserGroupIcon as UserGroupSolid,
} from "@heroicons/react/24/outline";
import { UserGroupIcon as UserGroupFilled } from "@heroicons/react/24/solid";
import {
  fetchComprehensiveProjectData,
  fetchProjectsAvailableForTeams,
  fetchAllTeamMembers,
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

  // Add custom CSS for animations
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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const usersResponse = await getUsers();
      setAllUsers(usersResponse.data || []);

      if (user.role.level >= 1000) {
        // SUPER_ADMIN - use comprehensive endpoints
        const comprehensiveData = await fetchComprehensiveProjectData();
        const availableProjectsData = await fetchProjectsAvailableForTeams();

        setProjectData(comprehensiveData.data);
        setAvailableProjects(availableProjectsData.data || []);
        setTeamMembers(comprehensiveData.data.teamMembers || []);
      } else {
        // HOD and other roles - use regular endpoints with role-based filtering
        const projectsData = await fetchProjects();
        const teamData = await fetchAllTeamMembers();

        // Transform the data to match the expected format
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

        // For HODs, calculate available projects (projects without team members)
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
      console.log("🔍 [ProjectTeams] Project selected:", projectId);
      console.log("🔍 [ProjectTeams] Current team members:", teamMembers);
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

      // Reset form and reload data
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

  const handleRemoveTeamMember = async (teamMemberId) => {
    try {
      setDeletingMemberId(teamMemberId);
      await removeTeamMemberNew(teamMemberId);
      toast.success("Team member removed successfully");
      loadData();
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

  // Avatar handling functions
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
      renderer: (project) => (
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            project.status === "active"
              ? "bg-green-100 text-green-800"
              : project.status === "completed"
              ? "bg-blue-100 text-blue-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {project.status}
        </span>
      ),
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
    <div className="w-full max-w-7xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Project Teams Management
        </h1>
        <p className="text-gray-600">
          {user.role.level >= 1000
            ? "Manage all project teams across the organization"
            : "View and manage your project teams"}
        </p>
      </div>

      {/* Statistics Cards (SUPER_ADMIN) */}
      {user.role.level >= 1000 && projectData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Total Projects
            </h3>
            <p className="text-3xl font-bold text-blue-600">
              {projectData.statistics?.totalProjects || 0}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Active Projects
            </h3>
            <p className="text-3xl font-bold text-green-600">
              {projectData.statistics?.activeProjects || 0}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Completed Projects
            </h3>
            <p className="text-3xl font-bold text-purple-600">
              {projectData.statistics?.completedProjects || 0}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Total Team Members
            </h3>
            <p className="text-3xl font-bold text-orange-600">
              {projectData.statistics?.totalTeamMembers || 0}
            </p>
          </div>
        </div>
      )}

      {/* Projects List (SUPER_ADMIN) */}
      {user.role.level >= 1000 && projectData && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              All Projects
            </h2>
          </div>
          <DataTable
            data={projectData.projects || []}
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

      {/* Team Members List */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {selectedProject ? "Project Team Members" : "All Team Members"}
          </h2>
          {user.role.level >= 600 && (
            <button
              onClick={() => {
                setShowAddMember(true);
                // Check if there are available projects based on user role
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

        <DataTable
          data={teamMembers.filter((member) => {
            if (!selectedProject) return true;
            const memberProjectId =
              typeof member.project === "object"
                ? member.project._id
                : member.project;
            return memberProjectId === selectedProject;
          })}
          columns={teamMemberColumns}
          loading={false}
          actions={{
            showEdit: false,
            showDelete: user.role.level >= 600,
            showToggle: false,
            onDelete: handleRemoveTeamMember,
          }}
          deletingIds={deletingMemberId ? [deletingMemberId] : []}
          emptyState={{
            icon: <UserGroupIcon className="h-12 w-12 text-white" />,
            title: "No team members found",
            description: selectedProject
              ? "No team members assigned to this project yet"
              : "No team members found in the system",
            actionButton:
              user.role.level >= 600 ? (
                <button
                  onClick={() => setShowAddMember(true)}
                  className="px-4 py-2 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors"
                >
                  Add Team Member
                </button>
              ) : null,
          }}
        />
      </div>

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
    </div>
  );
};

export default ProjectTeams;
