export interface BrandProject {
  id: string;
  name: string;
  industry: string;
  description: string;
  tone: string;
  language: string;
  generatedData?: BrandGeneratedData;
  createdAt: number;
}

export interface BrandName {
  name: string;
  meaning: string;
  taglines: string[];
}

export interface ColorPalette {
  name: string;
  colors: string[];
  style: string;
}

export interface TextLayer {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  spacing: number;
  rotation: number;
  fontWeight: string;
  align: 'left' | 'center' | 'right';
}

export interface BrandGeneratedData {
  names: BrandName[];
  // Global taglines removed in favor of per-name taglines
  story: {
    vision: string;
    mission: string;
    problem: string;
    solution: string;
    positioning: string;
  };
  marketing: {
    shortDescription: string;
    longDescription: string;
    adCopy: string;
    emailCopy: string;
    socialCaptions: string[];
    socialTaglines: {
      instagram: string;
      facebook: string;
      linkedin: string;
      twitter: string;
    };
  };
  visuals: {
    palettes: ColorPalette[];
    selectedPaletteIndex: number;
    fonts: {
      logo: string;
      heading: string;
      body: string;
    };
    logoPrompt: string; 
    logoIconUrl?: string;
    logoType: 'icon' | 'wordmark' | 'combination';
    logoSettings?: {
        // Container Settings
        bgColor: string;
        shape: 'none' | 'circle' | 'square' | 'rounded' | 'triangle' | 'hexagon' | 'rectangle' | 'oval';
        width: number;
        height: number;
        borderRadius: number;
        
        // Icon Settings
        iconColor: string;
        iconSize: number;
        tintIcon: boolean;
        
        // Text Layers
        textElements: TextLayer[];
    }
  };
  sentiment: {
    polarity: string;
    confidence: number;
    toneAlignment: string;
    mood: string;
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}
