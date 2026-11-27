# Classes until 8:30 PM (nine periods a day) — design

**Date:** 2026-11-27 · **Status:** approved in chat ("I choose 2. Nine periods") · **Branch:** `evening-periods` (`main` stays the version presented at the December 2 defense until this is merged on purpose)

## Why

The timetable stopped at 4:00 PM (six 1.5-hour periods from 7:00 AM). The school also holds classes in the evening, so the day has to reach about 8 PM.

## Approaches considered

1. **Eight periods, 7:00 AM – 7:00 PM.** No class past 7:00 PM; the 7:00–8:00 PM hour is never used.
2. **Nine periods, 7:00 AM – 8:30 PM.** Adds 4:00–5:30, 5:30–7:00 and 7:00–8:30 PM. Covers 7 to 8 PM and keeps the 7:00 AM start. **Chosen.**
3. **Start at 8:00 AM, eight periods, 8:00 AM – 8:00 PM.** Ends exactly at 8 PM but loses the 7:00 AM period, and every existing period moves by an hour.

Periods stay 1.5 hours long (real class hours are a separate, later step).

## Design

- **Time model:** `PERIODS` 6 → 9. 54 slots a week (Mon–Sat × 9), numbered day by day as before (`id = day × 9 + period − 1`). The weekly grid's 30-minute rows run 7:00 AM to 8:00 PM (27 rows). The request picker, the Excel template (periods 1 to 9), period lists and reports follow automatically.
- **Daytime first** (proposed in chat, not objected to): periods 7–9 (from 4:00 PM) are *evening*.
  - The starting schedule puts a class in the evening only when its teacher, section or rooms have no free daytime period.
  - The score subtracts 100 × the share of classes in an evening period that their teacher did not ask for, so the Genetic Algorithm does not drift classes into the evening. This is more than a preferred day is worth (50), so a daytime period beats an evening on a preferred day. A time a teacher asked for in an approved *Prefer instead* request is never penalised.
  - *Update affected classes* keeps its order (own time, then asked-for times, then other times on those days, then preferred days, then the rest) and puts daytime before evening inside it. Asked-for times and asked-for days still come first, even in the evening.
  - Teachers who can only teach in the evening (daytime marked unavailable) still get evening classes; the hard rules come first.
- **Saved data converts automatically.** Times are stored as slot numbers, and with nine periods every day except Monday gets new numbers. The app now saves `periodsPerDay: 9` with its data and in backups. Data or a backup without it is from the six-period version: every stored time keeps its day and period (Tue P1: 6 → 9), and a time list that covered a whole day (all six periods) is widened to the whole new day, so "can't teach Thursday" still means all of Thursday. Uploaded workbooks are read with the new periods and are never converted.

## Non-goals

- Different period lengths, or the school's own bell times (real class hours, later).
- Hiding or switching off evening periods per program.
- A database (set aside in chat for now).

## Risks

- **Opening the six-period `main` in the same browser after trying this branch** would misread the converted data. Try the branch in another browser, or download a backup first.
- Room utilisation in Reports is measured over 54 periods instead of 36, so the same schedule shows lower percentages (rooms are free in the evening).
- Generation has 1.5 × as many times to try; to be measured on the 153-teacher school.

## Plan (test first)

1. Engine tests: nine periods and 54 slots ending 8:30 PM; grid rows to 8:00 PM; `upgradeSlotId` keeps day and period; full generation keeps classes in the daytime when there is room and uses the evening when a teacher can only teach then; an update puts a moved class in the daytime before the evening. Existing tests that name days by slot number use a `slotAt(day, period)` helper instead.
2. Importer tests: P7–P9 are accepted, P10 is refused, a whole day is nine periods.
3. Engine: `PERIODS = 9`, evening helpers, seed order, score term, update order, `upgradeSlotId`.
4. Importer: read periods 1 to 9.
5. App: save `periodsPerDay`; convert six-period saved data and backups on load; rebuild `app.js`.
6. Check in the browser with a real six-period save and backup, the grid, the request picker and the 153-teacher school.
7. Docs: README, flowchart, testing guide.
