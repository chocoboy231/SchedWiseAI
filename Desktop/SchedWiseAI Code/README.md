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
- [Optional Python engine](#optional-python-engine)
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
| **Availability and Leave** | Faculty request a change of availability or a leave with a **day-and-period picker**. When a chair or administrator approves it, those times are saved as the teacher's unavailable times and the schedule is flagged for update. Approved leave can be ended later. |
| **Subject Management** | School year, Major/Minor category, academic year level, semester, class type (**Online** or **Laboratory**), optional **fixed day/period** (for subjects whose time is set by another department, such as GE, PE or NSTP), and optional prerequisite with sequence checking. |
| **Room Management** | Laboratory rooms with capacity. Online classes need no room. |
| **Curriculum-aware scheduling** | Optional. Avoids overlapping classes that share the same program, year level and semester (different programs may share a time). |
| **Manual editing** | Click any scheduled class to change its teacher, room or time, or remove it. Conflicts are re-checked immediately. |
| **Approval workflow** | Every generated or changed schedule starts as *Pending Review*. Administrators and chairs approve or reject it with a comment. |
| **Conflict Detection** | Reports eight constraint categories: teacher double-booking, room double-booking, unqualified teacher, teacher unavailable, room-type mismatch, fixed time not respected, room capacity, and overload. |
| **Departments** | Each specialization is treated as a department, with summary cards, teaching load %, overload and conflict counts, expandable workload charts, and an *Issues Requiring Attention* list. |
| **Reports** | Faculty Teaching Load, Room Utilization (with room × day heatmap), Department Summary, and Conflict Report. Every report exports to CSV; everything can be printed or saved as PDF. |
| **Schedule History** | Keeps up to 20 versions (full and update) with a fitness comparison chart. Any version can be restored. |
| **Notifications** | Bell icon with unread count for schedule, approval, request and import events. |
| **Role-specific Overview pages** | A different landing page for each role showing what that role acts on. |
| **Bulk CSV import/export** | Faculty, subjects and rooms. Each import page has a built-in example template. |
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
- **An internet connection**: React, Babel, Tailwind CSS and the Inter font are loaded from CDNs
- To run the tests: [Node.js](https://nodejs.org) 16 or newer *(optional)*

### Option A: publish with GitHub Pages (recommended)

1. Push this repository to GitHub.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, select branch `main` and folder `/ (root)`, then **Save**.
4. After a minute the site is live at `https://<your-username>.github.io/<repository-name>/`.

### Option B: run locally

The app must be **served over HTTP**. Opening `index.html` by double-clicking usually fails, because the browser blocks the separate `app.jsx` file from loading.

```bash
# from the repository folder
python3 -m http.server 8000
# or:  npx serve
```

Then open <http://localhost:8000>.

### First use

1. Enter any name, choose a role, and press **Sign In**.
2. Use the **Viewing as** dropdown at the bottom of the sidebar to switch roles without signing out.
3. Open **Class Schedules → Generate Schedule**.
4. To start over, use **Reset Demo Data** in the sidebar.

> **Tip:** to test as a specific teacher, sign in with the **Faculty Member** role and type that teacher's name exactly as it appears in the Faculty list. Otherwise the first teacher in the list is used.

---

## How the AI works

![AI Optimization Engine flowchart](docs/ai_optimization_engine_flowchart.png)

*The flowchart shows the Python reference engine, which uses Google OR-Tools CP-SAT for the seeding step. The **browser prototype** uses a simpler greedy constraint-based seeding heuristic for that step and is otherwise the same.*

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
| Average empty seats per class (online classes count as 0) | −0.5 × average |
| Same-program, same-year/semester overlap (curriculum-aware only) | −150 each |

Because 1000 is far larger than every other term, the algorithm always prefers a conflict-free schedule first and only then optimizes fairness and preferences.

### Incremental update (`repairSchedule`)

1. Find the classes that now break a rule (`findConflictingIndices`). If none, nothing changes.
2. **Freeze** every other class.
3. Re-place each affected class greedily, keeping the same teacher and room whenever possible. If no free spot exists, shift the single class blocking the best option and undo if that fails.
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
├── tests/
│   └── engine.test.js      Automated tests for the engine (Node.js, no dependencies)
├── docs/
│   ├── TESTING_GUIDE.md    Step-by-step manual test plan for every function
│   └── ai_optimization_engine_flowchart.png
└── python-engine/          Optional Python reference engine (FastAPI + OR-Tools)
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
| `downloadCSV()`, `parseCSV()` | CSV export and import helpers. |

---

## Testing

**Automated (engine):**

```bash
node tests/engine.test.js
```

20 tests covering time slots, the rule checker, full generation on 25 different datasets, online rooms, unavailable times, fixed times, curriculum-aware mode (within one program), incremental update, and the expanded multi-program sample. It takes about 40 seconds, because it generates dozens of schedules. Expected output ends with `20 passed, 0 failed`.

**Manual (whole system):** follow [`docs/TESTING_GUIDE.md`](docs/TESTING_GUIDE.md). It explains every function and gives step-by-step test cases with expected results for all four roles, end-to-end scenarios, mobile and browser checks, and a mapping to the ISO/IEC 25010 quality characteristics used in this study.

Most of the expected results in that guide were also checked by script against the running app in a *simulated* browser. That does not replace testing in real browsers: **mobile layout, printing, file downloads, and loading the libraries from the internet must still be checked by hand** (guide sections 7.2 and 4.14).

---

## Data and privacy

- All sample data is **synthetic**. Faculty names are randomly generated.
- Everything you enter is stored in your own browser's `localStorage` (key `schedwiseai_prototype_v1`). **Nothing is sent to a server**, and each browser or device has its own separate data.
- **Do not commit real faculty, student or schedule data** to this repository.
- To clear everything: use **Reset Demo Data**, or clear this site's storage in your browser's developer tools.

---

## Limitations and known issues

This is a research prototype. Please read this list before relying on it.

**Scope**
- One weekly meeting per subject section. Real subjects that meet several times a week are entered as separate sections.
- Fixed one-and-a-half-hour periods; no student-facing module; no real login (any name works, roles are chosen from a menu).
- School year is a **label and filter**. The scheduler places every listed subject; it does not generate one school year or semester at a time.
- Access control is enforced in the interface only, and data lives in the browser, so this is **not a security model**.

**Behaviour to be aware of**
- **Conflict counts are a snapshot.** The "Conflict-free" label and the Conflict Detection page reflect the last time the schedule was generated, edited or updated. Editing a teacher (for example their maximum units or specializations) or a room updates the Faculty, Workload and Departments pages immediately, but the conflict counts only refresh after the next generate, edit or update.
- **Fixed times can make a schedule impossible.** If more subjects are pinned to the same day and period than there are qualified teachers, the schedule shows teacher double-booking conflicts. The app reports this rather than hiding it.
- **Load status mixes two comparisons.** Overloaded and Near capacity compare a teacher with their own maximum; Light load compares them with colleagues (fewer than half the average units per teacher). The 80% cutoff and the "half the average" line are prototype settings, and only teaching units are counted. The Workload page explains the rules with the current numbers.
- **Overload is reported but not treated as a conflict.** A teacher above their maximum units shows as *Overloaded* on the Workload, Faculty and Departments pages, but the schedule can still be labelled *Conflict-free*. This does not occur with the default sample data, but does when there are too few teachers for the number of subjects.
- IT staff can approve or deny leave requests, although schedule approval is limited to administrators and chairs.
- Approved *availability changes* cannot be undone from the interface (only *leave* has **End Leave**). Use **Reset Demo Data** to start over.
- Deleting a teacher or room that is used in the current schedule does not flag the schedule for update. Use **Full Regenerate** afterwards.
- If the sign-in name starts with a title ("Dr. Maria"), the greeting shows only "Dr.".
- CSV import does not validate rows: an invalid number falls back to a default, and a blank specialization list stays empty (IT's *Data Health* panel flags it). No error is shown.

**Prototype seeding vs. Python engine:** the browser prototype uses a greedy constraint-based seed. The Python engine uses OR-Tools CP-SAT. See below.

---

## Optional Python engine

`python-engine/` is a standalone **FastAPI** service that runs the same idea with **Google OR-Tools CP-SAT** for the constraint-satisfaction seed. It is intended to be called from a separate web application (for example a Laravel back office) over HTTP.

```bash
cd python-engine
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000     # API docs at http://localhost:8000/docs
pytest                                        # 8 tests
```

It uses the **earlier data model** (Monday–Friday, lecture and laboratory rooms). It does not yet include Saturday, online classes, fixed times, or the incremental update. Its CP-SAT solver is configured with one worker and a fixed seed so that identical input always gives the identical starting schedule.

---

## Technology

- **React 18** (UMD build) with **Babel Standalone**, so there is no build step
- **Tailwind CSS** (CDN) and the **Inter** font
- Plain JavaScript for the engine; charts are hand-drawn SVG
- Optional: **Python 3**, **FastAPI**, **Google OR-Tools**, **pytest**

---

## Authors

- De Vega, Denber R.
- Laceda, Jann Eirron P.
- Sanchez, Godwin B.

Bachelor of Science in Information Technology, World Citi Colleges, Quezon City.

---

## License

No license has been chosen yet. Until one is added, all rights are reserved by the authors. If you want others to be able to reuse the code, add a `LICENSE` file (for example MIT), after checking your school's policy on ownership of capstone work.
