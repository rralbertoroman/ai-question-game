import requests
import string
import random

BASE_URL = "http://localhost:3000"
REGISTER_ENDPOINT = f"{BASE_URL}/api/auth/register"

def random_suffix(length=6):
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))

def test_post_api_auth_register_duplicate_username_or_email():
    timeout = 30
    headers = {"Content-Type": "application/json"}

    # Step 1: Register a unique user to get an existing username and email for duplicate test
    unique_suffix = random_suffix()
    username = f"testuser_{unique_suffix}"
    email = f"testuser_{unique_suffix}@example.com"
    password = "password123"
    register_payload = {
        "username": username,
        "email": email,
        "password": password,
        "confirmPassword": password
    }

    # Register first user (should succeed)
    resp = requests.post(REGISTER_ENDPOINT, json=register_payload, headers=headers, timeout=timeout)
    assert resp.status_code == 201, f"Expected 201 on initial register but got {resp.status_code}"
    resp_json = resp.json()
    assert resp_json.get("success") is True
    user = resp_json.get("user", {})
    assert user.get("username") == username
    assert user.get("email") == email
    # auth_session cookie should be set
    cookies = resp.cookies
    assert 'auth_session' in cookies

    # Prepare duplicate registration payloads
    duplicate_username_payload = {
        "username": username,
        "email": f"diffemail_{unique_suffix}@example.com",
        "password": password,
        "confirmPassword": password
    }
    duplicate_email_payload = {
        "username": f"diffuser_{unique_suffix}",
        "email": email,
        "password": password,
        "confirmPassword": password
    }

    # Step 2: Attempt to register with duplicate username
    dup_user_resp = requests.post(REGISTER_ENDPOINT, json=duplicate_username_payload, headers=headers, timeout=timeout)
    assert dup_user_resp.status_code == 400, f"Expected 400 for duplicate username but got {dup_user_resp.status_code}"
    dup_user_json = dup_user_resp.json()
    # The error message should indicate duplicate username in Spanish
    assert "error" in dup_user_json
    assert dup_user_json["error"] == "Nombre de usuario ya registrado"

    # Step 3: Attempt to register with duplicate email
    dup_email_resp = requests.post(REGISTER_ENDPOINT, json=duplicate_email_payload, headers=headers, timeout=timeout)
    assert dup_email_resp.status_code == 400, f"Expected 400 for duplicate email but got {dup_email_resp.status_code}"
    dup_email_json = dup_email_resp.json()
    # The error message should indicate duplicate email in Spanish
    assert "error" in dup_email_json
    assert dup_email_json["error"] == "Correo electrónico ya registrado"

test_post_api_auth_register_duplicate_username_or_email()