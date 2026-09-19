"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Mic } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface VoiceRecorderProps {
  onTranscript: (text: string) => void
  className?: string
}

export function VoiceRecorder({ onTranscript, className }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [recognition, setRecognition] = useState<any>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        const rec = new SpeechRecognition()
        rec.continuous = true
        rec.interimResults = true // We want true to see it type in real time, but that requires more complex logic. 
        // Let's stick to false for interim to keep it simple, it will just output chunks of finalized sentences.
        rec.interimResults = false 
        rec.lang = "en-US"

        rec.onresult = (event: any) => {
          let finalTranscript = ""
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript
            }
          }
          if (finalTranscript) {
            onTranscript(finalTranscript.trim())
          }
        }

        rec.onerror = (event: any) => {
          if (event.error !== 'no-speech') {
            console.error("Speech recognition error:", event.error)
            toast.error("Microphone error. Please check permissions.")
            setIsRecording(false)
          }
        }

        rec.onend = () => {
          setIsRecording(false)
        }

        setRecognition(rec)
      }
    }
  }, [onTranscript])

  const toggleRecording = useCallback(() => {
    if (!recognition) {
      toast.error("Voice recognition is not supported in this browser.")
      return
    }

    if (isRecording) {
      recognition.stop()
      setIsRecording(false)
    } else {
      try {
        recognition.start()
        setIsRecording(true)
        toast.info("Listening... Speak now.")
      } catch (e) {
        console.error(e)
        setIsRecording(false)
      }
    }
  }, [isRecording, recognition])

  if (!recognition) return null

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn(
        "h-8 px-2 text-xs",
        isRecording ? "text-red-500 hover:text-red-600 bg-red-500/10 hover:bg-red-500/20 animate-pulse" : "text-muted-foreground",
        className
      )}
      onClick={toggleRecording}
      title={isRecording ? "Stop Recording" : "Start Voice Typing"}
    >
      <Mic className="w-4 h-4 mr-1" />
      {isRecording ? "Listening..." : "Voice Type"}
    </Button>
  )
}
