import type { Activity, Deal } from '@/types/deal';
import { createRandom, hashString, pick, randomInt } from '@/utils/prng';

const MS_PER_DAY = 86_400_000;
const KINDS: ReadonlyArray<Activity['kind']> = ['call', 'email', 'meeting', 'note'];
const SUMMARIES: Readonly<Record<Activity['kind'], ReadonlyArray<string>>> = {
  call: ['Discovery call with procurement', 'Follow-up call on pricing', 'Check-in with champion'],
  email: ['Sent proposal deck', 'Shared security questionnaire', 'Replied to licensing question'],
  meeting: ['Product demo with stakeholders', 'Executive alignment meeting', 'Technical deep-dive'],
  note: [
    'Budget approved for next quarter',
    'Competitor evaluating in parallel',
    'Legal review requested',
  ],
};

export const activitiesFor = (deal: Deal): ReadonlyArray<Activity> => {
  const random = createRandom(hashString(deal.id));
  let at = Date.parse(deal.lastActivityAt);
  return Array.from({ length: randomInt(random, 3, 6) }, (_, index) => {
    const kind = pick(random, KINDS);
    const activity: Activity = {
      id: `${deal.id}-a${index}`,
      at: new Date(at).toISOString(),
      kind,
      summary: pick(random, SUMMARIES[kind]),
    };
    at -= randomInt(random, 1, 9) * MS_PER_DAY;
    return activity;
  });
};
