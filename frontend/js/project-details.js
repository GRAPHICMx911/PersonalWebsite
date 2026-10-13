const API_BASE_URL = window.location.origin.startsWith("http")
    ? window.location.origin
    : "http://127.0.0.1:8000";

const headerContent = document.getElementById("projectHeaderContent");
const detailsContainer = document.getElementById("projectDetailsContainer");

async function loadProjectDetails() {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get("slug");
    const id = params.get("id");

    if (!slug && !id) {
        renderError("No project specified", "Please select a project from the catalog.");
        return;
    }

    try {
        const url = slug 
            ? `${API_BASE_URL}/api/projects/slug/${encodeURIComponent(slug)}` 
            : `${API_BASE_URL}/api/projects/${encodeURIComponent(id)}`;

        const response = await fetch(url);

        if (!response.ok) {
            if (response.status === 404) {
                renderError("Project Not Found", "The requested project does not exist or may have been unpublished.");
                return;
            }
            throw new Error("Failed to load project details.");
        }

        const project = await response.json();
        renderProjectView(project);

    } catch (err) {
        console.error("Project details load error:", err);
        renderError("Unable to load project", "Make sure the backend API server is operational.");
    }
}

function renderProjectView(p) {
    document.title = `${p.title} | Personal Global Website`;

    const catName = p.category ? p.category.name : "Portfolio";
    const coverUrl = p.image_url;

    headerContent.innerHTML = `
        <div class="details-meta-bar">
            <span class="badge-category">${escapeHtml(catName)}</span>
            ${p.is_featured ? `<span class="badge-featured" style="position: static;">★ Featured Project</span>` : ''}
        </div>
        <h1 class="details-title">${escapeHtml(p.title)}</h1>
        <p class="details-summary">${escapeHtml(p.short_description || "")}</p>
    `;

    const techPills = p.technologies 
        ? p.technologies.split(",").map(t => `<span class="tech-pill">${escapeHtml(t.trim())}</span>`).join("")
        : "<span style='color: var(--text-muted); font-size: 13px;'>Not specified</span>";

    const descriptionContent = p.description 
        ? escapeHtml(p.description) 
        : "<em>No extended case study has been published for this project yet.</em>";

    detailsContainer.innerHTML = `
        <div class="details-layout">
            <div class="details-main">
                ${coverUrl ? `
                    <img 
                        src="${escapeHtml(coverUrl)}" 
                        alt="${escapeHtml(p.title)}" 
                        class="details-cover"
                        onerror="this.style.display='none';"
                    >
                ` : ''}

                <div class="details-content-box">
                    <h3 style="font-size: 20px; font-weight: 800; margin-bottom: 16px;">Case Study &amp; Architecture Overview</h3>
                    <div>${descriptionContent}</div>
                </div>
            </div>

            <aside class="details-sidebar">
                <div class="sidebar-card">
                    <h4>Technologies &amp; Tools</h4>
                    <div class="tech-pills">
                        ${techPills}
                    </div>
                </div>

                <div class="sidebar-card">
                    <h4>Project Links</h4>
                    <div class="sidebar-links">
                        ${p.project_url ? `
                            <a href="${escapeHtml(p.project_url)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary" style="width: 100%;">
                                Live Application &#8599;
                            </a>
                        ` : ''}

                        ${p.github_url ? `
                            <a href="${escapeHtml(p.github_url)}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary" style="width: 100%;">
                                GitHub Repository &#8599;
                            </a>
                        ` : ''}

                        ${!p.project_url && !p.github_url ? `
                            <p style="font-size: 13px; color: var(--text-muted);">Internal or proprietary project.</p>
                        ` : ''}
                    </div>
                </div>
            </aside>
        </div>
    `;
}

function renderError(title, message) {
    headerContent.innerHTML = `
        <h1 class="details-title">${escapeHtml(title)}</h1>
        <p class="details-summary">${escapeHtml(message)}</p>
    `;
    detailsContainer.innerHTML = `
        <div class="empty-box" style="margin-bottom: 60px;">
            <a href="projects.html" class="btn btn-primary">&larr; Return to All Projects</a>
        </div>
    `;
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

document.addEventListener("DOMContentLoaded", loadProjectDetails);