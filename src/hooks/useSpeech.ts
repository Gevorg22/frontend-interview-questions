import { useState, useCallback, useEffect } from 'react';

export const useSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const cleanMarkdown = (text: string): string => {
    return text
      .replace(/```[\s\S]*?```/g, 'код')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/#{1,6}\s/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/\n+/g, '. ')
      .trim();
  };

  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) {
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
    }

    const cleanedText = cleanMarkdown(text);
    const utterance = new SpeechSynthesisUtterance(cleanedText);
    
    utterance.lang = 'ru-RU';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  }, [isSpeaking]);

  const stop = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  const toggle = useCallback((text: string) => {
    if (isSpeaking) {
      stop();
    } else {
      speak(text);
    }
  }, [isSpeaking, speak, stop]);

  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return {
    isSpeaking,
    speak,
    stop,
    toggle,
  };
};
