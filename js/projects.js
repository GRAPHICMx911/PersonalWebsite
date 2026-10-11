const API_BASE_URL = window.location.origin.includes(":8000") 
    ? window.location.origin 
    : "http://127.0.0.1:8000";

const token = sessionStorage.getItem("access_token") || localStorage.getItem("access_token") || localStorage.getItem("token");

// =========================================================
// AUTHENTICATION CHECK
// =========================================================
if (!token) {
    window.location.href = "login.html";
}

let projects = [];
let categories = [];
let editingProjectId = null;

// DOM Elements
const projectModal = document.getElementById("projectModal");
const projectForm = document.getElementById("projectForm");
const projectsTableBody = document.getElementById("projectsTableBody");
const searchProject = document.getElementById("searchProject");
const filterCategory = document.getElementById("filterCategory");
const filterStatus = document.getElementById("filterStatus");
const clearFiltersBtn = document.getElementById("clearFiltersBtn");
const projectCategory = document.getElementById("projectCategory");
const formMessage = document.getElementById("formMessage");
const toastNotification = document.getElementById("toastNotification");
const imageFileInput = document.getElementById("imageFileInput");
const uploadStatusText = document.getElementById("uploadStatusText");

// Header profile
const adminName = document.getElementById("adminName");
const adminAvatar = document.getElementById("adminAvatar");
const logoutButton = document.getElementById("logoutButton");
const mobileMenuButton = document.getElementById("mobileMenuButton");
const sidebar = document.getElementById("sidebar");

function authHeaders(isJson = true) {
    const headers = {
        "Authorization": `Bearer ${token}`
    };
    if (isJson) {
        headers["Content-Type"] = "application/json";
    }
    return headers;
}

// =========================================================
// LOAD ADMIN PROFILE
// =========================================================
async function loadAdminProfile() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/me`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error("Session expired.");
        }

        const data = await response.json();
        const displayName = data.user.full_name || data.user.username || "Admin";
        if (adminName) adminName.textContent = displayName;
        if (adminAvatar) adminAvatar.textContent = displayName.charAt(0).toUpperCase();
    } catch (err) {
        console.error("Profile check failed:", err);
        logout();
    }
}

// =========================================================
// LOAD CATEGORIES
// =========================================================
async function loadCategories() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/projects/categories`);
        if (!response.ok) throw new Error("Could not load project categories.");
        categories = await response.json();

        projectCategory.innerHTML = `<option value="">Select Category</option>`;
        filterCategory.innerHTML = `<option value="">All Categories</option>`;

        categories.forEach(cat => {
            const opt1 = new Option(cat.name, cat.id);
            const opt2 = new Option(cat.name, cat.id);
            projectCategory.appendChild(opt1);
            filterCategory.appendChild(opt2);
        });
    } catch (err) {
        console.error("Categories error:", err);
        showToast("Error loading categories: " + err.message, "error");
    }
}

// =========================================================
// LOAD PROJECTS
// =========================================================
async function loadProjects() {
    projectsTableBody.innerHTML = `<tr><td colspan="7" class="loading-cell">Loading projects...</td></tr>`;
    try {
        const response = await fetch(`${API_BASE_URL}/api/projects`, {
            headers: authHeaders()
        });

        if (!response.ok) {
            if (response.status === 401) {
                logout();
                return;
            }
            throw new Error("Could not load projects.");
        }

        projects = await response.json();
        updateStatistics();
        renderProjects();
        handleUrlParams();
    } catch (err) {
        console.error("Projects load error:", err);
        projectsTableBody.innerHTML = `<tr><td colspan="7" class="empty-cell">Failed to load projects. Ensure backend server is running.</td></tr>`;
    }
}

// =========================================================
// UPDATE STATISTICS
// =========================================================
function updateStatistics() {
    const total = projects.length;
    const published = projects.filter(p => p.is_published).length;
    const featured = projects.filter(p => p.is_featured).length;
    const drafts = projects.filter(p => !p.is_published).length;

    document.getElementById("totalProjects").textContent = total;
    document.getElementById("publishedProjects").textContent = published;
    document.getElementById("featuredProjects").textContent = featured;
    document.getElementById("draftProjects").textContent = drafts;
}

// =========================================================
// RENDER PROJECTS TABLE
// =========================================================
function renderProjects() {
    const search = searchProject.value.trim().toLowerCase();
    const catFilter = filterCategory.value;
    const statusFilter = filterStatus.value;

    const filtered = projects.filter(p => {
        const titleMatch = (p.title || "").toLowerCase().includes(search);
        const descMatch = (p.short_description || "").toLowerCase().includes(search) || (p.description || "").toLowerCase().includes(search);
        const techMatch = (p.technologies || "").toLowerCase().includes(search);
        const matchesSearch = !search || titleMatch || descMatch || techMatch;

        const matchesCat = !catFilter || String(p.category_id) === String(catFilter);

        let matchesStatus = true;
        if (statusFilter === "published") matchesStatus = p.is_published;
        if (statusFilter === "draft") matchesStatus = !p.is_published;

        return matchesSearch && matchesCat && matchesStatus;
    });

    if (filtered.length === 0) {
        projectsTableBody.innerHTML = `<tr><td colspan="7" class="empty-cell">No matching projects found.</td></tr>`;
        return;
    }

    projectsTableBody.innerHTML = filtered.map(p => {
        const cat = categories.find(c => c.id === p.category_id);
        const categoryName = cat ? cat.name : "Uncategorized";
        const thumbSrc = p.image_url ? p.image_url : "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='52' height='40' viewBox='0 0 52 40' fill='%23e2e8f0'><rect width='52' height='40' rx='8'/><text x='50%25' y='55%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%2394a3b8'>📁</text></svg>";

        return `
            <tr>
                <td>
                    <div class="project-cell">
                        <img src="${escapeHtml(thumbSrc)}" alt="${escapeHtml(p.title)}" class="project-thumbnail" onerror="this.onerror=null; this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'52\\' height=\\'40\\'><rect width=\\'52\\' height=\\'40\\' fill=\\'%23cbd5e1\\'/></svg>';">
                        <div class="project-details">
                            <span class="project-title">${escapeHtml(p.title)}</span>
                            <span class="project-excerpt">${escapeHtml(p.short_description || p.slug)}</span>
                        </div>
                    </div>
                </td>
                <td><span class="badge-category">${escapeHtml(categoryName)}</span></td>
                <td><div class="tech-tags">${escapeHtml(p.technologies || "—")}</div></td>
                <td>
                    <span class="status-badge ${p.is_published ? 'published' : 'draft'}">
                        ${p.is_published ? '● Published' : '○ Draft'}
                    </span>
                </td>
                <td>
                    <span class="featured-indicator ${p.is_featured ? 'featured-yes' : 'featured-no'}">
                        ${p.is_featured ? '★ Yes' : '—'}
                    </span>
                </td>
                <td><span class="order-badge">${p.display_order ?? 0}</span></td>
                <td class="actions-cell">
                    <button type="button" class="action-btn btn-edit" onclick="editProject(${p.id})">Edit</button>
                    <button type="button" class="action-btn btn-delete" onclick="deleteProject(${p.id})">Delete</button>
                </td>
            </tr>
        `;
    }).join("");
}

// =========================================================
// MODAL MANAGEMENT
// =========================================================
function openAddProjectModal() {
    editingProjectId = null;
    projectForm.reset();
    document.getElementById("projectId").value = "";
    document.getElementById("modalTitle").textContent = "Add New Project";
    document.getElementById("displayOrder").value = "0";
    document.getElementById("isFeatured").checked = false;
    document.getElementById("isPublished").checked = false;
    clearFormMessage();
    if (uploadStatusText) uploadStatusText.textContent = "Accepts web links or uploads to /uploads/projects/";
    projectModal.classList.add("active");
}

function editProject(id) {
    const p = projects.find(item => item.id === id);
    if (!p) return;

    editingProjectId = id;
    document.getElementById("modalTitle").textContent = "Edit Project";
    document.getElementById("projectId").value = p.id;
    document.getElementById("projectTitle").value = p.title || "";
    document.getElementById("projectSlug").value = p.slug || "";
    document.getElementById("projectCategory").value = p.category_id || "";
    document.getElementById("projectShortDescription").value = p.short_description || "";
    document.getElementById("projectDescription").value = p.description || "";
    document.getElementById("projectTechnologies").value = p.technologies || "";
    document.getElementById("projectUrl").value = p.project_url || "";
    document.getElementById("githubUrl").value = p.github_url || "";
    document.getElementById("imageUrl").value = p.image_url || "";
    document.getElementById("displayOrder").value = p.display_order ?? 0;
    document.getElementById("isFeatured").checked = Boolean(p.is_featured);
    document.getElementById("isPublished").checked = Boolean(p.is_published);

    clearFormMessage();
    if (uploadStatusText) uploadStatusText.textContent = "Accepts web links or uploads to /uploads/projects/";
    projectModal.classList.add("active");
}

function closeProjectModal() {
    projectModal.classList.remove("active");
    projectForm.reset();
    editingProjectId = null;
    clearFormMessage();
}

// =========================================================
// FORM SUBMIT (CREATE / UPDATE)
// =========================================================
projectForm.addEventListener("submit", async function(e) {
    e.preventDefault();

    const title = document.getElementById("projectTitle").value.trim();
    const slug = document.getElementById("projectSlug").value.trim();
    const categoryId = Number(document.getElementById("projectCategory").value);

    if (!title) {
        showFormMessage("Project title is required.", "error");
        return;
    }

    if (!slug) {
        showFormMessage("Project slug is required.", "error");
        return;
    }

    if (!categoryId) {
        showFormMessage("Please select a project category.", "error");
        return;
    }

    const projectData = {
        title: title,
        slug: slug,
        short_description: document.getElementById("projectShortDescription").value.trim() || null,
        description: document.getElementById("projectDescription").value.trim() || null,
        category_id: categoryId,
        technologies: document.getElementById("projectTechnologies").value.trim() || null,
        project_url: document.getElementById("projectUrl").value.trim() || null,
        github_url: document.getElementById("githubUrl").value.trim() || null,
        image_url: document.getElementById("imageUrl").value.trim() || null,
        is_featured: document.getElementById("isFeatured").checked,
        is_published: document.getElementById("isPublished").checked,
        display_order: Number(document.getElementById("displayOrder").value) || 0
    };

    const saveBtn = document.getElementById("saveProjectButton");
    saveBtn.disabled = true;
    saveBtn.textContent = "Saving...";

    try {
        const url = editingProjectId ? `${API_BASE_URL}/api/projects/${editingProjectId}` : `${API_BASE_URL}/api/projects`;
        const method = editingProjectId ? "PUT" : "POST";

        const response = await fetch(url, {
            method: method,
            headers: authHeaders(),
            body: JSON.stringify(projectData)
        });

        const resData = await response.json();

        if (!response.ok) {
            throw new Error(resData.detail || "Failed to save project.");
        }

        showFormMessage(editingProjectId ? "Project updated successfully!" : "Project created successfully!", "success");
        showToast(editingProjectId ? "Project updated." : "Project created.", "success");

        await loadProjects();

        setTimeout(() => {
            closeProjectModal();
        }, 700);

    } catch (err) {
        console.error("Save project error:", err);
        showFormMessage(err.message, "error");
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = "Save Project";
    }
});

// =========================================================
// DELETE PROJECT
// =========================================================
async function deleteProject(id) {
    const p = projects.find(item => item.id === id);
    if (!p) return;

    const confirmed = confirm(`Are you sure you want to permanently delete "${p.title}"?`);
    if (!confirmed) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/projects/${id}`, {
            method: "DELETE",
            headers: authHeaders()
        });

        const resData = await response.json();

        if (!response.ok) {
            throw new Error(resData.detail || "Failed to delete project.");
        }

        showToast("Project deleted successfully.", "success");
        await loadProjects();

    } catch (err) {
        console.error("Delete error:", err);
        showToast(err.message, "error");
    }
}

// =========================================================
// IMAGE FILE UPLOAD HANDLER
// =========================================================
if (imageFileInput) {
    imageFileInput.addEventListener("change", async function() {
        if (!this.files || !this.files[0]) return;
        const file = this.files[0];

        const formData = new FormData();
        formData.append("file", file);

        uploadStatusText.textContent = "Uploading image...";

        try {
            const response = await fetch(`${API_BASE_URL}/api/projects/upload-image`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                body: formData
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.detail || "Image upload failed.");
            }

            document.getElementById("imageUrl").value = data.image_url;
            uploadStatusText.textContent = `Uploaded: ${data.filename}`;
            showToast("Image uploaded successfully!", "success");
        } catch (err) {
            console.error("Image upload error:", err);
            uploadStatusText.textContent = "Upload failed: " + err.message;
            showToast(err.message, "error");
        }
    });
}

// =========================================================
// HELPER FUNCTIONS & UI LISTENERS
// =========================================================
function showFormMessage(msg, type) {
    formMessage.textContent = msg;
    formMessage.className = `form-message ${type}`;
}

function clearFormMessage() {
    formMessage.textContent = "";
    formMessage.className = "form-message";
}

function showToast(message, type = "success") {
    if (!toastNotification) return;
    toastNotification.textContent = message;
    toastNotification.className = `toast show ${type}`;
    setTimeout(() => {
        toastNotification.className = "toast";
    }, 3000);
}

function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Slug auto-generation on title input (only when creating)
document.getElementById("projectTitle").addEventListener("input", function() {
    if (!editingProjectId) {
        document.getElementById("projectSlug").value = this.value
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-");
    }
});

searchProject.addEventListener("input", renderProjects);
filterCategory.addEventListener("change", renderProjects);
filterStatus.addEventListener("change", renderProjects);

if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener("click", () => {
        searchProject.value = "";
        filterCategory.value = "";
        filterStatus.value = "";
        renderProjects();
    });
}

document.getElementById("addProjectButton").addEventListener("click", openAddProjectModal);
document.getElementById("closeModalButton").addEventListener("click", closeProjectModal);
document.getElementById("cancelButton").addEventListener("click", closeProjectModal);

projectModal.addEventListener("click", (e) => {
    if (e.target === projectModal) closeProjectModal();
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && projectModal.classList.contains("active")) {
        closeProjectModal();
    }
});

function handleUrlParams() {
    const params = new URLSearchParams(window.location.search);
    if (params.get("action") === "new") {
        openAddProjectModal();
        window.history.replaceState({}, document.title, window.location.pathname);
    } else if (params.get("edit")) {
        const id = Number(params.get("edit"));
        if (id) {
            editProject(id);
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }
}

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

if (mobileMenuButton && sidebar) {
    mobileMenuButton.addEventListener("click", () => {
        sidebar.classList.toggle("open");
    });
}

// Initialize
loadAdminProfile();
loadCategories().then(loadProjects);