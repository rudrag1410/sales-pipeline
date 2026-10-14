import { DATASET_SIZE, OWNER_COUNT, STAGE_IDS } from '@/constants/pipeline';
import { generateDeals, generateOwners } from '@/data/seed-data';

describe('seed data', () => {
  it('is deterministic for a given seed and differs across seeds', () => {
    const a = generateDeals(500, 7);
    const b = generateDeals(500, 7);
    const c = generateDeals(500, 8);
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
  });

  it('generates 50,000 valid deals for 20 salespeople', () => {
    const started = performance.now();
    const deals = generateDeals();
    const elapsed = performance.now() - started;
    expect(deals).toHaveLength(DATASET_SIZE);
    expect(new Set(deals.map((d) => d.id)).size).toBe(DATASET_SIZE);
    const owners = new Set(generateOwners().map((o) => o.id));
    expect(owners.size).toBe(OWNER_COUNT);
    for (const deal of deals.slice(0, 5_000)) {
      expect(STAGE_IDS).toContain(deal.stage);
      expect(owners.has(deal.ownerId)).toBe(true);
      expect(deal.valueInr).toBeGreaterThan(0);
      expect(deal.licences).toBeGreaterThan(0);
      expect(deal.version).toBe(1);
    }
    expect(new Set(deals.map((d) => d.ownerId)).size).toBe(OWNER_COUNT);
    expect(elapsed).toBeLessThan(2_000);
  });
});
