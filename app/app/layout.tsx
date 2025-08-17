import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/permissions";
import { AppNavigation } from "@/components/app/navigation";
import { ToastProvider } from "@/components/providers/toast-provider";

export const metadata: Metadata = {
  title: {
    default: "Dashboard",
    template: "%s | MatchMyCV",
  },
  description: "Your CV analysis and optimization dashboard",
};

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/signin");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppNavigation user={user} />
      <main className="lg:pl-64">
        <div className="px-4 sm:px-6 lg:px-8 py-8">{children}</div>
      </main>
      <ToastProvider />
    </div>
  );
}
