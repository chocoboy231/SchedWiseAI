// ============================================================
// Scheduling engine (Genetic Algorithm + greedy CSP seed)
// ============================================================
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const PERIODS = 6;
const HARD_PENALTY = 1000;

function buildTimeSlots() {
  const slots = [];
  let id = 0;
  for (const day of DAYS) {
    for (let period = 1; period <= PERIODS; period++) {
      const startHour = 7 + (period - 1) * 1.5;
      const h1 = Math.floor(startHour), m1 = Math.round((startHour - h1) * 60);
      const endHour = startHour + 1.5;
      const h2 = Math.floor(endHour), m2 = Math.round((endHour - h2) * 60);
      const label = day + " " + String(h1).padStart(2,"0") + ":" + String(m1).padStart(2,"0") + "-" + String(h2).padStart(2,"0") + ":" + String(m2).padStart(2,"0");
      slots.push({ id: id++, day, period, label });
    }
  }
  return slots;
}
function qualifiedFaculty(faculty, section) {
  return faculty.filter(f => f.specializations.includes(section.requiredSpecialization)).map(f => f.id);
}
function validRooms(rooms, section) {
  return rooms.filter(r => r.type === section.roomTypeRequired && r.capacity >= section.enrolledStudents).map(r => r.id);
}
function randInt(n) { return Math.floor(Math.random() * n); }
function choice(arr) { return arr[randInt(arr.length)]; }
function randomGene(faculty, rooms, timeSlots, section) {
  const qf = qualifiedFaculty(faculty, section);
  const qr = validRooms(rooms, section);
  if (qf.length === 0 || qr.length === 0) return { facultyId: -1, roomId: -1, slotId: randInt(timeSlots.length) };
  return { facultyId: choice(qf), roomId: choice(qr), slotId: randInt(timeSlots.length) };
}
function greedySeed(faculty, rooms, timeSlots, sections) {
  const facultySlotUsed = new Set();
  const roomSlotUsed = new Set();
  const genes = [];
  for (const sec of sections) {
    const qf = qualifiedFaculty(faculty, sec);
    const qr = validRooms(rooms, sec);
    let placed = false;
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
function countViolations(faculty, rooms, sections, timeSlots, genes) {
  const facultyById = Object.fromEntries(faculty.map(f => [f.id, f]));
  const roomById = Object.fromEntries(rooms.map(r => [r.id, r]));
  let facultyConflicts = 0, roomConflicts = 0, unqualified = 0, unavailable = 0, roomTypeMismatch = 0, capacityViol = 0;
  const facSlot = {}, roomSlot = {};
  const unitsPerFaculty = {};
  faculty.forEach(f => unitsPerFaculty[f.id] = 0);
  genes.forEach((g, i) => {
    const sec = sections[i];
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
  Object.values(facSlot).forEach(c => { if (c > 1) facultyConflicts += c - 1; });
  Object.values(roomSlot).forEach(c => { if (c > 1) roomConflicts += c - 1; });
  const overload = faculty.reduce((s, f) => s + Math.max(0, unitsPerFaculty[f.id] - f.maxUnits), 0);
  const total = facultyConflicts + roomConflicts + unqualified + unavailable + roomTypeMismatch + capacityViol;
  return { facultyConflicts, roomConflicts, unqualified, unavailable, roomTypeMismatch, capacityViol, overload, total };
}
function fitness(faculty, rooms, sections, timeSlots, genes) {
  const v = countViolations(faculty, rooms, sections, timeSlots, genes);
  const hardPenalty = v.total * HARD_PENALTY;
  const unitsPerFaculty = {};
  faculty.forEach(f => unitsPerFaculty[f.id] = 0);
  genes.forEach((g, i) => { unitsPerFaculty[g.facultyId] = (unitsPerFaculty[g.facultyId] || 0) + sections[i].units; });
  const loads = Object.values(unitsPerFaculty);
  const mean = loads.reduce((a,b)=>a+b,0) / (loads.length || 1);
  const variance = loads.reduce((a,b)=>a+(b-mean)*(b-mean),0) / (loads.length || 1);
  const facultyById = Object.fromEntries(faculty.map(f => [f.id, f]));
  let prefHits = 0;
  genes.forEach((g, i) => {
    const fac = facultyById[g.facultyId], slot = timeSlots[g.slotId];
    if (fac && slot && fac.preferredDays.includes(slot.day)) prefHits++;
  });
  const prefScore = prefHits / (genes.length || 1);
  const roomById = Object.fromEntries(rooms.map(r => [r.id, r]));
  let waste = 0;
  genes.forEach((g, i) => {
    const room = roomById[g.roomId];
    if (room) waste += Math.max(0, room.capacity - sections[i].enrolledStudents);
  });
  const avgWaste = waste / (genes.length || 1);
  return -hardPenalty - variance * 2.0 + prefScore * 50.0 - avgWaste * 0.5;
}
function runGA(faculty, rooms, sections, timeSlots, opts) {
  opts = opts || {};
  const generations = opts.generations || 120;
  const popSize = opts.popSize || 40;
  const baseMutation = opts.baseMutation || 0.08;
  const n = sections.length;
  if (n === 0) return { genes: [], fitness: 0, convergence: [], violations: countViolations(faculty,rooms,sections,timeSlots,[]), feasible: true };

  let population = [];
  const seedGenes = greedySeed(faculty, rooms, timeSlots, sections);
  population.push({ genes: seedGenes, fit: fitness(faculty, rooms, sections, timeSlots, seedGenes) });
  while (population.length < popSize) {
    const genes = sections.map(sec => randomGene(faculty, rooms, timeSlots, sec));
    population.push({ genes, fit: fitness(faculty, rooms, sections, timeSlots, genes) });
  }
  const convergence = [];
  const eliteCount = Math.max(2, Math.floor(popSize / 10));
  function tournament(pop, k) {
    k = k || 4;
    let best = null;
    for (let i = 0; i < k; i++) {
      const cand = pop[randInt(pop.length)];
      if (!best || cand.fit > best.fit) best = cand;
    }
    return best;
  }
  function crossover(p1, p2) {
    const point = n > 1 ? 1 + randInt(n - 1) : 0;
    return { genes: p1.genes.slice(0, point).concat(p2.genes.slice(point)) };
  }
  function mutate(ind, rate) {
    for (let i = 0; i < n; i++) {
      if (Math.random() < rate) ind.genes[i] = randomGene(faculty, rooms, timeSlots, sections[i]);
    }
  }
  let bestOverall = population.reduce((a,b) => (b.fit > a.fit ? b : a));
  for (let gen = 0; gen < generations; gen++) {
    const progress = gen / Math.max(1, generations - 1);
    const mutRate = baseMutation * (1 - 0.8 * progress);
    population.sort((a,b) => b.fit - a.fit);
    let next = population.slice(0, eliteCount);
    while (next.length < popSize) {
      const p1 = tournament(population), p2 = tournament(population);
      const child = crossover(p1, p2);
      mutate(child, mutRate);
      child.fit = fitness(faculty, rooms, sections, timeSlots, child.genes);
      next.push(child);
    }
    population = next;
    const genBest = population.reduce((a,b) => (b.fit > a.fit ? b : a));
    const genAvg = population.reduce((s,i) => s + i.fit, 0) / population.length;
    convergence.push({ generation: gen, best: genBest.fit, avg: genAvg });
    if (genBest.fit > bestOverall.fit) bestOverall = genBest;
    if (convergence.length > 20) {
      const recent = convergence.slice(-20).map(c => c.best);
      if (Math.max(...recent) - Math.min(...recent) < 1e-6 && bestOverall.fit > -HARD_PENALTY) break;
    }
  }
  const violations = countViolations(faculty, rooms, sections, timeSlots, bestOverall.genes);
  return { genes: bestOverall.genes, fitness: bestOverall.fit, convergence, violations, feasible: violations.total === 0 };
}

function generateSyntheticData(nFaculty, nSections, nRooms, seed) {
  nFaculty = nFaculty || 10; nSections = nSections || 20; nRooms = nRooms || 7; seed = seed || 42;
  let s = seed;
  function rng() { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }
  function rint(n) { return Math.floor(rng() * n); }
  function pick(arr) { return arr[rint(arr.length)]; }
  function sample(arr, k) {
    const copy = arr.slice(); const out = [];
    for (let i=0;i<k && copy.length;i++){ const idx=rint(copy.length); out.push(copy.splice(idx,1)[0]); }
    return out;
  }
  const SPECS = ["Programming","Networking","Databases","Web Development","Mathematics","General Education","Systems Analysis","AI/ML"];
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
    });
  }
  for (const spec of SPECS) {
    let qualified = faculty.filter(f => f.specializations.includes(spec));
    while (qualified.length < 2) {
      const p = pick(faculty);
      if (!p.specializations.includes(spec)) { p.specializations.push(spec); qualified.push(p); }
    }
  }
  const rooms = [];
  const nLabs = Math.max(2, Math.floor(nRooms/3));
  for (let i=0;i<nRooms;i++){
    rooms.push({ id:i, name:"Room " + (101+i), type: i<nLabs?"laboratory":"lecture", capacity: pick([45,45,50]) });
  }
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
    const letter = String.fromCharCode(65 + Math.floor(i/pool.length));
    sections.push({
      id:i, subjectCode:row[0], subjectName:row[1], sectionName:"BSIT-"+(2+(i%3))+letter,
      units: pick([3,3,3,5]), requiredSpecialization: row[2], roomTypeRequired: row[3],
      enrolledStudents: row[3]==="lecture" ? 25+rint(21) : 25+rint(16),
    });
  }
  return { faculty, rooms, sections, timeSlots };
}
window.SchedEngine = { buildTimeSlots, qualifiedFaculty, validRooms, runGA, countViolations, generateSyntheticData, DAYS, PERIODS };
