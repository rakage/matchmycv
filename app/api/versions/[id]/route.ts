import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/permissions";
import { db } from "@/lib/db";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const { content } = await req.json();

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    // Check if version exists and belongs to user's document
    const version = await db.version.findUnique({
      where: { id },
      include: {
        document: {
          select: { userId: true },
        },
      },
    });

    if (!version || version.document.userId !== user.id) {
      return NextResponse.json(
        { error: "Version not found or access denied" },
        { status: 404 }
      );
    }

    // Update the version
    const updatedVersion = await db.version.update({
      where: { id },
      data: {
        content,
      },
    });

    return NextResponse.json({
      success: true,
      version: updatedVersion,
    });
  } catch (error: any) {
    console.error("Update version error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update version" },
      { status: 500 }
    );
  }
}
