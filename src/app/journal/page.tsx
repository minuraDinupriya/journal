"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, ChevronDown, ChevronUp, Image as ImageIcon, Eye, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { JournalEditor } from "@/components/journal/journal-editor";
import { NotionRenderer } from "@/components/ui/notion-renderer";
import { JournalEntry, JournalFormData } from "@/types/journal";

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Lightbox state for full-screen screenshot viewing
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchEntries();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowLeft" && lightboxImages.length > 1) {
        setLightboxIndex((prev) => (prev !== null ? (prev === 0 ? lightboxImages.length - 1 : prev - 1) : null));
      }
      if (e.key === "ArrowRight" && lightboxImages.length > 1) {
        setLightboxIndex((prev) => (prev !== null ? (prev === lightboxImages.length - 1 ? 0 : prev + 1) : null));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, lightboxImages]);

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

  const parseImages = (imgs: string | null | undefined): string[] => {
    if (!imgs) return [];
    try {
      return JSON.parse(imgs) as string[];
    } catch {
      return [];
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trading Journal</h1>
          <p className="text-sm text-muted-foreground mt-1">Reflect on psychology, execution, and attach screenshots</p>
        </div>
        <Button onClick={() => { setIsAdding(true); setEditingId(null); }}>
          <Plus className="mr-2 h-4 w-4" /> New Entry
        </Button>
      </div>

      {isAdding && (
        <Card className="mb-8 border-indigo-500/30 bg-slate-950/80 shadow-md">
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
          {entries.map(entry => {
            const entryImages = parseImages(entry.images);
            return (
              <Card key={entry.id} className="overflow-hidden bg-slate-950/70 border-slate-800 hover:border-slate-700 transition-colors">
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
                      className="p-6 flex items-center justify-between cursor-pointer hover:bg-slate-900/40 transition-colors"
                      onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0 pr-4">
                        <div className="text-4xl shrink-0" title={`Mood: ${entry.mood}/5`}>
                          {getMoodEmoji(entry.mood)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-slate-200">
                            {new Date(entry.createdAt).toLocaleString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div className="text-muted-foreground text-sm line-clamp-1 mt-0.5">
                            {entry.content}
                          </div>
                          {entryImages.length > 0 && (
                            <div className="mt-1.5 flex items-center gap-1.5">
                              <span className="text-[11px] font-medium text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                <ImageIcon className="w-3 h-3" />
                                {entryImages.length} {entryImages.length === 1 ? 'screenshot' : 'screenshots'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white" onClick={(e) => { e.stopPropagation(); setEditingId(entry.id); }} title="Edit Entry">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(entry.id); }} title="Delete Entry">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <div className="p-1">
                          {expandedId === entry.id ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                        </div>
                      </div>
                    </div>
                    {expandedId === entry.id && (
                      <div className="px-6 pb-6 pt-2 border-t border-slate-800/80 bg-slate-900/20">
                        {/* Notion-style Rendered Content */}
                        <div className="mt-4">
                          <NotionRenderer content={entry.content} />
                        </div>

                        {/* Screenshots Gallery */}
                        {entryImages.length > 0 && (
                          <div className="mt-6 pt-4 border-t border-slate-800/80">
                            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                              <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                              Attached Screenshots ({entryImages.length})
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                              {entryImages.map((imgUrl, imgIdx) => (
                                <div
                                  key={imgIdx}
                                  className="aspect-video relative rounded-lg overflow-hidden border border-slate-800 bg-slate-900 hover:border-indigo-500/60 cursor-pointer group transition-all"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setLightboxImages(entryImages);
                                    setLightboxIndex(imgIdx);
                                  }}
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={imgUrl}
                                    alt={`Screenshot ${imgIdx + 1}`}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <div className="bg-black/60 text-white rounded-full p-1.5 transform scale-90 group-hover:scale-100 transition-transform">
                                      <Eye className="w-4 h-4" />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Full-Screen Lightbox Viewer */}
      {lightboxIndex !== null && lightboxImages.length > 0 && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setLightboxIndex(null)}
        >
          <div 
            className="relative max-w-7xl max-h-screen w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button 
              className="absolute top-4 right-4 text-white/70 hover:text-white z-50 bg-black/60 p-2 rounded-full hover:bg-black/80 transition-colors"
              onClick={() => setLightboxIndex(null)}
              title="Close (Esc)"
            >
              <X className="w-6 h-6" />
            </button>
            
            {/* Previous Button */}
            {lightboxImages.length > 1 && (
              <button 
                className="absolute left-4 text-white/70 hover:text-white z-50 bg-black/60 p-2 rounded-full hover:bg-black/80 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex(prev => prev !== null ? (prev === 0 ? lightboxImages.length - 1 : prev - 1) : null);
                }}
                title="Previous (Left Arrow)"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* Image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={lightboxImages[lightboxIndex]} 
              alt={`Screenshot ${lightboxIndex + 1}`} 
              className="max-w-full max-h-[90vh] object-contain rounded-md shadow-2xl"
            />

            {/* Next Button */}
            {lightboxImages.length > 1 && (
              <button 
                className="absolute right-4 text-white/70 hover:text-white z-50 bg-black/60 p-2 rounded-full hover:bg-black/80 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex(prev => prev !== null ? (prev === lightboxImages.length - 1 ? 0 : prev + 1) : null);
                }}
                title="Next (Right Arrow)"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
            
            {/* Image Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white bg-black/70 px-3.5 py-1 rounded-full text-xs font-medium">
              {lightboxIndex + 1} / {lightboxImages.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
