import React, { useState, useEffect } from "react";
import {
  CurrencyDollarIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CalculatorIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-toastify";
import { userModulesAPI } from "../../../../services/userModules.js";
import {
  formatNumberWithCommas,
  parseFormattedNumber,
  formatCurrency,
  isNumberField,
} from "../../../../utils/formatters.js";
import DataTable from "../../../../components/common/DataTable";

const SalaryGradeManagement = () => {
  const [salaryGrades, setSalaryGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGrade, setEditingGrade] = useState(null);
  const [activeTab, setActiveTab] = useState("grades");
  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedStep, setSelectedStep] = useState("");
  const [dropdownGrades, setDropdownGrades] = useState([]);
  const [roles, setRoles] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formData, setFormData] = useState({
    grade: "",
    name: "",
    minGrossSalary: "",
    maxGrossSalary: "",
    description: "",
    selectedRole: "",
    allowances: {
      housing: 0,
      transport: 0,
      meal: 0,
      other: 0,
    },
    customAllowances: [],
    enableCustomAllowances: false,
    steps: [],
    enableSteps: false,
  });

  useEffect(() => {
    fetchSalaryGrades();
    fetchDropdownGrades();
    fetchRoles();
  }, []);

  const fetchDropdownGrades = async () => {
    try {
      const response =
        await userModulesAPI.salaryGrades.getSalaryGradesForDropdown();
      if (response.success) {
        setDropdownGrades(response.data);
      }
    } catch (error) {
      console.error("Error fetching dropdown grades:", error);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await userModulesAPI.roles.getAllRoles();
      if (response.success) {
        setRoles(response.data);
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
    }
  };

  const fetchSalaryGrades = async () => {
    setLoading(true);
    try {
      const response = await userModulesAPI.salaryGrades.getAllSalaryGrades();
      console.log("🔍 [SALARY_GRADES] Response:", response);
      if (response.success) {
        setSalaryGrades(response.data);
      } else {
        toast.error("Failed to fetch salary grades");
      }
    } catch (error) {
      console.error("Error fetching salary grades:", error);
      toast.error(
        error.response?.data?.message || "Failed to fetch salary grades"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    const formattedValue = isNumberField(name)
      ? formatNumberWithCommas(value)
      : value;

    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: formattedValue,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: formattedValue,
      }));
    }
  };

  const handleCustomAllowanceChange = (index, field, value) => {
    const updatedAllowances = [...formData.customAllowances];

    const formattedValue =
      field === "amount" ? formatNumberWithCommas(value) : value;

    updatedAllowances[index] = {
      ...updatedAllowances[index],
      [field]: formattedValue,
    };
    setFormData((prev) => ({ ...prev, customAllowances: updatedAllowances }));
  };

  const addCustomAllowance = () => {
    setFormData((prev) => ({
      ...prev,
      customAllowances: [...prev.customAllowances, { name: "", amount: "" }],
    }));
  };

  const removeCustomAllowance = (index) => {
    setFormData((prev) => ({
      ...prev,
      customAllowances: prev.customAllowances.filter((_, i) => i !== index),
    }));
  };

  const handleStepChange = (index, field, value) => {
    const updatedSteps = [...formData.steps];
    const formattedValue =
      field === "increment" || field === "yearsOfService"
        ? formatNumberWithCommas(value)
        : value;

    updatedSteps[index] = {
      ...updatedSteps[index],
      [field]: formattedValue,
    };
    setFormData((prev) => ({ ...prev, steps: updatedSteps }));
  };

  const addStep = () => {
    const nextStepNumber = formData.steps.length + 1;
    setFormData((prev) => ({
      ...prev,
      steps: [
        ...prev.steps,
        {
          step: `Step ${nextStepNumber}`,
          increment: "",
          yearsOfService: "",
        },
      ],
    }));
  };

  const removeStep = (index) => {
    setFormData((prev) => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Auto-generate grade name if not provided or if creating new
      if (!editingGrade || !formData.grade) {
        const existingGrades =
          await userModulesAPI.salaryGrades.getAllSalaryGrades();
        const lastGrade =
          existingGrades.data && existingGrades.data.length > 0
            ? existingGrades.data[existingGrades.data.length - 1]
            : null;

        if (lastGrade) {
          const lastGradeNumber = parseInt(lastGrade.grade.split(" ")[1]) || 0;
          formData.grade = `Grade ${lastGradeNumber + 1}`;
        } else {
          formData.grade = "Grade 1";
        }
      }

      // Prepare the data
      const salaryGradeData = {
        ...formData,
        minGrossSalary: parseFormattedNumber(formData.minGrossSalary),
        maxGrossSalary: parseFormattedNumber(formData.maxGrossSalary),
        allowances: {
          housing: parseFormattedNumber(formData.allowances.housing) || 0,
          transport: parseFormattedNumber(formData.allowances.transport) || 0,
          meal: parseFormattedNumber(formData.allowances.meal) || 0,
          other: parseFormattedNumber(formData.allowances.other) || 0,
        },
        customAllowances: formData.customAllowances.map((allowance) => ({
          ...allowance,
          amount: parseFormattedNumber(allowance.amount),
        })),
        steps: formData.enableSteps
          ? formData.steps.map((step) => ({
              ...step,
              increment: parseFormattedNumber(step.increment) || 0,
              yearsOfService: parseFormattedNumber(step.yearsOfService) || 0,
            }))
          : [],
      };

      if (editingGrade) {
        // Update existing grade
        const response = await userModulesAPI.salaryGrades.updateSalaryGrade(
          editingGrade._id,
          salaryGradeData
        );
        if (response.success) {
          toast.success("Salary grade updated successfully!");
          // Close modal first
          setShowModal(false);
          setEditingGrade(null);
          // Then refresh the list and dropdown
          await fetchSalaryGrades();
          await fetchDropdownGrades();
          // Reset form last
          resetForm();
        } else {
          toast.error(response.message || "Failed to update salary grade");
        }
      } else {
        const response = await userModulesAPI.salaryGrades.createSalaryGrade(
          salaryGradeData
        );
        if (response.success) {
          toast.success("Salary grade created successfully!");
          // Close modal first
          setShowModal(false);
          setEditingGrade(null);
          // Then refresh the list and dropdown
          await fetchSalaryGrades();
          await fetchDropdownGrades();
          // Reset form last
          resetForm();
        } else {
          toast.error(response.message || "Failed to create salary grade");
        }
      }
    } catch (error) {
      console.error("Error saving salary grade:", error);
      toast.error(
        error.response?.data?.message || "Failed to save salary grade"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (grade) => {
    // Prepare form data first
    const editFormData = {
      grade: grade.grade,
      name: grade.name,
      minGrossSalary: formatNumberWithCommas(grade.minGrossSalary.toString()),
      maxGrossSalary: formatNumberWithCommas(grade.maxGrossSalary.toString()),
      description: grade.description,
      selectedRole:
        grade.roleMappings && grade.roleMappings.length > 0
          ? grade.roleMappings[0].role._id || grade.roleMappings[0].role
          : "",
      allowances: {
        housing: formatNumberWithCommas(grade.allowances.housing.toString()),
        transport: formatNumberWithCommas(
          grade.allowances.transport.toString()
        ),
        meal: formatNumberWithCommas(grade.allowances.meal.toString()),
        other: formatNumberWithCommas(grade.allowances.other.toString()),
      },
      customAllowances: grade.customAllowances
        ? grade.customAllowances.map((allowance) => ({
            ...allowance,
            amount: allowance.amount
              ? formatNumberWithCommas(allowance.amount.toString())
              : "",
          }))
        : [],
      steps: grade.steps
        ? grade.steps.map((step) => ({
            ...step,
            increment: step.increment
              ? formatNumberWithCommas(step.increment.toString())
              : "",
            yearsOfService: step.yearsOfService
              ? formatNumberWithCommas(step.yearsOfService.toString())
              : "",
          }))
        : [],
      enableSteps: grade.steps && grade.steps.length > 0,
      enableCustomAllowances:
        grade.customAllowances && grade.customAllowances.length > 0,
    };

    setEditingGrade(grade);
    setFormData(editFormData);
    setShowModal(true);
  };

  const handleDelete = async (gradeId, gradeName) => {
    setDeleteTarget({ id: gradeId, name: gradeName });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    setLoading(true);
    try {
      const response = await userModulesAPI.salaryGrades.deleteSalaryGrade(
        deleteTarget.id
      );
      if (response.success) {
        toast.success(
          `Salary grade "${deleteTarget.name}" deleted successfully!`
        );
        await fetchSalaryGrades();
        await fetchDropdownGrades();
        setShowDeleteModal(false);
        setDeleteTarget(null);
      } else {
        toast.error(response.message || "Failed to delete salary grade");
      }
    } catch (error) {
      console.error("Error deleting salary grade:", error);
      if (error.response?.data?.message?.includes("assigned to users")) {
        toast.error(
          "Cannot delete salary grade. It is currently assigned to users."
        );
      } else {
        toast.error(
          error.response?.data?.message || "Failed to delete salary grade"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = async () => {
    // Auto-generate the next grade number
    let nextGrade = "Grade 1";
    if (salaryGrades.length > 0) {
      const lastGrade = salaryGrades[salaryGrades.length - 1];
      const lastGradeNumber = parseInt(lastGrade.grade.split(" ")[1]) || 0;
      nextGrade = `Grade ${lastGradeNumber + 1}`;
    }

    setFormData({
      grade: nextGrade,
      name: "",
      minGrossSalary: "",
      maxGrossSalary: "",
      description: "",
      selectedRole: "",
      allowances: {
        housing: "",
        transport: "",
        meal: "",
        other: "",
      },
      customAllowances: [],
      steps: [],
      enableSteps: false,
      enableCustomAllowances: false,
    });
  };

  const calculateTotalCompensation = (grade) => {
    const baseSalary = grade.minGrossSalary;

    const customAllowancesTotal = grade.customAllowances
      ? grade.customAllowances.reduce(
          (sum, allowance) => sum + allowance.amount,
          0
        )
      : 0;

    return {
      baseSalary: baseSalary,
      housing: grade.allowances.housing,
      transport: grade.allowances.transport,
      meal: grade.allowances.meal,
      other: grade.allowances.other,
      customAllowances: grade.customAllowances || [],
      customAllowancesTotal,
      total:
        baseSalary +
        grade.allowances.housing +
        grade.allowances.transport +
        grade.allowances.meal +
        grade.allowances.other +
        customAllowancesTotal,
    };
  };

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[var(--elra-text-primary)] mb-2">
              Salary Grade Management
            </h1>
            <p className="text-[var(--elra-text-secondary)]">
              Manage salary grades, compensation structure, and allowances
            </p>
          </div>
          <button
            onClick={async () => {
              await resetForm();
              setShowModal(true);
              setEditingGrade(null);
            }}
            className="flex items-center px-6 py-3 bg-[var(--elra-primary)] text-white rounded-xl hover:bg-[var(--elra-primary-dark)] transition-all duration-300 shadow-lg hover:shadow-xl cursor-pointer"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Salary Grade
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("grades")}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-all duration-300 cursor-pointer ${
                activeTab === "grades"
                  ? "border-[var(--elra-primary)] text-[var(--elra-primary)]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <CurrencyDollarIcon className="h-5 w-5 inline mr-2" />
              Salary Grades
            </button>
            <button
              onClick={() => setActiveTab("calculator")}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-all duration-300 cursor-pointer ${
                activeTab === "calculator"
                  ? "border-[var(--elra-primary)] text-[var(--elra-primary)]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <CalculatorIcon className="h-5 w-5 inline mr-2" />
              Salary Calculator
            </button>
          </nav>
        </div>
      </div>

      {/* Salary Grades Tab */}
      {activeTab === "grades" && (
        <div className="space-y-6">
          {/* Filter Controls */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* REMOVED: Step filter - redundant with bonuses and allowances system */}
              </div>
              <div className="text-sm text-gray-500">
                {salaryGrades.length} grades
              </div>
            </div>
          </div>

          {/* Data Table */}
          <DataTable
            data={salaryGrades}
            loading={loading}
            columns={[
              {
                header: "Grade",
                key: "grade",
                renderer: (grade) => (
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-[var(--elra-secondary-3)] flex items-center justify-center">
                      <span className="text-sm font-semibold text-[var(--elra-primary)]">
                        {grade.grade.split(" ")[1]}
                      </span>
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-semibold text-gray-900">
                        {grade.grade}
                      </div>
                      <div className="text-sm text-gray-500">{grade.name}</div>
                    </div>
                  </div>
                ),
                skeletonRenderer: () => (
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gray-200 rounded-full mr-3"></div>
                    <div>
                      <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                ),
              },
              {
                header: "Description",
                key: "description",
                renderer: (grade) => (
                  <div className="break-words leading-relaxed max-w-xs">
                    {grade.description}
                  </div>
                ),
                skeletonRenderer: () => (
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                  </div>
                ),
              },
              {
                header: "Salary Range",
                key: "salaryRange",
                renderer: (grade) => (
                  <div>
                    <div className="font-medium">
                      {formatCurrency(grade.minGrossSalary)}
                    </div>
                    <div className="text-gray-500">
                      to {formatCurrency(grade.maxGrossSalary)}
                    </div>
                  </div>
                ),
                skeletonRenderer: () => (
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                ),
              },
              {
                header: "Allowances",
                key: "allowances",
                renderer: (grade) => (
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Housing:</span>
                      <span>{formatCurrency(grade.allowances.housing)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Transport:</span>
                      <span>{formatCurrency(grade.allowances.transport)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Meal:</span>
                      <span>{formatCurrency(grade.allowances.meal)}</span>
                    </div>
                  </div>
                ),
                skeletonRenderer: () => (
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                    <div className="h-3 bg-gray-200 rounded w-20"></div>
                    <div className="h-3 bg-gray-200 rounded w-12"></div>
                  </div>
                ),
              },
              {
                header: "Mapped Roles",
                key: "roles",
                renderer: (grade) => (
                  <div className="space-y-1">
                    {grade.roleMappings && grade.roleMappings.length > 0 ? (
                      grade.roleMappings.map((mapping, index) => (
                        <div key={index} className="flex items-center">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {(mapping.role?.name || "Unknown Role").replace(
                              /_/g,
                              " "
                            )}
                          </span>
                        </div>
                      ))
                    ) : (
                      <span className="text-gray-400 text-xs">
                        No roles mapped
                      </span>
                    )}
                  </div>
                ),
                skeletonRenderer: () => (
                  <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                ),
              },
              {
                header: "Status",
                key: "status",
                renderer: (grade) => (
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      grade.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {grade.isActive ? "Active" : "Inactive"}
                  </span>
                ),
                skeletonRenderer: () => (
                  <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                ),
              },
            ]}
            actions={{
              onEdit: handleEdit,
              onDelete: handleDelete,
              showEdit: true,
              showDelete: true,
              showToggle: false,
            }}
            emptyState={{
              icon: <CurrencyDollarIcon className="w-12 h-12 text-white" />,
              title: "No salary grades found",
              description:
                "Get started by creating your first salary grade to define your compensation structure.",
              actionButton: (
                <button
                  onClick={async () => {
                    await resetForm();
                    setShowModal(true);
                  }}
                  className="inline-flex items-center px-6 py-3 bg-[var(--elra-primary)] text-white font-medium rounded-xl shadow-lg hover:bg-[var(--elra-primary-dark)] transition-all duration-200 transform hover:scale-105 cursor-pointer"
                >
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Create First Salary Grade
                </button>
              ),
            }}
            skeletonRows={5}
          />
        </div>
      )}

      {/* Salary Calculator Tab */}
      {activeTab === "calculator" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Calculator Form */}
          <div className="bg-gradient-to-br from-white to-green-50 rounded-xl shadow-sm border border-green-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Gross Salary Calculator
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Grade
                </label>
                <select
                  value={selectedGrade}
                  onChange={(e) => {
                    setSelectedGrade(e.target.value);
                    setSelectedStep("");
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent cursor-pointer"
                >
                  <option value="">Select a grade</option>
                  {salaryGrades.map((grade) => (
                    <option key={grade._id} value={grade._id}>
                      {grade.grade}
                    </option>
                  ))}
                </select>
              </div>

              {/* Step Selector */}
              {selectedGrade &&
                (() => {
                  const grade = salaryGrades.find(
                    (g) => g._id === selectedGrade
                  );

                  if (!grade) {
                    return (
                      <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--elra-primary)]"></div>
                        <span className="ml-2 text-sm text-gray-600">
                          Loading grade data...
                        </span>
                      </div>
                    );
                  }

                  if (grade && grade.steps && grade.steps.length > 0) {
                    return (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select Step
                        </label>
                        <select
                          value={selectedStep}
                          onChange={(e) => setSelectedStep(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent cursor-pointer"
                        >
                          <option value="">Select a step</option>
                          {grade.steps.map((step) => (
                            <option key={step.step} value={step.step}>
                              {step.step} ({step.increment}% increment)
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  }

                  return (
                    <div className="text-center py-4 text-gray-500">
                      <div className="text-sm">
                        No steps configured for this grade
                      </div>
                    </div>
                  );
                })()}
            </div>
          </div>

          {/* Calculator Results */}
          <div className="bg-gradient-to-br from-white to-green-50 rounded-xl shadow-sm border border-green-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Gross Salary Breakdown
            </h2>
            {selectedGrade ? (
              <div className="space-y-3">
                {(() => {
                  const grade = salaryGrades.find(
                    (g) => g._id === selectedGrade
                  );

                  let basicSalary = grade.minGrossSalary;
                  let stepInfo = "";

                  if (selectedStep && grade.steps) {
                    const step = grade.steps.find(
                      (s) => s.step === selectedStep
                    );
                    if (step) {
                      const increment =
                        (grade.minGrossSalary * step.increment) / 100;
                      basicSalary = grade.minGrossSalary + increment;
                      stepInfo = ` (${selectedStep} - ${step.increment}% increment)`;
                    }
                  }

                  const totalGradeAllowances =
                    grade.allowances.housing +
                    grade.allowances.transport +
                    grade.allowances.meal +
                    grade.allowances.other;

                  const customAllowancesTotal = grade.customAllowances
                    ? grade.customAllowances.reduce(
                        (sum, allowance) => sum + allowance.amount,
                        0
                      )
                    : 0;

                  const grossSalary =
                    basicSalary + totalGradeAllowances + customAllowancesTotal;

                  return (
                    <>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">
                          Basic Salary{stepInfo}:
                        </span>
                        <span className="font-semibold">
                          {formatCurrency(basicSalary)}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">
                          Housing Allowance:
                        </span>
                        <span className="font-semibold">
                          {formatCurrency(grade.allowances.housing)}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">
                          Transport Allowance:
                        </span>
                        <span className="font-semibold">
                          {formatCurrency(grade.allowances.transport)}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">Meal Allowance:</span>
                        <span className="font-semibold">
                          {formatCurrency(grade.allowances.meal)}
                        </span>
                      </div>
                      {grade.allowances.other > 0 && (
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-gray-600">
                            Other Allowances:
                          </span>
                          <span className="font-semibold">
                            {formatCurrency(grade.allowances.other)}
                          </span>
                        </div>
                      )}
                      {grade.customAllowances &&
                        grade.customAllowances.length > 0 && (
                          <>
                            {grade.customAllowances.map((allowance, index) => (
                              <div
                                key={index}
                                className="flex justify-between py-2 border-b border-gray-100"
                              >
                                <span className="text-gray-600">
                                  {allowance.name}:
                                </span>
                                <span className="font-semibold">
                                  {formatCurrency(allowance.amount)}
                                </span>
                              </div>
                            ))}
                          </>
                        )}
                      <div className="flex justify-between py-3 border-t-2 border-green-500 bg-green-50 rounded-lg p-3">
                        <span className="text-lg font-semibold text-green-700">
                          Total Gross Salary:
                        </span>
                        <span className="text-lg font-bold text-green-800">
                          {formatCurrency(grossSalary)}
                        </span>
                      </div>
                    </>
                  );
                })()}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CalculatorIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Select a grade and step to see the compensation breakdown</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-white bg-opacity-95 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingGrade ? "Edit Salary Grade" : "Add New Salary Grade"}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {loading && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-xl">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--elra-primary)]"></div>
                </div>
              )}
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Grade Level *
                  </label>
                  <input
                    type="text"
                    name="grade"
                    value={formData.grade}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                    placeholder="Auto-generated level"
                    readOnly
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Grade level will be automatically generated by the system
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Grade Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
                    placeholder="e.g., Executive Level"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter a descriptive name for this grade
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  maxLength={500}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent resize-none"
                  placeholder="Brief description of this salary grade"
                  required
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Maximum 500 characters</span>
                  <span>{formData.description.length}/500</span>
                </div>
              </div>

              {/* Salary Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Basic Salary *
                  </label>
                  <input
                    type="text"
                    name="minGrossSalary"
                    value={formData.minGrossSalary}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
                    placeholder="30000"
                    required
                    inputMode="numeric"
                    pattern="[0-9,]*"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Basic Salary *
                  </label>
                  <input
                    type="text"
                    name="maxGrossSalary"
                    value={formData.maxGrossSalary}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
                    placeholder="45000"
                    required
                    inputMode="numeric"
                    pattern="[0-9,]*"
                  />
                </div>
              </div>

              {/* Allowances */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Allowances
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  💡 Leave allowance fields empty if you don't want to set any
                  amount.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Housing Allowance
                    </label>
                    <input
                      type="text"
                      name="allowances.housing"
                      value={formData.allowances.housing}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
                      placeholder="15000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Transport Allowance
                    </label>
                    <input
                      type="text"
                      name="allowances.transport"
                      value={formData.allowances.transport}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
                      placeholder="10000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Meal Allowance
                    </label>
                    <input
                      type="text"
                      name="allowances.meal"
                      value={formData.allowances.meal}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
                      placeholder="8000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Other Allowances
                    </label>
                    <input
                      type="text"
                      name="allowances.other"
                      value={formData.allowances.other}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Custom Allowances Checkbox */}
                <div className="flex items-center mt-6 mb-4">
                  <input
                    type="checkbox"
                    id="enableCustomAllowances"
                    name="enableCustomAllowances"
                    checked={formData.enableCustomAllowances}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        enableCustomAllowances: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 text-[var(--elra-primary)] focus:ring-[var(--elra-primary)] border-gray-300 rounded"
                  />
                  <label
                    htmlFor="enableCustomAllowances"
                    className="ml-2 text-lg font-medium text-gray-900"
                  >
                    Add Custom Allowances
                  </label>
                </div>

                {/* Custom Allowances Section */}
                {formData.enableCustomAllowances && (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Add custom allowances with specific names and amounts.
                    </p>
                    {formData.customAllowances.map((allowance, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Allowance Name
                          </label>
                          <input
                            type="text"
                            value={allowance.name}
                            onChange={(e) =>
                              handleCustomAllowanceChange(
                                index,
                                "name",
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
                            placeholder="e.g., Entertainment"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Amount
                          </label>
                          <input
                            type="text"
                            value={allowance.amount}
                            onChange={(e) =>
                              handleCustomAllowanceChange(
                                index,
                                "amount",
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
                            placeholder="5000"
                          />
                        </div>
                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={() => removeCustomAllowance(index)}
                            className="px-3 py-2 text-red-600 hover:text-red-800 transition-colors duration-200 cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addCustomAllowance}
                      className="px-4 py-2 text-[var(--elra-primary)] border border-[var(--elra-primary)] rounded-lg hover:bg-[var(--elra-primary)] hover:text-white transition-colors duration-200 cursor-pointer"
                    >
                      + Add Custom Allowance
                    </button>
                  </div>
                )}
              </div>

              {/* Steps Management */}
              <div>
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    id="enableSteps"
                    name="enableSteps"
                    checked={formData.enableSteps}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        enableSteps: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 text-[var(--elra-primary)] focus:ring-[var(--elra-primary)] border-gray-300 rounded"
                  />
                  <label
                    htmlFor="enableSteps"
                    className="ml-2 text-lg font-medium text-gray-900"
                  >
                    Enable Salary Steps
                  </label>
                </div>

                {formData.enableSteps && (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Configure salary steps based on years of service. Each
                      step increases the base salary by a percentage.
                    </p>

                    {(formData.steps || []).map((step, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Step Name
                          </label>
                          <input
                            type="text"
                            value={step.step}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                            placeholder="Auto-generated"
                            readOnly
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Increment (%)
                          </label>
                          <input
                            type="text"
                            value={step.increment}
                            onChange={(e) =>
                              handleStepChange(
                                index,
                                "increment",
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
                            placeholder="5"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Years of Service
                          </label>
                          <input
                            type="text"
                            value={step.yearsOfService}
                            onChange={(e) =>
                              handleStepChange(
                                index,
                                "yearsOfService",
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
                            placeholder="2"
                          />
                        </div>
                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={() => removeStep(index)}
                            className="px-3 py-2 text-red-600 hover:text-red-800 transition-colors duration-200 cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={addStep}
                      className="px-4 py-2 text-[var(--elra-primary)] border border-[var(--elra-primary)] rounded-lg hover:bg-[var(--elra-primary)] hover:text-white transition-colors duration-200 cursor-pointer"
                    >
                      + Add Step
                    </button>
                  </div>
                )}
              </div>

              {/* Role Mapping */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Choose Role *
                </label>
                <select
                  value={formData.selectedRole}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      selectedRole: e.target.value,
                    }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent [&>option]:text-gray-900 [&>option]:bg-white cursor-pointer"
                  required
                >
                  <option value="">Choose role</option>
                  {roles.map((role) => (
                    <option key={role._id} value={role._id}>
                      {role.name.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Select a role to map to this salary grade. One role per salary
                  grade.
                </p>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingGrade(null);
                    resetForm();
                  }}
                  disabled={loading}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors duration-200 disabled:opacity-50 flex items-center cursor-pointer"
                >
                  {loading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  )}
                  {loading
                    ? "Saving..."
                    : editingGrade
                    ? "Update Grade"
                    : "Create Grade"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-white bg-opacity-95 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-center mb-4">
                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                  <svg
                    className="h-8 w-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                Delete Salary Grade
              </h3>
              <p className="text-gray-600 text-center mb-6">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-gray-900">
                  "{deleteTarget?.name}"
                </span>
                ?
                <br />
                <span className="text-sm text-red-600">
                  This action cannot be undone and will affect any users
                  assigned to this salary grade.
                </span>
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteTarget(null);
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 flex items-center justify-center cursor-pointer"
                >
                  {loading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  )}
                  {loading ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalaryGradeManagement;
