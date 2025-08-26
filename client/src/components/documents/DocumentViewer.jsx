import React from "react";
import {
  downloadDocumentPDF,
  getDocumentContentType,
  getDocumentStatusColor,
  getDocumentCategoryColor,
  formatFileSize,
} from "../../utils/documentUtils";
import ELRALogo from "../ELRALogo";

/**
 * ELRA Document Viewer Component
 * Displays document details and content with ELRA branding
 */
const DocumentViewer = ({ document, onClose, onDownload, onEdit }) => {
  const documentContent = getDocumentContentType(document);

  const handleDownloadPDF = () => {
    try {
      downloadDocumentPDF(document);
    } catch (error) {
      console.error("PDF download error:", error);
      alert("Failed to download PDF. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-[95vw] w-full max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <ELRALogo variant="dark" size="md" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">ELRA Document Viewer</h2>
                <p className="text-white text-opacity-80">
                  Equipment Leasing Registration Authority
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Document Info */}
        <div className="p-6 border-b border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {document.title}
              </h3>
              <p className="text-gray-600 mb-4">{document.description}</p>

              <div className="flex flex-wrap gap-2 mb-4">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${getDocumentStatusColor(
                    document.status
                  )}`}
                >
                  {document.status.replace("_", " ").toUpperCase()}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${getDocumentCategoryColor(
                    document.category
                  )}`}
                >
                  {document.category.toUpperCase()}
                </span>
                {document.documentType && (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {document.documentType.replace("_", " ").toUpperCase()}
                  </span>
                )}
              </div>

              {/* Template Replacement Notice */}
              {documentContent.type === "template" && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-4">
                  <div className="flex items-start space-x-3">
                    <div className="p-1 bg-blue-100 rounded">
                      <svg
                        className="w-4 h-4 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-900 mb-1">
                        Template Document
                      </p>
                      <p className="text-xs text-blue-700">
                        This is a template showing what's required. You need to
                        upload the actual completed document to replace this
                        template.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {document.project && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">
                    📋 Project Information
                  </h4>
                  <p className="text-sm text-blue-800">
                    <strong>Code:</strong> {document.project.code}
                  </p>
                  <p className="text-sm text-blue-800">
                    <strong>Name:</strong> {document.project.name}
                  </p>
                  <p className="text-sm text-blue-800">
                    <strong>Budget:</strong> ₦
                    {document.project.budget?.toLocaleString()}
                  </p>
                </div>
              )}

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">
                  📄 Document Details
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <strong>Type:</strong>{" "}
                    {document.mimeType?.split("/")[1]?.toUpperCase() ||
                      "Unknown"}
                  </div>
                  <div>
                    <strong>Size:</strong> {formatFileSize(document.fileSize)}
                  </div>
                  <div>
                    <strong>Created:</strong>{" "}
                    {new Date(document.createdAt).toLocaleDateString()}
                  </div>
                  <div>
                    <strong>Updated:</strong>{" "}
                    {new Date(document.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">
                  👤 Ownership
                </h4>
                <div className="text-sm">
                  <p>
                    <strong>Created By:</strong>{" "}
                    {document.createdBy?.name || "System"}
                  </p>
                  <p>
                    <strong>Department:</strong> {document.department?.name}
                  </p>
                  {document.uploadedBy && (
                    <p>
                      <strong>Uploaded By:</strong> {document.uploadedBy.name}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Document Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="bg-gray-50 rounded-lg p-6 min-h-[400px] max-h-[60vh] overflow-y-auto">
            {documentContent.type === "template" && (
              <div className="prose max-w-none">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Template Content
                    </h3>
                    <button
                      onClick={handleDownloadPDF}
                      className="bg-[var(--elra-primary)] text-white px-4 py-2 rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors text-sm"
                    >
                      Download as PDF
                    </button>
                  </div>
                  <div
                    className="text-sm text-gray-700 leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: documentContent.content.replace(/\n/g, "<br>"),
                    }}
                  />
                </div>
              </div>
            )}

            {documentContent.type === "pdf" && (
              <div className="text-center py-12">
                <div className="bg-white p-8 rounded-lg shadow-sm">
                  <svg
                    className="w-16 h-16 text-red-500 mx-auto mb-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    PDF Document
                  </h3>
                  <p className="text-gray-600 mb-4">
                    This document requires a PDF viewer to display properly.
                  </p>
                  <button
                    onClick={() => onDownload && onDownload(document.id)}
                    className="bg-[var(--elra-primary)] text-white px-6 py-2 rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors"
                  >
                    Download PDF
                  </button>
                </div>
              </div>
            )}

            {documentContent.type === "image" && (
              <div className="text-center">
                <img
                  src={documentContent.content}
                  alt={document.title}
                  className="max-w-full max-h-96 mx-auto rounded-lg shadow-sm"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.nextSibling.style.display = "block";
                  }}
                />
                <div className="hidden bg-white p-8 rounded-lg shadow-sm">
                  <svg
                    className="w-16 h-16 text-gray-400 mx-auto mb-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8.5,13.5L11,16.5L14.5,12L19,18H5M21,19V5C21,3.89 20.1,3 19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19Z" />
                  </svg>
                  <p className="text-gray-600">Image preview not available</p>
                </div>
              </div>
            )}

            {documentContent.type === "text" && (
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Document Content
                  </h3>
                  <button
                    onClick={() => onDownload && onDownload(document.id)}
                    className="bg-[var(--elra-primary)] text-white px-4 py-2 rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors text-sm"
                  >
                    Download
                  </button>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-gray-600">
                    Document content preview not available for this file type.
                  </p>
                </div>
              </div>
            )}

            {documentContent.type === "unknown" && (
              <div className="text-center py-12">
                <div className="bg-white p-8 rounded-lg shadow-sm">
                  <svg
                    className="w-16 h-16 text-gray-400 mx-auto mb-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Document Preview
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {documentContent.content}
                  </p>
                  <button
                    onClick={() => onDownload && onDownload(document.id)}
                    className="bg-[var(--elra-primary)] text-white px-6 py-2 rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors"
                  >
                    Download Document
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              ELRA Document Management System •{" "}
              {new Date().toLocaleDateString()}
            </div>
            <div className="flex items-center space-x-3">
              {documentContent.type === "template" && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-blue-600 font-medium">
                    📄 Template - Upload Required
                  </span>
                </div>
              )}
              {onEdit && (
                <button
                  onClick={() => onEdit(document.id)}
                  className="bg-[var(--elra-primary)] text-white px-4 py-2 rounded-lg hover:bg-[var(--elra-primary-dark)] transition-colors"
                >
                  {documentContent.type === "template"
                    ? "Upload Document"
                    : "Edit Document"}
                </button>
              )}
              {onDownload && (
                <button
                  onClick={() => onDownload(document.id)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Download
                </button>
              )}
              <button
                onClick={onClose}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer;
