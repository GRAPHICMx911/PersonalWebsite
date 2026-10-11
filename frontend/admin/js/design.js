/**
 * =========================================================
 * PERSONAL GLOBAL WEBSITE — ADMIN DESIGN PORTFOLIO CONTROLLER
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

let designItems = [];
let editingDesignId = null;

// DOM Elements
const designModal = document.getElementById("designModal");
const designForm = document.getElementById("designForm");
const modalTitle = document.getElementById("modalTitle");
const designTableBody = document.getElementById("designTableBody");
const searchDesignInput = document.getElementById("searchDesignInput");
const filterCategory = document.getElementById("filterCategory");
const filterStatus = document.getElementById("filterStatus");
const clearFiltersBtn = document.getElementById("clearFiltersBtn");
const openAddDesignModalBtn = document.getElementById("openAddDesignModalBtn");
const closeModalBtn = document.getElementById("closeModalBtn");
const cancelModalBtn = document.getElementById("cancelModalBtn");
const formMessage = document.getElementById("formMessage");
const toastNotification = document.getElementById("toastNotification");

// Modal Form Inputs
const designTitle = document.getElementById("designTitle");
const designCategory = document.getElementById("designCategory");
const designClient = document.getElementById("designClient");
const designYear = document.getElementById("designYear");
const designAspectRatio = document.getElementById("designAspectRatio");
const designImageUrl = document.getElementById("designImageUrl");
const designFileInput = document.getElementById("designFileInput");
const designUploadStatus = document.getElementById("designUploadStatus");
const designTools = document.getElementById("designTools");
const designTags = document.getElementById("designTags");
const designOrder = document.getElementById("designOrder");
const designFeatured = document.getElementById("designFeatured");
const designActive = document.getElementById("designActive");
const designDescription = document.getElementById("designDescription");
const saveDesignBtn = document.getElementById("saveDesignBtn");

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

// Fetch Design Items
async function fetchDesignItems() {
    designTableBody.innerHTML = `
        <tr>
            <td colspan="8" class="loading-cell">Loading design items...</td>
        </tr>
    `;

    try {
        const res = await fetch(`${API_BASE_URL}/api/design`, {
            headers: authHeaders(false),
        });

        if (!res.ok) {
            if (res.status === 401) {
                logout();
                return;
            }
            throw new Error(`Failed to load design items (Status: ${res.status})`);
        }

        designItems = await res.json();
        renderDesignItems();
    } catch (err) {
        console.error("Fetch design items error:", err);
        designTableBody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-cell">
                    <p style="color: #dc2626; font-weight: 600;">Failed to load design portfolio.</p>
                    <p style="font-size: 13px; color: var(--text-muted);">${escapeHtml(err.message)}</p>
                </td>
            </tr>
        `;
    }
}

// Render Design Items
function renderDesignItems() {
    const searchTerm = (searchDesignInput ? searchDesignInput.value : "").trim().toLowerCase();
    const catVal = filterCategory ? filterCategory.value : "";
    const statusVal = filterStatus ? filterStatus.value : "";

    const filtered = designItems.filter(item => {
        const matchesSearch = !searchTerm ||
            (item.title && item.title.toLowerCase().includes(searchTerm)) ||
            (item.client && item.client.toLowerCase().includes(searchTerm)) ||
            (item.tools_used && item.tools_used.toLowerCase().includes(searchTerm)) ||
            (item.tags && item.tags.toLowerCase().includes(searchTerm));

        const matchesCat = !catVal || (item.category && item.category.toLowerCase() === catVal.toLowerCase());

        const matchesStatus = statusVal === "" ||
            (statusVal === "true" && item.is_active === true) ||
            (statusVal === "false" && item.is_active === false);

        return matchesSearch && matchesCat && matchesStatus;
    });

    if (filtered.length === 0) {
        designTableBody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-cell">
                    <p style="font-size: 15px; font-weight: 600; color: var(--text-primary); margin-bottom: 4px;">No design assets found</p>
                    <p style="font-size: 13px; color: var(--text-muted);">Try adjusting your search filters or click "+ Add Design Item" to create one.</p>
                </td>
            </tr>
        `;
        return;
    }

    designTableBody.innerHTML = filtered.map(item => {
        const statusBadge = item.is_active
            ? `<span class="status-badge status-active">● Published</span>`
            : `<span class="status-badge status-inactive">○ Draft</span>`;

        const featuredStar = item.is_featured
            ? `<span class="featured-star" title="Featured on Home">★ Yes</span>`
            : `<span style="color: var(--text-muted); font-size: 12px;">No</span>`;

        const thumbHtml = item.image_url
            ? `<img src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.title)}" class="design-thumb-img" onerror="this.parentElement.innerHTML='<span class=\\'design-thumb-fallback\\'>🎨</span>'">`
            : `<span class="design-thumb-fallback">🎨</span>`;

        const clientText = item.client 
            ? `${escapeHtml(item.client)} ${item.year ? `(${escapeHtml(item.year)})` : ""}`
            : (item.year ? escapeHtml(item.year) : "—");

        let toolsHtml = '<span style="color: var(--text-muted); font-size: 12px;">—</span>';
        if (item.tools_used) {
            const tags = item.tools_used.split(",").map(t => t.trim()).filter(Boolean);
            if (tags.length > 0) {
                toolsHtml = tags.slice(0, 2).map(t => `<span class="badge-tag">${escapeHtml(t)}</span>`).join(" ");
                if (tags.length > 2) toolsHtml += ` <span class="badge-tag" style="background:#d0e3eb;">+${tags.length - 2}</span>`;
            }
        }

        return `
            <tr>
                <td>
                    <div class="design-cell">
                        <div class="design-thumb-wrapper">
                            ${thumbHtml}
                        </div>
                        <div class="design-details">
                            <span class="design-title">${escapeHtml(item.title)}</span>
                            <span class="design-client">${escapeHtml(item.tags || "")}</span>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="badge-tag">${escapeHtml(item.category)}</span>
                </td>
                <td>
                    <span style="font-size: 13px; color: var(--text-secondary); font-weight: 600;">${clientText}</span>
                </td>
                <td>
                    <div style="display: flex; flex-wrap: wrap; gap: 4px; max-width: 200px;">
                        ${toolsHtml}
                    </div>
                </td>
                <td style="font-weight: 600; color: var(--color-primary-dark); text-align: center;">
                    ${item.display_order}
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
                            onclick="handleEditDesign(${item.id})"
                            title="Edit Design Item"
                        >
                            ✏️ Edit
                        </button>
                        <button
                            type="button"
                            class="btn-icon-action btn-delete"
                            onclick="handleDeleteDesign(${item.id}, '${escapeHtml(item.title)}')"
                            title="Delete Design Item"
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
    if (designUploadStatus) {
        designUploadStatus.textContent = "Upload artwork mockup (PNG, WebP, SVG, JPG)";
        designUploadStatus.style.color = "var(--text-muted)";
    }

    if (mode === "edit" && data) {
        editingDesignId = data.id;
        modalTitle.textContent = "Edit Design Item";
        designTitle.value = data.title || "";
        designCategory.value = data.category || "Graphic Design";
        designClient.value = data.client || "";
        designYear.value = data.year || "";
        designAspectRatio.value = data.aspect_ratio || "16:9";
        designImageUrl.value = data.image_url || "";
        designTools.value = data.tools_used || "";
        designTags.value = data.tags || "";
        designOrder.value = data.display_order !== undefined ? data.display_order : 0;
        designFeatured.checked = !!data.is_featured;
        designActive.checked = data.is_active !== undefined ? data.is_active : true;
        designDescription.value = data.description || "";

        saveDesignBtn.textContent = "Update Design Item";
    } else {
        editingDesignId = null;
        modalTitle.textContent = "Add Design Item";
        designForm.reset();
        designCategory.value = "Branding & Identity";
        designAspectRatio.value = "16:9";
        designOrder.value = 0;
        designFeatured.checked = false;
        designActive.checked = true;
        saveDesignBtn.textContent = "Save Design Item";
    }

    designModal.classList.add("active");
    designModal.classList.add("show");
    designModal.style.display = "flex";
    document.body.style.overflow = "hidden";
    setTimeout(() => designTitle.focus(), 100);
}

function closeModal() {
    designModal.classList.remove("active");
    designModal.classList.remove("show");
    designModal.style.display = "none";
    document.body.style.overflow = "";
    editingDesignId = null;
    designForm.reset();
    clearFormMessage();
}

// Global Edit & Delete
window.handleEditDesign = function(id) {
    const item = designItems.find(d => d.id === Number(id) || d.id === id);
    if (!item) {
        console.error("Design item not found for id:", id);
        return;
    }
    openModal("edit", item);
};

window.handleDeleteDesign = async function(id, title) {
    const confirmed = confirm(`Are you sure you want to permanently delete "${title}"?\nThis action cannot be undone.`);
    if (!confirmed) return;

    try {
        const res = await fetch(`${API_BASE_URL}/api/design/${id}`, {
            method: "DELETE",
            headers: authHeaders(false),
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.detail || "Failed to delete design item.");
        }

        showToast(`Design item "${title}" deleted successfully.`);
        fetchDesignItems();
    } catch (err) {
        console.error("Delete error:", err);
        showToast(err.message || "Failed to delete design item", "error");
    }
};

// Image Upload Handler
if (designFileInput) {
    designFileInput.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        if (designUploadStatus) {
            designUploadStatus.textContent = `Uploading ${file.name}...`;
            designUploadStatus.style.color = "var(--color-primary-blue)";
        }

        try {
            const res = await fetch(`${API_BASE_URL}/api/design/upload-image`, {
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
            designImageUrl.value = data.image_url;

            if (designUploadStatus) {
                designUploadStatus.textContent = `✓ Uploaded: ${file.name}`;
                designUploadStatus.style.color = "var(--success)";
            }
            showToast("Design artwork uploaded successfully.");
        } catch (err) {
            console.error("Upload error:", err);
            if (designUploadStatus) {
                designUploadStatus.textContent = `✗ Error: ${err.message}`;
                designUploadStatus.style.color = "var(--danger)";
            }
            showToast(err.message, "error");
        }
    });
}

// Form Submit Handler
designForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearFormMessage();

    const titleVal = designTitle.value.trim();
    const imgVal = designImageUrl.value.trim();

    if (!titleVal) {
        showFormMessage("Artwork title is required.");
        designTitle.focus();
        return;
    }

    if (!imgVal) {
        showFormMessage("Artwork image URL or upload is required.");
        designImageUrl.focus();
        return;
    }

    const payload = {
        title: titleVal,
        category: designCategory.value || "Graphic Design",
        client: designClient.value.trim() || null,
        year: designYear.value.trim() || null,
        aspect_ratio: designAspectRatio.value || "16:9",
        image_url: imgVal,
        tools_used: designTools.value.trim() || null,
        tags: designTags.value.trim() || null,
        display_order: parseInt(designOrder.value, 10) || 0,
        is_featured: designFeatured.checked,
        is_active: designActive.checked,
        description: designDescription.value.trim() || null,
    };

    saveDesignBtn.disabled = true;
    saveDesignBtn.textContent = editingDesignId ? "Updating..." : "Saving...";

    try {
        const url = editingDesignId 
            ? `${API_BASE_URL}/api/design/${editingDesignId}`
            : `${API_BASE_URL}/api/design`;

        const method = editingDesignId ? "PUT" : "POST";

        const res = await fetch(url, {
            method: method,
            headers: authHeaders(true),
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            let errMsg = errData.detail || "Failed to save design item.";
            if (Array.isArray(errMsg)) {
                errMsg = errMsg.map(i => i.msg || JSON.stringify(i)).join(", ");
            }
            throw new Error(errMsg);
        }

        showToast(
            editingDesignId 
                ? `Updated "${titleVal}" successfully!` 
                : `Added "${titleVal}" successfully!`
        );

        closeModal();
        fetchDesignItems();
    } catch (err) {
        console.error("Save design error:", err);
        showFormMessage(err.message, "error");
    } finally {
        saveDesignBtn.disabled = false;
        saveDesignBtn.textContent = editingDesignId ? "Update Design Item" : "Save Design Item";
    }
});

// Event Listeners
if (openAddDesignModalBtn) {
    openAddDesignModalBtn.addEventListener("click", () => openModal("add"));
}

if (closeModalBtn) {
    closeModalBtn.addEventListener("click", closeModal);
}

if (cancelModalBtn) {
    cancelModalBtn.addEventListener("click", closeModal);
}

// Close on backdrop click
if (designModal) {
    designModal.addEventListener("click", (e) => {
        if (e.target === designModal) {
            closeModal();
        }
    });
}

// Escape key to close modal
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && designModal && designModal.classList.contains("active")) {
        closeModal();
    }
});

// Search & Filter Listeners
if (searchDesignInput) {
    searchDesignInput.addEventListener("input", renderDesignItems);
}

if (filterCategory) {
    filterCategory.addEventListener("change", renderDesignItems);
}

if (filterStatus) {
    filterStatus.addEventListener("change", renderDesignItems);
}

if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener("click", () => {
        if (searchDesignInput) searchDesignInput.value = "";
        if (filterCategory) filterCategory.value = "";
        if (filterStatus) filterStatus.value = "";
        renderDesignItems();
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
    fetchDesignItems();
});
