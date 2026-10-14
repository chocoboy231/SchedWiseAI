# SchedWiseAI Testing Guide

A step-by-step manual test plan for the whole system. It is written for respondents and testers who may never have seen the code. Each test says what to do, what you should see, and has a box to mark **Pass** or **Fail**.

> **Status:** draft. The expected results come from the README and the program's behaviour. Do one complete pass yourself before giving this to respondents, and correct any step that does not match what you see.

## Contents

1. [Before you start](#1-before-you-start)
2. [A. Sign-in and access by role](#a-sign-in-and-access-by-role)
3. [B. Schedule generation and approval](#b-schedule-generation-and-approval)
4. [C. Conflicts](#c-conflicts)
5. [D. Manual editing](#d-manual-editing)
6. [E. Faculty](#e-faculty)
7. [F. Subjects and rooms](#f-subjects-and-rooms)
8. [G. CSV import and export](#g-csv-import-and-export)
9. [H. Workload and departments](#h-workload-and-departments)
10. [I. Availability and leave](#i-availability-and-leave)
11. [J. History, reports and notifications](#j-history-reports-and-notifications)
12. [K. Saving, backup and reset](#k-saving-backup-and-reset)
13. [L. Devices, browsers and performance](#l-devices-browsers-and-performance)
14. [M. Automated engine tests](#m-automated-engine-tests)
15. [End-to-end scenarios](#end-to-end-scenarios)
16. [Quality characteristics (ISO/IEC 25010)](#quality-characteristics-isoiec-25010)
17. [Results sheet and defect log](#results-sheet-and-defect-log)

---

## 1. Before you start

**What you need**

- A modern browser (Chrome, Edge, Firefox or Safari). No internet connection is needed once the app is being served: its libraries and font are stored in the `vendor/` folder.
- The app open in the browser. Use the published site, or serve the folder and open it (see the README, *Getting started*). Opening `index.html` by double-clicking usually does not work.
- For section M only: Node.js, or the `tests/run.html` page.

**How the data works**

- Everything is stored in *your* browser and nothing is sent anywhere. A different browser or computer starts with its own sample data.
- The sample data is random. **Names, subjects and conflict counts differ each time you load a sample**, so the steps say "any teacher" instead of a name.
- To start a test from a known state: sign in as **Academic Administrator**, open **Settings → Testing tools → Standard sample** and confirm. That gives 9 faculty, 18 subjects and 6 labs, with no schedule yet.

**Roles**

| Role | Sign-in choice | Pages in the sidebar |
|---|---|---|
| Academic Administrator | *Academic Administrator* | Overview, Faculty, Workload Management, Subjects, Class Schedules, Schedule History, Rooms, Departments, Conflict Detection, Reports |
| Department Chair | *Department Chair* | Same as Administrator, **without Departments** |
| Faculty Member | *Faculty Member* | Overview and Class Schedules only |
| IT Professional / Staff | *IT Professional/Staff* | Same as Administrator |

Every role also has **Settings** and **Sign Out** in the Account part of the sidebar. Only Administrator and IT also see **Reset Demo Data** there, and *Backup and restore* and *Testing tools* in Settings.

Sign-in takes any name and no password. A Faculty Member is matched by name: type the exact name of a teacher from the Faculty list. If no name matches, the app uses the first teacher in the list.

You can also switch role without signing out, using the **Viewing as** selector at the bottom of the sidebar.

**How to record results**

Mark each test **Pass** or **Fail**. For a failure, add a line in the [defect log](#results-sheet-and-defect-log): the test ID, what you did, what you expected, and what happened. A screenshot helps. Please read [Known limits](#known-limits-do-not-report-these) first so you do not report them as bugs.

**Words used in this guide**

- *Schedule*: the generated weekly timetable. *Gene* or *class*: one subject section placed at a day, period, teacher and room.
- *Conflict*: a rule the schedule breaks, such as one teacher in two places at once.
- *Pending Review / Approved / Rejected*: the approval status of the current schedule.

---

## A. Sign-in and access by role

**A1. Sign in as each role**
1. Open the app. Type a name and choose *Academic Administrator*, then **Sign In**.
2. Repeat for the other three roles (use **Sign Out** in the sidebar between them).

*Expected:* Each role lands on its own Overview page with the greeting "Welcome back, <first name>". The Administrator page has "Schedule Approval" and "Pending Leave & Availability Requests"; the Faculty page shows that person's own classes and requests.
☐ Pass ☐ Fail

**A2. Sidebar pages per role**
1. For each role, compare the sidebar with the table in section 1.

*Expected:* Faculty Member sees only Overview and Class Schedules. Department Chair has no Departments. Administrator and IT see all ten pages. **Reset Demo Data** is shown only to Administrator and IT.
☐ Pass ☐ Fail

**A3. Titles in names**
1. Sign out. Sign in as *Academic Administrator* with the name `Dr. Maria Santos`.

*Expected:* The greeting says "Welcome back, Maria" (not "Dr."), and the round avatar shows **MS**.
☐ Pass ☐ Fail

**A4. Faculty see only their own classes**
1. As Administrator, generate a schedule (test B1). Note one teacher's name from the Faculty page.
2. Sign out, then sign in as *Faculty Member* using that exact name.
3. Open **Class Schedules**.

*Expected:* Only that teacher's classes are shown. There are no Approve, Reject, Generate or Full Regenerate buttons.
☐ Pass ☐ Fail

**A5. Switch role without signing out**
1. Sign in as Administrator. At the bottom of the sidebar, use **Viewing as** to choose *Faculty Member*.

*Expected:* The sidebar and page change to the Faculty view immediately. If you were on a page that role cannot open, you are moved to its Overview.
☐ Pass ☐ Fail

---

## B. Schedule generation and approval

*Start from a fresh Standard sample, signed in as Administrator.*

**B1. Generate a schedule**
1. Open **Class Schedules** and press **Generate Schedule**.

*Expected:* A weekly timetable appears (Monday to Saturday, 6 periods a day). The header shows **✓ Conflict-free**, a fitness score, and "Pending Review" as the approval status. A notification says a new schedule was generated.
☐ Pass ☐ Fail

**B2. Convergence chart**
1. Under the timetable, find "GA Convergence". Press **How to read this chart**, then **Hide chart** and show it again.

*Expected:* A chart with a best-score line (left scale) and an average line (right scale), and a plain-language sentence such as "Best: … → … · Average: … → …". The help text opens and closes.
☐ Pass ☐ Fail

**B3. Grid and By Faculty views**
1. Switch between **Weekly Grid** and **By Faculty**. In By Faculty, choose different teachers.

*Expected:* The grid shows every class once. By Faculty shows only the chosen teacher's classes. Nothing is placed on Sunday.
☐ Pass ☐ Fail

**B4. Curriculum-aware option**
1. Tick **Use curriculum (avoid overlaps…)**. Press **Full Regenerate**.

*Expected:* The header shows a "Curriculum" badge: "no overlaps", or a count. The schedule stays conflict-free.
☐ Pass ☐ Fail

**B5. Approve a schedule**
1. In the approval panel, type a comment and press **Approve**.

*Expected:* The status changes to **Approved** and your comment is shown. A notification says the schedule was approved.
☐ Pass ☐ Fail

**B6. Reject a schedule**
1. Type a comment and press **Reject**.

*Expected:* The status changes to **Rejected** with your comment, and a notification says so.
☐ Pass ☐ Fail

**B7. A change returns the schedule to Pending Review**
1. Approve the schedule. Then edit one class (see D1).

*Expected:* The status goes back to **Pending Review**.
☐ Pass ☐ Fail

**B8. Full Regenerate**
1. Press **Full Regenerate**.

*Expected:* A new schedule replaces the old one and the status is Pending Review. In **Schedule History** there is one more version.
☐ Pass ☐ Fail

---

## C. Conflicts

*Start with a generated, conflict-free schedule.*

**C1. A clean schedule**
1. Open **Conflict Detection**.

*Expected:* The page lists the rule categories (teacher double-booking, room double-booking, unqualified teacher, teacher unavailable, room-type mismatch, fixed time not respected, room capacity) and the total is 0.
☐ Pass ☐ Fail

**C2. Create a conflict by hand and watch the count update**
1. In **Class Schedules**, click any class (see D1) and move it to a time when that teacher already has another class.
2. Save.

*Expected:* The header changes to **⚠ 1 conflicts remaining** straight away, with no regenerate needed. The Conflict Detection page and the sidebar badge show the same number.
☐ Pass ☐ Fail

**C3. Test conflicts (all seven kinds)**
1. Open **Settings → Testing tools**. Under "Create test conflicts" press each button one at a time, then **Create all of them**.

*Expected:* Each button says exactly what it changed. After each one, Conflict Detection shows that kind counted. The "Teacher overload" button is labelled *(not a conflict)* and does not add to the conflict total. Earlier test conflicts are not undone by later ones.
☐ Pass ☐ Fail

**C4. Update affected classes**
1. With conflicts present, open **Class Schedules**. Press **Update affected classes** in the orange banner.

*Expected:* Only the classes that broke a rule move. A "What changed" panel lists each move (from → to) and how many classes stayed put. The header returns to **✓ Conflict-free**.
☐ Pass ☐ Fail

**C5. Banner when nothing was flagged**
1. Edit a teacher (E2) so that one of their classes becomes unqualified.
2. Open **Class Schedules**.

*Expected:* A banner "Conflicts found in this schedule" appears with the violation count and an **Update affected classes** button.
☐ Pass ☐ Fail

**C6. Overload warning**
1. In **Faculty**, edit a teacher who has classes and set **Maximum Teaching Units** to 1. Save.
2. Open **Class Schedules**.

*Expected:* An orange badge "⚠ 1 teacher over maximum units" appears next to **✓ Conflict-free** (overload is a warning, not a conflict). Hover the badge to see the teacher's name. The Workload page shows that teacher as **Overloaded**.
☐ Pass ☐ Fail

---

## D. Manual editing

**D1. Edit one class**
1. In the weekly grid, click a class. A dialog "Edit Assignment" opens.
2. Change the **Time Slot**, then press **Save Changes**.

*Expected:* The class moves. The conflict count is recalculated at once and the status becomes Pending Review.
☐ Pass ☐ Fail

**D2. Only suitable choices are offered**
1. Open the edit dialog for a laboratory class and for an online class.

*Expected:* **Faculty** lists only teachers with the needed specialization. **Room** for a lab class lists only labs with enough seats (with their capacity); for an online class it shows "Online class — no room needed". Time slots where the chosen teacher is unavailable are marked "— teacher unavailable".
☐ Pass ☐ Fail

**D3. Fixed-time subjects**
1. Make a subject with a fixed day and period (F2), regenerate, then open its edit dialog.

*Expected:* The time slot cannot be changed: it shows "📌 Fixed: <time> — change it in Subjects".
☐ Pass ☐ Fail

**D4. Remove a class**
1. In the edit dialog, press **Remove**.

*Expected:* The class disappears from the grid. The header shows "1 unscheduled (manually removed)". It is **not** counted as a conflict.
☐ Pass ☐ Fail

---

## E. Faculty

**E1. Add a teacher**
1. Open **Faculty → Add Faculty**. Enter a name, tick at least one specialization and some preferred days, set the maximum units, then save.

*Expected:* The teacher appears in the list with 0 units and the status **Underloaded** (or "No assignment yet" if no schedule exists).
☐ Pass ☐ Fail

**E2. Edit a teacher and see conflicts update**
1. With a generated schedule, edit a teacher who has classes. Untick their specializations and tick only one they do not teach. Save.
2. Open **Class Schedules** and **Conflict Detection**.

*Expected:* The conflict count rises straight away ("Unqualified" rows), and the banner from C5 appears.
☐ Pass ☐ Fail

**E3. Validation**
1. In the Add Faculty form, leave the name empty or untick every specialization, then try to save.

*Expected:* The form does not save and the dialog stays open.
☐ Pass ☐ Fail

**E4. Delete a teacher who has classes**
1. Delete a teacher who is teaching in the current schedule.

*Expected:* The teacher is removed. The schedule is flagged ("… was removed — N class(es) need a new teacher") and the count shows conflicts. **Update affected classes** gives those classes a new teacher.
☐ Pass ☐ Fail

**E5. Profile and schedule links**
1. In the Faculty list, press **View Profile**, then **View Schedule** for a teacher.

*Expected:* The profile shows employment status, rank, maximum units, current load, specializations, preferred days, unavailable times and requested preferred times. View Schedule opens Class Schedules on that teacher.
☐ Pass ☐ Fail

---

## F. Subjects and rooms

**F1. Add an online subject**
1. Open **Subjects → Add Subject**. Fill in the fields (code, name, section such as `BSIT-2A`, units, required specialization, **Class Type: Online**, students) and save.

*Expected:* The subject appears in the list. If a schedule exists, a banner says the new subject needs to be placed. **Update affected classes** places it without moving other classes.
☐ Pass ☐ Fail

**F2. Subject with a fixed day and period**
1. Add or edit a subject and set **Fixed Day & Period** (for example Saturday, period 1). Regenerate.

*Expected:* That class is always at the chosen time, in every regenerate.
☐ Pass ☐ Fail

**F3. Prerequisite check**
1. Edit a first-year subject and choose a fourth-year subject as its **Prerequisite**.

*Expected:* A warning box on the Subjects page says the prerequisite is scheduled in a later year or semester.
☐ Pass ☐ Fail

**F4. Delete a subject**
1. Delete a subject that is in the current schedule.

*Expected:* The subject and its class disappear and the other classes stay with the right subjects (none shift to another subject).
☐ Pass ☐ Fail

**F5. Filters**
1. On the Subjects page use the **School Year**, **Program** and **Category** filters and the year-level tabs.

*Expected:* The list and its count change to match each filter.
☐ Pass ☐ Fail

**F6. Add a room**
1. Open **Rooms → Add Room**. Enter a name and capacity. Save.

*Expected:* The room is listed under "Laboratory Rooms". There is no room type to choose (all rooms are laboratories).
☐ Pass ☐ Fail

**F7. Delete a room that is in use**
1. Delete a room that has classes in the current schedule.

*Expected:* The schedule is flagged ("… was removed — N class(es) need a new room"). **Update affected classes** re-places only those classes.
☐ Pass ☐ Fail

---

## G. CSV import and export

Import works by **pasting** CSV text into a box. There is no file chooser.

**G1. Export**
1. On Faculty, Subjects and Rooms press **Export CSV**. Open one file in Excel or Google Sheets.

*Expected:* A `.csv` file downloads with a header row and one row per record. Commas inside names do not break columns.
☐ Pass ☐ Fail

**G2. Import with the example template**
1. On Faculty press **Import CSV**, then **Load example template**, then **Import**.

*Expected:* The dialog closes and the new teacher appears. Repeat for Subjects and Rooms.
☐ Pass ☐ Fail

**G3. Bad rows are rejected**
1. Press **Import CSV** on Faculty and press **Load example template**. In the data row, change the specialization (for example `"Programming;Databases"`) to `Cooking`. Press **Import**.

*Expected:* A red message "Nothing was imported. Row 1: unknown specialization Cooking." and no teacher is added. Also try a blank name, and a subject with `units` set to `abc`.
☐ Pass ☐ Fail

**G4. Subject import with a fixed time**
1. Import the Subjects example (it includes `NSTP1` with `fixedDay` Sat and `fixedPeriod` 1).

*Expected:* NSTP1 appears and shows a fixed time on Saturday, period 1.
☐ Pass ☐ Fail

---

## H. Workload and departments

*Start with a generated schedule.*

**H1. Workload page**
1. Open **Workload Management**.

*Expected:* Summary cards (Overloaded, Near capacity, Balanced, Light load, Underloaded), "Units assigned / capacity", "Average load" and "Load gap". A table lists each teacher's units, maximum, load %, difference from the average, and status.
☐ Pass ☐ Fail

**H2. How the status is worked out**
1. Press **How is load status calculated?** Click a teacher row.

*Expected:* The panel explains the rules using the current numbers. A teacher row shows that teacher's classes and how many subjects they can teach. The statuses on Workload, Faculty and Overview agree.
☐ Pass ☐ Fail

**H3. Departments**
1. Open **Departments** (Administrator or IT).

*Expected:* Each specialization appears as a department with load %, overload and conflict counts, and an "Issues Requiring Attention" list. Department Chair does not see this page.
☐ Pass ☐ Fail

---

## I. Availability and leave

**I1. A faculty member asks for a change**
1. Sign in as *Faculty Member* (exact teacher name). Open **Class Schedules**. Press **Request Availability Change / Leave**, choose **Availability Change** as the request type, pick the day-and-period times you cannot teach, add a "prefer instead" time, and submit.

*Expected:* The request is listed as **Pending**. A notification is created. Nothing about the schedule changes yet.
☐ Pass ☐ Fail

**I2. Approve a request that clashes with a class**
1. As Administrator open **Faculty → Leave & Availability**. Approve a request that blocks a time when that teacher has a class.

*Expected:* The status becomes **Approved**. The schedule is flagged ("… availability changed … N current class(es) now clash"), and the conflict count shows the clashes.
☐ Pass ☐ Fail

**I3. Update affected classes after an approval**
1. Open **Class Schedules** and press **Update affected classes**.

*Expected:* The teacher's clashing classes move, preferably to the "prefer instead" times, and the others stay. The "What changed" panel confirms the approved request is now respected.
☐ Pass ☐ Fail

**I4. Approve a request that does not clash**
1. Approve a request for a time when the teacher has no class.

*Expected:* The notification says none of their classes are at those times, so the schedule did not need to change. No update banner appears.
☐ Pass ☐ Fail

**I5. Undo an approved availability change**
1. In **Leave & Availability**, find an approved *Availability Change* and press **Undo change**. Confirm.

*Expected:* The confirmation names the times that will be freed. The status becomes **Ended**. The teacher's blocked times from that request (and the preferred times it saved) are removed (check **View Profile → Unavailable Times**); the current schedule is unchanged and not flagged. A **Full Regenerate** may now use those times.
☐ Pass ☐ Fail

**I6. End a leave**
1. Submit a **Leave Request**, approve it, then press **End Leave** and confirm.

*Expected:* Same as I5: status **Ended**, the leave's times are available again, and the schedule is left as it is.
☐ Pass ☐ Fail

**I7. Overlapping requests**
1. Approve two requests for the same teacher that share one time. Undo the first one.

*Expected:* The shared time stays blocked (the other request still covers it). Undo the second one and the time becomes available.
☐ Pass ☐ Fail

**I8. Deny a request**
1. Deny a pending request.

*Expected:* The status becomes **Denied**. The teacher's blocked times do not change.
☐ Pass ☐ Fail

**I9. Faculty cannot approve**
1. As Faculty Member look at your own requests.

*Expected:* You see each request's status, but there are no Approve, Deny, Undo or End buttons.
☐ Pass ☐ Fail

---

## J. History, reports and notifications

**J1. Schedule history**
1. Generate three schedules (Full Regenerate twice). Open **Schedule History**.

*Expected:* Versions are listed, newest first, with a "Fitness Across Versions" chart. Each shows full or update, date, conflict-free yes/no and approval status. Press **Restore** on an older one.
☐ Pass ☐ Fail

**J2. Restore a version**
1. After Restore, open **Class Schedules** and **Conflict Detection**.

*Expected:* The older schedule is now current and its conflict count is checked against *today's* data. A notification says it was restored.
☐ Pass ☐ Fail

**J3. Reports**
1. Open **Reports**.

*Expected:* Four reports: Faculty Teaching Load, Room Utilization (with a room × day heat map), Department Summary and Conflict Report. Press **CSV** on one report.
☐ Pass ☐ Fail

**J4. Print or save as PDF**
1. Press **Print All Reports / Save PDF** (or **Print / Save PDF** on Class Schedules). Choose "Save as PDF" in the print dialog.

*Expected:* The preview shows the report or timetable without the sidebar, menu or buttons.
☐ Pass ☐ Fail

**J5. Notifications**
1. Click the bell icon. Click one notification, then **Mark all read**.

*Expected:* The red unread count drops as you read items, and goes to zero after Mark all read.
☐ Pass ☐ Fail

---

## K. Saving, backup and reset

**K1. Data is kept after a reload**
1. Generate a schedule, then reload the page (F5).

*Expected:* You are still signed in, and the same schedule, faculty, subjects and history are shown.
☐ Pass ☐ Fail

**K2. Download a backup**
1. Open **Settings → Backup and restore** (Administrator or IT). Press **Download backup**.

*Expected:* A file named `schedwiseai-backup-<date>.json` downloads and a green message confirms it.
☐ Pass ☐ Fail

**K3. Restore a backup**
1. Note one teacher's name. Press **Standard sample** under Testing tools to load different data.
2. Press **Restore from backup file…** and choose the file from K2. Confirm.

*Expected:* The confirmation shows the file name, date and counts. After you confirm, the original teachers, schedule and history are back, and a green message says "Restored …". You remain signed in with your role.
☐ Pass ☐ Fail

**K4. A wrong file is refused**
1. Press **Restore from backup file…** and choose a file that is not a backup (for example a photo or a `.csv`).

*Expected:* A red message such as "That file is not valid JSON…" or "…not a SchedWiseAI backup." Nothing changes. Also test cancelling the confirmation: "Restore cancelled. Nothing was changed."
☐ Pass ☐ Fail

**K5. Sample data**
1. Open **Settings → Testing tools** and load the **Expanded multi-program sample**. Then generate a schedule.

*Expected:* About 22 faculty (some part-time), 48 subjects across BSIT, BSCS and BSIS, and 10 labs. The schedule is generated and is conflict-free.
☐ Pass ☐ Fail

**K6. Reset Demo Data**
1. As Administrator or IT, press **Reset Demo Data** in the sidebar and confirm.

*Expected:* New sample data of the same kind replaces everything: no schedule, no history and no requests. Cancelling the confirmation changes nothing.
☐ Pass ☐ Fail

---

## L. Devices, browsers and performance

These must be checked by hand in real browsers and on a real phone.

**L1. Phone layout**
1. Open the app on a phone, or make the browser window about 375 px wide.

*Expected:* The sidebar collapses behind a menu button. Tables scroll sideways inside their cards instead of stretching the page. Dialogs fit the screen and can be scrolled. There is no sideways scroll of the whole page.
☐ Pass ☐ Fail

**L2. Several browsers**
1. Repeat tests A1, B1, C4 and K3 in at least two different browsers.

*Expected:* The same results in each.
☐ Pass ☐ Fail

**L3. Generation time**
1. Time **Generate Schedule** on the Standard sample and on the Expanded sample.

*Expected:* Each finishes in **under 5 seconds** (on a development laptop they took about 0.1 s and 0.5 s). The page does not freeze afterwards.
☐ Pass ☐ Fail

**L4. Keyboard use**
1. Without the mouse, use Tab and Enter to sign in, open a page, open a dialog and close it with Esc or its close button.

*Expected:* Controls can be reached and used. The focused control is visible.
☐ Pass ☐ Fail

**L5. Works without internet**
1. Serve the app on the same computer (for example with Live Server or `npx serve`), then switch the internet off (airplane mode or unplug the cable) and reload the page. Sign in and generate a schedule.

*Expected:* The app loads fully styled in the Inter font and everything works as normal. (A copy published on the web needs the internet to reach the page itself; the libraries are not the problem.)
☐ Pass ☐ Fail

---

## M. Automated engine tests

The engine (`engine.js`) has its own tests that you can run in seconds.

**M1. Run the tests**
1. With Node.js: from the project folder run `node tests/engine.test.js`.
2. Without Node.js: serve the folder and open `/tests/run.html`.

*Expected:* A list of `ok` lines and a last line `27 passed, 0 failed`. A line starting `FAIL` shows which check broke.
☐ Pass ☐ Fail

---

## End-to-end scenarios

Run these after the individual tests. Each should work from start to finish without errors.

**S1. Planning a semester (Administrator)**
1. Load the Standard sample. Add one teacher and two subjects. Generate. Check Conflict Detection. Approve with a comment. Export the timetable to CSV and print it to PDF. Download a backup.

*Expected:* Every step succeeds and the final schedule is conflict-free and Approved.
☐ Pass ☐ Fail

**S2. A teacher goes on leave mid-semester**
1. Faculty Member submits a leave for a day when they teach. Administrator approves it. Update affected classes. Check that no class of that teacher is on that day. End the leave afterwards.

*Expected:* The teacher's classes move away from the leave days, no conflicts remain, and ending the leave frees the times without changing the schedule.
☐ Pass ☐ Fail

**S3. Moving to another computer**
1. Download a backup. Open the app in a different browser. Restore the file. Check faculty, subjects, schedule and history.

*Expected:* Everything matches the original browser.
☐ Pass ☐ Fail

**S4. Every role in one session**
1. Use **Viewing as** to visit each role. Confirm each sees only its allowed pages and actions.

*Expected:* No role can reach a page or button outside the table in section 1.
☐ Pass ☐ Fail

---

## Quality characteristics (ISO/IEC 25010)

If your study evaluates the system against the ISO/IEC 25010 product quality model, this shows which tests give evidence for each characteristic. The tests are only part of the evidence (for usability and satisfaction you would also use your questionnaire).

| Characteristic | What it asks | Tests that give evidence |
|---|---|---|
| **Functional suitability** | Does it do what it should, correctly and completely? | B, C, D, E, F, G, H, I, J, M, S1, S2 |
| **Performance efficiency** | Is it fast enough? | L3, K5 |
| **Compatibility** | Does it work in different environments? | L2, L1 |
| **Usability** | Can people learn and use it? Is it accessible? | A1, A3, E3, G3, L1, L4, and respondent feedback |
| **Reliability** | Does it keep working, and keep data? | K1, K3, K4, C2 (live recount), M1 |
| **Security** | Is access limited to the right people? | A2, A4, A5, I9, S4 (role limits only) |
| **Maintainability** | Can it be changed and tested easily? | M1 (automated tests; the code is documented in the README) |
| **Portability** | Can it run elsewhere? | K2, K3, S3, L2 |

**Be honest about security:** there is no password and no server. The role limits only control what the screen shows, and all data stays in the user's own browser. This is acceptable for a research prototype, but it is *not* evidence of real access control. Say so in your paper.

---

## Known limits (do not report these)

Please read the README section *Limitations and known issues*. Examples: data lives only in one browser, and sign-in has no password.

---

## Results sheet and defect log

**Tester**: ____________________ **Role(s) tested**: ____________________ **Date**: ____________

**Browser and version**: ____________________ **Device / screen**: ____________________

| Section | Tests | Passed | Failed | Notes |
|---|---:|---:|---:|---|
| A. Sign-in and access | 5 | | | |
| B. Generation and approval | 8 | | | |
| C. Conflicts | 6 | | | |
| D. Manual editing | 4 | | | |
| E. Faculty | 5 | | | |
| F. Subjects and rooms | 7 | | | |
| G. CSV | 4 | | | |
| H. Workload and departments | 3 | | | |
| I. Availability and leave | 9 | | | |
| J. History, reports, notifications | 5 | | | |
| K. Saving, backup, reset | 6 | | | |
| L. Devices and performance | 5 | | | |
| M. Automated tests | 1 | | | |
| End-to-end scenarios | 4 | | | |
| **Total** | **72** | | | |

**Defect log**

| # | Test ID | Steps you did | Expected | What happened | Severity (High / Medium / Low) |
|---|---|---|---|---|---|
| 1 | | | | | |
| 2 | | | | | |
| 3 | | | | | |

*Severity:* **High** = data lost, a crash, or a wrong schedule. **Medium** = a feature does not work as described but there is a workaround. **Low** = wording, layout or a small annoyance.
