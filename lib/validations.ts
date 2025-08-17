import { z } from "zod";

// Auth schemas
export const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const signUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Document upload schemas
export const documentUploadSchema = z.object({
  title: z.string().min(1, "Title is required"),
  file: z
    .instanceof(File)
    .refine(
      (file) => file.size <= 10 * 1024 * 1024, // 10MB
      "File size must be less than 10MB"
    )
    .refine(
      (file) =>
        [
          "application/pdf",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ].includes(file.type),
      "File must be PDF or DOCX"
    ),
});

export const jobTargetSchema = z.object({
  title: z.string().min(1, "Job title is required"),
  company: z.string().optional(),
  description: z
    .string()
    .min(50, "Job description must be at least 50 characters"),
});

// Analysis schemas
export const analysisRequestSchema = z.object({
  documentId: z.string().min(1, "Document ID is required"),
  versionId: z.string().optional(),
  jobTargetId: z.string().min(1, "Job target ID is required"),
  weights: z
    .object({
      skillsFit: z.number().min(0).max(100).default(35),
      experience: z.number().min(0).max(100).default(25),
      keywordsATS: z.number().min(0).max(100).default(20),
      readability: z.number().min(0).max(100).default(10),
      seniority: z.number().min(0).max(100).default(10),
    })
    .optional(),
});

// AI Edit schemas
export const editRequestSchema = z.object({
  documentId: z.string().min(1, "Document ID is required"),
  versionId: z.string().min(1).optional(),
  action: z.enum(["rewrite", "quantify", "keyword_fit", "tone_adjust"]),
  target: z.string().min(1, "Target text is required"),
  context: z.string().optional(),
  parameters: z.record(z.string(), z.any()).optional(),
});

export const bulkEditSchema = z.object({
  documentId: z.string().min(1, "Document ID is required"),
  jobTargetId: z.string().min(1, "Job target ID is required"),
  mode: z.enum(["auto", "suggestions_only"]),
});

// Version schemas
export const createVersionSchema = z.object({
  documentId: z.string().min(1, "Document ID is required"),
  label: z.string().min(1, "Version label is required"),
  content: z.string().min(1, "Content is required"),
});

// Export schemas
export const exportRequestSchema = z.object({
  documentId: z.string().min(1, "Document ID is required"),
  versionId: z.string().min(1, "Version ID is required").optional(),
  format: z.enum(["pdf", "docx"]),
  options: z
    .object({
      includeComments: z.boolean().default(false),
      template: z.string().optional(),
    })
    .optional(),
});

// Admin schemas
export const updateUserSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  updates: z.object({
    role: z.enum(["USER", "ADMIN"]).optional(),
    plan: z.enum(["FREE", "PRO"]).optional(),
    credits: z.number().min(0).optional(),
  }),
});

// Settings schemas
export const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  email: z.string().email("Invalid email address").optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(6, "Current password is required"),
    newPassword: z
      .string()
      .min(6, "New password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// Utility types
export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type DocumentUploadInput = z.infer<typeof documentUploadSchema>;
export type JobTargetInput = z.infer<typeof jobTargetSchema>;
export type AnalysisRequestInput = z.infer<typeof analysisRequestSchema>;
export type EditRequestInput = z.infer<typeof editRequestSchema>;
export type ExportRequestInput = z.infer<typeof exportRequestSchema>;
