import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AppRoutes from "./routes";
import { MessageProvider } from "./context/MessageContext";

const App = () => {
  return (
    <Router>
      <MessageProvider>
        <ToastContainer position="top-right" autoClose={3000} />
        <AppRoutes />
      </MessageProvider>
    </Router>
  );
};

export default App;
