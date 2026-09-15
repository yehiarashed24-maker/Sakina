import re

with open("src/hooks/useVoiceSession.ts", "r") as f:
    content = f.read()

# 1. Add MediaRecorder refs
content = content.replace(
    "const recognitionRef = useRef<any>(null);",
    "const recognitionRef = useRef<any>(null);\n  const mediaRecorderRef = useRef<MediaRecorder | null>(null);\n  const audioChunksRef = useRef<BlobPart[]>([]);"
)

# 2. Update teardownRecognition to stop MediaRecorder too
teardown_original = """  const teardownRecognition = useCallback(() => {
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
      } catch (e) { }
      recognitionRef.current = null;
    }
  }, []);"""

teardown_new = """  const teardownRecognition = useCallback(() => {
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
      } catch (e) { }
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.onstop = null;
        mediaRecorderRef.current.ondataavailable = null;
        mediaRecorderRef.current.stop();
      } catch(e) {}
    }
    mediaRecorderRef.current = null;
  }, []);"""

content = content.replace(teardown_original, teardown_new)

# 3. Update Audio level sensitivity
content = content.replace(
    "const normalized = Math.min(1, avg / 70);",
    "const normalized = Math.min(1, Math.max(0, avg - 2) / 30);"
)

# 4. Enhance restartListening to include MediaRecorder
restart_old = """  const restartListening = useCallback(() => {
    if (!isSessionActiveRef.current || isMutedRef.current || isProcessingRef.current) return;

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      setStatusText(voiceLangRef.current === 'ar' ? 'التعرف على الصوت غير مدعوم في هذا المتصفح' : 'SPEECH RECOGNITION NOT SUPPORTED');
      return;
    }"""

restart_new = """  const restartListening = useCallback(() => {
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
            const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            audioChunksRef.current = [];
            
            // Only send if the blob is big enough to have speech
            if (blob.size > 2000) {
              try {
                setStatusText(voiceLangRef.current === 'ar' ? 'جاري معالجة الصوت...' : 'PROCESSING AUDIO...');
                setState('thinking');
                
                const formData = new FormData();
                formData.append('audio', blob, 'audio.webm');
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
              } catch(err) {
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
      } catch(e) {
        console.warn("MediaRecorder start error:", e);
      }
    }

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      // Allow MediaRecorder to do the job alone if SpeechRec is unsupported
      setState('listening');
      setStatusText(voiceLangRef.current === 'ar' ? 'أنا سامعاك...' : 'LISTENING...');
      return;
    }"""

content = content.replace(restart_old, restart_new)


# 5. Fix Web Speech onend to trigger media recorder stop instead of calling processUserSpeech directly
onend_old = """      recognition.onend = () => {
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
      };"""

onend_new = """      recognition.onend = () => {
        // We let MediaRecorder's onstop handle the actual submission or restart
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          // If we have text, stop the recorder now so onstop fires
          if (capturedTextRef.current.trim()) {
            mediaRecorderRef.current.stop();
          } else {
            // Keep MediaRecorder running if user is just quiet or Safari dropped recognition early
            // But if recognition dropped and we have no text, we just restart recognition alone
            if (isSessionActiveRef.current && !isMutedRef.current && !isProcessingRef.current && stateRef.current !== 'speaking') {
               try { recognition.start(); } catch(e) {}
            }
          }
        }
      };"""
content = content.replace(onend_old, onend_new)


# 6. Update silence timeout detector to stop media recorder
timeout_old = """        if (candidate.length > 1) {
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = setTimeout(() => {
            const textToSubmit = capturedTextRef.current.trim();
            if (textToSubmit && isSessionActiveRef.current && !isProcessingRef.current) {
              capturedTextRef.current = '';
              teardownRecognition();
              processUserSpeech(textToSubmit);
            }
          }, 1300);
        }"""

timeout_new = """        if (candidate.length > 1) {
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = setTimeout(() => {
            if (isSessionActiveRef.current && !isProcessingRef.current) {
              teardownRecognition(); // This will stop MediaRecorder, which triggers its onstop and processes speech
            }
          }, 1300);
        }"""
content = content.replace(timeout_old, timeout_new)

# 7. Update finishSpeakingNow
finish_old = """  const finishSpeakingNow = useCallback(() => {
    const textToSubmit = (capturedTextRef.current || transcript || interimTranscript).trim();
    if (textToSubmit && !isProcessingRef.current) {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      capturedTextRef.current = '';
      teardownRecognition();
      processUserSpeech(textToSubmit);
    }
  }, [transcript, interimTranscript, teardownRecognition, processUserSpeech]);"""

finish_new = """  const finishSpeakingNow = useCallback(() => {
    if (!isProcessingRef.current) {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      // teardownRecognition stops MediaRecorder, which processes any text or recorded audio chunk.
      teardownRecognition();
    }
  }, [teardownRecognition]);"""
content = content.replace(finish_old, finish_new)

# write it out
with open("src/hooks/useVoiceSession.ts", "w") as f:
    f.write(content)
