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
14. [M. Automated tests](#m-automated-tests)
15. [N. Setting up with a school's data](#n-setting-up-with-a-schools-data)
16. [End-to-end scenarios](#end-to-end-scenarios)
17. [Quality characteristics (ISO/IEC 25010)](#quality-characteristics-isoiec-25010)
18. [Results sheet and defect log](#results-sheet-and-defect-log)

---

## 1. Before you start

**What you need**

- A modern browser (Chrome, Edge, Firefox or Safari). No internet connection is needed once the app is being served: its libraries and font are stored in the `vendor/` folder.
- The app open in the browser. Use the published site, or serve the folder and open it (see the README, *Getting started*). Opening `index.html` by double-clicking usually does not work.
- For section M only: Node.js, or the `tests/run.html` page.
- For section N: Microsoft Excel or another spreadsheet program that saves `.xlsx` files. For N9, also Google Sheets and LibreOffice Calc if you have them.

**How the data works**

- Everything is stored in *your* browser and nothing is sent anywhere. A different browser or computer starts with its own sample data.
- The sample data is random. **Names, subjects and conflict counts differ each time you load a sample**, so the steps say "any teacher" instead of a name.
- To start a test from a known state: sign in as **Administrator**, open **Settings → Testing tools → Standard sample** and confirm. That gives 9 faculty, 18 subjects and 6 labs, with no schedule yet. Sign-in accounts are not part of the data: loading a sample keeps every account.

**Roles**

| Role (set by the account) | Pages in the sidebar |
|---|---|
| Academic Administrator | Overview, Faculty, Workload Management, Subjects, Class Schedules, Schedule History, Rooms, Departments, Conflict Detection, Reports, Accounts |
| Department Chair | Same as Administrator, **without Departments and Accounts** |
| Faculty Member | Overview and Class Schedules only |
| IT Professional / Staff | Same as Administrator |

Every role also has **Settings** and **Sign Out** in the Account part of the sidebar; Settings starts with *Your account*, where anyone can change their own password. Only Administrator and IT also see **Reset Demo Data** there, and *Set up with your school's data*, *Backup and restore* and *Testing tools* in Settings.

**Test accounts.** Everyone signs in with their own username and password, and the account decides the role; there is no way to switch role without signing out. The first time the app opens in a browser, it asks for the first Administrator account (test A1). Then make one account for each other role (test A2): a Department Chair (`chair1`), an IT Professional/Staff (`it1`) and a Faculty Member (`teacher1`) linked to any teacher in the Faculty list. Write the usernames and passwords on your results sheet. In this guide, "sign in as Administrator" (or another role) means "sign in with that role's test account".

**How to record results**

Mark each test **Pass** or **Fail**. For a failure, add a line in the [defect log](#results-sheet-and-defect-log): the test ID, what you did, what you expected, and what happened. A screenshot helps. Please read [Known limits](#known-limits-do-not-report-these) first so you do not report them as bugs.

**Words used in this guide**

- *Schedule*: the generated weekly timetable. *Gene* or *class*: one subject section placed at a day, period, teacher and room.
- *Conflict*: a rule the schedule breaks, such as one teacher in two places at once.
- *Pending Review / Approved / Rejected*: the approval status of the current schedule.

---

## A. Sign-in and access by role

**A1. The first Administrator account**
1. Open the app in a browser where nobody has made an account yet. The *Set up SchedWiseAI* screen appears. (If the *Sign in* screen appears instead, an account already exists: sign in with it and go to A2.)
2. Try a password of 7 characters, a username with a space, and two passwords that differ, pressing **Create account and sign in** each time.
3. Enter the full name `Dr. Maria Santos`, the username `msantos` and a password of at least 8 characters, twice. Press **Create account and sign in**.

*Expected:* (2) Each attempt shows a red message saying what is wrong, and no account is made. (3) The Administrator Overview opens with the greeting "Welcome back, Maria" (not "Dr."); the round avatar shows **MS** and "Academic Administrator". There is no menu for switching roles.
☐ Pass ☐ Fail

**A2. One account per role**
1. Open **Accounts** and press **Add account**. Make a *Department Chair* account `chair1`, an *IT Professional/Staff* account `it1` and a *Faculty Member* account `teacher1` with any teacher. For each, type a temporary password or press **Suggest**, and write it down.
2. Try to make a second account with the username `TEACHER1`, and another Faculty Member account for the same teacher.

*Expected:* (1) Each account is listed with its role and the status "Must choose a password"; `teacher1` shows its teacher. The yellow note "Only one account can manage accounts…" goes away once `it1` exists. (2) Both are refused with a red message (the username is taken, ignoring capitals; the teacher already has an account).
☐ Pass ☐ Fail

**A3. Signing in and choosing your own password**
1. Press **Sign Out**. Sign in as `teacher1` with a wrong password, then with its temporary password.
2. On *Choose your own password*, type the temporary password again twice and press **Save and continue**. Then type a new password twice and press it again.
3. Do the same for `chair1` and `it1`.

*Expected:* (1) A wrong password shows "Wrong username or password."; the temporary one opens *Choose your own password*. (2) Reusing the temporary password is refused; the new one opens the person's own Overview, greeted by first name. (3) Each role lands on its own Overview: the Faculty page shows that person's own classes and requests, the Chair page its department view, and the IT page its system view.
☐ Pass ☐ Fail

**A4. Sidebar pages per role**
1. For each role, compare the sidebar with the table in section 1.

*Expected:* Faculty Member sees only Overview and Class Schedules. Department Chair has no Departments and no Accounts. Administrator and IT see all eleven pages, including Accounts. **Reset Demo Data** is shown only to Administrator and IT.
☐ Pass ☐ Fail

**A5. Faculty see only their own classes**
1. As Administrator, generate a schedule (test B1).
2. Sign out, then sign in as `teacher1`. Open **Class Schedules**.

*Expected:* Only that teacher's classes are shown. There are no Approve, Reject, Generate or Full Regenerate buttons.
☐ Pass ☐ Fail

**A6. Staying signed in, and closing the browser**
1. While signed in, reload the page (F5).
2. Close the browser completely (every window), open it again and go back to the app.

*Expected:* (1) You are still signed in. (2) The *Sign in* screen appears.
☐ Pass ☐ Fail

**A7. Turning an account off and resetting a password**
1. As Administrator, open **Accounts** and press **Turn off** on `teacher1`. Sign out and sign in as `teacher1` with its password.
2. Sign in as Administrator, press **Turn on** on `teacher1`, then **Reset password** and give a new temporary password. Sign in as `teacher1` with the old password, then with the new one.

*Expected:* (1) The status says "Turned off", and signing in says "This account is turned off. Ask an Administrator or IT staff member." (2) After Turn on the status is "Active"; after the reset it is "Must choose a password". The old password no longer works; the new one works and leads to *Choose your own password*.
☐ Pass ☐ Fail

**A8. Nobody can lock the school out**
1. As Administrator, find your own row in **Accounts** (marked "(you)") and press **Edit**.
2. Sign in as `it1`. While `msantos` is the only Administrator, press **Delete** and then **Turn off** on its row.

*Expected:* (1) Your own row has only **Edit**, and its Role cannot be changed. (2) Both show "SchedWiseAI needs at least one active Administrator account…", and `msantos` stays Active.
☐ Pass ☐ Fail

**A9. Changing your own password**
1. As any role, open **Settings → Your account**. Enter a wrong current password and a new password twice, and press **Change password**.
2. Enter the right current password and the new password twice, and press it again. Sign out and sign in with the new password.

*Expected:* (1) "Your current password is not right." (2) "Your password has been changed." The new password works and the old one does not.
☐ Pass ☐ Fail

**A10. Accounts are kept when the data is replaced**
1. As Administrator, open **Faculty** and rename the teacher linked to `teacher1`. Open **Accounts**.
2. Use **Reset Demo Data** (standard sample) and open **Accounts** again. Sign in as `teacher1`.
3. As Administrator, edit `teacher1` and choose one of the new teachers. Sign in as `teacher1` again.

*Expected:* (1) `teacher1` shows the new name (still linked). (2) Every account is still there. The new sample has new teachers, so `teacher1` says "Not linked", a yellow note lists it, and `teacher1` sees a message about the account instead of a schedule (never another teacher's). (3) `teacher1` sees the chosen teacher's Overview.
☐ Pass ☐ Fail

**A11. Passwords are never stored**
1. As Administrator, press **F12** and open **Application** (Chrome, Edge) or **Storage** (Firefox) → **Local Storage** → this site. Look at `schedwiseai_accounts_v1`. Then look at **Session Storage**.

*Expected:* Each account has a `salt` and a `hash` (long strings of letters and digits), and none of the passwords you typed appears anywhere. Session Storage holds only the signed-in account's id under `schedwiseai_session_v1`.
☐ Pass ☐ Fail

---

## B. Schedule generation and approval

*Start from a fresh Standard sample, signed in as Administrator.*

**B1. Generate a schedule**
1. Open **Class Schedules** and press **Generate Schedule**.

*Expected:* A weekly timetable appears (Monday to Saturday, 6 periods a day). The header shows **✓ Conflict-free**, a fitness score, and "Pending Review" as the approval status. A notification says a new schedule was generated.
☐ Pass

**B2. Convergence chart**
1. Under the timetable, find "GA Convergence". Press **How to read this chart**, then **Hide chart** and show it again.

*Expected:* A chart with a best-score line (left scale) and an average line (right scale), and a plain-language sentence such as "Best: … → … · Average: … → …". The help text opens and closes.
☐ Pass

**B3. Grid and By Faculty views**
1. Switch between **Weekly Grid** and **By Faculty**. In By Faculty, choose different teachers.
2. In the Weekly Grid, read the **Time** column and look at one class.

*Expected:* The grid shows every class once. Its rows go every 30 minutes, from 7:00 AM to 3:30 PM, and the first row of each period also shows the period (7:00 AM P1, 8:30 AM P2 … 2:30 PM P6). Each class covers the three rows of its period (a P1 class fills 7:00 to 8:30 AM), and classes held at the same time share one block. By Faculty shows only the chosen teacher's classes, with 12-hour times such as "Mon 8:30-10:00 AM" or "Mon 11:30 AM-1:00 PM" (the same style is used in Edit Assignment, Workload Management, the period lists and the CSV export). Nothing is placed on Sunday.
☐ Pass

**B4. Curriculum-aware option**
1. Tick **Use curriculum (avoid overlaps…)**. Press **Full Regenerate**.

*Expected:* The header shows a "Curriculum" badge: "no overlaps", or a count. The schedule stays conflict-free.
☐ Pass

**B5. Approve a schedule**
1. In the approval panel, type a comment and press **Approve**.

*Expected:* The status changes to **Approved** and your comment is shown. A notification says the schedule was approved.
☐ Pass

**B6. Reject a schedule**
1. Type a comment and press **Reject**.

*Expected:* The status changes to **Rejected** with your comment, and a notification says so.
☐ Pass

**B7. A change returns the schedule to Pending Review**
1. Approve the schedule. Then edit one class (see D1).

*Expected:* The status goes back to **Pending Review**.
☐ Pass 

**B8. Full Regenerate**
1. Press **Full Regenerate**.

*Expected:* A new schedule replaces the old one and the status is Pending Review. In **Schedule History** there is one more version.
☐ Pass 

---

## C. Conflicts

*Start with a generated, conflict-free schedule.*

**C1. A clean schedule**
1. Open **Conflict Detection**.

*Expected:* The page lists the rule categories (teacher double-booking, room double-booking, unqualified teacher, teacher unavailable, room-type mismatch, fixed time not respected, room capacity) and the total is 0.
☐ Pass

**C2. Create a conflict by hand and watch the count update**
1. In **Class Schedules**, click any class (see D1) and move it to a time when that teacher already has another class.
2. Save.

*Expected:* The header changes to **⚠ 1 conflicts remaining** straight away, with no regenerate needed. The Conflict Detection page and the sidebar badge show the same number.
☐ Pass 

**C3. Test conflicts (all seven kinds)**
1. Open **Settings → Testing tools**. Under "Create test conflicts" press each button one at a time, then **Create all of them**.

*Expected:* Each button says exactly what it changed. After each one, Conflict Detection shows that kind counted. The "Teacher overload" button is labelled *(not a conflict)* and does not add to the conflict total. Earlier test conflicts are not undone by later ones.
☐ Pass

**C4. Update affected classes**
1. With conflicts present, open **Class Schedules**. Press **Update affected classes** in the orange banner.

*Expected:* Only the classes that broke a rule move. A "What changed" panel lists each move (from → to) and how many classes stayed put. The header returns to **✓ Conflict-free**.
☐ Pass

**C5. Banner when nothing was flagged**
1. Edit a teacher (E2) so that one of their classes becomes unqualified.
2. Open **Class Schedules**.

*Expected:* A banner "Conflicts found in this schedule" appears with the violation count and an **Update affected classes** button.
☐ Pass

**C6. Overload warning**
1. In **Faculty**, edit a teacher who has classes and set **Maximum Teaching Units** to 1. Save.
2. Open **Class Schedules**.

*Expected:* An orange badge "⚠ 1 teacher over maximum units" appears next to **✓ Conflict-free** (overload is a warning, not a conflict). Hover the badge to see the teacher's name. The Workload page shows that teacher as **Overloaded**.
☐ Pass

**C7. A subject that cannot be scheduled**
1. In **Subjects → Add Subject**, add a **Laboratory** subject with **99** enrolled students (more than any lab seats). Save.
2. Open **Class Schedules** and press **Update affected classes**. Then open **Conflict Detection**.
3. Edit the subject, change **Class Type** to **Online**, save, and press **Update affected classes** again.

*Expected:* After step 2 the header shows **⚠ 1 conflicts remaining**, not Conflict-free. The banner says "Some subjects cannot be scheduled", with no Update button (an update cannot help), and the class is not drawn in the grid. Conflict Detection shows **Cannot be scheduled: 1** and lists the subject with what to change ("No laboratory seats 99 students…"). After step 3 the class is placed and the schedule is **✓ Conflict-free** again.
☐ Pass ☐ Fail

---

## D. Manual editing

**D1. Edit one class**
1. In the weekly grid, click a class. A dialog "Edit Assignment" opens.
2. Change the **Time Slot**, then press **Save Changes**.

*Expected:* The class moves. The conflict count is recalculated at once and the status becomes Pending Review.
☐ Pass

**D2. Only suitable choices are offered**
1. Open the edit dialog for a laboratory class and for an online class.

*Expected:* **Faculty** lists only teachers with the needed specialization. **Room** for a lab class lists only labs with enough seats (with their capacity); for an online class it shows "Online class — no room needed". Time slots where the chosen teacher is unavailable are marked "— teacher unavailable".
☐ Pass ☐ Fail

**D3. Fixed-time subjects**
1. Make a subject with a fixed day and period (F2), regenerate, then open its edit dialog.

*Expected:* The time slot cannot be changed: it shows "📌 Fixed: <time> — change it in Subjects".
☐ Pass

**D4. Remove a class**
1. In the edit dialog, press **Remove**.

*Expected:* The class disappears from the grid. The header shows "1 unscheduled (manually removed)". It is **not** counted as a conflict.
☐ Pass

---

## E. Faculty

**E1. Add a teacher**
1. Open **Faculty → Add Faculty**. Enter a name, tick at least one subject area (or type a new one in the box under them and press **Add**) and some preferred days, set the maximum units, then save.

*Expected:* The form starts with no subject area ticked. The teacher appears in the list with 0 units and the status **Underloaded** (or "No assignment yet" if no schedule exists).
☐ Pass ☐ Fail

**E2. Edit a teacher and see conflicts update**
1. With a generated schedule, edit a teacher who has classes. Untick their subject areas and tick only one they do not teach. Save.
2. Open **Class Schedules** and **Conflict Detection**.

*Expected:* The conflict count rises straight away ("Unqualified" rows), and the banner from C5 appears.
☐ Pass ☐ Fail

**E3. Validation**
1. In the Add Faculty form, leave the name empty or leave every subject area unticked, then try to save.

*Expected:* The form does not save and the dialog stays open.
☐ Pass ☐ Fail

**E4. Delete a teacher who has classes**
1. Delete a teacher who is teaching in the current schedule. First press **Cancel** in the confirmation, then delete again and confirm.

*Expected:* The confirmation names the teacher and how many classes they teach; Cancel changes nothing. After confirming, the teacher is removed. The schedule is flagged ("… was removed — N class(es) need a new teacher") and the count shows conflicts. **Update affected classes** gives those classes a new teacher.
☐ Pass ☐ Fail

**E5. Profile and schedule links**
1. In the Faculty list, press **View Profile**, then **View Schedule** for a teacher.

*Expected:* The profile shows employment status, rank, maximum units, current load, specializations, preferred days, unavailable times and requested preferred times. View Schedule opens Class Schedules on that teacher.
☐ Pass ☐ Fail

**E6. Form messages and limits**
1. Open **Add Faculty** and press **Save** after each of these: (a) leave the name empty; (b) type the name of an existing teacher in different capitals; (c) untick every subject area; (d) set **Maximum Teaching Units** to `0`, then `-5`, then leave it empty.
2. Finally enter valid values and save.

*Expected:* Each time a red message says what is wrong and nothing is saved: "Enter the teacher's full name.", "Another teacher is already called … Names must be different, because a teacher's sign-in account is linked by name.", "Tick or add at least one subject area.", "Maximum teaching units must be between 1 and 40." or "… must be a whole number." With valid values the teacher is saved and the dialog closes.
☐ Pass ☐ Fail

---

## F. Subjects and rooms

**F1. Add an online subject**
1. Open **Subjects → Add Subject**. Fill in the fields (code, name, section such as `BSIT-2A`, units, subject area, **Class Type: Online**, students) and save.

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
1. Delete a subject that is in the current schedule, and confirm.

*Expected:* A confirmation names the subject and section first (Cancel changes nothing). After confirming, the subject and its class disappear and the other classes stay with the right subjects (none shift to another subject).
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
1. Delete a room that has classes in the current schedule, and confirm.

*Expected:* A confirmation names the room and how many classes use it (Cancel changes nothing). After confirming, the schedule is flagged ("… was removed — N class(es) need a new room"). **Update affected classes** re-places only those classes.
☐ Pass ☐ Fail

**F8. Subject form messages**
1. Open **Add Subject**. Enter the code and section of a subject already in the list (for example its code in small letters) and press **Save**.
2. Change the section to a new one. Set **Units** to `0` and save; then set Units to `3` and **Enrolled Students** to `2.5` and save.

*Expected:* Red messages: "<code> is already offered to section <section>.", "Units must be between 1 and 10.", "Enrolled students must be a whole number." Nothing is saved until the values are valid.
☐ Pass ☐ Fail

**F9. Room form messages**
1. Open **Add Room**. Type the name of an existing room and save. Then use a new name with **Capacity** `-1` and save.

*Expected:* Red messages: "There is already a room called …" and "Capacity must be a whole number." Nothing is saved until the values are valid.
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
1. Press **Import CSV** on Faculty and press **Load example template**. In the data row, delete the specializations `"Programming;Databases"`, keeping the commas on both sides. Press **Import**.

*Expected:* A red message "Nothing was imported. Row 1: specialization is missing." and no teacher is added. Also try a blank name, and a subject with `units` set to `abc`. (Any subject area name is accepted, because every school has its own: a new name becomes a new subject area.)
☐ Pass ☐ Fail

**G4. Subject import with a fixed time**
1. Import the Subjects example (it includes `NSTP1` with `fixedDay` Sat and `fixedPeriod` 1).

*Expected:* NSTP1 appears and shows a fixed time on Saturday, period 1.
☐ Pass ☐ Fail

**G5. Spreadsheet formulas are not run**
1. Add a teacher named `=1+1` (or `+SUM(1,1)`). Press **Export CSV** on the Faculty page and open the file in Excel or Google Sheets.

*Expected:* The cell shows the text `=1+1`, not the number 2. (The exported file puts an apostrophe in front, which spreadsheets hide.) Delete the test teacher afterwards.
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

*Expected:* Each subject area found in the data (the teachers' and the subjects') appears as a department with load %, overload and conflict counts, and an "Issues Requiring Attention" list. Department Chair does not see this page.
☐ Pass ☐ Fail

---

## I. Availability and leave

**I1. A faculty member asks for a change**
1. Sign in as `teacher1` (the Faculty Member account from A2). Open **Class Schedules → My Schedule**. Press **Request Availability Change / Leave**, choose **Availability Change** as the request type, pick the day-and-period times you cannot teach, add a "prefer instead" time, and submit.

*Expected:* A message at the bottom says the request was sent for approval and that the schedule changes only after a chair or administrator approves it. The request is listed as **Pending**. A notification is created. Nothing about the schedule changes yet, and there is no update button (nothing has been approved).
☐ Pass ☐ Fail

**I2. Approve a request that clashes with a class**
1. As Administrator open **Faculty → Leave & Availability**. Approve a request that blocks a time when that teacher has a class.

*Expected:* The status becomes **Approved**. An orange banner "Schedule needs an update" ("… availability changed … N current class(es) now clash") appears right there on the Leave & Availability tab, with an **Update affected classes** button. The same banner is on Class Schedules, and the conflict count shows the clashes.
☐ Pass ☐ Fail

**I3. Update affected classes after an approval**
1. Press **Update affected classes** in that banner (on the Leave & Availability tab or on Class Schedules).

*Expected:* Class Schedules opens. The teacher's clashing classes move, preferably to the "prefer instead" times, and the others stay. The "What changed" panel confirms the approved request is now respected.
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

**J6. Search (Administrator, Chair or IT)**
1. Click the search box in the top bar and type part of a teacher's name. Use the arrow keys and press **Enter**.
2. Search for a subject code, then a room name, and click a result. Then type nonsense such as `qqq`, and press **Esc**.

*Expected:* Results appear as you type, grouped under Faculty, Subjects and Rooms. Enter opens the highlighted teacher's profile; a subject opens its edit form; a room opens its edit form. Nonsense shows "No matches for "qqq"." Esc clears the box and closes the list.
☐ Pass ☐ Fail

**J7. Search (Faculty Member)**
1. Sign in as a Faculty Member. The search box says "Search my classes...". Search for one of your subject codes, then for a subject only another teacher teaches.

*Expected:* Your own class is listed under "My classes", and choosing it opens **My Schedule**. Classes of other teachers are never listed.
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
2. Upload a school's data (N3 and N4), then press **Reset Demo Data** again and read the confirmation before confirming.

*Expected:* New sample data of the same kind replaces everything: no schedule, no history and no requests. Cancelling the confirmation changes nothing. With the school's data loaded, the confirmation names the uploaded file and suggests downloading a backup first; after confirming, the standard sample is loaded, the Overview shows "You are looking at sample data." again, and Settings says "Currently loaded: sample data (standard sample)".
☐ Pass ☐ Fail

**K7. A damaged backup is refused**
1. Make a copy of a backup file from K2 and open the copy in Notepad. Find the first `"message":` inside `"notifications"` and change its text (including the quotes) to the number `5`. Save.
2. Restore that damaged copy.

*Expected:* A red message such as "Entry 1 of the notification list in the backup is damaged." Nothing changes, and the app keeps working.
☐ Pass ☐ Fail

**K8. Recovery screen** *(developer test: needs the browser's developer tools)*
1. Download a backup first (K2). Press **F12**, open the **Console** tab, paste this line and press Enter:
   `s=JSON.parse(localStorage.schedwiseai_prototype_v1); s.notifications.unshift({id:1,message:{},read:false}); localStorage.schedwiseai_prototype_v1=JSON.stringify(s); location.reload()`
2. Press **Reset to sample data** and confirm. Then restore the backup from step 1.

*Expected:* Instead of a blank page, the app shows "SchedWiseAI could not start" with **Download saved data**, **Reset to sample data** and **Try again**. After Reset the sign-in screen appears, and the backup restores your data.
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

*Expected:* Controls can be reached and used. The focused control is visible. When a dialog opens, the cursor is already in its first box; **Esc** closes it and the focus goes back to the button that opened it.
☐ Pass ☐ Fail

**L5. Works without internet**
1. Serve the app on the same computer (for example with Live Server or `npx serve`), then switch the internet off (airplane mode or unplug the cable) and reload the page. Sign in and generate a schedule. As Administrator, open **Settings** and press **Download blank template**, then upload a filled workbook (N3).

*Expected:* The app loads fully styled in the Inter font and everything works as normal, including the template download and the upload check. (A copy published on the web needs the internet to reach the page itself; the libraries are not the problem.)
☐ Pass ☐ Fail

**L6. Start-up speed**
1. Press **Ctrl+F5** on the app and count how long until the sign-in screen or Overview appears. Then press **F12** and look at the **Console** tab.

*Expected:* The first screen appears in **under 2 seconds** on a typical laptop (about 0.3 s on a development laptop). The console does **not** say "app.js is older than app.jsx". If it does, run M2.
☐ Pass ☐ Fail

---

## M. Automated tests

The engine (`engine.js`) and the workbook checker (`importer.js`) have their own tests that you can run in seconds.

**M1. Run the tests**
1. With Node.js: from the project folder run `node tests/engine.test.js`, then `node tests/importer.test.js`.
2. Without Node.js: serve the folder and open `/tests/run.html`. It runs all three.

*Expected:* Lists of `ok` lines. The engine tests end with `33 passed, 0 failed`, the *Importer tests* with `18 passed, 0 failed`, and the *Accounts tests* with `13 passed, 0 failed` (with Node.js, run `node tests/accounts.test.js` too; it needs Node.js 19 or newer). A line starting `FAIL` shows which check broke.
☐ Pass ☐ Fail

**M2. The ready-compiled app is up to date**
1. Serve the folder and open `/tools/build.html`. Do this before the defense and after any change to `app.jsx`.

*Expected:* "✓ app.js is up to date with app.jsx." If it says *out of date*, press **Build app.js**, save the downloaded `app.js` into the project folder (replacing the old one) and open the page again: it should now say up to date.
☐ Pass ☐ Fail

---

## N. Setting up with a school's data

*Start from a fresh Standard sample, signed in as Administrator, and generate a schedule (B1) so there is something to replace. IT sees the same card; Department Chair and Faculty Member do not.* The tests use one small example school, built in N3.

**N1. Download the blank template**
1. Open **Settings**. In the card **Set up with your school's data**, press **Download blank template**. Open the file in Excel.

*Expected:* The card says "Currently loaded: sample data (standard sample)". A file `SchedWiseAI-template.xlsx` downloads and a green message says "Downloaded the blank template." It has four sheets: **Instructions**, **Faculty**, **Subjects** and **Rooms**. Row 1 of each data sheet holds the column names (required ones end in `*`), and the rows under it start with `EXAMPLE`. The Instructions sheet explains every column and lists the six periods.
☐ Pass ☐ Fail

**N2. A workbook with mistakes is refused**
1. In the template's **Faculty** sheet, copy the first `EXAMPLE` row to the row under the examples, remove the word `EXAMPLE` from its name, and change **Max units** to `50`. In the **Subjects** sheet, copy the second `EXAMPLE` row the same way, remove `EXAMPLE` from its code, and empty its **Section** cell. Save it as an Excel workbook (`.xlsx`).
2. In the card press **Choose filled workbook (.xlsx)…** and choose the file.
3. Then choose a file that is not a workbook, for example a photo renamed to `photo.xlsx`.

*Expected:* For the workbook, the result starts with ✗ and says "fix the errors in the file, save it, and choose it again". The **Errors** list is grouped by sheet and shows "Row N, Max units: Use a whole number from 1 to 40." and "Row N, Section: This cell is required.", where N is the row number Excel shows. **Replace my data with this file** cannot be pressed. For the photo, a red message ends "This file could not be read as an Excel workbook (.xlsx)." Nothing changes in either case: the Faculty page still shows the sample teachers.
☐ Pass ☐ Fail

**N3. Warnings explain but do not block**
1. Make a new copy of the template and fill it with this school (delete the `EXAMPLE` rows or leave them; they are skipped):
   - **Faculty:** `Ana Cruz` · Subject areas `Accounting` · Max units `18` · Employment status `Contractual` · Academic rank `Dean`; and `Ben Lim` · `Programming` · `21` (leave status and rank empty).
   - **Subjects:** `ACC101` · Program `BSA` · `Financial Accounting` · Section `BSA-1A` · Units `3` · Subject area `Accounting` · Class type `Online` · Students `40` · Year level `1` · Semester `1st`; `IT101` · `BSIT` · `Introduction to Computing` · `BSIT-1A` · `3` · `Programming` · `Laboratory` · `35` · `1` · `1st`; `NUR101` · `BSN` · `Nursing Care 1` · `BSN-1A` · `3` · `Nursing` · `Online` · `30` · `1` · `1st`.
   - **Rooms:** `Lab 101` · Capacity `40`.
2. Save it as `Our-School.xlsx` and choose it in the card.

*Expected:* "✓ 2 teachers · 3 subjects · 1 room". There are no errors. **Warnings (1)** says "Row 4, Subject area: No teacher has the subject area 'Nursing', so NUR101 (BSN-1A) will show as Cannot be scheduled." (the row number may differ if you kept the examples). **Notes** (closed until you open them) list the defaults used, for example "1 teacher has no employment status: Full-time used." **Replace my data with this file** can be pressed.
☐ Pass ☐ Fail

**N4. Replace asks first, and offers a backup**
1. With the result of N3 shown, press **Replace my data with this file**. Read the dialog, then press **Cancel**.
2. Press **Replace my data with this file** again, then **Download a backup first**.
3. Press **Replace my data**. Then reload the page (F5).

*Expected:* The dialog "Replace your data?" says the faculty, subjects and rooms will be replaced by the 2 teachers, 3 subjects and 1 room in Our-School.xlsx, and that the schedule, its saved versions and all requests will be cleared. Cancel changes nothing. *Download a backup first* downloads a backup, shows a green message, and keeps the dialog open. After **Replace my data**, Class Schedules opens with no schedule and a **Generate Schedule** button; Faculty lists only Ana Cruz and Ben Lim; Schedule History is empty; the bell has "Uploaded school data from Our-School.xlsx: 2 teachers, 3 subjects, 1 room."; Settings says "Currently loaded: your school's data, uploaded <date and time> from Our-School.xlsx". After the reload all of this is still there. (Restoring the backup from step 2 brings the sample back; see K3.)
☐ Pass ☐ Fail

**N5. Generate from the uploaded data**
1. On Class Schedules press **Generate Schedule**. Then open **Conflict Detection**.
2. Edit **Ana Cruz** on the Faculty page, tick **Nursing** as well as Accounting, and save. On Class Schedules press **Full Regenerate**.

*Expected:* (1) ACC101 is placed as an online class with Ana Cruz, and IT101 in Lab 101 with Ben Lim. Under *Subjects that cannot be scheduled*, NUR101 is listed with what to change ("No teacher has the Nursing specialization. Add one in Faculty, …"), so the schedule is not conflict-free. (2) All three subjects are placed (NUR101 with Ana Cruz) and the schedule is conflict-free.
☐ Pass ☐ Fail

**N6. Edit the data in Excel and upload it again**
1. In Settings press **Download current data** and open the file.
2. Change Ana Cruz's **Max units** from `18` to `15`. Save, choose the file in the card, and replace (N4).

*Expected:* The file is named `SchedWiseAI-data-<date>.xlsx` and has the same three sheets with the current teachers, subjects and room, in the template's layout. The check shows "✓ 2 teachers · 3 subjects · 1 room" with no errors and no warnings. After replacing, Ana Cruz has 15 maximum units and still teaches Accounting and Nursing; the other teacher, the subjects and the room are unchanged (the schedule is cleared, as in N4).
☐ Pass ☐ Fail

**N7. The forms use the school's subject areas**
1. Open **Faculty → Add Faculty**. Look at the subject areas. Type `accounting` in the box under them and press **Add**. Close the form with Esc.
2. Edit **Ana Cruz** and look at Employment Status and Academic Rank. Press **Save** without changing anything. Edit **Ben Lim** and look at Academic Rank.
3. Open **Subjects → Add Subject**. Look at **Program** and **Subject area**. Choose **New subject area…**, type `Midwifery`, fill in code `MID101`, a name and section `BSM-1A`, and save. Open **Faculty → Add Faculty** again.
4. Open **Departments**.

*Expected:* (1) The list shows the school's areas, Accounting, Nursing and Programming, and none is ticked; typing `accounting` ticks the existing Accounting instead of adding a second one. (2) Ana Cruz shows Contractual and Dean, and still has Dean after saving; Ben Lim's rank shows "— (none)". (3) Program lists BSA, BSIT and BSN first and starts on BSA; Subject area lists the school's areas and **New subject area…**; MID101 is saved with Midwifery, and Add Faculty now lists Midwifery too. (4) Departments lists exactly the school's areas, including Midwifery.
☐ Pass ☐ Fail

**N8. The sample-data reminder**
1. With the school's data loaded, open **Overview**.
2. Open **Settings → Testing tools → Standard sample** and confirm. Open **Overview** again and press **Set up with your school's data →**.
3. Sign in as `it1`, `chair1` and `teacher1` in turn and look at their overviews.

*Expected:* With the school's data there is no reminder. With the sample loaded, the Administrator overview shows "You are looking at sample data." and the link opens Settings, where the card says "Currently loaded: sample data (standard sample)". IT sees the same reminder; Department Chair and Faculty Member never see it.
☐ Pass ☐ Fail

**N9. Workbooks saved by Google Sheets and LibreOffice**
1. Open `Our-School.xlsx` from N3 in **Google Sheets** (upload it to Google Drive and open it) and use **File → Download → Microsoft Excel (.xlsx)**. Choose the downloaded copy in the card.
2. Open `Our-School.xlsx` in **LibreOffice Calc** and use **File → Save As**, type *Excel 2007-365 (.xlsx)*. Choose that copy in the card.
3. Do not replace; just compare each result with N3.

*Expected:* Both copies give the same result as in N3: "✓ 2 teachers · 3 subjects · 1 room", the same warning and the same notes. If you do not have one of the programs, test the other and write which one you skipped under Notes.
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
1. Download a backup. Open the app in a different browser and create the first Administrator account there (backups do not contain accounts). Restore the file. Check faculty, subjects, schedule and history.

*Expected:* Everything matches the original browser. The accounts are only the ones made in this browser; make the others on the Accounts page.
☐ Pass ☐ Fail

**S4. Every role in one session**
1. Sign in with each role's test account in turn. Confirm each sees only its allowed pages and actions.

*Expected:* No role can reach a page or button outside the table in section 1.
☐ Pass ☐ Fail

---

## Quality characteristics (ISO/IEC 25010)

If your study evaluates the system against the ISO/IEC 25010 product quality model, this shows which tests give evidence for each characteristic. The tests are only part of the evidence (for usability and satisfaction you would also use your questionnaire).

| Characteristic | What it asks | Tests that give evidence |
|---|---|---|
| **Functional suitability** | Does it do what it should, correctly and completely? | B, C, D, E, F, G, H, I, J, M, N, S1, S2 |
| **Performance efficiency** | Is it fast enough? | L3, L6, K5 |
| **Compatibility** | Does it work in different environments? | L2, L1, L5, N6 and N9 (workbooks from Excel, Google Sheets and LibreOffice) |
| **Usability** | Can people learn and use it? Is it accessible? | A1, A3, E3, E6, F8, F9, G3, I1, J6, J7, L1, L4, N1, N2 (each mistake named by sheet, row and column), N8, and respondent feedback |
| **Reliability** | Does it keep working, and keep data? | K1, K3, K4, K7, K8, C2 (live recount), C7, M1, N2 and N4 (nothing changes until the file is valid and you confirm; a backup is offered first) |
| **Security** | Is access limited to the right people? | A1–A11 (own accounts and passwords, the role set by the account, passwords stored only as salted hashes, turned-off accounts, no lock-out), I9, J7, S4, N8 (role limits); G5, K7 and N2 (harmful or wrong file contents are neutralised or refused) |
| **Maintainability** | Can it be changed and tested easily? | M1, M2 (automated engine and importer tests and the build check; the code is documented in the README) |
| **Portability** | Can it run elsewhere? | K2, K3, S3, L2, N6 (the data can be taken out to Excel and brought back) |

**Be honest about security:** every person now signs in with their own password, passwords are stored only as salted PBKDF2-SHA256 hashes, and the role comes from the account. But there is no server: the accounts and the data live in the browser on that computer, so someone with full access to it (for example through the browser's developer tools) can still read or change them. Describe it in your paper as access control for a shared computer, not as protection against someone who controls the machine.

---

## Known limits (do not report these)

Please read the README section *Limitations and known issues*. Examples: data and accounts live only in one browser (people sign in on that computer, not from their own devices), and a forgotten password can only be reset by another Administrator or IT account.

---

## Results sheet and defect log

**Tester**: ____________________ **Role(s) tested**: ____________________ **Date**: ____________

**Browser and version**: ____________________ **Device / screen**: ____________________

| Section | Tests | Passed | Failed | Notes |
|---|---:|---:|---:|---|
| A. Sign-in, accounts and access | 11 | | | |
| B. Generation and approval | 8 | | | |
| C. Conflicts | 7 | | | |
| D. Manual editing | 4 | | | |
| E. Faculty | 6 | | | |
| F. Subjects and rooms | 9 | | | |
| G. CSV | 5 | | | |
| H. Workload and departments | 3 | | | |
| I. Availability and leave | 9 | | | |
| J. History, reports, notifications, search | 7 | | | |
| K. Saving, backup, reset | 8 | | | |
| L. Devices and performance | 6 | | | |
| M. Automated tests and build check | 2 | | | |
| N. Setting up with a school's data | 9 | | | |
| End-to-end scenarios | 4 | | | |
| **Total** | **98** | | | |

**Defect log**

| # | Test ID | Steps you did | Expected | What happened | Severity (High / Medium / Low) |
|---|---|---|---|---|---|
| 1 | | | | | |
| 2 | | | | | |
| 3 | | | | | |

*Severity:* **High** = data lost, a crash, or a wrong schedule. **Medium** = a feature does not work as described but there is a workaround. **Low** = wording, layout or a small annoyance.
