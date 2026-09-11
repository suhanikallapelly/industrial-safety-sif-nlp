'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { sound } from '@/lib/sound'

interface UseVoiceRecognitionOptions {
  language?: string
  continuous?: boolean
  onTranscript?: (fullText: string, isFinal: boolean) => void
  onSpeechEnd?: (finalText: string) => void
}

export function useVoiceRecognition(options: UseVoiceRecognitionOptions = {}) {
  const {
    language = 'en-US',
    continuous = true,
    onTranscript,
    onSpeechEnd,
  } = options

  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(true)
  const [audioLevel, setAudioLevel] = useState(0)
  const [error, setError] = useState<string | null>(null)
  // FIX: Initialize selectedLanguage from the passed `language` option, not the default
  const [selectedLanguage, setSelectedLanguage] = useState(language)

  const recognitionRef = useRef<any>(null)
  const isListeningRef = useRef(false)
  const animFrameRef = useRef<number | null>(null)
  // Track whether recognition.start() is currently in progress to prevent double-start
  const isStartingRef = useRef(false)

  // Base text snapshot before voice dictation started
  const baseTextRef = useRef<string>('')
  // Latest cumulative transcribed text
  const latestFullTextRef = useRef<string>('')

  const onTranscriptRef = useRef(onTranscript)
  const onSpeechEndRef = useRef(onSpeechEnd)
  onTranscriptRef.current = onTranscript
  onSpeechEndRef.current = onSpeechEnd

  // Check Web Speech API browser support on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition
      if (!SpeechRecognition) {
        setIsSupported(false)
      }
    }
  }, [])

  // Dynamic visualizer animation ticker while listening
  const startVisualizer = useCallback(() => {
    let phase = 0
    const updateLevel = () => {
      if (!isListeningRef.current) return
      phase += 0.15
      const level = 0.45 + Math.sin(phase) * 0.3 + Math.cos(phase * 2.1) * 0.15
      setAudioLevel(Math.max(0.15, Math.min(1, level)))
      animFrameRef.current = requestAnimationFrame(updateLevel)
    }
    animFrameRef.current = requestAnimationFrame(updateLevel)
  }, [])

  const stopVisualizer = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = null
    }
    setAudioLevel(0)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isListeningRef.current = false
      isStartingRef.current = false
      stopVisualizer()
      if (recognitionRef.current) {
        try { recognitionRef.current.abort() } catch {}
      }
    }
  }, [stopVisualizer])

  // Stop listening
  const stopListening = useCallback(() => {
    isListeningRef.current = false
    isStartingRef.current = false
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {}
    }
    setIsListening(false)
    stopVisualizer()
    sound.playMicStop()
  }, [stopVisualizer])

  // Start real speech recognition
  const startListening = useCallback(
    async (currentBaseText: string = '') => {
      setError(null)

      if (typeof window === 'undefined') return

      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition

      if (!SpeechRecognition) {
        setIsSupported(false)
        setError('Web Speech API is not supported in this browser. Please use Google Chrome, Microsoft Edge, or Safari.')
        return
      }

      // ── Microphone Permission Pre-Check ──
      // Request mic access explicitly BEFORE starting recognition.
      // This ensures the browser's permission prompt appears immediately
      // and we get clear error messages if denied.
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        // Got access — release the stream immediately, SpeechRecognition manages its own
        stream.getTracks().forEach((track) => track.stop())
      } catch (micErr: any) {
        const errName = micErr?.name || ''
        if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
          setError(
            'Microphone access denied. Please click the lock/mic icon in your browser address bar and select "Allow", then try again.'
          )
        } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
          setError(
            'No microphone detected. Please connect a microphone or headset and try again.'
          )
        } else if (errName === 'NotReadableError' || errName === 'TrackStartError') {
          setError(
            'Microphone is in use by another application. Close other apps using the mic and try again.'
          )
        } else {
          setError(`Microphone error: ${micErr?.message || errName || 'Unknown error'}`)
        }
        return
      }

      baseTextRef.current = currentBaseText.trim()
      latestFullTextRef.current = currentBaseText.trim()

      try {
        // Abort any existing recognition session cleanly
        if (recognitionRef.current) {
          try { recognitionRef.current.abort() } catch {}
          recognitionRef.current = null
        }

        const recognition = new SpeechRecognition()
        recognition.continuous = continuous
        recognition.interimResults = true
        // FIX: Use selectedLanguage which is now correctly initialized from the `language` prop
        recognition.lang = selectedLanguage || language || 'en-US'

        recognition.onstart = () => {
          isStartingRef.current = false
          setIsListening(true)
          isListeningRef.current = true
          sound.playMicStart()
          startVisualizer()
        }

        recognition.onresult = (event: any) => {
          let sessionFinal = ''
          let sessionInterim = ''

          for (let i = 0; i < event.results.length; ++i) {
            const piece = event.results[i][0]?.transcript || ''
            if (event.results[i].isFinal) {
              sessionFinal += piece + ' '
            } else {
              sessionInterim += piece
            }
          }

          const currentSessionSpeech = (sessionFinal + ' ' + sessionInterim).trim().replace(/\s+/g, ' ')

          const fullCombined = baseTextRef.current
            ? `${baseTextRef.current} ${currentSessionSpeech}`.trim()
            : currentSessionSpeech

          latestFullTextRef.current = fullCombined

          onTranscriptRef.current?.(fullCombined, sessionInterim.length === 0)
        }

        recognition.onerror = (event: any) => {
          const err = event.error
          // 'no-speech' is a transient event — the user just hasn't spoken yet.
          // Don't show an error for this.
          if (err === 'no-speech') {
            return
          }
          // 'aborted' happens when we intentionally abort — not a real error
          if (err === 'aborted') {
            return
          }
          if (err === 'not-allowed') {
            setError('Microphone access denied. Please click the mic or lock icon in your browser address bar and select "Allow".')
          } else if (err === 'audio-capture') {
            setError('No microphone hardware detected or microphone is in use by another app.')
          } else if (err === 'network') {
            setError('Speech recognition network error. Please check your internet connection and try again.')
          } else if (err === 'service-not-allowed') {
            setError('Speech recognition service is not allowed. Please ensure you are on a secure (HTTPS) page or localhost.')
          } else {
            setError(`Speech recognition error: ${err}`)
          }

          isStartingRef.current = false
          setIsListening(false)
          isListeningRef.current = false
          stopVisualizer()
          sound.playMicStop()
        }

        recognition.onend = () => {
          isStartingRef.current = false
          if (isListeningRef.current && continuous) {
            // Continuous mode: restart recognition with accumulated text as new base
            // Use a small delay to avoid rapid-fire restarts
            const accumulatedText = latestFullTextRef.current
            baseTextRef.current = accumulatedText

            const tryRestart = () => {
              if (!isListeningRef.current || isStartingRef.current) return
              isStartingRef.current = true
              try {
                recognition.start()
              } catch {
                isStartingRef.current = false
                // If start fails, try once more after a delay
                setTimeout(() => {
                  if (isListeningRef.current && !isStartingRef.current) {
                    isStartingRef.current = true
                    try {
                      recognition.start()
                    } catch {
                      isStartingRef.current = false
                    }
                  }
                }, 300)
              }
            }

            // Small debounce to prevent rapid restart race condition
            setTimeout(tryRestart, 100)
            return
          }

          setIsListening(false)
          isListeningRef.current = false
          stopVisualizer()
          sound.playMicStop()
          onSpeechEndRef.current?.(latestFullTextRef.current)
        }

        recognitionRef.current = recognition

        // Guard: prevent double-start
        if (isStartingRef.current) return
        isStartingRef.current = true
        recognition.start()
      } catch (err: any) {
        isStartingRef.current = false
        setError(err?.message || 'Could not initialize speech recognition.')
        setIsListening(false)
        isListeningRef.current = false
        stopVisualizer()
      }
    },
    [continuous, selectedLanguage, language, startVisualizer, stopVisualizer]
  )

  // Toggle listening
  const toggleListening = useCallback(
    (currentText: string = '') => {
      if (isListening) {
        stopListening()
      } else {
        startListening(currentText)
      }
    },
    [isListening, startListening, stopListening]
  )

  return {
    isListening,
    isSupported,
    audioLevel,
    error,
    selectedLanguage,
    setSelectedLanguage,
    startListening,
    stopListening,
    toggleListening,
  }
}
