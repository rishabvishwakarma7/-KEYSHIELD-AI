import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      mode: 'DEMO',
      aiConfigured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
      note: 'KEYSHIELD AI server reachable. Endpoint telemetry remains in frontend DEMO mode.',
    });
  });

  app.post('/api/soc-analyst', async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      res.status(503).json({
        error:
          'GEMINI_API_KEY is not configured in environment secrets. Switch AI Provider to Demo Output in Settings or configure GEMINI_API_KEY.',
      });
      return;
    }

    const { prompt, contextSummary } = req.body ?? {};
    if (!prompt || typeof prompt !== 'string') {
      res.status(400).json({ error: 'A prompt string is required.' });
      return;
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Analyst Question: ${prompt}\n\nTelemetry Context (DEMO synthetic data):\n${JSON.stringify(contextSummary ?? {}, null, 2)}`,
        config: {
          systemInstruction:
            'You are KEYSHIELD AI SOC Analyst. Analyze only the provided synthetic telemetry context without fabricating evidence. Never claim confirmed keylogging or malicious network exfiltration without corroboration.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              observedEvidence: { type: Type.ARRAY, items: { type: Type.STRING } },
              riskAssessment: { type: Type.STRING },
              mitreContext: { type: Type.STRING },
              recommendedSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
              referencedIds: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      res.json({
        structured: {
          summary: parsed.summary ?? 'Analysis completed.',
          observedEvidence: Array.isArray(parsed.observedEvidence) ? parsed.observedEvidence : [],
          riskAssessment: parsed.riskAssessment ?? 'See evidence above.',
          mitreContext: parsed.mitreContext ?? 'T1056.001 / Telemetry review.',
          recommendedSteps: Array.isArray(parsed.recommendedSteps) ? parsed.recommendedSteps : [],
          referencedIds: Array.isArray(parsed.referencedIds) ? parsed.referencedIds : ['ALT-2041'],
          mode: 'LIVE_GEMINI',
        },
      });
    } catch (err) {
      res.status(502).json({
        error: err instanceof Error ? err.message : 'Failed to query Gemini API.',
      });
    }
  });

  if (process.env.NODE_ENV === 'production') {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`KEYSHIELD AI running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
