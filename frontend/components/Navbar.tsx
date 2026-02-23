"use client";

import {
  UserButton,
  SignedIn,
  SignedOut,
  SignInButton,
} from "@clerk/nextjs";

export default function Navbar() {
  return (
    <nav
      className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white"
    >
      <h1 className="text-lg font-bold">Synapse</h1>

      <div className="flex items-center gap-4">
        <SignedOut>
          <SignInButton mode="modal">
            <button className="px-4 py-2 rounded bg-black text-white">
              Sign In
            </button>
          </SignInButton>
        </SignedOut>

        <SignedIn>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
      </div>
    </nav>
  );
}