# KANTOR — oprogramowanie dla kantoru wymiany walut

Modułowy system dla kantoru wymiany walut. Repozytorium realizuje **Etap 1 (MVP)**:
publiczna strona z kursami, kalkulator walut, cennik z wariantowaniem (% odchył od kursu
rynkowego NBP), rezerwacja waluty z odbiorem osobistym oraz panel administracyjny.

## Funkcje (Etap 1)

- **Kursy z NBP** — automatyczne pobieranie kursów średnich (tabela A) z [API NBP](https://api.nbp.pl),
  z odświeżaniem w tle (scheduler) oraz ręcznym przyciskiem w panelu.
- **Cennik z wariantowaniem** — cena skupu i sprzedaży definiowana jako **procentowy odchył**
  od kursu rynkowego. Warianty (progi ilościowe) pozwalają ustawić ceny hurtowe.
- **Strona publiczna** — tabela kursów (skup/sprzedaż), kalkulator przeliczeń.
- **Rezerwacja z odbiorem osobistym** — klient rezerwuje walutę po aktualnym kursie i odbiera
  ją w wybranym oddziale; sprawdzanie statusu po numerze rezerwacji.
- **Panel administracyjny** — zarządzanie walutami, odchyłami i wariantami, obsługa rezerwacji
  (zmiana statusu) oraz **widok tabletowy** ze szczegółami transakcji dla klienta.

Kolejne etapy (moduł transakcyjny, magazyn, raportowanie NBP/PZKAN, GIIF/AML, księgowość,
sieć kantorów, urządzenia) opisano w `plan` projektu.

## Stack

- **Backend:** FastAPI + SQLAlchemy 2.0 (SQLite domyślnie, gotowe pod PostgreSQL), APScheduler, JWT.
- **Frontend:** React + TypeScript + Vite + Tailwind CSS, React Router.

## Uruchomienie

### Backend

```bash
cd backend
uv venv --python 3.12 .venv
source .venv/bin/activate
uv pip install -e ".[dev]"
cp .env.example .env   # opcjonalnie dostosuj
uvicorn app.main:app --reload --port 8000
```

API: `http://localhost:8000`, dokumentacja Swagger: `http://localhost:8000/docs`.

Przy starcie tworzone jest konto administratora (domyślnie `admin` / `admin123` — zmień w `.env`)
oraz przykładowe waluty, a kursy są pobierane z NBP.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Aplikacja: `http://localhost:5173` (proxy `/api` → backend na porcie 8000).
Panel administracyjny: `http://localhost:5173/admin`.

## Testy i jakość

```bash
# backend
cd backend && source .venv/bin/activate && pytest && ruff check .

# frontend
cd frontend && npm run lint && npm run build
```

## Struktura

```
backend/   FastAPI: modele, NBP, cennik (pricing), routery public/admin/auth, testy
frontend/  React: strona publiczna + panel admina + widok tabletu
```
