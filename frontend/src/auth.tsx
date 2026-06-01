import { createContext, useContext, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { api } from "./api";

interface AuthState {
  token: string | null;
  username: string | null;
  role: string | null;
  login: (u: string, p: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem("kantor_token"),
  );
  const [username, setUsername] = useState<string | null>(
    () => localStorage.getItem("kantor_user"),
  );
  const [role, setRole] = useState<string | null>(
    () => localStorage.getItem("kantor_role"),
  );

  async function login(u: string, p: string) {
    const res = await api.login(u, p);
    localStorage.setItem("kantor_token", res.access_token);
    localStorage.setItem("kantor_user", res.username);
    localStorage.setItem("kantor_role", res.role);
    setToken(res.access_token);
    setUsername(res.username);
    setRole(res.role);
  }

  function logout() {
    localStorage.removeItem("kantor_token");
    localStorage.removeItem("kantor_user");
    localStorage.removeItem("kantor_role");
    setToken(null);
    setUsername(null);
    setRole(null);
  }

  return (
    <AuthContext.Provider value={{ token, username, role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth musi byc uzyte wewnatrz AuthProvider");
  return ctx;
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const location = useLocation();
  if (!token) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}
