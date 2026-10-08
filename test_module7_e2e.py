#!/usr/bin/env python3
"""
=============================================================
MODULE 7: CONTACT INQUIRIES & MESSAGES CMS — END-TO-END VERIFICATION
=============================================================
Tests:
1. Static endpoints & asset availability (HTML, CSS, JS, mirrored copies)
2. Public contact inquiry submission via /api/contact
3. Admin authentication login
4. Admin inquiry statistics via /api/messages/stats
5. Admin inquiry listing & search filters (/api/messages)
6. Admin single message detail retrieval & auto-mark-as-read
7. Admin toggle read/unread status (/api/messages/{id}/read)
8. Admin toggle archive status (/api/messages/{id}/archive)
9. Admin message deletion & cleanup (/api/messages/{id})
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
    print("STARTING MODULE 7 E2E VERIFICATION SUITE")
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
        "/admin/messages.html",
        "/admin/css/messages.css",
        "/admin/js/messages.js",
        "/css/messages.css",
        "/js/messages.js",
    ]
    for ep in static_endpoints:
        code = check_status(f"{BASE_URL}{ep}")
        assert_test(f"Static Asset: {ep}", code == 200, f"Expected 200, got {code}")

    # 2. Public Contact Form Submission
    test_contact_payload = {
        "name": "E2E Verification Agent",
        "email": "e2e_agent@example.com",
        "subject": "Module 7 End-to-End Test Inquiry",
        "message": "This is an automated E2E test verifying contact form delivery, backend storage, and admin inbox display."
    }
    submit_status, submit_res = request_json(
        f"{BASE_URL}/api/contact",
        method="POST",
        data=test_contact_payload
    )
    assert_test(
        "Public Contact Submission (POST /api/contact)",
        submit_status == 201 and submit_res.get("status") == "success" and "id" in submit_res,
        f"Status: {submit_status}, Response: {submit_res}"
    )
    test_message_id = submit_res.get("id") if isinstance(submit_res, dict) else None

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
        print("[CRITICAL] Authentication failed. Aborting remaining admin tests.")
        sys.exit(1)

    auth_headers = {"Authorization": f"Bearer {token}"}

    # 4. Admin Message Statistics
    stats_status, stats_res = request_json(
        f"{BASE_URL}/api/messages/stats",
        method="GET",
        headers=auth_headers
    )
    assert_test(
        "Admin Message Statistics (GET /api/messages/stats)",
        stats_status == 200 and "total" in stats_res and stats_res["total"] >= 1 and stats_res["unread"] >= 1,
        f"Status: {stats_status}, Response: {stats_res}"
    )

    # 5. Admin Message Listing
    list_status, list_res = request_json(
        f"{BASE_URL}/api/messages?status_filter=all",
        method="GET",
        headers=auth_headers
    )
    assert_test(
        "Admin Message Listing (GET /api/messages)",
        list_status == 200 and isinstance(list_res, list) and len(list_res) >= 1,
        f"Status: {list_status}, Count: {len(list_res) if isinstance(list_res, list) else 0}"
    )

    # 6. Admin Search Filter
    search_status, search_res = request_json(
        f"{BASE_URL}/api/messages?search={urllib.parse.quote('E2E Verification Agent')}",
        method="GET",
        headers=auth_headers
    )
    assert_test(
        "Admin Message Search (GET /api/messages?search=...)",
        search_status == 200 and isinstance(search_res, list) and any(m.get("id") == test_message_id for m in search_res),
        f"Status: {search_status}, Count: {len(search_res) if isinstance(search_res, list) else 0}"
    )

    if test_message_id:
        # 7. Admin Single Message Detail with Auto Mark As Read
        detail_status, detail_res = request_json(
            f"{BASE_URL}/api/messages/{test_message_id}?mark_as_read=true",
            method="GET",
            headers=auth_headers
        )
        assert_test(
            "Admin Message Detail & Auto Read (GET /api/messages/{id})",
            detail_status == 200 and detail_res.get("is_read") is True,
            f"Status: {detail_status}, is_read: {detail_res.get('is_read') if isinstance(detail_res, dict) else 'N/A'}"
        )

        # 8. Admin Toggle Read Status back to unread
        unread_status, unread_res = request_json(
            f"{BASE_URL}/api/messages/{test_message_id}/read?is_read=false",
            method="PATCH",
            headers=auth_headers
        )
        assert_test(
            "Admin Toggle Read Status (PATCH /api/messages/{id}/read?is_read=false)",
            unread_status == 200 and unread_res.get("is_read") is False,
            f"Status: {unread_status}, is_read: {unread_res.get('is_read') if isinstance(unread_res, dict) else 'N/A'}"
        )

        # 9. Admin Toggle Archive Status
        archive_status, archive_res = request_json(
            f"{BASE_URL}/api/messages/{test_message_id}/archive?is_archived=true",
            method="PATCH",
            headers=auth_headers
        )
        assert_test(
            "Admin Move to Archive (PATCH /api/messages/{id}/archive?is_archived=true)",
            archive_status == 200 and archive_res.get("is_archived") is True,
            f"Status: {archive_status}, is_archived: {archive_res.get('is_archived') if isinstance(archive_res, dict) else 'N/A'}"
        )

        # 10. Admin Delete Message & Cleanup
        del_status, del_res = request_json(
            f"{BASE_URL}/api/messages/{test_message_id}",
            method="DELETE",
            headers=auth_headers
        )
        assert_test(
            "Admin Delete Message (DELETE /api/messages/{id})",
            del_status == 200,
            f"Status: {del_status}, Response: {del_res}"
        )

        # 11. Verify 404 after Deletion
        get_deleted_status, _ = request_json(
            f"{BASE_URL}/api/messages/{test_message_id}",
            method="GET",
            headers=auth_headers
        )
        assert_test(
            "Verify Deleted Message 404",
            get_deleted_status == 404,
            f"Expected 404, got {get_deleted_status}"
        )

    print("=" * 65)
    print(f"MODULE 7 E2E RESULTS: {passed_tests}/{total_tests} TESTS PASSED")
    print("=" * 65)

    if passed_tests == total_tests:
        print("[SUCCESS] Module 7 (Contact Messages & Inquiries CMS) is 100% operational!")
        return 0
    else:
        print(f"[FAIL] {total_tests - passed_tests} test(s) failed.")
        return 1

if __name__ == "__main__":
    sys.exit(run_tests())
