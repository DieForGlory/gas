import re
from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import CommandStart, CommandObject
from aiogram.enums import ParseMode
from aiogram.client.default import DefaultBotProperties
from aiogram.types import ReplyKeyboardMarkup, KeyboardButton, ReplyKeyboardRemove
from fastapi.concurrency import run_in_threadpool # Импорт для пула потоков

from app.core.config import settings
from app.core.database import SessionLocal
from app import models

bot = Bot(
    token=settings.TELEGRAM_BOT_TOKEN,
    default=DefaultBotProperties(parse_mode=ParseMode.HTML)
)
dp = Dispatcher()

# --- Синхронные функции для БД ---
def process_start_token_sync(token: str, tg_id: str):
    with SessionLocal() as db:
        user = db.query(models.User).filter(models.User.link_token == token).first()
        if not user:
            return "invalid_token", None

        user.telegram_id = tg_id
        user.is_telegram_approved = False
        db.commit()
        return "success", user.username

def process_contact_sync(tg_phone: str, tg_id: str):
    with SessionLocal() as db:
        user = db.query(models.User).filter(models.User.telegram_id == tg_id).first()
        if not user: return "not_found"
        if user.is_telegram_approved: return "already_approved"
        if not user.phone: return "no_phone"

        db_phone = re.sub(r'\D', '', user.phone)
        if tg_phone == db_phone or tg_phone.endswith(db_phone) or db_phone.endswith(tg_phone):
            user.is_telegram_approved = True
            user.link_token = None
            db.commit()
            return "success"
        else:
            return "mismatch"


# --- Асинхронные обработчики бота ---
@dp.message(CommandStart())
async def command_start_handler(message: types.Message, command: CommandObject):
    token = command.args
    if not token:
        await message.answer("Отсутствует токен привязки.")
        return

    # Вызываем БД в отдельном потоке
    status, username = await run_in_threadpool(process_start_token_sync, token, str(message.from_user.id))

    if status == "invalid_token":
        await message.answer("Неверный или устаревший токен.")
        return

    keyboard = ReplyKeyboardMarkup(
        keyboard=[[KeyboardButton(text="📱 Отправить номер телефона", request_contact=True)]],
        resize_keyboard=True,
        one_time_keyboard=True
    )

    await message.answer(
        f"Здравствуйте, <b>{username}</b>!\nДля завершения привязки аккаунта необходимо подтвердить номер телефона.\nНажмите кнопку ниже, чтобы поделиться контактом.",
        reply_markup=keyboard
    )

@dp.message(F.contact)
async def contact_handler(message: types.Message):
    if not message.contact: return

    tg_phone = re.sub(r'\D', '', message.contact.phone_number)
    tg_id = str(message.from_user.id)

    # Вызываем БД в отдельном потоке
    status = await run_in_threadpool(process_contact_sync, tg_phone, tg_id)

    if status == "not_found":
        await message.answer("Сначала отправьте команду /start с токеном привязки.", reply_markup=ReplyKeyboardRemove())
    elif status == "already_approved":
        await message.answer("Ваш аккаунт уже подтвержден. Вы можете войти в систему.", reply_markup=ReplyKeyboardRemove())
    elif status == "no_phone":
        await message.answer("В вашей учетной записи не указан номер телефона. Обратитесь к администратору для заполнения профиля.", reply_markup=ReplyKeyboardRemove())
    elif status == "success":
        await message.answer("✅ Учетная запись успешно привязана!\nТеперь вы можете вернуться на сайт и повторно выполнить вход.", reply_markup=ReplyKeyboardRemove())
    elif status == "mismatch":
        await message.answer("❌ Номер телефона из Telegram не совпадает с номером в системе. В доступе отказано.", reply_markup=ReplyKeyboardRemove())

async def start_bot():
    await dp.start_polling(bot)