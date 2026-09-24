"use client";

import React from "react";
import { CheckSquare, Square } from "lucide-react";

interface NotionRendererProps {
  content: string;
  className?: string;
  clampLines?: number;
}

/**
 * Parses inline formatting like **bold**, *italic*, `code`.
 */
function parseInline(text: string): React.ReactNode[] {
  // Regex to match **bold**, *italic*, `code`
  const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`)/g;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      return (
        <strong key={index} className="font-bold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length >= 2) {
      return (
        <em key={index} className="italic text-foreground/90">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
      return (
        <code
          key={index}
          className="px-1.5 py-0.5 rounded bg-slate-800/80 text-indigo-400 font-mono text-xs font-medium border border-slate-700/50"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

/**
 * Renders Notion-style Markdown content with H1, H2, H3, Bold, Divider Lines, Lists, and Callouts.
 */
export function NotionRenderer({ content, className = "", clampLines }: NotionRendererProps) {
  if (!content) return null;

  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];

  let currentList: { type: "bullet" | "number"; items: React.ReactNode[] } | null = null;

  const flushList = () => {
    if (currentList) {
      if (currentList.type === "bullet") {
        elements.push(
          <ul key={`list-${elements.length}`} className="list-disc list-outside ml-5 space-y-1 my-2">
            {currentList.items.map((item, idx) => (
              <li key={idx} className="text-slate-300 text-sm leading-relaxed">
                {item}
              </li>
            ))}
          </ul>
        );
      } else {
        elements.push(
          <ol key={`list-${elements.length}`} className="list-decimal list-outside ml-5 space-y-1 my-2">
            {currentList.items.map((item, idx) => (
              <li key={idx} className="text-slate-300 text-sm leading-relaxed">
                {item}
              </li>
            ))}
          </ol>
        );
      }
      currentList = null;
    }
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    // 1. Horizontal Divider Line like Notion (--- or *** or ___ )
    if (/^(\-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      flushList();
      elements.push(
        <div key={idx} className="my-4">
          <hr className="border-t-2 border-slate-700/80 rounded-full" />
        </div>
      );
      return;
    }

    // 2. H1 Header (# Header 1)
    if (trimmed.startsWith("# ")) {
      flushList();
      elements.push(
        <h1
          key={idx}
          className="text-2xl font-bold tracking-tight text-white border-b border-slate-800 pb-1.5 mt-4 mb-2 first:mt-0"
        >
          {parseInline(trimmed.slice(2))}
        </h1>
      );
      return;
    }

    // 3. H2 Header (## Header 2)
    if (trimmed.startsWith("## ")) {
      flushList();
      elements.push(
        <h2
          key={idx}
          className="text-lg font-bold tracking-tight text-slate-100 mt-3 mb-1.5 first:mt-0"
        >
          {parseInline(trimmed.slice(3))}
        </h2>
      );
      return;
    }

    // 4. H3 Header (### Header 3)
    if (trimmed.startsWith("### ")) {
      flushList();
      elements.push(
        <h3 key={idx} className="text-base font-semibold text-slate-200 mt-2 mb-1 first:mt-0">
          {parseInline(trimmed.slice(4))}
        </h3>
      );
      return;
    }

    // 5. Checkbox List item ([ ] or [x])
    if (/^\[([ xX])\]\s+/.test(trimmed)) {
      flushList();
      const isChecked = trimmed.startsWith("[x]") || trimmed.startsWith("[X]");
      const itemText = trimmed.replace(/^\[([ xX])\]\s+/, "");
      elements.push(
        <div key={idx} className="flex items-start gap-2 my-1 text-sm text-slate-300">
          {isChecked ? (
            <CheckSquare className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
          ) : (
            <Square className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
          )}
          <span className={isChecked ? "line-through text-slate-500" : ""}>
            {parseInline(itemText)}
          </span>
        </div>
      );
      return;
    }

    // 6. Bulleted List (- or * )
    if (/^[-*]\s+/.test(trimmed)) {
      const itemText = trimmed.replace(/^[-*]\s+/, "");
      if (!currentList || currentList.type !== "bullet") {
        flushList();
        currentList = { type: "bullet", items: [] };
      }
      currentList.items.push(parseInline(itemText));
      return;
    }

    // 7. Numbered List (1. 2. etc.)
    if (/^\d+\.\s+/.test(trimmed)) {
      const itemText = trimmed.replace(/^\d+\.\s+/, "");
      if (!currentList || currentList.type !== "number") {
        flushList();
        currentList = { type: "number", items: [] };
      }
      currentList.items.push(parseInline(itemText));
      return;
    }

    // 8. Callout / Quote (> Quote)
    if (trimmed.startsWith("> ")) {
      flushList();
      elements.push(
        <div
          key={idx}
          className="border-l-4 border-indigo-500 bg-indigo-500/10 pl-3.5 py-2 my-2.5 rounded-r-md text-sm text-slate-200 italic"
        >
          {parseInline(trimmed.slice(2))}
        </div>
      );
      return;
    }

    // Flush any pending list if we hit normal text or blank line
    flushList();

    // 9. Blank line
    if (trimmed === "") {
      elements.push(<div key={idx} className="h-2" />);
      return;
    }

    // 10. Normal Paragraph
    elements.push(
      <p key={idx} className="text-sm text-slate-300 leading-relaxed my-1">
        {parseInline(line)}
      </p>
    );
  });

  flushList();

  return (
    <div
      className={`notion-content ${className} ${
        clampLines ? `line-clamp-${clampLines}` : ""
      }`}
    >
      {elements}
    </div>
  );
}
