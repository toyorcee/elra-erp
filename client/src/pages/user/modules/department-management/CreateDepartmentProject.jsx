import React from "react";
import { useAuth } from "../../../../context/AuthContext";

const CreateDepartmentProject = () => {
  const { user } = useAuth();

  console.log("🚀 [CreateDepartmentProject] Component loaded!");
  console.log("🚀 [CreateDepartmentProject] User:", user);
  console.log(
    "🚀 [CreateDepartmentProject] User role level:",
    user?.role?.level
  );
  console.log(
    "🚀 [CreateDepartmentProject] User department:",
    user?.department?.name
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Create Department Project
        </h1>
        <p className="text-gray-600">
          This is a test page to see if the component loads correctly.
        </p>
        <div className="mt-4 p-4 bg-white rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">User Info:</h2>
          <p>
            Name: {user?.firstName} {user?.lastName}
          </p>
          <p>Email: {user?.email}</p>
          <p>Role Level: {user?.role?.level}</p>
          <p>Department: {user?.department?.name}</p>
        </div>
      </div>
    </div>
  );
};

export default CreateDepartmentProject;
