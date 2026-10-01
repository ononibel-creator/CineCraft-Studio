import React, { useState } from 'react';
import { GeneratedMedia } from '../types';
import { downloadImageAsPNG, downloadVideoAsMP4 } from '../utils/downloadHelper';
import {
  FolderArchive,
  Image as ImageIcon,
  Video as VideoIcon,
  Search,
  Trash2,
  ExternalLink,
  Download,
  SlidersHorizontal,
  RefreshCw,
  Check,
} from 'lucide-react';

interface HistoryGalleryProps {
  mediaList: GeneratedMedia[];
  onSelectMedia: (media: GeneratedMedia) => void;
  onClearHistory: () => void;
}

export const HistoryGallery: React.FC<HistoryGalleryProps> = ({
  mediaList,
  onSelectMedia,
  onClearHistory,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video'>('all');
  const [search, setSearch] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadSuccessId, setDownloadSuccessId] = useState<string | null>(null);

  const handleDownloadItem = async (e: React.MouseEvent, item: GeneratedMedia) => {
    e.stopPropagation();
    if (!item.url) return;
    setDownloadingId(item.id);
    try {
      if (item.type === 'video') {
        await downloadVideoAsMP4(item.url, item.prompt, item.platform);
      } else {
        await downloadImageAsPNG(item.url, item.prompt);
      }
      setDownloadSuccessId(item.id);
      setTimeout(() => setDownloadSuccessId(null), 2500);
    } catch (err) {
      console.error('Gallery download error:', err);
    } finally {
      setDownloadingId(null);
    }
  };

  const filtered = mediaList.filter((item) => {
    const matchesType = filterType === 'all' || item.type === filterType;
    const matchesSearch =
      !search.trim() ||
      item.prompt.toLowerCase().includes(search.toLowerCase()) ||
      (item.style && item.style.toLowerCase().includes(search.toLowerCase()));
    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-200 flex items-center gap-2">
              <FolderArchive className="w-4 h-4 text-cyan-400" />
              <span>Studio Creations Gallery</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              All generated pictures, videos, and storyboard frames saved in your workspace session.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search history..."
                className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500/60"
              />
            </div>

            {mediaList.length > 0 && (
              <button
                onClick={onClearHistory}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-rose-950/40 hover:text-rose-400 text-xs text-zinc-400 transition-colors"
                title="Clear History"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-zinc-800/80 text-xs">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 rounded-lg transition-colors ${
              filterType === 'all'
                ? 'bg-zinc-800 text-cyan-300 font-medium'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            All Items ({mediaList.length})
          </button>
          <button
            onClick={() => setFilterType('image')}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg transition-colors ${
              filterType === 'image'
                ? 'bg-zinc-800 text-cyan-300 font-medium'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Pictures ({mediaList.filter((m) => m.type === 'image').length})</span>
          </button>
          <button
            onClick={() => setFilterType('video')}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg transition-colors ${
              filterType === 'video'
                ? 'bg-zinc-800 text-cyan-300 font-medium'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <VideoIcon className="w-3.5 h-3.5" />
            <span>Videos ({mediaList.filter((m) => m.type === 'video').length})</span>
          </button>
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-12 text-center space-y-2">
          <FolderArchive className="w-8 h-8 text-zinc-600 mx-auto" />
          <p className="text-sm font-medium text-zinc-300">No creations found</p>
          <p className="text-xs text-zinc-500">
            Generate pictures or videos in the Studio to build your collection.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectMedia(item)}
              className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl overflow-hidden hover:border-zinc-700 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="aspect-video bg-zinc-950 relative overflow-hidden">
                {item.type === 'video' ? (
                  <video
                    src={item.url}
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onMouseOver={(e) => (e.target as HTMLVideoElement).play()}
                    onMouseOut={(e) => (e.target as HTMLVideoElement).pause()}
                  />
                ) : (
                  <img
                    src={item.url}
                    alt={item.prompt}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                )}

                <div className="absolute top-2 left-2 flex items-center gap-1">
                  <span className="bg-zinc-950/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-mono text-cyan-400 border border-zinc-800 flex items-center gap-1">
                    {item.type === 'video' ? <VideoIcon className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                    <span>{item.type}</span>
                  </span>
                  <span className="bg-zinc-950/80 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] font-mono text-zinc-400 border border-zinc-800">
                    {item.aspectRatio}
                  </span>
                </div>

                {/* 1-Click Download Overlay Button */}
                <button
                  onClick={(e) => handleDownloadItem(e, item)}
                  disabled={downloadingId === item.id}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-zinc-950/80 hover:bg-zinc-900 border border-zinc-800/80 text-zinc-300 hover:text-cyan-300 backdrop-blur-md transition-all opacity-80 group-hover:opacity-100 hover:scale-105"
                  title={`Download ${item.type === 'video' ? 'MP4 video' : 'PNG image'}`}
                >
                  {downloadingId === item.id ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                  ) : downloadSuccessId === item.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              <div className="p-3.5 space-y-2">
                <p className="text-xs text-zinc-200 line-clamp-2 leading-relaxed">
                  {item.prompt}
                </p>

                <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-2 border-t border-zinc-800/60">
                  <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleDownloadItem(e, item)}
                      disabled={downloadingId === item.id}
                      className="text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 transition-colors"
                    >
                      <Download className="w-3 h-3" />
                      <span>{downloadingId === item.id ? 'Saving...' : downloadSuccessId === item.id ? 'Saved!' : item.type === 'video' ? 'MP4' : 'PNG'}</span>
                    </button>
                    <span className="text-cyan-400 group-hover:underline flex items-center gap-0.5">
                      <span>Inspect</span>
                      <ExternalLink className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
