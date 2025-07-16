import React, { useState, useEffect } from "react";
import SkeletonLoader from "../../components/SkeletonLoader";
import EmptyState from "../../components/EmptyState";
import { getDocuments } from "../../services/documents";

const Documents = () => {
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    setLoading(true);
    getDocuments()
      .then((res) => {
        setDocuments(res.data.data || []);
        setLoading(false);
      })
      .catch(() => {
        setDocuments([]);
        setLoading(false);
      });
  }, []);

  return (
    <div className="w-full max-w-5xl mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6 text-blue-900 font-[Poppins]">
        Documents
      </h1>
      {loading ? (
        <SkeletonLoader className="h-32" />
      ) : documents.length ? (
        <div className="bg-white/80 rounded-xl shadow p-6 text-center text-blue-700">
          {/* Render document list/table here */}
          Document list goes here.
        </div>
      ) : (
        <EmptyState
          title="No documents found"
          message="You have no documents yet."
        />
      )}
    </div>
  );
};

export default Documents;
