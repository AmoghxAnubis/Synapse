"use client";

import dynamic from "next/dynamic";
import { ClerkProvider } from "@clerk/nextjs";

const CustomCursor = dynamic(() => import("@/components/CustomCursor"), {
  ssr: false,
});

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <CustomCursor />
      {children}
    </ClerkProvider>
  );
}