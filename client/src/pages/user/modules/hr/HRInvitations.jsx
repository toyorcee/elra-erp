import React from "react";
import BulkInvitationSystem from "./invitations/BulkInvitationSystem";

const HRInvitations = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BulkInvitationSystem />
      </div>
    </div>
  );
};

export default HRInvitations;
