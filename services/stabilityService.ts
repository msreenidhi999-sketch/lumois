/**
 * Stable Diffusion Service
 * Handles logo and image generation using Stability AI API
 */

const STABILITY_API_KEY = process.env.STABILITY_API_KEY;
const STABILITY_MODEL = process.env.STABILITY_MODEL;
const API_HOST = "https://api.stability.ai/v2beta";

export const generateLogoWithStability = async (
  prompt: string,
  style: string = "professional",
  width: number = 512,
  height: number = 512
): Promise<string> => {
  try {
    if (!STABILITY_API_KEY) {
      throw new Error("Stability API key not configured");
    }

    // Enhanced prompt for logo generation
    let enhancedPrompt = prompt;
    
    if (style === "professional") {
      enhancedPrompt += ", professional logo design, clean, modern, vector style, no text, minimalist, isolated on white background, high quality, transparent background";
    } else if (style === "luxury") {
      enhancedPrompt += ", luxury logo design, elegant, sophisticated, gold accents, minimalist, vector art, no text, isolated on white background";
    } else if (style === "creative") {
      enhancedPrompt += ", creative logo design, vibrant colors, unique, modern, vector art, no text, isolated on white background";
    } else if (style === "minimal") {
      enhancedPrompt += ", minimal logo design, simple geometric shapes, monochrome or two colors, clean lines, no text, isolated on white background";
    } else if (style === "bold") {
      enhancedPrompt += ", bold logo design, strong colors, dynamic, energetic, modern vector, no text, isolated on white background";
    }

    const formData = new FormData();
    formData.append("prompt", enhancedPrompt);
    formData.append("output_format", "png");
    formData.append("aspect_ratio", "1:1");
    formData.append("model", STABILITY_MODEL || "sd3.5-medium");

    const response = await fetch(
      `${API_HOST}/stable-image/generate/core`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${STABILITY_API_KEY}`,
          Accept: "image/*",
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Stability API Error:", error);
      throw new Error(`API request failed: ${response.status}`);
    }

    const blob = await response.blob();
    const reader = new FileReader();
    
    return new Promise((resolve, reject) => {
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Logo Generation Error:", error);
    throw error;
  }
};

export const generateMultipleLogos = async (
  prompt: string,
  count: number = 3,
  styles: string[] = ["professional", "creative", "minimal"]
): Promise<string[]> => {
  try {
    const logos: string[] = [];
    
    for (let i = 0; i < count; i++) {
      const style = styles[i % styles.length];
      const logo = await generateLogoWithStability(prompt, style);
      logos.push(logo);
      
      // Add small delay between requests to avoid rate limiting
      if (i < count - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    return logos;
  } catch (error) {
    console.error("Multiple Logo Generation Error:", error);
    throw error;
  }
};

export const generateBrandLogoVariations = async (
  brandName: string,
  brandDescription: string,
  mood: string
): Promise<{
  professional: string;
  creative: string;
  minimal: string;
}> => {
  try {
    const basePrompt = `Logo for ${brandName}. ${brandDescription}. Style: ${mood}.`;
    
    const [professional, creative, minimal] = await Promise.all([
      generateLogoWithStability(basePrompt, "professional"),
      generateLogoWithStability(basePrompt, "creative"),
      generateLogoWithStability(basePrompt, "minimal"),
    ]);

    return {
      professional,
      creative,
      minimal,
    };
  } catch (error) {
    console.error("Brand Logo Variations Error:", error);
    throw error;
  }
};
