# Stixor CS Task Dashboard

A task management dashboard for a Customer Success team, built as a take-home assessment. CSMs can track, search, filter, create, and update customer tasks. Nothing exotic on paper, but I tried to treat it like a real internal tool rather than a demo, so a fair amount of the work went into the stuff that doesn't show up in a feature list: loading/error/empty states, keyboard access, what happens when a request fails halfway through, that kind of thing.

Here's what's in this doc:

- [Setup Instructions](#setup-instructions)
- [Assumptions](#assumptions)
- [Architecture](#architecture)
- [UX Decisions](#ux-decisions)
- [Performance Considerations](#performance-considerations)
- [Accessibility Considerations](#accessibility-considerations)
- [Production Readiness Review](#production-readiness-review)
- [AI Usage](#ai-usage)

---

## Setup Instructions

Requires Node 20+.

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`. That's it, no environment variables, no API keys, no database to spin up. The "backend" is a mock API layer that lives entirely in the browser (more on that below), so the app is self-contained.

A few other scripts you'll want:

```bash
npm run build && npm run start  # production build, served locally
npm run lint       # eslint
npm run format     # prettier --write
npm run test       # vitest, runs once and exits
npm run test:watch # vitest, watch mode
```

On first load the app seeds 180 fake tasks into `localStorage` (fixed-seed random generator, so the data's the same every time unless you clear storage). If you want to see the error/retry states without waiting around for the ~15% random failure rate to eventually trip, run:

```bash
NEXT_PUBLIC_SIMULATE_FAILURES=true npm run dev
```

That bumps every mock request to a 15% chance of failing, which is honestly how I tested most of the error-handling and rollback logic. Clicking around hoping for a failure isn't a real testing strategy.

To reset to a clean seed, just clear the site's localStorage (or open an incognito window).

---

## Assumptions

The brief leaves a handful of things genuinely open, so here's what I decided and why.

**Data source: local JSON behind a mock API, not a public API or a real mocked backend.** I wanted full control over loading states, latency, and failure rates, which a public API can't give you reliably, and a full mock-server setup (MSW, json-server) felt like more ceremony than the assignment actually needed. The mock layer is written like a real fetch boundary: async, delayed, occasionally fails. Swapping it for a real API later would mostly mean deleting `lib/api/tasks.ts` and replacing it with actual fetch calls, without touching the components that use it.

**Customer is a required field on Create Task**, even though the brief's minimum-fields list for creating a task doesn't mention it. Every task in this domain already has a customer attached, and a "customer success task with no customer" didn't make sense to allow just because the spec was silent on it.

**Assignee can be unassigned.** The brief doesn't say this explicitly either, but a lot of real CS queues have an "unowned" bucket, and I wanted the UI to handle that gracefully (a visible "Unassigned" state, filterable) rather than forcing every task onto someone.

**Due dates: today-or-later for anything new, but editing an already-overdue task doesn't force you to also fix the date.** I actually found this the hard way. I built the "block past due dates" rule first, then went to edit one of the overdue seed tasks (to demo the overdue-highlighting feature) and the save button just silently failed. The validation was checking "is this date in the future" against the task's _existing_ date too, which meant any already-late task became permanently un-editable unless you also changed its due date. Fixed by grandfathering in whatever date the task already had, while still blocking a _new_ past date. Small bug, but a bad one: it would've meant CSMs literally couldn't touch their most urgent, most overdue work.

**Concurrency: last-write-wins, not a conflict-resolution UI.** There's a small demo built into the Edit form (a "simulate someone else editing this" button) so the behavior is actually visible rather than theoretical. A real merge-conflict UI is the "more correct" answer but felt disproportionate here. Most task trackers I've used take exactly this tradeoff too.

**No authentication.** There's an implicit single user. Auth is a backend/identity concern and didn't seem like the point of this exercise.

**No server-side pagination.** All 180 tasks load at once and get virtualized client-side. This is fine at this scale and would not be fine at real scale — see Performance Considerations below.

---

## Architecture

**Stack:** Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + Zustand + react-hook-form + zod + react-window, tested with Vitest and React Testing Library.

```
src/
  app/                 route + root layout, global styles
  components/
    task-list/          table, mobile card list, badges, empty/loading states, bulk action bar
    task-detail/        the slide-over/full-screen detail panel
    task-form/           create + edit forms (shared field components and validation schema)
    filters/              search bar, filter bar, mobile filter sheet
    onboarding/          first-visit hint, keyboard shortcuts popover
    ui/                    generic bits: toast, confirm dialog, theme toggle, icons
  hooks/                 useTasks, useFilters, useSearch, useDialogBehavior, useKeyboardShortcuts, etc.
  lib/
    api/                 the mock API layer (this is the "backend")
    store/                zustand stores
    mock/                 seed data generator
    utils/                 pure functions: filtering, sorting, urgency calc, URL sync
  types/                  the one place task/customer/assignee shapes are defined
```

**State management: Zustand, two small stores.** One for tasks (the list itself, filters, search query, selection state, an in-flight-optimistic-update tracker), one for toasts. I went with Zustand over Redux because there's really only one entity type here and Redux's ceremony wasn't buying anything, and over plain Context because filters/search/selection change often enough that a Context provider would re-render a lot more of the tree than necessary.

**Data fetching is hand-rolled, not React Query.** `useTasks`, `useSearch`, and `useFilters` talk directly to the mock API layer. I thought about pulling in React Query for the caching/retry/dedup story, but there's no real backend here to actually benefit from that: no other component is racing to fetch the same resource, nothing needs background refetch-on-focus. It's called out explicitly in the Production Readiness section as the first thing I'd add if this ever pointed at a real API.

**Forms share one schema, generated by a factory function** (`createTaskFormSchema`), not two independent ones for create vs. edit. Create and Edit use identical fields and mostly-identical validation, except Edit needs to grandfather in the task's pre-existing due date (see Assumptions above), which is exactly the kind of thing that quietly drifts out of sync if you maintain it in two places.

**The desktop table isn't always a real `<table>`.** Below about 60 rows it is: real `<table>/<thead>/<tbody>`, sortable columns, the works. Above that threshold the rows get virtualized through `react-window`, and `react-window` renders each row as an absolutely-positioned element, which a real HTML table just doesn't support (browsers don't apply table layout to non-`<tr>` children). So above the threshold, the whole grid switches to a div-based structure with explicit ARIA roles (`role="table"`, `role="row"`, `role="columnheader"`, `role="cell"`), which is a well-established, accessible pattern for exactly this situation, not a hack. Below the threshold, both code paths render through the identical row component, so there's one implementation to maintain, just two ways of feeding it data.

**Styling is Tailwind v4's CSS-first config**, semantic tokens (`--background`, `--surface`, `--primary`, etc.) rather than components reaching for raw `slate-400` type classes directly, so light/dark/contrast fixes happen in one place.

---

## UX Decisions

The brief gives two personas: a new CSM who needs clarity and a low-mistake path, and an experienced one who wants speed and minimal clicks. Honestly, most of the interesting UX calls in this project came down to "does this help one without getting in the way of the other."

A few concrete examples:

- **Quick status change is a plain inline `<select>` in the row itself**, not "open the task, change status, save, close." That's entirely for the experienced-CSM case. Updating status is probably the single most repeated action in this tool, and a one-click (well, one-select) affordance instead of a multi-step flow adds up over hundreds of tasks a week.
- **A dismissible first-visit hint** points a brand-new user at search, filters, and Create Task, then gets out of the way permanently once dismissed (stored in localStorage). It doesn't show again for a returning/experienced user, and it's not a modal or a forced tour, just a banner you can ignore.
- **Keyboard shortcuts** (`/` for search, `n` for new task, `Esc` for closing anything) are discoverable through a small "?" button in the corner, not baked into the primary UI. An experienced user who wants speed can find it; a new user never has to know it exists.
- **Every mutation (create, edit, delete, status change, bulk status change) is optimistic.** The UI updates instantly, the request goes out in the background, and if it fails, the change rolls back with a toast and a retry button. This was a deliberate bet that "feels instant most of the time, with a clean recovery path for the unlucky case" beats "always wait for the server, even though it usually would've been fine."
- **Delete needed a confirmation step and isn't in the original spec.** I added it because a destructive, irreversible action with zero confirmation felt like an obvious real-world gap once Update Task was in place, not scope creep for its own sake.
- **Never stack two dialogs.** Editing from the detail panel closes the detail panel first; canceling a delete confirmation reopens the detail view rather than just closing outright, because "cancel" on a delete usually means "I still want to look at this," not "get me out of here." Small thing, but it came up more than once while building this, and settling on one consistent rule saved me from re-litigating it every time.
- **Mobile isn't a shrunk-down desktop table.** Below `768px` the table becomes a card list, the filter bar collapses into a bottom sheet behind a "Filters" button (search stays inline, since it's used far more often than multi-select filters and hiding it behind a tap felt like it'd cost more than it saved), and modals go full-screen instead of a cramped centered dialog.

---

## Performance Considerations

**What's actually implemented:**

- **List virtualization** via `react-window`, kicking in once the visible (filtered) task count crosses ~60 rows. Below that, a plain `.map()`. Virtualizing a handful of simple rows adds complexity for no real benefit, so it's threshold-gated rather than always-on.
- **Memoization that's actually verified, not just present.** Table rows and cards are wrapped in `React.memo`, but that only works if the props you're passing down are referentially stable, which took a couple of real fixes underneath. `now` (used for the overdue/urgent highlighting) used to be a fresh `Date` object on every render, which would've defeated memoization the instant it was passed down as a prop, so it's now a small hook that only ticks once a minute. I checked this wasn't just theoretical by temporarily instrumenting the row component with a render counter and confirming that changing one task's status only re-renders that one row, not the other hundred-odd currently on screen.
- **Debounced search** (300ms) so filtering doesn't recompute and re-render on every keystroke.
- **Code-split Create/Edit modals** via `next/dynamic`. Neither is needed for the initial dashboard render, so react-hook-form and zod's validation logic aren't in the first bundle users download. Confirmed via the build's own loadable-chunk manifest and by watching actual network requests: neither modal's JS is fetched until you open one.

**What I'd add for real scale**, roughly in priority order:

1. **Server-side pagination and filtering.** Everything here operates on the full task list already loaded into the browser. At real CS-team scale (thousands of tasks, not 180), the API itself would need to accept a page/cursor and filter params. Client-side virtualization helps you _render_ a big already-fetched list smoothly; it does nothing if the list is too big to fetch or hold in memory in the first place.
2. **React Query or SWR**, once there's a real backend worth caching against. Request dedup, background refetch, retry/stale-while-revalidate, instead of the hand-rolled fetch hooks that are the right call today but not once things get more concurrent.
3. **Image optimization**, if this ever grows avatar images for assignees/customers. `next/image` is the obvious fit, just not needed yet since there are none.
4. **CDN/edge caching** for the static shell. The dashboard route is already fully static, so this is a deployment-config step more than an app change.

---

## Accessibility Considerations

I went through a dedicated accessibility pass partway through the build (checking real semantics, tab order, focus behavior, and computed contrast, not just eyeballing it), and it's worth being upfront that most of what it found was "confirm this already works," not "urgently fix this." A few things it did catch:

- **Dark mode's primary button color measured 3.68:1 against white text**, under WCAG AA's 4.5:1 minimum for normal-weight text. This affected every primary button in the app in dark mode (Create Task, Save Changes, etc.), and it had been that way since early in the build. Nothing had specifically computed contrast for solid-fill buttons before, only for the priority/status badges. Fixed with a one-line token change once found.
- **A couple of interactive elements (toast buttons, a retry link) had no visible focus ring at all**, inconsistent with every other button in the app. Found by grepping for `cursor-pointer` without a nearby `focus-visible` class, not by tabbing through and happening to notice.
- **A successful quick status change was completely silent.** Every other mutation in the app confirms success with a toast; this one didn't. Easy to miss visually, worse for anyone using a screen reader who isn't looking at the table when it happens.

On the "what's actually in place" side: every dialog uses real `role="dialog"` / `aria-modal` / `aria-labelledby` with focus trapped inside and restored to the triggering element on close. Every form field has a real associated label (not placeholder-only) plus `aria-invalid`/`aria-describedby` when it's actually invalid. Escape closes whatever's open, consistently, from one shared hook rather than reimplemented per dialog. And the virtualized table (see Architecture) uses explicit ARIA table/row/cell roles specifically so switching to virtualization for large lists didn't mean giving up table semantics for screen readers.

**Known limitations:** I didn't test with an actual screen reader (NVDA, JAWS, VoiceOver). Verification was via computed ARIA roles, contrast ratios, and keyboard-only navigation, which catches a lot but isn't a substitute for the real thing. The virtualized table also doesn't implement a full `role="grid"` keyboard model (arrow keys moving between individual cells); it deliberately stays at "the whole row is one tab stop, Enter/Space opens it," matching how a plain `<table>` behaves natively, since building 2D cell navigation wasn't warranted by anything the app actually does.

---

## Production Readiness Review

If this were shipping tomorrow, here's what I'd flag before calling it done:

- **No authentication or authorization.** There's a single implicit user and no concept of "whose task is this to edit." A real deployment needs an identity layer and almost certainly some notion of permissions (can a CSM edit someone else's task? delete it?).
- **No real backend.** Everything's a mock API over localStorage. That's fine for a take-home, obviously not fine for a team of CSMs who need their data to persist somewhere durable and be visible to each other.
- **No server-side pagination/filtering contract**, discussed above under Performance. This is the first thing that breaks at real scale.
- **No telemetry.** No error tracking (Sentry or similar), no usage analytics, no way to know if something's silently breaking for real users in production. I'd want this in place before the first real user touches it, not after.
- **Concurrency handling is a demo, not a real solution.** Last-write-wins with no actual conflict detection is a reasonable default, but a real backend should probably use optimistic concurrency tokens (or at minimum surface a "this was changed since you opened it" warning with the option to review, not just silently overwrite).
- **Test coverage is intentionally thin.** A handful of unit tests on the pure utility functions and the mock API, one component test for search debouncing. That's "presence and quality over quantity" for a take-home; a real production app needs meaningfully more, especially around the optimistic-update/rollback paths, which is exactly the kind of logic that's easy to get subtly wrong.
- **No rate limiting or input sanitization**, because there's no real API to abuse yet. The moment this talks to an actual backend accepting untrusted input, that changes.
- **No internationalization.** Everything's hardcoded English strings.
- **Single-tenant assumption baked in throughout.** No workspace/org boundaries, which a multi-team CS org would need.
- **No real performance budget measurement** (Lighthouse CI, bundle-size tracking in CI, that kind of thing). What's in the Performance section above was verified manually, which doesn't scale as a long-term practice.

None of these are things I'd frame as "the take-home is incomplete" — they're the honest list of what "production" adds on top of "a solid take-home demo," which I think is a different bar and worth being explicit about rather than pretending this is prod-ready as-is.

---

## AI Usage

I used **Claude Code** for essentially the entire build, working phase by phase rather than asking for the whole app at once.

**How I actually worked:** I kept my own task breakdown (a big markdown file, not part of the submission) splitting the assignment into around 15 phases: scaffold, mock API, state layer, dashboard list, search, filtering, detail view, create, update, responsive, accessibility, performance, onboarding, bonus features, docs. Each session I'd tell Claude which phase (or specific tasks within a phase) to build, it would implement it, and then, this part mattered a lot to me, I had it actually launch a headless browser and click through the feature before calling it done, not just trust that the code compiled and lint passed. That caught real bugs more than once (see below). Once a phase was verified working, one commit, then on to the next.

A few actual prompts from the build, close to verbatim:

> "perfect, now let's go with phase 7, all tasks in the phase should be completed in one commit"

> "toast needs to be showing at the top center"

> "now go for phase 8, task 8.1, 8.2 and 8.3 and 8.4 and 8.5, the complete phase should be completed"

That last one is a good example of the workflow — I'd name the phase, sometimes the specific tasks within it if I wanted to scope it tighter, and let it run, review the result, then move on.

**Where AI output got corrected, not just accepted:**

- **The dark-mode contrast bug** mentioned in Accessibility Considerations. Claude had picked a slightly brighter blue for dark-mode buttons for visual "pop," which is a completely reasonable design instinct, but nobody had actually computed the contrast ratio against the white button text until the accessibility pass specifically checked it. It failed. Fixed by matching the light-mode value instead.
- **A CSS approach I made it throw away.** While building the dark-mode toggle, its first attempt at layering an explicit theme override on top of the existing `prefers-color-scheme` media query used a nested `@media` block that looked reasonable but actually made the explicit "user picked dark mode" override behave like it only applied when the _system_ was also in dark mode. That silently defeats the entire point of a manual override. It's a subtle enough bug that it's easy to miss just reading the CSS; it only became obvious once verified live in both light-system/dark-choice and dark-system/light-choice combinations. Rewritten as plain (slightly repetitive, but correct) duplicated blocks instead.
- **A horizontal-scroll bug at 320px** that only showed up once real content (a long, unbroken task title) hit the page. Turned out `<main>` being a flex child of `<body>` interacted badly with its own `mx-auto` centering, a genuinely non-obvious CSS gotcha. It hadn't shown up in dozens of earlier checks at wider viewports because it only manifests when content is narrower than a certain intrinsic width, which is exactly why "check the literal boundary the spec names" (320px, not "resize the window until it looks fine") is worth doing as its own explicit step rather than trusting a general resize-and-eyeball pass.
- **A focus-trap bug that only showed up under a specific, easy-to-miss condition.** The modal focus-trap logic worked fine in every manual check until a field happened to be disabled (while the assignee/customer dropdowns were still loading), at which point Tab could escape the dialog entirely instead of cycling. The original selector for "what counts as focusable inside this dialog" didn't exclude disabled elements, which browsers themselves skip natively, so the trap's own bookkeeping quietly disagreed with actual browser behavior the moment anything was disabled.
- **A race condition in the concurrency demo itself.** The first version of "simulate someone else editing this task while you have it open" ran as a fully independent background request racing against the user's own save, so whichever one happened to get a faster random network delay won, regardless of which the user actually clicked last. That's not really "last write wins," that's "whichever request got lucky wins," and it was only obvious once I ran the live verification enough times to see it fail unpredictably. Fixed by sequencing the demo so it can't overlap with the user's own submit.

I stayed the one making the actual calls throughout: data source, scope cuts, which bonus features to build, when a simpler tradeoff beat a "more correct" one, and when something needed a second look rather than a quick accept. Claude wrote the code and did a lot of the here's-why-that-happened debugging, but the direction and the decisions documented above are mine.
