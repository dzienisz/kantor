import { useState } from "react";
import { api, type PublicRate, type Reservation, type Side } from "../api";
import { pln, rate as fmtRate } from "../lib/format";

interface Props {
  rates: PublicRate[];
  defaultCode: string;
}

const LOCATIONS = ["Oddział Centrum", "Oddział Dworzec", "Oddział Galeria"];

export default function ReservationForm({ rates, defaultCode }: Props) {
  const [code, setCode] = useState(defaultCode);
  const [side, setSide] = useState<Side>("buy");
  const [amount, setAmount] = useState("500");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState(LOCATIONS[0]);
  const [note, setNote] = useState("");
  const [created, setCreated] = useState<Reservation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await api.createReservation({
        code,
        side,
        amount: parseFloat(amount.replace(",", ".")),
        customer_name: name,
        customer_phone: phone,
        customer_email: email,
        pickup_location: location,
        note,
      });
      setCreated(res);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (created) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-emerald-900">Rezerwacja przyjęta!</h3>
        <p className="mt-1 text-sm text-emerald-800">
          Twój numer rezerwacji: <strong className="text-lg">{created.code}</strong>
        </p>
        <dl className="mt-4 space-y-1 text-sm text-emerald-900">
          <div className="flex justify-between">
            <dt>Transakcja</dt>
            <dd>
              {created.side === "buy" ? "Kupno" : "Sprzedaż"} {created.amount}{" "}
              {created.currency_code}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt>Kurs</dt>
            <dd>{fmtRate(created.rate)}</dd>
          </div>
          <div className="flex justify-between font-semibold">
            <dt>Kwota PLN</dt>
            <dd>{pln(created.pln_amount)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Odbiór osobisty</dt>
            <dd>{created.pickup_location}</dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-emerald-700">
          Zapisz numer rezerwacji — pozwoli sprawdzić jej status i odebrać walutę w oddziale.
        </p>
        <button
          onClick={() => setCreated(null)}
          className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Nowa rezerwacja
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <h3 className="mb-1 text-lg font-semibold text-slate-900">
        Rezerwacja z odbiorem osobistym
      </h3>
      <p className="mb-4 text-sm text-slate-500">
        Zarezerwuj walutę po aktualnym kursie i odbierz ją w wybranym oddziale.
      </p>

      <div className="mb-3 inline-flex rounded-lg bg-slate-100 p-1 text-sm">
        <button
          type="button"
          onClick={() => setSide("buy")}
          className={`rounded-md px-4 py-1.5 font-medium transition ${
            side === "buy" ? "bg-white text-brand-700 shadow" : "text-slate-500"
          }`}
        >
          Chcę kupić
        </button>
        <button
          type="button"
          onClick={() => setSide("sell")}
          className={`rounded-md px-4 py-1.5 font-medium transition ${
            side === "sell" ? "bg-white text-brand-700 shadow" : "text-slate-500"
          }`}
        >
          Chcę sprzedać
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-500">Waluta</span>
          <select
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            {rates.map((r) => (
              <option key={r.code} value={r.code}>
                {r.code} — {r.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-500">Kwota waluty</span>
          <input
            value={amount}
            inputMode="decimal"
            onChange={(e) => setAmount(e.target.value)}
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-500">Imię i nazwisko</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-500">Telefon</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-500">E-mail (opcjonalnie)</span>
          <input
            value={email}
            type="email"
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-500">Oddział odbioru</span>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            {LOCATIONS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="mt-3 block">
        <span className="mb-1 block text-xs font-medium text-slate-500">Uwagi (opcjonalnie)</span>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </label>

      {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}

      <button
        type="submit"
        disabled={busy}
        className="mt-4 w-full rounded-lg bg-brand-600 px-4 py-2.5 font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
      >
        {busy ? "Wysyłanie..." : "Zarezerwuj walutę"}
      </button>
    </form>
  );
}
