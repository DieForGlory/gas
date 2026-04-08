from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://user:password@127.0.0.1:5433/gas_valves"
    MQTT_BROKER: str = "localhost"
    MQTT_PORT: int = 1883
    MQTT_USER: str = "backend_service"
    MQTT_PASSWORD: str = "secure_mqtt_pass"
    SECRET_KEY: str = "jwt_secret_key_for_dashboard_auth"

    class Config:
        env_file = ".env"


settings = Settings()