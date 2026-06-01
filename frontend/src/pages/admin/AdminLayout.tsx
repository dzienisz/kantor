import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth";

export default function AdminLayout() {
  const { username, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/admin/login", { replace: true });
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition ${
      isActive ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-100"
    }`;

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">💱</span>
            <span className="font-bold text-slate-900">KANTOR · Panel</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link to="/" className="text-slate-500 hover:text-slate-800">
              Strona publiczna
            </Link>
            <span className="text-slate-400">|</span>
            <span className="text-slate-600">{username}</span>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50"
            >
              Wyloguj
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6">
        <nav className="mb-6 flex gap-2">
          <NavLink to="/admin" end className={linkClass}>
            Kursy i cennik
          </NavLink>
          <NavLink to="/admin/reservations" className={linkClass}>
            Rezerwacje
          </NavLink>
        </nav>
        <Outlet />
      </div>
    </div>
  );
}
