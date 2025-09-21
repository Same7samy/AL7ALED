
import React, { useRef, useEffect, useState } from 'react';
import AlertDialog from './AlertDialog';

declare const ZXing: any;

interface CameraScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

const CameraScanner: React.FC<CameraScannerProps> = ({ onScan, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<any>(null);
  const [alertInfo, setAlertInfo] = useState<{ title: string; message: string; } | null>(null);

  useEffect(() => {
    if (typeof ZXing === 'undefined') {
      console.error("ZXing library not found!");
      setAlertInfo({ title: "خطأ في المكتبة", message: "مكتبة مسح الباركود غير متاحة."});
      return;
    }
    
    codeReaderRef.current = new ZXing.BrowserMultiFormatReader();
    const codeReader = codeReaderRef.current;
    
    if (videoRef.current) {
        codeReader.decodeFromVideoDevice(undefined, videoRef.current, (result: any, err: any) => {
            if (result) {
                onScan(result.getText());
            }
            if (err && !(err instanceof ZXing.NotFoundException)) {
                console.error(err);
            }
        }).catch((err: any) => {
            console.error(err);
            setAlertInfo({ title: "خطأ في تشغيل الكاميرا", message: `حدث خطأ: ${err.message}. يرجى التحقق من صلاحيات الكاميرا وإعادة المحاولة.`});
        });
    }

    return () => {
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
        codeReaderRef.current = null;
      }
    };
  }, [onScan]);

  const handleClose = () => {
    if (alertInfo) {
      setAlertInfo(null);
    }
    onClose();
  };

  return (
    <>
    <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex flex-col items-center justify-center z-50 p-4">
      <div className="bg-white p-2 rounded-lg shadow-lg relative w-full max-w-md">
        <video ref={videoRef} className="w-full h-auto rounded-md"></video>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-3/4 h-1/3 border-2 border-dashed border-white opacity-75 rounded-lg"></div>
        </div>
        <p className="text-white text-center absolute bottom-2 left-2 right-2 bg-black bg-opacity-50 p-1 rounded-b-lg text-sm">
            وجه الكاميرا نحو الباركود
        </p>
      </div>
      <button onClick={onClose} className="mt-4 bg-slate-200 text-slate-800 px-6 py-2 rounded-md">
        إلغاء
      </button>
    </div>
    {alertInfo && (
        <AlertDialog 
            isOpen={!!alertInfo}
            onClose={handleClose}
            title={alertInfo.title}
            message={alertInfo.message}
        />
    )}
    </>
  );
};

export default CameraScanner;
