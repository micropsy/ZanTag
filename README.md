# ZanTag - Digital Business Card Platform

ZanTag is a modern digital business card platform that allows professionals to share their contact information, manage leads, and host documents securely.

## Features

- **Digital vCard**: Instantly share contact details via QR code or link.
- **Lead Manager**: Capture and organize leads efficiently.
- **Document Library**: Host and share professional documents.
- **Easy Sharing**: Dynamic URLs and QR codes for seamless networking.

## Prerequisites

- Node.js (v18 or later)
- npm
- Wrangler (Cloudflare CLI)

## Installation

```bash
npm install
```

## Local Development Setup

To run the project locally, you need to set up the Cloudflare D1 database and R2 storage bucket simulation.

### 1. Database Setup (D1)

Create the D1 database locally and apply migrations:

```bash
# Create the database (if not already created)
npx wrangler d1 create zantag-db

# Apply migrations locally
npx wrangler d1 execute zantag-db --local --file=./migrations/0001_init.sql
npx wrangler d1 execute zantag-db --local --file=./migrations/0002_update_invite_code.sql
npx wrangler d1 execute zantag-db --local --file=./migrations/0003_add_system_setting.sql
```

### 2. Storage Setup (R2)

Create the R2 bucket for local development:

```bash
npx wrangler r2 bucket create zantag-assets
```

### 3. Environment Variables

For local development secrets, create a `.dev.vars` file in the root directory:

```
# Example .dev.vars
SESSION_SECRET="your-super-secret-session-key"
```

### 4. Start Development Server

```bash
npm run dev
```

## Verification

To verify the codebase:

```bash
# Check for security vulnerabilities
npm audit

# Run linter
npm run lint

# Build the project
npm run build
```

## Deployment

The project is configured for Cloudflare Pages. Push to the main branch to trigger deployment.
