#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

console.log("🚀 CV Analyzer - Supabase Database Setup");
console.log("==========================================\n");

// Check if .env file exists
const envPath = path.join(__dirname, ".env");
const envExamplePath = path.join(__dirname, ".env.example");

if (!fs.existsSync(envPath)) {
  console.log("📁 Creating .env file from .env.example...");
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log("✅ .env file created!\n");
  } else {
    console.log("❌ .env.example not found. Please create .env manually.\n");
  }
}

console.log("📋 SUPABASE SETUP INSTRUCTIONS:");
console.log("================================\n");

console.log("1. 🌐 Create Supabase Project:");
console.log("   • Go to https://supabase.com");
console.log('   • Click "Start your project"');
console.log('   • Create new project: "cv-analyzer"');
console.log("   • Choose a strong database password");
console.log("   • Select your preferred region\n");

console.log("2. 🔗 Get Database Connection:");
console.log("   • In Supabase dashboard: Settings → Database");
console.log('   • Copy "Connection string"');
console.log("   • Replace [YOUR-PASSWORD] with your password\n");

console.log("3. ⚙️  Configure Environment:");
console.log("   • Open .env file");
console.log("   • Update DATABASE_URL with your Supabase connection string");
console.log("   • Example:");
console.log(
  '     DATABASE_URL="postgresql://postgres.abc123:password@aws-0-us-east-1.pooler.supabase.com:5432/postgres"\n'
);

console.log("4. 🏗️  Setup Database Schema:");
console.log("   • Run: npx prisma generate");
console.log("   • Run: npx prisma db push");
console.log("   • This will create all tables in Supabase\n");

console.log("5. 🔒 Enable Security (Optional):");
console.log(
  "   • In Supabase SQL Editor, run the RLS commands from scripts/setup-supabase.md\n"
);

console.log("6. 🧪 Test Connection:");
console.log("   • Run: npx prisma studio");
console.log("   • This will open Prisma Studio to view your database\n");

console.log("📚 For detailed instructions, see: scripts/setup-supabase.md\n");

console.log("🚨 IMPORTANT NOTES:");
console.log("==================");
console.log("• Keep your database password secure");
console.log("• Use connection pooling for production");
console.log("• Monitor usage in Supabase dashboard");
console.log("• Set up Row Level Security for production apps\n");

console.log("💡 Next Steps:");
console.log("==============");
console.log("1. Configure your Supabase project");
console.log("2. Update .env with your DATABASE_URL");
console.log("3. Run: npm run db:setup");
console.log("4. Test the application: npm run dev\n");

console.log("🎉 Ready to build amazing CV analysis features!");
