# Development Setup Guide

This guide will help you set up MatchMyCV for local development.

## Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- OpenAI API key (required for CV analysis)
- S3-compatible storage (optional, will use local storage if not configured)

## Quick Start

1. **Install dependencies:**

   ```bash
   pnpm install
   ```

2. **Set up environment variables:**

   ```bash
   cp .env.example .env
   ```

3. **Configure required environment variables:**

   ```env
   # Required for AI features
   OPENAI_API_KEY="your-openai-api-key-here"

   # Required for authentication
   NEXTAUTH_SECRET="your-secret-key-here"
   ```

4. **Set up database:**

   ```bash
   pnpm db:generate
   pnpm db:push
   pnpm db:seed
   ```

5. **Start development server:**
   ```bash
   pnpm dev
   ```

## Configuration Options

### AI Provider (Required)

The application requires an AI provider for CV analysis. Currently supports OpenAI:

```env
AI_PROVIDER="openai"
OPENAI_API_KEY="sk-..."
LLM_MODEL="gpt-4o-mini"
EMBEDDINGS_MODEL="text-embedding-3-large"
```

### File Storage (Optional)

**Option 1: Local Storage (Default for Development)**

- Files are stored in `./uploads/` directory
- No additional configuration needed
- Automatically used when S3 is not configured

**Option 2: S3-Compatible Storage**

```env
S3_ENDPOINT="https://s3.amazonaws.com"
S3_ACCESS_KEY_ID="your-access-key"
S3_SECRET_ACCESS_KEY="your-secret-key"
S3_BUCKET="your-bucket-name"
S3_REGION="us-east-1"
```

### Authentication Providers (Optional)

```env
# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# GitHub OAuth
GITHUB_ID="your-github-client-id"
GITHUB_SECRET="your-github-client-secret"
```

### Rate Limiting (Optional)

```env
UPSTASH_REDIS_REST_URL="your-upstash-redis-url"
UPSTASH_REDIS_REST_TOKEN="your-upstash-redis-token"
```

### Billing (Optional)

```env
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

## Demo Account

After running `pnpm db:seed`, you can use:

- **Email:** demo@matchmycv.com
- **Password:** Demo!1234

## Features Available

### ✅ Working Features

- User authentication (email/password)
- CV upload (PDF/DOCX)
- LLM-powered CV extraction and structuring
- Local file storage for development
- Database operations with SQLite

### 🚧 In Development

- Full AI analysis with scoring
- CV optimization suggestions
- Export functionality
- Billing integration

## Troubleshooting

### Upload Issues

- Ensure you have an OpenAI API key configured
- Check that the `uploads/` directory is writable
- Verify file size is under 10MB

### Database Issues

- Run `pnpm db:push` to sync schema changes
- Use `pnpm db:reset` to reset the database if needed

### Authentication Issues

- Ensure `NEXTAUTH_SECRET` is set
- Check that the database is properly seeded

## Development Commands

```bash
# Database
pnpm db:generate    # Generate Prisma client
pnpm db:push        # Push schema to database
pnpm db:migrate     # Create migration
pnpm db:seed        # Seed with sample data
pnpm db:studio      # Open Prisma Studio
pnpm db:reset       # Reset database

# Development
pnpm dev           # Start development server
pnpm build         # Build for production
pnpm start         # Start production server
pnpm lint          # Run linter
pnpm type-check    # Type check
```

## Project Structure

```
├── app/                  # Next.js 14 App Router
│   ├── api/             # API routes
│   ├── auth/            # Authentication pages
│   └── app/             # Protected app pages
├── components/          # React components
├── lib/                 # Utility libraries
│   ├── ai/             # AI providers
│   └── generated/      # Generated Prisma client
├── prisma/             # Database schema and migrations
└── uploads/            # Local file storage (dev only)
```
