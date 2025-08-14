# MatchMyCV - AI-Powered CV Optimization SaaS

Get your CV job-ready in minutes with AI-powered analysis, scoring, and optimization. Built with Next.js 14, TypeScript, Prisma, and modern web technologies.

![MatchMyCV Preview](https://github.com/user-attachments/assets/preview.png)

## ✨ Features

### Core Functionality

- **AI-Powered CV Analysis**: Comprehensive scoring across 5 key areas

  - Skills Fit Analysis
  - Experience Alignment
  - ATS Keywords Optimization
  - Readability Assessment
  - Seniority Level Match

- **Smart Document Processing**:

  - PDF and DOCX file support
  - Intelligent text extraction and structuring
  - Section identification (experience, education, skills)

- **AI Editor with Multiple Modes**:

  - Auto-Edit: One-click CV optimization
  - Manual Edit: Rich text editor with AI suggestions
  - Version control with diff tracking
  - Track changes and improvement history

- **Export & Version Management**:
  - Export to PDF and DOCX formats
  - Multiple CV versions per job target
  - Professional formatting templates

### Business Features

- **Freemium Model**: 5 free analyses, unlimited with Pro plan
- **Stripe Integration**: Secure payments and billing management
- **Usage Analytics**: Track analyses, exports, and feature usage
- **Rate Limiting**: Prevent abuse with Redis-based limiting
- **Security**: Encrypted storage, GDPR compliance, secure file handling

## 🛠 Tech Stack

### Frontend

- **Next.js 14**: App Router, React Server Components
- **TypeScript**: Full type safety
- **Tailwind CSS**: Utility-first styling
- **shadcn/ui**: Beautiful, accessible components
- **Framer Motion**: Smooth animations
- **Lucide React**: Modern icons

### Backend & Database

- **Prisma ORM**: Type-safe database operations
- **PostgreSQL**: Robust relational database
- **NextAuth.js**: Authentication (OAuth + Credentials)
- **AWS S3**: Secure file storage
- **Upstash Redis**: Rate limiting and caching

### AI & Processing

- **OpenAI GPT-4**: Advanced CV analysis and editing
- **Anthropic Claude**: Alternative AI provider
- **PDF-Parse & Mammoth**: Document text extraction
- **Vector Embeddings**: Semantic similarity matching

### Payments & Analytics

- **Stripe**: Subscription management and billing
- **PostHog**: Product analytics (optional)
- **Resend**: Transactional emails

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- PostgreSQL database
- OpenAI API key
- AWS S3 or S3-compatible storage
- Stripe account (for payments)

### 1. Clone and Install

```bash
git clone https://github.com/yourusername/matchmycv.git
cd matchmycv
pnpm install
```

### 2. Environment Setup

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

### Required Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/cv_analyzer"

# NextAuth
NEXTAUTH_SECRET="your-super-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# AI Provider
AI_PROVIDER="openai"
OPENAI_API_KEY="sk-your-openai-key"
LLM_MODEL="gpt-4o-mini"
EMBEDDINGS_MODEL="text-embedding-3-large"

# Storage (AWS S3 or compatible)
S3_ACCESS_KEY_ID="your-access-key"
S3_SECRET_ACCESS_KEY="your-secret-key"
S3_BUCKET="your-bucket-name"
S3_REGION="us-east-1"
```

### 3. Database Setup

```bash
# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:migrate

# Seed database (optional)
pnpm db:seed
```

### 4. Development

```bash
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 📝 Available Scripts

```bash
# Development
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm start            # Start production server

# Database
pnpm db:generate      # Generate Prisma client
pnpm db:migrate       # Run database migrations
pnpm db:push          # Push schema changes (dev)
pnpm db:seed          # Seed database with sample data
pnpm db:studio        # Open Prisma Studio
pnpm db:reset         # Reset database (destructive)

# Code Quality
pnpm lint             # Run ESLint
pnpm type-check       # Run TypeScript check
pnpm test             # Run tests (when implemented)
```

## 🏗 Project Structure

```
├── app/                      # Next.js 14 App Router
│   ├── api/                  # API Routes
│   │   ├── auth/            # Authentication endpoints
│   │   ├── upload/          # File upload handling
│   │   ├── analyze/         # CV analysis endpoint
│   │   └── ...
│   ├── auth/                # Authentication pages
│   ├── app/                 # Protected app routes
│   └── page.tsx             # Landing page
├── components/              # React components
│   ├── ui/                  # shadcn/ui components
│   ├── auth/                # Authentication components
│   └── app/                 # Application components
├── lib/                     # Utility libraries
│   ├── ai/                  # AI provider abstraction
│   ├── auth.ts              # NextAuth configuration
│   ├── db.ts                # Database connection
│   ├── storage.ts           # S3 file operations
│   ├── permissions.ts       # Authorization helpers
│   └── ...
├── prisma/                  # Database schema and migrations
│   └── schema.prisma
└── public/                  # Static assets
```

## 🔐 Authentication & Authorization

### Supported Methods

- **OAuth**: Google, GitHub
- **Email/Password**: Traditional credentials
- **Magic Links**: Via Resend (optional)

### User Roles

- **USER**: Standard user access
- **ADMIN**: Administrative privileges

### Permission System

```typescript
// Check user permissions
const user = await requireAuth();
const canAnalyze = canPerformAnalysis(user.plan, currentUsage);
const usageLimit = await checkUsageLimit(user.id, "analyses", user.plan);
```

## 🤖 AI Analysis Engine

### Analysis Components

1. **Skills Extraction**: Identify technical and soft skills
2. **Keyword Matching**: ATS optimization scoring
3. **Experience Analysis**: Career progression and achievements
4. **Readability**: Language clarity and impact
5. **Seniority Fit**: Level alignment with job requirements

### AI Provider Abstraction

Easily switch between AI providers:

```typescript
// lib/ai/provider.ts
const aiProvider = getAIProvider(); // OpenAI or Anthropic
const analysis = await aiProvider.generateAnalysis(cvText, jdText);
```

## 💳 Billing & Subscriptions

### Plans

- **Free**: 5 analyses/month, basic features
- **Pro ($19/month)**: Unlimited analyses, AI editor, exports

### Usage Tracking

```typescript
// Automatic usage tracking
await db.usage.create({
  data: {
    userId: user.id,
    type: "ANALYSIS",
    metadata: { analysisId, documentTitle },
  },
});
```

## 🔒 Security & Privacy

### Data Protection

- **Encryption**: All files encrypted at rest (S3 + DB)
- **Signed URLs**: Secure file access with expiration
- **Rate Limiting**: Prevent abuse and spam
- **Input Validation**: Zod schemas for all inputs

### GDPR Compliance

- **Data Deletion**: Complete user data removal
- **Privacy Controls**: User data export and management
- **Consent Management**: Clear privacy policies

## 🚀 Deployment

### Recommended Stack

- **Frontend**: Vercel (seamless Next.js deployment)
- **Database**: Neon, Supabase, or managed PostgreSQL
- **Storage**: AWS S3, Cloudflare R2, or DigitalOcean Spaces
- **Redis**: Upstash Redis for rate limiting
- **Monitoring**: PostHog, Vercel Analytics

### Environment Variables

Ensure all production environment variables are configured in your deployment platform.

### Database Migrations

```bash
# Production deployment
pnpm db:migrate:deploy
```

## 🧪 Demo Account

For testing purposes:

- **Email**: demo@matchmycv.com
- **Password**: Demo!1234
- **Plan**: Free (5 analyses available)

## 📚 API Documentation

### Core Endpoints

#### Authentication

```bash
POST /api/auth/register     # User registration
GET/POST /api/auth/[...nextauth]  # NextAuth handlers
```

#### Document Management

```bash
POST /api/upload           # Upload CV files
GET /api/documents        # List user documents
```

#### Analysis

```bash
POST /api/analyze         # Perform CV analysis
POST /api/job-targets     # Create job descriptions
GET /api/job-targets      # List job targets
```

#### AI Editing

```bash
POST /api/edit            # AI text editing
POST /api/edit/bulk       # Batch optimizations
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Use conventional commit messages
- Add tests for new features
- Update documentation

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for beautiful components
- [Next.js](https://nextjs.org/) team for the amazing framework
- [OpenAI](https://openai.com/) for powerful AI capabilities
- [Prisma](https://prisma.io/) for type-safe database operations

---

**Built with ❤️ for job seekers worldwide**

For support or questions, please open an issue or contact [support@matchmycv.com](mailto:support@matchmycv.com).
