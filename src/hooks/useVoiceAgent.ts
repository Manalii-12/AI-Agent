'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { AgentState, TranscriptMessage, CallSummaryOutcome } from '@/types';
import { cleanTextForSpeech } from '@/lib/llm';

interface UseVoiceAgentProps {
  apiKey?: string;
  provider?: 'groq' | 'openai';
  customerName?: string;
  onStateChange?: (state: AgentState) => void;
  selectedVoice?: SpeechSynthesisVoice | null;
  setSelectedVoice?: (voice: SpeechSynthesisVoice | null) => void;
  availableVoices?: SpeechSynthesisVoice[];
  setAvailableVoices?: (voices: SpeechSynthesisVoice[]) => void;
}

export function useVoiceAgent({
  apiKey,
  provider = 'groq',
  customerName,
  onStateChange,
  selectedVoice: propSelectedVoice,
  setSelectedVoice: propSetSelectedVoice,
  availableVoices: propAvailableVoices,
  setAvailableVoices: propSetAvailableVoices,
}: UseVoiceAgentProps = {}) {
  const [state, setState] = useState<AgentState>('idle');
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [interimText, setInterimText] = useState<string>('');
  const [currentToolCall, setCurrentToolCall] = useState<any>(null);
  const [summary, setSummary] = useState<CallSummaryOutcome | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState<boolean>(false);
  const [isCallActive, setIsCallActive] = useState<boolean>(false);
  const [audioLevel, setAudioLevel] = useState<number>(0);

  // Internal voice state if not supplied via props
  const [localSelectedVoice, setLocalSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [localAvailableVoices, setLocalAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  const selectedVoice = propSelectedVoice !== undefined ? propSelectedVoice : localSelectedVoice;
  const setSelectedVoice = propSetSelectedVoice || setLocalSelectedVoice;
  const availableVoices = propAvailableVoices !== undefined ? propAvailableVoices : localAvailableVoices;
  const setAvailableVoices = propSetAvailableVoices || setLocalAvailableVoices;

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

  // Load browser TTS voices with high-clarity English prioritization (excluding pure Hindi voices)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    synthRef.current = window.speechSynthesis;

    const updateVoices = () => {
      if (!synthRef.current) return;
      const allVoices = synthRef.current.getVoices();
      if (allVoices.length === 0) return;

      // Group English voices first for high pronunciation accuracy
      const englishVoices = allVoices.filter(
        (v) => v.lang.toLowerCase().startsWith('en') && !v.lang.toLowerCase().startsWith('hi')
      );

      // Sort voices: English first (Natural/Online at the top), followed by others
      const sortedVoices = [...allVoices].sort((a, b) => {
        const aIsEn = a.lang.toLowerCase().startsWith('en');
        const bIsEn = b.lang.toLowerCase().startsWith('en');
        const aIsNatural = a.name.toLowerCase().includes('natural') || a.name.toLowerCase().includes('online');
        const bIsNatural = b.name.toLowerCase().includes('natural') || b.name.toLowerCase().includes('online');

        if (aIsNatural && !bIsNatural) return -1;
        if (!aIsNatural && bIsNatural) return 1;
        if (aIsEn && !bIsEn) return -1;
        if (!aIsEn && bIsEn) return 1;
        return a.name.localeCompare(b.name);
      });

      setAvailableVoices(sortedVoices);

      // 1. Prioritize Natural / Neural English Voices (Edge, Chrome, Mac)
      const naturalEnglishVoice = englishVoices.find(
        (v) =>
          v.name.toLowerCase().includes('natural') ||
          v.name.toLowerCase().includes('online') ||
          v.name.toLowerCase().includes('neural')
      );

      // 2. High clarity Indian English voices (strictly English, never hi-IN)
      const indianEnglishVoice = englishVoices.find(
        (v) =>
          (v.lang.toLowerCase().includes('en-in') ||
            v.name.toLowerCase().includes('india') ||
            v.name.toLowerCase().includes('neerja')) &&
          !v.lang.toLowerCase().startsWith('hi')
      );

      // 3. Clear Google English voices
      const googleEnglishVoice = englishVoices.find((v) =>
        v.name.toLowerCase().includes('google')
      );

      // 4. Quality standard English voices (Samantha, Zira, Jenny)
      const standardEnglishVoice = englishVoices.find(
        (v) =>
          v.name.toLowerCase().includes('zira') ||
          v.name.toLowerCase().includes('samantha') ||
          v.name.toLowerCase().includes('jenny') ||
          v.name.toLowerCase().includes('female')
      );

      const defaultVoice =
        naturalEnglishVoice ||
        indianEnglishVoice ||
        googleEnglishVoice ||
        standardEnglishVoice ||
        englishVoices[0] ||
        allVoices[0];

      setSelectedVoice(defaultVoice || null);
    };

    updateVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }

    return () => {
      if (synthRef.current) synthRef.current.cancel();
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (audioCooldownTimerRef.current) clearTimeout(audioCooldownTimerRef.current);
    };
  }, []);

  // Voice Visualizer for Mic input with Acoustic Echo Cancellation
  const setupAudioVisualizer = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      micStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
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
      if (synthRef.current.speaking || synthRef.current.pending) {
        synthRef.current.cancel();
      }
      if (synthRef.current.paused) {
        synthRef.current.resume();
      }

      // 4. Sanitize text so words like "summer", product IDs, and numbers pronounce accurately
      const cleanSpokenText = cleanTextForSpeech(text);
      const utterance = new SpeechSynthesisUtterance(cleanSpokenText);

      if (selectedVoice) {
        utterance.voice = selectedVoice;
        utterance.lang = selectedVoice.lang;
      } else {
        utterance.lang = 'en-IN';
      }

      // Pitch 1.0 (neutral natural pitch prevents robotic distortion); rate 0.98 for optimal diction
      utterance.rate = 0.98;
      utterance.pitch = 1.0;

      // Keep reference alive so Chrome V8 garbage collector does not destroy it mid-speech
      activeUtteranceRef.current = utterance;
      (window as any)._activeUtterance = utterance;

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

      synthRef.current.speak(utterance);
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

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('SpeechRecognition API is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = selectedVoice?.lang?.startsWith('en') ? selectedVoice.lang : 'en-IN';

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

    if (synthRef.current) {
      synthRef.current.cancel();
    }
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
