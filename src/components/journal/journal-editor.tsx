"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoodSelector } from "@/components/journal/mood-selector";
import { VoiceRecorder } from "@/components/ui/voice-recorder";
import { JournalEntry, JournalFormData } from "@/types/journal";
import { Loader2 } from "lucide-react";

interface JournalEditorProps {
  initialData?: JournalEntry;
  onSave: (data: JournalFormData) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}

export function JournalEditor({ initialData, onSave, onCancel, isSaving }: JournalEditorProps) {
  const [date, setDate] = useState(
    initialData?.date 
      ? new Date(initialData.date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  );
  const [mood, setMood] = useState(initialData?.mood || 3);
  const [content, setContent] = useState(initialData?.content || "");
  const [internalSaving, setInternalSaving] = useState(false);

  const handleSave = async () => {
    if (!content.trim()) return;
    try {
      setInternalSaving(true);
      await onSave({ date, mood, content });
    } finally {
      setInternalSaving(false);
    }
  };

  const loading = isSaving || internalSaving;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (!loading && content.trim()) {
          handleSave();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [loading, content, date, mood, onSave]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input 
            id="date" 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)} 
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <Label>Trading Mood</Label>
          <MoodSelector value={mood} onChange={setMood} />
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="content">Journal Entry</Label>
          <VoiceRecorder onTranscript={(text) => setContent(prev => prev + (prev ? " " : "") + text)} />
        </div>
        <Textarea 
          id="content" 
          placeholder="How did you feel during your trades today? Did you stick to your plan?" 
          value={content} 
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[150px]"
          disabled={loading}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={loading || !content.trim()} title="Press Ctrl+S to save">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Entry
          <kbd className="ml-2 hidden sm:inline-flex items-center text-[10px] bg-primary-foreground/20 text-primary-foreground px-1.5 py-0.5 rounded font-mono font-medium">
            Ctrl+S
          </kbd>
        </Button>
      </div>
    </div>
  );
}
