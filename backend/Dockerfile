# Backend FastAPI dla KANTOR — obraz produkcyjny (Railway/Fly/dowolny PaaS).
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Instalujemy zaleznosci z pyproject (bez dev). Kopiujemy najpierw metadane dla cache warstw.
COPY pyproject.toml ./
RUN pip install --upgrade pip && pip install .

# Kod aplikacji
COPY app ./app

EXPOSE 8000

# Railway/PaaS podaja port w zmiennej $PORT; lokalnie domyslnie 8000.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
