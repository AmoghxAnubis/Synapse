import type { Metadata } from "next";
import { ClerkProvider, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Synapse — AI OS Assistant",
  description:
    "A local-first, privacy-centric AI assistant powered by AMD Ryzen AI.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-black`}
        >
          {/* Header / Navbar */}
          <header className="flex justify-between items-center px-6 h-16 border-b border-zinc-200">
            <Link href="/">
              <h1 className="text-lg font-bold cursor-pointer">
                Synapse
              </h1>
            </Link>

            <div className="flex items-center gap-4">
              <SignedOut>
                <Link href="/sign-in">
                  <button className="px-4 py-2 border rounded">
                    Sign In
                  </button>
                </Link>

                <Link href="/sign-up">
                  <button className="bg-black text-white rounded-full px-4 py-2 text-sm">
                    Sign Up
                  </button>
                </Link>
              </SignedOut>

              <SignedIn>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
            </div>
          </header>

          {/* Main Content */}
          <main>{children}</main>

          {/* Global Toast Notifications */}
          <Toaster position="bottom-right" />
        </body>
      </html>
    </ClerkProvider>
  );
}