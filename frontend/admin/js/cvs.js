/**
 * Admin Curriculum Vitae (CV) Management
 * Complete CRUD logic, file upload, search, filters & public sync
 */

const API_BASE_URL = window.location.origin.startsWith("http")
    ? window.location.origin
    : "http://127.0.0.1:8000";

let cvList = [];
let deleteTargetId = null;

// Auth Check
const token = localStorage.getItem("admin_token");
if (!token) {
    window.location.href = "login.html";
}

const authHeaders = () => ({
    "Authorization": `Bearer ${localStorage.getItem("admin_token")}`,
    "Content-Type": "application/json"
});

document.addEventListener("DOMContentLoaded", () => {
    initAuthProfile();
    initMobileMenu();
    initLogout();
    loadCVs();
    initSearchAndFilters();
    initModalEvents();
    initFileUpload();
});

// User profile pill
function initAuthProfile() {
    const adminUserStr = localStorage.getItem("admin_user");
    if (adminUserStr) {
        try {
            const user = JSON.parse(adminUserStr);
            const nameEl = document.getElementById("adminName");
            const avatarEl = document.getElementById("adminAvatar");
            if (nameEl && user.full_name) nameEl.textContent = user.full_name;
            if (avatarEl && user.full_name) avatarEl.textContent = user.full_name.charAt(0).toUpperCase();
        } catch (e) {
            console.error(e);
        }
    }
}

function initMobileMenu() {
    const btn = document.getElementById("mobileMenuButton");
    const sidebar = document.getElementById("sidebar");
    if (btn && sidebar) {
        btn.addEventListener("click", () => sidebar.classList.toggle("active"));
    }
}

function initLogout() {
    const logoutBtn = document.getElementById("logoutButton");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            localStorage.removeItem("admin_token");
            localStorage.removeItem("admin_user");
            window.location.href = "login.html";
        });
    }
}

// =========================================================
// DATA FETCHING & RENDERING
// =========================================================

async function loadCVs() {
    const grid = document.getElementById("cvGrid");
    grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #64748b;">Loading tailored CVs...</div>`;

    try {
        const res = await fetch(`${API_BASE_URL}/api/cvs/`, {
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("admin_token")}`
            }
        });

        if (res.status === 401) {
            window.location.href = "login.html";
            return;
        }

        if (!res.ok) throw new Error("Failed to load CVs");

        cvList = await res.json();
        updateStats();
        populateCategoryFilter();
        renderCVs();

    } catch (err) {
        console.error(err);
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #dc2626;">Error: ${err.message}</div>`;
        showToast("Error loading CVs: " + err.message, "error");
    }
}

function updateStats() {
    document.getElementById("statTotalCvs").textContent = cvList.length;
    document.getElementById("statActiveCvs").textContent = cvList.filter(c => c.is_active).length;
    
    const cats = new Set(cvList.map(c => c.category).filter(Boolean));
    document.getElementById("statCategories").textContent = cats.size;
}

function populateCategoryFilter() {
    const catSelect = document.getElementById("categoryFilter");
    if (!catSelect) return;

    const currentVal = catSelect.value;
    const cats = Array.from(new Set(cvList.map(c => c.category).filter(Boolean))).sort();

    catSelect.innerHTML = `<option value="">All Categories</option>` +
        cats.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");

    catSelect.value = currentVal;
}

function renderCVs() {
    const grid = document.getElementById("cvGrid");
    const searchVal = document.getElementById("searchCvInput").value.trim().toLowerCase();
    const catVal = document.getElementById("categoryFilter").value;
    const statusVal = document.getElementById("statusFilter").value;

    const filtered = cvList.filter(cv => {
        if (searchVal) {
            const matchTitle = (cv.title || "").toLowerCase().includes(searchVal);
            const matchCat = (cv.category || "").toLowerCase().includes(searchVal);
            const matchTags = (cv.tags || "").toLowerCase().includes(searchVal);
            if (!matchTitle && !matchCat && !matchTags) return false;
        }
        if (catVal && cv.category !== catVal) return false;
        if (statusVal === "active" && !cv.is_active) return false;
        if (statusVal === "draft" && cv.is_active) return false;
        return true;
    });

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 50px 20px; background: #fff; border-radius: 12px; border: 1px dashed var(--color-secondary-light);">
                <div style="font-size: 36px; margin-bottom: 10px;">📄</div>
                <h3 style="color: var(--color-primary-dark); margin-bottom: 6px;">No CV Documents Found</h3>
                <p style="color: #64748b; font-size: 14px;">Try adjusting your search criteria or click "Add New CV" above to create one.</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = filtered.map(cv => {
        const fileUrl = cv.file_url.startsWith("http") ? cv.file_url : `${API_BASE_URL}${cv.file_url}`;
        const tagsArr = (cv.tags || "").split(",").map(t => t.trim()).filter(Boolean);

        return `
            <div class="admin-cv-card" data-id="${cv.id}">
                <div class="admin-cv-header">
                    <div class="admin-cv-title-wrap">
                        <div class="admin-cv-icon">${cv.icon || "💻"}</div>
                        <div>
                            <h3 class="admin-cv-title">${escapeHtml(cv.title)}</h3>
                            <span class="admin-cv-category">${escapeHtml(cv.category)}</span>
                        </div>
                    </div>
                    <span 
                        class="status-badge ${cv.is_active ? 'active' : 'draft'}" 
                        onclick="toggleCvActive(${cv.id})"
                        title="Click to toggle public visibility"
                    >
                        ${cv.is_active ? 'Active' : 'Draft'}
                    </span>
                </div>

                <div class="admin-cv-body">
                    <p class="admin-cv-desc">${escapeHtml(cv.description)}</p>
                    
                    ${tagsArr.length > 0 ? `
                        <div class="admin-cv-tags">
                            ${tagsArr.map(t => `<span class="admin-cv-tag">${escapeHtml(t)}</span>`).join("")}
                        </div>
                    ` : ''}

                    <div class="admin-cv-file-box">
                        <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 200px;">
                            📎 ${escapeHtml(cv.file_name || 'Attached PDF')}
                        </span>
                        <a href="${fileUrl}" target="_blank" rel="noopener noreferrer">View PDF &rarr;</a>
                    </div>
                </div>

                <div class="admin-cv-footer">
                    <span style="font-size: 11.5px; color: #64748b;">Order: #${cv.display_order}</span>
                    <div class="admin-cv-actions">
                        <button type="button" class="btn btn-secondary btn-sm" onclick="viewCv(${cv.id})" title="View Details">
                            👁️ View
                        </button>
                        <button type="button" class="btn btn-secondary btn-sm" onclick="editCv(${cv.id})" title="Edit CV">
                            ✏️ Edit
                        </button>
                        <button type="button" class="btn btn-danger btn-sm" onclick="openDeleteModal(${cv.id})" style="background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; padding: 5px 10px; border-radius: 6px; cursor: pointer;" title="Delete CV">
                            🗑️ Delete
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join("");
}

function initSearchAndFilters() {
    document.getElementById("searchCvInput").addEventListener("input", renderCVs);
    document.getElementById("categoryFilter").addEventListener("change", renderCVs);
    document.getElementById("statusFilter").addEventListener("change", renderCVs);
}

// =========================================================
// ADD / EDIT MODAL & FORM
// =========================================================

function initModalEvents() {
    const modal = document.getElementById("cvModal");
    const openBtn = document.getElementById("openAddCvModalBtn");
    const closeBtn = document.getElementById("closeCvModalBtn");
    const cancelBtn = document.getElementById("cancelCvModalBtn");
    const form = document.getElementById("cvForm");

    openBtn.addEventListener("click", () => openAddModal());
    closeBtn.addEventListener("click", () => closeModal());
    cancelBtn.addEventListener("click", () => closeModal());

    modal.addEventListener("click", (e) => {
        if (e.target === modal) closeModal();
    });

    form.addEventListener("submit", handleFormSubmit);

    // Delete modal events
    const deleteModal = document.getElementById("deleteModal");
    document.getElementById("closeDeleteModalBtn").addEventListener("click", () => closeDeleteModal());
    document.getElementById("cancelDeleteBtn").addEventListener("click", () => closeDeleteModal());
    document.getElementById("confirmDeleteBtn").addEventListener("click", handleConfirmDelete);
    deleteModal.addEventListener("click", (e) => {
        if (e.target === deleteModal) closeDeleteModal();
    });

    // View modal events
    const viewModal = document.getElementById("viewModal");
    document.getElementById("closeViewModalBtn").addEventListener("click", () => closeViewModal());
    document.getElementById("dismissViewModalBtn").addEventListener("click", () => closeViewModal());
    viewModal.addEventListener("click", (e) => {
        if (e.target === viewModal) closeViewModal();
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            closeModal();
            closeDeleteModal();
            closeViewModal();
        }
    });
}

function openAddModal() {
    const form = document.getElementById("cvForm");
    form.reset();
    document.getElementById("cvId").value = "";
    document.getElementById("cvModalHeading").textContent = "Add New Tailored CV";
    document.getElementById("cvIcon").value = "💻";
    document.getElementById("cvIsActive").checked = true;
    document.getElementById("cvFileUrl").value = "";
    document.getElementById("cvFileName").value = "";
    document.getElementById("dropzoneText").textContent = "Click or drag & drop to upload PDF document";

    const modal = document.getElementById("cvModal");
    modal.classList.add("active");
}

function editCv(id) {
    const cv = cvList.find(c => c.id === id);
    if (!cv) return;

    document.getElementById("cvId").value = cv.id;
    document.getElementById("cvModalHeading").textContent = "Edit Tailored CV";
    document.getElementById("cvTitle").value = cv.title || "";
    document.getElementById("cvCategory").value = cv.category || "";
    document.getElementById("cvTargetRole").value = cv.target_role || "";
    document.getElementById("cvIcon").value = cv.icon || "💻";
    document.getElementById("cvDescription").value = cv.description || "";
    document.getElementById("cvBullets").value = cv.bullets || "";
    document.getElementById("cvTags").value = cv.tags || "";
    document.getElementById("cvFileUrl").value = cv.file_url || "";
    document.getElementById("cvFileName").value = cv.file_name || "";
    document.getElementById("cvDisplayOrder").value = cv.display_order ?? 0;
    document.getElementById("cvIsActive").checked = !!cv.is_active;

    document.getElementById("dropzoneText").innerHTML = `Current: <strong>${escapeHtml(cv.file_name || 'Attached PDF')}</strong> (Click to replace)`;

    document.getElementById("cvModal").classList.add("active");
}

function closeModal() {
    document.getElementById("cvModal").classList.remove("active");
}

async function handleFormSubmit(e) {
    e.preventDefault();

    const cvId = document.getElementById("cvId").value;
    const title = document.getElementById("cvTitle").value.trim();
    const category = document.getElementById("cvCategory").value.trim();
    const targetRole = document.getElementById("cvTargetRole").value.trim();
    const icon = document.getElementById("cvIcon").value.trim() || "💻";
    const description = document.getElementById("cvDescription").value.trim();
    const bullets = document.getElementById("cvBullets").value.trim();
    const tags = document.getElementById("cvTags").value.trim();
    const fileUrl = document.getElementById("cvFileUrl").value.trim();
    const fileName = document.getElementById("cvFileName").value.trim();
    const displayOrder = parseInt(document.getElementById("cvDisplayOrder").value, 10) || 0;
    const isActive = document.getElementById("cvIsActive").checked;

    if (!fileUrl) {
        showToast("Please upload a PDF document for this CV.", "warning");
        return;
    }

    const payload = {
        title,
        category,
        target_role: targetRole || null,
        icon,
        description,
        bullets: bullets || null,
        tags: tags || null,
        file_url: fileUrl,
        file_name: fileName || "tailored_cv.pdf",
        display_order: displayOrder,
        is_active: isActive
    };

    const saveBtn = document.getElementById("saveCvBtn");
    saveBtn.disabled = true;
    saveBtn.textContent = "Saving...";

    try {
        const url = cvId ? `${API_BASE_URL}/api/cvs/${cvId}` : `${API_BASE_URL}/api/cvs/`;
        const method = cvId ? "PUT" : "POST";

        const res = await fetch(url, {
            method,
            headers: authHeaders(),
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.detail || "Failed to save CV");
        }

        closeModal();
        showToast(cvId ? "CV updated successfully!" : "New CV created successfully!", "success");
        await loadCVs();

    } catch (err) {
        console.error(err);
        showToast(err.message, "error");
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = "Save CV Document";
    }
}

// =========================================================
// FILE UPLOAD (DRAG & DROP)
// =========================================================

function initFileUpload() {
    const dropzone = document.getElementById("cvDropzone");
    const fileInput = document.getElementById("cvFileInput");
    const dropzoneText = document.getElementById("dropzoneText");

    dropzone.addEventListener("click", () => fileInput.click());

    dropzone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropzone.classList.add("drag-over");
    });

    dropzone.addEventListener("dragleave", () => {
        dropzone.classList.remove("drag-over");
    });

    dropzone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropzone.classList.remove("drag-over");
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            uploadFile(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener("change", (e) => {
        if (e.target.files && e.target.files[0]) {
            uploadFile(e.target.files[0]);
        }
    });
}

async function uploadFile(file) {
    const dropzoneText = document.getElementById("dropzoneText");
    dropzoneText.textContent = `Uploading ${file.name}...`;

    const formData = new FormData();
    formData.append("file", file);

    try {
        const res = await fetch(`${API_BASE_URL}/api/cvs/upload`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("admin_token")}`
            },
            body: formData
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.detail || "File upload failed");
        }

        const data = await res.json();
        document.getElementById("cvFileUrl").value = data.url;
        document.getElementById("cvFileName").value = data.filename;
        dropzoneText.innerHTML = `Uploaded: <strong>${escapeHtml(file.name)}</strong> (Ready to save)`;
        showToast("PDF document uploaded successfully!", "success");

    } catch (err) {
        console.error(err);
        dropzoneText.textContent = "Upload failed. Click to try again.";
        showToast("Upload error: " + err.message, "error");
    }
}

// =========================================================
// TOGGLE ACTIVE, VIEW, & DELETE
// =========================================================

async function toggleCvActive(id) {
    try {
        const res = await fetch(`${API_BASE_URL}/api/cvs/${id}/toggle`, {
            method: "PATCH",
            headers: authHeaders()
        });

        if (!res.ok) throw new Error("Could not toggle status");

        const updated = await res.json();
        const item = cvList.find(c => c.id === id);
        if (item) item.is_active = updated.is_active;

        renderCVs();
        updateStats();
        showToast(`CV is now ${updated.is_active ? 'Active' : 'Draft'}`, "success");

    } catch (err) {
        console.error(err);
        showToast(err.message, "error");
    }
}

function viewCv(id) {
    const cv = cvList.find(c => c.id === id);
    if (!cv) return;

    const modal = document.getElementById("viewModal");
    const body = document.getElementById("viewModalBody");
    const title = document.getElementById("viewModalTitle");
    const dlBtn = document.getElementById("viewModalDownloadBtn");

    title.textContent = cv.title;
    
    const fileUrl = cv.file_url.startsWith("http") ? cv.file_url : `${API_BASE_URL}${cv.file_url}`;
    dlBtn.href = fileUrl;
    dlBtn.setAttribute("download", cv.file_name || "cv.pdf");

    const bulletsArr = (cv.bullets || "").split("\n").map(b => b.trim()).filter(Boolean);
    const tagsArr = (cv.tags || "").split(",").map(t => t.trim()).filter(Boolean);

    body.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
            <div class="admin-cv-icon">${cv.icon || '💻'}</div>
            <div>
                <h4 style="margin: 0; color: var(--color-primary-dark); font-size: 16px;">${escapeHtml(cv.title)}</h4>
                <span class="admin-cv-category">${escapeHtml(cv.category)}</span>
            </div>
        </div>

        ${cv.target_role ? `
            <div style="font-size: 13px; color: var(--color-primary-blue); font-weight: 600; margin-bottom: 12px;">
                Target Position: ${escapeHtml(cv.target_role)}
            </div>
        ` : ''}

        <p style="font-size: 14px; color: #4a6572; line-height: 1.6; margin-bottom: 16px;">
            ${escapeHtml(cv.description)}
        </p>

        ${bulletsArr.length > 0 ? `
            <div style="margin-bottom: 16px;">
                <strong style="font-size: 13px; color: var(--color-primary-dark);">Tailored Focus Points:</strong>
                <ul style="margin: 6px 0 0 20px; font-size: 13px; color: #334155; line-height: 1.7;">
                    ${bulletsArr.map(b => `<li>${escapeHtml(b)}</li>`).join("")}
                </ul>
            </div>
        ` : ''}

        ${tagsArr.length > 0 ? `
            <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 18px;">
                ${tagsArr.map(t => `<span class="admin-cv-tag">${escapeHtml(t)}</span>`).join("")}
            </div>
        ` : ''}

        <div class="admin-cv-file-box">
            <span>📄 ${escapeHtml(cv.file_name)}</span>
            <a href="${fileUrl}" target="_blank" rel="noopener noreferrer">Open Document ↗</a>
        </div>
    `;

    modal.classList.add("active");
}

function closeViewModal() {
    document.getElementById("viewModal").classList.remove("active");
}

function openDeleteModal(id) {
    const cv = cvList.find(c => c.id === id);
    if (!cv) return;

    deleteTargetId = id;
    document.getElementById("deleteCvTitle").textContent = `"${cv.title}"`;
    document.getElementById("deleteModal").classList.add("active");
}

function closeDeleteModal() {
    deleteTargetId = null;
    document.getElementById("deleteModal").classList.remove("active");
}

async function handleConfirmDelete() {
    if (!deleteTargetId) return;

    const btn = document.getElementById("confirmDeleteBtn");
    btn.disabled = true;
    btn.textContent = "Deleting...";

    try {
        const res = await fetch(`${API_BASE_URL}/api/cvs/${deleteTargetId}`, {
            method: "DELETE",
            headers: authHeaders()
        });

        if (!res.ok) throw new Error("Could not delete CV document");

        closeDeleteModal();
        showToast("CV document deleted successfully", "success");
        await loadCVs();

    } catch (err) {
        console.error(err);
        showToast(err.message, "error");
    } finally {
        btn.disabled = false;
        btn.textContent = "Yes, Delete CV";
    }
}

// Toast helper
function showToast(message, type = "info") {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.style.background = type === "error" ? "#dc2626" : type === "warning" ? "#d97706" : "#087DD8";
    toast.style.color = "#ffffff";
    toast.style.padding = "10px 18px";
    toast.style.borderRadius = "8px";
    toast.style.fontSize = "13.5px";
    toast.style.fontWeight = "600";
    toast.style.boxShadow = "0 8px 24px rgba(0,0,0,0.2)";
    toast.style.transition = "opacity 0.3s ease";
    toast.textContent = message;

    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
