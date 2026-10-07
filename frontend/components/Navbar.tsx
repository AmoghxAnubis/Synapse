import Link from "next/link";
import { Brain } from "lucide-react";

export default function Navbar() {
  return <nav className="flex items-center justify-between p-6" aria-label="Main navigation">
    <Link href="/" className="flex items-center gap-2 font-semibold"><Brain className="h-5 w-5" />Synapse</Link>
    <Link href="/dashboard" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white">Open workspace</Link>
  </nav>;
}
