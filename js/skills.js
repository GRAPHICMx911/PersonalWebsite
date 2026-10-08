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

let skills = [];
let categories = [];
let editingSkillId = null;

// DOM Elements
const skillModal = document.getElementById("skillModal");
const skillForm = document.getElementById("skillForm");
const modalTitle = document.getElementById("modalTitle");
const skillsTableBody = document.getElementById("skillsTableBody");
const searchSkillInput = document.getElementById("searchSkillInput");
const filterCategory = document.getElementById("filterCategory");
const filterVisibility = document.getElementById("filterVisibility");
const clearFiltersBtn = document.getElementById("clearFiltersBtn");
const openAddSkillModalBtn = document.getElementById("openAddSkillModalBtn");
const closeModalBtn = document.getElementById("closeModalBtn");
const cancelModalBtn = document.getElementById("cancelModalBtn");
const formMessage = document.getElementById("formMessage");
const toastNotification = document.getElementById("toastNotification");

// Modal Form Inputs
const skillName = document.getElementById("skillName");
const skillCategory = document.getElementById("skillCategory");
const skillIcon = document.getElementById("skillIcon");
const skillProficiency = document.getElementById("skillProficiency");
const proficiencyDisplay = document.getElementById("proficiencyDisplay");
const skillLevel = document.getElementById("skillLevel");
const skillOrder = document.getElementById("skillOrder");
const skillDescription = document.getElementById("skillDescription");
const skillFeatured = document.getElementById("skillFeatured");
const skillVisible = document.getElementById("skillVisible");
const saveSkillBtn = document.getElementById("saveSkillBtn");

// Header elements
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
// DISPLAY FORM MESSAGES
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
// FETCH CATEGORIES
// =========================================================
async function fetchCategories() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/skills/categories`);
        if (!res.ok) throw new Error("Could not load categories");
        categories = await res.json();

        // Populate filter
        if (filterCategory) {
            filterCategory.innerHTML = '<option value="">All Categories</option>' + 
                categories.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join("");
        }

        // Populate modal select
        if (skillCategory) {
            skillCategory.innerHTML = '<option value="">Select Category</option>' + 
                categories.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join("");
        }
    } catch (err) {
        console.error("Error fetching categories:", err);
    }
}

// =========================================================
// FETCH SKILLS
// =========================================================
async function fetchSkills() {
    skillsTableBody.innerHTML = `
        <tr>
            <td colspan="8" class="loading-cell">Loading skills data...</td>
        </tr>
    `;

    try {
        const res = await fetch(`${API_BASE_URL}/api/skills`, {
            headers: authHeaders(false),
        });

        if (!res.ok) {
            if (res.status === 401 || res.status === 403) {
                logout();
                return;
            }
            throw new Error("Failed to fetch skills");
        }

        skills = await res.json();
        renderSkillsTable();
    } catch (err) {
        console.error("Fetch skills error:", err);
        skillsTableBody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-cell">Error loading skills. Please refresh the page.</td>
            </tr>
        `;
    }
}

// =========================================================
// RENDER SKILLS TABLE
// =========================================================
function renderSkillsTable() {
    const searchTerm = (searchSkillInput?.value || "").trim().toLowerCase();
    const catFilter = filterCategory?.value || "";
    const visFilter = filterVisibility?.value || "";

    const filtered = skills.filter(s => {
        const matchName = (s.name || "").toLowerCase().includes(searchTerm) || 
                          (s.description || "").toLowerCase().includes(searchTerm);
        const matchCat = !catFilter || String(s.category_id) === String(catFilter);
        const matchVis = !visFilter || String(s.is_visible) === String(visFilter);

        return matchName && matchCat && matchVis;
    });

    if (filtered.length === 0) {
        skillsTableBody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-cell">No skills found matching your filters.</td>
            </tr>
        `;
        return;
    }

    skillsTableBody.innerHTML = filtered.map(s => {
        const categoryName = s.category ? s.category.name : "Uncategorized";
        const iconChar = s.icon || "⚡";
        const levelClass = (s.proficiency_level || "").toLowerCase();

        return `
            <tr>
                <td>
                    <div class="skill-cell">
                        <div class="skill-icon-badge">${escapeHtml(iconChar)}</div>
                        <div class="skill-info">
                            <span class="skill-name">${escapeHtml(s.name)}</span>
                            ${s.description ? `<span class="skill-description">${escapeHtml(s.description)}</span>` : ""}
                        </div>
                    </div>
                </td>
                <td>
                    <span class="badge-category">${escapeHtml(categoryName)}</span>
                </td>
                <td>
                    <div class="proficiency-meter">
                        <div class="meter-track">
                            <div class="meter-fill" style="width: ${s.proficiency}%;"></div>
                        </div>
                        <span class="proficiency-value">${s.proficiency}%</span>
                    </div>
                </td>
                <td>
                    <span class="badge-level ${levelClass}">${escapeHtml(s.proficiency_level || "Advanced")}</span>
                </td>
                <td>
                    <span class="order-badge">${s.display_order}</span>
                </td>
                <td>
                    <span class="featured-indicator ${s.is_featured ? 'featured-yes' : 'featured-no'}">
                        ${s.is_featured ? '★ Yes' : '☆ No'}
                    </span>
                </td>
                <td>
                    <span class="status-badge ${s.is_visible ? 'visible' : 'hidden'}">
                        ${s.is_visible ? '● Visible' : '○ Hidden'}
                    </span>
                </td>
                <td class="actions-cell">
                    <button type="button" class="action-btn btn-edit" onclick="openEditSkillModal(${s.id})">Edit</button>
                    <button type="button" class="action-btn btn-delete" onclick="deleteSkill(${s.id}, '${escapeHtml(s.name)}')">Delete</button>
                </td>
            </tr>
        `;
    }).join("");
}

// =========================================================
// MODAL CONTROLS
// =========================================================
function openAddModal() {
    editingSkillId = null;
    modalTitle.textContent = "Add New Skill";
    skillForm.reset();
    clearFormMessage();

    skillProficiency.value = 85;
    proficiencyDisplay.textContent = "85%";
    skillLevel.value = "Advanced";
    skillOrder.value = 0;
    skillFeatured.checked = false;
    skillVisible.checked = true;

    skillModal.classList.add("active");
    setTimeout(() => skillName.focus(), 50);
}

window.openEditSkillModal = function(id) {
    const skill = skills.find(s => s.id === id);
    if (!skill) return;

    editingSkillId = id;
    modalTitle.textContent = "Edit Skill";
    clearFormMessage();

    skillName.value = skill.name || "";
    skillCategory.value = skill.category_id || "";
    skillIcon.value = skill.icon || "";
    skillProficiency.value = skill.proficiency || 80;
    proficiencyDisplay.textContent = `${skill.proficiency || 80}%`;
    skillLevel.value = skill.proficiency_level || "Advanced";
    skillOrder.value = skill.display_order || 0;
    skillDescription.value = skill.description || "";
    skillFeatured.checked = Boolean(skill.is_featured);
    skillVisible.checked = Boolean(skill.is_visible);

    skillModal.classList.add("active");
    setTimeout(() => skillName.focus(), 50);
};

function closeModal() {
    skillModal.classList.remove("active");
    editingSkillId = null;
    clearFormMessage();
}

// Slider live display update
if (skillProficiency) {
    skillProficiency.addEventListener("input", (e) => {
        proficiencyDisplay.textContent = `${e.target.value}%`;
    });
}

// =========================================================
// FORM SUBMISSION (CREATE & UPDATE)
// =========================================================
skillForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearFormMessage();

    const nameVal = skillName.value.trim();
    const catId = skillCategory.value ? parseInt(skillCategory.value, 10) : null;
    const prof = parseInt(skillProficiency.value, 10);
    const lvl = skillLevel.value;
    const iconVal = skillIcon.value.trim();
    const orderVal = parseInt(skillOrder.value, 10) || 0;
    const descVal = skillDescription.value.trim();
    const isFeat = skillFeatured.checked;
    const isVis = skillVisible.checked;

    if (!nameVal) {
        showFormMessage("Skill name is required.");
        return;
    }

    if (!catId) {
        showFormMessage("Please select a discipline/category.");
        return;
    }

    const payload = {
        name: nameVal,
        category_id: catId,
        proficiency: prof,
        proficiency_level: lvl,
        icon: iconVal || null,
        description: descVal || null,
        display_order: orderVal,
        is_featured: isFeat,
        is_visible: isVis,
    };

    saveSkillBtn.disabled = true;
    saveSkillBtn.textContent = "Saving...";

    try {
        const url = editingSkillId 
            ? `${API_BASE_URL}/api/skills/${editingSkillId}`
            : `${API_BASE_URL}/api/skills`;

        const method = editingSkillId ? "PUT" : "POST";

        const res = await fetch(url, {
            method: method,
            headers: authHeaders(true),
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.detail || "Could not save skill.");
        }

        const saved = await res.json();
        showToast(editingSkillId ? "Skill updated successfully!" : "Skill created successfully!");
        closeModal();
        await fetchSkills();

    } catch (err) {
        console.error("Save skill error:", err);
        showFormMessage(err.message || "An unexpected error occurred.");
    } finally {
        saveSkillBtn.disabled = false;
        saveSkillBtn.textContent = "Save Skill";
    }
});

// =========================================================
// DELETE SKILL
// =========================================================
window.deleteSkill = async function(id, name) {
    const confirmed = confirm(`Are you sure you want to permanently delete '${name}'?`);
    if (!confirmed) return;

    try {
        const res = await fetch(`${API_BASE_URL}/api/skills/${id}`, {
            method: "DELETE",
            headers: authHeaders(false),
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.detail || "Failed to delete skill.");
        }

        showToast(`Skill '${name}' deleted.`);
        await fetchSkills();
    } catch (err) {
        console.error("Delete error:", err);
        alert(err.message || "Error deleting skill.");
    }
};

// =========================================================
// LOGOUT
// =========================================================
function logout() {
    sessionStorage.removeItem("access_token");
    window.location.href = "login.html";
}

if (logoutButton) {
    logoutButton.addEventListener("click", logout);
}

// Mobile sidebar toggle
if (mobileMenuButton && sidebar) {
    mobileMenuButton.addEventListener("click", () => {
        sidebar.classList.toggle("open");
    });
}

// Modal open/close bindings
if (openAddSkillModalBtn) openAddSkillModalBtn.addEventListener("click", openAddModal);
if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);
if (cancelModalBtn) cancelModalBtn.addEventListener("click", closeModal);

// Close modal when clicking backdrop
if (skillModal) {
    skillModal.addEventListener("click", (e) => {
        if (e.target === skillModal) closeModal();
    });
}

// Escape key to close modal
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && skillModal?.classList.contains("active")) {
        closeModal();
    }
});

// Live filter events
if (searchSkillInput) searchSkillInput.addEventListener("input", renderSkillsTable);
if (filterCategory) filterCategory.addEventListener("change", renderSkillsTable);
if (filterVisibility) filterVisibility.addEventListener("change", renderSkillsTable);

if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener("click", () => {
        if (searchSkillInput) searchSkillInput.value = "";
        if (filterCategory) filterCategory.value = "";
        if (filterVisibility) filterVisibility.value = "";
        renderSkillsTable();
    });
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

// Initial load
document.addEventListener("DOMContentLoaded", async () => {
    await loadAdminProfile();
    await fetchCategories();
    await fetchSkills();
});
