import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AppRoutes from "./routes";
import { SocketProvider } from "./context/SocketContext";

const App = () => {
  return (
    <Router>
      <SocketProvider>
        <ToastContainer position="top-right" autoClose={3000} />
        <AppRoutes />
      </SocketProvider>
    </Router>
  );
};

export default App;
