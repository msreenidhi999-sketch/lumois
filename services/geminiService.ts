import { GoogleGenAI, Type } from "@google/genai";
import { BrandGeneratedData } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateBrandIdentity = async (
  industry: string,
  description: string,
  tone: string,
  language: string
): Promise<BrandGeneratedData> => {
  const modelId = "gemini-3-flash-preview";
  
  const prompt = `
    You are an elite Brand Strategist.
    Task: Create a highly distinctive, emotionally resonant brand identity for a ${industry} venture.
    
    Context: ${description}
    Tone: ${tone}
    Language: ${language} (STRICTLY generate all content in this language)

    1. **Brand Names**: Generate 10 highly creative names. Avoid generic compound words. 
       For EACH name, provide:
       - The Name
       - A one-line Meaning
       - **3 Distinct Taglines** specifically for this name.
    2. **Brand Story**:
       - Vision: Aspirational.
       - Mission: Actionable.
       - Problem: Emotional pain point.
       - Solution: Unique value.
       - Positioning: Market stance.
    3. **Marketing**:
       - Short/Long Descriptions.
       - Ad Copy.
       - Email Copy.
       - 3 Social Captions (General).
       - **Social Media Hooks**: specific one-liners for Instagram, Facebook, LinkedIn, and Twitter.
    4. **Visual Identity**:
       - **Palettes**: 3 distinct palettes (5 hex codes).
       - **Fonts**: Recommend 3 distinct Google Fonts (Logo, Heading, Body).
       - **Logo Concept**: Describe a unique *icon or symbol* concept (no text description).
    5. **Sentiment**: Analyze mood/polarity.

    Return ONLY JSON matching the schema.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            names: { 
                type: Type.ARRAY, 
                items: { 
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        meaning: { type: Type.STRING },
                        taglines: { type: Type.ARRAY, items: { type: Type.STRING } }
                    }
                } 
            },
            story: {
              type: Type.OBJECT,
              properties: {
                vision: { type: Type.STRING },
                mission: { type: Type.STRING },
                problem: { type: Type.STRING },
                solution: { type: Type.STRING },
                positioning: { type: Type.STRING },
              },
            },
            marketing: {
              type: Type.OBJECT,
              properties: {
                shortDescription: { type: Type.STRING },
                longDescription: { type: Type.STRING },
                adCopy: { type: Type.STRING },
                emailCopy: { type: Type.STRING },
                socialCaptions: { type: Type.ARRAY, items: { type: Type.STRING } },
                socialTaglines: {
                    type: Type.OBJECT,
                    properties: {
                        instagram: { type: Type.STRING },
                        facebook: { type: Type.STRING },
                        linkedin: { type: Type.STRING },
                        twitter: { type: Type.STRING },
                    }
                }
              },
            },
            visuals: {
              type: Type.OBJECT,
              properties: {
                palettes: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            colors: { type: Type.ARRAY, items: { type: Type.STRING } },
                            style: { type: Type.STRING }
                        }
                    }
                },
                fonts: {
                  type: Type.OBJECT,
                  properties: {
                    logo: { type: Type.STRING },
                    heading: { type: Type.STRING },
                    body: { type: Type.STRING },
                  },
                },
                logoPrompt: { type: Type.STRING },
                logoType: { type: Type.STRING, enum: ['icon', 'wordmark', 'combination'] }
              },
            },
            sentiment: {
              type: Type.OBJECT,
              properties: {
                polarity: { type: Type.STRING },
                confidence: { type: Type.NUMBER },
                toneAlignment: { type: Type.STRING },
                mood: { type: Type.STRING },
              },
            },
          },
        },
      },
    });

    if (response.text) {
      const parsed = JSON.parse(response.text) as BrandGeneratedData;
      // Default initialization for UI state
      parsed.visuals.selectedPaletteIndex = 0;
      parsed.visuals.logoSettings = {
          bgColor: 'transparent',
          shape: 'none',
          width: 400,
          height: 400,
          borderRadius: 0,
          
          iconColor: parsed.visuals.palettes[0].colors[0],
          iconSize: 150,
          tintIcon: false,
          
          textElements: [] 
      };
      return parsed;
    }
    throw new Error("No data returned");
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};

export const generateLogoIcon = async (prompt: string, mood: string, fileData?: string): Promise<string> => {
  try {
    let styleModifiers = "vector flat icon, minimal, isolated on white background, high quality, no text";
    if (mood.toLowerCase().includes('bold') || mood.toLowerCase().includes('energy')) {
        styleModifiers = "bold vector logo mark, vibrant, modern, isolated on white background, no text";
    } else if (mood.toLowerCase().includes('luxury')) {
        styleModifiers = "elegant vector symbol, minimalist, sophisticated, line art, gold or black, isolated on white background, no text";
    }

    const fullPrompt = `${prompt}. ${styleModifiers}`;

    const parts: any[] = [{ text: fullPrompt }];
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts },
      config: {
        imageConfig: { aspectRatio: "1:1" }
      }
    });
    
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image generated");
  } catch (error) {
    console.error("Logo Generation Error:", error);
    throw error;
  }
};

export const getChatResponse = async (history: {role: string, parts: {text: string}[]}[], message: string) => {
    const chat = ai.chats.create({
        model: 'gemini-3-flash-preview',
        history: history,
        config: {
            systemInstruction: "You are Granite, a brand strategist. Your goal: help the user refine their business idea. RULES: 1. Be extremely concise and direct. 2. Ask only ONE critical follow-up question if information is missing; otherwise, provide a refined prompt immediately. 3. Do NOT provide long lists unless asked. 4. Do NOT start with 'Great idea!'. Jump straight to value."
        }
    });

    const result = await chat.sendMessage({ message });
    return result.text;
}
