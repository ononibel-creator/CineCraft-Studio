import React, { useState } from 'react';
import { StoryboardProject, StoryboardScene, GeneratedMedia } from '../types';
import { downloadImageAsPNG } from '../utils/downloadHelper';
import {
  Clapperboard,
  Sparkles,
  Wand2,
  Play,
  Pause,
  Image as ImageIcon,
  Video as VideoIcon,
  Copy,
  Check,
  Film,
  Download,
  AlertCircle,
  RefreshCw,
  Volume2,
} from 'lucide-react';

interface StoryboardStudioProps {
  onSendToImage: (prompt: string) => void;
  onSendToVideo: (prompt: string, imageUrl?: string) => void;
  onMediaGenerated: (media: GeneratedMedia) => void;
}

const SAMPLE_PROJECTS: StoryboardProject[] = [
  {
    id: 'sb-cyberpunk',
    title: 'The Obsidian Datacore',
    genre: 'Cyberpunk Noir',
    logline: 'An operative breaches an underwater server vault in Neo-Tokyo to extract an encrypted memory filament.',
    timestamp: Date.now() - 1000 * 60 * 60,
    scenes: [
      {
        sceneNumber: 1,
        title: 'Descent into Neon Abyss',
        shotType: 'Ultra-wide aerial establishing shot',
        cameraMovement: 'Slow crane boom down through misty skyscraper canyon',
        visualPrompt:
          'Futuristic Neo-Tokyo harbor at midnight under heavy rain, neon holograms reflecting on choppy dark water, a sleek stealth submarine submerging beneath floating oil platforms.',
        durationSeconds: 4,
        atmosphericAudio: 'Muffled thunder, deep synth drone, heavy rain drumming on hull',
        generatedImageUrl:
          'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
      },
      {
        sceneNumber: 2,
        title: 'The Vault Breach',
        shotType: 'Medium Dutch-angle tracking shot',
        cameraMovement: 'Smooth dolly push-in behind operative',
        visualPrompt:
          'A hooded operative in wet matte-black tactical gear using a glowing plasma torch to breach a circular titanium vault door, blue sparks showering against dark damp tiles.',
        durationSeconds: 5,
        atmosphericAudio: 'High-pitched plasma hiss, intermittent electrical crackle, tense heartbeat pulse',
        generatedImageUrl:
          'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
      },
      {
        sceneNumber: 3,
        title: 'Extraction & Alarm',
        shotType: 'Extreme close-up macro focus pull',
        cameraMovement: 'Fast camera orbit 180° around glowing core',
        visualPrompt:
          'Operative gloved fingers sliding a glowing geometric crystalline memory shard from an illuminated cooling matrix, flashing amber warning sirens bathing the chamber.',
        durationSeconds: 4,
        atmosphericAudio: 'Pulsing emergency klaxon, steam venting hiss, escalating orchestral percussion',
        generatedImageUrl:
          'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80',
      },
    ],
  },
];

export const StoryboardStudio: React.FC<StoryboardStudioProps> = ({
  onSendToImage,
  onSendToVideo,
  onMediaGenerated,
}) => {
  const [concept, setConcept] = useState(
    'A deep-space surveyor discovers an ancient geometric monolith encased inside a frozen asteroid orbiting Saturn.'
  );
  const [sceneCount, setSceneCount] = useState<number>(3);
  const [isGenerating, setIsGenerating] = useState(false);
  const [project, setProject] = useState<StoryboardProject>(SAMPLE_PROJECTS[0]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Playback reel
  const [activeSceneIndex, setActiveSceneIndex] = useState<number>(0);
  const [isPlayingReel, setIsPlayingReel] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Scene generating states
  const [generatingSceneIdx, setGeneratingSceneIdx] = useState<number | null>(null);

  const handleGenerateStoryboard = async () => {
    if (!concept.trim()) return;
    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/generate-storyboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concept, sceneCount }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate storyboard script');
      }

      const generatedProject: StoryboardProject = {
        id: 'sb-' + Date.now(),
        title: data.data.storyTitle || 'Untitled Sequence',
        genre: data.data.genre || 'Cinematic',
        logline: data.data.logline || concept,
        scenes: data.data.scenes.map((s: any) => ({
          ...s,
          generatedImageUrl: undefined,
        })),
        timestamp: Date.now(),
      };

      setProject(generatedProject);
      setActiveSceneIndex(0);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Error generating storyboard');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateSceneImage = async (sceneIndex: number, scenePrompt: string) => {
    setGeneratingSceneIdx(sceneIndex);
    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: scenePrompt,
          aspectRatio: '16:9',
          style: 'Cinematic Photorealism',
          engine: 'free',
        }),
      });

      const data = await res.json();
      if (data.success && data.imageUrl) {
        setProject((prev) => {
          const newScenes = [...prev.scenes];
          newScenes[sceneIndex] = {
            ...newScenes[sceneIndex],
            generatedImageUrl: data.imageUrl,
          };
          return { ...prev, scenes: newScenes };
        });

        const newMedia: GeneratedMedia = {
          id: 'sb-frame-' + Date.now(),
          type: 'image',
          prompt: scenePrompt,
          url: data.imageUrl,
          aspectRatio: '16:9',
          style: 'Cinematic Photorealism',
          timestamp: Date.now(),
          status: 'ready',
        };
        onMediaGenerated(newMedia);
      }
    } catch (err: any) {
      console.error('Failed to generate scene keyframe:', err);
    } finally {
      setGeneratingSceneIdx(null);
    }
  };

  // Reel simulator
  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlayingReel && project?.scenes?.length) {
      const currentScene = project.scenes[activeSceneIndex];
      const durationMs = (currentScene?.durationSeconds || 4) * 1000;
      timer = setTimeout(() => {
        setActiveSceneIndex((prev) => (prev + 1) % project.scenes.length);
      }, durationMs);
    }
    return () => clearTimeout(timer);
  }, [isPlayingReel, activeSceneIndex, project]);

  const copyScenePrompt = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Storyboard Concept Form */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-200 flex items-center gap-2">
              <Clapperboard className="w-4 h-4 text-cyan-400" />
              <span>AI Cinematic Storyboard & Script Breakdown</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Transform high-level video concepts into structured scene sequences with camera trajectories and visual prompts.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-zinc-400">
              <span>Scene Count:</span>
              {[2, 3, 4, 5].map((cnt) => (
                <button
                  key={cnt}
                  onClick={() => setSceneCount(cnt)}
                  className={`w-7 h-7 rounded-lg text-xs font-mono font-medium transition-all ${
                    sceneCount === cnt
                      ? 'bg-zinc-800 text-cyan-300 border border-cyan-500/60'
                      : 'bg-zinc-950/60 text-zinc-400 border border-zinc-800 hover:text-zinc-200'
                  }`}
                >
                  {cnt}
                </button>
              ))}
            </div>

            <button
              onClick={handleGenerateStoryboard}
              disabled={isGenerating || !concept.trim()}
              className="py-2 px-4 rounded-xl font-medium text-xs text-zinc-950 bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400 hover:opacity-95 disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-md shadow-cyan-500/10"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Scripting Scenes...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Direct Storyboard</span>
                </>
              )}
            </button>
          </div>
        </div>

        <textarea
          rows={2}
          value={concept}
          onChange={(e) => setConcept(e.target.value)}
          placeholder="Enter your movie, commercial, or story concept (e.g. 'A futuristic drone race through canyon ruins...')"
          className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/50 resize-none leading-relaxed"
        />

        {errorMessage && (
          <div className="mt-3 p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Main Storyboard Project Overview */}
      {project && (
        <div className="space-y-6">
          {/* Script Header Banner */}
          <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs uppercase font-mono tracking-widest text-cyan-400">
                  {project.genre || 'Cinematic Production'}
                </span>
                <span aria-hidden="true" className="text-zinc-600">·</span>
                <span className="text-xs text-zinc-500 font-mono">{project.scenes.length} Scenes</span>
              </div>
              <h3 className="text-lg font-bold text-zinc-100">{project.title}</h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-2xl">{project.logline}</p>
            </div>

            {/* Reel Playback Toggle */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIsPlayingReel(!isPlayingReel)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                  isPlayingReel
                    ? 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
                    : 'bg-zinc-800/90 text-cyan-300 hover:bg-zinc-700 border border-zinc-700'
                }`}
              >
                {isPlayingReel ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                <span>{isPlayingReel ? 'Pause Sequence Reel' : 'Play Sequence Reel'}</span>
              </button>
            </div>
          </div>

          {/* Sequential Scenes List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {project.scenes.map((scene, idx) => {
              const isCurrent = isPlayingReel && activeSceneIndex === idx;
              return (
                <div
                  key={scene.sceneNumber}
                  className={`bg-zinc-900/60 border rounded-2xl p-4 flex flex-col justify-between transition-all ${
                    isCurrent
                      ? 'border-cyan-400 ring-2 ring-cyan-500/20 shadow-xl'
                      : 'border-zinc-800/80 hover:border-zinc-700'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Scene Tag */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 font-mono text-zinc-400">
                        <span className="text-cyan-400 font-semibold">Scene {scene.sceneNumber}</span>
                        <span aria-hidden="true">·</span>
                        <span>{scene.durationSeconds}s</span>
                      </div>
                      <span className="text-[11px] text-zinc-500 font-mono">{scene.shotType}</span>
                    </div>

                    <h4 className="text-sm font-semibold text-zinc-100">{scene.title}</h4>

                    {/* Keyframe Visual Preview Container */}
                    <div className="w-full aspect-video rounded-xl bg-zinc-950 border border-zinc-800 relative overflow-hidden flex items-center justify-center">
                      {scene.generatedImageUrl ? (
                        <img
                          src={scene.generatedImageUrl}
                          alt={scene.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center p-4 text-center text-zinc-600 gap-1.5">
                          <Film className="w-6 h-6 opacity-30" />
                          <span className="text-[11px]">No keyframe rendered</span>
                        </div>
                      )}

                      {/* Generate Keyframe Overlay button */}
                      <button
                        onClick={() => handleGenerateSceneImage(idx, scene.visualPrompt)}
                        disabled={generatingSceneIdx === idx}
                        className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-zinc-950/80 hover:bg-zinc-900 border border-zinc-700/80 text-[11px] text-zinc-200 transition-colors flex items-center gap-1 backdrop-blur-sm"
                      >
                        {generatingSceneIdx === idx ? (
                          <RefreshCw className="w-3 h-3 animate-spin text-cyan-400" />
                        ) : (
                          <Sparkles className="w-3 h-3 text-cyan-400" />
                        )}
                        <span>{scene.generatedImageUrl ? 'Re-render' : 'Render Frame'}</span>
                      </button>
                    </div>

                    {/* Camera trajectory */}
                    <div className="p-2.5 bg-zinc-950/60 rounded-xl border border-zinc-800/80 text-[11px] space-y-1">
                      <div className="text-cyan-400 font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                        <span>Camera Trajectory</span>
                      </div>
                      <p className="text-zinc-300">{scene.cameraMovement}</p>
                    </div>

                    {/* Visual Prompt */}
                    <div className="text-xs text-zinc-400 space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-zinc-500">
                        <span>Generation Prompt:</span>
                        <button
                          onClick={() => copyScenePrompt(`p-${scene.sceneNumber}`, scene.visualPrompt)}
                          className="text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5"
                        >
                          {copiedId === `p-${scene.sceneNumber}` ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>Copy</span>
                        </button>
                      </div>
                      <p className="text-zinc-300 text-[11px] leading-relaxed line-clamp-3 bg-zinc-950/40 p-2 rounded-lg border border-zinc-800/50">
                        {scene.visualPrompt}
                      </p>
                    </div>

                    {/* Audio Cue */}
                    <div className="flex items-start gap-1.5 text-[11px] text-zinc-500">
                      <Volume2 className="w-3.5 h-3.5 text-zinc-600 shrink-0 mt-0.5" />
                      <span className="italic">{scene.atmosphericAudio}</span>
                    </div>
                  </div>

                  {/* Actions to Studio */}
                  <div className="pt-3 mt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                    <button
                      onClick={() => onSendToImage(scene.visualPrompt)}
                      className="flex-1 py-1.5 px-2 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-xs text-zinc-300 transition-colors flex items-center justify-center gap-1"
                    >
                      <ImageIcon className="w-3 h-3 text-cyan-400" />
                      <span>To Picture</span>
                    </button>
                    <button
                      onClick={() => onSendToVideo(scene.visualPrompt, scene.generatedImageUrl)}
                      className="flex-1 py-1.5 px-2 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-800/50 text-xs text-cyan-300 transition-colors flex items-center justify-center gap-1"
                    >
                      <VideoIcon className="w-3 h-3 text-cyan-400" />
                      <span>To Video</span>
                    </button>

                    {scene.generatedImageUrl && (
                      <button
                        onClick={() => downloadImageAsPNG(scene.generatedImageUrl!, `${project.title}-scene-${scene.sceneNumber}`)}
                        className="p-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800/60 text-emerald-300 transition-colors"
                        title="Download Scene Keyframe as High-Resolution PNG"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
