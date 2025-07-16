import React, { useState, useEffect } from "react";
import SkeletonLoader from "../../../components/SkeletonLoader";
import EmptyState from "../../../components/EmptyState";
import { getUsers } from "../../../services/users";

const Users = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    setLoading(true);
    getUsers()
      .then((res) => {
        setUsers(res.data.data || []);
        setLoading(false);
      })
      .catch(() => {
        setUsers([]);
        setLoading(false);
      });
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6 text-blue-900 font-[Poppins]">
        Users
      </h1>
      {loading ? (
        <SkeletonLoader className="h-32" />
      ) : users.length ? (
        <div className="bg-white/80 rounded-xl shadow p-6 text-center text-blue-700">
          {/* Render user list/table here */}
          User list goes here.
        </div>
      ) : (
        <EmptyState title="No users found" message="No users available." />
      )}
    </div>
  );
};

export default Users;
