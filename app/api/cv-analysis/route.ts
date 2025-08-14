import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/permissions";
import { db } from "@/lib/db";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { content, documentId } = await req.json();

    if (!content) {
      return NextResponse.json(
        { error: "CV content is required" },
        { status: 400 }
      );
    }

    if (!documentId) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    // Analyze the CV content using AI (includes experience analysis)
    const analysis = await analyzeCVContent(content);

    // Save analysis to database
    const savedAnalysis = await db.cVAnalysis.create({
      data: {
        documentId,
        overallScore: analysis.overallScore,
        overallGrade: analysis.overallGrade,
        summary: analysis.summary,
        urgentFixes: JSON.stringify([]), // Empty since we don't generate fixes anymore
        criticalFixes: JSON.stringify([]), // Empty since we don't generate fixes anymore
        optionalFixes: JSON.stringify([]), // Empty since we don't generate fixes anymore
        experienceAnalysis: JSON.stringify([]), // Empty since experience analysis is separate
      },
    });

    return NextResponse.json({
      ...analysis,
      id: savedAnalysis.id,
    });
  } catch (error: any) {
    console.error("CV analysis error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to analyze CV" },
      { status: 500 }
    );
  }
}

async function analyzeCVContent(content: any) {
  const prompt = `You are an expert CV/Resume reviewer. Analyze the following CV content for overall assessment only.

CV Content:
${JSON.stringify(content, null, 2)}

Provide a comprehensive analysis including:

1. OVERALL ASSESSMENT:
   - Single overall grade (A, B, C, or D)
   - Single overall score (0-100)
   - Brief summary of strengths and areas for improvement

Focus on:
- Professional formatting and structure
- Content quality and relevance
- Grammar and language
- Contact information completeness
- Summary/objective section
- Skills section relevance
- Education formatting
- Overall CV structure and flow
- ATS compatibility
- Professional presentation

Return your analysis in the following JSON format:
{
  "overallGrade": "A|B|C|D",
  "overallScore": 0-100,
  "summary": "Brief overall assessment highlighting key strengths and main areas for improvement"
}`;

  try {
    const response = await openai.chat.completions.create({
      model: process.env.LLM_MODEL || "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an expert CV reviewer. Return only valid JSON with overall assessment (grade, score, summary) only.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.1,
      max_tokens: 3000,
    });

    const aiContent = response.choices[0]?.message?.content;

    if (!aiContent) {
      throw new Error("No AI response received");
    }

    // Parse the AI response
    let analysis;
    try {
      // Clean the AI response - remove markdown code blocks if present
      let cleanedContent = aiContent.trim();
      if (cleanedContent.startsWith("```json")) {
        cleanedContent = cleanedContent
          .replace(/^```json\s*/, "")
          .replace(/\s*```$/, "");
      } else if (cleanedContent.startsWith("```")) {
        cleanedContent = cleanedContent
          .replace(/^```\s*/, "")
          .replace(/\s*```$/, "");
      }

      analysis = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error("AI response is not valid JSON:", aiContent);
      console.error("Parse error:", parseError);
      // Fallback analysis if AI response isn't valid JSON
      analysis = createFallbackAnalysis(content);
    }

    return analysis;
  } catch (error) {
    console.error("AI analysis failed:", error);
    return createFallbackAnalysis(content);
  }
}

function createFallbackAnalysis(content: any) {
  let overallScore = 85;
  let overallGrade = "B";

  // Basic analysis based on content structure
  if (!content.contact?.name || !content.contact?.email) {
    overallScore -= 15;
  }

  if (!content.summary || content.summary.length < 50) {
    overallScore -= 10;
  }

  if (!content.experience || content.experience.length === 0) {
    overallScore -= 20;
  }

  if (!content.skills || content.skills.length === 0) {
    overallScore -= 10;
  }

  // Determine grade based on score
  if (overallScore >= 90) overallGrade = "A";
  else if (overallScore >= 80) overallGrade = "B";
  else if (overallScore >= 70) overallGrade = "C";
  else overallGrade = "D";

  return {
    overallGrade,
    overallScore,
    summary: `Your CV shows ${
      overallGrade === "A"
        ? "excellent"
        : overallGrade === "B"
        ? "good"
        : overallGrade === "C"
        ? "adequate"
        : "significant room for improvement"
    } structure and content. Focus on work experience optimization for better results.`,
  };
}
