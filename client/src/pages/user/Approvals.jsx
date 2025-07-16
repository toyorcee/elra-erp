import React, { useState, useEffect } from "react";
import SkeletonLoader from "../../components/SkeletonLoader";
import EmptyState from "../../components/EmptyState";
import { getApprovals } from "../../services/approvals";

const Approvals = () => {
  const [loading, setLoading] = useState(true);
  const [approvals, setApprovals] = useState([]);

  useEffect(() => {
    setLoading(true);
    getApprovals()
      .then((res) => {
        setApprovals(res.data.data || []);
        setLoading(false);
      })
      .catch(() => {
        setApprovals([]);
        setLoading(false);
      });
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6 text-blue-900 font-[Poppins]">
        Approvals
      </h1>
      {loading ? (
        <SkeletonLoader className="h-32" />
      ) : approvals.length ? (
        <div className="bg-white/80 rounded-xl shadow p-6 text-center text-blue-700">
          {/* Render approvals list here */}
          Approvals list goes here.
        </div>
      ) : (
        <EmptyState
          title="No approvals found"
          message="You have no pending approvals."
        />
      )}
    </div>
  );
};

export default Approvals;
