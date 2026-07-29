"use client";

import { useState, useEffect, useRef } from "react";
import { Eye, X, RefreshCw, Loader as Loader2, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface LivePreviewProps {
  sessionId: string;
  filePath: string | null;
  onClose: () => void;
}

export default function LivePreview({ sessionId, filePath, onClose }: LivePreviewProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [key, setKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!filePath) {
      setPreviewUrl(null);
      return;
    }

    const ext = filePath.slice(filePath.lastIndexOf(".")).toLowerCase();
    if (![".html", ".htm"].includes(ext)) {
      setError("Canlı önizleme yalnızca HTML dosyaları için kullanılabilir.");
      setPreviewUrl(null);
      return;
    }

    setError(null);
    setLoading(true);
    const url = `/api/preview?sessionId=${sessionId}&file=${encodeURIComponent(filePath)}`;
    setPreviewUrl(url);
  }, [filePath, sessionId, key]);

  return (
    <AnimatePresence>
      {filePath && (
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 24 }}
          transition={{ duration: 0.2 }}
          className="glass absolute inset-0 z-30 flex flex-col"
        >
          <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
            <div className="flex items-center gap-2">
              <Eye size={14} className="text-plasma-soft" />
              <span className="font-mono text-xs text-chalk">{filePath}</span>
              <span className="rounded-full bg-signal/15 px-2 py-0.5 font-mono text-[10px] text-signal">
                CANLI
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setKey((k) => k + 1)}
                title="Yenile"
                className="text-mist hover:text-chalk"
              >
                <RefreshCw size={14} />
              </button>
              {previewUrl && (
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Yeni sekmede aç"
                  className="text-mist hover:text-chalk"
                >
                  <ExternalLink size={14} />
                </a>
              )}
              <button onClick={onClose} className="text-mist hover:text-chalk">
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="relative flex-1 bg-white">
            {error ? (
              <div className="flex h-full items-center justify-center text-sm text-signal">
                {error}
              </div>
            ) : loading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 size={20} className="animate-spin text-mist" />
              </div>
            ) : previewUrl ? (
              <iframe
                ref={iframeRef}
                key={key}
                src={previewUrl}
                title="Live Preview"
                sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
                className="h-full w-full border-0"
                onLoad={() => setLoading(false)}
                onError={() => {
                  setLoading(false);
                  setError("Önizleme yüklenemedi.");
                }}
              />
            ) : null}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
