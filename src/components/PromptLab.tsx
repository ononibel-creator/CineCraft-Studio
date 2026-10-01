import React, { useState } from 'react';
import { PromptTemplate } from '../types';
import { CURATED_PROMPTS } from '../data/curatedPrompts';
import {
  Sparkles,
  Search,
  Filter,
  Copy,
  Check,
  ArrowUpRight,
  Wand2,
  Image as ImageIcon,
  Video as VideoIcon,
} from 'lucide-react';

interface PromptLabProps {
  onLoadTemplate: (template: PromptTemplate) => void;
  onRemixWithGemini: (prompt: string, type: 'image' | 'video') => void;
}

const CATEGORIES = ['All', 'Cinematic', 'Sci-Fi', 'Portrait', 'Nature', 'Animation', 'Architecture'];

export const PromptLab: React.FC<PromptLabProps> = ({ onLoadTemplate, onRemixWithGemini }) => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [typeFilter, setTypeFilter] = useState<'all' | 'image' | 'video'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredPrompts = CURATED_PROMPTS.filter((p) => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesType = typeFilter === 'all' || p.type === typeFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesType && matchesSearch;
  });

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Prompt Matrix & Master Recipes</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Field-tested prompt structures with cinematic lens directives, lighting atmospheres, and camera trajectories.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search prompts, styles, optics..."
              className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500/60"
            />
          </div>
        </div>

        {/* Category & Type Filter Bars */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-5 pt-4 border-t border-zinc-800/80">
          <div className="flex flex-wrap items-center gap-1.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedCategory === cat
                    ? 'bg-zinc-800 text-cyan-300 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-zinc-950/80 p-1 rounded-xl border border-zinc-800/80 text-xs">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                typeFilter === 'all' ? 'bg-zinc-800 text-zinc-100 font-medium' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setTypeFilter('image')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors ${
                typeFilter === 'image' ? 'bg-zinc-800 text-cyan-300 font-medium' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <ImageIcon className="w-3 h-3" />
              <span>Pictures</span>
            </button>
            <button
              onClick={() => setTypeFilter('video')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors ${
                typeFilter === 'video' ? 'bg-zinc-800 text-cyan-300 font-medium' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <VideoIcon className="w-3 h-3" />
              <span>Videos</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Prompts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredPrompts.map((template) => (
          <div
            key={template.id}
            className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-zinc-700 transition-all group"
          >
            <div>
              {/* Visual Thumbnail */}
              <div className="w-full h-44 bg-zinc-950 relative overflow-hidden">
                <img
                  src={template.previewUrl}
                  alt={template.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />

                <div className="absolute top-3 left-3 flex items-center gap-1.5 text-[11px] font-mono">
                  <span className="bg-zinc-950/80 backdrop-blur-md px-2 py-0.5 rounded text-cyan-400 border border-zinc-800">
                    {template.category}
                  </span>
                  <span className="bg-zinc-950/80 backdrop-blur-md px-2 py-0.5 rounded text-zinc-300 border border-zinc-800 flex items-center gap-1">
                    {template.type === 'video' ? <VideoIcon className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                    <span>{template.type}</span>
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="p-4 space-y-3">
                <h3 className="text-sm font-semibold text-zinc-100">{template.title}</h3>

                {/* Prompt text */}
                <p className="text-xs text-zinc-300 leading-relaxed line-clamp-3 bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-800/50">
                  {template.prompt}
                </p>

                {/* Specs */}
                <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-400">
                  <div>
                    <span className="text-zinc-500">Optics:</span> {template.camera}
                  </div>
                  <div>
                    <span className="text-zinc-500">Lighting:</span> {template.lighting}
                  </div>
                  <div>
                    <span className="text-zinc-500">Ratio:</span> {template.aspectRatio}
                  </div>
                  {template.motion && (
                    <div>
                      <span className="text-zinc-500">Motion:</span> {template.motion}
                    </div>
                  )}
                </div>

                {/* Tags (clean text metadata with bullet dividers) */}
                <div className="flex flex-wrap items-center gap-1 text-[11px] text-zinc-500 pt-1">
                  {template.tags.map((tag, i) => (
                    <React.Fragment key={tag}>
                      <span>#{tag}</span>
                      {i < template.tags.length - 1 && <span aria-hidden="true">·</span>}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-4 pt-0 flex items-center justify-between gap-2 border-t border-zinc-800/60 mt-3 pt-3">
              <button
                onClick={() => handleCopy(template.id, template.prompt)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-xs text-zinc-300 transition-colors"
              >
                {copiedId === template.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedId === template.id ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                onClick={() => onRemixWithGemini(template.prompt, template.type)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-xs text-zinc-300 transition-colors"
                title="Remix concept with Gemini"
              >
                <Wand2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Remix</span>
              </button>

              <button
                onClick={() => onLoadTemplate(template)}
                className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800/60 text-xs font-medium text-cyan-300 transition-colors"
              >
                <span>Load in Studio</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
