import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { canViewUsers } from "../../constants/userRoles";
import {
  MdPeople,
  MdDescription,
  MdSecurity,
  MdTrendingUp,
  MdSpeed,
  MdWork,
  MdStar,
  MdFolder,
  MdEmail,
  MdPhone,
  MdLocationOn,
  MdWorkOutline,
  MdSchedule,
  MdSearch,
  MdFilterList,
  MdRefresh,
  MdAdd,
  MdMoreVert,
  MdEdit,
  MdDelete,
  MdVisibility,
  MdChat,
  MdNotifications,
  MdError,
} from "react-icons/md";

const DepartmentStaff = () => {
  const { user } = useAuth();

  // Permission check
  const hasViewUsersPermission = canViewUsers(user);

  // Redirect if user doesn't have view users permission
  if (!hasViewUsersPermission) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-8 border border-white/20 shadow-xl text-center">
          <MdError className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-4">
            You don't have permission to view department staff.
          </p>
          <p className="text-sm text-gray-500">
            Contact your administrator to request staff access.
          </p>
        </div>
      </div>
    );
  }

  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState(null);

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Department-specific configuration
  const departmentConfig = {
    CLAIMS: {
      name: "Claims Department",
      icon: MdDescription,
      color: "from-blue-500 to-cyan-500",
      bgGradient: "from-blue-50 to-cyan-50",
      staff: [
        {
          id: 1,
          firstName: "Sarah",
          lastName: "Johnson",
          email: "sarah.johnson@company.com",
          phone: "+1 (555) 123-4567",
          role: "Claims Manager",
          status: "active",
          department: "Claims",
          location: "New York",
          avatar: "SJ",
          joinDate: "2022-03-15",
          lastActive: "2024-01-10",
          avatarColor: "from-blue-500 to-cyan-500",
        },
        {
          id: 2,
          firstName: "Michael",
          lastName: "Chen",
          email: "michael.chen@company.com",
          phone: "+1 (555) 234-5678",
          role: "Claims Adjuster",
          status: "active",
          department: "Claims",
          location: "Los Angeles",
          avatar: "MC",
          joinDate: "2023-01-20",
          lastActive: "2024-01-09",
          avatarColor: "from-blue-600 to-cyan-600",
        },
        {
          id: 3,
          firstName: "Emily",
          lastName: "Davis",
          email: "emily.davis@company.com",
          phone: "+1 (555) 345-6789",
          role: "Claims Processor",
          status: "active",
          department: "Claims",
          location: "Chicago",
          avatar: "ED",
          joinDate: "2023-06-10",
          lastActive: "2024-01-08",
          avatarColor: "from-blue-400 to-cyan-400",
        },
      ],
    },
    UNDERWRITE: {
      name: "Underwriting Department",
      icon: MdSecurity,
      color: "from-purple-500 to-pink-500",
      bgGradient: "from-purple-50 to-pink-50",
      staff: [
        {
          id: 1,
          firstName: "David",
          lastName: "Wilson",
          email: "david.wilson@company.com",
          phone: "+1 (555) 456-7890",
          role: "Underwriting Manager",
          status: "active",
          department: "Underwriting",
          location: "Boston",
          avatar: "DW",
          joinDate: "2021-08-12",
          lastActive: "2024-01-10",
          avatarColor: "from-purple-500 to-pink-500",
        },
        {
          id: 2,
          firstName: "Lisa",
          lastName: "Brown",
          email: "lisa.brown@company.com",
          phone: "+1 (555) 567-8901",
          role: "Risk Analyst",
          status: "active",
          department: "Underwriting",
          location: "San Francisco",
          avatar: "LB",
          joinDate: "2022-11-05",
          lastActive: "2024-01-09",
          avatarColor: "from-purple-600 to-pink-600",
        },
      ],
    },
    FINANCE: {
      name: "Finance Department",
      icon: MdTrendingUp,
      color: "from-green-500 to-emerald-500",
      bgGradient: "from-green-50 to-emerald-50",
      staff: [
        {
          id: 1,
          firstName: "Robert",
          lastName: "Taylor",
          email: "robert.taylor@company.com",
          phone: "+1 (555) 678-9012",
          role: "Finance Director",
          status: "active",
          department: "Finance",
          location: "New York",
          avatar: "RT",
          joinDate: "2020-05-20",
          lastActive: "2024-01-10",
          avatarColor: "from-green-500 to-emerald-500",
        },
        {
          id: 2,
          firstName: "Jennifer",
          lastName: "Garcia",
          email: "jennifer.garcia@company.com",
          phone: "+1 (555) 789-0123",
          role: "Financial Analyst",
          status: "active",
          department: "Finance",
          location: "Miami",
          avatar: "JG",
          joinDate: "2023-02-15",
          lastActive: "2024-01-09",
          avatarColor: "from-green-600 to-emerald-600",
        },
      ],
    },
    COMPLIANCE: {
      name: "Compliance Department",
      icon: MdSecurity,
      color: "from-red-500 to-orange-500",
      bgGradient: "from-red-50 to-orange-50",
      staff: [
        {
          id: 1,
          firstName: "Thomas",
          lastName: "Anderson",
          email: "thomas.anderson@company.com",
          phone: "+1 (555) 890-1234",
          role: "Compliance Officer",
          status: "active",
          department: "Compliance",
          location: "Washington DC",
          avatar: "TA",
          joinDate: "2021-12-01",
          lastActive: "2024-01-10",
          avatarColor: "from-red-500 to-orange-500",
        },
      ],
    },
    HR: {
      name: "HR Department",
      icon: MdPeople,
      color: "from-indigo-500 to-purple-500",
      bgGradient: "from-indigo-50 to-purple-50",
      staff: [
        {
          id: 1,
          firstName: "Amanda",
          lastName: "Martinez",
          email: "amanda.martinez@company.com",
          phone: "+1 (555) 901-2345",
          role: "HR Manager",
          status: "active",
          department: "HR",
          location: "New York",
          avatar: "AM",
          joinDate: "2022-01-10",
          lastActive: "2024-01-10",
          avatarColor: "from-indigo-500 to-purple-500",
        },
        {
          id: 2,
          firstName: "Kevin",
          lastName: "Lee",
          email: "kevin.lee@company.com",
          phone: "+1 (555) 012-3456",
          role: "HR Specialist",
          status: "active",
          department: "HR",
          location: "Seattle",
          avatar: "KL",
          joinDate: "2023-04-22",
          lastActive: "2024-01-09",
          avatarColor: "from-indigo-600 to-purple-600",
        },
      ],
    },
    IT: {
      name: "IT Department",
      icon: MdSpeed,
      color: "from-cyan-500 to-blue-500",
      bgGradient: "from-cyan-50 to-blue-50",
      staff: [
        {
          id: 1,
          firstName: "Alex",
          lastName: "Thompson",
          email: "alex.thompson@company.com",
          phone: "+1 (555) 123-7890",
          role: "IT Manager",
          status: "active",
          department: "IT",
          location: "Austin",
          avatar: "AT",
          joinDate: "2021-06-15",
          lastActive: "2024-01-10",
          avatarColor: "from-cyan-500 to-blue-500",
        },
        {
          id: 2,
          firstName: "Rachel",
          lastName: "White",
          email: "rachel.white@company.com",
          phone: "+1 (555) 234-8901",
          role: "System Administrator",
          status: "active",
          department: "IT",
          location: "Denver",
          avatar: "RW",
          joinDate: "2022-09-08",
          lastActive: "2024-01-09",
          avatarColor: "from-cyan-600 to-blue-600",
        },
        {
          id: 3,
          firstName: "Daniel",
          lastName: "Rodriguez",
          email: "daniel.rodriguez@company.com",
          phone: "+1 (555) 345-9012",
          role: "Software Developer",
          status: "active",
          department: "IT",
          location: "Portland",
          avatar: "DR",
          joinDate: "2023-03-12",
          lastActive: "2024-01-08",
          avatarColor: "from-cyan-400 to-blue-400",
        },
      ],
    },
    REGIONAL: {
      name: "Regional Operations",
      icon: MdWork,
      color: "from-amber-500 to-orange-500",
      bgGradient: "from-amber-50 to-orange-50",
      staff: [
        {
          id: 1,
          firstName: "Maria",
          lastName: "Gonzalez",
          email: "maria.gonzalez@company.com",
          phone: "+1 (555) 456-0123",
          role: "Regional Manager",
          status: "active",
          department: "Regional",
          location: "Houston",
          avatar: "MG",
          joinDate: "2021-03-25",
          lastActive: "2024-01-10",
          avatarColor: "from-amber-500 to-orange-500",
        },
      ],
    },
    EXECUTIVE: {
      name: "Executive Management",
      icon: MdStar,
      color: "from-gray-600 to-gray-800",
      bgGradient: "from-gray-50 to-gray-100",
      staff: [
        {
          id: 1,
          firstName: "James",
          lastName: "Miller",
          email: "james.miller@company.com",
          phone: "+1 (555) 567-1234",
          role: "CEO",
          status: "active",
          department: "Executive",
          location: "New York",
          avatar: "JM",
          joinDate: "2019-01-01",
          lastActive: "2024-01-10",
          avatarColor: "from-gray-600 to-gray-800",
        },
        {
          id: 2,
          firstName: "Patricia",
          lastName: "Clark",
          email: "patricia.clark@company.com",
          phone: "+1 (555) 678-2345",
          role: "CFO",
          status: "active",
          department: "Executive",
          location: "New York",
          avatar: "PC",
          joinDate: "2020-02-15",
          lastActive: "2024-01-09",
          avatarColor: "from-gray-700 to-gray-900",
        },
      ],
    },
  };

  const currentDept = departmentConfig[user?.department?.code] || {
    name: "Department Staff",
    icon: MdPeople,
    color: "from-gray-500 to-gray-700",
    bgGradient: "from-gray-50 to-gray-100",
    staff: [],
  };

  const DeptIcon = currentDept.icon;
  const staff = currentDept.staff;

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "text-green-600 bg-green-100/80 border-green-200";
      case "inactive":
        return "text-red-600 bg-red-100/80 border-red-200";
      case "on-leave":
        return "text-yellow-600 bg-yellow-100/80 border-yellow-200";
      default:
        return "text-gray-600 bg-gray-100/80 border-gray-200";
    }
  };

  const filteredStaff = staff.filter((member) => {
    const matchesSearch =
      member.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.role.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = selectedRole === "all" || member.role === selectedRole;
    const matchesStatus =
      selectedStatus === "all" || member.status === selectedStatus;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const uniqueRoles = [...new Set(staff.map((member) => member.role))];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: "easeOut",
      },
    },
    hover: {
      y: -5,
      scale: 1.02,
      transition: {
        duration: 0.2,
        ease: "easeOut",
      },
    },
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading department staff...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 overflow-x-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-green-400/10 to-emerald-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative bg-white/80 backdrop-blur-xl border-b border-white/20 sticky top-0 z-20 shadow-lg"
      >
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <motion.div
                whileHover={{ rotate: 5, scale: 1.05 }}
                className={`p-4 rounded-2xl bg-gradient-to-r ${currentDept.color} text-white shadow-xl`}
              >
                <DeptIcon size={32} />
              </motion.div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  {currentDept.name} Staff
                </h1>
                <p className="text-gray-600 mt-2 text-lg">
                  Manage and view department team members
                </p>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 flex items-center gap-3 shadow-lg hover:shadow-xl"
            >
              <MdAdd size={24} />
              <span className="font-semibold">Add Staff Member</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      <div className="relative max-w-7xl mx-auto px-6 py-8">
        {/* Statistics Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <motion.div
            variants={cardVariants}
            whileHover="hover"
            className="group bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">
                  Total Staff
                </p>
                <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  {staff.length}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white group-hover:scale-110 transition-transform duration-300">
                <MdPeople size={28} />
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={cardVariants}
            whileHover="hover"
            className="group bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">
                  Active Staff
                </p>
                <p className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  {staff.filter((member) => member.status === "active").length}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white group-hover:scale-110 transition-transform duration-300">
                <MdWorkOutline size={28} />
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={cardVariants}
            whileHover="hover"
            className="group bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Roles</p>
                <p className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {uniqueRoles.length}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white group-hover:scale-110 transition-transform duration-300">
                <MdSecurity size={28} />
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={cardVariants}
            whileHover="hover"
            className="group bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">
                  Locations
                </p>
                <p className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  {[...new Set(staff.map((member) => member.location))].length}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white group-hover:scale-110 transition-transform duration-300">
                <MdLocationOn size={28} />
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/30 shadow-xl mb-8"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MdSearch
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search staff members..."
                  className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm text-gray-700 placeholder-gray-400"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="px-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm text-gray-700"
              >
                <option value="all">All Roles</option>
                {uniqueRoles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm text-gray-700"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="on-leave">On Leave</option>
              </select>

              <motion.button
                whileHover={{ rotate: 180 }}
                whileTap={{ scale: 0.9 }}
                className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors bg-white/50 backdrop-blur-sm"
              >
                <MdRefresh size={20} />
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Staff Grid */}
        <AnimatePresence mode="wait">
          {filteredStaff.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white/80 backdrop-blur-xl rounded-2xl p-16 border border-white/30 shadow-xl text-center"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-gray-400 text-8xl mb-6"
              >
                👥
              </motion.div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                No Staff Members Found
              </h3>
              <p className="text-gray-600 mb-8 text-lg">
                {selectedRole !== "all" ||
                selectedStatus !== "all" ||
                searchTerm
                  ? "Try adjusting your filters or search terms."
                  : "No staff members are currently assigned to this department."}
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 font-semibold shadow-lg"
              >
                Add Staff Member
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="staff-grid"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredStaff.map((member, index) => (
                <motion.div
                  key={member.id}
                  variants={cardVariants}
                  whileHover="hover"
                  className="group bg-white/80 backdrop-blur-xl rounded-2xl border border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden"
                >
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <motion.div
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          className={`w-14 h-14 rounded-full bg-gradient-to-r ${member.avatarColor} flex items-center justify-center text-white font-bold text-lg shadow-lg`}
                        >
                          {member.avatar}
                        </motion.div>
                        <div>
                          <h3 className="font-bold text-gray-900 text-lg">
                            {member.firstName} {member.lastName}
                          </h3>
                          <p className="text-gray-600 font-medium">
                            {member.role}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                            member.status
                          )}`}
                        >
                          {member.status}
                        </span>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <MdMoreVert size={18} />
                        </motion.button>
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <MdEmail size={18} className="text-blue-500" />
                        <span className="truncate">{member.email}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <MdPhone size={18} className="text-green-500" />
                        <span>{member.phone}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <MdLocationOn size={18} className="text-purple-500" />
                        <span>{member.location}</span>
                      </div>
                    </div>

                    {/* Additional Info */}
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <MdSchedule size={18} className="text-orange-500" />
                        <span>
                          Joined:{" "}
                          {new Date(member.joinDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <MdWorkOutline size={18} className="text-indigo-500" />
                        <span>
                          Last Active:{" "}
                          {new Date(member.lastActive).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200/50">
                      <div className="flex gap-2">
                        <motion.button
                          whileHover={{ scale: 1.1, y: -2 }}
                          whileTap={{ scale: 0.9 }}
                          className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-300"
                        >
                          <MdEmail size={18} />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1, y: -2 }}
                          whileTap={{ scale: 0.9 }}
                          className="p-3 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all duration-300"
                        >
                          <MdPhone size={18} />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1, y: -2 }}
                          whileTap={{ scale: 0.9 }}
                          className="p-3 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all duration-300"
                        >
                          <MdChat size={18} />
                        </motion.button>
                      </div>
                      <div className="flex gap-2">
                        <motion.button
                          whileHover={{ scale: 1.1, y: -2 }}
                          whileTap={{ scale: 0.9 }}
                          className="p-3 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all duration-300"
                        >
                          <MdEdit size={18} />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1, y: -2 }}
                          whileTap={{ scale: 0.9 }}
                          className="p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-300"
                        >
                          <MdDelete size={18} />
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DepartmentStaff;
