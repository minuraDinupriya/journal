"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Trash2, RotateCcw, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow, differenceInDays } from "date-fns";

type TrashItem = {
  id: string;
  type: 'trade' | 'journal';
  title: string;
  deletedAt: string;
};

export default function TrashPage() {
  const [items, setItems] = useState<TrashItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTrash();
  }, []);

  const fetchTrash = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/trash');
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch trash");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async (id: string, type: 'trade' | 'journal') => {
    try {
      const res = await fetch(`/api/trash/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      });
      
      if (!res.ok) throw new Error("Failed to restore");
      
      toast.success("Item restored successfully");
      setItems(items.filter(item => item.id !== id));
    } catch (error) {
      toast.error("Failed to restore item");
    }
  };

  const handleHardDelete = async (id: string, type: 'trade' | 'journal') => {
    if (!confirm("Are you sure you want to permanently delete this item? This cannot be undone.")) return;
    
    try {
      const res = await fetch(`/api/trash/${id}?type=${type}`, {
        method: 'DELETE'
      });
      
      if (!res.ok) throw new Error("Failed to delete");
      
      toast.success("Item permanently deleted");
      setItems(items.filter(item => item.id !== id));
    } catch (error) {
      toast.error("Failed to delete item");
    }
  };

  const handleEmptyTrash = async () => {
    if (!confirm("Are you sure you want to empty the trash? ALL items will be permanently deleted.")) return;
    
    try {
      const res = await fetch('/api/trash/empty', {
        method: 'DELETE'
      });
      
      if (!res.ok) throw new Error("Failed to empty trash");
      
      toast.success("Trash emptied");
      setItems([]);
    } catch (error) {
      toast.error("Failed to empty trash");
    }
  };

  const getDaysLeft = (deletedAt: string) => {
    const deletedDate = new Date(deletedAt);
    const daysPassed = differenceInDays(new Date(), deletedDate);
    return Math.max(0, 30 - daysPassed);
  };

  if (isLoading) {
    return <div className="container mx-auto p-6 max-w-4xl">Loading trash...</div>;
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Trash2 className="w-8 h-8 text-muted-foreground" />
            Trash
          </h1>
          <p className="text-muted-foreground mt-1">Items in trash will be automatically deleted after 30 days.</p>
        </div>
        
        {items.length > 0 && (
          <Button variant="destructive" onClick={handleEmptyTrash}>
            Empty Trash
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="pt-6 flex flex-col items-center text-center py-12 text-muted-foreground">
            <Trash2 className="w-12 h-12 mb-4 opacity-20" />
            <p>Your trash is empty.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const daysLeft = getDaysLeft(item.deletedAt);
            return (
              <Card key={`${item.type}-${item.id}`} className="overflow-hidden">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold px-2 py-1 rounded bg-secondary uppercase text-secondary-foreground">
                        {item.type}
                      </span>
                      <h3 className="font-semibold line-clamp-1">{item.title}</h3>
                    </div>
                    <div className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
                      <span>Deleted {formatDistanceToNow(new Date(item.deletedAt))} ago</span>
                      <span>•</span>
                      <span className={`flex items-center gap-1 ${daysLeft <= 3 ? 'text-red-500 font-medium' : ''}`}>
                        {daysLeft <= 3 && <AlertTriangle className="w-3 h-3" />}
                        {daysLeft} days until permanent deletion
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button variant="outline" size="sm" onClick={() => handleRestore(item.id, item.type)}>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Restore
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleHardDelete(item.id, item.type)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
