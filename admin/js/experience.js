/**
 * =========================================================
 * PERSONAL GLOBAL WEBSITE — ADMIN EXPERIENCE CONTROLLER
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

let experiences = [];
let editingExpId = null;

// DOM Elements
const expModal = document.getElementById("expModal");
const expForm = document.getElementById("expForm");
const modalTitle = document.getElementById("modalTitle");
const expTableBody = document.getElementById("expTableBody");
const searchExpInput = document.getElementById("searchExpInput");
const filterStatus = document.getElementById("filterStatus");
const clearFiltersBtn = document.getElementById("clearFiltersBtn");
const openAddExpModalBtn = document.getElementById("openAddExpModalBtn");
const closeModalBtn = document.getElementById("closeModalBtn");
const cancelModalBtn = document.getElementById("cancelModalBtn");
const formMessage = document.getElementById("formMessage");
const toastNotification = document.getElementById("toastNotification");

// Modal Form Inputs
const expCompany = document.getElementById("expCompany");
const expPosition = document.getElementById("expPosition");
const expType = document.getElementById("expType");
const expLocation = document.getElementById("expLocation");
const expStartDate = document.getElementById("expStartDate");
const expEndDate = document.getElementById("expEndDate");
const expIsCurrent = document.getElementById("expIsCurrent");
const expTechnologies = document.getElementById("expTechnologies");
const expCompanyUrl = document.getElementById("expCompanyUrl");
const expLogoUrl = document.getElementById("expLogoUrl");
const logoFileInput = document.getElementById("logoFileInput");
const logoUploadStatus = document.getElementById("logoUploadStatus");
const expOrder = document.getElementById("expOrder");
const expActive = document.getElementById("expActive");
const expDescription = document.getElementById("expDescription");
const saveExpBtn = document.getElementById("saveExpBtn");

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

// Fetch Experiences
async function fetchExperiences() {
    expTableBody.innerHTML = `
        <tr>
            <td colspan="8" class="loading-cell">Loading career experience data...</td>
        </tr>
    `;

    try {
        const res = await fetch(`${API_BASE_URL}/api/experience`, {
            headers: authHeaders(false),
        });

        if (!res.ok) {
            if (res.status === 401) {
                logout();
                return;
            }
            throw new Error(`Failed to load experiences (Status: ${res.status})`);
        }

        experiences = await res.json();
        renderExperiences();
    } catch (err) {
        console.error("Fetch experiences error:", err);
        expTableBody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-cell">
                    <p style="color: #dc2626; font-weight: 600;">Failed to load experiences.</p>
                    <p style="font-size: 13px; color: var(--text-muted);">${escapeHtml(err.message)}</p>
                </td>
            </tr>
        `;
    }
}

// Render Experiences
function renderExperiences() {
    const searchTerm = (searchExpInput ? searchExpInput.value : "").trim().toLowerCase();
    const statusVal = filterStatus ? filterStatus.value : "";

    const filtered = experiences.filter(exp => {
        const matchesSearch = !searchTerm ||
            (exp.company && exp.company.toLowerCase().includes(searchTerm)) ||
            (exp.position && exp.position.toLowerCase().includes(searchTerm)) ||
            (exp.location && exp.location.toLowerCase().includes(searchTerm)) ||
            (exp.technologies && exp.technologies.toLowerCase().includes(searchTerm));

        const matchesStatus = statusVal === "" ||
            (statusVal === "true" && exp.is_active === true) ||
            (statusVal === "false" && exp.is_active === false);

        return matchesSearch && matchesStatus;
    });

    if (filtered.length === 0) {
        expTableBody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-cell">
                    <p style="font-size: 15px; font-weight: 600; color: var(--text-primary); margin-bottom: 4px;">No career milestones found</p>
                    <p style="font-size: 13px; color: var(--text-muted);">Try adjusting your search filters or click "+ Add Career Experience" to create one.</p>
                </td>
            </tr>
        `;
        return;
    }

    expTableBody.innerHTML = filtered.map(exp => {
        const statusBadge = exp.is_active
            ? `<span class="status-badge status-active">● Active</span>`
            : `<span class="status-badge status-inactive">○ Inactive</span>`;

        const durationText = exp.is_current 
            ? `${escapeHtml(exp.start_date)} — <span style="color: var(--color-primary-blue); font-weight: 700;">Present</span>`
            : `${escapeHtml(exp.start_date)} — ${escapeHtml(exp.end_date || "Present")}`;

        const logoHtml = exp.company_logo_url
            ? `<img src="${escapeHtml(exp.company_logo_url)}" alt="${escapeHtml(exp.company)}" class="exp-logo-img" onerror="this.parentElement.innerHTML='<span class=\\'exp-logo-fallback\\'>🏢</span>'">`
            : `<span class="exp-logo-fallback">🏢</span>`;

        let techHtml = '<span style="color: var(--text-muted); font-size: 12px;">—</span>';
        if (exp.technologies) {
            const tags = exp.technologies.split(",").map(t => t.trim()).filter(Boolean);
            if (tags.length > 0) {
                const visible = tags.slice(0, 3).map(t => `<span class="badge-tag">${escapeHtml(t)}</span>`).join(" ");
                const extra = tags.length > 3 ? `<span class="badge-tag" style="background:#d0e3eb;">+${tags.length - 3}</span>` : "";
                techHtml = visible + " " + extra;
            }
        }

        const compName = escapeHtml(exp.company);
        const compDisplay = exp.company_url
            ? `<a href="${escapeHtml(exp.company_url)}" target="_blank" rel="noopener noreferrer" style="color: var(--color-primary-blue); font-weight: 700; text-decoration: none;">${compName} ↗</a>`
            : `<span style="font-weight: 700; color: var(--color-primary-dark);">${compName}</span>`;

        return `
            <tr>
                <td>
                    <div class="exp-cell">
                        <div class="exp-logo-wrapper">
                            ${logoHtml}
                        </div>
                        <div class="exp-details">
                            <span class="exp-company">${compDisplay}</span>
                            <span class="exp-position">${escapeHtml(exp.position)}</span>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="badge-tag">${escapeHtml(exp.employment_type || "Full-time")}</span>
                </td>
                <td style="white-space: nowrap;">
                    ${durationText}
                </td>
                <td>
                    <span style="font-size: 13px; color: var(--text-secondary);">${escapeHtml(exp.location || "Remote / Hybrid")}</span>
                </td>
                <td>
                    <div style="display: flex; flex-wrap: wrap; gap: 4px; max-width: 240px;">
                        ${techHtml}
                    </div>
                </td>
                <td style="font-weight: 600; color: var(--color-primary-dark); text-align: center;">
                    ${exp.display_order}
                </td>
                <td>
                    ${statusBadge}
                </td>
                <td class="text-right">
                    <div class="action-buttons">
                        <button
                            type="button"
                            class="btn-icon-action btn-edit"
                            onclick="handleEditExperience(${exp.id})"
                            title="Edit Experience"
                        >
                            ✏️ Edit
                        </button>
                        <button
                            type="button"
                            class="btn-icon-action btn-delete"
                            onclick="handleDeleteExperience(${exp.id}, '${escapeHtml(exp.company)}')"
                            title="Delete Experience"
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
function openModal(mode = "add", expData = null) {
    clearFormMessage();
    if (logoUploadStatus) {
        logoUploadStatus.textContent = "Upload company brand logo (PNG, WebP, SVG, JPG)";
        logoUploadStatus.style.color = "var(--text-muted)";
    }

    if (mode === "edit" && expData) {
        editingExpId = expData.id;
        modalTitle.textContent = "Edit Career Experience";
        expCompany.value = expData.company || "";
        expPosition.value = expData.position || "";
        expType.value = expData.employment_type || "Full-time";
        expLocation.value = expData.location || "";
        expStartDate.value = expData.start_date || "";
        expEndDate.value = expData.end_date || "";
        expIsCurrent.checked = !!expData.is_current;
        expTechnologies.value = expData.technologies || "";
        expCompanyUrl.value = expData.company_url || "";
        expLogoUrl.value = expData.company_logo_url || "";
        expOrder.value = expData.display_order !== undefined ? expData.display_order : 0;
        expDescription.value = expData.description || "";
        expActive.checked = expData.is_active !== undefined ? expData.is_active : true;

        if (expIsCurrent.checked) {
            expEndDate.disabled = true;
            if (!expEndDate.value) expEndDate.value = "Present";
        } else {
            expEndDate.disabled = false;
        }

        saveExpBtn.textContent = "Update Experience";
    } else {
        editingExpId = null;
        modalTitle.textContent = "Add Career Experience";
        expForm.reset();
        expType.value = "Full-time";
        expOrder.value = 0;
        expActive.checked = true;
        expIsCurrent.checked = false;
        expEndDate.disabled = false;
        saveExpBtn.textContent = "Save Experience";
    }

    expModal.classList.add("active");
    expModal.classList.add("show");
    expModal.style.display = "flex";
    document.body.style.overflow = "hidden";
    setTimeout(() => expCompany.focus(), 100);
}

function closeModal() {
    expModal.classList.remove("active");
    expModal.classList.remove("show");
    expModal.style.display = "none";
    document.body.style.overflow = "";
    editingExpId = null;
    expForm.reset();
    clearFormMessage();
}

// Current role checkbox behavior
if (expIsCurrent) {
    expIsCurrent.addEventListener("change", (e) => {
        if (e.target.checked) {
            expEndDate.value = "Present";
            expEndDate.disabled = true;
        } else {
            if (expEndDate.value === "Present") expEndDate.value = "";
            expEndDate.disabled = false;
        }
    });
}

// Global Edit & Delete
window.handleEditExperience = function(id) {
    const exp = experiences.find(e => e.id === Number(id) || e.id === id);
    if (!exp) {
        console.error("Experience not found for id:", id);
        return;
    }
    openModal("edit", exp);
};

window.handleDeleteExperience = async function(id, company) {
    const confirmed = confirm(`Are you sure you want to permanently delete experience at "${company}"?\nThis action cannot be undone.`);
    if (!confirmed) return;

    try {
        const res = await fetch(`${API_BASE_URL}/api/experience/${id}`, {
            method: "DELETE",
            headers: authHeaders(false),
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.detail || "Failed to delete experience.");
        }

        showToast(`Experience at "${company}" deleted successfully.`);
        fetchExperiences();
    } catch (err) {
        console.error("Delete error:", err);
        showToast(err.message || "Failed to delete experience", "error");
    }
};

// Company Logo Upload
if (logoFileInput) {
    logoFileInput.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        if (logoUploadStatus) {
            logoUploadStatus.textContent = `Uploading ${file.name}...`;
            logoUploadStatus.style.color = "var(--color-primary-blue)";
        }

        try {
            const res = await fetch(`${API_BASE_URL}/api/experience/upload-logo`, {
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
            expLogoUrl.value = data.logo_url;

            if (logoUploadStatus) {
                logoUploadStatus.textContent = `✓ Uploaded: ${file.name}`;
                logoUploadStatus.style.color = "var(--success)";
            }
            showToast("Company logo uploaded successfully.");
        } catch (err) {
            console.error("Upload error:", err);
            if (logoUploadStatus) {
                logoUploadStatus.textContent = `✗ Error: ${err.message}`;
                logoUploadStatus.style.color = "var(--danger)";
            }
            showToast(err.message, "error");
        }
    });
}

// Form Submit Handler
expForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearFormMessage();

    const compVal = expCompany.value.trim();
    const posVal = expPosition.value.trim();
    const startVal = expStartDate.value.trim();

    if (!compVal) {
        showFormMessage("Company name is required.");
        expCompany.focus();
        return;
    }

    if (!posVal) {
        showFormMessage("Job title / role is required.");
        expPosition.focus();
        return;
    }

    if (!startVal) {
        showFormMessage("Start date is required.");
        expStartDate.focus();
        return;
    }

    const payload = {
        company: compVal,
        position: posVal,
        employment_type: expType.value || "Full-time",
        location: expLocation.value.trim() || null,
        start_date: startVal,
        end_date: expIsCurrent.checked ? "Present" : (expEndDate.value.trim() || null),
        is_current: expIsCurrent.checked,
        technologies: expTechnologies.value.trim() || null,
        company_url: expCompanyUrl.value.trim() || null,
        company_logo_url: expLogoUrl.value.trim() || null,
        description: expDescription.value.trim() || null,
        display_order: parseInt(expOrder.value, 10) || 0,
        is_active: expActive.checked,
    };

    saveExpBtn.disabled = true;
    saveExpBtn.textContent = editingExpId ? "Updating..." : "Saving...";

    try {
        const url = editingExpId 
            ? `${API_BASE_URL}/api/experience/${editingExpId}`
            : `${API_BASE_URL}/api/experience`;

        const method = editingExpId ? "PUT" : "POST";

        const res = await fetch(url, {
            method: method,
            headers: authHeaders(true),
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            let errMsg = errData.detail || "Failed to save experience.";
            if (Array.isArray(errMsg)) {
                errMsg = errMsg.map(i => i.msg || JSON.stringify(i)).join(", ");
            }
            throw new Error(errMsg);
        }

        showToast(
            editingExpId 
                ? `Updated experience at "${compVal}" successfully!` 
                : `Added experience at "${compVal}" successfully!`
        );

        closeModal();
        fetchExperiences();
    } catch (err) {
        console.error("Save experience error:", err);
        showFormMessage(err.message, "error");
    } finally {
        saveExpBtn.disabled = false;
        saveExpBtn.textContent = editingExpId ? "Update Experience" : "Save Experience";
    }
});

// Event Listeners
if (openAddExpModalBtn) {
    openAddExpModalBtn.addEventListener("click", () => openModal("add"));
}

if (closeModalBtn) {
    closeModalBtn.addEventListener("click", closeModal);
}

if (cancelModalBtn) {
    cancelModalBtn.addEventListener("click", closeModal);
}

// Close on backdrop click
if (expModal) {
    expModal.addEventListener("click", (e) => {
        if (e.target === expModal) {
            closeModal();
        }
    });
}

// Escape key to close modal
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && expModal && expModal.classList.contains("active")) {
        closeModal();
    }
});

// Search & Filter Listeners
if (searchExpInput) {
    searchExpInput.addEventListener("input", renderExperiences);
}

if (filterStatus) {
    filterStatus.addEventListener("change", renderExperiences);
}

if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener("click", () => {
        if (searchExpInput) searchExpInput.value = "";
        if (filterStatus) filterStatus.value = "";
        renderExperiences();
    });
}

// Mobile Menu Toggle
if (mobileMenuButton && sidebar) {
    mobileMenuButton.addEventListener("click", () => {
        sidebar.classList.toggle("mobile-open");
    });
}

// Logout
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
    fetchExperiences();
});
