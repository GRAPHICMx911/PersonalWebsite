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
    print("MODULE 6: E2E AUTOMATED VERIFICATION SUITE")
    print("==================================================")

    # 1. Check Public Blog Endpoints
    print("\n[1] Checking Public Blog Endpoints...")
    status, posts = request_json(f"{BASE_URL}/api/blog/public")
    assert status == 200, f"Expected 200, got {status}: {posts}"
    print(f"  [OK] /api/blog/public returned {len(posts)} published articles")
    assert len(posts) >= 4, "Expected at least 4 seeded blog posts"

    status, cats = request_json(f"{BASE_URL}/api/blog/categories")
    assert status == 200, f"Expected 200, got {status}: {cats}"
    print(f"  [OK] /api/blog/categories returned {len(cats)} categories: {cats}")

    # Test single article retrieval and view count increment
    first_slug = posts[0]["slug"]
    initial_views = posts[0]["views_count"]
    status, single_post = request_json(f"{BASE_URL}/api/blog/public/{first_slug}")
    assert status == 200, f"Expected 200, got {status}: {single_post}"
    assert single_post["slug"] == first_slug
    assert single_post["views_count"] >= initial_views + 1, "Expected view count to increment"
    print(f"  [OK] /api/blog/public/{first_slug} retrieved and view count incremented to {single_post['views_count']}")

    # 2. Admin Authentication
    print("\n[2] Authenticating Admin...")
    login_payload = {
        "username": "admin",
        "password": "adminpassword123"
    }
    status, auth_data = request_json(f"{BASE_URL}/api/auth/login", method="POST", form_data=login_payload)
    assert status == 200, f"Admin login failed: status {status}, {auth_data}"
    token = auth_data.get("access_token")
    assert token, "No access_token returned"
    headers = {"Authorization": f"Bearer {token}"}
    print("  [OK] Admin authenticated successfully. Access token acquired.")

    # 3. Admin Blog Posts Listing
    print("\n[3] Admin Blog Posts Listing...")
    status, admin_posts = request_json(f"{BASE_URL}/api/blog", headers=headers)
    assert status == 200, f"Admin list posts failed: status {status}, {admin_posts}"
    print(f"  [OK] /api/blog returned {len(admin_posts)} articles for admin")

    # 4. Admin Blog CRUD Cycle
    print("\n[4] Executing Admin Blog CRUD Cycle...")
    create_payload = {
        "title": "E2E Automated Engineering Article",
        "slug": "e2e-automated-engineering-article",
        "subtitle": "Testing comprehensive automated blog publishing",
        "category": "Cloud Architecture",
        "author": "Design Lyricist",
        "reading_time_minutes": 4,
        "tags": "Automation, Python, FastAPI, E2E",
        "excerpt": "This is an automated test excerpt describing the article.",
        "content": "<h2>Automated Architecture</h2><p>Comprehensive article body verified via test script.</p>",
        "is_published": True,
        "is_featured": False
    }
    status, created_post = request_json(f"{BASE_URL}/api/blog", method="POST", data=create_payload, headers=headers)
    assert status in (200, 201), f"Blog post creation failed: status {status}, {created_post}"
    post_id = created_post["id"]
    print(f"  [OK] Created blog post ID: {post_id} (slug: {created_post['slug']})")

    # Read by ID
    status, read_post = request_json(f"{BASE_URL}/api/blog/{post_id}", headers=headers)
    assert status == 200, f"Read post failed: status {status}, {read_post}"
    assert read_post["title"] == "E2E Automated Engineering Article"
    print(f"  [OK] Read blog post ID: {post_id}")

    # Update
    update_payload = {
        "title": "E2E Automated Engineering Article (Updated)",
        "is_featured": True
    }
    status, updated_post = request_json(f"{BASE_URL}/api/blog/{post_id}", method="PUT", data=update_payload, headers=headers)
    assert status == 200, f"Update post failed: status {status}, {updated_post}"
    assert updated_post["title"] == "E2E Automated Engineering Article (Updated)"
    assert updated_post["is_featured"] is True
    print(f"  [OK] Updated blog post ID: {post_id}")

    # Delete
    status, del_post = request_json(f"{BASE_URL}/api/blog/{post_id}", method="DELETE", headers=headers)
    assert status == 200, f"Delete post failed: status {status}, {del_post}"
    print(f"  [OK] Deleted blog post ID: {post_id}")

    # Verify Deletion (404)
    status, verify_del = request_json(f"{BASE_URL}/api/blog/{post_id}", headers=headers)
    assert status == 404, f"Post still exists after deletion! Status: {status}"
    print("  [OK] Verified post deletion (404 Not Found as expected)")

    # 5. Static Pages and Script Checks
    print("\n[5] Checking Static Assets & Frontend Pages...")
    static_urls = [
        "/",
        "/blog.html",
        "/admin/blog.html",
        "/admin/dashboard.html",
        "/admin/css/blog.css",
        "/css/blog.css",
        "/admin/js/blog.js",
        "/js/blog.js",
        "/js/script.js"
    ]
    for rel_url in static_urls:
        status, content = request_json(f"{BASE_URL}{rel_url}")
        assert status == 200, f"Failed to retrieve {rel_url}: status {status}"
        length = len(content) if isinstance(content, str) else len(json.dumps(content))
        print(f"  [OK] {rel_url} -> HTTP 200 ({length} bytes)")

    print("\n==================================================")
    print("ALL MODULE 6 TESTS PASSED SUCCESSFULLY! [PASS]")
    print("==================================================")

if __name__ == "__main__":
    try:
        run_tests()
    except Exception as e:
        print(f"\n[FAIL] Test failure: {e}")
        sys.exit(1)
