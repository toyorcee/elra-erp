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
      <Icon className="text-blue-300 text-6xl drop-shadow-lg" />
    </span>
    <h2 className="text-xl font-bold text-white mb-2 font-[Poppins]">
      {title}
    </h2>
    <p className="text-gray-200 mb-4 text-center max-w-xs">{message}</p>
    {action && <div>{action}</div>}
  </div>
);

export default EmptyState;
