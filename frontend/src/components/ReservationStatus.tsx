import { useState } from "react";
import { api, type Reservation } from "../api";
import { STATUS_COLOR, STATUS_LABEL, pln, rate as fmtRate } from "../lib/format";

export default function ReservationStatus() {
  const [code, setCode] = useState("");
  const [res, setRes] = useState<Reservation | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function lookup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setRes(null);
    try {
      const r = await api.getReservation(code.trim().toUpperCase());
      setRes(r);
    } catch {
      setError("Nie znaleziono rezerwacji o podanym numerze.");
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-3 text-lg font-semibold text-slate-900">Sprawdź status rezerwacji</h3>
      <form onSubmit={lookup} className="flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="np. KAB12CD34"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 uppercase focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <button
          type="submit"
          className="rounded-lg bg-slate-800 px-4 py-2 font-medium text-white hover:bg-slate-900"
        >
          Sprawdź
        </button>
      </form>

      {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}

      {res && (
        <div className="mt-4 rounded-lg bg-slate-50 p-4 text-sm">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-semibold text-slate-900">{res.code}</span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                STATUS_COLOR[res.status]
              }`}
            >
              {STATUS_LABEL[res.status]}
            </span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>
              {res.side === "buy" ? "Kupno" : "Sprzedaż"} {res.amount} {res.currency_code}
            </span>
            <span>{fmtRate(res.rate)}</span>
          </div>
          <div className="flex justify-between font-semibold text-slate-800">
            <span>Kwota PLN</span>
            <span>{pln(res.pln_amount)}</span>
          </div>
          <div className="mt-1 text-slate-500">Odbiór: {res.pickup_location}</div>
        </div>
      )}
    </div>
  );
}
