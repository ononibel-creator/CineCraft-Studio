import React from 'react';
import { StudioMode } from '../types';
import { Image, Video, Clapperboard, Sparkles, FolderArchive, Layers } from 'lucide-react';

interface HeaderProps {
  currentMode: StudioMode;
  onSelectMode: (mode: StudioMode) => void;
  historyCount: number;
}

export const Header: React.FC<HeaderProps> = ({ currentMode, onSelectMode, historyCount }) => {
  return (
    <header className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-cyan-500 via-indigo-500 to-fuchsia-500 p-0.5 flex items-center justify-center shadow-lg shadow-cyan-500/10">
            <div className="w-full h-full bg-zinc-950 rounded-[7px] flex items-center justify-center">
              <Layers className="w-4 h-4 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-zinc-100 text-sm tracking-tight">CineCraft Studio</span>
              <span className="text-[10px] uppercase font-mono tracking-wider text-cyan-400 bg-cyan-950/60 border border-cyan-800/50 px-1.5 py-0.5 rounded">
                v3.1
              </span>
            </div>
            <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
              <span>Veo 3</span>
              <span aria-hidden="true" className="text-zinc-600">·</span>
              <span>SeaDance 2.5</span>
              <span aria-hidden="true" className="text-zinc-600">·</span>
              <span>Runway</span>
              <span aria-hidden="true" className="text-zinc-600">·</span>
              <span>Sora 2</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs (Functional interactive segmented control) */}
        <nav className="flex items-center gap-1 bg-zinc-900/90 border border-zinc-800/80 p-1 rounded-xl">
          <button
            onClick={() => onSelectMode('image')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              currentMode === 'image'
                ? 'bg-zinc-800 text-cyan-300 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Image className="w-3.5 h-3.5" />
            <span>Picture Studio</span>
          </button>

          <button
            onClick={() => onSelectMode('video')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              currentMode === 'video'
                ? 'bg-zinc-800 text-cyan-300 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Video Studio</span>
          </button>

          <button
            onClick={() => onSelectMode('storyboard')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              currentMode === 'storyboard'
                ? 'bg-zinc-800 text-cyan-300 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Clapperboard className="w-3.5 h-3.5" />
            <span>Storyboard Director</span>
          </button>

          <button
            onClick={() => onSelectMode('promptlab')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              currentMode === 'promptlab'
                ? 'bg-zinc-800 text-cyan-300 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Prompt Lab</span>
          </button>

          <button
            onClick={() => onSelectMode('gallery')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              currentMode === 'gallery'
                ? 'bg-zinc-800 text-cyan-300 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <FolderArchive className="w-3.5 h-3.5" />
            <span>Gallery</span>
            {historyCount > 0 && (
              <span className="text-[10px] font-mono px-1 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                {historyCount}
              </span>
            )}
          </button>
        </nav>

        {/* Engine status indicator */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs bg-emerald-950/40 border border-emerald-800/60 px-3 py-1.5 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-300 font-mono text-[11px] font-medium">100% Free AI Engine · Unlimited</span>
          </div>
        </div>
      </div>
    </header>
  );
};
