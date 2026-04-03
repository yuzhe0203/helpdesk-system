import { Navigate, useRoutes } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import TicketsPage from "../pages/TicketsPage";
import ProtectedRoute from "../components/ProtectedRoute";
import CreateTicketPage from "../pages/CreateTicketPage";
import TicketDetailPage from "../pages/TicketDetailPage";
import RegisterPage from "../pages/RegisterPage";

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
      path: "/register",
      element: <RegisterPage />,
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
      path: "/tickets/:id",
      element: (
        <ProtectedRoute>
          <TicketDetailPage />
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
