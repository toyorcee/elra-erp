import React, { useState } from "react";
import { useAuth } from "../../../../context/AuthContext";
import {
  CurrencyDollarIcon,
  ChartBarIcon,
  CalculatorIcon,
  DocumentTextIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

const SalaryGradeManagement = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("grades");

  // Comprehensive Salary Grade System
  const salaryGrades = [
    {
      grade: "1",
      name: "Grade 1",
      minSalary: 30000,
      maxSalary: 45000,
      description: "Entry Level",
      positions: ["Office Assistant", "Cleaner", "Security Guard"],
      allowances: { housing: 15000, transport: 10000, meal: 8000 },
    },
    {
      grade: "2",
      name: "Grade 2",
      minSalary: 45000,
      maxSalary: 60000,
      description: "Junior Staff",
      positions: ["Clerk", "Receptionist", "Driver"],
      allowances: { housing: 20000, transport: 12000, meal: 10000 },
    },
    {
      grade: "3",
      name: "Grade 3",
      minSalary: 60000,
      maxSalary: 80000,
      description: "Senior Staff",
      positions: ["Administrative Officer", "Accountant", "IT Support"],
      allowances: { housing: 25000, transport: 15000, meal: 12000 },
    },
    {
      grade: "4",
      name: "Grade 4",
      minSalary: 80000,
      maxSalary: 100000,
      description: "Assistant Manager",
      positions: ["Assistant Manager", "Senior Accountant", "System Analyst"],
      allowances: { housing: 30000, transport: 18000, meal: 15000 },
    },
    {
      grade: "5",
      name: "Grade 5",
      minSalary: 100000,
      maxSalary: 130000,
      description: "Manager",
      positions: ["Manager", "Senior Analyst", "Team Lead"],
      allowances: { housing: 40000, transport: 25000, meal: 20000 },
    },
    {
      grade: "6",
      name: "Grade 6",
      minSalary: 130000,
      maxSalary: 160000,
      description: "Senior Manager",
      positions: ["Senior Manager", "Department Head", "Project Manager"],
      allowances: { housing: 50000, transport: 30000, meal: 25000 },
    },
    {
      grade: "7",
      name: "Grade 7",
      minSalary: 160000,
      maxSalary: 200000,
      description: "Assistant Director",
      positions: ["Assistant Director", "Senior Project Manager"],
      allowances: { housing: 60000, transport: 35000, meal: 30000 },
    },
    {
      grade: "8",
      name: "Grade 8",
      minSalary: 200000,
      maxSalary: 250000,
      description: "Deputy Director",
      positions: ["Deputy Director", "Head of Department"],
      allowances: { housing: 75000, transport: 40000, meal: 35000 },
    },
    {
      grade: "9",
      name: "Grade 9",
      minSalary: 250000,
      maxSalary: 300000,
      description: "Director",
      positions: ["Director", "Chief Officer"],
      allowances: { housing: 90000, transport: 50000, meal: 40000 },
    },
    {
      grade: "10",
      name: "Grade 10",
      minSalary: 300000,
      maxSalary: 400000,
      description: "Executive Director",
      positions: ["Executive Director", "Chief Executive"],
      allowances: { housing: 120000, transport: 60000, meal: 50000 },
    },
  ];

  const salarySteps = [
    { step: "1", name: "Step 1", increment: 0, years: 0 },
    { step: "2", name: "Step 2", increment: 5, years: 2 },
    { step: "3", name: "Step 3", increment: 10, years: 4 },
    { step: "4", name: "Step 4", increment: 15, years: 6 },
    { step: "5", name: "Step 5", increment: 20, years: 8 },
  ];

  const calculateSalary = (grade, step) => {
    const gradeData = salaryGrades.find((g) => g.grade === grade);
    const stepData = salarySteps.find((s) => s.step === step);

    if (!gradeData || !stepData) return 0;

    const baseSalary = gradeData.minSalary;
    const increment = (baseSalary * stepData.increment) / 100;
    return baseSalary + increment;
  };

  const calculateTotalCompensation = (grade, step) => {
    const gradeData = salaryGrades.find((g) => g.grade === grade);
    const baseSalary = calculateSalary(grade, step);
    const allowances = gradeData.allowances;

    return {
      baseSalary,
      housing: allowances.housing,
      transport: allowances.transport,
      meal: allowances.meal,
      total:
        baseSalary +
        allowances.housing +
        allowances.transport +
        allowances.meal,
    };
  };

  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--elra-text-primary)] mb-2">
          Salary Grade Management
        </h1>
        <p className="text-[var(--elra-text-secondary)]">
          Manage salary grades, steps, and compensation structure
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: "grades", name: "Salary Grades", icon: CurrencyDollarIcon },
              {
                id: "calculator",
                name: "Salary Calculator",
                icon: CalculatorIcon,
              },
              {
                id: "structure",
                name: "Compensation Structure",
                icon: ChartBarIcon,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.id
                    ? "border-[var(--elra-primary)] text-[var(--elra-primary)]"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "grades" && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Salary Grade Structure
              </h2>
              <button className="inline-flex items-center px-3 py-2 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors">
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Grade
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Salary Range
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Positions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Allowances
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {salaryGrades.map((grade) => (
                  <tr key={grade.grade} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-[var(--elra-secondary-3)] flex items-center justify-center">
                          <span className="text-sm font-medium text-[var(--elra-primary)]">
                            {grade.grade}
                          </span>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {grade.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {grade.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>₦{grade.minSalary.toLocaleString()}</div>
                      <div className="text-gray-500">
                        to ₦{grade.maxSalary.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="space-y-1">
                        {grade.positions.slice(0, 2).map((position, index) => (
                          <div
                            key={index}
                            className="text-xs bg-gray-100 px-2 py-1 rounded"
                          >
                            {position}
                          </div>
                        ))}
                        {grade.positions.length > 2 && (
                          <div className="text-xs text-gray-500">
                            +{grade.positions.length - 2} more
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="space-y-1">
                        <div className="text-xs">
                          Housing: ₦{grade.allowances.housing.toLocaleString()}
                        </div>
                        <div className="text-xs">
                          Transport: ₦
                          {grade.allowances.transport.toLocaleString()}
                        </div>
                        <div className="text-xs">
                          Meal: ₦{grade.allowances.meal.toLocaleString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button className="text-blue-600 hover:text-blue-800">
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-800">
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "calculator" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Salary Calculator */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Salary Calculator
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Grade
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent">
                  {salaryGrades.map((grade) => (
                    <option key={grade.grade} value={grade.grade}>
                      {grade.name} - {grade.description}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Step
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent">
                  {salarySteps.map((step) => (
                    <option key={step.step} value={step.step}>
                      {step.name} ({step.years} years experience)
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  Salary Breakdown
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Base Salary:</span>
                    <span className="font-medium">₦350,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Housing Allowance:</span>
                    <span className="font-medium">₦50,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Transport Allowance:</span>
                    <span className="font-medium">₦30,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Meal Allowance:</span>
                    <span className="font-medium">₦25,000</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-semibold">
                    <span>Total Compensation:</span>
                    <span>₦455,000</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step Progression */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Step Progression
            </h2>

            <div className="space-y-3">
              {salarySteps.map((step) => (
                <div
                  key={step.step}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <div className="font-medium text-gray-900">{step.name}</div>
                    <div className="text-sm text-gray-500">
                      {step.years} years experience required
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-[var(--elra-primary)]">
                      +{step.increment}%
                    </div>
                    <div className="text-sm text-gray-500">increment</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-medium text-blue-900 mb-2">
                Progression Rules
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Automatic step progression every 2 years</li>
                <li>• Performance review required for step advancement</li>
                <li>• Maximum 5 steps per grade</li>
                <li>• Grade promotion requires position change</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {activeTab === "structure" && (
        <div className="space-y-6">
          {/* Compensation Overview */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Compensation Structure Overview
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  ₦455,000
                </div>
                <div className="text-sm text-green-700">
                  Average Total Compensation
                </div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">10</div>
                <div className="text-sm text-blue-700">Salary Grades</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">5</div>
                <div className="text-sm text-purple-700">Steps per Grade</div>
              </div>
            </div>
          </div>

          {/* Benefits Structure */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Benefits & Allowances
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-3">
                  Standard Allowances
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Housing Allowance:</span>
                    <span className="font-medium">15,000 - 120,000</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Transport Allowance:</span>
                    <span className="font-medium">10,000 - 60,000</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Meal Allowance:</span>
                    <span className="font-medium">8,000 - 50,000</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-md font-medium text-gray-900 mb-3">
                  Additional Benefits
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Health Insurance Coverage
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Pension Contribution (8% + 10%)
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Annual Leave (21 days)
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Performance Bonus
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalaryGradeManagement;
