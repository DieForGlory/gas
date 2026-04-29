import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.bot.core import start_bot
from app import models
from app.core.database import engine
from app.mqtt.client import mqtt_listener
from app.core.tasks import process_device_retries, check_offline_status
from app.api.v1 import api_router
import os
from fastapi.staticfiles import StaticFiles

models.Base.metadata.create_all(bind=engine)
scheduler = AsyncIOScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    mqtt_task = asyncio.create_task(mqtt_listener())

    scheduler.add_job(process_device_retries, 'interval', seconds=30)
    scheduler.add_job(check_offline_status, 'interval', minutes=5)
    scheduler.start()

    yield

    scheduler.shutdown()
    mqtt_task.cancel()

os.makedirs("firmware_files", exist_ok=True)
app = FastAPI(title="Gas Valve Control System API", version="3.0", lifespan=lifespan)
app.mount("/files", StaticFiles(directory="firmware_files"), name="files")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://95.130.227.120:5173",
        "http://95.130.227.120",
        "https://smartvalve.uz",  # <-- Обязательно
        "https://www.smartvalve.uz"  # <-- Обязательно
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")