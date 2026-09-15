"use client"

import { useState } from "react"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChartUpload } from "@/components/trades/chart-upload"
import { VaultItem, VaultItemType, VaultFormData } from "@/types/vault"
import { toast } from "sonner"

interface VaultFormProps {
  item?: VaultItem
  onClose: () => void
  onSuccess: () => void
}

export function VaultForm({ item, onClose, onSuccess }: VaultFormProps) {
  const isEditing = !!item
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [type, setType] = useState<VaultItemType>(item?.type || 'STRATEGY')
  const [title, setTitle] = useState(item?.title || '')
  const [content, setContent] = useState(item?.content || '')
  
  const [images, setImages] = useState<string[]>(() => {
    if (!item?.images) return []
    try {
      return JSON.parse(item.images)
    } catch {
      return []
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required")
      return
    }

    setIsSubmitting(true)
    try {
      const payload: VaultFormData = {
        type,
        title,
        content,
        images
      }

      const res = await fetch(isEditing ? `/api/vault/${item.id}` : '/api/vault', {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        toast.success(isEditing ? "Saved successfully" : "Created successfully")
        onSuccess()
      } else {
        toast.error("Something went wrong")
      }
    } catch (error) {
      toast.error("Failed to save")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-4">
          <Button type="button" variant="ghost" size="icon" onClick={onClose} disabled={isSubmitting}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold">{isEditing ? 'Edit Vault Item' : 'New Vault Item'}</h1>
        </div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          {isEditing ? 'Save Changes' : 'Secure Item'}
        </Button>
      </div>

      <div className="grid gap-6">
        <div className="space-y-2">
          <Label htmlFor="type">Item Type</Label>
          <Select value={type} onValueChange={(val: VaultItemType) => setType(val)}>
            <SelectTrigger className="w-full md:w-[300px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="STRATEGY">Trading Strategy / Setup</SelectItem>
              <SelectItem value="KNOWLEDGE">Secret Knowledge / Edge</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input 
            id="title" 
            placeholder="e.g. The Overlap Gap Setup" 
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="text-lg"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="content">Content & Rules</Label>
          <Textarea 
            id="content" 
            placeholder="Describe the strategy, entry criteria, exit rules, and conditions..."
            value={content}
            onChange={e => setContent(e.target.value)}
            className="min-h-[300px] text-base"
          />
        </div>

        <div className="space-y-2">
          <Label>Attached Images / Charts</Label>
          <div className="p-4 border rounded-md bg-muted/20">
            <ChartUpload value={images} onChange={setImages} />
            <p className="text-xs text-muted-foreground mt-2">Upload diagrams, chart examples, or mind maps.</p>
          </div>
        </div>
      </div>
    </form>
  )
}
