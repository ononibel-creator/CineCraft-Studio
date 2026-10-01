/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { StudioMode, GeneratedMedia, PromptTemplate } from './types';
import { INITIAL_SHOWCASE } from './data/curatedPrompts';
import { Header } from './components/Header';
import { ImageStudio } from './components/ImageStudio';
import { VideoStudio } from './components/VideoStudio';
import { StoryboardStudio } from './components/StoryboardStudio';
import { PromptLab } from './components/PromptLab';
import { HistoryGallery } from './components/HistoryGallery';
import { MediaModal } from './components/MediaModal';
import { Sparkles, Layers } from 'lucide-react';

export default function App() {
  const [currentMode, setCurrentMode] = useState<StudioMode>('image');
  const [mediaHistory, setMediaHistory] = useState<GeneratedMedia[]>(INITIAL_SHOWCASE);
  const [inspectedMedia, setInspectedMedia] = useState<GeneratedMedia | null>(null);

  // Cross-studio routing states
  const [activeMediaForImage, setActiveMediaForImage] = useState<GeneratedMedia | undefined>(undefined);
  const [activeMediaForVideo, setActiveMediaForVideo] = useState<GeneratedMedia | undefined>(undefined);
  const [videoInitialPrompt, setVideoInitialPrompt] = useState<string | undefined>(undefined);
  const [videoInitialImage, setVideoInitialImage] = useState<string | undefined>(undefined);

  const handleMediaGenerated = (newMedia: GeneratedMedia) => {
    setMediaHistory((prev) => [newMedia, ...prev]);
  };

  const handleSendToVideo = (prompt: string, imageUrl?: string) => {
    setVideoInitialPrompt(prompt);
    setVideoInitialImage(imageUrl);
    setCurrentMode('video');
  };

  const handleSendToImage = (prompt: string) => {
    setActiveMediaForImage({
      id: 'remix-' + Date.now(),
      type: 'image',
      prompt,
      url: '',
      aspectRatio: '16:9',
      timestamp: Date.now(),
      status: 'ready',
    });
    setCurrentMode('image');
  };

  const handleLoadTemplate = (template: PromptTemplate) => {
    if (template.type === 'video') {
      setVideoInitialPrompt(template.prompt);
      setCurrentMode('video');
    } else {
      setActiveMediaForImage({
        id: 'template-' + Date.now(),
        type: 'image',
        prompt: template.prompt,
        negativePrompt: template.negativePrompt,
        style: template.style,
        lighting: template.lighting,
        camera: template.camera,
        aspectRatio: template.aspectRatio,
        url: template.previewUrl,
        timestamp: Date.now(),
        status: 'ready',
      });
      setCurrentMode('image');
    }
  };

  const handleRemixWithGemini = async (basePrompt: string, type: 'image' | 'video') => {
    try {
      const res = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Remix and evolve this idea with new atmospheric details and creative twists: "${basePrompt}"`,
          type,
          tone: 'imaginative cinematic',
        }),
      });
      const data = await res.json();
      if (data.success && data.data?.enhancedPrompt) {
        if (type === 'video') {
          setVideoInitialPrompt(data.data.enhancedPrompt);
          setCurrentMode('video');
        } else {
          setActiveMediaForImage({
            id: 'remix-' + Date.now(),
            type: 'image',
            prompt: data.data.enhancedPrompt,
            negativePrompt: data.data.negativePrompt,
            url: '',
            aspectRatio: '16:9',
            timestamp: Date.now(),
            status: 'ready',
          });
          setCurrentMode('image');
        }
      }
    } catch (err) {
      console.error('Error remixing prompt:', err);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('Clear all workspace history?')) {
      setMediaHistory([]);
    }
  };

  const handleLoadInStudio = (media: GeneratedMedia) => {
    if (media.type === 'video') {
      setActiveMediaForVideo(media);
      setVideoInitialPrompt(media.prompt);
      setCurrentMode('video');
    } else {
      setActiveMediaForImage(media);
      setCurrentMode('image');
    }
  };

  return (
    <div className="min-h-screen bg-[#090D14] text-zinc-100 flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-200">
      {/* Navigation Header */}
      <Header
        currentMode={currentMode}
        onSelectMode={setCurrentMode}
        historyCount={mediaHistory.length}
      />

      {/* Main Studio Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {currentMode === 'image' && (
          <ImageStudio
            onMediaGenerated={handleMediaGenerated}
            onSendToVideo={handleSendToVideo}
            activeMedia={activeMediaForImage}
          />
        )}

        {currentMode === 'video' && (
          <VideoStudio
            onMediaGenerated={handleMediaGenerated}
            onSendToImage={handleSendToImage}
            initialPrompt={videoInitialPrompt}
            initialImageReference={videoInitialImage}
            activeMedia={activeMediaForVideo}
          />
        )}

        {currentMode === 'storyboard' && (
          <StoryboardStudio
            onSendToImage={handleSendToImage}
            onSendToVideo={handleSendToVideo}
            onMediaGenerated={handleMediaGenerated}
          />
        )}

        {currentMode === 'promptlab' && (
          <PromptLab
            onLoadTemplate={handleLoadTemplate}
            onRemixWithGemini={handleRemixWithGemini}
          />
        )}

        {currentMode === 'gallery' && (
          <HistoryGallery
            mediaList={mediaHistory}
            onSelectMedia={setInspectedMedia}
            onClearHistory={handleClearHistory}
          />
        )}
      </main>

      {/* Media Inspection Modal */}
      {inspectedMedia && (
        <MediaModal
          media={inspectedMedia}
          onClose={() => setInspectedMedia(null)}
          onLoadInStudio={handleLoadInStudio}
        />
      )}

      {/* Subtle Studio Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950/60 py-6 text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-zinc-400 font-medium">CineCraft Studio</span>
            <span aria-hidden="true">·</span>
            <span>Multimodal Text-to-Image & Text-to-Video Engine</span>
          </div>

          <div className="flex items-center gap-3">
            <span>Powered by Gemini 3.1 & Veo Models</span>
            <span aria-hidden="true">·</span>
            <span>{mediaHistory.length} creations saved</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
