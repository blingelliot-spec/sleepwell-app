import { GoogleGenAI } from "@google/genai";
import { SleepLog } from "../types";
import { format } from "date-fns";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function getSleepInsights(logs: SleepLog[]) {
  if (logs.length === 0) return "No sleep logs yet. Start tracking to get insights!";

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
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Could not generate insights at this time. Please try again later.";
  }
}
