import { en, en_IN, Faker } from '@faker-js/faker';

import { StageId } from '@/constants/enums';
import {
  DATASET_SIZE,
  DEFAULT_SEED,
  MS_PER_DAY,
  OWNER_COUNT,
  SEED_REFERENCE_TIME,
} from '@/constants/pipeline';
import type { Deal, Owner } from '@/types/deal';

const INDUSTRIES = [
  'Systems',
  'Logistics',
  'Pharma',
  'Foods',
  'Retail',
  'Textiles',
  'Motors',
  'Labs',
  'Analytics',
  'Finserv',
  'Energy',
  'Telecom',
  'Infra',
  'Healthcare',
  'Media',
  'Steel',
];
const STALE_SKEW = 8;
const MAX_IDLE_DAYS = 150;
const OWNER_SEED = 20_240_601;
const DEAL_KINDS = [
  'Annual platform licence',
  'Team expansion',
  'Pilot rollout',
  'Enterprise renewal',
  'Multi-region deployment',
  'Analytics add-on',
  'Support upgrade',
  'Onboarding bundle',
];

const STAGE_WEIGHTS: ReadonlyArray<{ value: StageId; weight: number }> = [
  { value: StageId.NewLead, weight: 22 },
  { value: StageId.Contacted, weight: 18 },
  { value: StageId.DemoDone, weight: 15 },
  { value: StageId.ProposalSent, weight: 13 },
  { value: StageId.Negotiation, weight: 10 },
  { value: StageId.Won, weight: 10 },
  { value: StageId.Lost, weight: 12 },
];

const createFaker = (seed: number): Faker => {
  const faker = new Faker({ locale: [en_IN, en] });
  faker.seed(seed);
  return faker;
};

export const generateOwners = (): ReadonlyArray<Owner> => {
  const faker = createFaker(OWNER_SEED);
  return Array.from({ length: OWNER_COUNT }, (_, index) => ({
    id: `owner-${String(index + 1).padStart(2, '0')}`,
    name: `${faker.person.firstName()} ${faker.person.lastName()}`,
  }));
};

export const formatDealId = (index: number): string => `D-${String(index + 1).padStart(6, '0')}`;

const iso = (ms: number): string => new Date(ms).toISOString();

export const generateDeals = (
  count: number = DATASET_SIZE,
  seed: number = DEFAULT_SEED,
): ReadonlyArray<Deal> => {
  const faker = createFaker(seed);
  const owners = generateOwners();
  const deals: Deal[] = [];
  for (let index = 0; index < count; index++) {
    const stage = faker.helpers.weightedArrayElement(STAGE_WEIGHTS);
    const licences = Math.max(1, Math.round(Math.exp(faker.number.float() * 6)));
    const unitPrice = faker.number.int({ min: 2, max: 12 }) * 1000;
    const valueInr = Math.round((licences * unitPrice) / 1000) * 1000;
    const closed = stage === StageId.Won || stage === StageId.Lost;
    const closeOffsetDays = closed
      ? -faker.number.int({ min: 1, max: 90 })
      : faker.number.int({ min: -20, max: 150 });
    const lastActivityAgeDays = Math.floor(faker.number.float() ** STALE_SKEW * MAX_IDLE_DAYS);
    const lastActivityAt =
      SEED_REFERENCE_TIME -
      lastActivityAgeDays * MS_PER_DAY -
      faker.number.int({ min: 0, max: MS_PER_DAY - 1 });
    deals.push({
      id: formatDealId(index),
      company: `${faker.person.lastName()} ${faker.helpers.arrayElement(INDUSTRIES)}`,
      title: `${faker.helpers.arrayElement(DEAL_KINDS)} (${licences} seats)`,
      valueInr,
      licences,
      stage,
      ownerId: faker.helpers.arrayElement(owners).id,
      expectedCloseDate: iso(SEED_REFERENCE_TIME + closeOffsetDays * MS_PER_DAY).slice(0, 10),
      lastActivityAt: iso(lastActivityAt),
      version: 1,
      updatedAt: iso(lastActivityAt),
    });
  }
  return deals;
};
