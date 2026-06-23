# Email Marketing Application (AWS SES)

A full-stack email marketing platform built with **React** (frontend) and **Node.js/Express** (backend), powered by **AWS SES** for email delivery, **MySQL** for data storage, and **Redis/Bull** for bulk email queue processing.

## Project Structure

```
cc-app-email-marketing-AWS-SES/
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── config/          # App & database configuration
│   │   ├── controllers/     # Route handlers
│   │   ├── database/        # Migration scripts
│   │   ├── middleware/      # Validation & error handling
│   │   ├── models/          # Sequelize ORM models
│   │   ├── routes/          # API route definitions
│   │   ├── services/        # Business logic (SES, queue, campaigns)
│   │   ├── utils/           # Helpers & token utilities
│   │   ├── workers/         # Bull queue email worker
│   │   ├── app.js           # Express app setup
│   │   └── server.js        # Entry point
│   ├── .env.example
│   └── package.json
├── frontend/                # React SPA
│   ├── src/
│   │   ├── components/      # Shared UI components
│   │   ├── pages/           # Route pages
│   │   ├── services/        # API client
│   │   └── App.jsx
│   ├── .env.example
│   └── package.json
├── deployment/              # Nginx & PM2 configs
│   ├── nginx.conf
│   └── ecosystem.config.js
└── docs/
    └── ARCHITECTURE.md
```

## Features

| Module | Capabilities |
|--------|-------------|
| **Email Lists** | CRUD, CSV/Excel import, duplicate & format validation, search/filter, pagination, import logging |
| **Subscribers** | Add/edit/delete, status management, list assignment |
| **Segments** | Group subscribers for targeted campaigns |
| **Templates** | HTML templates, dynamic placeholders, preview, duplication, attachments support |
| **Campaigns** | Create, schedule, immediate send, pause/resume, status tracking, history logs |
| **AWS SES** | SDK integration, retry logic, bounce/complaint/delivery webhooks |
| **Bulk Engine** | Redis queue, batching, rate limiting, lakhs-scale processing, resume |
| **Unsubscribe** | Token-based links, status updates, exclusion from sends, reports |
| **Reports** | Dashboard analytics, campaign metrics, CSV export |

## Prerequisites

- Node.js 18+
- MySQL 8+
- Redis 6+
- AWS SES account (test or production credentials)

## Quick Start

### 1. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your MySQL, Redis, and AWS SES credentials
npm install
npm run migrate    # Create database tables
npm run dev        # Start API server on port 4000
```

In a separate terminal, start the email worker:

```bash
cd backend
npm run worker     # Start Bull queue processor
```

### 2. Frontend Setup

```bash
cd frontend
cp .env.example .env
npm install
npm run dev        # Start on port 5173
```

### 3. Access the Application

- **Frontend:** http://localhost:5173
- **API:** http://localhost:4000/api/v1/health

## Environment Variables

### Backend (.env)

| Variable | Description |
|----------|-------------|
| `AWS_ACCESS_KEY_ID` | AWS access key for SES |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key for SES |
| `AWS_REGION` | AWS region (e.g., `us-east-1`) |
| `SES_FROM_EMAIL` | Verified sender email address |
| `SES_FROM_NAME` | Display name for sender |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | MySQL connection |
| `REDIS_HOST`, `REDIS_PORT` | Redis for Bull queue |
| `EMAIL_BATCH_SIZE` | Emails per batch (default: 50) |
| `EMAIL_RATE_LIMIT_PER_SECOND` | SES send rate (default: 14) |

### Frontend (.env)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API URL (default: `http://localhost:4000/api/v1`) |

## AWS SES Credential Migration (Test → Production)

The application is designed so that **only `.env` credential changes** are needed to switch from test to production SES:

```env
# Replace these four values only:
AWS_ACCESS_KEY_ID=production_access_key
AWS_SECRET_ACCESS_KEY=production_secret_key
AWS_REGION=us-east-1
SES_FROM_EMAIL=noreply@yourproductiondomain.com
```

No code changes required. Restart the API server and worker after updating credentials.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/health` | Health check |
| GET/POST/PUT/DELETE | `/api/v1/lists` | Email list management |
| POST | `/api/v1/lists/:id/import` | CSV/Excel import |
| GET/POST/PUT/DELETE | `/api/v1/subscribers` | Subscriber management |
| GET/POST/PUT/DELETE | `/api/v1/segments` | Segment management |
| GET/POST/PUT/DELETE | `/api/v1/templates` | Template CRUD |
| POST | `/api/v1/templates/:id/preview` | Template preview |
| POST | `/api/v1/templates/:id/duplicate` | Duplicate template |
| GET/POST/PUT/DELETE | `/api/v1/campaigns` | Campaign management |
| POST | `/api/v1/campaigns/:id/send` | Start/send campaign |
| POST | `/api/v1/campaigns/:id/pause` | Pause campaign |
| POST | `/api/v1/campaigns/:id/resume` | Resume campaign |
| POST | `/api/v1/webhooks/ses` | AWS SES SNS webhooks |
| GET/POST | `/api/v1/unsubscribe/:token` | Unsubscribe flow |
| GET | `/api/v1/reports/dashboard` | Dashboard analytics |
| GET | `/api/v1/reports/export/send-logs` | Export send logs CSV |

## Documentation

- **[AWS SES Setup Guide](docs/AWS-SES-SETUP-GUIDE.md)** — IAM user creation and full SES configuration for developers
- **[Complete Documentation](docs/DOCUMENTATION.md)** — Full guide: setup, API reference, features, deployment, testing
- **[Architecture Guide](docs/ARCHITECTURE.md)** — System diagrams and deployment steps

### PM2 (Production)

```bash
# From project root
pm2 start deployment/ecosystem.config.js --env production
```

### Nginx

Copy `deployment/nginx.conf` to your VPS and update domain names.

## Template Placeholders

Use these in email templates:

- `{{first_name}}` — Subscriber first name
- `{{last_name}}` — Subscriber last name
- `{{email}}` — Subscriber email
- `{{full_name}}` — Full name
- `{{unsubscribe_url}}` — Auto-generated unsubscribe link

## License

Proprietary — Encycdata Pvt Ltd
