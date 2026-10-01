export type StudioMode = 'image' | 'video' | 'storyboard' | 'promptlab' | 'gallery';

export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';

export type VideoResolution = '720p' | '1080p' | '4k';

export type VideoPlatformId =
  | 'free-ai'
  | 'veo3'
  | 'seadance25'
  | 'runway-gen3'
  | 'sora2'
  | 'kling15'
  | 'luma-dream';

export interface VideoPlatformConfig {
  id: VideoPlatformId;
  name: string;
  developer: string;
  tagline: string;
  specialty: string;
  maxResolution: string;
  supportedRatios: AspectRatio[];
  maxDuration: number;
  defaultDuration: number;
  isFree: boolean;
  promptSyntaxHint: string;
}

export interface GeneratedMedia {
  id: string;
  type: 'image' | 'video';
  prompt: string;
  negativePrompt?: string;
  url: string;
  thumbnailUrl?: string;
  aspectRatio: AspectRatio;
  resolution?: string;
  platform?: VideoPlatformId;
  platformName?: string;
  style?: string;
  lighting?: string;
  camera?: string;
  motion?: string;
  duration?: number;
  timestamp: number;
  status: 'ready' | 'generating' | 'failed';
  operationName?: string;
  errorMessage?: string;
}

export interface PromptEnhancement {
  enhancedPrompt: string;
  negativePrompt: string;
  cameraDirective: string;
  lightingSetup: string;
  audioSuggestion: string;
}

export interface StoryboardScene {
  sceneNumber: number;
  title: string;
  shotType: string;
  cameraMovement: string;
  visualPrompt: string;
  durationSeconds: number;
  atmosphericAudio: string;
  generatedImageUrl?: string;
  isGenerating?: boolean;
}

export interface StoryboardProject {
  id: string;
  title: string;
  genre: string;
  logline: string;
  scenes: StoryboardScene[];
  timestamp: number;
}

export interface PromptTemplate {
  id: string;
  title: string;
  category: 'Cinematic' | 'Sci-Fi' | 'Portrait' | 'Nature' | 'Animation' | 'Architecture';
  type: 'image' | 'video';
  prompt: string;
  negativePrompt: string;
  style: string;
  lighting: string;
  camera: string;
  aspectRatio: AspectRatio;
  motion?: string;
  previewUrl: string;
  tags: string[];
}
