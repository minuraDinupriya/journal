"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { NotionRenderer } from "./notion-renderer";
import {
  Heading1,
  Heading2,
  Bold,
  Italic,
  Minus,
  List,
  CheckSquare,
  Quote,
  Code,
  Eye,
  Edit3,
} from "lucide-react";

interface NotionEditorProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  minHeight?: string;
  className?: string;
}

export function NotionEditor({
  id,
  value,
  onChange,
  placeholder = "Write in Notion style... (# H1, ## H2, **bold**, --- line, - bullets)",
  rows = 6,
  minHeight = "160px",
  className = "",
}: NotionEditorProps) {
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertFormat = (before: string, after: string = "", isBlock: boolean = false) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    let replacement = "";
    let newCursorPos = start;

    if (isBlock) {
      // Add newline if not at start of line
      const needsLeadingNewline = start > 0 && value[start - 1] !== "\n";
      const lead = needsLeadingNewline ? "\n" : "";
      replacement = `${lead}${before}${selectedText || ""}${after}\n`;
      newCursorPos = start + lead.length + before.length + (selectedText ? selectedText.length : 0);
    } else {
      replacement = `${before}${selectedText || "text"}${after}`;
      newCursorPos = start + before.length + (selectedText ? selectedText.length : 4);
    }

    const newValue = value.substring(0, start) + replacement + value.substring(end);
    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 10);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
      e.preventDefault();
      insertFormat("**", "**");
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "i") {
      e.preventDefault();
      insertFormat("*", "*");
    }
  };

  return (
    <div className={`border border-slate-800 rounded-lg overflow-hidden bg-slate-950/70 focus-within:border-indigo-500/60 transition-colors ${className}`}>
      {/* Notion Toolbar */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800/80 px-2 py-1.5 bg-slate-900/50 gap-1 text-xs">
        <div className="flex flex-wrap items-center gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertFormat("# ", "", true)}
            title="Header 1 (# )"
            className="h-7 px-2 font-bold hover:bg-slate-800 hover:text-white text-slate-300"
          >
            <Heading1 className="w-3.5 h-3.5 mr-0.5" />
            H1
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertFormat("## ", "", true)}
            title="Header 2 (## )"
            className="h-7 px-2 font-semibold hover:bg-slate-800 hover:text-white text-slate-300"
          >
            <Heading2 className="w-3.5 h-3.5 mr-0.5" />
            H2
          </Button>

          <div className="h-4 w-[1px] bg-slate-800 mx-1" />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertFormat("**", "**")}
            title="Bold (**text**)"
            className="h-7 px-2 font-bold hover:bg-slate-800 hover:text-white text-slate-300"
          >
            <Bold className="w-3.5 h-3.5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertFormat("*", "*")}
            title="Italic (*text*)"
            className="h-7 px-2 hover:bg-slate-800 hover:text-white text-slate-300"
          >
            <Italic className="w-3.5 h-3.5" />
          </Button>

          <div className="h-4 w-[1px] bg-slate-800 mx-1" />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertFormat("---", "", true)}
            title="Bold Divider Line (---)"
            className="h-7 px-2 hover:bg-slate-800 hover:text-indigo-400 text-slate-300 flex items-center gap-1"
          >
            <Minus className="w-4 h-4" />
            <span className="text-[11px] font-medium">Line</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertFormat("- ", "", true)}
            title="Bulleted List (- )"
            className="h-7 px-2 hover:bg-slate-800 hover:text-white text-slate-300"
          >
            <List className="w-3.5 h-3.5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertFormat("[ ] ", "", true)}
            title="Checklist ([ ] )"
            className="h-7 px-2 hover:bg-slate-800 hover:text-white text-slate-300"
          >
            <CheckSquare className="w-3.5 h-3.5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertFormat("> ", "", true)}
            title="Callout Block (> )"
            className="h-7 px-2 hover:bg-slate-800 hover:text-white text-slate-300"
          >
            <Quote className="w-3.5 h-3.5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertFormat("`", "`")}
            title="Inline Code (`code`)"
            className="h-7 px-2 hover:bg-slate-800 hover:text-white text-slate-300"
          >
            <Code className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Tab Toggle: Write / Preview */}
        <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded border border-slate-800/80">
          <button
            type="button"
            onClick={() => setActiveTab("write")}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === "write"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Edit3 className="w-3 h-3" />
            Write
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("preview")}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === "preview"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Eye className="w-3 h-3" />
            Preview
          </button>
        </div>
      </div>

      {/* Editor Body */}
      {activeTab === "write" ? (
        <Textarea
          id={id}
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={rows}
          style={{ minHeight }}
          className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent rounded-none resize-y p-3.5 font-sans text-sm leading-relaxed"
        />
      ) : (
        <div
          style={{ minHeight }}
          className="p-4 bg-slate-950/90 overflow-y-auto max-h-[450px]"
        >
          {value.trim() ? (
            <NotionRenderer content={value} />
          ) : (
            <div className="text-muted-foreground italic text-sm py-4 text-center">
              Nothing to preview yet. Switch back to Write to add notes.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
