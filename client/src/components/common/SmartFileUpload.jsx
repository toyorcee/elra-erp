import React, { useState, useRef, useCallback } from "react";
import {
  CloudArrowUpIcon,
  XMarkIcon,
  DocumentIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-toastify";
import {
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE,
  getFileTypeInfo,
  getAcceptedExtensions,
} from "../../constants/fileTypes";

const SmartFileUpload = ({
  files = [],
  onFilesChange,
  maxFiles = 5,
  maxSizePerFile = MAX_FILE_SIZE,
  acceptedTypes = ALLOWED_FILE_TYPES,
  className = "",
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(new Set());
  const fileInputRef = useRef(null);

  // File type validation - using shared constants
  const getFileTypeInfoForFile = (file) => {
    return getFileTypeInfo(file.type);
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Validate file
  const validateFile = (file) => {
    const errors = [];

    // Check file type
    if (!acceptedTypes.includes(file.type)) {
      errors.push(
        `File type not supported. Allowed: PDF, Word, Excel, PowerPoint, Images`
      );
    }

    // Check file size
    if (file.size > maxSizePerFile) {
      errors.push(
        `File size too large. Maximum: ${formatFileSize(maxSizePerFile)}`
      );
    }

    return errors;
  };

  // Process files
  const processFiles = useCallback(
    (newFiles) => {
      const fileArray = Array.from(newFiles);
      const validFiles = [];
      const errors = [];

      // Check if adding these files would exceed the limit
      if (files.length + fileArray.length > maxFiles) {
        toast.error(
          `Maximum ${maxFiles} files allowed. You can upload ${
            maxFiles - files.length
          } more files.`
        );
        return;
      }

      // Validate each file
      fileArray.forEach((file) => {
        const fileErrors = validateFile(file);
        if (fileErrors.length === 0) {
          validFiles.push(file);
        } else {
          errors.push(`${file.name}: ${fileErrors.join(", ")}`);
        }
      });

      // Show errors
      if (errors.length > 0) {
        errors.forEach((error) => toast.error(error));
      }

      // Add valid files
      if (validFiles.length > 0) {
        // Wrap files in the expected format for inventory completion
        const wrappedFiles = validFiles.map((file) => ({
          file: file,
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
        }));

        const updatedFiles = [...files, ...wrappedFiles];
        console.log("🔍 [SmartFileUpload] Adding files:", {
          validFiles: validFiles,
          wrappedFiles: wrappedFiles,
          updatedFiles: updatedFiles,
        });

        onFilesChange(updatedFiles);
        toast.success(`${validFiles.length} file(s) added successfully`);
      }
    },
    [files, maxFiles, maxSizePerFile, acceptedTypes, onFilesChange]
  );

  // Handle drag events
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragOver(false);

      const droppedFiles = e.dataTransfer.files;
      if (droppedFiles.length > 0) {
        processFiles(droppedFiles);
      }
    },
    [processFiles]
  );

  // Handle file input change
  const handleFileInputChange = (e) => {
    const selectedFiles = e.target.files;
    if (selectedFiles.length > 0) {
      processFiles(selectedFiles);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = "";
  };

  // Remove file
  const removeFile = (index) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    onFilesChange(updatedFiles);
  };

  // Get accepted file extensions for display - using shared function
  const getAcceptedExtensionsForDisplay = () => {
    return getAcceptedExtensions();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 ${
          isDragOver
            ? "border-[var(--elra-primary)] bg-[var(--elra-primary)] bg-opacity-5"
            : "border-gray-300 hover:border-gray-400"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(",")}
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="space-y-3">
          <CloudArrowUpIcon
            className={`mx-auto h-12 w-12 ${
              isDragOver ? "text-[var(--elra-primary)]" : "text-gray-400"
            }`}
          />

          <div>
            <p className="text-lg font-medium text-gray-900">
              {isDragOver ? "Drop files here" : "Upload Documents"}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Drag and drop files here, or{" "}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-[var(--elra-primary)] hover:text-[var(--elra-primary-dark)] font-medium underline cursor-pointer"
              >
                browse to choose files
              </button>
            </p>
          </div>

          <div className="text-xs text-gray-500 space-y-1">
            <p>Accepted formats: {getAcceptedExtensionsForDisplay()}</p>
            <p>
              Maximum {maxFiles} files, {formatFileSize(maxSizePerFile)} per
              file
            </p>
            <p className="text-[var(--elra-primary)] font-medium">
              {files.length}/{maxFiles} files selected
            </p>
          </div>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900 flex items-center">
              <DocumentIcon className="h-4 w-4 mr-1" />
              Selected Files ({files.length})
            </h4>
            {files.length >= maxFiles && (
              <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                Maximum reached
              </span>
            )}
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {files.map((file, index) => {
              const fileInfo = getFileTypeInfoForFile(file) || {
                icon: "📄",
                name: "File",
                color: "text-gray-600",
              };
              const isUploading = uploadingFiles.has(index);

              return (
                <div
                  key={index}
                  className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <span className="text-lg">{fileInfo.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.name ||
                          file.title ||
                          file.filename ||
                          "Unknown File"}
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span className={fileInfo.color}>{fileInfo.name}</span>
                        <span>•</span>
                        <span>
                          {file.size
                            ? formatFileSize(file.size)
                            : "Unknown Size"}
                        </span>
                        {isUploading && (
                          <>
                            <span>•</span>
                            <span className="text-[var(--elra-primary)] flex items-center">
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-[var(--elra-primary)] mr-1"></div>
                              Uploading...
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    disabled={isUploading}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Remove file"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upload Status */}
      {files.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <CheckCircleIcon className="h-5 w-5 text-blue-600" />
            <p className="text-sm text-blue-800">
              Files will be uploaded when you submit the form
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartFileUpload;
