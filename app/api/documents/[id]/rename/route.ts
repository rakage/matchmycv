import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/permissions";
import { db } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
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

    // Verify user owns the document
    const document = await db.document.findUnique({
      where: { id: params.id },
      select: { userId: true },
    });

    if (!document || document.userId !== user.id) {
      return NextResponse.json(
        { error: "Document not found or access denied" },
        { status: 404 }
      );
    }

    // Update the document title
    const updatedDocument = await db.document.update({
      where: { id: params.id },
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
