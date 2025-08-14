import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/permissions";
import { getAIProvider } from "@/lib/ai/provider";
import { EditAction } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await req.json();
    const { documentId, action, content, section, context } = body;

    if (!documentId || !action || !content) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create the edit prompt based on action and context
    let prompt = "";

    switch (action) {
      case "rewrite":
        prompt = `Please rewrite this ${section} to make it more impactful and professional:\n\n${content}`;
        if (context) {
          prompt += `\n\nContext: ${context}`;
        }
        break;
      case "quantify":
        prompt = `Please add quantifiable metrics and numbers to this ${section} to demonstrate impact:\n\n${content}`;
        break;
      case "keyword_fit":
        prompt = `Please incorporate relevant keywords naturally into this ${section}:\n\n${content}`;
        if (context) {
          prompt += `\n\nJob context: ${context}`;
        }
        break;
      case "tone_adjust":
        prompt = `Please improve the tone and language of this ${section} to be more professional and confident:\n\n${content}`;
        break;
      default:
        return NextResponse.json(
          { error: "Invalid action type" },
          { status: 400 }
        );
    }

    const editAction: EditAction = {
      type: action,
      target: content,
      context: context || "",
    };

    const aiProvider = getAIProvider();
    const editedText = await aiProvider.editText(prompt, editAction);

    return NextResponse.json({
      editedText,
      originalText: content,
      action,
      section,
    });
  } catch (error: any) {
    console.error("AI edit error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to edit content" },
      { status: 500 }
    );
  }
}
