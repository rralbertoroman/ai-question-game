import requests
import random
import string

BASE_URL = "http://localhost:3000"
REGISTER_ENDPOINT = "/api/auth/register"
TIMEOUT = 30


def random_suffix(length=6):
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))


def test_post_api_auth_register_invalid_input():
    url = BASE_URL + REGISTER_ENDPOINT
    headers = {"Content-Type": "application/json"}

    # Test case 1: Username too short (less than 3 chars)
    payload_short_username = {
        "username": "ab",
        "email": f"test_{random_suffix()}@example.com",
        "password": "validPass123",
        "confirmPassword": "validPass123"
    }
    try:
        resp = requests.post(url, json=payload_short_username, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"
    assert resp.status_code == 400, f"Expected 400 status for short username, got {resp.status_code}"
    resp_json = resp.json()
    assert "error" in resp_json and resp_json["error"] == "Validation failed", "Expected 'Validation failed' as exact error message"
    assert "details" in resp_json and isinstance(resp_json["details"], list), "Expected validation error details"

    # Test case 2: Password and confirmPassword mismatch
    payload_password_mismatch = {
        "username": f"testuser_{random_suffix()}",
        "email": f"test_{random_suffix()}@example.com",
        "password": "validPass123",
        "confirmPassword": "differentPass123"
    }
    try:
        resp2 = requests.post(url, json=payload_password_mismatch, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"
    assert resp2.status_code == 400, f"Expected 400 status for password mismatch, got {resp2.status_code}"
    resp2_json = resp2.json()
    assert "error" in resp2_json and resp2_json["error"] == "Validation failed", "Expected 'Validation failed' as exact error message"
    assert "details" in resp2_json and isinstance(resp2_json["details"], list), "Expected validation error details"


test_post_api_auth_register_invalid_input()
