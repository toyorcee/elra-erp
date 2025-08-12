import React from "react";
import { useAuth } from "../../../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  UserPlusIcon,
  BriefcaseIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";

const EmployeeOnboardingGuide = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const onboardingScenarios = [
    {
      id: "existing",
      title: "Existing Employee Onboarding",
      description: "Employee already works here, needs system access",
      icon: UserPlusIcon,
      steps: [
        "Employee already works in the organization",
        "HR adds employee to system via 'Add Employee'",
        "Select 'Existing Employee' type",
        "Fill in employee details and assign role",
        "System sends invitation email automatically",
        "Employee registers with invitation code",
        "Employee gets access to assigned modules",
      ],
      action: {
        label: "Add Existing Employee",
        path: "/dashboard/modules/hr/employees/add",
        color: "bg-[var(--elra-primary)] hover:bg-[var(--elra-primary-dark)]",
      },
    },
    {
      id: "new",
      title: "New Position Recruitment",
      description: "Department needs new role, full recruitment process",
      icon: BriefcaseIcon,
      steps: [
        "Department head creates position request",
        "HR reviews and approves the request",
        "HR creates employee profile from approved request",
        "Select 'New Hire' type in Add Employee",
        "System sends invitation email automatically",
        "New employee registers with invitation code",
        "Employee gets access to assigned modules",
      ],
      action: {
        label: "Create Position Request",
        path: "/dashboard/modules/hr/recruitment/requests",
        color: "bg-blue-600 hover:bg-blue-700",
      },
    },
  ];

  const handleNavigate = (path) => {
    navigate(path);
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--elra-text-primary)] mb-2">
          Employee Onboarding Guide
        </h1>
        <p className="text-[var(--elra-text-secondary)]">
          Choose the appropriate onboarding process for your situation
        </p>
      </div>

      {/* Onboarding Scenarios */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {onboardingScenarios.map((scenario) => (
          <div
            key={scenario.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            {/* Scenario Header */}
            <div className="flex items-start mb-6">
              <div className="h-12 w-12 rounded-full bg-[var(--elra-secondary-3)] flex items-center justify-center mr-4">
                <scenario.icon className="h-6 w-6 text-[var(--elra-primary)]" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-1">
                  {scenario.title}
                </h2>
                <p className="text-gray-600">{scenario.description}</p>
              </div>
            </div>

            {/* Steps */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3 uppercase tracking-wide">
                Process Steps:
              </h3>
              <ol className="space-y-2">
                {scenario.steps.map((step, index) => (
                  <li key={index} className="flex items-start">
                    <span className="flex-shrink-0 h-6 w-6 rounded-full bg-[var(--elra-primary)] text-white text-xs font-medium flex items-center justify-center mr-3 mt-0.5">
                      {index + 1}
                    </span>
                    <span className="text-sm text-gray-700">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Action Button */}
            <button
              onClick={() => handleNavigate(scenario.action.path)}
              className={`w-full ${scenario.action.color} text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center justify-center`}
            >
              <ArrowRightIcon className="h-4 w-4 mr-2" />
              {scenario.action.label}
            </button>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => handleNavigate("/dashboard/modules/hr/employees")}
            className="flex items-center p-4 bg-white rounded-lg border border-gray-200 hover:border-[var(--elra-primary)] transition-colors"
          >
            <UserPlusIcon className="h-5 w-5 text-[var(--elra-primary)] mr-3" />
            <div className="text-left">
              <div className="font-medium text-gray-900">
                Employee Directory
              </div>
              <div className="text-sm text-gray-500">View all employees</div>
            </div>
          </button>

          <button
            onClick={() =>
              handleNavigate("/dashboard/modules/hr/employees/add")
            }
            className="flex items-center p-4 bg-white rounded-lg border border-gray-200 hover:border-[var(--elra-primary)] transition-colors"
          >
            <EnvelopeIcon className="h-5 w-5 text-[var(--elra-primary)] mr-3" />
            <div className="text-left">
              <div className="font-medium text-gray-900">Send Invitation</div>
              <div className="text-sm text-gray-500">Add employee & invite</div>
            </div>
          </button>

          <button
            onClick={() =>
              handleNavigate("/dashboard/modules/hr/recruitment/requests")
            }
            className="flex items-center p-4 bg-white rounded-lg border border-gray-200 hover:border-[var(--elra-primary)] transition-colors"
          >
            <BriefcaseIcon className="h-5 w-5 text-[var(--elra-primary)] mr-3" />
            <div className="text-left">
              <div className="font-medium text-gray-900">Position Requests</div>
              <div className="text-sm text-gray-500">Manage new positions</div>
            </div>
          </button>
        </div>
      </div>

      {/* Key Points */}
      <div className="mt-8 bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
          <CheckCircleIcon className="h-5 w-5 mr-2" />
          Key Points
        </h3>
        <ul className="space-y-2 text-blue-800">
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            <span>
              Both scenarios use the same invitation system for consistency
            </span>
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            <span>
              Role-based permissions are automatically assigned during
              onboarding
            </span>
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            <span>
              Employees receive email invitations with secure registration codes
            </span>
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            <span>HODs can manage employees within their department only</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default EmployeeOnboardingGuide;
