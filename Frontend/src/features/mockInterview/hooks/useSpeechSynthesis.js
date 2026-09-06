import { useState, useEffect, useRef, useCallback } from "react";

export const useSpeechSynthesis = () => {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isSupported, setIsSupported] = useState(true);
    const currentUtteranceRef = useRef(null);

    useEffect(() => {
        if (!("speechSynthesis" in window)) {
            setIsSupported(false);
        }
        return () => {
            if ("speechSynthesis" in window) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    const cleanTextForSpeech = (rawText) => {
        if (!rawText) return "";
        return rawText
            .replace(/[`*#_~]/g, "")
            .replace(/https?:\/\/\S+/g, "")
            .replace(/\s+/g, " ")
            .trim();
    };

    const speak = useCallback((text, onEndCallback = null) => {
        if (!("speechSynthesis" in window) || isMuted || !text) {
            if (onEndCallback) onEndCallback();
            return;
        }

        window.speechSynthesis.cancel();

        const cleaned = cleanTextForSpeech(text);
        const utterance = new SpeechSynthesisUtterance(cleaned);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        // Try to pick a natural English voice
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(
            (v) => (v.lang.startsWith("en-") || v.lang === "en") && (v.name.includes("Natural") || v.name.includes("Google") || v.name.includes("Samantha"))
        ) || voices.find((v) => v.lang.startsWith("en"));

        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }

        utterance.onstart = () => {
            setIsSpeaking(true);
        };

        utterance.onend = () => {
            setIsSpeaking(false);
            currentUtteranceRef.current = null;
            if (onEndCallback) onEndCallback();
        };

        utterance.onerror = () => {
            setIsSpeaking(false);
            currentUtteranceRef.current = null;
            if (onEndCallback) onEndCallback();
        };

        currentUtteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
    }, [isMuted]);

    const stopSpeaking = useCallback(() => {
        if ("speechSynthesis" in window) {
            window.speechSynthesis.cancel();
        }
        setIsSpeaking(false);
    }, []);

    const toggleMute = useCallback(() => {
        setIsMuted((prev) => {
            const next = !prev;
            if (next && isSpeaking) {
                stopSpeaking();
            }
            return next;
        });
    }, [isSpeaking, stopSpeaking]);

    return {
        isSpeaking,
        isMuted,
        isSupported,
        speak,
        stopSpeaking,
        toggleMute,
    };
};
