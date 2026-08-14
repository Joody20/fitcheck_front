// app/layout.tsx
import "./globals.css";
import "react-toastify/dist/ReactToastify.css";
import type { Metadata } from "next";
import LayoutShell from "@/src/shared/components/layout/LayoutShell";
import AuthProvider from "@/src/features/auth/providers/AuthProvider";
import ReactQueryProvider from "@/src/features/auth/providers/ReactQueryProvider";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: {
    default: "FITCHECK",
    template: "%s | FITCHECK",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body
        className="min-h-screen bg-[#ffffff] text-[#121212]"
      >
        <ReactQueryProvider>
          <Suspense fallback={null}>
            <AuthProvider>
              <LayoutShell>{children}</LayoutShell>
            </AuthProvider>
          </Suspense>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
