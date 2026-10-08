import urllib.request
import urllib.parse
import json
import sys

BASE_URL = "http://127.0.0.1:8000"

def request_json(url, method="GET", data=None, headers=None, form_data=None):
    req_headers = headers or {}
    encoded_data = None
    
    if data is not None:
        encoded_data = json.dumps(data).encode("utf-8")
        req_headers["Content-Type"] = "application/json"
    elif form_data is not None:
        encoded_data = urllib.parse.urlencode(form_data).encode("utf-8")
        req_headers["Content-Type"] = "application/x-www-form-urlencoded"

    req = urllib.request.Request(url, data=encoded_data, headers=req_headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as response:
            status = response.getcode()
            body_bytes = response.read()
            body = body_bytes.decode("utf-8")
            try:
                return status, json.loads(body)
            except Exception:
                return status, body
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(body)
        except Exception:
            return e.code, body

def run_tests():
    print("==================================================")
    print("MODULE 5: E2E AUTOMATED VERIFICATION SUITE")
    print("==================================================")
    
    # 1. Check Public Design Endpoints
    print("\n[1] Checking Public Design Endpoints...")
    status, designs = request_json(f"{BASE_URL}/api/design/public")
    assert status == 200, f"Expected 200, got {status}: {designs}"
    print(f"  [OK] /api/design/public returned {len(designs)} active items")
    assert len(designs) >= 4, "Expected at least 4 seeded design items"
    
    status, design_cats = request_json(f"{BASE_URL}/api/design/categories")
    assert status == 200, f"Expected 200, got {status}: {design_cats}"
    print(f"  [OK] /api/design/categories returned {len(design_cats)} categories: {design_cats}")

    # 2. Check Public UX/UI Endpoints
    print("\n[2] Checking Public UX/UI Endpoints...")
    status, uxuis = request_json(f"{BASE_URL}/api/ux-ui/public")
    assert status == 200, f"Expected 200, got {status}: {uxuis}"
    print(f"  [OK] /api/ux-ui/public returned {len(uxuis)} active case studies")
    assert len(uxuis) >= 3, "Expected at least 3 seeded UX/UI case studies"

    status, uxui_cats = request_json(f"{BASE_URL}/api/ux-ui/categories")
    assert status == 200, f"Expected 200, got {status}: {uxui_cats}"
    print(f"  [OK] /api/ux-ui/categories returned {len(uxui_cats)} categories: {uxui_cats}")

    # 3. Admin Authentication
    print("\n[3] Authenticating Admin...")
    login_payload = {
        "username": "admin",
        "password": "adminpassword123"
    }
    status, auth_data = request_json(f"{BASE_URL}/api/auth/login", method="POST", form_data=login_payload)
    assert status == 200, f"Admin login failed with status {status}: {auth_data}"
    token = auth_data.get("access_token")
    assert token, "No access_token returned"
    headers = {"Authorization": f"Bearer {token}"}
    print("  [OK] Admin authenticated successfully. Access token acquired.")

    # 4. Admin Design CRUD Cycle
    print("\n[4] Executing Admin Design CRUD Cycle...")
    create_design_payload = {
        "title": "E2E Automated Design Asset",
        "category": "Vector Illustration",
        "client": "Test Client Corp",
        "year": "2026",
        "image_url": "/uploads/design/test_asset.png",
        "thumbnail_url": "/uploads/design/test_asset_thumb.png",
        "tools_used": "Figma, Illustrator",
        "description": "Automated verification test item for Module 5.",
        "aspect_ratio": "16:9",
        "tags": "Test, Automation, Vector",
        "display_order": 99,
        "is_featured": False,
        "is_active": True
    }
    status, created_design = request_json(f"{BASE_URL}/api/design", method="POST", data=create_design_payload, headers=headers)
    assert status in (200, 201), f"Design creation failed: status {status}, {created_design}"
    design_id = created_design["id"]
    print(f"  [OK] Created design item ID: {design_id}")

    # Read
    status, read_design = request_json(f"{BASE_URL}/api/design/{design_id}", headers=headers)
    assert status == 200, f"Fetch design failed: status {status}, {read_design}"
    assert read_design["title"] == "E2E Automated Design Asset"
    print(f"  [OK] Read design item ID: {design_id}")

    # Update
    update_design_payload = {
        "title": "E2E Automated Design Asset (Updated)",
        "is_featured": True
    }
    status, updated_design = request_json(f"{BASE_URL}/api/design/{design_id}", method="PUT", data=update_design_payload, headers=headers)
    assert status == 200, f"Update design failed: status {status}, {updated_design}"
    assert updated_design["title"] == "E2E Automated Design Asset (Updated)"
    assert updated_design["is_featured"] is True
    print(f"  [OK] Updated design item ID: {design_id}")

    # Delete
    status, del_design = request_json(f"{BASE_URL}/api/design/{design_id}", method="DELETE", headers=headers)
    assert status == 200, f"Delete design failed: status {status}, {del_design}"
    print(f"  [OK] Deleted design item ID: {design_id}")

    # Verify deletion
    status, verify_del = request_json(f"{BASE_URL}/api/design/{design_id}", headers=headers)
    assert status == 404, f"Design item still exists after deletion! Status: {status}"
    print("  [OK] Verified design deletion (404 Not Found as expected)")

    # 5. Admin UX/UI CRUD Cycle
    print("\n[5] Executing Admin UX/UI CRUD Cycle...")
    create_uxui_payload = {
        "title": "E2E Automated Case Study",
        "subtitle": "Testing comprehensive UX/UI case study workflow",
        "category": "Enterprise SaaS",
        "client": "Cloud Security Systems",
        "role": "Principal UX Architect",
        "duration": "3 months",
        "tools_used": "Figma, Miro, FigJam",
        "cover_image_url": "/uploads/ux-ui/test_cover.png",
        "problem_statement": "Automated test problem statement describing user friction.",
        "solution_overview": "Automated test solution overview outlining system architecture.",
        "design_process": "Discovery -> Wireframes -> Prototypes -> User Validation",
        "key_results": "50% increase in workflow completion speed",
        "figma_url": "https://figma.com/@test",
        "live_prototype_url": "https://figma.com/proto/test",
        "display_order": 99,
        "is_featured": False,
        "is_active": True
    }
    status, created_uxui = request_json(f"{BASE_URL}/api/ux-ui", method="POST", data=create_uxui_payload, headers=headers)
    assert status in (200, 201), f"UX/UI creation failed: status {status}, {created_uxui}"
    uxui_id = created_uxui["id"]
    print(f"  [OK] Created UX/UI case study ID: {uxui_id}")

    # Read
    status, read_uxui = request_json(f"{BASE_URL}/api/ux-ui/{uxui_id}", headers=headers)
    assert status == 200, f"Fetch UX/UI failed: status {status}, {read_uxui}"
    assert read_uxui["title"] == "E2E Automated Case Study"
    print(f"  [OK] Read UX/UI case study ID: {uxui_id}")

    # Update
    update_ux_payload = {
        "title": "E2E Automated Case Study (Updated)",
        "is_featured": True
    }
    status, updated_uxui = request_json(f"{BASE_URL}/api/ux-ui/{uxui_id}", method="PUT", data=update_ux_payload, headers=headers)
    assert status == 200, f"Update UX/UI failed: status {status}, {updated_uxui}"
    assert updated_uxui["title"] == "E2E Automated Case Study (Updated)"
    assert updated_uxui["is_featured"] is True
    print(f"  [OK] Updated UX/UI case study ID: {uxui_id}")

    # Delete
    status, del_uxui = request_json(f"{BASE_URL}/api/ux-ui/{uxui_id}", method="DELETE", headers=headers)
    assert status == 200, f"Delete UX/UI failed: status {status}, {del_uxui}"
    print(f"  [OK] Deleted UX/UI case study ID: {uxui_id}")

    # Verify deletion
    status, verify_ux_del = request_json(f"{BASE_URL}/api/ux-ui/{uxui_id}", headers=headers)
    assert status == 404, f"UX/UI case study still exists after deletion! Status: {status}"
    print("  [OK] Verified UX/UI deletion (404 Not Found as expected)")

    # 6. Static Pages and Scripts Check
    print("\n[6] Checking Static Assets & Admin Views...")
    static_urls = [
        "/",
        "/admin/design.html",
        "/admin/ux-ui.html",
        "/admin/dashboard.html",
        "/js/script.js",
        "/admin/js/design.js",
        "/admin/js/ux-ui.js",
        "/admin/css/design.css",
        "/admin/css/ux-ui.css"
    ]
    for rel_url in static_urls:
        status, content = request_json(f"{BASE_URL}{rel_url}")
        assert status == 200, f"Failed to retrieve {rel_url}: status {status}"
        length = len(content) if isinstance(content, str) else len(json.dumps(content))
        print(f"  [OK] {rel_url} -> HTTP 200 ({length} bytes)")

    print("\n==================================================")
    print("ALL MODULE 5 TESTS PASSED SUCCESSFULLY! [PASS]")
    print("==================================================")

if __name__ == "__main__":
    try:
        run_tests()
    except Exception as e:
        print(f"\n[FAIL] Test failure: {e}")
        sys.exit(1)
