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
    recognition.lang = lang === 'ar' ? 'ar-SA' : 'en-US';

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

    // 1. Cut off citations and references entirely (never read out pdf filenames)
    const pureText = text.split(/📚|\*\*المراجع\*\*|\bالمراجع\b|\bReferences\b/i)[0];

    const cleanText = pureText
      .replace(/https?:\/\/\S+/g, '')
      .replace(/\b[\w.-]+\.pdf\b/gi, '')
      .replace(/\(صـ?\s*\d+\)/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[*_#`~>•\-–]/g, ' ')
      .replace(/[{}|[\]\\]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = lang === 'ar' ? 'ar-SA' : 'en-US';

    // Female Voice Selection Logic (Sakina)
    const voices = window.speechSynthesis.getVoices();
    let selectedVoice: SpeechSynthesisVoice | null = null;

    if (lang === 'ar') {
      const arFemaleNames = ['laila', 'mariam', 'salma', 'fatima', 'zariyah', 'mona', 'hoda', 'nour', 'amira', 'female'];
      selectedVoice = voices.find(v => v.lang.startsWith('ar') && arFemaleNames.some(fn => v.name.toLowerCase().includes(fn))) || null;

      if (!selectedVoice) {
        selectedVoice = voices.find(v => v.lang.startsWith('ar')) || null;
      }

      if (selectedVoice) {
        utterance.voice = selectedVoice;
        const isKnownMale = selectedVoice.name.toLowerCase().includes('maged') || selectedVoice.name.toLowerCase().includes('majed');
        utterance.pitch = isKnownMale ? 1.25 : 1.15;
        utterance.rate = isKnownMale ? 1.02 : 0.98;
      } else {
        utterance.pitch = 1.2;
        utterance.rate = 1.0;
      }
    } else {
      const enFemaleNames = ['samantha', 'victoria', 'karen', 'zira', 'jenny', 'female', 'natural'];
      selectedVoice = voices.find(v => v.lang.startsWith('en') && enFemaleNames.some(fn => v.name.toLowerCase().includes(fn))) || null;

      if (!selectedVoice) {
        selectedVoice = voices.find(v => v.lang.startsWith('en')) || null;
      }

      if (selectedVoice) utterance.voice = selectedVoice;
      utterance.pitch = 1.12;
      utterance.rate = 0.96;
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
