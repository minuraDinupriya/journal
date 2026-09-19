"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
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
  const [isProcessing, setIsProcessing] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
    }
  }, [isRecording])

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 1
        }
      })

      const options: MediaRecorderOptions = {
        audioBitsPerSecond: 128000
      }
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          options.mimeType = 'audio/webm;codecs=opus'
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          options.mimeType = 'audio/webm'
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          options.mimeType = 'audio/mp4'
        }
      }

      const mediaRecorder = new MediaRecorder(stream, options)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = async () => {
        setIsProcessing(true)
        try {
          const audioBlob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' })
          
          // Convert blob to base64
          const reader = new FileReader()
          reader.readAsDataURL(audioBlob)
          reader.onloadend = async () => {
            const base64data = reader.result?.toString().split(',')[1]
            if (!base64data) throw new Error("Failed to read audio data")

            toast.info("Transcribing audio...")
            
            const res = await fetch('/api/transcribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                audioData: base64data,
                mimeType: mediaRecorder.mimeType || 'audio/webm'
              })
            })

            if (!res.ok) {
              const err = await res.json()
              throw new Error(err.error || "Transcription failed")
            }

            const data = await res.json()
            if (data.text) {
              onTranscript(data.text)
              toast.success("Transcription complete")
            } else {
              toast.error("No speech detected")
            }
          }
        } catch (error: any) {
          console.error(error)
          toast.error(error.message || "Failed to process audio")
        } finally {
          setIsProcessing(false)
        }
      }

      mediaRecorder.start()
      setIsRecording(true)
      toast.info("Recording... click stop when done.")
    } catch (err) {
      console.error(err)
      toast.error("Microphone access denied. Please check permissions.")
    }
  }, [onTranscript])

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn(
        "h-8 px-2 text-xs",
        isRecording ? "text-red-500 hover:text-red-600 bg-red-500/10 hover:bg-red-500/20 animate-pulse" : "text-muted-foreground",
        isProcessing ? "opacity-50 cursor-not-allowed" : "",
        className
      )}
      onClick={toggleRecording}
      disabled={isProcessing}
      title={isRecording ? "Stop Recording" : "Start Voice Typing"}
    >
      <Mic className={cn("w-4 h-4 mr-1", isProcessing && "animate-spin")} />
      {isProcessing ? "Processing..." : isRecording ? "Stop Recording" : "Voice Type"}
    </Button>
  )
}
