/* =====================================================================
   SchedWiseAI — importer tests  (tests/importer.test.js)
   ---------------------------------------------------------------------
   Tests for importer.js, which turns an uploaded Excel workbook (given as
   plain rows) into the app's teachers, subjects and rooms. No libraries.

   RUN WITH NODE (from the repository folder):
       node tests/importer.test.js
   RUN IN A BROWSER (no Node needed): serve the folder, then open
       tests/run.html   (it runs the engine tests and these)
   ===================================================================== */
(function () {
  const inNode = typeof module !== "undefined" && module.exports;
  if (inNode) { global.window = global; require("../engine.js"); require("../importer.js"); }
  const E = window.SchedEngine, I = window.SchedImport;

  // ---------------- tiny test runner (same as tests/engine.test.js) ----------------
  const tests = [];
  function test(name, fn) { tests.push({ name, fn }); }
  function assert(cond, msg) { if (!cond) throw new Error(msg || "assertion failed"); }
  function eq(actual, expected, msg) {
    if (actual !== expected) throw new Error((msg || "values differ") + " — expected " + expected + ", got " + actual);
  }
  function show(line) {
    if (inNode) console.log(line);
    else { const el = document.getElementById("out"); if (el) el.textContent += line + "\n"; else console.log(line); }
  }

  const S = E.buildTimeSlots(), id = (d, p) => S.find(t => t.day === d && t.period === p).id;

  // ====================================================================
  // 1. VALUE READERS
  // ====================================================================
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

  // ====================================================================
  // 2. READING A WORKBOOK (parseWorkbook)
  // ====================================================================
  // book({ Faculty: rows, ... }) puts each sheet's header row (from COLUMNS) in front of its rows.
  // A sheet given as null is left out; a sheet the template does not know is passed as it is.
  function book(sheets) {
    const out = {};
    Object.keys(sheets).forEach(name => {
      if (sheets[name] === null) return;
      out[name] = I.COLUMNS[name] ? [I.COLUMNS[name].map(c => c.header)].concat(sheets[name]) : sheets[name];
    });
    return out;
  }
  const cp = rows => rows.map(r => r.slice());
  const F = [["Maria Santos", "Programming; Databases", 21, "Full-time", "Instructor I", "Mon; Wed", "Sat"],
             ["Jose Reyes", "Accounting", 12, "Part-time", "", "", ""]];
  const SUB = [["IT101", "BSIT", "Intro to Computing", "BSIT-1A", 3, "Programming", "Laboratory", 35, 1, "1st", "2026-2027", "Major", "", "", ""],
               ["ACC101", "", "Financial Accounting", "BSA-1A", 3, "accounting", "Online", 40, 1, "1st", "", "", "Sat", 1, ""]];
  const R = [["Lab 101", 40]];
  const OPT = { schoolYear: "2030–2031" };

  test("a correct workbook becomes the app's data model", () => {
    const r = I.parseWorkbook(book({ Faculty: F, Subjects: SUB, Rooms: R }), OPT);
    assert(r.ok, r.errors.map(e => e.message).join("; ")); eq(JSON.stringify(r.counts), '{"faculty":2,"sections":2,"rooms":1}');
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
    ["'accounting'", "no preferred days", "school year", "category", "program"].forEach(w => assert(n.toLowerCase().includes(w.toLowerCase()), w + " — notes: " + n));
  });

  test("columns matched by name in any order; extra columns and sheets ignored with a note", () => {
    const sheets = book({ Faculty: F, Subjects: SUB, Rooms: null });
    sheets.Rooms = [["Remarks", "Capacity *", "room name"], ["new", 30, "Lab 201"]]; sheets.Old = [["x"]]; sheets.Instructions = [["read me"]];
    const r = I.parseWorkbook(sheets, OPT); assert(r.ok, r.errors.map(e => e.message).join("; ")); eq(r.data.rooms[0].name, "Lab 201");
    const n = r.notes.map(x => x.message).join(" | "); assert(/Remarks/.test(n) && /Old/.test(n) && !/Instructions/.test(n), n);
  });

  test("blank rows and EXAMPLE rows are skipped; row numbers match Excel", () => {
    const r = I.parseWorkbook(book({ Faculty: [["EXAMPLE Ana", "Programming", 21], [], F[0], ["Ben Cruz", "Programming", 0]], Subjects: SUB, Rooms: R }), OPT);
    assert(!r.ok); eq(r.data, null);
    const e = r.errors[0]; eq(e.sheet, "Faculty"); eq(e.row, 5); eq(e.column, "Max units");
    assert(r.notes.some(x => /1 example row/.test(x.message)), r.notes.map(x => x.message).join(" | "));
  });

  test("numbers typed as text and codes that look like numbers", () => {
    const s = cp(SUB); s[0][0] = 101; s[0][4] = "3"; s[0][7] = "35 "; const f = cp(F); f[0][2] = 21.0;
    const r = I.parseWorkbook(book({ Faculty: f, Subjects: s, Rooms: R }), OPT); assert(r.ok, r.errors.map(e => e.message).join("; "));
    eq(r.data.sections[0].subjectCode, "101"); eq(r.data.sections[0].units, 3); eq(r.data.sections[0].enrolledStudents, 35); eq(r.data.faculty[0].maxUnits, 21);
  });

  test("formula-looking text stays plain text", () => {
    const f = cp(F); f[1][0] = '=HYPERLINK("x","y")';
    eq(I.parseWorkbook(book({ Faculty: f, Subjects: SUB, Rooms: R }), OPT).data.faculty[1].name, '=HYPERLINK("x","y")');
  });

  test("every error kind blocks and points to sheet, row and column", () => {
    const withF = change => { const f = cp(F); change(f); return book({ Faculty: f, Subjects: SUB, Rooms: R }); };
    const withS = change => { const s = cp(SUB); change(s); return book({ Faculty: F, Subjects: s, Rooms: R }); };
    const cases = [
      ["missing Subjects sheet", () => book({ Faculty: F, Subjects: null, Rooms: R }), ["Subjects", null, null]],
      ["missing required column", () => { const b = book({ Faculty: F, Subjects: SUB, Rooms: null }); b.Rooms = [["Room name *"], ["Lab 101"]]; return b; }, ["Rooms", 1, "Capacity"]],
      ["Faculty has no data rows", () => book({ Faculty: [], Subjects: SUB, Rooms: R }), ["Faculty", null, null]],
      ["required cell empty", () => withS(s => { s[0][4] = ""; }), ["Subjects", 2, "Units"]],
      ["out of range", () => withS(s => { s[0][7] = 301; }), ["Subjects", 2, "Students"]],
      ["not whole", () => withS(s => { s[0][4] = 2.5; }), ["Subjects", 2, "Units"]],
      ["value not allowed", () => withS(s => { s[0][6] = "Lecture"; }), ["Subjects", 2, "Class type"]],
      ["bad preferred days", () => withF(f => { f[0][5] = "Mon; Sun"; }), ["Faculty", 2, "Preferred days"]],
      ["bad not available", () => withF(f => { f[0][6] = "Mon P9"; }), ["Faculty", 2, "Not available"]],
      ["bad employment status", () => withF(f => { f[0][3] = "Volunteer"; }), ["Faculty", 2, "Employment status"]],
      ["duplicate teacher", () => withF(f => { f[1][0] = "MARIA  santos"; }), ["Faculty", 3, "Name"], /row 2/],
      ["duplicate subject+section", () => withS(s => { s[1] = s[0].slice(); }), ["Subjects", 3, "Section"]],
      ["duplicate room", () => book({ Faculty: F, Subjects: SUB, Rooms: [["Lab 101", 40], ["lab 101", 30]] }), ["Rooms", 3, "Room name"]],
      ["only one fixed field", () => withS(s => { s[1][13] = ""; }), ["Subjects", 3, "Fixed period"]],
      ["text too long", () => withF(f => { f[0][0] = "x".repeat(121); }), ["Faculty", 2, "Name"]],
      ["too many rows", () => book({ Faculty: F, Subjects: SUB, Rooms: Array.from({ length: 2001 }, (_, i) => ["Lab " + i, 30]) }), ["Rooms", null, null]],
      ["no program and no -", () => withS(s => { s[1][1] = ""; s[1][3] = "BSA1A"; }), ["Subjects", 3, "Program"]],
    ];
    cases.forEach(([name, make, [sheet, row, column], message]) => {
      const r = I.parseWorkbook(make(), OPT);
      assert(!r.ok && r.data === null, name + ": should be refused");
      const e = r.errors[0];
      eq(JSON.stringify([e.sheet, e.row, e.column]), JSON.stringify([sheet, row, column]), name + " (" + e.message + ")");
      if (message) assert(message.test(e.message), name + ": " + e.message);
    });
  });

  // ---------------- run everything ----------------
  show("\nImporter tests");
  const t0 = Date.now();
  let passed = 0, failed = 0;
  tests.forEach(t => {
    const s = Date.now();
    try { t.fn(); passed++; show("  ok   " + t.name + "  (" + (Date.now() - s) + " ms)"); }
    catch (e) { failed++; show("  FAIL " + t.name + "\n         " + e.message); }
  });
  show("\n" + passed + " passed, " + failed + " failed  (" + ((Date.now() - t0) / 1000).toFixed(1) + " s)");
  window.__importerTestResult = { passed, failed };
  if (inNode) process.exit(failed ? 1 : 0);
})();
