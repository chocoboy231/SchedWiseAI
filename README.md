# SchedWiseAI

**An Intelligent Faculty Workload Optimization and Academic Scheduling System Using Genetic Algorithm and Constraint-Based Optimization**

SchedWiseAI is a web-based prototype that builds conflict-free class schedules for a college and balances faculty teaching loads automatically. It was developed as a capstone project for **World Citi Colleges – Quezon City Campus** (BSIT).

Instead of scheduling by hand, an administrator presses **Generate Schedule**. A hybrid *constraint-based seeding + Genetic Algorithm* engine then produces a weekly timetable that respects teacher qualifications, teacher availability, room types and capacity, and (optionally) curriculum year-level overlaps. When something changes later, for example a teacher's leave is approved, the system can **update only the affected classes** instead of rebuilding everything.

> **Status:** working prototype for research and respondent testing. It runs entirely in the browser with sample data. See [Limitations](#limitations-and-known-issues).

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

Sign in with **any name** and choose a role. There is no password. The first visit loads randomly generated sample data (9 faculty, 18 subjects, 6 laboratory rooms) so you can explore immediately.

---

## Features

| Module | What it does |
|---|---|
| **AI Schedule Generation** | Builds a full Monday–Saturday timetable (6 periods per day, 07:00–16:00, no classes on Sunday) using constraint-based seeding and a Genetic Algorithm. Shows a convergence chart for every run: the best and average score per generation, each on its own labelled scale, with a plain-language caption. |
| **Incremental Update** | After an approved availability change or leave, a new or edited subject, or an import, **Update affected classes** moves only the classes that now break a rule. Everything else stays exactly where it was, and a "What changed" panel lists each move. *Full Regenerate* is still available. |
| **Faculty Management** | Add, edit and delete faculty with specializations, preferred days, maximum units, employment status and academic rank. Profile view, current load and workload status per person. |
| **Workload Management** | Load % (assigned ÷ maximum units) with a bar, comparison with the group average, summary cards (teachers per status, units vs. capacity, average load, highest-to-lowest gap), each teacher's classes on click with how many subjects they can teach, and a built-in explanation of how the status is calculated and why a load can be low. |
| **Testing tools** (Settings, Admin and IT) | Load the standard sample (9 faculty, 18 subjects, 6 labs) or an expanded multi-program sample (22 faculty including part-time, 48 subjects across BSIT, BSCS and BSIS, 10 labs), and create deliberate conflicts of seven kinds (plus teacher overload) to test conflict detection and repair. The expanded subject list is illustrative test data, not an official curriculum. |
| **Availability and Leave** | Faculty request a change of availability or a leave with a **day-and-period picker**. When a chair or administrator approves it, those times are saved as the teacher's unavailable times and the schedule is flagged for update. An approved leave can be ended, and an approved availability change can be undone, which makes those times available again (the current schedule is left as it is; use Full Regenerate to use them). |
| **Subject Management** | School year, Major/Minor category, academic year level, semester, class type (**Online** or **Laboratory**), optional **fixed day/period** (for subjects whose time is set by another department, such as GE, PE or NSTP), and optional prerequisite with sequence checking. |
| **Room Management** | Laboratory rooms with capacity. Online classes need no room. |
| **Curriculum-aware scheduling** | Optional. Avoids overlapping classes that share the same program, year level and semester (different programs may share a time). |
| **Manual editing** | Click any scheduled class to change its teacher, room or time, or remove it. Conflicts are re-checked immediately. |
| **Approval workflow** | Every generated or changed schedule starts as *Pending Review*. Administrators and chairs approve or reject it with a comment. |
| **Conflict Detection** | Reports seven constraint categories: teacher double-booking, room double-booking, unqualified teacher, teacher unavailable, room-type mismatch, fixed time not respected, and room capacity. Overload is shown separately on the Workload, Faculty and Departments pages (see Limitations). |
| **Departments** | Each specialization is treated as a department, with summary cards, teaching load %, overload and conflict counts, expandable workload charts, and an *Issues Requiring Attention* list. |
| **Reports** | Faculty Teaching Load, Room Utilization (with room × day heatmap), Department Summary, and Conflict Report. Every report exports to CSV; everything can be printed or saved as PDF. |
| **Schedule History** | Keeps up to 20 versions (full and update) with a fitness comparison chart. Any version can be restored. |
| **Notifications** | Bell icon with unread count for schedule, approval, request and import events. |
| **Role-specific Overview pages** | A different landing page for each role showing what that role acts on. |
| **Bulk CSV import/export** | Faculty, subjects and rooms. Each import page has a built-in example template. Exported text that starts with `=`, `+`, `-` or `@` gets a leading apostrophe, so Excel or Google Sheets shows it as text instead of running it as a formula. |
| **Backup and restore** (Settings, Admin and IT) | Download all data (faculty, subjects, rooms, schedule, history, requests) as one `.json` file and restore it later, in the same or another browser. A restore file is fully checked first (every entry and every displayed field), and nothing changes unless it is valid and you confirm. If saved data is ever damaged anyway, the app shows a recovery screen (download the saved data, or reset) instead of a blank page. Who is signed in is not part of a backup. |
| **Mobile-friendly** | Collapsible sidebar and scrolling tables and pop-ups on phones. |

---

## User roles

There are four roles, matching the study's respondent groups. Access is controlled by the sidebar and by which action buttons are shown.

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

---

## Getting started

### Requirements

- A modern browser (Chrome, Edge, Firefox or Safari)
- **No internet needed to run the app** once it is being served: React, Babel, Tailwind CSS and the Inter font are stored in the `vendor/` folder
- To run `npx serve` or the Node test command: [Node.js](https://nodejs.org) 16 or newer *(optional)*

### Option A: publish with GitHub Pages (recommended)

1. Push this repository to GitHub.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, select branch `main` and folder `/ (root)`, then **Save**.
4. After a minute the site is live at `https://<your-username>.github.io/<repository-name>/`.

### Option B: run locally

The app must be **served over HTTP**. Opening `index.html` by double-clicking usually fails, because the browser blocks the separate `app.jsx` file from loading.

```bash
# from the repository folder (needs Node.js)
npx serve
```

Then open the address it prints. Without Node.js, use the **Live Server** extension in VS Code, or copy the folder into XAMPP's `htdocs` folder (Apache serves the files as they are).

### First use

1. Enter any name, choose a role, and press **Sign In**.
2. Use the **Viewing as** dropdown at the bottom of the sidebar to switch roles without signing out.
3. Open **Class Schedules → Generate Schedule**.
4. To start over, an Administrator or IT user can use **Reset Demo Data** in the sidebar (other roles do not see it).

> **Tip:** to test as a specific teacher, sign in with the **Faculty Member** role and type that teacher's name exactly as it appears in the Faculty list. Otherwise the first teacher in the list is used.

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

### Full generation (`runGA`)

1. **Seed**: one schedule built greedily, placing each subject in the first slot/teacher/room that fits.
2. **Population**: the seed plus 49 random schedules.
3. **Evolve** for up to 140 generations: keep the best 10% (*elitism*), pick parents by 4-way *tournament*, join them with *single-point crossover*, then *mutate* (starts at 8% per gene and shrinks over time).
4. **Stop early** once the best score has not changed for 20 generations and the schedule is conflict-free.

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
├── index.html              Entry page: loads libraries, engine.js, then app.jsx
├── engine.js               The scheduling engine (Genetic Algorithm, rule checker, update logic)
├── app.jsx                 The user interface (React): all pages, forms and state
├── styles.css              Global styles, colours and print rules
├── vendor/                 Third-party libraries and the Inter font, stored locally so the app works offline
├── tests/
│   ├── engine.test.js      Automated tests for the engine (Node.js or browser, no libraries)
│   └── run.html            Runs those tests in a browser page
└── docs/
    ├── FLOWCHART.md        Flowcharts of the optimization engine (full generation, scoring, update)
    └── TESTING_GUIDE.md    Step-by-step manual test plan, with a results sheet
```

Every file has detailed explanatory comments. Start with the header comment in `engine.js` (the algorithm) and `app.jsx` (a map of the whole UI file and a short React primer).

---

## Function reference

### `engine.js`, the scheduling engine (exposed as `window.SchedEngine`)

| Function | Purpose |
|---|---|
| `buildTimeSlots()` | Creates the 36 weekly slots (Mon–Sat × 6 periods). Sunday has none. |
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

### `app.jsx`, the interface

| Piece | Purpose |
|---|---|
| `App()` | Holds all data and actions: generate, update, edit, approve, requests, notifications, history. |
| `DashboardPage` | Dispatches to `AdminOverview`, `ChairOverview`, `FacultyOverview` or `ITOverview`. |
| `SchedulesPage` | Grid, by-faculty view, approval panel, update banner and the "What changed" panel. |
| `AvailabilityRequestModal`, `SlotPicker` | The day-and-period request form. |
| `FacultyPage`, `SubjectsPage`, `RoomsPage` | Data tables with import/export. |
| `DepartmentsPage`, `WorkloadPage`, `ReportsPage`, `HistoryPage`, `ConflictsPage` | Analysis pages. |
| `makeTestConflict()` | Testing tools: breaks one rule in the current schedule on purpose, without undoing earlier test conflicts, and explains what it changed. |
| `generateExpandedData()` (engine) | The expanded multi-program sample. Seeded, so the same seed gives the same data. |
| `loadStatusFor()`, `LOAD_RULES` | The single rule for a teacher's workload status: Overloaded (above maximum), Near capacity (80% or more), Underloaded (0 units), Light load (fewer than half the average units per teacher), otherwise Balanced. Every page uses it, so they always agree. |
| `normalizeData()` | Upgrades data saved by older versions so nothing is lost. |
| `makeBackup()`, `parseBackup()` | Build the backup file, and check a chosen file before it replaces any data. |
| `downloadCSV()`, `parseCSV()` | CSV export and import helpers. |

---

## Testing

**Automated (engine):** 27 tests in `tests/engine.test.js` cover the time slots, every rule in the rule checker, the sample-data generators, full generation (checked by a second, independent rule checker on 10 sample datasets plus the multi-program sample, online rooms, fixed times, unavailable times and curriculum-aware mode) and the incremental update (only affected classes move). They take a few seconds. The Genetic Algorithm is random, so the tests check properties of the result, not one exact timetable.

```bash
node tests/engine.test.js        # needs Node.js; ends with "27 passed, 0 failed"
```

No Node.js? Serve the folder (for example with VS Code Live Server) and open `tests/run.html`; it runs the same tests and prints the results on the page.

**Manual (whole system):** follow [`docs/TESTING_GUIDE.md`](docs/TESTING_GUIDE.md). It has 72 step-by-step test cases with expected results for all four roles (sign-in and access, generation and approval, conflicts, editing, faculty, subjects and rooms, CSV, workload, availability and leave, history and reports, backup and reset, phone and browser checks), four end-to-end scenarios, a mapping to the ISO/IEC 25010 quality characteristics, and a results sheet and defect log. Mobile layout, printing, file downloads and running with the internet switched off must be checked by hand in real browsers. The Settings page has **Testing tools** (Admin and IT) to load the standard or the expanded sample and to create deliberate conflicts.

---

## Data and privacy

- All sample data is **synthetic**. Faculty names are randomly generated.
- Everything you enter is stored in your own browser's `localStorage` (key `schedwiseai_prototype_v1`). **Nothing is sent to a server**, and each browser or device has its own separate data.
- **Do not commit real faculty, student or schedule data** to this repository.
- To keep a copy of your data, or move it to another browser, use **Settings → Backup and restore**. Backup files contain everything you entered, so treat them like the data itself.
- To clear everything: an Administrator or IT user can use **Reset Demo Data**, or clear this site's storage in your browser's developer tools.

---

## Limitations and known issues

This is a research prototype. Please read this list before relying on it.

**Scope**
- One weekly meeting per subject section. Real subjects that meet several times a week are entered as separate sections.
- Fixed one-and-a-half-hour periods; no student-facing module; no real login (any name works, roles are chosen from a menu).
- School year is a **label and filter**. The scheduler places every listed subject; it does not generate one school year or semester at a time.
- Access control is enforced in the interface only, and data lives in the browser, so this is **not a security model**.

**Behaviour to be aware of**
- **Conflict counts are live.** The "Conflict-free" label and the Conflict Detection page are recalculated whenever a teacher, room or subject changes. If an edit creates a conflict, the schedule page shows a banner with **Update affected classes**. (The counts saved in *Schedule History* are a snapshot from when each version was made.)
- **Fixed times can make a schedule impossible.** If more subjects are pinned to the same day and period than there are qualified teachers, the schedule shows teacher double-booking conflicts. The app reports this rather than hiding it.
- **Load status mixes two comparisons.** Overloaded and Near capacity compare a teacher with their own maximum; Light load compares them with colleagues (fewer than half the average units per teacher). The 80% cutoff and the "half the average" line are prototype settings, and only teaching units are counted. The Workload page explains the rules with the current numbers.
- **Overload is a warning, not a conflict.** A teacher above their maximum units shows as *Overloaded* on the Workload, Faculty and Departments pages, and the schedule page adds an orange "teachers over maximum units" badge next to the *Conflict-free* label. The engine does not try to remove overload, so it can still occur when there are too few teachers for the number of subjects. This does not happen with the default sample data.
- IT staff can approve or deny leave requests, although schedule approval is limited to administrators and chairs.
- CSV import rejects rows with a missing code or name, an unknown specialization or an invalid number. A blank specialization list is still accepted and stays empty (IT's *Data Health* panel flags it).

---

## Technology

- **React 18** (UMD build) with **Babel Standalone**, so there is no build step
- **Tailwind CSS** (in-browser build) and the **Inter** font. These and React and Babel are stored in `vendor/` (see `vendor/README.md` for versions and licenses), so the app works offline
- Plain JavaScript for the engine; charts are hand-drawn SVG
- The app itself needs only a web browser; Node.js is optional and only used for `npx serve` and `node tests/engine.test.js`
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
