import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import ClientProviders from "@/components/ClientProviders";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Synapse — AI OS Assistant",
  description:
    "A local-first, privacy-centric AI assistant powered by AMD Ryzen AI. Your personal OS copilot.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased cursor-none`} suppressHydrationWarning>
        <ClientProviders>
          {children}
        </ClientProviders>
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}

