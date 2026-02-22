import requests
import string
import random

BASE_URL = "http://localhost:3000"
TIMEOUT = 30


def random_suffix(length=6):
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))


def test_get_api_auth_session_with_valid_session():
    session = requests.Session()
    username = f"testuser_{random_suffix()}"
    email = f"{username}@example.com"
    password = "Password123!"

    # Register user to get auth_session cookie
    register_payload = {
        "username": username,
        "email": email,
        "password": password,
        "confirmPassword": password,
    }
    register_url = f"{BASE_URL}/api/auth/register"
    try:
        register_resp = session.post(register_url, json=register_payload, timeout=TIMEOUT)
        assert register_resp.status_code == 201, f"Expected 201 Created, got {register_resp.status_code}"
        reg_json = register_resp.json()
        assert reg_json.get("success") is True, "Register response success not true"
        user = reg_json.get("user")
        assert user and "id" in user and "username" in user and "email" in user and "role" in user, "User details incomplete in register response"
        # Ensure auth_session cookie is set after registration
        auth_session_cookie = session.cookies.get("auth_session")
        assert auth_session_cookie, "auth_session cookie not set after registration"

        # Now, call GET /api/auth/session with the valid auth_session cookie
        session_url = f"{BASE_URL}/api/auth/session"
        session_resp = session.get(session_url, timeout=TIMEOUT)
        assert session_resp.status_code == 200, f"Expected 200 OK, got {session_resp.status_code}"
        session_json = session_resp.json()
        assert "user" in session_json, "Response missing 'user' key"
        assert "session" in session_json, "Response missing 'session' key"
        user_info = session_json["user"]
        session_info = session_json["session"]
        # Check user fields
        assert "id" in user_info and user_info["username"] == username and user_info["email"] == email and "role" in user_info, "User info incorrect in session response"
        # Check session fields
        assert "id" in session_info and "expiresAt" in session_info, "Session info incomplete in session response"
    finally:
        # Logout to clear session and clean up
        logout_url = f"{BASE_URL}/api/auth/logout"
        session.post(logout_url, timeout=TIMEOUT)  # ignore errors on logout


test_get_api_auth_session_with_valid_session()