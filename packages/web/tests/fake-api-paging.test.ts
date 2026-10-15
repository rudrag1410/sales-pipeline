import { StageId } from '@/constants/enums';
import { createDefaultQuery } from '@/data/deal-query';
import { generateDeals } from '@/data/seed-data';
import { createServices } from '@/data/services';

const setup = () =>
  createServices({
    deals: generateDeals(450, 3),
    config: { latencyMinMs: 0, latencyMaxMs: 0, failureRate: 0 },
  });

describe('fake server paging', () => {
  it('returns one page with the total, and the summary counts every matching deal', async () => {
    const { api } = setup();
    const query = { ...createDefaultQuery(), stages: [StageId.Won] };
    const page = await api.list({ query, offset: 0, limit: 20 });
    const summary = await api.summary(query);
    expect(page.items.length).toBeLessThanOrEqual(20);
    expect(page.items.every((deal) => deal.stage === StageId.Won)).toBe(true);
    expect(page.total).toBe(summary.total);
    expect(Object.values(summary.byStage).reduce((sum, count) => sum + count, 0)).toBe(450);
  });

  it('keeps pages of one result consistent, and starts a fresh order when page one is requested again', async () => {
    const { api, saver, store } = setup();
    const query = createDefaultQuery();
    const first = await api.list({ query, offset: 0, limit: 100 });
    const target = first.items[5];
    if (!target) throw new Error('fixture deal not found');
    store.merge(first.items);
    await saver.save([
      {
        dealId: target.id,
        patch: { stage: target.stage === StageId.Contacted ? StageId.DemoDone : StageId.Contacted },
      },
    ]);
    const later = await api.list({ query, offset: 100, limit: 100 });
    expect(later.items.some((deal) => first.items.some((seen) => seen.id === deal.id))).toBe(false);
    const fresh = await api.list({ query, offset: 0, limit: 100 });
    expect(fresh.items[0]?.id).toBe(target.id);
  });
});
