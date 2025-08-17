"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  FileText,
  Calendar,
  BarChart3,
  Eye,
  Download,
  MoreHorizontal,
  Trash2,
  Edit,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RenameDocumentDialog } from "./rename-document-dialog";
import { DeleteDocumentDialog } from "./delete-document-dialog";
import { toast } from "sonner";

interface DocumentWithRelations {
  id: string;
  title: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
  updatedAt: string;
  versions: Array<{
    id: string;
    label: string;
    createdAt: string;
  }>;
  analyses: Array<{
    id: string;
    overallScore: number;
    createdAt: string;
    jobTarget: {
      title: string;
      company: string | null;
    };
  }>;
  _count: {
    analyses: number;
    versions: number;
  };
}

interface DocumentsListProps {
  documents: DocumentWithRelations[];
  onDocumentUpdate?: (documentId: string, newTitle: string) => void;
}

export function DocumentsList({
  documents,
  onDocumentUpdate,
}: DocumentsListProps) {
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());
  const [renameDialog, setRenameDialog] = useState({
    isOpen: false,
    documentId: "",
    currentTitle: "",
  });

  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [localDocuments, setLocalDocuments] = useState(documents);

  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    documentId: "",
    documentTitle: "",
  });

  const handleDownload = async (documentId: string, title: string) => {
    setDownloadingIds((prev) => new Set([...prev, documentId]));

    try {
      const response = await fetch(`/api/documents/${documentId}/download`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to download document");
      }

      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      console.error("Download failed:", error);
      // You could add a toast notification here
      toast.error("Failed to download document", {
        description: error.message || "Failed to download document",
        duration: 5000,
      });
    } finally {
      setDownloadingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(documentId);
        return newSet;
      });
    }
  };

  const handleRename = (documentId: string, currentTitle: string) => {
    setRenameDialog({
      isOpen: true,
      documentId,
      currentTitle,
    });
  };

  const handleRenameComplete = (newTitle: string) => {
    // Update local state
    setLocalDocuments((prev) =>
      prev.map((doc) =>
        doc.id === renameDialog.documentId ? { ...doc, title: newTitle } : doc
      )
    );

    // Notify parent component if callback provided
    if (onDocumentUpdate) {
      onDocumentUpdate(renameDialog.documentId, newTitle);
    }
  };

  const closeRenameDialog = () => {
    setRenameDialog({
      isOpen: false,
      documentId: "",
      currentTitle: "",
    });
  };

  const handleDeleteClick = (documentId: string, documentTitle: string) => {
    setDeleteDialog({
      isOpen: true,
      documentId,
      documentTitle,
    });
  };

  const handleDeleteConfirm = async () => {
    const { documentId, documentTitle } = deleteDialog;
    setDeletingIds((prev) => new Set(prev).add(documentId));

    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete document");
      }

      // Remove document from local state
      setLocalDocuments((prev) => prev.filter((doc) => doc.id !== documentId));

      // Close dialog
      setDeleteDialog({
        isOpen: false,
        documentId: "",
        documentTitle: "",
      });

      // Show success toast
      toast.success(`"${documentTitle}" has been permanently deleted.`);
    } catch (error: any) {
      console.error("Delete failed:", error);

      // Show error toast
      toast.error("Failed to delete document", {
        description:
          error.message || "An unexpected error occurred. Please try again.",
      });
    } finally {
      setDeletingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(documentId);
        return newSet;
      });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({
      isOpen: false,
      documentId: "",
      documentTitle: "",
    });
  };

  if (localDocuments.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No documents yet
            </h3>
            <p className="mt-2 text-gray-500">
              Upload your first CV to get started with AI-powered analysis.
            </p>
            <div className="mt-6">
              <Button asChild>
                <Link href="/app/new">Upload Your First CV</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {localDocuments.map((document) => (
          <Card key={document.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-lg truncate">
                      {document.title}
                    </CardTitle>
                    <CardDescription>
                      {document.mimeType === "application/pdf" ? "PDF" : "DOCX"}{" "}
                      • {(document.fileSize / 1024 / 1024).toFixed(1)} MB
                    </CardDescription>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/app/editor/${document.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View & Edit
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        handleDownload(document.id, document.title)
                      }
                      disabled={downloadingIds.has(document.id)}
                    >
                      {downloadingIds.has(document.id) ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="mr-2 h-4 w-4" />
                      )}
                      Download
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleRename(document.id, document.title)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() =>
                        handleDeleteClick(document.id, document.title)
                      }
                      disabled={deletingIds.has(document.id)}
                    >
                      {deletingIds.has(document.id) ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="mr-2 h-4 w-4" />
                      )}
                      {deletingIds.has(document.id) ? "Deleting..." : "Delete"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">
                    {document._count.analyses} analyses
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">
                    {formatDistanceToNow(new Date(document.updatedAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </div>

              {/* Recent Analyses */}
              {document.analyses.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    Recent Analyses
                  </h4>
                  <div className="space-y-2">
                    {document.analyses.slice(0, 2).map((analysis) => (
                      <Link
                        key={analysis.id}
                        href={`/app/analysis/${analysis.id}`}
                        className="block"
                      >
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {analysis.jobTarget.title}
                            </p>
                            {analysis.jobTarget.company && (
                              <p className="text-xs text-gray-500">
                                {analysis.jobTarget.company}
                              </p>
                            )}
                          </div>
                          <Badge
                            variant={
                              analysis.overallScore >= 80
                                ? "default"
                                : analysis.overallScore >= 60
                                ? "secondary"
                                : "destructive"
                            }
                          >
                            {analysis.overallScore}%
                          </Badge>
                        </div>
                      </Link>
                    ))}
                    {document._count.analyses > 2 && (
                      <p className="text-xs text-gray-500 text-center">
                        +{document._count.analyses - 2} more analyses
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-2">
                <Button asChild size="sm" className="flex-1">
                  <Link href={`/app/new?documentId=${document.id}`}>
                    <BarChart3 className="mr-2 h-4 w-4" />
                    New Analysis
                  </Link>
                </Button>
                {document.analyses.length > 0 && (
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/app/editor/${document.id}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Rename Dialog */}
      <RenameDocumentDialog
        isOpen={renameDialog.isOpen}
        onClose={closeRenameDialog}
        documentId={renameDialog.documentId}
        currentTitle={renameDialog.currentTitle}
        onRename={handleRenameComplete}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteDocumentDialog
        isOpen={deleteDialog.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        documentTitle={deleteDialog.documentTitle}
        isDeleting={deletingIds.has(deleteDialog.documentId)}
      />
    </>
  );
}
