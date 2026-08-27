import { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useChatContext } from '../context/ChatContext';
import { sendChatMessage } from '../services/aiService';

export type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking';

export interface UseVoiceSessionReturn {
  state: VoiceState;
  isActive: boolean;
  isMuted: boolean;
  isSpeakerMuted: boolean;
  audioLevel: number;
  transcript: string;
  interimTranscript: string;
  aiResponse: string;
  statusText: string;
  callDuration: number;
  voiceLang: 'ar' | 'en';
  setVoiceLang: (lang: 'ar' | 'en') => void;
  startSession: () => Promise<void>;
  endSession: () => void;
  toggleMute: () => void;
  toggleSpeaker: () => void;
  sendManualPrompt: (text: string) => Promise<void>;
  finishSpeakingNow: () => void;
  interruptSakina: () => void;
}

export function useVoiceSession(): UseVoiceSessionReturn {
  const { lang, setLang } = useLanguage();
  const { messages, setConversations, activeConversation } = useChatContext();

  const [state, setState] = useState<VoiceState>('idle');
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState<boolean>(false);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [transcript, setTranscript] = useState<string>('');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [aiResponse, setAiResponse] = useState<string>('');
  const [statusText, setStatusText] = useState<string>('READY');
  const [callDuration, setCallDuration] = useState<number>(0);
  const [voiceLang, setVoiceLangState] = useState<'ar' | 'en'>(lang === 'ar' ? 'ar' : 'ar'); // Default to Arabic

  // Audio Context & Analysis Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Speech Recognition & Session Control Refs
  const recognitionRef = useRef<any>(null);
  const isSessionActiveRef = useRef<boolean>(false);
  const isMutedRef = useRef<boolean>(false);
  const isSpeakerMutedRef = useRef<boolean>(false);
  const stateRef = useRef<VoiceState>('idle');
  const durationTimerRef = useRef<any>(null);
  const isProcessingRef = useRef<boolean>(false);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const messagesRef = useRef(messages);
  const voiceLangRef = useRef<'ar' | 'en'>(voiceLang);

  // Speech Accumulator & Silence Timer Refs
  const capturedTextRef = useRef<string>('');
  const silenceTimerRef = useRef<any>(null);

  // Keep refs synchronized
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);
  useEffect(() => { isSpeakerMutedRef.current = isSpeakerMuted; }, [isSpeakerMuted]);
  useEffect(() => { stateRef.current = state; }, [state]);
  useEffect(() => { voiceLangRef.current = voiceLang; }, [voiceLang]);

  const setVoiceLang = useCallback((newLang: 'ar' | 'en') => {
    setVoiceLangState(newLang);
    voiceLangRef.current = newLang;
    setLang(newLang);
    if (isSessionActiveRef.current && stateRef.current === 'listening') {
      restartListeningRef.current();
    }
  }, [setLang]);

  // Clean Markdown, Citations, PDF filenames & Symbols from AI text for clear natural reading
  const sanitizeTextForSpeech = useCallback((text: string): string => {
    // 1. Cut off citations entirely (strip anything from 📚 or المراجع or References to the end)
    const pureText = text.split(/📚|\*\*المراجع\*\*|\bالمراجع\b|\bReferences\b/i)[0];

    return pureText
      .replace(/https?:\/\/\S+/g, '')
      .replace(/\b[\w.-]+\.pdf\b/gi, '') // remove any PDF filenames like mental_health_rag_kb.pdf
      .replace(/\(صـ?\s*\d+\)/g, '')     // remove page numbers (صـ 3)
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[*_#`~>•\-–]/g, ' ')
      .replace(/[{}|[\]\\]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }, []);

  // Pre-load available speech synthesis voices
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  // Setup Web Audio API Analyser for real microphone volume reaction
  const setupAudioAnalyser = useCallback(async (stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const audioCtx = new AudioCtx();
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      let lastUpdate = 0;
      let lastLevel = 0;

      const updateLevel = (timestamp: number) => {
        if (!isSessionActiveRef.current) return;

        // Throttle updates to ~25fps (every 40ms) and only when listening to save CPU & battery
        if (stateRef.current === 'listening' && analyserRef.current && timestamp - lastUpdate > 40) {
          lastUpdate = timestamp;
          analyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
          }
          const avg = sum / bufferLength;
          const normalized = Math.min(1, avg / 70);

          // Only trigger React state update if there is a perceptible difference
          if (Math.abs(normalized - lastLevel) > 0.04 || (normalized === 0 && lastLevel !== 0)) {
            lastLevel = normalized;
            setAudioLevel(isMutedRef.current ? 0 : normalized);
          }
        } else if (stateRef.current !== 'listening' && lastLevel !== 0) {
          lastLevel = 0;
          setAudioLevel(0);
        }

        animFrameRef.current = requestAnimationFrame(updateLevel);
      };

      animFrameRef.current = requestAnimationFrame(updateLevel);
    } catch (e) {
      console.warn('AudioContext setup warning:', e);
    }
  }, []);

  // Teardown Web Audio
  const teardownAudio = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try { audioContextRef.current.close(); } catch (e) {}
      audioContextRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    setAudioLevel(0);
  }, []);

  // Teardown Speech Recognition
  const teardownRecognition = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
  }, []);

  // Cancel AI Speech Synthesis immediately (supports interruption)
  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    currentUtteranceRef.current = null;
  }, []);

  // Forward declaration of restartListening
  const restartListeningRef = useRef<() => void>(() => {});

  // Speak AI reply via SpeechSynthesis using Sakina's female voice in Arabic & English
  const speakReply = useCallback((replyText: string, targetLang?: 'ar' | 'en') => {
    if (!isSessionActiveRef.current) return;

    const detectedLang = targetLang || (/[أ-ي\u0600-\u06FF]/.test(replyText) ? 'ar' : voiceLangRef.current);

    if (isSpeakerMutedRef.current || !('speechSynthesis' in window)) {
      setState('idle');
      setStatusText(detectedLang === 'ar' ? 'جاهز للاستماع' : 'READY TO LISTEN');
      setTimeout(() => {
        if (isSessionActiveRef.current && !isMutedRef.current) {
          restartListeningRef.current();
        }
      }, 800);
      return;
    }

    const clean = sanitizeTextForSpeech(replyText);
    if (!clean) {
      setState('idle');
      setStatusText(detectedLang === 'ar' ? 'جاهز للاستماع' : 'READY TO LISTEN');
      if (isSessionActiveRef.current) restartListeningRef.current();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();

      const utterance = new SpeechSynthesisUtterance(clean);
      currentUtteranceRef.current = utterance;

      utterance.lang = detectedLang === 'ar' ? 'ar-SA' : 'en-US';

      // Female Voice Selection Logic (Sakina)
      const voices = window.speechSynthesis.getVoices();
      let selectedVoice: SpeechSynthesisVoice | null = null;

      if (detectedLang === 'ar') {
        // Arabic female voice priority
        const arFemaleNames = ['laila', 'mariam', 'salma', 'fatima', 'zariyah', 'mona', 'hoda', 'nour', 'amira', 'female'];
        selectedVoice = voices.find(v => v.lang.startsWith('ar') && arFemaleNames.some(fn => v.name.toLowerCase().includes(fn))) || null;
        
        if (!selectedVoice) {
          // Any Arabic voice
          selectedVoice = voices.find(v => v.lang.startsWith('ar')) || null;
        }

        if (selectedVoice) {
          utterance.voice = selectedVoice;
          // If the available voice is Majed or generic, raise pitch to 1.25 for a feminine, gentle tone
          const isKnownMale = selectedVoice.name.toLowerCase().includes('maged') || selectedVoice.name.toLowerCase().includes('majed');
          utterance.pitch = isKnownMale ? 1.25 : 1.15;
          utterance.rate = isKnownMale ? 1.02 : 0.98;
        } else {
          utterance.pitch = 1.2;
          utterance.rate = 1.0;
        }
      } else {
        // English female voice priority: Samantha, Victoria, Karen, Zira, Jenny, Female
        const enFemaleNames = ['samantha', 'victoria', 'karen', 'zira', 'jenny', 'female', 'natural'];
        selectedVoice = voices.find(v => v.lang.startsWith('en') && enFemaleNames.some(fn => v.name.toLowerCase().includes(fn))) || null;
        
        if (!selectedVoice) {
          selectedVoice = voices.find(v => v.lang.startsWith('en')) || null;
        }

        if (selectedVoice) utterance.voice = selectedVoice;
        utterance.pitch = 1.12; // warm feminine pitch
        utterance.rate = 0.96;  // calm and therapeutic
      }

      utterance.onstart = () => {
        if (!isSessionActiveRef.current) {
          window.speechSynthesis.cancel();
          return;
        }
        setState('speaking');
        setStatusText(detectedLang === 'ar' ? 'سكينة تتحدث...' : 'SAKINA IS SPEAKING...');
      };

      utterance.onend = () => {
        currentUtteranceRef.current = null;
        if (isSessionActiveRef.current) {
          setState('listening');
          setStatusText(detectedLang === 'ar' ? 'أنا أستمع إليك الآن...' : 'LISTENING TO YOU...');
          if (!isMutedRef.current) {
            restartListeningRef.current();
          }
        }
      };

      utterance.onerror = (e) => {
        console.warn('SpeechSynthesis error:', e);
        currentUtteranceRef.current = null;
        if (isSessionActiveRef.current) {
          setState('listening');
          setStatusText(detectedLang === 'ar' ? 'أنا أستمع إليك الآن...' : 'LISTENING TO YOU...');
          if (!isMutedRef.current) {
            restartListeningRef.current();
          }
        }
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error('Error in speakReply:', err);
      if (isSessionActiveRef.current) {
        setState('listening');
        restartListeningRef.current();
      }
    }
  }, [sanitizeTextForSpeech]);

  // Process User Speech through AI and speak back
  const processUserSpeech = useCallback(async (spokenText: string) => {
    if (!spokenText.trim() || !isSessionActiveRef.current || isProcessingRef.current) return;

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    isProcessingRef.current = true;
    setState('thinking');
    setInterimTranscript('');
    setTranscript(spokenText.trim());
    capturedTextRef.current = '';

    // Auto-detect language of the spoken text
    const hasArabicLetters = /[\u0600-\u06FF]/.test(spokenText);
    const actualLang: 'ar' | 'en' = hasArabicLetters ? 'ar' : voiceLangRef.current;
    setStatusText(actualLang === 'ar' ? 'سكينة تفكر...' : 'THINKING...');

    try {
      // 1. Prepare history with current user message
      const userMsg = { id: Date.now(), isAi: false, textEn: spokenText, textAr: spokenText };
      const currentHistory = [...messagesRef.current, userMsg];

      // 2. Fetch AI response
      const responseText = await sendChatMessage(currentHistory, actualLang);
      setAiResponse(responseText);

      // 3. Update ChatContext state so messages and history are synchronized
      const aiMsg = { id: Date.now() + 1, isAi: true, textEn: responseText, textAr: responseText };
      if (activeConversation?.id) {
        setConversations(prev => prev.map(c => {
          if (c.id !== activeConversation.id) return c;
          return {
            ...c,
            messages: [...c.messages, userMsg, aiMsg],
            title: c.messages.length === 0 ? (spokenText.slice(0, 24) + '...') : c.title
          };
        }));
      }

      // 4. Speak the reply in Sakina's female voice
      speakReply(responseText, actualLang);
    } catch (err) {
      console.error('Voice AI error:', err);
      const fallbackMsg = actualLang === 'ar'
        ? 'أنا معك وأسمعك جيداً.. كيف تشعر الآن؟'
        : 'I am here with you.. tell me how you feel right now.';
      setAiResponse(fallbackMsg);
      speakReply(fallbackMsg, actualLang);
    } finally {
      isProcessingRef.current = false;
    }
  }, [speakReply, activeConversation, setConversations]);

  // Start / Restart continuous speech recognition loop (optimized for Chrome & Safari)
  const restartListening = useCallback(() => {
    if (!isSessionActiveRef.current || isMutedRef.current || isProcessingRef.current) return;

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      setStatusText(voiceLangRef.current === 'ar' ? 'التعرف على الصوت غير مدعوم في هذا المتصفح' : 'SPEECH RECOGNITION NOT SUPPORTED');
      return;
    }

    try {
      teardownRecognition();

      const recognition = new SpeechRec();
      recognition.lang = voiceLangRef.current === 'ar' ? 'ar-SA' : 'en-US';
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      capturedTextRef.current = '';

      recognition.onstart = () => {
        if (!isSessionActiveRef.current) {
          try { recognition.stop(); } catch (e) {}
          return;
        }
        if (stateRef.current !== 'speaking' && stateRef.current !== 'thinking') {
          setState('listening');
          setStatusText(voiceLangRef.current === 'ar' ? 'أنا أستمع إليك الآن...' : 'LISTENING...');
        }
      };

      recognition.onresult = (event: any) => {
        // Natural Interruption: If user starts speaking while AI is speaking, interrupt!
        if (stateRef.current === 'speaking') {
          stopSpeaking();
          setState('listening');
          setStatusText(voiceLangRef.current === 'ar' ? 'أنا أستمع إليك الآن...' : 'LISTENING...');
        }

        let fullText = '';
        let interim = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          const textChunk = res[0].transcript;
          if (res.isFinal) {
            fullText += textChunk + ' ';
          } else {
            interim += textChunk;
          }
        }

        const candidate = (fullText + ' ' + interim).trim();
        if (candidate) {
          capturedTextRef.current = candidate;
          setTranscript(candidate);
          setInterimTranscript(interim);
        }

        // Automatic Silence Timeout Detector (1.3s pause)
        if (candidate.length > 1) {
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = setTimeout(() => {
            const textToSubmit = capturedTextRef.current.trim();
            if (textToSubmit && isSessionActiveRef.current && !isProcessingRef.current) {
              capturedTextRef.current = '';
              teardownRecognition();
              processUserSpeech(textToSubmit);
            }
          }, 1300);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        if (event.error === 'not-allowed') {
          setStatusText(voiceLangRef.current === 'ar' ? 'يرجى السماح بالمايكروفون من إعدادات المتصفح' : 'MIC PERMISSION DENIED');
          setIsMuted(true);
        }
      };

      recognition.onend = () => {
        const textToSend = capturedTextRef.current.trim();
        capturedTextRef.current = '';

        if (textToSend && isSessionActiveRef.current && !isProcessingRef.current) {
          processUserSpeech(textToSend);
        } else if (isSessionActiveRef.current && !isMutedRef.current && !isProcessingRef.current && stateRef.current !== 'speaking') {
          setTimeout(() => {
            if (isSessionActiveRef.current && !isMutedRef.current && !isProcessingRef.current && stateRef.current !== 'speaking') {
              restartListening();
            }
          }, 200);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.warn('Speech recognition start error:', e);
      setTimeout(() => {
        if (isSessionActiveRef.current && !isMutedRef.current && !isProcessingRef.current) {
          restartListening();
        }
      }, 500);
    }
  }, [teardownRecognition, stopSpeaking, processUserSpeech]);

  // Keep ref up to date
  useEffect(() => {
    restartListeningRef.current = restartListening;
  }, [restartListening]);

  // Manual Done Speaking / Send immediately button action
  const finishSpeakingNow = useCallback(() => {
    const textToSubmit = (capturedTextRef.current || transcript || interimTranscript).trim();
    if (textToSubmit && !isProcessingRef.current) {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      capturedTextRef.current = '';
      teardownRecognition();
      processUserSpeech(textToSubmit);
    }
  }, [transcript, interimTranscript, teardownRecognition, processUserSpeech]);

  // Interrupt Sakina action (User clicks "Interrupt & Speak")
  const interruptSakina = useCallback(() => {
    stopSpeaking();
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    setState('listening');
    setStatusText(voiceLangRef.current === 'ar' ? 'أنا أستمع إليك الآن...' : 'LISTENING TO YOU NOW...');
    restartListeningRef.current();
  }, [stopSpeaking]);

  // Start Session (User Clicks "Talk to Sakina")
  const startSession = useCallback(async () => {
    try {
      setIsActive(true);
      isSessionActiveRef.current = true;
      setIsMuted(false);
      setCallDuration(0);
      setTranscript('');
      setInterimTranscript('');
      setAiResponse('');
      capturedTextRef.current = '';
      setStatusText(voiceLangRef.current === 'ar' ? 'جاري الاتصال...' : 'CONNECTING...');

      // Request microphone stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // Start Audio Analyser for dynamic reactive rings
      await setupAudioAnalyser(stream);

      // Start duration timer
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
      durationTimerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);

      // Start listening loop
      setState('listening');
      setStatusText(voiceLangRef.current === 'ar' ? 'أنا أستمع إليك...' : 'LISTENING...');
      restartListening();

    } catch (err: any) {
      console.error('Failed to start voice session:', err);
      setIsActive(false);
      isSessionActiveRef.current = false;
      setState('idle');
      setStatusText(voiceLangRef.current === 'ar' ? 'يرجى السماح بالوصول للمايكروفون' : 'PLEASE ALLOW MICROPHONE ACCESS');
    }
  }, [setupAudioAnalyser, restartListening]);

  // End Session cleanly
  const endSession = useCallback(() => {
    isSessionActiveRef.current = false;
    setIsActive(false);
    setState('idle');
    setStatusText(voiceLangRef.current === 'ar' ? 'تم إنهاء المحادثة' : 'SESSION ENDED');

    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    stopSpeaking();
    teardownRecognition();
    teardownAudio();
  }, [stopSpeaking, teardownRecognition, teardownAudio]);

  // Toggle Mute
  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev;
      isMutedRef.current = next;
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getAudioTracks().forEach(track => {
          track.enabled = !next;
        });
      }
      if (next) {
        teardownRecognition();
        setState('idle');
        setStatusText(voiceLangRef.current === 'ar' ? 'تم كتم المايكروفون' : 'MICROPHONE MUTED');
      } else {
        setStatusText(voiceLangRef.current === 'ar' ? 'أنا أستمع إليك الآن...' : 'LISTENING...');
        restartListeningRef.current();
      }
      return next;
    });
  }, [teardownRecognition]);

  // Toggle Speaker
  const toggleSpeaker = useCallback(() => {
    setIsSpeakerMuted(prev => {
      const next = !prev;
      isSpeakerMutedRef.current = next;
      if (next && stateRef.current === 'speaking') {
        stopSpeaking();
        setState('idle');
      }
      return next;
    });
  }, [stopSpeaking]);

  // Manual Prompt input fallback during call
  const sendManualPrompt = useCallback(async (text: string) => {
    if (!text.trim()) return;
    if (stateRef.current === 'speaking') stopSpeaking();
    await processUserSpeech(text);
  }, [stopSpeaking, processUserSpeech]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      isSessionActiveRef.current = false;
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      stopSpeaking();
      teardownRecognition();
      teardownAudio();
    };
  }, [stopSpeaking, teardownRecognition, teardownAudio]);

  return {
    state,
    isActive,
    isMuted,
    isSpeakerMuted,
    audioLevel,
    transcript,
    interimTranscript,
    aiResponse,
    statusText,
    callDuration,
    voiceLang,
    setVoiceLang,
    startSession,
    endSession,
    toggleMute,
    toggleSpeaker,
    sendManualPrompt,
    finishSpeakingNow,
    interruptSakina
  };
}
