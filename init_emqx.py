import requests
from requests.auth import HTTPBasicAuth

EMQX_API = "http://localhost:18083/api/v5"
AUTH = HTTPBasicAuth("admin", "admin123")

def configure():
    auth_data = {
        "mechanism": "password_based",
        "backend": "http",
        "method": "post",
        "url": "http://api:8000/api/v1/mqtt/auth",
        "body": {"username": "${username}", "password": "${password}"},
        "headers": {"content-type": "application/x-www-form-urlencoded"},
        "enable": True
    }
    res_auth = requests.post(f"{EMQX_API}/authentication", json=auth_data, auth=AUTH)
    print(f"Auth configuration: HTTP {res_auth.status_code}")

    acl_data = {
        "type": "http",
        "method": "post",
        "url": "http://api:8000/api/v1/mqtt/acl",
        "body": {"username": "${username}", "topic": "${topic}", "action": "${action}"},
        "headers": {"content-type": "application/x-www-form-urlencoded"},
        "enable": True
    }
    res_acl = requests.post(f"{EMQX_API}/authorization/sources", json=acl_data, auth=AUTH)
    print(f"ACL configuration: HTTP {res_acl.status_code}")

    resp = requests.get(f"{EMQX_API}/authorization/sources", auth=AUTH)
    if resp.status_code == 200:
        sources = resp.json()
        http_src = next((s for s in sources if s.get("type") == "http"), None)
        if http_src:
            sources.remove(http_src)
            sources.insert(0, http_src)
            res_order = requests.put(f"{EMQX_API}/authorization/sources", json=sources, auth=AUTH)
            print(f"ACL priority update: HTTP {res_order.status_code}")

if __name__ == "__main__":
    configure()