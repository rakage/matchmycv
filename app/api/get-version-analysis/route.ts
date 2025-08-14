import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/permissions";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get("documentId");
    const versionId = searchParams.get("versionId");

    if (!documentId) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    // If versionId is provided, look for analysis specific to that version
    // For now, we'll use the general document analysis since we haven't implemented version-specific analysis yet
    // This can be extended later to store analysis per version

    const latestAnalysis = await db.cVAnalysis.findFirst({
      where: { documentId },
      orderBy: { createdAt: "desc" },
    });

    if (!latestAnalysis) {
      return NextResponse.json({ analysis: null, experienceAnalysis: null });
    }

    const analysis = {
      id: latestAnalysis.id,
      overallGrade: latestAnalysis.overallGrade,
      overallScore: latestAnalysis.overallScore,
      summary: latestAnalysis.summary,
    };

    const experienceAnalysis = latestAnalysis.experienceAnalysis
      ? JSON.parse(latestAnalysis.experienceAnalysis)
      : null;

    return NextResponse.json({
      analysis,
      experienceAnalysis,
      versionId: versionId || null,
    });
  } catch (error: any) {
    console.error("Get version analysis error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get version analysis" },
      { status: 500 }
    );
  }
}
