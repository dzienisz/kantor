# Deploy — KANTOR (Etap 1 MVP)

Rekomendowany układ: **backend + PostgreSQL na Railway**, **frontend na Vercel** (lub Cloudflare Pages).

```
[ Vercel / Cloudflare Pages ]        [ Railway ]
   frontend (React/Vite)   --HTTPS-->  backend FastAPI  --->  PostgreSQL
   VITE_API_URL = <backend URL>        CORS_ORIGINS = <frontend URL>
```

---

## 1. Backend + PostgreSQL na Railway

1. Wejdź na https://railway.app → **New Project** → **Deploy from GitHub repo** → wybierz `dzienisz/kantor`.
2. W ustawieniach serwisu ustaw **Root Directory** = `backend` (build używa `backend/Dockerfile`).
3. Dodaj bazę: **New** → **Database** → **PostgreSQL**. Railway utworzy zmienną `DATABASE_URL`.
4. W serwisie backendu → **Variables** → dodaj referencję do `DATABASE_URL` z bazy (Railway: `${{Postgres.DATABASE_URL}}`) oraz zmienne:
   - `SECRET_KEY` — wygeneruj: `python -c "import secrets; print(secrets.token_urlsafe(48))"`
   - `ADMIN_USERNAME` = (np. `admin`)
   - `ADMIN_PASSWORD` = **mocne hasło** (NIE `admin123`)
   - `CORS_ORIGINS` = adres frontu, np. `https://kantor.vercel.app` (po wdrożeniu frontu; można na start dać tymczasowo, potem zaktualizować)
   - `RUN_SCHEDULER` = `true` (zostaw na jednej instancji; przy skalowaniu >1 ustaw `false` na pozostałych)
   - opcjonalnie: `NBP_REFRESH_MINUTES`, `NBP_FETCH_ON_STARTUP`
5. Deploy. Health check: `https://<backend>.up.railway.app/api/health` → `{"status":"ok"}`.
   - Tabele tworzą się automatycznie przy starcie (`Base.metadata.create_all`) i baza jest seedowana (konto admina + domyślne waluty + kursy NBP).

> `DATABASE_URL` w formacie `postgres://`/`postgresql://` jest automatycznie normalizowany do sterownika `psycopg3` — nic nie trzeba zmieniać ręcznie.

### Alternatywa backendu: Render (EU/Frankfurt, darmowy)
Przydatne, gdy darmowy Railway blokuje deploy w EU w godzinach szczytu. W repo jest `render.yaml` (Blueprint) tworzący web service (Docker) + darmowy PostgreSQL we Frankfurcie.

1. https://render.com → zaloguj przez GitHub → **New** → **Blueprint** → wybierz repo `dzienisz/kantor` (Render odczyta `render.yaml` z `main`).
2. Render utworzy `kantor-backend` (Docker, root `backend`) i bazę `kantor-db`. `DATABASE_URL` i `SECRET_KEY` ustawią się automatycznie.
3. Uzupełnij zmienne oznaczone `sync: false`:
   - `ADMIN_PASSWORD` = mocne hasło,
   - `CORS_ORIGINS` = na start `*` (zawęzisz do adresu Vercela po kroku 2).
4. **Apply** → poczekaj na build. Health check: `https://kantor-backend-xxxx.onrender.com/api/health` → `{"status":"ok"}`.
5. Skopiuj URL backendu (`…onrender.com`) — użyjesz go jako `VITE_API_URL` w Vercelu.

> Uwaga (free tier Render): usługa usypia po ~15 min bezczynności (pierwszy request ~30–50 s), a darmowy Postgres wygasa po ~30 dniach. Do produkcji: płatny plan lub Railway EU.

## 2. Frontend na Vercel

1. https://vercel.com → **Add New… → Project** → import `dzienisz/kantor`.
2. **Root Directory** = `frontend` (Framework: Vite — wykryje automatycznie, jest też `vercel.json`).
3. **Environment Variables** → dodaj:
   - `VITE_API_URL` = pełny URL backendu z Railway, np. `https://kantor-backend.up.railway.app` (bez końcowego `/`).
4. Deploy. Vercel da URL, np. `https://kantor.vercel.app`.
5. Wróć do Railway → zaktualizuj `CORS_ORIGINS` na adres z Vercela i zredeployuj backend.

### Alternatywa: Cloudflare Pages
- Projekt → Connect repo → **Build command** `npm run build`, **Output** `dist`, **Root** `frontend`.
- Zmienna `VITE_API_URL` jak wyżej. SPA-routing zapewnia `frontend/public/_redirects`.

## 3. Weryfikacja po wdrożeniu
- Strona publiczna: tabela kursów się ładuje, kalkulator liczy.
- Rezerwacja: utwórz i sprawdź status po kodzie.
- Panel: `/(admin)/login`, zaloguj się, zmień % odchył → strona publiczna odzwierciedla zmianę.

## Uwagi produkcyjne
- **HTTPS** zapewniają Railway i Vercel automatycznie.
- **Hasło admina i SECRET_KEY** ustaw przez zmienne środowiskowe (bez wartości domyślnych).
- **Scheduler NBP** uruchamiaj na jednej instancji (`RUN_SCHEDULER`); alternatywnie wyłącz go i wołaj `POST /api/admin/rates/refresh` zewnętrznym cronem.
- **Region danych:** dla kantoru rozważ EU (Railway: region UE; Vercel działa globalnie na CDN).
