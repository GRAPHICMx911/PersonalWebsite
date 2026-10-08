import os
from pathlib import Path
from datetime import datetime, timezone, timedelta
from sqlalchemy import select
from backend.app.database import engine, SessionLocal, Base
from backend.app.models.blog import BlogPost

# Ensure upload directory exists
BLOG_DIR = Path("frontend/uploads/blog")
BLOG_DIR.mkdir(parents=True, exist_ok=True)

# Generate attractive SVG images adhering to official 5-color palette
# (#063F60 Navy, #087DD8 Bright Blue, #6FB7E1 Light Blue, #C4E0E1 Aqua, #E8EEEE Light BG)
svg_assets = {
    "zero_trust_aws.png": """<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450" fill="none">
  <rect width="800" height="450" fill="#063F60"/>
  <circle cx="400" cy="225" r="180" stroke="#087DD8" stroke-width="2" stroke-dasharray="8 8" opacity="0.4"/>
  <circle cx="400" cy="225" r="120" stroke="#6FB7E1" stroke-width="2" opacity="0.6"/>
  <rect x="350" y="175" width="100" height="100" rx="18" fill="#087DD8"/>
  <path d="M400 195 L400 240 M380 215 L400 195 L420 215" stroke="#E8EEEE" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="400" cy="245" r="6" fill="#C4E0E1"/>
  <text x="400" y="325" text-anchor="middle" fill="#E8EEEE" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="700">Zero-Trust Cloud Architecture</text>
  <text x="400" y="355" text-anchor="middle" fill="#6FB7E1" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="600">AWS Defense-in-Depth &amp; Cryptographic Identity</text>
</svg>""",
    "fastapi_async_architecture.png": """<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450" fill="none">
  <rect width="800" height="450" fill="#063F60"/>
  <rect x="180" y="160" width="120" height="130" rx="12" fill="#E8EEEE" stroke="#C4E0E1" stroke-width="2"/>
  <text x="240" y="215" text-anchor="middle" fill="#063F60" font-family="system-ui, sans-serif" font-size="16" font-weight="800">FastAPI</text>
  <text x="240" y="240" text-anchor="middle" fill="#087DD8" font-family="system-ui, sans-serif" font-size="12" font-weight="600">Async Loop</text>
  
  <path d="M315 225 L385 225" stroke="#6FB7E1" stroke-width="4" stroke-linecap="round"/>
  <polygon points="380,218 395,225 380,232" fill="#6FB7E1"/>
  
  <rect x="400" y="160" width="120" height="130" rx="12" fill="#087DD8"/>
  <text x="460" y="215" text-anchor="middle" fill="#FFFFFF" font-family="system-ui, sans-serif" font-size="16" font-weight="800">Redis</text>
  <text x="460" y="240" text-anchor="middle" fill="#C4E0E1" font-family="system-ui, sans-serif" font-size="12" font-weight="600">Cache Layer</text>
  
  <path d="M535 225 L605 225" stroke="#6FB7E1" stroke-width="4" stroke-linecap="round"/>
  <polygon points="600,218 615,225 600,232" fill="#6FB7E1"/>

  <rect x="620" y="160" width="120" height="130" rx="12" fill="#E8EEEE" stroke="#C4E0E1" stroke-width="2"/>
  <text x="680" y="215" text-anchor="middle" fill="#063F60" font-family="system-ui, sans-serif" font-size="16" font-weight="800">PostgreSQL</text>
  <text x="680" y="240" text-anchor="middle" fill="#087DD8" font-family="system-ui, sans-serif" font-size="12" font-weight="600">SQLAlchemy 2</text>
  
  <text x="400" y="340" text-anchor="middle" fill="#E8EEEE" font-family="system-ui, sans-serif" font-size="22" font-weight="700">High-Concurrency Microservices</text>
  <text x="400" y="370" text-anchor="middle" fill="#6FB7E1" font-family="system-ui, sans-serif" font-size="14" font-weight="600">Sub-10ms Latency &amp; Non-Blocking I/O</text>
</svg>""",
    "soc_incident_triage.png": """<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450" fill="none">
  <rect width="800" height="450" fill="#063F60"/>
  <rect x="220" y="110" width="360" height="200" rx="14" fill="#072b42" stroke="#087DD8" stroke-width="2"/>
  <rect x="240" y="135" width="320" height="28" rx="6" fill="#063F60" stroke="#6FB7E1" stroke-width="1"/>
  <circle cx="260" cy="149" r="6" fill="#087DD8"/>
  <text x="280" y="154" fill="#E8EEEE" font-family="monospace" font-size="12">ALERT #9821: Zero-Trust Perimeter Anomaly</text>
  
  <rect x="240" y="175" width="320" height="28" rx="6" fill="#063F60" stroke="#6FB7E1" stroke-width="1"/>
  <circle cx="260" cy="189" r="6" fill="#6FB7E1"/>
  <text x="280" y="194" fill="#E8EEEE" font-family="monospace" font-size="12">AUTOMATION: Token Revocation In-Progress</text>
  
  <rect x="240" y="215" width="320" height="28" rx="6" fill="#063F60" stroke="#6FB7E1" stroke-width="1"/>
  <circle cx="260" cy="229" r="6" fill="#C4E0E1"/>
  <text x="280" y="234" fill="#E8EEEE" font-family="monospace" font-size="12">STATUS: Threat Neutralized in 1.4s</text>

  <text x="400" y="350" text-anchor="middle" fill="#E8EEEE" font-family="system-ui, sans-serif" font-size="22" font-weight="700">Modern SOC Incident Triage</text>
  <text x="400" y="380" text-anchor="middle" fill="#6FB7E1" font-family="system-ui, sans-serif" font-size="14" font-weight="600">Cognitive Ergonomics &amp; MTTD Reduction</text>
</svg>""",
    "design_systems_enterprise.png": """<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450" fill="none">
  <rect width="800" height="450" fill="#063F60"/>
  <rect x="230" y="120" width="80" height="80" rx="12" fill="#063F60" stroke="#6FB7E1" stroke-width="2"/>
  <rect x="330" y="120" width="80" height="80" rx="12" fill="#087DD8"/>
  <rect x="430" y="120" width="80" height="80" rx="12" fill="#6FB7E1"/>
  <rect x="530" y="120" width="80" height="80" rx="12" fill="#C4E0E1"/>
  
  <rect x="230" y="220" width="380" height="45" rx="8" fill="#E8EEEE" stroke="#C4E0E1" stroke-width="1.5"/>
  <rect x="245" y="232" width="120" height="20" rx="4" fill="#087DD8"/>
  <rect x="380" y="232" width="100" height="20" rx="4" fill="#6FB7E1"/>
  <rect x="495" y="232" width="100" height="20" rx="4" fill="#063F60"/>

  <text x="400" y="325" text-anchor="middle" fill="#E8EEEE" font-family="system-ui, sans-serif" font-size="22" font-weight="700">Enterprise Design Systems</text>
  <text x="400" y="355" text-anchor="middle" fill="#6FB7E1" font-family="system-ui, sans-serif" font-size="14" font-weight="600">Cognitive Ergonomics &amp; Token Architecture</text>
</svg>"""
}

for filename, content in svg_assets.items():
    file_path = BLOG_DIR / filename
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"[OK] Generated asset: {file_path}")

# Create database tables
Base.metadata.create_all(bind=engine)
print("[OK] Database schema verified and updated.")

# Seed initial blog posts
db = SessionLocal()
now = datetime.now(timezone.utc)

posts = [
    {
        "title": "Zero-Trust Cloud Architecture: Defense-in-Depth on AWS & Kubernetes",
        "slug": "zero-trust-cloud-architecture-aws-defense-in-depth",
        "subtitle": "Eliminating implicit trust across VPC networks, IAM policy boundaries, and service meshes",
        "category": "Cybersecurity & Cloud",
        "reading_time_minutes": 7,
        "tags": "AWS, Zero-Trust, IAM, Kubernetes, Security, Encryption",
        "excerpt": "A practical blueprint for implementing zero-trust network access, strict cryptographic mTLS identity, and least-privilege IAM controls across distributed cloud workloads.",
        "cover_image_url": "/uploads/blog/zero_trust_aws.png",
        "author": "Design Lyricist",
        "views_count": 242,
        "is_featured": True,
        "is_published": True,
        "published_at": now - timedelta(days=12),
        "content": """<h3>The Paradigm Shift: From Castle-and-Moat to Zero-Trust</h3>
<p>For decades, enterprise security relied on perimeter defense: everything inside the corporate firewall or VPC was trusted, while everything outside was viewed as untrusted. However, sophisticated modern cyber attacks demonstrate that once an adversary breaches the perimeter, lateral movement is trivial.</p>

<p><strong>Zero-Trust Architecture (ZTA)</strong> replaces this model with a fundamental principle: <em>"Never trust, always verify."</em> Every request—whether originating from an internal pod in an EKS cluster or an external client—must be authenticated, authorized, and cryptographically verified.</p>

<h3>Core Pillars of Cloud Zero-Trust</h3>
<ul>
  <li><strong>Cryptographic Workload Identity:</strong> Eliminating hard-coded API credentials in favor of short-lived SPIFFE/SPIRE x509 certificates and AWS IAM Roles for Service Accounts (IRSA).</li>
  <li><strong>Mutual TLS (mTLS) Everywhere:</strong> Encrypting and validating all inter-service communication within the service mesh (Envoy / Istio) with automated cert rotation.</li>
  <li><strong>Continuous Risk-Based Evaluation:</strong> Assessing request context, device posture, and geolocation before granting access to sensitive data endpoints.</li>
  <li><strong>Micro-Segmentation:</strong> Applying strict Kubernetes NetworkPolicies and AWS Security Groups that drop all egress/ingress traffic by default.</li>
</ul>

<h3>Implementation Strategy: AWS IAM &amp; Service Mesh</h3>
<p>To enforce least-privilege boundaries, IAM policies must be dynamically scoped using session tags and resource conditions. Coupling AWS IAM with an ingress gateway running Envoy sidecars ensures that application developers never need to implement authentication logic inside microservice controllers.</p>

<pre><code class="language-yaml"># Example Kubernetes NetworkPolicy Enforcing Deny-All Default
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: production
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
</code></pre>

<h3>Conclusion</h3>
<p>Adopting Zero-Trust is an ongoing architectural posture rather than a one-time product installation. By enforcing granular identity verification and micro-segmentation, organizations drastically shrink their blast radius and neutralize lateral threat progression.</p>"""
    },
    {
        "title": "High-Throughput Asynchronous Microservices with FastAPI, SQLAlchemy 2.0 & Redis",
        "slug": "high-throughput-async-microservices-fastapi-sqlalchemy-redis",
        "subtitle": "Architecting sub-10ms response latencies and connection pooling under heavy concurrent loads",
        "category": "Software Engineering",
        "reading_time_minutes": 6,
        "tags": "Python, FastAPI, SQLAlchemy, Redis, Concurrency, Microservices",
        "excerpt": "Deep architectural insights into asynchronous event loops, PostgreSQL async pooling, and multi-tier cache strategies for enterprise web APIs.",
        "cover_image_url": "/uploads/blog/fastapi_async_architecture.png",
        "author": "Design Lyricist",
        "views_count": 318,
        "is_featured": True,
        "is_published": True,
        "published_at": now - timedelta(days=8),
        "content": """<h3>Scaling Python Beyond the GIL</h3>
<p>Python has historically been stereotyped as slower for high-concurrency network I/O. However, modern asynchronous programming primitives (<code>asyncio</code>, <code>uvicorn</code>, and <code>FastAPI</code>) combined with non-blocking database drivers have transformed Python into a premier choice for high-throughput enterprise microservices.</p>

<h3>Connection Pooling Optimization in SQLAlchemy 2.0</h3>
<p>When serving thousands of concurrent requests, naive database connections will quickly exhaust PostgreSQL connection limits. SQLAlchemy 2.0's <code>AsyncEngine</code> with <code>asyncpg</code> enables connection multiplexing with minimal memory overhead.</p>

<pre><code class="language-python"># High-concurrency async engine configuration
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

engine = create_async_engine(
    "postgresql+asyncpg://user:pass@db:5432/platform",
    pool_size=20,
    max_overflow=40,
    pool_pre_ping=True,
    pool_recycle=1800,
)

AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)
</code></pre>

<h3>Multi-Tier Caching Architecture</h3>
<p>To achieve sub-10ms latency for read-heavy operations, implement a two-tier cache pattern:</p>
<ol>
  <li><strong>L1 In-Memory Cache:</strong> Extremely fast LRU cache for hot static metadata (e.g., system settings, category lists).</li>
  <li><strong>L2 Distributed Redis Cache:</strong> High-speed shared Redis cluster with proactive cache invalidation using key-space notifications or event pub/sub.</li>
</ol>

<h3>Benchmarking Results</h3>
<p>Under simulated load tests with 10,000 concurrent virtual users, our FastAPI microservice architecture maintained a p99 latency of 8.4ms with zero connection dropouts, demonstrating that thoughtful async resource management is key to enterprise scale.</p>"""
    },
    {
        "title": "Modern SOC Incident Triage: Reducing False Positives & Mean Time to Detect",
        "slug": "modern-soc-incident-triage-reducing-false-positives-mttd",
        "subtitle": "Automated playbook execution, threat telemetry aggregation, and cognitive ergonomics for analysts",
        "category": "Cybersecurity",
        "reading_time_minutes": 5,
        "tags": "SOC, Threat Hunting, SIEM, Incident Response, Automation",
        "excerpt": "How automated playbook triggers, normalized telemetry graphs, and human-centered dashboard design cut alert fatigue and accelerated incident response.",
        "cover_image_url": "/uploads/blog/soc_incident_triage.png",
        "author": "Design Lyricist",
        "views_count": 185,
        "is_featured": False,
        "is_published": True,
        "published_at": now - timedelta(days=5),
        "content": """<h3>The Human Challenge in Security Operations</h3>
<p>In modern Security Operations Centers (SOCs), the bottleneck is rarely lack of telemetry—it is alert fatigue. Tier-1 security analysts are flooded with thousands of daily notifications from disparate SIEMs, EDRs, and cloud logs, leading to burnout and missed high-severity indicators of compromise (IoCs).</p>

<h3>Three Pillars of Accelerated Triage</h3>
<ul>
  <li><strong>Normalized Data Pipeline:</strong> Ingesting logs into a unified Open Cybersecurity Schema Framework (OCSF) to eliminate syntax translation friction.</li>
  <li><strong>Contextual Threat Graphing:</strong> Correlating alert entities (IPs, process hashes, user principals) into visual attack trees rather than isolated tabular rows.</li>
  <li><strong>Automated SOAR Playbooks:</strong> Executing instant initial containment steps (quarantining compromised hosts, revoking OAuth refresh tokens) in the first 2 seconds of detection.</li>
</ul>

<h3>Measurable Impact</h3>
<p>By automating tier-1 triage steps and displaying prioritized alert clusters, SOC teams observed a <strong>48% reduction in Mean Time to Detect (MTTD)</strong> and a <strong>65% reduction in analyst clicks</strong> during incident investigation.</p>"""
    },
    {
        "title": "Enterprise Design Systems: Bridging Cognitive Ergonomics and Component Libraries",
        "slug": "enterprise-design-systems-cognitive-ergonomics-component-libraries",
        "subtitle": "Creating coherent, accessible, and scalable UI architectures across complex multi-platform products",
        "category": "UX/UI Design & Systems",
        "reading_time_minutes": 5,
        "tags": "Design Systems, UX/UI, Accessibility, WCAG, Design Tokens",
        "excerpt": "A design-engineering methodology for building enterprise design tokens, ensuring WCAG 2.1 AA accessibility, and maintaining visual consistency across apps.",
        "cover_image_url": "/uploads/blog/design_systems_enterprise.png",
        "author": "Design Lyricist",
        "views_count": 149,
        "is_featured": False,
        "is_published": True,
        "published_at": now - timedelta(days=2),
        "content": """<h3>Design Systems as Engineering Infrastructure</h3>
<p>A true design system is not just a Figma component sticker sheet; it is living software infrastructure that synchronizes brand principles, ergonomic guidelines, and code tokens between designers and developers.</p>

<h3>Token Architecture</h3>
<p>Design tokens represent the atomic values of a digital brand: color palettes, typography scales, border radii, and spatial grids. By structuring tokens into three distinct tiers (Global, Semantic, Component), multi-brand themes can be updated across entire product suites with zero breaking code changes.</p>

<pre><code class="language-css">/* Centralized Semantic Tokens */
:root {
  --color-primary-dark: #063F60;
  --color-primary-blue: #087DD8;
  --color-primary-light: #6FB7E1;
  --color-secondary-light: #C4E0E1;
  --color-background: #E8EEEE;
}
</code></pre>

<h3>Accessibility &amp; Cognitive Ergonomics</h3>
<p>Ensuring minimum 4.5:1 contrast ratios across all text elements (WCAG 2.1 AA), providing unambiguous focus indicators for keyboard navigation, and maintaining spatial predictability reduces cognitive friction and empowers users of all abilities.</p>"""
    }
]

for p in posts:
    existing = db.scalars(select(BlogPost).where(BlogPost.slug == p["slug"])).first()
    if not existing:
        post_obj = BlogPost(**p)
        db.add(post_obj)
        print(f"[OK] Added blog post: {p['title']}")
    else:
        print(f"[EXISTS] Blog post already present: {p['title']}")

db.commit()
db.close()
print("[OK] Blog seeding complete!")
