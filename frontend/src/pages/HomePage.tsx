import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type RatesResponse } from "../api";
import Calculator from "../components/Calculator";
import RatesTable from "../components/RatesTable";
import ReservationForm from "../components/ReservationForm";
import ReservationStatus from "../components/ReservationStatus";

export default function HomePage() {
  const [data, setData] = useState<RatesResponse | null>(null);
  const [code, setCode] = useState("EUR");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = () =>
      api
        .getRates()
        .then((r) => {
          if (!active) return;
          setData(r);
          setLoading(false);
          if (r.rates.length && !r.rates.find((x) => x.code === code)) {
            setCode(r.rates[0].code);
          }
        })
        .catch(() => active && setLoading(false));
    load();
    const t = setInterval(load, 60_000);
    return () => {
      active = false;
      clearInterval(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rates = data?.rates ?? [];

  return (
    <div className="min-h-screen">
      <header className="bg-brand-900 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💱</span>
            <span className="text-xl font-bold tracking-tight">KANTOR</span>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <a href="#kursy" className="hover:text-brand-100">Kursy</a>
            <a href="#rezerwacja" className="hover:text-brand-100">Rezerwacja</a>
            <Link
              to="/admin"
              className="rounded-lg bg-white/10 px-3 py-1.5 font-medium hover:bg-white/20"
            >
              Panel
            </Link>
          </nav>
        </div>
      </header>

      <section className="bg-gradient-to-b from-brand-900 to-brand-700 text-white">
        <div className="mx-auto max-w-6xl px-4 pb-10 pt-6">
          <h1 className="max-w-2xl text-3xl font-bold sm:text-4xl">
            Wymiana walut po atrakcyjnych kursach
          </h1>
          <p className="mt-2 max-w-xl text-brand-100">
            Aktualne kursy aktualizowane na podstawie kursów rynkowych NBP. Zarezerwuj walutę
            online i odbierz ją osobiście w naszym oddziale.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2" id="kursy">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">Tabela kursów</h2>
              {data?.updated_at && (
                <span className="text-xs text-slate-500">
                  Aktualizacja: {new Date(data.updated_at).toLocaleString("pl-PL")}
                </span>
              )}
            </div>
            {loading ? (
              <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-400">
                Ładowanie kursów...
              </div>
            ) : (
              <RatesTable rates={rates} selectedCode={code} onSelect={setCode} />
            )}
            <p className="mt-2 text-xs text-slate-400">
              Kursy mają charakter informacyjny. Cena skupu/sprzedaży to ustalony procentowy
              odchył od kursu rynkowego NBP.
            </p>
          </div>

          <div className="space-y-6">
            <Calculator rates={rates} code={code} onCodeChange={setCode} />
            <ReservationStatus />
          </div>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-2" id="rezerwacja">
          <ReservationForm rates={rates} defaultCode={code} />
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Jak to działa?</h3>
            <ol className="mt-4 space-y-3 text-sm text-slate-600">
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">1</span>
                Wybierz walutę i kwotę, sprawdź kurs w kalkulatorze.
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">2</span>
                Złóż rezerwację po aktualnym kursie i wybierz oddział odbioru.
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">3</span>
                Odbierz walutę osobiście — bez ryzyka i kosztów przesyłki kurierskiej.
              </li>
            </ol>
            <div className="mt-6 rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
              Transakcje gotówkowe realizujemy zgodnie z wymogami AML. Przy transakcjach
              ponadprogowych może być wymagana weryfikacja tożsamości.
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="mx-auto max-w-6xl px-4 text-center text-xs text-slate-400">
          KANTOR — Etap 1 (MVP). Kursy na podstawie API NBP.
        </div>
      </footer>
    </div>
  );
}
