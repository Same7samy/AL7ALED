
import React, { useState, useRef, useEffect, useCallback } from 'react';

interface CameraCapturePageProps {
    onCapture: (dataUrl: string) => void;
    onClose: () => void;
}

const CameraCapturePage: React.FC<CameraCapturePageProps> = ({ onCapture, onClose }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    
    const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

    const stopStream = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    }, [stream]);

    const startStream = useCallback(async (deviceId: string) => {
        stopStream();
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { deviceId: { exact: deviceId } }
            });
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                setStream(mediaStream);
            }
        } catch (err: any) {
            console.error("Camera access error:", err);
            setError(`لا يمكن الوصول للكاميرا. يرجى التأكد من منح صلاحيات الكاميرا. (${err.name})`);
        }
    }, [stopStream]);

    useEffect(() => {
        const initCamera = async () => {
            try {
                const devices = await navigator.mediaDevices.enumerateDevices();
                const videoInputDevices = devices.filter(d => d.kind === 'videoinput');
                if (videoInputDevices.length === 0) {
                    setError("لم يتم العثور على كاميرا.");
                    return;
                }
                setVideoDevices(videoInputDevices);
                // Prefer back camera
                const backCamera = videoInputDevices.find(d => d.label.toLowerCase().includes('back')) || videoInputDevices[0];
                setSelectedDeviceId(backCamera.deviceId);
            } catch (err) {
                setError("خطأ في الوصول لأجهزة الكاميرا.");
            }
        };

        initCamera();

        // Cleanup on unmount
        return () => {
            stopStream();
        };
    }, [stopStream]);

    useEffect(() => {
        if (selectedDeviceId && !capturedImage) {
            startStream(selectedDeviceId);
        }
    }, [selectedDeviceId, capturedImage, startStream]);

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            const context = canvas.getContext('2d');
            context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            
            const dataUrl = canvas.toDataURL('image/jpeg');
            setCapturedImage(dataUrl);
            stopStream();
        }
    };

    const handleRetake = () => {
        setCapturedImage(null);
    };

    const handleUsePhoto = () => {
        if (capturedImage) {
            onCapture(capturedImage);
        }
    };
    
    const switchCamera = () => {
        if (videoDevices.length < 2) return;
        const currentIndex = videoDevices.findIndex(device => device.deviceId === selectedDeviceId);
        const nextIndex = (currentIndex + 1) % videoDevices.length;
        setSelectedDeviceId(videoDevices[nextIndex].deviceId);
    };

    return (
        <div className="fixed inset-0 bg-black z-30 flex flex-col items-center justify-center text-white">
            <canvas ref={canvasRef} className="hidden"></canvas>
            
            {error && (
                <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-center shadow-lg" role="alert">
                    <strong className="font-bold">حدث خطأ!</strong>
                    <span className="block sm:inline"> {error}</span>
                    <button onClick={onClose} className="mt-2 bg-red-500 text-white px-3 py-1 rounded">إغلاق</button>
                </div>
            )}
            
            {capturedImage ? (
                <img src={capturedImage} alt="Captured" className="w-full h-full object-contain" />
            ) : (
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover"></video>
            )}

            {/* Controls */}
            <div className="absolute top-3 right-3 left-3 flex justify-between items-center pointer-events-auto">
              <button onClick={onClose} className="bg-black bg-opacity-50 rounded-full w-12 h-12 flex items-center justify-center text-xl shadow-lg">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            
            {capturedImage ? (
                <div className="absolute bottom-5 right-5 left-5 flex justify-center items-center gap-4 pointer-events-auto">
                    <button onClick={handleRetake} className="bg-black bg-opacity-50 rounded-full w-16 h-16 flex items-center justify-center text-2xl shadow-lg">
                        <i className="fa-solid fa-rotate-right"></i>
                    </button>
                    <button onClick={handleUsePhoto} className="bg-green-600 rounded-full w-16 h-16 flex items-center justify-center text-2xl shadow-lg">
                        <i className="fa-solid fa-check"></i>
                    </button>
                </div>
            ) : (
                <div className="absolute bottom-5 right-5 left-5 flex justify-center items-center gap-4 pointer-events-auto">
                     {videoDevices.length > 1 ? (
                        <button onClick={switchCamera} className="bg-black bg-opacity-50 rounded-full w-14 h-14 flex items-center justify-center text-2xl shadow-lg" aria-label="تبديل الكاميرا">
                            <i className="fa-solid fa-camera-rotate"></i>
                        </button>
                    ) : <div className="w-14 h-14" />}
                    
                    <button onClick={handleCapture} className="bg-white rounded-full w-20 h-20 flex items-center justify-center shadow-lg border-4 border-slate-400">
                    </button>
                    
                    <div className="w-14 h-14" />
                </div>
            )}
        </div>
    );
};

export default CameraCapturePage;
