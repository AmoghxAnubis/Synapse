import Link from "next/link";
import { Brain, FileText, LockKeyhole, CheckCircle2, ArrowRight, Layers, Plug } from "lucide-react";
import Navbar from "@/components/Navbar";

const features = [
  { icon: FileText, title: "A memory you can inspect", text: "Import PDFs, notes, text, and code. Read the passages behind an answer and keep sources up to date." },
  { icon: LockKeyhole, title: "Local inference by default", text: "Embeddings and answers run on your computer. Connected features are off until you choose to enable them." },
  { icon: CheckCircle2, title: "Actions you approve", text: "Review destinations and content before an app opens or a message or issue is created. Approvals are single use." },
];
export default function HomePage() {
  return <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
    <div className="max-w-6xl mx-auto"><Navbar />
      <main className="px-6">
        <section className="py-20 sm:py-28 grid lg:grid-cols-2 gap-14 items-center">
          <div><p className="text-xs font-medium tracking-widest text-indigo-500 uppercase">Your context. Your computer.</p>
            <h1 className="mt-5 text-5xl sm:text-6xl font-semibold tracking-tight leading-[1.05]">Make your knowledge<br /><span className="text-indigo-500">work with you.</span></h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-neutral-500">Synapse brings your documents, conversations, and selected workspace sources into a local AI workspace?with evidence you can verify and actions you control.</p>
            <div className="mt-8 flex flex-wrap gap-4"><Link href="/dashboard" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 text-white px-6 py-3">Open your workspace<ArrowRight className="h-4 w-4" /></Link><a href="#how-it-works" className="rounded-xl border px-6 py-3">How it works</a></div>
            <p className="mt-5 text-xs text-neutral-500">Local backend, embedding model, and Ollama required. No cloud account.</p>
          </div>
          <div className="rounded-3xl border bg-white dark:bg-neutral-900 p-7 sm:p-9 shadow-xl shadow-indigo-500/5">
            <div className="flex gap-2 items-center text-sm font-medium"><Brain className="h-5 w-5 text-indigo-500" />Synapse workspace</div>
            <div className="mt-7 rounded-xl bg-neutral-50 dark:bg-neutral-950 p-4 text-sm">What did we decide about the release?</div>
            <div className="mt-4 text-sm leading-relaxed text-neutral-500">An answer grounded in your imported notes, with references to the exact supporting passages.</div>
            <div className="mt-5 rounded-xl border p-4 text-xs"><span className="font-medium text-indigo-500">Evidence</span><p className="mt-2 text-neutral-500">Meeting notes ? page 1 ? passage 3</p></div>
            <p className="mt-6 text-[11px] text-neutral-400">Illustration of the workflow</p>
          </div>
        </section>
        <section className="grid md:grid-cols-3 gap-6 pb-20">{features.map(f => <article key={f.title} className="rounded-2xl border bg-white dark:bg-neutral-900 p-7"><f.icon className="h-6 w-6 text-indigo-500" /><h2 className="mt-5 font-semibold text-lg">{f.title}</h2><p className="mt-3 text-sm leading-relaxed text-neutral-500">{f.text}</p></article>)}</section>
        <section id="how-it-works" className="border-t py-16 grid md:grid-cols-2 gap-10">
          <div><Layers className="text-indigo-500 h-6 w-6" /><h2 className="text-3xl font-semibold mt-4">Start with one useful question.</h2><p className="text-neutral-500 mt-4 leading-relaxed">Pair your browser, import a document, and ask about it. Conversations persist locally, and repeated imports update your memory without duplicate passages.</p></div>
          <div><Plug className="text-indigo-500 h-6 w-6" /><h2 className="text-3xl font-semibold mt-4">Connect only what you choose.</h2><p className="text-neutral-500 mt-4 leading-relaxed">Choose repositories, pages, projects, or channels. Credentials live in your OS credential store. Web search requires consent because the question leaves your computer.</p></div>
        </section>
      </main><footer className="border-t px-6 py-8 text-xs text-neutral-500 flex justify-between"><span>Synapse ? Local AI workspace</span><Link href="/dashboard/settings">Privacy and connection settings</Link></footer>
    </div>
  </div>;
}
