import { NextResponse } from "next/server";
import { S3Helper } from "@/lib/storage";

export async function GET() {
  try {
    // Validate S3 configuration
    const configValidation = S3Helper.validateConfig();

    if (!configValidation.valid) {
      return NextResponse.json({
        success: false,
        message: "S3 configuration incomplete",
        missing: configValidation.missing,
        fallback: "Using local storage for development",
      });
    }

    // Test S3 connection
    const connectionTest = await S3Helper.testConnection();

    if (!connectionTest.success) {
      return NextResponse.json({
        success: false,
        message: "S3 connection failed",
        error: connectionTest.error,
        fallback: "Using local storage for development",
      });
    }

    return NextResponse.json({
      success: true,
      message: "S3 is configured and connected successfully",
      config: {
        region: process.env.S3_REGION,
        bucket: process.env.S3_BUCKET,
        hasAccessKey: !!process.env.S3_ACCESS_KEY_ID,
        hasSecretKey: !!process.env.S3_SECRET_ACCESS_KEY,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: "S3 test failed",
        error: error.message,
        fallback: "Using local storage for development",
      },
      { status: 500 }
    );
  }
}
