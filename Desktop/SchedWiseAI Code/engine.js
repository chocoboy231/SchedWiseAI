/* =====================================================================
   SchedWiseAI — AI OPTIMIZATION ENGINE  (engine.js)
   ---------------------------------------------------------------------
   This file contains ALL of the scheduling intelligence. It has no user
   interface; app.jsx calls into it through the global `window.SchedEngine`
   object defined at the very bottom of this file.

   HOW A SCHEDULE IS REPRESENTED
     A "schedule" is an array called `genes`, with one entry per class
     section (same order as the `sections` array). Each gene says who
     teaches that section, where, and when:

         genes[i] = { facultyId, roomId, slotId }   // for sections[i]

     A value of -1 means "not assigned" (e.g. an admin manually removed it).
     A roomId of -2 (ONLINE_ROOM_ID) means "online class — no physical room".

   THE ALGORITHM (hybrid: constraint-based seed + Genetic Algorithm)
     1. greedySeed()    — builds one schedule that tries hard to obey every
                          hard rule (no double-booking, right room, qualified
                          teacher). This gives the GA a good starting point.
     2. runGA()         — keeps a "population" of many candidate schedules and
                          improves them over many "generations" using
                          selection, crossover, and mutation.
     3. fitness()       — scores each candidate. Hard-rule violations are
                          punished heavily; softer goals (balanced workload,
                          preferred days, efficient rooms) fine-tune the score.
     4. countViolations() — the rule checker used by fitness() and by the UI.

   TWO WAYS TO PRODUCE A SCHEDULE
     runGA()          — FULL generation: builds a whole new schedule from scratch.
     repairSchedule() — UPDATE: keeps every class that is still valid and only
                        re-places the classes that now break a rule (e.g. after
                        a teacher's availability changed). Nothing else moves.

   NOTE ON THE SEED STEP: this browser prototype uses a *greedy* constraint-
   satisfaction heuristic (first free slot/faculty/room that fits). The
   separate Python engine (schedwiseai-engine.zip) uses Google OR-Tools
   CP-SAT for this step instead. Both feed the same kind of GA.
   ===================================================================== */

// ---------------------------------------------------------------------
// CONSTANTS
// ---------------------------------------------------------------------
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];  // days classes CAN be scheduled on
const CALENDAR_DAYS = DAYS.concat(["Sun"]);                 // days SHOWN in the weekly grid (Sunday = no classes)
const PERIODS = 6;                                  // class periods per day (1.5 hours each, starting 7:00)
const ONLINE_ROOM_ID = -2;                          // roomId used for online classes (they need no room)

// School year label for today's date, e.g. "2026–2027". In the Philippines
// the school year starts around June–August, so from June onward we count
// the new school year; January–May still belongs to the previous one.
function currentSchoolYear(date) {
  const d = date || new Date();
  const start = d.getMonth() >= 5 ? d.getFullYear() : d.getFullYear() - 1;
  return start + "–" + (start + 1);
}
// The school years offered in the dropdowns: last year, this year, next year.
function schoolYearOptions() {
  const start = Number(currentSchoolYear().split("–")[0]);
  return [start - 1, start, start + 1].map(y => y + "–" + (y + 1));
}
const HARD_PENALTY = 1000;                          // fitness penalty per hard-rule violation.
                                                    // It is much bigger than any soft-goal score, so the GA
                                                    // always prefers a conflict-free schedule first.
const SPECIALIZATIONS = ["Programming", "Networking", "Databases", "Web Development", "Mathematics", "General Education", "Systems Analysis", "AI/ML"];
const EMPLOYMENT_STATUSES = ["Full-time", "Part-time", "Contractual"];
const ACADEMIC_RANKS = ["Instructor I", "Instructor II", "Instructor III", "Assistant Professor", "Associate Professor", "Professor"];

// ---------------------------------------------------------------------
// buildTimeSlots()
// Creates the list of every teachable time slot in the week:
// 6 days (Mon–Sat) × 6 periods = 36 slots. Each slot gets a numeric id (0..35),
// which is what genes store in `slotId`. Sunday has no slots at all.
// Because Saturday is added AFTER Friday, the ids for Mon–Fri (0..29) are the
// same as in the earlier Mon–Fri version, so older saved schedules still line up.
// Example: { id: 7, day: "Tue", period: 2, label: "Tue 08:30-10:00" }
// ---------------------------------------------------------------------
function buildTimeSlots() {
  const slots = [];
  let id = 0;
  for (const day of DAYS) {
    for (let period = 1; period <= PERIODS; period++) {
      const startHour = 7 + (period - 1) * 1.5;   // period 1 = 7:00, period 2 = 8:30, ...
      const h1 = Math.floor(startHour), m1 = Math.round((startHour - h1) * 60);
      const endHour = startHour + 1.5;
      const h2 = Math.floor(endHour), m2 = Math.round((endHour - h2) * 60);
      const label = day + " " + String(h1).padStart(2,"0") + ":" + String(m1).padStart(2,"0") + "-" + String(h2).padStart(2,"0") + ":" + String(m2).padStart(2,"0");
      slots.push({ id: id++, day, period, label });
    }
  }
  return slots;
}
// ---------------------------------------------------------------------
// qualifiedFaculty(faculty, section)
// Returns the ids of faculty members whose specializations include the
// specialization this section requires. Only these people may teach it.
// ---------------------------------------------------------------------
function qualifiedFaculty(faculty, section) {
  return faculty.filter(f => f.specializations.includes(section.requiredSpecialization)).map(f => f.id);
}
// ---------------------------------------------------------------------
// isOnline(section)
// Classes are either "online" (held virtually) or "laboratory" (on campus).
// ---------------------------------------------------------------------
function isOnline(section) {
  return section.roomTypeRequired === "online";
}

// ---------------------------------------------------------------------
// validRooms(rooms, section)
// For an ONLINE class there is no physical room, so the only valid
// "room" is ONLINE_ROOM_ID (-2).
// For a LABORATORY class, returns the ids of laboratory rooms with
// enough seats for the enrolled students.
// ---------------------------------------------------------------------
function validRooms(rooms, section) {
  if (isOnline(section)) return [ONLINE_ROOM_ID];
  return rooms.filter(r => r.type === section.roomTypeRequired && r.capacity >= section.enrolledStudents).map(r => r.id);
}
// Small random helpers: randInt(5) -> 0..4, choice([a,b,c]) -> one of them at random.
function randInt(n) { return Math.floor(Math.random() * n); }
function choice(arr) { return arr[randInt(arr.length)]; }
// ---------------------------------------------------------------------
// randomGene(faculty, rooms, timeSlots, section)
// Makes one random assignment for a section. It only picks from
// QUALIFIED faculty and VALID rooms, so randomness never breaks those two
// rules; the time slot is fully random, which is where double-bookings
// can appear (the GA then works to remove them).
// If nobody/nowhere qualifies, it returns -1 placeholders.
// ---------------------------------------------------------------------
// A section with a FIXED day/period (section.fixedSlotId) always gets that slot;
// only its teacher and room are chosen.
function randomGene(faculty, rooms, timeSlots, section) {
  const qf = qualifiedFaculty(faculty, section);
  const qr = validRooms(rooms, section);
  const slotId = section.fixedSlotId != null ? section.fixedSlotId : randInt(timeSlots.length);
  if (qf.length === 0 || qr.length === 0) return { facultyId: -1, roomId: -1, slotId };
  return { facultyId: choice(qf), roomId: choice(qr), slotId };
}
// ---------------------------------------------------------------------
// greedySeed(faculty, rooms, timeSlots, sections)   — the CSP seed step
// Builds ONE schedule by walking through the sections in order and giving
// each one the first (time slot, faculty, room) combination that does not
// clash with anything already placed and that the teacher has NOT marked
// as unavailable. This respects the hard constraints wherever possible,
// giving the GA a strong starting individual.
// Online classes never compete for rooms, so only the teacher is checked.
// If a section cannot be placed without a clash, it falls back to a
// random gene and lets the GA repair it later.
// ---------------------------------------------------------------------
function greedySeed(faculty, rooms, timeSlots, sections) {
  // "facultyId-slotId" and "roomId-slotId" strings already taken, used to avoid double-booking.
  const facultySlotUsed = new Set();
  const roomSlotUsed = new Set();
  const facultyById = Object.fromEntries(faculty.map(f => [f.id, f]));
  const genes = [];
  for (const sec of sections) {
    const qf = qualifiedFaculty(faculty, sec);
    const qr = validRooms(rooms, sec);
    let placed = false;
    // Try every slot, then every qualified teacher, then every valid room, until one fits.
    // A section with a fixed day/period only tries its fixed slot.
    const candidateSlots = sec.fixedSlotId != null ? timeSlots.filter(t => t.id === sec.fixedSlotId) : timeSlots;
    for (const slot of candidateSlots) {
      for (const fid of qf) {
        if (facultySlotUsed.has(fid + "-" + slot.id)) continue;
        const unavailableHere = (facultyById[fid].unavailableSlotIds || []).includes(slot.id);
        if (unavailableHere) continue;               // respect approved availability changes / leave
        for (const rid of qr) {
          if (rid !== ONLINE_ROOM_ID && roomSlotUsed.has(rid + "-" + slot.id)) continue;
          genes.push({ facultyId: fid, roomId: rid, slotId: slot.id });
          facultySlotUsed.add(fid + "-" + slot.id);
          roomSlotUsed.add(rid + "-" + slot.id);
          placed = true;
          break;
        }
        if (placed) break;
      }
      if (placed) break;
    }
    if (!placed) genes.push(randomGene(faculty, rooms, timeSlots, sec));
  }
  return genes;
}
// ---------------------------------------------------------------------
// countViolations(faculty, rooms, sections, timeSlots, genes)   — the rule checker
// Checks a whole schedule against the HARD constraints and returns a count
// for each kind of problem:
//   facultyConflicts  — one teacher booked in two places at the same time
//   roomConflicts     — one room booked for two classes at the same time
//   unqualified       — teacher lacks the required specialization
//   unavailable       — teacher scheduled during a time they marked unavailable
//   roomTypeMismatch  — lab class without a lab room, or online class given a room
//   capacityViol      — more students than the room can seat
//   fixedSlot         — a class with a fixed day/period placed at a different time
//   overload          — total units ABOVE each teacher's maximum (reported, not in `total`)
//   unscheduled       — sections manually removed by an admin (reported, not in `total`)
// `total` is the number used to decide if a schedule is "conflict-free".
// ---------------------------------------------------------------------
function countViolations(faculty, rooms, sections, timeSlots, genes) {
  // Lookup tables so we can find a faculty member / room by id quickly.
  const facultyById = Object.fromEntries(faculty.map(f => [f.id, f]));
  const roomById = Object.fromEntries(rooms.map(r => [r.id, r]));
  let facultyConflicts = 0, roomConflicts = 0, unqualified = 0, unavailable = 0, roomTypeMismatch = 0, capacityViol = 0, unscheduled = 0, fixedSlot = 0;
  // facSlot["3-12"] = how many classes faculty 3 has in slot 12 (same idea for rooms).
  const facSlot = {}, roomSlot = {};
  const unitsPerFaculty = {};
  faculty.forEach(f => unitsPerFaculty[f.id] = 0);
  genes.forEach((g, i) => {
    const sec = sections[i];
    // A gene with facultyId -1 represents a manually-removed/unassigned meeting -- it is
    // intentionally incomplete, not a scheduling conflict, so it is tracked separately.
    if (g.facultyId === -1 || g.roomId === -1 || g.slotId === -1) { unscheduled++; return; }
    const fkey = g.facultyId + "-" + g.slotId, rkey = g.roomId + "-" + g.slotId;
    facSlot[fkey] = (facSlot[fkey] || 0) + 1;
    // Online classes don't occupy a room, so many can run in the same slot.
    if (g.roomId !== ONLINE_ROOM_ID) roomSlot[rkey] = (roomSlot[rkey] || 0) + 1;
    const fac = facultyById[g.facultyId], room = roomById[g.roomId];
    if (!fac || !fac.specializations.includes(sec.requiredSpecialization)) unqualified++;
    else unitsPerFaculty[fac.id] += sec.units;
    if (fac && (fac.unavailableSlotIds || []).includes(g.slotId)) unavailable++;
    if (sec.fixedSlotId != null && g.slotId !== sec.fixedSlotId) fixedSlot++;
    if (isOnline(sec)) {
      if (g.roomId !== ONLINE_ROOM_ID) roomTypeMismatch++;          // online class wrongly given a room
    } else {
      if (!room || room.type !== sec.roomTypeRequired) roomTypeMismatch++;
      if (room && room.capacity < sec.enrolledStudents) capacityViol++;
    }
  });
  // Any count above 1 is a double-booking. 3 classes in one slot = 2 conflicts.
  Object.values(facSlot).forEach(c => { if (c > 1) facultyConflicts += c - 1; });
  Object.values(roomSlot).forEach(c => { if (c > 1) roomConflicts += c - 1; });
  const overload = faculty.reduce((s, f) => s + Math.max(0, unitsPerFaculty[f.id] - f.maxUnits), 0);
  const total = facultyConflicts + roomConflicts + unqualified + unavailable + roomTypeMismatch + capacityViol + fixedSlot;
  return { facultyConflicts, roomConflicts, unqualified, unavailable, roomTypeMismatch, capacityViol, fixedSlot, overload, unscheduled, total };
}
// ---------------------------------------------------------------------
// curriculumOverlapCount(sections, timeSlots, genes)
// Used only when "curriculum-aware" scheduling is switched on.
// ---------------------------------------------------------------------
function curriculumOverlapCount(sections, timeSlots, genes) {
  // Counts time-slot collisions between sections of the same PROGRAM + year level + semester
  // (e.g. two BSIT 2nd-year 1st-semester subjects at the same time), since those students
  // would need to attend both at once. Different programs (BSIT vs BSCS) never clash here.
  const bucket = {};
  let overlaps = 0;
  genes.forEach((g, i) => {
    const sec = sections[i];
    if (!sec || sec.yearLevel == null || !sec.semester || g.slotId < 0) return;
    const key = (sec.program || "") + "-" + sec.yearLevel + "-" + sec.semester + "-" + g.slotId;
    bucket[key] = (bucket[key] || 0) + 1;
  });
  Object.values(bucket).forEach(c => { if (c > 1) overlaps += c - 1; });
  return overlaps;
}
// ---------------------------------------------------------------------
// fitness(faculty, rooms, sections, timeSlots, genes, opts)   — the scoring function
// Gives a schedule a single number: HIGHER IS BETTER. The GA keeps and
// breeds high-scoring schedules and discards low-scoring ones.
//
//   score = - (hard violations × 1000)      must-follow rules
//           - (workload variance × 2)        spread teaching units evenly
//           + (preferred-day share × 50)     honour faculty day preferences
//           - (average empty seats × 0.5)    don't waste big rooms on small classes
//           - (curriculum overlaps × 150)    only if curriculum-aware is on
//
// Because 1000 is so much bigger than the other terms, any schedule with
// even one hard violation scores worse than every conflict-free schedule.
// ---------------------------------------------------------------------
function fitness(faculty, rooms, sections, timeSlots, genes, opts) {
  opts = opts || {};

  // 1) Hard constraints
  const v = countViolations(faculty, rooms, sections, timeSlots, genes);
  const hardPenalty = v.total * HARD_PENALTY;

  // 2) Workload balance: variance of total units per teacher (0 = perfectly even).
  const unitsPerFaculty = {};
  faculty.forEach(f => unitsPerFaculty[f.id] = 0);
  genes.forEach((g, i) => { unitsPerFaculty[g.facultyId] = (unitsPerFaculty[g.facultyId] || 0) + sections[i].units; });
  const loads = Object.values(unitsPerFaculty);
  const mean = loads.reduce((a,b)=>a+b,0) / (loads.length || 1);
  const variance = loads.reduce((a,b)=>a+(b-mean)*(b-mean),0) / (loads.length || 1);
  // 3) Preferences: fraction of classes placed on the teacher's preferred days (0..1).
  const facultyById = Object.fromEntries(faculty.map(f => [f.id, f]));
  let prefHits = 0;
  genes.forEach((g, i) => {
    const fac = facultyById[g.facultyId], slot = timeSlots[g.slotId];
    if (fac && slot && fac.preferredDays.includes(slot.day)) prefHits++;
  });
  const prefScore = prefHits / (genes.length || 1);
  // 4) Room efficiency: average number of empty seats per class.
  const roomById = Object.fromEntries(rooms.map(r => [r.id, r]));
  let waste = 0;
  genes.forEach((g, i) => {
    const room = roomById[g.roomId];
    if (room) waste += Math.max(0, room.capacity - sections[i].enrolledStudents);
  });
  const avgWaste = waste / (genes.length || 1);
  // 5) Curriculum overlaps (optional).
  let curriculumPenalty = 0;
  if (opts.curriculumAware) {
    curriculumPenalty = curriculumOverlapCount(sections, timeSlots, genes) * 150;
  }

  // 6) Stability (UPDATE mode only): for each class being re-placed, prefer
  //    keeping the same teacher (−20 if changed) and room (−3), and move it as
  //    little as possible (−1). Much smaller than a hard violation, so rules
  //    still come first — this only breaks ties toward "least disruption".
  let changePenalty = 0;
  if (opts.anchorGenes && opts.mutableIndices) {
    opts.mutableIndices.forEach(i => {
      const a = opts.anchorGenes[i], g = genes[i];
      if (g.facultyId !== a.facultyId) changePenalty += 20;
      if (g.roomId !== a.roomId) changePenalty += 3;
      if (g.slotId !== a.slotId) changePenalty += 1;
    });
  }
  return -hardPenalty - variance * 2.0 + prefScore * 50.0 - avgWaste * 0.5 - curriculumPenalty - changePenalty;
}
// ---------------------------------------------------------------------
// runGA(faculty, rooms, sections, timeSlots, opts)   — THE GENETIC ALGORITHM
//
// Settings (opts):
//   generations    how many improvement rounds to run at most   (default 120)
//   popSize        how many candidate schedules exist at once   (default 40)
//   baseMutation   starting chance each gene is randomly changed (default 0.08 = 8%)
//   curriculumAware  also avoid same-year/semester overlaps
//   seedGenes / mutableIndices / anchorGenes   (UPDATE mode, set by repairSchedule)
//                  start from seedGenes and only ever change the genes listed
//                  in mutableIndices; every other class stays exactly as it is.
//
// Steps:
//   1. INITIAL POPULATION: 1 greedy-seeded schedule + (popSize-1) random ones.
//   2. Repeat for each generation:
//        a. ELITISM   — copy the best ~10% unchanged into the next generation,
//                       so the best solution found is never lost.
//        b. SELECTION — "tournament": pick 4 random schedules, keep the best.
//                       Done twice to get two parents.
//        c. CROSSOVER — cut both parents at a random point and join the
//                       first part of parent 1 with the rest of parent 2.
//        d. MUTATION  — randomly re-roll some genes. The mutation rate
//                       shrinks over time (explore early, refine late).
//        e. Score the child with fitness() and add it to the next generation.
//   3. EARLY STOP: if the best score hasn't changed for 20 generations AND
//      the best schedule has no hard violations, stop — it has converged.
//
// Returns: the best schedule found, its score, a conflict report, and the
// per-generation `convergence` history that the UI charts.
// ---------------------------------------------------------------------
function runGA(faculty, rooms, sections, timeSlots, opts) {
  opts = opts || {};
  const generations = opts.generations || 120;
  const popSize = opts.popSize || 40;
  const baseMutation = opts.baseMutation || 0.08;
  const curriculumAware = !!opts.curriculumAware;
  // UPDATE mode: only these gene positions may change (null = all may change).
  const mutable = opts.mutableIndices || null;
  const mutableSet = mutable ? new Set(mutable) : null;
  const allIdx = sections.map((_, i) => i);
  const fitOpts = { curriculumAware, anchorGenes: opts.anchorGenes, mutableIndices: mutable };
  const n = sections.length;
  if (n === 0) return { genes: [], fitness: 0, convergence: [], violations: countViolations(faculty,rooms,sections,timeSlots,[]), feasible: true, curriculumConflicts: 0 };

  // --- Step 1: initial population ---
  // Each "individual" is { genes: [...], fit: score }.
  let population = [];
  const seedGenes = opts.seedGenes ? opts.seedGenes.slice() : greedySeed(faculty, rooms, timeSlots, sections);
  population.push({ genes: seedGenes, fit: fitness(faculty, rooms, sections, timeSlots, seedGenes, fitOpts) });
  while (population.length < popSize) {
    // Full mode: every gene random. Update mode: copy the seed, randomise only the mutable genes.
    const genes = mutable
      ? seedGenes.map((g, i) => mutableSet.has(i) ? randomGene(faculty, rooms, timeSlots, sections[i]) : g)
      : sections.map(sec => randomGene(faculty, rooms, timeSlots, sec));
    population.push({ genes, fit: fitness(faculty, rooms, sections, timeSlots, genes, fitOpts) });
  }
  const convergence = [];                                   // { generation, best, avg } per round
  const eliteCount = Math.max(2, Math.floor(popSize / 10)); // top ~10% survive unchanged

  // Tournament selection: sample k individuals at random, return the fittest.
  function tournament(pop, k) {
    k = k || 4;
    let best = null;
    for (let i = 0; i < k; i++) {
      const cand = pop[randInt(pop.length)];
      if (!best || cand.fit > best.fit) best = cand;
    }
    return best;
  }
  // Single-point crossover: child = parent1[0..point) + parent2[point..end).
  function crossover(p1, p2) {
    const point = n > 1 ? 1 + randInt(n - 1) : 0;
    return { genes: p1.genes.slice(0, point).concat(p2.genes.slice(point)) };
  }
  // Mutation: each gene has `rate` chance of being replaced by a fresh random gene.
  // In update mode only the mutable genes are ever re-rolled, so fixed classes never move.
  function mutate(ind, rate) {
    (mutable || allIdx).forEach(i => {
      if (Math.random() < rate) ind.genes[i] = randomGene(faculty, rooms, timeSlots, sections[i]);
    });
  }
  let bestOverall = population.reduce((a,b) => (b.fit > a.fit ? b : a));
  // --- Step 2: evolve ---
  for (let gen = 0; gen < generations; gen++) {
    // Annealed mutation: 100% of baseMutation at the start, 20% of it by the last generation.
    const progress = gen / Math.max(1, generations - 1);
    const mutRate = baseMutation * (1 - 0.8 * progress);

    // (a) Elitism: best individuals go straight into the next generation.
    population.sort((a,b) => b.fit - a.fit);
    let next = population.slice(0, eliteCount);

    // (b)-(e) Fill the rest of the next generation with children.
    while (next.length < popSize) {
      const p1 = tournament(population), p2 = tournament(population);
      const child = crossover(p1, p2);
      mutate(child, mutRate);
      child.fit = fitness(faculty, rooms, sections, timeSlots, child.genes, fitOpts);
      next.push(child);
    }
    population = next;

    // Record this generation's best and average score for the convergence chart.
    const genBest = population.reduce((a,b) => (b.fit > a.fit ? b : a));
    const genAvg = population.reduce((s,i) => s + i.fit, 0) / population.length;
    convergence.push({ generation: gen, best: genBest.fit, avg: genAvg });
    if (genBest.fit > bestOverall.fit) bestOverall = genBest;
    // --- Step 3: early stop once converged and conflict-free ---
    if (convergence.length > 20) {
      const recent = convergence.slice(-20).map(c => c.best);
      if (Math.max(...recent) - Math.min(...recent) < 1e-6 && bestOverall.fit > -HARD_PENALTY) break;
    }
  }
  // Final report on the best schedule found.
  const violations = countViolations(faculty, rooms, sections, timeSlots, bestOverall.genes);
  const curriculumConflicts = curriculumAware ? curriculumOverlapCount(sections, timeSlots, bestOverall.genes) : 0;
  return { genes: bestOverall.genes, fitness: bestOverall.fit, convergence, violations, feasible: violations.total === 0, curriculumAware, curriculumConflicts };
}

// ---------------------------------------------------------------------
// findConflictingIndices(faculty, rooms, sections, timeSlots, genes)
// Returns the positions of the classes that currently break a hard rule —
// these are the ONLY classes an update is allowed to move.
//   Pass 1: rules about a single class (teacher unqualified or unavailable,
//           wrong room/too small, fixed time not respected).
//   Pass 2: double-bookings. When two classes clash, the first one keeps its
//           place and only the later one is marked, so we move as few as possible.
// Manually removed classes (-1) are left alone.
// ---------------------------------------------------------------------
function findConflictingIndices(faculty, rooms, sections, timeSlots, genes) {
  const facultyById = Object.fromEntries(faculty.map(f => [f.id, f]));
  const roomById = Object.fromEntries(rooms.map(r => [r.id, r]));
  const bad = new Set();
  genes.forEach((g, i) => {
    if (g.isNew) { bad.add(i); return; }     // subject added after generation: must be placed
    if (g.facultyId === -1 || g.roomId === -1 || g.slotId === -1) return;
    const sec = sections[i], fac = facultyById[g.facultyId], room = roomById[g.roomId];
    if (!fac || !fac.specializations.includes(sec.requiredSpecialization)) bad.add(i);
    if (fac && (fac.unavailableSlotIds || []).includes(g.slotId)) bad.add(i);
    if (sec.fixedSlotId != null && g.slotId !== sec.fixedSlotId) bad.add(i);
    if (isOnline(sec)) { if (g.roomId !== ONLINE_ROOM_ID) bad.add(i); }
    else if (!room || room.type !== sec.roomTypeRequired || room.capacity < sec.enrolledStudents) bad.add(i);
  });
  const facSeen = {}, roomSeen = {};
  genes.forEach((g, i) => {
    if (bad.has(i) || g.facultyId === -1 || g.roomId === -1 || g.slotId === -1) return;
    const fk = g.facultyId + "-" + g.slotId, rk = g.roomId + "-" + g.slotId;
    const clash = facSeen[fk] || (g.roomId !== ONLINE_ROOM_ID && roomSeen[rk]);
    if (clash) { bad.add(i); return; }
    facSeen[fk] = true;
    if (g.roomId !== ONLINE_ROOM_ID) roomSeen[rk] = true;
  });
  return bad;
}

// ---------------------------------------------------------------------
// repairSchedule(faculty, rooms, sections, timeSlots, currentGenes, opts)
// UPDATE mode — used after availability/leave approvals or fixed-time changes.
//   1. Find the classes that now break a rule (findConflictingIndices).
//      If none, the schedule is returned unchanged.
//   2. Everything else is FROZEN: its teacher/room/time is treated as taken.
//   3. Greedy repair: for each affected class, try the SAME teacher first (at
//      one of their free, available times — preferred days first), then other
//      qualified teachers with the lightest load; same room first if possible.
//      If no free option exists, "make room": shift the one class that blocks
//      the best option to another free spot (undone if that fails too).
//   4. Run the Genetic Algorithm on ONLY those affected classes (every other
//      gene is locked) to polish the result, with the stability penalty
//      favouring the smallest possible change.
// Returns the usual GA result plus `changes`: [{ index, from, to }] for every
// class that moved, so the UI can show exactly what changed.
// ---------------------------------------------------------------------
function repairSchedule(faculty, rooms, sections, timeSlots, genes, opts) {
  opts = opts || {};
  // Subjects added AFTER the schedule was generated have no gene yet. Give each
  // a placeholder marked isNew, so it is treated as "affected" and gets placed.
  genes = genes.concat(sections.slice(genes.length).map(() => ({ facultyId: -1, roomId: -1, slotId: -1, isNew: true })));
  const curriculumAware = !!opts.curriculumAware;
  const affected = Array.from(findConflictingIndices(faculty, rooms, sections, timeSlots, genes)).sort((a, b) => a - b);
  if (affected.length === 0) {
    const violations = countViolations(faculty, rooms, sections, timeSlots, genes);
    return { genes: genes.slice(), fitness: fitness(faculty, rooms, sections, timeSlots, genes, { curriculumAware }),
      convergence: [], violations, feasible: violations.total === 0, curriculumAware,
      curriculumConflicts: curriculumAware ? curriculumOverlapCount(sections, timeSlots, genes) : 0,
      changes: [], affectedCount: 0 };
  }
  const affectedSet = new Set(affected);
  const facultyById = Object.fromEntries(faculty.map(f => [f.id, f]));
  const slotById = Object.fromEntries(timeSlots.map(t => [t.id, t]));

  // Step 2: occupancy maps — which class holds a teacher / room at a slot.
  // facOcc["3-12"] = index of the class teacher 3 teaches in slot 12.
  const cur = genes.slice();        // working copy of the schedule
  const facOcc = {}, roomOcc = {};
  const load = {};
  faculty.forEach(f => { load[f.id] = 0; });
  function occupy(k, g) {
    cur[k] = g;
    facOcc[g.facultyId + "-" + g.slotId] = k;
    if (g.roomId !== ONLINE_ROOM_ID) roomOcc[g.roomId + "-" + g.slotId] = k;
    load[g.facultyId] = (load[g.facultyId] || 0) + sections[k].units;
  }
  function vacate(k) {
    const g = cur[k];
    if (facOcc[g.facultyId + "-" + g.slotId] === k) delete facOcc[g.facultyId + "-" + g.slotId];
    if (roomOcc[g.roomId + "-" + g.slotId] === k) delete roomOcc[g.roomId + "-" + g.slotId];
    load[g.facultyId] = (load[g.facultyId] || 0) - sections[k].units;
  }
  genes.forEach((g, i) => {       // frozen classes keep their places
    if (affectedSet.has(i) || g.facultyId === -1 || g.roomId === -1 || g.slotId === -1) return;
    occupy(i, g);   // (placeholders for new subjects are affected, so never occupy here)
  });

  // Every rule-abiding (teacher, time, room) option for class i, best first:
  // the class's current teacher first, then lighter-loaded teachers; the
  // teacher's preferred days first; the current room first. Times the teacher
  // is unavailable are never offered.
  function options(i) {
    const sec = sections[i], old = genes[i];
    const teachers = qualifiedFaculty(faculty, sec).sort((a, b) =>
      (a === old.facultyId ? -1 : 0) - (b === old.facultyId ? -1 : 0) || (load[a] || 0) - (load[b] || 0));
    const roomsToTry = validRooms(rooms, sec).sort((a, b) => (a === old.roomId ? -1 : 0) - (b === old.roomId ? -1 : 0));
    const slotsToTry = sec.fixedSlotId != null ? [sec.fixedSlotId] : timeSlots.map(t => t.id);
    const out = [];
    teachers.forEach(fid => {
      const fac = facultyById[fid];
      slotsToTry.slice()
        .sort((a, b) => (fac.preferredDays.includes(slotById[b].day) ? 1 : 0) - (fac.preferredDays.includes(slotById[a].day) ? 1 : 0))
        .forEach(sid => {
          if ((fac.unavailableSlotIds || []).includes(sid)) return;
          roomsToTry.forEach(rid => out.push({ facultyId: fid, roomId: rid, slotId: sid }));
        });
    });
    return out;
  }
  const isFree = (o) => facOcc[o.facultyId + "-" + o.slotId] == null && (o.roomId === ONLINE_ROOM_ID || roomOcc[o.roomId + "-" + o.slotId] == null);

  // Place class i in the first free option. Returns true if it fit.
  function placeFree(i) {
    const o = options(i).find(isFree);
    if (!o) return false;
    occupy(i, o);
    return true;
  }

  // "Make room": when class i has no free option, try an option that is
  // blocked by one or two OTHER classes (holding the teacher and/or room),
  // move those blockers to a free place of their own, then put i in.
  // If a blocker can't be moved, everything is put back exactly as it was.
  const bumped = new Set();
  function placeWithBump(i) {
    for (const o of options(i)) {
      const blockers = new Set();
      const fk = facOcc[o.facultyId + "-" + o.slotId];
      if (fk != null) blockers.add(fk);
      if (o.roomId !== ONLINE_ROOM_ID) { const rk = roomOcc[o.roomId + "-" + o.slotId]; if (rk != null) blockers.add(rk); }
      if (blockers.size === 0) { occupy(i, o); return true; }
      const saved = Array.from(blockers).map(k => ({ k, g: cur[k] }));
      saved.forEach(({ k }) => vacate(k));
      occupy(i, o);
      const moved = [];
      const ok = saved.every(({ k }) => { const fit = placeFree(k); if (fit) moved.push(k); return fit; });
      if (ok) { moved.forEach(k => bumped.add(k)); return true; }
      // Undo this attempt completely.
      vacate(i); cur[i] = genes[i];
      moved.forEach(k => vacate(k));
      saved.forEach(({ k, g }) => occupy(k, g));
    }
    return false;
  }

  // Step 3: place each affected class in a free spot; if that fails, make room.
  const unplaced = affected.filter(i => !placeFree(i));
  unplaced.forEach(i => { placeWithBump(i); });
  // (A class that still can't be placed keeps its old spot and shows as a conflict.)
  const seed = cur;
  const mutableIdx = affected.concat(Array.from(bumped)).sort((a, b) => a - b);

  // Step 4: GA polishes ONLY the classes that were re-placed (affected + any
  // blocker that had to shift). Every other gene is locked.
  const r = runGA(faculty, rooms, sections, timeSlots, {
    generations: opts.generations || 100, popSize: opts.popSize || 40, baseMutation: 0.3,
    curriculumAware, seedGenes: seed, mutableIndices: mutableIdx, anchorGenes: genes,
  });
  // Report fitness WITHOUT the stability penalty, so it compares fairly with full runs.
  const finalFitness = fitness(faculty, rooms, sections, timeSlots, r.genes, { curriculumAware });
  const changes = [];
  r.genes.forEach((g, i) => {
    const o = genes[i];
    if (g.facultyId !== o.facultyId || g.roomId !== o.roomId || g.slotId !== o.slotId) changes.push({ index: i, from: o, to: g });
  });
  return { ...r, fitness: finalFitness, changes, affectedCount: affected.length, shiftedToMakeRoom: bumped.size };
}

// ---------------------------------------------------------------------
// generateSyntheticData(nFaculty, nSections, nRooms, seed)
// Creates realistic SAMPLE data (faculty, rooms, sections) for testing,
// matching the thesis methodology's use of synthesized data.
// It uses its own seeded random generator, so the same `seed` always
// produces the same dataset (useful for repeatable tests).
// It also guarantees the data is solvable: every specialization has at
// least 2 qualified faculty, and lab/lecture rooms are big enough.
// ---------------------------------------------------------------------
function generateSyntheticData(nFaculty, nSections, nRooms, seed) {
  nFaculty = nFaculty || 10; nSections = nSections || 20; nRooms = nRooms || 7; seed = seed || 42;
  // Park–Miller "minimal standard" pseudo-random generator (deterministic for a given seed).
  let s = seed;
  function rng() { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }
  function rint(n) { return Math.floor(rng() * n); }
  function pick(arr) { return arr[rint(arr.length)]; }
  function sample(arr, k) {
    const copy = arr.slice(); const out = [];
    for (let i=0;i<k && copy.length;i++){ const idx=rint(copy.length); out.push(copy.splice(idx,1)[0]); }
    return out;
  }
  const SPECS = SPECIALIZATIONS;
  const timeSlots = buildTimeSlots();
  const faculty = [];
  const FIRST_NAMES = ["Maria","Jose","Ana","Juan","Liza","Mark","Carla","Paolo","Grace","Miguel","Rosa","Daniel","Nina","Carlo","Fe"];
  const LAST_NAMES = ["Santos","Reyes","Cruz","Bautista","Garcia","Torres","Ramos","Flores","Rivera","Gonzales","Mendoza","Castillo"];
  for (let i=0;i<nFaculty;i++){
    faculty.push({
      id: i, name: pick(FIRST_NAMES) + " " + pick(LAST_NAMES),
      specializations: sample(SPECS, 1+rint(3)),
      maxUnits: pick([18,21,24]),
      preferredDays: sample(DAYS, 2+rint(3)),
      unavailableSlotIds: sample(timeSlots.map(t=>t.id), 2+rint(5)),
      employmentStatus: pick(EMPLOYMENT_STATUSES),
      academicRank: pick(ACADEMIC_RANKS),
    });
  }
  // Guarantee: at least 2 faculty can teach every specialization.
  for (const spec of SPECS) {
    let qualified = faculty.filter(f => f.specializations.includes(spec));
    while (qualified.length < 2) {
      const p = pick(faculty);
      if (!p.specializations.includes(spec)) { p.specializations.push(spec); qualified.push(p); }
    }
  }
  // Only laboratory classes need a physical room (lectures are online),
  // so every room is a laboratory that seats 45–50.
  const rooms = [];
  for (let i=0;i<nRooms;i++){
    rooms.push({ id:i, name:"Lab " + (101+i), type: "laboratory", capacity: pick([45,45,50]) });
  }
  // Subject catalogue: [code, name, required specialization, class type].
  const pool = [
    ["IT101","Introduction to Computing","Programming","online"],
    ["IT102","Programming 1","Programming","laboratory"],
    ["IT201","Data Structures","Programming","laboratory"],
    ["IT202","Networking Fundamentals","Networking","online"],
    ["IT301","Database Management","Databases","laboratory"],
    ["IT302","Web Development","Web Development","laboratory"],
    ["IT401","Systems Analysis and Design","Systems Analysis","online"],
    ["GE101","Mathematics in the Modern World","Mathematics","online"],
    ["IT501","Artificial Intelligence","AI/ML","online"],
  ];
  const sections = [];
  for (let i=0;i<nSections;i++){
    const row = pool[i % pool.length];
    const yearLevel = 2 + (i % 3);
    const letter = String.fromCharCode(65 + Math.floor(i/pool.length));
    sections.push({
      id:i, subjectCode:row[0], subjectName:row[1], sectionName:"BSIT-"+yearLevel+letter,
      units: pick([3,3,3,5]), requiredSpecialization: row[2], roomTypeRequired: row[3],
      enrolledStudents: row[3]==="online" ? 25+rint(21) : 25+rint(16),
      yearLevel: yearLevel, semester: pick(["1st Semester", "2nd Semester"]),
      category: row[0].startsWith("GE") ? "Minor" : "Major",   // GE (general education) subjects are minors
      schoolYear: currentSchoolYear(),
      fixedSlotId: null,                                        // no fixed day/period by default
    });
  }
  return { faculty, rooms, sections, timeSlots };
}
// ---------------------------------------------------------------------
// generateExpandedData(seed)
// A LARGER, multi-program SAMPLE for testing: three curricula (BSIT, BSCS,
// BSIS), 1st to 4th year, one block (section "A") per year, each year with
// three major subjects and one General Education minor, all in the 1st
// semester of the current school year (one term, as a real schedule would be).
// About 22 faculty (some part-time with a 9–12 unit maximum) and 10 labs of
// different sizes (some only seat 30, so room capacity matters).
// The subject list is illustrative sample data, NOT an official curriculum.
// Seeded like generateSyntheticData, so the same seed gives the same data.
// ---------------------------------------------------------------------
function generateExpandedData(seed) {
  let s = seed || 7;
  function rng() { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }
  function rint(n) { return Math.floor(rng() * n); }
  function pick(arr) { return arr[rint(arr.length)]; }
  function sample(arr, k) { const c = arr.slice(), out = []; for (let i = 0; i < k && c.length; i++) out.push(c.splice(rint(c.length), 1)[0]); return out; }
  const timeSlots = buildTimeSlots();
  const SY = currentSchoolYear();

  // [code, name, specialization, class type, units, prerequisite code or null]
  const CURRICULA = {
    BSIT: [
      [["IT101", "Introduction to Computing", "Programming", "online", 3, null], ["IT102", "Computer Programming 1", "Programming", "laboratory", 3, null], ["IT103", "Fundamentals of Web Design", "Web Development", "laboratory", 3, null], ["GE101", "Mathematics in the Modern World", "Mathematics", "online", 3, null]],
      [["IT201", "Data Structures and Algorithms", "Programming", "laboratory", 3, "IT102"], ["IT202", "Networking 1", "Networking", "laboratory", 3, null], ["IT203", "Information Management", "Databases", "laboratory", 3, null], ["GE102", "Purposive Communication", "General Education", "online", 3, null]],
      [["IT301", "Web Systems and Technologies", "Web Development", "laboratory", 3, "IT103"], ["IT302", "Systems Integration and Architecture", "Systems Analysis", "online", 3, null], ["IT303", "Networking 2", "Networking", "laboratory", 3, "IT202"], ["GE103", "Science, Technology and Society", "General Education", "online", 3, null]],
      [["IT401", "Capstone Project 1", "Systems Analysis", "online", 3, null], ["IT402", "Elective: Intelligent Systems", "AI/ML", "laboratory", 3, null], ["IT403", "Information Assurance and Security", "Networking", "online", 3, null], ["GE104", "Ethics", "General Education", "online", 3, null]],
    ],
    BSCS: [
      [["CS101", "Introduction to Computing", "Programming", "online", 3, null], ["CS102", "Computer Programming 1", "Programming", "laboratory", 3, null], ["CS103", "Discrete Structures 1", "Mathematics", "online", 3, null], ["GE101", "Mathematics in the Modern World", "Mathematics", "online", 3, null]],
      [["CS201", "Data Structures and Algorithms", "Programming", "laboratory", 3, "CS102"], ["CS202", "Object-Oriented Programming", "Programming", "laboratory", 3, "CS102"], ["CS203", "Discrete Structures 2", "Mathematics", "online", 3, "CS103"], ["GE102", "Purposive Communication", "General Education", "online", 3, null]],
      [["CS301", "Automata Theory and Formal Languages", "Mathematics", "online", 3, "CS203"], ["CS302", "Software Engineering 1", "Systems Analysis", "online", 3, null], ["CS303", "Operating Systems", "Networking", "laboratory", 3, null], ["GE103", "Science, Technology and Society", "General Education", "online", 3, null]],
      [["CS401", "Thesis 1", "Systems Analysis", "online", 3, null], ["CS402", "Machine Learning", "AI/ML", "laboratory", 3, null], ["CS403", "Programming Languages", "Programming", "online", 3, null], ["GE104", "Ethics", "General Education", "online", 3, null]],
    ],
    BSIS: [
      [["IS101", "Fundamentals of Information Systems", "Systems Analysis", "online", 3, null], ["IS102", "Computer Programming 1", "Programming", "laboratory", 3, null], ["IS103", "Organization and Management Concepts", "General Education", "online", 3, null], ["GE101", "Mathematics in the Modern World", "Mathematics", "online", 3, null]],
      [["IS201", "Database Management Systems", "Databases", "laboratory", 3, null], ["IS202", "Web Development", "Web Development", "laboratory", 3, null], ["IS203", "Systems Analysis and Design", "Systems Analysis", "online", 3, "IS101"], ["GE102", "Purposive Communication", "General Education", "online", 3, null]],
      [["IS301", "Enterprise Architecture", "Systems Analysis", "online", 3, null], ["IS302", "Data Analytics", "AI/ML", "laboratory", 3, null], ["IS303", "IS Project Management", "Systems Analysis", "online", 3, null], ["GE103", "Science, Technology and Society", "General Education", "online", 3, null]],
      [["IS401", "Capstone Project 1", "Systems Analysis", "online", 3, null], ["IS402", "Data Mining", "AI/ML", "laboratory", 3, "IS302"], ["IS403", "IT Infrastructure", "Networking", "laboratory", 3, null], ["GE105", "Life and Works of Rizal", "General Education", "online", 3, null]],
    ],
  };

  const sections = [];
  Object.keys(CURRICULA).forEach(program => {
    CURRICULA[program].forEach((subjects, y) => {
      subjects.forEach(([code, name, spec, type, units, prereq]) => {
        sections.push({
          id: sections.length, subjectCode: code, subjectName: name, sectionName: program + "-" + (y + 1) + "A",
          program, units, requiredSpecialization: spec, roomTypeRequired: type,
          enrolledStudents: type === "online" ? 30 + rint(16) : 25 + rint(21),   // labs 25–45
          yearLevel: y + 1, semester: "1st Semester", category: code.startsWith("GE") ? "Minor" : "Major",
          schoolYear: SY, fixedSlotId: null, prerequisiteCode: prereq,
        });
      });
    });
  });

  const FIRST = ["Maria", "Jose", "Ana", "Juan", "Liza", "Mark", "Carla", "Paolo", "Grace", "Miguel", "Rosa", "Daniel", "Nina", "Carlo", "Fe", "Ramon", "Teresa", "Andres", "Lea", "Noel", "Joy", "Victor"];
  const LAST = ["Santos", "Reyes", "Cruz", "Bautista", "Garcia", "Torres", "Ramos", "Flores", "Rivera", "Gonzales", "Mendoza", "Castillo", "Aquino", "Villanueva", "Navarro", "Domingo"];
  const faculty = [];
  for (let i = 0; i < 22; i++) {
    const partTime = i >= 16;                       // the last 6 are part-time
    faculty.push({
      id: i, name: FIRST[i] + " " + pick(LAST),
      specializations: sample(SPECIALIZATIONS, 1 + rint(2)),
      maxUnits: partTime ? pick([9, 12]) : pick([18, 21, 24]),
      preferredDays: sample(DAYS, 3 + rint(3)),
      unavailableSlotIds: sample(timeSlots.map(t => t.id), 2 + rint(5)),
      employmentStatus: partTime ? "Part-time" : pick(["Full-time", "Full-time", "Contractual"]),
      academicRank: pick(ACADEMIC_RANKS),
    });
  }
  // Guarantee: at least 3 faculty can teach every specialization.
  SPECIALIZATIONS.forEach(spec => {
    let q = faculty.filter(f => f.specializations.includes(spec));
    while (q.length < 3) { const f = pick(faculty); if (!f.specializations.includes(spec)) { f.specializations.push(spec); q.push(f); } }
  });

  // 10 labs: two large ones guarantee every lab section (up to 45 students) fits somewhere.
  const caps = [50, 45, 40, 40, 35, 35, 30, 30, 45, 40];
  const rooms = caps.map((c, i) => ({ id: i, name: "Lab " + (201 + i), type: "laboratory", capacity: c }));
  return { faculty, rooms, sections, timeSlots };
}

// ---------------------------------------------------------------------
// PUBLIC API — everything app.jsx is allowed to use from this file.
// ---------------------------------------------------------------------
window.SchedEngine = {
  buildTimeSlots, qualifiedFaculty, validRooms, runGA, countViolations, generateSyntheticData, DAYS, PERIODS,
  SPECIALIZATIONS, EMPLOYMENT_STATUSES, ACADEMIC_RANKS,
  CALENDAR_DAYS, ONLINE_ROOM_ID, isOnline,
  repairSchedule, findConflictingIndices, currentSchoolYear, schoolYearOptions,
  generateExpandedData,
};
