"use client"

import { useState, useEffect } from "react"
import { Lock, Plus, Book, Target, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { VaultItem } from "@/types/vault"
import { VaultForm } from "./vault-form"
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
    } catch (e) {
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
    } catch (e) {
      toast.error("Failed to delete item")
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
          <p className="text-muted-foreground">Secure storage for your trading edge.</p>
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
                {strategies.map((item) => (
                  <ItemCard key={item.id} item={item} onEdit={() => setEditingItem(item)} onDelete={() => handleDelete(item.id)} />
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
                {knowledge.map((item) => (
                  <ItemCard key={item.id} item={item} onEdit={() => setEditingItem(item)} onDelete={() => handleDelete(item.id)} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

function ItemCard({ item, onEdit, onDelete }: { item: VaultItem, onEdit: () => void, onDelete: () => void }) {
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
    <Card className="flex flex-col h-full bg-slate-950 border-slate-800">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-4">
          <CardTitle className="text-xl line-clamp-2 leading-tight">{item.title}</CardTitle>
          <div className="flex shrink-0 gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={onEdit}>
              <Pencil className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
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
        <p className="text-sm text-slate-300 whitespace-pre-wrap line-clamp-6 flex-1">
          {item.content}
        </p>
        {images.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mt-2">
            {images.slice(0, 3).map((img, i) => (
              <div key={i} className="aspect-video relative rounded overflow-hidden border">
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
