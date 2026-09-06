import "./globals.css";
import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "JobHunter AI — AI Job Search & Application Assistant",
  description: "Accelerate your career with AI-powered resume tailoring, intelligent job matching, and real-time application tracking.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#09090b] text-[#f4f4f5] antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
