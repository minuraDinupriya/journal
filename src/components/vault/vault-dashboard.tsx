"use client"

import { useState, useEffect } from "react"
import { Lock, Plus, Book, Target, Pencil, Trash2, ArrowUp, ArrowDown, ChevronsUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { VaultItem } from "@/types/vault"
import { VaultForm } from "./vault-form"
import { NotionRenderer } from "@/components/ui/notion-renderer"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function VaultDashboard({ lockVault }: { lockVault: () => void }) {
  const [items, setItems] = useState<VaultItem[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [editingItem, setEditingItem] = useState<VaultItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchItems = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/vault")
      if (res.ok) {
        setItems(await res.json())
      }
    } catch {
      toast.error("Failed to fetch vault items")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [])

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/vault/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success("Item deleted securely")
        fetchItems()
      } else {
        toast.error("Failed to delete item")
      }
    } catch {
      toast.error("Failed to delete item")
    }
  }

  const handleMove = async (type: 'STRATEGY' | 'KNOWLEDGE', currentIndex: number, direction: 'up' | 'down' | 'top') => {
    const currentList = items.filter(i => i.type === type)
    if (direction === 'up' && currentIndex === 0) return
    if (direction === 'down' && currentIndex === currentList.length - 1) return
    if (direction === 'top' && currentIndex === 0) return

    const reorderedList = [...currentList]
    const [movedItem] = reorderedList.splice(currentIndex, 1)

    let targetIndex = currentIndex
    if (direction === 'up') targetIndex = currentIndex - 1
    else if (direction === 'down') targetIndex = currentIndex + 1
    else if (direction === 'top') targetIndex = 0

    reorderedList.splice(targetIndex, 0, movedItem)

    // Re-assign order index 0, 1, 2...
    const payloadItems = reorderedList.map((item, idx) => ({ id: item.id, order: idx }))

    // Optimistic UI state update
    const otherTypeItems = items.filter(i => i.type !== type)
    const updatedTypeItems = reorderedList.map((item, idx) => ({ ...item, order: idx }))
    setItems([...otherTypeItems, ...updatedTypeItems])

    try {
      const res = await fetch('/api/vault/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: payloadItems })
      })
      if (!res.ok) throw new Error()
      toast.success(direction === 'top' ? 'Moved to top!' : 'Card position updated')
    } catch {
      toast.error('Failed to save order')
      fetchItems()
    }
  }

  if (isCreating || editingItem) {
    return (
      <div className="container mx-auto p-6 max-w-4xl space-y-6">
        <VaultForm 
          item={editingItem || undefined} 
          onClose={() => {
            setIsCreating(false)
            setEditingItem(null)
          }} 
          onSuccess={() => {
            setIsCreating(false)
            setEditingItem(null)
            fetchItems()
          }} 
        />
      </div>
    )
  }

  const strategies = items.filter(i => i.type === 'STRATEGY')
  const knowledge = items.filter(i => i.type === 'KNOWLEDGE')

  return (
    <div className="container mx-auto p-6 space-y-8 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">The Vault</h1>
          <p className="text-muted-foreground">Secure storage for your trading strategies and secret knowledge.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={lockVault}>
            <Lock className="w-4 h-4 mr-2" />
            Lock Vault
          </Button>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Entry
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground">Loading encrypted data...</div>
      ) : (
        <Tabs defaultValue="strategies" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="strategies" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Strategies <Badge variant="secondary" className="ml-1">{strategies.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="knowledge" className="flex items-center gap-2">
              <Book className="w-4 h-4" />
              Secret Knowledge <Badge variant="secondary" className="ml-1">{knowledge.length}</Badge>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="strategies" className="space-y-4">
            {strategies.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Target className="w-12 h-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold mb-1">No Strategies Yet</h3>
                  <p className="text-muted-foreground mb-4">Document your first trading setup or strategy rules here.</p>
                  <Button variant="outline" onClick={() => setIsCreating(true)}>Create Strategy</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {strategies.map((item, index) => (
                  <ItemCard 
                    key={item.id} 
                    item={item} 
                    index={index}
                    total={strategies.length}
                    onMoveUp={() => handleMove('STRATEGY', index, 'up')}
                    onMoveDown={() => handleMove('STRATEGY', index, 'down')}
                    onMoveTop={() => handleMove('STRATEGY', index, 'top')}
                    onEdit={() => setEditingItem(item)} 
                    onDelete={() => handleDelete(item.id)} 
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="knowledge" className="space-y-4">
             {knowledge.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Book className="w-12 h-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold mb-1">No Knowledge Entries</h3>
                  <p className="text-muted-foreground mb-4">Store market observations, psychological tips, and edge data here.</p>
                  <Button variant="outline" onClick={() => setIsCreating(true)}>Add Knowledge</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {knowledge.map((item, index) => (
                  <ItemCard 
                    key={item.id} 
                    item={item} 
                    index={index}
                    total={knowledge.length}
                    onMoveUp={() => handleMove('KNOWLEDGE', index, 'up')}
                    onMoveDown={() => handleMove('KNOWLEDGE', index, 'down')}
                    onMoveTop={() => handleMove('KNOWLEDGE', index, 'top')}
                    onEdit={() => setEditingItem(item)} 
                    onDelete={() => handleDelete(item.id)} 
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

function ItemCard({ 
  item, 
  index,
  total,
  onMoveUp,
  onMoveDown,
  onMoveTop,
  onEdit, 
  onDelete 
}: { 
  item: VaultItem
  index: number
  total: number
  onMoveUp: () => void
  onMoveDown: () => void
  onMoveTop: () => void
  onEdit: () => void
  onDelete: () => void 
}) {
  const parseImages = (imgs: string | null) => {
    if (!imgs) return []
    try {
      return JSON.parse(imgs) as string[]
    } catch {
      return []
    }
  }

  const images = parseImages(item.images)

  return (
    <Card className="flex flex-col h-full bg-slate-950 border-slate-800 hover:border-slate-700 transition-all shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              #{index + 1}
            </span>
            <CardTitle className="text-xl line-clamp-2 leading-tight">{item.title}</CardTitle>
          </div>
          
          {/* Card Controls: Reorder Up/Down/Top & Actions */}
          <div className="flex shrink-0 items-center gap-1">
            <div className="flex items-center border border-slate-800 rounded bg-slate-900/60 mr-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 text-muted-foreground hover:text-indigo-400 disabled:opacity-30" 
                onClick={onMoveTop} 
                disabled={index === 0}
                title="Move to Top (#1 Priority)"
              >
                <ChevronsUp className="h-3.5 w-3.5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 text-muted-foreground hover:text-indigo-400 disabled:opacity-30" 
                onClick={onMoveUp} 
                disabled={index === 0}
                title="Move Up"
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 text-muted-foreground hover:text-indigo-400 disabled:opacity-30" 
                onClick={onMoveDown} 
                disabled={index === total - 1}
                title="Move Down"
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </Button>
            </div>

            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={onEdit} title="Edit Item">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" title="Delete Item">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete forever?</AlertDialogTitle>
                  <AlertDialogDescription>This will permanently delete this vault item. This action cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        <CardDescription>{new Date(item.createdAt).toLocaleDateString()}</CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col gap-4">
        {/* Notion-style Rendered Content */}
        <div className="flex-1 max-h-[220px] overflow-hidden relative">
          <NotionRenderer content={item.content} clampLines={6} />
          {item.content.length > 200 && (
            <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none" />
          )}
        </div>

        {images.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-900">
            {images.slice(0, 3).map((img, i) => (
              <div key={i} className="aspect-video relative rounded overflow-hidden border border-slate-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} alt="" className="object-cover w-full h-full" />
                {i === 2 && images.length > 3 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-xs font-medium">
                    +{images.length - 3}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
