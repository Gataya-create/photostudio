export type Language = 'en' | 'vi';

export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';

export enum FeatureKey {
  TEXT_TO_PHOTO = 'text-to-photo',
  IMAGE_TO_PHOTO = 'image-to-photo',
  IMAGE_FUSION = 'image-fusion',
  AI_MODEL = 'ai-model',
  EDIT_PHOTO = 'edit-photo',
}

export interface FeatureConfig {
  key: FeatureKey;
  title: string;
  description: string;
  promptPlaceholder: string;
  requiresImage: boolean;
}

export type LocalizedFeatureInfo = Omit<FeatureConfig, 'key' | 'requiresImage'>;

export type LocalizedFeatures = {
  [key in FeatureKey]: LocalizedFeatureInfo;
};

export interface SavedImage {
  id: string;
  imageDataUrl: string;
  mimeType: string;
  prompt: string;
  timestamp: number;
}

export enum StyleKey {
  NONE = 'none',
  VINTAGE = 'vintage',
  CINEMATIC = 'cinematic',
  WATERCOLOR = 'watercolor',
  NEON_PUNK = 'neon_punk',
  THREE_D_RENDER = '3d_render',
  REALISTIC = 'realistic',
  ARTISTIC = 'artistic',
  PORTRAIT = 'portrait',
}

export interface StyleOption {
  key: StyleKey;
  name: string;
  prompt: string;
}

export type LocalizedStyles = {
  [key in StyleKey]: Pick<StyleOption, 'name' | 'prompt'>;
};
