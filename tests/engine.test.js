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
  const slotAt = (day, period) => SLOTS.find(s => s.day === day && s.period === period).id;   // slotAt("Wed", 2) -> its id
  const isEveningSlot = id => SLOTS[id].period > 6;                                              // 4:00 PM or later
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
    const out = [], fb = {}, rb = {}, sb = {};
    const fById = Object.fromEntries(d.faculty.map(f => [f.id, f])), rById = Object.fromEntries(d.rooms.map(r => [r.id, r]));
    genes.forEach((g, i) => {
      const s = d.sections[i], f = fById[g.facultyId];
      if (g.facultyId === -1 || g.roomId === -1 || g.slotId === -1) return;          // manually removed
      if (!f || !f.specializations.includes(s.requiredSpecialization)) out.push("unqualified " + i);
      if (f && (f.unavailableSlotIds || []).includes(g.slotId)) out.push("unavailable " + i);
      // Teaching time: Morning = P1-P3, Afternoon = P4-P6, Evening = P7-P9; none listed = any time.
      const block = p => (p <= 3 ? "Morning" : p <= 6 ? "Afternoon" : "Evening");
      if (f && (f.teachingTimes || []).length && !f.teachingTimes.includes(block(SLOTS[g.slotId].period))) out.push("outside-teaching-time " + i);
      if (s.fixedSlotId != null && g.slotId !== s.fixedSlotId) out.push("fixed " + i);
      if (s.roomTypeRequired === "online") { if (g.roomId !== E.ONLINE_ROOM_ID) out.push("online-room " + i); }
      else {
        const r = rById[g.roomId];
        if (!r || r.type !== s.roomTypeRequired) out.push("room-type " + i);
        else if (r.capacity < s.enrolledStudents) out.push("capacity " + i);
        const rk = g.roomId + "@" + g.slotId; if (rb[rk]) out.push("room-clash " + i); rb[rk] = true;
      }
      const fk = g.facultyId + "@" + g.slotId; if (fb[fk]) out.push("teacher-clash " + i); fb[fk] = true;
      // One section's students cannot attend two classes at once (same program, section, semester and school year).
      if (String(s.sectionName || "").trim()) {
        const sk = [s.program, s.sectionName, s.semester, s.schoolYear].map(x => String(x || "").trim().toLowerCase()).join("|") + "@" + g.slotId;
        if (sb[sk]) out.push("section-clash " + i); sb[sk] = true;
      }
    });
    return out;
  }
  const GA = { generations: 60, popSize: 30 };

  // ====================================================================
  // 1. TIME SLOTS AND LOOKUPS
  // ====================================================================
  test("buildTimeSlots: 6 days x 9 periods, ids 0..53, no Sunday, the last class ends at 8:30 PM", () => {
    eq(E.PERIODS, 9);
    eq(SLOTS.length, 54);
    SLOTS.forEach((s, i) => eq(s.id, i, "slot id order"));
    assert(SLOTS.every(s => E.DAYS.includes(s.day)) && !SLOTS.some(s => s.day === "Sun"), "unexpected day");
    eq(SLOTS[0].label, "Mon 7:00-8:30 AM");
    eq(SLOTS[3].label, "Mon 11:30 AM-1:00 PM", "a period across noon shows AM and PM");
    eq(SLOTS[5].label, "Mon 2:30-4:00 PM", "period 6 ends at 4:00 PM");
    eq(SLOTS[6].label, "Mon 4:00-5:30 PM", "period 7 is the first evening period");
    eq(SLOTS[7].label, "Mon 5:30-7:00 PM");
    eq(SLOTS[8].label, "Mon 7:00-8:30 PM", "period 9 is the last");
    eq(SLOTS[10].time, "8:30-10:00 AM", "the time without the day");
    eq(SLOTS[0].start, 7 * 60, "period 1 starts at 7:00 AM");
    eq(SLOTS[8].end, 20 * 60 + 30, "period 9 ends at 8:30 PM");
    eq(SLOTS[9].label, "Tue 7:00-8:30 AM", "each day has nine periods");
    eq(SLOTS[45].day, "Sat", "Saturday follows Friday");
    eq(SLOTS[53].label, "Sat 7:00-8:30 PM");
  });

  test("timeRangeLabel: one AM/PM when both times share it, both when the range crosses noon", () => {
    eq(E.timeRangeLabel(7 * 60, 8 * 60 + 30), "7:00-8:30 AM");
    eq(E.timeRangeLabel(10 * 60, 11 * 60 + 30), "10:00-11:30 AM");
    eq(E.timeRangeLabel(11 * 60 + 30, 13 * 60), "11:30 AM-1:00 PM");
    eq(E.timeRangeLabel(14 * 60 + 30, 16 * 60), "2:30-4:00 PM");
    eq(E.timeRangeLabel(19 * 60, 20 * 60 + 30), "7:00-8:30 PM");
  });

  test("clockLabel: 12-hour times with AM and PM", () => {
    eq(E.clockLabel(7 * 60), "7:00 AM");
    eq(E.clockLabel(11 * 60 + 30), "11:30 AM");
    eq(E.clockLabel(12 * 60), "12:00 PM", "noon");
    eq(E.clockLabel(12 * 60 + 30), "12:30 PM");
    eq(E.clockLabel(13 * 60), "1:00 PM");
    eq(E.clockLabel(16 * 60), "4:00 PM");
  });

  test("halfHourRows: the weekly grid has a row every 30 minutes from 7:00 AM to 8:00 PM, three per period", () => {
    const rows = E.halfHourRows();
    eq(rows.length, 27, "rows from 7:00 AM to 8:30 PM");
    rows.forEach((r, i) => { eq(r.minutes, 7 * 60 + 30 * i, "row " + i + " start"); eq(r.label, E.clockLabel(r.minutes), "row " + i + " label"); });
    eq(rows.slice(0, 4).map(r => r.label).join(", "), "7:00 AM, 7:30 AM, 8:00 AM, 8:30 AM");
    eq(rows[rows.length - 1].label, "8:00 PM", "the last row starts at 8:00 PM");
    for (let p = 1; p <= E.PERIODS; p++) {
      const own = rows.filter(r => r.period === p);
      eq(own.length, 3, "period " + p + " covers three rows");
      assert(own[0].first && !own[1].first && !own[2].first, "only the first row of period " + p + " is marked first");
      // The period's first row starts when its time slot starts (Mon 8:30-10:00 AM -> the 8:30 AM row).
      eq(own[0].minutes, SLOTS.find(s => s.day === "Mon" && s.period === p).start, "period " + p + " starts with its time slot");
    }
  });

  test("upgradeSlotId: a time saved when days had six periods keeps its day and period", () => {
    eq(E.upgradeSlotId(0, 6), 0, "Mon P1");
    eq(E.upgradeSlotId(5, 6), 5, "Mon P6");
    eq(E.upgradeSlotId(6, 6), 9, "Tue P1 was 6, is now 9");
    eq(SLOTS[E.upgradeSlotId(12, 6)].label, "Wed 7:00-8:30 AM", "Wed P1");
    eq(SLOTS[E.upgradeSlotId(35, 6)].label, "Sat 2:30-4:00 PM", "Sat P6, the last old slot");
    eq(E.upgradeSlotId(-1, 6), -1, "'not assigned' stays -1");
    eq(E.upgradeSlotId(20, 9), 20, "already nine periods: unchanged");
  });

  test("upgradeSlotList: a whole old day becomes the whole new day, a part stays a part", () => {
    const oldThursday = [18, 19, 20, 21, 22, 23];                             // Thu P1-P6 with six periods
    eq(JSON.stringify(E.upgradeSlotList(oldThursday, 6)), JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8, 9].map(p => slotAt("Thu", p))), "all of Thursday");
    eq(JSON.stringify(E.upgradeSlotList([6, 7, 30], 6)), JSON.stringify([slotAt("Tue", 1), slotAt("Tue", 2), slotAt("Sat", 1)]), "single periods keep day and period");
    eq(JSON.stringify(E.upgradeSlotList([], 6)), "[]");
    eq(JSON.stringify(E.upgradeSlotList([slotAt("Mon", 8)], 9)), JSON.stringify([slotAt("Mon", 8)]), "already nine periods: unchanged");
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

  test("teaching time: Morning P1-P3, Afternoon P4-P6, Evening P7-P9; none listed means any time", () => {
    eq(JSON.stringify(E.TEACHING_TIMES.map(t => [t.name, t.periods])), JSON.stringify([["Morning", [1, 2, 3]], ["Afternoon", [4, 5, 6]], ["Evening", [7, 8, 9]]]));
    const evening = { teachingTimes: ["Evening"] };
    assert(E.canTeachAt(evening, SLOTS[slotAt("Mon", 7)]) && E.canTeachAt(evening, SLOTS[slotAt("Sat", 9)]), "evening periods are allowed");
    assert(!E.canTeachAt(evening, SLOTS[slotAt("Mon", 6)]) && !E.canTeachAt(evening, SLOTS[slotAt("Tue", 1)]), "daytime periods are not");
    assert(E.canTeachAt({ teachingTimes: [] }, SLOTS[0]) && E.canTeachAt({}, SLOTS[0]), "no teaching time: any time");
  });

  test("countViolations: a class outside its teacher's teaching time counts as 'teacher unavailable'", () => {
    const d = mini(); d.faculty[0] = Object.assign({}, d.faculty[0], { teachingTimes: ["Evening"] });
    // CLEAN gives teacher A class 0 on Mon P1 and class 2 on Mon P3, both in the morning.
    eq(count(d, CLEAN).unavailable, 2); eq(count(d, CLEAN).total, 2, "it is a conflict");
    const g = clone(CLEAN); g[0].slotId = slotAt("Mon", 7);
    eq(count(d, g).unavailable, 1, "Mon P7 (4:00 PM) is in the evening");
    const marked = E.findConflictingIndices(d.faculty, d.rooms, d.sections, SLOTS, g);
    assert(marked.size === 1 && marked.has(2), "only the morning class should be marked for an update");
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

  test("countViolations: a class that CANNOT be placed is a violation, not 'manually removed'", () => {
    const d = mini();
    d.sections.push(sec({ requiredSpecialization: "AI/ML" }));            // nobody teaches AI/ML
    d.sections.push(sec({ enrolledStudents: 99 }));                         // no lab seats 99
    const genes = clone(CLEAN).concat([{ facultyId: -1, roomId: -1, slotId: 3 }, { facultyId: -1, roomId: -1, slotId: 4 }]);
    const v = count(d, genes);
    eq(v.unplaceable, 2, "both impossible classes"); eq(v.unscheduled, 0); eq(v.total, 2, "they make the schedule not conflict-free");
    assert(!E.canBePlaced(d.faculty, d.rooms, d.sections[3]) && !E.canBePlaced(d.faculty, d.rooms, d.sections[4]) && E.canBePlaced(d.faculty, d.rooms, d.sections[0]), "canBePlaced");
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

  // Two online subjects of one section (BSIT-1A), taught by different teachers.
  const sameSection = () => [sec({ roomTypeRequired: "online", sectionName: "BSIT-1A" }), sec({ roomTypeRequired: "online", sectionName: "BSIT-1A", requiredSpecialization: "Networking" })];
  const atSameTime = [{ facultyId: 0, roomId: E.ONLINE_ROOM_ID, slotId: 4 }, { facultyId: 1, roomId: E.ONLINE_ROOM_ID, slotId: 4 }];

  test("countViolations: one section with two classes at the same time (its students can't attend both)", () => {
    const d = mini(); d.sections = sameSection();
    const v = count(d, atSameTime);
    eq(v.sectionConflicts, 1); eq(v.facultyConflicts, 0); eq(v.total, 1, "it is a conflict");
    eq(count(d, [atSameTime[0], Object.assign({}, atSameTime[1], { slotId: 5 })]).sectionConflicts, 0, "different times are fine");
    d.sections[1] = Object.assign({}, d.sections[1], { sectionName: "BSIT-1B" });
    eq(count(d, atSameTime).sectionConflicts, 0, "different sections may share a time");
    d.sections[1] = Object.assign({}, d.sections[1], { sectionName: " bsit-1a", semester: "2nd Semester" });
    eq(count(d, atSameTime).sectionConflicts, 0, "the same section in another semester is another group of classes");
    d.sections[1] = Object.assign({}, d.sections[1], { semester: "1st Semester" });
    eq(count(d, atSameTime).sectionConflicts, 1, "section names match ignoring capitals and spaces around");
  });

  test("findConflictingIndices: a section's second class at the same time is marked", () => {
    const d = mini(); d.sections = sameSection();
    const bad = E.findConflictingIndices(d.faculty, d.rooms, d.sections, SLOTS, atSameTime);
    assert(bad.size === 1 && bad.has(1), "only the later class should be marked");
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

  // One section (BSIT-1A) with six online subjects, each taught by its own teacher: nothing about
  // the teachers or rooms stops all six from landing in the same period.
  function oneSectionData() {
    const areas = ["Programming", "Networking", "Databases", "Web Development", "Mathematics", "Systems Analysis"];
    return {
      faculty: areas.map((a, i) => ({ id: i, name: "T" + i, specializations: [a], maxUnits: 21, unavailableSlotIds: [], preferredDays: [] })),
      rooms: [],
      sections: areas.map((a, i) => sec({ id: i, requiredSpecialization: a, roomTypeRequired: "online", sectionName: "BSIT-1A", schoolYear: "2026–2027" })),
    };
  }

  test("runGA: no section is given two classes at the same time", () => {
    const d = oneSectionData();
    for (let run = 0; run < 3; run++) {
      const r = E.runGA(d.faculty, d.rooms, d.sections, SLOTS, GA);
      eq(brokenRules(d, r.genes).join(", "), "", "broke a rule");
      eq(r.violations.sectionConflicts, 0); assert(r.feasible, "should be conflict-free");
    }
  });

  test("runGA: classes are spread over the week instead of piling onto Monday", () => {
    // Three sections with the same six subjects: 18 classes, 3 per teacher.
    const base = oneSectionData(), sections = [];
    ["BSIT-1A", "BSIT-1B", "BSIT-1C"].forEach(name => base.sections.forEach(s => sections.push(Object.assign({}, s, { id: sections.length, sectionName: name }))));
    const d = { faculty: base.faculty, rooms: [], sections };
    const r = E.runGA(d.faculty, d.rooms, d.sections, SLOTS, GA);
    eq(brokenRules(d, r.genes).join(", "), "", "broke a rule");
    const perDay = {}, perTeacherDay = {};
    r.genes.forEach(g => { const day = SLOTS[g.slotId].day; perDay[day] = (perDay[day] || 0) + 1; perTeacherDay[g.facultyId + day] = (perTeacherDay[g.facultyId + day] || 0) + 1; });
    assert(Math.max(...Object.values(perDay)) <= 6, "one day holds too many of the 18 classes: " + JSON.stringify(perDay));
    assert(Math.max(...Object.values(perTeacherDay)) <= 2, "a teacher has all 3 classes on one day");
  });

  test("runGA: classes are spread over the whole day, 7:00 AM to 8:30 PM, evening included", () => {
    // The Genetic Algorithm is random, so this checks what held in every one of 210 runs of the small
    // samples and 25 of the multi-program one: the evening is used, no period of the day holds more than
    // half of the classes (the most seen was a third), and the bigger sample uses most periods (8+ seen).
    const perPeriod = genes => {
      const c = {};
      genes.forEach(g => { if (g.slotId >= 0) c[SLOTS[g.slotId].period] = (c[SLOTS[g.slotId].period] || 0) + 1; });
      return c;
    };
    const check = (label, d, genes) => {
      eq(brokenRules(d, genes).length, 0, label + " broke a rule");
      const c = perPeriod(genes), placed = genes.filter(g => g.slotId >= 0).length;
      assert(genes.some(g => g.slotId >= 0 && isEveningSlot(g.slotId)), label + ": no class after 4:00 PM");
      assert(Math.max(...Object.values(c)) <= placed / 2, label + ": classes piled into one period " + JSON.stringify(c));
      return c;
    };
    for (const seed of [3, 4, 5]) {
      const d = E.generateSyntheticData(9, 18, 6, seed);
      check("seed " + seed, d, E.runGA(d.faculty, d.rooms, d.sections, d.timeSlots, GA).genes);
    }
    const x = E.generateExpandedData(2);
    const used = check("the multi-program sample", x, E.runGA(x.faculty, x.rooms, x.sections, x.timeSlots, { generations: 80, popSize: 30 }).genes);
    assert(Object.keys(used).length >= 7, "the multi-program sample uses only periods " + Object.keys(used).join(", "));
  });

  test("runGA: every teacher is scheduled only in their teaching time", () => {
    for (const seed of [11, 12, 13]) {
      const d = E.generateSyntheticData(9, 18, 6, seed);
      const times = [["Morning"], ["Afternoon"], ["Evening"], ["Morning", "Evening"], []];
      const faculty = d.faculty.map((f, i) => Object.assign({}, f, { teachingTimes: times[i % times.length] }));
      const r = E.runGA(faculty, d.rooms, d.sections, d.timeSlots, GA);
      eq(brokenRules(Object.assign({}, d, { faculty }), r.genes).join(", "), "", "seed " + seed + " broke a rule");
      eq(r.violations.total, 0, "seed " + seed + " has conflicts");
    }
  });

  test("runGA: a teacher who can only teach in the evening gets evening classes", () => {
    const daytime = SLOTS.filter(s => s.period <= 6).map(s => s.id);
    const d = {
      faculty: [{ id: 0, name: "A", specializations: ["Programming"], maxUnits: 21, unavailableSlotIds: daytime, preferredDays: [] }],
      rooms: [], sections: [0, 1, 2].map(i => sec({ id: i, roomTypeRequired: "online", sectionName: "BSIT-1A" })),
    };
    const r = E.runGA(d.faculty, d.rooms, d.sections, SLOTS, GA);
    eq(brokenRules(d, r.genes).join(", "), "", "broke a rule");
    assert(r.genes.every(g => isEveningSlot(g.slotId)), "every class should be in the evening");
  });

  test("runGA: a subject nobody can teach is reported (not 'conflict-free'), the rest still scheduled", () => {
    const d = E.generateSyntheticData(9, 18, 6, 5);
    const faculty = d.faculty.map(f => Object.assign({}, f, { specializations: f.specializations.filter(s => s !== "AI/ML") }));
    const sections = d.sections.filter(s => s.requiredSpecialization !== "AI/ML")
      .concat([Object.assign({}, d.sections[0], { id: 901, requiredSpecialization: "AI/ML", roomTypeRequired: "online" })]);
    // 300 generations of headroom: it normally stops after 40–60, so running all 300 means the
    // impossible subject wrongly blocked the early stop (with only 60 the margin was too thin).
    const LONG = { generations: 300, popSize: 30 };
    const r = E.runGA(faculty, d.rooms, sections, d.timeSlots, LONG);
    assert(!r.feasible, "must not be called conflict-free");
    eq(r.violations.unplaceable, 1); eq(r.violations.total, 1, "the impossible subject is the only problem");
    eq(brokenRules({ faculty, rooms: d.rooms, sections }, r.genes).length, 0, "every other class follows the rules");
    assert(r.convergence.length < LONG.generations, "the engine still stops early: the impossible subject cannot get better");
  });

  test("runGA: a laboratory class bigger than every lab is reported", () => {
    const d = E.generateSyntheticData(9, 18, 6, 6);
    const sections = d.sections.concat([Object.assign({}, d.sections[0], { id: 902, roomTypeRequired: "laboratory", enrolledStudents: 99 })]);
    const r = E.runGA(d.faculty, d.rooms, sections, d.timeSlots, GA);
    assert(!r.feasible, "must not be called conflict-free"); eq(r.violations.unplaceable, 1);
  });

  test("runGA: the expanded multi-program sample can be scheduled without conflicts", () => {
    const d = E.generateExpandedData(1);
    const r = E.runGA(d.faculty, d.rooms, d.sections, d.timeSlots, { generations: 80, popSize: 30 });
    const bad = brokenRules(d, r.genes);
    assert(bad.length === 0, "broke rules: " + bad.slice(0, 3).join(", "));
  });

  // Teaching loads. Two part-timers (maximum 3 units) and two full-timers (maximum 12) share
  // 8 lab classes (24 units) and two labs, so at most two lab classes fit in a period. The
  // first teachers on the list used to get a class in almost every period, and evening out
  // the units alone puts 6 units on each part-timer.
  function loadsData() {
    const faculty = [3, 3, 12, 12].map((max, i) => ({ id: i, name: "T" + i, specializations: ["Programming"], maxUnits: max, unavailableSlotIds: [], preferredDays: [] }));
    const rooms = [{ id: 0, name: "Lab 1", type: "laboratory", capacity: 40 }, { id: 1, name: "Lab 2", type: "laboratory", capacity: 40 }];
    return { faculty, rooms, sections: Array.from({ length: 8 }, (_, i) => sec({ id: i })) };
  }
  const unitsByTeacher = (d, genes) => {
    const u = {}; d.faculty.forEach(f => { u[f.id] = 0; });
    genes.forEach((g, i) => { if (g.facultyId >= 0) u[g.facultyId] += d.sections[i].units; });
    return u;
  };

  test("runGA: nobody is given more than their maximum units while other qualified teachers have room", () => {
    const d = loadsData();
    for (let run = 0; run < 3; run++) {
      const r = E.runGA(d.faculty, d.rooms, d.sections, SLOTS, { generations: 140, popSize: 50 });
      eq(brokenRules(d, r.genes).length, 0, "broke a rule");
      const units = unitsByTeacher(d, r.genes);
      const over = d.faculty.filter(f => units[f.id] > f.maxUnits).map(f => f.name + " has " + units[f.id] + " of " + f.maxUnits);
      eq(over.length, 0, "over their maximum: " + over.join(", "));
      eq(r.violations.overload, 0, "overload reported");
    }
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

  test("repairSchedule: a new subject goes to a qualified teacher who still has room", () => {
    // A (maximum 6) already teaches 6 units; B (maximum 24) teaches 9. A has fewer units,
    // but one more class would take A over the maximum, so the new class must go to B.
    const online = over => sec(Object.assign({ roomTypeRequired: "online" }, over));
    const d = {
      faculty: [{ id: 0, name: "A", specializations: ["Programming"], maxUnits: 6, unavailableSlotIds: [], preferredDays: [] },
                { id: 1, name: "B", specializations: ["Programming"], maxUnits: 24, unavailableSlotIds: [], preferredDays: [] }],
      rooms: [],
      sections: [0, 1, 2, 3, 4].map(i => online({ id: i })),
    };
    const genes = [[0, 0], [0, 1], [1, 2], [1, 3], [1, 4]].map(([f, s]) => ({ facultyId: f, roomId: E.ONLINE_ROOM_ID, slotId: s }));
    const sections = d.sections.concat([online({ id: 5 })]);
    const r = E.repairSchedule(d.faculty, d.rooms, sections, SLOTS, genes, GA);
    eq(r.genes[5].facultyId, 1, "the new class should go to B");
    eq(r.violations.overload, 0, "nobody should be over their maximum");
    eq(brokenRules(Object.assign({}, d, { sections }), r.genes).length, 0, "result breaks a rule");
  });

  test("repairSchedule: a moved class never lands where its section already has a class", () => {
    // BSIT-1A has class 0 (teacher A, Mon P2) and class 1 (teacher B, Mon P1). B can no longer teach on
    // Mon P1, so class 1 must move, and B's first free time is Mon P2, where BSIT-1A already has class 0.
    const d = {
      faculty: [{ id: 0, name: "A", specializations: ["Programming"], maxUnits: 21, unavailableSlotIds: [], preferredDays: [] },
                { id: 1, name: "B", specializations: ["Networking"], maxUnits: 21, unavailableSlotIds: [0], preferredDays: [] }],
      rooms: [], sections: sameSection(),
    };
    const genes = [{ facultyId: 0, roomId: E.ONLINE_ROOM_ID, slotId: 1 }, { facultyId: 1, roomId: E.ONLINE_ROOM_ID, slotId: 0 }];
    const r = E.repairSchedule(d.faculty, d.rooms, d.sections, SLOTS, genes, GA);
    eq(brokenRules(d, r.genes).join(", "), "", "broke a rule");
    eq(JSON.stringify(r.genes[0]), JSON.stringify(genes[0]), "class 0 stays where it is");
  });

  // Teacher A asked to move class 0 from Monday P2 to Wednesday P2, but A already teaches
  // class 1 (another section) at Wednesday P2. Both classes are online.
  function askedOntoWednesday(preferredDays) {
    const d = {
      faculty: [{ id: 0, name: "A", specializations: ["Programming"], maxUnits: 21, unavailableSlotIds: [slotAt("Mon", 2)], preferredSlotIds: [slotAt("Wed", 2)], preferredDays }],
      rooms: [],
      sections: [sec({ id: 0, roomTypeRequired: "online", sectionName: "BSIT-1A" }), sec({ id: 1, roomTypeRequired: "online", sectionName: "BSIT-1B" })],
    };
    const genes = [{ facultyId: 0, roomId: E.ONLINE_ROOM_ID, slotId: slotAt("Mon", 2) }, { facultyId: 0, roomId: E.ONLINE_ROOM_ID, slotId: slotAt("Wed", 2) }];
    return { d, genes };
  }

  test("repairSchedule: a class asked onto Wednesday stays on Wednesday when the exact time is taken", () => {
    // Monday and Wednesday are both preferred days; Monday comes first in the week, which used to win.
    const { d, genes } = askedOntoWednesday(["Mon", "Wed"]);
    const r = E.repairSchedule(d.faculty, d.rooms, d.sections, SLOTS, genes, GA);
    eq(brokenRules(d, r.genes).join(", "), "", "broke a rule");
    eq(SLOTS[r.genes[0].slotId].day, "Wed", "class 0 should stay on the day asked for, went to " + SLOTS[r.genes[0].slotId].label);
    eq(JSON.stringify(r.genes[1]), JSON.stringify(genes[1]), "class 1 stays where it is");
  });

  test("repairSchedule: the update's polish does not pull a moved class back to a preferred day", () => {
    // Only Monday is a preferred day: the Genetic Algorithm's polish used to undo the move to Wednesday.
    const { d, genes } = askedOntoWednesday(["Mon"]);
    for (let run = 0; run < 3; run++) {
      const r = E.repairSchedule(d.faculty, d.rooms, d.sections, SLOTS, genes, GA);
      eq(SLOTS[r.genes[0].slotId].day, "Wed", "run " + run + ": class 0 went to " + SLOTS[r.genes[0].slotId].label);
    }
  });

  test("repairSchedule: a class whose time is still allowed keeps its time when only its room must change", () => {
    // Class 0 is on Tuesday P3 in Lab 1. Lab 1 is removed; Lab 2 is free then. Monday is the teacher's
    // preferred day, which used to pull the class to Monday morning instead.
    const d = {
      faculty: [{ id: 0, name: "A", specializations: ["Programming"], maxUnits: 21, unavailableSlotIds: [], preferredDays: ["Mon"] }],
      rooms: [{ id: 1, name: "Lab 2", type: "laboratory", capacity: 40 }],
      sections: [sec({ id: 0, sectionName: "BSIT-1A" })],
    };
    const genes = [{ facultyId: 0, roomId: 0, slotId: slotAt("Tue", 3) }];
    const r = E.repairSchedule(d.faculty, d.rooms, d.sections, SLOTS, genes, GA);
    eq(JSON.stringify(r.genes[0]), JSON.stringify({ facultyId: 0, roomId: 1, slotId: slotAt("Tue", 3) }), "same teacher and time, new room");
  });

  // Teacher A's class on Tuesday P2 has to move (A can no longer teach then). A prefers Mondays,
  // but A cannot teach on Monday in the daytime, so Monday's only free times are in the evening.
  function mondayEveningOnly(preferredSlotIds) {
    const mondayDaytime = [1, 2, 3, 4, 5, 6].map(p => slotAt("Mon", p));
    const d = {
      faculty: [{ id: 0, name: "A", specializations: ["Programming"], maxUnits: 21, preferredDays: ["Mon"], preferredSlotIds,
                  unavailableSlotIds: mondayDaytime.concat([slotAt("Tue", 2)]) }],
      rooms: [], sections: [sec({ id: 0, roomTypeRequired: "online", sectionName: "BSIT-1A" })],
    };
    return { d, genes: [{ facultyId: 0, roomId: E.ONLINE_ROOM_ID, slotId: slotAt("Tue", 2) }] };
  }

  test("repairSchedule: a moved class stays inside its teacher's teaching time", () => {
    // Teacher A teaches only in the evening; A's class on Mon P8 must move (A can no longer teach then).
    const d = {
      faculty: [{ id: 0, name: "A", specializations: ["Programming"], maxUnits: 21, preferredDays: ["Mon"], teachingTimes: ["Evening"],
                  unavailableSlotIds: [slotAt("Mon", 8)] }],
      rooms: [], sections: [sec({ id: 0, roomTypeRequired: "online", sectionName: "BSIT-1A" })],
    };
    const r = E.repairSchedule(d.faculty, d.rooms, d.sections, SLOTS, [{ facultyId: 0, roomId: E.ONLINE_ROOM_ID, slotId: slotAt("Mon", 8) }], GA);
    eq(brokenRules(d, r.genes).join(", "), "", "broke a rule");
    assert(SLOTS[r.genes[0].slotId].period >= 7, "went outside the evening: " + SLOTS[r.genes[0].slotId].label);
  });

  test("repairSchedule: an evening time the teacher asked for is still used first", () => {
    const { d, genes } = mondayEveningOnly([slotAt("Mon", 8)]);
    const r = E.repairSchedule(d.faculty, d.rooms, d.sections, SLOTS, genes, GA);
    eq(SLOTS[r.genes[0].slotId].label, "Mon 5:30-7:00 PM", "the time asked for");
  });

  test("whyNotAt: names what stops a class from being at a time", () => {
    const d = {
      faculty: [{ id: 0, name: "A", specializations: ["Programming"], maxUnits: 21, unavailableSlotIds: [9], preferredDays: [] },
                { id: 1, name: "B", specializations: ["Networking"], maxUnits: 21, unavailableSlotIds: [], preferredDays: [] }],
      rooms: [{ id: 0, name: "Lab 1", type: "laboratory", capacity: 40 }],
      sections: [sec({ sectionName: "BSIT-1A" }),                                                          // 0: A's lab class
                 sec({ sectionName: "BSIT-1A", roomTypeRequired: "online", requiredSpecialization: "Networking" }),   // 1: same section
                 sec({ sectionName: "BSIT-1B", roomTypeRequired: "online" }),                                  // 2: A's online class
                 sec({ sectionName: "BSIT-2A", requiredSpecialization: "Networking" })],                      // 3: B's lab class
    };
    const genes = [{ facultyId: 0, roomId: 0, slotId: 0 }, { facultyId: 1, roomId: E.ONLINE_ROOM_ID, slotId: 6 },
                   { facultyId: 0, roomId: E.ONLINE_ROOM_ID, slotId: 5 }, { facultyId: 1, roomId: 0, slotId: 7 }];
    const why = (sections, i, slot) => JSON.stringify(E.whyNotAt(d.faculty, d.rooms, sections, SLOTS, genes, i, 0, slot));
    eq(why(d.sections, 0, 5), '[{"kind":"teacher","index":2}]', "A already teaches class 2 then");
    eq(why(d.sections, 0, 6), '[{"kind":"section","index":1}]', "BSIT-1A already has class 1 then");
    eq(why(d.sections, 0, 7), '[{"kind":"room"}]', "the only lab is taken then");
    eq(why(d.sections, 0, 9), '[{"kind":"unavailable"}]', "A is unavailable then");
    eq(why(d.sections, 0, 10), "[]", "nothing stops it");
    eq(why(d.sections, 2, 7), "[]", "an online class needs no room");
    const fixed = d.sections.map((s, i) => i === 0 ? Object.assign({}, s, { fixedSlotId: 3 }) : s);
    eq(why(fixed, 0, 10), '[{"kind":"fixed"}]', "a subject with a fixed time can only be then");
  });

  test("whyNotAt: a time outside the teacher's teaching time is named", () => {
    const faculty = [{ id: 0, name: "A", specializations: ["Programming"], maxUnits: 21, unavailableSlotIds: [], preferredDays: [], teachingTimes: ["Morning"] }];
    const sections = [sec({ sectionName: "BSIT-1A", roomTypeRequired: "online" })];
    const genes = [{ facultyId: 0, roomId: E.ONLINE_ROOM_ID, slotId: slotAt("Mon", 1) }];
    eq(JSON.stringify(E.whyNotAt(faculty, [], sections, SLOTS, genes, 0, 0, slotAt("Mon", 8))), '[{"kind":"teachingTime","times":["Morning"]}]');
    eq(JSON.stringify(E.whyNotAt(faculty, [], sections, SLOTS, genes, 0, 0, slotAt("Tue", 2))), "[]", "Tue P2 is in the morning");
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
