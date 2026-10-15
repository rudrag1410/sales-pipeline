import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { App } from '@/App';
import { InjectedFailure } from '@/constants/enums';
import { DATASET_SIZE } from '@/constants/pipeline';
import { generateDeals } from '@/data/seed-data';
import { createServices } from '@/data/services';

const VIEWPORT_HEIGHT = 600;

beforeEach(() => {
  window.history.replaceState(null, '', '/');
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
    configurable: true,
    value: VIEWPORT_HEIGHT,
  });
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, value: 1200 });
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
    configurable: true,
    value: VIEWPORT_HEIGHT,
  });
});

const renderApp = async (dealCount: number) => {
  const services = createServices({
    deals: generateDeals(dealCount, 5),
    config: { latencyMinMs: 0, latencyMaxMs: 0, failureRate: 0 },
  });
  render(<App services={services} />);
  await screen.findByRole('grid', { name: 'Deals' });
  await waitFor(() => {
    expect(within(grid()).getAllByRole('row').length).toBeGreaterThan(5);
  });
  return services;
};

const grid = () => screen.getByRole('grid', { name: 'Deals' });

describe('SalesPipelinePage', () => {
  it('renders 50,000 deals with a bounded number of DOM rows', async () => {
    await renderApp(DATASET_SIZE);
    expect(within(grid()).getAllByRole('row').length).toBeLessThan(60);
    expect(grid()).toHaveAttribute('aria-rowcount', String(DATASET_SIZE + 1));
    expect(screen.getAllByText('50,000').length).toBeGreaterThan(0);
  });

  it('loads one page first and fetches later pages only when you scroll to them', async () => {
    const { api } = await renderApp(450);
    const requested = (): number[] => spy.mock.calls.map(([request]) => request.offset);
    const spy = vi.spyOn(api, 'list');
    expect(requested()).toEqual([]);
    grid().scrollTop = 450 * 36 - VIEWPORT_HEIGHT;
    fireEvent.scroll(grid());
    await waitFor(() => {
      expect(requested()).toContain(400);
    });
    expect(requested()).not.toContain(200);
    expect(requested()).not.toContain(500);
  });

  it('supports keyboard navigation, selection, opening the drawer and restoring focus', async () => {
    const user = userEvent.setup();
    await renderApp(300);
    grid().focus();
    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(grid()).toHaveAttribute('aria-activedescendant', 'deal-row-2');
    await user.keyboard(' ');
    const bar = await screen.findByRole('toolbar', { name: 'Bulk actions' });
    expect(within(bar).getByText('1 selected')).toBeInTheDocument();
    await user.keyboard('{Enter}');
    expect(await screen.findByRole('dialog')).toHaveFocus();
    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(grid()).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('toolbar', { name: 'Bulk actions' })).not.toBeInTheDocument();
  });

  it('bulk-moves selected deals to Lost after confirmation', async () => {
    const user = userEvent.setup();
    const { store } = await renderApp(300);
    await user.click(screen.getByRole('checkbox', { name: 'Select visible rows' }));
    await user.click(await screen.findByRole('button', { name: 'Mark as Lost…' }));
    const dialog = await screen.findByRole('dialog', { name: /Change stage/ });
    await user.click(within(dialog).getByRole('checkbox', { name: /I understand/ }));
    await user.click(within(dialog).getByRole('button', { name: /Apply to/ }));
    expect(await screen.findByText(/Moved to Lost: \d+ saved/)).toBeInTheDocument();
    expect([...store.getDeals().values()].some((deal) => deal.version > 1)).toBe(true);
    expect(screen.queryByRole('toolbar', { name: 'Bulk actions' })).not.toBeInTheDocument();
  });

  it('edits a deal from the drawer and shows it in the change history', async () => {
    const user = userEvent.setup();
    await renderApp(300);
    await user.click(within(grid()).getAllByRole('row')[1]!);
    const drawer = await screen.findByRole('dialog');
    await user.click(within(drawer).getByLabelText('Stage'));
    const choices = (await screen.findAllByRole('option')).filter(
      (option) => option.getAttribute('aria-disabled') !== 'true',
    );
    const current = within(drawer).getByText(
      /^(New Lead|Contacted|Demo Done|Proposal Sent|Negotiation|Won|Lost)$/,
      {
        selector: '[class*=singleValue]',
      },
    );
    await user.click(choices.find((option) => option.textContent !== current.textContent)!);
    expect(await within(drawer).findByText(/^v2 · You: Stage →/)).toBeInTheDocument();
  });

  it('saves a typed deal value on Enter and shows it in the change history', async () => {
    const user = userEvent.setup();
    await renderApp(300);
    await user.click(within(grid()).getAllByRole('row')[1]!);
    const drawer = await screen.findByRole('dialog');
    const value = within(drawer).getByLabelText('Value (INR)');
    await user.clear(value);
    await user.type(value, '123456{Enter}');
    expect(await within(drawer).findByText(/^v2 · You: Value →/)).toBeInTheDocument();
    expect(within(drawer).getByLabelText('Value (INR)')).toHaveValue('1,23,456');
  });

  it('moves a deal from the stage menu in the table without opening the drawer', async () => {
    const user = userEvent.setup();
    await renderApp(300);
    await user.click(within(grid()).getAllByRole('button', { name: /Change stage for/ })[0]!);
    const options = await screen.findAllByRole('menuitem');
    await user.click(
      options.find(
        (option) => !option.hasAttribute('disabled') && option.querySelector('svg') === null,
      )!,
    );
    expect(await screen.findByText('Undo')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('only accepts digits in the value range filters', async () => {
    const user = userEvent.setup();
    await renderApp(300);
    await user.click(screen.getByRole('button', { name: 'Value' }));
    const min = screen.getByLabelText('Min value (₹)');
    await user.type(min, 'ab12-3.x');
    expect(min).toHaveValue('123');
    const max = screen.getByLabelText('Max value (₹)');
    await user.type(max, 'x9y,8.z');
    expect(max).toHaveValue('98');
    await user.clear(max);
    await user.type(max, '99999999999999');
    expect(max).toHaveValue('1000000000');
    await waitFor(() => {
      expect(window.location.search).toContain('vmax=1000000000');
    });
  });

  it('returns focus to the table after the move dialog closes with Escape', async () => {
    const user = userEvent.setup();
    await renderApp(300);
    grid().focus();
    await user.keyboard('m');
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(grid()).toHaveFocus();
  });

  it('lets the simulation number fields be cleared and retyped without a leading zero', async () => {
    const user = userEvent.setup();
    await renderApp(300);
    await user.click(screen.getByRole('button', { name: 'Simulation settings' }));
    const max = screen.getByLabelText('Latency max (ms)');
    await user.clear(max);
    expect(max).toHaveValue(null);
    await user.type(max, '750');
    expect(max).toHaveValue(750);
  });

  it('marks All Deals as active even while a search is typed', async () => {
    const user = userEvent.setup();
    await renderApp(300);
    await user.type(screen.getByRole('searchbox', { name: 'Search deals' }), 'a');
    await user.click(screen.getByRole('button', { name: 'Stale Deals' }));
    expect(screen.getByRole('button', { name: 'Stale Deals' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await user.click(screen.getByRole('button', { name: 'All Deals' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'All Deals' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
    });
    await waitFor(() => {
      expect(window.location.search).toContain('q=a');
    });
  });

  it('closes the drawer when clicking outside it', async () => {
    const user = userEvent.setup();
    await renderApp(300);
    await user.click(within(grid()).getAllByRole('row')[1]!);
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    await user.click(document.querySelector('[class*=drawerBackdrop]')!);
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('closes a filter popover on Escape and returns focus to its chip', async () => {
    const user = userEvent.setup();
    await renderApp(300);
    const chip = screen.getByRole('button', { name: 'Value' });
    await user.click(chip);
    expect(screen.getByLabelText('Max value (₹)')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByLabelText('Max value (₹)')).not.toBeInTheDocument();
    expect(chip).toHaveFocus();
  });

  it('shows an applied filter as a chip and clears it with the chip button', async () => {
    const user = userEvent.setup();
    await renderApp(300);
    await user.click(screen.getByRole('button', { name: 'Activity' }));
    await user.click(await screen.findByRole('menuitem', { name: /30d\+/ }));
    expect(screen.getByText('30d+ idle')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Clear Activity filter' }));
    expect(screen.queryByText('30d+ idle')).not.toBeInTheDocument();
  });

  it('closes only the open select menu on Escape, not the drawer behind it', async () => {
    const user = userEvent.setup();
    await renderApp(300);
    await user.click(within(grid()).getAllByRole('row')[1]!);
    const drawer = await screen.findByRole('dialog');
    await user.click(within(drawer).getByLabelText('Stage'));
    expect((await screen.findAllByRole('option')).length).toBeGreaterThan(1);
    await user.keyboard('{Escape}');
    expect(screen.queryAllByRole('option')).toHaveLength(0);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('shows a failed save with its edit, then saves it when retried', async () => {
    const user = userEvent.setup();
    const { api } = await renderApp(300);
    api.failNext(InjectedFailure.RequestLost);
    await user.click(within(grid()).getAllByRole('row')[1]!);
    const drawer = await screen.findByRole('dialog');
    await user.click(within(drawer).getByLabelText('Stage'));
    const choices = (await screen.findAllByRole('option')).filter(
      (option) => option.getAttribute('aria-disabled') !== 'true',
    );
    const current = within(drawer).getByText(
      /^(New Lead|Contacted|Demo Done|Proposal Sent|Negotiation|Won|Lost)$/,
      { selector: '[class*=singleValue]' },
    );
    await user.click(choices.find((option) => option.textContent !== current.textContent)!);
    expect(await within(drawer).findByText('Not saved')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /1 need attention/ })).toBeInTheDocument();
    await user.click(within(drawer).getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('All changes saved')).toBeInTheDocument();
    expect(within(drawer).getByText(/^v2 · You: Stage →/)).toBeInTheDocument();
  });
});
