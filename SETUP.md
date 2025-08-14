# MatchMyCV - Complete Setup Guide

This guide will walk you through setting up the complete MatchMyCV application from scratch.

## 🎯 What You're Building

MatchMyCV is a production-ready SaaS application that:

- **Analyzes CVs against job descriptions** using AI
- **Scores compatibility** across 5 key dimensions
- **Provides actionable suggestions** for improvement
- **Offers AI-powered editing** capabilities
- **Handles payments** via Stripe integration
- **Manages user authentication** and authorization
- **Stores files securely** in S3-compatible storage

## 🛠 Prerequisites

Before you start, ensure you have:

- **Node.js 18+** and **pnpm** installed
- **PostgreSQL database** (local or cloud)
- **OpenAI API key** for AI functionality
- **AWS S3 or compatible storage** (Cloudflare R2, DigitalOcean Spaces)
- **Stripe account** for payments (optional for basic setup)

## 🚀 Quick Start (5 Minutes)

### 1. Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd cv-analyzer
pnpm install
```

### 2. Set Up Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Minimal setup for development
DATABASE_URL="postgresql://postgres:password@localhost:5432/cv_analyzer"
NEXTAUTH_SECRET="your-super-secret-key-change-in-production"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# AI Configuration (Required)
AI_PROVIDER="openai"
OPENAI_API_KEY="sk-your-openai-api-key-here"
LLM_MODEL="gpt-4o-mini"
EMBEDDINGS_MODEL="text-embedding-3-large"
```

### 3. Set Up Database

```bash
# Generate Prisma client
pnpm db:generate

# Create and run migrations
pnpm db:migrate

# Seed with sample data
pnpm db:seed
```

### 4. Start Development Server

```bash
pnpm dev
```

Visit http://localhost:3000 and you should see the beautiful landing page!

## 🔐 Demo Account

The seed script creates a demo account:

- **Email**: demo@matchmycv.com
- **Password**: Demo!1234
- **Plan**: Free (5 analyses available)

## 📋 Complete Environment Configuration

For full functionality, configure these additional variables in `.env`:

### OAuth Providers (Optional)

```env
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_ID="your-github-client-id"
GITHUB_SECRET="your-github-client-secret"
```

### S3-Compatible Storage (Required for file uploads)

```env
S3_ENDPOINT="https://s3.amazonaws.com"
S3_ACCESS_KEY_ID="your-access-key-id"
S3_SECRET_ACCESS_KEY="your-secret-access-key"
S3_BUCKET="your-bucket-name"
S3_REGION="us-east-1"
```

### Stripe Payments (Optional)

```env
STRIPE_SECRET_KEY="sk_test_your-stripe-secret-key"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_your-stripe-publishable-key"
STRIPE_WEBHOOK_SECRET="whsec_your-webhook-secret"
STRIPE_PRICE_ID_MONTHLY="price_your-monthly-price-id"
STRIPE_PRICE_ID_YEARLY="price_your-yearly-price-id"
```

### Rate Limiting (Optional)

```env
UPSTASH_REDIS_REST_URL="https://your-redis-url.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-redis-token"
```

## 🧪 Testing the Application

### 1. Landing Page Features

- ✅ Beautiful, responsive design
- ✅ Navigation between sections
- ✅ Interactive demo section
- ✅ Pricing plans display

### 2. Authentication

- ✅ Sign up with email/password
- ✅ Sign in with credentials
- ✅ OAuth with Google/GitHub (if configured)
- ✅ Session management

### 3. Core Features

- ✅ CV upload (PDF/DOCX)
- ✅ Job description input
- ✅ AI-powered analysis
- ✅ Scoring and suggestions
- ✅ Usage tracking

### 4. Dashboard

- ✅ Welcome screen with usage stats
- ✅ Quick action cards
- ✅ Recent activity display
- ✅ Settings access

## 📚 Key Application Features

### 🎯 CV Analysis Engine

- **Skills Matching**: Identifies required vs. possessed skills
- **ATS Optimization**: Keyword density and placement analysis
- **Experience Alignment**: Career level and domain matching
- **Readability Assessment**: Language clarity and impact
- **Quantification Analysis**: Metrics and achievement measurement

### 🤖 AI Integration

- **Provider Abstraction**: Easy switching between OpenAI/Anthropic
- **Smart Parsing**: Extracts structure from PDF/DOCX files
- **Contextual Suggestions**: Job-specific improvement recommendations
- **Semantic Analysis**: Uses embeddings for deep content understanding

### 🔒 Security & Privacy

- **Authentication**: NextAuth.js with multiple providers
- **Authorization**: Role-based access control
- **Data Encryption**: Secure storage for files and database
- **Rate Limiting**: Prevents abuse and ensures fair usage
- **GDPR Compliance**: Data deletion and privacy controls

### 💳 Business Model

- **Freemium**: 5 free analyses, unlimited with Pro
- **Stripe Integration**: Secure payment processing
- **Usage Tracking**: Automatic metering and limits
- **Admin Dashboard**: User management and analytics

## 🚀 Deployment Ready

The application is production-ready with:

### Recommended Deployment Stack

- **Frontend**: Vercel (zero-config Next.js deployment)
- **Database**: Neon, Supabase, or managed PostgreSQL
- **Storage**: AWS S3, Cloudflare R2, DigitalOcean Spaces
- **Redis**: Upstash Redis for rate limiting
- **Monitoring**: Built-in error handling and logging

### Environment Variables for Production

Ensure all environment variables are configured in your deployment platform. Use the `.env.example` as a checklist.

## 📖 Development Workflow

### Available Commands

```bash
# Development
pnpm dev              # Start with Turbopack
pnpm build            # Production build
pnpm start            # Start production server

# Database Management
pnpm db:generate      # Generate Prisma client
pnpm db:migrate       # Create and apply migrations
pnpm db:push          # Push schema changes (dev only)
pnpm db:studio        # Visual database browser
pnpm db:seed          # Populate with sample data
pnpm db:reset         # Reset database (careful!)

# Code Quality
pnpm lint             # ESLint checking
pnpm type-check       # TypeScript validation
```

### Project Structure

```
├── app/                 # Next.js App Router
│   ├── api/            # API Routes
│   ├── auth/           # Authentication pages
│   ├── app/            # Protected application
│   └── page.tsx        # Landing page
├── components/         # React components
│   ├── ui/             # shadcn/ui components
│   ├── auth/           # Auth components
│   └── app/            # App components
├── lib/                # Core utilities
│   ├── ai/             # AI providers
│   ├── auth.ts         # Authentication config
│   ├── db.ts           # Database connection
│   └── ...             # Other utilities
└── prisma/             # Database schema
```

## 🔧 Customization Options

### AI Providers

Switch between OpenAI and Anthropic by changing `AI_PROVIDER` in `.env`:

```env
AI_PROVIDER="anthropic"  # or "openai"
ANTHROPIC_API_KEY="sk-ant-your-key"
```

### Styling & Branding

- Customize colors in `app/globals.css`
- Update logo and branding in components
- Modify landing page content in `app/page.tsx`

### Payment Plans

Update pricing in `lib/stripe.ts`:

```typescript
export const STRIPE_CONFIG = {
  plans: {
    free: {
      /* ... */
    },
    pro: {
      /* ... */
    },
  },
};
```

## 🎉 You're Ready!

You now have a fully functional AI-powered CV optimization SaaS platform! The application includes:

- ✅ **Beautiful marketing website** with pricing and features
- ✅ **Complete user authentication** system
- ✅ **AI-powered CV analysis** engine
- ✅ **File upload and processing** capabilities
- ✅ **Payment integration** with Stripe
- ✅ **Admin dashboard** and user management
- ✅ **Rate limiting** and security measures
- ✅ **Production-ready** deployment setup

## 🤝 Need Help?

- Check the main [README.md](README.md) for detailed documentation
- Review API endpoints in the `/app/api` directory
- Examine components for UI customization examples
- Test with the demo account to understand user flows

**Happy coding! 🚀**
