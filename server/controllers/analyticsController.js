import Project from "../models/Project.js";
import LeaveRequest from "../models/LeaveRequest.js";
import User from "../models/User.js";
import Payroll from "../models/Payroll.js";
import mongoose from "mongoose";

// Get department analytics for HODs (level 700+)
// HODs can only see data for their own department:
// - Projects: personal projects from their department (users create personal, HODs create departmental)
// - Payroll: department-scoped payrolls for users in their department
// - Leaves: leave requests from users in their department
export const getDepartmentAnalytics = async (req, res) => {
  try {
    const { departmentId } = req.params;
    const { period = "current" } = req.query;

    console.log(
      `📊 [ANALYTICS] Fetching analytics for department: ${departmentId}, period: ${period}`
    );

    // Validate department ID
    if (!mongoose.Types.ObjectId.isValid(departmentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid department ID",
      });
    }

    // Calculate date range based on period
    const now = new Date();
    let startDate, endDate;

    switch (period) {
      case "monthly":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case "quarterly":
        const quarterStart = Math.floor(now.getMonth() / 3) * 3;
        startDate = new Date(now.getFullYear(), quarterStart, 1);
        endDate = new Date(now.getFullYear(), quarterStart + 3, 0);
        break;
      case "yearly":
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      case "one_time":
        // For one-time analysis, show last 6 months
        startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        endDate = now;
        break;
      default: // current
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = now;
        break;
    }

    console.log(
      `📅 [ANALYTICS] Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`
    );

    // Get department team size
    const teamSize = await User.countDocuments({
      department: departmentId,
      isActive: true,
    });

    // Get project analytics
    const projectAnalytics = await getProjectAnalytics(
      departmentId,
      startDate,
      endDate
    );

    // Get leave analytics
    const leaveAnalytics = await getLeaveAnalytics(
      departmentId,
      startDate,
      endDate
    );

    // Get payroll analytics
    const payrollAnalytics = await getPayrollAnalytics(
      departmentId,
      startDate,
      endDate
    );

    // Get monthly trends
    const monthlyTrends = await getMonthlyTrends(departmentId, period);

    // Calculate trends by comparing with previous period
    const trends = await calculateTrends(departmentId, period, {
      teamSize,
      activeProjects: projectAnalytics.activeProjects,
      completedProjects: projectAnalytics.completedProjects,
      pendingApprovals: projectAnalytics.pendingApprovals,
    });

    // Calculate success rate
    const totalProjects =
      projectAnalytics.activeProjects + projectAnalytics.completedProjects;
    const projectSuccessRate =
      totalProjects > 0
        ? ((projectAnalytics.completedProjects / totalProjects) * 100).toFixed(
            1
          )
        : 0;

    // Calculate budget utilization
    const budgetUtilization =
      projectAnalytics.totalBudget > 0
        ? (
            (projectAnalytics.actualCost / projectAnalytics.totalBudget) *
            100
          ).toFixed(1)
        : 0;

    // Calculate team productivity (based on completed projects per team member)
    const teamProductivity =
      teamSize > 0
        ? ((projectAnalytics.completedProjects / teamSize) * 100).toFixed(1)
        : 0;

    const analytics = {
      // Basic metrics
      teamSize,
      activeProjects: projectAnalytics.activeProjects,
      completedProjects: projectAnalytics.completedProjects,
      pendingApprovals: projectAnalytics.pendingApprovals,
      leaveRequests: leaveAnalytics.totalRequests,
      budgetUtilization: parseFloat(budgetUtilization),
      projectSuccessRate: parseFloat(projectSuccessRate),
      teamProductivity: parseFloat(teamProductivity),

      // Detailed analytics
      projectStatus: projectAnalytics.statusDistribution,
      leaveDistribution: leaveAnalytics.typeDistribution,
      monthlyTrends,
      payrollAnalytics,
      budgetAllocationBreakdown: projectAnalytics.budgetAllocationBreakdown,
      trends,

      // Additional insights
      insights: {
        averageProjectDuration: projectAnalytics.averageDuration,
        mostActiveMonth:
          monthlyTrends.length > 0
            ? monthlyTrends.reduce((max, month) =>
                month.projects > max.projects ? month : max
              )
            : null,
        topLeaveType:
          leaveAnalytics.typeDistribution.length > 0
            ? leaveAnalytics.typeDistribution.reduce((max, type) =>
                type.count > max.count ? type : max
              )
            : null,
      },
    };

    console.log(
      `✅ [ANALYTICS] Successfully generated analytics for department ${departmentId}`
    );

    res.json({
      success: true,
      data: analytics,
      period,
      dateRange: { startDate, endDate },
    });
  } catch (error) {
    console.error("❌ [ANALYTICS] Error fetching department analytics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch department analytics",
      error: error.message,
    });
  }
};

// Get project analytics for a department
const getProjectAnalytics = async (departmentId, startDate, endDate) => {
  try {
    // For HODs: Only get personal projects from their department
    // (Users create personal projects, HODs create departmental projects)
    const projects = await Project.find({
      department: departmentId,
      projectScope: "personal",
      // Temporarily remove date filtering to show all projects for testing
      // createdAt: { $gte: startDate, $lte: endDate },
    }).populate("department", "name");

    // Count projects by status and budget allocation
    const statusCounts = {};
    const budgetAllocationCounts = { withAllocation: 0, withoutAllocation: 0 };
    let totalBudget = 0;
    let actualCost = 0;
    let totalDuration = 0;
    let completedCount = 0;

    projects.forEach((project) => {
      // Count by status
      const status = project.status;
      statusCounts[status] = (statusCounts[status] || 0) + 1;

      // Count by budget allocation requirement
      if (project.requiresBudgetAllocation === true) {
        budgetAllocationCounts.withAllocation++;
      } else {
        budgetAllocationCounts.withoutAllocation++;
      }

      // Sum budgets
      totalBudget += project.budget || 0;

      // Only count actual cost for completed projects
      if (project.status === "completed") {
        actualCost += project.actualCost || 0;
      }

      // Calculate duration for completed projects
      if (
        project.status === "completed" &&
        project.actualStartDate &&
        project.actualEndDate
      ) {
        const duration =
          (project.actualEndDate - project.actualStartDate) /
          (1000 * 60 * 60 * 24); // days
        totalDuration += duration;
        completedCount++;
      }
    });

    // Map status counts to our analytics format
    const statusDistribution = [
      {
        status: "Planning",
        count: statusCounts.planning || 0,
        color: "bg-blue-500",
      },
      {
        status: "In Progress",
        count: (statusCounts.in_progress || 0) + (statusCounts.active || 0),
        color: "bg-yellow-500",
      },
      {
        status: "Implementation",
        count:
          (statusCounts.implementation || 0) +
          (statusCounts.pending_procurement || 0),
        color: "bg-orange-500",
      },
      {
        status: "Review",
        count:
          (statusCounts.pending_approval || 0) +
          (statusCounts.pending_project_management_approval || 0) +
          (statusCounts.pending_department_approval || 0) +
          (statusCounts.pending_legal_compliance_approval || 0) +
          (statusCounts.pending_finance_approval || 0) +
          (statusCounts.pending_executive_approval || 0),
        color: "bg-purple-500",
      },
      {
        status: "Completed",
        count: statusCounts.completed || 0,
        color: "bg-green-500",
      },
    ];

    // Calculate pending approvals
    const pendingApprovals =
      (statusCounts.pending_approval || 0) +
      (statusCounts.pending_department_approval || 0) +
      (statusCounts.pending_project_management_approval || 0) +
      (statusCounts.pending_legal_compliance_approval || 0) +
      (statusCounts.pending_finance_approval || 0) +
      (statusCounts.pending_executive_approval || 0);

    return {
      activeProjects:
        (statusCounts.in_progress || 0) +
        (statusCounts.implementation || 0) +
        (statusCounts.active || 0) +
        (statusCounts.pending_procurement || 0),
      completedProjects: statusCounts.completed || 0,
      pendingApprovals,
      statusDistribution,
      totalBudget,
      actualCost,
      averageDuration:
        completedCount > 0 ? Math.round(totalDuration / completedCount) : 0,
      budgetAllocationBreakdown: {
        withAllocation: budgetAllocationCounts.withAllocation,
        withoutAllocation: budgetAllocationCounts.withoutAllocation,
      },
    };
  } catch (error) {
    console.error("❌ [ANALYTICS] Error in getProjectAnalytics:", error);
    return {
      activeProjects: 0,
      completedProjects: 0,
      pendingApprovals: 0,
      statusDistribution: [],
      totalBudget: 0,
      actualCost: 0,
      averageDuration: 0,
      budgetAllocationBreakdown: {
        withAllocation: 0,
        withoutAllocation: 0,
      },
    };
  }
};

// Get leave analytics for a department
const getLeaveAnalytics = async (departmentId, startDate, endDate) => {
  try {
    // Get all leave requests for the department in the date range
    const leaveRequests = await LeaveRequest.find({
      department: departmentId,
      // Temporarily remove date filtering to show all leave requests for testing
      // submittedAt: { $gte: startDate, $lte: endDate },
    }).populate("employee", "firstName lastName");

    // Count by leave type
    const typeCounts = {};
    leaveRequests.forEach((request) => {
      const type = request.leaveType;
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    // Map to analytics format
    const typeDistribution = [
      {
        type: "Annual Leave",
        count: typeCounts.Annual || 0,
        color: "bg-green-500",
      },
      { type: "Sick Leave", count: typeCounts.Sick || 0, color: "bg-red-500" },
      {
        type: "Personal Leave",
        count: typeCounts.Personal || 0,
        color: "bg-blue-500",
      },
      {
        type: "Maternity Leave",
        count: typeCounts.Maternity || 0,
        color: "bg-pink-500",
      },
      {
        type: "Paternity Leave",
        count: typeCounts.Paternity || 0,
        color: "bg-indigo-500",
      },
      {
        type: "Study Leave",
        count: typeCounts.Study || 0,
        color: "bg-purple-500",
      },
      {
        type: "Bereavement Leave",
        count: typeCounts.Bereavement || 0,
        color: "bg-gray-500",
      },
    ];

    return {
      totalRequests: leaveRequests.length,
      typeDistribution,
      pendingRequests: leaveRequests.filter((r) => r.status === "Pending")
        .length,
      approvedRequests: leaveRequests.filter((r) => r.status === "Approved")
        .length,
      rejectedRequests: leaveRequests.filter((r) => r.status === "Rejected")
        .length,
    };
  } catch (error) {
    console.error("❌ [ANALYTICS] Error in getLeaveAnalytics:", error);
    return {
      totalRequests: 0,
      typeDistribution: [],
      pendingRequests: 0,
      approvedRequests: 0,
      rejectedRequests: 0,
    };
  }
};

// Get payroll analytics for a department
const getPayrollAnalytics = async (departmentId, startDate, endDate) => {
  try {
    // For HODs: Only get department-scoped payrolls for users in their department
    const payrolls = await Payroll.find({
      department: departmentId,
      scope: "department",
      // Temporarily remove date filtering to show all payrolls for testing
      // processingDate: { $gte: startDate, $lte: endDate },
    }).populate("department", "name");

    let totalPayrollCost = 0;
    let employeeCount = 0;
    let averageSalary = 0;
    const frequencyBreakdown = {
      monthly: 0,
      quarterly: 0,
      yearly: 0,
      one_time: 0,
    };

    payrolls.forEach((payroll) => {
      if (frequencyBreakdown.hasOwnProperty(payroll.frequency)) {
        frequencyBreakdown[payroll.frequency]++;
      }
      if (payroll.payrolls && payroll.payrolls.length > 0) {
        payroll.payrolls.forEach((empPayroll) => {
          totalPayrollCost += empPayroll.baseSalary || 0;
          totalPayrollCost += empPayroll.housingAllowance || 0;
          totalPayrollCost += empPayroll.transportAllowance || 0;
          totalPayrollCost += empPayroll.mealAllowance || 0;
          totalPayrollCost += empPayroll.otherAllowance || 0;

          if (empPayroll.personalAllowances) {
            empPayroll.personalAllowances.forEach((allowance) => {
              totalPayrollCost += allowance.amount || 0;
            });
          }

          if (empPayroll.personalBonuses) {
            empPayroll.personalBonuses.forEach((bonus) => {
              totalPayrollCost += bonus.amount || 0;
            });
          }

          employeeCount++;
        });
      }
    });

    averageSalary = employeeCount > 0 ? totalPayrollCost / employeeCount : 0;

    return {
      totalPayrollCost,
      employeeCount,
      averageSalary: Math.round(averageSalary),
      payrollRuns: payrolls.length,
      frequencyBreakdown,
    };
  } catch (error) {
    console.error("❌ [ANALYTICS] Error in getPayrollAnalytics:", error);
    return {
      totalPayrollCost: 0,
      employeeCount: 0,
      averageSalary: 0,
      payrollRuns: 0,
      frequencyBreakdown: {
        monthly: 0,
        quarterly: 0,
        yearly: 0,
        one_time: 0,
      },
    };
  }
};

// Get monthly trends for projects
const getMonthlyTrends = async (departmentId, period) => {
  try {
    const now = new Date();
    let months = [];

    // Generate months based on period
    switch (period) {
      case "yearly":
        // Show all 12 months of current year
        for (let i = 0; i < 12; i++) {
          const date = new Date(now.getFullYear(), i, 1);
          months.push({
            month: date.toLocaleDateString("en-US", { month: "short" }),
            year: date.getFullYear(),
            startDate: new Date(date.getFullYear(), date.getMonth(), 1),
            endDate: new Date(date.getFullYear(), date.getMonth() + 1, 0),
          });
        }
        break;
      case "quarterly":
        // Show current quarter (3 months)
        const quarterStart = Math.floor(now.getMonth() / 3) * 3;
        for (let i = 0; i < 3; i++) {
          const date = new Date(now.getFullYear(), quarterStart + i, 1);
          months.push({
            month: date.toLocaleDateString("en-US", { month: "short" }),
            year: date.getFullYear(),
            startDate: new Date(date.getFullYear(), date.getMonth(), 1),
            endDate: new Date(date.getFullYear(), date.getMonth() + 1, 0),
          });
        }
        break;
      case "monthly":
        // Show current month only
        const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        months.push({
          month: currentMonth.toLocaleDateString("en-US", { month: "short" }),
          year: currentMonth.getFullYear(),
          startDate: new Date(
            currentMonth.getFullYear(),
            currentMonth.getMonth(),
            1
          ),
          endDate: new Date(
            currentMonth.getFullYear(),
            currentMonth.getMonth() + 1,
            0
          ),
        });
        break;
      case "one_time":
        // Show last 6 months
        for (let i = 5; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          months.push({
            month: date.toLocaleDateString("en-US", { month: "short" }),
            year: date.getFullYear(),
            startDate: new Date(date.getFullYear(), date.getMonth(), 1),
            endDate: new Date(date.getFullYear(), date.getMonth() + 1, 0),
          });
        }
        break;
      default: // current
        // Show last 6 months (default behavior)
        for (let i = 5; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          months.push({
            month: date.toLocaleDateString("en-US", { month: "short" }),
            year: date.getFullYear(),
            startDate: new Date(date.getFullYear(), date.getMonth(), 1),
            endDate: new Date(date.getFullYear(), date.getMonth() + 1, 0),
          });
        }
        break;
    }

    // Get project counts for each month
    const trends = await Promise.all(
      months.map(async (month) => {
        const projects = await Project.countDocuments({
          department: departmentId,
          createdAt: { $gte: month.startDate, $lte: month.endDate },
        });

        const completed = await Project.countDocuments({
          department: departmentId,
          status: "completed",
          actualEndDate: { $gte: month.startDate, $lte: month.endDate },
        });

        return {
          month: month.month,
          year: month.year,
          projects,
          completion: completed,
        };
      })
    );

    return trends;
  } catch (error) {
    console.error("❌ [ANALYTICS] Error in getMonthlyTrends:", error);
    return [];
  }
};

// Calculate trends by comparing current period with previous period
const calculateTrends = async (departmentId, period, currentData) => {
  try {
    const now = new Date();
    let previousStartDate, previousEndDate;

    // Calculate previous period dates
    switch (period) {
      case "monthly":
        previousStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        previousEndDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case "quarterly":
        const quarterStart = Math.floor(now.getMonth() / 3) * 3;
        previousStartDate = new Date(now.getFullYear(), quarterStart - 3, 1);
        previousEndDate = new Date(now.getFullYear(), quarterStart, 0);
        break;
      case "yearly":
        previousStartDate = new Date(now.getFullYear() - 1, 0, 1);
        previousEndDate = new Date(now.getFullYear() - 1, 11, 31);
        break;
      case "one_time":
        // Compare with 6 months before the current 6-month period
        previousStartDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
        previousEndDate = new Date(now.getFullYear(), now.getMonth() - 6, 0);
        break;
      default: // current
        previousStartDate = new Date(now.getFullYear() - 1, 0, 1);
        previousEndDate = new Date(now.getFullYear() - 1, 11, 31);
        break;
    }

    // Get previous period data
    const previousTeamSize = await User.countDocuments({
      department: departmentId,
      isActive: true,
    });

    const previousProjects = await Project.find({
      department: departmentId,
      projectScope: "personal",
      createdAt: { $gte: previousStartDate, $lte: previousEndDate },
    });

    const previousActiveProjects = previousProjects.filter(
      (p) =>
        p.status === "in_progress" ||
        p.status === "implementation" ||
        p.status === "active" ||
        p.status === "pending_procurement"
    ).length;

    const previousCompletedProjects = previousProjects.filter(
      (p) => p.status === "completed"
    ).length;

    const previousPendingApprovals = previousProjects.filter(
      (p) => p.status.includes("pending") && !p.status.includes("procurement")
    ).length;

    // Calculate percentage changes
    const calculatePercentageChange = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    return {
      teamSize: calculatePercentageChange(
        currentData.teamSize,
        previousTeamSize
      ),
      activeProjects: calculatePercentageChange(
        currentData.activeProjects,
        previousActiveProjects
      ),
      completedProjects: calculatePercentageChange(
        currentData.completedProjects,
        previousCompletedProjects
      ),
      pendingApprovals: calculatePercentageChange(
        currentData.pendingApprovals,
        previousPendingApprovals
      ),
    };
  } catch (error) {
    console.error("❌ [ANALYTICS] Error calculating trends:", error);
    return {
      teamSize: 0,
      activeProjects: 0,
      completedProjects: 0,
      pendingApprovals: 0,
    };
  }
};

// Get company-wide analytics (for super admins - level 900+)
// Super admins can see ALL data across the company:
// - Projects: ALL scopes (departmental, personal, external) from ALL departments
// - Payroll: ALL scopes (company, department, individual)
// - Leaves: ALL leave requests from ALL departments
export const getCompanyAnalytics = async (req, res) => {
  try {
    const { period = "current" } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate, endDate;

    switch (period) {
      case "last_month":
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case "last_quarter":
        const quarterStart = Math.floor(now.getMonth() / 3) * 3;
        startDate = new Date(now.getFullYear(), quarterStart - 3, 1);
        endDate = new Date(now.getFullYear(), quarterStart, 0);
        break;
      case "last_year":
        startDate = new Date(now.getFullYear() - 1, 0, 1);
        endDate = new Date(now.getFullYear() - 1, 11, 31);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = now;
        break;
    }

    // Get company-wide metrics
    const totalEmployees = await User.countDocuments({ isActive: true });
    const totalDepartments = await mongoose
      .model("Department")
      .countDocuments();

    // Get project metrics - ALL projects regardless of date for super admins
    const totalProjects = await Project.countDocuments({});
    const completedProjects = await Project.countDocuments({
      status: "completed",
    });

    // Get leave metrics - ALL leave requests regardless of date for super admins
    const totalLeaveRequests = await LeaveRequest.countDocuments({});

    // Get overall project analytics
    const allProjects = await Project.find({}).populate("department", "name");
    let totalBudget = 0;
    let actualCost = 0;
    const budgetAllocationCounts = { withAllocation: 0, withoutAllocation: 0 };
    const projectStatusCounts = {};

    allProjects.forEach((project) => {
      totalBudget += project.budget || 0;
      actualCost += project.actualCost || 0;

      // Count by budget allocation
      if (project.requiresBudgetAllocation === true) {
        budgetAllocationCounts.withAllocation++;
      } else {
        budgetAllocationCounts.withoutAllocation++;
      }

      // Count by status
      const status = project.status;
      projectStatusCounts[status] = (projectStatusCounts[status] || 0) + 1;
    });

    // Get overall payroll analytics
    const allPayrolls = await Payroll.find({});
    let totalPayrollCost = 0;
    let employeeCount = 0;
    const frequencyBreakdown = {
      monthly: 0,
      quarterly: 0,
      yearly: 0,
      one_time: 0,
    };

    allPayrolls.forEach((payroll) => {
      if (frequencyBreakdown.hasOwnProperty(payroll.frequency)) {
        frequencyBreakdown[payroll.frequency]++;
      }

      if (payroll.payrolls && payroll.payrolls.length > 0) {
        payroll.payrolls.forEach((empPayroll) => {
          totalPayrollCost += empPayroll.baseSalary || 0;
          totalPayrollCost += empPayroll.housingAllowance || 0;
          totalPayrollCost += empPayroll.transportAllowance || 0;
          totalPayrollCost += empPayroll.mealAllowance || 0;
          totalPayrollCost += empPayroll.otherAllowance || 0;
          employeeCount++;
        });
      }
    });

    // Get department-wise breakdown
    const departmentBreakdown = await getDepartmentBreakdown(
      startDate,
      endDate
    );

    const analytics = {
      totalEmployees,
      totalDepartments,
      totalProjects,
      completedProjects,
      totalLeaveRequests,
      totalBudget,
      actualCost,
      budgetUtilization:
        totalBudget > 0 ? ((actualCost / totalBudget) * 100).toFixed(1) : 0,
      projectSuccessRate:
        totalProjects > 0
          ? ((completedProjects / totalProjects) * 100).toFixed(1)
          : 0,
      budgetAllocationBreakdown: {
        withAllocation: budgetAllocationCounts.withAllocation,
        withoutAllocation: budgetAllocationCounts.withoutAllocation,
      },
      payrollAnalytics: {
        totalPayrollCost,
        employeeCount,
        averageSalary:
          employeeCount > 0 ? Math.round(totalPayrollCost / employeeCount) : 0,
        payrollRuns: allPayrolls.length,
        frequencyBreakdown,
      },
      projectStatusBreakdown: projectStatusCounts,
      departmentBreakdown,
    };

    console.log(`✅ [ANALYTICS] Successfully generated company analytics`);

    res.json({
      success: true,
      data: analytics,
      period,
      dateRange: { startDate, endDate },
    });
  } catch (error) {
    console.error("❌ [ANALYTICS] Error fetching company analytics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch company analytics",
      error: error.message,
    });
  }
};

// Get department breakdown for company analytics
const getDepartmentBreakdown = async (startDate, endDate) => {
  try {
    const departments = await mongoose.model("Department").find();

    const breakdown = await Promise.all(
      departments.map(async (dept) => {
        const employeeCount = await User.countDocuments({
          department: dept._id,
          isActive: true,
        });

        const projectCount = await Project.countDocuments({
          department: dept._id,
          createdAt: { $gte: startDate, $lte: endDate },
        });

        const leaveCount = await LeaveRequest.countDocuments({
          department: dept._id,
          submittedAt: { $gte: startDate, $lte: endDate },
        });

        return {
          departmentId: dept._id,
          departmentName: dept.name,
          employeeCount,
          projectCount,
          leaveCount,
        };
      })
    );

    return breakdown;
  } catch (error) {
    console.error("❌ [ANALYTICS] Error in getDepartmentBreakdown:", error);
    return [];
  }
};
