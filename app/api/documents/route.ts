import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/permissions";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const user = await requireAuth();

    // Fetch user's documents
    const documents = await db.document.findMany({
      where: {
        userId: user.id,
      },
      select: {
        id: true,
        title: true,
        mimeType: true,
        fileSize: true,
        createdAt: true,
        versions: {
          select: {
            id: true,
            label: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ documents });
  } catch (error: any) {
    console.error("Documents fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch documents" },
      { status: 500 }
    );
  }
}
