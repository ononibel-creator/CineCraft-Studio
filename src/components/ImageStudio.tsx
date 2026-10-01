import React, { useState } from 'react';
import { AspectRatio, GeneratedMedia, PromptEnhancement } from '../types';
import { downloadImageAsPNG, downloadImageAsJPEG } from '../utils/downloadHelper';
import {
  Wand2,
  Sparkles,
  Download,
  Copy,
  Check,
  Video,
  Eye,
  SlidersHorizontal,
  RefreshCw,
  AlertCircle,
  Maximize2,
  Info,
  FileImage,
} from 'lucide-react';

interface ImageStudioProps {
  onMediaGenerated: (media: GeneratedMedia) => void;
  onSendToVideo: (prompt: string, imageUrl?: string) => void;
  activeMedia?: GeneratedMedia;
}

const STYLE_PRESETS = [
  'Natural / Default',
  'Cinematic Photorealism',
  'Cyberpunk Neo-Tokyo',
  'Studio Fashion Portrait',
  'Sci-Fi Concept Art',
  '3D Octane Render',
  'Anime Makoto Shinkai',
  'Minimalist Architecture',
];

const LIGHTING_PRESETS = [
  'Natural Daylight',
  'Golden Hour Warmth',
  'Volumetric Fog',
  'Studio Softbox Rim',
  'Cyberpunk Neon Glow',
  'Moody Noir Shadows',
  'Crisp Morning Sun',
];

const CAMERA_PRESETS = [
  'Standard Angle',
  '35mm Cine Lens',
  '85mm Portrait Bokeh',
  'Macro 100mm',
  'Wide 24mm Drone',
  'Telephoto 200mm',
];

const ASPECT_RATIOS: { value: AspectRatio; label: string; desc: string; iconClass: string }[] = [
  { value: '1:1', label: '1:1', desc: 'Square', iconClass: 'w-4 h-4' },
  { value: '16:9', label: '16:9', desc: 'Cinema', iconClass: 'w-6 h-3.5' },
  { value: '9:16', label: '9:16', desc: 'Mobile', iconClass: 'w-3.5 h-6' },
  { value: '4:3', label: '4:3', desc: 'Classic', iconClass: 'w-5 h-4' },
  { value: '3:4', label: '3:4', desc: 'Editorial', iconClass: 'w-4 h-5' },
];

const QUICK_TOKENS = [
  '+ 8k raw photo',
  '+ 35mm anamorphic',
  '+ volumetric rim light',
  '+ micro-details',
  '+ high dynamic range',
  '+ subsurface scattering',
];

export const ImageStudio: React.FC<ImageStudioProps> = ({
  onMediaGenerated,
  onSendToVideo,
  activeMedia,
}) => {
  const [prompt, setPrompt] = useState(
    activeMedia?.prompt ||
      'Wide cinematic 35mm anamorphic portrait of a solitary wanderer in weathered linen traversing colossal orange sand dunes at twilight, glowing wind-blown sand particles, warm amber rim lighting.'
  );
  const [negativePrompt, setNegativePrompt] = useState(
    activeMedia?.negativePrompt || 'blurry, low quality, oversaturated, deformed hands, plastic skin'
  );
  const [showNegative, setShowNegative] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(activeMedia?.aspectRatio || '16:9');
  const [style, setStyle] = useState<string>(activeMedia?.style || 'Cinematic Photorealism');
  const [lighting, setLighting] = useState<string>(activeMedia?.lighting || 'Golden Hour Warmth');
  const [camera, setCamera] = useState<string>(activeMedia?.camera || '35mm Cine Lens');
  const [engine, setEngine] = useState<'free' | 'gemini'>('free');

  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Active display image
  const [currentImage, setCurrentImage] = useState<GeneratedMedia | null>(
    activeMedia?.type === 'image'
      ? activeMedia
      : {
          id: 'initial-preview',
          type: 'image',
          prompt:
            'Wide cinematic 35mm anamorphic portrait of a solitary wanderer in weathered linen traversing colossal orange sand dunes at twilight, glowing wind-blown sand particles, warm amber rim lighting.',
          url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1400&q=85',
          aspectRatio: '16:9',
          style: 'Cinematic Photorealism',
          lighting: 'Golden Hour Warmth',
          camera: '35mm Cine Lens',
          timestamp: Date.now(),
          status: 'ready',
        }
  );

  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) return;
    setIsEnhancing(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, type: 'image', tone: 'photorealistic cinematic' }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        const enhanced: PromptEnhancement = data.data;
        setPrompt(enhanced.enhancedPrompt);
        if (enhanced.negativePrompt) {
          setNegativePrompt(enhanced.negativePrompt);
          setShowNegative(true);
        }
      } else {
        setErrorMessage(data.error || 'Failed to enhance prompt');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error communicating with AI enhancer');
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          negativePrompt: showNegative ? negativePrompt : undefined,
          aspectRatio,
          style,
          lighting,
          camera,
          engine,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate image');
      }

      if (data.fallbackNote) {
        setNotification(data.fallbackNote);
      } else {
        setNotification(null);
      }

      const newMedia: GeneratedMedia = {
        id: 'img-' + Date.now(),
        type: 'image',
        prompt,
        negativePrompt: showNegative ? negativePrompt : undefined,
        url: data.imageUrl,
        aspectRatio: data.aspectRatio || aspectRatio,
        style,
        lighting,
        camera,
        timestamp: Date.now(),
        status: 'ready',
      };

      setCurrentImage(newMedia);
      onMediaGenerated(newMedia);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Image generation error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const [downloadingFormat, setDownloadingFormat] = useState<'png' | 'jpg' | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleDownloadPNG = async () => {
    if (!currentImage?.url) return;
    setDownloadingFormat('png');
    try {
      await downloadImageAsPNG(currentImage.url, currentImage.prompt);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2500);
    } catch (e) {
      console.error('PNG download error:', e);
    } finally {
      setDownloadingFormat(null);
    }
  };

  const handleDownloadJPEG = async () => {
    if (!currentImage?.url) return;
    setDownloadingFormat('jpg');
    try {
      await downloadImageAsJPEG(currentImage.url, currentImage.prompt);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2500);
    } catch (e) {
      console.error('JPEG download error:', e);
    } finally {
      setDownloadingFormat(null);
    }
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const addToken = (token: string) => {
    if (prompt.includes(token)) return;
    setPrompt((prev) => (prev.trim() ? `${prev.trim()}, ${token}` : token));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Control Panel (5 cols) */}
      <div className="lg:col-span-5 space-y-5 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5">
        {/* Engine Tier Toggle */}
        <div className="p-3 bg-zinc-950/70 border border-zinc-800/80 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
              AI Generation Engine
            </span>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>100% Free Mode</span>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-xs">
            <button
              onClick={() => setEngine('free')}
              className={`py-1.5 px-2 rounded-lg font-medium border text-center transition-all ${
                engine === 'free'
                  ? 'bg-zinc-800 border-emerald-500/80 text-emerald-300 shadow-sm'
                  : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Flux Free AI (Unlimited)
            </button>
            <button
              onClick={() => setEngine('gemini')}
              className={`py-1.5 px-2 rounded-lg font-medium border text-center transition-all ${
                engine === 'gemini'
                  ? 'bg-zinc-800 border-cyan-500/80 text-cyan-300 shadow-sm'
                  : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Google Gemini 3.1
            </button>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
              <span>Text-to-Image Prompt</span>
            </label>
            <button
              onClick={handleEnhancePrompt}
              disabled={isEnhancing || !prompt.trim()}
              className="flex items-center gap-1.5 text-xs font-medium text-cyan-400 hover:text-cyan-300 disabled:opacity-50 transition-colors"
            >
              <Wand2 className={`w-3.5 h-3.5 ${isEnhancing ? 'animate-spin' : ''}`} />
              <span>{isEnhancing ? 'Directing...' : 'Enhance with Gemini'}</span>
            </button>
          </div>

          <div className="relative">
            <textarea
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what you want to see with rich visual details, lighting, and textures..."
              className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl p-3.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/50 transition-all resize-none leading-relaxed"
            />
          </div>

          {/* Quick Token Injectors */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {QUICK_TOKENS.map((token) => (
              <button
                key={token}
                onClick={() => addToken(token)}
                className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-zinc-800/70 hover:bg-zinc-800 text-zinc-400 hover:text-cyan-300 border border-zinc-700/60 transition-colors"
              >
                {token}
              </button>
            ))}
          </div>
        </div>

        {/* Aspect Ratio Selector */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-2">
            Aspect Ratio
          </label>
          <div className="grid grid-cols-5 gap-2">
            {ASPECT_RATIOS.map((item) => (
              <button
                key={item.value}
                onClick={() => setAspectRatio(item.value)}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all ${
                  aspectRatio === item.value
                    ? 'bg-zinc-800/90 border-cyan-500/80 text-cyan-300 shadow-sm'
                    : 'bg-zinc-950/60 border-zinc-800/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                <div className="h-7 flex items-center justify-center">
                  <div className={`border-2 rounded-xs ${item.iconClass} ${aspectRatio === item.value ? 'border-cyan-400' : 'border-zinc-500'}`} />
                </div>
                <span className="text-xs font-medium mt-1">{item.label}</span>
                <span className="text-[10px] text-zinc-500">{item.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Cinematic Parameters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Visual Style</label>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-cyan-500/60"
            >
              {STYLE_PRESETS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Lighting Environment</label>
            <select
              value={lighting}
              onChange={(e) => setLighting(e.target.value)}
              className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-cyan-500/60"
            >
              {LIGHTING_PRESETS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Lens & Camera Optics</label>
            <select
              value={camera}
              onChange={(e) => setCamera(e.target.value)}
              className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-cyan-500/60"
            >
              {CAMERA_PRESETS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Negative Prompt Collapsible */}
        <div>
          <button
            onClick={() => setShowNegative(!showNegative)}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{showNegative ? 'Hide Negative Prompt' : 'Advanced: Add Negative Prompt'}</span>
          </button>
          {showNegative && (
            <div className="mt-2">
              <input
                type="text"
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                placeholder="Elements to avoid (e.g. text, blurry, distortion, waxy skin)"
                className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500/60"
              />
            </div>
          )}
        </div>

        {/* Notification */}
        {notification && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-emerald-300 text-xs flex items-start gap-2.5">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
            <div className="space-y-1">
              <p className="font-medium text-emerald-200">Free AI Notice</p>
              <p className="text-emerald-300/90 leading-relaxed">{notification}</p>
            </div>
          </div>
        )}

        {/* Error notification */}
        {errorMessage && (
          <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <div className="space-y-1">
              <p className="font-medium">Generation Notice</p>
              <p className="text-rose-400/90 leading-relaxed">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Primary Action Button */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
          className="w-full py-3.5 px-4 rounded-xl font-medium text-sm text-zinc-950 bg-gradient-to-r from-emerald-400 via-cyan-400 to-sky-400 hover:opacity-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-[0.99]"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Synthesizing High-Res Picture...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Generate Picture {engine === 'free' ? '(100% Free)' : ''}</span>
            </>
          )}
        </button>
      </div>

      {/* Viewport & Result Canvas (7 cols) */}
      <div className="lg:col-span-7 space-y-4">
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
          {/* Header info */}
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <span className="font-medium text-zinc-200">Studio Canvas</span>
              <span aria-hidden="true">·</span>
              <span>Ratio {currentImage?.aspectRatio || aspectRatio}</span>
              <span aria-hidden="true">·</span>
              <span>{currentImage?.style || style}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyPrompt}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700/80 text-xs text-zinc-300 transition-colors"
                title="Copy prompt"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Prompt'}</span>
              </button>

              {currentImage?.url && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleDownloadPNG}
                    disabled={downloadingFormat !== null}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 hover:from-emerald-500/30 hover:to-cyan-500/30 border border-emerald-500/50 text-emerald-300 text-xs font-medium transition-all shadow-sm active:scale-95 disabled:opacity-50"
                    title="Download as High-Resolution Lossless PNG"
                  >
                    {downloadingFormat === 'png' ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : downloadSuccess ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    <span>{downloadingFormat === 'png' ? 'Saving PNG...' : downloadSuccess ? 'Saved PNG!' : 'Download PNG'}</span>
                  </button>

                  <button
                    onClick={handleDownloadJPEG}
                    disabled={downloadingFormat !== null}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700/60 text-zinc-300 text-xs transition-colors disabled:opacity-50"
                    title="Download as JPEG"
                  >
                    <span>{downloadingFormat === 'jpg' ? 'Saving...' : 'JPG'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Visual Display Container */}
          <div
            className={`w-full rounded-xl bg-zinc-950 flex items-center justify-center relative overflow-hidden border border-zinc-800/60 shadow-2xl transition-all ${
              aspectRatio === '1:1'
                ? 'aspect-square max-h-[540px]'
                : aspectRatio === '16:9'
                ? 'aspect-video max-h-[500px]'
                : aspectRatio === '9:16'
                ? 'aspect-[9/16] max-h-[560px] mx-auto'
                : aspectRatio === '4:3'
                ? 'aspect-[4/3] max-h-[520px]'
                : 'aspect-[3/4] max-h-[540px] mx-auto'
            }`}
          >
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20" />
                  <div className="absolute inset-0 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-zinc-200">Rendering visual matrix</p>
                  <p className="text-xs text-zinc-500">Formulating lighting, textures, and depth maps...</p>
                </div>
              </div>
            ) : currentImage?.url ? (
              <img
                src={currentImage.url}
                alt={currentImage.prompt}
                className="w-full h-full object-cover object-center"
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center text-zinc-500 space-y-2">
                <Eye className="w-8 h-8 opacity-40" />
                <p className="text-xs">Your generated picture will appear here.</p>
              </div>
            )}
          </div>

          {/* Image Details & Remix Actions */}
          {currentImage && (
            <div className="mt-4 pt-4 border-t border-zinc-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="text-zinc-400 line-clamp-1 max-w-md">
                <span className="text-zinc-200 font-medium">Prompt:</span> {currentImage.prompt}
              </div>

              <button
                onClick={() => onSendToVideo(currentImage.prompt, currentImage.url)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800/90 hover:bg-zinc-700 text-cyan-300 font-medium transition-colors shrink-0"
              >
                <Video className="w-3.5 h-3.5" />
                <span>Animate in Video Studio</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
