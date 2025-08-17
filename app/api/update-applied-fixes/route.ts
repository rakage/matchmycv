import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/permissions";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { documentId, versionId, experienceIndex, bulletIndex, fixType } =
      await req.json();

    if (!documentId) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    if (
      typeof experienceIndex !== "number" ||
      typeof bulletIndex !== "number"
    ) {
      return NextResponse.json(
        { error: "Experience index and bullet index are required" },
        { status: 400 }
      );
    }

    if (!fixType || !["urgent", "critical", "optional"].includes(fixType)) {
      return NextResponse.json(
        { error: "Valid fix type is required (urgent, critical, optional)" },
        { status: 400 }
      );
    }

    // Get the current analysis
    const whereClause: any = { documentId };
    if (versionId) {
      whereClause.versionId = versionId;
    }

    const currentAnalysis = await db.cVAnalysis.findFirst({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });

    if (!currentAnalysis) {
      return NextResponse.json(
        { error: "No analysis found for this document" },
        { status: 404 }
      );
    }

    // Parse the experience analysis
    let experienceAnalysis = JSON.parse(currentAnalysis.experienceAnalysis);

    // Find the specific experience and update the overall issues count
    const experienceEntry = experienceAnalysis.find(
      (exp: any) => exp.experienceIndex === experienceIndex
    );

    if (experienceEntry && experienceEntry.overallIssues[fixType] > 0) {
      experienceEntry.overallIssues[fixType] -= 1;
    }

    // Update the database with the modified analysis
    await db.cVAnalysis.update({
      where: { id: currentAnalysis.id },
      data: {
        experienceAnalysis: JSON.stringify(experienceAnalysis),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Applied fix tracked successfully",
      updatedCounts: experienceEntry?.overallIssues,
    });
  } catch (error: any) {
    console.error("Update applied fixes error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update applied fixes" },
      { status: 500 }
    );
  }
}
