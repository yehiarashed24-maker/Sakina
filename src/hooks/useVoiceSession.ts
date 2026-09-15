import { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useChatContext } from '../context/ChatContext';

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
  const { messages, sendMessage, activeConversation } = useChatContext();

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
  const [voiceLang, setVoiceLangState] = useState<'ar' | 'en'>(lang); // Default to Arabic

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
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const messagesRef = useRef(messages);
  const voiceLangRef = useRef<'ar' | 'en'>(voiceLang);

  // Speech Accumulator & Silence Timer Refs
  const capturedTextRef = useRef<string>('');
  const silenceTimerRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);

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
          // Boost sensitivity so normal speaking causes visible visualizer rings (subtract a small noise floor and scale)
          const normalized = Math.min(1, Math.max(0, avg - 2) / 30);

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
      try { audioContextRef.current.close(); } catch { }
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
      } catch { }
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.onstop = null;
        mediaRecorderRef.current.ondataavailable = null;
        mediaRecorderRef.current.stop();
      } catch { }
    }
    mediaRecorderRef.current = null;
  }, []);

  // Cancel AI Speech Synthesis immediately (supports interruption)
  const stopSpeaking = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
  }, []);

  // Forward declaration of restartListening
  const restartListeningRef = useRef<() => void>(() => { });

  // Speak AI reply via High Quality Backend TTS
  const speakReply = useCallback((replyText: string, targetLang?: 'ar' | 'en') => {
    if (!isSessionActiveRef.current) return;

    const detectedLang = targetLang || (/[أ-ي\u0600-\u06FF]/.test(replyText) ? 'ar' : voiceLangRef.current);

    if (isSpeakerMutedRef.current) {
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
      stopSpeaking();

      const API_BASE = import.meta.env.VITE_API_URL || '';
      const url = `${API_BASE}/api/tts?text=${encodeURIComponent(clean)}&lang=${detectedLang}`;
      const audio = new Audio(url);
      
      audio.onplay = () => {
        if (!isSessionActiveRef.current) {
          audio.pause();
          return;
        }
        setState('speaking');
        setStatusText(detectedLang === 'ar' ? 'سكينة تتحدث...' : 'SAKINA IS SPEAKING...');
      };

      audio.onended = () => {
        currentAudioRef.current = null;
        if (isSessionActiveRef.current) {
          setState('listening');
          setStatusText(detectedLang === 'ar' ? 'أنا سامعاك دلوقتي...' : 'LISTENING TO YOU...');
          if (!isMutedRef.current) {
            restartListeningRef.current();
          }
        }
      };

      audio.onerror = (e) => {
        console.warn('Audio playback error:', e);
        currentAudioRef.current = null;
        if (isSessionActiveRef.current) {
          setState('listening');
          setStatusText(detectedLang === 'ar' ? 'أنا سامعاك دلوقتي...' : 'LISTENING TO YOU...');
          if (!isMutedRef.current) {
            restartListeningRef.current();
          }
        }
      };

      currentAudioRef.current = audio;
      audio.play().catch(e => {
        console.warn("Audio play blocked by browser:", e);
      });
    } catch (err) {
      console.error('Error in speakReply:', err);
      if (isSessionActiveRef.current) {
        setState('listening');
        restartListeningRef.current();
      }
    }
  }, [sanitizeTextForSpeech, stopSpeaking]);

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
      // Save both sides of the voice turn and reuse the same contextual chat request.
      const responseText = await sendMessage(spokenText, actualLang);
      if (!responseText) throw new Error('No AI response received');
      setAiResponse(responseText);

      // Speak the reply in Sakina's female voice
      speakReply(responseText, actualLang);
    } catch (err) {
      console.error('Voice AI error:', err);
      const fallbackMsg = actualLang === 'ar'
        ? 'أنا معك وأسمعك جيداً.. حاسس إزاي دلوقتي؟'
        : 'I am here with you.. tell me how you feel right now.';
      setAiResponse(fallbackMsg);
      speakReply(fallbackMsg, actualLang);
    } finally {
      isProcessingRef.current = false;
    }
  }, [speakReply, sendMessage]);

  // Start / Restart continuous speech recognition loop (optimized for Chrome & Safari)
  const restartListening = useCallback(() => {
    if (!isSessionActiveRef.current || isMutedRef.current || isProcessingRef.current) return;

    teardownRecognition();
    audioChunksRef.current = [];

    // Setup MediaRecorder for fallback/primary transcription
    if (mediaStreamRef.current) {
      try {
        const recorder = new MediaRecorder(mediaStreamRef.current);
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };
        recorder.onstop = async () => {
          const textToSubmit = capturedTextRef.current.trim();
          if (textToSubmit && isSessionActiveRef.current && !isProcessingRef.current) {
            // Web Speech API successfully got text, proceed immediately
            capturedTextRef.current = '';
            processUserSpeech(textToSubmit);
          } else if (audioChunksRef.current.length > 0 && isSessionActiveRef.current && !isProcessingRef.current && stateRef.current !== 'speaking') {
            // Web Speech failed/silent, fallback to audio file transcription
            const mimeType = recorder.mimeType || 'audio/webm';
            const blob = new Blob(audioChunksRef.current, { type: mimeType });
            audioChunksRef.current = [];

            // Only send if the blob is big enough to have speech
            if (blob.size > 2000) {
              try {
                setStatusText(voiceLangRef.current === 'ar' ? 'جاري معالجة الصوت...' : 'PROCESSING AUDIO...');
                setState('thinking');

                const formData = new FormData();
                const ext = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('ogg') ? 'ogg' : 'webm';
                formData.append('audio', blob, `audio.${ext}`);
                const API_BASE = import.meta.env.VITE_API_URL || '';

                const res = await fetch(`${API_BASE}/api/transcribe`, {
                  method: 'POST',
                  body: formData
                });
                if (res.ok) {
                  const data = await res.json();
                  if (data.text && data.text.trim()) {
                    processUserSpeech(data.text);
                    return;
                  }
                }
              } catch (err) {
                console.error("Transcription API error:", err);
              }
            }

            // If transcription yielded nothing, restart listening
            if (isSessionActiveRef.current && !isMutedRef.current && !isProcessingRef.current) {
              setState('listening');
              setStatusText(voiceLangRef.current === 'ar' ? 'أنا سامعاك دلوقتي...' : 'LISTENING TO YOU...');
              restartListeningRef.current();
            }
          }
        };
        mediaRecorderRef.current = recorder;
        recorder.start(1000);
      } catch (e) {
        console.warn("MediaRecorder start error:", e);
      }
    }

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      // Allow MediaRecorder to do the job alone if SpeechRec is unsupported
      setState('listening');
      setStatusText(voiceLangRef.current === 'ar' ? 'أنا سامعاك...' : 'LISTENING...');
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.lang = voiceLangRef.current === 'ar' ? 'ar-EG' : 'en-US';
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      capturedTextRef.current = '';

      recognition.onstart = () => {
        if (!isSessionActiveRef.current) {
          try { recognition.stop(); } catch { }
          return;
        }
        if (stateRef.current !== 'speaking' && stateRef.current !== 'thinking') {
          setState('listening');
          setStatusText(voiceLangRef.current === 'ar' ? 'أنا سامعاك دلوقتي...' : 'LISTENING...');
        }
      };

      recognition.onresult = (event: any) => {
        // Natural Interruption: If user starts speaking while AI is speaking, interrupt!
        if (stateRef.current === 'speaking') {
          stopSpeaking();
          setState('listening');
          setStatusText(voiceLangRef.current === 'ar' ? 'أنا سامعاك دلوقتي...' : 'LISTENING...');
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
            if (isSessionActiveRef.current && !isProcessingRef.current) {
              if (recognitionRef.current) {
                try { recognitionRef.current.stop(); } catch {}
              }
              if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                try { mediaRecorderRef.current.stop(); } catch {}
              }
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
        // We let MediaRecorder's onstop handle the actual submission or restart
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          // If we have text, stop the recorder now so onstop fires
          if (capturedTextRef.current.trim()) {
            mediaRecorderRef.current.stop();
          } else {
            // Keep MediaRecorder running if user is just quiet or Safari dropped recognition early
            // But if recognition dropped and we have no text, we just restart recognition alone
            if (isSessionActiveRef.current && !isMutedRef.current && !isProcessingRef.current && stateRef.current !== 'speaking') {
              try { recognition.start(); } catch { }
            }
          }
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
    if (!isProcessingRef.current) {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try { mediaRecorderRef.current.stop(); } catch {}
      }
    }
  }, []);

  // Interrupt Sakina action (User clicks "Interrupt & Speak")
  const interruptSakina = useCallback(() => {
    stopSpeaking();
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    setState('listening');
    setStatusText(voiceLangRef.current === 'ar' ? 'أنا سامعاك دلوقتي...' : 'LISTENING TO YOU NOW...');
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
      setStatusText(voiceLangRef.current === 'ar' ? 'أنا سامعاك...' : 'LISTENING...');
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

    // Auto-generate Journey session summary for completed Talk session
    const currentToken = localStorage.getItem('sakina_token');
    if (currentToken && activeConversation?.id && messagesRef.current.length > 0) {
      const convId = activeConversation.id;
      const API_BASE = import.meta.env.VITE_API_URL || '';
      fetch(`${API_BASE}/api/journey/summarize-session/${convId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentToken}`
        }
      }).catch(err => console.error("Journey auto-summarize session error:", err));
    }
  }, [stopSpeaking, teardownRecognition, teardownAudio, activeConversation]);

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
        setStatusText(voiceLangRef.current === 'ar' ? 'أنا سامعاك دلوقتي...' : 'LISTENING...');
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
