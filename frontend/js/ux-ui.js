/**
 * =========================================================
 * PERSONAL GLOBAL WEBSITE — ADMIN UX/UI PORTFOLIO CONTROLLER
 * =========================================================
 * Official 5-Color System:
 * --color-primary-dark:    #063F60 (Deep Navy)
 * --color-primary-blue:    #087DD8 (Bright Blue)
 * --color-primary-light:   #6FB7E1 (Primary Light Blue)
 * --color-secondary-light: #C4E0E1 (Soft Aqua)
 * --color-background:      #E8EEEE (Very Light Background)
 * =========================================================
 */

const API_BASE_URL = window.location.origin.includes(":8000") 
    ? window.location.origin 
    : "http://127.0.0.1:8000";

const token = sessionStorage.getItem("access_token") || localStorage.getItem("access_token") || localStorage.getItem("token");

// Authentication Check
if (!token) {
    window.location.href = "login.html";
}

let caseStudies = [];
let editingCaseStudyId = null;

// DOM Elements
const uxuiModal = document.getElementById("uxuiModal");
const uxuiForm = document.getElementById("uxuiForm");
const modalTitle = document.getElementById("modalTitle");
const uxuiTableBody = document.getElementById("uxuiTableBody");
const searchUXUIInput = document.getElementById("searchUXUIInput");
const filterCategory = document.getElementById("filterCategory");
const filterStatus = document.getElementById("filterStatus");
const clearFiltersBtn = document.getElementById("clearFiltersBtn");
const openAddUXUIModalBtn = document.getElementById("openAddUXUIModalBtn");
const closeModalBtn = document.getElementById("closeModalBtn");
const cancelModalBtn = document.getElementById("cancelModalBtn");
const formMessage = document.getElementById("formMessage");
const toastNotification = document.getElementById("toastNotification");

// Modal Form Inputs
const uxuiTitle = document.getElementById("uxuiTitle");
const uxuiSubtitle = document.getElementById("uxuiSubtitle");
const uxuiCategory = document.getElementById("uxuiCategory");
const uxuiClient = document.getElementById("uxuiClient");
const uxuiRole = document.getElementById("uxuiRole");
const uxuiDuration = document.getElementById("uxuiDuration");
const uxuiCoverImageUrl = document.getElementById("uxuiCoverImageUrl");
const uxuiFileInput = document.getElementById("uxuiFileInput");
const uxuiUploadStatus = document.getElementById("uxuiUploadStatus");
const uxuiTools = document.getElementById("uxuiTools");
const uxuiFigmaUrl = document.getElementById("uxuiFigmaUrl");
const uxuiLivePrototypeUrl = document.getElementById("uxuiLivePrototypeUrl");
const uxuiProblem = document.getElementById("uxuiProblem");
const uxuiSolution = document.getElementById("uxuiSolution");
const uxuiProcess = document.getElementById("uxuiProcess");
const uxuiResults = document.getElementById("uxuiResults");
const uxuiOrder = document.getElementById("uxuiOrder");
const uxuiFeatured = document.getElementById("uxuiFeatured");
const uxuiActive = document.getElementById("uxuiActive");
const saveUXUIBtn = document.getElementById("saveUXUIBtn");

// Header & Layout Elements
const adminName = document.getElementById("adminName");
const adminAvatar = document.getElementById("adminAvatar");
const logoutButton = document.getElementById("logoutButton");
const mobileMenuButton = document.getElementById("mobileMenuButton");
const sidebar = document.getElementById("sidebar");

function authHeaders(isJson = true) {
    const headers = {
        "Authorization": `Bearer ${token}`,
    };
    if (isJson) {
        headers["Content-Type"] = "application/json";
    }
    return headers;
}

// Toast Notifications
function showToast(message, type = "success") {
    if (!toastNotification) return;
    toastNotification.textContent = message;
    toastNotification.className = `toast show ${type}`;
    setTimeout(() => {
        toastNotification.className = "toast";
    }, 3200);
}

// Form Message Utility
function showFormMessage(msg, type = "error") {
    if (!formMessage) return;
    formMessage.textContent = msg;
    formMessage.className = `form-message ${type}`;
}

function clearFormMessage() {
    if (!formMessage) return;
    formMessage.textContent = "";
    formMessage.className = "form-message";
}

// Load Admin Profile
async function loadAdminProfile() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/me`, {
            headers: authHeaders(false),
        });
        if (!response.ok) throw new Error("Session expired");

        const data = await response.json();
        const user = data.user;
        const name = user.full_name || user.username || "Admin";

        if (adminName) adminName.textContent = name;
        if (adminAvatar) adminAvatar.textContent = name.charAt(0).toUpperCase();
    } catch (err) {
        console.error("Admin profile error:", err);
        logout();
    }
}

// Fetch Case Studies
async function fetchCaseStudies() {
    uxuiTableBody.innerHTML = `
        <tr>
            <td colspan="8" class="loading-cell">Loading UX/UI case studies...</td>
        </tr>
    `;

    try {
        const res = await fetch(`${API_BASE_URL}/api/ux-ui`, {
            headers: authHeaders(false),
        });

        if (!res.ok) {
            if (res.status === 401) {
                logout();
                return;
            }
            throw new Error(`Failed to load case studies (Status: ${res.status})`);
        }

        caseStudies = await res.json();
        renderCaseStudies();
    } catch (err) {
        console.error("Fetch case studies error:", err);
        uxuiTableBody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-cell">
                    <p style="color: #dc2626; font-weight: 600;">Failed to load UX/UI case studies.</p>
                    <p style="font-size: 13px; color: var(--text-muted);">${escapeHtml(err.message)}</p>
                </td>
            </tr>
        `;
    }
}

// Render Case Studies
function renderCaseStudies() {
    const searchTerm = (searchUXUIInput ? searchUXUIInput.value : "").trim().toLowerCase();
    const catVal = filterCategory ? filterCategory.value : "";
    const statusVal = filterStatus ? filterStatus.value : "";

    const filtered = caseStudies.filter(cs => {
        const matchesSearch = !searchTerm ||
            (cs.title && cs.title.toLowerCase().includes(searchTerm)) ||
            (cs.subtitle && cs.subtitle.toLowerCase().includes(searchTerm)) ||
            (cs.client && cs.client.toLowerCase().includes(searchTerm)) ||
            (cs.role && cs.role.toLowerCase().includes(searchTerm)) ||
            (cs.tools_used && cs.tools_used.toLowerCase().includes(searchTerm));

        const matchesCat = !catVal || (cs.category && cs.category.toLowerCase() === catVal.toLowerCase());

        const matchesStatus = statusVal === "" ||
            (statusVal === "true" && cs.is_active === true) ||
            (statusVal === "false" && cs.is_active === false);

        return matchesSearch && matchesCat && matchesStatus;
    });

    if (filtered.length === 0) {
        uxuiTableBody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-cell">
                    <p style="font-size: 15px; font-weight: 600; color: var(--text-primary); margin-bottom: 4px;">No UX/UI case studies found</p>
                    <p style="font-size: 13px; color: var(--text-muted);">Try adjusting your search filters or click "+ Add Case Study" to create one.</p>
                </td>
            </tr>
        `;
        return;
    }

    uxuiTableBody.innerHTML = filtered.map(cs => {
        const statusBadge = cs.is_active
            ? `<span class="status-badge status-active">● Published</span>`
            : `<span class="status-badge status-inactive">○ Draft</span>`;

        const featuredStar = cs.is_featured
            ? `<span class="featured-star" title="Featured on Home">★ Yes</span>`
            : `<span style="color: var(--text-muted); font-size: 12px;">No</span>`;

        const thumbHtml = cs.cover_image_url
            ? `<img src="${escapeHtml(cs.cover_image_url)}" alt="${escapeHtml(cs.title)}" class="uxui-thumb-img" onerror="this.parentElement.innerHTML='<span class=\\'uxui-thumb-fallback\\'>✨</span>'">`
            : `<span class="uxui-thumb-fallback">✨</span>`;

        const clientText = cs.client 
            ? `${escapeHtml(cs.client)} ${cs.duration ? `• ${escapeHtml(cs.duration)}` : ""}`
            : (cs.duration ? escapeHtml(cs.duration) : "—");

        return `
            <tr>
                <td>
                    <div class="uxui-cell">
                        <div class="uxui-thumb-wrapper">
                            ${thumbHtml}
                        </div>
                        <div class="uxui-details">
                            <span class="uxui-title">${escapeHtml(cs.title)}</span>
                            <span class="uxui-subtitle">${escapeHtml(cs.subtitle || "")}</span>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="badge-tag">${escapeHtml(cs.category)}</span>
                </td>
                <td>
                    <span style="font-size: 13px; color: var(--text-secondary); font-weight: 600;">${clientText}</span>
                </td>
                <td>
                    <span style="font-size: 13px; color: var(--color-primary-dark); font-weight: 600;">${escapeHtml(cs.role || "Lead Designer")}</span>
                </td>
                <td style="font-weight: 600; color: var(--color-primary-dark); text-align: center;">
                    ${cs.display_order}
                </td>
                <td style="text-align: center;">
                    ${featuredStar}
                </td>
                <td>
                    ${statusBadge}
                </td>
                <td class="text-right">
                    <div class="action-buttons">
                        <button
                            type="button"
                            class="btn-icon-action btn-edit"
                            onclick="handleEditUXUI(${cs.id})"
                            title="Edit Case Study"
                        >
                            ✏️ Edit
                        </button>
                        <button
                            type="button"
                            class="btn-icon-action btn-delete"
                            onclick="handleDeleteUXUI(${cs.id}, '${escapeHtml(cs.title)}')"
                            title="Delete Case Study"
                        >
                            🗑️ Delete
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}

// Modal Helpers
function openModal(mode = "add", data = null) {
    clearFormMessage();
    if (uxuiUploadStatus) {
        uxuiUploadStatus.textContent = "Upload high-res case study mockup (PNG, WebP, SVG, JPG)";
        uxuiUploadStatus.style.color = "var(--text-muted)";
    }

    if (mode === "edit" && data) {
        editingCaseStudyId = data.id;
        modalTitle.textContent = "Edit UX/UI Case Study";
        uxuiTitle.value = data.title || "";
        uxuiSubtitle.value = data.subtitle || "";
        uxuiCategory.value = data.category || "Enterprise SaaS";
        uxuiClient.value = data.client || "";
        uxuiRole.value = data.role || "";
        uxuiDuration.value = data.duration || "";
        uxuiCoverImageUrl.value = data.cover_image_url || "";
        uxuiTools.value = data.tools_used || "";
        uxuiFigmaUrl.value = data.figma_url || "";
        uxuiLivePrototypeUrl.value = data.live_prototype_url || "";
        uxuiProblem.value = data.problem_statement || "";
        uxuiSolution.value = data.solution_overview || "";
        uxuiProcess.value = data.design_process || "";
        uxuiResults.value = data.key_results || "";
        uxuiOrder.value = data.display_order !== undefined ? data.display_order : 0;
        uxuiFeatured.checked = !!data.is_featured;
        uxuiActive.checked = data.is_active !== undefined ? data.is_active : true;

        saveUXUIBtn.textContent = "Update Case Study";
    } else {
        editingCaseStudyId = null;
        modalTitle.textContent = "Add UX/UI Case Study";
        uxuiForm.reset();
        uxuiCategory.value = "Enterprise SaaS";
        uxuiOrder.value = 0;
        uxuiFeatured.checked = false;
        uxuiActive.checked = true;
        saveUXUIBtn.textContent = "Save Case Study";
    }

    uxuiModal.classList.add("active");
    uxuiModal.classList.add("show");
    uxuiModal.style.display = "flex";
    document.body.style.overflow = "hidden";
    setTimeout(() => uxuiTitle.focus(), 100);
}

function closeModal() {
    uxuiModal.classList.remove("active");
    uxuiModal.classList.remove("show");
    uxuiModal.style.display = "none";
    document.body.style.overflow = "";
    editingCaseStudyId = null;
    uxuiForm.reset();
    clearFormMessage();
}

// Global Edit & Delete
window.handleEditUXUI = function(id) {
    const cs = caseStudies.find(c => c.id === Number(id) || c.id === id);
    if (!cs) {
        console.error("Case study not found for id:", id);
        return;
    }
    openModal("edit", cs);
};

window.handleDeleteUXUI = async function(id, title) {
    const confirmed = confirm(`Are you sure you want to permanently delete case study "${title}"?\nThis action cannot be undone.`);
    if (!confirmed) return;

    try {
        const res = await fetch(`${API_BASE_URL}/api/ux-ui/${id}`, {
            method: "DELETE",
            headers: authHeaders(false),
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.detail || "Failed to delete case study.");
        }

        showToast(`Case study "${title}" deleted successfully.`);
        fetchCaseStudies();
    } catch (err) {
        console.error("Delete error:", err);
        showToast(err.message || "Failed to delete case study", "error");
    }
};

// Image Upload Handler
if (uxuiFileInput) {
    uxuiFileInput.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        if (uxuiUploadStatus) {
            uxuiUploadStatus.textContent = `Uploading ${file.name}...`;
            uxuiUploadStatus.style.color = "var(--color-primary-blue)";
        }

        try {
            const res = await fetch(`${API_BASE_URL}/api/ux-ui/upload-image`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
                body: formData,
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.detail || "Upload failed");
            }

            const data = await res.json();
            uxuiCoverImageUrl.value = data.image_url;

            if (uxuiUploadStatus) {
                uxuiUploadStatus.textContent = `✓ Uploaded: ${file.name}`;
                uxuiUploadStatus.style.color = "var(--success)";
            }
            showToast("Mockup image uploaded successfully.");
        } catch (err) {
            console.error("Upload error:", err);
            if (uxuiUploadStatus) {
                uxuiUploadStatus.textContent = `✗ Error: ${err.message}`;
                uxuiUploadStatus.style.color = "var(--danger)";
            }
            showToast(err.message, "error");
        }
    });
}

// Form Submit Handler
uxuiForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearFormMessage();

    const titleVal = uxuiTitle.value.trim();
    const coverVal = uxuiCoverImageUrl.value.trim();

    if (!titleVal) {
        showFormMessage("Case study title is required.");
        uxuiTitle.focus();
        return;
    }

    if (!coverVal) {
        showFormMessage("Cover mockup image is required.");
        uxuiCoverImageUrl.focus();
        return;
    }

    const payload = {
        title: titleVal,
        subtitle: uxuiSubtitle.value.trim() || null,
        category: uxuiCategory.value || "Enterprise SaaS",
        client: uxuiClient.value.trim() || null,
        role: uxuiRole.value.trim() || null,
        duration: uxuiDuration.value.trim() || null,
        cover_image_url: coverVal,
        tools_used: uxuiTools.value.trim() || null,
        figma_url: uxuiFigmaUrl.value.trim() || null,
        live_prototype_url: uxuiLivePrototypeUrl.value.trim() || null,
        problem_statement: uxuiProblem.value.trim() || null,
        solution_overview: uxuiSolution.value.trim() || null,
        design_process: uxuiProcess.value.trim() || null,
        key_results: uxuiResults.value.trim() || null,
        display_order: parseInt(uxuiOrder.value, 10) || 0,
        is_featured: uxuiFeatured.checked,
        is_active: uxuiActive.checked,
    };

    saveUXUIBtn.disabled = true;
    saveUXUIBtn.textContent = editingCaseStudyId ? "Updating..." : "Saving...";

    try {
        const url = editingCaseStudyId 
            ? `${API_BASE_URL}/api/ux-ui/${editingCaseStudyId}`
            : `${API_BASE_URL}/api/ux-ui`;

        const method = editingCaseStudyId ? "PUT" : "POST";

        const res = await fetch(url, {
            method: method,
            headers: authHeaders(true),
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            let errMsg = errData.detail || "Failed to save case study.";
            if (Array.isArray(errMsg)) {
                errMsg = errMsg.map(i => i.msg || JSON.stringify(i)).join(", ");
            }
            throw new Error(errMsg);
        }

        showToast(
            editingCaseStudyId 
                ? `Updated "${titleVal}" successfully!` 
                : `Added "${titleVal}" successfully!`
        );

        closeModal();
        fetchCaseStudies();
    } catch (err) {
        console.error("Save case study error:", err);
        showFormMessage(err.message, "error");
    } finally {
        saveUXUIBtn.disabled = false;
        saveUXUIBtn.textContent = editingCaseStudyId ? "Update Case Study" : "Save Case Study";
    }
});

// Event Listeners
if (openAddUXUIModalBtn) {
    openAddUXUIModalBtn.addEventListener("click", () => openModal("add"));
}

if (closeModalBtn) {
    closeModalBtn.addEventListener("click", closeModal);
}

if (cancelModalBtn) {
    cancelModalBtn.addEventListener("click", closeModal);
}

// Close on backdrop click
if (uxuiModal) {
    uxuiModal.addEventListener("click", (e) => {
        if (e.target === uxuiModal) {
            closeModal();
        }
    });
}

// Escape key to close modal
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && uxuiModal && uxuiModal.classList.contains("active")) {
        closeModal();
    }
});

// Search & Filter Listeners
if (searchUXUIInput) {
    searchUXUIInput.addEventListener("input", renderCaseStudies);
}

if (filterCategory) {
    filterCategory.addEventListener("change", renderCaseStudies);
}

if (filterStatus) {
    filterStatus.addEventListener("change", renderCaseStudies);
}

if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener("click", () => {
        if (searchUXUIInput) searchUXUIInput.value = "";
        if (filterCategory) filterCategory.value = "";
        if (filterStatus) filterStatus.value = "";
        renderCaseStudies();
    });
}

// Mobile Menu Toggle
if (mobileMenuButton && sidebar) {
    mobileMenuButton.addEventListener("click", () => {
        sidebar.classList.toggle("mobile-open");
    });
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

// Escape HTML helper
function escapeHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Init
document.addEventListener("DOMContentLoaded", () => {
    loadAdminProfile();
    fetchCaseStudies();
});
