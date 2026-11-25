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
