import { NextRequest, NextResponse } from "next/server";
import { requireAuth, checkUsageLimit } from "@/lib/permissions";
import { db } from "@/lib/db";
import { analysisRequestSchema } from "@/lib/validations";
import { getAIProvider } from "@/lib/ai/provider";
import { checkRateLimit, analysisRateLimit } from "@/lib/rate-limit";

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

    // Get AI provider and perform analysis
    const aiProvider = getAIProvider();
    const analysisResult = await aiProvider.generateAnalysis(
      document.rawText,
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
