/**
 * =========================================================
 * PERSONAL GLOBAL WEBSITE — ADMIN CV DOCUMENTS CONTROLLER
 * =========================================================
 * Complete CRUD logic, file upload, search, filters & public sync
 * Official 5-Color Palette:
 * --color-primary-dark:    #063F60
 * --color-primary-blue:    #087DD8
 * --color-primary-light:   #6FB7E1
 * --color-secondary-light: #C4E0E1
 * --color-background:      #E8EEEE
 * =========================================================
 */

const API_BASE_URL = window.location.origin.startsWith("http")
    ? window.location.origin
    : "http://127.0.0.1:8000";

let cvList = [];
let deleteTargetId = null;

// =========================================================
// AUTHENTICATION CHECK
// =========================================================
function getAuthToken() {
    return sessionStorage.getItem("access_token") ||
           localStorage.getItem("access_token") ||
           localStorage.getItem("token") ||
           localStorage.getItem("admin_token") ||
           "";
}

const token = getAuthToken();
if (!token) {
    window.location.href = "login.html";
}

function authHeaders(isJson = true) {
    const activeToken = getAuthToken();
    const headers = {
        "Authorization": `Bearer ${activeToken}`,
    };
    if (isJson) {
        headers["Content-Type"] = "application/json";
    }
    return headers;
}

function logout() {
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("admin_user");
    localStorage.removeItem("access_token");
    localStorage.removeItem("admin_user");
    localStorage.removeItem("token");
    localStorage.removeItem("admin_token");
    window.location.href = "login.html";
}

// =========================================================
// INITIALIZATION ON DOM READY
// =========================================================
document.addEventListener("DOMContentLoaded", () => {
    loadAdminProfile();
    initMobileMenu();
    initLogout();
    loadSidebarBadge();
    loadCVs();
    initSearchAndFilters();
    initModalEvents();
    initFileUpload();
});

// Load Admin Profile
async function loadAdminProfile() {
    const adminName = document.getElementById("adminName");
    const adminAvatar = document.getElementById("adminAvatar");

    try {
        const res = await fetch(`${API_BASE_URL}/api/admin/me`, {
            headers: authHeaders(false)
        });
        if (res.ok) {
            const data = await res.json();
            const user = data.user;
            const displayName = user.full_name || user.username || "Admin";
            if (adminName) adminName.textContent = displayName;
            if (adminAvatar) adminAvatar.textContent = displayName.charAt(0).toUpperCase();
            return;
        }
    } catch (e) {
        console.warn("Could not fetch /api/admin/me:", e);
    }

    const adminUserStr = sessionStorage.getItem("admin_user") || localStorage.getItem("admin_user");
    if (adminUserStr) {
        try {
            const user = JSON.parse(adminUserStr);
            const displayName = user.full_name || user.username || "Admin";
            if (adminName) adminName.textContent = displayName;
            if (adminAvatar) adminAvatar.textContent = displayName.charAt(0).toUpperCase();
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
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            logout();
        });
    }
}

async function loadSidebarBadge() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/messages/stats`, {
            headers: authHeaders(false)
        });
        if (res.ok) {
            const stats = await res.json();
            const badge = document.getElementById("sidebarUnreadBadge");
            if (badge) {
                if (stats.unread > 0) {
                    badge.textContent = stats.unread;
                    badge.style.display = "inline-block";
                } else {
                    badge.style.display = "none";
                }
            }
        }
    } catch (e) {
        // Non-blocking
    }
}

// =========================================================
// DATA FETCHING & RENDERING
// =========================================================

async function loadCVs() {
    const grid = document.getElementById("cvGrid");
    if (!grid) return;
    grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #64748b;">Loading tailored CVs...</div>`;

    try {
        const res = await fetch(`${API_BASE_URL}/api/cvs/`, {
            headers: authHeaders(false)
        });

        if (res.status === 401) {
            logout();
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
    const totalEl = document.getElementById("statTotalCvs");
    const activeEl = document.getElementById("statActiveCvs");
    const catEl = document.getElementById("statCategories");

    if (totalEl) totalEl.textContent = cvList.length;
    if (activeEl) activeEl.textContent = cvList.filter(c => c.is_active).length;
    
    const cats = new Set(cvList.map(c => c.category).filter(Boolean));
    if (catEl) catEl.textContent = cats.size;
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
    if (!grid) return;

    const searchInput = document.getElementById("searchCvInput");
    const catSelect = document.getElementById("categoryFilter");
    const statusSelect = document.getElementById("statusFilter");

    const searchVal = searchInput ? searchInput.value.trim().toLowerCase() : "";
    const catVal = catSelect ? catSelect.value : "";
    const statusVal = statusSelect ? statusSelect.value : "";

    const filtered = cvList.filter(cv => {
        if (searchVal) {
            const matchTitle = (cv.title || "").toLowerCase().includes(searchVal);
            const matchCat = (cv.category || "").toLowerCase().includes(searchVal);
            const matchRole = (cv.target_role || "").toLowerCase().includes(searchVal);
            const matchTags = (cv.tags || "").toLowerCase().includes(searchVal);
            if (!matchTitle && !matchCat && !matchRole && !matchTags) return false;
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
        const fileUrl = cv.file_url ? (cv.file_url.startsWith("http") ? cv.file_url : `${API_BASE_URL}${cv.file_url}`) : "#";
        const tagsArr = (cv.tags || "").split(",").map(t => t.trim()).filter(Boolean);

        return `
            <div class="admin-cv-card" data-id="${cv.id}">
                <div class="admin-cv-header">
                    <div class="admin-cv-title-wrap">
                        <div class="admin-cv-icon">${cv.icon || "📄"}</div>
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
                    ${cv.target_role ? `
                        <div class="admin-cv-target-banner">
                            <span class="target-icon">🎯</span>
                            <div class="target-text">
                                <span class="target-label">Target Role Level</span>
                                <strong class="target-role-val">${escapeHtml(cv.target_role)}</strong>
                            </div>
                        </div>
                    ` : ''}

                    <p class="admin-cv-desc">${escapeHtml(cv.description)}</p>
                    
                    ${tagsArr.length > 0 ? `
                        <div class="admin-cv-tags">
                            ${tagsArr.map(t => `<span class="admin-cv-tag">${escapeHtml(t)}</span>`).join("")}
                        </div>
                    ` : ''}

                    <div class="admin-cv-file-box">
                        <div class="file-box-left">
                            <span class="file-badge-pdf">PDF</span>
                            <span class="file-name-text" title="${escapeHtml(cv.file_name || 'Attached PDF Document')}">
                                ${escapeHtml(cv.file_name || 'Attached PDF Document')}
                            </span>
                        </div>
                        <a href="${fileUrl}" target="_blank" rel="noopener noreferrer" class="file-view-link">
                            <span>View PDF</span>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                <polyline points="15 3 21 3 21 9"></polyline>
                                <line x1="10" y1="14" x2="21" y2="3"></line>
                            </svg>
                        </a>
                    </div>
                </div>

                <div class="admin-cv-footer">
                    <span class="order-badge">Order #${cv.display_order}</span>
                    <div class="admin-cv-actions">
                        <button type="button" class="cv-btn-view" onclick="viewCv(${cv.id})" title="View Details">
                            <span>👁️</span> <span>View</span>
                        </button>
                        <button type="button" class="cv-btn-edit" onclick="editCv(${cv.id})" title="Edit CV">
                            <span>✏️</span> <span>Edit</span>
                        </button>
                        <button type="button" class="cv-btn-delete" onclick="openDeleteModal(${cv.id})" title="Delete CV">
                            <span>🗑️</span> <span>Delete</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join("");
}

function initSearchAndFilters() {
    const searchInput = document.getElementById("searchCvInput");
    const catSelect = document.getElementById("categoryFilter");
    const statusSelect = document.getElementById("statusFilter");
    const clearBtn = document.getElementById("clearFiltersBtn");

    if (searchInput) searchInput.addEventListener("input", renderCVs);
    if (catSelect) catSelect.addEventListener("change", renderCVs);
    if (statusSelect) statusSelect.addEventListener("change", renderCVs);

    if (clearBtn) {
        clearBtn.addEventListener("click", () => {
            if (searchInput) searchInput.value = "";
            if (catSelect) catSelect.value = "";
            if (statusSelect) statusSelect.value = "";
            renderCVs();
        });
    }
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

    if (openBtn) openBtn.addEventListener("click", () => openAddModal());
    if (closeBtn) closeBtn.addEventListener("click", () => closeModal());
    if (cancelBtn) cancelBtn.addEventListener("click", () => closeModal());

    if (modal) {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) closeModal();
        });
    }

    if (form) form.addEventListener("submit", handleFormSubmit);

    // Delete modal events
    const deleteModal = document.getElementById("deleteModal");
    const closeDeleteBtn = document.getElementById("closeDeleteModalBtn");
    const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
    const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

    if (closeDeleteBtn) closeDeleteBtn.addEventListener("click", () => closeDeleteModal());
    if (cancelDeleteBtn) cancelDeleteBtn.addEventListener("click", () => closeDeleteModal());
    if (confirmDeleteBtn) confirmDeleteBtn.addEventListener("click", handleConfirmDelete);
    if (deleteModal) {
        deleteModal.addEventListener("click", (e) => {
            if (e.target === deleteModal) closeDeleteModal();
        });
    }

    // View modal events
    const viewModal = document.getElementById("viewModal");
    const closeViewBtn = document.getElementById("closeViewModalBtn");
    const dismissViewBtn = document.getElementById("dismissViewModalBtn");

    if (closeViewBtn) closeViewBtn.addEventListener("click", () => closeViewModal());
    if (dismissViewBtn) dismissViewBtn.addEventListener("click", () => closeViewModal());
    if (viewModal) {
        viewModal.addEventListener("click", (e) => {
            if (e.target === viewModal) closeViewModal();
        });
    }

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
    if (form) form.reset();
    document.getElementById("cvId").value = "";
    document.getElementById("cvModalHeading").textContent = "Add New Tailored CV";
    document.getElementById("cvIcon").value = "💻";
    document.getElementById("cvIsActive").checked = true;
    document.getElementById("cvFileUrl").value = "";
    document.getElementById("cvFileName").value = "";
    document.getElementById("dropzoneText").textContent = "Click or drag & drop to upload PDF document";

    const modal = document.getElementById("cvModal");
    if (modal) modal.classList.add("active");
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

    const dropzoneText = document.getElementById("dropzoneText");
    if (dropzoneText) {
        dropzoneText.innerHTML = `Current: <strong>${escapeHtml(cv.file_name || 'Attached PDF')}</strong> (Click to replace)`;
    }

    const modal = document.getElementById("cvModal");
    if (modal) modal.classList.add("active");
}

function closeModal() {
    const modal = document.getElementById("cvModal");
    if (modal) modal.classList.remove("active");
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
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = "Saving...";
    }

    try {
        const url = cvId ? `${API_BASE_URL}/api/cvs/${cvId}` : `${API_BASE_URL}/api/cvs/`;
        const method = cvId ? "PUT" : "POST";

        const res = await fetch(url, {
            method,
            headers: authHeaders(true),
            body: JSON.stringify(payload)
        });

        if (res.status === 401) {
            logout();
            return;
        }

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
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent = "Save CV Document";
        }
    }
}

// =========================================================
// FILE UPLOAD (DRAG & DROP)
// =========================================================

function initFileUpload() {
    const dropzone = document.getElementById("cvDropzone");
    const fileInput = document.getElementById("cvFileInput");

    if (!dropzone || !fileInput) return;

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
    if (dropzoneText) dropzoneText.textContent = `Uploading ${file.name}...`;

    const formData = new FormData();
    formData.append("file", file);

    try {
        const res = await fetch(`${API_BASE_URL}/api/cvs/upload`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${getAuthToken()}`
            },
            body: formData
        });

        if (res.status === 401) {
            logout();
            return;
        }

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.detail || "File upload failed");
        }

        const data = await res.json();
        document.getElementById("cvFileUrl").value = data.url;
        document.getElementById("cvFileName").value = data.filename;
        if (dropzoneText) {
            dropzoneText.innerHTML = `Uploaded: <strong>${escapeHtml(file.name)}</strong> (Ready to save)`;
        }
        showToast("PDF document uploaded successfully!", "success");

    } catch (err) {
        console.error(err);
        if (dropzoneText) dropzoneText.textContent = "Upload failed. Click to try again.";
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
            headers: authHeaders(true)
        });

        if (res.status === 401) {
            logout();
            return;
        }

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

    if (title) title.textContent = cv.title;
    
    const fileUrl = cv.file_url ? (cv.file_url.startsWith("http") ? cv.file_url : `${API_BASE_URL}${cv.file_url}`) : "#";
    if (dlBtn) {
        dlBtn.href = fileUrl;
        dlBtn.setAttribute("download", cv.file_name || "cv.pdf");
    }

    const bulletsArr = (cv.bullets || "").split("\n").map(b => b.trim()).filter(Boolean);
    const tagsArr = (cv.tags || "").split(",").map(t => t.trim()).filter(Boolean);

    if (body) {
        body.innerHTML = `
            <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 18px; padding-bottom: 16px; border-bottom: 1.5px solid var(--border-color);">
                <div class="admin-cv-icon" style="width: 52px; height: 52px; font-size: 26px;">${cv.icon || '📄'}</div>
                <div>
                    <h4 style="margin: 0; color: var(--color-primary-dark); font-size: 18px; font-weight: 800;">${escapeHtml(cv.title)}</h4>
                    <div style="display: flex; gap: 8px; align-items: center; margin-top: 5px;">
                        <span class="admin-cv-category">${escapeHtml(cv.category)}</span>
                        <span class="status-badge ${cv.is_active ? 'active' : 'draft'}">${cv.is_active ? 'Active on Site' : 'Draft / Hidden'}</span>
                    </div>
                </div>
            </div>

            ${cv.target_role ? `
                <div class="admin-cv-target-banner" style="margin-bottom: 16px;">
                    <span class="target-icon">🎯</span>
                    <div class="target-text">
                        <span class="target-label">Target Role Level</span>
                        <strong class="target-role-val">${escapeHtml(cv.target_role)}</strong>
                    </div>
                </div>
            ` : ''}

            <div style="margin-bottom: 16px;">
                <label style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: var(--color-primary-dark); display: block; margin-bottom: 6px;">Profile Summary</label>
                <p style="font-size: 14px; color: var(--text-secondary); line-height: 1.6; margin: 0; background: #fafcfe; border: 1px solid var(--border-color); padding: 12px 14px; border-radius: 9px;">
                    ${escapeHtml(cv.description)}
                </p>
            </div>

            ${bulletsArr.length > 0 ? `
                <div style="margin-bottom: 16px;">
                    <label style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: var(--color-primary-dark); display: block; margin-bottom: 6px;">Key Focus Points &amp; Competencies</label>
                    <ul style="margin: 0; padding-left: 20px; font-size: 13.5px; color: #334155; line-height: 1.8;">
                        ${bulletsArr.map(b => `<li>${escapeHtml(b)}</li>`).join("")}
                    </ul>
                </div>
            ` : ''}

            ${tagsArr.length > 0 ? `
                <div style="margin-bottom: 18px;">
                    <label style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: var(--color-primary-dark); display: block; margin-bottom: 6px;">Technologies &amp; Domain Tags</label>
                    <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                        ${tagsArr.map(t => `<span class="admin-cv-tag">${escapeHtml(t)}</span>`).join("")}
                    </div>
                </div>
            ` : ''}

            <div class="admin-cv-file-box">
                <div class="file-box-left">
                    <span class="file-badge-pdf">PDF</span>
                    <span class="file-name-text">${escapeHtml(cv.file_name || 'Attached PDF Document')}</span>
                </div>
                <a href="${fileUrl}" target="_blank" rel="noopener noreferrer" class="file-view-link">
                    <span>Open Full Document</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                        <polyline points="15 3 21 3 21 9"></polyline>
                        <line x1="10" y1="14" x2="21" y2="3"></line>
                    </svg>
                </a>
            </div>
        `;
    }

    if (modal) modal.classList.add("active");
}

function closeViewModal() {
    const modal = document.getElementById("viewModal");
    if (modal) modal.classList.remove("active");
}

function openDeleteModal(id) {
    const cv = cvList.find(c => c.id === id);
    if (!cv) return;

    deleteTargetId = id;
    const titleEl = document.getElementById("deleteCvTitle");
    if (titleEl) titleEl.textContent = `"${cv.title}"`;

    const modal = document.getElementById("deleteModal");
    if (modal) modal.classList.add("active");
}

function closeDeleteModal() {
    deleteTargetId = null;
    const modal = document.getElementById("deleteModal");
    if (modal) modal.classList.remove("active");
}

async function handleConfirmDelete() {
    if (!deleteTargetId) return;

    const btn = document.getElementById("confirmDeleteBtn");
    if (btn) {
        btn.disabled = true;
        btn.textContent = "Deleting...";
    }

    try {
        const res = await fetch(`${API_BASE_URL}/api/cvs/${deleteTargetId}`, {
            method: "DELETE",
            headers: authHeaders(true)
        });

        if (res.status === 401) {
            logout();
            return;
        }

        if (!res.ok) throw new Error("Could not delete CV document");

        closeDeleteModal();
        showToast("CV document deleted successfully", "success");
        await loadCVs();

    } catch (err) {
        console.error(err);
        showToast(err.message, "error");
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = "Yes, Delete CV";
        }
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
