import { SkipReason, SortDirection, StageId } from '@/constants/enums';
import { canTransition } from '@/data/deal-rules';
import { planStageChange } from '@/pages/SalesPipelinePage/model/bulk-plan';
import {
  createDefaultViewState,
  fromParams,
  toParams,
} from '@/pages/SalesPipelinePage/model/view-state';
import type { Deal } from '@/types/deal';

describe('stage transitions', () => {
  it('lets open deals move anywhere and restricts closed deals to reopening', () => {
    expect(canTransition(StageId.NewLead, StageId.Lost)).toBe(true);
    expect(canTransition(StageId.Negotiation, StageId.Won)).toBe(true);
    expect(canTransition(StageId.Won, StageId.Lost)).toBe(false);
    expect(canTransition(StageId.Won, StageId.Negotiation)).toBe(true);
    expect(canTransition(StageId.Lost, StageId.Won)).toBe(false);
    expect(canTransition(StageId.Lost, StageId.Contacted)).toBe(true);
  });

  it('plans a bulk move and reports skipped deals with reasons', () => {
    const deal = (id: string, stage: StageId) => ({ id, stage }) as Deal;
    const plan = planStageChange(
      [
        deal('a', StageId.NewLead),
        deal('b', StageId.Won),
        deal('c', StageId.Lost),
        deal('d', StageId.Contacted),
      ],
      StageId.Lost,
    );
    expect(plan.eligible.map((d) => d.id)).toEqual(['a', 'd']);
    expect(plan.skippedByReason).toEqual({
      [SkipReason.AlreadyInStage]: 1,
      [SkipReason.InvalidTransition]: 1,
      [SkipReason.Busy]: 0,
    });
  });
});

describe('view state URL serialisation', () => {
  it('round-trips filters, sort and columns', () => {
    const state = createDefaultViewState();
    const custom = {
      ...state,
      viewId: 'stale',
      hiddenColumns: ['title' as const, 'version' as const],
      query: {
        ...state.query,
        search: 'apex',
        stages: [StageId.Won, StageId.Lost],
        valueMin: 1000,
        staleDays: 30,
        sort: { field: 'valueInr' as const, direction: SortDirection.Asc },
      },
    };
    expect(fromParams(toParams(custom))).toEqual(custom);
  });

  it('leaves the URL empty for the default state', () => {
    const params = toParams(createDefaultViewState());
    expect(params.q).toBeNull();
    expect(params.stage).toBeNull();
    expect(params.view).toBeNull();
    expect(fromParams(params)).toEqual(createDefaultViewState());
  });
});
