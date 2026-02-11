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
}

export interface ColorPalette {
  name: string;
  colors: string[];
  style: string;
}

export interface BrandGeneratedData {
  names: BrandName[];
  taglines: string[];
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
  };
  visuals: {
    palettes: ColorPalette[];
    selectedPaletteIndex: number;
    fonts: {
      logo: string;
      heading: string;
      body: string;
    };
    logoPrompt: string; // The base idea for the icon
    logoIconUrl?: string; // The generated icon image
    logoType: 'icon' | 'wordmark' | 'combination';
    logoSettings?: {
        fontFamily: string;
        layout: 'horizontal' | 'vertical';
        spacing: number;
        fontSize: number;
        textColor: string;
        bgColor: string;
        iconColor: string;
        iconSize: number;
        borderRadius: number; // 0 for square, 50 for circle, etc.
        textAlignment: 'left' | 'center' | 'right';
        tintIcon: boolean;
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
