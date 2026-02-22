import requests
import random
import string

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def random_suffix(length=6):
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))

def test_post_api_auth_login_invalid_credentials():
    session = requests.Session()

    # Step 1: Register a new user with valid credentials to ensure user exists or for unique user base
    username = f"testuser_{random_suffix()}"
    email = f"{username}@example.com"
    password = "Password123"

    register_payload = {
        "username": username,
        "email": email,
        "password": password,
        "confirmPassword": password
    }
    register_response = session.post(
        f"{BASE_URL}/api/auth/register",
        json=register_payload,
        timeout=TIMEOUT
    )
    assert register_response.status_code == 201, f"Register failed: {register_response.text}"
    assert register_response.json().get("success") is True
    # Capture auth_session cookie after register (not strictly needed for login test but per instructions)
    assert "auth_session" in register_response.cookies, "Auth session cookie missing after register"

    # Logout the newly registered user to clear auth_session cookie before login test
    logout_response = session.post(f"{BASE_URL}/api/auth/logout", timeout=TIMEOUT, cookies=register_response.cookies)
    # Logout may succeed or 401 if already logged out; ignore if 401
    if logout_response.status_code not in (200, 401):
        assert False, f"Unexpected logout response: {logout_response.status_code}"

    # Step 2: Attempt login with invalid username (non-existent user)
    invalid_username = username + "_invalid"
    invalid_password = "WrongPass123"
    login_payload = {
        "username": invalid_username,
        "password": password
    }
    login_response = session.post(
        f"{BASE_URL}/api/auth/login",
        json=login_payload,
        timeout=TIMEOUT
    )
    assert login_response.status_code == 401, f"Expected 401 for invalid username login but got {login_response.status_code}"
    error_json = login_response.json()
    assert "error" in error_json, "Error message missing for invalid username"
    assert error_json["error"] == "Credenciales inválidas", f"Unexpected error message: {error_json['error']}"

    # Step 3: Attempt login with valid username but invalid password
    login_payload = {
        "username": username,
        "password": invalid_password
    }
    login_response = session.post(
        f"{BASE_URL}/api/auth/login",
        json=login_payload,
        timeout=TIMEOUT
    )
    assert login_response.status_code == 401, f"Expected 401 for invalid password login but got {login_response.status_code}"
    error_json = login_response.json()
    assert "error" in error_json, "Error message missing for invalid password"
    assert error_json["error"] == "Credenciales inválidas", f"Unexpected error message: {error_json['error']}"

test_post_api_auth_login_invalid_credentials()