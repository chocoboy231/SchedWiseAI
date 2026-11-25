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
  // parseWorkbook(sheets, options) — the whole check, and the app's data model
  //   sheets: { "Faculty": rows, "Subjects": rows, ... } where rows[0] is Excel
  //           row 1 (the headers) and rows[i] is Excel row i + 1.
  //   options.schoolYear: used when a subject's School year is blank
  //           (default: the current school year).
  // Returns { ok, data, counts, errors, warnings, notes }. Each problem is
  // { sheet, row, column, message }, with the row number Excel shows.
  // data is null whenever there is an error: an upload is all or nothing.
  // ---------------------------------------------------------------------
  const isBlank = v => v == null || (typeof v === "string" && v.trim() === "");
  const cellText = v => (v == null ? "" : String(v).replace(/\s+/g, " ").trim());   // 101 -> "101"
  const label = c => c.header.replace(/\s*\*\s*$/, "");                               // "Max units *" -> "Max units"
  const plural = (n, one, many) => n + " " + (n === 1 ? one : many);
  const EMPLOYMENT = { fulltime: "Full-time", parttime: "Part-time", contractual: "Contractual" };

  function parseWorkbook(sheets, options) {
    const defaultSchoolYear = (options && options.schoolYear) || E.currentSchoolYear();
    const errors = [], warnings = [], notes = [];
    const add = (list, sheet, row, column, message) => list.push({ sheet, row, column, message });

    // 1. Find the three sheets by name; others are ignored (Instructions silently).
    const found = {};
    Object.keys(sheets || {}).forEach(name => {
      const known = SHEETS.find(s => canonical(s) === canonical(name));
      if (known) { if (!found[known]) found[known] = sheets[name] || []; }
      else if (canonical(name) !== "instructions") add(notes, null, null, null, "The sheet '" + name + "' is not used, so it was ignored.");
    });
    ["Faculty", "Subjects"].forEach(s => { if (!found[s]) add(errors, s, null, null, "The workbook has no '" + s + "' sheet. Use the template from Settings."); });

    // 2. For each sheet: match the header row, check the size, skip blank and EXAMPLE rows.
    const tables = {};      // sheet -> [{ row, get(key) }], or null when the sheet cannot be read
    SHEETS.forEach(sheet => {
      const rows = found[sheet];
      if (!rows) { tables[sheet] = sheet === "Rooms" ? [] : null; return; }
      const index = {};
      (rows[0] || []).forEach((h, i) => {
        if (isBlank(h)) return;
        const col = COLUMNS[sheet].find(c => canonical(c.header) === canonical(h));
        if (!col) add(notes, sheet, 1, cellText(h), "The column '" + cellText(h) + "' is not used, so it was ignored.");
        else if (index[col.key] === undefined) index[col.key] = i;
      });
      const dataRows = [];
      for (let i = 1; i < rows.length; i++) {
        const cells = rows[i] || [];
        if (!cells.every(isBlank)) dataRows.push({ row: i + 1, cells });
      }
      if (dataRows.length > LIMITS.maxRows) {
        add(errors, sheet, null, null, "The " + sheet + " sheet has " + dataRows.length + " rows. At most " + LIMITS.maxRows + " are allowed.");
        tables[sheet] = null; return;
      }
      const missing = COLUMNS[sheet].filter(c => c.required && index[c.key] === undefined);
      missing.forEach(c => add(errors, sheet, 1, label(c), "The required column '" + label(c) + "' is missing from row 1."));
      if (missing.length) { tables[sheet] = null; return; }
      const idKey = COLUMNS[sheet][0].key;                       // Name, Subject code, Room name
      const kept = dataRows.filter(d => !/^example/i.test(cellText(d.cells[index[idKey]])));
      const examples = dataRows.length - kept.length;
      if (examples) add(notes, sheet, null, null, plural(examples, "example row", "example rows") + " skipped.");
      tables[sheet] = kept.map(d => ({ row: d.row, get: key => (index[key] === undefined ? null : d.cells[index[key]]) }));
    });
    if (tables.Faculty && !tables.Faculty.length) add(errors, "Faculty", null, null, "The Faculty sheet has no teachers (EXAMPLE rows are skipped).");
    if (tables.Subjects && !tables.Subjects.length) add(errors, "Subjects", null, null, "The Subjects sheet has no subjects (EXAMPLE rows are skipped).");

    // Helpers for reading one cell of one row; each records its own error.
    function reader(sheet, r) {
      const col = key => label(COLUMNS[sheet].find(c => c.key === key));
      const fail = (key, message) => { add(errors, sheet, r.row, col(key), message); return undefined; };
      return {
        fail,
        text(key, required) {
          const v = cellText(r.get(key));
          if (!v) return required ? fail(key, "This cell is required.") : "";
          if (v.length > LIMITS.maxText) return fail(key, "This text is longer than " + LIMITS.maxText + " characters.");
          return v;
        },
        number(key, min, max) {
          if (isBlank(r.get(key))) return fail(key, "This cell is required.");
          const p = parseWholeNumber(r.get(key), min, max);
          return p.error ? fail(key, p.error) : p.value;
        },
        parsed(key, parse, required) {
          if (isBlank(r.get(key))) return required ? fail(key, "This cell is required.") : null;
          const p = parse(r.get(key));
          return p.error ? fail(key, p.error) : p;
        },
      };
    }

    // Subject areas keep the spelling of their first appearance (Faculty first, then Subjects).
    const areaSpelling = {};
    function area(sheet, row, column, written) {
      const key = canonical(written);
      if (!areaSpelling[key]) areaSpelling[key] = written;
      else if (areaSpelling[key] !== written) add(notes, sheet, row, column, "Subject area '" + written + "' was treated as '" + areaSpelling[key] + "', its first spelling.");
      return areaSpelling[key];
    }
    const counts = { faculty: 0, sections: 0, rooms: 0 };
    const defaults = { preferredDays: 0, employment: 0, schoolYear: 0, category: 0, program: 0 };

    // 3. Faculty
    const faculty = [], teacherRow = {}, facultyRows = [];
    (tables.Faculty || []).forEach(r => {
      counts.faculty++;
      facultyRows.push(r.row);
      const x = reader("Faculty", r);
      const name = x.text("name", true);
      if (name !== undefined && name) {
        const key = canonical(name);
        if (teacherRow[key]) x.fail("name", "Another teacher on row " + teacherRow[key] + " has the same name. Names must be different, because faculty sign in by name.");
        else teacherRow[key] = r.row;
      }
      const areasText = x.text("subjectAreas", true);
      const areas = [];
      if (areasText) {
        areasText.split(";").map(a => a.trim()).filter(Boolean).forEach(a => {
          const spelled = area("Faculty", r.row, "Subject areas", a);
          if (!areas.includes(spelled)) areas.push(spelled);
        });
        if (!areas.length) x.fail("subjectAreas", "This cell is required.");
      }
      const maxUnits = x.number("maxUnits", 1, 40);
      let employmentStatus = "Full-time";
      const status = cellText(r.get("employmentStatus"));
      if (!status) defaults.employment++;
      else if (EMPLOYMENT[canonical(status).replace(/[\s-]/g, "")]) employmentStatus = EMPLOYMENT[canonical(status).replace(/[\s-]/g, "")];
      else x.fail("employmentStatus", "Use Full-time, Part-time or Contractual.");
      const academicRank = x.text("academicRank", false);
      const days = x.parsed("preferredDays", parseDayList, false);
      if (days === null || (days && !days.days.length)) defaults.preferredDays++;
      const away = x.parsed("notAvailable", parseSlotList, false);
      faculty.push({
        id: faculty.length, name, specializations: areas, maxUnits,
        preferredDays: days && days.days.length ? days.days : E.DAYS.slice(),
        unavailableSlotIds: away ? away.ids : [], preferredSlotIds: [], employmentStatus, academicRank,
      });
    });

    // 4. Subjects
    const sections = [], offeredRow = {}, subjectRows = [];
    (tables.Subjects || []).forEach(r => {
      counts.sections++;
      subjectRows.push(r.row);
      const x = reader("Subjects", r);
      const subjectCode = x.text("code", true);
      const sectionName = x.text("section", true);
      if (subjectCode && sectionName) {
        const key = canonical(subjectCode) + "|" + canonical(sectionName);
        if (offeredRow[key]) x.fail("section", subjectCode + " is already offered to section " + sectionName + " on row " + offeredRow[key] + ".");
        else offeredRow[key] = r.row;
      }
      let program = x.text("program", false);
      if (program === "" && sectionName) {
        const prefix = sectionName.includes("-") ? sectionName.split("-")[0].trim() : "";
        if (prefix) { program = prefix; defaults.program++; }
        else x.fail("program", "Enter the program, or write the section as PROGRAM-SECTION (for example BSIT-2A).");
      }
      const subjectName = x.text("name", false);
      const units = x.number("units", 1, 10);
      const areaText = x.text("subjectArea", true);
      const requiredSpecialization = areaText ? area("Subjects", r.row, "Subject area", areaText) : areaText;
      let roomTypeRequired;
      const type = canonical(r.get("classType"));
      if (!type) x.fail("classType", "This cell is required.");
      else if (type === "online" || type === "laboratory") roomTypeRequired = type;
      else x.fail("classType", "Use Online or Laboratory.");
      const enrolledStudents = x.number("students", 1, 300);
      const year = x.parsed("yearLevel", parseYearLevel, true);
      const semester = x.parsed("semester", parseSemester, true);
      let schoolYear = defaultSchoolYear;
      const sy = x.parsed("schoolYear", parseSchoolYear, false);
      if (sy === null) defaults.schoolYear++; else if (sy) schoolYear = sy.value;
      let category = "Major";
      const cat = canonical(r.get("category"));
      if (!cat) defaults.category++;
      else if (cat === "major" || cat === "minor") category = cat === "major" ? "Major" : "Minor";
      else x.fail("category", "Use Major or Minor.");
      let fixedSlotId = null;
      const dayBlank = isBlank(r.get("fixedDay")), periodBlank = isBlank(r.get("fixedPeriod"));
      if (dayBlank !== periodBlank) x.fail(dayBlank ? "fixedDay" : "fixedPeriod", "Give both Fixed day and Fixed period, or leave both empty.");
      else if (!dayBlank) {
        const day = DAY_BY_NAME[canonical(r.get("fixedDay"))];
        const period = parseWholeNumber(r.get("fixedPeriod"), 1, E.PERIODS);
        if (!day) x.fail("fixedDay", dayError(canonical(r.get("fixedDay"))));
        else if (period.error) x.fail("fixedPeriod", period.error);
        else fixedSlotId = slotId(day, period.value);
      }
      const prerequisite = x.text("prerequisite", false);
      sections.push({
        id: sections.length, subjectCode, subjectName, sectionName, program, units, requiredSpecialization, roomTypeRequired,
        enrolledStudents, yearLevel: year && year.value, semester: semester && semester.value, schoolYear, category,
        fixedSlotId, prerequisiteCode: prerequisite || null,
      });
    });

    // 5. Rooms (all laboratories; online classes need none)
    const rooms = [], roomRow = {};
    (tables.Rooms || []).forEach(r => {
      counts.rooms++;
      const x = reader("Rooms", r);
      const name = x.text("name", true);
      if (name) {
        const key = canonical(name);
        if (roomRow[key]) x.fail("name", "Another room on row " + roomRow[key] + " has the same name.");
        else roomRow[key] = r.row;
      }
      rooms.push({ id: rooms.length, name, type: "laboratory", capacity: x.number("capacity", 1, 300) });
    });

    // 6. One note per kind of default used, so nothing changes silently.
    if (defaults.preferredDays) add(notes, "Faculty", null, null, plural(defaults.preferredDays, "teacher has", "teachers have") + " no preferred days: all days used.");
    if (defaults.employment) add(notes, "Faculty", null, null, plural(defaults.employment, "teacher has", "teachers have") + " no employment status: Full-time used.");
    if (defaults.program) add(notes, "Subjects", null, null, plural(defaults.program, "subject has", "subjects have") + " no program: it was taken from the section name (BSIT-2A → BSIT).");
    if (defaults.schoolYear) add(notes, "Subjects", null, null, plural(defaults.schoolYear, "subject has", "subjects have") + " no school year: " + defaultSchoolYear + " used.");
    if (defaults.category) add(notes, "Subjects", null, null, plural(defaults.category, "subject has", "subjects have") + " no category: Major used.");

    const ok = errors.length === 0;
    if (ok) addWarnings(faculty, sections, rooms, facultyRows, subjectRows, (sheet, row, column, message) => add(warnings, sheet, row, column, message));
    return { ok, data: ok ? { faculty, sections, rooms } : null, counts, errors, warnings, notes };
  }

  // Warnings: things that will not stop the upload but will show up in the schedule.
  function addWarnings(faculty, sections, rooms, facultyRows, subjectRows, warn) {
    const teachersByArea = {};
    faculty.forEach(f => f.specializations.forEach(a => (teachersByArea[a] = teachersByArea[a] || []).push(f)));
    const neededAreas = new Set(sections.map(s => s.requiredSpecialization));
    const codes = new Set(sections.map(s => canonical(s.subjectCode)));
    const largestLab = rooms.reduce((m, r) => Math.max(m, r.capacity), 0);
    const name = s => s.subjectCode + " (" + s.sectionName + ")";
    sections.forEach((s, i) => {
      const row = subjectRows[i], teachers = teachersByArea[s.requiredSpecialization] || [];
      if (!teachers.length)
        warn("Subjects", row, "Subject area", "No teacher has the subject area '" + s.requiredSpecialization + "', so " + name(s) + " will show as Cannot be scheduled.");
      if (s.roomTypeRequired === "laboratory" && rooms.length && s.enrolledStudents > largestLab)
        warn("Subjects", row, "Students", name(s) + " has " + s.enrolledStudents + " students, but the largest lab seats " + largestLab + ", so it will show as Cannot be scheduled.");
      if (s.prerequisiteCode && !codes.has(canonical(s.prerequisiteCode)))
        warn("Subjects", row, "Prerequisite", "The prerequisite '" + s.prerequisiteCode + "' is not a subject code in the Subjects sheet.");
      if (s.fixedSlotId != null && teachers.length && teachers.every(f => f.unavailableSlotIds.includes(s.fixedSlotId)))
        warn("Subjects", row, "Fixed day", "Every teacher with the subject area '" + s.requiredSpecialization + "' is not available at the fixed time of " + name(s) + ".");
    });
    const labs = sections.filter(s => s.roomTypeRequired === "laboratory").length;
    if (labs && !rooms.length)
      warn(null, null, null, plural(labs, "laboratory subject needs", "laboratory subjects need") + " a room, but there are no rooms, so they will show as Cannot be scheduled.");
    const units = sections.reduce((t, s) => t + s.units, 0), capacity = faculty.reduce((t, f) => t + f.maxUnits, 0);
    if (units > capacity)
      warn(null, null, null, "The subjects add up to " + units + " units, but the teachers' maximum units add up to " + capacity + ", so some teachers will be overloaded.");
    faculty.forEach((f, i) => {
      if (!f.specializations.some(a => neededAreas.has(a)))
        warn("Faculty", facultyRows[i], "Subject areas", f.name + " has no subject to teach: no subject needs " + f.specializations.join("; ") + ".");
    });
  }

  // ---------------------------------------------------------------------
  // PUBLIC API
  // ---------------------------------------------------------------------
  window.SchedImport = {
    SHEETS, LIMITS, COLUMNS,
    canonical, parseWholeNumber, parseDayList, parseSlotList, formatSlotList,
    parseYearLevel, parseSemester, parseSchoolYear,
    parseWorkbook,
  };
})();
