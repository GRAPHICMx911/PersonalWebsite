const API_BASE_URL = window.location.origin.startsWith("http")
    ? window.location.origin
    : "http://127.0.0.1:8000";

let staticDataCache = null;
async function getStaticSiteData() {
    if (staticDataCache) return staticDataCache;
    try {
        const res = await fetch("data/site_data.json");
        if (res.ok) {
            staticDataCache = await res.json();
            return staticDataCache;
        }
    } catch (e) {
        try {
            const res2 = await fetch("../data/site_data.json");
            if (res2.ok) {
                staticDataCache = await res2.json();
                return staticDataCache;
            }
        } catch (e2) {}
    }
    return null;
}

function resolveAssetUrl(url) {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    if (url.startsWith("/")) return url.slice(1);
    return url;
}

let publishedProjects = [];
let categoriesList = [];
let activeCategoryFilter = "all";

// DOM Elements
const projectsGrid = document.getElementById("projectsGrid");
const filterTabs = document.getElementById("filterTabs");
const searchInput = document.getElementById("searchProjectsInput");

// =========================================================
// FETCH PUBLISHED PROJECTS & CATEGORIES
// =========================================================
async function initializeProjects() {
    if (!projectsGrid) return;

    projectsGrid.innerHTML = `
        <div class="loading-box">
            <div class="loading-spinner"></div>
            <p>Loading projects from database...</p>
        </div>
    `;

    try {
        const [projRes, catRes] = await Promise.all([
            fetch(`${API_BASE_URL}/api/projects/published`),
            fetch(`${API_BASE_URL}/api/projects/categories`)
        ]);

        if (projRes.ok) {
            publishedProjects = await projRes.json();
            categoriesList = catRes.ok ? await catRes.json() : [];
            renderCategoryTabs();
            renderProjects();
            return;
        }
    } catch (err) {
        console.warn("Public projects API fetch failed, trying static site data:", err);
    }

    // Static fallback for GitHub Pages & offline mode
    const staticData = await getStaticSiteData();
    if (staticData && Array.isArray(staticData.projects) && staticData.projects.length > 0) {
        publishedProjects = staticData.projects;
        categoriesList = staticData.project_categories || [];
        renderCategoryTabs();
        renderProjects();
        return;
    }

    projectsGrid.innerHTML = `
        <div class="empty-box">
            <h3>Featured Projects</h3>
            <p>Showcase projects will be loaded shortly.</p>
        </div>
    `;
}

// =========================================================
// RENDER CATEGORY FILTER TABS
// =========================================================
function renderCategoryTabs() {
    if (!filterTabs) return;

    let tabsHtml = `
        <button type="button" class="tab-btn ${activeCategoryFilter === 'all' ? 'active' : ''}" data-cat="all">
            All Projects (${publishedProjects.length})
        </button>
    `;

    categoriesList.forEach(cat => {
        const count = publishedProjects.filter(p => p.category_id === cat.id).length;
        if (count > 0) {
            tabsHtml += `
                <button type="button" class="tab-btn ${activeCategoryFilter === String(cat.id) ? 'active' : ''}" data-cat="${cat.id}">
                    ${escapeHtml(cat.name)} (${count})
                </button>
            `;
        }
    });

    filterTabs.innerHTML = tabsHtml;

    filterTabs.querySelectorAll(".tab-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            filterTabs.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            activeCategoryFilter = btn.dataset.cat;
            renderProjects();
        });
    });
}

// =========================================================
// RENDER PROJECT CARDS
// =========================================================
function renderProjects() {
    if (!projectsGrid) return;

    const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : "";

    const filtered = publishedProjects.filter(p => {
        const matchesCategory = activeCategoryFilter === "all" || String(p.category_id) === String(activeCategoryFilter);

        const titleMatch = (p.title || "").toLowerCase().includes(searchTerm);
        const descMatch = (p.short_description || "").toLowerCase().includes(searchTerm);
        const techMatch = (p.technologies || "").toLowerCase().includes(searchTerm);
        const matchesSearch = !searchTerm || titleMatch || descMatch || techMatch;

        return matchesCategory && matchesSearch;
    });

    if (filtered.length === 0) {
        projectsGrid.innerHTML = `
            <div class="empty-box">
                <h3>No projects found</h3>
                <p>No published projects match the current filter criteria.</p>
            </div>
        `;
        return;
    }

    projectsGrid.innerHTML = filtered.map(p => {
        const cat = categoriesList.find(c => c.id === p.category_id) || (p.category ? p.category : null);
        const categoryName = cat ? cat.name : "Portfolio";
        const thumbUrl = p.image_url 
            ? p.image_url 
            : "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='360' viewBox='0 0 600 360' fill='%23063F60'><rect width='600' height='360'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='30' fill='%23C4E0E1'>Project Showcase</text></svg>";

        const techPills = p.technologies 
            ? p.technologies.split(",").map(t => `<span class="tech-pill">${escapeHtml(t.trim())}</span>`).join("")
            : "";

        return `
            <article class="project-card">
                <div class="project-image-box">
                    <img 
                        src="${escapeHtml(thumbUrl)}" 
                        alt="${escapeHtml(p.title)}" 
                        class="project-img"
                        loading="lazy"
                        onerror="this.onerror=null; this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'600\\' height=\\'360\\' fill=\\'%23063F60\\'><rect width=\\'600\\' height=\\'360\\'/></svg>';"
                    >
                    ${p.is_featured ? `<span class="badge-featured">★ Featured</span>` : ''}
                    <span class="badge-card-category">${escapeHtml(categoryName)}</span>
                </div>

                <div class="project-card-body">
                    <h3 class="project-card-title">
                        <a href="project-details.html?slug=${encodeURIComponent(p.slug)}">${escapeHtml(p.title)}</a>
                    </h3>

                    <p class="project-card-desc">
                        ${escapeHtml(p.short_description || "Explore this technical project architecture and solution implementation.")}
                    </p>

                    <div class="tech-pills">
                        ${techPills}
                    </div>

                    <div class="project-card-footer">
                        <div class="footer-links-left">
                            <a href="project-details.html?slug=${encodeURIComponent(p.slug)}" class="card-link card-link-primary">
                                Case Study &rarr;
                            </a>
                        </div>
                        <div class="footer-links-right">
                            ${p.live_url ? `<a href="${escapeHtml(p.live_url)}" target="_blank" rel="noopener noreferrer" class="card-link card-link-secondary">Live Demo &#8599;</a>` : ''}
                            ${p.github_url ? `<a href="${escapeHtml(p.github_url)}" target="_blank" rel="noopener noreferrer" class="card-link card-link-secondary" style="margin-left: 10px;">GitHub &#8599;</a>` : ''}
                        </div>
                    </div>
                </div>
            </article>
        `;
    }).join("");
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

if (searchInput) {
    searchInput.addEventListener("input", renderProjects);
}

// =========================================================
// PUBLIC SKILLS MANAGEMENT
// =========================================================
let publicSkills = [];
let skillCategoriesList = [];
let activeSkillCategory = "all";

const skillsGrid = document.getElementById("skillsGrid");
const skillsFilterTabs = document.getElementById("skillsFilterTabs");

async function initializeSkills() {
    if (!skillsGrid) return;

    skillsGrid.innerHTML = `
        <div class="loading-box" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
            <div class="loading-spinner"></div>
            <p style="margin-top: 10px; color: var(--text-muted);">Loading technical competencies...</p>
        </div>
    `;

    try {
        const [skillsRes, catsRes] = await Promise.all([
            fetch(`${API_BASE_URL}/api/skills/public`),
            fetch(`${API_BASE_URL}/api/skills/categories`)
        ]);

        if (!skillsRes.ok) throw new Error("Could not load public skills.");

        publicSkills = await skillsRes.json();
        skillCategoriesList = catsRes.ok ? await catsRes.json() : [];

        renderSkillCategoryTabs();
        renderSkills();

    } catch (err) {
        console.warn("Public skills load error, trying static site data:", err);
        const staticData = await getStaticSiteData();
        if (staticData && Array.isArray(staticData.skills) && staticData.skills.length > 0) {
            publicSkills = staticData.skills;
            skillCategoriesList = staticData.skill_categories || [];
            renderSkillCategoryTabs();
            renderSkills();
            return;
        }

        skillsGrid.innerHTML = `
            <div class="empty-box" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                <h3>Unable to load skills</h3>
                <p>Ensure the FastAPI backend is online at <code>${API_BASE_URL}</code>.</p>
            </div>
        `;
    }
}

function renderSkillCategoryTabs() {
    if (!skillsFilterTabs) return;

    let tabsHtml = `
        <button type="button" class="tab-btn ${activeSkillCategory === 'all' ? 'active' : ''}" data-cat="all">
            All Disciplines (${publicSkills.length})
        </button>
    `;

    skillCategoriesList.forEach(cat => {
        const count = publicSkills.filter(s => s.category_id === cat.id).length;
        if (count > 0) {
            tabsHtml += `
                <button type="button" class="tab-btn ${activeSkillCategory === String(cat.id) ? 'active' : ''}" data-cat="${cat.id}">
                    ${escapeHtml(cat.name)} (${count})
                </button>
            `;
        }
    });

    skillsFilterTabs.innerHTML = tabsHtml;

    skillsFilterTabs.querySelectorAll(".tab-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            skillsFilterTabs.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            activeSkillCategory = btn.dataset.cat;
            renderSkills();
        });
    });
}

function renderSkills() {
    if (!skillsGrid) return;

    const filtered = publicSkills.filter(s => {
        return activeSkillCategory === "all" || String(s.category_id) === String(activeSkillCategory);
    });

    if (filtered.length === 0) {
        skillsGrid.innerHTML = `
            <div class="empty-box" style="grid-column: 1 / -1; text-align: center; padding: 30px;">
                <p>No skills found in this discipline.</p>
            </div>
        `;
        return;
    }

    skillsGrid.innerHTML = filtered.map(s => {
        const iconChar = s.icon || "⚡";
        const level = s.proficiency_level || "Advanced";
        const levelClass = level.toLowerCase();
        const desc = s.description || "";
        const cat = skillCategoriesList.find(c => c.id === s.category_id) || s.category;
        const catName = cat ? cat.name : "Engineering";

        return `
            <div class="skill-card">
                <div>
                    <div class="skill-card-top">
                        <div class="skill-card-identity">
                            <div class="skill-card-icon">${escapeHtml(iconChar)}</div>
                            <div class="skill-card-heading">
                                <span class="skill-card-title">${escapeHtml(s.name)}</span>
                                <span class="skill-card-cat-tag">${escapeHtml(catName)}</span>
                            </div>
                        </div>
                        <span class="skill-level-badge ${levelClass}">${escapeHtml(level)}</span>
                    </div>

                    ${desc ? `<p class="skill-card-desc">${escapeHtml(desc)}</p>` : `<p class="skill-card-desc" style="min-height: 20px;"></p>`}
                </div>

                <div class="skill-card-progress">
                    <div class="skill-meter-header">
                        <span class="skill-meter-label">Proficiency</span>
                        <span class="skill-meter-pct">${s.proficiency}%</span>
                    </div>
                    <div class="skill-meter-track">
                        <div class="skill-meter-fill" style="width: ${s.proficiency}%;"></div>
                    </div>
                </div>
            </div>
        `;
    }).join("");
}

// =========================================================
// FETCH & RENDER PUBLIC CERTIFICATIONS
// =========================================================
const certificationsGrid = document.getElementById("certificationsGrid");
let publicCertifications = [];

async function initializeCertifications() {
    if (!certificationsGrid) return;

    certificationsGrid.innerHTML = `
        <div class="loading-box" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
            <div class="loading-spinner"></div>
            <p style="margin-top: 10px; color: var(--text-muted);">Loading verified industry certifications...</p>
        </div>
    `;

    try {
        const res = await fetch(`${API_BASE_URL}/api/certifications/public`);
        if (!res.ok) throw new Error("Could not load certifications.");

        publicCertifications = await res.json();
        renderPublicCertifications();
        return;

    } catch (err) {
        console.warn("Public certifications load error, trying static site data:", err);
        const staticData = await getStaticSiteData();
        if (staticData && Array.isArray(staticData.certifications) && staticData.certifications.length > 0) {
            publicCertifications = staticData.certifications;
            renderPublicCertifications();
            return;
        }

        certificationsGrid.innerHTML = `
            <div class="empty-box" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                <h3>Unable to load certifications</h3>
                <p>Ensure the FastAPI backend is running at <code>${API_BASE_URL}</code>.</p>
            </div>
        `;
    }
}

function renderPublicCertifications() {
    if (!certificationsGrid) return;

    if (publicCertifications.length === 0) {
        certificationsGrid.innerHTML = `
            <div class="empty-box" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                <p>No verified certifications published at this time.</p>
            </div>
        `;
        return;
    }

    certificationsGrid.innerHTML = publicCertifications.map(cert => {
        const badgeWrap = cert.certificate_image_url
            ? `<div class="cert-card-badge-wrap"><img src="${escapeHtml(cert.certificate_image_url)}" alt="${escapeHtml(cert.name)}" class="cert-card-badge-img" onerror="this.outerHTML='<span style=\\'font-size:28px;\\'>📜</span>'"></div>`
            : `<div class="cert-card-badge-wrap">📜</div>`;

        const idText = cert.credential_id
            ? `<div class="cert-card-cred-id">ID: ${escapeHtml(cert.credential_id)}</div>`
            : "";

        const descText = cert.description
            ? `<p class="cert-card-desc">${escapeHtml(cert.description)}</p>`
            : `<p class="cert-card-desc" style="min-height: 20px;"></p>`;

        const issueDate = cert.issue_date || "Accredited";
        const expiryDate = cert.expiry_date || "Lifetime";

        const verifyButton = cert.credential_url
            ? `<a href="${escapeHtml(cert.credential_url)}" target="_blank" rel="noopener noreferrer" class="cert-verify-btn">
                 Verify Credential ↗
               </a>`
            : `<span class="cert-status-pill">✓ Verified</span>`;

        return `
            <div class="cert-card ${cert.is_featured ? 'featured' : ''}">
                <div class="cert-card-header">
                    ${badgeWrap}
                    <div class="cert-card-meta">
                        <span class="cert-issuer-badge">${escapeHtml(cert.issuing_organization)}</span>
                        <h3 class="cert-card-title">${escapeHtml(cert.name)}</h3>
                        ${idText}
                    </div>
                </div>

                ${descText}

                <div class="cert-card-dates">
                    <div class="cert-date-item">
                        <span class="cert-date-label">Issued:</span>
                        <span>${escapeHtml(issueDate)}</span>
                    </div>
                    <div class="cert-date-item">
                        <span class="cert-date-label">Valid Thru:</span>
                        <span>${escapeHtml(expiryDate)}</span>
                    </div>
                </div>

                <div class="cert-card-footer">
                    <button type="button" class="cert-view-btn" onclick="openPublicCertModal(${cert.id})">
                        👁️ View Details
                    </button>
                    ${verifyButton}
                </div>
            </div>
        `;
    }).join("");
}

// =========================================================
// PUBLIC CERTIFICATE DETAILS MODAL CONTROLLER
// =========================================================
window.openPublicCertModal = function(id) {
    const cert = publicCertifications.find(c => c.id === Number(id) || c.id === id);
    if (!cert) return;

    const modal = document.getElementById("publicCertModal");
    const modalTitle = document.getElementById("publicCertModalTitle");
    const certIssuer = document.getElementById("publicCertIssuer");
    const certId = document.getElementById("publicCertId");
    const certIssueDate = document.getElementById("publicCertIssueDate");
    const certExpiryDate = document.getElementById("publicCertExpiryDate");
    const certDesc = document.getElementById("publicCertDescription");
    const badgeContainer = document.getElementById("publicCertBadgeContainer");
    const actionsContainer = document.getElementById("publicCertActions");

    if (modalTitle) modalTitle.textContent = cert.name;
    if (certIssuer) certIssuer.textContent = cert.issuing_organization;
    if (certId) certId.textContent = cert.credential_id || "Unspecified / N/A";
    if (certIssueDate) certIssueDate.textContent = cert.issue_date || "Accredited";
    if (certExpiryDate) certExpiryDate.textContent = cert.expiry_date || "Lifetime / No Expiration";
    if (certDesc) certDesc.textContent = cert.description || "Validated professional industry credentials demonstrating domain mastery.";

    if (badgeContainer) {
        if (cert.certificate_image_url) {
            badgeContainer.innerHTML = `<img src="${escapeHtml(cert.certificate_image_url)}" alt="${escapeHtml(cert.name)}" class="public-cert-full-img" onerror="this.outerHTML='<div class=\\'public-cert-fallback-icon\\'>📜</div>'">`;
        } else {
            badgeContainer.innerHTML = `<div class="public-cert-fallback-icon">📜</div>`;
        }
    }

    if (actionsContainer) {
        let buttonsHtml = '';
        if (cert.credential_url) {
            buttonsHtml += `
                <a href="${escapeHtml(cert.credential_url)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary public-verify-link">
                    Verify on Official Portal ↗
                </a>
            `;
        }
        buttonsHtml += `
            <button type="button" class="btn btn-secondary" onclick="closePublicCertModal()">Close</button>
        `;
        actionsContainer.innerHTML = buttonsHtml;
    }

    if (modal) {
        modal.classList.add("active");
        modal.classList.add("show");
        modal.style.display = "flex";
        document.body.style.overflow = "hidden";
    }
};

window.closePublicCertModal = function() {
    const modal = document.getElementById("publicCertModal");
    if (modal) {
        modal.classList.remove("active");
        modal.classList.remove("show");
        modal.style.display = "none";
        document.body.style.overflow = "";
    }
};

// =========================================================
// CAREER EXPERIENCE & EDUCATION TIMELINES
// =========================================================
let publicExperiences = [];
let publicEducation = [];

async function initializeExperience() {
    const track = document.getElementById("experienceTimelineTrack");
    if (!track) return;

    track.innerHTML = `
        <div class="loading-box" style="padding: 30px;">
            <div class="loading-spinner"></div>
            <p>Loading career milestones...</p>
        </div>
    `;

    try {
        const res = await fetch(`${API_BASE_URL}/api/experience/public`);
        if (res.ok) {
            publicExperiences = await res.json();
            renderExperienceTimeline();
            return;
        }
    } catch (err) {
        console.warn("Public experience API fetch failed, trying static site data:", err);
    }

    // Static fallback for GitHub Pages & offline mode
    const staticData = await getStaticSiteData();
    if (staticData && Array.isArray(staticData.experience) && staticData.experience.length > 0) {
        publicExperiences = staticData.experience;
        renderExperienceTimeline();
        return;
    }

    track.innerHTML = `
        <div class="empty-box" style="padding: 24px;">
            <p style="font-weight: 600; color: var(--color-primary-dark);">Career milestones and experience record.</p>
        </div>
    `;
}

function renderExperienceTimeline() {
    const track = document.getElementById("experienceTimelineTrack");
    if (!track) return;

    if (publicExperiences.length === 0) {
        track.innerHTML = `
            <div class="empty-box" style="padding: 24px;">
                <p style="font-weight: 600; color: var(--color-primary-dark);">No public career milestones found.</p>
            </div>
        `;
        return;
    }

    track.innerHTML = publicExperiences.map(exp => {
        const isCurrent = !!exp.is_current;
        const durationText = isCurrent 
            ? `${escapeHtml(exp.start_date)} — <span style="color: var(--color-primary-blue); font-weight: 800;">Present</span>`
            : `${escapeHtml(exp.start_date)} — ${escapeHtml(exp.end_date || "Present")}`;

        const periodClass = isCurrent ? "timeline-period-pill is-current" : "timeline-period-pill";

        const logoHtml = exp.company_logo_url
            ? `<img src="${escapeHtml(exp.company_logo_url)}" alt="${escapeHtml(exp.company)}" onerror="this.parentElement.innerHTML='<span class=\\'entity-fallback\\'>🏢</span>'">`
            : `<span class="entity-fallback">🏢</span>`;

        const companyTitle = exp.company_url
            ? `<a href="${escapeHtml(exp.company_url)}" target="_blank" rel="noopener noreferrer" class="timeline-organization">${escapeHtml(exp.company)} ↗</a>`
            : `<span class="timeline-organization">${escapeHtml(exp.company)}</span>`;

        let techHtml = "";
        if (exp.technologies) {
            const tags = exp.technologies.split(",").map(t => t.trim()).filter(Boolean);
            if (tags.length > 0) {
                techHtml = `
                    <div class="timeline-tech-stack">
                        ${tags.map(t => `<span class="timeline-tech-pill">${escapeHtml(t)}</span>`).join("")}
                    </div>
                `;
            }
        }

        return `
            <div class="timeline-item">
                <div class="timeline-marker"></div>
                <div class="timeline-card">
                    <div class="timeline-card-header">
                        <div class="timeline-identity">
                            <div class="timeline-entity-logo">
                                ${logoHtml}
                            </div>
                            <div class="timeline-title-wrap">
                                <h3>${escapeHtml(exp.position)}</h3>
                                ${companyTitle}
                            </div>
                        </div>
                        <div class="${periodClass}">
                            ${durationText}
                        </div>
                    </div>

                    <div class="timeline-meta-row">
                        <span class="timeline-meta-tag">💼 ${escapeHtml(exp.employment_type || "Full-time")}</span>
                        ${exp.location ? `<span class="timeline-meta-tag">📍 ${escapeHtml(exp.location)}</span>` : ""}
                    </div>

                    ${exp.description ? `<div class="timeline-description">${escapeHtml(exp.description)}</div>` : ""}

                    ${techHtml}
                </div>
            </div>
        `;
    }).join("");
}

async function initializeEducation() {
    const track = document.getElementById("educationTimelineTrack");
    if (!track) return;

    track.innerHTML = `
        <div class="loading-box" style="padding: 30px;">
            <div class="loading-spinner"></div>
            <p>Loading education qualifications...</p>
        </div>
    `;

    try {
        const res = await fetch(`${API_BASE_URL}/api/education/public`);
        if (!res.ok) throw new Error("Could not fetch education qualifications.");
        publicEducation = await res.json();
        renderEducationTimeline();
        return;
    } catch (err) {
        console.warn("Public education load error, trying static site data:", err);
        const staticData = await getStaticSiteData();
        if (staticData && Array.isArray(staticData.education) && staticData.education.length > 0) {
            publicEducation = staticData.education;
            renderEducationTimeline();
            return;
        }

        track.innerHTML = `
            <div class="empty-box" style="padding: 24px;">
                <p style="color: #dc2626; font-weight: 600;">Unable to load education qualifications.</p>
                <p style="font-size: 13px; color: var(--text-secondary);">${escapeHtml(err.message)}</p>
            </div>
        `;
    }
}

function renderEducationTimeline() {
    const track = document.getElementById("educationTimelineTrack");
    if (!track) return;

    if (publicEducation.length === 0) {
        track.innerHTML = `
            <div class="empty-box" style="padding: 24px;">
                <p style="font-weight: 600; color: var(--color-primary-dark);">No education qualifications found.</p>
            </div>
        `;
        return;
    }

    track.innerHTML = publicEducation.map(edu => {
        let periodText = "";
        if (edu.start_year || edu.end_year) {
            periodText = `${escapeHtml(edu.start_year || "")} – ${escapeHtml(edu.end_year || "Present")}`;
        }

        const logoHtml = edu.institution_logo_url
            ? `<img src="${escapeHtml(edu.institution_logo_url)}" alt="${escapeHtml(edu.institution)}" onerror="this.parentElement.innerHTML='<span class=\\'entity-fallback\\'>🎓</span>'">`
            : `<span class="entity-fallback">🎓</span>`;

        const instTitle = edu.institution_url
            ? `<a href="${escapeHtml(edu.institution_url)}" target="_blank" rel="noopener noreferrer" class="timeline-organization">${escapeHtml(edu.institution)} ↗</a>`
            : `<span class="timeline-organization">${escapeHtml(edu.institution)}</span>`;

        let activitiesHtml = "";
        if (edu.activities) {
            activitiesHtml = `
                <div class="timeline-tech-stack">
                    <span style="font-size: 12px; font-weight: 700; color: var(--color-primary-dark); margin-right: 4px;">Activities &amp; Leadership:</span>
                    <span class="timeline-tech-pill">${escapeHtml(edu.activities)}</span>
                </div>
            `;
        }

        return `
            <div class="timeline-item">
                <div class="timeline-marker"></div>
                <div class="timeline-card">
                    <div class="timeline-card-header">
                        <div class="timeline-identity">
                            <div class="timeline-entity-logo">
                                ${logoHtml}
                            </div>
                            <div class="timeline-title-wrap">
                                <h3>${escapeHtml(edu.degree)}</h3>
                                ${instTitle}
                            </div>
                        </div>
                        ${periodText ? `<div class="timeline-period-pill">${periodText}</div>` : ""}
                    </div>

                    <div class="timeline-meta-row">
                        <span class="timeline-meta-tag">📚 Major: ${escapeHtml(edu.field_of_study)}</span>
                        ${edu.grade ? `<span class="timeline-meta-tag">⭐ ${escapeHtml(edu.grade)}</span>` : ""}
                    </div>

                    ${edu.description ? `<div class="timeline-description">${escapeHtml(edu.description)}</div>` : ""}

                    ${activitiesHtml}
                </div>
            </div>
        `;
    }).join("");
}

function setupCareerTabs() {
    const expBtn = document.getElementById("tabExperienceBtn");
    const eduBtn = document.getElementById("tabEducationBtn");
    const expContainer = document.getElementById("experienceTimelineContainer");
    const eduContainer = document.getElementById("educationTimelineContainer");

    if (expBtn && eduBtn && expContainer && eduContainer) {
        expBtn.addEventListener("click", () => {
            expBtn.classList.add("active");
            eduBtn.classList.remove("active");
            expContainer.style.display = "block";
            eduContainer.style.display = "none";
        });

        eduBtn.addEventListener("click", () => {
            eduBtn.classList.add("active");
            expBtn.classList.remove("active");
            eduContainer.style.display = "block";
            expContainer.style.display = "none";
        });
    }
}

// =========================================================
// MODULE 5: GRAPHIC DESIGN & UX/UI SHOWCASE
// =========================================================
let publicDesignItems = [];
let publicCaseStudies = [];

async function initializeDesign() {
    const designGrid = document.getElementById("designGalleryGrid");
    if (!designGrid) return;

    designGrid.innerHTML = `
        <div class="loading-box" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
            <div class="loading-spinner"></div>
            <p style="color: var(--color-primary-dark); font-weight: 600; margin-top: 10px;">Loading visual design portfolio...</p>
        </div>
    `;

    try {
        const res = await fetch(`${API_BASE_URL}/api/design/public`);
        if (res.ok) {
            publicDesignItems = await res.json();
            renderDesignItems();
            return;
        }
    } catch (err) {
        console.warn("Public design API fetch failed, trying static site data:", err);
    }

    // Static fallback for GitHub Pages & offline mode
    const staticData = await getStaticSiteData();
    if (staticData && Array.isArray(staticData.design_items) && staticData.design_items.length > 0) {
        publicDesignItems = staticData.design_items;
        renderDesignItems();
        return;
    }

    renderDesignItems();
}

function renderDesignItems() {
    const designGrid = document.getElementById("designGalleryGrid");
    if (!designGrid) return;

    if (!publicDesignItems || publicDesignItems.length === 0) {
        designGrid.innerHTML = `
            <div class="empty-box" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                <h3 style="color: var(--color-primary-dark);">No design artworks published yet</h3>
                <p style="color: var(--text-secondary);">Visual assets, brand identities, and vector illustrations will be showcased here.</p>
            </div>
        `;
        return;
    }

    designGrid.innerHTML = publicDesignItems.map(item => {
        const rawImg = item.thumbnail_url || item.image_url;
        const fullImg = rawImg 
            ? (rawImg.startsWith("http") || rawImg.startsWith("data:") ? rawImg : `${API_BASE_URL}${rawImg.startsWith("/") ? "" : "/"}${rawImg}`)
            : "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400' fill='%23063F60'><rect width='600' height='400'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='24' fill='%23C4E0E1'>🎨 Design Asset</text></svg>";

        const toolsList = item.tools_used
            ? item.tools_used.split(",").map(t => `<span class="uxui-chip" style="font-size:11px; padding:2px 7px;">${escapeHtml(t.trim())}</span>`).join(" ")
            : "";

        return `
            <article class="design-card" data-id="${item.id}">
                <div class="design-card-media" onclick="openPublicDesignModal(${item.id})" style="cursor: pointer;">
                    <img src="${escapeHtml(fullImg)}" alt="${escapeHtml(item.title)}" class="design-card-img" loading="lazy" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'600\\' height=\\'400\\' fill=\\'%23063F60\\'><text x=\\'50%25\\' y=\\'50%25\\' dominant-baseline=\\'middle\\' text-anchor=\\'middle\\' fill=\\'%23C4E0E1\\' font-size=\\'20\\'>Asset Preview</text></svg>'">
                    <span class="design-card-category-pill">${escapeHtml(item.category || "Graphic Design")}</span>
                    ${item.client ? `<span class="design-card-client-pill">${escapeHtml(item.client)}</span>` : ""}
                </div>
                <div class="design-card-body">
                    <h3 class="design-card-title">${escapeHtml(item.title)}</h3>
                    <p class="design-card-desc">${escapeHtml(item.description || "")}</p>
                    ${toolsList ? `<div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 14px;">${toolsList}</div>` : ""}
                    <div class="design-card-footer">
                        <span style="font-size: 12px; color: var(--text-secondary); font-weight: 600;">
                            ${item.year ? `📅 ${escapeHtml(item.year)}` : (item.aspect_ratio ? `📐 ${escapeHtml(item.aspect_ratio)}` : "")}
                        </span>
                        <button type="button" class="btn-view-design" onclick="openPublicDesignModal(${item.id})">
                            🔍 View Details
                        </button>
                    </div>
                </div>
            </article>
        `;
    }).join("");
}

async function initializeUXUI() {
    const uxuiGrid = document.getElementById("uxuiShowcaseGrid");
    if (!uxuiGrid) return;

    uxuiGrid.innerHTML = `
        <div class="loading-box" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
            <div class="loading-spinner"></div>
            <p style="color: var(--color-primary-dark); font-weight: 600; margin-top: 10px;">Loading UX/UI product case studies...</p>
        </div>
    `;

    try {
        const res = await fetch(`${API_BASE_URL}/api/ux-ui/public`);
        if (res.ok) {
            publicCaseStudies = await res.json();
            renderCaseStudies();
            return;
        }
    } catch (err) {
        console.warn("Public UX/UI API fetch failed, trying static site data:", err);
    }

    // Static fallback for GitHub Pages & offline mode
    const staticData = await getStaticSiteData();
    if (staticData && Array.isArray(staticData.ux_ui_case_studies) && staticData.ux_ui_case_studies.length > 0) {
        publicCaseStudies = staticData.ux_ui_case_studies;
        renderCaseStudies();
        return;
    }

    renderCaseStudies();
}

function renderCaseStudies() {
    const uxuiGrid = document.getElementById("uxuiShowcaseGrid");
    if (!uxuiGrid) return;

    if (!publicCaseStudies || publicCaseStudies.length === 0) {
        uxuiGrid.innerHTML = `
            <div class="empty-box" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                <h3 style="color: var(--color-primary-dark);">No UX/UI case studies published yet</h3>
                <p style="color: var(--text-secondary);">Product design deep dives, interaction workflows, and prototypes will appear here.</p>
            </div>
        `;
        return;
    }

    uxuiGrid.innerHTML = publicCaseStudies.map(cs => {
        const rawImg = cs.preview_image_url || cs.cover_image_url;
        const fullImg = rawImg 
            ? (rawImg.startsWith("http") || rawImg.startsWith("data:") ? rawImg : `${API_BASE_URL}${rawImg.startsWith("/") ? "" : "/"}${rawImg}`)
            : "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='480' viewBox='0 0 800 480' fill='%23063F60'><rect width='800' height='480'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='28' fill='%23C4E0E1'>✨ UX/UI Case Study</text></svg>";

        const chips = [];
        if (cs.client) chips.push(`🏢 ${escapeHtml(cs.client)}`);
        if (cs.role) chips.push(`👤 ${escapeHtml(cs.role)}`);
        if (cs.duration) chips.push(`⏱️ ${escapeHtml(cs.duration)}`);

        const chipsHtml = chips.map(c => `<span class="uxui-chip">${c}</span>`).join("");

        const problemSnippet = cs.problem_statement 
            ? `<div class="uxui-highlight-box">
                 <strong>⚠️ Challenge &amp; Problem:</strong>
                 ${escapeHtml(cs.problem_statement.length > 170 ? cs.problem_statement.substring(0, 167) + "..." : cs.problem_statement)}
               </div>` 
            : "";

        return `
            <article class="uxui-card" data-id="${cs.id}">
                <div class="uxui-card-cover" onclick="openPublicCaseStudyModal(${cs.id})" style="cursor: pointer;">
                    <img src="${escapeHtml(fullImg)}" alt="${escapeHtml(cs.title)}" class="uxui-cover-img" loading="lazy" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'800\\' height=\\'480\\' fill=\\'%23063F60\\'><text x=\\'50%25\\' y=\\'50%25\\' dominant-baseline=\\'middle\\' text-anchor=\\'middle\\' fill=\\'%23C4E0E1\\' font-size=\\'24\\'>Product Mockup</text></svg>'">
                    <span class="uxui-badge">${escapeHtml(cs.category || "Product UX/UI")}</span>
                </div>
                <div class="uxui-card-body">
                    <h3 class="uxui-card-title">${escapeHtml(cs.title)}</h3>
                    ${cs.subtitle ? `<div class="uxui-card-subtitle">${escapeHtml(cs.subtitle)}</div>` : ""}
                    ${chipsHtml ? `<div class="uxui-meta-chips">${chipsHtml}</div>` : ""}
                    ${problemSnippet}
                    <div class="uxui-card-actions">
                        <span style="font-size: 12px; color: var(--color-primary-blue); font-weight: 700;">
                            ${cs.tools_used ? `🛠️ ${escapeHtml(cs.tools_used)}` : ""}
                        </span>
                        <button type="button" class="btn-view-design" onclick="openPublicCaseStudyModal(${cs.id})">
                            📖 Read Case Study
                        </button>
                    </div>
                </div>
            </article>
        `;
    }).join("");
}

function setupDesignTabs() {
    const tabDesignBtn = document.getElementById("tabDesignBtn");
    const tabUXUIBtn = document.getElementById("tabUXUIBtn");
    const designContainer = document.getElementById("designGalleryContainer");
    const uxuiContainer = document.getElementById("uxuiShowcaseContainer");

    if (tabDesignBtn && tabUXUIBtn && designContainer && uxuiContainer) {
        tabDesignBtn.addEventListener("click", () => {
            tabDesignBtn.classList.add("active");
            tabUXUIBtn.classList.remove("active");
            designContainer.style.display = "block";
            uxuiContainer.style.display = "none";
        });

        tabUXUIBtn.addEventListener("click", () => {
            tabUXUIBtn.classList.add("active");
            tabDesignBtn.classList.remove("active");
            uxuiContainer.style.display = "block";
            designContainer.style.display = "none";
        });
    }
}

// Modal Handlers
window.openPublicDesignModal = function(id) {
    const item = publicDesignItems.find(d => d.id === Number(id));
    if (!item) return;

    const modal = document.getElementById("publicDesignModal");
    if (!modal) return;

    document.getElementById("publicDesignTitle").textContent = item.title;
    document.getElementById("publicDesignCategory").textContent = item.category || "Graphic & Visual Design";
    
    const rawImg = item.image_url || item.thumbnail_url;
    const fullImg = rawImg 
        ? (rawImg.startsWith("http") || rawImg.startsWith("data:") ? rawImg : `${API_BASE_URL}${rawImg.startsWith("/") ? "" : "/"}${rawImg}`)
        : "";
    const imgEl = document.getElementById("publicDesignImg");
    if (imgEl) {
        imgEl.src = fullImg;
        imgEl.alt = item.title;
    }

    document.getElementById("publicDesignClient").textContent = item.client || "Self-Initiated / Independent";
    document.getElementById("publicDesignYear").textContent = item.year || "—";
    document.getElementById("publicDesignTools").textContent = item.tools_used || "—";
    document.getElementById("publicDesignTags").textContent = item.tags || "—";
    document.getElementById("publicDesignDesc").textContent = item.description || "No creative description provided.";

    modal.classList.add("active", "show");
    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
};

window.closePublicDesignModal = function() {
    const modal = document.getElementById("publicDesignModal");
    if (modal) {
        modal.classList.remove("active", "show");
        modal.style.display = "none";
        document.body.style.overflow = "";
    }
};

window.openPublicCaseStudyModal = function(id) {
    const cs = publicCaseStudies.find(c => c.id === Number(id));
    if (!cs) return;

    const modal = document.getElementById("publicCaseStudyModal");
    if (!modal) return;

    document.getElementById("publicCSTitle").textContent = cs.title;
    const subtitleEl = document.getElementById("publicCSSubtitle");
    if (subtitleEl) {
        subtitleEl.textContent = cs.subtitle || "";
        subtitleEl.style.display = cs.subtitle ? "block" : "none";
    }

    document.getElementById("publicCSCategory").textContent = cs.category || "Enterprise UX/UI Design";

    const rawImg = cs.cover_image_url || cs.preview_image_url;
    const fullImg = rawImg 
        ? (rawImg.startsWith("http") || rawImg.startsWith("data:") ? rawImg : `${API_BASE_URL}${rawImg.startsWith("/") ? "" : "/"}${rawImg}`)
        : "";
    const coverImgEl = document.getElementById("publicCSCoverImg");
    if (coverImgEl) {
        coverImgEl.src = fullImg;
        coverImgEl.alt = cs.title;
    }

    document.getElementById("publicCSClient").textContent = cs.client || "Enterprise Client";
    document.getElementById("publicCSRole").textContent = cs.role || "Lead Product Designer";
    document.getElementById("publicCSDuration").textContent = cs.duration || "—";
    document.getElementById("publicCSTools").textContent = cs.tools_used || "Figma, User Research";

    document.getElementById("publicCSProblem").textContent = cs.problem_statement || "No problem statement specified.";
    document.getElementById("publicCSSolution").textContent = cs.solution_overview || "No solution overview specified.";
    document.getElementById("publicCSProcess").textContent = cs.design_process || "No design methodology specified.";

    const resultsBox = document.getElementById("publicCSResultsBox");
    const resultsText = document.getElementById("publicCSResults");
    if (cs.key_results) {
        resultsText.textContent = cs.key_results;
        resultsBox.style.display = "block";
    } else {
        resultsBox.style.display = "none";
    }

    const actionsContainer = document.getElementById("publicCSActions");
    if (actionsContainer) {
        let actionButtons = "";
        if (cs.live_prototype_url) {
            actionButtons += `<a href="${escapeHtml(cs.live_prototype_url)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">🚀 Interactive Prototype</a> `;
        }
        if (cs.figma_url) {
            actionButtons += `<a href="${escapeHtml(cs.figma_url)}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary">🎨 Figma Source File</a> `;
        }
        actionButtons += `<button type="button" class="btn btn-secondary" onclick="closePublicCaseStudyModal()">Close</button>`;
        actionsContainer.innerHTML = actionButtons;
    }

    modal.classList.add("active", "show");
    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
};

window.closePublicCaseStudyModal = function() {
    const modal = document.getElementById("publicCaseStudyModal");
    if (modal) {
        modal.classList.remove("active", "show");
        modal.style.display = "none";
        document.body.style.overflow = "";
    }
};

// =========================================================
// MODULE 6: TECHNICAL BLOG & ENGINEERING ARTICLES
// =========================================================
let publicBlogPosts = [];

async function initializeBlog() {
    const blogGrid = document.getElementById("blogArticlesGrid");
    if (!blogGrid) return;

    blogGrid.innerHTML = `
        <div class="loading-box" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
            <div class="loading-spinner"></div>
            <p style="color: var(--color-primary-dark); font-weight: 600; margin-top: 10px;">Loading technical articles...</p>
        </div>
    `;

    try {
        const res = await fetch(`${API_BASE_URL}/api/blog/public`);
        if (res.ok) {
            publicBlogPosts = await res.json();
            renderBlogPosts();
            return;
        }
    } catch (err) {
        console.warn("Public blog API fetch failed, trying static site data:", err);
    }

    // Static fallback for GitHub Pages & offline mode
    const staticData = await getStaticSiteData();
    if (staticData && Array.isArray(staticData.blog_posts) && staticData.blog_posts.length > 0) {
        publicBlogPosts = staticData.blog_posts;
        renderBlogPosts();
        return;
    }

    renderBlogPosts();
}

function renderBlogPosts() {
    const blogGrid = document.getElementById("blogArticlesGrid");
    if (!blogGrid) return;

    if (!publicBlogPosts || publicBlogPosts.length === 0) {
        blogGrid.innerHTML = `
            <div class="empty-box" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                <h3 style="color: var(--color-primary-dark);">No technical articles published yet</h3>
                <p style="color: var(--text-secondary);">Engineering deep-dives and security writeups will appear here soon.</p>
            </div>
        `;
        return;
    }

    blogGrid.innerHTML = publicBlogPosts.map(post => {
        const rawCover = post.cover_image_url;
        const fullCover = rawCover
            ? (rawCover.startsWith("http") || rawCover.startsWith("data:") ? rawCover : `${API_BASE_URL}${rawCover.startsWith("/") ? "" : "/"}${rawCover}`)
            : "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='450' viewBox='0 0 800 450' fill='%23063F60'><rect width='800' height='450'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='26' fill='%23C4E0E1'>Engineering Article</text></svg>";

        const pubDate = post.published_at
            ? new Date(post.published_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
            : "Recently published";

        return `
            <article class="blog-card" data-slug="${escapeHtml(post.slug)}">
                <div class="blog-card-media" onclick="openPublicBlogModal('${escapeHtml(post.slug)}')" style="cursor: pointer;">
                    <img src="${escapeHtml(fullCover)}" alt="${escapeHtml(post.title)}" class="blog-card-cover" loading="lazy" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'800\\' height=\\'450\\' fill=\\'%23063F60\\'><text x=\\'50%25\\' y=\\'50%25\\' dominant-baseline=\\'middle\\' text-anchor=\\'middle\\' fill=\\'%23C4E0E1\\' font-size=\\'22\\'>Article Cover</text></svg>'">
                    <span class="blog-card-badge">${escapeHtml(post.category)}</span>
                    <span class="blog-card-time">⏱️ ${post.reading_time_minutes} min read</span>
                </div>
                <div class="blog-card-body">
                    <div class="blog-card-meta">
                        <span>📅 ${pubDate}</span>
                        <span>•</span>
                        <span>👤 ${escapeHtml(post.author || "Design Lyricist")}</span>
                    </div>
                    <h3 class="blog-card-title">${escapeHtml(post.title)}</h3>
                    <p class="blog-card-excerpt">${escapeHtml(post.excerpt || "")}</p>
                    <div class="blog-card-footer">
                        <span style="font-size: 12px; color: var(--color-primary-blue); font-weight: 700;">
                            👁️ ${(post.views_count || 0).toLocaleString()} reads
                        </span>
                        <button type="button" class="btn-read-blog" onclick="openPublicBlogModal('${escapeHtml(post.slug)}')">
                            📖 Read Article
                        </button>
                    </div>
                </div>
            </article>
        `;
    }).join("");
}

window.openPublicBlogModal = async function(slugOrId) {
    const modal = document.getElementById("publicBlogModal");
    if (!modal) return;

    let post = publicBlogPosts.find(p => p.slug === slugOrId || p.id === Number(slugOrId));

    // If not in cache or full content missing, fetch from endpoint
    if (!post || !post.content) {
        try {
            const res = await fetch(`${API_BASE_URL}/api/blog/public/${slugOrId}`);
            if (res.ok) {
                post = await res.json();
                const cached = publicBlogPosts.find(p => p.slug === post.slug);
                if (cached) cached.views_count = post.views_count;
            }
        } catch (e) {
            console.error("Error fetching single post:", e);
        }
    }

    if (!post) return;

    document.getElementById("publicBlogModalTitle").textContent = post.title;
    const subEl = document.getElementById("publicBlogSubtitle");
    if (subEl) {
        subEl.textContent = post.subtitle || "";
        subEl.style.display = post.subtitle ? "block" : "none";
    }

    document.getElementById("publicBlogCategory").textContent = post.category || "Technical Article";

    const rawCover = post.cover_image_url;
    const fullCover = rawCover
        ? (rawCover.startsWith("http") || rawCover.startsWith("data:") ? rawCover : `${API_BASE_URL}${rawCover.startsWith("/") ? "" : "/"}${rawCover}`)
        : "";
    const coverEl = document.getElementById("publicBlogCoverImg");
    if (coverEl) {
        coverEl.src = fullCover;
        coverEl.alt = post.title;
    }

    document.getElementById("publicBlogAuthor").textContent = post.author || "Design Lyricist";
    document.getElementById("publicBlogReadTime").textContent = `${post.reading_time_minutes || 5} min read`;
    document.getElementById("publicBlogViews").textContent = `${(post.views_count || 1).toLocaleString()} reads`;

    const pubDate = post.published_at
        ? new Date(post.published_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
        : "Recently Published";
    document.getElementById("publicBlogDate").textContent = pubDate;

    // Tags
    const tagsWrap = document.getElementById("publicBlogTagsWrap");
    if (tagsWrap) {
        if (post.tags) {
            tagsWrap.innerHTML = post.tags.split(",").map(t => `<span class="uxui-chip" style="font-size: 11.5px; padding: 3px 8px;">🏷️ ${escapeHtml(t.trim())}</span>`).join(" ");
            tagsWrap.style.display = "flex";
        } else {
            tagsWrap.innerHTML = "";
            tagsWrap.style.display = "none";
        }
    }

    // Article Content
    const contentEl = document.getElementById("publicBlogContent");
    if (contentEl) {
        contentEl.innerHTML = post.content || "<p>No content provided for this article.</p>";
    }

    // Share / Copy Link button
    const shareBtn = document.getElementById("shareBlogBtn");
    if (shareBtn) {
        shareBtn.onclick = () => {
            const articleUrl = `${window.location.origin}${window.location.pathname}?article=${encodeURIComponent(post.slug)}#blog`;
            navigator.clipboard.writeText(articleUrl).then(() => {
                const prev = shareBtn.textContent;
                shareBtn.textContent = "✓ Link Copied!";
                setTimeout(() => { shareBtn.textContent = prev; }, 2200);
            });
        };
    }

    modal.classList.add("active", "show");
    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
};

window.closePublicBlogModal = function() {
    const modal = document.getElementById("publicBlogModal");
    if (modal) {
        modal.classList.remove("active", "show");
        modal.style.display = "none";
        document.body.style.overflow = "";
    }
};

let activeBlogCategoryFilter = "all";

async function initializeBlogCatalog() {
    const catalogGrid = document.getElementById("allBlogGrid");
    if (!catalogGrid) return;

    catalogGrid.innerHTML = `
        <div class="loading-box" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
            <div class="loading-spinner"></div>
            <p style="color: var(--color-primary-dark); font-weight: 600; margin-top: 10px;">Loading technical articles catalog...</p>
        </div>
    `;

    try {
        const res = await fetch(`${API_BASE_URL}/api/blog/public`);
        if (!res.ok) throw new Error("Could not fetch published blog articles.");
        publicBlogPosts = await res.json();
        renderBlogCategoryTabs();
        renderBlogCatalog();

        const searchInput = document.getElementById("searchBlogCatalogInput");
        if (searchInput) {
            searchInput.addEventListener("input", renderBlogCatalog);
        }
    } catch (err) {
        console.error("Public blog catalog load error:", err);
        catalogGrid.innerHTML = `
            <div class="empty-box" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                <h3 style="color: var(--color-primary-dark);">Technical articles currently unavailable</h3>
                <p style="color: var(--text-secondary);">Unable to load articles right now. Please check back soon.</p>
            </div>
        `;
    }
}

function renderBlogCategoryTabs() {
    const tabsContainer = document.getElementById("blogCategoryTabs");
    if (!tabsContainer) return;

    const categories = Array.from(new Set(publicBlogPosts.map(p => p.category).filter(Boolean))).sort();
    let tabsHtml = `
        <button type="button" class="tab-btn ${activeBlogCategoryFilter === 'all' ? 'active' : ''}" data-cat="all">
            All Articles (${publicBlogPosts.length})
        </button>
    `;

    categories.forEach(cat => {
        const count = publicBlogPosts.filter(p => p.category === cat).length;
        tabsHtml += `
            <button type="button" class="tab-btn ${activeBlogCategoryFilter === cat ? 'active' : ''}" data-cat="${escapeHtml(cat)}">
                ${escapeHtml(cat)} (${count})
            </button>
        `;
    });

    tabsContainer.innerHTML = tabsHtml;
    tabsContainer.querySelectorAll(".tab-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            tabsContainer.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            activeBlogCategoryFilter = btn.dataset.cat;
            renderBlogCatalog();
        });
    });
}

function renderBlogCatalog() {
    const catalogGrid = document.getElementById("allBlogGrid");
    if (!catalogGrid) return;

    const searchInput = document.getElementById("searchBlogCatalogInput");
    const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : "";

    const filtered = publicBlogPosts.filter(p => {
        const matchesCategory = activeBlogCategoryFilter === "all" || p.category === activeBlogCategoryFilter;
        const titleMatch = (p.title || "").toLowerCase().includes(searchTerm);
        const excerptMatch = (p.excerpt || "").toLowerCase().includes(searchTerm);
        const tagsMatch = (p.tags || "").toLowerCase().includes(searchTerm);
        return matchesCategory && (titleMatch || excerptMatch || tagsMatch);
    });

    if (filtered.length === 0) {
        catalogGrid.innerHTML = `
            <div class="empty-box" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                <h3 style="color: var(--color-primary-dark);">No articles found</h3>
                <p style="color: var(--text-secondary);">Try clearing your search query or selecting another category.</p>
            </div>
        `;
        return;
    }

    catalogGrid.innerHTML = filtered.map(post => {
        const rawCover = post.cover_image_url;
        const fullCover = rawCover
            ? (rawCover.startsWith("http") || rawCover.startsWith("data:") ? rawCover : `${API_BASE_URL}${rawCover.startsWith("/") ? "" : "/"}${rawCover}`)
            : "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='450' viewBox='0 0 800 450' fill='%23063F60'><rect width='800' height='450'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='26' fill='%23C4E0E1'>Engineering Article</text></svg>";

        const pubDate = post.published_at
            ? new Date(post.published_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
            : "Recently published";

        return `
            <article class="blog-card" data-slug="${escapeHtml(post.slug)}">
                <div class="blog-card-media" onclick="openPublicBlogModal('${escapeHtml(post.slug)}')" style="cursor: pointer;">
                    <img src="${escapeHtml(fullCover)}" alt="${escapeHtml(post.title)}" class="blog-card-cover" loading="lazy" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'800\\' height=\\'450\\' fill=\\'%23063F60\\'><text x=\\'50%25\\' y=\\'50%25\\' dominant-baseline=\\'middle\\' text-anchor=\\'middle\\' fill=\\'%23C4E0E1\\' font-size=\\'22\\'>Article Cover</text></svg>'">
                    <span class="blog-card-badge">${escapeHtml(post.category)}</span>
                    <span class="blog-card-time">⏱️ ${post.reading_time_minutes} min read</span>
                </div>
                <div class="blog-card-body">
                    <div class="blog-card-meta">
                        <span>📅 ${pubDate}</span>
                        <span>•</span>
                        <span>👤 ${escapeHtml(post.author || "Design Lyricist")}</span>
                    </div>
                    <h3 class="blog-card-title">${escapeHtml(post.title)}</h3>
                    <p class="blog-card-excerpt">${escapeHtml(post.excerpt || "")}</p>
                    <div class="blog-card-footer">
                        <span style="font-size: 12px; color: var(--color-primary-blue); font-weight: 700;">
                            👁️ ${(post.views_count || 0).toLocaleString()} reads
                        </span>
                        <button type="button" class="btn-read-blog" onclick="openPublicBlogModal('${escapeHtml(post.slug)}')">
                            📖 Read Article
                        </button>
                    </div>
                </div>
            </article>
        `;
    }).join("");
}

// =========================================================
// CONTACT FORM SUBMISSION
// =========================================================
function initializeContactForm() {
    const contactForm = document.getElementById("publicContactForm");
    if (!contactForm) return;

    const alertBox = document.getElementById("contactFormAlert");
    const submitBtn = document.getElementById("contactSubmitBtn");
    const submitText = document.getElementById("contactSubmitText");
    const submitSpinner = document.getElementById("contactSubmitSpinner");

    const nameInput = document.getElementById("contactName");
    const emailInput = document.getElementById("contactEmail");
    const subjectInput = document.getElementById("contactSubject");
    const messageInput = document.getElementById("contactMessage");

    function showAlert(msg, isSuccess = false) {
        if (!alertBox) return;
        alertBox.textContent = msg;
        alertBox.className = `contact-form-alert ${isSuccess ? "success" : "error"}`;
        alertBox.style.display = "block";
    }

    function hideAlert() {
        if (!alertBox) return;
        alertBox.style.display = "none";
        alertBox.textContent = "";
    }

    contactForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        hideAlert();

        const name = nameInput ? nameInput.value.trim() : "";
        const email = emailInput ? emailInput.value.trim() : "";
        const subject = subjectInput ? subjectInput.value.trim() : "";
        const message = messageInput ? messageInput.value.trim() : "";

        // Client-side Validation
        if (!name || !email || !subject || !message) {
            showAlert("Please fill out all required fields (*).", false);
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showAlert("Please enter a valid email address.", false);
            return;
        }

        // Loading State
        if (submitBtn) submitBtn.disabled = true;
        if (submitText) submitText.style.display = "none";
        if (submitSpinner) submitSpinner.style.display = "inline";

        try {
            const res = await fetch(`${API_BASE_URL}/api/contact`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name,
                    email,
                    subject,
                    message
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.detail || "Unable to send message. Please try again.");
            }

            // Success
            contactForm.reset();
            showAlert(data.message || `Thank you, ${name}! Your message has been sent successfully.`, true);

        } catch (err) {
            console.error("Contact submission error:", err);
            showAlert(err.message || "Failed to deliver message. Please reach out via muneeb03022309111@gmail.com.", false);
        } finally {
            if (submitBtn) submitBtn.disabled = false;
            if (submitText) submitText.style.display = "inline";
            if (submitSpinner) submitSpinner.style.display = "none";
        }
    });
}

// =========================================================
// PUBLIC SOCIAL LINKS INITIALIZATION
// =========================================================
async function initializeSocialLinks() {
    const heroSocialLinks = document.getElementById("heroSocialLinks");
    const footerSocialIcons = document.getElementById("footerSocialIcons");

    if (!heroSocialLinks && !footerSocialIcons) return;

    let links = null;
    try {
        const res = await fetch(`${API_BASE_URL}/api/social/public`);
        if (res.ok) {
            links = await res.json();
        }
    } catch (err) {
        console.warn("Public social links fetch failed, fallback to static site data:", err);
    }

    if (!links || links.length === 0) {
        const staticData = await getStaticSiteData();
        if (staticData && Array.isArray(staticData.social_links) && staticData.social_links.length > 0) {
            links = staticData.social_links;
        }
    }

    if (!links || links.length === 0) return;

    // Helper for social icons
    function getSocialIconSvg(platform, iconSvg) {
        if (iconSvg && iconSvg.trim().startsWith("<svg")) return iconSvg;
        const p = (platform || "").toLowerCase();
        if (p.includes("linkedin")) {
            return `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.64 1.64 0 1 0 0-3.28 1.64 1.64 0 0 0 0 3.28m1.4 9.74v-8.37H5.06v8.37z"/></svg>`;
        }
        if (p.includes("behance")) {
            return `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M22 7h-7V5h7v2zm1.726 10c-.442 1.297-2.029 3-4.981 3-3.642 0-5.745-2.588-5.745-5.909 0-3.684 2.502-6.091 5.922-6.091 3.513 0 5.408 2.378 5.408 5.679 0 .584-.075 1.218-.17 1.664h-8.087c.101 1.774 1.353 2.766 2.915 2.766 1.455 0 2.316-.689 2.683-1.609l2.055.5zm-5.076-5.466c-.053-1.282-.871-2.034-2.147-2.034-1.298 0-2.181.821-2.312 2.034h4.459zm-13.65-6.534h4.945c2.193 0 3.738.995 3.738 2.825 0 1.229-.693 2.146-1.785 2.545 1.401.378 2.292 1.488 2.292 2.946 0 2.222-1.802 3.684-4.298 3.684h-4.892v-12zm3.018 4.743h1.794c.942 0 1.543-.456 1.543-1.214 0-.749-.578-1.189-1.503-1.189h-1.834v2.403zm0 4.887h1.992c1.084 0 1.776-.516 1.776-1.37 0-.895-.733-1.402-1.826-1.402h-1.942v2.772z"/></svg>`;
        }
        if (p.includes("github")) {
            return `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"/></svg>`;
        }
        return `<span>🔗</span>`;
    }

    // Render in Hero
    if (heroSocialLinks) {
        heroSocialLinks.innerHTML = links.map(link => {
            const icon = getSocialIconSvg(link.platform_name, link.icon_svg);
            return `
                <a href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer" 
                   class="public-social-btn" title="${escapeHtml(link.platform_name)}" aria-label="${escapeHtml(link.platform_name)}">
                    ${icon}
                </a>
            `;
        }).join("");
    }

    // Render in Footer
    if (footerSocialIcons) {
        footerSocialIcons.innerHTML = links.map(link => {
            const icon = getSocialIconSvg(link.platform_name, link.icon_svg);
            return `
                <a href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer" 
                   class="footer-social-btn" title="${escapeHtml(link.platform_name)}" aria-label="${escapeHtml(link.platform_name)}">
                    ${icon}
                </a>
            `;
        }).join("");
    }
}

// =========================================================
// PUBLIC SITE SETTINGS & METADATA INITIALIZATION
// =========================================================
async function initializeSiteSettings() {
    let data = null;
    try {
        const res = await fetch(`${API_BASE_URL}/api/settings/public`);
        if (res.ok) {
            data = await res.json();
        }
    } catch (err) {
        console.warn("Public settings fetch failed, fallback to static site data:", err);
    }

    if (!data) {
        const staticData = await getStaticSiteData();
        if (staticData && staticData.site_settings) {
            data = staticData.site_settings;
        }
    }

    if (!data) return;

        // 1. Meta / SEO Tags
        if (data.meta_title) {
            document.title = data.meta_title;
        }
        if (data.meta_description) {
            let metaDesc = document.querySelector('meta[name="description"]');
            if (!metaDesc) {
                metaDesc = document.createElement("meta");
                metaDesc.name = "description";
                document.head.appendChild(metaDesc);
            }
            metaDesc.setAttribute("content", data.meta_description);
        }
        if (data.meta_keywords) {
            let metaKey = document.querySelector('meta[name="keywords"]');
            if (!metaKey) {
                metaKey = document.createElement("meta");
                metaKey.name = "keywords";
                document.head.appendChild(metaKey);
            }
            metaKey.setAttribute("content", data.meta_keywords);
        }

        // 2. Hero Pill Tagline
        const heroPillText = document.getElementById("heroPillText");
        if (heroPillText && data.hero_pill_text) {
            heroPillText.textContent = data.hero_pill_text;
        }

        // 3. Availability Badge
        const availabilityBadge = document.getElementById("heroAvailabilityBadge");
        const availabilityText = document.getElementById("heroAvailabilityText");
        if (availabilityBadge && availabilityText) {
            if (data.is_hiring_available) {
                availabilityText.textContent = data.availability_badge_text || "Available for Opportunities";
                availabilityBadge.style.display = "inline-flex";
            } else {
                availabilityBadge.style.display = "none";
            }
        }

        // 4. Hero Title (Prefix + Highlight)
        const heroTitlePrefix = document.getElementById("heroTitlePrefix");
        const heroTitleHighlight = document.getElementById("heroTitleHighlight");
        if (heroTitlePrefix && data.hero_title_prefix) {
            heroTitlePrefix.textContent = data.hero_title_prefix.endsWith(" ") 
                ? data.hero_title_prefix 
                : data.hero_title_prefix + " ";
        }
        if (heroTitleHighlight && data.hero_title_highlight) {
            heroTitleHighlight.textContent = data.hero_title_highlight;
        }

        // 5. Hero Description
        const heroDescription = document.getElementById("heroDescription");
        if (heroDescription && data.hero_description) {
            heroDescription.textContent = data.hero_description;
        }

        // 6. Hero Action Buttons
        const heroPrimaryBtn = document.getElementById("heroPrimaryBtn");
        if (heroPrimaryBtn && data.hero_primary_btn_text) {
            heroPrimaryBtn.textContent = data.hero_primary_btn_text;
            if (data.hero_primary_btn_url) heroPrimaryBtn.setAttribute("href", data.hero_primary_btn_url);
        }

        const heroSecondaryBtn = document.getElementById("heroSecondaryBtn");
        if (heroSecondaryBtn && data.hero_secondary_btn_text) {
            heroSecondaryBtn.textContent = data.hero_secondary_btn_text;
            if (data.hero_secondary_btn_url) heroSecondaryBtn.setAttribute("href", data.hero_secondary_btn_url);
        }

        // 8. Brand Name & Footer Brand
        if (data.full_name) {
            const brandName = document.querySelector(".brand-name");
            if (brandName) brandName.textContent = data.full_name;
            const footerBrandTitle = document.querySelector(".footer-brand h4");
            if (footerBrandTitle) footerBrandTitle.textContent = `${data.full_name} Portfolio`;
        }
        if (data.professional_title) {
            const brandTitle = document.querySelector(".brand-title");
            if (brandTitle) brandTitle.textContent = data.professional_title;
        }

        // 9. Contact Email Link
        if (data.contact_email) {
            const contactEmailLink = document.getElementById("contactEmailLink");
            if (contactEmailLink) {
                contactEmailLink.href = `mailto:${data.contact_email}`;
                contactEmailLink.textContent = data.contact_email;
            }
        }

    } catch (err) {
        console.error("Public settings error:", err);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    initializeSiteSettings();
    initializeProjects();
    initializeSkills();
    initializeCertifications();
    initializeExperience();
    initializeEducation();
    setupCareerTabs();
    initializeDesign();
    initializeUXUI();
    setupDesignTabs();
    initializeBlog();
    initializeBlogCatalog();
    initializeContactForm();
    initializeSocialLinks();
    initializePublicCVs();
    initializeMobileNavigation();

    // Certificate Modal handlers
    const closeCertBtn = document.getElementById("closePublicCertModalBtn");
    if (closeCertBtn) {
        closeCertBtn.addEventListener("click", closePublicCertModal);
    }

    const certModal = document.getElementById("publicCertModal");
    if (certModal) {
        certModal.addEventListener("click", (e) => {
            if (e.target === certModal) closePublicCertModal();
        });
    }

    // Design Modal handlers
    const closeDesignBtn = document.getElementById("closePublicDesignModalBtn");
    if (closeDesignBtn) {
        closeDesignBtn.addEventListener("click", closePublicDesignModal);
    }

    const designModal = document.getElementById("publicDesignModal");
    if (designModal) {
        designModal.addEventListener("click", (e) => {
            if (e.target === designModal) closePublicDesignModal();
        });
    }

    // UX/UI Modal handlers
    const closeCSBtn = document.getElementById("closePublicCSModalBtn");
    if (closeCSBtn) {
        closeCSBtn.addEventListener("click", closePublicCaseStudyModal);
    }

    const csModal = document.getElementById("publicCaseStudyModal");
    if (csModal) {
        csModal.addEventListener("click", (e) => {
            if (e.target === csModal) closePublicCaseStudyModal();
        });
    }

    // Blog Modal handlers
    const closeBlogBtn = document.getElementById("closePublicBlogModalBtn");
    if (closeBlogBtn) {
        closeBlogBtn.addEventListener("click", closePublicBlogModal);
    }

    const blogModal = document.getElementById("publicBlogModal");
    if (blogModal) {
        blogModal.addEventListener("click", (e) => {
            if (e.target === blogModal) closePublicBlogModal();
        });
    }

    const copyBtn = document.getElementById("copyCertIdBtn");
    if (copyBtn) {
        copyBtn.addEventListener("click", () => {
            const idText = document.getElementById("publicCertId")?.textContent;
            if (idText && idText !== "Unspecified / N/A") {
                navigator.clipboard.writeText(idText).then(() => {
                    const originalText = copyBtn.textContent;
                    copyBtn.textContent = "✓ Copied!";
                    setTimeout(() => { copyBtn.textContent = originalText; }, 2000);
                });
            }
        });
    }

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            if (certModal?.classList.contains("active")) closePublicCertModal();
            if (designModal?.classList.contains("active")) closePublicDesignModal();
            if (csModal?.classList.contains("active")) closePublicCaseStudyModal();
            if (blogModal?.classList.contains("active")) closePublicBlogModal();
            if (document.getElementById("cvPreviewModal")?.classList.contains("active")) closeCvPreview();
        }
    });

    const cvModalElem = document.getElementById("cvPreviewModal");
    if (cvModalElem) {
        cvModalElem.addEventListener("click", (e) => {
            if (e.target === cvModalElem) closeCvPreview();
        });
    }

    // Check URL params for direct certificate view link (e.g. ?cert=1)
    const urlParams = new URLSearchParams(window.location.search);
    const certParam = urlParams.get("cert");
    if (certParam) {
        setTimeout(() => {
            openPublicCertModal(certParam);
        }, 600);
    }

    // Check URL params for direct blog article link (e.g. ?article=slug)
    const articleParam = urlParams.get("article") || urlParams.get("blog");
    if (articleParam) {
        setTimeout(() => {
            openPublicBlogModal(articleParam);
        }, 600);
    }
});

// =========================================================
// TAILORED CV PROFILES & MODAL PREVIEW LOGIC
// =========================================================
const CV_PROFILES = {
    fullstack: {
        badge: "Software Engineering",
        title: "Full-Stack Software Engineer CV",
        role: "Senior Full-Stack Engineer / Backend Architect",
        desc: "Tailored specifically for full-stack engineering and backend systems roles. Demonstrates production-grade mastery of Python, FastAPI, asynchronous microservices, PostgreSQL database schema modeling, connection pooling, Docker, and frontend integration.",
        bullets: [
            "Asynchronous microservice architectures and RESTful OpenAPI design",
            "PostgreSQL schema normalization, indexing, connection pooling, and SQLAlchemy",
            "Multi-stage Docker builds, automated CI/CD pipelines, and health observability",
            "Secure authentication systems using Argon2id, JWT tokens, and RBAC authorization",
            "Clean Vanilla JavaScript (ES6+) and modern responsive interface integration"
        ],
        fileUrl: "/uploads/documents/cv_fullstack_engineer.pdf",
        fileName: "Design_Lyricist_FullStack_Engineer_CV.pdf"
    },
    uiux: {
        badge: "Product Design",
        title: "UI / UX & Product Designer CV",
        role: "Senior UI/UX & Product Experience Designer",
        desc: "Designed for product design, interaction architecture, and design system leadership roles. Highlights deep competency in human-centered design, interactive prototyping in Figma, design tokens, and user research.",
        bullets: [
            "Enterprise design systems, reusable component tokens, and style guidelines",
            "Wireframing, user persona mapping, and high-fidelity interactive Figma prototypes",
            "Usability testing, heuristic evaluations, and accessibility compliance (WCAG 2.1)",
            "Seamless developer handoff with design tokens and responsive CSS integration"
        ],
        fileUrl: "/uploads/documents/cv_uiux_designer.pdf",
        fileName: "Design_Lyricist_UIUX_Designer_CV.pdf"
    },
    cloud: {
        badge: "Cloud & DevOps",
        title: "Cloud Solutions Architect & DevOps CV",
        role: "Senior Cloud Architect & DevOps Specialist",
        desc: "Formatted for cloud architecture, DevOps, and infrastructure engineering positions. Showcases mastery of scalable AWS virtual networks, container orchestration, and zero-trust security.",
        bullets: [
            "AWS VPC design, multi-AZ subnets, NAT gateways, and IAM least-privilege policies",
            "Container orchestration with Docker, Kubernetes, and automated deployment pipelines",
            "CloudFront CDN edge caching, SSL/TLS termination, and HTTP/2 performance tuning",
            "Automated infrastructure disaster recovery, database failover, and metrics tracking"
        ],
        fileUrl: "/uploads/documents/cv_cloud_architect.pdf",
        fileName: "Design_Lyricist_Cloud_Architect_CV.pdf"
    },
    cyber: {
        badge: "Security & Defense",
        title: "Cybersecurity & Network Specialist CV",
        role: "Cybersecurity Engineer & SOC Specialist",
        desc: "Tailored for information security, SOC triage, network administration, and vulnerability assessment roles. Focuses on OWASP Top 10 hardening, network packet analysis, and defense-in-depth Linux security.",
        bullets: [
            "Vulnerability assessments, security scanning, and CVE exposure remediation",
            "OWASP Top 10 defense, SQLi/XSS prevention, and strict HTTP security headers",
            "Deep packet inspection with Wireshark, traffic anomaly detection, and Nmap audits",
            "Linux server hardening, stateful firewalls (iptables/UFW), and audit logging"
        ],
        fileUrl: "/uploads/documents/cv_cybersecurity_specialist.pdf",
        fileName: "Design_Lyricist_Cybersecurity_CV.pdf"
    },
    graphic: {
        badge: "Graphic & Brand",
        title: "Graphic Designer & Creative Lead CV",
        role: "Senior Graphic Designer & Brand Identity Lead",
        desc: "Curated for creative leadership, visual branding, and digital media design roles. Emphasizes extensive commercial branding, vector artwork, typography, and portfolio showcases on Behance (graphicmx911).",
        bullets: [
            "Comprehensive brand identity guidelines, vector marks, and visual system design",
            "High-precision digital illustration, marketing collateral, and publication layouts",
            "Extensive commercial portfolio on Behance (graphicmx911)",
            "Mastery of Adobe Illustrator, Photoshop, and digital vector composition"
        ],
        fileUrl: "/uploads/documents/cv_graphic_designer.pdf",
        fileName: "Design_Lyricist_Graphic_Designer_CV.pdf"
    }
};

let publicCVsList = [];

async function initializePublicCVs() {
    const grid = document.getElementById("cvCardsGrid");
    if (!grid) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/cvs/public`);
        if (!response.ok) throw new Error("Failed to fetch public CVs");
        const data = await response.json();

        if (Array.isArray(data) && data.length > 0) {
            publicCVsList = data;
            renderPublicCVCards(data);
            return;
        }
    } catch (err) {
        console.warn("Public CV fetch failed, fallback to static site data:", err);
    }

    // Static fallback for GitHub Pages & offline mode
    const staticData = await getStaticSiteData();
    if (staticData && Array.isArray(staticData.cv_documents) && staticData.cv_documents.length > 0) {
        publicCVsList = staticData.cv_documents;
        renderPublicCVCards(publicCVsList);
    }
}

function renderPublicCVCards(cvs) {
    const grid = document.getElementById("cvCardsGrid");
    if (!grid) return;

    grid.innerHTML = cvs.map(cv => {
        let tagsArr = [];
        if (Array.isArray(cv.tags)) {
            tagsArr = cv.tags;
        } else if (typeof cv.tags === "string" && cv.tags.trim()) {
            try {
                const parsed = JSON.parse(cv.tags);
                if (Array.isArray(parsed)) tagsArr = parsed;
                else tagsArr = cv.tags.split(",").map(t => t.trim()).filter(Boolean);
            } catch {
                tagsArr = cv.tags.split(",").map(t => t.trim()).filter(Boolean);
            }
        }

        const tagsHtml = tagsArr.map(tag => `<span class="cv-tag">${escapeHtml(tag)}</span>`).join("");
        const icon = cv.icon || "📄";
        const fileUrl = resolveAssetUrl(cv.file_url) || "#";
        const fileName = cv.file_name || `${(cv.role_key || "CV")}.pdf`;
        const roleDetail = cv.target_role ? escapeHtml(cv.target_role) : "Specialized Document";
        const formatBadge = (cv.file_format || "PDF").toUpperCase();

        return `
            <div class="cv-card" data-cv-id="${cv.id || cv.role_key}">
                <div class="cv-card-header">
                    <div class="cv-card-icon-wrap">${escapeHtml(icon)}</div>
                    <div class="cv-card-meta">
                        <span class="cv-badge">${escapeHtml(cv.category || "Professional")}</span>
                        <h3 class="cv-card-title">${escapeHtml(cv.title)}</h3>
                    </div>
                </div>
                <p class="cv-card-desc">
                    ${escapeHtml(cv.description || "")}
                </p>
                <div class="cv-card-tags">
                    ${tagsHtml}
                </div>
                <div class="cv-card-footer">
                    <div class="cv-file-info">
                        <span class="cv-file-format">${escapeHtml(formatBadge)}</span>
                        <span class="cv-file-detail">${roleDetail}</span>
                    </div>
                    <div class="cv-card-actions">
                        <a href="${encodeURI(fileUrl)}" download="${escapeHtml(fileName)}" class="btn btn-primary btn-sm">
                            <span class="btn-icon">📥</span> Download CV
                        </a>
                        <button type="button" class="btn btn-secondary btn-sm" onclick="openCvPreview('${cv.id || cv.role_key}')">
                            Preview
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join("");
}

function openCvPreview(idOrKey) {
    let profile = null;

    // Check dynamic CV list first
    if (publicCVsList && publicCVsList.length > 0) {
        const found = publicCVsList.find(c => String(c.id) === String(idOrKey) || c.role_key === idOrKey);
        if (found) {
            let rawBullets = found.bullets || found.key_highlights || [];
            let bullets = [];
            if (Array.isArray(rawBullets)) {
                bullets = rawBullets;
            } else if (typeof rawBullets === "string" && rawBullets.trim()) {
                try {
                    const parsed = JSON.parse(rawBullets);
                    if (Array.isArray(parsed)) bullets = parsed;
                    else bullets = rawBullets.split("\n").map(b => b.trim()).filter(Boolean);
                } catch {
                    bullets = rawBullets.split("\n").map(b => b.trim()).filter(Boolean);
                }
            }

            profile = {
                badge: found.category || "Professional",
                title: found.title,
                role: found.target_role || found.title,
                desc: found.description || "",
                bullets: bullets.length > 0 ? bullets : [
                    "Specialized curriculum vitae engineered for target role evaluation",
                    "Includes production projects, verified credentials, and tech stack proficiencies",
                    "Comprehensive achievement metrics and architectural leadership"
                ],
                fileUrl: resolveAssetUrl(found.file_url) || "#",
                fileName: found.file_name || `${(found.role_key || "CV")}.pdf`
            };
        }
    }

    // Fallback to static CV_PROFILES
    if (!profile && CV_PROFILES[idOrKey]) {
        profile = CV_PROFILES[idOrKey];
    }

    if (!profile) return;

    const modal = document.getElementById("cvPreviewModal");
    if (!modal) return;

    const badgeEl = document.getElementById("cvModalBadge");
    const titleEl = document.getElementById("cvModalTitle");
    const subtitleEl = document.getElementById("cvModalSubtitle");
    const roleEl = document.getElementById("cvModalRole");
    const descEl = document.getElementById("cvModalDesc");
    const bulletsList = document.getElementById("cvModalBullets");
    const dlBtn = document.getElementById("cvModalDownloadBtn");

    if (badgeEl) badgeEl.textContent = profile.badge;
    if (titleEl) titleEl.textContent = profile.title;
    if (subtitleEl) subtitleEl.textContent = profile.role;
    if (roleEl) roleEl.textContent = profile.role;
    if (descEl) descEl.textContent = profile.desc;

    if (bulletsList) {
        bulletsList.innerHTML = profile.bullets.map(b => `<li>${escapeHtml(b)}</li>`).join("");
    }

    if (dlBtn) {
        dlBtn.href = profile.fileUrl;
        dlBtn.setAttribute("download", profile.fileName);
    }

    modal.classList.add("active");
    document.body.style.overflow = "hidden";
}

function closeCvPreview() {
    const modal = document.getElementById("cvPreviewModal");
    if (modal) {
        modal.classList.remove("active");
        document.body.style.overflow = "";
    }
}

// =========================================================
// MOBILE NAVIGATION CONTROLLER
// =========================================================
function initializeMobileNavigation() {
    const toggleBtn = document.getElementById("mobileMenuToggle");
    const navMenu = document.getElementById("publicNavMenu") || document.querySelector(".nav-menu");
    if (!toggleBtn || !navMenu) return;

    toggleBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        navMenu.classList.toggle("open");
        const isOpen = navMenu.classList.contains("open");
        toggleBtn.setAttribute("aria-expanded", isOpen);
        toggleBtn.innerHTML = isOpen
            ? `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`
            : `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>`;
    });

    // Close mobile menu when clicking any nav item link
    navMenu.querySelectorAll(".nav-item-link").forEach(link => {
        link.addEventListener("click", () => {
            if (navMenu.classList.contains("open")) {
                navMenu.classList.remove("open");
                toggleBtn.setAttribute("aria-expanded", "false");
                toggleBtn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>`;
            }
        });
    });

    // Close when clicking outside
    document.addEventListener("click", (e) => {
        if (navMenu.classList.contains("open") && !navMenu.contains(e.target) && !toggleBtn.contains(e.target)) {
            navMenu.classList.remove("open");
            toggleBtn.setAttribute("aria-expanded", "false");
            toggleBtn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>`;
        }
    });
}