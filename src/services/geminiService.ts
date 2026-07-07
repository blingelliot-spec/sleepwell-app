import { GoogleGenAI } from "@google/genai";
import { SleepLog } from "../types";
import { format } from "date-fns";

// Vite exposes env variables via import.meta.env, not process.env
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  console.error("VITE_GEMINI_API_KEY is not defined in environment variables");
}

const ai = new GoogleGenAI({ apiKey: apiKey || "" });

// Helper for exponential backoff
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function generateWithRetry(
  fn: () => Promise<any>,
  retries: number = 4,
  initialDelay: number = 1000
): Promise<any> {
  let lastError: any;
  
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      // Check if it's a rate limit error (429) and we have retries left
      const isRateLimit = err.message?.includes('429') || err.message?.includes('RESOURCE_EXHAUSTED');
      
      if (isRateLimit && i < retries - 1) {
        const delay = initialDelay * Math.pow(2, i); // 1s, 2s, 4s...
        console.warn(`Rate limited. Retrying in ${delay}ms... (Attempt ${i + 1}/${retries})`);
        await wait(delay);
        continue;
      }
      
      // If not a rate limit or no retries left, throw
      throw err;
    }
  }
  
  throw lastError;
}

export async function getSleepInsights(logs: SleepLog[]) {
  if (logs.length === 0) return "No sleep logs yet. Start tracking to get insights!";

  if (!apiKey) {
    console.error("VITE_GEMINI_API_KEY is missing!");
    return "⚠️ API key not configured. Please check your environment variables.";
  }

  console.log("Generating insights for", logs.length, "logs");

  const logSummary = logs.slice(0, 7).map(log => {
    const start = log.startTime.toDate();
    const end = log.endTime.toDate();
    const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    const interrupted = log.interrupted ? 'Yes' : 'No';
    const reason = log.interruptionReason || 'N/A';
    return `{ date: ${format(start, 'yyyy-MM-dd')}, duration: ${duration.toFixed(1)}h, quality: ${log.quality}/5, mood: ${log.mood || 'N/A'}, interrupted: ${interrupted}, reason: ${reason} }`;
  }).join("\n");

  const prompt = `
    You are a sleep expert. Analyze the following sleep logs from the past week and provide personalized insights and tips for better sleep.
    Be concise, encouraging, and scientific. Use Markdown formatting.
    
    Sleep Logs:
    ${logSummary}
    
    Focus on:
    1. Consistency of sleep timing.
    2. Average sleep duration vs recommended (7-9h).
    3. Correlation between duration and quality.
    4. Impact of sleep interruptions on quality.
    5. Identify patterns in interruption reasons.
    6. Actionable tips for improvement.
  `;

  try {
    console.log("Calling Gemini API with model: gemini-2.0-flash");
    
    // Use retry mechanism for rate limiting
    const response = await generateWithRetry(async () => {
      return await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
      });
    }, 4, 1000); // 4 retries, starting with 1s delay
    
    console.log("Gemini response received successfully");
    return response.text || "No insights generated.";
  } catch (error) {
    console.error("Gemini Error:", error);
    if (error instanceof Error) {
      // Check if it's still a quota error after retries
      if (error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED')) {
        return "⚠️ Quota exceeded. Please try again in a few minutes or tomorrow when your free tier resets.";
      }
      return `⚠️ Could not generate insights: ${error.message}`;
    }
    return "Could not generate insights at this time. Please try again later.";
  }
}

export async function listAvailableModels() {
  try {
    const response = await ai.models.list();
    console.log("Available models:", response);
    return response;
  } catch (error) {
    console.error("Error listing models:", error);
  }
}

export async function askSleepQuestion(logs: SleepLog[], question: string) {
  if (!apiKey) {
    return "⚠️ API key not configured. Please check your environment variables.";
  }

  if (logs.length === 0) {
    return "You don't have any sleep logs yet. Start tracking your sleep first!";
  }

  // Create a summary of recent logs for context
  const logSummary = logs.slice(0, 7).map(log => {
    const start = log.startTime.toDate();
    const end = log.endTime.toDate();
    const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    const interrupted = log.interrupted ? 'Yes' : 'No';
    const reason = log.interruptionReason || 'N/A';
    return `- ${format(start, 'MMM dd')}: ${duration.toFixed(1)}h sleep, quality ${log.quality}/5, mood: ${log.mood || 'N/A'}, interrupted: ${interrupted}${interrupted ? ` (${reason})` : ''}`;
  }).join('\n');

  const prompt = `
    You are a sleep expert assistant. Based on the user's recent sleep data, answer their question.
    Be concise, helpful, and personalized. Use the sleep data provided to give specific advice.
    
    User's recent sleep data (last 7 logs):
    ${logSummary}
    
    User's question: ${question}
    
    Provide a helpful, personalized answer based on their sleep patterns.
  `;

  try {
    console.log("Calling Gemini API for chat question");
    
    // Use retry mechanism for rate limiting
    const response = await generateWithRetry(async () => {
      return await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
      });
    }, 4, 1000);
    
    return response.text || "No response generated.";
  } catch (error) {
    console.error("Chat Error:", error);
    if (error instanceof Error) {
      if (error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED')) {
        return "⚠️ Quota exceeded. Please try again in a few minutes or tomorrow when your free tier resets.";
      }
      return `⚠️ Could not answer: ${error.message}`;
    }
    return "Could not answer at this time. Please try again later.";
  }
}