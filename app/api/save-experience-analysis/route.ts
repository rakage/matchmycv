import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/permissions";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { documentId, experienceAnalysis } = await req.json();

    if (!documentId) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    if (!experienceAnalysis || !Array.isArray(experienceAnalysis)) {
      return NextResponse.json(
        { error: "Experience analysis data is required and must be an array" },
        { status: 400 }
      );
    }

    // Update the existing CV analysis record with combined experience analysis results
    await db.cVAnalysis.updateMany({
      where: {
        documentId,
      },
      data: {
        experienceAnalysis: JSON.stringify(experienceAnalysis),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Experience analysis saved successfully",
      count: experienceAnalysis.length,
    });
  } catch (error: any) {
    console.error("Save experience analysis error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save experience analysis" },
      { status: 500 }
    );
  }
}
