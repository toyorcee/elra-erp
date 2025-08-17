import React, { useState, useEffect } from "react";
import {
  HiPlus,
  HiPencil,
  HiTrash,
  HiEye,
  HiCheck,
  HiExclamation,
} from "react-icons/hi";
import { formatCurrency } from "../../../../utils/formatters";
import AllowanceForm from "../../../../components/payroll/AllowanceForm";
import {
  fetchAllowances,
  createAllowance,
  updateAllowance,
  deleteAllowance,
} from "../../../../services/allowanceAPI";

const PerformanceAllowances = () => {
  const [allowances, setAllowances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAllowance, setEditingAllowance] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [salaryGrades, setSalaryGrades] = useState([]);

  useEffect(() => {
    fetchAllowancesData();
    fetchEmployees();
    fetchDepartments();
    fetchSalaryGrades();
  }, []);

  const fetchAllowancesData = async () => {
    try {
      setLoading(true);
      const response = await fetchAllowances();
      setAllowances(response.data || []);
    } catch (error) {
      console.error("Error fetching allowances:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAllowance = () => {
    setEditingAllowance(null);
    setShowModal(true);
  };

  const handleEditAllowance = (allowance) => {
    setEditingAllowance(allowance);
    setShowModal(true);
  };

  const handleDeleteAllowance = async (id) => {
    if (window.confirm("Are you sure you want to delete this allowance?")) {
      try {
        await deleteAllowance(id);
        setAllowances(allowances.filter((a) => a._id !== id));
      } catch (error) {
        console.error("Error deleting allowance:", error);
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

  const fetchSalaryGrades = async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await userModulesAPI.getSalaryGrades();
      // setSalaryGrades(response.data);

      // Mock data for now
      setSalaryGrades([
        { _id: "1", name: "Grade A", baseSalary: 500000 },
        { _id: "2", name: "Grade B", baseSalary: 400000 },
        { _id: "3", name: "Grade C", baseSalary: 300000 },
      ]);
    } catch (error) {
      console.error("Error fetching salary grades:", error);
    }
  };

  const handleSubmitAllowance = async (formData) => {
    try {
      if (editingAllowance) {
        const response = await updateAllowance(editingAllowance._id, formData);
        setAllowances(
          allowances.map((a) =>
            a._id === editingAllowance._id ? response.data : a
          )
        );
      } else {
        const response = await createAllowance(formData);
        setAllowances([...allowances, response.data]);
      }
      setShowModal(false);
      setEditingAllowance(null);
    } catch (error) {
      console.error("Error submitting allowance:", error);
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

  const getCalculationTypeLabel = (type, amount, percentageBase) => {
    if (type === "fixed") {
      return formatCurrency(amount);
    } else {
      return `${amount}% of ${percentageBase.replace("_", " ")}`;
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case "performance":
        return "bg-blue-100 text-blue-800";
      case "transport":
        return "bg-green-100 text-green-800";
      case "housing":
        return "bg-purple-100 text-purple-800";
      case "meal":
        return "bg-orange-100 text-orange-800";
      case "medical":
        return "bg-red-100 text-red-800";
      case "education":
        return "bg-indigo-100 text-indigo-800";
      case "hardship":
        return "bg-yellow-100 text-yellow-800";
      case "special":
        return "bg-pink-100 text-pink-800";
      default:
        return "bg-gray-100 text-gray-800";
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
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Performance Allowances
          </h1>
          <p className="text-gray-600">
            Manage performance-based allowances for employees
          </p>
        </div>
        <button
          onClick={handleAddAllowance}
          className="bg-[var(--elra-primary)] text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-[var(--elra-primary-dark)] transition-colors"
        >
          <HiPlus className="w-5 h-5" />
          <span>Add Allowance</span>
        </button>
      </div>

      {/* Allowances Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Allowance Name
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
              {allowances.map((allowance) => (
                <tr key={allowance._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {allowance.employee?.firstName}{" "}
                        {allowance.employee?.lastName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {allowance.employee?.employeeId}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {allowance.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {allowance.description}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getCalculationTypeLabel(
                      allowance.calculationType,
                      allowance.amount,
                      allowance.percentageBase
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(
                          allowance.category
                        )}`}
                      >
                        {allowance.category.replace("_", " ")}
                      </span>
                      <div className="text-xs text-gray-500">
                        {allowance.scope} scope
                      </div>
                      <div className="flex items-center space-x-1">
                        {allowance.taxable ? (
                          <HiExclamation className="w-3 h-3 text-red-500" />
                        ) : (
                          <HiCheck className="w-3 h-3 text-green-500" />
                        )}
                        <span
                          className={`text-xs ${
                            allowance.taxable
                              ? "text-red-600"
                              : "text-green-600"
                          }`}
                        >
                          {allowance.taxable ? "Taxable" : "Non-taxable"}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {allowance.frequency}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                        allowance.status
                      )}`}
                    >
                      {allowance.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditAllowance(allowance)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <HiPencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteAllowance(allowance._id)}
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
      {allowances.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <HiPlus className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No allowances found
          </h3>
          <p className="text-gray-500 mb-4">
            Get started by creating your first performance allowance.
          </p>
          <button
            onClick={handleAddAllowance}
            className="bg-[var(--elra-primary)] text-white px-4 py-2 rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors"
          >
            Add Allowance
          </button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <AllowanceForm
          allowance={editingAllowance}
          onSubmit={handleSubmitAllowance}
          onCancel={() => {
            setShowModal(false);
            setEditingAllowance(null);
          }}
          employees={employees}
          departments={departments}
          salaryGrades={salaryGrades}
        />
      )}
    </div>
  );
};

export default PerformanceAllowances;
