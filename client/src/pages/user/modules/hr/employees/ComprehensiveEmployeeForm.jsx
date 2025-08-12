import React, { useState } from "react";
import { useAuth } from "../../../../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  UserIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

const ComprehensiveEmployeeForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("personal");

  const formSections = [
    {
      id: "personal",
      name: "Personal Information",
      icon: UserIcon,
      description: "Basic personal and contact details",
    },
    {
      id: "employment",
      name: "Employment Details",
      icon: BriefcaseIcon,
      description: "Job position and employment terms",
    },
    {
      id: "education",
      name: "Education & Skills",
      icon: AcademicCapIcon,
      description: "Educational background and skills",
    },
    {
      id: "compensation",
      name: "Compensation & Benefits",
      icon: CurrencyDollarIcon,
      description: "Salary, allowances and benefits",
    },
    {
      id: "performance",
      name: "Performance & Career",
      icon: ChartBarIcon,
      description: "Performance reviews and career path",
    },
    {
      id: "leave",
      name: "Leave & Attendance",
      icon: CalendarIcon,
      description: "Leave balances and work schedule",
    },
    {
      id: "documents",
      name: "Documents & Compliance",
      icon: DocumentTextIcon,
      description: "Required documents and compliance",
    },
    {
      id: "security",
      name: "Security & Access",
      icon: ShieldCheckIcon,
      description: "System access and security clearance",
    },
  ];

  const metadataFields = {
    personal: [
      { name: "firstName", label: "First Name", type: "text", required: true },
      { name: "lastName", label: "Last Name", type: "text", required: true },
      {
        name: "middleName",
        label: "Middle Name",
        type: "text",
        required: false,
      },
      { name: "email", label: "Email Address", type: "email", required: true },
      { name: "phone", label: "Phone Number", type: "tel", required: true },
      {
        name: "dateOfBirth",
        label: "Date of Birth",
        type: "date",
        required: true,
      },
      {
        name: "gender",
        label: "Gender",
        type: "select",
        options: ["Male", "Female", "Other"],
        required: true,
      },
      {
        name: "nationality",
        label: "Nationality",
        type: "text",
        required: true,
      },
      {
        name: "nationalId",
        label: "National ID Number",
        type: "text",
        required: true,
      },
      {
        name: "passportNumber",
        label: "Passport Number",
        type: "text",
        required: false,
      },
      { name: "taxId", label: "Tax ID Number", type: "text", required: true },
      {
        name: "address",
        label: "Residential Address",
        type: "textarea",
        required: true,
      },
      {
        name: "emergencyContact",
        label: "Emergency Contact",
        type: "object",
        fields: [
          { name: "name", label: "Contact Name", type: "text" },
          { name: "relationship", label: "Relationship", type: "text" },
          { name: "phone", label: "Contact Phone", type: "tel" },
          { name: "address", label: "Contact Address", type: "textarea" },
        ],
      },
    ],
    employment: [
      {
        name: "employeeId",
        label: "Employee ID",
        type: "text",
        required: true,
      },
      {
        name: "staffNumber",
        label: "Staff Number",
        type: "text",
        required: true,
      },
      {
        name: "employmentType",
        label: "Employment Type",
        type: "select",
        options: ["Full-time", "Part-time", "Contract", "Intern"],
        required: true,
      },
      { name: "jobTitle", label: "Job Title", type: "text", required: true },
      {
        name: "department",
        label: "Department",
        type: "select",
        options: ["HR", "IT", "Finance", "Marketing", "Operations"],
        required: true,
      },
      {
        name: "reportingTo",
        label: "Reports To",
        type: "select",
        options: ["Manager", "Director", "CEO"],
        required: true,
      },
      { name: "hireDate", label: "Hire Date", type: "date", required: true },
      {
        name: "probationEndDate",
        label: "Probation End Date",
        type: "date",
        required: false,
      },
      {
        name: "contractEndDate",
        label: "Contract End Date",
        type: "date",
        required: false,
      },
      {
        name: "employmentStatus",
        label: "Employment Status",
        type: "select",
        options: ["Active", "On Leave", "Suspended", "Terminated"],
        required: true,
      },
      {
        name: "workLocation",
        label: "Work Location",
        type: "text",
        required: true,
      },
      {
        name: "workSchedule",
        label: "Work Schedule",
        type: "select",
        options: ["Monday-Friday", "Shift Work", "Flexible"],
        required: true,
      },
    ],
    education: [
      {
        name: "highestQualification",
        label: "Highest Qualification",
        type: "select",
        options: ["High School", "Diploma", "Bachelor's", "Master's", "PhD"],
        required: true,
      },
      {
        name: "institution",
        label: "Institution",
        type: "text",
        required: true,
      },
      {
        name: "graduationYear",
        label: "Graduation Year",
        type: "number",
        required: true,
      },
      {
        name: "fieldOfStudy",
        label: "Field of Study",
        type: "text",
        required: true,
      },
      {
        name: "technicalSkills",
        label: "Technical Skills",
        type: "textarea",
        required: false,
      },
      {
        name: "languages",
        label: "Languages Spoken",
        type: "textarea",
        required: false,
      },
      {
        name: "certifications",
        label: "Professional Certifications",
        type: "textarea",
        required: false,
      },
      {
        name: "yearsOfExperience",
        label: "Years of Experience",
        type: "number",
        required: true,
      },
      {
        name: "previousEmployer",
        label: "Previous Employer",
        type: "text",
        required: false,
      },
    ],
    compensation: [
      {
        name: "salaryGrade",
        label: "Salary Grade",
        type: "select",
        options: ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5"],
        required: true,
      },
      {
        name: "salaryStep",
        label: "Salary Step",
        type: "select",
        options: ["Step 1", "Step 2", "Step 3", "Step 4", "Step 5"],
        required: true,
      },
      {
        name: "baseSalary",
        label: "Base Salary",
        type: "number",
        required: true,
      },
      {
        name: "housingAllowance",
        label: "Housing Allowance",
        type: "number",
        required: true,
      },
      {
        name: "transportAllowance",
        label: "Transport Allowance",
        type: "number",
        required: true,
      },
      {
        name: "mealAllowance",
        label: "Meal Allowance",
        type: "number",
        required: true,
      },
      { name: "bankName", label: "Bank Name", type: "text", required: true },
      {
        name: "accountNumber",
        label: "Account Number",
        type: "text",
        required: true,
      },
      {
        name: "accountName",
        label: "Account Name",
        type: "text",
        required: true,
      },
      {
        name: "pensionNumber",
        label: "Pension Number",
        type: "text",
        required: true,
      },
      {
        name: "healthInsurance",
        label: "Health Insurance",
        type: "select",
        options: ["Yes", "No"],
        required: true,
      },
    ],
    performance: [
      {
        name: "lastReviewDate",
        label: "Last Performance Review",
        type: "date",
        required: false,
      },
      {
        name: "performanceRating",
        label: "Performance Rating",
        type: "select",
        options: ["Excellent", "Good", "Average", "Below Average", "Poor"],
        required: false,
      },
      {
        name: "nextReviewDate",
        label: "Next Review Date",
        type: "date",
        required: false,
      },
      {
        name: "careerGoals",
        label: "Career Goals",
        type: "textarea",
        required: false,
      },
      {
        name: "trainingNeeds",
        label: "Training Needs",
        type: "textarea",
        required: false,
      },
      {
        name: "promotionEligibility",
        label: "Promotion Eligibility",
        type: "select",
        options: ["Eligible", "Not Eligible", "Under Review"],
        required: false,
      },
      {
        name: "directReports",
        label: "Number of Direct Reports",
        type: "number",
        required: false,
      },
    ],
    leave: [
      {
        name: "annualLeaveBalance",
        label: "Annual Leave Balance",
        type: "number",
        required: true,
      },
      {
        name: "sickLeaveBalance",
        label: "Sick Leave Balance",
        type: "number",
        required: true,
      },
      {
        name: "maternityLeaveBalance",
        label: "Maternity Leave Balance",
        type: "number",
        required: false,
      },
      {
        name: "paternityLeaveBalance",
        label: "Paternity Leave Balance",
        type: "number",
        required: false,
      },
      {
        name: "overtimeEligible",
        label: "Overtime Eligible",
        type: "select",
        options: ["Yes", "No"],
        required: true,
      },
      {
        name: "remoteWorkEligible",
        label: "Remote Work Eligible",
        type: "select",
        options: ["Yes", "No"],
        required: true,
      },
      {
        name: "workFromHomeDays",
        label: "Work From Home Days",
        type: "number",
        required: false,
      },
    ],
    documents: [
      {
        name: "employmentContract",
        label: "Employment Contract",
        type: "file",
        required: true,
      },
      {
        name: "idDocument",
        label: "ID Document",
        type: "file",
        required: true,
      },
      {
        name: "educationalCertificate",
        label: "Educational Certificate",
        type: "file",
        required: true,
      },
      {
        name: "professionalLicense",
        label: "Professional License",
        type: "file",
        required: false,
      },
      {
        name: "workPermit",
        label: "Work Permit",
        type: "file",
        required: false,
      },
      {
        name: "referenceCheck",
        label: "Reference Check Completed",
        type: "select",
        options: ["Yes", "No", "Pending"],
        required: true,
      },
      {
        name: "backgroundCheck",
        label: "Background Check Completed",
        type: "select",
        options: ["Yes", "No", "Pending"],
        required: true,
      },
    ],
    security: [
      {
        name: "systemAccess",
        label: "System Access Level",
        type: "select",
        options: ["Basic", "Standard", "Advanced", "Admin"],
        required: true,
      },
      {
        name: "securityClearance",
        label: "Security Clearance",
        type: "select",
        options: ["None", "Basic", "Confidential", "Secret", "Top Secret"],
        required: true,
      },
      {
        name: "accessCardNumber",
        label: "Access Card Number",
        type: "text",
        required: true,
      },
      {
        name: "buildingAccess",
        label: "Building Access",
        type: "select",
        options: ["Main Building", "All Buildings", "Restricted Areas"],
        required: true,
      },
      {
        name: "itEquipment",
        label: "IT Equipment Assigned",
        type: "textarea",
        required: false,
      },
    ],
  };

  const renderField = (field) => {
    switch (field.type) {
      case "text":
      case "email":
      case "tel":
      case "number":
        return (
          <input
            type={field.type}
            name={field.name}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
            placeholder={`Enter ${field.label.toLowerCase()}`}
          />
        );
      case "date":
        return (
          <input
            type="date"
            name={field.name}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
          />
        );
      case "select":
        return (
          <select
            name={field.name}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
          >
            <option value="">Select {field.label}</option>
            {field.options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
      case "textarea":
        return (
          <textarea
            name={field.name}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
            placeholder={`Enter ${field.label.toLowerCase()}`}
          />
        );
      case "file":
        return (
          <input
            type="file"
            name={field.name}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--elra-text-primary)] mb-2">
          Comprehensive Employee Profile
        </h1>
        <p className="text-[var(--elra-text-secondary)]">
          Complete employee metadata for comprehensive staff management
        </p>
      </div>

      {/* Section Navigation */}
      <div className="mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {formSections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`p-4 rounded-lg border-2 transition-colors ${
                activeSection === section.id
                  ? "border-[var(--elra-primary)] bg-[var(--elra-primary)] text-white"
                  : "border-gray-200 bg-white hover:border-[var(--elra-primary)]"
              }`}
            >
              <section.icon className="h-6 w-6 mx-auto mb-2" />
              <div className="text-sm font-medium">{section.name}</div>
              <div className="text-xs opacity-75">{section.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {formSections.find((s) => s.id === activeSection)?.name}
          </h2>
          <p className="text-gray-600">
            {formSections.find((s) => s.id === activeSection)?.description}
          </p>
        </div>

        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {metadataFields[activeSection]?.map((field) => (
              <div
                key={field.name}
                className={field.type === "textarea" ? "md:col-span-2" : ""}
              >
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {field.label}{" "}
                  {field.required && <span className="text-red-500">*</span>}
                </label>
                {renderField(field)}
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={() => navigate("/dashboard/modules/hr/employees")}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-[var(--elra-primary)] text-white rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors"
            >
              Save Employee Profile
            </button>
          </div>
        </form>
      </div>

      {/* Metadata Summary */}
      <div className="mt-8 bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">
          Employee Metadata Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <h4 className="font-medium mb-2">Personal & Employment:</h4>
            <ul className="space-y-1">
              <li>• Personal Information (12 fields)</li>
              <li>• Employment Details (12 fields)</li>
              <li>• Education & Skills (9 fields)</li>
              <li>• Compensation & Benefits (11 fields)</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Management & Compliance:</h4>
            <ul className="space-y-1">
              <li>• Performance & Career (7 fields)</li>
              <li>• Leave & Attendance (7 fields)</li>
              <li>• Documents & Compliance (7 fields)</li>
              <li>• Security & Access (5 fields)</li>
            </ul>
          </div>
        </div>
        <div className="mt-4 p-3 bg-blue-100 rounded">
          <p className="text-sm text-blue-900">
            <strong>Total:</strong> 70+ metadata fields for comprehensive
            employee management
          </p>
        </div>
      </div>
    </div>
  );
};

export default ComprehensiveEmployeeForm;
