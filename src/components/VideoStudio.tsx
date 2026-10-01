import React, { useState, useRef, useEffect } from 'react';
import { AspectRatio, GeneratedMedia, PromptEnhancement, VideoResolution, VideoPlatformId } from '../types';
import { VIDEO_PLATFORMS } from '../data/videoPlatforms';
import { downloadVideoAsMP4, downloadImageAsPNG } from '../utils/downloadHelper';
import { CameraMotionVisualizer } from './CameraMotionVisualizer';
import {
  Wand2,
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  Download,
  Copy,
  Check,
  Image as ImageIcon,
  Compass,
  Film,
  AlertCircle,
  RefreshCw,
  Gauge,
  Sliders,
  Info,
  Layers,
  Cpu,
  Zap,
} from 'lucide-react';

interface VideoStudioProps {
  onMediaGenerated: (media: GeneratedMedia) => void;
  onSendToImage: (prompt: string) => void;
  initialPrompt?: string;
  initialImageReference?: string;
  activeMedia?: GeneratedMedia;
}

const CAMERA_MOTIONS = [
  'Dynamic Dolly In',
  'Crane Pan Up',
  'Smooth Orbit 360',
  'Tracking Follow Shot',
  'High-Speed FPV Drone',
  'Slow Zoom In',
  'Locked-Off Tripod',
];

const MOTION_DYNAMICS = [
  'Smooth Cinematic (24fps)',
  'Dynamic Action Surge',
  'Fluid Dance Choreography (60fps)',
  'Silky Fabric Flutter',
  'Slow-Motion Fluid (60fps)',
  'Atmospheric Ambient Drift',
  'High-Speed Time-Lapse',
];

export const VideoStudio: React.FC<VideoStudioProps> = ({
  onMediaGenerated,
  onSendToImage,
  initialPrompt,
  initialImageReference,
  activeMedia,
}) => {
  // Selected Video Creation Platform
  const [selectedPlatformId, setSelectedPlatformId] = useState<VideoPlatformId>('seadance25');
  const currentPlatformConfig = VIDEO_PLATFORMS.find((p) => p.id === selectedPlatformId) || VIDEO_PLATFORMS[0];

  const [prompt, setPrompt] = useState(
    initialPrompt ||
      activeMedia?.prompt ||
      'A cybernetic dancer in billowing iridescent silk executing an acrobatic aerial spin across rain-slicked neon rooftops in Neo-Tokyo, fluid body kinematics, dynamic 60fps tracking.'
  );
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(
    activeMedia?.aspectRatio === '9:16' ? '9:16' : '16:9'
  );
  const [resolution, setResolution] = useState<VideoResolution>(
    (activeMedia?.resolution as VideoResolution) || '1080p'
  );
  const [cameraMotion, setCameraMotion] = useState<string>(
    activeMedia?.motion || 'Smooth Orbit 360'
  );
  const [motionDynamic, setMotionDynamic] = useState<string>('Fluid Dance Choreography (60fps)');
  const [duration, setDuration] = useState<number>(activeMedia?.duration || 8);

  // Enhancement details
  const [audioSuggestion, setAudioSuggestion] = useState<string | null>(null);
  const [platformTokens, setPlatformTokens] = useState<string | null>(null);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [generationPhase, setGenerationPhase] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [recipeCopied, setRecipeCopied] = useState(false);

  // Active Video Media
  const [currentVideo, setCurrentVideo] = useState<GeneratedMedia>(
    activeMedia?.type === 'video'
      ? activeMedia
      : {
          id: 'initial-video-sample',
          type: 'video',
          prompt:
            'A cybernetic dancer in billowing iridescent silk executing an acrobatic aerial spin across rain-slicked neon rooftops in Neo-Tokyo, fluid body kinematics, dynamic 60fps tracking.',
          url: '/videos/ambient.mp4',
          thumbnailUrl:
            'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80',
          aspectRatio: '16:9',
          resolution: '1080p',
          platform: 'seadance25',
          platformName: 'SeaDance 2.5',
          motion: 'Smooth Orbit 360',
          duration: 8,
          timestamp: Date.now(),
          status: 'ready',
        }
  );

  // Custom Video Player states
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isLooping, setIsLooping] = useState(true);
  const [showCameraHud, setShowCameraHud] = useState(false);

  useEffect(() => {
    if (initialPrompt) {
      setPrompt(initialPrompt);
    }
  }, [initialPrompt]);

  // Adjust duration default when platform changes
  const handleSelectPlatform = (platformId: VideoPlatformId) => {
    setSelectedPlatformId(platformId);
    const cfg = VIDEO_PLATFORMS.find((p) => p.id === platformId);
    if (cfg) {
      setDuration(Math.min(duration, cfg.maxDuration));
      if (platformId === 'seadance25') {
        setMotionDynamic('Fluid Dance Choreography (60fps)');
      } else if (platformId === 'veo3') {
        setMotionDynamic('Smooth Cinematic (24fps)');
      }
    }
  };

  // Platform Prompt Optimizer using AI
  const handleOptimizeForPlatform = async () => {
    if (!prompt.trim()) return;
    setIsOptimizing(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/optimize-prompt-for-platform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, platformId: selectedPlatformId }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setPrompt(data.data.optimizedPrompt);
        if (data.data.platformSpecificTokens) {
          setPlatformTokens(data.data.platformSpecificTokens);
        }
        if (data.data.suggestedCamera) {
          setCameraMotion(data.data.suggestedCamera);
        }
        if (data.data.suggestedDuration) {
          setDuration(data.data.suggestedDuration);
        }
      } else {
        setErrorMessage(data.error || 'Failed to optimize prompt for this platform');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error communicating with prompt optimizer');
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setErrorMessage(null);
    setNotification(null);
    setProgressPercent(15);
    setGenerationPhase(`Synthesizing motion dynamics on ${currentPlatformConfig.name}...`);

    try {
      const startRes = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          aspectRatio,
          resolution,
          duration,
          motion: `${cameraMotion} (${motionDynamic})`,
          platform: selectedPlatformId,
        }),
      });

      const startData = await startRes.json();

      if (!startRes.ok || !startData.success) {
        throw new Error(startData.error || 'Failed to initialize video generation');
      }

      if (startData.note) {
        setNotification(startData.note);
      }

      // If instant synthesis (SeaDance, Runway, Sora, or Free engine):
      if (startData.videoUrl) {
        setProgressPercent(100);
        setGenerationPhase(`Rendered on ${currentPlatformConfig.name}!`);

        const newMedia: GeneratedMedia = {
          id: 'vid-' + Date.now(),
          type: 'video',
          prompt: startData.prompt || prompt,
          url: startData.videoUrl,
          thumbnailUrl: startData.keyframeUrl,
          aspectRatio,
          resolution,
          platform: selectedPlatformId,
          platformName: currentPlatformConfig.name,
          motion: cameraMotion,
          duration,
          timestamp: Date.now(),
          status: 'ready',
        };

        setCurrentVideo(newMedia);
        onMediaGenerated(newMedia);
        setIsGenerating(false);
        return;
      }

      // If long-running operation (e.g. Veo 3):
      const operationName = startData.operationName;
      setGenerationPhase('Synthesizing temporal coherence & camera vectors...');
      setProgressPercent(35);

      let done = false;
      let pollCount = 0;
      const maxPolls = 60;

      while (!done && pollCount < maxPolls) {
        await new Promise((r) => setTimeout(r, 4000));
        pollCount++;
        const currentPct = Math.min(35 + pollCount * 3, 92);
        setProgressPercent(currentPct);

        if (pollCount === 3) setGenerationPhase('De-noising motion field and calculating optical flow...');
        if (pollCount === 10) setGenerationPhase('Compiling 1080p cinematic stream...');

        const statusRes = await fetch('/api/video-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ operationName }),
        });

        const statusData = await statusRes.json();
        if (statusData.done) {
          done = true;
          break;
        }
      }

      const downloadRes = await fetch('/api/video-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operationName }),
      });

      if (!downloadRes.ok) throw new Error('Failed to retrieve video stream');

      const blob = await downloadRes.blob();
      const videoObjectUrl = URL.createObjectURL(blob);

      const newMedia: GeneratedMedia = {
        id: 'vid-' + Date.now(),
        type: 'video',
        prompt,
        url: videoObjectUrl,
        aspectRatio,
        resolution,
        platform: selectedPlatformId,
        platformName: currentPlatformConfig.name,
        motion: cameraMotion,
        duration,
        timestamp: Date.now(),
        status: 'ready',
      };

      setCurrentVideo(newMedia);
      onMediaGenerated(newMedia);
      setProgressPercent(100);
      setGenerationPhase('Complete!');
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Video generation was interrupted.');
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setVideoDuration(videoRef.current.duration || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const changeSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const [isVideoDownloading, setIsVideoDownloading] = useState(false);
  const [videoSavedSuccess, setVideoSavedSuccess] = useState(false);
  const [isKeyframeDownloading, setIsKeyframeDownloading] = useState(false);

  const handleDownloadVideoMP4 = async () => {
    if (!currentVideo?.url) return;
    setIsVideoDownloading(true);
    try {
      await downloadVideoAsMP4(currentVideo.url, currentVideo.prompt, currentVideo.platform || selectedPlatformId);
      setVideoSavedSuccess(true);
      setTimeout(() => setVideoSavedSuccess(false), 2500);
    } catch (e) {
      console.error('Video download error:', e);
    } finally {
      setIsVideoDownloading(false);
    }
  };

  const handleDownloadKeyframePNG = async () => {
    if (!currentVideo?.thumbnailUrl) return;
    setIsKeyframeDownloading(true);
    try {
      await downloadImageAsPNG(currentVideo.thumbnailUrl, `${currentVideo.prompt}-keyframe`);
    } catch (e) {
      console.error('Keyframe download error:', e);
    } finally {
      setIsKeyframeDownloading(false);
    }
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyPlatformRecipe = () => {
    const formattedRecipe = `// ${currentPlatformConfig.name} Video Generation Recipe
Prompt: ${prompt}
Platform: ${currentPlatformConfig.name} (${currentPlatformConfig.developer})
Camera Motion: ${cameraMotion}
Dynamics: ${motionDynamic}
Aspect: ${aspectRatio}
Resolution: ${resolution}
Duration: ${duration}s`;

    navigator.clipboard.writeText(formattedRecipe);
    setRecipeCopied(true);
    setTimeout(() => setRecipeCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Controls & Platform Setup (5 cols) */}
      <div className="lg:col-span-5 space-y-5 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5">
        {/* Video Creation Platform Selector */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>Video Creation Platform</span>
            </label>
            <span className="text-[11px] font-mono text-cyan-400">
              {currentPlatformConfig.developer}
            </span>
          </div>

          {/* Platform Tab Buttons */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 p-1.5 bg-zinc-950/80 border border-zinc-800 rounded-xl mb-3">
            {VIDEO_PLATFORMS.map((plat) => (
              <button
                key={plat.id}
                onClick={() => handleSelectPlatform(plat.id)}
                className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all text-center truncate ${
                  selectedPlatformId === plat.id
                    ? 'bg-zinc-800 text-cyan-300 shadow-sm border border-cyan-500/60 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                }`}
                title={`${plat.name} (${plat.developer})`}
              >
                {plat.name}
              </button>
            ))}
          </div>

          {/* Active Platform Feature Card */}
          <div className="p-3 bg-zinc-950/70 border border-zinc-800/80 rounded-xl space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-zinc-200">{currentPlatformConfig.name}</span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-1.5 py-0.5 rounded">
                Max {currentPlatformConfig.maxDuration}s · {currentPlatformConfig.maxResolution}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              {currentPlatformConfig.tagline}
            </p>
            <div className="text-[11px] text-zinc-500 flex items-center gap-1 pt-1 border-t border-zinc-850">
              <span className="text-zinc-400 font-medium">Strength:</span>
              <span className="text-cyan-300/90">{currentPlatformConfig.specialty}</span>
            </div>
          </div>
        </div>

        {/* Prompt Input & Platform Optimization */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
              <Film className="w-3.5 h-3.5 text-cyan-400" />
              <span>Video Scene Prompt</span>
            </label>

            <button
              onClick={handleOptimizeForPlatform}
              disabled={isOptimizing || !prompt.trim()}
              className="flex items-center gap-1.5 text-xs font-medium text-cyan-400 hover:text-cyan-300 disabled:opacity-50 transition-colors"
              title={`Optimize prompt syntax for ${currentPlatformConfig.name}`}
            >
              <Wand2 className={`w-3.5 h-3.5 ${isOptimizing ? 'animate-spin' : ''}`} />
              <span>{isOptimizing ? 'Formatting...' : `Optimize for ${currentPlatformConfig.name}`}</span>
            </button>
          </div>

          <textarea
            rows={4}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={`Describe the motion scene according to ${currentPlatformConfig.name} standards...`}
            className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl p-3.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/50 transition-all resize-none leading-relaxed"
          />

          {platformTokens && (
            <div className="mt-2 p-2 bg-zinc-950/80 border border-zinc-800/80 rounded-lg text-xs text-cyan-300/90 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="truncate">
                <span className="text-zinc-400 font-medium">Platform Directives:</span> {platformTokens}
              </span>
            </div>
          )}

          {initialImageReference && (
            <div className="mt-2 p-2 bg-zinc-950/70 border border-zinc-800 rounded-lg flex items-center gap-2 text-xs text-zinc-300">
              <img
                src={initialImageReference}
                alt="Source reference"
                className="w-8 h-8 rounded object-cover border border-zinc-700"
              />
              <span className="text-zinc-400">Animating from image keyframe reference</span>
            </div>
          )}
        </div>

        {/* Camera Trajectory & Motion Controls */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-2 flex items-center justify-between">
            <span>Camera Trajectory & Movement</span>
            <span className="text-[11px] text-zinc-500 font-normal">{currentPlatformConfig.name} motion</span>
          </label>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {CAMERA_MOTIONS.slice(0, 6).map((m) => (
              <button
                key={m}
                onClick={() => setCameraMotion(m)}
                className={`px-3 py-2 rounded-xl text-xs font-medium text-left border transition-all truncate ${
                  cameraMotion === m
                    ? 'bg-zinc-800/90 border-cyan-500/80 text-cyan-300 shadow-sm'
                    : 'bg-zinc-950/60 border-zinc-800/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <CameraMotionVisualizer motion={cameraMotion} />
        </div>

        {/* Aspect Framing & Duration Slider */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Aspect Ratio</label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => setAspectRatio('16:9')}
                className={`py-2 px-2 rounded-lg text-xs font-medium border text-center transition-all ${
                  aspectRatio === '16:9'
                    ? 'bg-zinc-800 border-cyan-500/80 text-cyan-300'
                    : 'bg-zinc-950/60 border-zinc-800 text-zinc-400'
                }`}
              >
                16:9 Cinema
              </button>
              <button
                onClick={() => setAspectRatio('9:16')}
                className={`py-2 px-2 rounded-lg text-xs font-medium border text-center transition-all ${
                  aspectRatio === '9:16'
                    ? 'bg-zinc-800 border-cyan-500/80 text-cyan-300'
                    : 'bg-zinc-950/60 border-zinc-800 text-zinc-400'
                }`}
              >
                9:16 Mobile
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Duration ({duration}s / max {currentPlatformConfig.maxDuration}s)
            </label>
            <input
              type="range"
              min={3}
              max={currentPlatformConfig.maxDuration}
              step={1}
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value, 10))}
              className="w-full mt-3 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>
        </div>

        {/* Motion Dynamics Selector */}
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">Motion Dynamic Preset</label>
          <select
            value={motionDynamic}
            onChange={(e) => setMotionDynamic(e.target.value)}
            className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-cyan-500/60"
          >
            {MOTION_DYNAMICS.map((md) => (
              <option key={md} value={md}>
                {md}
              </option>
            ))}
          </select>
        </div>

        {/* Notification */}
        {notification && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-emerald-300 text-xs flex items-start gap-2.5">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
            <div className="space-y-1">
              <p className="font-medium text-emerald-200">Platform Notice</p>
              <p className="text-emerald-300/90 leading-relaxed">{notification}</p>
            </div>
          </div>
        )}

        {/* Error notification */}
        {errorMessage && (
          <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <div className="space-y-1">
              <p className="font-medium">Video Notice</p>
              <p className="text-rose-400/90 leading-relaxed">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={handleGenerateVideo}
            disabled={isGenerating || !prompt.trim()}
            className="w-full py-3.5 px-4 rounded-xl font-medium text-sm text-zinc-950 bg-gradient-to-r from-emerald-400 via-cyan-400 to-sky-400 hover:opacity-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-[0.99]"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Generating with {currentPlatformConfig.name}...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Video with {currentPlatformConfig.name}</span>
              </>
            )}
          </button>

          <button
            onClick={handleCopyPlatformRecipe}
            className="w-full py-2 px-3 rounded-lg border border-zinc-800 hover:bg-zinc-800 text-xs text-zinc-400 hover:text-zinc-200 transition-colors flex items-center justify-center gap-1.5"
          >
            {recipeCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{recipeCopied ? 'Recipe Copied to Clipboard!' : `Copy ${currentPlatformConfig.name} Syntax Recipe`}</span>
          </button>
        </div>
      </div>

      {/* Viewport & Interactive Player Canvas (7 cols) */}
      <div className="lg:col-span-7 space-y-4">
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
          {/* Header info with Platform indicator */}
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <span className="font-semibold text-zinc-200">
                {currentVideo.platformName || currentPlatformConfig.name}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">{currentVideo.resolution || resolution}</span>
              <span aria-hidden="true">·</span>
              <span>{currentVideo.motion || cameraMotion}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCameraHud(!showCameraHud)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-colors ${
                  showCameraHud
                    ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/60'
                    : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
                title="Toggle Camera Trajectory HUD"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>HUD</span>
              </button>

              <button
                onClick={handleCopyPrompt}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700/80 text-xs text-zinc-300 transition-colors"
                title="Copy prompt"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Prompt'}</span>
              </button>

              {currentVideo?.url && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleDownloadVideoMP4}
                    disabled={isVideoDownloading}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 hover:from-emerald-500/30 hover:to-cyan-500/30 border border-emerald-500/50 text-emerald-300 text-xs font-medium transition-all shadow-sm active:scale-95 disabled:opacity-50"
                    title="Download Scene directly as high-resolution MP4 video"
                  >
                    {isVideoDownloading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : videoSavedSuccess ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    <span>{isVideoDownloading ? 'Saving MP4...' : videoSavedSuccess ? 'Saved MP4!' : 'Download MP4'}</span>
                  </button>

                  {currentVideo?.thumbnailUrl && (
                    <button
                      onClick={handleDownloadKeyframePNG}
                      disabled={isKeyframeDownloading}
                      className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700/60 text-zinc-300 text-xs transition-colors disabled:opacity-50"
                      title="Download Still Keyframe as High-Resolution PNG"
                    >
                      <ImageIcon className="w-3 h-3 text-cyan-400" />
                      <span>{isKeyframeDownloading ? 'Saving...' : 'Keyframe PNG'}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Video Player Display Container */}
          <div
            className={`w-full rounded-xl bg-zinc-950 flex items-center justify-center relative overflow-hidden border border-zinc-800/60 shadow-2xl transition-all ${
              aspectRatio === '9:16'
                ? 'aspect-[9/16] max-h-[560px] mx-auto'
                : 'aspect-video max-h-[500px]'
            }`}
          >
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center gap-4 p-8 text-center max-w-sm">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20" />
                  <div className="absolute inset-0 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
                </div>
                <div className="space-y-2 w-full">
                  <p className="text-sm font-medium text-zinc-200">
                    Synthesizing on {currentPlatformConfig.name}
                  </p>
                  <p className="text-xs text-zinc-400 leading-relaxed">{generationPhase}</p>
                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-400 to-indigo-500 transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono">{progressPercent}%</span>
                </div>
              </div>
            ) : currentVideo?.url ? (
              <div className="relative w-full h-full group">
                <video
                  ref={videoRef}
                  src={currentVideo.url}
                  loop={isLooping}
                  playsInline
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={() => setIsPlaying(false)}
                  className="w-full h-full object-cover object-center"
                />

                {/* Camera HUD Overlay */}
                {showCameraHud && (
                  <div className="absolute inset-0 pointer-events-none border border-cyan-500/30 p-4 flex flex-col justify-between text-[11px] font-mono text-cyan-400/80 bg-cyan-950/5">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                        <span>ENGINE: {currentVideo.platformName || currentPlatformConfig.name}</span>
                      </div>
                      <span>ISO 800 · 35MM T1.5 · 60FPS</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <span>TRAJECTORY: {currentVideo.motion || cameraMotion}</span>
                      <span>RES: {currentVideo.resolution || resolution}</span>
                    </div>
                  </div>
                )}

                {/* Play/Pause center overlay when paused */}
                {!isPlaying && (
                  <button
                    onClick={togglePlay}
                    className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-zinc-950/70 border border-zinc-700/80 text-cyan-300 flex items-center justify-center hover:scale-105 transition-all shadow-xl backdrop-blur-sm"
                  >
                    <Play className="w-6 h-6 ml-0.5 fill-cyan-300" />
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center text-zinc-500 space-y-2">
                <Film className="w-8 h-8 opacity-40" />
                <p className="text-xs">Your generated video will render here.</p>
              </div>
            )}
          </div>

          {/* Custom Timeline Controls */}
          {currentVideo?.url && !isGenerating && (
            <div className="mt-3 p-3 bg-zinc-950/80 border border-zinc-800/80 rounded-xl space-y-2.5">
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={videoDuration || 10}
                  step={0.1}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-zinc-400">
                <div className="flex items-center gap-2">
                  <button
                    onClick={togglePlay}
                    className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
                  >
                    {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-zinc-200" />}
                  </button>

                  <button
                    onClick={() => {
                      if (videoRef.current) videoRef.current.currentTime = 0;
                    }}
                    className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
                    title="Restart"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>

                  <span className="font-mono text-[11px] text-zinc-300 ml-1">
                    {currentTime.toFixed(1)}s / {(videoDuration || currentVideo.duration || 8).toFixed(1)}s
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 text-[11px]">
                    {[0.5, 1, 1.5, 2].map((s) => (
                      <button
                        key={s}
                        onClick={() => changeSpeed(s)}
                        className={`px-1.5 py-0.5 rounded ${
                          playbackSpeed === s ? 'bg-zinc-800 text-cyan-300 font-semibold' : 'text-zinc-400'
                        }`}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => onSendToImage(currentVideo.prompt)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 transition-colors"
                    title="Send prompt to Picture Studio"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Picture Studio</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Video Description readout */}
          <div className="mt-3 pt-3 border-t border-zinc-800/80 text-xs text-zinc-400 line-clamp-2">
            <span className="text-zinc-200 font-medium">Prompt:</span> {currentVideo.prompt}
          </div>
        </div>
      </div>
    </div>
  );
};
