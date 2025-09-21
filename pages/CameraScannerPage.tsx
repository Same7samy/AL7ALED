
import React, { useRef, useEffect, useState, useCallback } from 'react';

declare const ZXing: any;

interface CameraScannerPageProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

const CameraScannerPage: React.FC<CameraScannerPageProps> = ({ onScan, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<any>(null);
  
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startScanner = useCallback(async (deviceId: string) => {
    if (!codeReaderRef.current || !videoRef.current) return;
    
    codeReaderRef.current.reset();
    setTorchOn(false);
    setTorchSupported(false);

    try {
      const controls = await codeReaderRef.current.decodeFromVideoDevice(deviceId, videoRef.current, (result: any, err: any) => {
        if (result) {
          navigator.vibrate(100);
          onScan(result.getText());
        }
        if (err && !(err instanceof ZXing.NotFoundException)) {
            console.error(err);
        }
      });
      
      const stream = videoRef.current.srcObject as MediaStream;
      const track = stream.getVideoTracks()[0];
// FIX: Cast capabilities to 'any' to access the non-standard 'torch' property and avoid a TypeScript error.
      const capabilities = track.getCapabilities() as any;
      
      if (capabilities.torch) {
        setTorchSupported(true);
      }
    } catch (err: any) {
        console.error("Scanner start error:", err);
        setError(`خطأ في تشغيل الكاميرا. يرجى التأكد من منح صلاحيات الكاميرا للمتصفح. (${err.name})`);
    }
  }, [onScan]);

  useEffect(() => {
    if (typeof ZXing === 'undefined') {
        setError("مكتبة المسح الضوئي غير متاحة.");
        return;
    }
    
    codeReaderRef.current = new ZXing.BrowserMultiFormatReader();

    const initScanner = async () => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoInputDevices = devices.filter(device => device.kind === 'videoinput');
            if (videoInputDevices.length === 0) {
                setError("لم يتم العثور على كاميرا.");
                return;
            }
            setVideoDevices(videoInputDevices);
            
            // Prefer back camera
            const backCamera = videoInputDevices.find(device => device.label.toLowerCase().includes('back')) || videoInputDevices[0];
            setSelectedDeviceId(backCamera.deviceId);
        } catch (err) {
            setError("لا يمكن الوصول للكاميرا. يرجى منح الصلاحيات اللازمة.");
        }
    };
    initScanner();

    return () => {
        if (codeReaderRef.current) {
            codeReaderRef.current.reset();
        }
    };
  }, []);

  useEffect(() => {
    if (selectedDeviceId) {
        startScanner(selectedDeviceId);
    }
  }, [selectedDeviceId, startScanner]);

  const toggleTorch = async () => {
      if (!torchSupported || !videoRef.current || !videoRef.current.srcObject) return;
      const stream = videoRef.current.srcObject as MediaStream;
      const track = stream.getVideoTracks()[0];
      try {
// FIX: Cast the constraint object to 'any' to apply the non-standard 'torch' constraint and avoid a TypeScript error.
          await track.applyConstraints({
              advanced: [{ torch: !torchOn } as any]
          });
          setTorchOn(!torchOn);
      } catch (err) {
          console.error("Torch error:", err);
      }
  };

  const switchCamera = () => {
    if (videoDevices.length < 2) return;
    const currentIndex = videoDevices.findIndex(device => device.deviceId === selectedDeviceId);
    const nextIndex = (currentIndex + 1) % videoDevices.length;
    setSelectedDeviceId(videoDevices[nextIndex].deviceId);
  };

  return (
    <div className="fixed inset-0 bg-black z-30 flex flex-col items-center justify-center">
      <video ref={videoRef} className="w-full h-full object-cover"></video>
      
      <div className="absolute inset-0 bg-black bg-opacity-20 flex flex-col items-center justify-center pointer-events-none">
        <div className="w-[80%] max-w-xs aspect-video border-4 border-dashed border-white opacity-75 rounded-2xl shadow-lg"></div>
        <p className="text-white text-lg mt-4 font-semibold bg-black bg-opacity-50 px-4 py-2 rounded-full">
            وجه الكاميرا نحو الباركود
        </p>
      </div>

      {error && (
          <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-center shadow-lg" role="alert">
              <strong className="font-bold">حدث خطأ!</strong>
              <span className="block sm:inline"> {error}</span>
          </div>
      )}

      <div className="absolute top-3 right-3 left-3 flex justify-between items-center pointer-events-auto">
        <button onClick={onClose} className="bg-black bg-opacity-50 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl shadow-lg">
          <i className="fa-solid fa-xmark"></i>
        </button>
      </div>
      
      <div className="absolute bottom-5 right-5 left-5 flex justify-center items-center gap-4 pointer-events-auto">
          {videoDevices.length > 1 && (
            <button onClick={switchCamera} className="bg-black bg-opacity-50 text-white rounded-full w-14 h-14 flex items-center justify-center text-2xl shadow-lg" aria-label="تبديل الكاميرا">
              <i className="fa-solid fa-camera-rotate"></i>
            </button>
          )}
           {torchSupported && (
            <button onClick={toggleTorch} className={`rounded-full w-14 h-14 flex items-center justify-center text-2xl shadow-lg transition-colors ${torchOn ? 'bg-amber-400 text-black' : 'bg-black bg-opacity-50 text-white'}`} aria-label="تشغيل الفلاش">
              <i className="fa-solid fa-bolt"></i>
            </button>
          )}
      </div>
    </div>
  );
};

export default CameraScannerPage;
