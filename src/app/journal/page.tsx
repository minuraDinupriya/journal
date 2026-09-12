"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { JournalEditor } from "@/components/journal/journal-editor";
import { JournalEntry, JournalFormData } from "@/types";

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      const res = await fetch('/api/journal');
      if (res.ok) {
        const data = await res.json();
        setEntries(data);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch journal entries");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (data: JournalFormData) => {
    try {
      if (editingId) {
        const res = await fetch(`/api/journal/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Failed to update");
        toast.success("Entry updated successfully");
      } else {
        const res = await fetch('/api/journal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Failed to create");
        toast.success("Entry created successfully");
      }
      setIsAdding(false);
      setEditingId(null);
      fetchEntries();
    } catch (error) {
      toast.error("Something went wrong");
      throw error;
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this entry?")) return;
    try {
      const res = await fetch(`/api/journal/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Entry deleted");
      fetchEntries();
    } catch (error) {
      toast.error("Failed to delete entry");
    }
  };

  const getMoodEmoji = (mood: number) => {
    switch(mood) {
      case 1: return "😫";
      case 2: return "😟";
      case 3: return "😐";
      case 4: return "🙂";
      case 5: return "😄";
      default: return "😐";
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Trading Journal</h1>
        <Button onClick={() => { setIsAdding(true); setEditingId(null); }}>
          <Plus className="mr-2 h-4 w-4" /> New Entry
        </Button>
      </div>

      {isAdding && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>New Journal Entry</CardTitle>
          </CardHeader>
          <CardContent>
            <JournalEditor
              onSave={handleSave}
              onCancel={() => setIsAdding(false)}
              isSaving={false}
            />
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading entries...</div>
      ) : entries.length === 0 && !isAdding ? (
        <div className="text-center py-12 text-muted-foreground border rounded-lg bg-muted/50">
          <p>Start journaling to track your trading psychology</p>
          <Button variant="link" onClick={() => setIsAdding(true)}>Create your first entry</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map(entry => (
            <Card key={entry.id} className="overflow-hidden">
              {editingId === entry.id ? (
                <div className="p-6">
                  <JournalEditor
                    initialData={entry}
                    onSave={handleSave}
                    onCancel={() => setEditingId(null)}
                    isSaving={false}
                  />
                </div>
              ) : (
                <>
                  <div 
                    className="p-6 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-4xl" title={`Mood: ${entry.mood}/5`}>
                        {getMoodEmoji(entry.mood)}
                      </div>
                      <div>
                        <div className="font-semibold">{new Date(entry.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                        <div className="text-muted-foreground text-sm line-clamp-1 mt-1">
                          {entry.content}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setEditingId(entry.id); }}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(entry.id); }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      {expandedId === entry.id ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                    </div>
                  </div>
                  {expandedId === entry.id && (
                    <div className="px-6 pb-6 pt-2 border-t">
                      <div className="whitespace-pre-wrap text-sm leading-relaxed mt-4">
                        {entry.content}
                      </div>
                    </div>
                  )}
                </>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
