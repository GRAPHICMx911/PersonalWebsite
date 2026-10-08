/**
 * =========================================================
 * PERSONAL GLOBAL WEBSITE — ADMIN INBOX & MESSAGES CONTROLLER
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

// Global State
let messages = [];
let currentFilter = "all";
let currentSearchQuery = "";
let activeMessage = null;
let pendingDeleteId = null;

// DOM Elements
const messagesTable = document.getElementById("messagesTable");
const messagesTableBody = document.getElementById("messagesTableBody");
const emptyInboxState = document.getElementById("emptyInboxState");
const emptyTitle = document.getElementById("emptyTitle");
const emptySubtitle = document.getElementById("emptySubtitle");

// Stat Elements
const statTotalCount = document.getElementById("statTotalCount");
const statUnreadCount = document.getElementById("statUnreadCount");
const statReadCount = document.getElementById("statReadCount");
const statArchivedCount = document.getElementById("statArchivedCount");

const tabCountAll = document.getElementById("tabCountAll");
const tabCountUnread = document.getElementById("tabCountUnread");
const tabCountRead = document.getElementById("tabCountRead");
const tabCountArchived = document.getElementById("tabCountArchived");

const sidebarUnreadBadge = document.getElementById("sidebarUnreadBadge");

// Tabs & Filters
const tabs = document.querySelectorAll(".inbox-tab-btn");
const statCards = document.querySelectorAll(".inbox-stat-card");
const searchMessagesInput = document.getElementById("searchMessagesInput");
const markAllReadBtn = document.getElementById("markAllReadBtn");

// Detail Modal Elements
const messageDetailModal = document.getElementById("messageDetailModal");
const closeDetailModalBtn = document.getElementById("closeDetailModalBtn");
const detailCloseBtn = document.getElementById("detailCloseBtn");
const detailSenderAvatar = document.getElementById("detailSenderAvatar");
const detailSenderName = document.getElementById("detailSenderName");
const detailSenderEmail = document.getElementById("detailSenderEmail");
const detailReceivedDate = document.getElementById("detailReceivedDate");
const detailSubject = document.getElementById("detailSubject");
const detailMessageContent = document.getElementById("detailMessageContent");
const detailClientMeta = document.getElementById("detailClientMeta");
const detailStatusBadge = document.getElementById("detailStatusBadge");
const detailReplyMailtoBtn = document.getElementById("detailReplyMailtoBtn");
const detailToggleReadBtn = document.getElementById("detailToggleReadBtn");
const detailToggleArchiveBtn = document.getElementById("detailToggleArchiveBtn");
const detailDeleteBtn = document.getElementById("detailDeleteBtn");

// Delete Modal Elements
const deleteConfirmModal = document.getElementById("deleteConfirmModal");
const closeDeleteModalBtn = document.getElementById("closeDeleteModalBtn");
const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
const deleteSenderName = document.getElementById("deleteSenderName");
const deleteMessageId = document.getElementById("deleteMessageId");

// Layout Elements
const adminName = document.getElementById("adminName");
const adminAvatar = document.getElementById("adminAvatar");
const logoutButton = document.getElementById("logoutButton");
const mobileMenuButton = document.getElementById("mobileMenuButton");
const sidebar = document.getElementById("sidebar");
const toast = document.getElementById("toast");

/**
 * Show Toast Notification
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
 * Format Date String
 */
function formatDate(dateStr) {
    if (!dateStr) return "N/A";
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
        });
    } catch {
        return dateStr;
    }
}

/**
 * Format Full Timestamp
 */
function formatFullTimestamp(dateStr) {
    if (!dateStr) return "N/A";
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    } catch {
        return dateStr;
    }
}

/**
 * Escape HTML to prevent XSS
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
 * Fetch Stats from API
 */
async function fetchStats() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/messages/stats`, {
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

        if (!res.ok) throw new Error("Failed to load message statistics");

        const stats = await res.json();

        // Update Stat Cards
        if (statTotalCount) statTotalCount.textContent = stats.total || 0;
        if (statUnreadCount) statUnreadCount.textContent = stats.unread || 0;
        if (statReadCount) statReadCount.textContent = stats.read || 0;
        if (statArchivedCount) statArchivedCount.textContent = stats.archived || 0;

        // Update Tabs
        if (tabCountAll) tabCountAll.textContent = stats.total || 0;
        if (tabCountUnread) tabCountUnread.textContent = stats.unread || 0;
        if (tabCountRead) tabCountRead.textContent = stats.read || 0;
        if (tabCountArchived) tabCountArchived.textContent = stats.archived || 0;

        // Update Sidebar Badge
        if (sidebarUnreadBadge) {
            if (stats.unread > 0) {
                sidebarUnreadBadge.textContent = stats.unread;
                sidebarUnreadBadge.style.display = "inline-block";
            } else {
                sidebarUnreadBadge.style.display = "none";
            }
        }
    } catch (err) {
        console.error("Error fetching message stats:", err);
    }
}

/**
 * Fetch Messages from API
 */
async function fetchMessages() {
    try {
        let url = `${API_BASE_URL}/api/messages?status_filter=${encodeURIComponent(currentFilter)}`;
        if (currentSearchQuery.trim()) {
            url += `&search=${encodeURIComponent(currentSearchQuery.trim())}`;
        }

        const res = await fetch(url, {
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

        if (!res.ok) throw new Error("Failed to load inquiries");

        messages = await res.json();
        renderMessages();
    } catch (err) {
        console.error("Error fetching messages:", err);
        showToast(err.message, true);
    }
}

/**
 * Render Messages Table
 */
function renderMessages() {
    if (!messagesTableBody) return;

    messagesTableBody.innerHTML = "";

    if (!messages || messages.length === 0) {
        if (messagesTable) messagesTable.style.display = "none";
        if (emptyInboxState) {
            emptyInboxState.style.display = "block";
            if (currentSearchQuery) {
                emptyTitle.textContent = "No Matching Inquiries";
                emptySubtitle.textContent = `No messages found matching "${currentSearchQuery}". Try clearing your search term.`;
            } else if (currentFilter === "unread") {
                emptyTitle.textContent = "Inbox Caught Up!";
                emptySubtitle.textContent = "Great job! There are no unread inquiries at the moment.";
            } else if (currentFilter === "archived") {
                emptyTitle.textContent = "Archive is Empty";
                emptySubtitle.textContent = "You have not archived any inquiries yet.";
            } else {
                emptyTitle.textContent = "No Messages Yet";
                emptySubtitle.textContent = "Inquiries submitted through your website contact form will appear here.";
            }
        }
        return;
    }

    if (messagesTable) messagesTable.style.display = "table";
    if (emptyInboxState) emptyInboxState.style.display = "none";

    messages.forEach(msg => {
        const tr = document.createElement("tr");
        if (!msg.is_read) {
            tr.classList.add("unread-row");
        }

        const initial = msg.name ? msg.name.trim().charAt(0).toUpperCase() : "?";
        const isReadClass = msg.is_read ? "read-dot" : "unread-dot";
        const dateDisplay = formatDate(msg.created_at);

        // Status badge
        let badgeHtml = "";
        if (msg.is_archived) {
            badgeHtml = '<span class="badge-archived">ARCHIVED</span>';
        } else if (!msg.is_read) {
            badgeHtml = '<span class="badge-unread">NEW</span>';
        } else {
            badgeHtml = '<span class="badge-read">READ</span>';
        }

        tr.innerHTML = `
            <td>
                <div class="sender-cell">
                    <span class="${isReadClass}"></span>
                    <div class="sender-avatar">${escapeHtml(initial)}</div>
                    <div class="sender-info">
                        <span class="sender-name">${escapeHtml(msg.name)}</span>
                        <span class="sender-email">${escapeHtml(msg.email)}</span>
                    </div>
                </div>
            </td>
            <td>
                <div class="message-preview-cell">
                    <span class="message-subject-text">${escapeHtml(msg.subject || "(No Subject)")}</span>
                    <span class="message-snippet-text">${escapeHtml(msg.message || "")}</span>
                </div>
            </td>
            <td>
                <span class="date-cell">${escapeHtml(dateDisplay)}</span>
            </td>
            <td>
                ${badgeHtml}
            </td>
            <td>
                <div class="action-buttons" style="justify-content: flex-end;">
                    <button type="button" class="btn-icon" title="View Message" data-action="view" data-id="${msg.id}">
                        👁️
                    </button>
                    <button type="button" class="btn-icon" title="${msg.is_read ? 'Mark as Unread' : 'Mark as Read'}" data-action="toggle-read" data-id="${msg.id}">
                        ${msg.is_read ? '✉️' : '✓'}
                    </button>
                    <button type="button" class="btn-icon" title="${msg.is_archived ? 'Restore to Inbox' : 'Archive Inquiry'}" data-action="toggle-archive" data-id="${msg.id}">
                        ${msg.is_archived ? '📂' : '📁'}
                    </button>
                    <button type="button" class="btn-icon delete" title="Delete Inquiry" data-action="delete" data-id="${msg.id}">
                        🗑️
                    </button>
                </div>
            </td>
        `;

        // Click row opens detail (unless clicked an action button)
        tr.addEventListener("click", (e) => {
            if (e.target.closest(".action-buttons")) return;
            openDetailModal(msg.id);
        });

        messagesTableBody.appendChild(tr);
    });

    // Attach row button events
    messagesTableBody.querySelectorAll(".btn-icon").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const action = btn.dataset.action;
            const id = parseInt(btn.dataset.id, 10);
            if (action === "view") {
                openDetailModal(id);
            } else if (action === "toggle-read") {
                toggleReadStatus(id);
            } else if (action === "toggle-archive") {
                toggleArchiveStatus(id);
            } else if (action === "delete") {
                openDeleteModal(id);
            }
        });
    });
}

/**
 * Open Detail Modal for a single inquiry
 */
async function openDetailModal(messageId) {
    try {
        const res = await fetch(`${API_BASE_URL}/api/messages/${messageId}?mark_as_read=true`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (res.status === 401) {
            window.location.href = "login.html";
            return;
        }

        if (!res.ok) throw new Error("Could not load message details");

        activeMessage = await res.json();

        // Update local object in messages list
        const idx = messages.findIndex(m => m.id === activeMessage.id);
        if (idx !== -1) {
            messages[idx] = activeMessage;
        }

        // Populate Modal Fields
        const initial = activeMessage.name ? activeMessage.name.trim().charAt(0).toUpperCase() : "?";
        detailSenderAvatar.textContent = initial;
        detailSenderName.textContent = activeMessage.name;
        detailSenderEmail.textContent = activeMessage.email;
        detailSenderEmail.href = `mailto:${activeMessage.email}`;
        detailReceivedDate.textContent = formatFullTimestamp(activeMessage.created_at);
        detailSubject.textContent = activeMessage.subject || "(No Subject)";
        detailMessageContent.textContent = activeMessage.message;

        const ip = activeMessage.ip_address || "Unknown IP";
        const ua = activeMessage.user_agent ? (activeMessage.user_agent.length > 50 ? activeMessage.user_agent.substring(0, 50) + "..." : activeMessage.user_agent) : "Web Browser";
        detailClientMeta.textContent = `Source: ${ip} • ${ua}`;

        // Status Badge
        if (activeMessage.is_archived) {
            detailStatusBadge.innerHTML = '<span class="badge-archived">ARCHIVED</span>';
        } else if (!activeMessage.is_read) {
            detailStatusBadge.innerHTML = '<span class="badge-unread">NEW</span>';
        } else {
            detailStatusBadge.innerHTML = '<span class="badge-read">READ</span>';
        }

        // Quick Reply Mailto URL
        const replySubject = encodeURIComponent(`Re: ${activeMessage.subject || "Your Inquiry"}`);
        const replyBody = encodeURIComponent(`\n\n--- Original Message from ${activeMessage.name} ---\n${activeMessage.message}`);
        detailReplyMailtoBtn.href = `mailto:${activeMessage.email}?subject=${replySubject}&body=${replyBody}`;

        // Buttons
        detailToggleReadBtn.textContent = activeMessage.is_read ? "Mark as Unread" : "Mark as Read";
        detailToggleArchiveBtn.textContent = activeMessage.is_archived ? "Restore to Inbox" : "Archive";

        // Show Modal
        messageDetailModal.classList.add("active");

        // Re-render table & update stats
        renderMessages();
        fetchStats();
    } catch (err) {
        console.error("Error opening message:", err);
        showToast(err.message, true);
    }
}

/**
 * Close Detail Modal
 */
function closeDetailModal() {
    messageDetailModal.classList.remove("active");
    activeMessage = null;
}

/**
 * Toggle Read / Unread
 */
async function toggleReadStatus(messageId, explicitStatus = null) {
    try {
        let url = `${API_BASE_URL}/api/messages/${messageId}/read`;
        if (explicitStatus !== null) {
            url += `?is_read=${explicitStatus}`;
        }

        const res = await fetch(url, {
            method: "PATCH",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!res.ok) throw new Error("Failed to update read status");

        const updated = await res.json();
        showToast(updated.is_read ? "Marked as read" : "Marked as unread");

        // Update list
        const idx = messages.findIndex(m => m.id === messageId);
        if (idx !== -1) {
            messages[idx] = updated;
        }

        // If detail modal is open for this message
        if (activeMessage && activeMessage.id === messageId) {
            activeMessage = updated;
            detailToggleReadBtn.textContent = updated.is_read ? "Mark as Unread" : "Mark as Read";
            detailStatusBadge.innerHTML = updated.is_archived 
                ? '<span class="badge-archived">ARCHIVED</span>' 
                : (updated.is_read ? '<span class="badge-read">READ</span>' : '<span class="badge-unread">NEW</span>');
        }

        // Re-filter if viewing specific tab
        if (currentFilter === "unread" && updated.is_read) {
            messages = messages.filter(m => m.id !== messageId);
        } else if (currentFilter === "read" && !updated.is_read) {
            messages = messages.filter(m => m.id !== messageId);
        }

        renderMessages();
        fetchStats();
    } catch (err) {
        console.error("Error toggling read status:", err);
        showToast(err.message, true);
    }
}

/**
 * Toggle Archive Status
 */
async function toggleArchiveStatus(messageId, explicitStatus = null) {
    try {
        let url = `${API_BASE_URL}/api/messages/${messageId}/archive`;
        if (explicitStatus !== null) {
            url += `?is_archived=${explicitStatus}`;
        }

        const res = await fetch(url, {
            method: "PATCH",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!res.ok) throw new Error("Failed to update archive status");

        const updated = await res.json();
        showToast(updated.is_archived ? "Message moved to archive" : "Message restored to inbox");

        // If detail modal is open for this message
        if (activeMessage && activeMessage.id === messageId) {
            activeMessage = updated;
            detailToggleArchiveBtn.textContent = updated.is_archived ? "Restore to Inbox" : "Archive";
            detailStatusBadge.innerHTML = updated.is_archived 
                ? '<span class="badge-archived">ARCHIVED</span>' 
                : (updated.is_read ? '<span class="badge-read">READ</span>' : '<span class="badge-unread">NEW</span>');
        }

        // Remove from current view if it doesn't match filter anymore
        if (currentFilter !== "all") {
            messages = messages.filter(m => m.id !== messageId);
        } else if (updated.is_archived) {
            messages = messages.filter(m => m.id !== messageId);
        }

        renderMessages();
        fetchStats();
    } catch (err) {
        console.error("Error toggling archive status:", err);
        showToast(err.message, true);
    }
}

/**
 * Mark All Inquiries as Read
 */
async function markAllAsRead() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/messages/mark-all-read`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!res.ok) throw new Error("Failed to mark all as read");

        const data = await res.json();
        showToast(data.message || "All messages marked as read");

        fetchMessages();
        fetchStats();
    } catch (err) {
        console.error("Error marking all read:", err);
        showToast(err.message, true);
    }
}

/**
 * Open Delete Modal
 */
function openDeleteModal(messageId) {
    const msg = messages.find(m => m.id === messageId) || (activeMessage && activeMessage.id === messageId ? activeMessage : null);
    if (!msg) return;

    pendingDeleteId = messageId;
    deleteSenderName.textContent = msg.name || "this sender";
    deleteMessageId.value = messageId;
    deleteConfirmModal.classList.add("active");
}

/**
 * Close Delete Modal
 */
function closeDeleteModal() {
    deleteConfirmModal.classList.remove("active");
    pendingDeleteId = null;
}

/**
 * Confirm Message Deletion
 */
async function confirmDelete() {
    if (!pendingDeleteId) return;

    try {
        const res = await fetch(`${API_BASE_URL}/api/messages/${pendingDeleteId}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!res.ok) throw new Error("Failed to delete message");

        showToast("Message permanently deleted");
        closeDeleteModal();

        // If detail modal was open for this message, close it
        if (activeMessage && activeMessage.id === pendingDeleteId) {
            closeDetailModal();
        }

        // Refresh list & stats
        fetchMessages();
        fetchStats();
    } catch (err) {
        console.error("Error deleting message:", err);
        showToast(err.message, true);
    }
}

/**
 * Set Active Tab
 */
function setActiveTab(filter) {
    currentFilter = filter;

    tabs.forEach(tab => {
        if (tab.dataset.filter === filter) {
            tab.classList.add("active");
        } else {
            tab.classList.remove("active");
        }
    });

    statCards.forEach(card => {
        if (card.dataset.filter === filter) {
            card.classList.add("active-stat");
        } else {
            card.classList.remove("active-stat");
        }
    });

    fetchMessages();
}

/**
 * Setup Event Listeners
 */
function setupEventListeners() {
    // Tab Clicks
    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            setActiveTab(tab.dataset.filter);
        });
    });

    // Stat Card Clicks
    statCards.forEach(card => {
        card.addEventListener("click", () => {
            const filter = card.dataset.filter;
            if (filter) {
                setActiveTab(filter);
            }
        });
    });

    // Mark All Read Button
    if (markAllReadBtn) {
        markAllReadBtn.addEventListener("click", markAllAsRead);
    }

    // Search Input with Debounce
    let searchTimeout = null;
    if (searchMessagesInput) {
        searchMessagesInput.addEventListener("input", (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                currentSearchQuery = e.target.value;
                fetchMessages();
            }, 300);
        });
    }

    // Detail Modal Actions
    if (closeDetailModalBtn) closeDetailModalBtn.addEventListener("click", closeDetailModal);
    if (detailCloseBtn) detailCloseBtn.addEventListener("click", closeDetailModal);

    if (detailToggleReadBtn) {
        detailToggleReadBtn.addEventListener("click", () => {
            if (activeMessage) {
                toggleReadStatus(activeMessage.id);
            }
        });
    }

    if (detailToggleArchiveBtn) {
        detailToggleArchiveBtn.addEventListener("click", () => {
            if (activeMessage) {
                toggleArchiveStatus(activeMessage.id);
            }
        });
    }

    if (detailDeleteBtn) {
        detailDeleteBtn.addEventListener("click", () => {
            if (activeMessage) {
                openDeleteModal(activeMessage.id);
            }
        });
    }

    // Delete Modal Actions
    if (closeDeleteModalBtn) closeDeleteModalBtn.addEventListener("click", closeDeleteModal);
    if (cancelDeleteBtn) cancelDeleteBtn.addEventListener("click", closeDeleteModal);
    if (confirmDeleteBtn) confirmDeleteBtn.addEventListener("click", confirmDelete);

    // Close Modals on Overlay Click
    [messageDetailModal, deleteConfirmModal].forEach(modal => {
        if (modal) {
            modal.addEventListener("click", (e) => {
                if (e.target === modal) {
                    modal.classList.remove("active");
                }
            });
        }
    });

    // Close Modals on Escape Key
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            if (deleteConfirmModal && deleteConfirmModal.classList.contains("active")) {
                closeDeleteModal();
            } else if (messageDetailModal && messageDetailModal.classList.contains("active")) {
                closeDetailModal();
            }
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

/**
 * Load Logged-in Admin Profile
 */
async function loadAdminProfile() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
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

// Initialization on DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
    setupEventListeners();
    loadAdminProfile();
    fetchStats();
    fetchMessages();
});
