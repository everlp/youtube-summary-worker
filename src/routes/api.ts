import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { fetchYoutubeSubtitles } from '../services/youtubeService';
import { SummaryAgent } from '../agents/summaryAgent';
import { W5h1Agent } from '../agents/w5h1Agent';

type Bindings = {
  GEMINI_API_KEY: string;
  PROXY_LIST?: string;
};

export const apiRouter = new Hono<{ Bindings: Bindings }>();

// In-memory cache for session contexts (used as fallback since this is a quick test project).
// For production Cloudflare Workers, this should be replaced with KV or Durable Objects.
export const sessions = new Map<string, string>();

apiRouter.post('/subtitles', async (c) => {
  const { url, isTest, cookie } = await c.req.json();
  if (!url) {
    return c.json({ error: "Missing YouTube URL" }, 400);
  }

  return streamSSE(c, async (stream) => {
    try {
      const proxyList = c.env.PROXY_LIST;
      
      const onProgress = async (msg: string) => {
        await stream.writeSSE({ data: JSON.stringify({ event: "progress", message: msg }) });
      };

      await onProgress("开始提取字幕...");
      const transcript = await fetchYoutubeSubtitles(url, proxyList, !!isTest, cookie, onProgress);
      
      await stream.writeSSE({ data: JSON.stringify({ event: "done", transcript }) });
    } catch (e: any) {
      await stream.writeSSE({ data: JSON.stringify({ event: "error", error: e.message || "Failed to fetch subtitles" }) });
    } finally {
      await stream.writeSSE({ data: JSON.stringify({ event: "end" }) });
    }
  });
});

apiRouter.post('/generate', async (c) => {
  const { url, promptRequirements, transcript: providedTranscript, isTest } = await c.req.json();

  if (!url) {
    return c.json({ error: "Missing YouTube URL" }, 400);
  }

  const transcript = providedTranscript || await fetchYoutubeSubtitles(url, c.env.PROXY_LIST as string, isTest);
  const sessionId = crypto.randomUUID();
  sessions.set(sessionId, ""); // Initialize empty context

  const apiKey = c.env.GEMINI_API_KEY;
  if (!apiKey) {
    return c.json({ error: "GEMINI_API_KEY is not configured on the server." }, 500);
  }

  const agent = new SummaryAgent(apiKey);
  const prompt = agent.getPrompt(transcript, promptRequirements);
  const geminiUrl = agent.getStreamUrl();

  return streamSSE(c, async (stream) => {
    // Write start event with sessionId
    await stream.writeSSE({ data: JSON.stringify({ event: "session", sessionId }) });

    try {
      const geminiRes = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }]
        })
      });

      if (!geminiRes.ok) {
        await stream.writeSSE({ data: JSON.stringify({ event: "error", message: "Gemini API error: " + geminiRes.status }) });
        return;
      }

      if (geminiRes.body) {
        const reader = geminiRes.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let accumulatedText = "";
        let buffer = "";
        let eventPayload = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || "";
          
          for (let line of lines) {
            line = line.replace(/\r$/, '');
            if (line.startsWith("data: ")) {
              eventPayload += line.slice(6);
            } else if (line === "") {
              if (eventPayload.trim() === "[DONE]") {
                eventPayload = "";
                continue;
              }
              if (eventPayload.trim()) {
                try {
                  const data = JSON.parse(eventPayload);
                  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
                  if (text) {
                    accumulatedText += text;
                    await stream.writeSSE({ data: JSON.stringify({ event: "text", text }) });
                  }
                } catch (e) {
                  console.error("SSE Parse Error. Payload length:", eventPayload.length, "Error:", e);
                }
                eventPayload = "";
              }
            }
          }
        }
        
        // Save the full text to session for 5W1H endpoint to use later
        sessions.set(sessionId, accumulatedText);
      }
    } catch (e) {
      await stream.writeSSE({ data: JSON.stringify({ event: "error", message: "Fetch failed." }) });
    }

    // Write end event
    await stream.writeSSE({ data: JSON.stringify({ event: "end" }) });
  });
});

apiRouter.post('/5w1h', async (c) => {
  const { sessionId, chapterTitle } = await c.req.json();
  const context = sessions.get(sessionId);

  if (!context) {
    return c.json({ error: "Session not found or expired. Context could not be retrieved." }, 404);
  }

  const apiKey = c.env.GEMINI_API_KEY;
  if (!apiKey) {
    return c.json({ error: "GEMINI_API_KEY is not configured." }, 500);
  }

  const agent = new W5h1Agent(apiKey);

  try {
    const json = await agent.generate(context, chapterTitle);
    return c.json(json);
  } catch (e: any) {
    return c.json({ error: e.message || "Invalid JSON from Gemini" }, 500);
  }
});
