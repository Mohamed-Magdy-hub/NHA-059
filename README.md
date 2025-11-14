# URL Shortener Application

A minimal, production-ready URL Shortener built with Node.js, Express and SQLite.

Features:

- POST /api/shorten — create a short link for a provided URL
- GET /:shortCode — redirect to original URL and count visits
- GET /api/urls — list all shortened URLs and stats
- Simple, Bootstrap-based frontend at the root path

This project follows a simple monolithic structure with a lightweight SQLite database and minimal dependencies.

## 🚀 CI/CD & Deployment

This project includes a complete CI/CD pipeline with Jenkins and Kubernetes deployment manifests.

**See [JENKINS.md](JENKINS.md) for complete CI/CD setup instructions.**

- ✅ Declarative Jenkins Pipeline (Jenkinsfile)
- ✅ Docker multi-stage production build
- ✅ Kubernetes manifests (k8s/ directory)
- ✅ Automated testing, building, and deployment
- ✅ Zero-downtime rolling updates

Prerequisites

- Node.js 16+ (or use Docker)
- npm

Quick start (local)

1. Install dependencies:
   npm install

2. (Optional) Copy environment variables:
   cp .env.example .env
   Edit .env as needed (DATABASE_FILE, PORT, BASE_URL)

3. Start the server:
   npm start

4. Open the frontend in your browser:
   http://localhost:3000

API Usage

1. Shorten a URL
   POST /api/shorten
   Request body (JSON):
   {
   "url": "https://example.com"
   }

Response (201 Created):
{
"id": 1,
"shortCode": "abc123X",
"shortUrl": "http://localhost:3000/abc123X",
"originalUrl": "https://example.com",
"visits": 0,
"createdAt": "2025-11-14 15:00:00"
}

2. Redirect
   GET /:shortCode

- Example: GET /abc123X
- Responds with 302 redirect to the original URL and increments visits.

3. List all URLs
   GET /api/urls

- Returns JSON list of shortened URLs, visits, and metadata.

Database

- SQLite database file: ./data/urls.db (created on first run)
- Schema located in src/db/schema.sql:

CREATE TABLE IF NOT EXISTS urls (
id INTEGER PRIMARY KEY AUTOINCREMENT,
original_url TEXT NOT NULL,
short_code TEXT NOT NULL UNIQUE,
visits INTEGER NOT NULL DEFAULT 0,
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

Docker

Build:
docker build -t url-shortener:latest .

Run:
docker run -p 3000:3000 -e BASE_URL=http://localhost:3000 -v $(pwd)/data:/app/data url-shortener:latest

Notes

- The application uses a simple base62-like short-code generator and retries on collisions.
- No authentication is included by design.
- Keep the DB file persisted (mount ./data) when running in Docker to retain shortened links.

Folder explanation

- src/: server source code
  - routes/urls.js: API endpoints
  - db/: sqlite helper and schema
  - helpers/: short code generator and URL validator
- public/: minimal frontend (index.html + app.js)
- data/: runtime SQLite DB file (urls.db)
- Dockerfile: multi-stage production-ready image

If you want me to push these files to your repository or open a PR that adds them, tell me which branch to target and I will create the PR.
