import { useState, useEffect, useRef, useCallback } from 'react'

export function useSpeech() {
  const [isSupported, setIsSupported] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [voices, setVoices] = useState([])
  const utterRef = useRef(null)

  useEffect(() => {
    if (!('speechSynthesis' in window)) return
    setIsSupported(true) // mark supported immediately — don't wait for voices

    function loadVoices() {
      const v = window.speechSynthesis.getVoices()
      if (v.length) setVoices(v)
    }

    loadVoices()
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices)
    return () => window.speechSynthesis.removeEventListener('voiceschanged', loadVoices)
  }, [])

  // Pick best voice for a given lang code ('ta-IN', 'en-IN', 'en-US' etc.)
  function pickVoice(langCode) {
    const lang = langCode.toLowerCase()
    // Exact match first
    let v = voices.find(v => v.lang.toLowerCase() === lang)
    // Prefix match (e.g. 'ta' matches 'ta-IN')
    if (!v) v = voices.find(v => v.lang.toLowerCase().startsWith(lang.split('-')[0]))
    return v || null
  }

  const speak = useCallback((text, langCode = 'en-IN', rate = 0.85, pitch = 1) => {
    if (!isSupported) return
    window.speechSynthesis.cancel()

    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = langCode
    utter.rate = rate
    utter.pitch = pitch

    const voice = pickVoice(langCode)
    if (voice) utter.voice = voice

    utter.onstart  = () => { setIsSpeaking(true);  setIsPaused(false) }
    utter.onend    = () => { setIsSpeaking(false); setIsPaused(false) }
    utter.onpause  = () => setIsPaused(true)
    utter.onresume = () => setIsPaused(false)
    utter.onerror  = () => { setIsSpeaking(false); setIsPaused(false) }

    utterRef.current = utter
    window.speechSynthesis.speak(utter)
  }, [isSupported, voices])

  const pause = useCallback(() => {
    if (window.speechSynthesis.speaking) window.speechSynthesis.pause()
  }, [])

  const resume = useCallback(() => {
    if (window.speechSynthesis.paused) window.speechSynthesis.resume()
  }, [])

  const stop = useCallback(() => {
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
    setIsPaused(false)
  }, [])

  const toggle = useCallback((text, langCode, rate, pitch) => {
    if (isSpeaking && !isPaused) {
      pause()
    } else if (isPaused) {
      resume()
    } else {
      speak(text, langCode, rate, pitch)
    }
  }, [isSpeaking, isPaused, speak, pause, resume])

  return { isSupported, isSpeaking, isPaused, voices, speak, pause, resume, stop, toggle }
}
