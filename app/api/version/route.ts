import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/permissions";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Version id is required" },
        { status: 400 }
      );
    }

    const version = await db.version.findUnique({ where: { id } });
    if (!version) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: version.id,
      label: version.label,
      content: version.content,
      isActive: version.isActive,
      createdAt: version.createdAt.toISOString(),
      documentId: version.documentId,
    });
  } catch (error: any) {
    console.error("GET /api/version error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch version" },
      { status: 500 }
    );
  }
}
