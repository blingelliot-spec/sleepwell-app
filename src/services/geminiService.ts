import { GoogleGenAI } from "@google/genai";
import { SleepLog } from "../types";
import { format } from "date-fns";

// Check if API key exists
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("GEMINI_API_KEY is not defined in environment variables");
}

const ai = new GoogleGenAI({ apiKey: apiKey || "" });

export async function getSleepInsights(logs: SleepLog[]) {
  if (logs.length === 0) return "No sleep logs yet. Start tracking to get insights!";

  // Check API key
  if (!apiKey) {
    console.error("GEMINI_API_KEY is missing!");
    return "⚠️ API key not configured. Please check your environment variables.";
  }

  console.log("Generating insights for", logs.length, "logs");

  const logSummary = logs.slice(0, 7).map(log => {
    const start = log.startTime.toDate();
    const end = log.endTime.toDate();
    const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return `{ date: ${format(start, 'yyyy-MM-dd')}, duration: ${duration.toFixed(1)}h, quality: ${log.quality}/5, mood: ${log.mood || 'N/A'} }`;
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
    4. Actionable tips for improvement.
  `;

  try {
    console.log("Calling Gemini API with model: gemini-1.5-flash");
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
    });
    console.log("Gemini response received successfully");
    return response.text || "No insights generated.";
  } catch (error) {
    console.error("Gemini Error:", error);
    if (error instanceof Error) {
      return `⚠️ Could not generate insights: ${error.message}`;
    }
    return "Could not generate insights at this time. Please try again later.";
  }
}