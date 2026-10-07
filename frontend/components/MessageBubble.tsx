"use client";
import React from "react";
import Link from "next/link";
import { Bot, User } from "lucide-react";
import { type Citation } from "@/lib/api";

export interface Message {
  id: string; role: "user" | "ai"; content: string; sources?: string[];
  citations?: Citation[]; hardwareFlow?: string; timestamp: Date;
}
export default React.memo(function MessageBubble({ msg }: { msg: Message }) {
  return <article className={"flex gap-3 " + (msg.role === "user" ? "flex-row-reverse" : "")}>
    <div className="mt-1 rounded-full bg-neutral-100 dark:bg-neutral-800 p-2 h-fit">{msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4 text-indigo-500" />}</div>
    <div className={"max-w-[90%] sm:max-w-[80%] rounded-2xl p-4 text-sm " + (msg.role === "user" ? "bg-indigo-600 text-white" : "border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900")}>
      <p className="whitespace-pre-wrap leading-relaxed">{msg.content || "Preparing an answer?"}</p>
      {!!msg.citations?.length && <details className="mt-4 border-t border-neutral-200 dark:border-neutral-800 pt-3">
        <summary className="cursor-pointer text-xs text-neutral-500">Evidence ? {msg.citations.length} passages</summary>
        <ol className="mt-3 space-y-3">{msg.citations.map((citation, i) => <li key={citation.id} className="text-xs">
          <Link href={"/dashboard/knowledge/source?name=" + encodeURIComponent(citation.source)} className="font-medium text-indigo-500">[{i+1}] {citation.source} ? page {citation.page}</Link>
          {citation.url && /^https?:\/\//.test(citation.url) && <a href={citation.url} target="_blank" rel="noopener noreferrer" className="ml-2 text-indigo-500 underline">Open original</a>}
          <p className="mt-1 whitespace-pre-wrap text-neutral-500">{citation.text}</p>
        </li>)}</ol>
      </details>}
    </div>
  </article>;
});
