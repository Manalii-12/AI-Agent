'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { AgentState, TranscriptMessage, CallSummaryOutcome } from '@/types';
import { cleanTextForSpeech } from '@/lib/llm';

interface UseVoiceAgentProps {
  apiKey?: string;
  provider?: 'groq' | 'openai';
  customerName?: string;
  onStateChange?: (state: AgentState) => void;
  selectedVoiceName?: string;
  onSelectVoiceName?: (name: string) => void;
}

export function useVoiceAgent({
  apiKey,
  provider = 'groq',
  customerName,
  onStateChange,
  selectedVoiceName,
  onSelectVoiceName,
}: UseVoiceAgentProps = {}) {
  const [state, setState] = useState<AgentState>('idle');
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [interimText, setInterimText] = useState<string>('');
  const [currentToolCall, setCurrentToolCall] = useState<any>(null);
  const [summary, setSummary] = useState<CallSummaryOutcome | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState<boolean>(false);
  const [isCallActive, setIsCallActive] = useState<boolean>(false);
  const [audioLevel, setAudioLevel] = useState<number>(0);

  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const isSpeakingRef = useRef<boolean>(false);
  const stateRef = useRef<AgentState>('idle');
  const isCallActiveRef = useRef<boolean>(false);
  const transcriptRef = useRef<TranscriptMessage[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioCooldownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const interimBufferRef = useRef<string>('');

  // Synchronize state and call active refs
  useEffect(() => {
    stateRef.current = state;
    if (onStateChange) onStateChange(state);
  }, [state, onStateChange]);

  useEffect(() => {
    isCallActiveRef.current = isCallActive;
  }, [isCallActive]);

  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  // Load browser TTS voices safely with fallback protections against undefined properties
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const synth = window.speechSynthesis;
    synthRef.current = synth;

    const updateVoices = () => {
      try {
        const allVoices = synth.getVoices() || [];
        if (!allVoices || allVoices.length === 0) return;

        // Filter valid voices
        const validVoices = allVoices.filter((v) => v && typeof v.name === 'string');

        // Group English voices first for high pronunciation accuracy (strictly exclude pure Hindi voices)
        const englishVoices = validVoices.filter((v) => {
          const lang = (v.lang || '').toLowerCase();
          return lang.startsWith('en') && !lang.startsWith('hi');
        });

        // Sort voices safely: Natural English first, then English, then others
        const sortedVoices = [...validVoices].sort((a, b) => {
          const aLang = (a.lang || '').toLowerCase();
          const bLang = (b.lang || '').toLowerCase();
          const aName = (a.name || '').toLowerCase();
          const bName = (b.name || '').toLowerCase();

          const aIsNatural = aName.includes('natural') || aName.includes('online') || aName.includes('neural');
          const bIsNatural = bName.includes('natural') || bName.includes('online') || bName.includes('neural');
          if (aIsNatural && !bIsNatural) return -1;
          if (!aIsNatural && bIsNatural) return 1;

          const aIsEn = aLang.startsWith('en');
          const bIsEn = bLang.startsWith('en');
          if (aIsEn && !bIsEn) return -1;
          if (!aIsEn && bIsEn) return 1;

          return (a.name || '').localeCompare(b.name || '');
        });

        setAvailableVoices(sortedVoices);

        // 1. Natural / Neural English Voices
        const naturalEnglishVoice = englishVoices.find((v) => {
          const n = (v.name || '').toLowerCase();
          return n.includes('natural') || n.includes('online') || n.includes('neural');
        });

        // 2. High clarity Indian English voices
        const indianEnglishVoice = englishVoices.find((v) => {
          const l = (v.lang || '').toLowerCase();
          const n = (v.name || '').toLowerCase();
          return (l.includes('en-in') || n.includes('india') || n.includes('neerja')) && !l.startsWith('hi');
        });

        // 3. Clear Google English voices
        const googleEnglishVoice = englishVoices.find((v) => (v.name || '').toLowerCase().includes('google'));

        // 4. Standard English female voices
        const standardEnglishVoice = englishVoices.find((v) => {
          const n = (v.name || '').toLowerCase();
          return n.includes('zira') || n.includes('samantha') || n.includes('jenny') || n.includes('female');
        });

        const defaultVoice =
          naturalEnglishVoice ||
          indianEnglishVoice ||
          googleEnglishVoice ||
          standardEnglishVoice ||
          englishVoices[0] ||
          sortedVoices[0] ||
          null;

        setSelectedVoice((prev) => {
          if (selectedVoiceName) {
            const found = sortedVoices.find((v) => v.name === selectedVoiceName);
            if (found) return found;
          }
          return prev || defaultVoice;
        });

        if (defaultVoice && !selectedVoiceName && onSelectVoiceName) {
          onSelectVoiceName(defaultVoice.name);
        }
      } catch (err) {
        console.warn('SpeechSynthesis voice initialization safely handled:', err);
      }
    };

    updateVoices();
    if (synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = updateVoices;
    }

    return () => {
      try {
        if (synthRef.current) synthRef.current.cancel();
      } catch (e) {}
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (audioCooldownTimerRef.current) clearTimeout(audioCooldownTimerRef.current);
    };
  }, []);

  // Update selected voice when prop changes
  useEffect(() => {
    if (selectedVoiceName && availableVoices.length > 0) {
      const match = availableVoices.find((v) => v.name === selectedVoiceName);
      if (match) {
        setSelectedVoice(match);
      }
    }
  }, [selectedVoiceName, availableVoices]);

  // Voice Visualizer for Mic input with Acoustic Echo Cancellation
  const setupAudioVisualizer = async () => {
    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) return;

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      micStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateLevel = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        setAudioLevel(avg);
        animationFrameRef.current = requestAnimationFrame(updateLevel);
      };

      updateLevel();
    } catch (err) {
      console.warn('Microphone visualizer initialization skipped/failed:', err);
    }
  };

  const stopAudioVisualizer = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setAudioLevel(0);
  };

  // Safely start Speech Recognition
  const startRecognitionSafe = useCallback(() => {
    if (!recognitionRef.current || !isCallActiveRef.current) return;
    if (isSpeakingRef.current || stateRef.current === 'speaking' || stateRef.current === 'thinking') return;
    try {
      recognitionRef.current.start();
    } catch (e: any) {
      // Ignore if recognition is already started
    }
  }, []);

  // Safely stop Speech Recognition with hard abort to discard in-flight speaker feedback
  const stopRecognitionSafe = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.abort();
    } catch (e: any) {
      try {
        recognitionRef.current.stop();
      } catch (e2) {}
    }
  }, []);

  // Speak agent message using Web SpeechSynthesis with Chrome keep-alive, echo prevention, and text sanitization
  const speakAgentResponse = useCallback(
    (text: string, onEndCallback?: () => void) => {
      if (!synthRef.current) {
        if (onEndCallback) onEndCallback();
        return;
      }

      // 1. Immediately lock speaking state and abort recognition to prevent laptop speaker from echoing into mic
      isSpeakingRef.current = true;
      setState('speaking');
      stopRecognitionSafe();

      // 2. Clear any pending silence or cooldown timers
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      if (audioCooldownTimerRef.current) {
        clearTimeout(audioCooldownTimerRef.current);
        audioCooldownTimerRef.current = null;
      }

      // 3. Cancel previous speech if running, and resume if paused
      try {
        if (synthRef.current.speaking || synthRef.current.pending) {
          synthRef.current.cancel();
        }
        if (synthRef.current.paused) {
          synthRef.current.resume();
        }
      } catch (e) {}

      // 4. Sanitize text so words like "summer", product IDs, and numbers pronounce accurately
      const cleanSpokenText = cleanTextForSpeech(text);
      const utterance = new SpeechSynthesisUtterance(cleanSpokenText);

      if (selectedVoice) {
        utterance.voice = selectedVoice;
        utterance.lang = selectedVoice.lang || 'en-IN';
      } else {
        utterance.lang = 'en-IN';
      }

      // Pitch 1.0 (neutral natural pitch prevents robotic distortion); rate 0.98 for optimal diction
      utterance.rate = 0.98;
      utterance.pitch = 1.0;

      activeUtteranceRef.current = utterance;
      if (typeof window !== 'undefined') {
        (window as any)._activeUtterance = utterance;
      }

      utterance.onstart = () => {
        isSpeakingRef.current = true;
        setState('speaking');
      };

      utterance.onend = () => {
        isSpeakingRef.current = false;
        activeUtteranceRef.current = null;
        if (isCallActiveRef.current) {
          setState('listening');
          // 350ms echo absorption cooldown after speech ends before unmuting mic
          audioCooldownTimerRef.current = setTimeout(() => {
            if (isCallActiveRef.current && !isSpeakingRef.current && stateRef.current === 'listening') {
              startRecognitionSafe();
            }
          }, 350);
        }
        if (onEndCallback) onEndCallback();
      };

      utterance.onerror = (e) => {
        console.warn('SpeechSynthesis error:', e);
        isSpeakingRef.current = false;
        activeUtteranceRef.current = null;
        if (isCallActiveRef.current) {
          setState('listening');
          startRecognitionSafe();
        }
        if (onEndCallback) onEndCallback();
      };

      try {
        synthRef.current.speak(utterance);
      } catch (err) {
        console.warn('SpeechSynthesis speak failed:', err);
        if (onEndCallback) onEndCallback();
      }
    },
    [selectedVoice, startRecognitionSafe, stopRecognitionSafe]
  );

  // Barge-in / Interruption handling: stops agent speaking immediately if user interrupts
  const interruptAgent = useCallback(() => {
    if (synthRef.current && (synthRef.current.speaking || isSpeakingRef.current)) {
      synthRef.current.cancel();
      isSpeakingRef.current = false;
      activeUtteranceRef.current = null;
      setState('listening');
      startRecognitionSafe();
      console.log('⚡ Barge-in: Agent speech interrupted by user');
    }
  }, [startRecognitionSafe]);

  // Send message to backend and handle LLM/Tool execution
  const processUserSpeech = useCallback(
    async (spokenText: string) => {
      const cleanText = spokenText.trim();
      if (!cleanText) return;

      // Clear interim buffers and timers
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      interimBufferRef.current = '';
      setInterimText('');

      const userMsg: TranscriptMessage = {
        id: `user-${Date.now()}`,
        sender: 'user',
        text: cleanText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };

      const updatedTranscript = [...transcriptRef.current, userMsg];
      setTranscript(updatedTranscript);
      setState('thinking');
      stopRecognitionSafe();

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: updatedTranscript,
            apiKey,
            provider,
          }),
        });

        const data = await res.json();
        const agentResponseText = data.response || "I am happy to help. Could you please specify your query?";

        if (data.toolCalled) {
          setCurrentToolCall(data.toolCalled);
          if (
            (data.toolCalled.name === 'add_to_cart' || data.toolCalled.name === 'reorder_item') &&
            data.toolCalled.result?.data?.product &&
            typeof window !== 'undefined'
          ) {
            window.dispatchEvent(
              new CustomEvent('aura:voice_cart_add', {
                detail: { product: data.toolCalled.result.data.product },
              })
            );
          }
        }

        const agentMsg: TranscriptMessage = {
          id: `agent-${Date.now()}`,
          sender: 'agent',
          text: agentResponseText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          toolCall: data.toolCalled,
        };

        setTranscript((prev) => [...prev, agentMsg]);
        speakAgentResponse(agentResponseText);
      } catch (err) {
        console.error('Failed to process message:', err);
        const errorMsg: TranscriptMessage = {
          id: `agent-err-${Date.now()}`,
          sender: 'agent',
          text: "I could not quite catch that. Could you please repeat your question?",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        };
        setTranscript((prev) => [...prev, errorMsg]);
        speakAgentResponse(errorMsg.text);
      }
    },
    [apiKey, provider, speakAgentResponse, stopRecognitionSafe]
  );

  // Set up SpeechRecognition instance with responsive silence timer
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        console.warn('SpeechRecognition API is not supported in this browser.');
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      const lang = selectedVoice?.lang || '';
      recognition.lang = lang.toLowerCase().startsWith('en') ? lang : 'en-IN';

      recognition.onstart = () => {
        if (!isSpeakingRef.current && stateRef.current !== 'thinking') {
          setState('listening');
        }
      };

      recognition.onresult = (event: any) => {
        // If agent is speaking or processing, immediately drop mic input to prevent acoustic feedback loop
        if (isSpeakingRef.current || stateRef.current === 'speaking' || stateRef.current === 'thinking') {
          return;
        }

        let finalSpeech = '';
        let interim = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const result = event.results[i];
          if (result.isFinal) {
            finalSpeech += result[0].transcript;
          } else {
            interim += result[0].transcript;
          }
        }

        if (finalSpeech.trim()) {
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          interimBufferRef.current = '';
          setInterimText('');
          processUserSpeech(finalSpeech.trim());
          return;
        }

        if (interim.trim()) {
          interimBufferRef.current = interim.trim();
          setInterimText(interim);

          // Responsive 500ms silence timer (reduced from 900ms to eliminate voice lag)
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = setTimeout(() => {
            if (interimBufferRef.current && !isSpeakingRef.current && stateRef.current !== 'thinking') {
              const captured = interimBufferRef.current;
              interimBufferRef.current = '';
              setInterimText('');
              processUserSpeech(captured);
            }
          }, 500);
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          console.warn('Speech recognition error event:', event.error);
        }
      };

      recognition.onend = () => {
        // Auto-restart only if call is active and agent is actively in listening state
        if (isCallActiveRef.current && !isSpeakingRef.current && stateRef.current === 'listening') {
          startRecognitionSafe();
        }
      };

      recognitionRef.current = recognition;

      return () => {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        try {
          recognition.abort();
        } catch (e) {}
      };
    } catch (e) {
      console.warn('SpeechRecognition setup error safely caught:', e);
    }
  }, [processUserSpeech, startRecognitionSafe, selectedVoice]);

  // Start Call Handler
  const startCall = async () => {
    setSummary(null);
    setCurrentToolCall(null);
    setTranscript([]);
    setIsCallActive(true);
    isCallActiveRef.current = true;
    setState('speaking');

    await setupAudioVisualizer();

    const firstName = customerName ? customerName.split(' ')[0] : '';
    const greetingText = firstName
      ? `Namaste ${firstName}! I am Aria from Aura Skincare. How can I help you today?`
      : "Namaste! I am Aria from Aura Skincare. How can I help you today?";
    const initialMsg: TranscriptMessage = {
      id: `agent-welcome-${Date.now()}`,
      sender: 'agent',
      text: greetingText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };

    setTranscript([initialMsg]);

    speakAgentResponse(greetingText, () => {
      setState('listening');
      startRecognitionSafe();
    });
  };

  // End Call Handler
  const endCall = async () => {
    setIsCallActive(false);
    isCallActiveRef.current = false;
    setState('idle');

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (audioCooldownTimerRef.current) {
      clearTimeout(audioCooldownTimerRef.current);
      audioCooldownTimerRef.current = null;
    }

    try {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    } catch (e) {}
    isSpeakingRef.current = false;
    activeUtteranceRef.current = null;

    stopRecognitionSafe();
    stopAudioVisualizer();

    // Generate Structured Post-Call Summary
    setIsSummaryLoading(true);
    try {
      const res = await fetch('/api/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: transcriptRef.current,
          apiKey,
          provider,
        }),
      });

      const data = await res.json();
      if (data.summary) {
        setSummary(data.summary);
      }
    } catch (err) {
      console.error('Failed to generate summary:', err);
    } finally {
      setIsSummaryLoading(false);
    }
  };

  // Manual text prompt submission (useful if mic isn't available or for quick testing chips)
  const sendManualText = (text: string) => {
    interruptAgent();
    processUserSpeech(text);
  };

  return {
    state,
    isCallActive,
    transcript,
    interimText,
    currentToolCall,
    summary,
    isSummaryLoading,
    selectedVoice,
    setSelectedVoice,
    availableVoices,
    audioLevel,
    startCall,
    endCall,
    interruptAgent,
    sendManualText,
  };
}
