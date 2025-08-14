import OpenAI from "openai";
import { AnalysisResult, EditAction, AIProvider } from "../../types";

export class OpenAIProvider implements AIProvider {
  name = "openai";
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
      baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
      defaultHeaders: {
        "HTTP-Referer":
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "MatchMyCV - AI CV Optimization",
      },
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

    Be specific and actionable in your recommendations. Focus on providing suggestions that can be directly applied in a CV editor interface.`;

    const userPrompt = `Job Description:
    ${jobDescription}

    CV/Resume:
    ${cvText}

    Please analyze this CV against the job description and provide detailed scoring and actionable recommendations that can be implemented in a CV editor.`;

    // Define the JSON schema for structured output
    const analysisSchema = {
      type: "object",
      properties: {
        overallScore: {
          type: "number",
          minimum: 0,
          maximum: 100,
          description: "Overall match score between 0-100",
        },
        subScores: {
          type: "object",
          properties: {
            skillsFit: {
              type: "number",
              minimum: 0,
              maximum: 100,
              description: "Skills fit score (0-100)",
            },
            experience: {
              type: "number",
              minimum: 0,
              maximum: 100,
              description: "Experience alignment score (0-100)",
            },
            keywordsATS: {
              type: "number",
              minimum: 0,
              maximum: 100,
              description: "Keywords/ATS compatibility score (0-100)",
            },
            readability: {
              type: "number",
              minimum: 0,
              maximum: 100,
              description: "Readability and format score (0-100)",
            },
            seniority: {
              type: "number",
              minimum: 0,
              maximum: 100,
              description: "Seniority level match score (0-100)",
            },
          },
          required: [
            "skillsFit",
            "experience",
            "keywordsATS",
            "readability",
            "seniority",
          ],
          additionalProperties: false,
        },
        gaps: {
          type: "object",
          properties: {
            missingSkills: {
              type: "array",
              items: {
                type: "string",
              },
              description:
                "List of specific skills mentioned in job description but missing from CV",
            },
            weakAreas: {
              type: "array",
              items: {
                type: "string",
              },
              description:
                "Specific areas where the CV could be strengthened (e.g., 'Professional Summary', 'Work Experience bullets')",
            },
            keywordOps: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  keyword: {
                    type: "string",
                    description: "Important keyword from job description",
                  },
                  importance: {
                    type: "string",
                    enum: ["high", "medium", "low"],
                    description: "Importance level of this keyword",
                  },
                  currentMentions: {
                    type: "number",
                    minimum: 0,
                    description:
                      "Number of times this keyword appears in the CV",
                  },
                  suggestedSection: {
                    type: "string",
                    enum: [
                      "contact",
                      "summary",
                      "experience",
                      "education",
                      "skills",
                    ],
                    description:
                      "Which CV section would benefit from this keyword",
                  },
                },
                required: [
                  "keyword",
                  "importance",
                  "currentMentions",
                  "suggestedSection",
                ],
                additionalProperties: false,
              },
              description:
                "Keyword opportunities with current usage analysis and suggested placement",
            },
          },
          required: ["missingSkills", "weakAreas", "keywordOps"],
          additionalProperties: false,
        },
        suggestions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              type: {
                type: "string",
                enum: [
                  "contact",
                  "summary",
                  "experience",
                  "education",
                  "skills",
                  "format",
                ],
                description: "Which CV section this suggestion applies to",
              },
              priority: {
                type: "string",
                enum: ["high", "medium", "low"],
                description: "Priority level of this suggestion",
              },
              title: {
                type: "string",
                description: "Brief, actionable title of the suggestion",
              },
              description: {
                type: "string",
                description: "Detailed description of what to improve and how",
              },
              section: {
                type: "string",
                enum: [
                  "contact",
                  "summary",
                  "experience",
                  "education",
                  "skills",
                ],
                description: "Specific CV section this applies to",
              },
              impact: {
                type: "string",
                description:
                  "Expected impact on ATS score and recruiter perception",
              },
              actionable: {
                type: "string",
                description:
                  "Specific action the user can take in the CV editor (e.g., 'Add LinkedIn profile URL', 'Rewrite summary with action verbs')",
              },
            },
            required: [
              "type",
              "priority",
              "title",
              "description",
              "section",
              "impact",
              "actionable",
            ],
            additionalProperties: false,
          },
          description:
            "List of actionable improvement suggestions organized by CV section",
        },
      },
      required: ["overallScore", "subScores", "gaps", "suggestions"],
      additionalProperties: false,
    };

    try {
      const response = await this.client.chat.completions.create({
        model: process.env.LLM_MODEL || "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 3000,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "cv_analysis",
            strict: true,
            schema: analysisSchema,
          },
        },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response content received");
      }

      return JSON.parse(content);
    } catch (error) {
      console.error("OpenAI analysis error:", error);

      // If it's a rate limit error, provide a more specific message
      if (error instanceof Error && error.message.includes("429")) {
        throw new Error("Rate limit exceeded. Please try again in a moment.");
      }

      throw new Error("Failed to generate analysis");
    }
  }

  async editText(prompt: string, action: EditAction): Promise<string> {
    const systemPrompt = `You are an expert CV/Resume editor specializing in ATS optimization and professional formatting. Your job is to improve CV content based on specific instructions while maintaining professional standards.

    Guidelines for CV editing:
    - Use strong action verbs (Led, Developed, Implemented, Achieved, Managed, etc.)
    - Include quantifiable results and metrics whenever possible (e.g., "Increased sales by 25%", "Managed team of 8 developers")
    - Ensure ATS-friendly language with relevant keywords
    - Keep content concise and impactful (bullet points should be 1-2 lines)
    - Maintain professional tone throughout
    - Preserve the original meaning while enhancing clarity and impact
    - Focus on achievements and outcomes, not just responsibilities

    For different action types:
    - "rewrite": Completely rewrite the content for better impact and ATS optimization
    - "quantify": Add or improve quantifiable metrics and specific achievements
    - "keyword_fit": Incorporate relevant job-specific keywords naturally
    - "tone_adjust": Adjust the tone to be more professional, confident, and achievement-focused

    For different CV sections:
    - Contact: Ensure complete professional contact information
    - Summary: 2-3 sentences highlighting key qualifications and career focus
    - Experience: Focus on achievements with quantified results using action verbs
    - Education: Include relevant coursework, honors, GPA if strong (3.5+)
    - Skills: Use specific, job-relevant technical and soft skills

    Return only the improved text without explanations, formatting markers, or additional commentary.`;

    try {
      const response = await this.client.chat.completions.create({
        model: process.env.LLM_MODEL || "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        temperature: 0.4,
        max_tokens: 1500,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response content received");
      }

      return content.trim();
    } catch (error) {
      console.error("OpenAI edit error:", error);

      // If it's a rate limit error, provide a more specific message
      if (error instanceof Error && error.message.includes("429")) {
        throw new Error("Rate limit exceeded. Please try again in a moment.");
      }

      throw new Error("Failed to edit text");
    }
  }

  async generateEmbeddings(text: string): Promise<number[]> {
    try {
      const response = await this.client.embeddings.create({
        model: process.env.EMBEDDINGS_MODEL || "text-embedding-3-small",
        input: text,
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error("OpenAI embeddings error:", error);

      // If it's a rate limit error, provide a more specific message
      if (error instanceof Error && error.message.includes("429")) {
        throw new Error("Rate limit exceeded. Please try again in a moment.");
      }

      throw new Error("Failed to generate embeddings");
    }
  }

  async extractCVStructure(cvText: string): Promise<any> {
    const systemPrompt = `You are an expert CV/Resume parser. Your job is to extract and structure CV content into a well-organized JSON format that matches a professional CV editor interface.

    Extract ALL information present in the CV, including:
    - Contact information (name, email, phone, location, website, LinkedIn)
    - Professional summary or objective
    - Work experience with company, title, duration, and bullet points
    - Education with degree, institution, and year
    - Skills (technical and soft skills)

    Guidelines:
    - Extract the person's name from headers, email signatures, or contact sections
    - If contact information is in a header or footer, extract it properly
    - Break down work experience into clear bullet points
    - Include ALL skills mentioned, both technical and soft skills
    - Preserve the original wording but clean up formatting
    - If a section is missing, include it as empty but maintain the structure
    - For experience bullets, focus on achievements and quantified results
    - Clean up any formatting artifacts (extra spaces, weird characters)`;

    const userPrompt = `Please extract and structure the following CV content:

    ${cvText}`;

    // Define the JSON schema for CV structure extraction
    const cvStructureSchema = {
      type: "object",
      properties: {
        sections: {
          type: "object",
          properties: {
            contact: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                  description: "Full name of the person",
                },
                email: {
                  type: "string",
                  description: "Email address",
                },
                phone: {
                  type: "string",
                  description: "Phone number",
                },
                location: {
                  type: "string",
                  description: "City, State/Country location",
                },
                website: {
                  type: "string",
                  description: "Personal website URL",
                },
                linkedin: {
                  type: "string",
                  description: "LinkedIn profile URL or username",
                },
              },
              required: [
                "name",
                "email",
                "phone",
                "location",
                "website",
                "linkedin",
              ],
              additionalProperties: false,
            },
            summary: {
              type: "string",
              description: "Professional summary or objective statement",
            },
            experience: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: {
                    type: "string",
                    description: "Job title or position",
                  },
                  company: {
                    type: "string",
                    description: "Company or organization name",
                  },
                  duration: {
                    type: "string",
                    description:
                      "Employment duration (e.g., 'Jan 2020 - Present')",
                  },
                  bullets: {
                    type: "array",
                    items: {
                      type: "string",
                    },
                    description:
                      "List of achievements, responsibilities, or accomplishments",
                  },
                },
                required: ["title", "company", "duration", "bullets"],
                additionalProperties: false,
              },
              description: "Work experience entries",
            },
            education: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  degree: {
                    type: "string",
                    description: "Degree name and field of study",
                  },
                  institution: {
                    type: "string",
                    description: "School, university, or institution name",
                  },
                  year: {
                    type: "string",
                    description: "Graduation year or year range",
                  },
                },
                required: ["degree", "institution", "year"],
                additionalProperties: false,
              },
              description: "Education entries",
            },
            skills: {
              type: "array",
              items: {
                type: "string",
              },
              description: "List of technical and soft skills",
            },
          },
          required: ["contact", "summary", "experience", "education", "skills"],
          additionalProperties: false,
        },
      },
      required: ["sections"],
      additionalProperties: false,
    };

    try {
      const response = await this.client.chat.completions.create({
        model: process.env.LLM_MODEL || "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.1,
        max_tokens: 3000,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "cv_structure",
            strict: true,
            schema: cvStructureSchema,
          },
        },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response content received");
      }

      return JSON.parse(content);
    } catch (error) {
      console.error("OpenAI CV extraction error:", error);

      // If it's a rate limit error, provide a more specific message
      if (error instanceof Error && error.message.includes("429")) {
        throw new Error("Rate limit exceeded. Please try again in a moment.");
      }

      throw new Error("Failed to extract CV structure");
    }
  }
}
