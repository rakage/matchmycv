import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/permissions";
import { uploadFile } from "@/lib/storage";
import { extractTextFromFile, structureCVText } from "@/lib/file-processing";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Validate file type and size
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only PDF and DOCX files are allowed." },
        { status: 400 }
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      // 10MB limit
      return NextResponse.json(
        { error: "File size exceeds 10MB limit" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Upload to storage
    const { storageKey, fileSize } = await uploadFile(
      fileBuffer,
      file.name,
      file.type,
      user.id
    );

    // Extract text from file
    const rawText = await extractTextFromFile(fileBuffer, file.type);

    // Structure the CV text using LLM
    const structured = await structureCVText(rawText);

    // Save document to database (convert structured data to JSON string for SQLite)
    const document = await db.document.create({
      data: {
        userId: user.id,
        title,
        storageKey,
        mimeType: file.type,
        fileSize,
        rawText,
        structured: JSON.stringify(structured),
      },
      include: {
        versions: true,
      },
    });

    // Create initial version
    await db.version.create({
      data: {
        documentId: document.id,
        label: "Original",
        content: rawText,
        isActive: true,
      },
    });

    return NextResponse.json({
      message: "File uploaded successfully",
      document: {
        id: document.id,
        title: document.title,
        fileSize: document.fileSize,
        mimeType: document.mimeType,
        createdAt: document.createdAt,
        extractedText: rawText.slice(0, 500) + "...", // Preview
        structure: structured,
      },
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload file" },
      { status: 500 }
    );
  }
}
