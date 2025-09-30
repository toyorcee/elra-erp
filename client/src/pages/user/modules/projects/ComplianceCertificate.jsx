import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CheckCircleIcon,
  DocumentTextIcon,
  PrinterIcon,
  ArrowLeftIcon,
  ShieldCheckIcon,
  CalendarIcon,
  UserIcon,
  BuildingOfficeIcon,
} from "@heroicons/react/24/outline";
import { FaCertificate, FaStamp, FaSignature } from "react-icons/fa";

const ComplianceCertificate = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [certificateData, setCertificateData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCertificateData();
  }, [projectId]);

  const fetchCertificateData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/projects/${projectId}/compliance-certificate`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setCertificateData(data.data);
      } else {
        setError(data.message);
      }
    } catch (err) {
      console.error("Error fetching certificate data:", err);
      setError("Failed to load certificate data");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    try {
      const response = await fetch(
        `/api/projects/${projectId}/compliance-certificate`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ELRA-Compliance-Certificate-${projectId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        console.error("Failed to download PDF");
      }
    } catch (error) {
      console.error("Error downloading PDF:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading certificate...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!certificateData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 text-6xl mb-4">📄</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            No Certificate Data
          </h2>
          <p className="text-gray-600 mb-4">Certificate data not available</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* Header */}
      <div className="max-w-4xl mx-auto px-4 mb-8">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Project
          </button>
          <div className="flex space-x-3">
            <button
              onClick={handlePrint}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PrinterIcon className="h-4 w-4 mr-2" />
              Print
            </button>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <DocumentTextIcon className="h-4 w-4 mr-2" />
              Download PDF
            </button>
          </div>
        </div>
      </div>

      {/* Certificate */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto px-4"
      >
        {/* Certificate Background */}
        <div className="bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100 border-4 border-amber-300 rounded-3xl p-12 shadow-2xl relative overflow-hidden print:shadow-none print:border-2">
          {/* Decorative Border Pattern */}
          <div className="absolute inset-6 border-2 border-amber-400 rounded-2xl opacity-30"></div>
          <div className="absolute inset-8 border border-amber-500 rounded-xl opacity-20"></div>

          {/* Corner Decorations */}
          <div className="absolute top-6 left-6 w-12 h-12 border-l-4 border-t-4 border-amber-600 rounded-tl-lg"></div>
          <div className="absolute top-6 right-6 w-12 h-12 border-r-4 border-t-4 border-amber-600 rounded-tr-lg"></div>
          <div className="absolute bottom-6 left-6 w-12 h-12 border-l-4 border-b-4 border-amber-600 rounded-bl-lg"></div>
          <div className="absolute bottom-6 right-6 w-12 h-12 border-r-4 border-b-4 border-amber-600 rounded-br-lg"></div>

          {/* Certificate Header */}
          <div className="text-center mb-12 relative z-10">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full mb-6 shadow-lg">
              <FaCertificate className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-amber-900 mb-4 tracking-wide">
              {certificateData.project.projectScope === "external" &&
              certificateData.complianceProgram
                ? "COMPLIANCE CERTIFICATE"
                : "PROJECT COMPLETION CERTIFICATE"}
            </h1>
            <div className="w-32 h-1 bg-gradient-to-r from-amber-500 to-amber-600 mx-auto rounded-full"></div>
            <p className="text-amber-800 font-semibold mt-4 text-xl">
              ELRA Regulatory Compliance Program
            </p>
            <p className="text-amber-700 text-sm mt-2">
              Certificate No: {certificateData.certificate.number}
            </p>
          </div>

          {/* Certificate Content */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 mb-8 shadow-lg border border-amber-200">
            {/* Project Information */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {certificateData.project.name}
              </h2>
              <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full text-lg font-bold shadow-lg">
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                {certificateData.project.projectScope === "external" &&
                certificateData.complianceProgram
                  ? "FULLY COMPLIANT"
                  : "PROJECT APPROVED"}
              </div>
            </div>

            {/* Project Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
                <div className="flex items-center mb-3">
                  <BuildingOfficeIcon className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="font-bold text-blue-900 uppercase tracking-wide">
                    Project Code
                  </span>
                </div>
                <p className="text-gray-800 font-semibold text-lg">
                  {certificateData.project.code}
                </p>
              </div>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
                <div className="flex items-center mb-3">
                  <CalendarIcon className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="font-bold text-blue-900 uppercase tracking-wide">
                    Project Duration
                  </span>
                </div>
                <p className="text-gray-800 font-semibold text-lg">
                  {new Date(
                    certificateData.project.startDate
                  ).toLocaleDateString()}{" "}
                  -{" "}
                  {new Date(
                    certificateData.project.endDate
                  ).toLocaleDateString()}
                </p>
              </div>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
                <div className="flex items-center mb-3">
                  <UserIcon className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="font-bold text-blue-900 uppercase tracking-wide">
                    Project Manager
                  </span>
                </div>
                <p className="text-gray-800 font-semibold text-lg">
                  {certificateData.project.projectManager.firstName}{" "}
                  {certificateData.project.projectManager.lastName}
                </p>
              </div>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
                <div className="flex items-center mb-3">
                  <ShieldCheckIcon className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="font-bold text-blue-900 uppercase tracking-wide">
                    Department
                  </span>
                </div>
                <p className="text-gray-800 font-semibold text-lg">
                  {certificateData.project.department.name}
                </p>
              </div>
            </div>

            {/* Compliance Program Information - Only for External Projects */}
            {certificateData.project.projectScope === "external" &&
              certificateData.complianceProgram && (
                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-6 rounded-xl border border-amber-200 mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                    Attached Compliance Program
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="font-bold text-amber-900 uppercase tracking-wide text-sm">
                        Program Name
                      </span>
                      <p className="text-gray-800 font-semibold text-lg">
                        {certificateData.complianceProgram.name}
                      </p>
                    </div>
                    <div>
                      <span className="font-bold text-amber-900 uppercase tracking-wide text-sm">
                        Category
                      </span>
                      <p className="text-gray-800 font-semibold text-lg">
                        {certificateData.complianceProgram.category}
                      </p>
                    </div>
                    <div>
                      <span className="font-bold text-amber-900 uppercase tracking-wide text-sm">
                        Status
                      </span>
                      <p className="text-gray-800 font-semibold text-lg">
                        {certificateData.complianceProgram.status}
                      </p>
                    </div>
                    <div>
                      <span className="font-bold text-amber-900 uppercase tracking-wide text-sm">
                        Priority
                      </span>
                      <p className="text-gray-800 font-semibold text-lg">
                        {certificateData.complianceProgram.priority}
                      </p>
                    </div>
                  </div>
                </div>
              )}

            {/* Compliance Items Verification - Only for External Projects */}
            {certificateData.project.projectScope === "external" &&
              certificateData.complianceProgram &&
              certificateData.complianceItems.length > 0 && (
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-amber-200">
                  <div className="text-center mb-6">
                    <h4 className="text-2xl font-bold text-gray-900 mb-2">
                      COMPLIANCE ITEMS VERIFICATION
                    </h4>
                    <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full text-sm font-bold">
                      {certificateData.complianceItems.length} Items • All
                      Compliant
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {certificateData.complianceItems.map((item, index) => (
                      <div
                        key={index}
                        className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200 shadow-sm"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3">
                                <CheckCircleIcon className="h-4 w-4 text-white" />
                              </div>
                              <h6 className="font-bold text-gray-900 text-sm">
                                {item.title}
                              </h6>
                            </div>
                            <div className="text-xs text-gray-600 mb-1">
                              {item.category}
                            </div>
                            {item.description && (
                              <div className="text-xs text-gray-500 italic">
                                {item.description}
                              </div>
                            )}
                          </div>
                          <div className="ml-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-300">
                              ✓ VERIFIED
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>

          {/* Certificate Footer */}
          <div className="text-center mt-12 pt-8 border-t-2 border-amber-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <FaSignature className="h-8 w-8 text-amber-600 mr-2" />
                  <span className="font-bold text-amber-900 text-lg">
                    Authorized Signature
                  </span>
                </div>
                <div className="border-t-2 border-amber-400 w-32 mx-auto mb-2"></div>
                <p className="text-amber-800 font-semibold">
                  {certificateData.certificate.issuedBy}
                </p>
                <p className="text-amber-700 text-sm">
                  {certificateData.certificate.issuedByTitle}
                </p>
                <p className="text-amber-700 text-sm">
                  {certificateData.certificate.department}
                </p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <FaStamp className="h-8 w-8 text-amber-600 mr-2" />
                  <span className="font-bold text-amber-900 text-lg">
                    Issue Date
                  </span>
                </div>
                <div className="border-t-2 border-amber-400 w-32 mx-auto mb-2"></div>
                <p className="text-amber-800 font-semibold text-lg">
                  {certificateData.certificate.issueDate}
                </p>
                <p className="text-amber-700 text-sm">
                  Certificate Valid Until Review Date
                </p>
              </div>
            </div>
            <div className="bg-gradient-to-r from-amber-100 to-yellow-100 p-6 rounded-xl border border-amber-300">
              <p className="text-amber-800 font-bold text-lg mb-2">
                This project has been verified and approved by ELRA's Legal &
                Compliance Department
              </p>
              <p className="text-amber-700 text-sm">
                All regulatory requirements have been met and documented. This
                certificate serves as official proof of compliance with ELRA's
                regulatory standards.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ComplianceCertificate;
