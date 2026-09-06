import { useState, useEffect, useRef, useCallback } from "react";

export const useSpeechRecognition = () => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [interimTranscript, setInterimTranscript] = useState("");
    const [isSupported, setIsSupported] = useState(true);
    const [isMicMuted, setIsMicMuted] = useState(false);
    const recognitionRef = useRef(null);
    const isManuallyStoppedRef = useRef(false);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setIsSupported(false);
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onstart = () => {
            setIsListening(true);
        };

        recognition.onresult = (event) => {
            let interim = "";
            let final = "";

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const item = event.results[i];
                if (item.isFinal) {
                    final += item[0].transcript + " ";
                } else {
                    interim += item[0].transcript;
                }
            }

            if (final) {
                setTranscript((prev) => (prev ? prev + " " + final.trim() : final.trim()));
            }
            setInterimTranscript(interim);
        };

        recognition.onerror = (event) => {
            console.warn("[SpeechRecognition] Error:", event.error);
            if (event.error === "not-allowed" || event.error === "service-not-allowed") {
                setIsListening(false);
            }
        };

        recognition.onend = () => {
            // Auto-restart if we didn't manually stop it and microphone is not muted
            if (!isManuallyStoppedRef.current && !isMicMuted) {
                try {
                    recognition.start();
                } catch {
                    setIsListening(false);
                }
            } else {
                setIsListening(false);
            }
        };

        recognitionRef.current = recognition;

        return () => {
            isManuallyStoppedRef.current = true;
            try {
                recognition.stop();
            } catch {
                // ignore
            }
        };
    }, [isMicMuted]);

    const startListening = useCallback(() => {
        if (!recognitionRef.current || isMicMuted) return;
        isManuallyStoppedRef.current = false;
        try {
            recognitionRef.current.start();
            setIsListening(true);
        } catch (err) {
            // Already started or active
            console.debug("[SpeechRecognition] start call:", err.message);
        }
    }, [isMicMuted]);

    const stopListening = useCallback(() => {
        if (!recognitionRef.current) return;
        isManuallyStoppedRef.current = true;
        try {
            recognitionRef.current.stop();
        } catch {
            // ignore
        }
        setIsListening(false);
        setInterimTranscript("");
    }, []);

    const resetTranscript = useCallback(() => {
        setTranscript("");
        setInterimTranscript("");
    }, []);

    const toggleMicMute = useCallback(() => {
        setIsMicMuted((prev) => {
            const next = !prev;
            if (next) {
                stopListening();
            } else {
                setTimeout(() => startListening(), 100);
            }
            return next;
        });
    }, [stopListening, startListening]);

    return {
        isListening,
        transcript,
        interimTranscript,
        isSupported,
        isMicMuted,
        startListening,
        stopListening,
        resetTranscript,
        setTranscript,
        toggleMicMute,
    };
};
