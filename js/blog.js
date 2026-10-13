/**
 * =========================================================
 * PERSONAL GLOBAL WEBSITE — ADMIN TECHNICAL BLOG CONTROLLER
 * =========================================================
 * Official 5-Color System:
 * --color-primary-dark:    #063F60 (Deep Navy)
 * --color-primary-blue:    #087DD8 (Bright Blue)
 * --color-primary-light:   #6FB7E1 (Primary Light Blue)
 * --color-secondary-light: #C4E0E1 (Soft Aqua)
 * --color-background:      #E8EEEE (Very Light Background)
 * =========================================================
 */

const API_BASE_URL = window.location.origin.startsWith("http")
    ? window.location.origin
    : "http://127.0.0.1:8000";

const token = sessionStorage.getItem("access_token") || localStorage.getItem("access_token") || localStorage.getItem("token");

// Authentication Guard
if (!token) {
    window.location.href = "login.html";
}

let blogPosts = [];
let editingBlogId = null;

// DOM Elements
const blogModal = document.getElementById("blogModal");
const deleteBlogModal = document.getElementById("deleteBlogModal");
const blogForm = document.getElementById("blogForm");
const modalTitle = document.getElementById("modalTitle");
const blogTableBody = document.getElementById("blogTableBody");

const searchBlogInput = document.getElementById("searchBlogInput");
const filterBlogCategory = document.getElementById("filterBlogCategory");
const filterBlogStatus = document.getElementById("filterBlogStatus");

const openAddBlogModalBtn = document.getElementById("openAddBlogModalBtn");
const closeBlogModalBtn = document.getElementById("closeBlogModalBtn");
const cancelBlogBtn = document.getElementById("cancelBlogBtn");
const saveBlogBtn = document.getElementById("saveBlogBtn");

const closeDeleteModalBtn = document.getElementById("closeDeleteModalBtn");
const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
const deleteArticleTitle = document.getElementById("deleteArticleTitle");
const deleteArticleId = document.getElementById("deleteArticleId");

// Form Inputs
const blogIdInput = document.getElementById("blogId");
const postTitle = document.getElementById("postTitle");
const postSlug = document.getElementById("postSlug");
const btnGenSlug = document.getElementById("btnGenSlug");
const postSubtitle = document.getElementById("postSubtitle");
const postCategory = document.getElementById("postCategory");
const postAuthor = document.getElementById("postAuthor");
const postReadingTime = document.getElementById("postReadingTime");
const postTags = document.getElementById("postTags");
const postCoverUrl = document.getElementById("postCoverUrl");
const coverDropzone = document.getElementById("coverDropzone");
const coverFileInput = document.getElementById("coverFileInput");
const coverPreview = document.getElementById("coverPreview");
const postExcerpt = document.getElementById("postExcerpt");
const postContent = document.getElementById("postContent");
const postIsPublished = document.getElementById("postIsPublished");
const postIsFeatured = document.getElementById("postIsFeatured");

// Stats Elements
const statTotalArticles = document.getElementById("statTotalArticles");
const statPublishedArticles = document.getElementById("statPublishedArticles");
const statDraftArticles = document.getElementById("statDraftArticles");
const statTotalViews = document.getElementById("statTotalViews");

// Layout Elements
const adminName = document.getElementById("adminName");
const adminAvatar = document.getElementById("adminAvatar");
const logoutButton = document.getElementById("logoutButton");
const mobileMenuButton = document.getElementById("mobileMenuButton");
const sidebar = document.getElementById("sidebar");
const toast = document.getElementById("toast");

function authHeaders(isJson = true) {
    const headers = {
        "Authorization": `Bearer ${token}`,
    };
    if (isJson) {
        headers["Content-Type"] = "application/json";
    }
    return headers;
}

function showToast(message, type = "success") {
    if (!toast) return;
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    setTimeout(() => {
        toast.className = "toast";
    }, 3200);
}

function escapeHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function slugify(text) {
    return text.toString().toLowerCase().trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

// Load Admin Profile
async function loadAdminProfile() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/me`, {
            headers: authHeaders(false),
        });
        if (!response.ok) throw new Error("Session expired");

        const data = await response.json();
        const user = data.user || data;
        const name = user.full_name || user.username || "Admin";

        if (adminName) adminName.textContent = name;
        if (adminAvatar) adminAvatar.textContent = name.charAt(0).toUpperCase();
    } catch (err) {
        console.error("Admin profile error:", err);
        logout();
    }
}

// Fetch All Blog Posts
async function fetchBlogPosts() {
    blogTableBody.innerHTML = `
        <tr class="loading-row">
            <td colspan="8">
                <div class="spinner"></div>
                <p>Loading blog articles from database...</p>
            </td>
        </tr>
    `;

    try {
        const res = await fetch(`${API_BASE_URL}/api/blog`, {
            headers: authHeaders(false),
        });

        if (!res.ok) {
            if (res.status === 401) {
                logout();
                return;
            }
            throw new Error(`Failed to load articles (Status: ${res.status})`);
        }

        blogPosts = await res.json();
        updateStats();
        populateCategoriesFilter();
        renderBlogTable();

    } catch (err) {
        console.error("Error loading blog posts:", err);
        blogTableBody.innerHTML = `
            <tr class="empty-row">
                <td colspan="8" style="color: var(--danger);">
                    ⚠️ Failed to load articles. Please verify the API server is running.
                </td>
            </tr>
        `;
        showToast("Error connecting to blog database", "error");
    }
}

// Update Overview Stats
function updateStats() {
    if (statTotalArticles) statTotalArticles.textContent = blogPosts.length;
    if (statPublishedArticles) statPublishedArticles.textContent = blogPosts.filter(p => p.is_published).length;
    if (statDraftArticles) statDraftArticles.textContent = blogPosts.filter(p => !p.is_published).length;
    if (statTotalViews) {
        const totalViews = blogPosts.reduce((acc, p) => acc + (p.views_count || 0), 0);
        statTotalViews.textContent = totalViews.toLocaleString();
    }
}

// Populate Category Filter Dropdown
function populateCategoriesFilter() {
    if (!filterBlogCategory) return;
    const currentVal = filterBlogCategory.value;
    const categories = Array.from(new Set(blogPosts.map(p => p.category).filter(Boolean))).sort();

    let options = `<option value="all">All Categories (${blogPosts.length})</option>`;
    categories.forEach(cat => {
        const count = blogPosts.filter(p => p.category === cat).length;
        options += `<option value="${escapeHtml(cat)}">${escapeHtml(cat)} (${count})</option>`;
    });

    filterBlogCategory.innerHTML = options;
    if (categories.includes(currentVal)) {
        filterBlogCategory.value = currentVal;
    }
}

// Render Blog Table Rows
function renderBlogTable() {
    const searchTerm = searchBlogInput ? searchBlogInput.value.trim().toLowerCase() : "";
    const catFilter = filterBlogCategory ? filterBlogCategory.value : "all";
    const statusFilter = filterBlogStatus ? filterBlogStatus.value : "all";

    const filtered = blogPosts.filter(p => {
        const matchesCategory = catFilter === "all" || p.category === catFilter;
        const matchesStatus = statusFilter === "all" || 
            (statusFilter === "published" && p.is_published) ||
            (statusFilter === "draft" && !p.is_published);

        const titleMatch = (p.title || "").toLowerCase().includes(searchTerm);
        const excerptMatch = (p.excerpt || "").toLowerCase().includes(searchTerm);
        const tagsMatch = (p.tags || "").toLowerCase().includes(searchTerm);
        const authorMatch = (p.author || "").toLowerCase().includes(searchTerm);

        return matchesCategory && matchesStatus && (titleMatch || excerptMatch || tagsMatch || authorMatch);
    });

    if (filtered.length === 0) {
        blogTableBody.innerHTML = `
            <tr class="empty-row">
                <td colspan="8" style="padding: 36px !important; text-align: center; color: var(--text-secondary);">
                    No technical articles found matching the current search criteria.
                </td>
            </tr>
        `;
        return;
    }

    blogTableBody.innerHTML = filtered.map(post => {
        const rawCover = post.cover_image_url;
        const fullCover = rawCover
            ? (rawCover.startsWith("http") || rawCover.startsWith("data:") ? rawCover : `${API_BASE_URL}${rawCover.startsWith("/") ? "" : "/"}${rawCover}`)
            : "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='80' viewBox='0 0 120 80' fill='%23063F60'><rect width='120' height='80'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14' fill='%23C4E0E1'>Article</text></svg>";

        const statusClass = post.is_published ? "published" : "draft";
        const statusLabel = post.is_published ? "● Published" : "○ Draft";
        const featuredStar = post.is_featured ? `<span class="featured-pill" title="Featured Article">⭐ Pinned</span>` : `<span style="color: var(--text-muted); font-size: 11px;">—</span>`;

        return `
            <tr data-id="${post.id}">
                <td>
                    <img src="${escapeHtml(fullCover)}" alt="${escapeHtml(post.title)}" class="blog-thumb" loading="lazy" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'120\\' height=\\'80\\' fill=\\'%23063F60\\'><text x=\\'50%25\\' y=\\'50%25\\' dominant-baseline=\\'middle\\' text-anchor=\\'middle\\' fill=\\'%23C4E0E1\\' font-size=\\'12\\'>Post</text></svg>'">
                </td>
                <td>
                    <div class="blog-cell-title">
                        <span class="blog-title-text">${escapeHtml(post.title)}</span>
                        <span class="blog-slug-text">/${escapeHtml(post.slug)}</span>
                    </div>
                </td>
                <td>
                    <span class="category-tag">${escapeHtml(post.category)}</span>
                </td>
                <td>
                    <span style="font-weight: 600; font-size: 13px;">⏱️ ${post.reading_time_minutes} min</span>
                </td>
                <td>
                    <span style="font-weight: 700; color: var(--color-primary-dark); font-size: 13px;">👁️ ${post.views_count.toLocaleString()}</span>
                </td>
                <td>
                    <span class="status-badge ${statusClass}">${statusLabel}</span>
                </td>
                <td>
                    ${featuredStar}
                </td>
                <td style="text-align: right;">
                    <div class="action-buttons" style="justify-content: flex-end;">
                        <button type="button" class="btn-icon" title="View Public Post" onclick="previewPost('${escapeHtml(post.slug)}')">
                            👁️
                        </button>
                        <button type="button" class="btn-icon" title="Edit Article" onclick="openEditBlogModal(${post.id})">
                            ✏️
                        </button>
                        <button type="button" class="btn-icon delete" title="Delete Article" onclick="openDeleteBlogModal(${post.id})">
                            🗑️
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}

// Modal Helpers
function openModal(modal) {
    if (!modal) return;
    modal.classList.add("active", "show");
    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
}

function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove("active", "show");
    modal.style.display = "none";
    document.body.style.overflow = "";
}

// Open Add Modal
function openAddBlogModal() {
    editingBlogId = null;
    modalTitle.textContent = "New Technical Article";
    blogForm.reset();
    blogIdInput.value = "";
    postReadingTime.value = "5";
    postAuthor.value = "Design Lyricist";
    postIsPublished.checked = true;
    postIsFeatured.checked = false;
    coverPreview.style.display = "none";
    coverPreview.src = "";
    openModal(blogModal);
    postTitle.focus();
}

// Open Edit Modal
function openEditBlogModal(id) {
    const post = blogPosts.find(p => p.id === Number(id));
    if (!post) return;

    editingBlogId = post.id;
    modalTitle.textContent = "Edit Technical Article";
    blogForm.reset();

    blogIdInput.value = post.id;
    postTitle.value = post.title || "";
    postSlug.value = post.slug || "";
    postSubtitle.value = post.subtitle || "";
    postCategory.value = post.category || "Software Engineering";
    postAuthor.value = post.author || "Design Lyricist";
    postReadingTime.value = post.reading_time_minutes || 5;
    postTags.value = post.tags || "";
    postCoverUrl.value = post.cover_image_url || "";
    postExcerpt.value = post.excerpt || "";
    postContent.value = post.content || "";
    postIsPublished.checked = Boolean(post.is_published);
    postIsFeatured.checked = Boolean(post.is_featured);

    if (post.cover_image_url) {
        const fullCover = post.cover_image_url.startsWith("http") ? post.cover_image_url : `${API_BASE_URL}${post.cover_image_url.startsWith("/") ? "" : "/"}${post.cover_image_url}`;
        coverPreview.src = fullCover;
        coverPreview.style.display = "block";
    } else {
        coverPreview.style.display = "none";
        coverPreview.src = "";
    }

    openModal(blogModal);
}

// Save Article (Create or Update)
async function handleSaveBlog(e) {
    if (e) e.preventDefault();

    const titleVal = postTitle.value.trim();
    const contentVal = postContent.value.trim();

    if (!titleVal) {
        showToast("Article title is required", "error");
        postTitle.focus();
        return;
    }
    if (!contentVal) {
        showToast("Article content is required", "error");
        postContent.focus();
        return;
    }

    let slugVal = postSlug.value.trim();
    if (!slugVal) {
        slugVal = slugify(titleVal);
    }

    const payload = {
        title: titleVal,
        slug: slugVal,
        subtitle: postSubtitle.value.trim() || null,
        category: postCategory.value.trim() || "Software Engineering",
        author: postAuthor.value.trim() || "Design Lyricist",
        reading_time_minutes: parseInt(postReadingTime.value) || 5,
        tags: postTags.value.trim() || null,
        cover_image_url: postCoverUrl.value.trim() || null,
        excerpt: postExcerpt.value.trim() || null,
        content: contentVal,
        is_published: postIsPublished.checked,
        is_featured: postIsFeatured.checked,
    };

    saveBlogBtn.disabled = true;
    saveBlogBtn.textContent = "Saving...";

    try {
        let url = `${API_BASE_URL}/api/blog`;
        let method = "POST";

        if (editingBlogId) {
            url = `${API_BASE_URL}/api/blog/${editingBlogId}`;
            method = "PUT";
        }

        const res = await fetch(url, {
            method: method,
            headers: authHeaders(true),
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.detail || "Failed to save article.");
        }

        const savedPost = await res.json();
        showToast(editingBlogId ? "Article updated successfully!" : "Article published successfully!", "success");
        closeModal(blogModal);
        await fetchBlogPosts();

    } catch (err) {
        console.error("Save error:", err);
        showToast(err.message || "Failed to save article", "error");
    } finally {
        saveBlogBtn.disabled = false;
        saveBlogBtn.textContent = "Save Article";
    }
}

// Delete Article Logic
function openDeleteBlogModal(id) {
    const post = blogPosts.find(p => p.id === Number(id));
    if (!post) return;

    deleteArticleId.value = post.id;
    deleteArticleTitle.textContent = `"${post.title}"`;
    openModal(deleteBlogModal);
}

async function handleConfirmDelete() {
    const id = deleteArticleId.value;
    if (!id) return;

    confirmDeleteBtn.disabled = true;
    confirmDeleteBtn.textContent = "Deleting...";

    try {
        const res = await fetch(`${API_BASE_URL}/api/blog/${id}`, {
            method: "DELETE",
            headers: authHeaders(false),
        });

        if (!res.ok) {
            throw new Error("Failed to delete article.");
        }

        showToast("Article deleted successfully", "success");
        closeModal(deleteBlogModal);
        await fetchBlogPosts();

    } catch (err) {
        console.error("Delete error:", err);
        showToast("Failed to delete article", "error");
    } finally {
        confirmDeleteBtn.disabled = false;
        confirmDeleteBtn.textContent = "Yes, Delete";
    }
}

// Image File Upload Handler
async function uploadCoverImage(file) {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const prevDropText = coverDropzone.innerHTML;
    coverDropzone.innerHTML = `<span>⏳ Uploading ${escapeHtml(file.name)}...</span>`;

    try {
        const res = await fetch(`${API_BASE_URL}/api/blog/upload-image`, {
            method: "POST",
            headers: authHeaders(false),
            body: formData,
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.detail || "Image upload failed");
        }

        const data = await res.json();
        postCoverUrl.value = data.image_url;
        coverPreview.src = `${API_BASE_URL}${data.image_url.startsWith("/") ? "" : "/"}${data.image_url}`;
        coverPreview.style.display = "block";
        showToast("Cover image uploaded successfully!", "success");

    } catch (err) {
        console.error("Upload error:", err);
        showToast(err.message || "Cover upload failed", "error");
    } finally {
        coverDropzone.innerHTML = prevDropText;
    }
}

// Editor Formatting Helpers
function insertFormat(tag) {
    const textarea = postContent;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.substring(start, end);

    let replacement = "";
    switch (tag) {
        case "bold":
            replacement = `<strong>${selected || "bold text"}</strong>`;
            break;
        case "italic":
            replacement = `<em>${selected || "italic text"}</em>`;
            break;
        case "h2":
            replacement = `\n<h2>${selected || "Heading 2"}</h2>\n`;
            break;
        case "h3":
            replacement = `\n<h3>${selected || "Heading 3"}</h3>\n`;
            break;
        case "code":
            replacement = `<code>${selected || "code snippet"}</code>`;
            break;
        case "codeblock":
            replacement = `\n<pre><code class="language-python">\n${selected || "# write code here"}\n</code></pre>\n`;
            break;
        case "ul":
            replacement = `\n<ul>\n  <li>${selected || "List item 1"}</li>\n  <li>List item 2</li>\n</ul>\n`;
            break;
        case "quote":
            replacement = `\n<blockquote>${selected || "Quote text..."}</blockquote>\n`;
            break;
        default:
            return;
    }

    textarea.setRangeText(replacement, start, end, "end");
    textarea.focus();
}

// Public Article Preview Link
function previewPost(slug) {
    window.open(`../index.html?article=${encodeURIComponent(slug)}#blog`, "_blank");
}

function logout() {
    sessionStorage.removeItem("access_token");
    localStorage.removeItem("access_token");
    localStorage.removeItem("token");
    window.location.href = "login.html";
}

// Window attachment for inline onclick handlers
window.openEditBlogModal = openEditBlogModal;
window.openDeleteBlogModal = openDeleteBlogModal;
window.previewPost = previewPost;

// DOM Initialization
document.addEventListener("DOMContentLoaded", () => {
    loadAdminProfile();
    fetchBlogPosts();

    // Toolbar Filters & Search
    if (searchBlogInput) searchBlogInput.addEventListener("input", renderBlogTable);
    if (filterBlogCategory) filterBlogCategory.addEventListener("change", renderBlogTable);
    if (filterBlogStatus) filterBlogStatus.addEventListener("change", renderBlogTable);

    // Modal Triggers
    if (openAddBlogModalBtn) openAddBlogModalBtn.addEventListener("click", openAddBlogModal);
    if (closeBlogModalBtn) closeBlogModalBtn.addEventListener("click", () => closeModal(blogModal));
    if (cancelBlogBtn) cancelBlogBtn.addEventListener("click", () => closeModal(blogModal));
    if (saveBlogBtn) saveBlogBtn.addEventListener("click", handleSaveBlog);

    if (closeDeleteModalBtn) closeDeleteModalBtn.addEventListener("click", () => closeModal(deleteBlogModal));
    if (cancelDeleteBtn) cancelDeleteBtn.addEventListener("click", () => closeModal(deleteBlogModal));
    if (confirmDeleteBtn) confirmDeleteBtn.addEventListener("click", handleConfirmDelete);

    // Auto-Slug generator
    if (btnGenSlug) {
        btnGenSlug.addEventListener("click", () => {
            if (postTitle.value.trim()) {
                postSlug.value = slugify(postTitle.value.trim());
            }
        });
    }

    if (postTitle) {
        postTitle.addEventListener("blur", () => {
            if (!postSlug.value.trim() && postTitle.value.trim()) {
                postSlug.value = slugify(postTitle.value.trim());
            }
        });
    }

    // Cover Dropzone File Upload
    if (coverDropzone && coverFileInput) {
        coverDropzone.addEventListener("click", () => coverFileInput.click());
        coverFileInput.addEventListener("change", (e) => {
            if (e.target.files && e.target.files[0]) {
                uploadCoverImage(e.target.files[0]);
            }
        });

        coverDropzone.addEventListener("dragover", (e) => {
            e.preventDefault();
            coverDropzone.style.borderColor = "var(--color-primary-blue)";
            coverDropzone.style.background = "#ffffff";
        });

        coverDropzone.addEventListener("dragleave", () => {
            coverDropzone.style.borderColor = "var(--border-color)";
            coverDropzone.style.background = "var(--color-background)";
        });

        coverDropzone.addEventListener("drop", (e) => {
            e.preventDefault();
            coverDropzone.style.borderColor = "var(--border-color)";
            coverDropzone.style.background = "var(--color-background)";
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                uploadCoverImage(e.dataTransfer.files[0]);
            }
        });
    }

    // Live Cover URL Preview
    if (postCoverUrl) {
        postCoverUrl.addEventListener("input", () => {
            const val = postCoverUrl.value.trim();
            if (val) {
                const fullImg = val.startsWith("http") ? val : `${API_BASE_URL}${val.startsWith("/") ? "" : "/"}${val}`;
                coverPreview.src = fullImg;
                coverPreview.style.display = "block";
            } else {
                coverPreview.style.display = "none";
            }
        });
    }

    // Formatting Toolbar Buttons
    document.querySelectorAll(".editor-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const tag = btn.dataset.tag;
            if (tag) insertFormat(tag);
        });
    });

    // Mobile Sidebar & Logout
    if (mobileMenuButton && sidebar) {
        mobileMenuButton.addEventListener("click", () => {
            sidebar.classList.toggle("open");
        });
    }

    if (logoutButton) {
        logoutButton.addEventListener("click", logout);
    }

    // Close Modals on Backdrop Click or Escape
    [blogModal, deleteBlogModal].forEach(modal => {
        if (!modal) return;
        modal.addEventListener("click", (e) => {
            if (e.target === modal) closeModal(modal);
        });
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            closeModal(blogModal);
            closeModal(deleteBlogModal);
        }
    });
});
