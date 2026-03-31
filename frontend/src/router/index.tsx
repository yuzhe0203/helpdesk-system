import { Navigate, useRoutes } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import TicketsPage from "../pages/TicketsPage";
import ProtectedRoute from "../components/ProtectedRoute";
import CreateTicketPage from "../pages/CreateTicketPage";

export default function AppRouter() {
  return useRoutes([
    {
      path: "/",
      element: <Navigate to="/login" />,
    },
    {
      path: "/login",
      element: <LoginPage />,
    },
    {
      path: "/tickets",
      element: (
        <ProtectedRoute>
          <TicketsPage />
        </ProtectedRoute>
      ),
    },
    {
      path: "/tickets/create",
      element: (
        <ProtectedRoute>
          <CreateTicketPage />
        </ProtectedRoute>
      ),
    },
  ]);
}
