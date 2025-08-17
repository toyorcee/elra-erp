import React, { useState, useEffect } from "react";
import {
  HiPlus,
  HiPencil,
  HiTrash,
  HiGift,
  HiCheck,
  HiExclamation,
} from "react-icons/hi";
import { formatCurrency } from "../../../../utils/formatters";
import BonusForm from "../../../../components/payroll/BonusForm";

const PerformanceBonuses = () => {
  const [bonuses, setBonuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBonus, setEditingBonus] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    fetchBonuses();
    fetchEmployees();
    fetchDepartments();
  }, []);

  const fetchBonuses = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await bonusAPI.getBonuses();
      // setBonuses(response.data);

      // Mock data for now
      setBonuses([
        {
          id: 1,
          employee: {
            firstName: "Jane",
            lastName: "Smith",
            employeeId: "EMP002",
          },
          name: "Year End Bonus",
          description: "Annual performance bonus",
          calculationType: "percentage",
          amount: 20,
          percentageBase: "base_salary",
          type: "year_end",
          category: "year_end",
          frequency: "yearly",
          status: "active",
          startDate: "2024-01-01",
          endDate: "2024-12-31",
          taxable: true,
        },
        {
          id: 2,
          employee: {
            firstName: "Mike",
            lastName: "Johnson",
            employeeId: "EMP003",
          },
          name: "Project Bonus",
          description: "Special project completion bonus",
          calculationType: "fixed",
          amount: 50000,
          percentageBase: "base_salary",
          type: "project",
          category: "special",
          frequency: "one_time",
          status: "active",
          startDate: "2024-03-01",
          endDate: "2024-03-31",
          taxable: true,
        },
        {
          id: 3,
          employee: {
            firstName: "John",
            lastName: "Doe",
            employeeId: "EMP001",
          },
          name: "Retention Bonus",
          description: "Employee retention incentive",
          calculationType: "fixed",
          amount: 75000,
          percentageBase: "base_salary",
          type: "retention",
          category: "retention",
          frequency: "one_time",
          status: "active",
          startDate: "2024-02-01",
          endDate: "2024-02-29",
          taxable: false,
        },
      ]);
    } catch (error) {
      console.error("Error fetching bonuses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBonus = () => {
    setEditingBonus(null);
    setShowModal(true);
  };

  const handleEditBonus = (bonus) => {
    setEditingBonus(bonus);
    setShowModal(true);
  };

  const handleDeleteBonus = async (id) => {
    if (window.confirm("Are you sure you want to delete this bonus?")) {
      try {
        // TODO: Replace with actual API call
        // await bonusAPI.deleteBonus(id);
        setBonuses(bonuses.filter((b) => b.id !== id));
      } catch (error) {
        console.error("Error deleting bonus:", error);
      }
    }
  };

  const fetchEmployees = async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await userModulesAPI.getEmployees();
      // setEmployees(response.data);

      // Mock data for now
      setEmployees([
        { _id: "1", firstName: "John", lastName: "Doe", employeeId: "EMP001" },
        {
          _id: "2",
          firstName: "Jane",
          lastName: "Smith",
          employeeId: "EMP002",
        },
        {
          _id: "3",
          firstName: "Mike",
          lastName: "Johnson",
          employeeId: "EMP003",
        },
      ]);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const fetchDepartments = async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await userModulesAPI.getDepartments();
      // setDepartments(response.data);

      // Mock data for now
      setDepartments([
        { _id: "1", name: "IT Department" },
        { _id: "2", name: "HR Department" },
        { _id: "3", name: "Finance Department" },
      ]);
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  const handleSubmitBonus = async (formData) => {
    try {
      if (editingBonus) {
        // TODO: Replace with actual API call
        // await bonusAPI.updateBonus(editingBonus.id, formData);
        setBonuses(
          bonuses.map((b) =>
            b.id === editingBonus.id ? { ...b, ...formData } : b
          )
        );
      } else {
        // TODO: Replace with actual API call
        // const response = await bonusAPI.createBonus(formData);
        const newBonus = {
          id: Date.now(),
          ...formData,
          employee: employees.find((e) => e._id === formData.employee),
        };
        setBonuses([...bonuses, newBonus]);
      }
      setShowModal(false);
      setEditingBonus(null);
    } catch (error) {
      console.error("Error submitting bonus:", error);
      throw error;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "expired":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case "performance":
        return "bg-blue-100 text-blue-800";
      case "year_end":
        return "bg-purple-100 text-purple-800";
      case "special":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getCalculationTypeLabel = (type, amount, percentageBase) => {
    if (type === "fixed") {
      return formatCurrency(amount);
    } else {
      return `${amount}% of ${percentageBase.replace("_", " ")}`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--elra-primary)]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Performance Bonuses
          </h1>
          <p className="text-gray-600">
            Manage performance-based bonuses for employees
          </p>
        </div>
        <button
          onClick={handleAddBonus}
          className="bg-[var(--elra-primary)] text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-[var(--elra-primary-dark)] transition-colors"
        >
          <HiPlus className="w-5 h-5" />
          <span>Add Bonus</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <HiGift className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Bonuses</p>
              <p className="text-2xl font-bold text-gray-900">
                {bonuses.length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <HiGift className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">
                {bonuses.filter((b) => b.status === "active").length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <HiGift className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Year End</p>
              <p className="text-2xl font-bold text-gray-900">
                {bonuses.filter((b) => b.category === "year_end").length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <HiGift className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Special</p>
              <p className="text-2xl font-bold text-gray-900">
                {bonuses.filter((b) => b.category === "special").length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bonuses Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bonus Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Calculation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Frequency
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bonuses.map((bonus) => (
                <tr key={bonus.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {bonus.employee.firstName} {bonus.employee.lastName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {bonus.employee.employeeId}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {bonus.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {bonus.description}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getCalculationTypeLabel(
                      bonus.calculationType,
                      bonus.amount,
                      bonus.percentageBase
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(
                          bonus.category
                        )}`}
                      >
                        {bonus.category.replace("_", " ")}
                      </span>
                      <div className="text-xs text-gray-500">
                        {bonus.type} type
                      </div>
                      <div className="flex items-center space-x-1">
                        {bonus.taxable ? (
                          <HiExclamation className="w-3 h-3 text-red-500" />
                        ) : (
                          <HiCheck className="w-3 h-3 text-green-500" />
                        )}
                        <span
                          className={`text-xs ${
                            bonus.taxable ? "text-red-600" : "text-green-600"
                          }`}
                        >
                          {bonus.taxable ? "Taxable" : "Non-taxable"}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {bonus.frequency.replace("_", " ")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                        bonus.status
                      )}`}
                    >
                      {bonus.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditBonus(bonus)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <HiPencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteBonus(bonus.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <HiTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {bonuses.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <HiGift className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No bonuses found
          </h3>
          <p className="text-gray-500 mb-4">
            Get started by creating your first performance bonus.
          </p>
          <button
            onClick={handleAddBonus}
            className="bg-[var(--elra-primary)] text-white px-4 py-2 rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors"
          >
            Add Bonus
          </button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <BonusForm
          bonus={editingBonus}
          onSubmit={handleSubmitBonus}
          onCancel={() => {
            setShowModal(false);
            setEditingBonus(null);
          }}
          employees={employees}
          departments={departments}
        />
      )}
    </div>
  );
};

export default PerformanceBonuses;
