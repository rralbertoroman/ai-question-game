import requests
import random
import string

BASE_URL = "http://localhost:3000"
TIMEOUT = 30


def random_suffix(length=6):
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))


def test_post_api_auth_login_valid_credentials():
    # Step 1: Register a new user (to have valid username and password for login)
    username = f"testuser_{random_suffix()}"
    email = f"{username}@example.com"
    password = "Password123"
    register_url = f"{BASE_URL}/api/auth/register"
    register_payload = {
        "username": username,
        "email": email,
        "password": password,
        "confirmPassword": password,
    }

    auth_session_cookie = None

    try:
        register_response = requests.post(
            register_url,
            json=register_payload,
            timeout=TIMEOUT,
        )
        assert register_response.status_code == 201, f"Expected 201, got {register_response.status_code} - {register_response.text}"
        register_data = register_response.json()
        assert register_data.get("success") is True, "Register success flag not True"
        user = register_data.get("user")
        assert user is not None, "User data missing in register response"
        assert user.get("username") == username
        # Capture auth_session cookie from register (not required for this test but good to verify)
        cookie_jar = register_response.cookies
        if "auth_session" in cookie_jar:
            auth_session_cookie = cookie_jar.get("auth_session")

        # Step 2: Logout to remove any session from register step to test fresh login
        if auth_session_cookie:
            logout_url = f"{BASE_URL}/api/auth/logout"
            logout_headers = {"Cookie": f"auth_session={auth_session_cookie}"}
            requests.post(logout_url, headers=logout_headers, timeout=TIMEOUT)

        # Step 3: Perform login with valid credentials
        login_url = f"{BASE_URL}/api/auth/login"
        login_payload = {
            "username": username,
            "password": password,
        }
        login_response = requests.post(
            login_url,
            json=login_payload,
            timeout=TIMEOUT,
        )
        assert login_response.status_code == 200, f"Expected 200, got {login_response.status_code} - {login_response.text}"
        login_data = login_response.json()
        assert login_data.get("success") is True, "Login success flag not True"
        login_user = login_data.get("user")
        assert login_user is not None, "User data missing in login response"
        assert login_user.get("username") == username
        # auth_session cookie must be set in Set-Cookie header
        set_cookie = login_response.headers.get("Set-Cookie")
        assert set_cookie is not None, "Set-Cookie header missing in login response"
        assert "auth_session=" in set_cookie, "auth_session cookie not set in login response"

    finally:
        # Cleanup: Delete the test user if possible
        # Since API does not provide delete user, skip cleanup here
        pass


test_post_api_auth_login_valid_credentials()