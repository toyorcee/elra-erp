import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { MdEmail, MdSend } from "react-icons/md";
import { HiOutlineExclamationTriangle } from "react-icons/hi2";
import {
  sendInvitation,
  resendInvitation,
  getInvitationsForUser,
} from "../../services/invitations";

const SendInviteButton = ({
  user,
  userPermissions = {},
  isSuperAdmin = false,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const queryClient = useQueryClient();

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showConfirmation) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showConfirmation]);

  const sendInvitationMutation = useMutation({
    mutationFn: sendInvitation,
    onSuccess: () => {
      queryClient.invalidateQueries(["users"]);
      queryClient.invalidateQueries(["invitations"]);
      toast.success("Invitation sent successfully!");
      onSuccess && onSuccess();
      setShowConfirmation(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send invitation");
    },
  });

  const handleSendInvite = async () => {
    if (!user.role || !user.department) {
      toast.error(
        "User must have role and department assigned before sending invitation"
      );
      return;
    }

    setLoading(true);
    try {
      const invitationsData = await getInvitationsForUser(user.email);
      console.log("🔍 Invitations data:", invitationsData);
      console.log("🔍 Invitations data.data:", invitationsData.data);
      console.log(
        "🔍 Type of invitationsData.data:",
        typeof invitationsData.data
      );

      const invitationsArray = invitationsData.data?.invitations || [];

      console.log("🔍 Invitations array:", invitationsArray);

      const existingInvitation = invitationsArray.find(
        (inv) => inv.email === user.email && inv.status === "active"
      );

      console.log("🔍 Existing invitation found:", existingInvitation);

      let response;
      if (existingInvitation) {
        // Resend existing invitation
        response = await resendInvitation(existingInvitation._id);
      } else {
        // Create new invitation
        response = await sendInvitationMutation.mutateAsync({
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          departmentId: user.department._id,
          roleId: user.role._id,
          isPendingUser: true,
          userId: user._id,
        });
      }

      if (response.success) {
        toast.success(
          existingInvitation
            ? "Invitation resent successfully! Previous codes have been invalidated."
            : "Invitation sent successfully!"
        );
        closeConfirmation();
        if (onSuccess) onSuccess();
      } else {
        toast.error(response.message || "Failed to send invitation");
      }
    } catch (error) {
      console.error("Error sending invitation:", error);
      toast.error("Failed to send invitation");
    } finally {
      setLoading(false);
    }
  };

  const openConfirmation = () => {
    console.log("🔍 Opening confirmation modal for user:", user);
    console.log("🔍 User has role and department:", hasRoleAndDepartment);
    setShowConfirmation(true);
  };

  const closeConfirmation = () => {
    setShowConfirmation(false);
  };

  // Check permissions
  const canInviteUsers = isSuperAdmin || userPermissions.canManageUsers;

  if (!canInviteUsers) {
    return null;
  }

  if (user.status === "ACTIVE") {
    return (
      <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">
        Active
      </span>
    );
  }

  if (user.status === "INVITED") {
    // For invited users, show a "Resend Invite" button
    const hasRoleAndDepartment = user.role && user.department;

    return (
      <>
        <button
          onClick={openConfirmation}
          disabled={loading || !hasRoleAndDepartment}
          className={`inline-flex items-center gap-1 px-3 py-1 text-xs rounded-md transition-colors cursor-pointer ${
            hasRoleAndDepartment
              ? "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              : "bg-gray-400 text-gray-600 cursor-not-allowed"
          }`}
          title={
            hasRoleAndDepartment
              ? "Resend invitation email"
              : "Assign role and department first"
          }
        >
          <MdSend className="w-3 h-3" />
          Resend Invite
        </button>

        {/* Confirmation Modal */}
        {showConfirmation &&
          createPortal(
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-2 sm:p-4">
              <div className="bg-white rounded-xl shadow-2xl p-4 sm:p-6 w-full max-w-md transform transition-all duration-300 ease-out border border-gray-100">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <HiOutlineExclamationTriangle className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Resend Invitation
                    </h2>
                    <p className="text-gray-600">
                      Confirm resending invitation email
                    </p>
                  </div>
                </div>

                {!hasRoleAndDepartment ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <p className="text-yellow-800 text-sm">
                      <strong>Role and Department Required</strong>
                    </p>
                    <p className="text-yellow-700 text-xs mt-2">
                      Please assign a role and department to this user before
                      resending an invitation. Click the edit icon to assign
                      these values.
                    </p>
                  </div>
                ) : (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <p className="text-blue-800 text-sm break-words">
                      Are you sure you want to resend an invitation email to{" "}
                      <strong>
                        {user.firstName} {user.lastName}
                      </strong>{" "}
                      <br />
                      <span className="text-blue-700 break-all">
                        ({user.email})?
                      </span>
                    </p>
                    <div className="mt-3 space-y-2">
                      <p className="text-blue-700 text-xs">
                        <strong>⚠️ What will happen:</strong>
                      </p>
                      <ul className="text-blue-700 text-xs space-y-1 ml-4">
                        <li>
                          • The previous invitation code will be{" "}
                          <strong>invalidated</strong>
                        </li>
                        <li>
                          • Any other active invitations for this user will be{" "}
                          <strong>cancelled</strong>
                        </li>
                        <li>• A new invitation code will be generated</li>
                        <li>• A fresh invitation email will be sent</li>
                        <li>• The invitation will expire in 7 days</li>
                      </ul>
                      <p className="text-blue-700 text-xs mt-2">
                        <strong>Note:</strong> If the user has already received
                        an invitation, they should use the new code from this
                        email.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row justify-end gap-3">
                  <button
                    onClick={closeConfirmation}
                    disabled={loading}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Cancel
                  </button>
                  {hasRoleAndDepartment && (
                    <button
                      onClick={handleSendInvite}
                      disabled={loading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Resending...</span>
                        </>
                      ) : (
                        <>
                          <MdSend className="w-4 h-4" />
                          <span>Resend Invitation</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>,
            document.body
          )}
      </>
    );
  }

  if (user.status !== "PENDING_REGISTRATION") {
    return (
      <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">
        {user.status}
      </span>
    );
  }

  // Check if user has role and department assigned
  const hasRoleAndDepartment = user.role && user.department;

  return (
    <>
      <button
        onClick={openConfirmation}
        disabled={loading || !hasRoleAndDepartment}
        className={`inline-flex items-center gap-1 px-3 py-1 text-xs rounded-md transition-colors cursor-pointer ${
          hasRoleAndDepartment
            ? "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            : "bg-gray-400 text-gray-600 cursor-not-allowed"
        }`}
        title={
          hasRoleAndDepartment
            ? "Send invitation email to complete registration"
            : "Assign role and department first"
        }
      >
        <MdSend className="w-3 h-3" />
        Send Invite
      </button>

      {/* Confirmation Modal */}
      {showConfirmation &&
        createPortal(
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-2 sm:p-4">
            <div className="bg-white rounded-xl shadow-2xl p-4 sm:p-6 w-full max-w-md transform transition-all duration-300 ease-out border border-gray-100">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <HiOutlineExclamationTriangle className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Send Invitation
                  </h2>
                  <p className="text-gray-600">
                    Confirm sending invitation email
                  </p>
                </div>
              </div>

              {!hasRoleAndDepartment ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <p className="text-yellow-800 text-sm">
                    <strong>Role and Department Required</strong>
                  </p>
                  <p className="text-yellow-700 text-xs mt-2">
                    Please assign a role and department to this user before
                    sending an invitation. Click the edit icon to assign these
                    values.
                  </p>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-blue-800 text-sm break-words">
                    Are you sure you want to send an invitation email to{" "}
                    <strong>
                      {user.firstName} {user.lastName}
                    </strong>{" "}
                    <br />
                    <span className="text-blue-700 break-all">
                      ({user.email})?
                    </span>
                  </p>
                  <p className="text-blue-700 text-xs mt-2 break-words">
                    This will send an email with an invitation code to complete
                    their registration.
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-end gap-3">
                <button
                  onClick={closeConfirmation}
                  disabled={loading}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Cancel
                </button>
                {hasRoleAndDepartment && (
                  <button
                    onClick={handleSendInvite}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <MdSend className="w-4 h-4" />
                        <span>Send Invitation</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

export default SendInviteButton;
