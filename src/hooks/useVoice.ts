import { useState, useEffect, useRef, useCallback } from 'react';

export function useVoice() {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;

    recognitionRef.current = recognition;
  }, []);

  const startListening = useCallback((lang: 'en' | 'ar', onResult: (text: string, isFinal: boolean) => void) => {
    if (!recognitionRef.current) return;

    const recognition = recognitionRef.current;
    recognition.lang = lang === 'ar' ? 'ar-EG' : 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const text = finalTranscript || interimTranscript;
      const isFinal = !!finalTranscript;
      onResult(text, isFinal);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch (e) {
      console.error(e);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  const speak = useCallback((text: string, lang: 'en' | 'ar', onEnd?: () => void) => {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel(); // stop previous speech

    // Clean markdown text for clear speech
    const cleanText = text
      .replace(/[*_#`~]/g, '')
      .replace(/\[.*?\]\(.*?\)/g, '')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = lang === 'ar' ? 'ar-SA' : 'en-US';
    utterance.rate = 0.95; // calm, peaceful tone
    utterance.pitch = 1.0;

    // Try to pick a natural soothing voice
    const voices = window.speechSynthesis.getVoices();
    const targetLang = lang === 'ar' ? 'ar' : 'en';
    const preferredVoice = voices.find(v => v.lang.startsWith(targetLang) && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Siri')));
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      if (onEnd) onEnd();
    };
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, []);

  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  return {
    isListening,
    isSpeaking,
    isVoiceMode,
    setIsVoiceMode,
    speechSupported,
    startListening,
    stopListening,
    speak,
    stopSpeaking
  };
}
