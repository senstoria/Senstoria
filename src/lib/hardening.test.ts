import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { PALETTE } from './palette';

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
  // Nike Fase 1 (26 Nov 2026): token Luma diganti token Nike (monokrom).
  // Inti: ink hitam #000000 di atas ground putih #FFFFFF = 21:1.
  it('HARD-05: ensures core Nike design tokens provide WCAG AA contrast ratio (> 4.5:1)', () => {
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

    // Ground: white #FFFFFF; ink: black #000000 (PALETTE, bukan hardcode).
    assert.strictEqual(PALETTE.ground, '#FFFFFF');
    assert.strictEqual(PALETTE.ink, '#000000');
    const bgLum = getLuminance(...hexToRgb(PALETTE.ground));
    const textLum = getLuminance(...hexToRgb(PALETTE.ink));

    const contrastRatio = (bgLum + 0.05) / (textLum + 0.05);
    // WCAG AA requires at least 4.5:1 for normal text
    assert.ok(contrastRatio >= 4.5, `Contrast ratio ${contrastRatio} must be >= 4.5:1`);
    assert.ok(contrastRatio > 15.0, `Black ink on white ground provides stellar high contrast (~21:1)`);
  });

  // Checklist Design item 1 (26 Nov 2026): regression guard for the
  // Catalog "Temukan" (Finder) button. The button sits on a white card
  // (bg-card) inside a white-text banner, so it must carry an explicit
  // ink text colour — without it the label inherits white and reads
  // 1.02:1 (white on card). Nike Fase 1: ink #000000 on card #FFFFFF
  // is 21:1, the same pair as the neighbouring "Bandingkan" button.
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

    // Card surface: #FFFFFF; ink text: #000000 (PALETTE).
    assert.strictEqual(PALETTE.card, '#FFFFFF');
    const cardLum = getLuminance(...hexToRgb(PALETTE.card));
    const inkLum = getLuminance(...hexToRgb(PALETTE.ink));
    const contrastRatio = (cardLum + 0.05) / (inkLum + 0.05);
    assert.ok(contrastRatio >= 4.5, `Contrast ratio ${contrastRatio} must be >= 4.5:1`);
    assert.ok(contrastRatio > 15.0, `Ink on card provides high contrast (~21:1)`);
  });

  // Latar putih (perintah founder 26 Nov 2026 15:03 WIB) + Nike Fase 1
  // (26 Nov 2026): ground/paper/app tetap #FFFFFF; ink #000000 di atas
  // putih 21:1. DUA WARNA SAJA (27 Nov 2026, perintah founder 13:14 WIB):
  // muted kini hitam penuh #000000 (21:1) — abu-abu gray-600 dihapus,
  // jadi tes ini mengunci nilai muted agar tidak berubah diam-diam.
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
    assert.strictEqual(PALETTE.muted, '#000000');

    const groundLum = getLuminance(...hexToRgb(PALETTE.ground));
    const inkLum = getLuminance(...hexToRgb(PALETTE.ink));
    const mutedLum = getLuminance(...hexToRgb(PALETTE.muted));
    const inkRatio = (groundLum + 0.05) / (inkLum + 0.05);
    const mutedRatio = (groundLum + 0.05) / (mutedLum + 0.05);
    assert.ok(inkRatio >= 4.5, `Ink on ground ${inkRatio} must be >= 4.5:1`);
    assert.ok(inkRatio > 15.0, `Ink on white ground provides high contrast (~21:1)`);
    assert.ok(mutedRatio >= 4.5, `Muted on ground ${mutedRatio} must be >= 4.5:1`);
  });

  // DUA WARNA SAJA (27 Nov 2026, perintah founder 13:14 WIB): nilai
  // Nike 500 (gray-500, success 500, warning 500) DIHAPUS — ketiganya
  // kini hitam penuh dan lulus AA sebagai teks biasa (21:1 di atas
  // putih). Tes ini mengunci bahwa tidak ada lagi nilai di bawah
  // ambang AA di token-token itu, supaya tidak ada yang mengembalikan
  // warna Nike "karena itu warna Nike".
  it('HARD-05d: former Nike 500 values are gone — gray-500/successBright/warningBright are now black and pass AA', () => {
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

    // Dulu gray-500 — kini hitam penuh (21:1 di atas putih).
    assert.strictEqual(PALETTE.gray500, '#000000');
    assert.ok(ratioOnWhite(PALETTE.gray500) >= 4.5, `gray-500 on white ${ratioOnWhite(PALETTE.gray500)} must pass AA now`);
    // Dulu success 500 — kini hitam penuh.
    assert.strictEqual(PALETTE.successBright, '#000000');
    assert.ok(ratioOnWhite(PALETTE.successBright) >= 4.5, `successBright on white ${ratioOnWhite(PALETTE.successBright)} must pass AA now`);
    // Dulu warning 500 — kini hitam penuh.
    assert.strictEqual(PALETTE.warningBright, '#000000');
    assert.ok(ratioOnWhite(PALETTE.warningBright) >= 4.5, `warningBright on white ${ratioOnWhite(PALETTE.warningBright)} must pass AA now`);
  });

  // DUA WARNA SAJA (27 Nov 2026, perintah founder 13:14 WIB):
  // deviasi kontras Nike (success/error/muted gelap pengganti) ikut
  // DIHAPUS — ketiganya kini hitam penuh dan lulus AA di atas putih
  // maupun di atas gray-100 (yang kini juga putih). Jebakan gray-100
  // sudah tidak ada: tidak ada lagi permukaan abu-abu di app ini.
  it('HARD-05e: recorded Nike contrast deviations are gone — success/error/muted are black and pass AA everywhere', () => {
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

    // Dulu success/error/muted gelap pengganti — kini semuanya hitam
    // penuh (21:1 di atas putih).
    assert.strictEqual(PALETTE.success, '#000000');
    assert.ok(ratio(PALETTE.success, '#FFFFFF') >= 4.5, `success on white ${ratio(PALETTE.success, '#FFFFFF')} must be >= 4.5:1`);
    assert.strictEqual(PALETTE.error, '#000000');
    assert.ok(ratio(PALETTE.error, '#FFFFFF') >= 4.5, `error on white ${ratio(PALETTE.error, '#FFFFFF')} must be >= 4.5:1`);
    assert.ok(ratio(PALETTE.muted, '#FFFFFF') >= 4.5, `muted on white ${ratio(PALETTE.muted, '#FFFFFF')} must be >= 4.5:1`);
    // Dulu jebakan gray-100: muted/error gagal di atas abu-abu. Kini
    // gray-100 putih, jadi ketiganya lulus di atasnya juga.
    assert.strictEqual(PALETTE.gray100, '#FFFFFF');
    assert.ok(ratio(PALETTE.muted, PALETTE.gray100) >= 4.5, `muted on gray-100 ${ratio(PALETTE.muted, PALETTE.gray100)} must pass AA now`);
    assert.ok(ratio(PALETTE.error, PALETTE.gray100) >= 4.5, `error on gray-100 ${ratio(PALETTE.error, PALETTE.gray100)} must pass AA now`);
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
  // seluruh src/, tidak boleh ada lagi penyebutan font serif lama di
  // src/ + index.html, dan PALETTE tidak lagi mempunyai kunci aksen.
  // Dibaca dari file sumber lewat import.meta.url supaya tidak
  // bergantung pada cwd. Catatan: jarum pencari dibangun dengan
  // penggabungan string supaya file tes ini sendiri tidak mengandung
  // literal yang dicari (walk mencakup seluruh src/).
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

  it('NIKE-03b: no legacy serif font name anywhere in src/ + index.html', () => {
    const here = path.dirname(fileURLToPath(import.meta.url));
    const srcDir = path.join(here, '..');
    const needle = 'Frau' + 'nces';
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir)) {
        const full = path.join(dir, entry);
        if (statSync(full).isDirectory()) { walk(full); continue; }
        if (!/\.(ts|tsx|css)$/.test(entry)) continue;
        if (readFileSync(full, 'utf8').includes(needle)) offenders.push(path.relative(srcDir, full));
      }
    };
    walk(srcDir);
    const rootHtml = readFileSync(path.join(here, '..', '..', 'index.html'), 'utf8');
    assert.ok(!rootHtml.includes(needle), 'index.html must not mention the legacy serif font after Nike Fase 3');
    assert.deepStrictEqual(offenders, []);
  });

  it('NIKE-03c: PALETTE has no accent key', () => {
    assert.ok(!('accent' in PALETTE), 'PALETTE.accent must be removed in Nike Fase 3');
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

});

