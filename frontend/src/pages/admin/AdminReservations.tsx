import { useEffect, useState } from "react";
import {
  api,
  type Reservation,
  type ReservationStatus as Status,
} from "../../api";
import { STATUS_COLOR, STATUS_LABEL, pln, rate as fmtRate } from "../../lib/format";

const NEXT_STATUSES: Status[] = [
  "pending",
  "confirmed",
  "ready",
  "completed",
  "cancelled",
];

export default function AdminReservations() {
  const [items, setItems] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [tablet, setTablet] = useState<Reservation | null>(null);

  async function load() {
    setLoading(true);
    try {
      setItems(await api.listReservations());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function setStatus(id: number, status: Status) {
    await api.updateReservationStatus(id, status);
    load();
  }

  if (tablet) {
    return <TabletView reservation={tablet} onClose={() => setTablet(null)} />;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-900">Rezerwacje</h2>
      {loading ? (
        <p className="text-slate-400">Ładowanie...</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="px-3 py-2 text-left">Nr</th>
                <th className="px-3 py-2 text-left">Klient</th>
                <th className="px-3 py-2 text-left">Transakcja</th>
                <th className="px-3 py-2 text-right">Kwota PLN</th>
                <th className="px-3 py-2 text-left">Odbiór</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-right">Akcje</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-mono text-xs">{r.code}</td>
                  <td className="px-3 py-2">
                    <div className="font-medium text-slate-800">{r.customer_name}</div>
                    <div className="text-xs text-slate-500">{r.customer_phone}</div>
                  </td>
                  <td className="px-3 py-2">
                    {r.side === "buy" ? "Kupno" : "Sprzedaż"} {r.amount} {r.currency_code}
                    <span className="ml-1 text-xs text-slate-400">@ {fmtRate(r.rate)}</span>
                  </td>
                  <td className="px-3 py-2 text-right font-semibold">{pln(r.pln_amount)}</td>
                  <td className="px-3 py-2 text-xs">{r.pickup_location}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        STATUS_COLOR[r.status]
                      }`}
                    >
                      {STATUS_LABEL[r.status]}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setTablet(r)}
                        className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                      >
                        Tablet
                      </button>
                      <select
                        value={r.status}
                        onChange={(e) => setStatus(r.id, e.target.value as Status)}
                        className="rounded border border-slate-300 px-2 py-1 text-xs"
                      >
                        {NEXT_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {STATUS_LABEL[s]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-slate-400">
                    Brak rezerwacji.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Widok "tabletowy" pokazywany klientowi przy obsludze transakcji.
function TabletView({
  reservation,
  onClose,
}: {
  reservation: Reservation;
  onClose: () => void;
}) {
  const r = reservation;
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-brand-900 p-8 text-white">
      <button
        onClick={onClose}
        className="absolute right-6 top-6 rounded-lg bg-white/10 px-4 py-2 text-sm hover:bg-white/20"
      >
        Zamknij
      </button>
      <div className="w-full max-w-lg rounded-3xl bg-white p-10 text-center text-slate-900 shadow-2xl">
        <p className="text-sm uppercase tracking-wide text-slate-400">Szczegóły transakcji</p>
        <p className="mt-1 font-mono text-sm text-slate-500">{r.code}</p>
        <h2 className="mt-6 text-2xl font-bold">
          {r.side === "buy" ? "Kupno waluty" : "Sprzedaż waluty"}
        </h2>
        <div className="mt-8 grid grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-slate-400">Ilość</p>
            <p className="text-3xl font-bold">
              {r.amount} {r.currency_code}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-400">Kurs</p>
            <p className="text-3xl font-bold">{fmtRate(r.rate)}</p>
          </div>
        </div>
        <div className="mt-8 rounded-2xl bg-brand-50 p-6">
          <p className="text-sm text-slate-500">
            {r.side === "buy" ? "Do zapłaty" : "Do wypłaty"}
          </p>
          <p className="text-4xl font-extrabold text-brand-900">{pln(r.pln_amount)}</p>
        </div>
        <p className="mt-6 text-sm text-slate-500">Odbiór osobisty: {r.pickup_location}</p>
      </div>
    </div>
  );
}
