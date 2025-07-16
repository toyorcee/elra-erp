import React, { useState, useEffect } from "react";
import SkeletonLoader from "../../components/SkeletonLoader";
import EmptyState from "../../components/EmptyState";
import { getProfile } from "../../services/profile";

const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    setLoading(true);
    getProfile()
      .then((res) => {
        setProfile(res.data.data || null);
        setLoading(false);
      })
      .catch(() => {
        setProfile(null);
        setLoading(false);
      });
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6 text-blue-900 font-[Poppins]">
        Profile
      </h1>
      {loading ? (
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
