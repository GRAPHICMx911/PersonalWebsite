const API_BASE_URL = window.location.origin.startsWith("http")
    ? window.location.origin
    : "http://127.0.0.1:8000";

const token = sessionStorage.getItem("access_token") || localStorage.getItem("access_token") || localStorage.getItem("token");

// =========================================================
// AUTHENTICATION CHECK
// =========================================================
if (!token) {
    window.location.href = "login.html";
}

const welcomeTitle = document.getElementById("welcomeTitle");
const adminName = document.getElementById("adminName");
const adminAvatar = document.getElementById("adminAvatar");
const logoutButton = document.getElementById("logoutButton");
const mobileMenuButton = document.getElementById("mobileMenuButton");
const sidebar = document.getElementById("sidebar");

// =========================================================
// LOAD ADMIN PROFILE
// =========================================================
async function loadAdminProfile() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/me`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error("Authentication session expired.");
        }

        const data = await response.json();
        const user = data.user;

        const displayName = user.full_name || user.username || "Administrator";

        if (welcomeTitle) welcomeTitle.textContent = `Welcome back, ${displayName}!`;
        if (adminName) adminName.textContent = displayName;
        if (adminAvatar) adminAvatar.textContent = displayName.charAt(0).toUpperCase();

    } catch (error) {
        console.error("Profile error:", error);
        logout();
    }
}

// =========================================================
// LOAD DASHBOARD STATISTICS & RECENT PROJECTS
// =========================================================
async function loadDashboardData() {
    try {
        const [projRes, catRes, skillsRes, certsRes, eduRes, expRes, designRes, uxuiRes, blogRes, msgRes, socialRes] = await Promise.all([
            fetch(`${API_BASE_URL}/api/projects`, {
                headers: { "Authorization": `Bearer ${token}` }
            }),
            fetch(`${API_BASE_URL}/api/projects/categories`),
            fetch(`${API_BASE_URL}/api/skills`, {
                headers: { "Authorization": `Bearer ${token}` }
            }),
            fetch(`${API_BASE_URL}/api/certifications`, {
                headers: { "Authorization": `Bearer ${token}` }
            }),
            fetch(`${API_BASE_URL}/api/education`, {
                headers: { "Authorization": `Bearer ${token}` }
            }),
            fetch(`${API_BASE_URL}/api/experience`, {
                headers: { "Authorization": `Bearer ${token}` }
            }),
            fetch(`${API_BASE_URL}/api/design`, {
                headers: { "Authorization": `Bearer ${token}` }
            }),
            fetch(`${API_BASE_URL}/api/ux-ui`, {
                headers: { "Authorization": `Bearer ${token}` }
            }),
            fetch(`${API_BASE_URL}/api/blog`, {
                headers: { "Authorization": `Bearer ${token}` }
            }),
            fetch(`${API_BASE_URL}/api/messages/stats`, {
                headers: { "Authorization": `Bearer ${token}` }
            }),
            fetch(`${API_BASE_URL}/api/social`, {
                headers: { "Authorization": `Bearer ${token}` }
            })
        ]);

        const projects = projRes.ok ? await projRes.json() : [];
        const categories = catRes.ok ? await catRes.json() : [];
        const skills = skillsRes.ok ? await skillsRes.json() : [];
        const certs = certsRes.ok ? await certsRes.json() : [];
        const education = eduRes.ok ? await eduRes.json() : [];
        const experience = expRes.ok ? await expRes.json() : [];
        const design = designRes.ok ? await designRes.json() : [];
        const uxui = uxuiRes.ok ? await uxuiRes.json() : [];
        const blog = blogRes && blogRes.ok ? await blogRes.json() : [];
        const msgStats = msgRes && msgRes.ok ? await msgRes.json() : null;
        const socialLinks = socialRes && socialRes.ok ? await socialRes.json() : [];

            // Stats
            const total = projects.length;
            const published = projects.filter(p => p.is_published).length;
            const featured = projects.filter(p => p.is_featured).length;

            const totalEl = document.getElementById("dashTotalProjects");
            const pubEl = document.getElementById("dashPublishedProjects");
            const featEl = document.getElementById("dashFeaturedProjects");
            const catEl = document.getElementById("dashCategories");
            const skillsEl = document.getElementById("dashTotalSkills");
            const certsEl = document.getElementById("dashTotalCertifications");
            const eduEl = document.getElementById("dashTotalEducation");
            const expEl = document.getElementById("dashTotalExperience");
            const designEl = document.getElementById("dashTotalDesign");
            const uxuiEl = document.getElementById("dashTotalUXUI");
            const blogEl = document.getElementById("dashTotalBlog");
            const msgTotalEl = document.getElementById("dashTotalMessages");
            const msgUnreadEl = document.getElementById("dashUnreadMessages");
            const socialEl = document.getElementById("dashTotalSocial");
            const sidebarBadge = document.getElementById("sidebarUnreadBadge");

            if (totalEl) totalEl.textContent = total;
            if (pubEl) pubEl.textContent = published;
            if (featEl) featEl.textContent = featured;
            if (catEl) catEl.textContent = categories.length;
            if (skillsEl) skillsEl.textContent = skills.length;
            if (certsEl) certsEl.textContent = certs.length;
            if (eduEl) eduEl.textContent = education.length;
            if (expEl) expEl.textContent = experience.length;
            if (designEl) designEl.textContent = design.length;
            if (uxuiEl) uxuiEl.textContent = uxui.length;
            if (blogEl) blogEl.textContent = blog.length;
            if (socialEl) socialEl.textContent = socialLinks.length;

            if (msgStats) {
                if (msgTotalEl) msgTotalEl.textContent = msgStats.total || 0;
                if (msgUnreadEl) msgUnreadEl.textContent = msgStats.unread || 0;
                if (sidebarBadge) {
                    if (msgStats.unread > 0) {
                        sidebarBadge.textContent = msgStats.unread;
                        sidebarBadge.style.display = "inline-block";
                    } else {
                        sidebarBadge.style.display = "none";
                    }
                }
            }

            // Render Recent Projects (Top 5)
            const recentBody = document.getElementById("recentProjectsBody");
            if (recentBody) {
                if (projects.length === 0) {
                    recentBody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">No projects yet. Click "+ Add New Project" to get started!</td></tr>`;
                } else {
                    const recent = projects.slice(0, 5);
                    recentBody.innerHTML = recent.map(p => {
                        const cat = categories.find(c => c.id === p.category_id);
                        const catName = cat ? cat.name : "General";
                        return `
                            <tr>
                                <td><strong>${escapeHtml(p.title)}</strong></td>
                                <td><span class="badge badge-cat">${escapeHtml(catName)}</span></td>
                                <td>
                                    <span class="badge ${p.is_published ? 'badge-published' : 'badge-draft'}">
                                        ${p.is_published ? 'Published' : 'Draft'}
                                    </span>
                                </td>
                                <td>
                                    <a href="projects.html?edit=${p.id}" class="panel-action">Edit</a>
                                </td>
                            </tr>
                        `;
                    }).join("");
                }
            }
    } catch (err) {
        console.error("Dashboard data load error:", err);
    }
}

function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str ?? "";
    return div.innerHTML;
}

// =========================================================
// LOGOUT
// =========================================================
function logout() {
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("admin_user");
    localStorage.removeItem("access_token");
    localStorage.removeItem("admin_user");
    localStorage.removeItem("token");
    window.location.href = "login.html";
}

if (logoutButton) {
    logoutButton.addEventListener("click", logout);
}

// =========================================================
// MOBILE SIDEBAR TOGGLE
// =========================================================
if (mobileMenuButton && sidebar) {
    mobileMenuButton.addEventListener("click", () => {
        sidebar.classList.toggle("open");
    });
}

document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", () => {
        if (window.innerWidth <= 900 && sidebar) {
            sidebar.classList.remove("open");
        }
    });
});

// Initialize
loadAdminProfile();
loadDashboardData();
loadAdminCvList();

// =========================================================
// TAILORED CV MANAGEMENT LOGIC
// =========================================================
async function loadAdminCvList() {
    const tbody = document.getElementById("adminCvTableBody");
    if (!tbody) return;

    try {
        const res = await fetch(`${API_BASE_URL}/api/settings/cvs`);
        if (!res.ok) throw new Error("Could not load CVs list");

        const cvs = await res.json();
        const totalCvEl = document.getElementById("dashTotalCVs");
        if (totalCvEl) totalCvEl.textContent = cvs.length;

        if (!cvs || cvs.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">No CV posts configured.</td></tr>`;
            return;
        }

        tbody.innerHTML = cvs.map(cv => {
            const sizeKb = cv.exists ? (cv.size_bytes / 1024).toFixed(1) + " KB" : "Not uploaded";
            const statusBadge = cv.exists 
                ? `<span class="badge badge-published">Active (Live)</span>`
                : `<span class="badge badge-draft">Missing</span>`;

            return `
                <tr>
                    <td>
                        <strong>${escapeHtml(cv.title)}</strong>
                    </td>
                    <td>
                        <span class="badge badge-cat">${escapeHtml(cv.category)}</span>
                    </td>
                    <td>
                        <code>${escapeHtml(cv.filename)}</code>
                    </td>
                    <td>
                        <small style="color: var(--text-muted);">${sizeKb}</small>
                    </td>
                    <td>
                        ${statusBadge}
                    </td>
                    <td style="text-align: right; white-space: nowrap;">
                        <a href="${cv.url}" target="_blank" class="panel-action" style="margin-right: 10px;">
                            📥 View PDF
                        </a>
                        <button type="button" class="btn btn-secondary btn-sm" onclick="triggerCvUpload('${cv.role_key}')" style="font-size: 11.5px; padding: 4px 10px;">
                            ⬆️ Replace PDF
                        </button>
                    </td>
                </tr>
            `;
        }).join("");

    } catch (err) {
        console.error("Load CVs error:", err);
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Failed to load CVs list.</td></tr>`;
        }
    }
}

function triggerCvUpload(roleKey) {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".pdf";
    fileInput.style.display = "none";

    fileInput.addEventListener("change", async () => {
        if (!fileInput.files || fileInput.files.length === 0) return;
        const file = fileInput.files[0];

        if (!file.name.toLowerCase().endsWith(".pdf")) {
            alert("Only PDF documents (.pdf) are permitted.");
            return;
        }

        const statusMsg = document.getElementById("cvUploadStatusMsg");
        if (statusMsg) {
            statusMsg.textContent = `Uploading ${file.name}...`;
            statusMsg.style.color = "var(--color-primary-blue)";
            statusMsg.style.display = "inline-block";
        }

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch(`${API_BASE_URL}/api/settings/upload-cv/${roleKey}`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                body: formData
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.detail || "Failed to upload CV document");
            }

            const data = await res.json();
            if (statusMsg) {
                statusMsg.textContent = `✓ ${data.message || "CV updated successfully!"}`;
                statusMsg.style.color = "#2e7d32";
                setTimeout(() => { if (statusMsg) statusMsg.style.display = "none"; }, 4000);
            }

            await loadAdminCvList();

        } catch (uploadErr) {
            console.error("Upload CV error:", uploadErr);
            alert("Error uploading CV: " + uploadErr.message);
            if (statusMsg) statusMsg.style.display = "none";
        }
    });

    document.body.appendChild(fileInput);
    fileInput.click();
    setTimeout(() => {
        if (document.body.contains(fileInput)) {
            document.body.removeChild(fileInput);
        }
    }, 1000);
}