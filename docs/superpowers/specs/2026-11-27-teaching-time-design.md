# Teaching time for each teacher (Morning, Afternoon, Evening) — design

**Date:** 2026-11-27 · **Status:** approved in chat ("go ahead" on option 1, a must) · **Branch:** `teaching-time`

## Why

With classes spread over the whole day (7:00 AM to 8:30 PM), any teacher could get a 7:00 AM or a 7:00 PM class. The school's data should say when each teacher teaches, so the schedule follows it without conflicts.

## Approaches considered

1. **A must (chosen).** A teacher is never scheduled outside their teaching time, exactly as if the other periods were marked Not available. If the teachers' times leave too little room, Conflict Detection says so.
2. **A wish.** Like Preferred days: tried first, other times when the day runs out of room. Never adds conflicts, but an "Evening only" part-timer could get a morning class.

## Design

- **Three teaching times:** Morning = P1–P3 (7:00–11:30 AM), Afternoon = P4–P6 (11:30 AM–4:00 PM), Evening = P7–P9 (4:00–8:30 PM). A teacher may have several; none (or all three) means any time. Stored as `teachingTimes: ["Evening"]` on the teacher.
- **Excel workbook:** a **Teaching time** column, the last one on the Faculty sheet (so older workbooks and their column order still work: a missing column means any time). Accepted words: Morning, Afternoon, Noon (= Afternoon), Evening, Night (= Evening), Daytime/Day (= Morning and Afternoon), Any time/Anytime/Any/All day (= any time), separated by `;` or `,`, any capitals. Anything else is an error that points to the cell. Empty cells get a note ("N teachers have no teaching time: they can be scheduled at any time of day."). The Instructions sheet lists the three times with their periods and hours and says the schedule never goes outside them. **Download current data** writes the column back.
- **Engine:** `TEACHING_TIMES`, `teachingTimeOf(period)`, `canTeachAt(teacher, slot)`. Outside the teaching time counts as *teacher unavailable* in the rule checker (and marks the class for an update); the starting schedule, *Update affected classes* and the request form never offer such times; `whyNotAt` names it (`{ kind: "teachingTime", times }`).
- **App:** Teaching time check boxes in the Faculty form (none ticked = any time), a Teaching Time line in the profile, a column in the Faculty list and its CSV export, outside times shown as unavailable in the request form's picker, and the Conflict Detection description mentions it. Saved data and backups without the field load as "any time"; a backup with an unknown teaching time is refused as damaged.
- **Import warning:** a subject with a fixed time outside every qualified teacher's teaching time is warned about, like a fixed time every qualified teacher marked Not available.

## Non-goals

- Teaching times other than the three blocks (for example "Monday mornings only"); Not available covers single periods.
- Per-subject teaching times.

## Checked

- Tests: engine 53, importer 20, accounts 13 (new: the three times, the rule checker, full generation and an update keeping teachers inside their times, `whyNotAt`, reading the column, notes, errors, the warning, the template, the round trip, an older workbook without the column).
- The 153-teacher workbook with a Teaching time column (a quarter each Morning, Afternoon, Evening, blank) uploaded through the app: 0 conflicts, 0 classes outside a teacher's time, nobody over their maximum, 209 / 209 / 206 classes in the morning / afternoon / evening, 2.9 s.
- Faculty form: a teacher changed to Evening only showed their 4 daytime classes as conflicts at once; *Update affected classes* moved exactly those 4 into the evening.
