import { GoogleGenAI, Modality } from "@google/genai";
import { AspectRatio } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

interface ImageInput {
  base64: string;
  mimeType: string;
}

export const generateImageFromText = async (prompt: string, stylePrompt?: string, aspectRatio: AspectRatio = '1:1'): Promise<string> => {
  try {
    const finalPrompt = stylePrompt ? `${prompt}, ${stylePrompt}` : prompt;
    
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: finalPrompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/png',
          aspectRatio: aspectRatio,
        },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      return response.generatedImages[0].image.imageBytes;
    } else {
      throw new Error("No image was generated.");
    }
  } catch (error) {
    console.error("Error generating image from text:", error);
    throw error;
  }
};

export const generateImageFromImage = async (prompt: string, image: ImageInput, stylePrompt?: string): Promise<string> => {
  try {
    const finalPrompt = stylePrompt ? `${prompt}, ${stylePrompt}` : prompt;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: image.base64,
              mimeType: image.mimeType,
            },
          },
          {
            text: finalPrompt,
          },
        ],
      },
      config: {
          responseModalities: [Modality.IMAGE],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }
    
    throw new Error("No image part found in the response.");
  } catch (error) {
    console.error("Error generating image from image:", error);
    throw error;
  }
};

export const generateImageFromTwoImages = async (prompt: string, image1: ImageInput, image2: ImageInput, stylePrompt?: string): Promise<string> => {
  try {
    const finalPrompt = stylePrompt ? `${prompt}, ${stylePrompt}` : prompt;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: { data: image1.base64, mimeType: image1.mimeType },
          },
          {
            inlineData: { data: image2.base64, mimeType: image2.mimeType },
          },
          {
            text: finalPrompt,
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }

    throw new Error("No image part found in the response.");
  } catch (error) {
    console.error("Error generating image from two images:", error);
    throw error;
  }
};
