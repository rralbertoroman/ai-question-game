import requests

base_url = "http://localhost:3000"

def test_get_api_auth_session_without_session():
    url = f"{base_url}/api/auth/session"
    try:
        response = requests.get(url, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 401, f"Expected 401 Unauthorized, got {response.status_code}"
    try:
        json_resp = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"
    assert "error" in json_resp, "Error message not present in response"
    assert json_resp["error"] == "Unauthorized", f"Expected error 'Unauthorized', got '{json_resp['error']}'"

test_get_api_auth_session_without_session()