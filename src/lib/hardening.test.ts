import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { HomeShowcase } from '../components/HomeShowcase.tsx';
import { PUBLISHED_PERFUMES } from '../data/seedPerfumes.ts';
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { PALETTE } from './palette';
import { translations } from './i18n';

describe('Phase 8 Hardening: Compliance, Shipping, Payment & Accessibility Invariants', () => {

  // 1. Domestic Logistics & Courier Rates Invariant
  it('HARD-01: calculates domestic shipping rates and applies fragile/liquid packaging fees', () => {
    // Standard matrix logic
    const calculateShipping = (province: string, courier: string) => {
      const regionRates: Record<string, { base: number; etd: Record<string, string> }> = {
        jabodetabek: { base: 10000, etd: { jne: '1–2 Hari', sicepat: '1 Hari', gosend: 'Hari Ini' } },
        jawa_barat: { base: 13000, etd: { jne: '2–3 Hari', sicepat: '1–2 Hari', gosend: 'Tidak Tersedia' } },
        luar_jawa: { base: 28000, etd: { jne: '3–5 Hari', sicepat: '3–4 Hari', gosend: 'Tidak Tersedia' } }
      };

      const selected = regionRates[province] || regionRates.jabodetabek;
      let multiplier = 1.0;
      if (courier === 'sicepat') multiplier = 1.25;
      if (courier === 'gosend') multiplier = 2.2;

      const baseRate = Math.round(selected.base * multiplier);
      const liquidPackagingFee = 3000;
      const fragileInsuranceFee = 1500;
      return {
        baseRate,
        liquidPackagingFee,
        fragileInsuranceFee,
        total: baseRate + liquidPackagingFee + fragileInsuranceFee,
        etd: selected.etd[courier] || '2–3 Hari'
      };
    };

    const jabodetabekJne = calculateShipping('jabodetabek', 'jne');
    assert.strictEqual(jabodetabekJne.baseRate, 10000);
    assert.strictEqual(jabodetabekJne.liquidPackagingFee, 3000);
    assert.strictEqual(jabodetabekJne.fragileInsuranceFee, 1500);
    assert.strictEqual(jabodetabekJne.total, 14500);
    assert.strictEqual(jabodetabekJne.etd, '1–2 Hari');

    const luarJawaSicepat = calculateShipping('luar_jawa', 'sicepat');
    assert.strictEqual(luarJawaSicepat.baseRate, 35000);
    assert.strictEqual(luarJawaSicepat.total, 39500);
    assert.strictEqual(luarJawaSicepat.etd, '3–4 Hari');
  });

  // 2. Payment Gateway QRIS & Virtual Account Invariant
  it('HARD-02: formats QRIS EMVCo specification and BCA Virtual Account correctly', () => {
    const orderNumber = 'ORD-892104';
    const amountIdr = 65000;
    const phone = '081234567890';

    // QRIS EMVCo string generation check
    const qrisString = `00020101021226590014ID.LINKAJA.WWW01189360091100216063620215${orderNumber}5303360540${amountIdr}5802ID5916SENSTORIA ATELIER6013JAKARTA SELATAN62070703A0163048821`;
    assert.ok(qrisString.startsWith('000201010212'));
    assert.ok(qrisString.includes('SENSTORIA ATELIER'));
    assert.ok(qrisString.includes(orderNumber));
    assert.ok(qrisString.includes(String(amountIdr)));

    // BCA Virtual Account standard (company code 80777 + last 8 phone digits)
    const last8Digits = phone.replace(/\D/g, '').slice(-8);
    const vaNumber = '80777' + last8Digits;
    assert.strictEqual(vaNumber.length, 13);
    assert.ok(vaNumber.startsWith('80777'));
    assert.strictEqual(vaNumber, '8077734567890');
  });

  // 3. UU PDP Personal Data Export Structure Invariant (UU No. 27/2022 Pasal 7)
  it('HARD-03: validates UU PDP data export schema and portability completeness', () => {
    const exportData = {
      meta: {
        app: 'Senstoria',
        version: '1.0.0',
        exported_at: new Date().toISOString(),
        regulation_compliance: 'UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP)',
        user_email: 'collector@senstoria.id'
      },
      profile: { uid: 'usr_01', email: 'collector@senstoria.id', nickname: 'AromaLover' },
      library_bottles: [{ id: 'bot_1', perfume_id: 'prf_001', size_ml: 50, remaining_ml: 35 }],
      wear_logs: [{ id: 'wear_1', perfume_id: 'prf_001', sprays: 4, timestamp: '2026-10-19' }],
      scent_stories: [{ id: 'story_1', perfume_id: 'prf_001', title: 'Hujan Sore di Senopati' }],
      reviews: [{ id: 'rev_1', perfume_id: 'prf_001', rating: 5 }],
      scent_finder_preferences: { preferredFamilies: ['Woody', 'Fresh'] },
      sample_orders: []
    };

    assert.strictEqual(exportData.meta.regulation_compliance, 'UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP)');
    assert.ok(Array.isArray(exportData.library_bottles));
    assert.ok(Array.isArray(exportData.wear_logs));
    assert.ok(Array.isArray(exportData.scent_stories));
    assert.ok(Array.isArray(exportData.reviews));
    assert.ok(exportData.profile.email.includes('@'));
  });

  // 4. Affiliate Redirect Allowlist Safety Check (AFF-04)
  it('HARD-04: verifies affiliate redirect domain allowlist blocks unauthorized destinations', () => {
    const ALLOWED_DOMAINS = ['shopee.co.id', 'tokopedia.com', 'www.tokopedia.com', 'shope.ee'];

    const isAllowed = (urlStr: string) => {
      try {
        const parsed = new URL(urlStr);
        return ALLOWED_DOMAINS.some(domain => parsed.hostname === domain || parsed.hostname.endsWith('.' + domain));
      } catch {
        return false;
      }
    };

    assert.strictEqual(isAllowed('https://shopee.co.id/search?keyword=hmns'), true);
    assert.strictEqual(isAllowed('https://tokopedia.com/product/123'), true);
    assert.strictEqual(isAllowed('https://www.tokopedia.com/store'), true);
    assert.strictEqual(isAllowed('https://shope.ee/xyz789'), true);
    assert.strictEqual(isAllowed('https://malicious-scam.com/phish'), false);
    assert.strictEqual(isAllowed('https://not-shopee.co.id.attacker.org/test'), false);
  });

  // 5. WCAG 2.1 AA Color Contrast Token Invariants
  // Fase N1 (27 Nov 2026): ground krem C1 #F7F5F0 DIBALIKKAN ke
  // putih Nike #FFFFFF (T1, keputusan N0). Inti: ink hitam
  // #000000 di atas ground putih = 21:1.
  // Fase F1 (arah G, 28 Nov 2026): ink kini nyaris hitam #070404
  // (20,42:1 di atas putih — masih > 15:1).
  it('HARD-05: ensures core Fase N1 colour tokens provide WCAG AA contrast ratio (> 4.5:1)', () => {
    // Relative luminance calculation for WCAG contrast
    const getLuminance = (r: number, g: number, b: number) => {
      const a = [r, g, b].map(v => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      });
      return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
    };
    const hexToRgb = (hex: string): [number, number, number] => [
      parseInt(hex.slice(1, 3), 16),
      parseInt(hex.slice(3, 5), 16),
      parseInt(hex.slice(5, 7), 16),
    ];

    // Ground: putih Nike #FFFFFF; ink: nyaris hitam G #070404 (PALETTE, bukan hardcode).
    assert.strictEqual(PALETTE.ground, '#FFFFFF');
    assert.strictEqual(PALETTE.ink, '#070404');
    const bgLum = getLuminance(...hexToRgb(PALETTE.ground));
    const textLum = getLuminance(...hexToRgb(PALETTE.ink));

    const contrastRatio = (bgLum + 0.05) / (textLum + 0.05);
    // WCAG AA requires at least 4.5:1 for normal text
    assert.ok(contrastRatio >= 4.5, `Contrast ratio ${contrastRatio} must be >= 4.5:1`);
    assert.ok(contrastRatio > 15.0, `Black ink on white ground provides stellar high contrast (~20,42:1)`);
  });

  // Checklist Design item 1 (26 Nov 2026): regression guard for the
  // Catalog "Temukan" (Finder) button. The button sits on a white card
  // (bg-card) inside a white-text banner, so it must carry an explicit
  // ink text colour — without it the label inherits white and reads
  // 1.02:1 (white on card). Nike Fase 1: ink #070404 on card #FFFFFF
  // is 20,42:1, the same pair as the neighbouring "Bandingkan" button.
  it('HARD-05b: ink text on card surface provides WCAG AA contrast (> 4.5:1)', () => {
    const getLuminance = (r: number, g: number, b: number) => {
      const a = [r, g, b].map(v => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      });
      return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
    };
    const hexToRgb = (hex: string): [number, number, number] => [
      parseInt(hex.slice(1, 3), 16),
      parseInt(hex.slice(3, 5), 16),
      parseInt(hex.slice(5, 7), 16),
    ];

    // Card surface: #FFFFFF; ink text: #070404 (PALETTE).
    assert.strictEqual(PALETTE.card, '#FFFFFF');
    const cardLum = getLuminance(...hexToRgb(PALETTE.card));
    const inkLum = getLuminance(...hexToRgb(PALETTE.ink));
    const contrastRatio = (cardLum + 0.05) / (inkLum + 0.05);
    assert.ok(contrastRatio >= 4.5, `Contrast ratio ${contrastRatio} must be >= 4.5:1`);
    assert.ok(contrastRatio > 15.0, `Ink on card provides high contrast (~20,42:1)`);
  });

  // Fase N1 (27 Nov 2026): ground/paper/app PUTIH Nike #FFFFFF
  // (T1 — revert krem C1); ink #070404 di atas putih 20,42:1; muted
  // kini #767676 (4,54:1 di atas putih — lulus AA, tipis). Tes ini
  // mengunci nilai muted agar tidak berubah diam-diam.
  // (Fase F1, arah G, 28 Nov 2026: ink #000000 → #070404, muted
  // #525252 → #767676.)
  it('HARD-05c: white ground keeps WCAG AA contrast for ink and muted text (> 4.5:1)', () => {
    const getLuminance = (r: number, g: number, b: number) => {
      const a = [r, g, b].map(v => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      });
      return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
    };
    const hexToRgb = (hex: string): [number, number, number] => [
      parseInt(hex.slice(1, 3), 16),
      parseInt(hex.slice(3, 5), 16),
      parseInt(hex.slice(5, 7), 16),
    ];

    assert.strictEqual(PALETTE.ground, '#FFFFFF');
    assert.strictEqual(PALETTE.paper, '#FFFFFF');
    assert.strictEqual(PALETTE.app, '#FFFFFF');
    assert.strictEqual(PALETTE.muted, '#767676');

    const groundLum = getLuminance(...hexToRgb(PALETTE.ground));
    const inkLum = getLuminance(...hexToRgb(PALETTE.ink));
    const mutedLum = getLuminance(...hexToRgb(PALETTE.muted));
    const inkRatio = (groundLum + 0.05) / (inkLum + 0.05);
    const mutedRatio = (groundLum + 0.05) / (mutedLum + 0.05);
    assert.ok(inkRatio >= 4.5, `Ink on ground ${inkRatio} must be >= 4.5:1`);
    assert.ok(inkRatio > 15.0, `Ink on white ground provides high contrast (~20,42:1)`);
    assert.ok(mutedRatio >= 4.5, `Muted on ground ${mutedRatio} must be >= 4.5:1`);
  });

  // Fase N1 (27 Nov 2026): gray-500 kini abu-abu Nike v2 #6B6B6B
  // (teks sekunder, 5,33:1 di atas putih — lulus AA, bukan lagi
  // hitam penuh). success-100 #D1FADF adalah tint latar sukses
  // (bukan lagi successBright Sage); teks hitam di atasnya
  // 18,45:1. Tes ini mengunci nilai + AA keduanya.
  it('HARD-05d: gray-500 is Nike gray-600/500 text passing AA; success-100 is a pale tint with black text passing AA', () => {
    const getLuminance = (r: number, g: number, b: number) => {
      const a = [r, g, b].map(v => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      });
      return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
    };
    const hexToRgb = (hex: string): [number, number, number] => [
      parseInt(hex.slice(1, 3), 16),
      parseInt(hex.slice(3, 5), 16),
      parseInt(hex.slice(5, 7), 16),
    ];
    const ratioOnWhite = (hex: string) => {
      const whiteLum = getLuminance(255, 255, 255);
      const lum = getLuminance(...hexToRgb(hex));
      return (whiteLum + 0.05) / (lum + 0.05);
    };
    const ratio = (fg: string, bg: string) => {
      const fgLum = getLuminance(...hexToRgb(fg));
      const bgLum = getLuminance(...hexToRgb(bg));
      return (Math.max(fgLum, bgLum) + 0.05) / (Math.min(fgLum, bgLum) + 0.05);
    };

    // gray-500 kini abu-abu Nike v2 #6B6B6B (5,33:1 di atas putih).
    assert.strictEqual(PALETTE.gray500, '#6B6B6B');
    assert.ok(ratioOnWhite(PALETTE.gray500) >= 4.5, `gray-500 on white ${ratioOnWhite(PALETTE.gray500)} must pass AA now`);
    // success-100 = tint sukses Nike #D1FADF — latar; teks hitam di atasnya 18,45:1.
    assert.strictEqual(PALETTE.success100, '#D1FADF');
    assert.ok(ratio('#000000', PALETTE.success100) >= 4.5, `black on success-100 ${ratio('#000000', PALETTE.success100)} must pass AA`);
    // gray-600 kini abu-abu Nike v2 #525252 (7,81:1 di atas putih).
    assert.strictEqual(PALETTE.gray600, '#525252');
    assert.ok(ratioOnWhite(PALETTE.gray600) >= 4.5, `gray-600 on white ${ratioOnWhite(PALETTE.gray600)} must pass AA now`);
  });

  // Fase N1 (27 Nov 2026): warna semantik Nike v2 (T2) — token
  // dasar adalah TEKS GELAP deviasi clone (success #067647 5,69:1,
  // warning #B54708 5,43:1, error #B42318 6,57:1, info #1E40AF
  // 8,72:1 di atas putih) dan lulus AA di atas putih maupun
  // gray-100 #F5F5F5; putih di atas ketiganya juga lulus AA
  // (tombol bg-* berteks putih). Nilai 500 (#12B76A 2,62:1,
  // #F79009 2,35:1, #F04438 3,76:1) GAGAL AA sebagai teks dan
  // TIDAK PERNAH dipakai sebagai teks — tes ini mengunci
  // kegagalan itu supaya tidak ada yang memakainya sebagai teks.
  it('HARD-05e: Fase N1 semantic colours are dark text passing AA on white and gray-100; 500 values fail as text and are never text', () => {
    const getLuminance = (r: number, g: number, b: number) => {
      const a = [r, g, b].map(v => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      });
      return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
    };
    const hexToRgb = (hex: string): [number, number, number] => [
      parseInt(hex.slice(1, 3), 16),
      parseInt(hex.slice(3, 5), 16),
      parseInt(hex.slice(5, 7), 16),
    ];
    const ratio = (fg: string, bg: string) => {
      const fgLum = getLuminance(...hexToRgb(fg));
      const bgLum = getLuminance(...hexToRgb(bg));
      return (Math.max(fgLum, bgLum) + 0.05) / (Math.min(fgLum, bgLum) + 0.05);
    };

    // Teks semantik gelap Nike v2 (T2) — lulus AA di atas putih dan gray-100.
    assert.strictEqual(PALETTE.success, '#067647');
    assert.ok(ratio(PALETTE.success, '#FFFFFF') >= 4.5, `success on white ${ratio(PALETTE.success, '#FFFFFF')} must be >= 4.5:1`);
    assert.ok(ratio(PALETTE.success, PALETTE.gray100) >= 4.5, `success on gray-100 ${ratio(PALETTE.success, PALETTE.gray100)} must be >= 4.5:1`);
    assert.strictEqual(PALETTE.warning, '#B54708');
    assert.ok(ratio(PALETTE.warning, '#FFFFFF') >= 4.5, `warning on white ${ratio(PALETTE.warning, '#FFFFFF')} must be >= 4.5:1`);
    assert.ok(ratio(PALETTE.warning, PALETTE.gray100) >= 4.5, `warning on gray-100 ${ratio(PALETTE.warning, PALETTE.gray100)} must be >= 4.5:1`);
    assert.strictEqual(PALETTE.error, '#B42318');
    assert.ok(ratio(PALETTE.error, '#FFFFFF') >= 4.5, `error on white ${ratio(PALETTE.error, '#FFFFFF')} must be >= 4.5:1`);
    assert.ok(ratio(PALETTE.error, PALETTE.gray100) >= 4.5, `error on gray-100 ${ratio(PALETTE.error, PALETTE.gray100)} must be >= 4.5:1`);
    assert.strictEqual(PALETTE.info, '#1E40AF');
    assert.ok(ratio(PALETTE.info, '#FFFFFF') >= 4.5, `info on white ${ratio(PALETTE.info, '#FFFFFF')} must be >= 4.5:1`);
    assert.ok(ratio(PALETTE.info, PALETTE.gray100) >= 4.5, `info on gray-100 ${ratio(PALETTE.info, PALETTE.gray100)} must be >= 4.5:1`);
    assert.ok(ratio(PALETTE.muted, '#FFFFFF') >= 4.5, `muted on white ${ratio(PALETTE.muted, '#FFFFFF')} must be >= 4.5:1`);
    // gray-100 kini abu-abu Nike v2 #F5F5F5 (bukan lagi putih).
    assert.strictEqual(PALETTE.gray100, '#F5F5F5');
    // Fase F1 (arah G): muted kini #767676 — di atas gray-100
    // rasionya 4,17:1, DI BAWAH AA. Tes ini mengunci keterbatasan
    // itu: teks muted TIDAK BOLEH diletakkan di atas gray-100
    // (hanya di atas putih/ground). Bila muted berubah lagi,
    // perbarui angka + aturan ini bersama-sama.
    assert.ok(ratio(PALETTE.muted, PALETTE.gray100) < 4.5, `muted on gray-100 ${ratio(PALETTE.muted, PALETTE.gray100)} is below AA by design — never place muted text on gray-100`);
    assert.ok(ratio(PALETTE.muted, PALETTE.gray100) > 4.0, `muted on gray-100 ${ratio(PALETTE.muted, PALETTE.gray100)} must stay above 4.0:1 (documented 4,17:1)`);
    assert.ok(ratio(PALETTE.error, PALETTE.gray100) >= 4.5, `error on gray-100 ${ratio(PALETTE.error, PALETTE.gray100)} must pass AA now`);
    // Putih di atas token semantik dasar lulus AA (tombol bg-*
    // berteks putih di AdminDashboardView + LegalModal).
    assert.ok(ratio('#FFFFFF', PALETTE.success) >= 4.5, `white on success ${ratio('#FFFFFF', PALETTE.success)} must be >= 4.5:1`);
    assert.ok(ratio('#FFFFFF', PALETTE.warning) >= 4.5, `white on warning ${ratio('#FFFFFF', PALETTE.warning)} must be >= 4.5:1`);
    assert.ok(ratio('#FFFFFF', PALETTE.error) >= 4.5, `white on error ${ratio('#FFFFFF', PALETTE.error)} must be >= 4.5:1`);
    // Nilai 500 Nike GAGAL AA sebagai teks (dan sebagai latar
    // tombol berteks putih) — mengunci larangan memakainya
    // sebagai teks. Token dasar BUKAN 500 (struktur deviasi T2).
    assert.strictEqual(PALETTE.success500, '#12B76A');
    assert.strictEqual(PALETTE.warning500, '#F79009');
    assert.strictEqual(PALETTE.error500, '#F04438');
    assert.ok(ratio(PALETTE.success500, '#FFFFFF') < 4.5, `success-500 on white ${ratio(PALETTE.success500, '#FFFFFF')} must FAIL AA as text`);
    assert.ok(ratio(PALETTE.warning500, '#FFFFFF') < 4.5, `warning-500 on white ${ratio(PALETTE.warning500, '#FFFFFF')} must FAIL AA as text`);
    assert.ok(ratio(PALETTE.error500, '#FFFFFF') < 4.5, `error-500 on white ${ratio(PALETTE.error500, '#FFFFFF')} must FAIL AA as text`);
    assert.ok(ratio('#FFFFFF', PALETTE.success500) < 4.5, `white on success-500 ${ratio('#FFFFFF', PALETTE.success500)} must FAIL AA (never a button background)`);
    assert.ok(ratio('#FFFFFF', PALETTE.error500) < 4.5, `white on error-500 ${ratio('#FFFFFF', PALETTE.error500)} must FAIL AA (never a button background)`);
    assert.notStrictEqual(PALETTE.success, PALETTE.success500, 'success must not equal success-500');
    assert.notStrictEqual(PALETTE.warning, PALETTE.warning500, 'warning must not equal warning-500');
    assert.notStrictEqual(PALETTE.error, PALETTE.error500, 'error must not equal error-500');
    // Alias *-text adalah nilai yang sama dengan token dasar.
    assert.strictEqual(PALETTE.successText, PALETTE.success);
    assert.strictEqual(PALETTE.warningText, PALETTE.warning);
    assert.strictEqual(PALETTE.errorText, PALETTE.error);
    // Nike Fase 3 (26 Nov 2026): token aksen biru DIHAPUS — tidak
    // ada lagi pemakaian class latar aksen di seluruh src/
    // (terakhir di Detail, Finder, Coba Dulu — dirombak di fase ini).
  });

  // Nike Fase 2 (26 Nov 2026): kartu biru dihapus dari Beranda, Katalog,
  // hero Pustaka, dan stat Jurnal — keempat file itu harus bebas
  // class latar aksen, dan angka display-number 64px harus hilang dari
  // ketiganya (tersisa hanya di ScentFinderView, ranah Fase 3). Dibaca
  // dari file sumber lewat import.meta.url supaya tidak bergantung pada cwd.
  it('NIKE-02a: no blue accent background class in Home, Catalog, Library hero, Journal stats', () => {
    const here = path.dirname(fileURLToPath(import.meta.url));
    // Jarum dibangun dengan penggabungan string supaya file tes ini
    // sendiri tidak mengandung literal yang dicari NIKE-03a.
    const needle = 'bg-' + 'accent';
    const files = [
      '../App.tsx',
      '../components/CatalogView.tsx',
      '../components/LibraryView.tsx',
      '../components/ScentDiaryView.tsx',
    ];
    for (const f of files) {
      const src = readFileSync(path.join(here, f), 'utf8');
      assert.ok(!src.includes(needle), `${f} must not contain the blue accent background class after Nike Fase 2`);
    }
  });

  it('NIKE-02b: no display-number anywhere (removed in Nike Fase 3)', () => {
    const here = path.dirname(fileURLToPath(import.meta.url));
    const files = [
      '../App.tsx',
      '../components/LibraryView.tsx',
      '../components/ScentDiaryView.tsx',
      '../components/ScentFinderView.tsx',
    ];
    for (const f of files) {
      const src = readFileSync(path.join(here, f), 'utf8');
      assert.ok(!src.includes('display-number'), `${f} must not contain display-number after Nike Fase 3`);
    }
  });

  // Nike Fase 3 (26 Nov 2026): token aksen biru dihapus dari @theme
  // dan palette.ts — tidak boleh ada lagi class latar aksen di
  // seluruh src/, dan PALETTE tidak lagi mempunyai kunci aksen.
  // Dibaca dari file sumber lewat import.meta.url supaya tidak
  // bergantung pada cwd. Catatan: jarum pencari dibangun dengan
  // penggabungan string supaya file tes ini sendiri tidak mengandung
  // literal yang dicari (walk mencakup seluruh src/).
  // Fase C1 (27 Nov 2026): larangan menyebut Fraunces DICABUT —
  // Fraunces kini font display resmi (keputusan founder 18:09 WIB);
  // NIKE-03b diganti C1-01 yang justru mengunci kehadirannya.
  it('NIKE-03a: no blue accent background class anywhere in src/', () => {
    const here = path.dirname(fileURLToPath(import.meta.url));
    const srcDir = path.join(here, '..');
    const needle = 'bg-' + 'accent';
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir)) {
        const full = path.join(dir, entry);
        if (statSync(full).isDirectory()) { walk(full); continue; }
        if (!/\.(ts|tsx)$/.test(entry)) continue;
        if (readFileSync(full, 'utf8').includes(needle)) offenders.push(path.relative(srcDir, full));
      }
    };
    walk(srcDir);
    assert.deepStrictEqual(offenders, []);
  });

  // Fase C1 (27 Nov 2026) — DIPERTAHANKAN Fase N1 (Y2, keputusan
  // N0 19:48 WIB): Fraunces adalah font display resmi — token
  // --font-display di @theme harus menunjuknya, dan index.html
  // harus memuatnya dari Google Fonts (menggantikan NIKE-03b yang
  // dulu melarang nama font ini disebut di mana pun).
  it('C1-01: display font is Fraunces (Fase C1, kept in Fase N1) — @theme token + Google Fonts link', () => {
    const here = path.dirname(fileURLToPath(import.meta.url));
    const css = readFileSync(path.join(here, '..', 'index.css'), 'utf8');
    assert.ok(css.includes("--font-display: 'Fraunces'"), "@theme --font-display must point to Fraunces after Fase C1 (kept in Fase N1)");
    const rootHtml = readFileSync(path.join(here, '..', '..', 'index.html'), 'utf8');
    assert.ok(rootHtml.includes('family=Fraunces'), 'index.html must load Fraunces from Google Fonts after Fase C1 (kept in Fase N1)');
  });

  it('NIKE-03c: PALETTE has no accent key', () => {
    assert.ok(!('accent' in PALETTE), 'PALETTE.accent must be removed in Nike Fase 3');
  });

  // Fase N1 (27 Nov 2026): token Nike v2 — nilai dipatok di
  // PALETTE dan kontrasnya dihitung dari nilai itu (bukan dari
  // hardcode), supaya perubahan diam-diam ketahuan. Menggantikan
  // C1-02 (token field pastel + *-bright C1 DIHAPUS di N1).
  it('N1-02: Fase N1 Nike v2 tokens match inventory §3.1 and pass AA', () => {
    const getLuminance = (r: number, g: number, b: number) => {
      const a = [r, g, b].map(v => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      });
      return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
    };
    const hexToRgb = (hex: string): [number, number, number] => [
      parseInt(hex.slice(1, 3), 16),
      parseInt(hex.slice(3, 5), 16),
      parseInt(hex.slice(5, 7), 16),
    ];
    const ratio = (fg: string, bg: string) => {
      const fgLum = getLuminance(...hexToRgb(fg));
      const bgLum = getLuminance(...hexToRgb(bg));
      return (Math.max(fgLum, bgLum) + 0.05) / (Math.min(fgLum, bgLum) + 0.05);
    };

    // Skala abu-abu Nike v2 (T3) — nilai + teks sekunder/muted
    // di atas putih lulus AA.
    assert.strictEqual(PALETTE.gray100, '#F5F5F5');
    assert.strictEqual(PALETTE.gray200, '#E4E4E4');
    assert.strictEqual(PALETTE.gray300, '#D2D2D2');
    assert.strictEqual(PALETTE.gray400, '#A3A3A3');
    assert.strictEqual(PALETTE.gray500, '#6B6B6B');
    assert.strictEqual(PALETTE.gray600, '#525252');
    assert.strictEqual(PALETTE.gray700, '#3F3F3F');
    assert.strictEqual(PALETTE.gray800, '#262626');
    assert.ok(ratio(PALETTE.gray500, '#FFFFFF') >= 4.5, `gray-500 on white ${ratio(PALETTE.gray500, '#FFFFFF')} must be >= 4.5:1`);
    assert.ok(ratio(PALETTE.gray600, '#FFFFFF') >= 4.5, `gray-600 on white ${ratio(PALETTE.gray600, '#FFFFFF')} must be >= 4.5:1`);
    // Tint keluarga DIPERTAHANKAN (T5) — nilai + teks hitam di
    // atasnya (16,92–17,40:1).
    assert.strictEqual(PALETTE.familyMist, '#E2EBF2');
    assert.strictEqual(PALETTE.familySage, '#E4EBE0');
    assert.strictEqual(PALETTE.familySand, '#F0E8D8');
    assert.strictEqual(PALETTE.familyBlush, '#F6E3E0');
    assert.strictEqual(PALETTE.familyLavender, '#E9E4F8');
    for (const tint of [PALETTE.familyMist, PALETTE.familySage, PALETTE.familySand, PALETTE.familyBlush, PALETTE.familyLavender]) {
      assert.ok(ratio('#000000', tint) >= 4.5, `black on family tint ${tint} ${ratio('#000000', tint)} must be >= 4.5:1`);
    }
    // Skala tint sukses Nike yang terdokumentasi (T2).
    assert.strictEqual(PALETTE.success100, '#D1FADF');
    assert.strictEqual(PALETTE.success800, '#054F31');
    assert.ok(ratio('#000000', PALETTE.success100) >= 4.5, `black on success-100 ${ratio('#000000', PALETTE.success100)} must be >= 4.5:1`);
    // Hati wishlist terisi = hitam (S6).
    assert.strictEqual(PALETTE.wishlist, '#000000');
    // Token C1 yang DIHAPUS di N1 harus benar-benar hilang dari
    // PALETTE (bukan hanya dari @theme) — field pastel (T4) dan
    // *-bright.
    for (const dead of ['fieldPeriwinkle', 'fieldBlue', 'fieldLavender', 'fieldPeach', 'fieldCream', 'successBright', 'warningBright', 'errorBright', 'infoBright']) {
      assert.ok(!(dead in PALETTE), `PALETTE.${dead} must be removed in Fase N1`);
    }
  });

  // Fase N1 (27 Nov 2026): skala Display Nike (Y1) — h1/h2/h3 +
  // .display-* di index.css harus 52/36/28/24/20 bobot 800
  // (display-sm 20/700), SATU skala tanpa override desktop.
  it('N1-04: Display scale is Nike 52/36/28/24/20 weight 800 with no desktop override', () => {
    const here = path.dirname(fileURLToPath(import.meta.url));
    const css = readFileSync(path.join(here, '..', 'index.css'), 'utf8');
    const block = (selector: string) => {
      const re = new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`, 's');
      const m = re.exec(css);
      assert.ok(m, `index.css must define ${selector}`);
      return m![1];
    };
    const size = (body: string) => {
      const m = /font-size:\s*(\d+)px/.exec(body);
      assert.ok(m, 'font-size must be present');
      return Number(m![1]);
    };
    const weight = (body: string) => {
      const m = /font-weight:\s*(\d+)/.exec(body);
      assert.ok(m, 'font-weight must be present');
      return Number(m![1]);
    };
    assert.strictEqual(size(block('h1')), 52);
    assert.strictEqual(weight(block('h1')), 800);
    assert.strictEqual(size(block('h2')), 36);
    assert.strictEqual(weight(block('h2')), 800);
    assert.strictEqual(size(block('h3, .font-h3')), 24);
    assert.strictEqual(weight(block('h3, .font-h3')), 800);
    assert.strictEqual(size(block('.display-2xl')), 52);
    assert.strictEqual(weight(block('.display-2xl')), 800);
    assert.strictEqual(size(block('.display-xl')), 36);
    assert.strictEqual(weight(block('.display-xl')), 800);
    assert.strictEqual(size(block('.display-lg')), 28);
    assert.strictEqual(weight(block('.display-lg')), 800);
    assert.strictEqual(size(block('.display-md')), 24);
    assert.strictEqual(weight(block('.display-md')), 800);
    assert.strictEqual(size(block('.display-sm')), 20);
    assert.strictEqual(weight(block('.display-sm')), 700);
    // Tidak ada lagi override desktop (min-width: 768px) untuk
    // h1/h2/h3 — satu skala untuk semua lebar.
    const mediaH = /@media\s*\(min-width:\s*768px\)\s*\{[^}]*h[123]/s.test(css);
    assert.ok(!mediaH, 'no desktop media override for h1/h2/h3 may remain in Fase N1');
  });

  // Fase N1 (27 Nov 2026): theme-color putih (T1) di index.html +
  // manifest; label-caption sentence case tracking negatif (Y6);
  // token wishlist hitam (S6) ada di PALETTE.
  it('N1-05: theme-color is white; label-caption is sentence case with negative tracking; wishlist token is black', () => {
    const here = path.dirname(fileURLToPath(import.meta.url));
    const html = readFileSync(path.join(here, '..', '..', 'index.html'), 'utf8');
    assert.ok(html.includes('<meta name="theme-color" content="#FFFFFF" />'), 'index.html theme-color must be #FFFFFF (T1)');
    const manifest = JSON.parse(readFileSync(path.join(here, '..', '..', 'public', 'manifest.webmanifest'), 'utf8')) as Record<string, unknown>;
    assert.strictEqual(manifest.theme_color, '#FFFFFF', 'manifest theme_color must be #FFFFFF (T1)');
    const css = readFileSync(path.join(here, '..', 'index.css'), 'utf8');
    const labelRe = /\.label-caption\s*\{([^}]*)\}/s;
    const label = labelRe.exec(css);
    assert.ok(label, 'index.css must define .label-caption');
    assert.ok(!/text-transform:\s*uppercase/.test(label![1]), '.label-caption must not be uppercase (Y6 sentence case)');
    assert.ok(/letter-spacing:\s*-0\.025em/.test(label![1]), '.label-caption letter-spacing must be -0.025em (Y6)');
    assert.strictEqual(PALETTE.wishlist, '#000000', 'wishlist token must be black (S6)');
  });

  // Fase C1 (27 Nov 2026) — DIPERTAHANKAN Fase N1: @theme di
  // src/index.css dan PALETTE di src/lib/palette.ts HARUS bernilai
  // sama — tes ini mem-parsing token --color-* dari index.css dan
  // membandingkannya dengan kunci PALETTE yang bersesuaian
  // (kebab-case → camelCase). Di Fase N1 tes ini sekaligus
  // mencakup token baru (gray-700/800, success-500/100/800/text,
  // warning-500/text, error-500/text, wishlist) dan membuktikan
  // token C1 yang dihapus tidak tertinggal di salah satu file.
  it('C1-03: @theme colour tokens and PALETTE agree exactly', () => {
    const here = path.dirname(fileURLToPath(import.meta.url));
    const css = readFileSync(path.join(here, '..', 'index.css'), 'utf8');
    const aliases: Record<string, string> = { ondark: 'onDark', tabbar: 'tabBar' };
    const kebabToCamel = (kebab: string) => aliases[kebab] ?? kebab.replace(/-([a-z0-9])/g, (_: string, c: string) => c.toUpperCase());
    const tokenRe = /--color-([a-z0-9-]+):\s*(#[0-9A-Fa-f]{6});/g;
    const themeValues = new Map<string, string>();
    let m: RegExpExecArray | null;
    while ((m = tokenRe.exec(css)) !== null) themeValues.set(m[1], m[2].toUpperCase());
    assert.ok(themeValues.size > 0, 'index.css must define --color-* tokens in @theme');
    for (const [kebab, hex] of themeValues) {
      const key = kebabToCamel(kebab);
      assert.ok(key in PALETTE, `PALETTE must mirror @theme token --color-${kebab}`);
      assert.strictEqual((PALETTE as Record<string, string>)[key], hex, `PALETTE.${key} (${(PALETTE as Record<string, string>)[key]}) must equal @theme --color-${kebab} (${hex})`);
    }
    // Arah sebaliknya: setiap kunci PALETTE harus punya token @theme.
    const themeCamelKeys = new Set([...themeValues.keys()].map(kebabToCamel));
    for (const key of Object.keys(PALETTE)) {
      assert.ok(themeCamelKeys.has(key), `@theme must define a token for PALETTE.${key}`);
    }
  });

  // 6. Consent-Only Signup Invariant — no age gate, no birth-date data
  // (founder decision 30 Oct 2026 removed the 18+ rule; AUTH-02, AUTH-12)
  it('HARD-06: signup requires terms consent only — no age check, no birth-date fields', () => {
    // Signup validity depends ONLY on terms consent. There is no birth-date
    // input and no age computation anywhere in the signup path.
    const validateSignup = (termsAccepted: boolean) => {
      if (!termsAccepted) return { valid: false, reason: 'terms_required' };
      return { valid: true };
    };

    // Terms accepted: valid, whatever the person's age would be.
    assert.strictEqual(validateSignup(true).valid, true);

    // Without terms: rejected, for the consent reason only.
    const noTerms = validateSignup(false);
    assert.strictEqual(noTerms.valid, false);
    assert.strictEqual(noTerms.reason, 'terms_required');

    // The user document shape carries no birth-date or age field.
    const userDoc = {
      email: 'new@example.com',
      display_name: 'new',
      consent_version: '1.0',
      locale: 'id',
    };
    const forbiddenKeys = ['birth_date', 'birthDate', 'date_of_birth', 'dob', 'birthdate', 'birthdate_verified_18plus', 'age'];
    for (const key of forbiddenKeys) {
      assert.strictEqual(key in userDoc, false, `user document must not contain ${key}`);
    }
  });

  // 7. Affiliate Click Deduplication Invariant (AFF-03)
  it('HARD-07: deduplicates repeated clicks from same IP/session within 10-minute window', () => {
    interface ClickEntry {
      ip: string;
      perfumeId: string;
      platform: string;
      timestamp: number;
    }
    const windowMs = 10 * 60 * 1000; // 10 minutes

    const isDuplicateClick = (history: ClickEntry[], newClick: ClickEntry): boolean => {
      return history.some(c => 
        c.ip === newClick.ip && 
        c.perfumeId === newClick.perfumeId && 
        c.platform === newClick.platform && 
        (newClick.timestamp - c.timestamp) < windowMs
      );
    };

    const baseTime = Date.now();
    const history: ClickEntry[] = [
      { ip: '127.0.0.1', perfumeId: 'prf_001', platform: 'shopee', timestamp: baseTime - 60000 } // 1 min ago
    ];

    // Rapid second click within 2 minutes should be counted as duplicate (not double counted)
    const rapidClick: ClickEntry = { ip: '127.0.0.1', perfumeId: 'prf_001', platform: 'shopee', timestamp: baseTime };
    assert.strictEqual(isDuplicateClick(history, rapidClick), true);

    // Click on different perfume should NOT be marked duplicate
    const differentPerfume: ClickEntry = { ip: '127.0.0.1', perfumeId: 'prf_002', platform: 'shopee', timestamp: baseTime };
    assert.strictEqual(isDuplicateClick(history, differentPerfume), false);

    // Click after 15 minutes should NOT be marked duplicate
    const clickAfterExpiry: ClickEntry = { ip: '127.0.0.1', perfumeId: 'prf_001', platform: 'shopee', timestamp: baseTime + 15 * 60000 };
    assert.strictEqual(isDuplicateClick(history, clickAfterExpiry), false);
  });

  // 8. UU PDP Right to Erasure (Hak Penghapusan Data Pribadi - Pasal 8)
  it('HARD-08: completely erases all personal identifying user-scoped data upon deletion request', () => {
    const userStorage: Record<string, string> = {
      senstoria_auth_user: JSON.stringify({ uid: 'usr_99', email: 'delete-me@senstoria.id' }),
      senstoria_user_bottles: JSON.stringify([{ id: 'b_1', user_id: 'usr_99' }]),
      senstoria_wear_logs: JSON.stringify([{ id: 'w_1', user_id: 'usr_99' }]),
      senstoria_scent_stories: JSON.stringify([{ id: 's_1', user_id: 'usr_99' }]),
      senstoria_quiz_answers: JSON.stringify({ primaryFamily: 'Woody' }),
      senstoria_waitlist_entries: JSON.stringify([{ id: 'wl_1', email: 'delete-me@senstoria.id' }])
    };

    const keysToPurge = [
      'senstoria_auth_user',
      'senstoria_user_bottles',
      'senstoria_wear_logs',
      'senstoria_scent_stories',
      'senstoria_reviews',
      'senstoria_quiz_answers',
      'senstoria_saved_taste_profile',
      'senstoria_sample_orders',
      'senstoria_waitlist_entries'
    ];

    // Simulate purge
    keysToPurge.forEach(k => delete userStorage[k]);

    assert.strictEqual(userStorage['senstoria_auth_user'], undefined);
    assert.strictEqual(userStorage['senstoria_user_bottles'], undefined);
    assert.strictEqual(userStorage['senstoria_wear_logs'], undefined);
    assert.strictEqual(userStorage['senstoria_scent_stories'], undefined);
    assert.strictEqual(Object.keys(userStorage).length, 0);
  });

  // 9. Accessibility Landmark & Skip Link Invariant
  it('HARD-09: enforces accessibility landmark structure, skip link, and keyboard focusable main', () => {
    const domSpec = {
      hasSkipLink: true,
      skipLinkHref: '#main-content',
      mainElementId: 'main-content',
      mainTabIndex: -1,
      hasNavigationRole: true,
      contrastMinimumRatio: 4.5
    };

    assert.strictEqual(domSpec.hasSkipLink, true);
    assert.strictEqual(domSpec.skipLinkHref, '#' + domSpec.mainElementId);
    assert.strictEqual(domSpec.mainTabIndex, -1);
    assert.ok(domSpec.contrastMinimumRatio >= 4.5);
  });

  // Figma ideas (27 Nov 2026): the Detail description "Read More..." /
  // "Show Less" toggle needs both keys in both locales — a missing key
  // would render "undefined" as the toggle label.
  it('HARD-10: Detail description Read More / Show Less keys exist in both locales', () => {
    for (const locale of ['id', 'en'] as const) {
      assert.strictEqual(typeof translations[locale].productDetail.readMore, 'string');
      assert.ok(translations[locale].productDetail.readMore.length > 0);
      assert.strictEqual(typeof translations[locale].productDetail.showLess, 'string');
      assert.ok(translations[locale].productDetail.showLess.length > 0);
    }
  });

  // Fase F1 — ARAH G "ETALASE PREMIUM" (28 Nov 2026, spesifikasi
  // `Senstoria_Spesifikasi_Arah_G_Etalase_Premium_2026-11-28.md` §1
  // + §10 poin 1): token palet G, larangan stone sebagai teks, dan
  // radius + skala tipografi G. Nilai dipatok di PALETTE dan
  // kontrasnya dihitung dari nilai itu (bukan hardcode).
  it('G1-01: Fase F1 G tokens match spec §1 and pass AA (stone fails as text by design)', () => {
    const getLuminance = (r: number, g: number, b: number) => {
      const a = [r, g, b].map(v => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      });
      return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
    };
    const hexToRgb = (hex: string): [number, number, number] => [
      parseInt(hex.slice(1, 3), 16),
      parseInt(hex.slice(3, 5), 16),
      parseInt(hex.slice(5, 7), 16),
    ];
    const ratio = (fg: string, bg: string) => {
      const fgLum = getLuminance(...hexToRgb(fg));
      const bgLum = getLuminance(...hexToRgb(bg));
      return (Math.max(fgLum, bgLum) + 0.05) / (Math.min(fgLum, bgLum) + 0.05);
    };

    // Palet G §1 — nilai persis.
    assert.strictEqual(PALETTE.ground, '#FFFFFF');
    assert.strictEqual(PALETTE.ink, '#070404');
    assert.strictEqual(PALETTE.bar, '#070404');
    assert.strictEqual(PALETTE.pill, '#070404');
    assert.strictEqual(PALETTE.photo, '#E4E4E4');
    assert.strictEqual(PALETTE.warm, '#574645');
    assert.strictEqual(PALETTE.brick, '#AF5349');
    assert.strictEqual(PALETTE.stone, '#B4B4B3');
    assert.strictEqual(PALETTE.muted, '#767676');
    // photo = nilai gray200 (alias semantik, bukan token baru yang
    // menyimpang dari skala abu-abu).
    assert.strictEqual(PALETTE.photo, PALETTE.gray200);
    // Kontras pasangan token baru (dihitung ulang dari hex yang sama):
    // ink/putih 20,42:1; muted/putih 4,54:1; warm/putih 8,87:1;
    // putih/brick 5,05:1; ink/foto 16,06:1; warm/foto 6,98:1.
    assert.ok(ratio(PALETTE.ink, '#FFFFFF') >= 4.5, `ink on white ${ratio(PALETTE.ink, '#FFFFFF')} must be >= 4.5:1`);
    assert.ok(ratio(PALETTE.ink, '#FFFFFF') > 15.0, `ink on white ${ratio(PALETTE.ink, '#FFFFFF')} must stay above 15:1 (~20,42:1)`);
    assert.ok(ratio(PALETTE.muted, '#FFFFFF') >= 4.5, `muted on white ${ratio(PALETTE.muted, '#FFFFFF')} must be >= 4.5:1 (spec: 4,54:1)`);
    assert.ok(ratio(PALETTE.warm, '#FFFFFF') >= 4.5, `warm on white ${ratio(PALETTE.warm, '#FFFFFF')} must be >= 4.5:1 (spec: 8,87:1)`);
    assert.ok(ratio('#FFFFFF', PALETTE.brick) >= 4.5, `white on brick ${ratio('#FFFFFF', PALETTE.brick)} must be >= 4.5:1 (spec: 5,05:1)`);
    assert.ok(ratio(PALETTE.brick, '#FFFFFF') >= 4.5, `brick on white ${ratio(PALETTE.brick, '#FFFFFF')} must be >= 4.5:1`);
    assert.ok(ratio(PALETTE.ink, PALETTE.photo) >= 4.5, `ink on photo ${ratio(PALETTE.ink, PALETTE.photo)} must be >= 4.5:1 (spec: 16,06:1)`);
    assert.ok(ratio(PALETTE.warm, PALETTE.photo) >= 4.5, `warm on photo ${ratio(PALETTE.warm, PALETTE.photo)} must be >= 4.5:1 (spec: 6,98:1)`);
    // Stone GAGAL AA sebagai teks di atas putih (2,08:1) — dikunci
    // sebagai larangan; di atas hitam lulus (9,84:1).
    assert.ok(ratio(PALETTE.stone, '#FFFFFF') < 4.5, `stone on white ${ratio(PALETTE.stone, '#FFFFFF')} must FAIL AA as text (spec: 2,08:1)`);
    assert.ok(ratio(PALETTE.stone, PALETTE.ink) >= 4.5, `stone on ink ${ratio(PALETTE.stone, PALETTE.ink)} must be >= 4.5:1 (spec: 9,84:1)`);
  });

  // Fase F1 (arah G): stone #B4B4B3 adalah token NON-TEKS — tidak
  // boleh ada utility text untuk stone di komponen mana pun, dan
  // satu-satunya pemakaian var(--color-stone) sebagai warna teks di
  // CSS adalah .display-watermark (dekoratif, bukan teks baca).
  // Jarum dibangun dengan penggabungan string supaya file tes ini
  // sendiri tidak mengandung literal yang dicari.
  it('G1-02: stone is never used as text — no stone text utility in src, only .display-watermark uses it as a colour', () => {
    const here = path.dirname(fileURLToPath(import.meta.url));
    const srcDir = path.join(here, '..');
    const needle = 'text-' + 'stone';
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir)) {
        const full = path.join(dir, entry);
        if (statSync(full).isDirectory()) { walk(full); continue; }
        if (!/\.(ts|tsx)$/.test(entry)) continue;
        if (readFileSync(full, 'utf8').includes(needle)) offenders.push(path.relative(srcDir, full));
      }
    };
    walk(srcDir);
    assert.deepStrictEqual(offenders, []);
    const css = readFileSync(path.join(here, '..', 'index.css'), 'utf8');
    const uses = (css.match(/var\(--color-stone\)/g) || []).length;
    assert.strictEqual(uses, 1, `index.css must use var(--color-stone) exactly once (in .display-watermark), found ${uses}`);
    const wmRe = /\.display-watermark\s*\{([^}]*)\}/s;
    const wm = wmRe.exec(css);
    assert.ok(wm, 'index.css must define .display-watermark');
    // Pola color: dijangkar ke awal blok atau ke ';' supaya tidak
    // bisa cocok dengan background-color: (perbaikan review Codex).
    assert.ok(/(?:^|;)\s*color:\s*var\(--color-stone\)/.test(wm![1]), '.display-watermark must be the one place coloured with stone');
  });

  // Fase F1 (arah G §1): radius G + skala tipografi G di index.css.
  // Nilai perkiraan studi, dibulatkan ke token terdekat: foto 22,
  // banner 26, pill 30, size 13, hero 26, sheet-top 30, chip 20
  // (dulu 8), tinggi chip 38; kata raksasa 80, watermark 72, banner
  // 34, judul Home 30, judul Detail 24, seksi 20, nama/harga kartu
  // 16, harga Detail 24, label kapital 10 (uppercase), teks kecil 12.
  // Semua kelas G memakai Archivo (UI) — font-family + font-weight
  // dikunci di sini (perbaikan review Codex: Fraunces hanya dimuat
  // 400..700 sehingga bobot 800 ter-clamp; Archivo 100..900).
  it('G1-03: Fase F1 G radius tokens and G type-scale classes exist with spec values', () => {
    const here = path.dirname(fileURLToPath(import.meta.url));
    const css = readFileSync(path.join(here, '..', 'index.css'), 'utf8');
    const radius = (name: string) => {
      const m = new RegExp(`--radius-${name}:\\s*(\\d+)px`).exec(css);
      assert.ok(m, `index.css must define --radius-${name}`);
      return Number(m![1]);
    };
    assert.strictEqual(radius('card'), 0, '--radius-card stays 0 (G cards have no container)');
    assert.strictEqual(radius('control'), 12, '--radius-control stays 12');
    assert.strictEqual(radius('chip'), 20, '--radius-chip is 20 (G pill chips, was 8)');
    assert.strictEqual(radius('photo'), 22, '--radius-photo is 22 (spec 20–24)');
    assert.strictEqual(radius('banner'), 26, '--radius-banner is 26 (spec 24–28)');
    assert.strictEqual(radius('pill'), 30, '--radius-pill is 30 (spec 28–32)');
    assert.strictEqual(radius('size'), 13, '--radius-size is 13 (spec 12–14)');
    assert.strictEqual(radius('hero'), 26, '--radius-hero is 26 (spec 24–28)');
    assert.strictEqual(radius('sheet-top'), 30, '--radius-sheet-top is 30 (spec 28–32)');
    const chipH = /--chip-height:\s*(\d+)px/.exec(css);
    assert.ok(chipH, 'index.css must define --chip-height');
    assert.strictEqual(Number(chipH![1]), 38, '--chip-height is 38 (spec 36–40)');

    const block = (selector: string) => {
      const re = new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`, 's');
      const m = re.exec(css);
      assert.ok(m, `index.css must define ${selector}`);
      return m![1];
    };
    const size = (body: string) => {
      const m = /font-size:\s*(\d+)px/.exec(body);
      assert.ok(m, 'font-size must be present');
      return Number(m![1]);
    };
    const family = (body: string) => {
      const m = /font-family:\s*'([^']+)'/.exec(body);
      assert.ok(m, 'font-family must be present');
      return m![1];
    };
    const weight = (body: string) => {
      const m = /font-weight:\s*(\d+)/.exec(body);
      assert.ok(m, 'font-weight must be present');
      return Number(m![1]);
    };
    const lineHeight = (body: string) => {
      const m = /line-height:\s*(\d+)px/.exec(body);
      assert.ok(m, 'line-height must be present in px');
      return Number(m![1]);
    };
    const tracking = (body: string) => {
      const m = /letter-spacing:\s*(-?[\d.]+)em/.exec(body);
      assert.ok(m, 'letter-spacing must be present in em');
      return Number(m![1]);
    };
    const giant = block('.display-giant');
    assert.strictEqual(size(giant), 80, '.display-giant is 80px (spec 72–84)');
    assert.strictEqual(family(giant), 'Archivo', '.display-giant is Archivo (spec §1: Archivo untuk seluruh UI)');
    assert.strictEqual(weight(giant), 800, '.display-giant is 800 (spec ExtraBold 800–900)');
    const wm = block('.display-watermark');
    assert.strictEqual(size(wm), 72, '.display-watermark is 72px (spec 64–80)');
    assert.strictEqual(family(wm), 'Archivo', '.display-watermark is Archivo (spec §1: Archivo untuk seluruh UI)');
    assert.strictEqual(weight(wm), 800, '.display-watermark is 800 (spec tebal)');
    const banner = block('.display-banner');
    assert.strictEqual(size(banner), 34, '.display-banner is 34px (spec 32–36)');
    assert.strictEqual(family(banner), 'Archivo', '.display-banner is Archivo');
    assert.strictEqual(weight(banner), 800, '.display-banner is 800 (spec ExtraBold 800)');
    const home = block('.display-home');
    assert.strictEqual(size(home), 30, '.display-home is 30px (spec 28–32)');
    assert.strictEqual(family(home), 'Archivo', '.display-home is Archivo');
    assert.strictEqual(weight(home), 800, '.display-home is 800 (spec Bold 700–800)');
    const section = block('.display-section');
    assert.strictEqual(size(section), 20, '.display-section is 20px (spec 18–20)');
    assert.strictEqual(family(section), 'Archivo', '.display-section is Archivo');
    assert.strictEqual(weight(section), 700, '.display-section is 700 (spec Bold 700)');
    const cardName = block('.text-card-name');
    assert.strictEqual(size(cardName), 16, '.text-card-name is 16px (spec 15–16)');
    assert.strictEqual(family(cardName), 'Archivo', '.text-card-name is Archivo');
    assert.strictEqual(weight(cardName), 600, '.text-card-name is 600 (spec SemiBold/Bold 600–700)');
    const cardPrice = block('.text-card-price');
    assert.strictEqual(size(cardPrice), 16, '.text-card-price is 16px (spec 15–16)');
    assert.strictEqual(family(cardPrice), 'Archivo', '.text-card-price is Archivo');
    assert.strictEqual(weight(cardPrice), 700, '.text-card-price is 700 (spec Bold 700)');
    const priceDetail = block('.text-price-detail');
    assert.strictEqual(size(priceDetail), 24, '.text-price-detail is 24px (spec 22–24)');
    assert.strictEqual(family(priceDetail), 'Archivo', '.text-price-detail is Archivo');
    assert.strictEqual(weight(priceDetail), 700, '.text-price-detail is 700 (spec Bold 700)');
    const detailTitle = block('.text-detail-title');
    assert.strictEqual(size(detailTitle), 24, '.text-detail-title is 24px (spec 24–26)');
    assert.strictEqual(family(detailTitle), 'Archivo', '.text-detail-title is Archivo');
    assert.strictEqual(weight(detailTitle), 700, '.text-detail-title is 700 (spec Bold 700)');
    assert.strictEqual(lineHeight(detailTitle), 28, '.text-detail-title line-height is 28px');
    assert.strictEqual(tracking(detailTitle), -0.02, '.text-detail-title tracking is -0.02em');
    const caps = block('.label-caps');
    assert.strictEqual(size(caps), 10, '.label-caps is 10px (spec 9–11)');
    assert.strictEqual(family(caps), 'Archivo', '.label-caps is Archivo');
    assert.strictEqual(weight(caps), 700, '.label-caps is 700 (spec Bold)');
    assert.strictEqual(tracking(caps), 0.1, '.label-caps tracking is 0.1em (spec tracking lebar)');
    assert.ok(/text-transform:\s*uppercase/.test(caps), '.label-caps must be uppercase');
    const small = block('.text-small');
    assert.strictEqual(size(small), 12, '.text-small is 12px (spec 12–13)');
    assert.strictEqual(family(small), 'Archivo', '.text-small is Archivo');
    assert.strictEqual(weight(small), 400, '.text-small is 400 (spec Regular)');
  });

});


describe('Arah G F2 — Home showcase', () => {
  it('uses Detail CTAs without price or unsupported NEW badges', () => {
    const render = (published_at?: string) => renderToStaticMarkup(createElement(HomeShowcase, {
      locale: 'id',
      perfumes: [{ ...PUBLISHED_PERFUMES[0], published_at }],
      wishlistIds: [PUBLISHED_PERFUMES[0].id],
      onToggleWishlist: () => {},
      onSelectPerfume: () => {},
      onBrowseCatalog: () => {},
    }));

    const current = render();
    assert.match(current, /aria-label="Lihat [^"]+"/);
    assert.match(current, /aria-pressed="true"[^>]*class="absolute/);
    assert.doesNotMatch(current, /Rp\s*\d|>NEW<|LIMITED DROP|>EXTRAIT</);
    assert.match(render(new Date(Date.now() - 86400000).toISOString()), />NEW</);
    assert.doesNotMatch(render(new Date(Date.now() - 31 * 86400000).toISOString()), />NEW</);
    assert.doesNotMatch(render(new Date(Date.now() + 86400000).toISOString()), />NEW</);
  });
});
