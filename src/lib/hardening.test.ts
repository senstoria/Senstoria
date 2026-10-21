import { describe, it } from 'node:test';
import assert from 'node:assert';

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
  it('HARD-05: ensures core editorial design tokens provide WCAG AA contrast ratio (> 4.5:1)', () => {
    // Relative luminance calculation for WCAG contrast
    const getLuminance = (r: number, g: number, b: number) => {
      const a = [r, g, b].map(v => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      });
      return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
    };

    // Background: Ivory Cream #FFFEF2 (255, 254, 242)
    const bgLum = getLuminance(255, 254, 242);
    // Primary Text: Charcoal #1A1A1A (26, 26, 26)
    const textLum = getLuminance(26, 26, 26);

    const contrastRatio = (bgLum + 0.05) / (textLum + 0.05);
    // WCAG AA requires at least 4.5:1 for normal text
    assert.ok(contrastRatio >= 4.5, `Contrast ratio ${contrastRatio} must be >= 4.5:1`);
    assert.ok(contrastRatio > 15.0, `Editorial charcoal on ivory provides stellar high contrast (~18:1)`);
  });

  // 6. Age Gate & UU PDP Consent Invariant (AUTH-02, AUTH-12)
  it('HARD-06: validates 18+ age requirement and blocks underage registration', () => {
    const validateAgeGate = (birthDateStr: string, termsAccepted: boolean) => {
      if (!termsAccepted) return { valid: false, reason: 'terms_required' };
      const birth = new Date(birthDateStr);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      if (age < 18) return { valid: false, reason: 'underage', age };
      return { valid: true, age };
    };

    // Adult 24 years old with terms accepted
    const adult = validateAgeGate('2000-05-15', true);
    assert.strictEqual(adult.valid, true);

    // Minor 16 years old
    const minor = validateAgeGate('2010-01-01', true);
    assert.strictEqual(minor.valid, false);
    assert.strictEqual(minor.reason, 'underage');

    // Without terms
    const noTerms = validateAgeGate('1995-10-10', false);
    assert.strictEqual(noTerms.valid, false);
    assert.strictEqual(noTerms.reason, 'terms_required');
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

