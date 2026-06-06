
import { GoogleGenAI } from "@google/genai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not set");
}

// Singleton instance (prevents re-creation)
const ai = new GoogleGenAI({ apiKey });

//  Sleep helper
const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

//  Safe API call (handles rate limit + quota)
async function safeGenerate(config: any) {
  try {
    console.log(" Gemini API call...");
    return await ai.models.generateContent(config);
  } catch (err: any) {
    const status = err?.status;
    const msg = err?.error?.message || "";

    //  Daily quota exhausted → don't retry
    if (status === 429 && msg.toLowerCase().includes("quota")) {
      console.error(" DAILY QUOTA EXCEEDED");
      throw new Error("DAILY_QUOTA_EXCEEDED");
    }

    //  Rate limit → retry once
    if (status === 429) {
      console.warn(" Rate limit hit. Retrying in 45s...");
      await sleep(45000);
      return await ai.models.generateContent(config);
    }

    // Model overloaded (503)
    if (status === 503) {
      console.warn("Model overloaded. Retrying in 20s...");
      await sleep(20000);
      return await ai.models.generateContent(config);
    }

    throw err;
  }
}

//  TEXT response helper (useful for fallback/debug)
export const getGeminiResponse = async (
  prompt: string,
  systemInstruction?: string
): Promise<string> => {
  const response = await safeGenerate({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      systemInstruction,
    },
  });

  return response.text || "";
};

//  JSON helper (used in multi-agent system)
export const getGeminiJSON = async <T>(
  prompt: string,
  schema: any,
  systemInstruction?: string
): Promise<T> => {
  const response = await safeGenerate({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: schema,
    },
  });

  try {
    return JSON.parse(response.text || "{}") as T;
  } catch (e) {
    console.error("❌ Invalid JSON:", response.text);
    throw new Error("INVALID_JSON");
  }
};

// ✅ Chat creator (IMPORTANT for MAS agents)
export const createChat = (systemInstruction: string) => {
  console.log("🧠 Creating Gemini chat...");

  return ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction,
    },
  });
};