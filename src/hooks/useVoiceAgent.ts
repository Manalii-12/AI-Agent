'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { AgentState, TranscriptMessage, CallSummaryOutcome } from '@/types';
import { cleanTextForSpeech, processLocalVoiceQuery } from '@/lib/llm';

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
  selectedVoiceName = 'en-IN-NeerjaExpressiveNeural',
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
  const selectedVoiceRef = useRef<SpeechSynthesisVoice | null>(null);

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
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioCooldownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const interimBufferRef = useRef<string>('');
  const userSpeechAccumulatorRef = useRef<string>('');

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

        const validVoices = allVoices.filter((v) => v && typeof v.name === 'string');

        const isIndianVoice = (v: SpeechSynthesisVoice) => {
          const l = (v.lang || '').toLowerCase();
          const n = (v.name || '').toLowerCase();
          return (
            l.includes('en-in') ||
            l.includes('hi-in') ||
            n.includes('neerja') ||
            n.includes('heera') ||
            n.includes('swara') ||
            n.includes('priya') ||
            n.includes('veena') ||
            n.includes('prabhat') ||
            n.includes('ravi') ||
            n.includes('madhur') ||
            (n.includes('india') && (l.startsWith('en') || l.startsWith('hi')))
          );
        };

        const isMale = (v: SpeechSynthesisVoice) => {
          const n = (v.name || '').toLowerCase();
          return (
            n.includes('prabhat') ||
            n.includes('ravi') ||
            n.includes('madhur') ||
            n.includes('aarav') ||
            n.includes('rishi') ||
            n.includes('david') ||
            n.includes('mark') ||
            n.includes('guy') ||
            n.includes('male') ||
            n.includes('george') ||
            n.includes('daniel') ||
            n.includes('alex') ||
            n.includes('fred') ||
            n.includes('oliver') ||
            n.includes('richard') ||
            n.includes('james') ||
            n.includes('thomas') ||
            n.includes('william') ||
            n.includes('michael') ||
            n.includes('paul') ||
            n.includes('brian') ||
            n.includes('kevin') ||
            n.includes('edward') ||
            n.includes('peter') ||
            n.includes('sean')
          );
        };

        const sortedVoices = [...validVoices].sort((a, b) => {
          const aIsInd = isIndianVoice(a);
          const bIsInd = isIndianVoice(b);
          if (aIsInd && !bIsInd) return -1;
          if (!aIsInd && bIsInd) return 1;

          const aIsM = isMale(a);
          const bIsM = isMale(b);
          if (!aIsM && bIsM) return -1;
          if (aIsM && !bIsM) return 1;

          const aName = (a.name || '').toLowerCase();
          const bName = (b.name || '').toLowerCase();
          const aIsNatural = aName.includes('natural') || aName.includes('online') || aName.includes('neural');
          const bIsNatural = bName.includes('natural') || bName.includes('online') || bName.includes('neural');
          if (aIsNatural && !bIsNatural) return -1;
          if (!aIsNatural && bIsNatural) return 1;

          return (a.name || '').localeCompare(b.name || '');
        });

        setAvailableVoices(sortedVoices);

        // Female Indian English priority (Neerja, Heera, Priya, Veena)
        const femaleIndianVoices = sortedVoices.filter((v) => isIndianVoice(v) && !isMale(v));
        const bestFemaleIndianVoice =
          femaleIndianVoices.find((v) => (v.name || '').toLowerCase().includes('neerja')) ||
          femaleIndianVoices.find((v) => (v.name || '').toLowerCase().includes('heera')) ||
          femaleIndianVoices.find((v) => (v.name || '').toLowerCase().includes('swara')) ||
          femaleIndianVoices.find((v) => (v.name || '').toLowerCase().includes('priya')) ||
          femaleIndianVoices.find((v) => (v.name || '').toLowerCase().includes('veena')) ||
          femaleIndianVoices[0] ||
          sortedVoices.find((v) => isIndianVoice(v));

        const defaultVoice = bestFemaleIndianVoice || sortedVoices[0] || null;

        if (defaultVoice) {
          selectedVoiceRef.current = defaultVoice;
        }

        setSelectedVoice((prev) => {
          if (selectedVoiceName) {
            const found = sortedVoices.find((v) => v.name === selectedVoiceName);
            if (found) {
              selectedVoiceRef.current = found;
              return found;
            }
          }
          const chosen = prev || defaultVoice;
          if (chosen) selectedVoiceRef.current = chosen;
          return chosen;
        });

        if (defaultVoice && !selectedVoiceName && onSelectVoiceName) {
          onSelectVoiceName('en-IN-NeerjaExpressiveNeural');
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

  // Speak agent message using Neural Indian TTS with browser SpeechSynthesis fallback
  const speakAgentResponse = useCallback(
    async (text: string, onEndCallback?: () => void) => {

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

      // 3. Stop any existing audio or speech
      if (currentAudioRef.current) {
        try {
          currentAudioRef.current.pause();
          currentAudioRef.current.currentTime = 0;
        } catch (e) {}
        currentAudioRef.current = null;
      }

      if (synthRef.current) {
        try {
          if (synthRef.current.speaking || synthRef.current.pending) {
            synthRef.current.cancel();
          }
          if (synthRef.current.paused) {
            synthRef.current.resume();
          }
        } catch (e) {}
      }

      // 4. Sanitize text so words like "summer", product IDs, and numbers pronounce accurately
      const cleanSpokenText = cleanTextForSpeech(text);

      const speakWithBrowserSpeech = (cleanText: string, onEnd?: () => void) => {
        if (!synthRef.current) {
          if (onEnd) onEnd();
          return;
        }

        const utterance = new SpeechSynthesisUtterance(cleanText);
        let voiceToUse: SpeechSynthesisVoice | null = selectedVoiceRef.current || selectedVoice;

        if (!voiceToUse && synthRef.current) {
          const liveVoices = synthRef.current.getVoices() || [];
          const validVoices = liveVoices.filter((v) => v && typeof v.name === 'string');

          const isIndianVoice = (v: SpeechSynthesisVoice) => {
            const l = (v.lang || '').toLowerCase();
            const n = (v.name || '').toLowerCase();
            return (
              l.includes('en-in') ||
              l.includes('hi-in') ||
              n.includes('neerja') ||
              n.includes('heera') ||
              n.includes('swara') ||
              n.includes('priya') ||
              n.includes('veena') ||
              n.includes('prabhat') ||
              n.includes('ravi')
            );
          };

          const indianVoices = validVoices.filter(isIndianVoice);
          voiceToUse =
            indianVoices.find((v) => (v.name || '').toLowerCase().includes('neerja')) ||
            indianVoices.find((v) => (v.name || '').toLowerCase().includes('heera')) ||
            indianVoices.find((v) => (v.name || '').toLowerCase().includes('swara')) ||
            indianVoices.find((v) => (v.name || '').toLowerCase().includes('priya')) ||
            indianVoices[0] ||
            validVoices.find((v) => (v.lang || '').toLowerCase().includes('en-in')) ||
            validVoices[0] ||
            null;

          if (voiceToUse) {
            selectedVoiceRef.current = voiceToUse;
          }
        }

        if (voiceToUse) {
          utterance.voice = voiceToUse;
          utterance.lang = voiceToUse.lang || 'en-IN';
        } else {
          utterance.lang = 'en-IN';
        }

        utterance.rate = 0.95;
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
            audioCooldownTimerRef.current = setTimeout(() => {
              if (isCallActiveRef.current && !isSpeakingRef.current && stateRef.current === 'listening') {
                startRecognitionSafe();
              }
            }, 350);
          }
          if (onEnd) onEnd();
        };

        utterance.onerror = (e) => {
          console.warn('SpeechSynthesis error:', e);
          isSpeakingRef.current = false;
          activeUtteranceRef.current = null;
          if (isCallActiveRef.current) {
            setState('listening');
            startRecognitionSafe();
          }
          if (onEnd) onEnd();
        };

        try {
          synthRef.current.speak(utterance);
        } catch (err) {
          console.warn('SpeechSynthesis speak failed:', err);
          if (onEnd) onEnd();
        }
      };

      // Check if Neural Indian Voice should be used (default or Indian Neural preset selected)
      const isNeuralIndian =
        !selectedVoiceName ||
        selectedVoiceName === 'en-IN-NeerjaExpressiveNeural' ||
        selectedVoiceName === 'en-IN-NeerjaNeural' ||
        selectedVoiceName === 'hi-IN-SwaraNeural' ||
        selectedVoiceName === 'en-IN-PrabhatNeural' ||
        selectedVoiceName === 'hi-IN-MadhurNeural';

      if (isNeuralIndian && typeof window !== 'undefined') {
        const neuralVoice = selectedVoiceName || 'en-IN-NeerjaExpressiveNeural';
        try {
          const apiBase = process.env.NEXT_PUBLIC_BACKEND_URL || '';
          const res = await fetch(`${apiBase}/api/tts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: cleanSpokenText,
              voice: neuralVoice,
            }),
          });

          if (res.ok) {
            const blob = await res.blob();
            const audioUrl = URL.createObjectURL(blob);
            const audio = new Audio(audioUrl);
            currentAudioRef.current = audio;

            audio.onplay = () => {
              isSpeakingRef.current = true;
              setState('speaking');
            };

            audio.onended = () => {
              URL.revokeObjectURL(audioUrl);
              currentAudioRef.current = null;
              isSpeakingRef.current = false;
              if (isCallActiveRef.current) {
                setState('listening');
                audioCooldownTimerRef.current = setTimeout(() => {
                  if (isCallActiveRef.current && !isSpeakingRef.current && stateRef.current === 'listening') {
                    startRecognitionSafe();
                  }
                }, 350);
              }
              if (onEndCallback) onEndCallback();
            };

            audio.onerror = (err) => {
              console.warn('Audio playback error, falling back to Web Speech:', err);
              URL.revokeObjectURL(audioUrl);
              currentAudioRef.current = null;
              speakWithBrowserSpeech(cleanSpokenText, onEndCallback);
            };

            await audio.play();
            return;
          }
        } catch (fetchErr) {
          console.warn('Neural Indian TTS network request failed, falling back to Web Speech:', fetchErr);
        }
      }

      // Fallback: Browser Web Speech API
      speakWithBrowserSpeech(cleanSpokenText, onEndCallback);
    },
    [selectedVoice, selectedVoiceName, startRecognitionSafe, stopRecognitionSafe]
  );

  // Barge-in / Interruption handling: stops agent speaking immediately if user interrupts
  const interruptAgent = useCallback(() => {
    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
      } catch (e) {}
      currentAudioRef.current = null;
    }
    if (synthRef.current && (synthRef.current.speaking || isSpeakingRef.current)) {
      synthRef.current.cancel();
    }
    isSpeakingRef.current = false;
    activeUtteranceRef.current = null;
    if (isCallActiveRef.current) {
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

      let agentResponseText = '';
      let toolCalled: any = null;

      try {
        const apiBase = process.env.NEXT_PUBLIC_BACKEND_URL || '';
        // If external API or Next.js route is available, call it with 3.5s timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);

        const res = await fetch(`${apiBase}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: updatedTranscript,
            apiKey,
            provider,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!res.ok) {
          throw new Error(`HTTP error ${res.status}`);
        }

        const data = await res.json();
        if (data && data.response) {
          agentResponseText = data.response;
          toolCalled = data.toolCalled || null;
        } else {
          throw new Error('Empty response from API');
        }
      } catch (err) {
        console.warn('Backend/API route unavailable, running instant high-precision local intent engine:', err);
        // CRITICAL FAIL-SAFE: Execute local intent engine with 100% DataStraw accuracy & zero latency
        const localResult = processLocalVoiceQuery(cleanText, updatedTranscript);
        agentResponseText = localResult.responseText;
        toolCalled = localResult.toolCalled || null;
      }

      if (toolCalled) {
        setCurrentToolCall(toolCalled);
        if (
          (toolCalled.name === 'add_to_cart' || toolCalled.name === 'reorder_item') &&
          toolCalled.result?.data?.product &&
          typeof window !== 'undefined'
        ) {
          window.dispatchEvent(
            new CustomEvent('aura:voice_cart_add', {
              detail: { product: toolCalled.result.data.product },
            })
          );
        }
      }

      const agentMsg: TranscriptMessage = {
        id: `agent-${Date.now()}`,
        sender: 'agent',
        text: agentResponseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        toolCall: toolCalled,
      };

      setTranscript((prev) => [...prev, agentMsg]);
      speakAgentResponse(agentResponseText);
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
      // Indian English acoustic model understands Indian accents, "Namaste", and Hinglish natively
      recognition.lang = 'en-IN';

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

        let incrementalFinal = '';
        let currentInterim = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const result = event.results[i];
          if (result.isFinal) {
            incrementalFinal += ' ' + result[0].transcript;
          } else {
            currentInterim += result[0].transcript;
          }
        }

        // Accumulate final transcript chunks across brief speaker pauses
        if (incrementalFinal.trim()) {
          userSpeechAccumulatorRef.current = (
            userSpeechAccumulatorRef.current + ' ' + incrementalFinal.trim()
          ).trim();
        }

        const totalSpoken = (
          userSpeechAccumulatorRef.current + ' ' + currentInterim.trim()
        ).trim();

        if (totalSpoken) {
          setInterimText(totalSpoken);

          // Clear previous silence timer
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
          }

          // Check if utterance ends with an incomplete connector (e.g. "and", "or", "because", "can I", "par", "aur")
          const lower = totalSpoken.toLowerCase().trim();
          const isIncomplete =
            lower.endsWith(' and') ||
            lower.endsWith(' or') ||
            lower.endsWith(' but') ||
            lower.endsWith(' because') ||
            lower.endsWith(' so') ||
            lower.endsWith(' if') ||
            lower.endsWith(' can i') ||
            lower.endsWith(' will you') ||
            lower.endsWith(' aur') ||
            lower.endsWith(' ya') ||
            lower.endsWith(' par') ||
            lower.endsWith(' lekin') ||
            lower.endsWith(' kyunki') ||
            lower.endsWith(' toh') ||
            lower.endsWith(' ki') ||
            lower.endsWith(' mera') ||
            lower.endsWith(' order');

          // Conversational turn-taking pause: 1400ms standard, 1900ms if sentence is clearly mid-clause
          // This gives the user plenty of time to formulate their sentence without being cut off mid-speech
          const debounceMs = isIncomplete ? 1900 : 1400;

          silenceTimerRef.current = setTimeout(() => {
            const capturedQuery = (
              userSpeechAccumulatorRef.current + ' ' + currentInterim.trim()
            ).trim();

            if (
              capturedQuery &&
              !isSpeakingRef.current &&
              stateRef.current !== 'thinking' &&
              isCallActiveRef.current
            ) {
              userSpeechAccumulatorRef.current = '';
              setInterimText('');
              processUserSpeech(capturedQuery);
            }
          }, debounceMs);
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
    userSpeechAccumulatorRef.current = '';
    setState('speaking');

    await setupAudioVisualizer();

    const firstName = customerName ? customerName.split(' ')[0] : '';
    const greetingText = firstName
      ? `Namaste ${firstName}! Welcome to Aura Skincare. I am Aria, how can I assist you with your orders and skincare today?`
      : "Namaste! Welcome to Aura Skincare. I am Aria, how can I assist you with your orders and skincare today?";
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
    userSpeechAccumulatorRef.current = '';
    setState('idle');

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (audioCooldownTimerRef.current) {
      clearTimeout(audioCooldownTimerRef.current);
      audioCooldownTimerRef.current = null;
    }

    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
      } catch (e) {}
      currentAudioRef.current = null;
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
      const apiBase = process.env.NEXT_PUBLIC_BACKEND_URL || '';
      const res = await fetch(`${apiBase}/api/summary`, {
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
    userSpeechAccumulatorRef.current = '';
    setInterimText('');
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
