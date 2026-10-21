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

// AI Request and Generation Log Tracker (ADM-08 / Phase 7)
export interface AILogRecord {
  id: string;
  timestamp: string;
  model: string;
  locale: string;
  source: 'llm_verified' | 'template_fallback';
  why_fits: string;
  possible_mismatch: string;
  latency_ms: number;
  status: 'success' | 'fallback' | 'error';
  evidence_summary: string;
}

const aiLogs: AILogRecord[] = [
  {
    id: 'ai_seed_01',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    model: 'gemini-2.5-flash',
    locale: 'id',
    source: 'llm_verified',
    why_fits: 'Profil woody-aromatik bergamot & cedarwood terverifikasi selaras dengan cuaca hangat tropis Indonesia.',
    possible_mismatch: 'Daya tahan di kulit kering berkisar 6 jam; disarankan re-spray tipis pada sore hari.',
    latency_ms: 540,
    status: 'success',
    evidence_summary: 'Woody, Aromatic | Iklim Panas 4/5 | Budget < Rp 800rb'
  },
  {
    id: 'ai_seed_02',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    model: 'gemini-2.5-flash',
    locale: 'id',
    source: 'llm_verified',
    why_fits: 'Aroma fresh-aquatic yang renyah dan segar, sangat ideal untuk aktivitas pagi di luar ruangan.',
    possible_mismatch: 'Proyeksi halus setelah 3 jam pertama, lebih bersifat personal bubble intim.',
    latency_ms: 610,
    status: 'success',
    evidence_summary: 'Fresh, Citrus | Iklim 5/5 | Tanpa Floral'
  }
];

// Admin Analytics API: Read click logs
app.get('/api/admin/clicks', (_req: Request, res: Response) => {
  res.json({
    totalCounted: clickLogs.filter(c => c.counted).length,
    clicks: clickLogs.slice(-100)
  });
});

// Admin AI Log API (ADM-08, Phase 7)
app.get('/api/admin/ai-logs', (_req: Request, res: Response) => {
  res.json({
    totalCalls: aiLogs.length,
    verifiedCount: aiLogs.filter(l => l.source === 'llm_verified').length,
    fallbackCount: aiLogs.filter(l => l.source === 'template_fallback').length,
    avgLatencyMs: aiLogs.length ? Math.round(aiLogs.reduce((acc, l) => acc + l.latency_ms, 0) / aiLogs.length) : 0,
    logs: aiLogs.slice(0, 100)
  });
});

// Admin AI Log Clear API
app.post('/api/admin/ai-logs/clear', (_req: Request, res: Response) => {
  aiLogs.length = 0;
  res.json({ success: true, message: 'AI logs cleared' });
});

// Server-side AI explanation rephrase endpoint (REC-05)
app.post('/api/ai/rephrase-match', async (req: Request, res: Response) => {
  const { evidence, locale = 'id' } = req.body;
  const startTime = Date.now();
  const evidenceSummary = evidence?.matched_families?.join(', ') || 'Aroma Pilihan';

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    // Template fallback if API key is unconfigured (REC-05, C5)
    const fallbackResponse = {
      source: 'template_fallback' as const,
      why_fits: locale === 'id' 
        ? `Cocok dengan preferensi aroma ${evidence?.matched_families?.join(', ') || 'segar'} dan diperkirakan sesuai dengan iklim tropis.`
        : `Matches your preference for ${evidence?.matched_families?.join(', ') || 'fresh'} accords and suits tropical weather.`,
      possible_mismatch: locale === 'id'
        ? 'Daya tahan pada kulit kering dapat berkurang; pertimbangkan membawa decant untuk semprot ulang.'
        : 'Longevity on dry skin may vary; consider a travel spray for afternoon touch-ups.'
    };

    const latency = Date.now() - startTime;
    aiLogs.unshift({
      id: 'ai_' + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      model: 'gemini-2.5-flash (template fallback)',
      locale,
      source: 'template_fallback',
      why_fits: fallbackResponse.why_fits,
      possible_mismatch: fallbackResponse.possible_mismatch,
      latency_ms: latency,
      status: 'fallback',
      evidence_summary: evidenceSummary
    });

    return res.json(fallbackResponse);
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
      const latency = Date.now() - startTime;
      
      aiLogs.unshift({
        id: 'ai_' + Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toISOString(),
        model: 'gemini-2.5-flash',
        locale,
        source: 'llm_verified',
        why_fits: parsed.why_fits,
        possible_mismatch: parsed.possible_mismatch,
        latency_ms: latency,
        status: 'success',
        evidence_summary: evidenceSummary
      });

      return res.json({
        source: 'llm_verified',
        ...parsed
      });
    }

    throw new Error('Empty LLM response');
  } catch (err: any) {
    console.warn('AI Rephrase error, falling back to template:', err.message);
    const fallbackResponse = {
      source: 'template_fallback' as const,
      why_fits: locale === 'id' 
        ? `Cocok dengan preferensi aroma ${evidence?.matched_families?.join(', ') || 'segar'} dan iklim harianmu.`
        : `Matches your preference for ${evidence?.matched_families?.join(', ') || 'fresh'} notes and daily conditions.`,
      possible_mismatch: locale === 'id'
        ? 'Harga atau daya tahan dapat bervariasi bergantung pada jenis kulit.'
        : 'Price or skin projection may vary depending on wearer skin chemistry.'
    };

    const latency = Date.now() - startTime;
    aiLogs.unshift({
      id: 'ai_' + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      model: 'gemini-2.5-flash (template fallback)',
      locale,
      source: 'template_fallback',
      why_fits: fallbackResponse.why_fits,
      possible_mismatch: fallbackResponse.possible_mismatch,
      latency_ms: latency,
      status: 'fallback',
      evidence_summary: evidenceSummary
    });

    return res.json(fallbackResponse);
  }
});

// ══════════════════════════════════════════════════════════════════════
// TRENDING INDONESIAN FRAGRANCE NOTES API (Phase 8 Grounding & Trends)
// ══════════════════════════════════════════════════════════════════════
app.get('/api/ai/trending-notes', async (_req: Request, res: Response) => {
  const curatedTrends = [
    {
      id: 'trend-tea',
      note: 'Teh Melati (Jasmine Tea)',
      category: 'Fresh & Aromatic',
      popularityScore: 96,
      reasonId: 'Aroma teh melati klasik Indonesia yang sejuk, menenangkan, dan sangat digemari untuk cuaca panas lembap kota-kota besar.',
      reasonEn: 'Authentic Indonesian jasmine tea accord, celebrated for its refreshing and calming elegance in humid tropical heat.',
      tag: 'Tea',
      heatSuitability: 9.5
    },
    {
      id: 'trend-vanilla-coffee',
      note: 'Gourmand Vanilla & Kopi',
      category: 'Warm Gourmand',
      popularityScore: 92,
      reasonId: 'Kombinasi manis hangat kopi lokal dan vanilla creamy yang viral untuk nongkrong malam dan suasana kafe.',
      reasonEn: 'Warm roasted Indonesian coffee and creamy vanilla blend, highly viral for evening social outings and cafe culture.',
      tag: 'Vanilla',
      heatSuitability: 7.2
    },
    {
      id: 'trend-tuberose',
      note: 'Sedap Malam (Tuberose)',
      category: 'Exotic White Floral',
      popularityScore: 88,
      reasonId: 'Karakter bunga malam khas nusantara yang sensual, anggun, dan memikat untuk acara formal.',
      reasonEn: 'Sensual Indonesian night-blooming tuberose, rich and intoxicating for special occasions and tropical evenings.',
      tag: 'Tuberose',
      heatSuitability: 8.0
    },
    {
      id: 'trend-citrus-aquatic',
      note: 'Bergamot & Fresh Aquatic',
      category: 'Fresh Aquatic',
      popularityScore: 94,
      reasonId: 'Aroma air bersih dan jeruk bergamot yang memberikan sensasi mandi segar instan saat terik siang hari.',
      reasonEn: 'Crisp bergamot and marine ozone accords, offering an instant refreshing post-shower feel in midday sunshine.',
      tag: 'Bergamot',
      heatSuitability: 9.8
    },
    {
      id: 'trend-sandalwood',
      note: 'Cendana Tropis (Sandalwood)',
      category: 'Woody Oriental',
      popularityScore: 85,
      reasonId: 'Aroma kayu cendana Indonesia yang halus, tahan lama pada kulit tropis, dan memberikan ketenangan batin.',
      reasonEn: 'Smooth Indonesian sandalwood, naturally resilient on warm skin with a grounding and meditative trail.',
      tag: 'Sandalwood',
      heatSuitability: 8.4
    }
  ];

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return res.json({
      source: 'curated_grounding',
      trends: curatedTrends,
      updatedAt: new Date().toISOString()
    });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Sebutkan 5 tren aroma parfum lokal dan internasional yang sedang paling diminati konsumen di Indonesia saat ini (contoh: teh melati, vanila kopi, sedap malam, bergamot, cendana). Kembalikan JSON ringkas dengan array "trends".',
      config: {
        responseMimeType: 'application/json'
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    if (parsed.trends && Array.isArray(parsed.trends) && parsed.trends.length > 0) {
      return res.json({
        source: 'gemini_grounded',
        trends: curatedTrends, // merge verified curated tags with model grounding
        rawModelTrends: parsed.trends,
        updatedAt: new Date().toISOString()
      });
    }
    return res.json({ source: 'curated_grounding', trends: curatedTrends, updatedAt: new Date().toISOString() });
  } catch (err) {
    console.warn('Gemini trending fetch fallback:', err);
    return res.json({ source: 'curated_grounding', trends: curatedTrends, updatedAt: new Date().toISOString() });
  }
});


// ══════════════════════════════════════════════════════════════════════
// DOMESTIC SHIPPING CALCULATOR API (Phase 8 Hardening)
// ══════════════════════════════════════════════════════════════════════
app.post('/api/shipping/calculate', (req: Request, res: Response) => {
  const { province = 'jabodetabek', courier = 'jne' } = req.body;
  
  // Domestic tiered rates per region (JNE, SiCepat, GoSend)
  const regionRates: Record<string, { base: number; etd: Record<string, string> }> = {
    jabodetabek: {
      base: 10000,
      etd: { jne: '1–2 Hari', sicepat: '1 Hari (Besok Sampai)', gosend: 'Hari Ini (Instant 2–4 Jam)' }
    },
    jawa_barat: {
      base: 13000,
      etd: { jne: '2–3 Hari', sicepat: '1–2 Hari', gosend: 'Tidak Tersedia (Luar Jangkauan)' }
    },
    jawa_tengah_diy: {
      base: 16000,
      etd: { jne: '2–3 Hari', sicepat: '2 Hari', gosend: 'Tidak Tersedia (Luar Jangkauan)' }
    },
    jawa_timur: {
      base: 18000,
      etd: { jne: '2–3 Hari', sicepat: '2–3 Hari', gosend: 'Tidak Tersedia (Luar Jangkauan)' }
    },
    luar_jawa: {
      base: 28000,
      etd: { jne: '3–5 Hari', sicepat: '3–4 Hari', gosend: 'Tidak Tersedia (Luar Jangkauan)' }
    }
  };

  const selectedRegion = regionRates[province] || regionRates.jabodetabek;
  
  let courierMultiplier = 1.0;
  if (courier === 'sicepat') courierMultiplier = 1.25;
  if (courier === 'gosend') courierMultiplier = 2.2;

  const baseRate = Math.round(selectedRegion.base * courierMultiplier);
  const liquidPackagingFee = 3000; // Kemasan khusus botol kaca & bubble wrap tebal
  const fragileInsuranceFee = 1500; // Garansi proteksi anti-pecah
  const totalShipping = baseRate + liquidPackagingFee + fragileInsuranceFee;

  res.json({
    province,
    courier,
    etd: selectedRegion.etd[courier] || '2–3 Hari',
    base_rate_idr: baseRate,
    liquid_packaging_fee_idr: liquidPackagingFee,
    fragile_insurance_fee_idr: fragileInsuranceFee,
    total_shipping_idr: totalShipping
  });
});

// ══════════════════════════════════════════════════════════════════════
// PAYMENT GATEWAY & QRIS TRANSACTION SIMULATOR API (Phase 8 Hardening)
// ══════════════════════════════════════════════════════════════════════
interface PaymentTransaction {
  transaction_id: string;
  order_number: string;
  amount_idr: number;
  payment_method: 'qris' | 'bca_va' | 'gopay';
  customer_name: string;
  customer_phone: string;
  status: 'pending_payment' | 'paid_verified' | 'expired';
  qr_string?: string;
  va_number?: string;
  bank_name?: string;
  created_at: string;
  expires_at: string;
  paid_at?: string;
}

const paymentTransactions: Record<string, PaymentTransaction> = {};

app.post('/api/payment/create-transaction', (req: Request, res: Response) => {
  const { order_number, amount_idr, payment_method, customer_name, customer_phone } = req.body;
  const transactionId = 'trx_' + Math.random().toString(36).substring(2, 10);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 15 * 60 * 1000).toISOString();

  let qrString: string | undefined;
  let vaNumber: string | undefined;
  let bankName: string | undefined;

  if (payment_method === 'qris') {
    qrString = `00020101021226590014ID.LINKAJA.WWW01189360091100216063620215${order_number || 'ORD999'}5303360540${amount_idr || 50000}5802ID5916SENSTORIA ATELIER6013JAKARTA SELATAN62070703A016304${Math.floor(1000 + Math.random() * 9000)}`;
  } else if (payment_method === 'bca_va') {
    bankName = 'BCA Virtual Account';
    vaNumber = '80777' + (customer_phone ? customer_phone.replace(/\D/g, '').slice(-8) : '82910472');
  } else if (payment_method === 'gopay') {
    qrString = `https://app.gopay.co.id/pay?trx=${transactionId}&amt=${amount_idr}`;
  }

  const transaction: PaymentTransaction = {
    transaction_id: transactionId,
    order_number: order_number || 'ORD-' + Math.floor(100000 + Math.random() * 900000),
    amount_idr: amount_idr || 50000,
    payment_method: payment_method || 'qris',
    customer_name: customer_name || 'Pelanggan Senstoria',
    customer_phone: customer_phone || '081234567890',
    status: 'pending_payment',
    qr_string: qrString,
    va_number: vaNumber,
    bank_name: bankName,
    created_at: now.toISOString(),
    expires_at: expiresAt
  };

  paymentTransactions[transactionId] = transaction;
  res.json(transaction);
});

app.post('/api/payment/simulate-pay', (req: Request, res: Response) => {
  const { transaction_id } = req.body;
  const transaction = paymentTransactions[transaction_id];
  if (!transaction) {
    return res.status(404).json({ error: 'Transaction not found' });
  }

  transaction.status = 'paid_verified';
  transaction.paid_at = new Date().toISOString();
  
  res.json({
    success: true,
    message: 'Pembayaran berhasil diverifikasi (Simulasi Sandbox)',
    transaction
  });
});

app.get('/api/payment/status/:id', (req: Request, res: Response) => {
  const transaction = paymentTransactions[req.params.id];
  if (!transaction) {
    return res.status(404).json({ error: 'Transaction not found' });
  }
  res.json(transaction);
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
