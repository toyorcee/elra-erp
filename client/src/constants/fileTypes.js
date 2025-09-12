// Shared file type constants for frontend and backend sync
// This ensures the SmartFileUpload component works perfectly with the backend

export const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/jpeg",
  "image/png",
  "image/jpg",
];

export const FILE_TYPE_INFO = {
  "application/pdf": {
    icon: "📄",
    name: "PDF",
    color: "text-red-600",
    extensions: ["PDF"],
  },
  "application/msword": {
    icon: "📝",
    name: "Word",
    color: "text-blue-600",
    extensions: ["DOC"],
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
    icon: "📝",
    name: "Word",
    color: "text-blue-600",
    extensions: ["DOCX"],
  },
  "application/vnd.ms-excel": {
    icon: "📊",
    name: "Excel",
    color: "text-green-600",
    extensions: ["XLS"],
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
    icon: "📊",
    name: "Excel",
    color: "text-green-600",
    extensions: ["XLSX"],
  },
  "application/vnd.ms-powerpoint": {
    icon: "📽️",
    name: "PowerPoint",
    color: "text-orange-600",
    extensions: ["PPT"],
  },
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": {
    icon: "📽️",
    name: "PowerPoint",
    color: "text-orange-600",
    extensions: ["PPTX"],
  },
  "image/jpeg": {
    icon: "🖼️",
    name: "Image",
    color: "text-purple-600",
    extensions: ["JPG"],
  },
  "image/png": {
    icon: "🖼️",
    name: "Image",
    color: "text-purple-600",
    extensions: ["PNG"],
  },
  "image/jpg": {
    icon: "🖼️",
    name: "Image",
    color: "text-purple-600",
    extensions: ["JPG"],
  },
};

export const MAX_FILE_SIZE = 10 * 1024 * 1024;

export const getFileTypeInfo = (mimeType) => {
  return (
    FILE_TYPE_INFO[mimeType] || {
      icon: "📄",
      name: "File",
      color: "text-gray-600",
      extensions: ["FILE"],
    }
  );
};

export const getAcceptedExtensions = () => {
  const extensions = new Set();
  Object.values(FILE_TYPE_INFO).forEach((type) => {
    type.extensions.forEach((ext) => extensions.add(ext));
  });
  return Array.from(extensions).join(", ");
};
