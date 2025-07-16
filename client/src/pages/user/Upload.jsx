import React, { useState, useEffect } from "react";
import SkeletonLoader from "../../components/SkeletonLoader";
import EmptyState from "../../components/EmptyState";
// import { uploadDocument } from "../services/upload";

const Upload = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000);
  }, []);

  return (
    <div className="w-full max-w-3xl mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6 text-blue-900 font-[Poppins]">
        Upload Document
      </h1>
      {loading ? (
        <SkeletonLoader className="h-32" />
      ) : (
        <div className="bg-white/80 rounded-xl shadow p-6 text-center text-blue-700">
          {/* Upload form goes here */}
          Upload form goes here.
        </div>
      )}
    </div>
  );
};

export default Upload;
