import logging
import secrets
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger("kantor")

# Wartosci domyslne tylko do lokalnego developmentu — w produkcji ustaw przez .env.
DEV_ADMIN_PASSWORD = "admin123"


class Settings(BaseSettings):
    """Konfiguracja aplikacji ladowana ze zmiennych srodowiskowych / pliku .env."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = "sqlite:///./kantor.db"

    # Scheduler NBP. Przy wielu instancjach backendu ustaw na false poza jedna instancja,
    # zeby nie pobierac kursow rownolegle (lub odswiezaj przez zewnetrzny cron + endpoint).
    run_scheduler: bool = True

    # Bezpieczenstwo / auth. Pusty -> losowy klucz na czas dzialania procesu (patrz get_settings).
    secret_key: str = ""
    access_token_expire_minutes: int = 60 * 12

    # Domyslne konto administratora (tworzone przy seedowaniu)
    admin_username: str = "admin"
    admin_password: str = DEV_ADMIN_PASSWORD

    # NBP
    nbp_table: str = "A"  # tabela kursow srednich
    nbp_base_url: str = "https://api.nbp.pl/api"
    nbp_refresh_minutes: int = 30
    nbp_fetch_on_startup: bool = True

    # CORS — lista origin po przecinku albo "*".
    cors_origins: str = "*"

    @property
    def sqlalchemy_database_url(self) -> str:
        """Znormalizowany URL bazy dla SQLAlchemy.

        Dostawcy (Railway/Heroku) podaja DATABASE_URL jako 'postgres://' albo
        'postgresql://' — wymuszamy sterownik psycopg3 ('postgresql+psycopg://').
        """
        url = self.database_url
        if url.startswith("postgres://"):
            url = "postgresql+psycopg://" + url[len("postgres://"):]
        elif url.startswith("postgresql://"):
            url = "postgresql+psycopg://" + url[len("postgresql://"):]
        return url

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def cors_allow_wildcard(self) -> bool:
        return "*" in self.cors_origin_list


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    if not settings.secret_key:
        # Brak SECRET_KEY: generujemy losowy klucz, ale tokeny wygasna po restarcie.
        settings.secret_key = secrets.token_urlsafe(48)
        logger.warning(
            "SECRET_KEY nie jest ustawiony — wygenerowano losowy klucz na czas dzialania "
            "procesu. Ustaw SECRET_KEY w .env do produkcji (inaczej tokeny wygasaja po restarcie)."
        )
    if settings.admin_password == DEV_ADMIN_PASSWORD:
        logger.warning(
            "ADMIN_PASSWORD ma wartosc domyslna — zmien ja w .env przed wdrozeniem produkcyjnym."
        )
    return settings
