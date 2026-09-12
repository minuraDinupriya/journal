"use client"

import { useCallback, useState, useEffect } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Upload, X, ImageIcon, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface ChartUploadProps {
  value?: string[]
  onChange: (paths: string[]) => void
}

export function ChartUpload({ value = [], onChange }: ChartUploadProps) {
  const [isUploading, setIsUploading] = useState(false)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    setIsUploading(true)
    const newPaths: string[] = []

    try {
      for (const file of acceptedFiles) {
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`File ${file.name} is too large. Maximum size is 10MB.`)
          continue
        }

        const formData = new FormData()
        formData.append("file", file)

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (!res.ok) throw new Error("Upload failed")

        const data = await res.json()
        newPaths.push(data.path)
      }

      if (newPaths.length > 0) {
        onChange([...value, ...newPaths])
        toast.success(newPaths.length > 1 ? "Charts uploaded successfully" : "Chart uploaded successfully")
      }
    } catch (error) {
      console.error(error)
      toast.error("Failed to upload chart(s)")
    } finally {
      setIsUploading(false)
    }
  }, [onChange, value])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/webp': ['.webp']
    },
    maxFiles: 5,
    multiple: true
  })

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const files: File[] = [];
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            files.push(file);
          }
        }
      }
      
      if (files.length > 0) {
        e.preventDefault();
        onDrop(files);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [onDrop]);

  const removeImage = (indexToRemove: number) => {
    onChange(value.filter((_, idx) => idx !== indexToRemove))
  }

  return (
    <div className="space-y-4">
      {value.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {value.map((imgUrl, idx) => (
            <div key={idx} className="relative group border rounded-md overflow-hidden bg-muted aspect-video">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imgUrl} alt={`Chart preview ${idx + 1}`} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button 
                  type="button" 
                  variant="destructive" 
                  size="sm" 
                  onClick={() => removeImage(idx)}
                >
                  <X className="w-4 h-4 mr-2" />
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors flex flex-col items-center justify-center min-h-[150px]",
          isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50 bg-muted/20",
          isUploading && "pointer-events-none opacity-50"
        )}
      >
        <input {...getInputProps()} />
        {isUploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm font-medium">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <ImageIcon className="w-10 h-10 text-muted-foreground mb-2" />
            <p className="font-medium">Drag & drop or paste chart images (Ctrl+V)</p>
            <p className="text-sm text-muted-foreground">Supports multiple PNG, JPG, WEBP up to 10MB each</p>
            <Button type="button" variant="secondary" size="sm" className="mt-4" onClick={(e) => e.preventDefault()}>
              <Upload className="w-4 h-4 mr-2" />
              Select Files
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
