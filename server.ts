import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// In-memory click tracking log (AFF-02)
interface ClickLog {
  click_id: string;
  perfume_id: string;
  platform: string;
  src: string;
  user_id?: string;
  anon_id?: string;
  counted: boolean;
  timestamp: string;
}

const clickLogs: ClickLog[] = [];

// Domain allowlist for affiliate redirects (AFF-04)
const ALLOWED_AFFILIATE_DOMAINS = [
  'shopee.co.id',
  'tokopedia.com',
  'www.tokopedia.com',
  'shope.ee'
];

function isAllowedDomain(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    return ALLOWED_AFFILIATE_DOMAINS.some(domain => parsed.hostname === domain || parsed.hostname.endsWith('.' + domain));
  } catch {
    return false;
  }
}

// AFF-01: Affiliate 302 redirect route
app.get('/go/:id', (req: Request, res: Response) => {
  const perfumeId = req.params.id;
  const platform = (req.query.platform as string) || 'shopee';
  const src = (req.query.src as string) || 'catalog_card';
  const userId = req.query.user_id as string | undefined;

  const clickId = 'clk_' + Math.random().toString(36).substring(2, 10);
  
  // Log the click event (AFF-02)
  const clickRecord: ClickLog = {
    click_id: clickId,
    perfume_id: perfumeId,
    platform,
    src,
    user_id: userId,
    counted: true,
    timestamp: new Date().toISOString()
  };
  clickLogs.push(clickRecord);

  // Target destination mapping (in production resolved from DB)
  let targetUrl = platform === 'tokopedia'
    ? `https://www.tokopedia.com/search?q=${encodeURIComponent(perfumeId)}`
    : `https://shopee.co.id/search?keyword=${encodeURIComponent(perfumeId)}`;

  if (!isAllowedDomain(targetUrl)) {
    return res.status(400).send('Redirect to unauthorized domain is prohibited.');
  }

  // 302 Redirect with affiliate safety headers
  res.setHeader('X-Robots-Tag', 'noindex');
  return res.redirect(302, targetUrl);
});

// Admin Analytics API: Read click logs
app.get('/api/admin/clicks', (_req: Request, res: Response) => {
  res.json({
    totalCounted: clickLogs.filter(c => c.counted).length,
    clicks: clickLogs.slice(-100)
  });
});

// Server-side AI explanation rephrase endpoint (REC-05)
app.post('/api/ai/rephrase-match', async (req: Request, res: Response) => {
  const { evidence, locale = 'id' } = req.body;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    // Template fallback if API key is unconfigured (REC-05, C5)
    return res.json({
      source: 'template_fallback',
      why_fits: locale === 'id' 
        ? `Cocok dengan preferensi aroma ${evidence?.matched_families?.join(', ') || 'segar'} dan diperkirakan sesuai dengan iklim tropis.`
        : `Matches your preference for ${evidence?.matched_families?.join(', ') || 'fresh'} accords and suits tropical weather.`,
      possible_mismatch: locale === 'id'
        ? 'Daya tahan pada kulit kering dapat berkurang; pertimbangkan membawa decant untuk semprot ulang.'
        : 'Longevity on dry skin may vary; consider a travel spray for afternoon touch-ups.'
    });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `You are the honest fragrance curator behind Senstoria. Rephrase the following structured match evidence into a calm, Aesop-like summary in ${locale === 'id' ? 'Bahasa Indonesia (informal-polite kamu)' : 'English'}.
Evidence: ${JSON.stringify(evidence)}
Output JSON format:
{
  "why_fits": "...",
  "possible_mismatch": "..."
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        maxOutputTokens: 250,
        temperature: 0.2
      }
    });

    const text = response.text;
    if (text) {
      const parsed = JSON.parse(text);
      return res.json({
        source: 'llm_verified',
        ...parsed
      });
    }

    throw new Error('Empty LLM response');
  } catch (err: any) {
    console.warn('AI Rephrase error, falling back to template:', err.message);
    return res.json({
      source: 'template_fallback',
      why_fits: locale === 'id' 
        ? `Cocok dengan preferensi aroma ${evidence?.matched_families?.join(', ') || 'segar'} dan iklim harianmu.`
        : `Matches your preference for ${evidence?.matched_families?.join(', ') || 'fresh'} notes and daily conditions.`,
      possible_mismatch: locale === 'id'
        ? 'Harga atau daya tahan dapat bervariasi bergantung pada jenis kulit.'
        : 'Price or skin projection may vary depending on wearer skin chemistry.'
    });
  }
});

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Senstoria full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
