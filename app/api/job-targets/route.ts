import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/permissions";
import { db } from "@/lib/db";
import { jobTargetSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();

    const jobTargets = await db.jobTarget.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        title: true,
        company: true,
        createdAt: true,
        skills: true,
        requirements: true,
        seniority: true,
      },
    });

    // Parse JSON strings back to arrays for client consumption
    const parsedJobTargets = jobTargets.map((jobTarget) => ({
      ...jobTarget,
      skills: JSON.parse(jobTarget.skills),
      requirements: JSON.parse(jobTarget.requirements),
    }));

    return NextResponse.json({ jobTargets: parsedJobTargets });
  } catch (error: any) {
    console.error("Job targets fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch job targets" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await req.json();
    const validatedData = jobTargetSchema.parse(body);

    // Simple skill extraction from job description
    const extractSkills = (text: string): string[] => {
      const skillKeywords = [
        "javascript",
        "typescript",
        "react",
        "node.js",
        "python",
        "java",
        "c++",
        "html",
        "css",
        "aws",
        "docker",
        "kubernetes",
        "git",
        "sql",
        "mongodb",
        "postgresql",
        "redis",
        "project management",
        "agile",
        "scrum",
        "leadership",
        "communication",
        "analytical",
        "problem solving",
        "team work",
        "collaboration",
      ];

      const lowerText = text.toLowerCase();
      return skillKeywords.filter((skill) => lowerText.includes(skill));
    };

    // Extract requirements (simple implementation)
    const extractRequirements = (text: string): string[] => {
      const lines = text.split("\n");
      const requirements: string[] = [];

      for (const line of lines) {
        const trimmed = line.trim();
        if (
          trimmed.match(/^[•\-\*]\s/) ||
          trimmed.toLowerCase().includes("required") ||
          trimmed.toLowerCase().includes("must have")
        ) {
          requirements.push(trimmed.replace(/^[•\-\*]\s*/, ""));
        }
      }

      return requirements.slice(0, 10); // Limit to 10 requirements
    };

    // Detect seniority level
    const detectSeniority = (text: string): string => {
      const lowerText = text.toLowerCase();
      if (
        lowerText.includes("senior") ||
        lowerText.includes("lead") ||
        lowerText.includes("principal")
      ) {
        return "senior";
      } else if (
        lowerText.includes("junior") ||
        lowerText.includes("entry") ||
        lowerText.includes("associate")
      ) {
        return "junior";
      }
      return "mid";
    };

    const skills = extractSkills(validatedData.description);
    const requirements = extractRequirements(validatedData.description);
    const seniority = detectSeniority(validatedData.description);

    const jobTarget = await db.jobTarget.create({
      data: {
        userId: user.id,
        title: validatedData.title,
        company: validatedData.company || null,
        rawText: validatedData.description,
        skills: JSON.stringify(skills), // Convert array to JSON string for SQLite
        requirements: JSON.stringify(requirements), // Convert array to JSON string for SQLite
        seniority,
      },
    });

    return NextResponse.json({
      message: "Job target created successfully",
      jobTarget: {
        id: jobTarget.id,
        title: jobTarget.title,
        company: jobTarget.company,
        skills,
        requirements,
        seniority,
        createdAt: jobTarget.createdAt,
      },
    });
  } catch (error: any) {
    console.error("Job target creation error:", error);

    if (error.issues) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create job target" },
      { status: 500 }
    );
  }
}
