import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30


def test_post_api_auth_logout_without_session():
    url = f"{BASE_URL}/api/auth/logout"
    headers = {
        # No auth_session cookie included
    }

    try:
        response = requests.post(url, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 401
    try:
        data = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    assert "error" in data
    assert data["error"].lower() in ["unauthorized", "no autorizado", "no autorizada", "sin autorización"] or "401" in str(data["error"]).lower()


test_post_api_auth_logout_without_session()