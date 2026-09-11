'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic,
  MicOff,
  MapPin,
  Layers,
  Zap,
  Loader2,
  Plus,
  ArrowUp,
  SlidersHorizontal,
  AlertCircle,
} from 'lucide-react'
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition'
import { sound } from '@/lib/sound'

interface PrimaryIncidentCardProps {
  text: string
  setText: (val: string) => void
  location: string
  setLocation: (val: string) => void
  zone: string
  setZone: (val: string) => void
  onAnalyze: () => void
  isPending: boolean
  minChars?: number
}

export function PrimaryIncidentCard({
  text,
  setText,
  location,
  setLocation,
  zone,
  setZone,
  onAnalyze,
  isPending,
  minChars = 8,
}: PrimaryIncidentCardProps) {
  const [autoEvaluateOnStop, setAutoEvaluateOnStop] = useState(false)
  const [showOptionsPopover, setShowOptionsPopover] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Auto-growing flexible textarea height logic
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 240)}px`
    }
  }, [text])

  // Voice Recognition Hook
  const {
    isListening,
    isSupported,
    audioLevel,
    error: voiceError,
    toggleListening,
    stopListening,
  } = useVoiceRecognition({
    language: 'en-IN',
    continuous: true,
    onTranscript: (fullText) => {
      setText(fullText)
    },
    onSpeechEnd: (finalText) => {
      if (finalText) {
        setText(finalText)
        if (autoEvaluateOnStop && finalText.trim().length >= minChars) {
          setTimeout(() => {
            onAnalyze()
          }, 350)
        }
      }
    },
  })

  // Recording timer
  useEffect(() => {
    if (isListening) {
      setRecordingSeconds(0)
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1)
      }, 1000)
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
      setRecordingSeconds(0)
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
    }
  }, [isListening])

  // Close popover on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowOptionsPopover(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!isPending && text.trim().length >= minChars) {
        if (isListening) stopListening()
        onAnalyze()
      }
    }
  }

  const isReady = text.trim().length >= minChars

  return (
    <div className="w-full max-w-3xl mx-auto my-4 space-y-3">
      {/* ─── LIVE VOICE RECORDING HUD ─── */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="p-3.5 rounded-2xl bg-slate-900/90 border border-rose-500/40 shadow-[0_0_30px_rgba(244,63,94,0.2)] flex items-center justify-between gap-4 backdrop-blur-xl"
          >
            <div className="flex items-center gap-3">
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
              </div>
              <span className="text-xs font-semibold text-rose-300 font-mono">
                Listening...
              </span>
              <span className="text-xs font-mono text-rose-200 bg-rose-950/60 px-2.5 py-0.5 rounded-full border border-rose-500/30">
                {formatTimer(recordingSeconds)}
              </span>
            </div>

            {/* Equalizer Waveform */}
            <div className="flex items-center gap-1 h-5 px-3 bg-slate-950/60 rounded-xl border border-white/5">
              {[0.4, 0.9, 1.3, 0.6, 1.5, 0.8, 1.2, 0.5, 1.0].map((scale, i) => {
                const dynamicHeight = Math.max(
                  4,
                  Math.min(18, audioLevel * 14 * scale + (Math.sin(i + Date.now() * 0.005) * 3 + 5))
                )
                return (
                  <motion.div
                    key={i}
                    animate={{ height: dynamicHeight }}
                    transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                    className="w-1 rounded-full bg-gradient-to-t from-rose-500 to-amber-400"
                  />
                )
              })}
            </div>

            <button
              type="button"
              onClick={() => stopListening()}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md active:scale-95"
            >
              <MicOff className="w-3.5 h-3.5" />
              <span>Stop</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── CHATGPT-STYLE FLEXIBLE PROMPT INPUT BAR (CENTERED) ─── */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (!isPending && isReady) onAnalyze()
        }}
        className="relative z-20 w-full"
      >
        <div
          className={`relative flex items-end gap-2.5 p-2.5 sm:p-3 bg-[#141e2e]/95 hover:bg-[#162337] border border-white/15 focus-within:border-cyan-500/60 focus-within:ring-2 focus-within:ring-cyan-500/20 shadow-[0_16px_48px_rgba(0,0,0,0.6)] backdrop-blur-2xl transition-all duration-300 group ${
            text.includes('\n') || text.length > 80 ? 'rounded-2xl' : 'rounded-[28px]'
          }`}
        >
          {/* LEFT: '+' Attachment / Context Options Button */}
          <div className="relative pb-0.5" ref={popoverRef}>
            <button
              type="button"
              onClick={() => {
                sound.playClick()
                setShowOptionsPopover(!showOptionsPopover)
              }}
              title="Add location context / settings"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer flex-shrink-0 border border-white/5 active:scale-95"
            >
              <Plus className={`w-5 h-5 transition-transform duration-200 ${showOptionsPopover ? 'rotate-45 text-cyan-400' : ''}`} />
            </button>

            {/* Context & Location Popover Dropdown */}
            <AnimatePresence>
              {showOptionsPopover && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  className="absolute left-0 bottom-full mb-3 w-80 p-4 rounded-2xl glass-panel border border-white/15 shadow-2xl z-50 space-y-3.5 text-left"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-white border-b border-white/10 pb-2">
                    <span className="flex items-center gap-1.5">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Context & Settings</span>
                    </span>
                    <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">OIL INDIA</span>
                  </div>

                  {/* Facility Location */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-cyan-400" /> Facility Location
                    </label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Duliajan Central Facility..."
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>

                  {/* Work Area / Zone */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Layers className="w-3 h-3 text-indigo-400" /> Work Area / Zone
                    </label>
                    <input
                      type="text"
                      value={zone}
                      onChange={(e) => setZone(e.target.value)}
                      placeholder="e.g. Dispenser Bay 03..."
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>

                  {/* Auto-Evaluate Toggle */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
                      <Zap className={`w-3.5 h-3.5 ${autoEvaluateOnStop ? 'text-indigo-400' : 'text-slate-500'}`} />
                      <span>Auto-Evaluate Voice</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setAutoEvaluateOnStop(!autoEvaluateOnStop)}
                      className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                        autoEvaluateOnStop ? 'bg-indigo-600' : 'bg-slate-800'
                      }`}
                    >
                      <span
                        className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.75 transition-transform ${
                          autoEvaluateOnStop ? 'right-1' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* MIDDLE: Auto-Growing Flexible Textarea */}
          <div className="flex-1 flex items-center px-1 pb-1">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder=""
              rows={1}
              className="w-full bg-transparent border-0 outline-none ring-0 focus:ring-0 text-slate-100 placeholder:text-slate-500 text-sm sm:text-base leading-relaxed resize-none overflow-y-auto max-h-[240px] min-h-[26px] py-1 font-sans selection:bg-cyan-500/30"
            />
          </div>

          {/* RIGHT ACTIONS: Voice Microphone + Submit Button */}
          <div className="flex items-center gap-2 flex-shrink-0 pb-0.5">
            {/* Voice Dictate Button */}
            <button
              type="button"
              onClick={() => {
                sound.playClick()
                toggleListening(text)
              }}
              title={isListening ? 'Stop voice recording' : 'Voice dictation input'}
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                isListening
                  ? 'bg-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.5)] animate-pulse'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5'
              }`}
            >
              <Mic className={`w-4 h-4 sm:w-5 sm:h-5 ${isListening ? 'text-white' : 'text-slate-300'}`} />
            </button>

            {/* Submit Up Arrow Button */}
            <button
              type="submit"
              disabled={!isReady || isPending}
              title="Evaluate Safety Risk"
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer ${
                isReady && !isPending
                  ? 'bg-white text-slate-950 hover:bg-slate-200 shadow-[0_0_20px_rgba(255,255,255,0.4)] active:scale-90 font-bold'
                  : 'bg-white/10 text-slate-600 cursor-not-allowed border border-white/5'
              }`}
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-cyan-400" />
              ) : (
                <ArrowUp className={`w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5] ${isReady ? 'text-slate-950' : 'text-slate-600'}`} />
              )}
            </button>
          </div>
        </div>
      </form>

      {voiceError && (
        <div className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs max-w-md mx-auto">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{voiceError}</span>
        </div>
      )}

      {!isSupported && (
        <div className="flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs max-w-md mx-auto">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-400" />
          <span>Voice dictation is supported in Chrome, Edge & Brave browsers.</span>
        </div>
      )}
    </div>
  )
}
