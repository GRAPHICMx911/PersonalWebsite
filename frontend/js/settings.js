/**
 * =========================================================
 * PERSONAL GLOBAL WEBSITE — ADMIN SETTINGS CONTROLLER (MIRROR)
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

// DOM Elements - Navigation & Shell
const sidebar = document.getElementById("sidebar");
const mobileMenuButton = document.getElementById("mobileMenuButton");
const logoutButton = document.getElementById("logoutButton");
const adminName = document.getElementById("adminName");
const adminAvatar = document.getElementById("adminAvatar");
const sidebarUnreadBadge = document.getElementById("sidebarUnreadBadge");
const toast = document.getElementById("toast");
const statusIndicator = document.getElementById("statusIndicator");
const topSaveBtn = document.getElementById("topSaveBtn");
const bottomSaveBtn = document.getElementById("bottomSaveBtn");
const settingsForm = document.getElementById("settingsForm");

// Tab Controls
const tabButtons = document.querySelectorAll(".settings-tab-btn");
const tabPanels = document.querySelectorAll(".settings-panel");

// Form Inputs - Profile
const fullNameInput = document.getElementById("fullName");
const professionalTitleInput = document.getElementById("professionalTitle");
const bioSummaryInput = document.getElementById("bioSummary");
const contactEmailInput = document.getElementById("contactEmail");
const locationInput = document.getElementById("location");
const isHiringAvailableInput = document.getElementById("isHiringAvailable");
const availabilityBadgeTextInput = document.getElementById("availabilityBadgeText");

// Form Inputs - Hero
const heroPillTextInput = document.getElementById("heroPillText");
const heroTitlePrefixInput = document.getElementById("heroTitlePrefix");
const heroTitleHighlightInput = document.getElementById("heroTitleHighlight");
const heroDescriptionInput = document.getElementById("heroDescription");
const heroPrimaryBtnTextInput = document.getElementById("heroPrimaryBtnText");
const heroPrimaryBtnUrlInput = document.getElementById("heroPrimaryBtnUrl");
const heroSecondaryBtnTextInput = document.getElementById("heroSecondaryBtnText");
const heroSecondaryBtnUrlInput = document.getElementById("heroSecondaryBtnUrl");

// Live Preview Elements
const livePreviewPill = document.getElementById("livePreviewPill");
const livePreviewPrefix = document.getElementById("livePreviewPrefix");
const livePreviewHighlight = document.getElementById("livePreviewHighlight");
const livePreviewDesc = document.getElementById("livePreviewDesc");

// Form Inputs - Resume
const resumeDropzone = document.getElementById("resumeDropzone");
const resumeFileInput = document.getElementById("resumeFileInput");
const currentResumeFileName = document.getElementById("currentResumeFileName");
const currentResumeUrlText = document.getElementById("currentResumeUrlText");
const viewResumeLink = document.getElementById("viewResumeLink");
const resumeDownloadUrlInput = document.getElementById("resumeDownloadUrl");

// Form Inputs - SEO
const metaTitleInput = document.getElementById("metaTitle");
const metaDescriptionInput = document.getElementById("metaDescription");
const metaKeywordsInput = document.getElementById("metaKeywords");
const ogImageUrlInput = document.getElementById("ogImageUrl");

// State
let isDirty = false;
let currentSettings = null;

/**
 * Toast Notification Utility
 */
function showToast(message, isError = false) {
    if (!toast) return;
    toast.textContent = message;
    toast.className = `toast show ${isError ? "error" : "success"}`;
    setTimeout(() => {
        toast.className = "toast";
    }, 4000);
}

/**
 * Update Status Indicator Text
 */
function updateStatus(message, state = "ready") {
    if (!statusIndicator) return;
    let bulletColor = "var(--color-primary-blue)";
    if (state === "unsaved") bulletColor = "#b45309";
    if (state === "saving") bulletColor = "var(--color-primary-light)";
    if (state === "ready") bulletColor = "#15803d";
    if (state === "error") bulletColor = "#b91c1c";

    statusIndicator.innerHTML = `<span style="color: ${bulletColor}; font-weight: bold;">●</span> ${message}`;
}

/**
 * Mark Dirty State
 */
function markDirty() {
    if (!isDirty) {
        isDirty = true;
        updateStatus("Unsaved changes detected. Click 'Save All Settings' to persist.", "unsaved");
    }
}

/**
 * Tab Switching Handler
 */
function switchTab(tabId) {
    tabButtons.forEach(btn => {
        if (btn.dataset.tab === tabId) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });

    tabPanels.forEach(panel => {
        if (panel.id === `panel-${tabId}`) {
            panel.classList.add("active");
        } else {
            panel.classList.remove("active");
        }
    });
}

/**
 * Update Real-Time Hero Live Preview
 */
function updateHeroPreview() {
    if (livePreviewPill) {
        livePreviewPill.textContent = heroPillTextInput.value || "🚀 Production Ready Solutions & Engineering";
    }
    if (livePreviewPrefix) {
        livePreviewPrefix.textContent = heroTitlePrefixInput.value ? `${heroTitlePrefixInput.value} ` : "Building Scalable Systems, Robust Security & ";
    }
    if (livePreviewHighlight) {
        livePreviewHighlight.textContent = heroTitleHighlightInput.value || "Modern Digital Experiences";
    }
    if (livePreviewDesc) {
        livePreviewDesc.textContent = heroDescriptionInput.value || "Senior Full-Stack Engineer, Cybersecurity Specialist, Cloud Architect & Designer.";
    }
}

/**
 * Fetch Current Settings from API
 */
async function fetchSettings() {
    try {
        updateStatus("Loading website settings...", "saving");
        const res = await fetch(`${API_BASE_URL}/api/settings`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (res.status === 401 || res.status === 403) {
            sessionStorage.removeItem("access_token");
            localStorage.removeItem("access_token");
            localStorage.removeItem("token");
            window.location.href = "login.html";
            return;
        }

        if (!res.ok) {
            throw new Error(`Failed to load settings (HTTP ${res.status})`);
        }

        const data = await res.json();
        currentSettings = data;
        populateForm(data);
        isDirty = false;
        updateStatus("Ready. All settings synchronized with PostgreSQL.", "ready");
    } catch (err) {
        console.error("Error loading settings:", err);
        updateStatus("Error loading settings. Check server connection.", "error");
        showToast("Error loading settings: " + err.message, true);
    }
}

/**
 * Populate Form Fields with Fetched Settings
 */
function populateForm(data) {
    // Profile
    if (fullNameInput) fullNameInput.value = data.full_name || "";
    if (professionalTitleInput) professionalTitleInput.value = data.professional_title || "";
    if (bioSummaryInput) bioSummaryInput.value = data.bio_summary || "";
    if (contactEmailInput) contactEmailInput.value = data.contact_email || "";
    if (locationInput) locationInput.value = data.location || "";
    if (isHiringAvailableInput) isHiringAvailableInput.checked = Boolean(data.is_hiring_available);
    if (availabilityBadgeTextInput) availabilityBadgeTextInput.value = data.availability_badge_text || "";

    // Hero
    if (heroPillTextInput) heroPillTextInput.value = data.hero_pill_text || "";
    if (heroTitlePrefixInput) heroTitlePrefixInput.value = data.hero_title_prefix || "";
    if (heroTitleHighlightInput) heroTitleHighlightInput.value = data.hero_title_highlight || "";
    if (heroDescriptionInput) heroDescriptionInput.value = data.hero_description || "";
    if (heroPrimaryBtnTextInput) heroPrimaryBtnTextInput.value = data.hero_primary_btn_text || "";
    if (heroPrimaryBtnUrlInput) heroPrimaryBtnUrlInput.value = data.hero_primary_btn_url || "";
    if (heroSecondaryBtnTextInput) heroSecondaryBtnTextInput.value = data.hero_secondary_btn_text || "";
    if (heroSecondaryBtnUrlInput) heroSecondaryBtnUrlInput.value = data.hero_secondary_btn_url || "";

    // Resume
    if (resumeDownloadUrlInput) resumeDownloadUrlInput.value = data.resume_download_url || "";
    updateResumeUI(data.resume_download_url);

    // SEO
    if (metaTitleInput) metaTitleInput.value = data.meta_title || "";
    if (metaDescriptionInput) metaDescriptionInput.value = data.meta_description || "";
    if (metaKeywordsInput) metaKeywordsInput.value = data.meta_keywords || "";
    if (ogImageUrlInput) ogImageUrlInput.value = data.og_image_url || "";

    // Live preview
    updateHeroPreview();
}

/**
 * Update Resume Card UI Display
 */
function updateResumeUI(url) {
    if (!url) {
        if (currentResumeFileName) currentResumeFileName.textContent = "No resume uploaded yet";
        if (currentResumeUrlText) currentResumeUrlText.textContent = "Not specified";
        if (viewResumeLink) {
            viewResumeLink.removeAttribute("href");
            viewResumeLink.style.display = "none";
        }
        return;
    }

    const filename = url.split("/").pop() || "resume.pdf";
    if (currentResumeFileName) currentResumeFileName.textContent = filename;
    if (currentResumeUrlText) currentResumeUrlText.textContent = url;
    if (viewResumeLink) {
        viewResumeLink.href = url.startsWith("http") ? url : `${API_BASE_URL}${url}`;
        viewResumeLink.style.display = "inline";
    }
}

/**
 * Upload Resume File
 */
async function uploadResumeFile(file) {
    if (!file) return;

    const allowed = [".pdf", ".docx", ".doc"];
    const ext = "." + file.name.split(".").pop().toLowerCase();
    if (!allowed.includes(ext)) {
        showToast("Invalid file type. Please upload a PDF or Word document (.pdf, .docx, .doc).", true);
        return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
        updateStatus("Uploading resume file...", "saving");
        const res = await fetch(`${API_BASE_URL}/api/settings/upload-resume`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`
            },
            body: formData
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.detail || "Failed to upload resume file.");
        }

        const data = await res.json();
        if (resumeDownloadUrlInput) resumeDownloadUrlInput.value = data.url;
        if (heroSecondaryBtnUrlInput && (!heroSecondaryBtnUrlInput.value || heroSecondaryBtnUrlInput.value.includes("/uploads/documents/"))) {
            heroSecondaryBtnUrlInput.value = data.url;
        }

        updateResumeUI(data.url);
        showToast("Resume document uploaded successfully!");
        updateStatus("Resume uploaded. Click 'Save All Settings' to finalize.", "unsaved");
        isDirty = true;
    } catch (err) {
        console.error("Resume upload error:", err);
        showToast("Upload failed: " + err.message, true);
        updateStatus("Resume upload failed.", "error");
    }
}

/**
 * Save All Settings to API
 */
async function saveAllSettings() {
    // Basic validation
    if (!fullNameInput.value.trim()) {
        switchTab("profile");
        fullNameInput.focus();
        showToast("Full Legal / Professional Name is required.", true);
        return;
    }
    if (!professionalTitleInput.value.trim()) {
        switchTab("profile");
        professionalTitleInput.focus();
        showToast("Professional Title is required.", true);
        return;
    }
    if (!contactEmailInput.value.trim()) {
        switchTab("profile");
        contactEmailInput.focus();
        showToast("Primary Contact Email is required.", true);
        return;
    }
    if (!heroPillTextInput.value.trim()) {
        switchTab("hero");
        heroPillTextInput.focus();
        showToast("Hero Pill Tagline is required.", true);
        return;
    }
    if (!heroTitlePrefixInput.value.trim()) {
        switchTab("hero");
        heroTitlePrefixInput.focus();
        showToast("Hero Main Title (Prefix) is required.", true);
        return;
    }
    if (!heroTitleHighlightInput.value.trim()) {
        switchTab("hero");
        heroTitleHighlightInput.focus();
        showToast("Hero Highlighted Text is required.", true);
        return;
    }
    if (!heroDescriptionInput.value.trim()) {
        switchTab("hero");
        heroDescriptionInput.focus();
        showToast("Hero Paragraph Description is required.", true);
        return;
    }
    if (!metaTitleInput.value.trim()) {
        switchTab("seo");
        metaTitleInput.focus();
        showToast("Meta Title is required for SEO.", true);
        return;
    }
    if (!metaDescriptionInput.value.trim()) {
        switchTab("seo");
        metaDescriptionInput.focus();
        showToast("Meta Description is required for SEO.", true);
        return;
    }

    const payload = {
        full_name: fullNameInput.value.trim(),
        professional_title: professionalTitleInput.value.trim(),
        bio_summary: bioSummaryInput.value.trim(),
        contact_email: contactEmailInput.value.trim().toLowerCase(),
        location: locationInput.value.trim(),
        is_hiring_available: isHiringAvailableInput.checked,
        availability_badge_text: availabilityBadgeTextInput.value.trim(),

        hero_pill_text: heroPillTextInput.value.trim(),
        hero_title_prefix: heroTitlePrefixInput.value.trim(),
        hero_title_highlight: heroTitleHighlightInput.value.trim(),
        hero_description: heroDescriptionInput.value.trim(),
        hero_primary_btn_text: heroPrimaryBtnTextInput.value.trim(),
        hero_primary_btn_url: heroPrimaryBtnUrlInput.value.trim(),
        hero_secondary_btn_text: heroSecondaryBtnTextInput.value.trim(),
        hero_secondary_btn_url: heroSecondaryBtnUrlInput.value.trim() || resumeDownloadUrlInput.value.trim(),

        resume_download_url: resumeDownloadUrlInput.value.trim(),

        meta_title: metaTitleInput.value.trim(),
        meta_description: metaDescriptionInput.value.trim(),
        meta_keywords: metaKeywordsInput.value.trim(),
        og_image_url: ogImageUrlInput.value.trim()
    };

    // Toggle save buttons loading state
    const saveButtons = [topSaveBtn, bottomSaveBtn].filter(Boolean);
    saveButtons.forEach(btn => {
        btn.disabled = true;
        btn.innerHTML = `<span>⏳</span> Saving...`;
    });
    updateStatus("Saving settings to PostgreSQL database...", "saving");

    try {
        const res = await fetch(`${API_BASE_URL}/api/settings`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.detail || `Failed to save settings (HTTP ${res.status})`);
        }

        const updated = await res.json();
        currentSettings = updated;
        populateForm(updated);
        isDirty = false;

        showToast("Website settings saved successfully!");
        updateStatus("Ready. All settings synchronized with PostgreSQL.", "ready");
    } catch (err) {
        console.error("Save error:", err);
        showToast("Failed to save settings: " + err.message, true);
        updateStatus("Save failed: " + err.message, "error");
    } finally {
        saveButtons.forEach(btn => {
            btn.disabled = false;
            btn.innerHTML = `<span>💾</span> Save All Settings`;
        });
        if (topSaveBtn) topSaveBtn.innerHTML = `<span>💾</span> Save Changes`;
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
    // Tab switching
    tabButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            switchTab(btn.dataset.tab);
        });
    });

    // Live preview update listeners
    [heroPillTextInput, heroTitlePrefixInput, heroTitleHighlightInput, heroDescriptionInput].forEach(input => {
        if (input) {
            input.addEventListener("input", () => {
                updateHeroPreview();
                markDirty();
            });
        }
    });

    // Mark dirty on any input change
    const formInputs = settingsForm ? settingsForm.querySelectorAll("input, textarea, select") : [];
    formInputs.forEach(input => {
        input.addEventListener("change", markDirty);
        input.addEventListener("input", markDirty);
    });

    // Save buttons
    if (topSaveBtn) topSaveBtn.addEventListener("click", saveAllSettings);
    if (bottomSaveBtn) bottomSaveBtn.addEventListener("click", saveAllSettings);
    if (settingsForm) {
        settingsForm.addEventListener("submit", (e) => {
            e.preventDefault();
            saveAllSettings();
        });
    }

    // Resume Dropzone & File Input
    if (resumeDropzone && resumeFileInput) {
        resumeDropzone.addEventListener("click", () => {
            resumeFileInput.click();
        });

        resumeDropzone.addEventListener("dragover", (e) => {
            e.preventDefault();
            resumeDropzone.classList.add("dragover");
        });

        resumeDropzone.addEventListener("dragleave", () => {
            resumeDropzone.classList.remove("dragover");
        });

        resumeDropzone.addEventListener("drop", (e) => {
            e.preventDefault();
            resumeDropzone.classList.remove("dragover");
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                uploadResumeFile(e.dataTransfer.files[0]);
            }
        });

        resumeFileInput.addEventListener("change", (e) => {
            if (e.target.files && e.target.files.length > 0) {
                uploadResumeFile(e.target.files[0]);
            }
        });
    }

    if (resumeDownloadUrlInput) {
        resumeDownloadUrlInput.addEventListener("input", (e) => {
            updateResumeUI(e.target.value.trim());
            markDirty();
        });
    }

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

    // Keyboard shortcut (Ctrl+S / Cmd+S)
    document.addEventListener("keydown", (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "s") {
            e.preventDefault();
            saveAllSettings();
        }
    });

    // Warn on unsaved changes if navigating away
    window.addEventListener("beforeunload", (e) => {
        if (isDirty) {
            e.preventDefault();
            e.returnValue = "You have unsaved settings changes. Are you sure you want to leave?";
            return e.returnValue;
        }
    });
}

// Initialization on DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
    setupEventListeners();
    loadAdminProfile();
    loadUnreadBadge();
    fetchSettings();
});
