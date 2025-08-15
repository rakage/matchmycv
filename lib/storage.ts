import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  ServerSideEncryption,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";

// Check if S3 is configured
const isS3Configured = !!(
  process.env.S3_ACCESS_KEY_ID &&
  process.env.S3_SECRET_ACCESS_KEY &&
  process.env.S3_BUCKET
);

// AWS S3 Configuration
export const AWS_CONFIG = {
  region: process.env.S3_REGION || "us-east-1",
  accessKeyId: process.env.S3_ACCESS_KEY_ID!,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  bucketName: process.env.S3_BUCKET!,
};

// Initialize S3 Client only if configured
let s3Client: S3Client | null = null;

if (isS3Configured) {
  s3Client = new S3Client({
    region: AWS_CONFIG.region,
    credentials: {
      accessKeyId: AWS_CONFIG.accessKeyId,
      secretAccessKey: AWS_CONFIG.secretAccessKey,
    },
  });
}

// Local storage directory for development
const LOCAL_STORAGE_DIR = path.join(process.cwd(), "uploads");

// Ensure local storage directory exists
if (!isS3Configured) {
  if (!fs.existsSync(LOCAL_STORAGE_DIR)) {
    fs.mkdirSync(LOCAL_STORAGE_DIR, { recursive: true });
  }
}

export interface UploadResult {
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
}

export async function uploadFile(
  file: Buffer,
  originalName: string,
  mimeType: string,
  userId: string
): Promise<{ storageKey: string; fileSize: number }> {
  const fileExtension = originalName.split(".").pop();
  const storageKey = `documents/${userId}/${uuidv4()}.${fileExtension}`;

  if (isS3Configured && s3Client) {
    // Use S3 storage
    try {
      console.log(`📤 Uploading file to S3: ${storageKey}`);

      const uploadParams = {
        Bucket: AWS_CONFIG.bucketName,
        Key: storageKey,
        Body: file,
        ContentType: mimeType,
        CacheControl: "max-age=31536000", // Cache for 1 year
        ServerSideEncryption: ServerSideEncryption.AES256,
        Metadata: {
          originalName,
          userId,
          uploadedAt: new Date().toISOString(),
        },
      };

      const command = new PutObjectCommand(uploadParams);
      await s3Client.send(command);

      console.log(`✅ File uploaded successfully to S3: ${storageKey}`);
      return {
        storageKey,
        fileSize: file.length,
      };
    } catch (error) {
      console.error("❌ S3 upload error:", error);
      throw new Error("Failed to upload file to S3");
    }
  } else {
    // Use local storage for development
    console.log("⚠️ S3 not configured, using local storage for development");

    const userDir = path.join(LOCAL_STORAGE_DIR, userId);
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }

    const filePath = path.join(LOCAL_STORAGE_DIR, storageKey);
    const fileDir = path.dirname(filePath);

    if (!fs.existsSync(fileDir)) {
      fs.mkdirSync(fileDir, { recursive: true });
    }

    try {
      fs.writeFileSync(filePath, file);
      console.log(`✅ File saved locally: ${storageKey}`);
      return {
        storageKey,
        fileSize: file.length,
      };
    } catch (error) {
      console.error("❌ Local storage error:", error);
      throw new Error("Failed to save file locally");
    }
  }
}

export async function getFileUrl(
  storageKey: string,
  expiresInSeconds: number = 3600
): Promise<string> {
  if (isS3Configured && s3Client) {
    // Generate S3 signed URL
    try {
      const command = new GetObjectCommand({
        Bucket: AWS_CONFIG.bucketName,
        Key: storageKey,
      });

      return await getSignedUrl(s3Client, command, {
        expiresIn: expiresInSeconds,
      });
    } catch (error) {
      console.error("❌ S3 signed URL error:", error);
      throw new Error("Failed to generate download URL");
    }
  } else {
    // For local storage, return a local file URL
    return `/api/files/${storageKey}`;
  }
}

export async function downloadFile(storageKey: string): Promise<Buffer> {
  if (isS3Configured && s3Client) {
    // Download from S3
    try {
      const command = new GetObjectCommand({
        Bucket: AWS_CONFIG.bucketName,
        Key: storageKey,
      });

      const response = await s3Client.send(command);

      if (!response.Body) {
        throw new Error("No file content received");
      }

      // Convert the stream to buffer
      const chunks: Uint8Array[] = [];
      const reader = response.Body.transformToWebStream().getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }

      return Buffer.concat(chunks);
    } catch (error) {
      console.error("❌ S3 download error:", error);
      throw new Error("Failed to download file from S3");
    }
  } else {
    // Download from local storage
    const filePath = path.join(LOCAL_STORAGE_DIR, storageKey);

    try {
      if (!fs.existsSync(filePath)) {
        throw new Error("File not found");
      }
      return fs.readFileSync(filePath);
    } catch (error) {
      console.error("❌ Local storage download error:", error);
      throw new Error("Failed to download file from local storage");
    }
  }
}

export async function deleteFile(storageKey: string): Promise<void> {
  if (isS3Configured && s3Client) {
    // Delete from S3
    try {
      const command = new DeleteObjectCommand({
        Bucket: AWS_CONFIG.bucketName,
        Key: storageKey,
      });

      await s3Client.send(command);
      console.log(`✅ File deleted from S3: ${storageKey}`);
    } catch (error) {
      console.error("❌ S3 delete error:", error);
      throw new Error("Failed to delete file from S3");
    }
  } else {
    // Delete from local storage
    const filePath = path.join(LOCAL_STORAGE_DIR, storageKey);

    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`✅ File deleted locally: ${storageKey}`);
      }
    } catch (error) {
      console.error("❌ Local storage delete error:", error);
      throw new Error("Failed to delete file from local storage");
    }
  }
}

export async function storeExportFile(
  content: Buffer,
  filename: string,
  userId: string
): Promise<string> {
  const storageKey = `exports/${userId}/${uuidv4()}-${filename}`;

  if (isS3Configured && s3Client) {
    // Store in S3
    try {
      const uploadParams = {
        Bucket: AWS_CONFIG.bucketName,
        Key: storageKey,
        Body: content,
        ContentType: filename.endsWith(".pdf")
          ? "application/pdf"
          : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ServerSideEncryption: ServerSideEncryption.AES256,
      };

      const command = new PutObjectCommand(uploadParams);
      await s3Client.send(command);

      console.log(`✅ Export file stored in S3: ${storageKey}`);
      return storageKey;
    } catch (error) {
      console.error("❌ S3 export storage error:", error);
      throw new Error("Failed to store export file in S3");
    }
  } else {
    // Store locally
    const filePath = path.join(LOCAL_STORAGE_DIR, storageKey);
    const fileDir = path.dirname(filePath);

    if (!fs.existsSync(fileDir)) {
      fs.mkdirSync(fileDir, { recursive: true });
    }

    try {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Export file stored locally: ${storageKey}`);
      return storageKey;
    } catch (error) {
      console.error("❌ Local export storage error:", error);
      throw new Error("Failed to store export file locally");
    }
  }
}

// Additional helper functions from the provided S3Helper class
export class S3Helper {
  // Get public URL for a file (only works with public S3 buckets)
  static getPublicUrl(key: string): string {
    if (!isS3Configured) {
      return `/api/files/${key}`;
    }
    return `https://${AWS_CONFIG.bucketName}.s3.${AWS_CONFIG.region}.amazonaws.com/${key}`;
  }

  // Generate pre-signed URL for secure uploads
  static async generatePresignedUploadUrl(
    key: string,
    contentType: string,
    expiresIn: number = 3600
  ): Promise<string> {
    if (!isS3Configured || !s3Client) {
      throw new Error("S3 is not configured");
    }

    const command = new PutObjectCommand({
      Bucket: AWS_CONFIG.bucketName,
      Key: key,
      ContentType: contentType,
    });

    return await getSignedUrl(s3Client, command, { expiresIn });
  }

  // Generate pre-signed POST for direct browser uploads
  static async createPresignedPost(
    key: string,
    contentType: string,
    maxFileSize: number = 10000000, // 10MB default
    expiresIn: number = 600 // 10 minutes
  ): Promise<{
    url: string;
    fields: Record<string, string>;
  }> {
    if (!isS3Configured || !s3Client) {
      throw new Error("S3 is not configured");
    }

    const presignedPost = await createPresignedPost(s3Client, {
      Bucket: AWS_CONFIG.bucketName,
      Key: key,
      Conditions: [
        ["content-length-range", 1024, maxFileSize],
        ["eq", "$Content-Type", contentType],
      ],
      Fields: {
        "Content-Type": contentType,
        "x-amz-server-side-encryption": "AES256",
      },
      Expires: expiresIn,
    });

    return presignedPost;
  }

  // Generate unique file path for CV documents
  static generateCVFilePath(originalFileName: string, userId: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const sanitizedName = originalFileName
      .replace(/[^a-zA-Z0-9.-]/g, "_")
      .substring(0, 50);

    const fileName = `${timestamp}-${randomString}-${sanitizedName}`;
    return `documents/${userId}/${fileName}`;
  }

  // Validate AWS configuration
  static validateConfig(): { valid: boolean; missing: string[] } {
    const missing: string[] = [];

    if (!AWS_CONFIG.accessKeyId) missing.push("S3_ACCESS_KEY_ID");
    if (!AWS_CONFIG.secretAccessKey) missing.push("S3_SECRET_ACCESS_KEY");
    if (!AWS_CONFIG.bucketName) missing.push("S3_BUCKET");
    if (!AWS_CONFIG.region) missing.push("S3_REGION");

    return {
      valid: missing.length === 0,
      missing,
    };
  }

  // Test S3 connection
  static async testConnection(): Promise<{ success: boolean; error?: string }> {
    if (!isS3Configured || !s3Client) {
      return {
        success: false,
        error: "S3 is not configured",
      };
    }

    try {
      const { ListObjectsV2Command } = await import("@aws-sdk/client-s3");

      const command = new ListObjectsV2Command({
        Bucket: AWS_CONFIG.bucketName,
        MaxKeys: 1,
      });

      await s3Client.send(command);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown connection error",
      };
    }
  }
}

export default S3Helper;
