import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });
export const metadata: Metadata = {
  title: "BudgeTX",
  description:
    "A personal finance management platform that helps users track their expenses, set budgets, and achieve their financial goals with ease.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className={inter.className}>
        <body className="min-h-full flex flex-col bg-background text-foreground antialiased">
          {children}
          <Toaster richColors />
        </body>
      </html>
    </ClerkProvider>
  );
}
