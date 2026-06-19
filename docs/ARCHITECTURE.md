# Architecture & Deployment Guide

## System Architecture

```mermaid
graph TB
    subgraph Client
        Browser[React SPA<br/>Port 5173 / Nginx]
    end

    subgraph VPS["VPS Server"]
        Nginx[Nginx Reverse Proxy]
        API[Express API Server<br/>PM2 - Port 4000]
        Worker[Email Queue Worker<br/>PM2 - Bull Processor]
    end

    subgraph Data
        MySQL[(MySQL Database)]
        Redis[(Redis<br/>Bull Queue)]
    end

    subgraph AWS
        SES[AWS SES<br/>Email Delivery]
        SNS[AWS SNS<br/>Bounce/Complaint/Delivery]
    end

    Browser -->|HTTPS| Nginx
    Nginx -->|/api/*| API
    Nginx -->|/*| Browser
    API --> MySQL
    API --> Redis
    Worker --> Redis
    Worker --> MySQL
    Worker -->|SendEmail| SES
    SES -->|Notifications| SNS
    SNS -->|Webhook POST| API
```

## Component Overview

### Frontend (React + Vite + Tailwind)

- Single-page application served via Nginx in production
- Communicates with backend REST API
- Pages: Dashboard, Email Lists, Subscribers, Segments, Templates, Campaigns, Reports
- Public unsubscribe page (no auth required)

### Backend API (Node.js + Express)

- RESTful API with `/api/v1` prefix
- Sequelize ORM for MySQL
- Input validation via express-validator
- File upload for CSV/Excel import (multer)

### Email Worker (Bull + Redis)

- Separate PM2 process for queue consumption
- Processes campaign batches asynchronously
- Rate-limited sending to respect SES quotas
- Automatic retry with exponential backoff
- Campaign pause/resume support

### AWS SES Integration

- All AWS config read from environment variables
- `SESService` wrapper handles send, retry, and raw email (attachments)
- SNS webhook endpoint for bounce, complaint, and delivery events
- Credential swap requires only `.env` changes

## Database Schema

```mermaid
erDiagram
    email_lists ||--o{ list_subscribers : contains
    subscribers ||--o{ list_subscribers : belongs_to
    email_segments ||--o{ segment_subscribers : contains
    subscribers ||--o{ segment_subscribers : belongs_to
    email_lists ||--o{ import_logs : has
    templates ||--o{ campaigns : uses
    campaigns ||--o{ campaign_lists : targets
    campaigns ||--o{ campaign_segments : targets
    campaigns ||--o{ send_logs : generates
    campaigns ||--o{ campaign_logs : tracks
    subscribers ||--o{ send_logs : receives
    subscribers ||--o{ unsubscribes : has
    subscribers ||--o{ bounce_logs : has
    subscribers ||--o{ complaint_logs : has

    email_lists {
        int id PK
        string name
        string description
        enum status
    }

    subscribers {
        int id PK
        string email UK
        string first_name
        string last_name
        enum status
        json metadata
    }

    templates {
        int id PK
        string name
        string subject
        text html_body
        text text_body
        json placeholders
        json attachments
    }

    campaigns {
        int id PK
        string name
        int template_id FK
        enum status
        enum schedule_type
        datetime scheduled_at
        int total_recipients
        int sent_count
        int failed_count
    }

    send_logs {
        int id PK
        int campaign_id FK
        int subscriber_id FK
        string email
        enum status
        string ses_message_id
    }
```

## Bulk Email Flow

```mermaid
sequenceDiagram
    participant User
    participant API
    participant Redis as Bull Queue
    participant Worker
    participant SES as AWS SES
    participant DB as MySQL

    User->>API: POST /campaigns/:id/send
    API->>DB: Resolve recipients (lists + segments)
    API->>DB: Exclude unsubscribed/bounced
    API->>DB: Update campaign status = sending

    loop For each batch
        API->>Redis: Add batch job
    end

    API-->>User: Campaign started

    loop Worker processes jobs
        Redis->>Worker: Dequeue batch
        Worker->>DB: Check campaign not paused

        loop For each recipient (rate limited)
            Worker->>Worker: Replace placeholders
            Worker->>Worker: Generate unsubscribe token
            Worker->>SES: SendEmail (with retry)
            SES-->>Worker: MessageId
            Worker->>DB: Update send_log
        end

        Worker->>DB: Update campaign progress
    end

    Worker->>DB: Mark campaign completed
```

## Environment Setup

### Development

| Service | URL/Port |
|---------|----------|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:4000 |
| MySQL | localhost:3306 |
| Redis | localhost:6379 |

### Staging / Production

| Service | Domain |
|---------|--------|
| Frontend | https://email.yourdomain.com |
| Backend API | https://api.email.yourdomain.com |
| SES Webhook | https://api.email.yourdomain.com/api/v1/webhooks/ses |

## Deployment Steps

### 1. Server Preparation

```bash
sudo apt update && sudo apt install -y nginx redis-server mysql-server
npm install -g pm2
```

### 2. Database Setup

```sql
CREATE DATABASE email_marketing CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'emailapp'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON email_marketing.* TO 'emailapp'@'localhost';
FLUSH PRIVILEGES;
```

### 3. Application Deployment

```bash
cd /var/www/email-marketing/backend
cp .env.example .env
npm install --production
npm run migrate

cd /var/www/email-marketing/frontend
cp .env.example .env
npm install
npm run build
```

### 4. Start with PM2

```bash
pm2 start deployment/ecosystem.config.js --env production
pm2 save
pm2 startup
```

### 5. Configure Nginx

```bash
sudo cp deployment/nginx.conf /etc/nginx/sites-available/email-marketing
sudo ln -s /etc/nginx/sites-available/email-marketing /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

## AWS Credential Migration Checklist

When moving from test to production SES:

- [ ] Production AWS account created and SES configured
- [ ] Sending domain verified with SPF/DKIM/DMARC
- [ ] Production access approved (out of sandbox)
- [ ] SNS topics configured for production
- [ ] Update `.env` with production credentials only
- [ ] Restart PM2 processes: `pm2 restart all`
- [ ] Send test email to verify delivery
- [ ] Verify webhook processing (bounce/complaint)
- [ ] Verify unsubscribe flow end-to-end
- [ ] Run small batch campaign smoke test
