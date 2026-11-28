import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { translations } from './i18n';
import {
  APP_VERSION,
  DEFAULT_NOTIFICATION_PREFS,
  DEFAULT_VISIBILITY,
  NOTIFICATION_PREFS_STORAGE_KEY,
  VISIBILITY_STORAGE_KEY,
  initialFromName,
  isNotificationReminder,
  isProfileVisibility,
  loadNotificationPrefs,
  loadVisibility,
  memberSinceYear,
  providerLabel,
  saveNotificationPrefs,
  saveVisibility,
  type NotificationPrefs,
  type SizeStorageLike,
} from './profileN6';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appSrc = readFileSync(path.join(__dirname, '../App.tsx'), 'utf-8');

/** Penyimpanan palsu untuk node:test (localStorage tidak tersedia di sini). */
function fakeStorage(initial: Record<string, string> = {}): SizeStorageLike & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem: (k: string) => (k in data ? data[k] : null),
    setItem: (k: string, v: string) => { data[k] = v; },
  };
}

describe('Fase N6 — Profil / Settings / Bahasa (P1, P10, P12, P13)', () => {
  it('APP_VERSION adalah konstanta versi (G16); package.json masih 0.0.0', () => {
    assert.equal(APP_VERSION, '0.1.0');
    const pkg = JSON.parse(readFileSync(path.join(__dirname, '../../package.json'), 'utf-8')) as { version: string };
    assert.equal(pkg.version, '0.0.0', 'package.json belum punya mekanisme versi — konstanta di profileN6.ts yang dipakai');
  });

  it('Visibilitas default Privat (P13); nilai asing → Privat', () => {
    assert.equal(DEFAULT_VISIBILITY, 'private');
    assert.ok(isProfileVisibility('everyone'));
    assert.ok(isProfileVisibility('members'));
    assert.ok(isProfileVisibility('private'));
    assert.ok(!isProfileVisibility('public'));
    assert.ok(!isProfileVisibility(''));
    assert.equal(loadVisibility(fakeStorage()), 'private');
    assert.equal(loadVisibility(fakeStorage({ [VISIBILITY_STORAGE_KEY]: 'members' })), 'members');
    assert.equal(loadVisibility(fakeStorage({ [VISIBILITY_STORAGE_KEY]: 'semua orang' })), 'private');
  });

  it('load/saveVisibility round-trip', () => {
    const storage = fakeStorage();
    saveVisibility('everyone', storage);
    assert.equal(storage.data[VISIBILITY_STORAGE_KEY], 'everyone');
    assert.equal(loadVisibility(storage), 'everyone');
    saveVisibility('private', storage);
    assert.equal(loadVisibility(storage), 'private');
  });

  it('Preferensi notifikasi default: parfum baru ON, update pesanan OFF, pengingat 1 hari (P12)', () => {
    assert.deepEqual(DEFAULT_NOTIFICATION_PREFS, { newReleases: true, orderUpdates: false, reminder: 'day' });
    assert.ok(isNotificationReminder('week'));
    assert.ok(isNotificationReminder('day'));
    assert.ok(isNotificationReminder('15min'));
    assert.ok(!isNotificationReminder('hour'));
    assert.deepEqual(loadNotificationPrefs(fakeStorage()), DEFAULT_NOTIFICATION_PREFS);
    // JSON rusak → default; field asing → default per field.
    assert.deepEqual(loadNotificationPrefs(fakeStorage({ [NOTIFICATION_PREFS_STORAGE_KEY]: 'bukan json' })), DEFAULT_NOTIFICATION_PREFS);
    assert.deepEqual(
      loadNotificationPrefs(fakeStorage({ [NOTIFICATION_PREFS_STORAGE_KEY]: '{"newReleases":false,"reminder":"week"}' })),
      { newReleases: false, orderUpdates: false, reminder: 'week' }
    );
    // orderUpdates tidak pernah true dari simpanan (S3 belum dibuka).
    assert.deepEqual(
      loadNotificationPrefs(fakeStorage({ [NOTIFICATION_PREFS_STORAGE_KEY]: '{"orderUpdates":true}' })),
      DEFAULT_NOTIFICATION_PREFS
    );
  });

  it('saveNotificationPrefs: orderUpdates selalu disimpan false (S3)', () => {
    const storage = fakeStorage();
    const prefs: NotificationPrefs = { newReleases: false, orderUpdates: true, reminder: '15min' };
    saveNotificationPrefs(prefs, storage);
    assert.equal(
      storage.data[NOTIFICATION_PREFS_STORAGE_KEY],
      '{"newReleases":false,"orderUpdates":false,"reminder":"15min"}'
    );
  });

  it('memberSinceYear: hanya ISO valid dalam rentang wajar; sisanya null (G1 — jangan ditebak)', () => {
    assert.equal(memberSinceYear('2024-03-15T10:00:00.000Z'), 2024);
    assert.equal(memberSinceYear(undefined), null);
    assert.equal(memberSinceYear(null), null);
    assert.equal(memberSinceYear(''), null);
    assert.equal(memberSinceYear('bukan tanggal'), null);
    assert.equal(memberSinceYear('2019-01-01T00:00:00.000Z'), null);
    assert.equal(memberSinceYear('2999-01-01T00:00:00.000Z'), null);
  });

  it('initialFromName: satu huruf pertama, kapital; kosong → ""', () => {
    assert.equal(initialFromName("Ja'far Assegaff"), 'J');
    assert.equal(initialFromName('  sari  '), 'S');
    assert.equal(initialFromName(''), '');
  });

  it('providerLabel: hanya provider Firebase yang dikenal (G12 — hanya tampilkan)', () => {
    assert.equal(providerLabel('google.com'), 'Google');
    assert.equal(providerLabel('apple.com'), 'Apple');
    assert.equal(providerLabel('password'), 'Email');
    assert.equal(providerLabel('facebook.com'), null);
    assert.equal(providerLabel(''), null);
  });

  it('i18n: semua kunci N6 ada di ID + EN, tanpa string kosong', () => {
    const namespaces = {
      profileView: ['title', 'editProfile', 'signIn', 'guestName', 'guestSubtitle', 'memberSince', 'orders', 'scentDna', 'tryItFirst', 'settings', 'inbox', 'inboxSub', 'membership', 'membershipSub', 'visibility', 'about', 'aboutSub', 'shortcutsLabel', 'backToHome'],
      editProfileView: ['title', 'changePhoto', 'photoUnavailable', 'nameLabel', 'emailLabel', 'emailHint', 'save', 'saved', 'backToProfile', 'signInRequired', 'nameRequired'],
      settingsView: ['title', 'email', 'changePassword', 'passwordSent', 'passwordFailed', 'linkedAccounts', 'language', 'privacy', 'privacySub', 'visibility', 'notifications', 'notificationsSub', 'about', 'deleteAccount', 'signOut', 'backToProfile', 'guestEmailSub'],
      languageView: ['title', 'subtitle', 'english', 'indonesian', 'done'],
      inboxView: ['title', 'emptyTitle', 'emptyBody', 'welcomeTitle', 'welcomeSub', 'backToProfile', 'backToInbox', 'articleP1', 'articleP2', 'articleP3', 'articleP4'],
      notificationsView: ['title', 'intro', 'newReleases', 'orderUpdates', 'orderUpdatesNote', 'reminderLabel', 'reminderWeek', 'reminderDay', 'reminderMinutes', 'phoneNote', 'confirm', 'saved', 'backToSettings'],
      visibilityView: ['title', 'intro', 'optionEveryone', 'optionMembers', 'optionPrivate', 'note', 'saved', 'backToSettings'],
      aboutView: ['title', 'versionLabel', 'licenseTitle', 'licenseBody', 'backToSettings'],
      membershipView: ['title', 'statusLabel', 'statusActive', 'emailVerified', 'emailUnverified', 'memberSince', 'backToProfile', 'signInRequired'],
      ordersView: ['title', 'emptyTitle', 'emptyBody', 'exploreCatalog', 'backToProfile'],
      scentDnaView: ['title', 'backToProfile'],
    } as const;
    for (const [ns, keys] of Object.entries(namespaces)) {
      for (const k of keys) {
        const idVal = (translations.id as unknown as Record<string, Record<string, string>>)[ns]?.[k];
        const enVal = (translations.en as unknown as Record<string, Record<string, string>>)[ns]?.[k];
        assert.ok(idVal, `id.${ns}.${k} kosong`);
        assert.ok(enVal, `en.${ns}.${k} kosong`);
      }
    }
    assert.equal(translations.id.profileView.title, 'Profil');
    assert.equal(translations.en.profileView.title, 'Profile');
    assert.equal(translations.id.visibilityView.optionPrivate, 'Privat');
    assert.equal(translations.id.notificationsView.title, 'Preferensi Notifikasi');
    assert.ok(translations.id.nav.profile, 'id.nav.profile kosong');
    assert.ok(translations.en.nav.profile, 'en.nav.profile kosong');
    // Artikel sambutan: 4 paragraf, semuanya dari copy yang sudah ada.
    assert.ok(translations.id.inboxView.articleP1.includes('Perpustakaan Aroma Pribadi'), 'P1 harus dari tagline');
    assert.ok(translations.id.inboxView.articleP2.includes('tanpa klaim berlebihan'), 'P2 harus dari hero subtitle');
    assert.ok(translations.id.inboxView.articleP3.includes('Scent Finder'), 'P3 harus dari 3 langkah');
    assert.ok(translations.id.inboxView.articleP4.includes('privat'), 'P4 harus dari kebijakan privasi');
  });

  it('App: 11 rute N6 terdaftar di map fitur DAN regex parseFeaturePath', () => {
    const routes: [string, string][] = [
      ['profile', '/profile'],
      ['editProfile', '/edit-profile'],
      ['settings', '/settings'],
      ['language', '/language'],
      ['inbox', '/inbox'],
      ['notifications', '/notifications'],
      ['visibility', '/visibility'],
      ['about', '/about'],
      ['membership', '/membership'],
      ['orders', '/orders'],
      ['scentDna', '/scent-dna'],
    ];
    for (const [view, route] of routes) {
      assert.ok(appSrc.includes(`${view}: '${route}'`), `FEATURE_ROUTE_BY_VIEW harus punya ${view}`);
      // Kunci map tanpa tanda kutip bila identifier valid (profile),
      // berkutip bila ada strip ('edit-profile') — terima keduanya.
      const key = route.slice(1);
      assert.ok(
        appSrc.includes(`${key}: '${view}'`) || appSrc.includes(`'${key}': '${view}'`),
        `FEATURE_VIEW_BY_ROUTE harus punya ${route}`
      );
      assert.ok(appSrc.includes(`view === '${view}'`), `App harus me-render layar ${view}`);
    }
    // Pelajaran N5: regex hardcoded harus memuat SEMUA rute baru — tanpa ini
    // deep link jatuh ke Beranda.
    // Fase N8: 'tanya-kurator' ditambahkan setelah 'wishlist' (posisi
    // yang sama dengan FEATURE_ROUTE_BY_VIEW / parseFeaturePath).
    const routeAlternation = 'library|journal|finder|try-it-first|compare|wishlist|tanya-kurator|profile|edit-profile|settings|language|inbox|notifications|visibility|about|membership|orders|scent-dna';
    assert.ok(
      appSrc.includes(`(${routeAlternation})`),
      'regex parseFeaturePath harus memuat semua rute N6'
    );
  });

  it('App: tab Coba Dulu diganti tab Profil; tombol bahasa header dipindah ke Settings', () => {
    assert.ok(appSrc.includes("href=\"/profile\""), 'tab bar + nav desktop harus menaut ke /profile');
    assert.ok(appSrc.includes("t.nav.profile"), 'label tab harus dari nav.profile');
    // Tidak ada lagi tombol bahasa di header (mobile + desktop) — bahasanya
    // pindah ke layar Bahasa lewat Settings (G13).
    assert.ok(!appSrc.includes("setLocale(prev => prev === 'id' ? 'en' : 'id')"), 'header tidak boleh lagi mengganti bahasa langsung');
    assert.ok(appSrc.includes("view === 'language'"), 'penggantian bahasa lewat LanguageView');
  });

  it('App: tab bar sembunyi di layar dalam Profil (D-4), tampil di Profil utama', () => {
    const innerViews = ['editProfile', 'settings', 'language', 'inbox', 'notifications', 'visibility', 'about', 'membership', 'orders', 'scentDna'];
    for (const v of innerViews) {
      assert.ok(appSrc.includes(`view !== '${v}'`), `showTabBar harus menyembunyikan tab bar di ${v}`);
    }
    assert.ok(!appSrc.includes("view !== 'profile'"), 'tab bar TETAP tampil di Profil utama');
  });

  it('ProfileView: tanpa tanggal lahir, tanpa angka karangan', () => {
    const src = readFileSync(path.join(__dirname, '../components/ProfileView.tsx'), 'utf-8');
    assert.ok(!src.toLowerCase().includes('birth'), 'tidak ada field tanggal lahir (keputusan founder 30 Okt 2026)');
    assert.ok(!src.includes('Dummy'), 'tidak ada data dummy');
  });

  it('EditProfileView: "Ganti Foto" tampil + pesan jujur, tanpa upload pura-pura', () => {
    const src = readFileSync(path.join(__dirname, '../components/EditProfileView.tsx'), 'utf-8');
    assert.ok(src.includes('changePhoto'), 'tombol Ganti Foto harus ada (keputusan founder 28 Nov 2026: ditampilkan)');
    assert.ok(src.includes('photoUnavailable'), 'pesan jujur harus ada');
    assert.ok(!src.includes('input type="file"'), 'tidak ada input file pura-pura');
  });

  it('InboxView: tanpa baris waitlist (rules Firestore melarang baca client)', () => {
    const src = readFileSync(path.join(__dirname, '../components/InboxView.tsx'), 'utf-8');
    assert.ok(src.includes('welcomeTitle'), 'baris sambutan harus ada');
    // Tidak ada baris waitlist yang di-render (tanpa testid/prop waitlist);
    // komentar di file mendokumentasikan kenapa: waitlist_entries hanya
    // bisa dibaca admin (firestore.rules).
    assert.ok(!src.includes('inbox-waitlist'), 'tidak ada baris waitlist di Inbox');
    assert.ok(!src.includes('fetchWaitlist'), 'tidak ada fetch waitlist dari client');
    assert.ok(src.includes('hanya mengizinkan baca oleh admin'), 'alasan rules harus terdokumentasi di file');
  });
});
