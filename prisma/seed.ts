import { PrismaClient } from "../lib/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const sampleCV = `
JOHN SMITH
Software Engineer

CONTACT INFORMATION
Email: john.smith@email.com
Phone: (555) 123-4567
LinkedIn: linkedin.com/in/johnsmith
Location: San Francisco, CA

PROFESSIONAL SUMMARY
Experienced Full-Stack Software Engineer with 5+ years developing scalable web applications.
Proficient in React, Node.js, and cloud technologies. Led teams of 3-5 developers and
improved application performance by 40%.

EXPERIENCE

Senior Software Engineer | TechCorp Inc. | 2021 - Present
• Led development of customer portal serving 10,000+ daily users
• Implemented microservices architecture reducing system latency by 50%
• Mentored 3 junior developers and established code review processes
• Built CI/CD pipeline reducing deployment time from 2 hours to 15 minutes

Software Engineer | StartupXYZ | 2019 - 2021
• Developed React-based dashboard with 95% user satisfaction rating
• Optimized database queries improving page load times by 30%
• Collaborated with design team to implement responsive UI components
• Maintained 99.9% uptime for critical payment processing system

EDUCATION
Bachelor of Science in Computer Science | University of California, Berkeley | 2019
GPA: 3.8/4.0

SKILLS
Frontend: React, TypeScript, HTML5, CSS3, Tailwind CSS
Backend: Node.js, Python, Express.js, REST APIs
Databases: PostgreSQL, MongoDB, Redis
Cloud: AWS, Docker, Kubernetes
Tools: Git, Jenkins, Jira, VS Code
`;

const sampleJobDescription = `
Senior Frontend Engineer - E-commerce Platform

Company: ShopFast Inc.
Location: San Francisco, CA (Hybrid)
Salary: $130,000 - $160,000

ABOUT THE ROLE
We're seeking a Senior Frontend Engineer to join our growing e-commerce team. You'll be responsible for building and maintaining our customer-facing web applications that serve millions of users daily.

KEY RESPONSIBILITIES
• Develop and maintain React-based web applications
• Collaborate with UX/UI designers to implement pixel-perfect interfaces
• Optimize application performance and ensure excellent user experience
• Lead technical discussions and mentor junior developers
• Participate in code reviews and maintain high code quality standards
• Work with backend teams to integrate APIs and services

REQUIRED QUALIFICATIONS
• 4+ years of experience in frontend development
• Strong proficiency in React, TypeScript, and modern JavaScript
• Experience with state management libraries (Redux, Zustand)
• Knowledge of responsive design and CSS frameworks
• Experience with testing frameworks (Jest, React Testing Library)
• Familiarity with build tools (Webpack, Vite)
• Strong problem-solving and communication skills

PREFERRED QUALIFICATIONS
• Experience with Next.js and server-side rendering
• Knowledge of GraphQL and Apollo Client
• Experience with cloud platforms (AWS, GCP)
• Understanding of performance optimization techniques
• Experience in e-commerce or high-traffic applications
• Leadership experience mentoring team members

BENEFITS
• Competitive salary and equity package
• Comprehensive health, dental, and vision insurance
• Unlimited PTO and flexible work arrangements
• $2,000 annual learning and development budget
• Top-tier equipment and ergonomic workspace setup
`;

async function main() {
  console.log("🌱 Starting database seed...");

  // Create demo user
  const hashedPassword = await bcrypt.hash("Demo!1234", 12);

  const demoUser = await prisma.user.upsert({
    where: { email: "demo@matchmycv.com" },
    update: {},
    create: {
      name: "Demo User",
      email: "demo@matchmycv.com",
      password: hashedPassword,
      plan: "FREE",
      credits: 5,
      role: "USER",
    },
  });

  console.log("✅ Created demo user:", demoUser.email);

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@matchmycv.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@matchmycv.com",
      password: await bcrypt.hash("Admin!1234", 12),
      plan: "PRO",
      credits: -1, // Unlimited
      role: "ADMIN",
    },
  });

  console.log("✅ Created admin user:", adminUser.email);

  // Create sample document for demo user
  const existingDocument = await prisma.document.findFirst({
    where: {
      userId: demoUser.id,
      title: "John Smith - Software Engineer CV",
    },
  });

  const sampleDocument =
    existingDocument ||
    (await prisma.document.create({
      data: {
        userId: demoUser.id,
        title: "John Smith - Software Engineer CV",
        storageKey: "demo/sample-cv.pdf",
        mimeType: "application/pdf",
        fileSize: 245760, // ~240KB
        rawText: sampleCV,
        structured: JSON.stringify({
          sections: {
            summary:
              "Experienced Full-Stack Software Engineer with 5+ years developing scalable web applications.",
            experience: [
              {
                title: "Senior Software Engineer",
                company: "TechCorp Inc.",
                duration: "2021 - Present",
                bullets: [
                  "Led development of customer portal serving 10,000+ daily users",
                  "Implemented microservices architecture reducing system latency by 50%",
                  "Mentored 3 junior developers and established code review processes",
                ],
              },
            ],
            education: [
              {
                degree: "Bachelor of Science in Computer Science",
                institution: "University of California, Berkeley",
                year: "2019",
              },
            ],
            skills: [
              "React",
              "TypeScript",
              "Node.js",
              "Python",
              "AWS",
              "Docker",
              "PostgreSQL",
            ],
          },
          metadata: {
            wordCount: 285,
            bulletCount: 8,
            quantifiedBullets: 6,
            strongVerbs: 7,
          },
        }),
      },
    }));

  console.log("✅ Created sample document:", sampleDocument.title);

  // Create initial version for the document
  const existingVersion = await prisma.version.findFirst({
    where: {
      documentId: sampleDocument.id,
      label: "Original",
    },
  });

  const initialVersion =
    existingVersion ||
    (await prisma.version.create({
      data: {
        documentId: sampleDocument.id,
        label: "Original",
        content: sampleCV,
        isActive: true,
      },
    }));

  console.log("✅ Created initial version");

  // Create sample job target
  const existingJobTarget = await prisma.jobTarget.findFirst({
    where: {
      userId: demoUser.id,
      title: "Senior Frontend Engineer - ShopFast Inc.",
    },
  });

  const jobTarget =
    existingJobTarget ||
    (await prisma.jobTarget.create({
      data: {
        userId: demoUser.id,
        title: "Senior Frontend Engineer - ShopFast Inc.",
        company: "ShopFast Inc.",
        rawText: sampleJobDescription,
        skills: JSON.stringify([
          "React",
          "TypeScript",
          "JavaScript",
          "Redux",
          "CSS",
          "Jest",
          "Next.js",
          "GraphQL",
          "AWS",
        ]),
        requirements: JSON.stringify([
          "4+ years of experience in frontend development",
          "Strong proficiency in React, TypeScript, and modern JavaScript",
          "Experience with state management libraries (Redux, Zustand)",
          "Knowledge of responsive design and CSS frameworks",
          "Experience with testing frameworks (Jest, React Testing Library)",
        ]),
        seniority: "senior",
      },
    }));

  console.log("✅ Created sample job target:", jobTarget.title);

  // Create sample analysis (only if it doesn't exist)
  const existingAnalysis = await prisma.analysis.findFirst({
    where: {
      userId: demoUser.id,
      documentId: sampleDocument.id,
      jobTargetId: jobTarget.id,
    },
  });

  if (!existingAnalysis) {
    const analysis = await prisma.analysis.create({
      data: {
        userId: demoUser.id,
        documentId: sampleDocument.id,
        jobTargetId: jobTarget.id,
        overallScore: 78,
        subScores: JSON.stringify({
          skillsFit: 85,
          experience: 80,
          keywordsATS: 75,
          readability: 82,
          seniority: 88,
        }),
        gaps: JSON.stringify({
          missingSkills: ["Redux", "Jest", "GraphQL"],
          weakAreas: ["Frontend-specific experience", "E-commerce background"],
          keywordOps: [
            {
              keyword: "Redux",
              importance: "high",
              context: "State management is crucial for this role",
              suggestedPlacement: ["Skills section", "Experience bullets"],
            },
            {
              keyword: "Jest",
              importance: "medium",
              context: "Testing experience mentioned in requirements",
              suggestedPlacement: ["Skills section"],
            },
          ],
        }),
        suggestions: JSON.stringify([
          {
            id: "1",
            section: "Skills",
            excerpt: "Frontend: React, TypeScript, HTML5, CSS3, Tailwind CSS",
            issue: "Missing key frontend technologies mentioned in JD",
            fix: "Frontend: React, TypeScript, Redux, HTML5, CSS3, Tailwind CSS, Jest",
            rationale: "Adding Redux and Jest to match job requirements",
            priority: "high",
            type: "keyword",
          },
          {
            id: "2",
            section: "Experience",
            excerpt: "Led development of customer portal",
            issue: "Could emphasize frontend-specific leadership",
            fix: "Led frontend development of customer portal using React and TypeScript",
            rationale: "Highlighting relevant frontend technologies used",
            priority: "medium",
            type: "keyword",
          },
        ]),
      },
    });

    console.log(
      "✅ Created sample analysis with",
      analysis.overallScore,
      "% match score"
    );

    // Create usage records
    await prisma.usage.create({
      data: {
        userId: demoUser.id,
        type: "ANALYSIS",
        metadata: JSON.stringify({
          analysisId: analysis.id,
          documentTitle: sampleDocument.title,
          jobTitle: jobTarget.title,
        }),
      },
    });

    console.log("✅ Created usage record");
  } else {
    console.log("✅ Sample analysis already exists");
  }

  console.log("\n🎉 Database seeded successfully!");
  console.log("\n📧 Demo Account Credentials:");
  console.log("   Email: demo@matchmycv.com");
  console.log("   Password: Demo!1234");
  console.log("\n🔑 Admin Account Credentials:");
  console.log("   Email: admin@matchmycv.com");
  console.log("   Password: Admin!1234");
  console.log("\n🚀 Ready to start the application with: pnpm dev");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
