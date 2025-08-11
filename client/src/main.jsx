import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import GradientSpinner from "./components/common/GradientSpinner";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

const root = createRoot(document.getElementById("root"));

root.render(
  <div className="min-h-screen bg-[var(--elra-bg-light)] flex items-center justify-center">
    <GradientSpinner
      size="lg"
      title="ELRA Enterprise Resource Planning System"
      text="Initializing..."
      showText={true}
    />
  </div>
);

setTimeout(() => {
  root.render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SocketProvider>
          <App />
        </SocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}, 2000);
