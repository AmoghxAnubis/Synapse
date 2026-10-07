import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Synapse — Your personal AI operating system",
  description: "Private document memory, cited answers, and controlled actions with local inference.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en" suppressHydrationWarning><body className="font-sans antialiased">
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}<Toaster position="bottom-right" />
    </ThemeProvider>
  </body></html>;
}
