import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/permissions";
import { downloadFile } from "@/lib/storage";
import path from "path";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    // Require authentication to access files
    const user = await requireAuth();
    const { path: pathArray } = await params;

    // Reconstruct the file path
    const filePath = pathArray.join("/");

    // Security check: ensure the path starts with the user's directory
    if (
      !filePath.startsWith(`documents/${user.id}/`) &&
      !filePath.startsWith(`exports/${user.id}/`)
    ) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Download the file
    const fileBuffer = await downloadFile(filePath);

    // Determine content type based on file extension
    const extension = path.extname(filePath).toLowerCase();
    let contentType = "application/octet-stream";

    switch (extension) {
      case ".pdf":
        contentType = "application/pdf";
        break;
      case ".docx":
        contentType =
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        break;
      case ".doc":
        contentType = "application/msword";
        break;
    }

    // Return the file
    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${path.basename(filePath)}"`,
      },
    });
  } catch (error: any) {
    console.error("File serve error:", error);
    return NextResponse.json(
      { error: error.message || "File not found" },
      { status: 404 }
    );
  }
}
