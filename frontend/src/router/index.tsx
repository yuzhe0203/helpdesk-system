import { Navigate, useRoutes } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import TicketsPage from "../pages/TicketsPage";
import ProtectedRoute from "../components/ProtectedRoute";

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
  ]);
}
