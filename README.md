# ApplyTrack

ApplyTrack is a full-stack job application tracker for keeping a job search organized. It brings application details, progress, notes, and interview dates into one private workspace.

> **Milestone MVP:** React + Vite frontend, Express REST API, MongoDB Atlas with Mongoose, JWT authentication, and user-scoped application data.

## Problem statement

Job seekers often spread company names, links, follow-ups, and interview dates across spreadsheets, email, and notes. ApplyTrack provides one dashboard to record each opportunity and quickly see what needs attention.

## Features

- Register and sign in with email and password; passwords are bcrypt-hashed and API routes use signed JWTs.
- Private applications: each read, edit, and delete is scoped to the signed-in user's ID.
- Dashboard totals for all five statuses: Applied, Assessment, Interview, Selected, and Rejected.
- Create, view, edit, and delete applications with company, role, location, job type, dates, status, description, job link, and notes.
- Search by company or role; filter by status and job type; sort by newest or oldest.
- Upcoming interview list and delete confirmation.
- Responsive dashboard, accessible form labels, validation, loading states, empty states, error feedback, and success notifications.
- Health endpoint reports the actual MongoDB connection state; the API process can start when MongoDB is unavailable.

## Tech stack

| Area | Technology |
|---|---|
| Frontend | React, Vite, JavaScript, CSS |
| Backend | Node.js, Express |
| Database | MongoDB Atlas, Mongoose |
| Authentication | bcryptjs, JSON Web Tokens |
| Hosting | Vercel (frontend), Render (backend) |

## Folder structure

```text
ApplyTrack/
├── backend/
│   ├── config/db.js
│   ├── middleware/auth.js
│   ├── models/                  # User and Application
│   ├── routes/                  # Authentication, application, and interview APIs
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── src/                     # React app, styles, centralized API client
│   ├── .env.example
│   ├── vercel.json
│   └── package.json
├── .gitignore
└── README.md
```

## Run locally

### Requirements

- Node.js 20.19+ or 22.12+ (required by the current Vite release)
- npm
- A MongoDB Atlas cluster, or another MongoDB connection string

### 1. Configure the backend

Run these commands from the repository root.

```powershell
cd backend
npm install
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
```

Open `backend\.env` and set:

```dotenv
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<database-user>:<url-encoded-password>@<cluster-host>/<database-name>?retryWrites=true&w=majority
JWT_SECRET=<a-long-random-secret>
CLIENT_URL=http://localhost:5173
```

Use your Atlas **database user**, not your Atlas website login. URL-encode reserved characters in the username or password (for example `@` becomes `%40` and `#` becomes `%23`); a raw `@` or `#` can prevent the URI from identifying the correct database host. Generate a signing secret with `node -p "require('node:crypto').randomBytes(48).toString('hex')"` and keep it only in `.env`; `.env` is ignored by Git.

Start the backend in one terminal:

```powershell
npm run dev
```

The local API listens on port `5000`. If Atlas is unavailable, the server still starts and `/api/health` reports `database: "disconnected"` rather than claiming success.

### 2. Configure and run the frontend

In another terminal:

```powershell
cd frontend
npm install
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
npm run dev
```

Open the Vite URL (normally `http://localhost:5173`). `VITE_API_URL` is optional: in development the frontend defaults to `http://localhost:5000/api`, and in production it defaults to the deployed backend. If configured, it may be either the backend origin or the backend origin with `/api`; the frontend normalizes it to exactly one `/api` path. A localhost URL is ignored in production to prevent a local development setting from being baked into the deployed app.

### 3. Build checks

```powershell
cd frontend
npm run lint
npm run build
```

## Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `PORT` | Backend | Local port; defaults to `5000`. Render supplies its own port. |
| `NODE_ENV` | Backend | Set to `production` on Render. |
| `MONGO_URI` | Backend | MongoDB connection string. Never commit or share the real value. |
| `JWT_SECRET` | Backend | Secret used to sign access tokens. Use a unique random value. |
| `CLIENT_URL` | Backend | Allowed frontend origin; multiple origins can be comma-separated. |
| `VITE_API_URL` | Frontend | API base URL, including `/api`. |

Example frontend deployment value: `https://<your-render-service>.onrender.com/api`.

## API

JSON errors have a `message` field. Protected endpoints require `Authorization: Bearer <token>`. Application endpoints only return or modify records belonging to that token's user.

| Method | Path | Access | Purpose |
|---|---|---|---|
| `GET` | `/api/health` | Public | API and MongoDB state; HTTP 503 when DB is disconnected |
| `POST` | `/api/auth/register` | Public | Create account; returns token and safe user profile |
| `POST` | `/api/auth/login` | Public | Sign in; returns token and safe user profile |
| `GET` | `/api/auth/me` | Protected | Get current user's safe profile |
| `GET` | `/api/applications` | Protected | List user's applications; optional `search`, `status`, `jobType`, and `sort` query parameters |
| `POST` | `/api/applications` | Protected | Create application |
| `GET` | `/api/applications/:id` | Protected | Get one of the user's applications |
| `PUT` | `/api/applications/:id` | Protected | Update one of the user's applications |
| `DELETE` | `/api/applications/:id` | Protected | Delete one of the user's applications |
| `GET` | `/api/interviews` | Protected | List the signed-in user's scheduled interviews |
| `GET` | `/api/interviews/:id` | Protected | Get a scheduled interview belonging to the signed-in user |

Application fields: `companyName`, `jobRole`, `location`, `jobType`, `applicationDate`, `status`, `jobDescription`, `jobLink`, `interviewDate`, and `notes`. Status values are `Applied`, `Assessment`, `Interview`, `Selected`, and `Rejected`.

The API exposes three user-facing resources: accounts (`/api/auth`), applications (`/api/applications`), and interviews (`/api/interviews`). Interviews are backed by the application's optional `interviewDate`, so there is one source of truth; schedule or remove an interview by creating or updating the application.

## MongoDB Atlas troubleshooting

If `/api/health` reports a disconnected database, verify these settings without sharing your connection string:

```powershell
Resolve-DnsName -Type SRV _mongodb._tcp.your-cluster.mongodb.net
```

Replace `your-cluster.mongodb.net` with the hostname from your Atlas connection string.

1. Copy the current driver connection string from Atlas and verify the database username, password, and cluster hostname. URL-encode reserved characters in the username or password (`#` as `%23`, `@` as `%40`, `:` as `%3A`, `/` as `%2F`, `?` as `%3F`, `[` as `%5B`, `]` as `%5D`). Do not share the URI.
2. Confirm Atlas Network Access permits connections from your local IP or the backend host. Prefer the narrowest allowlist supported by your deployment.
3. Check that the network permits DNS SRV lookups and outbound MongoDB connections. A school/work network, VPN, or firewall may block them.
4. Restart the backend and check `http://localhost:5000/api/health`. HTTP 200 reports `database: "connected"`; HTTP 503 reports `database: "disconnected"`. The server retries failed initial connections, reports later disconnect/reconnect events, and redacts MongoDB connection URLs from connection error logs.

Never paste database connection strings or secrets into issue reports or chat.

## Deployment

### Render (backend)

The `backend/render.yaml` Blueprint config uses `npm install`, `npm start`, and `/api/health`. Create a Render web service from the repository using the Blueprint, or configure a Node web service with **Root Directory** `backend`, **Build Command** `npm install`, and **Start Command** `npm start`. In Render's Environment settings, set `MONGO_URI` to the current Atlas connection string with reserved username/password characters URL-encoded (in particular, replace raw `@` with `%40` and `#` with `%23`), and set `CLIENT_URL=https://applytrack-live-2026.vercel.app`. Create a strong unique `JWT_SECRET` (Render can generate it). Save the settings and trigger a deploy/restart. Do not set or commit real credentials in the YAML or source.

### Vercel (frontend)

Import the repository into Vercel and set **Root Directory** to `frontend`. Build command: `npm run build`; output directory: `dist`. Add `VITE_API_URL=https://applytrack-1-seei.onrender.com/api` to Vercel's Environment Variables for Production and redeploy. The frontend defaults to this deployed API URL in production if the variable is omitted; the explicit Vercel setting remains recommended. The `frontend/vercel.json` rewrite supports client-side routes.

### MongoDB Atlas

Use the cluster connection string for `MONGO_URI`, create a least-privilege database user, and configure Network Access for the backend host. Avoid committing `.env` files.

Deployment URLs:

- Frontend: https://applytrack-live-2026.vercel.app/
- API: https://applytrack-1-seei.onrender.com
- Health: https://applytrack-1-seei.onrender.com/api/health

## Screenshots

Add dashboard and mobile screenshots here after deployment.

## Security notes

- JWTs are kept in browser `localStorage` for this student MVP and sent in the Authorization header. This is straightforward for a same-origin SPA, but a production app exposed to cross-site scripting should consider a secure, HTTP-only cookie and a CSRF strategy.
- Logout removes the local token. Tokens expire after seven days.
- Never publish `.env`, MongoDB URIs, database passwords, or JWT secrets.

## Future improvements

- Add refresh-token/session revocation and secure cookie-based auth.
- Add reminders, follow-up scheduling, CSV export, pagination, and optional application attachments.
- Add automated API tests using a dedicated test database and continuous integration.
- Add product analytics and user-configurable interview reminders.
