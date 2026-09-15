"use client"

import { useCallback, useState, useEffect } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Upload, X, ImageIcon, Loader2, Eye, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface ChartUploadProps {
  value?: string[]
  onChange: (paths: string[]) => void
}

export function ChartUpload({ value = [], onChange }: ChartUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === 'Escape') {
        setLightboxIndex(null);
      } else if (e.key === 'ArrowLeft' && value.length > 1) {
        setLightboxIndex(prev => (prev !== null ? (prev === 0 ? value.length - 1 : prev - 1) : null));
      } else if (e.key === 'ArrowRight' && value.length > 1) {
        setLightboxIndex(prev => (prev !== null ? (prev === value.length - 1 ? 0 : prev + 1) : null));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, value.length]);

  const removeImage = (indexToRemove: number) => {
    const originalValue = [...value];
    onChange(value.filter((_, idx) => idx !== indexToRemove))
    toast("Image removed", {
      action: {
        label: "Undo",
        onClick: () => {
          onChange(originalValue);
        }
      }
    })
  }

  return (
    <div className="space-y-4">
      {value.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {value.map((imgUrl, idx) => (
            <div 
              key={idx} 
              className="relative group border rounded-md overflow-hidden bg-muted aspect-video cursor-pointer"
              onClick={() => setLightboxIndex(idx)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={imgUrl} 
                alt={`Chart preview ${idx + 1}`} 
                className="w-full h-full object-cover transition-transform group-hover:scale-105" 
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                <Button 
                  type="button" 
                  variant="secondary" 
                  size="sm" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex(idx);
                  }}
                  className="bg-white/90 hover:bg-white text-black text-xs font-semibold shadow-md"
                >
                  <Eye className="w-3.5 h-3.5 mr-1.5" />
                  View
                </Button>
                <Button 
                  type="button" 
                  variant="destructive" 
                  size="sm" 
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(idx);
                  }}
                  className="text-xs font-semibold shadow-md"
                >
                  <X className="w-3.5 h-3.5 mr-1.5" />
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

      {/* Lightbox Overlay */}
      {lightboxIndex !== null && value[lightboxIndex] && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setLightboxIndex(null)}
        >
          <div 
            className="relative max-w-7xl max-h-screen w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button 
              type="button"
              className="absolute top-4 right-4 text-white/70 hover:text-white z-50 bg-black/50 p-2 rounded-full transition-colors hover:bg-black/80"
              onClick={() => setLightboxIndex(null)}
              title="Close (Esc)"
            >
              <X className="w-6 h-6" />
            </button>
            
            {/* Previous Button */}
            {value.length > 1 && (
              <button 
                type="button"
                className="absolute left-4 text-white/70 hover:text-white z-50 bg-black/50 p-2 rounded-full transition-colors hover:bg-black/80"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex(prev => (prev !== null ? (prev === 0 ? value.length - 1 : prev - 1) : null));
                }}
                title="Previous (Left Arrow)"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* Image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={value[lightboxIndex]} 
              alt={`Chart Screenshot ${lightboxIndex + 1}`} 
              className="max-w-full max-h-[90vh] object-contain rounded-md select-none"
            />

            {/* Next Button */}
            {value.length > 1 && (
              <button 
                type="button"
                className="absolute right-4 text-white/70 hover:text-white z-50 bg-black/50 p-2 rounded-full transition-colors hover:bg-black/80"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex(prev => (prev !== null ? (prev === value.length - 1 ? 0 : prev + 1) : null));
                }}
                title="Next (Right Arrow)"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
            
            {/* Image Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white bg-black/60 px-4 py-1.5 rounded-full text-sm font-medium">
              {lightboxIndex + 1} / {value.length}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
