import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Providers } from "@/components/providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: {
    default: "MatchMyCV - AI-Powered CV Optimization",
    template: "%s | MatchMyCV",
  },
  description:
    "Get your CV job-ready in minutes with AI-powered analysis, scoring, and optimization. ATS-friendly recommendations and automatic editing.",
  keywords: [
    "CV",
    "resume",
    "ATS",
    "job search",
    "AI",
    "optimization",
    "career",
  ],
  authors: [{ name: "MatchMyCV" }],
  creator: "MatchMyCV",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://matchmycv.com",
    title: "MatchMyCV - AI-Powered CV Optimization",
    description:
      "Get your CV job-ready in minutes with AI-powered analysis and optimization.",
    siteName: "MatchMyCV",
  },
  twitter: {
    card: "summary_large_image",
    title: "MatchMyCV - AI-Powered CV Optimization",
    description:
      "Get your CV job-ready in minutes with AI-powered analysis and optimization.",
    creator: "@matchmycv",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.variable
        )}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
