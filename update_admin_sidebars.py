import re
from pathlib import Path

ADMIN_DIR = Path("frontend/admin")
FRONTEND_DIR = Path("frontend")

admin_html_files = [
    "dashboard.html",
    "projects.html",
    "skills.html",
    "certifications.html",
    "education.html",
    "experience.html",
    "design.html",
    "ux-ui.html"
]

target_link_snippet = """                <a href="blog.html" class="nav-link">
                    <span class="nav-icon">✍️</span>
                    <span>Technical Blog</span>
                </a>"""

for fname in admin_html_files:
    fpath = ADMIN_DIR / fname
    if not fpath.exists():
        continue
    content = fpath.read_text(encoding="utf-8")
    
    # Replace the disabled blog link
    pattern = r'<a\s+href="#blog"[^>]*>[\s\S]*?<span>Blog<\/span>[\s\S]*?<\/a>'
    if re.search(pattern, content):
        new_content = re.sub(pattern, target_link_snippet, content)
        fpath.write_text(new_content, encoding="utf-8")
        print(f"[OK] Updated sidebar in {fname}")
    else:
        print(f"[INFO] Pattern not found in {fname}")

# Also ensure dashboard.html has the quick action link if missing
dash_path = ADMIN_DIR / "dashboard.html"
dash_content = dash_path.read_text(encoding="utf-8")
if 'href="blog.html"' not in dash_content:
    print("[WARN] blog.html link missing in dashboard.html")

# Update quick action in dashboard.html
if '<strong>Technical Blog</strong>' not in dash_content:
    qa_target = '<a href="ux-ui.html" class="quick-action-item">'
    qa_insert = """                                <a href="blog.html" class="quick-action-item">
                                    <div class="qa-icon">✍️</div>
                                    <div class="qa-details">
                                        <strong>Technical Blog</strong>
                                        <small>Write and publish engineering articles</small>
                                    </div>
                                </a>\n"""
    # Find position right after closing </a> of ux-ui quick action
    idx = dash_content.find('Manage UX/UI')
    if idx != -1:
        end_a = dash_content.find('</a>', idx) + 4
        dash_content = dash_content[:end_a] + "\n" + qa_insert + dash_content[end_a:]
        dash_path.write_text(dash_content, encoding="utf-8")
        print("[OK] Added blog quick action to dashboard.html")

print("[OK] Admin HTML sidebars updated.")
