import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/permissions";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await req.json();
    const { documentId, label, content } = body;

    if (!documentId || !label || !content) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify user owns the document
    const document = await db.document.findUnique({
      where: { id: documentId },
      select: { userId: true },
    });

    if (!document || document.userId !== user.id) {
      return NextResponse.json(
        { error: "Document not found or access denied" },
        { status: 404 }
      );
    }

    // Create new version
    const version = await db.version.create({
      data: {
        documentId,
        label,
        content,
        isActive: false, // New versions are not active by default
      },
    });

    return NextResponse.json({
      message: "Version saved successfully",
      version: {
        id: version.id,
        label: version.label,
        createdAt: version.createdAt,
      },
    });
  } catch (error: any) {
    console.error("Version save error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save version" },
      { status: 500 }
    );
  }
}
