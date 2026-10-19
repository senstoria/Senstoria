import { describe, it } from 'node:test';
import assert from 'node:assert';
import { calculateFairSamplePrice, WaitlistState, SampleOrderState } from './derivedCalculations.ts';

describe('Try It First (Phase 6): Demand Capture & Flagged Ordering Stub', () => {
  it('TRY-01: calculates fair suggested sample decant price including packaging fees', () => {
    const pricePerMl = 6500; // e.g. Rp 325.000 / 50ml
    const price2ml = calculateFairSamplePrice(pricePerMl, 2);
    const price5ml = calculateFairSamplePrice(pricePerMl, 5);
    const price10ml = calculateFairSamplePrice(pricePerMl, 10);

    // 2ml: 13000 + 12000 = 25000
    assert.strictEqual(price2ml, 25000);
    // 5ml: 32500 + 18000 = 50500 -> ceil to 51000
    assert.strictEqual(price5ml, 51000);
    // 10ml: 65000 + 25000 = 90000
    assert.strictEqual(price10ml, 90000);

    assert.ok(price2ml < price5ml);
    assert.ok(price5ml < price10ml);
  });

  it('TRY-01: validates waitlist state data structure and sizes', () => {
    const validEntry: WaitlistState = {
      id: 'wait_123',
      user_id: 'usr_456',
      email: 'kolektor@senstoria.id',
      perfume_id: 'prf_001',
      perfume_name: 'Orgasm',
      brand: 'HMNS',
      size_ml: 5,
      willingness: 'yes',
      fair_price_idr: 45000,
      whatsapp_number: '+628123456789',
      notification_pref: 'whatsapp',
      status: 'active',
      created_at: new Date().toISOString()
    };

    assert.strictEqual(validEntry.size_ml, 5);
    assert.strictEqual(validEntry.willingness, 'yes');
    assert.strictEqual(validEntry.status, 'active');
    assert.ok(validEntry.fair_price_idr > 0);
  });

  it('TRY-02: validates flagged sample order total computation with courier', () => {
    const samplePrice = 45000;
    const shippingJne = 12000;
    const totalOrder = samplePrice + shippingJne;

    const order: SampleOrderState = {
      id: 'ord_1',
      order_number: 'ORD-982142',
      perfume_id: 'prf_001',
      perfume_name: 'Orgasm',
      brand: 'HMNS',
      size_ml: 5,
      sample_price_idr: samplePrice,
      shipping_courier: 'jne',
      shipping_cost_idr: shippingJne,
      total_idr: totalOrder,
      recipient_name: 'Rian Pratama',
      whatsapp_number: '+628123456789',
      shipping_address: 'Jakarta Selatan',
      payment_method: 'qris',
      status: 'confirmed_simulation',
      flag_used: 'try_it_first_ordering',
      created_at: new Date().toISOString()
    };

    assert.strictEqual(order.total_idr, 57000);
    assert.strictEqual(order.flag_used, 'try_it_first_ordering');
    assert.strictEqual(order.status, 'confirmed_simulation');
  });
});
