const API_BASE_URL = window.location.origin.includes(":8000") 
    ? window.location.origin 
    : "http://127.0.0.1:8000";

const token = sessionStorage.getItem("access_token");

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

        if (projRes.ok) {
            const projects = await projRes.json();
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