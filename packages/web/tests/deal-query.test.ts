import { SortDirection, StageId } from '@/constants/enums';
import { SEED_REFERENCE_TIME } from '@/constants/pipeline';
import { createDefaultQuery, evaluateQuery, searchHaystack, sortMatches } from '@/data/deal-query';
import { generateDeals } from '@/data/seed-data';

const deals = generateDeals(5_000, 3);
const haystacks = deals.map(searchHaystack);
const run = (patch: Partial<ReturnType<typeof createDefaultQuery>>) =>
  evaluateQuery(deals, { ...createDefaultQuery(), ...patch }, SEED_REFERENCE_TIME, haystacks);

describe('query evaluation', () => {
  it('filters by stage and owner and reports stage counts ignoring the stage filter', () => {
    const owner = deals[0]!.ownerId;
    const all = run({ ownerIds: [owner] });
    const won = run({ ownerIds: [owner], stages: [StageId.Won] });
    expect(
      won.matches.every((i) => deals[i]!.stage === StageId.Won && deals[i]!.ownerId === owner),
    ).toBe(true);
    expect(won.matches.length).toBe(all.byStage.won);
    expect(won.byStage).toEqual(all.byStage);
  });

  it('filters by value range, close date range and search', () => {
    const ranged = run({ valueMin: 100_000, valueMax: 500_000 });
    expect(
      ranged.matches.every((i) => deals[i]!.valueInr >= 100_000 && deals[i]!.valueInr <= 500_000),
    ).toBe(true);
    const dated = run({ closeFrom: '2026-10-20', closeTo: '2026-11-20' });
    expect(
      dated.matches.every(
        (i) =>
          deals[i]!.expectedCloseDate >= '2026-10-20' &&
          deals[i]!.expectedCloseDate <= '2026-11-20',
      ),
    ).toBe(true);
    const target = deals[10]!;
    const searched = run({ search: target.id.toLowerCase() });
    expect(searched.matches).toContain(10);
  });

  it('finds stale deals relative to the server clock', () => {
    const stale = run({ staleDays: 30 });
    const cutoff = SEED_REFERENCE_TIME - 30 * 86_400_000;
    expect(stale.matches.length).toBeGreaterThan(0);
    expect(stale.matches.every((i) => Date.parse(deals[i]!.lastActivityAt) < cutoff)).toBe(true);
  });

  it('sorts stably in both directions', () => {
    const { matches } = run({});
    const asc = sortMatches(deals, [...matches], {
      field: 'valueInr',
      direction: SortDirection.Asc,
    });
    const desc = sortMatches(deals, [...matches], {
      field: 'valueInr',
      direction: SortDirection.Desc,
    });
    for (let i = 1; i < asc.length; i++) {
      expect(deals[asc[i - 1]!]!.valueInr).toBeLessThanOrEqual(deals[asc[i]!]!.valueInr);
      expect(deals[desc[i - 1]!]!.valueInr).toBeGreaterThanOrEqual(deals[desc[i]!]!.valueInr);
    }
  });
});
