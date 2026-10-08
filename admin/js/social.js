/**
 * =========================================================
 * PERSONAL GLOBAL WEBSITE — ADMIN SOCIAL LINKS CONTROLLER (MIRROR)
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

// Authentication Guard
if (!token) {
    window.location.href = "login.html";
}

// Built-in Platform Presets with Official SVG Vectors
const PLATFORM_PRESETS = [
    {
        name: "GitHub",
        iconClass: "github",
        defaultUrl: "https://github.com/",
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>`
    },
    {
        name: "LinkedIn",
        iconClass: "linkedin",
        defaultUrl: "https://linkedin.com/in/",
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>`
    },
    {
        name: "X / Twitter",
        iconClass: "x-twitter",
        defaultUrl: "https://x.com/",
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`
    },
    {
        name: "Discord",
        iconClass: "discord",
        defaultUrl: "https://discord.gg/",
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>`
    },
    {
        name: "YouTube",
        iconClass: "youtube",
        defaultUrl: "https://youtube.com/@",
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`
    },
    {
        name: "Substack",
        iconClass: "substack",
        defaultUrl: "https://substack.com/@",
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24L12 18.11 22.54 24V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z"/></svg>`
    },
    {
        name: "LeetCode",
        iconClass: "leetcode",
        defaultUrl: "https://leetcode.com/u/",
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 4.815 3.626 5.86 5.86 0 0 0 1.042.012 5.918 5.918 0 0 0 3.33-1.229l3.415-2.906a1.385 1.385 0 1 0-1.782-2.122l-3.416 2.906a3.14 3.14 0 0 1-1.77.653 3.107 3.107 0 0 1-.555-.006 3.167 3.167 0 0 1-2.571-1.936 3.11 3.11 0 0 1-.186-.543 3.01 3.01 0 0 1-.033-1.258 2.87 2.87 0 0 1 .645-1.123l3.853-4.126 5.406-5.788A1.38 1.38 0 0 0 13.483 0zm2.748 7.027a1.38 1.38 0 0 0-1.378 1.38v7.054a1.38 1.38 0 1 0 2.76 0V8.407a1.38 1.38 0 0 0-1.382-1.38z"/></svg>`
    },
    {
        name: "Medium",
        iconClass: "medium",
        defaultUrl: "https://medium.com/@",
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z"/></svg>`
    },
    {
        name: "Email",
        iconClass: "email",
        defaultUrl: "mailto:admin@example.com",
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M0 3v18h24v-18h-24zm6.623 7.929l-4.623 4.714v-9.428l4.623 4.714zm1.441 1.467l3.936 4.015 3.936-4.015 6.064 6.604h-20l6.064-6.604zm9.313-1.467l4.623-4.714v9.428l-4.623-4.714zm-5.377-1.396l-9.972-7.533h19.944l-9.972 7.533z"/></svg>`
    },
    {
        name: "Telegram",
        iconClass: "telegram",
        defaultUrl: "https://t.me/",
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>`
    }
];

// Global State
let socialLinks = [];
let currentFilter = "all";
let currentSearch = "";
let pendingDeleteId = null;

// DOM Elements
const socialCardsGrid = document.getElementById("socialCardsGrid");
const emptySocialState = document.getElementById("emptySocialState");
const presetsChipsContainer = document.getElementById("presetsChipsContainer");

const statTotalLinks = document.getElementById("statTotalLinks");
const statActiveLinks = document.getElementById("statActiveLinks");
const statInactiveLinks = document.getElementById("statInactiveLinks");

const countAll = document.getElementById("countAll");
const countActive = document.getElementById("countActive");
const countInactive = document.getElementById("countInactive");

const filterBtns = document.querySelectorAll(".filter-btn");
const searchSocialInput = document.getElementById("searchSocialInput");
const openAddSocialBtn = document.getElementById("openAddSocialBtn");

// Modal Elements
const socialModal = document.getElementById("socialModal");
const closeSocialModalBtn = document.getElementById("closeSocialModalBtn");
const cancelSocialBtn = document.getElementById("cancelSocialBtn");
const saveSocialBtn = document.getElementById("saveSocialBtn");
const modalTitle = document.getElementById("modalTitle");

const socialId = document.getElementById("socialId");
const platformName = document.getElementById("platformName");
const platformUrl = document.getElementById("platformUrl");
const iconSvg = document.getElementById("iconSvg");
const svgPreviewBox = document.getElementById("svgPreviewBox");
const iconClass = document.getElementById("iconClass");
const displayOrder = document.getElementById("displayOrder");
const isActive = document.getElementById("isActive");

// Delete Modal Elements
const deleteSocialModal = document.getElementById("deleteSocialModal");
const closeDeleteModalBtn = document.getElementById("closeDeleteModalBtn");
const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
const deletePlatformName = document.getElementById("deletePlatformName");
const deleteSocialId = document.getElementById("deleteSocialId");

// Layout & Shared Elements
const adminName = document.getElementById("adminName");
const adminAvatar = document.getElementById("adminAvatar");
const logoutButton = document.getElementById("logoutButton");
const mobileMenuButton = document.getElementById("mobileMenuButton");
const sidebar = document.getElementById("sidebar");
const sidebarUnreadBadge = document.getElementById("sidebarUnreadBadge");
const toast = document.getElementById("toast");

/**
 * Toast Notification
 */
function showToast(message, isError = false) {
    if (!toast) return;
    toast.textContent = message;
    toast.className = `toast show ${isError ? "error" : ""}`;
    setTimeout(() => {
        toast.className = "toast";
    }, 3500);
}

/**
 * Escape HTML
 */
function escapeHtml(text) {
    if (!text) return "";
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * Render Presets Chips
 */
function renderPresetChips() {
    if (!presetsChipsContainer) return;
    presetsChipsContainer.innerHTML = "";

    PLATFORM_PRESETS.forEach(preset => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "preset-chip-btn";
        btn.innerHTML = `${preset.svg} <span>${preset.name}</span>`;
        btn.title = `Add ${preset.name}`;
        btn.addEventListener("click", () => {
            openAddModal(preset);
        });
        presetsChipsContainer.appendChild(btn);
    });
}

/**
 * Update SVG Preview Box
 */
function updateSvgPreview() {
    if (!svgPreviewBox) return;
    const rawSvg = iconSvg.value.trim();
    if (rawSvg && rawSvg.toLowerCase().startsWith("<svg")) {
        svgPreviewBox.innerHTML = rawSvg;
    } else {
        svgPreviewBox.innerHTML = `<span>Preview</span>`;
    }
}

/**
 * Fetch Social Links from API
 */
async function fetchSocialLinks() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/social`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (res.status === 401) {
            sessionStorage.removeItem("access_token");
            localStorage.removeItem("access_token");
            window.location.href = "login.html";
            return;
        }

        if (!res.ok) throw new Error("Failed to load social links.");

        socialLinks = await res.json();
        renderSocialCards();
    } catch (err) {
        console.error("Error fetching social links:", err);
        showToast(err.message, true);
    }
}

/**
 * Render Social Cards
 */
function renderSocialCards() {
    if (!socialCardsGrid) return;

    // Update Counts & Stats
    const total = socialLinks.length;
    const activeCount = socialLinks.filter(l => l.is_active).length;
    const inactiveCount = total - activeCount;

    if (statTotalLinks) statTotalLinks.textContent = total;
    if (statActiveLinks) statActiveLinks.textContent = activeCount;
    if (statInactiveLinks) statInactiveLinks.textContent = inactiveCount;

    if (countAll) countAll.textContent = total;
    if (countActive) countActive.textContent = activeCount;
    if (countInactive) countInactive.textContent = inactiveCount;

    // Filter & Search
    let filtered = [...socialLinks];

    if (currentFilter === "active") {
        filtered = filtered.filter(l => l.is_active);
    } else if (currentFilter === "inactive") {
        filtered = filtered.filter(l => !l.is_active);
    }

    if (currentSearch.trim()) {
        const term = currentSearch.toLowerCase().trim();
        filtered = filtered.filter(l => 
            l.platform_name.toLowerCase().includes(term) ||
            l.url.toLowerCase().includes(term)
        );
    }

    // Sort by display order
    filtered.sort((a, b) => (a.display_order || 0) - (b.display_order || 0) || a.id - b.id);

    socialCardsGrid.innerHTML = "";

    if (filtered.length === 0) {
        socialCardsGrid.style.display = "none";
        if (emptySocialState) emptySocialState.style.display = "block";
        return;
    }

    socialCardsGrid.style.display = "grid";
    if (emptySocialState) emptySocialState.style.display = "none";

    filtered.forEach((link, idx) => {
        const card = document.createElement("div");
        card.className = `social-item-card ${!link.is_active ? 'inactive-card' : ''}`;

        // Default or Custom SVG
        const iconHtml = link.icon_svg && link.icon_svg.trim().startsWith("<svg")
            ? link.icon_svg
            : `<span>🔗</span>`;

        card.innerHTML = `
            <div>
                <div class="social-card-top">
                    <div class="social-card-brand">
                        <div class="social-icon-wrapper">
                            ${iconHtml}
                        </div>
                        <div class="social-card-meta">
                            <h3>${escapeHtml(link.platform_name)}</h3>
                            <span class="social-order-badge">Order: #${link.display_order}</span>
                        </div>
                    </div>
                    <label class="switch" title="Toggle active visibility">
                        <input type="checkbox" class="card-toggle-active" data-id="${link.id}" ${link.is_active ? 'checked' : ''}>
                        <span class="slider"></span>
                    </label>
                </div>

                <div class="social-card-url-box">
                    <a href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer" class="social-card-url" title="${escapeHtml(link.url)}">
                        🔗 ${escapeHtml(link.url)}
                    </a>
                </div>
            </div>

            <div class="social-card-footer">
                <div class="order-controls">
                    <button type="button" class="btn-order btn-order-up" title="Move Up" data-id="${link.id}" ${idx === 0 ? 'disabled' : ''}>
                        ▲
                    </button>
                    <button type="button" class="btn-order btn-order-down" title="Move Down" data-id="${link.id}" ${idx === filtered.length - 1 ? 'disabled' : ''}>
                        ▼
                    </button>
                </div>

                <div class="card-actions">
                    <button type="button" class="btn-icon btn-edit" title="Edit Social Link" data-id="${link.id}">
                        ✏️
                    </button>
                    <button type="button" class="btn-icon delete btn-delete" title="Delete Social Link" data-id="${link.id}">
                        🗑️
                    </button>
                </div>
            </div>
        `;

        socialCardsGrid.appendChild(card);
    });

    // Attach Row Handlers
    socialCardsGrid.querySelectorAll(".card-toggle-active").forEach(sw => {
        sw.addEventListener("change", (e) => {
            const id = parseInt(e.target.dataset.id, 10);
            toggleActiveStatus(id);
        });
    });

    socialCardsGrid.querySelectorAll(".btn-order-up").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = parseInt(btn.dataset.id, 10);
            moveOrder(id, -1);
        });
    });

    socialCardsGrid.querySelectorAll(".btn-order-down").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = parseInt(btn.dataset.id, 10);
            moveOrder(id, 1);
        });
    });

    socialCardsGrid.querySelectorAll(".btn-edit").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = parseInt(btn.dataset.id, 10);
            openEditModal(id);
        });
    });

    socialCardsGrid.querySelectorAll(".btn-delete").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = parseInt(btn.dataset.id, 10);
            openDeleteModal(id);
        });
    });
}

/**
 * Open Modal to Add
 */
function openAddModal(preset = null) {
    socialId.value = "";
    if (preset) {
        modalTitle.textContent = `Add ${preset.name} Profile`;
        platformName.value = preset.name;
        platformUrl.value = preset.defaultUrl || "https://";
        iconSvg.value = preset.svg || "";
        iconClass.value = preset.iconClass || "";
    } else {
        modalTitle.textContent = "Add New Social Link";
        platformName.value = "";
        platformUrl.value = "https://";
        iconSvg.value = "";
        iconClass.value = "";
    }

    displayOrder.value = socialLinks.length + 1;
    isActive.checked = true;

    updateSvgPreview();
    socialModal.classList.add("active");
}

/**
 * Open Modal to Edit
 */
function openEditModal(id) {
    const link = socialLinks.find(l => l.id === id);
    if (!link) return;

    modalTitle.textContent = `Edit ${link.platform_name}`;
    socialId.value = link.id;
    platformName.value = link.platform_name;
    platformUrl.value = link.url;
    iconSvg.value = link.icon_svg || "";
    iconClass.value = link.icon_class || "";
    displayOrder.value = link.display_order || 0;
    isActive.checked = link.is_active;

    updateSvgPreview();
    socialModal.classList.add("active");
}

/**
 * Close Social Modal
 */
function closeSocialModal() {
    socialModal.classList.remove("active");
}

/**
 * Save Social Link (Create / Update)
 */
async function saveSocialLink() {
    const name = platformName.value.trim();
    const url = platformUrl.value.trim();
    const svg = iconSvg.value.trim();
    const cls = iconClass.value.trim();
    const order = parseInt(displayOrder.value, 10) || 0;
    const active = isActive.checked;

    if (!name || !url) {
        showToast("Please provide both Platform Name and URL.", true);
        return;
    }

    const payload = {
        platform_name: name,
        url: url,
        icon_svg: svg || null,
        icon_class: cls || null,
        display_order: order,
        is_active: active
    };

    const id = socialId.value;
    const isEdit = Boolean(id);

    try {
        const endpoint = isEdit ? `${API_BASE_URL}/api/social/${id}` : `${API_BASE_URL}/api/social`;
        const method = isEdit ? "PUT" : "POST";

        const res = await fetch(endpoint, {
            method: method,
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || "Failed to save social link.");
        }

        showToast(isEdit ? "Social link updated successfully." : "New social link created.");
        closeSocialModal();
        fetchSocialLinks();
    } catch (err) {
        console.error("Save social link error:", err);
        showToast(err.message, true);
    }
}

/**
 * Toggle Active Status
 */
async function toggleActiveStatus(id) {
    try {
        const res = await fetch(`${API_BASE_URL}/api/social/${id}/toggle`, {
            method: "PATCH",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!res.ok) throw new Error("Failed to toggle status.");

        const updated = await res.json();
        showToast(`${updated.platform_name} is now ${updated.is_active ? 'active' : 'hidden'}.`);

        const idx = socialLinks.findIndex(l => l.id === id);
        if (idx !== -1) {
            socialLinks[idx] = updated;
        }

        renderSocialCards();
    } catch (err) {
        console.error("Toggle error:", err);
        showToast(err.message, true);
        fetchSocialLinks();
    }
}

/**
 * Move Order (Swap with adjacent link)
 */
async function moveOrder(id, direction) {
    const sorted = [...socialLinks].sort((a, b) => (a.display_order || 0) - (b.display_order || 0) || a.id - b.id);
    const currIdx = sorted.findIndex(l => l.id === id);
    const targetIdx = currIdx + direction;

    if (targetIdx < 0 || targetIdx >= sorted.length) return;

    // Swap display order
    const curr = sorted[currIdx];
    const target = sorted[targetIdx];

    const tempOrder = curr.display_order;
    curr.display_order = target.display_order === tempOrder ? (direction > 0 ? tempOrder + 1 : tempOrder - 1) : target.display_order;
    target.display_order = tempOrder;

    const reorderPayload = {
        items: sorted.map((l, index) => ({
            id: l.id,
            display_order: index + 1
        }))
    };

    try {
        const res = await fetch(`${API_BASE_URL}/api/social/reorder`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(reorderPayload)
        });

        if (!res.ok) throw new Error("Failed to reorder links.");

        showToast("Display order updated.");
        fetchSocialLinks();
    } catch (err) {
        console.error("Reorder error:", err);
        showToast(err.message, true);
    }
}

/**
 * Open Delete Modal
 */
function openDeleteModal(id) {
    const link = socialLinks.find(l => l.id === id);
    if (!link) return;

    pendingDeleteId = id;
    deletePlatformName.textContent = link.platform_name;
    deleteSocialId.value = id;
    deleteSocialModal.classList.add("active");
}

/**
 * Close Delete Modal
 */
function closeDeleteModal() {
    deleteSocialModal.classList.remove("active");
    pendingDeleteId = null;
}

/**
 * Confirm Deletion
 */
async function confirmDelete() {
    if (!pendingDeleteId) return;

    try {
        const res = await fetch(`${API_BASE_URL}/api/social/${pendingDeleteId}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!res.ok) throw new Error("Failed to delete social link.");

        showToast("Social link permanently deleted.");
        closeDeleteModal();
        fetchSocialLinks();
    } catch (err) {
        console.error("Delete error:", err);
        showToast(err.message, true);
    }
}

/**
 * Load Sidebar Unread Badge
 */
async function loadUnreadBadge() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/messages/stats`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
            const stats = await res.json();
            if (sidebarUnreadBadge) {
                if (stats.unread > 0) {
                    sidebarUnreadBadge.textContent = stats.unread;
                    sidebarUnreadBadge.style.display = "inline-block";
                } else {
                    sidebarUnreadBadge.style.display = "none";
                }
            }
        }
    } catch {
        // Silently pass
    }
}

/**
 * Load Admin Profile
 */
async function loadAdminProfile() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
            const user = await res.json();
            if (adminName) adminName.textContent = user.username || "Admin";
            if (adminAvatar) adminAvatar.textContent = (user.username || "A").charAt(0).toUpperCase();
        }
    } catch {
        // Fallback default Admin
    }
}

/**
 * Setup Event Listeners
 */
function setupEventListeners() {
    // Filter Buttons
    filterBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            filterBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentFilter = btn.dataset.filter;
            renderSocialCards();
        });
    });

    // Search Input
    let searchTimeout = null;
    if (searchSocialInput) {
        searchSocialInput.addEventListener("input", (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                currentSearch = e.target.value;
                renderSocialCards();
            }, 250);
        });
    }

    // Modal Triggers
    if (openAddSocialBtn) openAddSocialBtn.addEventListener("click", () => openAddModal());
    if (closeSocialModalBtn) closeSocialModalBtn.addEventListener("click", closeSocialModal);
    if (cancelSocialBtn) cancelSocialBtn.addEventListener("click", closeSocialModal);
    if (saveSocialBtn) saveSocialBtn.addEventListener("click", saveSocialLink);

    // SVG Live Preview
    if (iconSvg) {
        iconSvg.addEventListener("input", updateSvgPreview);
    }

    // Delete Modal
    if (closeDeleteModalBtn) closeDeleteModalBtn.addEventListener("click", closeDeleteModal);
    if (cancelDeleteBtn) cancelDeleteBtn.addEventListener("click", closeDeleteModal);
    if (confirmDeleteBtn) confirmDeleteBtn.addEventListener("click", confirmDelete);

    // Close on Backdrop
    [socialModal, deleteSocialModal].forEach(modal => {
        if (modal) {
            modal.addEventListener("click", (e) => {
                if (e.target === modal) modal.classList.remove("active");
            });
        }
    });

    // Escape Key
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            closeSocialModal();
            closeDeleteModal();
        }
    });

    // Mobile Sidebar Toggle
    if (mobileMenuButton && sidebar) {
        mobileMenuButton.addEventListener("click", () => {
            sidebar.classList.toggle("open");
        });
    }

    // Logout Button
    if (logoutButton) {
        logoutButton.addEventListener("click", () => {
            sessionStorage.removeItem("access_token");
            localStorage.removeItem("access_token");
            localStorage.removeItem("token");
            window.location.href = "login.html";
        });
    }
}

// Initialization on DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
    setupEventListeners();
    renderPresetChips();
    loadAdminProfile();
    loadUnreadBadge();
    fetchSocialLinks();
});
