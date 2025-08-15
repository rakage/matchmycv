import { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/permissions";
import { db } from "@/lib/db";
import { DocumentsList } from "@/components/app/documents-list";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

export const metadata: Metadata = {
  title: "My Documents",
  description: "Manage your uploaded CV documents",
};

export default async function DocumentsPage() {
  const user = await getCurrentUser();

  if (!user) {
    return null; // This shouldn't happen due to layout protection
  }

  // Fetch user's documents with related data
  const documentsRaw = await db.document.findMany({
    where: {
      userId: user.id,
    },
    include: {
      versions: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
      analyses: {
        orderBy: {
          createdAt: "desc",
        },
        take: 3,
        include: {
          jobTarget: {
            select: {
              title: true,
              company: true,
            },
          },
        },
      },
      _count: {
        select: {
          analyses: true,
          versions: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  // Convert Date objects to strings for client component
  const documents = documentsRaw.map((doc) => ({
    ...doc,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
    versions: doc.versions.map((version) => ({
      ...version,
      createdAt: version.createdAt.toISOString(),
    })),
    analyses: doc.analyses.map((analysis) => ({
      ...analysis,
      createdAt: analysis.createdAt.toISOString(),
    })),
  }));

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Documents</h1>
          <p className="mt-2 text-gray-600">
            Manage your uploaded CV documents and their analyses
          </p>
        </div>
        <Button asChild>
          <Link href="/app/new">
            <Upload className="mr-2 h-4 w-4" />
            Upload New CV
          </Link>
        </Button>
      </div>

      <DocumentsList documents={documents} />
    </div>
  );
}
