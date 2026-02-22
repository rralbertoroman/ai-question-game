import requests
import string
import random

BASE_URL = "http://localhost:3000"

def random_suffix(length=6):
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))

def register_admin_get_cookie(username, email, password="changeme123"):
    url = f"{BASE_URL}/api/auth/register"
    payload = {
        "username": username,
        "email": email,
        "password": password,
        "confirmPassword": password
    }
    resp = requests.post(url, json=payload, timeout=30)
    resp.raise_for_status()
    assert resp.status_code == 201
    data = resp.json()
    assert data.get("success") is True
    user = data.get("user")
    assert user and "role" in user and user["role"] == "admin"
    # Get auth_session cookie from Set-Cookie header
    cookie_jar = resp.cookies
    auth_cookie = cookie_jar.get("auth_session")
    assert auth_cookie is not None
    return auth_cookie

def test_post_api_rooms_create_room_as_admin():
    # Create unique admin username and email
    suffix = random_suffix()
    admin_username = f"testadmin_{suffix}"
    admin_email = f"{admin_username}@example.com"

    auth_session = None
    room_id = None

    try:
        # Register new user (will become admin)
        auth_session = register_admin_get_cookie(admin_username, admin_email)

        headers = {
            "Cookie": f"auth_session={auth_session}",
            "Content-Type": "application/json"
        }

        # Create a new room with valid name and participantLimit
        room_name = f"Room_{suffix}"
        participant_limit = 6  # valid participant limit

        room_url = f"{BASE_URL}/api/rooms"
        room_payload = {
            "name": room_name,
            "participantLimit": participant_limit
        }

        resp = requests.post(room_url, json=room_payload, headers=headers, timeout=30)
        resp.raise_for_status()
        assert resp.status_code == 201

        data = resp.json()
        assert data.get("success") is True
        room = data.get("room")
        assert room is not None
        assert "id" in room
        assert room.get("name") == room_name
        assert room.get("participantLimit") == participant_limit

        room_id = room.get("id")
    finally:
        # Cleanup: delete created room and logout admin
        if auth_session is not None:
            headers = {"Cookie": f"auth_session={auth_session}"}
            if room_id is not None:
                try:
                    del_url = f"{BASE_URL}/api/rooms/{room_id}"
                    del_resp = requests.delete(del_url, headers=headers, timeout=30)
                    if del_resp.status_code == 200:
                        del_data = del_resp.json()
                        assert del_data.get("success") is True
                except Exception:
                    pass
            # Logout admin
            try:
                logout_url = f"{BASE_URL}/api/auth/logout"
                requests.post(logout_url, headers=headers, timeout=30)
            except Exception:
                pass


test_post_api_rooms_create_room_as_admin()