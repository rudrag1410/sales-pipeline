# Sales Pipeline write-up

## What I built, and why a table

I built one screen: a table of 50,000 deals. I picked a table because most of what this team does is scan a long list and change a lot of rows. A board looks nice with 30 cards, but with 10,000 deals in one column you'd be paging inside every column, and dragging is a pain if you can't use a mouse for long. Everything in the table works from the keyboard.

You can search, filter, move one deal in a click, or move thousands at once. There's no backend, so a fake API inside the app plays the server. A settings panel (the sliders icon) lets you change the delay, the failure rate, go offline, and turn on teammates editing, while you test.

The app talks to that fake server the way it would talk to a real one. It never holds all 50,000 deals. It asks for a page of 100 rows as you scroll (rows not here yet show as placeholders), and the server does the searching, filtering and sorting. The header numbers and the stage counts come from a separate "summary" request, so they're right even for rows you haven't loaded. Pages are cached, and a page is refetched after you save something so a filtered list doesn't show old data.

## UX decisions, and what I didn't do

- **The change shows up straight away.** When you move a deal it shows "Saving…" right then. I didn't wait for the server, because 1.5 seconds of nothing feels broken. I also didn't roll back quietly when a save fails, because then you'd never know it failed.
- **Rows don't move on their own.** The order only changes when you change a filter. Re-sorting on every update would make deals jump under your cursor, which is one of the complaints in the brief.
- **The table tells you what to work on.** Overdue deals and deals with no activity for 30 days get a flag in the row. There are quick views (Needs attention, Stale Deals, Closing Soon, My Deals), and the idle count in the header opens the list. I thought about a separate dashboard page and dropped it, because the table is where people act anyway.
- **Filters are small chips on one line.** Click one to set it; it shows its value with a ✕ to clear it. I dropped a big filter sidebar because it pushes the table down.
- **Moving a deal is one click.** The stage badge in each row opens a menu, and you get an Undo.
- **Big changes ask first.** The bulk dialog tells you how many deals will move and how many will be skipped, and asks you to confirm if it's Lost or 100 or more deals. "Select all" works on every deal that matches, not just the ones loaded.



## When a save fails, or a teammate changes something

If a save fails, your edit stays on the row, marked "Not saved", with the reason. You press Retry or Discard. I didn't add automatic retries, because they hide the failure, and they can repeat a save the server already did. A chip in the header counts the things that need you.

Sometimes the reply gets lost but the server did save. On retry, the app sees the server already has your values and counts it as saved, so nothing gets saved twice.

If someone else saved the deal first, the row shows "Conflict" with your value next to theirs. You choose "Apply mine" or "Keep theirs".

Teammates' edits update the row where it is, with a small marker, and the row doesn't move. If you have an unsaved edit on that same deal, it becomes a conflict instead of being overwritten. If you go offline, the header says so, and when you come back the app asks the server what changed and applies it the same way.

## With more time

- Test with a screen reader, and run browser tests in CI.
- Retry with backoff for short network errors, if the Retry button turns out to be too slow.
- Cursor-based paging (the fake server uses offsets, which can shift when teammates add or remove deals), and Undo for bulk changes.
- Real activity history, and a real backend in the monorepo to replace the fake one.

