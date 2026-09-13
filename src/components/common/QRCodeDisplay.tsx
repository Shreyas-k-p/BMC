import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Copy, Check, Download, ExternalLink } from 'lucide-react';

interface QRCodeDisplayProps {
  url: string;
  joinCode: string;
  size?: number;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ url, joinCode, size = 260 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (canvasRef.current && url) {
      QRCode.toCanvas(canvasRef.current, url, {
        width: size,
        margin: 2,
        color: {
          dark: '#020617',
          light: '#ffffff',
        },
      }).catch(err => {
        console.error('QR code generation error:', err);
      });
    }
  }, [url, size]);

  const handleCopy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      prompt('Copy Join Link:', url);
    });
  };

  const handleDownload = () => {
    if (canvasRef.current) {
      const link = document.createElement('a');
      link.download = `BMC-LIVE-${joinCode}-QR.png`;
      link.href = canvasRef.current.toDataURL();
      link.click();
    }
  };

  return (
    <div className="flex flex-col items-center bg-slate-900/80 border border-sky-500/30 rounded-3xl p-6 shadow-2xl backdrop-blur-xl max-w-sm w-full">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider mb-4">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        Scan to Join Live
      </div>

      <div className="p-3 bg-white rounded-2xl shadow-xl border-2 border-white/20">
        <canvas ref={canvasRef} className="rounded-xl block" />
      </div>

      <div className="mt-4 text-center">
        <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">SESSION CODE</div>
        <div className="text-3xl font-display font-black text-sky-400 tracking-wider mt-0.5">
          {joinCode}
        </div>
      </div>

      <div className="w-full mt-4 p-2 bg-slate-950/60 rounded-xl border border-white/10 flex items-center justify-between text-xs text-slate-300 font-mono">
        <span className="truncate mr-2 text-sky-300">{url}</span>
        <button
          onClick={handleCopy}
          className="p-1.5 hover:bg-white/10 rounded-lg transition-colors flex items-center gap-1 text-slate-200 flex-shrink-0"
          title="Copy Join Link"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>

      <div className="flex items-center gap-2 mt-4 w-full">
        <button
          onClick={handleCopy}
          className="flex-1 py-2 px-3 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-sky-300 text-xs font-bold transition flex items-center justify-center gap-1.5"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Link Copied!' : 'Copy Join Link'}
        </button>
        <button
          onClick={handleDownload}
          className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-300 text-xs font-bold transition flex items-center gap-1"
          title="Download QR Image"
        >
          <Download className="w-3.5 h-3.5" />
        </button>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-300 text-xs font-bold transition flex items-center gap-1"
          title="Open Mobile Tab"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
};
