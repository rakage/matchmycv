import { NextRequest, NextResponse } from "next/server";
import { requireAuth, checkUsageLimit } from "@/lib/permissions";
import { db } from "@/lib/db";
import { analysisRequestSchema } from "@/lib/validations";
import { getAIProvider } from "@/lib/ai/provider";
import { checkRateLimit, analysisRateLimit } from "@/lib/rate-limit";

// Helper function to convert structured CV content back to text format
function convertStructuredToText(structuredContent: any): string {
  let text = "";

  // Add contact information
  if (structuredContent.contact) {
    const contact = structuredContent.contact;
    if (contact.name) text += `${contact.name}\n`;
    if (contact.email) text += `${contact.email}\n`;
    if (contact.phone) text += `${contact.phone}\n`;
    if (contact.location) text += `${contact.location}\n`;
    if (contact.website) text += `${contact.website}\n`;
    if (contact.linkedin) text += `${contact.linkedin}\n`;
    text += "\n";
  }

  // Add summary
  if (structuredContent.summary) {
    text += `SUMMARY\n${structuredContent.summary}\n\n`;
  }

  // Add experience
  if (
    structuredContent.experience &&
    Array.isArray(structuredContent.experience)
  ) {
    text += "EXPERIENCE\n";
    structuredContent.experience.forEach((exp: any) => {
      text += `${exp.title || ""} at ${exp.company || ""}\n`;
      if (exp.duration) text += `${exp.duration}\n`;
      if (exp.bullets && Array.isArray(exp.bullets)) {
        exp.bullets.forEach((bullet: string) => {
          if (bullet.trim()) text += `• ${bullet}\n`;
        });
      }
      text += "\n";
    });
  }

  // Add education
  if (
    structuredContent.education &&
    Array.isArray(structuredContent.education)
  ) {
    text += "EDUCATION\n";
    structuredContent.education.forEach((edu: any) => {
      text += `${edu.degree || ""} from ${edu.institution || ""}`;
      if (edu.year) text += ` (${edu.year})`;
      text += "\n";
    });
    text += "\n";
  }

  // Add skills
  if (structuredContent.skills && Array.isArray(structuredContent.skills)) {
    text += "SKILLS\n";
    text += structuredContent.skills
      .filter((skill: string) => skill.trim())
      .join(", ");
    text += "\n\n";
  }

  return text.trim();
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();

    // Rate limiting
    const rateLimitResult = await checkRateLimit(
      `analysis:${user.id}`,
      analysisRateLimit
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      );
    }

    // Check usage limits
    const usageCheck = await checkUsageLimit(
      user.id,
      "analyses",
      user.plan as any
    );

    if (!usageCheck.allowed) {
      return NextResponse.json(
        {
          error: "Analysis limit exceeded",
          details: {
            current: usageCheck.current,
            limit: usageCheck.limit,
            plan: user.plan,
          },
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = analysisRequestSchema.parse(body);

    // Fetch document and job target
    const document = await db.document.findFirst({
      where: {
        id: validatedData.documentId,
        userId: user.id,
      },
    });

    const jobTarget = await db.jobTarget.findFirst({
      where: {
        id: validatedData.jobTargetId,
        userId: user.id,
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    if (!jobTarget) {
      return NextResponse.json(
        { error: "Job target not found" },
        { status: 404 }
      );
    }

    // Determine which content to use for analysis
    let cvText = document.rawText; // Default to original document

    if (validatedData.versionId) {
      // If versionId is provided, fetch and use version content
      const version = await db.version.findFirst({
        where: {
          id: validatedData.versionId,
          documentId: document.id,
        },
      });

      if (!version) {
        return NextResponse.json(
          { error: "Version not found" },
          { status: 404 }
        );
      }

      // Parse version content and extract text for analysis
      try {
        const versionContent = JSON.parse(version.content);

        // Convert structured version content back to text format for analysis
        cvText = convertStructuredToText(versionContent);
      } catch (error) {
        console.error("Error parsing version content:", error);
        return NextResponse.json(
          { error: "Invalid version content format" },
          { status: 400 }
        );
      }
    }

    // Get AI provider and perform analysis
    const aiProvider = getAIProvider();
    const analysisResult = await aiProvider.generateAnalysis(
      cvText,
      jobTarget.rawText
    );

    // Save analysis to database (convert objects to JSON strings for SQLite)
    const analysis = await db.analysis.create({
      data: {
        userId: user.id,
        documentId: document.id,
        jobTargetId: jobTarget.id,
        overallScore: analysisResult.overallScore,
        subScores: JSON.stringify(analysisResult.subScores), // Convert object to JSON string
        gaps: JSON.stringify(analysisResult.gaps), // Convert object to JSON string
        suggestions: JSON.stringify(analysisResult.suggestions), // Convert array to JSON string
      },
    });

    // Record usage
    await db.usage.create({
      data: {
        userId: user.id,
        type: "ANALYSIS",
        metadata: JSON.stringify({
          analysisId: analysis.id,
          documentTitle: document.title,
          jobTitle: jobTarget.title,
        }), // Convert object to JSON string for SQLite
      },
    });

    return NextResponse.json({
      analysis: {
        id: analysis.id,
        overallScore: analysis.overallScore,
        subScores: analysis.subScores,
        gaps: analysis.gaps,
        suggestions: analysis.suggestions,
        createdAt: analysis.createdAt,
      },
      document: {
        id: document.id,
        title: document.title,
      },
      jobTarget: {
        id: jobTarget.id,
        title: jobTarget.title,
        company: jobTarget.company,
      },
      usage: {
        current: usageCheck.current + 1,
        limit: usageCheck.limit,
      },
    });
  } catch (error: any) {
    console.error("Analysis error:", error);

    if (error.issues) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to analyze document" },
      { status: 500 }
    );
  }
}
