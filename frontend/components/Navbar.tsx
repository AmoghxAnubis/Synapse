"use client";

import {
  UserButton,
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
} from "@clerk/nextjs";

export default function Navbar() {
  return (
    <div className="flex justify-between p-4 border-b">
      <h1>Synapse</h1>

      <div className="flex gap-4 items-center">
        <SignedOut>
          <SignInButton>
            <button className="px-4 py-2 border rounded">
              Sign In
            </button>
          </SignInButton>

          <SignUpButton>
            <button className="px-4 py-2 bg-black text-white rounded">
              Sign Up
            </button>
          </SignUpButton>
        </SignedOut>

        <SignedIn>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
      </div>
    </div>
  );
}