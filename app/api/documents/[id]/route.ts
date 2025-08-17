import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/permissions";
import { db } from "@/lib/db";
import { deleteFile } from "@/lib/storage";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    // Check if document exists and belongs to user
    const document = await db.document.findUnique({
      where: { id },
      select: { userId: true, title: true, storageKey: true },
    });

    if (!document || document.userId !== user.id) {
      return NextResponse.json(
        { error: "Document not found or access denied" },
        { status: 404 }
      );
    }

    // Delete the file from S3 storage first
    try {
      await deleteFile(document.storageKey);
      console.log(`✅ File deleted from storage: ${document.storageKey}`);

      // Also attempt to delete any potential export files for this document
      // Export files typically follow patterns like: exports/{documentId}_*.pdf or exports/{documentId}_*.docx
      try {
        const exportPatterns = [
          `exports/${id}_export.pdf`,
          `exports/${id}_export.docx`,
          `exports/${id}.pdf`,
          `exports/${id}.docx`,
        ];

        for (const exportPath of exportPatterns) {
          try {
            await deleteFile(exportPath);
            console.log(`✅ Export file deleted: ${exportPath}`);
          } catch (exportError) {
            // Silently ignore export file deletion errors as they might not exist
            console.log(
              `ℹ️ Export file not found or already deleted: ${exportPath}`
            );
          }
        }
      } catch (exportCleanupError) {
        console.log(
          "ℹ️ Export file cleanup completed with some files not found"
        );
      }
    } catch (storageError: any) {
      console.error("❌ Storage deletion error:", storageError);
      // Don't fail the entire operation if storage deletion fails
      // Log the error but continue with database deletion
    }

    // Delete the document from database (this will cascade delete related records)
    await db.document.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: `Document "${document.title}" deleted successfully`,
    });
  } catch (error: any) {
    console.error("Delete document error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete document" },
      { status: 500 }
    );
  }
}
