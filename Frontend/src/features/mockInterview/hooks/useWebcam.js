import { useState, useEffect, useRef, useCallback } from "react";

export const useWebcam = () => {
    const videoRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [isCameraOn, setIsCameraOn] = useState(true);
    const [hasPermission, setHasPermission] = useState(null);
    const [error, setError] = useState(null);

    const startCamera = useCallback(async () => {
        try {
            setError(null);
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: "user",
                },
                audio: false,
            });

            setStream(mediaStream);
            setHasPermission(true);
            setIsCameraOn(true);

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.warn("[useWebcam] Camera access error:", err.message);
            setError(err.name === "NotAllowedError" ? "Camera permission denied." : "Could not start camera.");
            setHasPermission(false);
            setIsCameraOn(false);
        }
    }, []);

    const stopCamera = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach((track) => track.stop());
            setStream(null);
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setIsCameraOn(false);
    }, [stream]);

    const toggleCamera = useCallback(() => {
        if (isCameraOn) {
            if (stream) {
                stream.getVideoTracks().forEach((t) => (t.enabled = false));
            }
            setIsCameraOn(false);
        } else {
            if (stream) {
                stream.getVideoTracks().forEach((t) => (t.enabled = true));
                setIsCameraOn(true);
            } else {
                startCamera();
            }
        }
    }, [isCameraOn, stream, startCamera]);

    useEffect(() => {
        return () => {
            if (stream) {
                stream.getTracks().forEach((track) => track.stop());
            }
        };
    }, [stream]);

    return {
        videoRef,
        stream,
        isCameraOn,
        hasPermission,
        error,
        startCamera,
        stopCamera,
        toggleCamera,
    };
};
