'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { AgentState, TranscriptMessage, CallSummaryOutcome } from '@/types';

interface UseVoiceAgentProps {
  apiKey?: string;
  provider?: 'groq' | 'openai';
  onStateChange?: (state: AgentState) => void;
}

export function useVoiceAgent({ apiKey, provider = 'groq', onStateChange }: UseVoiceAgentProps = {}) {
  const [state, setState] = useState<AgentState>('idle');
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [interimText, setInterimText] = useState<string>('');
  const [currentToolCall, setCurrentToolCall] = useState<any>(null);
  const [summary, setSummary] = useState<CallSummaryOutcome | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState<boolean>(false);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isCallActive, setIsCallActive] = useState<boolean>(false);
  const [audioLevel, setAudioLevel] = useState<number>(0);

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const isSpeakingRef = useRef<boolean>(false);
  const stateRef = useRef<AgentState>('idle');
  const transcriptRef = useRef<TranscriptMessage[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Synchronize state ref
  useEffect(() => {
    stateRef.current = state;
    if (onStateChange) onStateChange(state);
  }, [state, onStateChange]);

  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  // Load browser TTS voices and prioritize Indian English
  useEffect(() => {
    if (typeof window === 'undefined') return;

    synthRef.current = window.speechSynthesis;

    const updateVoices = () => {
      if (!synthRef.current) return;
      const voices = synthRef.current.getVoices();
      setAvailableVoices(voices);

      // Prioritize Indian English voices
      const indianVoice = voices.find(
        (v) =>
          (v.lang.toLowerCase().includes('en-in') || v.lang.toLowerCase().includes('hi-in')) ||
          v.name.toLowerCase().includes('india') ||
          v.name.toLowerCase().includes('neerja') ||
          v.name.toLowerCase().includes('heera')
      );

      // Fallback to female English voice
      const femaleVoice = voices.find(
        (v) =>
          v.lang.startsWith('en') &&
          (v.name.toLowerCase().includes('female') ||
            v.name.toLowerCase().includes('zira') ||
            v.name.toLowerCase().includes('samantha') ||
            v.name.toLowerCase().includes('karen'))
      );

      const defaultVoice = indianVoice || femaleVoice || voices.find((v) => v.lang.startsWith('en')) || voices[0];
      setSelectedVoice(defaultVoice || null);
    };

    updateVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }

    return () => {
      if (synthRef.current) synthRef.current.cancel();
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  // Voice Visualizer for Mic input
  const setupAudioVisualizer = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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

  // Speak agent message using Web SpeechSynthesis
  const speakAgentResponse = useCallback(
    (text: string, onEndCallback?: () => void) => {
      if (!synthRef.current) {
        if (onEndCallback) onEndCallback();
        return;
      }

      // Cancel any ongoing speech
      synthRef.current.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      utterance.lang = selectedVoice?.lang || 'en-IN';
      utterance.rate = 1.0;
      utterance.pitch = 1.05;

      utterance.onstart = () => {
        isSpeakingRef.current = true;
        setState('speaking');
      };

      utterance.onend = () => {
        isSpeakingRef.current = false;
        if (stateRef.current !== 'idle') {
          setState('listening');
          startRecognitionSafe();
        }
        if (onEndCallback) onEndCallback();
      };

      utterance.onerror = (e) => {
        console.warn('SpeechSynthesis error:', e);
        isSpeakingRef.current = false;
        if (stateRef.current !== 'idle') {
          setState('listening');
          startRecognitionSafe();
        }
        if (onEndCallback) onEndCallback();
      };

      synthRef.current.speak(utterance);
    },
    [selectedVoice]
  );

  // Barge-in / Interruption handling: stops agent speaking immediately if user speaks
  const interruptAgent = useCallback(() => {
    if (synthRef.current && (synthRef.current.speaking || isSpeakingRef.current)) {
      synthRef.current.cancel();
      isSpeakingRef.current = false;
      setState('listening');
      console.log('⚡ Barge-in: Agent speech interrupted by user');
    }
  }, []);

  // Send message to backend and handle LLM/Tool execution
  const processUserSpeech = useCallback(
    async (spokenText: string) => {
      if (!spokenText.trim()) return;

      const userMsg: TranscriptMessage = {
        id: `user-${Date.now()}`,
        sender: 'user',
        text: spokenText.trim(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };

      const updatedTranscript = [...transcriptRef.current, userMsg];
      setTranscript(updatedTranscript);
      setInterimText('');
      setState('thinking');

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
        const agentResponseText = data.response || "I'm happy to help. Could you please specify your query?";

        if (data.toolCalled) {
          setCurrentToolCall(data.toolCalled);
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
          text: "I couldn't quite catch that. Could you please repeat your question?",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        };
        setTranscript((prev) => [...prev, errorMsg]);
        speakAgentResponse(errorMsg.text);
      }
    },
    [apiKey, provider, speakAgentResponse]
  );

  // Initialize and safely restart Web Speech Recognition
  const startRecognitionSafe = useCallback(() => {
    if (!recognitionRef.current || !isCallActive) return;
    try {
      recognitionRef.current.start();
    } catch (e: any) {
      // Ignore if recognition is already started
    }
  }, [isCallActive]);

  // Set up SpeechRecognition instance
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
    recognition.lang = 'en-IN'; // Indian English priority

    recognition.onstart = () => {
      // Only set to listening if we aren't currently speaking or thinking
      if (stateRef.current !== 'speaking' && stateRef.current !== 'thinking') {
        setState('listening');
      }
    };

    recognition.onresult = (event: any) => {
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

      // Barge-in: if user is speaking while agent is speaking, interrupt immediately!
      if (isSpeakingRef.current && (interim.length > 2 || finalSpeech.length > 0)) {
        interruptAgent();
      }

      if (interim) {
        setInterimText(interim);
      }

      if (finalSpeech.trim()) {
        try {
          recognition.stop();
        } catch (e) {}
        processUserSpeech(finalSpeech.trim());
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        console.warn('Speech recognition error event:', event.error);
      }
    };

    recognition.onend = () => {
      // Auto-restart if call is still active and agent is not speaking
      if (isCallActive && !isSpeakingRef.current && stateRef.current !== 'thinking') {
        startRecognitionSafe();
      }
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch (e) {}
    };
  }, [isCallActive, interruptAgent, processUserSpeech, startRecognitionSafe]);

  // Start Call Handler
  const startCall = async () => {
    setSummary(null);
    setCurrentToolCall(null);
    setTranscript([]);
    setIsCallActive(true);
    setState('speaking');

    await setupAudioVisualizer();

    const greetingText = "Namaste! I'm Aria from Aura Skincare. How can I help you today?";
    const initialMsg: TranscriptMessage = {
      id: `agent-welcome-${Date.now()}`,
      sender: 'agent',
      text: greetingText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };

    setTranscript([initialMsg]);

    speakAgentResponse(greetingText, () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {}
      }
      setState('listening');
    });
  };

  // End Call Handler
  const endCall = async () => {
    setIsCallActive(false);
    setState('idle');

    if (synthRef.current) {
      synthRef.current.cancel();
    }
    isSpeakingRef.current = false;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

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
