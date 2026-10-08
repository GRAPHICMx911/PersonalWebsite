#!/usr/bin/env python3
"""
=============================================================
MODULES 1–4: CORE ARCHITECTURE, PROJECTS, SKILLS, CAREER E2E
=============================================================
Tests:
1. System Health & Database Connectivity (/api/health)
2. HTTP Security Headers (X-Content-Type-Options, X-Frame-Options, etc.)
3. Admin Authentication Login & Identity Profile (/api/auth/login, /api/auth/me)
4. Public & Admin Projects CMS (/api/projects/published, /api/projects/categories)
5. Public & Admin Skills CMS (/api/skills/public, /api/skills/categories)
6. Public & Admin Certifications CMS (/api/certifications/public)
7. Public & Admin Career Experience CMS (/api/experience/public)
8. Public & Admin Academic Education CMS (/api/education/public)
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
            return status, parsed, dict(resp.headers)
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            parsed = json.loads(body)
        except Exception:
            parsed = body
        return e.code, parsed, dict(e.headers)
    except Exception as e:
        return 500, str(e), {}

def run_tests():
    print("=" * 65)
    print("STARTING MODULES 1–4 E2E VERIFICATION SUITE")
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

    # 1. System Health
    code, health_data, headers = request_json(f"{BASE_URL}/api/health")
    assert_test(
        "System Health & Database Connection",
        code == 200 and health_data.get("status") == "healthy" and health_data.get("database") == "connected",
        f"Status: {code}, Response: {health_data}"
    )

    # 2. Defense-in-depth Security Headers
    h_lower = {k.lower(): v for k, v in headers.items()}
    sec_passed = (
        h_lower.get("x-content-type-options") == "nosniff" and
        h_lower.get("x-frame-options") == "SAMEORIGIN" and
        "x-xss-protection" in h_lower and
        "referrer-policy" in h_lower
    )
    assert_test("HTTP Defense-in-Depth Security Headers", sec_passed, f"Headers: {h_lower}")

    # 3. Admin Authentication Login
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

    assert_test("Admin Authentication Login", bool(token), "Failed to obtain JWT bearer token")
    if not token:
        print("Aborting remaining tests.")
        return False

    auth_headers = {"Authorization": f"Bearer {token}"}

    # 4. Identity Profile (/api/auth/me)
    code, user_me, _ = request_json(f"{BASE_URL}/api/auth/me", headers=auth_headers)
    assert_test(
        "Admin Identity Verification (/api/auth/me)",
        code == 200 and user_me.get("username") == "admin",
        f"Status: {code}, User: {user_me}"
    )

    # 5. Public Projects Retrieval
    code, published_projects, _ = request_json(f"{BASE_URL}/api/projects/published")
    assert_test(
        "Public Published Projects Retrieval",
        code == 200 and isinstance(published_projects, list) and len(published_projects) > 0,
        f"Status: {code}, Count: {len(published_projects) if isinstance(published_projects, list) else 0}"
    )

    # 6. Project Categories Retrieval
    code, proj_cats, _ = request_json(f"{BASE_URL}/api/projects/categories")
    assert_test(
        "Project Categories Retrieval",
        code == 200 and isinstance(proj_cats, list) and len(proj_cats) > 0,
        f"Status: {code}, Categories: {len(proj_cats) if isinstance(proj_cats, list) else 0}"
    )

    # 7. Public Skills Retrieval
    code, skills_data, _ = request_json(f"{BASE_URL}/api/skills/public")
    assert_test(
        "Public Skills Retrieval",
        code == 200 and isinstance(skills_data, list) and len(skills_data) > 0,
        f"Status: {code}, Skills count: {len(skills_data) if isinstance(skills_data, list) else 0}"
    )

    # 8. Skill Categories Retrieval
    code, skill_cats, _ = request_json(f"{BASE_URL}/api/skills/categories")
    assert_test(
        "Skill Categories Retrieval",
        code == 200 and isinstance(skill_cats, list) and len(skill_cats) > 0,
        f"Status: {code}, Categories: {len(skill_cats) if isinstance(skill_cats, list) else 0}"
    )

    # 9. Public Certifications Retrieval
    code, certs_data, _ = request_json(f"{BASE_URL}/api/certifications/public")
    assert_test(
        "Public Certifications Retrieval",
        code == 200 and isinstance(certs_data, list) and len(certs_data) > 0,
        f"Status: {code}, Certs count: {len(certs_data) if isinstance(certs_data, list) else 0}"
    )

    # 10. Public Career Experience Retrieval
    code, exp_data, _ = request_json(f"{BASE_URL}/api/experience/public")
    assert_test(
        "Public Experience Retrieval",
        code == 200 and isinstance(exp_data, list) and len(exp_data) > 0,
        f"Status: {code}, Experiences count: {len(exp_data) if isinstance(exp_data, list) else 0}"
    )

    # 11. Public Academic Education Retrieval
    code, edu_data, _ = request_json(f"{BASE_URL}/api/education/public")
    assert_test(
        "Public Education Heritage Retrieval",
        code == 200 and isinstance(edu_data, list) and len(edu_data) > 0,
        f"Status: {code}, Educations count: {len(edu_data) if isinstance(edu_data, list) else 0}"
    )

    print("\n" + "=" * 65)
    print(f"MODULES 1–4 E2E SUMMARY: {passed_tests}/{total_tests} TESTS PASSED ({passed_tests/total_tests*100:.1f}%)")
    print("=" * 65)

    return passed_tests == total_tests

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
