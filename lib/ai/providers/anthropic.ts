import Anthropic from "@anthropic-ai/sdk";
import { AnalysisResult, EditAction, AIProvider } from "../../types";

export class AnthropicProvider implements AIProvider {
  name = "anthropic";
  private client: Anthropic;

  constructor() {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is required");
    }

    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  async generateAnalysis(
    cvText: string,
    jobDescription: string
  ): Promise<AnalysisResult> {
    const systemPrompt = `You are an expert CV/Resume analyst and ATS specialist. Your job is to analyze a CV against a specific job description and provide detailed scoring and recommendations.

    Analyze the CV for:
    1. Skills Fit (35%): How well candidate's skills match job requirements
    2. Experience Alignment (25%): Relevance of work experience to the role
    3. Keywords/ATS (20%): Presence of important keywords for ATS systems
    4. Readability (10%): Format, structure, and clarity
    5. Seniority Fit (10%): Experience level matching job requirements

    Return your analysis as a JSON object with this exact structure:
    {
      "overallScore": number (0-100),
      "subScores": {
        "skillsFit": number (0-100),
        "experience": number (0-100), 
        "keywordsATS": number (0-100),
        "readability": number (0-100),
        "seniority": number (0-100)
      },
      "gaps": {
        "missingSkills": ["skill1", "skill2"],
        "weakAreas": ["area1", "area2"],
        "keywordOps": [{"keyword": "React", "importance": "high", "currentMentions": 0}]
      },
      "suggestions": [
        {
          "type": "skills",
          "priority": "high",
          "title": "Add missing technical skills",
          "description": "Include React, TypeScript in your skills section",
          "section": "skills",
          "impact": "Could improve ATS score by 15 points"
        }
      ]
    }

    Be specific and actionable in your recommendations.`;

    const userPrompt = `Job Description:
    ${jobDescription}

    CV/Resume:
    ${cvText}

    Please analyze this CV against the job description and provide the scoring and recommendations in the specified JSON format.`;

    try {
      const response = await this.client.messages.create({
        model: process.env.ANTHROPIC_MODEL || "claude-3-haiku-20240307",
        max_tokens: 2000,
        temperature: 0.3,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: userPrompt,
          },
        ],
      });

      const content = response.content[0];
      if (content.type !== "text") {
        throw new Error("Unexpected response type from Anthropic");
      }

      return JSON.parse(content.text);
    } catch (error) {
      console.error("Anthropic analysis error:", error);

      // If it's a rate limit error, provide a more specific message
      if (error instanceof Error && error.message.includes("429")) {
        throw new Error("Rate limit exceeded. Please try again in a moment.");
      }

      throw new Error("Failed to generate analysis");
    }
  }

  async editText(prompt: string, action: EditAction): Promise<string> {
    const systemPrompt = `You are an expert CV/Resume editor. Your job is to improve CV content based on specific instructions.

    Guidelines:
    - Maintain professional tone
    - Use strong action verbs (Led, Developed, Implemented, etc.)
    - Include quantifiable results when possible
    - Ensure ATS-friendly formatting
    - Keep content concise and impactful
    - Preserve the original meaning while enhancing clarity

    For different action types:
    - "rewrite": Completely rewrite the content for better impact
    - "quantify": Add or improve quantifiable metrics
    - "keyword_fit": Incorporate relevant keywords naturally
    - "tone_adjust": Adjust the tone (professional, confident, etc.)

    Return only the improved text without explanations or formatting.`;

    try {
      const response = await this.client.messages.create({
        model: process.env.ANTHROPIC_MODEL || "claude-3-haiku-20240307",
        max_tokens: 1500,
        temperature: 0.4,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      const content = response.content[0];
      if (content.type !== "text") {
        throw new Error("Unexpected response type from Anthropic");
      }

      return content.text.trim();
    } catch (error) {
      console.error("Anthropic edit error:", error);

      // If it's a rate limit error, provide a more specific message
      if (error instanceof Error && error.message.includes("429")) {
        throw new Error("Rate limit exceeded. Please try again in a moment.");
      }

      throw new Error("Failed to edit text");
    }
  }

  async generateEmbeddings(text: string): Promise<number[]> {
    // Anthropic doesn't provide embeddings, so we'll throw an error
    throw new Error(
      "Anthropic provider does not support embeddings generation"
    );
  }

  async extractCVStructure(cvText: string): Promise<any> {
    // For now, use the editText method as a fallback
    // In a production app, you'd implement proper CV extraction for Anthropic
    const prompt = `Extract and structure the following CV content into JSON format with sections for contact, summary, experience, education, and skills:

    ${cvText}

    Return only a valid JSON object with the structure:
    {
      "sections": {
        "contact": {"name": "", "email": "", "phone": "", "location": "", "website": "", "linkedin": ""},
        "summary": "",
        "experience": [{"title": "", "company": "", "duration": "", "bullets": []}],
        "education": [{"degree": "", "institution": "", "year": ""}],
        "skills": []
      }
    }`;

    try {
      const response = await this.editText(prompt, {
        type: "rewrite",
        target: cvText,
        context: "CV structure extraction",
      });

      return JSON.parse(response);
    } catch (error) {
      console.error("Anthropic CV extraction error:", error);
      throw new Error("Failed to extract CV structure");
    }
  }
}
