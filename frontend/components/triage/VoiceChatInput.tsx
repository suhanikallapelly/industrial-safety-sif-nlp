'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic,
  MicOff,
  Sparkles,
  Globe,
  CheckCircle2,
  AlertCircle,
  Zap,
} from 'lucide-react'
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition'
import { sound } from '@/lib/sound'

interface VoiceChatInputProps {
  text: string
  setText: (val: string) => void
  onAnalyze: () => void
  isPending: boolean
  placeholder?: string
  minChars?: number
}

const LANGUAGES = [
  { code: 'en-IN', label: 'English (India) 🇮🇳' },
  { code: 'en-US', label: 'English (US) 🇺🇸' },
  { code: 'en-GB', label: 'English (UK) 🇬🇧' },
  { code: 'hi-IN', label: 'Hindi (भारत) 🇮🇳' },
]

export function VoiceChatInput({
  text,
  setText,
  onAnalyze,
  isPending,
  placeholder = "Describe the workplace incident...",
  minChars = 8,
}: VoiceChatInputProps) {
  const [autoEvaluateOnStop, setAutoEvaluateOnStop] = useState(false)
  const [showLangMenu, setShowLangMenu] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const langMenuRef = useRef<HTMLDivElement>(null)
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Voice Recognition Hook
  const {
    isListening,
    isSupported,
    audioLevel,
    error: voiceError,
    selectedLanguage,
    setSelectedLanguage,
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
          }, 400)
        }
      }
    },
  })

  // Timer logic for recording
  useEffect(() => {
    if (isListening) {
      setRecordingSeconds(0)
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1)
      }, 1000)
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
        timerIntervalRef.current = null
      }
      setRecordingSeconds(0)
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
    }
  }, [isListening])

  // Format seconds as MM:SS
  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Close language menu on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setShowLangMenu(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.max(120, Math.min(280, textareaRef.current.scrollHeight))}px`
    }
  }, [text])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      if (!isPending && text.trim().length >= minChars) {
        if (isListening) stopListening()
        onAnalyze()
      }
    }
  }

  return (
    <div className="space-y-4" ref={langMenuRef}>
      {/* ─── Main Input Container ─── */}
      <div
        className={`relative bg-[#0D1B2A]/80 border transition-all duration-200 p-5 sm:p-6 backdrop-blur-md ${
          isListening
            ? 'border-rose-500/50 ring-1 ring-rose-500/30'
            : 'border-white/10 focus-within:border-cyan-500/50 focus-within:ring-1 focus-within:ring-cyan-500/30'
        }`}
      >
        {/* Header Label inside container */}
        <div className="flex items-center justify-between mb-3 text-xs">
          <span className="font-semibold text-slate-200">Describe the incident</span>
          <span className="text-slate-400 font-mono text-[11px]">{text.length} characters</span>
        </div>

        {/* ─── Live Speech Listening Overlay ─── */}
        <AnimatePresence>
          {isListening && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="mb-4 p-3.5 bg-rose-500/10 border border-rose-500/30 flex flex-wrap items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-rose-500 animate-ping" />
                <span className="text-xs font-semibold text-rose-300">
                  Listening...
                </span>
                <span className="text-xs font-mono text-slate-300">
                  {formatTimer(recordingSeconds)}
                </span>
              </div>

              {/* Dynamic Sound Equalizer Waveform */}
              <div className="flex items-center gap-1 h-5 px-3">
                {[0.4, 0.9, 1.3, 0.6, 1.5, 0.8, 1.2, 0.5, 1.0, 0.7].map((scale, i) => {
                  const dynamicHeight = Math.max(
                    4,
                    Math.min(18, (audioLevel * 16 * scale) + (Math.sin(i + Date.now() * 0.005) * 3 + 6))
                  )
                  return (
                    <motion.div
                      key={i}
                      animate={{ height: dynamicHeight }}
                      transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                      className="w-1 bg-rose-400"
                    />
                  )
                })}
              </div>

              {/* Stop & Cancel Controls */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => stopListening()}
                  className="px-3 py-1 bg-rose-500 text-white text-xs font-semibold hover:bg-rose-600 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <MicOff className="w-3.5 h-3.5" />
                  <span>Stop Recording</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Textarea Input Field ─── */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={4}
          className="w-full bg-transparent text-slate-100 placeholder-slate-500 text-sm sm:text-base leading-relaxed focus:outline-none resize-none min-h-[120px] max-h-[280px] font-sans"
        />

        {/* ─── Bottom Toolbar Controls ─── */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 mt-3 border-t border-white/[0.08]">
          {/* Left: Voice Trigger & Dialect Selector */}
          <div className="flex items-center gap-3">
            {/* Voice Input Trigger Button */}
            <button
              type="button"
              onClick={() => {
                sound.playClick()
                toggleListening(text)
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium transition-all cursor-pointer border ${
                isListening
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-white/[0.04] text-slate-300 hover:text-white hover:bg-white/[0.08] border-white/10'
              }`}
            >
              <Mic className={`w-4 h-4 ${isListening ? 'text-rose-400 animate-pulse' : 'text-cyan-400'}`} />
              <span>{isListening ? 'Listening...' : '🎙 Voice Input'}</span>
            </button>

            {/* Language Dialect Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  sound.playClick()
                  setShowLangMenu(!showLangMenu)
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/[0.03] border border-white/10 text-xs text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
                title="Select language dialect"
              >
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                <span>{LANGUAGES.find((l) => l.code === selectedLanguage)?.label.split(' ')[0] || 'EN'}</span>
              </button>

              <AnimatePresence>
                {showLangMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 8 }}
                    className="absolute left-0 bottom-10 w-48 bg-[#0D1B2A] border border-white/15 p-1.5 shadow-xl z-50 space-y-0.5"
                  >
                    <div className="px-2.5 py-1 text-[10px] uppercase font-semibold text-slate-400">
                      Select Dialect
                    </div>
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => {
                          sound.playClick()
                          setSelectedLanguage(lang.code)
                          setShowLangMenu(false)
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs cursor-pointer ${
                          selectedLanguage === lang.code
                            ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                            : 'text-slate-300 hover:bg-white/5'
                        }`}
                      >
                        <span>{lang.label}</span>
                        {selectedLanguage === lang.code && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right: AI Intelligence Tag & Hands-free Auto-Evaluate */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                sound.playClick()
                setAutoEvaluateOnStop(!autoEvaluateOnStop)
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs transition-all cursor-pointer border ${
                autoEvaluateOnStop
                  ? 'bg-purple-500/20 border-purple-400/40 text-purple-300 font-medium'
                  : 'bg-white/[0.02] border-white/10 text-slate-400 hover:text-slate-300'
              }`}
              title="Auto analyze when dictation finishes"
            >
              <Zap className={`w-3.5 h-3.5 ${autoEvaluateOnStop ? 'text-purple-300' : 'text-slate-500'}`} />
              <span className="hidden sm:inline">Auto-Evaluate</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error & Warning Messages */}
      <AnimatePresence>
        {voiceError && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{voiceError}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {!isSupported && (
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>Speech recognition is supported in Chrome, Edge, and Safari browsers.</span>
        </div>
      )}
    </div>
  )
}

