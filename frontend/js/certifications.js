/**
 * =========================================================
 * PERSONAL GLOBAL WEBSITE — ADMIN CERTIFICATIONS CONTROLLER
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

const token = sessionStorage.getItem("access_token");

// =========================================================
// AUTHENTICATION CHECK
// =========================================================
if (!token) {
    window.location.href = "login.html";
}

let certifications = [];
let editingCertId = null;

// DOM Elements
const certModal = document.getElementById("certModal");
const certForm = document.getElementById("certForm");
const modalTitle = document.getElementById("modalTitle");
const certsTableBody = document.getElementById("certsTableBody");
const searchCertInput = document.getElementById("searchCertInput");
const filterStatus = document.getElementById("filterStatus");
const clearFiltersBtn = document.getElementById("clearFiltersBtn");
const openAddCertModalBtn = document.getElementById("openAddCertModalBtn");
const closeModalBtn = document.getElementById("closeModalBtn");
const cancelModalBtn = document.getElementById("cancelModalBtn");
const formMessage = document.getElementById("formMessage");
const toastNotification = document.getElementById("toastNotification");

// Modal Form Inputs
const certName = document.getElementById("certName");
const certIssuer = document.getElementById("certIssuer");
const certIssueDate = document.getElementById("certIssueDate");
const certExpiryDate = document.getElementById("certExpiryDate");
const certId = document.getElementById("certId");
const certOrder = document.getElementById("certOrder");
const certUrl = document.getElementById("certUrl");
const certImageUrl = document.getElementById("certImageUrl");
const badgeFileInput = document.getElementById("badgeFileInput");
const badgeUploadStatus = document.getElementById("badgeUploadStatus");
const certDescription = document.getElementById("certDescription");
const certFeatured = document.getElementById("certFeatured");
const certActive = document.getElementById("certActive");
const saveCertBtn = document.getElementById("saveCertBtn");

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

// =========================================================
// TOAST NOTIFICATIONS
// =========================================================
function showToast(message, type = "success") {
    if (!toastNotification) return;
    toastNotification.textContent = message;
    toastNotification.className = `toast show ${type}`;
    setTimeout(() => {
        toastNotification.className = "toast";
    }, 3200);
}

// =========================================================
// FORM MESSAGE UTILITY
// =========================================================
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

// =========================================================
// LOAD ADMIN PROFILE
// =========================================================
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

// =========================================================
// FETCH CERTIFICATIONS
// =========================================================
async function fetchCertifications() {
    certsTableBody.innerHTML = `
        <tr>
            <td colspan="9" class="loading-cell">Loading certifications data...</td>
        </tr>
    `;

    try {
        const res = await fetch(`${API_BASE_URL}/api/certifications`, {
            headers: authHeaders(false),
        });

        if (!res.ok) {
            if (res.status === 401) {
                logout();
                return;
            }
            throw new Error(`Failed to load certifications (Status: ${res.status})`);
        }

        certifications = await res.json();
        renderCertifications();
    } catch (err) {
        console.error("Fetch certifications error:", err);
        certsTableBody.innerHTML = `
            <tr>
                <td colspan="9" class="empty-state">
                    <p style="color: #dc2626; font-weight: 600;">Failed to load certifications.</p>
                    <p style="font-size: 13px; color: var(--text-muted);">${escapeHtml(err.message)}</p>
                </td>
            </tr>
        `;
    }
}

// =========================================================
// RENDER CERTIFICATIONS TABLE
// =========================================================
function renderCertifications() {
    const searchTerm = (searchCertInput?.value || "").toLowerCase().trim();
    const statusVal = filterStatus?.value;

    let filtered = certifications.filter(cert => {
        const matchesSearch = !searchTerm || 
            (cert.name && cert.name.toLowerCase().includes(searchTerm)) ||
            (cert.issuing_organization && cert.issuing_organization.toLowerCase().includes(searchTerm)) ||
            (cert.credential_id && cert.credential_id.toLowerCase().includes(searchTerm)) ||
            (cert.description && cert.description.toLowerCase().includes(searchTerm));

        const matchesStatus = statusVal === "" || (statusVal === "true" ? cert.is_active : !cert.is_active);

        return matchesSearch && matchesStatus;
    });

    if (filtered.length === 0) {
        certsTableBody.innerHTML = `
            <tr>
                <td colspan="9" class="empty-state">
                    <p>No industry certifications found matching your filters.</p>
                </td>
            </tr>
        `;
        return;
    }

    certsTableBody.innerHTML = filtered.map(cert => {
        const imageElement = cert.certificate_image_url
            ? `<img src="${escapeHtml(cert.certificate_image_url)}" alt="${escapeHtml(cert.name)}" class="cert-badge-thumbnail" onerror="this.outerHTML='<div class=\\'cert-badge-thumbnail\\'>📜</div>'">`
            : `<div class="cert-badge-thumbnail">📜</div>`;

        const idTag = cert.credential_id
            ? `<span class="cert-id-tag">ID: ${escapeHtml(cert.credential_id)}</span>`
            : "";

        const verifyButton = cert.credential_url
            ? `<a href="${escapeHtml(cert.credential_url)}" target="_blank" rel="noopener noreferrer" class="verify-link">
                 Verify ↗
               </a>`
            : `<span style="color: var(--text-muted);">—</span>`;

        const featuredBadge = cert.is_featured
            ? `<span class="featured-indicator featured-yes" title="Featured on homepage">★ Featured</span>`
            : `<span class="featured-indicator featured-no">—</span>`;

        const statusBadge = cert.is_active
            ? `<span class="status-badge active"><span class="status-dot dot-active"></span>Active</span>`
            : `<span class="status-badge inactive"><span class="status-dot dot-inactive"></span>Draft</span>`;

        return `
            <tr>
                <td>
                    <div class="cert-cell">
                        ${imageElement}
                        <div class="cert-info">
                            <span class="cert-name">${escapeHtml(cert.name)}</span>
                            ${idTag}
                        </div>
                    </div>
                </td>
                <td>
                    <span class="issuer-badge">${escapeHtml(cert.issuing_organization)}</span>
                </td>
                <td>
                    <span class="date-text">${escapeHtml(cert.issue_date || "—")}</span>
                </td>
                <td>
                    <span class="date-text">${escapeHtml(cert.expiry_date || "Lifetime")}</span>
                </td>
                <td>
                    <span class="order-badge">${escapeHtml(cert.credential_id || "N/A")}</span>
                </td>
                <td>
                    ${verifyButton}
                </td>
                <td>
                    ${featuredBadge}
                </td>
                <td>
                    ${statusBadge}
                </td>
                <td class="actions-cell">
                    <button type="button" class="action-btn btn-edit" onclick="handleEditCertification(${cert.id})">
                        Edit
                    </button>
                    <button type="button" class="action-btn btn-delete" onclick="handleDeleteCertification(${cert.id}, '${escapeHtml(cert.name)}')">
                        Delete
                    </button>
                </td>
            </tr>
        `;
    }).join("");
}

// =========================================================
// MODAL CONTROLS (ADD & EDIT)
// =========================================================
function openModal(mode = "add", cert = null) {
    clearFormMessage();
    certForm.reset();

    if (badgeUploadStatus) {
        badgeUploadStatus.textContent = "Upload a digital badge (PNG, WebP, SVG, JPG)";
        badgeUploadStatus.style.color = "var(--text-muted)";
    }

    if (mode === "edit" && cert) {
        editingCertId = cert.id;
        modalTitle.textContent = "Edit Certification";
        saveCertBtn.textContent = "Update Certification";

        certName.value = cert.name || "";
        certIssuer.value = cert.issuing_organization || "";
        certIssueDate.value = cert.issue_date || "";
        certExpiryDate.value = cert.expiry_date || "";
        certId.value = cert.credential_id || "";
        certOrder.value = cert.display_order ?? 0;
        certUrl.value = cert.credential_url || "";
        certImageUrl.value = cert.certificate_image_url || "";
        certDescription.value = cert.description || "";
        certFeatured.checked = !!cert.is_featured;
        certActive.checked = !!cert.is_active;
    } else {
        editingCertId = null;
        modalTitle.textContent = "Add New Certification";
        saveCertBtn.textContent = "Save Certification";

        certOrder.value = "0";
        certFeatured.checked = false;
        certActive.checked = true;
    }

    certModal.classList.add("active");
    certModal.classList.add("show");
    certModal.style.display = "flex";
    document.body.style.overflow = "hidden";
    setTimeout(() => certName.focus(), 100);
}

function closeModal() {
    certModal.classList.remove("active");
    certModal.classList.remove("show");
    certModal.style.display = "none";
    document.body.style.overflow = "";
    editingCertId = null;
    certForm.reset();
    clearFormMessage();
}

window.handleEditCertification = function(id) {
    const cert = certifications.find(c => c.id === Number(id) || c.id === id);
    if (!cert) {
        console.error("Cert not found for id:", id);
        return;
    }
    openModal("edit", cert);
};

window.handleDeleteCertification = async function(id, name) {
    const confirmed = confirm(`Are you sure you want to permanently delete "${name}"?\nThis action cannot be undone.`);
    if (!confirmed) return;

    try {
        const res = await fetch(`${API_BASE_URL}/api/certifications/${id}`, {
            method: "DELETE",
            headers: authHeaders(false),
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.detail || "Failed to delete certification.");
        }

        showToast(`Certification "${name}" deleted successfully.`);
        fetchCertifications();
    } catch (err) {
        console.error("Delete error:", err);
        showToast(err.message || "Failed to delete certification", "error");
    }
};

// =========================================================
// BADGE FILE UPLOAD
// =========================================================
if (badgeFileInput) {
    badgeFileInput.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        if (badgeUploadStatus) {
            badgeUploadStatus.textContent = `Uploading ${file.name}...`;
            badgeUploadStatus.style.color = "var(--color-primary-blue)";
        }

        try {
            const res = await fetch(`${API_BASE_URL}/api/certifications/upload-badge`, {
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
            certImageUrl.value = data.image_url;

            if (badgeUploadStatus) {
                badgeUploadStatus.textContent = `✓ Uploaded: ${file.name}`;
                badgeUploadStatus.style.color = "var(--success)";
            }
            showToast("Badge uploaded successfully.");
        } catch (err) {
            console.error("Upload error:", err);
            if (badgeUploadStatus) {
                badgeUploadStatus.textContent = `✗ Error: ${err.message}`;
                badgeUploadStatus.style.color = "var(--danger)";
            }
            showToast(err.message, "error");
        }
    });
}

// =========================================================
// FORM SUBMIT HANDLER (CREATE / UPDATE)
// =========================================================
certForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearFormMessage();

    const nameVal = certName.value.trim();
    const issuerVal = certIssuer.value.trim();

    if (!nameVal) {
        showFormMessage("Certification title is required.");
        certName.focus();
        return;
    }

    if (!issuerVal) {
        showFormMessage("Issuing organization is required.");
        certIssuer.focus();
        return;
    }

    const payload = {
        name: nameVal,
        issuing_organization: issuerVal,
        issue_date: certIssueDate.value.trim() || null,
        expiry_date: certExpiryDate.value.trim() || null,
        credential_id: certId.value.trim() || null,
        credential_url: certUrl.value.trim() || null,
        certificate_image_url: certImageUrl.value.trim() || null,
        description: certDescription.value.trim() || null,
        display_order: parseInt(certOrder.value, 10) || 0,
        is_featured: certFeatured.checked,
        is_active: certActive.checked,
    };

    saveCertBtn.disabled = true;
    saveCertBtn.textContent = editingCertId ? "Updating..." : "Saving...";

    try {
        const url = editingCertId 
            ? `${API_BASE_URL}/api/certifications/${editingCertId}`
            : `${API_BASE_URL}/api/certifications`;

        const method = editingCertId ? "PUT" : "POST";

        const res = await fetch(url, {
            method: method,
            headers: authHeaders(true),
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.detail || "Failed to save certification.");
        }

        const savedCert = await res.json();
        showToast(
            editingCertId 
                ? `Updated "${savedCert.name}" successfully.` 
                : `Added "${savedCert.name}" successfully.`
        );

        closeModal();
        fetchCertifications();
    } catch (err) {
        console.error("Save error:", err);
        showFormMessage(err.message || "Failed to save certification.");
    } finally {
        saveCertBtn.disabled = false;
        saveCertBtn.textContent = editingCertId ? "Update Certification" : "Save Certification";
    }
});

// =========================================================
// EVENT LISTENERS & FILTERING
// =========================================================
if (openAddCertModalBtn) {
    openAddCertModalBtn.addEventListener("click", () => openModal("add"));
}

if (closeModalBtn) {
    closeModalBtn.addEventListener("click", closeModal);
}

if (cancelModalBtn) {
    cancelModalBtn.addEventListener("click", closeModal);
}

// Close on backdrop click
if (certModal) {
    certModal.addEventListener("click", (e) => {
        if (e.target === certModal) closeModal();
    });
}

// Search & Filter listeners
if (searchCertInput) {
    searchCertInput.addEventListener("input", renderCertifications);
}

if (filterStatus) {
    filterStatus.addEventListener("change", renderCertifications);
}

if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener("click", () => {
        if (searchCertInput) searchCertInput.value = "";
        if (filterStatus) filterStatus.value = "";
        renderCertifications();
    });
}

// Mobile sidebar toggle
if (mobileMenuButton && sidebar) {
    mobileMenuButton.addEventListener("click", () => {
        sidebar.classList.toggle("mobile-open");
    });
}

// Logout handler
function logout() {
    sessionStorage.removeItem("access_token");
    window.location.href = "login.html";
}

if (logoutButton) {
    logoutButton.addEventListener("click", logout);
}

// Escape key to close modal
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && (certModal?.classList.contains("show") || certModal?.classList.contains("active"))) {
        closeModal();
    }
});

// Utility to escape HTML strings
function escapeHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// =========================================================
// INITIALIZATION
// =========================================================
document.addEventListener("DOMContentLoaded", () => {
    loadAdminProfile();
    fetchCertifications();
});
