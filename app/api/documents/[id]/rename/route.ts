import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/permissions";
import { db } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const { title } = await req.json();

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const trimmedTitle = title.trim();
    if (trimmedTitle.length > 100) {
      return NextResponse.json(
        { error: "Title cannot exceed 100 characters" },
        { status: 400 }
      );
    }

    // Check if document exists and belongs to user
    const existingDocument = await db.document.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existingDocument || existingDocument.userId !== user.id) {
      return NextResponse.json(
        { error: "Document not found or access denied" },
        { status: 404 }
      );
    }

    // Update the document title
    const updatedDocument = await db.document.update({
      where: { id },
      data: { title: trimmedTitle },
      select: {
        id: true,
        title: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updatedDocument);
  } catch (error: any) {
    console.error("Rename document error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to rename document" },
      { status: 500 }
    );
  }
}
