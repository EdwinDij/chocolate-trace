import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";

interface BarcodeScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({
  onScan,
  onClose,
}: BarcodeScannerProps) {
  const [debugMsg, setDebugMsg] = useState("⌛ Initialisation...");
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);


  useEffect(() => {
    const constraints: MediaStreamConstraints = {
      video: {
        facingMode: "environment",
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    };

    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((stream) => {
        videoRef.current!.srcObject = stream;
        videoRef.current!.play();

        const reader = new BrowserMultiFormatReader();
        readerRef.current = reader;

        reader
          .decodeFromStream(stream, videoRef.current!, (result) => {
            if (result) {
              onScan(result.getText());
              stream.getTracks().forEach((t) => t.stop());
            }
          })
          .then((controls) => {
            controlsRef.current = controls;
          });
      })
      .catch((err) => {
        console.error("Erreur caméra:", err);
      });

    return () => {
      controlsRef.current?.stop();
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center">
      <div className="relative w-full max-w-sm mx-4">
        <div className="relative rounded-2xl overflow-hidden">
          <video ref={videoRef} className="w-full rounded-2xl" />
          {/* Cadre de scan */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-56 h-32 border-2 border-amber-400 rounded-lg relative">
              <div className="absolute top-0 left-0 w-5 h-5 border-t-4 border-l-4 border-amber-400 rounded-tl" />
              <div className="absolute top-0 right-0 w-5 h-5 border-t-4 border-r-4 border-amber-400 rounded-tr" />
              <div className="absolute bottom-0 left-0 w-5 h-5 border-b-4 border-l-4 border-amber-400 rounded-bl" />
              <div className="absolute bottom-0 right-0 w-5 h-5 border-b-4 border-r-4 border-amber-400 rounded-br" />
            </div>
          </div>
        </div>
        <p className="text-white/70 text-xs text-center mt-3">
          Pointez vers le code-barres de la boîte
        </p>
        <p className="text-white/50 text-xs text-center mt-1">{debugMsg}</p>
        <button
          onClick={onClose}
          className="mt-4 w-full bg-white/10 text-white border border-white/20 py-3 rounded-xl text-sm font-medium"
        >
          ✕ Annuler
        </button>
      </div>
    </div>
  );
}
