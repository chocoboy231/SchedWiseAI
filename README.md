# SchedWiseAI

**An Intelligent Faculty Workload Optimization and Academic Scheduling System Using Genetic Algorithm and Constraint-Based Optimization**

SchedWiseAI is a web-based prototype that builds conflict-free class schedules for a college and balances faculty teaching loads automatically. It was developed as a capstone project for **World Citi Colleges – Quezon City Campus** (BSIT).

Instead of scheduling by hand, an administrator presses **Generate Schedule**. A hybrid *constraint-based seeding + Genetic Algorithm* engine then produces a weekly timetable that respects teacher qualifications, teacher availability, room types and capacity, and (optionally) curriculum year-level overlaps. When something changes later, for example a teacher's leave is approved, the system can **update only the affected classes** instead of rebuilding everything.

> **Status:** working prototype for research and respondent testing. It runs entirely in the browser, with sample data or with a school's own teachers, subjects and rooms uploaded from an Excel workbook. See [Limitations](#limitations-and-known-issues).

---

## Contents

- [Try it](#try-it)
- [Features](#features)
- [User roles](#user-roles)
- [Getting started](#getting-started)
- [How the AI works](#how-the-ai-works)
- [Project structure](#project-structure)
- [Function reference](#function-reference)
- [Testing](#testing)
- [Data and privacy](#data-and-privacy)
- [Limitations and known issues](#limitations-and-known-issues)
- [Technology](#technology)
- [Authors](#authors)
- [License](#license)

---

## Try it

Once this repository is published with **GitHub Pages** (see [Getting started](#getting-started)), the app is available at:

```
https://<your-username>.github.io/<repository-name>/
```

The first time it opens, SchedWiseAI asks you to create the first **Administrator account** (full name, username and password). After that everyone signs in with their own account, and Administrators and IT staff create accounts for the others on the **Accounts** page. The first visit loads randomly generated sample data (9 faculty, 18 subjects, 6 laboratory rooms) so you can explore immediately. To schedule a school's real teachers, subjects and rooms instead, see [Set up with your school's data](#features).

---

## Features

| Module | What it does |
|---|---|
| **AI Schedule Generation** | Builds a full Monday–Saturday timetable (6 periods of 1.5 hours a day, 07:00–16:00, no classes on Sunday) using constraint-based seeding and a Genetic Algorithm. The weekly grid shows the day in 30-minute rows (7:00 AM, 7:30 AM, 8:00 AM …), and each class covers the three rows of its period. Shows a convergence chart for every run: the best and average score per generation, each on its own labelled scale, with a plain-language caption. |
| **Set up with your school's data** (Settings, Admin and IT) | Download a blank Excel template (an *Instructions* sheet and *Faculty*, *Subjects* and *Rooms* sheets with example rows), fill it in with Excel (or another spreadsheet program that saves `.xlsx`), and upload it. The file is checked before anything changes. **Errors** (a missing required cell, a number out of range, an unknown day or class type, a duplicate teacher) are listed by sheet, row and column and block the upload. **Warnings** (a subject area no teacher has, a lab class bigger than every lab, more units than the teachers can take, subjects from both semesters or from more than one school year) explain what will go wrong but do not block it. **Replace my data with this file** asks first and offers a backup, then replaces the faculty, subjects and rooms and clears the old schedule, its versions and the requests. **Download current data** gives everything in the same layout, to edit and upload again. Subject areas, programs, employment statuses and ranks in the forms then come from the school's data. While sample data is loaded, the Administrator and IT overviews say so and link to this card. The workbook uses the app's current time model (Monday–Saturday, six 1.5-hour periods, one meeting per subject section). |
| **Incremental Update** | After an approved availability change or leave, a new or edited subject, or an import, **Update affected classes** moves only the classes that now break a rule. Everything else stays exactly where it was, and a "What changed" panel lists each move. *Full Regenerate* is still available. |
| **Faculty Management** | Add, edit and delete faculty with subject areas (the school's own areas, taken from the data; a new one can be added in the form), preferred days, maximum units, employment status and academic rank (the built-in choices plus any the data already uses). Profile view, current load and workload status per person. Forms say what is wrong (missing name, a number out of range, a duplicate name, subject or room) instead of silently refusing to save. |
| **Workload Management** | Load % (assigned ÷ maximum units) with a bar, comparison with the group average, summary cards (teachers per status, units vs. capacity, average load, highest-to-lowest gap), each teacher's classes on click with how many subjects they can teach, and a built-in explanation of how the status is calculated and why a load can be low. |
| **Testing tools** (Settings, Admin and IT) | Load the standard sample (9 faculty, 18 subjects, 6 labs) or an expanded multi-program sample (22 faculty including part-time, 48 subjects across BSIT, BSCS and BSIS, 10 labs), and create deliberate conflicts of seven kinds (plus teacher overload) to test conflict detection and repair. The expanded subject list is illustrative test data, not an official curriculum. |
| **Availability and Leave** | Faculty request a change of availability or a leave with a **day-and-period picker**. A message confirms the request is waiting for approval. When a chair or administrator approves it, those times are saved as the teacher's unavailable times, and if they clash with a class, an **Update affected classes** button appears right there on the Leave & Availability tab (and on Class Schedules). An approved leave can be ended, and an approved availability change can be undone, which makes those times available again (the current schedule is left as it is; use Full Regenerate to use them). |
| **Subject Management** | Program (the programs in the data, plus BSIT, BSCS and BSIS), subject area (one of the school's areas, or **New subject area…**), school year, Major/Minor category, academic year level, semester, class type (**Online** or **Laboratory**), optional **fixed day/period** (for subjects whose time is set by another department, such as GE, PE or NSTP), and optional prerequisite with sequence checking. |
| **Room Management** | Laboratory rooms with capacity. Online classes need no room. |
| **Curriculum-aware scheduling** | Optional. Avoids overlapping classes that share the same program, year level and semester (different programs may share a time). |
| **Manual editing** | Click any scheduled class to change its teacher, room or time, or remove it. Conflicts are re-checked immediately. |
| **Approval workflow** | Every generated or changed schedule starts as *Pending Review*. Administrators and chairs approve or reject it with a comment. |
| **Conflict Detection** | Reports eight constraint categories: teacher double-booking, room double-booking, unqualified teacher, teacher unavailable, room-type mismatch, fixed time not respected, room capacity, and subjects that cannot be scheduled at all (no qualified teacher, or no lab big enough), which it lists with what to change. Overload is shown separately on the Workload, Faculty and Departments pages (see Limitations). |
| **Departments** | Each subject area in the data (every teacher's and every subject's) is treated as a department, with summary cards, teaching load %, overload and conflict counts, expandable workload charts, and an *Issues Requiring Attention* list. |
| **Reports** | Faculty Teaching Load, Room Utilization (with room × day heatmap), Department Summary, and Conflict Report. Every report exports to CSV; everything can be printed or saved as PDF. |
| **Schedule History** | Keeps up to 20 versions (full and update) with a fitness comparison chart. Any version can be restored. |
| **Search** | The search box in the top bar finds faculty, subjects and rooms as you type and opens the one you pick (keyboard: arrows, Enter, Esc). A Faculty Member searches their own classes. |
| **Notifications** | Bell icon with unread count for schedule, approval, request, import and upload events. |
| **Sign-in and accounts** | Everyone signs in with their own username and password, and the account decides the role; there is no role switch. The first visit creates the first Administrator. Administrators and IT staff add accounts (a Faculty Member account is linked to one teacher by name), edit them, reset forgotten passwords, turn accounts off or on, and delete them. A new or reset password is temporary: the person chooses their own at the next sign-in. There is always at least one active Administrator, and nobody can delete, turn off or change the role of their own account. Anyone can change their own password in Settings. Passwords are stored only as salted PBKDF2-SHA256 hashes; closing the browser signs the person out. Account changes appear in the IT overview's *Recent Activity*. |
| **Role-specific Overview pages** | A different landing page for each role showing what that role acts on. |
| **Bulk CSV import/export** | Faculty, subjects and rooms. Each import page has a built-in example template. Exported text that starts with `=`, `+`, `-` or `@` gets a leading apostrophe, so Excel or Google Sheets shows it as text instead of running it as a formula. |
| **Backup and restore** (Settings, Admin and IT) | Download all data (faculty, subjects, rooms, schedule, history, requests) as one `.json` file and restore it later, in the same or another browser. A restore file is fully checked first (every entry and every displayed field), and nothing changes unless it is valid and you confirm. If saved data is ever damaged anyway, the app shows a recovery screen (download the saved data, or reset) instead of a blank page. Who is signed in is not part of a backup. |
| **Mobile-friendly** | Collapsible sidebar and scrolling tables and pop-ups on phones. |

---

## User roles

There are four roles, matching the study's respondent groups. Each person's account decides their role. Access is controlled by the sidebar and by which action buttons are shown.

| Page / action | Academic Administrator | Department Chair | Faculty Member | IT Professional / Staff |
|---|:-:|:-:|:-:|:-:|
| Overview (role-specific) | ✅ | ✅ | ✅ | ✅ |
| Faculty, Workload, Subjects, Rooms | ✅ | ✅ | – | ✅ |
| Class Schedules (view) | ✅ | ✅ | own classes only | ✅ |
| Generate / Update / edit schedule | ✅ | ✅ | – | ✅ |
| **Approve / reject a schedule** | ✅ | ✅ | – | – |
| Approve / deny leave and availability requests | ✅ | ✅ | – | ✅ *(see known issues)* |
| Submit an availability change or leave | on behalf of anyone | on behalf of anyone | own only | on behalf of anyone |
| Schedule History | ✅ | ✅ | – | ✅ |
| Departments | ✅ | – | – | ✅ |
| Conflict Detection, Reports | ✅ | ✅ | – | ✅ |
| Settings: set up with your school's data, backup and restore, testing tools; Reset Demo Data | ✅ | – | – | ✅ |
| Accounts: add, edit, reset passwords, turn off or on, delete | ✅ | – | – | ✅ |
| Settings: change your own password | ✅ | ✅ | ✅ | ✅ |

---

## Getting started

### Requirements

- A modern browser (Chrome, Edge, Firefox or Safari)
- **No internet needed to run the app** once it is being served: React, Babel, Tailwind CSS, SheetJS (for Excel files) and the Inter font are stored in the `vendor/` folder
- To run `npx serve` or the Node test commands: [Node.js](https://nodejs.org) 16 or newer, 19 or newer for the accounts tests *(optional)*

### Option A: publish with GitHub Pages (recommended)

1. Push this repository to GitHub.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, select branch `main` and folder `/ (root)`, then **Save**.
4. After a minute the site is live at `https://<your-username>.github.io/<repository-name>/`.

### Option B: run locally

The app must be **served over HTTP**. Opening `index.html` by double-clicking usually fails, because the browser blocks the separate interface files from loading.

```bash
# from the repository folder (needs Node.js)
npx serve
```

Then open the address it prints. Without Node.js, use the **Live Server** extension in VS Code, or copy the folder into XAMPP's `htdocs` folder (Apache serves the files as they are).

### First use

1. The first time, create the **Administrator account** (full name, username, password of at least 8 characters). You are signed in with it.
2. Open **Accounts** and press **Add account** for each other person: their name, a username, their role and a temporary password (**Suggest** makes one). For a *Faculty Member*, also choose their teacher from the Faculty list. Give each person their username and temporary password; they choose their own password the first time they sign in. Add a second Administrator or IT account too, so a forgotten password can always be reset.
3. Open **Class Schedules → Generate Schedule**.
4. To start over with sample data, an Administrator or IT user can use **Reset Demo Data** in the sidebar (other roles do not see it). Accounts are not affected.
5. To use a school's real data, an Administrator or IT user opens **Settings → Set up with your school's data**, downloads the blank template, fills it in, and uploads it. The *Instructions* sheet in the template explains every column.

> **Tip:** a teacher's account follows the teacher by name. After uploading a school's data or resetting to sample data, check **Accounts**: a teacher account whose teacher is no longer in the Faculty list says *Not linked*, and that person sees no schedule until you edit the account and choose their teacher.

---

## How the AI works

*The first step builds a starting schedule with a greedy method that respects the rules wherever it can. The Genetic Algorithm then improves a whole group of candidate schedules. Step-by-step flowcharts of full generation, scoring and the incremental update are in [`docs/FLOWCHART.md`](docs/FLOWCHART.md).*

### Representation

A schedule is a list of **genes**, one per subject section. Each gene is `{ facultyId, roomId, slotId }`. A `roomId` of `-2` means an online class (no room), and `-1` means "not assigned".

### Hard rules (any violation makes a schedule invalid)

- A teacher can only teach subjects matching their specializations
- A teacher cannot be in two places at once, and not during their unavailable times
- A room cannot host two classes at once (online classes share no room)
- Laboratory classes need a laboratory room with enough seats
- A subject with a **fixed day/period** must be scheduled exactly then
- Every subject must be placeable at all: at least one qualified teacher and, for a laboratory class, a lab big enough. If not, the schedule is reported as having a conflict, and Conflict Detection names the subject and what to change

### Full generation (`runGA`)

1. **Seed**: one schedule built greedily, placing each subject in the first slot/teacher/room that fits.
2. **Population**: the seed plus 49 random schedules.
3. **Evolve** for up to 140 generations: keep the best 10% (*elitism*), pick parents by 4-way *tournament*, join them with *single-point crossover*, then *mutate* (starts at 8% per gene and shrinks over time).
4. **Stop early** once the best score has not changed for 20 generations and the best schedule breaks no hard rule (a subject that cannot be placed at all does not block stopping, since no schedule can fix it).

### Scoring (`fitness`), higher is better

| Term | Weight |
|---|---|
| Each hard-rule violation | −1000 |
| Variance of teaching units between teachers | −2 × variance |
| Share of classes on the teacher's preferred days | +50 × share |
| Share of classes in times a teacher asked for in an approved "prefer instead" request (0 if nobody has) | +60 × share |
| Average empty seats per class (online classes count as 0) | −0.5 × average |
| Same-program, same-year/semester overlap (curriculum-aware only) | −150 each |

Because 1000 is far larger than every other term, the algorithm always prefers a conflict-free schedule first and only then optimizes fairness and preferences.

### Incremental update (`repairSchedule`)

1. Find the classes that now break a rule (`findConflictingIndices`). If none, nothing changes.
2. **Freeze** every other class.
3. Re-place each affected class greedily, keeping the same teacher and room whenever possible. If no free spot exists, move the one or two classes blocking the best option (the teacher's and the room's) to free spots of their own, and undo if that fails.
4. Run a small Genetic Algorithm on **only** those classes, with a *stability penalty* that prefers the smallest change.

In one check on 40 generated sample datasets (955 classes in total), where one teacher blocked a whole day, 77 classes had to move. The update moved exactly those 77 and respected the request in all 40 datasets, whereas a full regeneration moved 819 classes. Exact numbers vary from run to run because the algorithm is random.

---

## Project structure

```
schedwiseai/
├── index.html              Entry page: loads libraries, engine.js, importer.js, accounts.js, then loader.js
├── engine.js               The scheduling engine (Genetic Algorithm, rule checker, update logic)
├── importer.js             Reads and checks a school data workbook, and writes the template (no libraries)
├── accounts.js             Sign-in accounts: rules, password hashing (PBKDF2-SHA256), saving (no libraries)
├── app.jsx                 The user interface (React): all pages, forms and state. EDIT THIS ONE.
├── app.js                  app.jsx compiled to plain JavaScript by tools/build.html (do not edit)
├── loader.js               Starts the interface: app.js if it is up to date, otherwise compiles app.jsx
├── styles.css              Global styles, colours and print rules
├── vendor/                 Third-party libraries and the Inter font, stored locally so the app works offline
│   └── xlsx.full.min.js    SheetJS, reads and writes Excel files; loaded only when the Settings setup card needs it
├── tools/
│   └── build.html          Rebuilds app.js after app.jsx changes (runs in a browser, no Node.js needed)
├── tests/
│   ├── engine.test.js      Automated tests for the engine (Node.js or browser, no libraries)
│   ├── importer.test.js    Automated tests for importer.js (Node.js or browser, no libraries)
│   ├── accounts.test.js    Automated tests for accounts.js (Node.js 19+ or browser, no libraries)
│   └── run.html            Runs the three test files in a browser page
└── docs/
    ├── FLOWCHART.md        Flowcharts of the optimization engine (full generation, scoring, update)
    └── TESTING_GUIDE.md    Step-by-step manual test plan, with a results sheet
```

Every file has detailed explanatory comments. Start with the header comment in `engine.js` (the algorithm) and `app.jsx` (a map of the whole UI file and a short React primer).

### After you change `app.jsx`

The app starts from `app.js`, a ready-compiled copy of `app.jsx`, because compiling JSX in the browser on every visit made the first screen take several seconds. After editing `app.jsx`:

1. Serve the folder and open `/tools/build.html`.
2. Press **Build app.js** and save the downloaded `app.js` into the project folder, replacing the old one.

If you forget, nothing breaks: `loader.js` sees that `app.js` was built from an older `app.jsx`, compiles `app.jsx` in the browser instead (a slower start), and says so in the browser console. The build page also tells you whether `app.js` is up to date.

---

## Function reference

### `engine.js`, the scheduling engine (exposed as `window.SchedEngine`)

| Function | Purpose |
|---|---|
| `buildTimeSlots()` | Creates the 36 weekly slots (Mon–Sat × 6 periods). Sunday has none. |
| `clockLabel(minutes)` | Turns minutes after midnight into a 12-hour time, for example 780 → "1:00 PM". |
| `halfHourRows()` | The weekly grid's 18 rows, one per 30 minutes from 7:00 AM to 3:30 PM, each with its period and whether it is the period's first row. |
| `qualifiedFaculty(faculty, section)` | Ids of teachers whose specializations match the subject. |
| `validRooms(rooms, section)` | Ids of suitable rooms. Online classes return the "Online" pseudo-room. |
| `isOnline(section)` | Whether a subject is an online class. |
| `randomGene(...)` | One random assignment for a subject (respects qualification, room type and fixed time). |
| `greedySeed(...)` | Builds the first, mostly conflict-free schedule (the constraint-based seed). |
| `countViolations(...)` | The rule checker. Returns a count per rule and a `total`. |
| `curriculumOverlapCount(...)` | Counts same-year/semester time collisions. |
| `fitness(...)` | Scores a schedule (see the table above). |
| `runGA(...)` | The Genetic Algorithm. Returns the best schedule plus its convergence history. |
| `findConflictingIndices(...)` | Which classes currently break a rule, i.e. what an update must move. |
| `repairSchedule(...)` | Incremental update: moves only affected classes. Returns the changes made. |
| `generateSyntheticData(...)` | Builds solvable sample data from a random seed. |
| `currentSchoolYear()` / `schoolYearOptions()` | School year labels such as `2026–2027`. |

### `importer.js`, the school data workbook (exposed as `window.SchedImport`)

It works on plain rows (one array per spreadsheet row), so it needs no spreadsheet library and is tested on its own. The app turns the `.xlsx` file into rows with SheetJS first.

| Function | Purpose |
|---|---|
| `SHEETS`, `COLUMNS`, `LIMITS` | The template: the sheet names, every column (header, required or not, example) and the limits (5 MB file, 2,000 rows per sheet, 120 characters of text). |
| `parseWorkbook(sheets)` | Checks every row and turns a correct workbook into the app's faculty, subjects and rooms. Returns `{ ok, data, counts, errors, warnings, notes }`; each problem names its sheet, Excel row and column. Columns are found by name in any order, `EXAMPLE` rows and blank rows are skipped, and any error means `data` is `null`. |
| `templateRows()` | The blank template: an *Instructions* sheet and the three data sheets with `EXAMPLE` rows. |
| `currentDataRows(data)` | The current faculty, subjects and rooms in the template's layout, so they can be edited and uploaded again. |
| `parseWholeNumber()`, `parseDayList()`, `parseSlotList()` / `formatSlotList()`, `parseYearLevel()`, `parseSemester()`, `parseSchoolYear()`, `canonical()` | Read one cell: numbers, days (`Mon; Wed`), unavailable times (`Sat; Mon P1; Fri P4-P6`), year level, semester and school year; `canonical()` compares names ignoring capitals and extra spaces. |

### `accounts.js`, sign-in accounts (exposed as `window.SchedAccounts`)

Accounts are saved in the browser under their own key (`schedwiseai_accounts_v1`), apart from the school's data, so Reset Demo Data, uploads and backups never touch them. Who is signed in is kept in `sessionStorage`, so closing the browser signs the person out.

| Function | Purpose |
|---|---|
| `makeAccount(input, accounts)` | Checks a new account (name, username, role, teacher for a Faculty Member, password) and stores a random salt and a PBKDF2-SHA256 hash (100,000 rounds), never the password. |
| `verifyPassword(account, password)`, `withNewPassword(account, password, mustChange)` | Check a password; replace it with a new salt and hash (a temporary one when `mustChange` is true). |
| `hashPassword()`, `pbkdf2Sha256()`, `sha256()` | The hash. The browser's `crypto.subtle` is used when the page has it; a page served over plain `http://` on a school network has none, so the same calculation is also written in plain JavaScript (same result, about 0.2 s instead of 0.03 s). |
| `checkUsername()`, `checkPassword()`, `checkName()` | Usernames: 3–32 letters, digits, `.`, `-` or `_`, unique ignoring capitals. Passwords: 8–128 characters, not only spaces, not the username. |
| `checkChange(accounts, actorId, targetId, change)` | Stops lock-outs: always one active Administrator, and nobody can delete, turn off or change the role of their own account. |
| `linkedFaculty(account, faculty)`, `relinkAfterRename()` | The teacher a Faculty Member account belongs to (by name, ignoring capitals and extra spaces; never another teacher), and keeping the link when a teacher is renamed. |
| `normalizeAccounts()`, `loadAccounts()`, `saveAccounts()`, `loadSession()`, `saveSession()` | Read and save accounts, dropping any damaged entry; who is signed in. |

### `app.jsx`, the interface

| Piece | Purpose |
|---|---|
| `App()` | Holds all data and actions: generate, update, edit, approve, requests, notifications, history, and who is signed in. |
| `SetupScreen`, `SignInScreen`, `ChangePasswordScreen` | The first Administrator account, signing in, and choosing one's own password after a temporary one. |
| `AccountsPage`, `AccountModal`, `ResetPasswordModal` | Accounts (Administrator and IT): the list with each account's role, teacher and status, and adding, editing, resetting, turning off or on, and deleting. |
| `YourAccountCard` | Settings → *Your account*: who is signed in, and changing one's own password. |
| `DashboardPage` | Dispatches to `AdminOverview`, `ChairOverview`, `FacultyOverview` or `ITOverview`. |
| `SchedulesPage` | Weekly grid in 30-minute rows, by-faculty view, approval panel, update banner and the "What changed" panel. |
| `AvailabilityRequestModal`, `SlotPicker` | The day-and-period request form. |
| `FacultyPage`, `SubjectsPage`, `RoomsPage` | Data tables with import/export. |
| `DepartmentsPage`, `WorkloadPage`, `ReportsPage`, `HistoryPage`, `ConflictsPage` | Analysis pages. |
| `makeTestConflict()` | Testing tools: breaks one rule in the current schedule on purpose, without undoing earlier test conflicts, and explains what it changed. |
| `generateExpandedData()` (engine) | The expanded multi-program sample. Seeded, so the same seed gives the same data. |
| `loadStatusFor()`, `LOAD_RULES` | The single rule for a teacher's workload status: Overloaded (above maximum), Near capacity (80% or more), Underloaded (0 units), Light load (fewer than half the average units per teacher), otherwise Balanced. Every page uses it, so they always agree. |
| `GlobalSearch` | The top-bar search: faculty, subjects and rooms (own classes for a Faculty Member). |
| `Modal`, `Field`, `FormError`, `wholeNumberError()` | Pop-up dialogs (Esc closes, focus is managed), labelled form fields, and the form error messages and number checks. |
| `AppErrorBoundary` | Shows a recovery screen instead of a blank page if the app cannot start. |
| `normalizeData()` | Upgrades data saved by older versions so nothing is lost. |
| `makeBackup()`, `parseBackup()` | Build the backup file, and check a chosen file before it replaces any data. |
| `downloadCSV()`, `parseCSV()` | CSV export and import helpers. |
| `SchoolDataCard`, `UploadIssueList`, `handleApplySchoolData()` | Settings → *Set up with your school's data*: the three steps, the check result grouped by sheet, the "Replace your data?" dialog, and replacing the data. |
| `loadSheetLibrary()`, `readWorkbookFile()`, `downloadWorkbook()` | Load SheetJS on first use, read a chosen `.xlsx` file into rows (refusing files over 5 MB, files that are not Excel workbooks, and sheets with something past row 2,001 or column CV), and save rows as an `.xlsx` file. |
| `SampleDataBanner` | "You are looking at sample data." on the Administrator and IT overviews, with a link to the setup card. |
| `subjectAreasOf()` | The school's subject areas, taken from the data (every teacher's and every subject's). The forms, Departments and Reports use it. |

---

## Testing

**Automated (engine):** 32 tests in `tests/engine.test.js` cover the time slots and the 30-minute grid rows, every rule in the rule checker, the sample-data generators, full generation (checked by a second, independent rule checker on 10 sample datasets plus the multi-program sample, online rooms, fixed times, unavailable times and curriculum-aware mode) and the incremental update (only affected classes move). They take a few seconds. The Genetic Algorithm is random, so the tests check properties of the result, not one exact timetable.

**Automated (school data workbook):** 18 tests in `tests/importer.test.js` cover reading each kind of cell, turning a correct workbook into the app's data, every kind of error (each pointing to its sheet, row and column), the warnings (including a file that mixes semesters or school years), the notes about defaults, columns in any order, skipped `EXAMPLE` and blank rows, numbers typed as text, text that looks like a formula, words such as `constructor` read as plain names, the template, and a round trip (current data → workbook → the same data).

**Automated (sign-in and accounts):** 13 tests in `tests/accounts.test.js` check the password hash against the standard SHA-256 and PBKDF2 test values, that the browser's `crypto.subtle` and the plain-JavaScript version give the same hash, that an account stores a salted hash and never the password, the username, password and name rules, the rules that stop lock-outs (always one active Administrator; nobody removes, turns off or demotes themselves), teacher links by name (and after a rename), and that damaged saved accounts are dropped.

```bash
node tests/engine.test.js        # needs Node.js; ends with "32 passed, 0 failed"
node tests/importer.test.js      # ends with "18 passed, 0 failed"
node tests/accounts.test.js      # needs Node.js 19 or newer; ends with "13 passed, 0 failed"
```

No Node.js? Serve the folder (for example with VS Code Live Server) and open `tests/run.html`; it runs the three test files and prints the results on the page.

**Manual (whole system):** follow [`docs/TESTING_GUIDE.md`](docs/TESTING_GUIDE.md). It has 98 step-by-step test cases with expected results for all four roles (sign-in, accounts and access, generation and approval, conflicts, editing, faculty, subjects and rooms, CSV, workload, availability and leave, history and reports, backup and reset, phone and browser checks, setting up with a school's data), four end-to-end scenarios, a mapping to the ISO/IEC 25010 quality characteristics, and a results sheet and defect log. Mobile layout, printing, file downloads and running with the internet switched off must be checked by hand in real browsers. The Settings page has **Testing tools** (Admin and IT) to load the standard or the expanded sample and to create deliberate conflicts.

---

## Data and privacy

- All sample data is **synthetic**. Faculty names are randomly generated.
- Everything you enter is stored in your own browser's `localStorage` (key `schedwiseai_prototype_v1`). **Nothing is sent to a server**, and each browser or device has its own separate data.
- **Do not commit real faculty, student or schedule data** to this repository, including filled templates and downloaded data workbooks.
- An uploaded workbook is read inside the browser. The file is not sent anywhere or kept; the teachers, subjects and rooms in it are saved in this browser like everything else you enter (with the file's name, to show where the data came from).
- **Sign-in accounts** are saved in the same browser under their own key (`schedwiseai_accounts_v1`), apart from the data. A password is never stored: each account keeps a random salt and a PBKDF2-SHA256 hash of it. Who is signed in is kept only until the browser is closed. Backups do not contain accounts, so on another browser the accounts are made again on the Accounts page.
- To keep a copy of your data, or move it to another browser, use **Settings → Backup and restore**. Backup files contain everything you entered, so treat them like the data itself.
- To clear everything: an Administrator or IT user can use **Reset Demo Data**, or clear this site's storage in your browser's developer tools.

---

## Limitations and known issues

This is a research prototype. Please read this list before relying on it.

**Scope**
- One weekly meeting per subject section. Real subjects that meet several times a week are entered as separate sections.
- Fixed one-and-a-half-hour periods; no student-facing module.
- **Sign-in works per browser.** Accounts live in the browser that runs SchedWiseAI, like the data, so people sign in on that computer (for example a shared office PC), not from their own phones. There is no server: someone with full access to the computer can open the browser's developer tools and read or change what it stores. The sign-in keeps each person in their own role; it is not protection against that. Signing in from any device needs an online database and sign-in service, a planned later step.
- **A forgotten password needs another manager.** An Administrator or IT staff member resets it on the Accounts page. If the only Administrator or IT account forgets its password, nobody can reset it in the app (the Accounts page warns while there is only one such account).
- School year is a **label and filter**. The scheduler places every listed subject; it does not generate one school year or semester at a time. An uploaded workbook whose subjects span both semesters or several school years gets a warning saying to upload one semester at a time.
- Access control is enforced in the interface, and the data and accounts live in the browser, so this is **not a security model against someone with full access to the computer**.

**Behaviour to be aware of**
- **Conflict counts are live.** The "Conflict-free" label and the Conflict Detection page are recalculated whenever a teacher, room or subject changes. If an edit creates a conflict, the schedule page shows a banner with **Update affected classes**. (The counts saved in *Schedule History* are a snapshot from when each version was made.)
- **Fixed times can make a schedule impossible.** If more subjects are pinned to the same day and period than there are qualified teachers, the schedule shows teacher double-booking conflicts. The app reports this rather than hiding it.
- **Load status mixes two comparisons.** Overloaded and Near capacity compare a teacher with their own maximum; Light load compares them with colleagues (fewer than half the average units per teacher). The 80% cutoff and the "half the average" line are prototype settings, and only teaching units are counted. The Workload page explains the rules with the current numbers.
- **Overload is a warning, not a conflict.** A teacher above their maximum units shows as *Overloaded* on the Workload, Faculty and Departments pages, and the schedule page adds an orange "teachers over maximum units" badge next to the *Conflict-free* label. The engine does not try to remove overload, so it can still occur when there are too few teachers for the number of subjects. This does not happen with the default sample data.
- IT staff can approve or deny leave requests, although schedule approval is limited to administrators and chairs.
- CSV import rejects rows with a missing code or name, a missing subject area, a subject area longer than 120 characters, or an invalid number. Any subject area name is accepted, so a misspelled one becomes a new area that no teacher has (that subject then shows as *Cannot be scheduled*).
- **Uploading a workbook replaces everything**: faculty, subjects and rooms are replaced and the schedule, its versions and the requests are cleared. There is no merge. To change a few things, use **Download current data**, edit the file and upload it again, or edit in the app.
- **Subject areas are matched by name.** A teacher can teach a subject only if one of their subject areas is the subject's area. In an uploaded workbook, capitals and extra spaces do not matter (`accounting` and `Accounting` become one area, and a note says so), and the forms pick the existing spelling; a CSV import keeps names exactly as written. The upload check warns about a subject area that no teacher has.
- **The workbook follows the current time model**: one 1.5-hour period per subject section per week, Monday to Saturday. Real class hours (for example a 3-hour subject meeting twice a week) are a planned later step.

---

## Technology

- **React 18** (UMD build). The interface is written in JSX (`app.jsx`) and compiled to `app.js` with **Babel Standalone** in the browser by `tools/build.html`, so no Node.js build tools are needed
- **Tailwind CSS** (in-browser build) and the **Inter** font. These, React, Babel and SheetJS are stored in `vendor/` (see `vendor/README.md` for versions and licenses), so the app works offline
- **SheetJS Community Edition** (`vendor/xlsx.full.min.js`) reads and writes the Excel workbooks. It is loaded only when the Settings setup card needs it, so it does not slow down the start
- Plain JavaScript for the engine, the workbook checker (`importer.js`) and the accounts (`accounts.js`, including SHA-256 and PBKDF2 for pages without `crypto.subtle`); charts are hand-drawn SVG
- The app itself needs only a web browser; Node.js is optional and only used for `npx serve` and the three `node tests/…` commands
- The whole system is written in **HTML, CSS and JavaScript**, with no server code and no database

---

## Authors

- De Vega, Denber R.
- Laceda, Jann Eirron P.
- Sanchez, Godwin B.

Bachelor of Science in Information Technology, World Citi Colleges, Quezon City.

---

## License

No license has been chosen yet. Until one is added, all rights are reserved by the authors. If you want others to be able to reuse the code, add a `LICENSE` file (for example MIT), after checking your school's policy on ownership of capstone work.
