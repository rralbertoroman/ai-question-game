import requests
import string
import random

BASE_URL = "http://localhost:3000"

def random_suffix(length=6):
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))

def test_post_api_auth_logout_valid_session():
    session = requests.Session()

    # Register a new unique user
    username = f"testuser_{random_suffix()}"
    email = f"{username}@example.com"
    password = "password123"

    register_payload = {
        "username": username,
        "email": email,
        "password": password,
        "confirmPassword": password
    }
    # Register user (no auth required)
    register_resp = session.post(f"{BASE_URL}/api/auth/register", json=register_payload, timeout=30)
    assert register_resp.status_code == 201, f"Register failed with status {register_resp.status_code}: {register_resp.text}"
    register_json = register_resp.json()
    assert register_json.get("success") is True
    user = register_json.get("user")
    assert user is not None
    assert user.get("username") == username
    assert "role" in user

    # The Set-Cookie with auth_session should be set in session.cookies automatically

    try:
        # Logout using the auth_session cookie
        logout_resp = session.post(f"{BASE_URL}/api/auth/logout", timeout=30)
        assert logout_resp.status_code == 200, f"Logout failed with status {logout_resp.status_code}: {logout_resp.text}"
        logout_json = logout_resp.json()
        assert logout_json.get("success") is True

        # After logout, auth_session cookie should be cleared
        cookies = session.cookies.get_dict()
        # The cookie may be removed or cleared
        # Sometimes the cookie may still remain but cleared (empty value and past expiry)
        auth_session = cookies.get("auth_session")
        assert auth_session in (None, ""), "auth_session cookie was not cleared after logout"
    finally:
        # Clean up: no deletion endpoint for user; leaving it as is
        pass

test_post_api_auth_logout_valid_session()