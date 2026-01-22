import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import Navbar from "@/components/ui/navbar"; 

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ST User Appointments",
  description: "Manage your schedule efficiently.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50/50 min-h-screen`}>
        {/* Navbar cuma muncul di dalem page, logic-nya kita handle di komponen Navbar */}
        <Navbar />
        <main className="pt-20 pb-10 px-4 sm:px-6">
          {children}
        </main>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}