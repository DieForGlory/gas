import requests
from requests.auth import HTTPBasicAuth
import time

EMQX_API = "http://localhost:18083/api/v5"


def configure():
    # 1. Проверяем текущий пароль
    auth = HTTPBasicAuth("admin", "admin123")
    res = requests.get(f"{EMQX_API}/authorization/sources", auth=auth)

    if res.status_code == 401:
        print("Пароль 'admin123' не подошел. Пробуем заводской 'public'...")
        auth = HTTPBasicAuth("admin", "public")
        res = requests.get(f"{EMQX_API}/authorization/sources", auth=auth)

        if res.status_code == 401:
            print("Ошибка: Не удалось войти ни с 'public', ни с 'admin123'.")
            return
        else:
            print("Успешный вход с 'public'. Меняем пароль на 'admin123'...")
            pwd_data = {"old_pwd": "public", "new_pwd": "admin123"}
            res_pwd = requests.put(f"{EMQX_API}/users/admin/change_pwd", json=pwd_data, auth=auth)
            print(f"Статус смены пароля: HTTP {res_pwd.status_code}")
            auth = HTTPBasicAuth("admin", "admin123")  # Переключаемся на новый пароль
            time.sleep(1)

    print("\n--- Применение конфигурации ---")

    # 2. Настройка Аутентификации
    auth_data = {
        "mechanism": "password_based",
        "backend": "http",
        "method": "post",
        "url": "http://api:8000/api/v1/mqtt/auth",
        "body": {"username": "${username}", "password": "${password}"},
        "headers": {"content-type": "application/x-www-form-urlencoded"},
        "enable": True
    }
    res_auth = requests.post(f"{EMQX_API}/authentication", json=auth_data, auth=auth)
    print(f"Настройка Auth: HTTP {res_auth.status_code} (200/201/204 - Успех, 400 - Уже существует)")

    # 3. Настройка Авторизации (ACL)
    acl_data = {
        "type": "http",
        "method": "post",
        "url": "http://api:8000/api/v1/mqtt/acl",
        "body": {"username": "${username}", "topic": "${topic}", "action": "${action}"},
        "headers": {"content-type": "application/x-www-form-urlencoded"},
        "enable": True
    }
    res_acl = requests.post(f"{EMQX_API}/authorization/sources", json=acl_data, auth=auth)
    print(f"Настройка ACL: HTTP {res_acl.status_code} (200/201/204 - Успех, 400 - Уже существует)")

    # 4. Поднятие приоритета HTTP ACL над встроенными правилами
    resp = requests.get(f"{EMQX_API}/authorization/sources", auth=auth)
    if resp.status_code == 200:
        sources = resp.json()
        http_src = next((s for s in sources if s.get("type") == "http"), None)
        if http_src:
            sources.remove(http_src)
            sources.insert(0, http_src)
            res_order = requests.put(f"{EMQX_API}/authorization/sources", json=sources, auth=auth)
            print(f"Приоритет ACL обновлен: HTTP {res_order.status_code}")


if __name__ == "__main__":
    configure()