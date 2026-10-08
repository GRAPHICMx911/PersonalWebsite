#!/usr/bin/env python3
"""
=============================================================
MODULE 9: WEBSITE SETTINGS, PROFILE METADATA & SEO CMS — E2E
=============================================================
Tests:
1. Static endpoints & asset availability (settings.html, CSS, JS, mirrored copies)
2. Admin authentication login via /api/auth/login
3. Public settings retrieval via GET /api/settings/public
4. Admin settings retrieval via GET /api/settings
5. Admin settings partial update via PUT /api/settings
6. Public settings reflection verification
7. Admin file upload: Resume PDF via POST /api/settings/upload-resume
8. Static retrieval of uploaded resume file (HTTP 200)
9. Admin file upload: Avatar image via POST /api/settings/upload-avatar
10. File upload validation (reject forbidden extension like .exe with HTTP 400)
11. Persistence and clean restoration of profile settings
=============================================================
"""

import sys
import json
import urllib.request
import urllib.parse
import urllib.error
import uuid

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

def upload_multipart(url, file_field, filename, file_bytes, content_type="application/octet-stream", headers=None):
    if headers is None:
        headers = {}
    boundary = f"----WebKitFormBoundary{uuid.uuid4().hex}"
    headers["Content-Type"] = f"multipart/form-data; boundary={boundary}"

    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="{file_field}"; filename="{filename}"\r\n'
        f"Content-Type: {content_type}\r\n\r\n"
    ).encode("utf-8") + file_bytes + f"\r\n--{boundary}--\r\n".encode("utf-8")

    req = urllib.request.Request(url, data=body, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req) as resp:
            status = resp.status
            body_resp = resp.read().decode("utf-8")
            try:
                parsed = json.loads(body_resp)
            except Exception:
                parsed = body_resp
            return status, parsed
    except urllib.error.HTTPError as e:
        body_resp = e.read().decode("utf-8")
        try:
            parsed = json.loads(body_resp)
        except Exception:
            parsed = body_resp
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
    print("STARTING MODULE 9 E2E VERIFICATION SUITE")
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
        "/admin/settings.html",
        "/admin/css/settings.css",
        "/admin/js/settings.js",
        "/css/settings.css",
        "/js/settings.js",
    ]
    for ep in static_endpoints:
        code = check_status(f"{BASE_URL}{ep}")
        assert_test(f"Static Asset: {ep}", code == 200, f"Expected 200, got {code}")

    # 2. Public Settings Retrieval
    code, pub_settings = request_json(f"{BASE_URL}/api/settings/public")
    assert_test(
        "Public Settings Retrieval (GET /api/settings/public)",
        code == 200 and isinstance(pub_settings, dict) and "full_name" in pub_settings,
        f"Status: {code}, Content: {pub_settings}"
    )

    # 3. Admin Authentication
    login_payload = {
        "username": "admin",
        "password": "adminpassword123"
    }
    encoded_login = urllib.parse.urlencode(login_payload).encode("utf-8")
    req_login = urllib.request.Request(
        f"{BASE_URL}/api/auth/login",
        data=encoded_login,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        method="POST"
    )
    token = None
    try:
        with urllib.request.urlopen(req_login) as resp:
            login_data = json.loads(resp.read().decode("utf-8"))
            token = login_data.get("access_token")
    except Exception as e:
        print("Login failed:", e)

    assert_test("Admin Login for Settings CMS", bool(token), "Failed to obtain JWT bearer token")
    if not token:
        print("Aborting remaining tests due to auth failure.")
        return False

    auth_headers = {"Authorization": f"Bearer {token}"}

    # 4. Admin Get Settings
    code, admin_settings = request_json(f"{BASE_URL}/api/settings", headers=auth_headers)
    assert_test(
        "Admin Get All Settings (GET /api/settings)",
        code == 200 and isinstance(admin_settings, dict) and "hero_pill_text" in admin_settings,
        f"Status: {code}, Content: {admin_settings}"
    )

    original_hero_title_highlight = admin_settings.get("hero_title_highlight", "")

    # 5. Admin Update Settings (PUT /api/settings)
    test_highlight_text = f"E2E High Performance Cloud {uuid.uuid4().hex[:6]}"
    update_payload = {
        "hero_title_highlight": test_highlight_text,
        "is_hiring_available": True,
        "availability_badge_text": "Open for Senior / Staff Lead Roles (Verified)"
    }
    code, updated_settings = request_json(
        f"{BASE_URL}/api/settings",
        method="PUT",
        data=update_payload,
        headers=auth_headers
    )
    assert_test(
        "Admin Update Settings (PUT /api/settings)",
        code == 200 and updated_settings.get("hero_title_highlight") == test_highlight_text,
        f"Status: {code}, Updated: {updated_settings}"
    )

    # 6. Public Settings Reflection Verification
    code, pub_after_update = request_json(f"{BASE_URL}/api/settings/public")
    assert_test(
        "Public Settings Reflection (GET /api/settings/public)",
        code == 200 and pub_after_update.get("hero_title_highlight") == test_highlight_text,
        f"Status: {code}, Highlight: {pub_after_update.get('hero_title_highlight')}"
    )

    # 7. Admin Upload Resume PDF (POST /api/settings/upload-resume)
    dummy_pdf_content = b"%PDF-1.4\n%E2E Dummy Resume Content\n%%EOF"
    code, upload_res = upload_multipart(
        f"{BASE_URL}/api/settings/upload-resume",
        file_field="file",
        filename="test_alexander_resume.pdf",
        file_bytes=dummy_pdf_content,
        content_type="application/pdf",
        headers=auth_headers
    )
    uploaded_resume_url = upload_res.get("url") if isinstance(upload_res, dict) else None
    assert_test(
        "Admin Upload Resume Document (POST /api/settings/upload-resume)",
        code == 200 and upload_res.get("status") == "success" and bool(uploaded_resume_url),
        f"Status: {code}, Response: {upload_res}"
    )

    # 8. Verify Uploaded Resume File Accessibility via Static GET
    if uploaded_resume_url:
        resume_status = check_status(f"{BASE_URL}{uploaded_resume_url}")
        assert_test(
            f"Uploaded Resume Static Asset Accessible ({uploaded_resume_url})",
            resume_status == 200,
            f"Expected 200, got {resume_status}"
        )
    else:
        assert_test("Uploaded Resume Asset Check", False, "No URL returned from upload")

    # 9. Admin Upload Avatar Image (POST /api/settings/upload-avatar)
    dummy_png_content = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
    code, avatar_res = upload_multipart(
        f"{BASE_URL}/api/settings/upload-avatar",
        file_field="file",
        filename="test_avatar.png",
        file_bytes=dummy_png_content,
        content_type="image/png",
        headers=auth_headers
    )
    assert_test(
        "Admin Upload Avatar Image (POST /api/settings/upload-avatar)",
        code == 200 and avatar_res.get("status") == "success" and "url" in avatar_res,
        f"Status: {code}, Response: {avatar_res}"
    )

    # 10. File Upload Validation (Reject forbidden extension)
    bad_code, bad_res = upload_multipart(
        f"{BASE_URL}/api/settings/upload-resume",
        file_field="file",
        filename="malicious_payload.exe",
        file_bytes=b"MZ\x90\x00",
        content_type="application/octet-stream",
        headers=auth_headers
    )
    assert_test(
        "Upload Security: Reject Forbidden File Extension (.exe -> HTTP 400)",
        bad_code == 400,
        f"Expected 400, got {bad_code}: {bad_res}"
    )

    # 11. Restore Settings to Clean State
    restore_payload = {
        "hero_title_highlight": original_hero_title_highlight or "Modern Digital Experiences",
        "is_hiring_available": True,
        "availability_badge_text": "Open for Senior / Staff / Lead Roles"
    }
    code, restored = request_json(
        f"{BASE_URL}/api/settings",
        method="PUT",
        data=restore_payload,
        headers=auth_headers
    )
    assert_test(
        "Clean Restoration of Settings",
        code == 200 and restored.get("hero_title_highlight") == restore_payload["hero_title_highlight"],
        f"Status: {code}"
    )

    print("\n" + "=" * 65)
    print(f"MODULE 9 E2E SUMMARY: {passed_tests}/{total_tests} TESTS PASSED ({passed_tests/total_tests*100:.1f}%)")
    print("=" * 65)

    return passed_tests == total_tests

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
