import { InjectedFailure, ItemErrorKind, SaveStatus, StageId } from '@/constants/enums';
import { generateDeals } from '@/data/seed-data';
import { createServices } from '@/data/services';
import type { Deal } from '@/types/deal';

const setup = (count = 300) => {
  const services = createServices({
    deals: generateDeals(count, 3),
    config: { latencyMinMs: 0, latencyMaxMs: 0, failureRate: 0 },
  });
  const find = (predicate: (deal: Deal) => boolean): Deal => {
    const deal = [...services.store.getDeals().values()].find(predicate);
    if (!deal) throw new Error('fixture deal not found');
    return deal;
  };
  return { ...services, find };
};

describe('DealSaver', () => {
  it('confirms a save with the server version', async () => {
    const { store, saver, find } = setup();
    const deal = find((d) => d.stage === StageId.Contacted);
    const summary = await saver.save([{ dealId: deal.id, patch: { stage: StageId.DemoDone } }]);
    expect(summary).toMatchObject({ saved: 1, failed: 0 });
    expect(store.get(deal.id)).toMatchObject({
      stage: StageId.DemoDone,
      version: deal.version + 1,
    });
    expect(store.getSaveStates().size).toBe(0);
  });

  it('keeps a failed save visible, and retrying it succeeds', async () => {
    const { store, api, saver, find } = setup();
    const deal = find((d) => d.stage === StageId.Contacted);
    api.failNext(InjectedFailure.RequestLost);
    const summary = await saver.save([{ dealId: deal.id, patch: { stage: StageId.Lost } }]);
    expect(summary.failed).toBe(1);
    expect(store.get(deal.id)?.stage).toBe(StageId.Lost);
    expect(store.getSaveStates().get(deal.id)?.status).toBe(SaveStatus.Failed);
    expect((await saver.retry(deal.id)).saved).toBe(1);
    expect(store.get(deal.id)?.version).toBe(deal.version + 1);
  });

  it('treats a retry after a lost response as saved, not as a conflict', async () => {
    const { store, api, saver, find } = setup();
    const deal = find((d) => d.stage === StageId.Contacted);
    api.failNext(InjectedFailure.ResponseLost);
    await saver.save([{ dealId: deal.id, patch: { stage: StageId.Lost } }]);
    expect(store.getSaveStates().get(deal.id)?.status).toBe(SaveStatus.Failed);
    const retried = await saver.retry(deal.id);
    expect(retried).toMatchObject({ saved: 1, conflicts: 0 });
    expect(store.get(deal.id)).toMatchObject({ stage: StageId.Lost, version: deal.version + 1 });
  });

  it('shows a real conflict, and "apply mine" saves on top of the latest version', async () => {
    const { store, api, saver, find } = setup();
    const deal = find((d) => d.stage === StageId.Contacted);
    api.editAsTeammate(deal.id);
    const theirs = await api.update([{ dealId: deal.id, patch: {}, expectedVersion: 99 }]);
    expect(theirs[0]).toMatchObject({ ok: false, kind: ItemErrorKind.Conflict });
    const summary = await saver.save([{ dealId: deal.id, patch: { valueInr: 777_000 } }]);
    expect(summary.conflicts).toBe(1);
    expect(store.getSaveStates().get(deal.id)?.status).toBe(SaveStatus.Conflict);
    await saver.applyMine(deal.id);
    expect(store.get(deal.id)?.valueInr).toBe(777_000);
    expect(store.getSaveStates().size).toBe(0);
  });

  it('refuses an invalid change before sending it and leaves the deal alone', async () => {
    const { store, saver, find } = setup();
    const won = find((d) => d.stage === StageId.Won);
    const summary = await saver.save([{ dealId: won.id, patch: { valueInr: won.valueInr + 1 } }]);
    expect(summary).toMatchObject({ refused: 1, saved: 0 });
    expect(store.get(won.id)).toEqual(won);
    expect(store.getSaveStates().size).toBe(0);
  });

  it('saves a large bulk change in bounded chunks and reports partial failure', async () => {
    const { store, api, saver } = setup(1500);
    const targets = [...store.getDeals().values()]
      .filter((d) => d.stage === StageId.NewLead)
      .slice(0, 220);
    let inFlight = 0;
    let maxInFlight = 0;
    const update = api.update;
    api.update = async (items) => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((resolve) => setTimeout(resolve, 5));
      try {
        return await update(items);
      } finally {
        inFlight -= 1;
      }
    };
    api.failNext(InjectedFailure.RequestLost);
    const summary = await saver.save(
      targets.map((d) => ({ dealId: d.id, patch: { stage: StageId.Lost } })),
    );
    expect(maxInFlight).toBeLessThanOrEqual(3);
    expect(summary.saved + summary.failed).toBe(220);
    expect(summary.failed).toBe(50);
    expect((await saver.retryAllFailed()).saved).toBe(50);
    expect(store.getSaveStates().size).toBe(0);
  });

  it('applies a teammate change quietly and catches up after being offline', () => {
    const { store, api, saver, find } = setup();
    const stop = saver.connect();
    const deal = find((d) => d.stage === StageId.Contacted);
    api.editAsTeammate(deal.id);
    expect(store.get(deal.id)?.version).toBe(deal.version + 1);
    const other = find((d) => d.id !== deal.id && d.stage === StageId.Contacted);
    api.setConfig({ online: false });
    api.editAsTeammate(other.id);
    expect(store.get(other.id)?.version).toBe(other.version);
    api.setConfig({ online: true });
    expect(store.get(other.id)?.version).toBe(other.version + 1);
    stop();
  });
});
