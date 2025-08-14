# Supabase Setup Guide for CV Analyzer

## 1. Create Supabase Project

1. Go to [Supabase](https://supabase.com)
2. Click "Start your project"
3. Create a new project:
   - **Name**: `cv-analyzer`
   - **Database Password**: Choose a strong password
   - **Region**: Select closest to your users
   - **Pricing Plan**: Start with Free tier

## 2. Get Database Connection String

1. In your Supabase dashboard, go to **Settings** → **Database**
2. Copy the **Connection string** under "Connection parameters"
3. Replace `[YOUR-PASSWORD]` with your actual database password

Example:

```
postgresql://postgres.abcdefghijklmnop:YOUR_PASSWORD@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

## 3. Configure Environment Variables

Create/update your `.env` file:

```env
# Database (Supabase)
DATABASE_URL="postgresql://postgres.YOUR_PROJECT_REF:YOUR_PASSWORD@aws-0-us-east-1.pooler.supabase.com:5432/postgres"

# Supabase (Optional - for direct API access)
NEXT_PUBLIC_SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

## 4. Run Database Migration

```bash
# Generate Prisma client
npx prisma generate

# Push schema to Supabase
npx prisma db push

# Optional: Seed database with sample data
npx prisma db seed
```

## 5. Enable Row Level Security (RLS)

In Supabase SQL Editor, run these commands to secure your data:

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Document" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CVAnalysis" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Analysis" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "JobTarget" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Version" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Usage" ENABLE ROW LEVEL SECURITY;

-- Create policies for users to access only their own data
CREATE POLICY "Users can view own profile" ON users
    FOR ALL USING (auth.uid()::text = id);

CREATE POLICY "Users can access own documents" ON "Document"
    FOR ALL USING (auth.uid()::text = "userId");

CREATE POLICY "Users can access own CV analysis" ON "CVAnalysis"
    FOR ALL USING (auth.uid()::text = (SELECT "userId" FROM "Document" WHERE "Document".id = "CVAnalysis"."documentId"));

CREATE POLICY "Users can access own analysis" ON "Analysis"
    FOR ALL USING (auth.uid()::text = "userId");

CREATE POLICY "Users can access own job targets" ON "JobTarget"
    FOR ALL USING (auth.uid()::text = "userId");

CREATE POLICY "Users can access own versions" ON "Version"
    FOR ALL USING (auth.uid()::text = (SELECT "userId" FROM "Document" WHERE "Document".id = "Version"."documentId"));

CREATE POLICY "Users can access own usage" ON "Usage"
    FOR ALL USING (auth.uid()::text = "userId");
```

## 6. Configure Authentication (Optional)

If using Supabase Auth instead of NextAuth:

1. Go to **Authentication** → **Settings**
2. Configure your site URL: `http://localhost:3000`
3. Add redirect URLs for production
4. Enable desired providers (Google, GitHub, etc.)

## 7. Verify Setup

Test your connection:

```bash
# Test database connection
npx prisma db pull

# Check if tables exist
npx prisma studio
```

## 8. Production Deployment

For production:

1. Update `NEXT_PUBLIC_SUPABASE_URL` with your production domain
2. Use connection pooling for better performance
3. Monitor usage in Supabase dashboard
4. Set up backups and monitoring

## Troubleshooting

### Connection Issues

- Verify your password is correct
- Check if your IP is whitelisted (Supabase allows all by default)
- Ensure you're using the pooler connection string for production

### Migration Issues

- If you get permission errors, check RLS policies
- Use `npx prisma db push --force-reset` to reset database (⚠️ deletes all data)

### Performance

- Use connection pooling in production
- Monitor query performance in Supabase dashboard
- Consider upgrading to Pro plan for better performance

## Next Steps

1. Set up your other environment variables (OpenAI, Stripe, etc.)
2. Test the CV analysis functionality
3. Deploy to Vercel/Netlify with production database URL
4. Set up monitoring and backups
