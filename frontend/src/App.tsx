import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, RequireAuth } from "./auth";
import HomePage from "./pages/HomePage";
import AdminCurrencies from "./pages/admin/AdminCurrencies";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminReservations from "./pages/admin/AdminReservations";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <RequireAuth>
                <AdminLayout />
              </RequireAuth>
            }
          >
            <Route index element={<AdminCurrencies />} />
            <Route path="reservations" element={<AdminReservations />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
