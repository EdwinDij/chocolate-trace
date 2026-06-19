import { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  type?: "success" | "error";
  onClose: () => void;
}

export default function Toast({
  message,
  type = "success",
  onClose,
}: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 2500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 
        flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl
        backdrop-blur-sm border animate-fade-in min-w-55 max-w-[320px]
        ${
          type === "success"
            ? "bg-green-800/95 border-green-600/40 text-white"
            : "bg-red-600/95 border-red-400/40 text-white"
        }`}
    >
      {/* Icône */}
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0
        ${type === "success" ? "bg-green-600/60" : "bg-red-500/60"}`}
      >
        <span className="text-sm">{type === "success" ? "✓" : "✕"}</span>
      </div>

      {/* Message */}
      <span className="text-sm font-medium leading-snug flex-1">{message}</span>

      {/* Bouton fermer */}
      <button
        onClick={onClose}
        className="text-white/50 hover:text-white/90 transition-colors text-xs ml-1"
      >
        ✕
      </button>
    </div>
  );
}
