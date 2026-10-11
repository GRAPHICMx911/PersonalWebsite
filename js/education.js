/**
 * =========================================================
 * PERSONAL GLOBAL WEBSITE — ADMIN EDUCATION CONTROLLER
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

let educationRecords = [];
let editingEduId = null;

// DOM Elements
const eduModal = document.getElementById("eduModal");
const eduForm = document.getElementById("eduForm");
const modalTitle = document.getElementById("modalTitle");
const eduTableBody = document.getElementById("eduTableBody");
const searchEduInput = document.getElementById("searchEduInput");
const filterStatus = document.getElementById("filterStatus");
const clearFiltersBtn = document.getElementById("clearFiltersBtn");
const openAddEduModalBtn = document.getElementById("openAddEduModalBtn");
const closeModalBtn = document.getElementById("closeModalBtn");
const cancelModalBtn = document.getElementById("cancelModalBtn");
const formMessage = document.getElementById("formMessage");
const toastNotification = document.getElementById("toastNotification");

// Modal Form Inputs
const eduDegree = document.getElementById("eduDegree");
const eduField = document.getElementById("eduField");
const eduInstitution = document.getElementById("eduInstitution");
const eduStartYear = document.getElementById("eduStartYear");
const eduEndYear = document.getElementById("eduEndYear");
const eduGrade = document.getElementById("eduGrade");
const eduOrder = document.getElementById("eduOrder");
const eduActivities = document.getElementById("eduActivities");
const eduInstitutionUrl = document.getElementById("eduInstitutionUrl");
const eduLogoUrl = document.getElementById("eduLogoUrl");
const eduLogoFileInput = document.getElementById("eduLogoFileInput");
const eduLogoUploadStatus = document.getElementById("eduLogoUploadStatus");
const eduActive = document.getElementById("eduActive");
const eduDescription = document.getElementById("eduDescription");
const saveEduBtn = document.getElementById("saveEduBtn");

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

// Fetch Education Records
async function fetchEducation() {
    eduTableBody.innerHTML = `
        <tr>
            <td colspan="7" class="loading-cell">Loading education qualifications data...</td>
        </tr>
    `;

    try {
        const res = await fetch(`${API_BASE_URL}/api/education`, {
            headers: authHeaders(false),
        });

        if (!res.ok) {
            if (res.status === 401) {
                logout();
                return;
            }
            throw new Error(`Failed to load education records (Status: ${res.status})`);
        }

        educationRecords = await res.json();
        renderEducation();
    } catch (err) {
        console.error("Fetch education error:", err);
        eduTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-cell">
                    <p style="color: #dc2626; font-weight: 600;">Failed to load education qualifications.</p>
                    <p style="font-size: 13px; color: var(--text-muted);">${escapeHtml(err.message)}</p>
                </td>
            </tr>
        `;
    }
}

// Render Education Records
function renderEducation() {
    const searchTerm = (searchEduInput ? searchEduInput.value : "").trim().toLowerCase();
    const statusVal = filterStatus ? filterStatus.value : "";

    const filtered = educationRecords.filter(edu => {
        const matchesSearch = !searchTerm ||
            (edu.degree && edu.degree.toLowerCase().includes(searchTerm)) ||
            (edu.field_of_study && edu.field_of_study.toLowerCase().includes(searchTerm)) ||
            (edu.institution && edu.institution.toLowerCase().includes(searchTerm)) ||
            (edu.activities && edu.activities.toLowerCase().includes(searchTerm));

        const matchesStatus = statusVal === "" ||
            (statusVal === "true" && edu.is_active === true) ||
            (statusVal === "false" && edu.is_active === false);

        return matchesSearch && matchesStatus;
    });

    if (filtered.length === 0) {
        eduTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-cell">
                    <p style="font-size: 15px; font-weight: 600; color: var(--text-primary); margin-bottom: 4px;">No education qualifications found</p>
                    <p style="font-size: 13px; color: var(--text-muted);">Try adjusting your search filters or click "+ Add Education Qualification" to create one.</p>
                </td>
            </tr>
        `;
        return;
    }

    eduTableBody.innerHTML = filtered.map(edu => {
        const statusBadge = edu.is_active
            ? `<span class="status-badge status-active">● Active</span>`
            : `<span class="status-badge status-inactive">○ Inactive</span>`;

        let periodText = "—";
        if (edu.start_year || edu.end_year) {
            periodText = `${escapeHtml(edu.start_year || "")} – ${escapeHtml(edu.end_year || "Present")}`;
        }

        const logoHtml = edu.institution_logo_url
            ? `<img src="${escapeHtml(edu.institution_logo_url)}" alt="${escapeHtml(edu.institution)}" class="edu-logo-img" onerror="this.parentElement.innerHTML='<span class=\\'edu-logo-fallback\\'>🎓</span>'">`
            : `<span class="edu-logo-fallback">🎓</span>`;

        const instName = escapeHtml(edu.institution);
        const instDisplay = edu.institution_url
            ? `<a href="${escapeHtml(edu.institution_url)}" target="_blank" rel="noopener noreferrer" style="color: var(--color-primary-blue); font-weight: 700; text-decoration: none;">${instName} ↗</a>`
            : `<span style="font-weight: 700; color: var(--color-primary-dark);">${instName}</span>`;

        return `
            <tr>
                <td>
                    <div class="edu-cell">
                        <div class="edu-logo-wrapper">
                            ${logoHtml}
                        </div>
                        <div class="edu-details">
                            <span class="edu-degree">${escapeHtml(edu.degree)}</span>
                            <span class="edu-field">${escapeHtml(edu.field_of_study)}</span>
                        </div>
                    </div>
                </td>
                <td>
                    ${instDisplay}
                </td>
                <td style="white-space: nowrap; font-weight: 600; color: var(--text-secondary);">
                    ${periodText}
                </td>
                <td>
                    ${edu.grade ? `<span class="badge-tag">${escapeHtml(edu.grade)}</span>` : '<span style="color: var(--text-muted); font-size: 12px;">—</span>'}
                </td>
                <td style="font-weight: 600; color: var(--color-primary-dark); text-align: center;">
                    ${edu.display_order}
                </td>
                <td>
                    ${statusBadge}
                </td>
                <td class="text-right">
                    <div class="action-buttons">
                        <button
                            type="button"
                            class="btn-icon-action btn-edit"
                            onclick="handleEditEducation(${edu.id})"
                            title="Edit Qualification"
                        >
                            ✏️ Edit
                        </button>
                        <button
                            type="button"
                            class="btn-icon-action btn-delete"
                            onclick="handleDeleteEducation(${edu.id}, '${escapeHtml(edu.degree)}')"
                            title="Delete Qualification"
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
function openModal(mode = "add", eduData = null) {
    clearFormMessage();
    if (eduLogoUploadStatus) {
        eduLogoUploadStatus.textContent = "Upload institution crest or seal (PNG, WebP, SVG, JPG)";
        eduLogoUploadStatus.style.color = "var(--text-muted)";
    }

    if (mode === "edit" && eduData) {
        editingEduId = eduData.id;
        modalTitle.textContent = "Edit Education Qualification";
        eduDegree.value = eduData.degree || "";
        eduField.value = eduData.field_of_study || "";
        eduInstitution.value = eduData.institution || "";
        eduStartYear.value = eduData.start_year || "";
        eduEndYear.value = eduData.end_year || "";
        eduGrade.value = eduData.grade || "";
        eduOrder.value = eduData.display_order !== undefined ? eduData.display_order : 0;
        eduActivities.value = eduData.activities || "";
        eduInstitutionUrl.value = eduData.institution_url || "";
        eduLogoUrl.value = eduData.institution_logo_url || "";
        eduDescription.value = eduData.description || "";
        eduActive.checked = eduData.is_active !== undefined ? eduData.is_active : true;

        saveEduBtn.textContent = "Update Qualification";
    } else {
        editingEduId = null;
        modalTitle.textContent = "Add Education Qualification";
        eduForm.reset();
        eduOrder.value = 0;
        eduActive.checked = true;
        saveEduBtn.textContent = "Save Qualification";
    }

    eduModal.classList.add("active");
    eduModal.classList.add("show");
    eduModal.style.display = "flex";
    document.body.style.overflow = "hidden";
    setTimeout(() => eduDegree.focus(), 100);
}

function closeModal() {
    eduModal.classList.remove("active");
    eduModal.classList.remove("show");
    eduModal.style.display = "none";
    document.body.style.overflow = "";
    editingEduId = null;
    eduForm.reset();
    clearFormMessage();
}

// Global Edit & Delete
window.handleEditEducation = function(id) {
    const edu = educationRecords.find(e => e.id === Number(id) || e.id === id);
    if (!edu) {
        console.error("Education record not found for id:", id);
        return;
    }
    openModal("edit", edu);
};

window.handleDeleteEducation = async function(id, title) {
    const confirmed = confirm(`Are you sure you want to permanently delete "${title}"?\nThis action cannot be undone.`);
    if (!confirmed) return;

    try {
        const res = await fetch(`${API_BASE_URL}/api/education/${id}`, {
            method: "DELETE",
            headers: authHeaders(false),
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.detail || "Failed to delete education record.");
        }

        showToast(`Qualification "${title}" deleted successfully.`);
        fetchEducation();
    } catch (err) {
        console.error("Delete error:", err);
        showToast(err.message || "Failed to delete qualification", "error");
    }
};

// Institution Logo Upload
if (eduLogoFileInput) {
    eduLogoFileInput.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        if (eduLogoUploadStatus) {
            eduLogoUploadStatus.textContent = `Uploading ${file.name}...`;
            eduLogoUploadStatus.style.color = "var(--color-primary-blue)";
        }

        try {
            const res = await fetch(`${API_BASE_URL}/api/education/upload-logo`, {
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
            eduLogoUrl.value = data.logo_url;

            if (eduLogoUploadStatus) {
                eduLogoUploadStatus.textContent = `✓ Uploaded: ${file.name}`;
                eduLogoUploadStatus.style.color = "var(--success)";
            }
            showToast("Institution crest uploaded successfully.");
        } catch (err) {
            console.error("Upload error:", err);
            if (eduLogoUploadStatus) {
                eduLogoUploadStatus.textContent = `✗ Error: ${err.message}`;
                eduLogoUploadStatus.style.color = "var(--danger)";
            }
            showToast(err.message, "error");
        }
    });
}

// Form Submit Handler
eduForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearFormMessage();

    const degVal = eduDegree.value.trim();
    const fieldVal = eduField.value.trim();
    const instVal = eduInstitution.value.trim();

    if (!degVal) {
        showFormMessage("Degree title is required.");
        eduDegree.focus();
        return;
    }

    if (!fieldVal) {
        showFormMessage("Field of study is required.");
        eduField.focus();
        return;
    }

    if (!instVal) {
        showFormMessage("Institution name is required.");
        eduInstitution.focus();
        return;
    }

    const payload = {
        degree: degVal,
        field_of_study: fieldVal,
        institution: instVal,
        start_year: eduStartYear.value.trim() || null,
        end_year: eduEndYear.value.trim() || null,
        grade: eduGrade.value.trim() || null,
        activities: eduActivities.value.trim() || null,
        institution_url: eduInstitutionUrl.value.trim() || null,
        institution_logo_url: eduLogoUrl.value.trim() || null,
        description: eduDescription.value.trim() || null,
        display_order: parseInt(eduOrder.value, 10) || 0,
        is_active: eduActive.checked,
    };

    saveEduBtn.disabled = true;
    saveEduBtn.textContent = editingEduId ? "Updating..." : "Saving...";

    try {
        const url = editingEduId 
            ? `${API_BASE_URL}/api/education/${editingEduId}`
            : `${API_BASE_URL}/api/education`;

        const method = editingEduId ? "PUT" : "POST";

        const res = await fetch(url, {
            method: method,
            headers: authHeaders(true),
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            let errMsg = errData.detail || "Failed to save qualification.";
            if (Array.isArray(errMsg)) {
                errMsg = errMsg.map(i => i.msg || JSON.stringify(i)).join(", ");
            }
            throw new Error(errMsg);
        }

        showToast(
            editingEduId 
                ? `Updated "${degVal}" successfully!` 
                : `Added "${degVal}" successfully!`
        );

        closeModal();
        fetchEducation();
    } catch (err) {
        console.error("Save education error:", err);
        showFormMessage(err.message, "error");
    } finally {
        saveEduBtn.disabled = false;
        saveEduBtn.textContent = editingEduId ? "Update Qualification" : "Save Qualification";
    }
});

// Event Listeners
if (openAddEduModalBtn) {
    openAddEduModalBtn.addEventListener("click", () => openModal("add"));
}

if (closeModalBtn) {
    closeModalBtn.addEventListener("click", closeModal);
}

if (cancelModalBtn) {
    cancelModalBtn.addEventListener("click", closeModal);
}

// Close on backdrop click
if (eduModal) {
    eduModal.addEventListener("click", (e) => {
        if (e.target === eduModal) {
            closeModal();
        }
    });
}

// Escape key to close modal
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && eduModal && eduModal.classList.contains("active")) {
        closeModal();
    }
});

// Search & Filter Listeners
if (searchEduInput) {
    searchEduInput.addEventListener("input", renderEducation);
}

if (filterStatus) {
    filterStatus.addEventListener("change", renderEducation);
}

if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener("click", () => {
        if (searchEduInput) searchEduInput.value = "";
        if (filterStatus) filterStatus.value = "";
        renderEducation();
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
    fetchEducation();
});
