#!/usr/bin/env python3
"""
=============================================================
MODULE 8: SOCIAL LINKS & PROFILES CMS — END-TO-END VERIFICATION
=============================================================
Tests:
1. Static endpoints & asset availability (HTML, CSS, JS, mirrored copies)
2. Public social links retrieval via /api/social/public
3. Admin authentication login via /api/auth/login
4. Admin listing of all social links via /api/social
5. Admin creation of new social link (POST /api/social)
6. Admin retrieval of single social link (GET /api/social/{id})
7. Admin update of social link (PUT /api/social/{id})
8. Admin active toggle (PATCH /api/social/{id}/toggle)
9. Admin reorder links (POST /api/social/reorder)
10. Admin deletion and 404 cleanup verification (DELETE /api/social/{id})
=============================================================
"""

import sys
import json
import urllib.request
import urllib.parse
import urllib.error

BASE_URL = "http://127.0.0.1:8000"

def request_json(url, method="GET", data=None, headers=None):
    if headers is None:
        headers = {}
    
    encoded_data = None
    if data is not None:
        if isinstance(data, dict):
            encoded_data = json.dumps(data).encode("utf-8")
            headers["Content-Type"] = "application/json"
        elif isinstance(data, bytes):
            encoded_data = data

    req = urllib.request.Request(url, data=encoded_data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            status = resp.status
            body = resp.read().decode("utf-8")
            try:
                parsed = json.loads(body)
            except Exception:
                parsed = body
            return status, parsed
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            parsed = json.loads(body)
        except Exception:
            parsed = body
        return e.code, parsed
    except Exception as e:
        return 500, str(e)

def check_status(url):
    req = urllib.request.Request(url, method="GET")
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status
    except urllib.error.HTTPError as e:
        return e.code
    except Exception:
        return 500

def run_tests():
    print("=" * 65)
    print("STARTING MODULE 8 E2E VERIFICATION SUITE")
    print("=" * 65)
    
    passed_tests = 0
    total_tests = 0

    def assert_test(name, condition, details=""):
        nonlocal passed_tests, total_tests
        total_tests += 1
        if condition:
            passed_tests += 1
            print(f"[PASS] Test {total_tests}: {name}")
        else:
            print(f"[FAIL] Test {total_tests}: {name} -> {details}")

    # 1. Static Files Test
    static_endpoints = [
        "/index.html",
        "/admin/social.html",
        "/admin/css/social.css",
        "/admin/js/social.js",
        "/css/social.css",
        "/js/social.js",
    ]
    for ep in static_endpoints:
        code = check_status(f"{BASE_URL}{ep}")
        assert_test(f"Static Asset: {ep}", code == 200, f"Expected 200, got {code}")

    # 2. Public Social Links
    pub_status, pub_links = request_json(f"{BASE_URL}/api/social/public")
    assert_test(
        "Public Social Links (GET /api/social/public)",
        pub_status == 200 and isinstance(pub_links, list) and len(pub_links) >= 1,
        f"Status: {pub_status}, Count: {len(pub_links) if isinstance(pub_links, list) else 0}"
    )

    # 3. Admin Authentication Login
    login_form = urllib.parse.urlencode({
        "username": "admin",
        "password": "adminpassword123"
    }).encode("utf-8")
    login_status, login_res = request_json(
        f"{BASE_URL}/api/auth/login",
        method="POST",
        data=login_form,
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    token = login_res.get("access_token") if isinstance(login_res, dict) else None
    assert_test(
        "Admin Authentication (POST /api/auth/login)",
        login_status == 200 and token is not None,
        f"Status: {login_status}, Response: {login_res}"
    )

    if not token:
        print("[CRITICAL] Authentication failed. Aborting admin tests.")
        sys.exit(1)

    auth_headers = {"Authorization": f"Bearer {token}"}

    # 4. Admin List All Social Links
    admin_status, admin_links = request_json(
        f"{BASE_URL}/api/social",
        method="GET",
        headers=auth_headers
    )
    assert_test(
        "Admin Social Links List (GET /api/social)",
        admin_status == 200 and isinstance(admin_links, list) and len(admin_links) >= 1,
        f"Status: {admin_status}, Count: {len(admin_links) if isinstance(admin_links, list) else 0}"
    )

    # 5. Admin Create Social Link
    create_payload = {
        "platform_name": "E2E Test Platform",
        "url": "https://e2etest.example.com/alexander",
        "icon_svg": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><circle cx='12' cy='12' r='10'/></svg>",
        "icon_class": "e2e-test",
        "display_order": 99,
        "is_active": True
    }
    create_status, create_res = request_json(
        f"{BASE_URL}/api/social",
        method="POST",
        data=create_payload,
        headers=auth_headers
    )
    assert_test(
        "Admin Create Social Link (POST /api/social)",
        create_status == 201 and isinstance(create_res, dict) and "id" in create_res,
        f"Status: {create_status}, Response: {create_res}"
    )
    test_link_id = create_res.get("id") if isinstance(create_res, dict) else None

    if test_link_id:
        # 6. Admin Get Single Social Link
        get_status, get_res = request_json(
            f"{BASE_URL}/api/social/{test_link_id}",
            method="GET",
            headers=auth_headers
        )
        assert_test(
            "Admin Get Single Link (GET /api/social/{id})",
            get_status == 200 and get_res.get("platform_name") == "E2E Test Platform",
            f"Status: {get_status}, Platform: {get_res.get('platform_name') if isinstance(get_res, dict) else 'N/A'}"
        )

        # 7. Admin Update Social Link
        update_payload = {
            "platform_name": "Updated E2E Platform",
            "url": "https://updated-e2e.example.com/alexander",
            "display_order": 100
        }
        put_status, put_res = request_json(
            f"{BASE_URL}/api/social/{test_link_id}",
            method="PUT",
            data=update_payload,
            headers=auth_headers
        )
        assert_test(
            "Admin Update Social Link (PUT /api/social/{id})",
            put_status == 200 and put_res.get("platform_name") == "Updated E2E Platform",
            f"Status: {put_status}, Platform: {put_res.get('platform_name') if isinstance(put_res, dict) else 'N/A'}"
        )

        # 8. Admin Toggle Active Status
        toggle_status, toggle_res = request_json(
            f"{BASE_URL}/api/social/{test_link_id}/toggle",
            method="PATCH",
            headers=auth_headers
        )
        assert_test(
            "Admin Toggle Active to False (PATCH /api/social/{id}/toggle)",
            toggle_status == 200 and toggle_res.get("is_active") is False,
            f"Status: {toggle_status}, is_active: {toggle_res.get('is_active') if isinstance(toggle_res, dict) else 'N/A'}"
        )

        # 9. Admin Reorder Social Links
        reorder_payload = {
            "items": [
                {"id": test_link_id, "display_order": 10}
            ]
        }
        reorder_status, reorder_res = request_json(
            f"{BASE_URL}/api/social/reorder",
            method="POST",
            data=reorder_payload,
            headers=auth_headers
        )
        assert_test(
            "Admin Reorder Social Links (POST /api/social/reorder)",
            reorder_status == 200,
            f"Status: {reorder_status}, Response: {reorder_res}"
        )

        # 10. Admin Delete Social Link
        del_status, del_res = request_json(
            f"{BASE_URL}/api/social/{test_link_id}",
            method="DELETE",
            headers=auth_headers
        )
        assert_test(
            "Admin Delete Social Link (DELETE /api/social/{id})",
            del_status == 200,
            f"Status: {del_status}, Response: {del_res}"
        )

        # 11. Verify 404 after Deletion
        get_deleted_status, _ = request_json(
            f"{BASE_URL}/api/social/{test_link_id}",
            method="GET",
            headers=auth_headers
        )
        assert_test(
            "Verify Deleted Social Link 404",
            get_deleted_status == 404,
            f"Expected 404, got {get_deleted_status}"
        )

    print("=" * 65)
    print(f"MODULE 8 E2E RESULTS: {passed_tests}/{total_tests} TESTS PASSED")
    print("=" * 65)

    if passed_tests == total_tests:
        print("[SUCCESS] Module 8 (Social Links & Media Profiles CMS) is 100% operational!")
        return 0
    else:
        print(f"[FAIL] {total_tests - passed_tests} test(s) failed.")
        return 1

if __name__ == "__main__":
    sys.exit(run_tests())
