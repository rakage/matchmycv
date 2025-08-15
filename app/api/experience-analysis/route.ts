import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/permissions";
import { db } from "@/lib/db";
import { ExperienceEntry } from "@/lib/types";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { experience, experienceIndex, documentId } = await req.json();

    if (!experience || typeof experience !== "object") {
      return NextResponse.json(
        { error: "Experience data is required and must be an object" },
        { status: 400 }
      );
    }

    if (typeof experienceIndex !== "number") {
      return NextResponse.json(
        { error: "Experience index is required and must be a number" },
        { status: 400 }
      );
    }

    if (!documentId) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    // Analyze the single experience entry using AI
    const analysis = await analyzeSingleExperience(experience, experienceIndex);

    return NextResponse.json(analysis);
  } catch (error: any) {
    console.error("Experience analysis error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to analyze experience" },
      { status: 500 }
    );
  }
}

async function analyzeSingleExperience(
  experience: any,
  experienceIndex: number
) {
  const prompt = `You are an expert CV/Resume reviewer specializing in work experience optimization. Analyze the following work experience entry focusing on bullet point quality and impact.

Experience Data:
${JSON.stringify(experience, null, 2)}

For the work experience entry with index ${experienceIndex}, analyze its bullet points for:
- Missing quantifiable metrics (numbers, percentages, amounts)
- Weak action verbs (passive language)
- Lack of measurable impact or results
- Brief descriptions that lack detail
- Professional language issues
- Missing context about scope or scale
- Lack of specific achievements

Focus on providing actionable suggestions that:
- Add specific metrics and numbers
- Use strong action verbs (Achieved, Developed, Led, Managed, Improved, etc.)
- Highlight measurable impact and results
- Include relevant context and scope
- Demonstrate progression and growth

Return your analysis in the following JSON format:
{
  "experienceAnalysis": {
    "experienceIndex": ${experienceIndex},
    "title": "job title",
    "company": "company name",
    "overallIssues": {
      "urgent": 0,
      "critical": 0,
      "optional": 0
    },
    "bulletIssues": [
      {
        "bulletIndex": 0,
        "originalText": "original bullet text",
        "issues": ["specific issue 1", "specific issue 2"],
        "suggestedText": "improved version with metrics and strong action verbs",
        "priority": "urgent|critical|optional",
        "impact": "explanation of why this improvement matters for job applications"
      }
    ]
  }
}`;

  try {
    const response = await openai.chat.completions.create({
      model: process.env.LLM_MODEL || "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an expert work experience analyzer. Return only valid JSON with detailed bullet point analysis and actionable improvement suggestions.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.1,
      max_tokens: 4000,
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

      // Ensure experience analysis has proper structure
      if (analysis.experienceAnalysis) {
        analysis.experienceAnalysis.overallIssues =
          analysis.experienceAnalysis.bulletIssues.reduce(
            (
              acc: { urgent: number; critical: number; optional: number },
              issue: { priority: string }
            ) => {
              acc[issue.priority as keyof typeof acc] =
                (acc[issue.priority as keyof typeof acc] || 0) + 1;
              return acc;
            },
            { urgent: 0, critical: 0, optional: 0 }
          );
      }
    } catch (parseError) {
      console.error("AI response is not valid JSON:", aiContent);
      console.error("Parse error:", parseError);
      // Fallback analysis if AI response isn't valid JSON
      analysis = createFallbackExperienceAnalysis(experience, experienceIndex);
    }

    return analysis;
  } catch (error) {
    console.error("AI experience analysis failed:", error);
    return createFallbackExperienceAnalysis(experience, experienceIndex);
  }
}

function createFallbackExperienceAnalysis(
  experience: any,
  experienceIndex: number
) {
  if (!experience.bullets || experience.bullets.length === 0) {
    return {
      experienceAnalysis: {
        experienceIndex,
        title: experience.title || "Experience",
        company: experience.company || "Company",
        overallIssues: { urgent: 0, critical: 0, optional: 0 },
        bulletIssues: [],
      },
    };
  }

  const bulletIssues = experience.bullets.map(
    (bullet: string, bulletIndex: number) => {
      const issues = [];
      let priority = "optional";

      if (!bullet.match(/\d/)) {
        issues.push("Missing quantifiable metrics");
        priority = "urgent";
      }
      if (bullet.length < 30) {
        issues.push("Too brief, lacks detail");
        if (priority !== "urgent") priority = "critical";
      }
      if (
        !bullet.match(
          /^(Achieved|Developed|Led|Managed|Improved|Created|Implemented)/i
        )
      ) {
        issues.push("Weak action verb");
        if (priority === "optional") priority = "critical";
      }

      let suggestedText = bullet;
      if (!bullet.match(/\d/)) {
        suggestedText = `Achieved 25% improvement in ${bullet.toLowerCase()}`;
      }

      return {
        bulletIndex,
        originalText: bullet,
        issues:
          issues.length > 0
            ? issues
            : ["Consider adding more specific details"],
        suggestedText,
        priority,
        impact:
          "Strong bullet points with quantifiable achievements significantly improve your chances of getting interviews.",
      };
    }
  );

  return {
    experienceAnalysis: {
      experienceIndex,
      title: experience.title || "Experience",
      company: experience.company || "Company",
      overallIssues: bulletIssues.reduce(
        (
          acc: { urgent: number; critical: number; optional: number },
          issue: { priority: string }
        ) => {
          acc[issue.priority as keyof typeof acc]++;
          return acc;
        },
        { urgent: 0, critical: 0, optional: 0 }
      ),
      bulletIssues,
    },
  };
}
