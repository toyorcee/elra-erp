import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AppRoutes from "./routes";
import { SocketProvider } from "./context/SocketContext";
import { MessageProvider } from "./context/MessageContext";

const App = () => {
  return (
    <Router>
      <SocketProvider>
        <MessageProvider>
          <ToastContainer position="top-right" autoClose={3000} />
          <AppRoutes />
        </MessageProvider>
      </SocketProvider>
    </Router>
  );
};

export default App;
