import React from "react";
import { HiOutlineInbox } from "react-icons/hi";

const EmptyState = ({
  icon: Icon = HiOutlineInbox,
  title = "Nothing here yet!",
  message = "There's no data to display.",
  action,
  className = "",
}) => (
  <div
    className={`flex flex-col items-center justify-center py-12 ${className}`}
  >
    <span className="animate-bounce mb-4">
      <Icon className="text-cyan-400 text-6xl drop-shadow-lg" />
    </span>
    <h2 className="text-xl font-bold text-blue-900 mb-2 font-[Poppins]">
      {title}
    </h2>
    <p className="text-blue-700 mb-4 text-center max-w-xs">{message}</p>
    {action && <div>{action}</div>}
  </div>
);

export default EmptyState;
