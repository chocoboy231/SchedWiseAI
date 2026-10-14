/* =====================================================================
   SchedWiseAI — engine tests  (tests/engine.test.js)
   ---------------------------------------------------------------------
   Tests for engine.js (the scheduling engine). No libraries are needed.

   RUN WITH NODE (from the repository folder):
       node tests/engine.test.js
   RUN IN A BROWSER (no Node needed): serve the folder, then open
       tests/run.html

   The Genetic Algorithm uses random numbers, so the schedule tests check
   PROPERTIES of the result (no rule is broken, nothing moves that did not
   have to) rather than one exact timetable. A second, independent rule
   checker (`brokenRules`, below) is used on engine output, so the engine
   is not only graded by its own countViolations().
   ===================================================================== */
(function () {
  const inNode = typeof module !== "undefined" && module.exports;
  if (inNode) { global.window = global; require("../engine.js"); }   // engine.js sets window.SchedEngine
  const E = window.SchedEngine;

  // ---------------- tiny test runner ----------------
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

  // ---------------- small hand-made data ----------------
  const SLOTS = E.buildTimeSlots();
  function sec(over) {
    return Object.assign({ requiredSpecialization: "Programming", roomTypeRequired: "laboratory", enrolledStudents: 30, units: 3,
      fixedSlotId: null, yearLevel: 1, semester: "1st Semester", program: "BSIT" }, over || {});
  }
  function mini() {
    return {
      faculty: [
        { id: 0, name: "A", specializations: ["Programming"], maxUnits: 6, unavailableSlotIds: [], preferredDays: [] },
        { id: 1, name: "B", specializations: ["Networking"], maxUnits: 6, unavailableSlotIds: [], preferredDays: [] },
      ],
      rooms: [{ id: 0, name: "Lab 1", type: "laboratory", capacity: 40 }, { id: 1, name: "Lab 2", type: "laboratory", capacity: 20 }],
      sections: [sec(), sec({ requiredSpecialization: "Networking" }), sec({ roomTypeRequired: "online" })],
    };
  }
  function count(d, genes) { return E.countViolations(d.faculty, d.rooms, d.sections, SLOTS, genes); }
  // Clean schedule for mini(): three different times, so nothing clashes.
  const CLEAN = [{ facultyId: 0, roomId: 0, slotId: 0 }, { facultyId: 1, roomId: 0, slotId: 1 }, { facultyId: 0, roomId: E.ONLINE_ROOM_ID, slotId: 2 }];
  const clone = g => g.map(x => Object.assign({}, x));

  // Independent rule checker: returns a list of strings, one per broken rule.
  function brokenRules(d, genes) {
    const out = [], fb = {}, rb = {};
    const fById = Object.fromEntries(d.faculty.map(f => [f.id, f])), rById = Object.fromEntries(d.rooms.map(r => [r.id, r]));
    genes.forEach((g, i) => {
      const s = d.sections[i], f = fById[g.facultyId];
      if (g.facultyId === -1 || g.roomId === -1 || g.slotId === -1) return;          // manually removed
      if (!f || !f.specializations.includes(s.requiredSpecialization)) out.push("unqualified " + i);
      if (f && (f.unavailableSlotIds || []).includes(g.slotId)) out.push("unavailable " + i);
      if (s.fixedSlotId != null && g.slotId !== s.fixedSlotId) out.push("fixed " + i);
      if (s.roomTypeRequired === "online") { if (g.roomId !== E.ONLINE_ROOM_ID) out.push("online-room " + i); }
      else {
        const r = rById[g.roomId];
        if (!r || r.type !== s.roomTypeRequired) out.push("room-type " + i);
        else if (r.capacity < s.enrolledStudents) out.push("capacity " + i);
        const rk = g.roomId + "@" + g.slotId; if (rb[rk]) out.push("room-clash " + i); rb[rk] = true;
      }
      const fk = g.facultyId + "@" + g.slotId; if (fb[fk]) out.push("teacher-clash " + i); fb[fk] = true;
    });
    return out;
  }
  // Same-program, same-year, same-semester classes sharing a time slot (curriculum overlap).
  function overlaps(sections, genes) {
    const seen = {}; let n = 0;
    genes.forEach((g, i) => {
      if (g.slotId === -1) return;
      const k = [sections[i].program, sections[i].yearLevel, sections[i].semester, g.slotId].join("|");
      if (seen[k]) n++; seen[k] = true;
    });
    return n;
  }
  const GA = { generations: 60, popSize: 30 };

  // ====================================================================
  // 1. TIME SLOTS AND LOOKUPS
  // ====================================================================
  test("buildTimeSlots: 6 days x 6 periods, ids 0..35, no Sunday", () => {
    eq(SLOTS.length, 36);
    SLOTS.forEach((s, i) => eq(s.id, i, "slot id order"));
    assert(SLOTS.every(s => E.DAYS.includes(s.day)) && !SLOTS.some(s => s.day === "Sun"), "unexpected day");
    eq(SLOTS[0].label, "Mon 07:00-08:30");
    eq(SLOTS[5].label, "Mon 14:30-16:00", "period 6 should end at 16:00");
    eq(SLOTS[30].day, "Sat", "Saturday follows Friday");
  });

  test("qualifiedFaculty returns only teachers with the required specialization", () => {
    const d = mini();
    assert(JSON.stringify(E.qualifiedFaculty(d.faculty, d.sections[0])) === "[0]");
    assert(JSON.stringify(E.qualifiedFaculty(d.faculty, d.sections[1])) === "[1]");
    eq(E.qualifiedFaculty(d.faculty, sec({ requiredSpecialization: "AI/ML" })).length, 0);
  });

  test("validRooms: online classes use no room; labs must be big enough", () => {
    const d = mini();
    assert(JSON.stringify(E.validRooms(d.rooms, d.sections[2])) === JSON.stringify([E.ONLINE_ROOM_ID]));
    assert(JSON.stringify(E.validRooms(d.rooms, sec({ enrolledStudents: 30 }))) === "[0]", "30 students fit only the 40-seat lab");
    assert(JSON.stringify(E.validRooms(d.rooms, sec({ enrolledStudents: 15 }))) === "[0,1]");
    eq(E.validRooms(d.rooms, sec({ enrolledStudents: 99 })).length, 0);
  });

  // ====================================================================
  // 2. RULE CHECKER (countViolations / findConflictingIndices)
  // ====================================================================
  test("countViolations: a clean schedule has no violations", () => {
    const v = count(mini(), CLEAN);
    eq(v.total, 0); eq(v.overload, 0); eq(v.unscheduled, 0);
  });

  test("countViolations: teacher double-booking (3 classes in one slot = 2 conflicts)", () => {
    const d = mini(); d.sections = [sec({ roomTypeRequired: "online" }), sec({ roomTypeRequired: "online" }), sec({ roomTypeRequired: "online" })];
    const same = [0, 1, 2].map(() => ({ facultyId: 0, roomId: E.ONLINE_ROOM_ID, slotId: 4 }));   // one teacher, one time, three classes
    eq(count(d, same).facultyConflicts, 2);
    const two = same.slice(); two[2] = { facultyId: 0, roomId: E.ONLINE_ROOM_ID, slotId: 5 };
    eq(count(d, two).facultyConflicts, 1);
  });

  test("countViolations: room double-booking, but online classes may share a time", () => {
    const d = mini();
    const clash = clone(CLEAN); clash[1] = { facultyId: 1, roomId: 0, slotId: 0 };          // same lab, same slot as class 0
    eq(count(d, clash).roomConflicts, 1);
    const d2 = { faculty: d.faculty, rooms: d.rooms, sections: [sec({ roomTypeRequired: "online" }), sec({ roomTypeRequired: "online" })] };
    const online = [{ facultyId: 0, roomId: E.ONLINE_ROOM_ID, slotId: 3 }, { facultyId: 0, roomId: E.ONLINE_ROOM_ID, slotId: 4 }];
    eq(count(d2, online).roomConflicts, 0, "two online classes must not count as a room clash");
  });

  test("countViolations: unqualified teacher", () => {
    const g = clone(CLEAN); g[0].facultyId = 1;
    eq(count(mini(), g).unqualified, 1);
  });

  test("countViolations: teacher unavailable", () => {
    const d = mini(); d.faculty[0].unavailableSlotIds = [0];
    eq(count(d, CLEAN).unavailable, 1);
  });

  test("countViolations: room type mismatch (online class given a lab)", () => {
    const g = clone(CLEAN); g[2].roomId = 0;
    eq(count(mini(), g).roomTypeMismatch, 1);
  });

  test("countViolations: room capacity", () => {
    const g = clone(CLEAN); g[0].roomId = 1;                                               // 30 students in a 20-seat lab
    eq(count(mini(), g).capacityViol, 1);
  });

  test("countViolations: fixed time not respected", () => {
    const d = mini(); d.sections[0].fixedSlotId = 7;
    eq(count(d, CLEAN).fixedSlot, 1);
    const ok = clone(CLEAN); ok[0].slotId = 7;
    eq(count(d, ok).fixedSlot, 0);
  });

  test("countViolations: a manually removed class is 'unscheduled', not a conflict", () => {
    const g = clone(CLEAN); g[1] = { facultyId: -1, roomId: -1, slotId: -1 };
    const v = count(mini(), g);
    eq(v.unscheduled, 1); eq(v.total, 0);
  });

  test("countViolations: overload is reported but not added to total", () => {
    const d = mini(); d.faculty[0].maxUnits = 3;                                           // teacher 0 has 6 units
    const v = count(d, CLEAN);
    eq(v.overload, 3); eq(v.total, 0);
  });

  test("countViolations follows edits to faculty (the app recounts live)", () => {
    const d = mini();
    eq(count(d, CLEAN).total, 0);
    d.faculty[0] = Object.assign({}, d.faculty[0], { specializations: ["AI/ML"] });         // teacher 0 loses Programming
    eq(count(d, CLEAN).unqualified, 2, "both of teacher 0's classes are now unqualified");
    d.rooms = d.rooms.map(r => Object.assign({}, r, { capacity: 10 }));
    eq(count(d, CLEAN).capacityViol, 2, "both 30-student lab classes no longer fit a 10-seat lab");
  });

  test("findConflictingIndices: a double-booking marks only the later class", () => {
    const d = mini();
    const g = clone(CLEAN); g[1] = { facultyId: 1, roomId: 0, slotId: 0 };                  // clashes with class 0 in the same lab
    const bad = E.findConflictingIndices(d.faculty, d.rooms, d.sections, SLOTS, g);
    assert(bad.size === 1 && bad.has(1), "only class 1 (the later one) should be marked");
    eq(E.findConflictingIndices(d.faculty, d.rooms, d.sections, SLOTS, CLEAN).size, 0);
  });

  // ====================================================================
  // 3. SAMPLE DATA
  // ====================================================================
  test("generateSyntheticData is repeatable for a seed and different for other seeds", () => {
    const a = JSON.stringify(E.generateSyntheticData(9, 18, 6, 11)), b = JSON.stringify(E.generateSyntheticData(9, 18, 6, 11));
    eq(a, b, "same seed must give the same data");
    assert(a !== JSON.stringify(E.generateSyntheticData(9, 18, 6, 12)), "different seeds should differ");
    const d = E.generateSyntheticData(9, 18, 6, 11);
    eq(d.faculty.length, 9); eq(d.sections.length, 18); eq(d.rooms.length, 6);
    E.SPECIALIZATIONS.forEach(s => assert(d.faculty.filter(f => f.specializations.includes(s)).length >= 2, "fewer than 2 teachers for " + s));
  });

  test("generateExpandedData: 3 programs, part-time staff, repeatable, enough teachers per subject area", () => {
    const d = E.generateExpandedData(5);
    eq(d.faculty.length, 22); eq(d.sections.length, 48); eq(d.rooms.length, 10);
    assert(JSON.stringify(Array.from(new Set(d.sections.map(s => s.program))).sort()) === '["BSCS","BSIS","BSIT"]', "programs");
    assert(d.faculty.some(f => f.employmentStatus === "Part-time"), "no part-time faculty");
    eq(JSON.stringify(d), JSON.stringify(E.generateExpandedData(5)), "same seed, same data");
    E.SPECIALIZATIONS.forEach(s => assert(d.faculty.filter(f => f.specializations.includes(s)).length >= 3, "fewer than 3 teachers for " + s));
  });

  // ====================================================================
  // 4. FULL GENERATION (runGA)
  // ====================================================================
  test("runGA: an empty subject list gives an empty, feasible schedule", () => {
    const d = mini(); const r = E.runGA(d.faculty, d.rooms, [], SLOTS, GA);
    eq(r.genes.length, 0); assert(r.feasible, "should be feasible");
  });

  test("runGA: conflict-free schedules on 10 different sample datasets (independent check)", () => {
    for (let seed = 1; seed <= 10; seed++) {
      const d = E.generateSyntheticData(9, 18, 6, seed);
      const r = E.runGA(d.faculty, d.rooms, d.sections, d.timeSlots, GA);
      eq(r.genes.length, d.sections.length, "one gene per subject (seed " + seed + ")");
      const bad = brokenRules(d, r.genes);
      assert(bad.length === 0, "seed " + seed + " broke rules: " + bad.slice(0, 3).join(", "));
      assert(r.feasible && r.violations.total === 0, "engine said infeasible for seed " + seed);
    }
  });

  test("runGA: online classes get no room; laboratory classes get a laboratory", () => {
    const d = E.generateSyntheticData(9, 18, 6, 3);
    const r = E.runGA(d.faculty, d.rooms, d.sections, d.timeSlots, GA);
    const roomById = Object.fromEntries(d.rooms.map(x => [x.id, x]));
    r.genes.forEach((g, i) => {
      if (d.sections[i].roomTypeRequired === "online") eq(g.roomId, E.ONLINE_ROOM_ID, "online class " + i);
      else eq(roomById[g.roomId].type, "laboratory", "class " + i);
    });
  });

  test("runGA: respects a fixed day/period and teachers' unavailable times", () => {
    const d = E.generateSyntheticData(9, 18, 6, 4);
    d.sections[2].fixedSlotId = 13; d.sections[5].fixedSlotId = 25;
    const r = E.runGA(d.faculty, d.rooms, d.sections, d.timeSlots, GA);
    eq(r.genes[2].slotId, 13, "first fixed class"); eq(r.genes[5].slotId, 25, "second fixed class");
    r.genes.forEach((g, i) => assert(!d.faculty.find(f => f.id === g.facultyId).unavailableSlotIds.includes(g.slotId), "class " + i + " is in an unavailable time"));
  });

  test("runGA: curriculum-aware mode reports the true number of overlaps, within one program only", () => {
    const d = E.generateExpandedData(2);
    const r = E.runGA(d.faculty, d.rooms, d.sections, d.timeSlots, Object.assign({ curriculumAware: true }, GA));
    eq(brokenRules(d, r.genes).length, 0, "hard rules");
    eq(r.curriculumConflicts, overlaps(d.sections, r.genes), "reported overlaps should match an independent count");
    assert(r.curriculumConflicts <= 3, "curriculum-aware mode left " + r.curriculumConflicts + " overlaps");
  });

  test("runGA: the expanded multi-program sample can be scheduled without conflicts", () => {
    const d = E.generateExpandedData(1);
    const r = E.runGA(d.faculty, d.rooms, d.sections, d.timeSlots, { generations: 80, popSize: 30 });
    const bad = brokenRules(d, r.genes);
    assert(bad.length === 0, "broke rules: " + bad.slice(0, 3).join(", "));
  });

  // ====================================================================
  // 5. INCREMENTAL UPDATE (repairSchedule)
  // ====================================================================
  function baseSchedule(seed) {
    const d = E.generateSyntheticData(9, 18, 6, seed);
    const r = E.runGA(d.faculty, d.rooms, d.sections, d.timeSlots, GA);
    return { d, genes: r.genes };
  }

  test("repairSchedule: a schedule with no conflicts is returned unchanged", () => {
    const { d, genes } = baseSchedule(6);
    const r = E.repairSchedule(d.faculty, d.rooms, d.sections, d.timeSlots, genes, GA);
    eq(r.changes.length, 0); eq(JSON.stringify(r.genes), JSON.stringify(genes));
  });

  test("repairSchedule: after a teacher becomes unavailable, only the affected classes move", () => {
    const { d, genes } = baseSchedule(6);
    // Block one busy teacher at the time of one of their classes.
    const victim = genes.findIndex(g => g.facultyId !== -1 && g.slotId !== -1);
    const fid = genes[victim].facultyId, slot = genes[victim].slotId;
    const faculty = d.faculty.map(f => f.id === fid ? Object.assign({}, f, { unavailableSlotIds: f.unavailableSlotIds.concat([slot]) }) : f);
    const affected = E.findConflictingIndices(faculty, d.rooms, d.sections, d.timeSlots, genes);
    assert(affected.size >= 1 && affected.has(victim), "the blocked class should be flagged");
    const r = E.repairSchedule(faculty, d.rooms, d.sections, d.timeSlots, genes, GA);
    eq(brokenRules(Object.assign({}, d, { faculty }), r.genes).length, 0, "repaired schedule should break no rule");
    assert(r.changes.length >= 1, "the blocked class must move");
    // Everything outside `changes` is exactly where it was.
    const moved = new Set(r.changes.map(c => c.index));
    genes.forEach((g, i) => { if (!moved.has(i)) eq(JSON.stringify(r.genes[i]), JSON.stringify(g), "class " + i + " moved without being listed"); });
    assert(r.changes.length <= affected.size + (r.shiftedToMakeRoom || 0), "more classes moved than were affected or shifted to make room");
    assert(r.changes.length < genes.length / 2, "an update should not rebuild the whole schedule");
  });

  test("repairSchedule: a new subject (no gene yet) is placed without moving the others", () => {
    const { d, genes } = baseSchedule(7);
    const sections = d.sections.concat([Object.assign({}, d.sections[0], { id: 99, sectionName: "NEW-1A", subjectCode: "NEW101" })]);
    const r = E.repairSchedule(d.faculty, d.rooms, sections, d.timeSlots, genes, GA);
    eq(r.genes.length, sections.length, "new subject needs a gene");
    assert(r.genes[sections.length - 1].slotId !== -1, "new subject was not placed");
    eq(brokenRules({ faculty: d.faculty, rooms: d.rooms, sections }, r.genes).length, 0, "result breaks a rule");
  });

  test("repairSchedule: removing a room that classes used re-places only those classes", () => {
    const { d, genes } = baseSchedule(8);
    const used = genes.find((g, i) => g.roomId !== E.ONLINE_ROOM_ID && g.roomId !== -1).roomId;
    const rooms = d.rooms.filter(r => r.id !== used);
    const r = E.repairSchedule(d.faculty, rooms, d.sections, d.timeSlots, genes, GA);
    eq(brokenRules({ faculty: d.faculty, rooms, sections: d.sections }, r.genes).length, 0, "repaired schedule should break no rule");
    r.genes.forEach(g => assert(g.roomId !== used, "a class is still in the removed room"));
  });

  // ---------------- run everything ----------------
  const t0 = Date.now();
  let passed = 0, failed = 0;
  tests.forEach(t => {
    const s = Date.now();
    try { t.fn(); passed++; show("  ok   " + t.name + "  (" + (Date.now() - s) + " ms)"); }
    catch (e) { failed++; show("  FAIL " + t.name + "\n         " + e.message); }
  });
  show("\n" + passed + " passed, " + failed + " failed  (" + ((Date.now() - t0) / 1000).toFixed(1) + " s)");
  window.__testResult = { passed, failed };
  if (inNode) process.exit(failed ? 1 : 0);
})();
