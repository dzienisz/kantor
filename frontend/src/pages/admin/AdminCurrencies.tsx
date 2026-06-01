import { useEffect, useState } from "react";
import { api, type Currency } from "../../api";

export default function AdminCurrencies() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      setCurrencies(await api.listCurrencies());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function refresh() {
    setMsg(null);
    setError(null);
    try {
      const res = await api.refreshRates();
      setMsg(`Pobrano kursy NBP dla ${res.updated} walut.`);
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">Kursy i cennik</h2>
        <button
          onClick={refresh}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Pobierz kursy NBP
        </button>
      </div>

      {msg && <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{msg}</div>}
      {error && <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}

      <NewCurrency onCreated={load} />

      {loading ? (
        <p className="text-slate-400">Ładowanie...</p>
      ) : (
        <div className="space-y-3">
          {currencies.map((c) => (
            <CurrencyRow key={c.id} currency={c} onChange={load} />
          ))}
        </div>
      )}
    </div>
  );
}

function CurrencyRow({ currency, onChange }: { currency: Currency; onChange: () => void }) {
  const [buy, setBuy] = useState(String(currency.buy_spread_pct));
  const [sell, setSell] = useState(String(currency.sell_spread_pct));
  const [enabled, setEnabled] = useState(currency.enabled);
  const [saving, setSaving] = useState(false);
  const [showTiers, setShowTiers] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await api.updateCurrency(currency.id, {
        buy_spread_pct: parseFloat(buy.replace(",", ".")),
        sell_spread_pct: parseFloat(sell.replace(",", ".")),
        enabled,
      });
      onChange();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-4">
        <div className="w-28">
          <div className="font-semibold text-slate-900">{currency.code}</div>
          <div className="text-xs text-slate-500">{currency.name}</div>
        </div>
        <label className="text-sm">
          <span className="mb-1 block text-xs text-slate-500">Odchył skupu %</span>
          <input
            value={buy}
            onChange={(e) => setBuy(e.target.value)}
            className="w-24 rounded-lg border border-slate-300 px-2 py-1.5"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs text-slate-500">Odchył sprzedaży %</span>
          <input
            value={sell}
            onChange={(e) => setSell(e.target.value)}
            className="w-24 rounded-lg border border-slate-300 px-2 py-1.5"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          Aktywna
        </label>
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => setShowTiers((v) => !v)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            Warianty ({currency.tiers.length})
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-50"
          >
            Zapisz
          </button>
        </div>
      </div>

      {showTiers && <Tiers currency={currency} onChange={onChange} />}
    </div>
  );
}

function Tiers({ currency, onChange }: { currency: Currency; onChange: () => void }) {
  const [minAmount, setMinAmount] = useState("5000");
  const [buy, setBuy] = useState("1");
  const [sell, setSell] = useState("1");

  async function add() {
    await api.addTier(currency.id, {
      segment: "wholesale",
      min_amount: parseFloat(minAmount.replace(",", ".")),
      buy_spread_pct: parseFloat(buy.replace(",", ".")),
      sell_spread_pct: parseFloat(sell.replace(",", ".")),
    });
    onChange();
  }

  async function remove(id: number) {
    await api.deleteTier(id);
    onChange();
  }

  return (
    <div className="mt-4 rounded-lg bg-slate-50 p-3">
      <p className="mb-2 text-xs font-medium text-slate-500">
        Warianty cennika (progi ilościowe / ceny hurtowe)
      </p>
      <div className="space-y-1">
        {currency.tiers.map((t) => (
          <div key={t.id} className="flex items-center justify-between text-sm">
            <span className="text-slate-700">
              od {t.min_amount} {currency.code} → skup {t.buy_spread_pct}% / sprzedaż{" "}
              {t.sell_spread_pct}%
            </span>
            <button
              onClick={() => remove(t.id)}
              className="text-rose-600 hover:underline"
            >
              Usuń
            </button>
          </div>
        ))}
        {currency.tiers.length === 0 && (
          <p className="text-xs text-slate-400">Brak wariantów — obowiązuje cena detaliczna.</p>
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-end gap-2">
        <label className="text-xs text-slate-500">
          Od kwoty
          <input
            value={minAmount}
            onChange={(e) => setMinAmount(e.target.value)}
            className="ml-1 w-24 rounded border border-slate-300 px-2 py-1 text-sm"
          />
        </label>
        <label className="text-xs text-slate-500">
          Skup %
          <input
            value={buy}
            onChange={(e) => setBuy(e.target.value)}
            className="ml-1 w-16 rounded border border-slate-300 px-2 py-1 text-sm"
          />
        </label>
        <label className="text-xs text-slate-500">
          Sprzedaż %
          <input
            value={sell}
            onChange={(e) => setSell(e.target.value)}
            className="ml-1 w-16 rounded border border-slate-300 px-2 py-1 text-sm"
          />
        </label>
        <button
          onClick={add}
          className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
        >
          Dodaj wariant
        </button>
      </div>
    </div>
  );
}

function NewCurrency({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function create() {
    setError(null);
    try {
      await api.createCurrency({
        code: code.toUpperCase(),
        name,
        buy_spread_pct: 2,
        sell_spread_pct: 2,
      });
      setCode("");
      setName("");
      setOpen(false);
      onCreated();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-dashed border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-white"
      >
        + Dodaj walutę
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-end gap-2 rounded-xl border border-slate-200 bg-white p-4">
      <label className="text-xs text-slate-500">
        Kod (3 litery)
        <input
          value={code}
          maxLength={3}
          onChange={(e) => setCode(e.target.value)}
          className="ml-1 w-20 rounded border border-slate-300 px-2 py-1 text-sm uppercase"
        />
      </label>
      <label className="text-xs text-slate-500">
        Nazwa
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="ml-1 w-48 rounded border border-slate-300 px-2 py-1 text-sm"
        />
      </label>
      <button
        onClick={create}
        className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
      >
        Dodaj
      </button>
      <button onClick={() => setOpen(false)} className="text-sm text-slate-500">
        Anuluj
      </button>
      {error && <span className="text-sm text-rose-600">{error}</span>}
    </div>
  );
}
