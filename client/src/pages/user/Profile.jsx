import React from "react";
import { useQuery } from "@tanstack/react-query";
import SkeletonLoader from "../../components/SkeletonLoader";
import EmptyState from "../../components/EmptyState";
import { getProfile } from "../../services/profile";

const Profile = () => {
  const {
    data: profile,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["profile"],
    queryFn: () => getProfile().then((res) => res.data.data),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return (
    <div className="w-full max-w-2xl mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6 text-blue-900 font-[Poppins]">
        Profile
      </h1>
      {isLoading ? (
        <SkeletonLoader className="h-32" />
      ) : profile ? (
        <div className="bg-white/80 rounded-xl shadow p-6 text-center text-blue-700">
          {/* Render user profile info here */}
          User profile info goes here.
        </div>
      ) : (
        <EmptyState
          title="Profile not found"
          message="Could not load your profile."
        />
      )}
    </div>
  );
};

export default Profile;
