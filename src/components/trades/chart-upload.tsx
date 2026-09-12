"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Upload, X, ImageIcon, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface ChartUploadProps {
  value?: string
  onChange: (path: string | null) => void
}

export function ChartUpload({ value, onChange }: ChartUploadProps) {
  const [isUploading, setIsUploading] = useState(false)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    const file = acceptedFiles[0]
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File is too large. Maximum size is 10MB.")
      return
    }

    setIsUploading(true)

    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) throw new Error("Upload failed")

      const data = await res.json()
      onChange(data.url)
      toast.success("Chart uploaded successfully")
    } catch (error) {
      console.error(error)
      toast.error("Failed to upload chart")
    } finally {
      setIsUploading(false)
    }
  }, [onChange])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/webp': ['.webp']
    },
    maxFiles: 1,
    multiple: false
  })

  if (value) {
    return (
      <div className="relative group border rounded-md overflow-hidden bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={value} alt="Chart preview" className="w-full h-auto max-h-[300px] object-contain" />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Button 
            type="button" 
            variant="destructive" 
            size="sm" 
            onClick={() => onChange(null)}
          >
            <X className="w-4 h-4 mr-2" />
            Remove Image
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors flex flex-col items-center justify-center min-h-[200px]",
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
          <p className="font-medium">Drag & drop a chart image here</p>
          <p className="text-sm text-muted-foreground">Supports PNG, JPG, WEBP up to 10MB</p>
          <Button type="button" variant="secondary" size="sm" className="mt-4" onClick={(e) => e.preventDefault()}>
            <Upload className="w-4 h-4 mr-2" />
            Select File
          </Button>
        </div>
      )}
    </div>
  )
}
