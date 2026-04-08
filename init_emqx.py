import requests
import time

EMQX_API = "http://emqx:18083/api/v5"


def get_token(password):
    """Получение JWT токена для доступа к API EMQX 5"""
    url = f"{EMQX_API}/login"
    try:
        res = requests.post(url, json={"username": "admin", "password": password})
        if res.status_code == 200:
            return res.json().get("token")
    except Exception as e:
        print(f"Ошибка соединения: {e}")
    return None


def configure():
    print("Подключение к EMQX API...")

    # 1. Авторизация и проверка пароля
    token = get_token("admin123")

    if not token:
        print("Пароль 'admin123' не подошел. Пробуем заводской 'public'...")
        token = get_token("public")

        if not token:
            print("Ошибка: Не удалось авторизоваться ни с одним из паролей.")
            return

        print("Успешный вход с 'public'. Меняем пароль на 'admin123'...")
        headers = {"Authorization": f"Bearer {token}"}
        pwd_data = {"old_pwd": "public", "new_pwd": "admin123"}
        res_pwd = requests.put(f"{EMQX_API}/users/admin/change_pwd", json=pwd_data, headers=headers)
        print(f"Статус смены пароля: HTTP {res_pwd.status_code}")

        # Получаем новый токен с обновленным паролем
        time.sleep(1)
        token = get_token("admin123")
        if not token:
            print("Ошибка при получении токена с новым паролем.")
            return

    # Общие заголовки для всех запросов
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    print("\n--- Применение конфигурации ---")

    # 2. Настройка Аутентификации (Webhook)
    auth_data = {
        "mechanism": "password_based",
        "backend": "http",
        "method": "post",
        "url": "http://api:8000/api/v1/mqtt/auth",
        "body": "username=${username}&password=${password}",
        "headers": {"content-type": "application/x-www-form-urlencoded"},
        "enable": True
    }
    res_auth = requests.post(f"{EMQX_API}/authentication", json=auth_data, headers=headers)
    print(f"Настройка Auth: HTTP {res_auth.status_code} (200/204 - Успех, 400/409 - Уже существует)")

    # 3. Настройка Авторизации (ACL Webhook)
    acl_data = {
        "type": "http",
        "method": "post",
        "url": "http://api:8000/api/v1/mqtt/acl",
        "body": "username=${username}&topic=${topic}&action=${action}",
        "headers": {"content-type": "application/x-www-form-urlencoded"},
        "enable": True
    }
    res_acl = requests.post(f"{EMQX_API}/authorization/sources", json=acl_data, headers=headers)
    print(f"Настройка ACL: HTTP {res_acl.status_code} (200/204 - Успех, 400/409 - Уже существует)")

    # 4. Поднятие приоритета HTTP ACL (перемещение в начало списка)
    # Используется метод move, так как прямая перезапись списка в версиях 5.1+ может быть ограничена
    move_data = {"position": "top"}
    res_move = requests.post(
        f"{EMQX_API}/authorization/sources/http/move",
        json=move_data,
        headers=headers
    )
    if res_move.status_code in [200, 204]:
        print("Приоритет ACL обновлен: HTTP-источник перемещен в начало.")
    else:
        print(f"Приоритет ACL не изменен: HTTP {res_move.status_code} (возможно, он уже первый).")


if __name__ == "__main__":
    configure()