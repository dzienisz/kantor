import { useEffect, useState } from "react";
import { api, type CalcResponse, type PublicRate, type Side } from "../api";
import { pln, rate as fmtRate } from "../lib/format";

interface Props {
  rates: PublicRate[];
  code: string;
  onCodeChange: (code: string) => void;
}

export default function Calculator({ rates, code, onCodeChange }: Props) {
  const [amount, setAmount] = useState("100");
  const [side, setSide] = useState<Side>("buy");
  const [result, setResult] = useState<CalcResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const value = parseFloat(amount.replace(",", "."));
    if (!code || !value || value <= 0) {
      setResult(null);
      return;
    }
    let active = true;
    api
      .calculate(code, value, side)
      .then((r) => active && (setResult(r), setError(null)))
      .catch((e) => active && setError(e.message));
    return () => {
      active = false;
    };
  }, [amount, side, code]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-slate-900">Kalkulator walut</h3>

      <div className="mb-3 inline-flex rounded-lg bg-slate-100 p-1 text-sm">
        <button
          type="button"
          onClick={() => setSide("buy")}
          className={`rounded-md px-4 py-1.5 font-medium transition ${
            side === "buy" ? "bg-white text-brand-700 shadow" : "text-slate-500"
          }`}
        >
          Kupuję walutę
        </button>
        <button
          type="button"
          onClick={() => setSide("sell")}
          className={`rounded-md px-4 py-1.5 font-medium transition ${
            side === "sell" ? "bg-white text-brand-700 shadow" : "text-slate-500"
          }`}
        >
          Sprzedaję walutę
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-500">Kwota</span>
          <input
            value={amount}
            inputMode="decimal"
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-500">Waluta</span>
          <select
            value={code}
            onChange={(e) => onCodeChange(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            {rates.map((r) => (
              <option key={r.code} value={r.code}>
                {r.code} — {r.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 rounded-lg bg-brand-50 p-4">
        {error && <p className="text-sm text-rose-600">{error}</p>}
        {!error && result && (
          <>
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-slate-600">
                {side === "buy" ? "Do zapłaty" : "Otrzymasz"}
              </span>
              <span className="text-2xl font-bold text-brand-900">
                {pln(result.pln_amount)}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
              <span>
                Kurs: <strong>{fmtRate(result.rate)}</strong>
              </span>
              <span className="rounded-full bg-white px-2 py-0.5 font-medium">
                {result.segment === "wholesale" ? "cena hurtowa" : "cena detaliczna"}
              </span>
            </div>
          </>
        )}
        {!error && !result && (
          <p className="text-sm text-slate-400">Podaj kwotę, aby zobaczyć przeliczenie.</p>
        )}
      </div>
    </div>
  );
}
