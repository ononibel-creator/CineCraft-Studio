import React, { useState } from 'react';
import { GeneratedMedia } from '../types';
import { downloadImageAsPNG, downloadVideoAsMP4 } from '../utils/downloadHelper';
import { X, Download, Copy, Check, Video, Image as ImageIcon, RefreshCw } from 'lucide-react';

interface MediaModalProps {
  media: GeneratedMedia | null;
  onClose: () => void;
  onLoadInStudio: (media: GeneratedMedia) => void;
}

export const MediaModal: React.FC<MediaModalProps> = ({ media, onClose, onLoadInStudio }) => {
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!media) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(media.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    if (!media.url) return;
    setIsDownloading(true);
    try {
      if (media.type === 'video') {
        await downloadVideoAsMP4(media.url, media.prompt, media.platform);
      } else {
        await downloadImageAsPNG(media.url, media.prompt);
      }
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2500);
    } catch (err) {
      console.error('Download error in modal:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Modal Top Bar */}
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-zinc-200">
              {media.type === 'video' ? 'Video Scene' : 'Generated Picture'}
            </span>
            <span aria-hidden="true" className="text-zinc-600">·</span>
            <span className="font-mono text-zinc-400">{media.aspectRatio}</span>
            {media.resolution && (
              <>
                <span aria-hidden="true" className="text-zinc-600">·</span>
                <span className="font-mono text-zinc-400">{media.resolution}</span>
              </>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Media Player / Image container */}
          <div className="w-full max-h-[55vh] bg-zinc-950 rounded-xl overflow-hidden flex items-center justify-center border border-zinc-800">
            {media.type === 'video' ? (
              <video
                src={media.url}
                controls
                autoPlay
                loop
                playsInline
                className="max-h-[55vh] w-auto mx-auto object-contain"
              />
            ) : (
              <img
                src={media.url}
                alt={media.prompt}
                className="max-h-[55vh] w-auto mx-auto object-contain"
              />
            )}
          </div>

          {/* Prompt & Metadata Details */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Text Prompt Recipe
              </span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Prompt'}</span>
              </button>
            </div>

            <p className="text-xs text-zinc-200 bg-zinc-950 p-3 rounded-xl border border-zinc-800/80 leading-relaxed font-sans">
              {media.prompt}
            </p>

            {/* Parameter Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-zinc-400">
              {media.style && (
                <div className="bg-zinc-950/60 p-2 rounded-lg border border-zinc-800/50">
                  <span className="text-zinc-500 block">Style:</span>
                  <span className="text-zinc-200 truncate block">{media.style}</span>
                </div>
              )}
              {media.lighting && (
                <div className="bg-zinc-950/60 p-2 rounded-lg border border-zinc-800/50">
                  <span className="text-zinc-500 block">Lighting:</span>
                  <span className="text-zinc-200 truncate block">{media.lighting}</span>
                </div>
              )}
              {media.camera && (
                <div className="bg-zinc-950/60 p-2 rounded-lg border border-zinc-800/50">
                  <span className="text-zinc-500 block">Camera:</span>
                  <span className="text-zinc-200 truncate block">{media.camera}</span>
                </div>
              )}
              {media.motion && (
                <div className="bg-zinc-950/60 p-2 rounded-lg border border-zinc-800/50">
                  <span className="text-zinc-500 block">Motion:</span>
                  <span className="text-zinc-200 truncate block">{media.motion}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="px-5 py-3 border-t border-zinc-800 flex items-center justify-between gap-3 bg-zinc-950/50">
          <button
            onClick={() => {
              onLoadInStudio(media);
              onClose();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-xs font-medium text-zinc-200 transition-colors"
          >
            {media.type === 'video' ? <Video className="w-3.5 h-3.5 text-cyan-400" /> : <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />}
            <span>Edit in {media.type === 'video' ? 'Video Studio' : 'Picture Studio'}</span>
          </button>

          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 hover:from-emerald-500/30 hover:to-cyan-500/30 border border-emerald-500/50 text-xs font-medium text-emerald-300 transition-all shadow-sm active:scale-95 disabled:opacity-50"
            title={`Download high-resolution ${media.type === 'video' ? 'MP4 file' : 'PNG image'}`}
          >
            {isDownloading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : downloadSuccess ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>
              {isDownloading
                ? `Saving ${media.type === 'video' ? 'MP4' : 'PNG'}...`
                : downloadSuccess
                ? `Saved ${media.type === 'video' ? 'MP4' : 'PNG'}!`
                : `Download High-Res ${media.type === 'video' ? 'MP4' : 'PNG'}`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
