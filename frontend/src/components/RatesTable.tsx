import type { PublicRate } from "../api";
import { flagEmoji, rate } from "../lib/format";

interface Props {
  rates: PublicRate[];
  selectedCode?: string;
  onSelect?: (code: string) => void;
}

export default function RatesTable({ rates, selectedCode, onSelect }: Props) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-slate-100 text-slate-600">
          <tr>
            <th className="px-4 py-3 text-left font-medium">Waluta</th>
            <th className="px-4 py-3 text-right font-medium">Kurs NBP</th>
            <th className="px-4 py-3 text-right font-medium">Kupno (skup)</th>
            <th className="px-4 py-3 text-right font-medium">Sprzedaż</th>
          </tr>
        </thead>
        <tbody>
          {rates.map((r) => (
            <tr
              key={r.code}
              onClick={() => onSelect?.(r.code)}
              className={`border-t border-slate-100 transition ${
                onSelect ? "cursor-pointer hover:bg-brand-50" : ""
              } ${selectedCode === r.code ? "bg-brand-50" : ""}`}
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-xl" aria-hidden>
                    {flagEmoji(r.flag || r.code)}
                  </span>
                  <div>
                    <div className="font-semibold text-slate-900">{r.code}</div>
                    <div className="text-xs text-slate-500">{r.name}</div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-slate-500">
                {rate(r.mid)}
              </td>
              <td className="px-4 py-3 text-right font-semibold tabular-nums text-emerald-700">
                {rate(r.buy)}
              </td>
              <td className="px-4 py-3 text-right font-semibold tabular-nums text-rose-700">
                {rate(r.sell)}
              </td>
            </tr>
          ))}
          {rates.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                Brak kursów. Odśwież kursy w panelu administratora.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
