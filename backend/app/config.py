from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Konfiguracja aplikacji ladowana ze zmiennych srodowiskowych / pliku .env."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = "sqlite:///./kantor.db"

    # Bezpieczenstwo / auth
    secret_key: str = "zmien-mnie-w-produkcji-bardzo-tajny-klucz"
    access_token_expire_minutes: int = 60 * 12

    # Domyslne konto administratora (tworzone przy seedowaniu)
    admin_username: str = "admin"
    admin_password: str = "admin123"

    # NBP
    nbp_table: str = "A"  # tabela kursow srednich
    nbp_base_url: str = "https://api.nbp.pl/api"
    nbp_refresh_minutes: int = 30
    nbp_fetch_on_startup: bool = True

    # CORS
    cors_origins: str = "*"


@lru_cache
def get_settings() -> Settings:
    return Settings()
