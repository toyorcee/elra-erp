import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
  headers: {
    Accept: "application/json",
  },
});

export const userModulesAPI = {
  // Fetch available modules for the current user
  getUserModules: async () => {
    try {
      console.log("🔍 Fetching user modules...");
      const response = await api.get("/auth/user-modules");
      console.log("✅ User modules fetched successfully:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Error fetching user modules:", error);
      throw error;
    }
  },

  // Transform backend modules to frontend format
  transformModules: (backendModules) => {
    const iconMap = {
      CurrencyDollarIcon: "FaMoneyCheckAlt",
      ShoppingCartIcon: "FaShoppingCart",
      ChatBubbleLeftRightIcon: "FaComments",
      DocumentIcon: "FaFileAlt",
      ClipboardDocumentListIcon: "FaClipboardList",
      CubeIcon: "FaBoxes",
      UsersIcon: "FaUsers",
      ChartBarIcon: "FaChartBar",
    };

    const colorMap = {
      "#10B981": "from-green-500 to-green-600",
      "#F59E0B": "from-amber-500 to-amber-600",
      "#3B82F6": "from-blue-500 to-blue-600",
      "#8B5CF6": "from-purple-500 to-purple-600",
      "#EC4899": "from-pink-500 to-pink-600",
      "#06B6D4": "from-cyan-500 to-cyan-600",
    };

    const bgColorMap = {
      "#10B981": "bg-green-50",
      "#F59E0B": "bg-amber-50",
      "#3B82F6": "bg-blue-50",
      "#8B5CF6": "bg-purple-50",
      "#EC4899": "bg-pink-50",
      "#06B6D4": "bg-cyan-50",
    };

    const borderColorMap = {
      "#10B981": "border-green-200",
      "#F59E0B": "border-amber-200",
      "#3B82F6": "border-blue-200",
      "#8B5CF6": "border-purple-200",
      "#EC4899": "border-pink-200",
      "#06B6D4": "border-cyan-200",
    };

    return backendModules.map((module) => ({
      id: module._id,
      title: module.name,
      description: module.description,
      icon: iconMap[module.icon] || "FaCog",
      path: `/${module.code.toLowerCase()}/dashboard`,
      isReady: true,
      color: colorMap[module.color] || "from-gray-500 to-gray-600",
      bgColor: bgColorMap[module.color] || "bg-gray-50",
      borderColor: borderColorMap[module.color] || "border-gray-200",
      permissions: module.permissions || [],
      code: module.code,
      order: module.order,
    }));
  },
};
