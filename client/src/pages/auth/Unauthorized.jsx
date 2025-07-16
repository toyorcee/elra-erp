import React from "react";
import { Link } from "react-router-dom";

const Unauthorized = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 via-cyan-100 to-white">
    <div className="bg-white/80 rounded-2xl shadow-xl p-10 flex flex-col items-center">
      <h1 className="text-3xl font-bold text-red-600 mb-4 font-[Poppins]">
        Access Denied
      </h1>
      <p className="text-blue-900 mb-6">
        You do not have permission to view this page.
      </p>
      <Link
        to="/dashboard"
        className="text-cyan-600 font-semibold hover:underline"
      >
        Go to Dashboard
      </Link>
      <Link
        to="/login"
        className="text-blue-600 font-semibold hover:underline mt-2"
      >
        Login
      </Link>
    </div>
  </div>
);

export default Unauthorized;
