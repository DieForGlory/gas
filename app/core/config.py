from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Переменные базы данных из .env
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_SERVER: str = "db"
    POSTGRES_PORT: str = "5432"
    POSTGRES_DB: str = "gas_control"

    # Остальные настройки
    MQTT_BROKER: str = "emqx"
    MQTT_PORT: int = 1883
    SERVER_URL: str = "http://95.130.227.120"
    MQTT_USER: str = "admin"
    MQTT_PASSWORD: str = "public"
    TELEGRAM_BOT_TOKEN: str = "8359996110:AAEwKDNVhQJcaASpfsEXoms88vB5IWoONcA"
    SECRET_KEY: str = "jwt_secret_key_for_dashboard_auth"
    TELEGRAM_BOT_USERNAME: str = "Gas_auth_bot"

    # Pydantic V2 конфигурация (игнорировать неучтенные переменные .env)
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Динамическая сборка URL для подключения к базе данных
    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"


settings = Settings()