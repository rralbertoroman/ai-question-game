import requests
import string
import random

BASE_URL = "http://localhost:3000"
REGISTER_ENDPOINT = f"{BASE_URL}/api/auth/register"
TIMEOUT = 30

def generate_unique_username():
    suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))
    return f"testuser_{suffix}"

def test_post_api_auth_register_valid_user():
    username = generate_unique_username()
    email = f"{username}@example.com"
    password = "Password123!"
    payload = {
        "username": username,
        "email": email,
        "password": password,
        "confirmPassword": password
    }
    headers = {
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(REGISTER_ENDPOINT, json=payload, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request to register user failed: {e}"

    # Validate status code 201
    assert response.status_code == 201, f"Expected status code 201, got {response.status_code}. Response: {response.text}"

    # Validate JSON response content
    try:
        data = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    assert data.get("success") is True, f"Expected success=True in response, got: {data}"
    user = data.get("user")
    assert user is not None, "Response missing 'user' field"
    assert user.get("username") == username, f"Expected username '{username}', got '{user.get('username')}'"
    assert user.get("email") == email, f"Expected email '{email}', got '{user.get('email')}'"
    # Role should be 'admin' if first user, else 'candidate' - we cannot guarantee first user status here, so just check value
    assert user.get("role") in ("admin", "candidate"), f"Invalid role '{user.get('role')}' in response"

    # Validate Set-Cookie header includes 'auth_session' cookie
    set_cookie = response.headers.get("Set-Cookie")
    assert set_cookie is not None, "Set-Cookie header not present"
    assert "auth_session=" in set_cookie, f"auth_session cookie not found in Set-Cookie header: {set_cookie}"

test_post_api_auth_register_valid_user()