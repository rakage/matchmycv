"use client";

import { Toaster } from "sonner";

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      richColors
      closeButton
      expand={true}
      duration={5000}
      toastOptions={{
        style: {
          background: "white",
          border: "1px solid #e5e7eb",
          color: "#374151",
        },
      }}
    />
  );
}
