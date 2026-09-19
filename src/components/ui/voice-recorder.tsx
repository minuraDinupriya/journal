"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { Mic, Square, Loader2, Sparkles, X } from "lucide-react"
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
  const [recordSeconds, setRecordSeconds] = useState(0)
  const [audioLevels, setAudioLevels] = useState<number[]>([20, 30, 20, 40])

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const isCancelledRef = useRef(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const animFrameRef = useRef<number | null>(null)

  // Clean up all resources on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        audioCtxRef.current.close().catch(() => {})
      }
    }
  }, [])

  const cancelRecording = useCallback(() => {
    isCancelledRef.current = true

    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = null
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      audioCtxRef.current.close().catch(() => {})
      audioCtxRef.current = null
    }

    if (mediaRecorderRef.current && isRecording) {
      try {
        mediaRecorderRef.current.stop()
      } catch (_) {}
      setIsRecording(false)
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
      }
    }

    chunksRef.current = []
    setRecordSeconds(0)
    toast.info("Recording cancelled")
  }, [isRecording])

  // Allow pressing Escape to quickly cancel an active recording
  useEffect(() => {
    if (!isRecording) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        cancelRecording()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isRecording, cancelRecording])

  const stopRecording = useCallback(() => {
    isCancelledRef.current = false

    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = null
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      audioCtxRef.current.close().catch(() => {})
      audioCtxRef.current = null
    }

    if (mediaRecorderRef.current && isRecording) {
      try {
        mediaRecorderRef.current.stop()
      } catch (_) {}
      setIsRecording(false)
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [isRecording])

  const startRecording = useCallback(async () => {
    try {
      isCancelledRef.current = false

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 1
        }
      })

      // Set up real-time audio visualizer using Web Audio API
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
        if (AudioContextClass) {
          const audioCtx = new AudioContextClass()
          audioCtxRef.current = audioCtx
          const analyser = audioCtx.createAnalyser()
          analyser.fftSize = 32
          analyser.smoothingTimeConstant = 0.5
          const source = audioCtx.createMediaStreamSource(stream)
          source.connect(analyser)

          const dataArray = new Uint8Array(analyser.frequencyBinCount)

          const updateMeter = () => {
            if (!analyser) return
            analyser.getByteFrequencyData(dataArray)
            // Extract 4 frequency bands for a dynamic equalizer visualizer
            const b1 = Math.max(15, Math.min(100, (dataArray[1] || 0) * 0.8))
            const b2 = Math.max(25, Math.min(100, (dataArray[3] || 0) * 1.1))
            const b3 = Math.max(20, Math.min(100, (dataArray[5] || 0) * 1.0))
            const b4 = Math.max(15, Math.min(100, (dataArray[7] || 0) * 0.9))
            setAudioLevels([b1, b2, b3, b4])
            animFrameRef.current = requestAnimationFrame(updateMeter)
          }
          animFrameRef.current = requestAnimationFrame(updateMeter)
        }
      } catch (e) {
        console.warn("AudioContext visualizer not supported or blocked:", e)
      }

      const options: MediaRecorderOptions = {
        audioBitsPerSecond: 128000
      }
      if (typeof MediaRecorder !== "undefined") {
        if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
          options.mimeType = "audio/webm;codecs=opus"
        } else if (MediaRecorder.isTypeSupported("audio/webm")) {
          options.mimeType = "audio/webm"
        } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
          options.mimeType = "audio/mp4"
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
        // If recording was cancelled, discard and exit immediately
        if (isCancelledRef.current) {
          isCancelledRef.current = false
          chunksRef.current = []
          return
        }

        setIsProcessing(true)
        const toastId = "transcribing-audio"
        toast.loading("⚡ Gemini is transcribing your voice note...", { id: toastId })

        try {
          const audioBlob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType || "audio/webm" })

          // Convert blob to base64
          const reader = new FileReader()
          reader.readAsDataURL(audioBlob)
          reader.onloadend = async () => {
            const base64data = reader.result?.toString().split(",")[1]
            if (!base64data) {
              toast.error("Failed to read audio data", { id: toastId })
              setIsProcessing(false)
              return
            }

            try {
              const res = await fetch("/api/transcribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  audioData: base64data,
                  mimeType: mediaRecorder.mimeType || "audio/webm"
                })
              })

              if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || "Transcription failed")
              }

              const data = await res.json()
              if (data.text && data.text.trim().length > 0) {
                onTranscript(data.text.trim())
                toast.success("✨ Voice note transcribed and added!", { id: toastId, duration: 3000 })
              } else {
                toast.info("No speech detected. Try speaking closer to the microphone.", { id: toastId, duration: 4000 })
              }
            } catch (err: any) {
              console.error(err)
              toast.error(err.message || "Failed to transcribe audio", { id: toastId })
            } finally {
              setIsProcessing(false)
            }
          }
        } catch (error: any) {
          console.error(error)
          toast.error(error.message || "Failed to process audio", { id: toastId })
          setIsProcessing(false)
        }
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordSeconds(0)

      // Start elapsed timer
      timerRef.current = setInterval(() => {
        setRecordSeconds((prev) => prev + 1)
      }, 1000)

    } catch (err) {
      console.error(err)
      toast.error("Microphone access denied. Please check your browser permissions.")
    }
  }, [onTranscript])

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60)
    const rem = secs % 60
    return `${mins}:${rem < 10 ? "0" : ""}${rem}`
  }

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      {/* Live recording active state */}
      {isRecording && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-500 px-2.5 py-1 rounded-full text-xs font-mono animate-in fade-in zoom-in-95 duration-200">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          <span>{formatTime(recordSeconds)}</span>
          {/* Animated live audio level equalizer */}
          <div className="flex items-end gap-0.5 h-3.5 px-0.5">
            {audioLevels.map((lvl, idx) => (
              <span
                key={idx}
                className="w-1 bg-red-500 rounded-sm transition-all duration-75"
                style={{ height: `${Math.max(3, (lvl / 100) * 14)}px` }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Processing / AI Transcribing state badge */}
      {isProcessing && (
        <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-500 px-2.5 py-1 rounded-full text-xs font-medium animate-pulse">
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>Gemini is transcribing...</span>
        </div>
      )}

      {/* Action Button: Stop & Save when recording, Voice Type when idle */}
      <Button
        type="button"
        variant={isRecording ? "destructive" : isProcessing ? "outline" : "ghost"}
        size="sm"
        className={cn(
          "h-8 px-2.5 text-xs transition-all duration-200",
          !isRecording && !isProcessing && "text-muted-foreground hover:text-foreground hover:bg-muted/60",
          isRecording && "bg-red-600 hover:bg-red-700 text-white shadow-sm hover:shadow",
          isProcessing && "border-amber-500/40 text-amber-500 bg-amber-500/5 cursor-wait"
        )}
        onClick={toggleRecording}
        disabled={isProcessing}
        title={isRecording ? "Stop and transcribe" : "Start voice typing"}
      >
        {isProcessing ? (
          <>
            <Sparkles className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            Transcribing...
          </>
        ) : isRecording ? (
          <>
            <Square className="w-3.5 h-3.5 mr-1.5 fill-current" />
            Stop & Save
          </>
        ) : (
          <>
            <Mic className="w-3.5 h-3.5 mr-1.5" />
            Voice Type
          </>
        )}
      </Button>

      {/* Cancel button: appears only while recording so user can discard without sending to Gemini */}
      {isRecording && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive hover:border-destructive/40 hover:bg-destructive/10 transition-all duration-150 animate-in fade-in zoom-in-95"
          onClick={cancelRecording}
          title="Cancel recording without saving (or press Esc)"
        >
          <X className="w-3.5 h-3.5 mr-1" />
          Cancel
        </Button>
      )}
    </div>
  )
}
