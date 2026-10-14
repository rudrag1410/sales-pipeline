# Sales Pipeline

A table for managing 50,000 sales deals. There's no backend. The deals are made up with Faker (from a fixed seed), and a small fake API inside the app plays the server: it answers after a delay, fails some saves, and can pretend to be teammates editing the same deals. You can change all of that from the sliders icon in the header.

Docs: [short write-up](docs/WRITEUP.md) and [demo script](docs/DEMO.md).

## Run it

```bash
pnpm install
pnpm dev          # http://localhost:5173
```


| Command             | What it does                               |
| ------------------- | ------------------------------------------ |
| `pnpm dev`          | Start the app                              |
| `pnpm build`        | Type-check and build                       |
| `pnpm typecheck`    | `tsc` in every package (strict)            |
| `pnpm lint`         | ESLint                                     |
| `pnpm format:check` | Prettier check (`pnpm format` to fix)      |
| `pnpm test`         | Vitest: data, model and UI tests           |
| `pnpm verify`       | Format check, lint, typecheck, test, build |




## What you can do

**Find deals.** Search by company, deal or ID. Filter by stage, owner, value, close date and activity. Each filter is a small chip on one line: click it to set it, and it shows its value with a ✕ to clear it. There are quick views too (All, Needs attention, My Deals, Stale, Closing Soon, Recently Updated). Rows with an overdue close date or no activity for 30 days are flagged. Filters, sort and hidden columns are kept in the URL, so you can share a view.

**Change one deal.** Click the stage badge in a row and pick a stage; you'll get an Undo. Or open the deal to change its stage, owner or value, or press `M` on a row. The new value shows straight away, marked "Saving…".

**Change many deals.** Select rows (or "all matching"), then change their stage. Moving thousands of deals to Lost is one dialog with a confirmation. They're sent 50 at a time, three requests at once. Deals that can't make the move are skipped, and you're told how many.

**Know what saved.** The header always says one of "All changes saved", "Saving N…", "Offline" or "N need attention". Nothing is rolled back without telling you.

### When saving goes wrong


| What happens                              | What you see                                                      | What you can do                             |
| ----------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------- |
| The request fails (network, 503, offline) | Your edit stays on the row as **Not saved**, with the reason      | **Retry** or **Discard change**             |
| The reply is lost but the server did save | Retry finds your values already there and counts it as saved      | Nothing                                     |
| Someone else saved the deal first         | The row says **Conflict**; the drawer shows your value and theirs | **Apply mine on latest** or **Keep theirs** |
| The server refuses the change             | The deal goes back to its saved value and says why                | **Dismiss**                                 |


Stage rules: an open deal can move anywhere. A Won deal can only reopen to Negotiation, and a Lost deal only to New Lead or Contacted. The value of a closed deal is locked. A deal that's still saving can't be edited again until it's done.

### Simulation settings (sliders icon)


| Setting                                    | What it does                                                                                     |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| Latency min / max                          | How long saves take (default 300–1500 ms)                                                        |
| Save failure rate                          | How many saves fail (default 10%). Most lose the request, some lose the reply, some return a 503 |
| Network online                             | Turn off to go offline. Turning it back on catches up on what you missed                         |
| Teammate activity                          | Off, low, medium or high: fake teammates edit random deals (off by default)                      |
| Fail next save                             | Forces one failure, of either kind, on the next save                                             |
| A teammate edits the deal you just changed | Changes the deal you just edited (or the open one) right now, so you can trigger a conflict      |


Teammates' edits show up in place with a small marker. Rows never move on their own: the order only changes when you change the filters.

## Keyboard


| Keys                     | What it does                                           |
| ------------------------ | ------------------------------------------------------ |
| `⌘K` / `Ctrl K`, `/`     | Focus search                                           |
| `G`                      | Jump to the table                                      |
| `?`                      | Show all shortcuts                                     |
| `↑ ↓ PgUp PgDn Home End` | Move through rows                                      |
| `Space` or `X`           | Select or deselect the active row                      |
| `Shift ↑ ↓`              | Extend the selection                                   |
| `Enter`                  | Open the active deal                                   |
| `M`                      | Move the active deal to another stage                  |
| `Esc`                    | Close the open menu, dialog or drawer; clear selection |


In search, `↓` or `Enter` goes into the table, and `Esc` clears the text, then leaves the box. The first Tab stop is a "Skip to deals table" link. The table keeps focus on itself and points at the active row with `aria-activedescendant`.

## How it's put together

```
packages/shared        Button, Input, Select, Checkbox, Badge, Dialog, Dropdown, Popover, Toast, Skeleton
packages/web/tests     All the tests
packages/web/src
  types/               Shared types (deal, api, store, view, pipeline)
  data/                Seed data, query engine, stage rules, DealsStore, FakeApi, DealSaver
  pages/SalesPipelinePage/
    components/        One folder per component (grid, drawer, dialogs, filters, header)
    hooks/             The data hook, results, saving, view state, shortcuts
    model/             Columns, selection, bulk plan, URL state, quick views
```

- **One entry point for data.** `SalesPipelinePage` calls `useSalesPipeline(query)` once. That hook is the only place that touches the store, the saver, the API and the query client. The page passes data and actions down as props, and everything under `components/` is plain UI (a lint rule stops it importing the data hooks). To use a real API, change `FakeApi` / `createServices`; the components don't change.
- `FakeApi` is the pretend server. It owns the real deals, checks each save's version and the stage rules, and can fail, delay or go offline.
- `DealsStore` (zustand) is the app's copy of the deals. An edit shows immediately, and the deal keeps a save state (saving, failed, conflict, rejected) until the server confirms or you drop it.
- **TanStack Query** loads the deals (with a skeleton and a retry) and runs each save request as a mutation.
- `DealSaver` sends edits in chunks and records each result in the store. It never retries by itself: a failed save stays visible until you press Retry.
- **Filtering and sorting are in memory**, about 5 ms to filter and 20–35 ms to sort 50,000 deals (timed in Node). Row order is worked out when the query changes, so rows don't jump.
- **The table is virtual** (TanStack Virtual), so about 25 rows are in the DOM.

