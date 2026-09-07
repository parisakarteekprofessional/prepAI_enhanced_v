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
            // Reuse active stream if tracks are live
            if (stream && stream.active && stream.getVideoTracks().some((t) => t.readyState === "live")) {
                stream.getVideoTracks().forEach((t) => (t.enabled = true));
                setIsCameraOn(true);
                if (videoRef.current) {
                    if (videoRef.current.srcObject !== stream) {
                        videoRef.current.srcObject = stream;
                    }
                    videoRef.current.play().catch(() => {});
                }
                return stream;
            }

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
                videoRef.current.play().catch(() => {});
            }
            return mediaStream;
        } catch (err) {
            console.warn("[useWebcam] Camera access error:", err.message);
            setError(err.name === "NotAllowedError" ? "Camera permission denied." : "Could not start camera.");
            setHasPermission(false);
            setIsCameraOn(false);
        }
    }, [stream]);

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
            if (stream && stream.getVideoTracks().length > 0) {
                stream.getVideoTracks().forEach((t) => (t.enabled = true));
                setIsCameraOn(true);
                if (videoRef.current) {
                    if (videoRef.current.srcObject !== stream) {
                        videoRef.current.srcObject = stream;
                    }
                    videoRef.current.play().catch(() => {});
                }
            } else {
                startCamera();
            }
        }
    }, [isCameraOn, stream, startCamera]);

    // Callback ref that attaches stream and initiates playback immediately when video DOM node mounts
    const attachVideoRef = useCallback((node) => {
        videoRef.current = node;
        if (node && stream) {
            if (node.srcObject !== stream) {
                node.srcObject = stream;
            }
            node.play().catch((err) => {
                console.warn("[useWebcam] attachVideoRef play error:", err);
            });
        }
    }, [stream]);

    // Keep video element synchronized with stream
    useEffect(() => {
        if (videoRef.current && stream) {
            if (videoRef.current.srcObject !== stream) {
                videoRef.current.srcObject = stream;
            }
            videoRef.current.play().catch(() => {});
        }
    }, [stream]);

    useEffect(() => {
        return () => {
            if (stream) {
                stream.getTracks().forEach((track) => track.stop());
            }
        };
    }, [stream]);

    return {
        videoRef,
        attachVideoRef,
        stream,
        isCameraOn,
        hasPermission,
        error,
        startCamera,
        stopCamera,
        toggleCamera,
    };
};
