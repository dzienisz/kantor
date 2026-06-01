import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth";

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(username, password);
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname;
      navigate(from ?? "/admin", { replace: true });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
      >
        <div className="mb-6 text-center">
          <div className="text-3xl">💱</div>
          <h1 className="mt-2 text-xl font-bold text-slate-900">Panel KANTOR</h1>
          <p className="text-sm text-slate-500">Zaloguj się, aby zarządzać kantorem</p>
        </div>
        <label className="mb-3 block">
          <span className="mb-1 block text-xs font-medium text-slate-500">Login</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </label>
        <label className="mb-4 block">
          <span className="mb-1 block text-xs font-medium text-slate-500">Hasło</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </label>
        {error && <p className="mb-3 text-sm text-rose-600">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-brand-600 px-4 py-2.5 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {busy ? "Logowanie..." : "Zaloguj"}
        </button>
      </form>
    </div>
  );
}
