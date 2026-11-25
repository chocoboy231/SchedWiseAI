/* =====================================================================
   SchedWiseAI — SCHOOL DATA IMPORTER  (importer.js)
   ---------------------------------------------------------------------
   Turns a school's filled-in Excel template into the app's teachers,
   subjects and rooms, and checks every row first. It has no user
   interface and uses no library: app.jsx reads the .xlsx file (with the
   spreadsheet library) into plain rows, and this file does the rest, so
   it can be tested like engine.js (see tests/importer.test.js).

   THE WORKBOOK
     Sheets "Faculty", "Subjects" and "Rooms" (plus "Instructions", which
     is ignored). Row 1 of each sheet holds the column headers; columns
     are found by header NAME, so their order does not matter. A "*" in a
     header marks a required column and is ignored when matching.

   Everything is exposed as window.SchedImport (see the bottom).
   It needs engine.js (window.SchedEngine) to be loaded first.
   ===================================================================== */
(function () {
  const E = window.SchedEngine;

  // ---------------------------------------------------------------------
  // THE TEMPLATE'S SHEETS AND COLUMNS
  // ---------------------------------------------------------------------
  const SHEETS = ["Faculty", "Subjects", "Rooms"];
  const LIMITS = { maxFileBytes: 5 * 1024 * 1024, maxRows: 2000, maxText: 120 };
  const column = (header, key) => ({ key, header, required: header.endsWith("*") });
  const COLUMNS = {
    Faculty: [
      column("Name *", "name"), column("Subject areas *", "subjectAreas"), column("Max units *", "maxUnits"),
      column("Employment status", "employmentStatus"), column("Academic rank", "academicRank"),
      column("Preferred days", "preferredDays"), column("Not available", "notAvailable"),
    ],
    Subjects: [
      column("Subject code *", "code"), column("Program", "program"), column("Subject name", "name"), column("Section *", "section"),
      column("Units *", "units"), column("Subject area *", "subjectArea"), column("Class type *", "classType"),
      column("Students *", "students"), column("Year level *", "yearLevel"), column("Semester *", "semester"),
      column("School year", "schoolYear"), column("Category", "category"), column("Fixed day", "fixedDay"),
      column("Fixed period", "fixedPeriod"), column("Prerequisite", "prerequisite"),
    ],
    Rooms: [column("Room name *", "name"), column("Capacity *", "capacity")],
  };

  // ---------------------------------------------------------------------
  // VALUE READERS
  // Each returns { value } (or { days } / { ids }) when the cell is fine,
  // or { error } with a plain-language sentence saying what to write.
  // ---------------------------------------------------------------------

  // canonical("  Max   Units * ") -> "max units": used to compare names, headers and choices.
  function canonical(text) {
    return String(text == null ? "" : text).replace(/\*/g, "").replace(/\s+/g, " ").trim().toLowerCase();
  }

  // A whole number from min to max, typed as a number (35, 35.0) or as text (" 35 ").
  function parseWholeNumber(value, min, max) {
    const fail = { error: "Use a whole number from " + min + " to " + max + "." };
    let n;
    if (typeof value === "number") n = value;
    else {
      const s = String(value == null ? "" : value).trim();
      if (!/^-?\d+(\.0+)?$/.test(s)) return fail;
      n = Number(s);
    }
    return Number.isInteger(n) && n >= min && n <= max ? { value: n } : fail;
  }

  // "mon" / "monday" -> "Mon" (Monday to Saturday only; classes are never on Sunday).
  const DAY_BY_NAME = {};
  const FULL_DAY_NAMES = { Mon: "monday", Tue: "tuesday", Wed: "wednesday", Thu: "thursday", Fri: "friday", Sat: "saturday" };
  E.DAYS.forEach(d => { DAY_BY_NAME[d.toLowerCase()] = d; DAY_BY_NAME[FULL_DAY_NAMES[d]] = d; });
  function dayError(word) {
    return /^sun(day)?$/.test(word) ? "Classes are not held on Sunday. Use Mon to Sat."
      : "'" + word + "' is not a day. Use Mon to Sat (or Monday to Saturday).";
  }
  const splitList = text => String(text == null ? "" : text).split(/[;,]/).map(s => canonical(s)).filter(Boolean);

  // "fri; Monday ;WED" -> ["Mon", "Wed", "Fri"] (Monday-to-Saturday order, no repeats).
  function parseDayList(text) {
    const found = new Set();
    for (const word of splitList(text)) {
      if (!DAY_BY_NAME[word]) return { error: dayError(word) };
      found.add(DAY_BY_NAME[word]);
    }
    return { days: E.DAYS.filter(d => found.has(d)) };
  }

  // Time-slot ids by day and period, from the engine's slot list.
  const SLOTS = E.buildTimeSlots();
  const slotId = (day, period) => SLOTS.find(t => t.day === day && t.period === period).id;
  const SLOT_ENTRY = /^([a-z]+)(?:\s*p\s*([1-6])(?:\s*-\s*p?\s*([1-6]))?)?$/;

  // "Sat; Mon P1; Fri P4-P6" -> the slot ids of all of Saturday, Monday period 1, and Friday periods 4 to 6.
  function parseSlotList(text) {
    const ids = new Set();
    for (const entry of splitList(text)) {
      const m = entry.match(SLOT_ENTRY);
      const day = m && DAY_BY_NAME[m[1]];
      if (!m || !day) {
        if (m && /^sun(day)?$/.test(m[1])) return { error: dayError(m[1]) };
        return { error: "'" + entry + "' is not understood. Write a whole day (Sat), one period (Mon P1) or a range (Fri P4-P6), with periods 1 to " + E.PERIODS + "." };
      }
      const from = m[2] ? Number(m[2]) : 1, to = m[3] ? Number(m[3]) : (m[2] ? from : E.PERIODS);
      if (to < from) return { error: "'" + entry + "': the range must go from the earlier period to the later one." };
      for (let p = from; p <= to; p++) ids.add(slotId(day, p));
    }
    return { ids: Array.from(ids).sort((a, b) => a - b) };
  }

  // The inverse of parseSlotList: ids -> "Mon P1-P2; Fri P4-P6", a full day as "Sat".
  function formatSlotList(ids) {
    const byDay = {};
    (ids || []).forEach(sid => { const t = SLOTS.find(s => s.id === sid); if (t) (byDay[t.day] = byDay[t.day] || []).push(t.period); });
    const parts = [];
    E.DAYS.forEach(day => {
      const ps = Array.from(new Set(byDay[day] || [])).sort((a, b) => a - b);
      if (!ps.length) return;
      if (ps.length === E.PERIODS) { parts.push(day); return; }
      for (let i = 0; i < ps.length; i++) {
        let j = i;
        while (j + 1 < ps.length && ps[j + 1] === ps[j] + 1) j++;
        parts.push(day + " P" + ps[i] + (j > i ? "-P" + ps[j] : ""));
        i = j;
      }
    });
    return parts.join("; ");
  }

  // 2, "2", "2nd", "2nd Year", "Year 2" -> 2 (1 to 4).
  function parseYearLevel(value) {
    const s = canonical(value);
    const m = s.match(/^([1-4])(?:st|nd|rd|th)?(?: year)?$/) || s.match(/^year ([1-4])$/);
    return m ? { value: Number(m[1]) } : { error: "Use a year level from 1 to 4." };
  }

  // 1, "1st", "First", "2nd semester", "Second Semester" -> "1st Semester" / "2nd Semester".
  function parseSemester(value) {
    const s = canonical(value).replace(/ sem(ester)?$/, "");
    if (["1", "1st", "first"].includes(s)) return { value: "1st Semester" };
    if (["2", "2nd", "second"].includes(s)) return { value: "2nd Semester" };
    return { error: "Use 1st or 2nd semester." };
  }

  // "2026-2027", "2026 – 2027" -> "2026–2027" (the app writes school years with an en dash).
  function parseSchoolYear(value) {
    const m = String(value == null ? "" : value).trim().match(/^(\d{4})\s*[-–—]\s*(\d{4})$/);
    if (!m || Number(m[2]) !== Number(m[1]) + 1) return { error: "Use a school year like 2026-2027." };
    return { value: m[1] + "–" + m[2] };
  }

  // ---------------------------------------------------------------------
  // PUBLIC API
  // ---------------------------------------------------------------------
  window.SchedImport = {
    SHEETS, LIMITS, COLUMNS,
    canonical, parseWholeNumber, parseDayList, parseSlotList, formatSlotList,
    parseYearLevel, parseSemester, parseSchoolYear,
  };
})();
