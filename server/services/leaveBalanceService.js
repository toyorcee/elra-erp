import User from "../models/User.js";
import LeaveRequest from "../models/LeaveRequest.js";

/**
 * Leave Balance Service
 * Handles leave balance calculations and updates
 */
class LeaveBalanceService {
  /**
   * Calculate current leave balance for an employee
   * @param {string} employeeId - Employee ID
   * @returns {Object} Leave balance breakdown
   */
  async calculateLeaveBalance(employeeId) {
    try {
      const employee = await User.findById(employeeId);
      if (!employee) {
        throw new Error("Employee not found");
      }

      // Get all approved leave requests for this employee
      const approvedLeaves = await LeaveRequest.find({
        employee: employeeId,
        status: "Approved",
      });

      // Calculate used leave days by type
      const usedLeave = {};
      approvedLeaves.forEach((leave) => {
        if (!usedLeave[leave.leaveType]) {
          usedLeave[leave.leaveType] = 0;
        }
        usedLeave[leave.leaveType] += leave.days;
      });

      // Calculate remaining balance
      const leaveBalance = {};
      const defaultBalances = employee.leaveBalance || {};

      // Get all leave types from the LeaveRequest model
      const leaveTypes = [
        "Annual",
        "Sick",
        "Personal",
        "Maternity",
        "Paternity",
        "Study",
        "Bereavement",
      ];

      leaveTypes.forEach((type) => {
        const defaultBalance = defaultBalances[type] || 0;
        const usedDays = usedLeave[type] || 0;
        const remainingBalance = Math.max(0, defaultBalance - usedDays);

        leaveBalance[type] = {
          allocated: defaultBalance,
          used: usedDays,
          remaining: remainingBalance,
        };
      });

      return {
        employeeId,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        leaveBalance,
        totalRemaining: Object.values(leaveBalance).reduce(
          (sum, balance) => sum + balance.remaining,
          0
        ),
      };
    } catch (error) {
      console.error(
        "❌ [LeaveBalance] Error calculating leave balance:",
        error
      );
      throw error;
    }
  }

  /**
   * Update leave balance when a leave request is approved
   * @param {string} employeeId - Employee ID
   * @param {string} leaveType - Type of leave
   * @param {number} days - Number of days
   */
  async updateLeaveBalance(employeeId, leaveType, days) {
    try {
      const employee = await User.findById(employeeId);
      if (!employee) {
        throw new Error("Employee not found");
      }

      // Initialize leaveBalance if it doesn't exist
      if (!employee.leaveBalance) {
        employee.leaveBalance = {};
      }

      // Update the specific leave type balance
      if (!employee.leaveBalance[leaveType]) {
        employee.leaveBalance[leaveType] = 0;
      }

      employee.leaveBalance[leaveType] = Math.max(
        0,
        employee.leaveBalance[leaveType] - days
      );
      await employee.save();

      console.log(
        `✅ [LeaveBalance] Updated ${leaveType} balance for ${employee.email}: ${employee.leaveBalance[leaveType]} days remaining`
      );
    } catch (error) {
      console.error("❌ [LeaveBalance] Error updating leave balance:", error);
      throw error;
    }
  }

  /**
   * Calculate leave payout for final payroll
   * @param {string} employeeId - Employee ID
   * @param {number} dailyRate - Daily salary rate
   * @returns {Object} Leave payout calculation
   */
  async calculateLeavePayout(employeeId, dailyRate) {
    try {
      const balanceData = await this.calculateLeaveBalance(employeeId);

      // Only Annual leave is typically paid out (company policy)
      const annualLeaveRemaining = balanceData.leaveBalance.Annual.remaining;
      const leavePayout = annualLeaveRemaining * dailyRate;

      return {
        annualLeaveRemaining,
        dailyRate,
        leavePayout,
        breakdown: {
          type: "Annual Leave Payout",
          days: annualLeaveRemaining,
          rate: dailyRate,
          amount: leavePayout,
        },
      };
    } catch (error) {
      console.error("❌ [LeaveBalance] Error calculating leave payout:", error);
      throw error;
    }
  }

  /**
   * Reset leave balances for new year (typically done annually)
   * @param {string} employeeId - Employee ID (optional, if not provided, resets for all employees)
   */
  async resetLeaveBalances(employeeId = null) {
    try {
      const query = employeeId ? { _id: employeeId } : {};
      const employees = await User.find(query);

      for (const employee of employees) {
        // Reset to default balances
        employee.leaveBalance = {
          Annual: 21,
          Sick: 12,
          Personal: 5,
          Maternity: 90,
          Paternity: 14,
          Study: 10,
          Bereavement: 5,
        };
        await employee.save();
      }

      console.log(
        `✅ [LeaveBalance] Reset leave balances for ${employees.length} employees`
      );
    } catch (error) {
      console.error("❌ [LeaveBalance] Error resetting leave balances:", error);
      throw error;
    }
  }
}

export default new LeaveBalanceService();
