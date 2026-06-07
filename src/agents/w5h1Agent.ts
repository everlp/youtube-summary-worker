import { LlmAgent } from '@google/adk';

export class W5h1Agent {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  getPrompt(context: string, chapterTitle: string): string {
    return `Here is an article generated from a video transcript:
---
${context}
---

Based on the article above, and specifically focusing on the context of the chapter "${chapterTitle}", provide a 5W1H summary.
Respond ONLY with a valid JSON object in this exact structure (keys must be exactly as shown, values in Simplified Chinese (简体中文)):
{
  "Who": "...",
  "What": "...",
  "When": "...",
  "Where": "...",
  "Why": "...",
  "How": "..."
}`;
  }

  async generate(context: string, chapterTitle: string): Promise<any> {
    const prompt = this.getPrompt(context, chapterTitle);
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${this.apiKey}`;

    const geminiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });

    const data = await geminiRes.json() as any;
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error("Failed to generate 5W1H");
    }

    const cleanText = text.replace(/^```(json)?\\s*/i, '').replace(/```$/i, '').trim();
    return JSON.parse(cleanText);
  }
}
