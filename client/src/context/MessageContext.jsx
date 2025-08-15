import React, { createContext, useContext, useState } from "react";

const MessageContext = createContext();

export const useMessageContext = () => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error("useMessageContext must be used within a MessageProvider");
  }
  return context;
};

export const MessageProvider = ({ children }) => {
  const [showMessageDropdown, setShowMessageDropdown] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const openChatWithUser = (user) => {
    setSelectedUser(user);
    setShowMessageDropdown(true);
  };

  const closeMessageDropdown = () => {
    setShowMessageDropdown(false);
    setSelectedUser(null);
  };

  return (
    <MessageContext.Provider
      value={{
        showMessageDropdown,
        selectedUser,
        openChatWithUser,
        closeMessageDropdown,
        setShowMessageDropdown,
      }}
    >
      {children}
    </MessageContext.Provider>
  );
};
