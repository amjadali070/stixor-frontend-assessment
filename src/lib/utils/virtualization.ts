/**
 * Task 11.1: shared by `TaskTable` and `TaskCardList` so the "when does
 * virtualization kick in" line can't drift between the desktop and
 * mobile list views. ~50-100 rows is the task's own suggested range;
 * below it, `react-window`'s overhead isn't worth it for a handful of
 * simple rows -- above it, a plain `.map()` starts doing real,
 * measurable extra DOM work per keystroke/re-render.
 */
export const VIRTUALIZATION_THRESHOLD = 60;
