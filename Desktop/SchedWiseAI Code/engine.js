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

   NOTE ON THE SEED STEP: this browser prototype uses a *greedy* constraint-
   satisfaction heuristic (first free slot/faculty/room that fits). The
   separate Python engine (schedwiseai-engine.zip) uses Google OR-Tools
   CP-SAT for this step instead. Both feed the same kind of GA.
   ===================================================================== */

// ---------------------------------------------------------------------
// CONSTANTS
// ---------------------------------------------------------------------
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];   // teaching days in the weekly grid
const PERIODS = 6;                                  // class periods per day (1.5 hours each, starting 7:00)
const HARD_PENALTY = 1000;                          // fitness penalty per hard-rule violation.
                                                    // It is much bigger than any soft-goal score, so the GA
                                                    // always prefers a conflict-free schedule first.
const SPECIALIZATIONS = ["Programming", "Networking", "Databases", "Web Development", "Mathematics", "General Education", "Systems Analysis", "AI/ML"];
const EMPLOYMENT_STATUSES = ["Full-time", "Part-time", "Contractual"];
const ACADEMIC_RANKS = ["Instructor I", "Instructor II", "Instructor III", "Assistant Professor", "Associate Professor", "Professor"];

// ---------------------------------------------------------------------
// buildTimeSlots()
// Creates the list of every teachable time slot in the week:
// 5 days × 6 periods = 30 slots. Each slot gets a numeric id (0..29),
// which is what genes store in `slotId`.
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
// validRooms(rooms, section)
// Returns the ids of rooms that (a) are the right type (lecture vs.
// laboratory) and (b) have enough seats for the enrolled students.
// ---------------------------------------------------------------------
function validRooms(rooms, section) {
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
function randomGene(faculty, rooms, timeSlots, section) {
  const qf = qualifiedFaculty(faculty, section);
  const qr = validRooms(rooms, section);
  if (qf.length === 0 || qr.length === 0) return { facultyId: -1, roomId: -1, slotId: randInt(timeSlots.length) };
  return { facultyId: choice(qf), roomId: choice(qr), slotId: randInt(timeSlots.length) };
}
// ---------------------------------------------------------------------
// greedySeed(faculty, rooms, timeSlots, sections)   — the CSP seed step
// Builds ONE schedule by walking through the sections in order and giving
// each one the first (time slot, faculty, room) combination that does not
// clash with anything already placed. This respects the hard constraints
// wherever possible, giving the GA a strong starting individual.
// If a section cannot be placed without a clash, it falls back to a
// random gene and lets the GA repair it later.
// ---------------------------------------------------------------------
function greedySeed(faculty, rooms, timeSlots, sections) {
  // "facultyId-slotId" and "roomId-slotId" strings already taken, used to avoid double-booking.
  const facultySlotUsed = new Set();
  const roomSlotUsed = new Set();
  const genes = [];
  for (const sec of sections) {
    const qf = qualifiedFaculty(faculty, sec);
    const qr = validRooms(rooms, sec);
    let placed = false;
    // Try every slot, then every qualified teacher, then every valid room, until one fits.
    for (const slot of timeSlots) {
      for (const fid of qf) {
        if (facultySlotUsed.has(fid + "-" + slot.id)) continue;
        for (const rid of qr) {
          if (roomSlotUsed.has(rid + "-" + slot.id)) continue;
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
//   roomTypeMismatch  — lecture class in a lab room, or vice versa
//   capacityViol      — more students than the room can seat
//   overload          — total units ABOVE each teacher's maximum (reported, not in `total`)
//   unscheduled       — sections manually removed by an admin (reported, not in `total`)
// `total` is the number used to decide if a schedule is "conflict-free".
// ---------------------------------------------------------------------
function countViolations(faculty, rooms, sections, timeSlots, genes) {
  // Lookup tables so we can find a faculty member / room by id quickly.
  const facultyById = Object.fromEntries(faculty.map(f => [f.id, f]));
  const roomById = Object.fromEntries(rooms.map(r => [r.id, r]));
  let facultyConflicts = 0, roomConflicts = 0, unqualified = 0, unavailable = 0, roomTypeMismatch = 0, capacityViol = 0, unscheduled = 0;
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
    roomSlot[rkey] = (roomSlot[rkey] || 0) + 1;
    const fac = facultyById[g.facultyId], room = roomById[g.roomId];
    if (!fac || !fac.specializations.includes(sec.requiredSpecialization)) unqualified++;
    else unitsPerFaculty[fac.id] += sec.units;
    if (fac && fac.unavailableSlotIds.includes(g.slotId)) unavailable++;
    if (!room || room.type !== sec.roomTypeRequired) roomTypeMismatch++;
    if (room && room.capacity < sec.enrolledStudents) capacityViol++;
  });
  // Any count above 1 is a double-booking. 3 classes in one slot = 2 conflicts.
  Object.values(facSlot).forEach(c => { if (c > 1) facultyConflicts += c - 1; });
  Object.values(roomSlot).forEach(c => { if (c > 1) roomConflicts += c - 1; });
  const overload = faculty.reduce((s, f) => s + Math.max(0, unitsPerFaculty[f.id] - f.maxUnits), 0);
  const total = facultyConflicts + roomConflicts + unqualified + unavailable + roomTypeMismatch + capacityViol;
  return { facultyConflicts, roomConflicts, unqualified, unavailable, roomTypeMismatch, capacityViol, overload, unscheduled, total };
}
// ---------------------------------------------------------------------
// curriculumOverlapCount(sections, timeSlots, genes)
// Used only when "curriculum-aware" scheduling is switched on.
// ---------------------------------------------------------------------
function curriculumOverlapCount(sections, timeSlots, genes) {
  // Counts time-slot collisions between sections that share the same year level + semester,
  // since students following that curriculum path would need to attend both at once.
  const bucket = {};
  let overlaps = 0;
  genes.forEach((g, i) => {
    const sec = sections[i];
    if (sec.yearLevel == null || !sec.semester) return;
    const key = sec.yearLevel + "-" + sec.semester + "-" + g.slotId;
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
  return -hardPenalty - variance * 2.0 + prefScore * 50.0 - avgWaste * 0.5 - curriculumPenalty;
}
// ---------------------------------------------------------------------
// runGA(faculty, rooms, sections, timeSlots, opts)   — THE GENETIC ALGORITHM
//
// Settings (opts):
//   generations    how many improvement rounds to run at most   (default 120)
//   popSize        how many candidate schedules exist at once   (default 40)
//   baseMutation   starting chance each gene is randomly changed (default 0.08 = 8%)
//   curriculumAware  also avoid same-year/semester overlaps
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
  const fitOpts = { curriculumAware };
  const n = sections.length;
  if (n === 0) return { genes: [], fitness: 0, convergence: [], violations: countViolations(faculty,rooms,sections,timeSlots,[]), feasible: true, curriculumConflicts: 0 };

  // --- Step 1: initial population ---
  // Each "individual" is { genes: [...], fit: score }.
  let population = [];
  const seedGenes = greedySeed(faculty, rooms, timeSlots, sections);
  population.push({ genes: seedGenes, fit: fitness(faculty, rooms, sections, timeSlots, seedGenes, fitOpts) });
  while (population.length < popSize) {
    const genes = sections.map(sec => randomGene(faculty, rooms, timeSlots, sec));
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
  function mutate(ind, rate) {
    for (let i = 0; i < n; i++) {
      if (Math.random() < rate) ind.genes[i] = randomGene(faculty, rooms, timeSlots, sections[i]);
    }
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
  // Roughly one third of rooms are laboratories; all rooms seat 45–50.
  const rooms = [];
  const nLabs = Math.max(2, Math.floor(nRooms/3));
  for (let i=0;i<nRooms;i++){
    rooms.push({ id:i, name:"Room " + (101+i), type: i<nLabs?"laboratory":"lecture", capacity: pick([45,45,50]) });
  }
  // Subject catalogue: [code, name, required specialization, room type].
  const pool = [
    ["IT101","Introduction to Computing","Programming","lecture"],
    ["IT102","Programming 1","Programming","laboratory"],
    ["IT201","Data Structures","Programming","laboratory"],
    ["IT202","Networking Fundamentals","Networking","lecture"],
    ["IT301","Database Management","Databases","laboratory"],
    ["IT302","Web Development","Web Development","laboratory"],
    ["IT401","Systems Analysis and Design","Systems Analysis","lecture"],
    ["GE101","Mathematics in the Modern World","Mathematics","lecture"],
    ["IT501","Artificial Intelligence","AI/ML","lecture"],
  ];
  const sections = [];
  for (let i=0;i<nSections;i++){
    const row = pool[i % pool.length];
    const yearLevel = 2 + (i % 3);
    const letter = String.fromCharCode(65 + Math.floor(i/pool.length));
    sections.push({
      id:i, subjectCode:row[0], subjectName:row[1], sectionName:"BSIT-"+yearLevel+letter,
      units: pick([3,3,3,5]), requiredSpecialization: row[2], roomTypeRequired: row[3],
      enrolledStudents: row[3]==="lecture" ? 25+rint(21) : 25+rint(16),
      yearLevel: yearLevel, semester: pick(["1st Semester", "2nd Semester"]),
    });
  }
  return { faculty, rooms, sections, timeSlots };
}
// ---------------------------------------------------------------------
// PUBLIC API — everything app.jsx is allowed to use from this file.
// ---------------------------------------------------------------------
window.SchedEngine = {
  buildTimeSlots, qualifiedFaculty, validRooms, runGA, countViolations, generateSyntheticData, DAYS, PERIODS,
  SPECIALIZATIONS, EMPLOYMENT_STATUSES, ACADEMIC_RANKS,
};
