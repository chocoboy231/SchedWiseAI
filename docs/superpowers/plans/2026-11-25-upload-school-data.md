# Upload a School's Data from an Excel Template — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let an Administrator or IT user download an Excel template, fill it with the school's teachers, subjects and rooms, upload it, review a row-by-row check, and replace the sample data with it, ready to generate a schedule.

**Architecture:** A new library-free file `importer.js` (`window.SchedImport`) owns the template definition and turns sheets given as plain row arrays into the app's data model, with errors, warnings and notes; it is unit-tested like `engine.js`. `app.jsx` uses SheetJS (vendored, loaded on demand) only to convert an `.xlsx` file to row arrays and back, and adds a Settings card, a sample-data banner, and data-driven subject areas, programs, ranks and statuses in the forms.

**Tech Stack:** Plain JavaScript + React 18 (JSX in `app.jsx`, compiled to `app.js` with `tools/build.html`), SheetJS Community Edition ≥ 0.20.2, the project's tiny test runner (`tests/*.test.js`, run with Node or `tests/run.html`).

**Spec:** `docs/superpowers/specs/2026-11-25-upload-school-data-design.md`

## Global Constraints

- Work on branch `upload-school-data`; never commit to `main`. Commits are authored by chocoboy231 with **no `Co-Authored-By` trailer** (user preference).
- Spreadsheet library: SheetJS Community Edition, **version ≥ 0.20.2**, Apache-2.0, saved as `vendor/xlsx.full.min.js` with an entry in `vendor/README.md`. It is loaded **on demand** only; `index.html` must not load it.
- Limits: file ≤ 5 MB (`5 * 1024 * 1024` bytes); ≤ 2,000 data rows per sheet; any text cell ≤ 120 characters (longer is an error, never cut).
- Only Administrator and IT see and use the feature.
- Time model unchanged: days Mon–Sat, periods 1–6 (P1 07:00–08:30, P2 08:30–10:00, P3 10:00–11:30, P4 11:30–13:00, P5 13:00–14:30, P6 14:30–16:00); slot ids come from `E.buildTimeSlots()`.
- Ranges: Max units 1–40; Units 1–10; Students 1–300; Capacity 1–300; Year level 1–4; Fixed period 1–6.
- Defaults when blank: Employment status `Full-time`; Preferred days = all six days; School year = `E.currentSchoolYear()`; Category `Major`; Program = text of *Section* before the first `-` (error if there is no `-`). Academic rank and Subject name stay empty.
- No silent changes: every default applied and every spelling unified becomes a **note**.
- Offline: no request leaves the app's own folder.
- After any change to `app.jsx`, rebuild `app.js` with `/tools/build.html` and commit both files together.
- File names: template `SchedWiseAI-template.xlsx`; current data `SchedWiseAI-data-<YYYY-MM-DD>.xlsx`.

## Review Focus

1. **Excel row numbers in messages** when a sheet has blank rows or its data does not start at cell A1: every message must name the row Excel shows. *(Task 2 test "blank rows and EXAMPLE rows are skipped; row numbers match Excel"; Task 5 manual check with data starting at B3.)*
2. **Numbers that arrive as text or decimals, and codes that look like numbers** (`"35 "`, `35.0`, subject code `101`): whole numbers are accepted in any of these forms, `2.5` is refused, and `101` becomes the text `"101"`. *(Task 2 test "numbers typed as text and codes that look like numbers".)*
3. **Files that are not real workbooks** (a CSV or photo renamed `.xlsx`, a password-protected file, a file over 5 MB): a plain error, and nothing changes. *(Task 5 manual checks; Task 6 manual check.)*
4. **Replacing data in the middle of real use** (an approved schedule, pending requests, the Chair's department filter set): everything listed in the spec is cleared consistently, and a backup made before the upload restores the old data, while a backup made after it restores the school's data with kind `school`. *(Task 6 manual checks.)*
5. **Hostile or oversized content**: 2,001 rows, 121-character text, a cell holding `=HYPERLINK(...)`: limits are enforced and formula-looking text stays plain text (exports already escape it). *(Task 2 tests for the limits and formula text.)*

---

### Task 1: `importer.js` value readers and the importer test file

**Files:**
- Create: `importer.js`
- Create: `tests/importer.test.js`
- Modify: `tests/run.html` (load `../importer.js` and `importer.test.js` after the engine test)

**Interfaces:**
- Consumes: `window.SchedEngine` (`buildTimeSlots()`, `DAYS`, `PERIODS`, `currentSchoolYear()`), loaded before `importer.js`.
- Produces (`window.SchedImport`):
  - `SHEETS = ["Faculty", "Subjects", "Rooms"]`
  - `LIMITS = { maxFileBytes: 5242880, maxRows: 2000, maxText: 120 }`
  - `COLUMNS = { Faculty: Column[], Subjects: Column[], Rooms: Column[] }`, `Column = { key: string, header: string, required: boolean }`, with headers **exactly**:
    - Faculty: `Name *`→`name`, `Subject areas *`→`subjectAreas`, `Max units *`→`maxUnits`, `Employment status`→`employmentStatus`, `Academic rank`→`academicRank`, `Preferred days`→`preferredDays`, `Not available`→`notAvailable`
    - Subjects: `Subject code *`→`code`, `Program`→`program`, `Subject name`→`name`, `Section *`→`section`, `Units *`→`units`, `Subject area *`→`subjectArea`, `Class type *`→`classType`, `Students *`→`students`, `Year level *`→`yearLevel`, `Semester *`→`semester`, `School year`→`schoolYear`, `Category`→`category`, `Fixed day`→`fixedDay`, `Fixed period`→`fixedPeriod`, `Prerequisite`→`prerequisite`
    - Rooms: `Room name *`→`name`, `Capacity *`→`capacity`
  - `canonical(text: any) -> string` — lower case, `*` removed, spaces collapsed and trimmed.
  - `parseWholeNumber(value: any, min: number, max: number) -> { value: number } | { error: string }` — error text includes `"<min> to <max>"`.
  - `parseDayList(text: any) -> { days: string[] } | { error: string }` — `;` or `,` separated; `Mon`…`Sat` or full names, any capitals; result in Mon–Sat order, no duplicates; Sunday is an error; blank → `{ days: [] }`.
  - `parseSlotList(text: any) -> { ids: number[] } | { error: string }` — entries separated by `;` or `,`: `Day`, `Day Pn`, or `Day Pn-Pm`; ids ascending, no duplicates; blank → `{ ids: [] }`.
  - `formatSlotList(ids: number[]) -> string` — the inverse: Mon–Sat order, a full day as `Sat`, runs as `Fri P4-P6`, single periods as `Mon P1`, joined with `"; "`.
  - `parseYearLevel(value) -> { value: 1|2|3|4 } | { error }` — accepts `2`, `"2"`, `"2nd"`, `"2nd Year"`, `"Year 2"`.
  - `parseSemester(value) -> { value: "1st Semester"|"2nd Semester" } | { error }` — accepts `1`, `"1st"`, `"First"`, `"2nd semester"`, `"Second Semester"`.
  - `parseSchoolYear(value) -> { value: "YYYY–YYYY" } | { error }` — `-`, `–` or `—` with optional spaces; second year must be first + 1; output uses the en dash `–`.

- [ ] **Step 1: Write the failing tests** in `tests/importer.test.js`, an IIFE shaped like `tests/engine.test.js` (same `test/assert/eq/show` runner; in Node it does `global.window = global; require("../engine.js"); require("../importer.js");`; at the end it sets `window.__importerTestResult` instead of `__testResult`):

```js
const S = E.buildTimeSlots(), id = (d, p) => S.find(t => t.day === d && t.period === p).id;
test("canonical: ignores capitals, extra spaces and the required star", () => {
  eq(I.canonical("  Max   Units * "), "max units");
});
test("parseWholeNumber: numbers and digit text in range; decimals, text and blanks refused", () => {
  eq(I.parseWholeNumber(35, 1, 300).value, 35); eq(I.parseWholeNumber(" 35 ", 1, 300).value, 35); eq(I.parseWholeNumber(35.0, 1, 300).value, 35);
  assert(I.parseWholeNumber(2.5, 1, 300).error); assert(I.parseWholeNumber("abc", 1, 300).error); assert(I.parseWholeNumber("", 1, 300).error);
  assert(/1 to 300/.test(I.parseWholeNumber(0, 1, 300).error));
});
test("parseDayList: short or full names, ; or , separators, Sunday refused", () => {
  eq(I.parseDayList("fri; Monday ;WED").days.join(","), "Mon,Wed,Fri"); eq(I.parseDayList("Mon, Tue").days.join(","), "Mon,Tue");
  eq(I.parseDayList("").days.length, 0); assert(I.parseDayList("Mon; Sun").error); assert(I.parseDayList("Mon; Funday").error);
});
test("parseSlotList: whole day, one period, a range; bad entries refused", () => {
  eq(JSON.stringify(I.parseSlotList("Sat").ids), JSON.stringify([1, 2, 3, 4, 5, 6].map(p => id("Sat", p))));
  eq(JSON.stringify(I.parseSlotList("monday p2").ids), JSON.stringify([id("Mon", 2)]));
  eq(JSON.stringify(I.parseSlotList("Fri P4-P6; Mon P1").ids), JSON.stringify([id("Mon", 1), id("Fri", 4), id("Fri", 5), id("Fri", 6)]));
  eq(I.parseSlotList("").ids.length, 0);
  ["Mon P7", "Fri P5-P3", "Sun", "Mon morning", "P1"].forEach(t => assert(I.parseSlotList(t).error, t));
});
test("formatSlotList is the inverse of parseSlotList", () => {
  ["Sat", "Mon P1", "Mon P1-P2; Fri P4-P6", "Tue; Thu P3"].forEach(t => eq(I.formatSlotList(I.parseSlotList(t).ids), t));
});
test("parseYearLevel, parseSemester, parseSchoolYear", () => {
  eq(I.parseYearLevel(2).value, 2); eq(I.parseYearLevel("3rd Year").value, 3); eq(I.parseYearLevel("Year 4").value, 4); assert(I.parseYearLevel(5).error);
  eq(I.parseSemester("1").value, "1st Semester"); eq(I.parseSemester("Second Semester").value, "2nd Semester"); assert(I.parseSemester("Summer").error);
  eq(I.parseSchoolYear("2026-2027").value, "2026–2027"); eq(I.parseSchoolYear("2026 – 2027").value, "2026–2027"); assert(I.parseSchoolYear("2026-2028").error);
});
```

- [ ] **Step 2: Run the tests to see them fail**

Run: `node tests/importer.test.js` (or serve the folder and open `/tests/run.html`)
Expected: FAIL — `SchedImport` is undefined.

- [ ] **Step 3: Implement the constants and readers in `importer.js`** with the signatures above. File header comment in the style of `engine.js`; ends with `window.SchedImport = { ... }`. For `parseSlotList`, each entry (after `canonical`) must match `^(day)(?:\s*p\s*([1-6])(?:\s*-\s*p?\s*([1-6]))?)?$`, where `day` is any short or full day name.

- [ ] **Step 4: Run the tests to see them pass**

Run: `node tests/importer.test.js` (or `/tests/run.html`)
Expected: the importer block ends with `6 passed, 0 failed`; the engine block still ends with `30 passed, 0 failed`.

- [ ] **Step 5: Commit**

```bash
git add importer.js tests/importer.test.js tests/run.html
git commit -m "Add importer value readers and their tests"
```

---

### Task 2: `parseWorkbook` — sheets to the app's data model, with errors and notes

**Files:**
- Modify: `importer.js`
- Test: `tests/importer.test.js`

**Interfaces:**
- Consumes: Task 1 readers, `COLUMNS`, `LIMITS`.
- Produces: `parseWorkbook(sheets: { [sheetName: string]: any[][] }, options?: { schoolYear?: string }) -> ImportResult`
  - `sheets`: every sheet of the workbook as row arrays; **index 0 is Excel row 1** (the header row); data row at index `i` is Excel row `i + 1`. Cells are numbers, strings, booleans or `null`.
  - `ImportResult = { ok: boolean, data: { faculty, sections, rooms } | null, counts: { faculty, sections, rooms }, errors: Issue[], warnings: Issue[], notes: Issue[] }`; `data` is `null` whenever `errors` is non-empty.
  - `Issue = { sheet: string | null, row: number | null, column: string | null, message: string }` (`column` is the header without `*`, e.g. `"Max units"`).
  - Records (ids are 0, 1, 2… in file order):
    - faculty: `{ id, name, specializations: string[], maxUnits, preferredDays: string[], unavailableSlotIds: number[], preferredSlotIds: [], employmentStatus, academicRank }`
    - sections: `{ id, subjectCode, subjectName, sectionName, program, units, requiredSpecialization, roomTypeRequired: "online" | "laboratory", enrolledStudents, yearLevel, semester, schoolYear, category: "Major" | "Minor", fixedSlotId: number | null, prerequisiteCode: string | null }`
    - rooms: `{ id, name, type: "laboratory", capacity }`
- Rules this task fixes (beyond the spec's tables):
  - Sheets and headers are matched with `canonical`. A sheet named `Instructions` is ignored silently; any other unknown sheet, and any unknown column, gives a note. A missing `Rooms` sheet means no rooms.
  - A row is skipped when all its cells are blank, or when its identifying cell (Faculty `Name`, Subjects `Subject code`, Rooms `Room name`) starts with `EXAMPLE` (any capitals); skipped example rows give one note per sheet with the count.
  - Text cells are trimmed; numbers in text columns become text (`101` → `"101"`).
  - Subject areas: the spelling of the first appearance in Faculty (row order), else in Subjects; every other spelling gives a note naming both.
  - Duplicates are found with `canonical`; the message names the earlier row.
  - Notes for defaults are counts, one per kind, e.g. `"2 teachers have no preferred days: all days used."`.

- [ ] **Step 1: Write the failing tests.** Add a helper `book({ Faculty, Subjects, Rooms, ...extra })` that puts `I.COLUMNS[sheet].map(c => c.header)` in front of each given row list (a sheet passed as `null` is left out). Base fixture:

```js
const F = [["Maria Santos", "Programming; Databases", 21, "Full-time", "Instructor I", "Mon; Wed", "Sat"],
           ["Jose Reyes", "Accounting", 12, "Part-time", "", "", ""]];
const SUB = [["IT101", "BSIT", "Intro to Computing", "BSIT-1A", 3, "Programming", "Laboratory", 35, 1, "1st", "2026-2027", "Major", "", "", ""],
             ["ACC101", "", "Financial Accounting", "BSA-1A", 3, "accounting", "Online", 40, 1, "1st", "", "", "Sat", 1, ""]];
const R = [["Lab 101", 40]];
const OPT = { schoolYear: "2030–2031" };
```

Tests and their key assertions:

```js
test("a correct workbook becomes the app's data model", () => {
  const r = I.parseWorkbook(book({ Faculty: F, Subjects: SUB, Rooms: R }), OPT);
  assert(r.ok); eq(JSON.stringify(r.counts), '{"faculty":2,"sections":2,"rooms":1}');
  const [m, j] = r.data.faculty, [it, acc] = r.data.sections;
  eq(JSON.stringify(m), JSON.stringify({ id: 0, name: "Maria Santos", specializations: ["Programming", "Databases"], maxUnits: 21, preferredDays: ["Mon", "Wed"],
    unavailableSlotIds: [1, 2, 3, 4, 5, 6].map(p => id("Sat", p)), preferredSlotIds: [], employmentStatus: "Full-time", academicRank: "Instructor I" }));
  eq(j.preferredDays.join(","), E.DAYS.join(",")); eq(j.academicRank, "");
  eq(acc.requiredSpecialization, "Accounting"); eq(acc.program, "BSA"); eq(acc.roomTypeRequired, "online"); eq(acc.schoolYear, "2030–2031");
  eq(acc.category, "Major"); eq(acc.fixedSlotId, id("Sat", 1)); eq(acc.prerequisiteCode, null);
  eq(it.semester, "1st Semester"); eq(it.schoolYear, "2026–2027"); eq(it.roomTypeRequired, "laboratory");
  eq(JSON.stringify(r.data.rooms[0]), JSON.stringify({ id: 0, name: "Lab 101", type: "laboratory", capacity: 40 }));
});
test("notes list every default and spelling change", () => {
  const n = I.parseWorkbook(book({ Faculty: F, Subjects: SUB, Rooms: R }), OPT).notes.map(x => x.message).join(" | ");
  ["'accounting'", "no preferred days", "school year", "category", "program"].forEach(w => assert(n.toLowerCase().includes(w.toLowerCase()), w));
});
test("columns matched by name in any order; extra columns and sheets ignored with a note", () => {
  const sheets = book({ Faculty: F, Subjects: SUB, Rooms: null });
  sheets.Rooms = [["Remarks", "Capacity *", "room name"], ["new", 30, "Lab 201"]]; sheets.Old = [["x"]]; sheets.Instructions = [["read me"]];
  const r = I.parseWorkbook(sheets, OPT); assert(r.ok); eq(r.data.rooms[0].name, "Lab 201");
  const n = r.notes.map(x => x.message).join(" | "); assert(/Remarks/.test(n) && /Old/.test(n) && !/Instructions/.test(n));
});
test("blank rows and EXAMPLE rows are skipped; row numbers match Excel", () => {
  const r = I.parseWorkbook(book({ Faculty: [["EXAMPLE Ana", "Programming", 21], [], F[0], ["Ben Cruz", "Programming", 0]], Subjects: SUB, Rooms: R }), OPT);
  assert(!r.ok); eq(r.data, null);
  const e = r.errors[0]; eq(e.sheet, "Faculty"); eq(e.row, 5); eq(e.column, "Max units");
  assert(r.notes.some(x => /1 example row/.test(x.message)));
});
test("numbers typed as text and codes that look like numbers", () => {
  const s = SUB.map(r => r.slice()); s[0][0] = 101; s[0][4] = "3"; s[0][7] = "35 "; const f = F.map(r => r.slice()); f[0][2] = 21.0;
  const r = I.parseWorkbook(book({ Faculty: f, Subjects: s, Rooms: R }), OPT); assert(r.ok);
  eq(r.data.sections[0].subjectCode, "101"); eq(r.data.sections[0].units, 3); eq(r.data.sections[0].enrolledStudents, 35); eq(r.data.faculty[0].maxUnits, 21);
});
test("formula-looking text stays plain text", () => {
  const f = F.map(r => r.slice()); f[1][0] = '=HYPERLINK("x","y")';
  eq(I.parseWorkbook(book({ Faculty: f, Subjects: SUB, Rooms: R }), OPT).data.faculty[1].name, '=HYPERLINK("x","y")');
});
```

One table-driven test, `"every error kind blocks and points to sheet, row and column"`, where each case changes the base fixture and states the expected `[sheet, row, column]` of the first error (`null` where not applicable):

| Case | Change | Expected |
|---|---|---|
| missing Subjects sheet | `Subjects: null` | `["Subjects", null, null]` |
| missing required column | Rooms header without `Capacity *` | `["Rooms", 1, "Capacity"]` |
| Faculty has no data rows | `Faculty: []` | `["Faculty", null, null]` |
| required cell empty | Subjects row 2 Units `""` | `["Subjects", 2, "Units"]` |
| out of range | Subjects row 2 Students `301` | `["Subjects", 2, "Students"]` |
| not whole | Subjects row 2 Units `2.5` | `["Subjects", 2, "Units"]` |
| value not allowed | Subjects row 2 Class type `"Lecture"` | `["Subjects", 2, "Class type"]` |
| bad preferred days | Faculty row 2 Preferred days `"Mon; Sun"` | `["Faculty", 2, "Preferred days"]` |
| bad not available | Faculty row 2 Not available `"Mon P9"` | `["Faculty", 2, "Not available"]` |
| bad employment status | Faculty row 2 `"Volunteer"` | `["Faculty", 2, "Employment status"]` |
| duplicate teacher | Faculty row 3 Name `"MARIA  santos"` | `["Faculty", 3, "Name"]`, message mentions row 2 |
| duplicate subject+section | Subjects row 3 = row 2 again | `["Subjects", 3, "Section"]` |
| duplicate room | Rooms rows `Lab 101`, `lab 101` | `["Rooms", 3, "Room name"]` |
| only one fixed field | Subjects row 3 Fixed period `""` (Fixed day `Sat`) | `["Subjects", 3, "Fixed period"]` |
| text too long | Faculty row 2 Name of 121 characters | `["Faculty", 2, "Name"]` |
| too many rows | Rooms with 2,001 rows `["Lab " + i, 30]` | `["Rooms", null, null]` |
| no program and no `-` | Subjects row 3 Program `""`, Section `"BSA1A"` | `["Subjects", 3, "Program"]` |

- [ ] **Step 2: Run the tests to see them fail**

Run: `node tests/importer.test.js`
Expected: FAIL — `I.parseWorkbook is not a function`.

- [ ] **Step 3: Implement `parseWorkbook`** in `importer.js` with the interface and rules above (warnings come in Task 3; return `warnings: []` for now). Check the 2,000-row limit before reading rows; check every text cell against `LIMITS.maxText`.

- [ ] **Step 4: Run the tests to see them pass**

Run: `node tests/importer.test.js`
Expected: importer block `13 passed, 0 failed` (6 from Task 1 + 7 here).

- [ ] **Step 5: Commit**

```bash
git add importer.js tests/importer.test.js
git commit -m "Add parseWorkbook: sheets to the app's data model with errors and notes"
```

---

### Task 3: Warnings that do not block an upload

**Files:**
- Modify: `importer.js` (inside `parseWorkbook`, computed only when there are no errors)
- Test: `tests/importer.test.js`

**Interfaces:**
- Consumes: `parseWorkbook` from Task 2.
- Produces: `ImportResult.warnings` filled by these seven checks, which cover the spec's six warning kinds (its "laboratory subject too big / no rooms" kind is two checks here). Each warning has the sheet and row concerned, or `row: null` for whole-file warnings:
  1. a subject whose subject area no teacher has — message names the area, code and section, and says it will show as *Cannot be scheduled*;
  2. a laboratory subject with more students than the largest room seats (message names both numbers);
  3. laboratory subjects but no rooms (one warning with the count);
  4. total subject units greater than the sum of teachers' maximum units (one warning with both totals, says some teachers will be overloaded);
  5. a prerequisite code that is not a subject code in the sheet;
  6. a teacher none of whose subject areas is needed by any subject;
  7. a subject with a fixed time when every teacher with its subject area is not available at that time.

- [ ] **Step 1: Write the failing test** `"warnings explain problems but do not block"`, one sub-case per kind, each asserting `r.ok === true`, `r.data !== null` and one warning on the expected `[sheet, row]` whose message contains the key word: (1) add Subjects row with area `"Nursing"` → `["Subjects", 4]`, `/Nursing/`; (2) Subjects row 2 Students `60` with Rooms `[["Lab 101", 40]]` → `["Subjects", 2]`, `/60/`; (3) `Rooms: null` → `[null, null]`, `/no rooms/i`; (4) Faculty maximums `1` and `1` → `[null, null]`, `/overloaded/`; (5) Subjects row 2 Prerequisite `"IT999"` → `["Subjects", 2]`, `/IT999/`; (6) add Faculty row `["Ana Lim", "Nursing", 18]` with no Nursing subject → `["Faculty", 4]`, `/Ana Lim/`; (7) Subjects row 3 fixed at Sat P1 while the only Accounting teacher has Not available `"Sat"` → `["Subjects", 3]`, `/fixed time/`.

- [ ] **Step 2: Run the test to see it fail**

Run: `node tests/importer.test.js`
Expected: FAIL in `warnings explain problems but do not block`.

- [ ] **Step 3: Implement the seven warning checks** in `parseWorkbook`.

- [ ] **Step 4: Run the tests to see them pass**

Run: `node tests/importer.test.js`
Expected: importer block `14 passed, 0 failed`.

- [ ] **Step 5: Commit**

```bash
git add importer.js tests/importer.test.js
git commit -m "Add upload warnings that explain but do not block"
```

---

### Task 4: Template rows and current-data rows

**Files:**
- Modify: `importer.js`
- Test: `tests/importer.test.js`

**Interfaces:**
- Consumes: `COLUMNS`, `formatSlotList`, `parseWorkbook`.
- Produces:
  - `templateRows() -> { Instructions: any[][], Faculty: any[][], Subjects: any[][], Rooms: any[][] }` — keys in that order. Each data sheet is its header row (exact `COLUMNS` headers) plus two example rows whose identifying cell starts with `EXAMPLE` (Faculty `EXAMPLE Maria Santos` with `Programming; Databases`, 21, Full-time, Instructor I, `Mon; Wed; Fri`, `Sat`; `EXAMPLE Jose Reyes` with `Accounting`, 12, Part-time, blank rank, `Tue; Thu`, `Mon P1-P3`; Subjects `EXAMPLE IT101`/BSIT/BSIT-1A/Programming/Laboratory/35 and `EXAMPLE ACC101`/BSA/BSA-1A/Accounting/Online/40 fixed `Sat` 1; Rooms `EXAMPLE Lab 101` 40 and `EXAMPLE Lab 102` 30). Instructions: one text cell per row covering, in plain language, the four steps (fill in, the EXAMPLE rows are skipped, save as `.xlsx`, upload under Settings → Set up with your school's data), every column's allowed values and blank default, the period table with times, the *Not available* format, and the subject-area spelling rule.
  - `currentDataRows({ faculty, sections, rooms }) -> { Faculty: any[][], Subjects: any[][], Rooms: any[][] }` — header row plus one row per record. Preferred days that are all six days are written blank; `unavailableSlotIds` via `formatSlotList`; class type `Online`/`Laboratory`; semester `1st`/`2nd`; fixed slot as day + period; missing prerequisite blank.

- [ ] **Step 1: Write the failing tests**

```js
test("the template has four sheets, exact headers and EXAMPLE rows that are skipped", () => {
  const t = I.templateRows(); eq(Object.keys(t).join(","), "Instructions,Faculty,Subjects,Rooms");
  I.SHEETS.forEach(s => { eq(t[s][0].join("|"), I.COLUMNS[s].map(c => c.header).join("|")); eq(t[s].length, 3); });
  const text = t.Instructions.map(r => r.join(" ")).join("\n"); assert(/P1/.test(text) && /07:00/.test(text) && /EXAMPLE/.test(text));
  const r = I.parseWorkbook(t); assert(!r.ok); assert(r.errors.some(e => e.sheet === "Faculty" && e.row === null), "only the examples, so no data");
});
test("current data -> workbook rows -> back again gives the same data", () => {
  const d = E.generateExpandedData(3);
  d.faculty.forEach(f => { f.preferredSlotIds = []; f.unavailableSlotIds.sort((a, b) => a - b); f.preferredDays = E.DAYS.filter(x => f.preferredDays.includes(x)); });
  const r = I.parseWorkbook(I.currentDataRows(d), { schoolYear: d.sections[0].schoolYear });
  assert(r.ok, r.errors.map(e => e.message).join("; "));
  const pick = (list, keys) => JSON.stringify(list.map(x => keys.map(k => x[k])));
  eq(pick(r.data.faculty, ["name", "specializations", "maxUnits", "preferredDays", "unavailableSlotIds", "employmentStatus", "academicRank"]),
     pick(d.faculty, ["name", "specializations", "maxUnits", "preferredDays", "unavailableSlotIds", "employmentStatus", "academicRank"]));
  eq(pick(r.data.sections, ["subjectCode", "subjectName", "sectionName", "program", "units", "requiredSpecialization", "roomTypeRequired", "enrolledStudents", "yearLevel", "semester", "schoolYear", "category", "fixedSlotId", "prerequisiteCode"]),
     pick(d.sections, ["subjectCode", "subjectName", "sectionName", "program", "units", "requiredSpecialization", "roomTypeRequired", "enrolledStudents", "yearLevel", "semester", "schoolYear", "category", "fixedSlotId", "prerequisiteCode"]));
  eq(pick(r.data.rooms, ["name", "capacity"]), pick(d.rooms, ["name", "capacity"]));
});
```

- [ ] **Step 2: Run the tests to see them fail**

Run: `node tests/importer.test.js`
Expected: FAIL — `I.templateRows is not a function`.

- [ ] **Step 3: Implement `templateRows` and `currentDataRows`** in `importer.js`.

- [ ] **Step 4: Run the tests to see them pass**

Run: `node tests/importer.test.js`
Expected: importer block `16 passed, 0 failed`. If the round trip fails on a sample value the template cannot hold (for example a preferred-day list that is all six days), fix `currentDataRows`, not the test.

- [ ] **Step 5: Commit**

```bash
git add importer.js tests/importer.test.js
git commit -m "Add template rows and current-data rows for the workbook"
```

---

### Task 5: Spreadsheet library and workbook read/write helpers

**Files:**
- Create: `vendor/xlsx.full.min.js` (SheetJS CE ≥ 0.20.2 from `https://cdn.sheetjs.com/xlsx-<version>/package/dist/xlsx.full.min.js`; ask the user before downloading, stating file, source and size)
- Modify: `vendor/README.md` (row: file, "SheetJS Community Edition (reads and writes Excel files; loaded only by the Settings setup card)", version, source URL, "Apache-2.0, © SheetJS LLC")
- Modify: `index.html` (load `importer.js` after `engine.js`, before `loader.js`; update the header comment)
- Modify: `app.jsx` (helpers next to `downloadJSON`), then rebuild `app.js`

**Interfaces:**
- Consumes: `SchedImport.LIMITS`.
- Produces (top-level functions in `app.jsx`):
  - `loadSheetLibrary(): Promise<object>` — injects `<script src="vendor/xlsx.full.min.js">` once (cache the promise), resolves `window.XLSX`, rejects with `Error("The spreadsheet reader could not be loaded.")`.
  - `readWorkbookFile(file: File): Promise<{ [sheetName: string]: any[][] }>` — rejects with `Error("The file is larger than 5 MB.")` when `file.size > LIMITS.maxFileBytes`; reads with `XLSX.read(buffer, { type: "array", cellFormula: false, cellHTML: false })`; for each sheet returns `XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null, blankrows: true, range })` where `range` starts at **A1** and ends at the end of `ws["!ref"]` (so index 0 is always Excel row 1); a sheet without `!ref` gives `[]`. Any read failure rejects with `Error("This file could not be read as an Excel workbook (.xlsx).")`.
  - `downloadWorkbook(filename: string, sheets: { [name: string]: any[][] }): Promise<void>` — one sheet per key in key order (`XLSX.utils.aoa_to_sheet`), column widths from the longest value (cap 40 characters), `XLSX.writeFile(wb, filename)`.

- [ ] **Step 1: Add the library, the `vendor/README.md` row and the `index.html` script tag.**

- [ ] **Step 2: Add the three helpers to `app.jsx`, rebuild `app.js`** (open `/tools/build.html`, press **Build app.js**, save `app.js` into the project folder) **and check:** `/tools/build.html` says "✓ app.js is up to date with app.jsx".

- [ ] **Step 3: Verify in the browser** (serve the folder, open the app, use the console):
  - Network: a normal page load does **not** request `xlsx.full.min.js`.
  - `await loadSheetLibrary()` → an object whose `version` is ≥ 0.20.2.
  - `await downloadWorkbook("t.xlsx", SchedImport.templateRows())` downloads a file that opens in Excel with four sheets.
  - Reading that file back with `readWorkbookFile` gives the same rows as `SchedImport.templateRows()` (row 1 = headers).
  - A workbook whose Faculty data starts at **B3**: `readWorkbookFile` returns rows where index 0 is Excel row 1, and `parseWorkbook` reports a bad value in Excel row 5 as `row: 5`.
  - A `.csv` file renamed to `.xlsx`, a photo renamed to `.xlsx`, and a 6 MB file each reject with the messages above.

- [ ] **Step 4: Commit**

```bash
git add vendor/xlsx.full.min.js vendor/README.md index.html app.jsx app.js
git commit -m "Add the spreadsheet library (loaded on demand) and workbook helpers"
```

---

### Task 6: Settings card "Set up with your school's data"

**Files:**
- Modify: `app.jsx` — new `SchoolDataCard` component next to `SettingsPage`; `SettingsPage` renders it for Admin/IT above *Backup and restore*; `App` state, handlers, persistence, backup/restore. Then rebuild `app.js`.

**Interfaces:**
- Consumes: Task 2–4 `SchedImport` functions; Task 5 helpers; existing `handleDownloadBackup`, `pushNotification`, `logActivity`, `goToPage`, `Modal`.
- Produces:
  - `App` state `datasetInfo: { fileName: string, uploadedAt: string } | null` (persisted in `saveState`, added to `BACKUP_KEYS`; `parseBackup` accepts `null` or an object of optional strings `fileName`/`uploadedAt`; `datasetKind` may now be `"standard" | "expanded" | "school"`, and `handleRestoreBackup` keeps `"school"` and restores `datasetInfo`; `resetDemoData` sets it to `null`).
  - `handleApplySchoolData(data: { faculty, sections, rooms }, fileName: string): void` — replaces faculty/sections/rooms; clears `result`, `scheduleHistory`, `leaveRequests`, `testLog`; resets `chairDept` to `"All"` and `selectedFacultyId` to `null`; keeps `curriculumAware`, notifications and the activity log; sets `datasetKind` `"school"` and `datasetInfo`; pushes the notification `"Uploaded school data from <file>: <n> teachers, <n> subjects, <n> rooms."`; logs activity kind `"Upload"`; opens Class Schedules.
  - `handleDownloadTemplate()` → `downloadWorkbook("SchedWiseAI-template.xlsx", SchedImport.templateRows())`; `handleDownloadCurrentData()` → `downloadWorkbook("SchedWiseAI-data-<YYYY-MM-DD>.xlsx", SchedImport.currentDataRows({ faculty, sections, rooms }))`.
  - `SchoolDataCard({ datasetKind, datasetInfo, onDownloadTemplate, onDownloadCurrent, onApply, onDownloadBackup })` — local state for the chosen file, busy flag, read error and `ImportResult`. Shows: the "Currently loaded" line (sample standard/expanded, or "your school's data, uploaded <date> from <file>"); step 1 buttons; step 2 file input (`accept=".xlsx"`); step 3 summary `"✓ <n> teachers · <n> subjects · <n> rooms"` and Errors/Warnings/Notes lists grouped by sheet with "Row N, Column:" prefixes, each capped at 50 items with "+ N more"; **Replace my data with this file** disabled while there are errors; it opens a `Modal` titled "Replace your data?" that states what is replaced and cleared, with buttons **Download a backup first**, **Replace my data** and **Cancel**.

- [ ] **Step 1: Implement the state, handlers, persistence/backup changes and `SchoolDataCard`; rebuild `app.js`; check `/tools/build.html` reports up to date.**

- [ ] **Step 2: Verify in the browser** (signed in as Administrator unless stated):
  - Chair and Faculty Member do not see the card; IT does.
  - **Download blank template** and **Download current data** save the two files; the current-data file re-uploads with 0 errors.
  - Fill the template with 2 teachers, 3 subjects, 1 room (one subject in a subject area no teacher has) → summary shows the counts, 0 errors, 1 warning; Replace → Cancel changes nothing; Replace → **Download a backup first** saves a backup and keeps the dialog open; **Replace my data** → Class Schedules opens with **Generate Schedule**; Generate → the unmatched subject shows as *Cannot be scheduled*.
  - Before uploading, approve a schedule, leave a request pending and set the Chair department filter; after uploading: no schedule, no versions, no requests, filter "All".
  - Settings shows "your school's data, uploaded …". Reload: still there. A backup made now restores the school's data with that line; the backup made before the upload restores the sample data.
  - A workbook with errors lists them with sheet/row/column and the Replace button stays disabled; a renamed photo shows the read error; nothing changes in either case.
  - The same filled template saved again by **Google Sheets** (File → Download → .xlsx) and by **LibreOffice Calc** (Save As → Excel 2007-365) uploads with the same counts, warnings and notes as the Excel copy.

- [ ] **Step 3: Commit**

```bash
git add app.jsx app.js
git commit -m "Add the Settings card to set up SchedWiseAI with a school's data"
```

---

### Task 7: Sample-data banner on the Administrator and IT overviews

**Files:**
- Modify: `app.jsx` — `SampleDataBanner` component; `DashboardPage` call site passes `datasetKind` and `onOpenSetup={() => goToPage("settings")}`; `AdminOverview` and `ITOverview` render it under their `OverviewHero` when `datasetKind !== "school"`. Rebuild `app.js`.

**Interfaces:**
- Consumes: `datasetKind` from Task 6.
- Produces: `SampleDataBanner({ onSetup })` — one line, `role="note"`: "You are looking at sample data." plus a button "Set up with your school's data →".

- [ ] **Step 1: Implement; rebuild `app.js`; check `/tools/build.html` reports up to date.**

- [ ] **Step 2: Verify in the browser:** the banner shows for Administrator and IT with sample data and not for Chair or Faculty; its button opens Settings; after an upload it is gone; after loading a sample in Testing tools it is back.

- [ ] **Step 3: Commit**

```bash
git add app.jsx app.js
git commit -m "Point administrators to the school-data setup while sample data is loaded"
```

---

### Task 8: Subject areas, programs, ranks and statuses come from the data

**Files:**
- Modify: `app.jsx` — `subjectAreasOf` helper; `computeAllDepartments` and the Reports department summary use it; `FacultyModal`, `SectionModal` and their call sites; `CSVImportModal` checks. Rebuild `app.js`.

**Interfaces:**
- Produces: `subjectAreasOf(faculty, sections): string[]` — unique teacher areas and subject areas, sorted with `localeCompare`.
- Changes:
  - `FacultyModal` gets `subjectAreas` (App passes `subjectAreasOf(faculty, sections)`); its checkboxes list `subjectAreas` plus the teacher's own; a text box + **Add** button adds a new area (trimmed, ≤ 120 characters; a name equal under `canonical` to an existing one selects the existing spelling). Employment status and rank options are the built-in lists plus every value in `allFaculty` plus the teacher's own.
  - `SectionModal` gets `subjectAreas` and `programs` (programs in the data ∪ `["BSIT","BSCS","BSIS"]`, plus the subject's own). The subject-area select lists `subjectAreas` plus the subject's own and a last option **New subject area…** that reveals a text box (same rules as above).
  - `CSVImportModal` accepts any subject area that is non-empty and ≤ 120 characters (no check against `E.SPECIALIZATIONS`).
  - `E.SPECIALIZATIONS` is no longer used by `app.jsx`.

- [ ] **Step 1: Implement; rebuild `app.js`; check `/tools/build.html` reports up to date.**

- [ ] **Step 2: Verify in the browser** after uploading a workbook with areas `Accounting` and `Nursing Care`, a teacher with rank `Dean` and status `Contractual`, and a subject in program `BSA`:
  - Add Faculty lists Accounting and Nursing Care; adding `nursing care` with **Add** selects the existing Nursing Care.
  - Editing the `Dean` teacher shows `Dean` selected; saving without changes keeps `Dean`.
  - Add Subject lists BSA in Program and both areas; **New subject area…** → `Midwifery` saves and then appears in Add Faculty.
  - Faculty CSV import with area `Midwifery` imports; with an empty area it is refused.
  - Departments and the Reports department summary list exactly the school's areas.
  - Run `grep -n "E.SPECIALIZATIONS" app.jsx` → no output.

- [ ] **Step 3: Commit**

```bash
git add app.jsx app.js
git commit -m "Take subject areas, programs, ranks and statuses from the school's data"
```

---

### Task 9: Documentation and full regression

**Files:**
- Modify: `README.md` — Features row "Set up with your school's data"; project structure (`importer.js`, `tests/importer.test.js`, `vendor/xlsx.full.min.js`); Function reference rows for `SchedImport` and the three workbook helpers; Testing section (importer tests, their count); note that subject areas come from the data.
- Modify: `docs/TESTING_GUIDE.md` — new section **N. Setting up with a school's data** (download template; upload with errors; upload with warnings; replace + cancel + backup-first; generate from uploaded data; download current data round trip; sample-data banner; forms with the school's subject areas), contents list, results sheet totals and ISO/IEC 25010 rows; M1 expected output gains the importer summary.

- [ ] **Step 1: Update both documents.**

- [ ] **Step 2: Run the full regression:**
  - `node tests/engine.test.js` → `30 passed, 0 failed`; `node tests/importer.test.js` → `16 passed, 0 failed` (or both blocks in `/tests/run.html`).
  - `/tools/build.html` → "✓ app.js is up to date with app.jsx".
  - Fresh browser data: every page for every role opens with no console errors, at desktop width and at 375 px.
  - Start-up: first screen time is unchanged from `main` (no `xlsx.full.min.js` request on load).
  - Offline (internet off, served locally): download template, upload, generate all work.

- [ ] **Step 3: Commit**

```bash
git add README.md docs/TESTING_GUIDE.md
git commit -m "Document setting up SchedWiseAI with a school's data"
```
