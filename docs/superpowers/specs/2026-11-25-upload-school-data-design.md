# Set up SchedWiseAI with a school's own data (Excel template upload) — design

**Date:** 2026-11-25 · **Status:** draft, waiting for approval · **Branch:** `upload-school-data` (the `main` branch stays the version presented at the December 2 defense until it is merged on purpose)

## 1. Why

SchedWiseAI should be usable by a real client (a school), not only with randomly generated sample data. The first step is letting an administrator bring in the school's own **teachers, subjects and rooms** and generate a schedule from them.

We do not yet know how the client prepares its schedules today or what files it keeps, so the app provides **its own simple template**: one Excel workbook that the administrator downloads, fills in, and uploads.

This is step 1 of 2. Step 2, a separate project, is **real class hours**: several meetings a week per class and the school's own period times. Step 1 deliberately keeps today's time model.

## 2. Goals

1. An Administrator or IT user can **download a template workbook** (`SchedWiseAI-template.xlsx`) with an Instructions sheet and a Faculty, Subjects and Rooms sheet, each with example rows.
2. They can **upload the filled workbook**. The app checks every row before anything changes and shows, in plain language, each problem with its sheet, row (as Excel numbers it) and column.
3. Errors block the upload. Warnings explain what will happen but do not block. Every default or spelling change the app makes is listed, never silent.
4. On confirmation, the school's data **replaces** the current data in one step (all or nothing), after the app offers a backup. The user lands on Class Schedules, ready to press **Generate Schedule**.
5. **Subject areas come from the school's data.** Any name works ("Accounting", "Nursing Care"), not only the 8 built-in IT areas. The forms, the CSV import and Departments all follow the school's own list.
6. The user can **download the current data as a filled workbook** in the same format, edit it in Excel, and upload it again.
7. It works **offline** and does **not slow down start-up**: the spreadsheet library loads only when the setup card is used.

## 3. Non-goals (not in this step)

- Real class hours: several meetings per week, different meeting lengths, the school's own period times or days (step 2).
- Reading a school's existing spreadsheets in their own layout.
- A database, logins, or data shared between devices (later projects; data stays in the browser as today).
- Drop-down lists or cell validation inside the Excel file (the free spreadsheet library cannot write them; the Instructions sheet lists the allowed values instead).
- Merging an upload into existing data. An upload replaces it; the per-page CSV import stays for adding a few records.
- Summer terms and year levels above 4 (the app does not support them today).

## 4. Anti-goals (would be a failure even if it "works")

- An upload that leaves a mix of sample and school data, or a half-applied file.
- Changing the school's values without saying so.
- Rejecting real school data because it does not fit IT-only lists (subject areas, programs, ranks).
- Breaking or slowing the version on `main` that is used for the defense.

## 5. Constraints

- Browser-only app; data in `localStorage`; must work offline (third-party files live in `vendor/`). No Node.js build: `app.jsx` is compiled to `app.js` with `tools/build.html`, and `app.js` must be rebuilt after `app.jsx` changes.
- Time model unchanged: Monday–Saturday, 6 periods a day (P1 07:00–08:30, P2 08:30–10:00, P3 10:00–11:30, P4 11:30–13:00, P5 13:00–14:30, P6 14:30–16:00), one meeting per section per week.
- Spreadsheet library: **SheetJS Community Edition** (Apache-2.0), **version 0.20.2 or newer**, copied into `vendor/` with an entry in `vendor/README.md`. Older versions have known flaws when opening crafted files (CVE-2023-30533 prototype pollution, fixed in 0.19.3; CVE-2024-22363 regular-expression denial of service, fixed in 0.20.2). It is about 1 MB, so it must be **loaded on demand**, not by `index.html`.
- Limits: file at most 5 MB; at most 2,000 data rows per sheet; text cells at most 120 characters (longer text is an error, not silently cut).
- Who: only Administrator and IT (the same roles that see Backup and restore and Testing tools).

## 6. Approaches considered

| | Approach | Trade-off | Decision |
|---|---|---|---|
| 1 | **One Excel workbook** (Instructions, Faculty, Subjects, Rooms sheets), downloaded as a template and uploaded filled | Familiar to administrators; one file; instructions travel with it; Google Sheets and LibreOffice can save `.xlsx`. Needs a ~1 MB library (kept offline, loaded on demand, recent version for safety). | **Chosen by the user** |
| 2 | Three CSV files uploaded together | No new library; reuses the tested CSV reader. Three files to keep straight; Excel's "Save as CSV" is error-prone (encoding, leading zeros); no place for instructions. | Not chosen |
| 3 | Paste rows into a grid inside the app | No files. Most new screen work; awkward for long lists; not really an upload. | Not chosen |

## 7. The template workbook

Columns are matched by **header name**, not position (case and extra spaces ignored), so the school may reorder columns. Headers must be in row 1 of each sheet. Extra columns and extra sheets are ignored and listed as notes; completely blank rows are ignored. Required columns are marked with `*` in the header text (for example `Name *`); the `*` is ignored when matching.

The template has two example rows per sheet. Their first cell starts with `EXAMPLE` (for example `EXAMPLE Maria Santos`), and the upload **skips any row whose first cell starts with EXAMPLE**, with a note, so forgetting to delete them does no harm. Days may be written short or in full (`Mon` or `Monday`).

### Instructions sheet
Plain-language steps (fill in, delete the examples, save as `.xlsx`, upload in Settings), the allowed values for every column, the period table with times, and the rule that a subject's *Subject area* must be spelled the same as at least one teacher's.

### Faculty sheet (one row per teacher)

| Column | Required | Allowed values | If blank |
|---|---|---|---|
| Name | yes | text, unique (ignoring capitals and extra spaces), because faculty sign in by name | — |
| Subject areas | yes | one or more names separated by `;` | — |
| Max units | yes | whole number 1–40 | — |
| Employment status | no | Full-time, Part-time, Contractual | Full-time |
| Academic rank | no | any text | left empty |
| Preferred days | no | days separated by `;`, e.g. `Mon; Wed; Fri` | all days (no preference) |
| Not available | no | entries separated by `;`: a whole day `Sat`, a period `Mon P1`, or a range `Fri P4-P6` | available all week |

### Subjects sheet (one row per subject per section)

| Column | Required | Allowed values | If blank |
|---|---|---|---|
| Program | no | text, e.g. BSIT, BSA | the part of *Section* before the first `-` (BSIT-2A → BSIT); an error if there is none |
| Subject code | yes | text | — |
| Subject name | no | text | left empty |
| Section | yes | text; *Subject code + Section* must be unique | — |
| Units | yes | whole number 1–10 | — |
| Subject area | yes | a name; should match a teacher's subject area | — |
| Class type | yes | Online or Laboratory | — |
| Students | yes | whole number 1–300 | — |
| Year level | yes | 1–4 (also accepts "1st Year" etc.) | — |
| Semester | yes | 1st or 2nd (also accepts "1", "1st Semester" etc.) | — |
| School year | no | e.g. `2026-2027` or `2026–2027` | the current school year |
| Category | no | Major or Minor | Major |
| Fixed day | no | Mon–Sat; give both Fixed day and Fixed period, or neither | no fixed time |
| Fixed period | no | 1–6 | no fixed time |
| Prerequisite | no | a subject code | none |

### Rooms sheet (one row per laboratory room)

| Column | Required | Allowed values |
|---|---|---|
| Room name | yes | text, unique |
| Capacity | yes | whole number 1–300 |

All rooms are laboratories (online classes need no room), as today. The Rooms sheet may be empty if every class is online.

### Matching and spelling
Names, subject areas, codes, days and class types are compared ignoring capitals and extra spaces. A subject area keeps the spelling of its **first appearance in the Faculty sheet** (otherwise its first appearance in Subjects); every row spelled differently is reported as a note ("'accounting' treated as 'Accounting'"). This also keeps the scheduling engine unchanged, because it compares subject areas as exact text.

## 8. Checking an upload

The check produces three lists. Each item names the sheet, the Excel row number and the column.

- **Errors (block the upload):** a sheet missing (Faculty and Subjects are required; Rooms may be absent or empty); a required column missing; Faculty or Subjects with no data rows; a required cell empty; a number not whole or out of range; a value not allowed (class type, day, period, year level, semester, status, category); a malformed *Preferred days* or *Not available* entry; a duplicate teacher name, *Subject code + Section* pair or room name; only one of *Fixed day*/*Fixed period* given; text too long; the file too big, not a workbook, or unreadable.
- **Warnings (do not block):** a subject whose subject area no teacher has (it will show as *Cannot be scheduled*); a laboratory subject with more students than every room seats, or laboratory subjects but no rooms (also *Cannot be scheduled*); more total units than all teachers' maximums together (some teachers will be overloaded); a prerequisite code that is not in the Subjects sheet; a teacher whose subject areas match no subject; a fixed day/period that falls in a time the only qualified teachers are not available.
- **Notes:** defaults applied ("8 teachers have no preferred days: all days used"), spelling unified, columns or sheets ignored, programs taken from section names.

Showing the result: a summary ("23 teachers · 61 subjects · 9 rooms"), then the errors grouped by sheet, then warnings, then notes. At most the first 50 items of each list are shown, with a count of the rest. The **Replace my data with this file** button is disabled while there are errors.

## 9. Screens and flow

A new card in **Settings**, shown to Administrator and IT, placed above *Backup and restore*:

```
Set up with your school's data
  Currently loaded: sample data (standard)            [or: your school's data, uploaded 25 Nov 2026]

  1. [Download blank template]   [Download current data]
  2. [Choose filled workbook (.xlsx)…]
  3. Check result:  ✓ 23 teachers · 61 subjects · 9 rooms
       Errors (0) · Warnings (2) · Notes (3)       ▸ expandable lists
     [Replace my data with this file]
```

- Pressing **Replace my data with this file** asks for confirmation. The message says that faculty, subjects and rooms will be replaced, and that the current schedule, saved versions and leave/availability requests will be cleared. It offers **Download a backup first** (the existing backup feature). Notifications and the activity log are kept, and an "Uploaded school data" entry is added to each. The curriculum-aware setting is kept; the department filter on the Chair overview and any selected teacher are reset.
- Afterwards the dataset is marked as the school's own (`datasetKind: "school"`, with the upload date and file name), and the app opens **Class Schedules** with its empty state and **Generate Schedule**.
- On the **Administrator and IT overviews**, while sample data is loaded, a slim banner says: "You are looking at sample data. Set up with your school's data →" and links to the Settings card. It is not shown once school data is loaded.
- Sample data stays available under *Testing tools*, for demonstrations and the testing guide.

## 10. Changes elsewhere in the app

- **Subject areas from the data.** The faculty form's checkboxes and the subject form's drop-down list the areas found in the current data (teachers' areas plus subjects' areas), plus a way to add a new one: a small "Add subject area" box in the faculty form and a "New subject area…" choice in the subject form. The CSV import accepts any subject area instead of only the 8 built-in ones (still trimmed and length-limited). `E.SPECIALIZATIONS` remains only for generating sample data.
- **Programs, ranks and employment status** in the forms offer the values found in the data plus the built-in ones, and always include the record's current value, so editing never silently changes a value that is not on a built-in list.
- **Backup and restore** keep the new dataset kind and upload details. The backup check accepts the new kind.
- **Engine:** no change needed.

## 11. Code structure (builder's call where not stated)

- New plain-JavaScript file **`importer.js`** (no JSX, no library), exposed as `window.SchedImport`. It holds the template definition (sheets, columns, examples, instructions) and two pure functions: one turns the sheets as plain row arrays into `{ data, errors, warnings, notes }`, and one turns the current data into rows for "Download current data". Keeping it free of the spreadsheet library makes it testable like `engine.js`.
- `app.jsx` uses the spreadsheet library only to turn a file into row arrays and row arrays into a workbook. The library is injected on first use (the same way `loader.js` loads Babel when needed) and is cached for the session.
- Tests: `tests/importer.test.js`, run by Node and by `tests/run.html` like the engine tests.
- `index.html` loads `importer.js` (small) before `loader.js`; the spreadsheet library is **not** added to `index.html`.

## 12. Testing

- **Automated (`tests/importer.test.js`):** a correct template is accepted with the right counts and values; every error kind; every warning kind; defaults and spelling notes; column matching by name in any order; extra sheets and columns ignored; row and size limits; "current data → rows → back again" gives the same data.
- **Manual:** download the template, fill it in Excel, upload and generate; the same with a file saved by Google Sheets and by LibreOffice; a file with errors shows them and changes nothing; Cancel at the confirmation changes nothing; Download current data → edit → upload again; offline; start-up time unchanged (no library on normal page loads).
- **Regression:** the 30 engine tests; the page-by-role sweep; `tools/build.html` reports `app.js` up to date.
- **Docs:** README (feature, structure, `importer.js`), testing guide (new section for the upload), `vendor/README.md` (library, version, license).

## 13. Left to the builder

- Exact message wording, the look of the check report, and template column widths and formatting.
- Number vs text cells from Excel (for example `35` read as a number or `"35"` as text): both must be accepted.
- IDs for uploaded records (for example sequential numbers).

## 14. Calls made in this design (not yet confirmed by the user)

1. An upload **replaces** all faculty, subjects and rooms, and clears the schedule, saved versions and requests (like Reset Demo Data); it does not merge.
2. Only **Administrator and IT** can upload.
3. Subject areas are **free text**, matched ignoring capitals and spaces; a subject whose area no teacher has is a **warning**, not an error.
4. The template includes a **Not available** column for teachers (so part-time teachers' known times are respected from the first schedule).
5. Blank **Preferred days** means all days (no preference).
6. **Download current data** is included (round-trip editing in Excel).
7. On first visit the app still loads **sample data** (needed for demonstrations and the testing guide), with a banner pointing administrators to the setup card.
8. The work is done on the branch `upload-school-data`; `main` stays the defense version until you choose to merge.
9. Template example rows start with `EXAMPLE` and are skipped on upload (with a note); blank rows are ignored; headers must be in row 1; days may be written short or in full.
