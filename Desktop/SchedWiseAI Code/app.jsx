/* =====================================================================
   SchedWiseAI — USER INTERFACE  (app.jsx)
   ---------------------------------------------------------------------
   Written in React (JSX). The browser turns this file into normal
   JavaScript on the fly using Babel (loaded in index.html), so there is
   no build step — just open index.html through a web server.

   HOW THE PIECES FIT TOGETHER
     engine.js   → the AI scheduling logic (Genetic Algorithm). It exposes
                   `window.SchedEngine`, which this file calls "E".
     app.jsx     → everything you see and click: pages, forms, tables.
     styles.css  → a few global styles (colors, print layout).
     index.html  → loads the libraries and the three files above.

   HOW REACT WORKS HERE (quick primer)
     • A "component" is a function that returns what should be on screen,
       e.g. function StatCard({ label, value }) { return <div>...</div>; }
     • useState(x) creates a value the component remembers. Changing it
       with its setter (e.g. setFaculty(...)) makes React redraw the screen.
     • useEffect(fn, [a, b]) runs fn after the screen updates, whenever a
       or b changes — used here for saving data and syncing history.
     • Props are the inputs passed into a component: <Panel title="X" />.

   WHERE THE DATA LIVES
     All data is held in state inside the App() component and saved to the
     browser's localStorage (see saveState/loadState), so it survives a
     page refresh. Nothing is sent to a server.

   MAP OF THIS FILE (top to bottom)
     1. Icons ........................ small SVG icon components
     2. Roles & navigation ........... who can see which page
     3. CSV / export helpers ......... downloadCSV, parseCSV
    3b. Display & data helpers ....... roomLabel, yearLabel, describeSlots,
                                       normalizeData (upgrades old saved data)
     4. Saving & loading ............. loadState, saveState, freshData
     5. Form building blocks ......... Modal, Field, CheckboxGroup
     6. Forms (modals) ............... Faculty, Subject, Room, Assignment,
                                       Profile, SlotPicker + Availability/Leave
                                       request, CSV Import
     7. Login & notifications ........ LoginScreen, NotificationPanel
     8. Charts & cards ............... StatCard, ConvergenceChart, BarChart
     9. App() ........................ the main component: all state + page switching
    10. Overview pages ............... one per role (Admin, Chair, Faculty, IT)
    11. Other pages .................. Faculty, Subjects, Rooms, Departments,
                                       Workload, Schedules, History,
                                       Conflicts, Reports, Settings
   ===================================================================== */

// Pull React's "hooks" out of the global React object (loaded from a CDN in index.html).
const { useState, useEffect, useRef } = React;
// Shortcut to the scheduling engine defined in engine.js (E.runGA, E.DAYS, etc.).
const E = window.SchedEngine;

/* ---------------------------------------------------------------------
   1. ICONS
   Each icon is a tiny SVG drawing. `Icon` is the shared wrapper (size,
   stroke style); each IconXxx just supplies its own shape via `d`.
   Hand-drawn so the app doesn't depend on an external icon library.
   --------------------------------------------------------------------- */
function Icon({ d, size = 18, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {d}
    </svg>
  );
}
const IconHome = (p) => <Icon {...p} d={<path d="M3 11l9-8 9 8M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10" />} />;
const IconUsers = (p) => <Icon {...p} d={<g><circle cx="9" cy="8" r="3"/><path d="M2 20c0-3.3 3-6 7-6s7 2.7 7 6"/><circle cx="17" cy="8" r="2.5"/><path d="M22 20c0-2.5-2-4.7-5-5.5"/></g>} />;
const IconGauge = (p) => <Icon {...p} d={<g><path d="M12 14 15 10"/><circle cx="12" cy="14" r="1.2" fill="currentColor"/><path d="M4 14a8 8 0 0 1 16 0"/></g>} />;
const IconBook = (p) => <Icon {...p} d={<path d="M4 4h11a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3V4z M18 20H7a3 3 0 0 1-3-3" />} />;
const IconCalendar = (p) => <Icon {...p} d={<g><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></g>} />;
const IconDoor = (p) => <Icon {...p} d={<g><rect x="5" y="3" width="14" height="18" rx="1"/><circle cx="15" cy="12" r="1" fill="currentColor"/></g>} />;
const IconBuilding = (p) => <Icon {...p} d={<g><rect x="4" y="3" width="16" height="18"/><path d="M9 7h1M14 7h1M9 11h1M14 11h1M9 15h1M14 15h1"/></g>} />;
const IconChart = (p) => <Icon {...p} d={<g><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></g>} />;
const IconBell = (p) => <Icon {...p} d={<path d="M6 8a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6zM10 20a2 2 0 0 0 4 0"/>} />;
const IconSettings = (p) => <Icon {...p} d={<g><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9c.2.7.7 1.2 1.5 1.4h.1a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></g>} />;
const IconSearch = (p) => <Icon {...p} d={<g><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></g>} />;
const IconSparkles = (p) => <Icon {...p} d={<path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z"/>} />;
const IconCheckCircle = (p) => <Icon {...p} d={<g><circle cx="12" cy="12" r="9"/><path d="M8.5 12.5l2.3 2.3L16 10"/></g>} />;
const IconPlus = (p) => <Icon {...p} d={<path d="M12 5v14M5 12h14"/>} />;
const IconEdit = (p) => <Icon {...p} d={<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>} />;
const IconTrash = (p) => <Icon {...p} d={<path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V6h12z"/>} />;
const IconX = (p) => <Icon {...p} d={<path d="M18 6L6 18M6 6l12 12"/>} />;
const IconRefresh = (p) => <Icon {...p} d={<path d="M21 12a9 9 0 1 1-3-6.7M21 4v5h-5"/>} />;
const IconAlert = (p) => <Icon {...p} d={<g><path d="M12 3l10 18H2L12 3z"/><path d="M12 10v4M12 17h.01"/></g>} />;
const IconZap = (p) => <Icon {...p} d={<path d="M13 2 3 14h7l-1 8 11-14h-7l1-6z"/>} />;
const IconMenu = (p) => <Icon {...p} d={<path d="M3 6h18M3 12h18M3 18h18"/>} />;
const IconEye = (p) => <Icon {...p} d={<g><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></g>} />;
const IconChevronDown = (p) => <Icon {...p} d={<path d="M6 9l6 6 6-6"/>} />;
const IconAlertCircle = (p) => <Icon {...p} d={<g><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></g>} />;
const IconDownload = (p) => <Icon {...p} d={<g><path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M4 21h16"/></g>} />;
const IconUpload = (p) => <Icon {...p} d={<g><path d="M12 21V9"/><path d="M7 14l5-5 5 5"/><path d="M4 3h16"/></g>} />;
const IconPrinter = (p) => <Icon {...p} d={<g><rect x="6" y="9" width="12" height="7" rx="1"/><path d="M6 9V4h12v5"/><path d="M6 17v3h12v-3"/></g>} />;
const IconLogOut = (p) => <Icon {...p} d={<g><path d="M9 21H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></g>} />;
const IconHistory = (p) => <Icon {...p} d={<g><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/><path d="M12 7v5l3 3"/></g>} />;
const IconThumbsUp = (p) => <Icon {...p} d={<path d="M7 22V11M2 13v7a2 2 0 0 0 2 2h12.7a2 2 0 0 0 2-1.6l1.3-6A2 2 0 0 0 18 11h-5l1-5a2 2 0 0 0-2-2.4L7 11"/>} />;
const IconThumbsDown = (p) => <Icon {...p} d={<path d="M17 2v11M22 11V4a2 2 0 0 0-2-2H7.3a2 2 0 0 0-2 1.6l-1.3 6A2 2 0 0 0 6 12h5l-1 5a2 2 0 0 0 2 2.4L17 13"/>} />;

/* ---------------------------------------------------------------------
   2. ROLES & NAVIGATION
   ROLES: the four user types from the study's respondent groups.
   NAV_ITEMS: every sidebar page, and the list of roles allowed to see it.
   This is the Role-Based Access Control (RBAC): if a role isn't listed
   for a page, that page never appears in that role's sidebar.
   --------------------------------------------------------------------- */
const ROLES = [
  { key: "admin", label: "Academic Administrator" },
  { key: "chair", label: "Department Chair" },
  { key: "faculty", label: "Faculty Member" },
  { key: "it", label: "IT Professional/Staff" },
];

const NAV_ITEMS = [
  { key: "dashboard", label: "Overview", icon: IconHome, roles: ["admin","chair","faculty","it"] },
  { key: "faculty", label: "Faculty", icon: IconUsers, roles: ["admin","chair","it"] },
  { key: "workload", label: "Workload Management", icon: IconGauge, roles: ["admin","chair","it"] },
  { key: "subjects", label: "Subjects", icon: IconBook, roles: ["admin","chair","it"] },
  { key: "schedules", label: "Class Schedules", icon: IconCalendar, roles: ["admin","chair","faculty","it"] },
  { key: "history", label: "Schedule History", icon: IconHistory, roles: ["admin","chair","it"] },
  { key: "rooms", label: "Rooms", icon: IconDoor, roles: ["admin","chair","it"] },
  { key: "departments", label: "Departments", icon: IconBuilding, roles: ["admin","it"] },
  { key: "conflicts", label: "Conflict Detection", icon: IconAlert, roles: ["admin","chair","it"] },
  { key: "reports", label: "Reports", icon: IconChart, roles: ["admin","chair","it"] },
];

/* ---------------------------------------------------------------------
   3. CSV / EXPORT HELPERS
   --------------------------------------------------------------------- */

// downloadCSV(filename, headers, rows)
// Turns a table (a header row + data rows) into a .csv file and makes the
// browser download it. CSV files open directly in Excel or Google Sheets.
// Values containing commas, quotes, or line breaks are wrapped in quotes
// (the standard CSV escaping rule). After downloading, it announces a
// "schedwise:export" event so the IT overview can log the export.
function downloadCSV(filename, headers, rows) {
  const escape = (v) => {
    const s = String(v == null ? "" : v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const lines = [headers.map(escape).join(",")].concat(rows.map(r => r.map(escape).join(",")));
  const csv = lines.join("\r\n");
  // Create an in-memory file, point a hidden link at it, and "click" the link to download.
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : filename + ".csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  window.dispatchEvent(new CustomEvent("schedwise:export", { detail: { filename: a.download, rows: rows.length } }));
}

// parseCSV(text)
// The reverse of downloadCSV: reads pasted CSV text into { headers, rows }.
// It walks each line character by character so that commas INSIDE quotes
// (e.g. "Santos, Maria") are not mistaken for column separators.
function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length === 0) return { headers: [], rows: [] };
  const parseLine = (line) => {
    const out = [];
    let cur = "", inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (inQuotes) {
        if (c === '"' && line[i+1] === '"') { cur += '"'; i++; }
        else if (c === '"') { inQuotes = false; }
        else cur += c;
      } else {
        if (c === '"') inQuotes = true;
        else if (c === ",") { out.push(cur); cur = ""; }
        else cur += c;
      }
    }
    out.push(cur);
    return out;
  };
  const headers = parseLine(lines[0]).map(h => h.trim());
  const rows = lines.slice(1).filter(l => l.trim().length > 0).map(parseLine);
  return { headers, rows };
}

/* ---------------------------------------------------------------------
   3b. DISPLAY & DATA HELPERS
   --------------------------------------------------------------------- */

// Text shown for a scheduled class's room. Online classes (roomId -2) have
// no physical room, so they show "Online".
function roomLabel(roomId, roomById) {
  if (roomId === E.ONLINE_ROOM_ID) return "Online";
  const room = roomById[roomId];
  return room ? room.name : "—";
}

// "Online" or "Laboratory", for tables and CSV exports.
function classTypeLabel(section) {
  return E.isOnline(section) ? "Online" : "Laboratory";
}

// Academic year level as words: 1 -> "1st Year".
const YEAR_LABELS = { 1: "1st Year", 2: "2nd Year", 3: "3rd Year", 4: "4th Year" };
function yearLabel(n) { return YEAR_LABELS[n] || "—"; }

// describeSlots([30,31,...], slotById) -> "Fri P4–P6 · Sat (all day)"
// Turns a list of time-slot ids into short readable text, grouped by day.
// Runs of back-to-back periods are shown as a range (P4–P6).
function describeSlots(slotIds, slotById) {
  if (!slotIds || slotIds.length === 0) return "No time slots selected";
  const byDay = {};
  slotIds.forEach(id => {
    const sl = slotById[id];
    if (!sl) return;
    (byDay[sl.day] = byDay[sl.day] || []).push(sl.period);
  });
  return E.DAYS.filter(d => byDay[d]).map(d => {
    const ps = byDay[d].slice().sort((a, b) => a - b);
    if (ps.length === E.PERIODS) return d + " (all day)";
    const parts = [];
    let start = ps[0], prev = ps[0];
    for (let i = 1; i <= ps.length; i++) {
      if (ps[i] === prev + 1) { prev = ps[i]; continue; }
      parts.push(start === prev ? "P" + start : "P" + start + "–P" + prev);
      start = prev = ps[i];
    }
    return d + " " + parts.join(", ");
  }).join(" · ");
}

// normalizeData(data)
// Upgrades data saved by OLDER versions of the prototype so it works with
// this version, without losing anything:
//   • always use the current time-slot list (now includes Saturday; the
//     Mon–Fri ids are unchanged, so old schedules still line up)
//   • "lecture" classes become "online" classes (no room needed)
//   • old "lecture" rooms become laboratory rooms (the only rooms still used)
//   • schedule genes for online classes get roomId -2, and conflicts are
//     re-counted so the numbers on screen are accurate
//   • old leave requests without time slots get an empty slot list
//   • subjects get a School Year, Major/Minor category, "no fixed time", and a
//     Program taken from the section name (BSIT-2A -> BSIT)
function normalizeData(d) {
  const sections = (d.sections || []).map(s => ({
    ...s,
    roomTypeRequired: s.roomTypeRequired === "lecture" ? "online" : s.roomTypeRequired,
    schoolYear: s.schoolYear || E.currentSchoolYear(),
    // Older data had no Major/Minor field: GE subjects are treated as Minor, the rest as Major.
    category: s.category || ((s.subjectCode || "").startsWith("GE") ? "Minor" : "Major"),
    fixedSlotId: s.fixedSlotId == null ? null : s.fixedSlotId,
    // Program (curriculum) the section belongs to, e.g. "BSIT-2A" -> "BSIT".
    program: s.program || ((s.sectionName || "").split("-")[0] || "BSIT"),
  }));
  const rooms = (d.rooms || []).map(r => r.type === "lecture" ? { ...r, type: "laboratory" } : r);
  const faculty = (d.faculty || []).map(f => ({ ...f, unavailableSlotIds: f.unavailableSlotIds || [] }));
  const timeSlots = E.buildTimeSlots();
  function fixSchedule(res) {
    if (!res || !res.genes || res.genes.length !== sections.length) return res;
    const genes = res.genes.map((g, i) =>
      E.isOnline(sections[i]) && g.facultyId !== -1 ? { ...g, roomId: E.ONLINE_ROOM_ID } : g);
    const violations = E.countViolations(faculty, rooms, sections, timeSlots, genes);
    return { ...res, genes, violations, feasible: violations.total === 0 };
  }
  return {
    ...d, sections, rooms, faculty, timeSlots,
    result: fixSchedule(d.result),
    scheduleHistory: (d.scheduleHistory || []).map(fixSchedule),
    leaveRequests: (d.leaveRequests || []).map(r => ({ ...r, slotIds: r.slotIds || [] })),
  };
}

/* ---------------------------------------------------------------------
   3c. TEST CONFLICT GENERATOR (Settings → Testing tools)
   makeTestConflict(kind, data) deliberately breaks ONE rule in the current
   schedule so testers can see Conflict Detection, the red conflict label and
   "Update affected classes" at work. It never changes the input; it returns
   new arrays plus a plain-language message, or { error } if the current data
   has no suitable class for that kind of conflict.
     data = { faculty, rooms, sections, timeSlots, genes }
   Kinds:
     teacher      two classes taught by one teacher at the same time
     room         two laboratory classes in one lab at the same time
     unqualified  a class given a teacher without the needed specialization
     unavailable  a class moved into a time its teacher marked unavailable
     capacity     a laboratory class put in a lab that is too small
     roomType     an online class given a physical lab
     fixed        a subject pinned to a day/period it is not scheduled at
     overload     a teacher's maximum units set below their current load
                  (shown on Workload/Departments; NOT counted as a conflict)
   --------------------------------------------------------------------- */
const TEST_CONFLICT_KINDS = [
  ["teacher", "Teacher double-booking"], ["room", "Room double-booking"], ["unqualified", "Unqualified teacher"],
  ["unavailable", "Teacher unavailable"], ["capacity", "Room too small"], ["roomType", "Online class given a room"],
  ["fixed", "Fixed time not respected"], ["overload", "Teacher overload"],
];

function makeTestConflict(kind, data) {
  const { faculty, rooms, sections, timeSlots } = data;
  const genes = data.genes.map(g => ({ ...g }));
  const fById = Object.fromEntries(faculty.map(f => [f.id, f]));
  const rById = Object.fromEntries(rooms.map(r => [r.id, r]));
  const slotLabel = id => describeSlots([id], Object.fromEntries(timeSlots.map(t => [t.id, t])));
  const name = i => sections[i].subjectCode + " · " + sections[i].sectionName;
  const scheduled = i => genes[i] && genes[i].facultyId >= 0 && genes[i].slotId >= 0;
  // Classes already part of a conflict are left alone, so a new test conflict never
  // undoes an earlier one. "Involved" = every class the rule checker flags PLUS both
  // classes of any teacher or room double-booking (the checker flags only the second).
  const involved = new Set(E.findConflictingIndices(faculty, rooms, sections, timeSlots, genes));
  const seenF = {}, seenR = {};
  genes.forEach((g, i) => {
    if (!sections[i] || !scheduled(i)) return;
    const fk = g.facultyId + "-" + g.slotId, rk = g.roomId + "-" + g.slotId;
    if (seenF[fk] != null) { involved.add(i); involved.add(seenF[fk]); } else seenF[fk] = i;
    if (g.roomId !== E.ONLINE_ROOM_ID) { if (seenR[rk] != null) { involved.add(i); involved.add(seenR[rk]); } else seenR[rk] = i; }
  });
  const idx = genes.map((_, i) => i).filter(i => sections[i] && scheduled(i) && !involved.has(i));
  const notFixed = i => sections[i].fixedSlotId == null;
  // Who/what is busy at a time, ignoring class `skip` (the one being moved).
  const facBusy = (fid, sid, skip) => genes.some((g, k) => k !== skip && scheduled(k) && g.facultyId === fid && g.slotId === sid);
  const roomBusy = (rid, sid, skip) => rid !== E.ONLINE_ROOM_ID && genes.some((g, k) => k !== skip && scheduled(k) && g.roomId === rid && g.slotId === sid);
  const qualified = (f, i) => f.specializations.includes(sections[i].requiredSpecialization);
  const free = (f, sid) => !(f.unavailableSlotIds || []).includes(sid);
  const out = (msg, extra) => ({ genes, sections: (extra && extra.sections) || sections, faculty: (extra && extra.faculty) || faculty, message: msg });

  if (kind === "teacher") {
    // Give class j the same teacher AND time as class i (j is online, so no room clash is added).
    for (const i of idx) for (const j of idx) {
      if (i === j || !notFixed(j) || !E.isOnline(sections[j])) continue;
      const fi = fById[genes[i].facultyId];
      if (!fi || !qualified(fi, j) || genes[j].slotId === genes[i].slotId) continue;
      genes[j] = { facultyId: fi.id, roomId: E.ONLINE_ROOM_ID, slotId: genes[i].slotId };
      return out(name(j) + " moved to " + slotLabel(genes[i].slotId) + " with " + fi.name + ", who already teaches " + name(i) + " then.");
    }
    return { error: "No online class could be paired with another class's teacher." };
  }
  if (kind === "room") {
    // Put lab class j in the same lab AND time as lab class i (keeping j's own, free, teacher).
    for (const i of idx) for (const j of idx) {
      if (i === j || !notFixed(j) || E.isOnline(sections[i]) || E.isOnline(sections[j])) continue;
      const fj = fById[genes[j].facultyId], ri = rById[genes[i].roomId], si = genes[i].slotId;
      if (!fj || !ri || ri.capacity < sections[j].enrolledStudents || !free(fj, si) || facBusy(fj.id, si, j)) continue;
      genes[j] = { facultyId: fj.id, roomId: ri.id, slotId: si };
      return out(name(j) + " moved into " + ri.name + " at " + slotLabel(si) + ", where " + name(i) + " already meets.");
    }
    return { error: "Needs two laboratory classes; none could share a lab without other problems." };
  }
  if (kind === "unqualified") {
    for (const j of idx) for (const f of faculty) {
      const sj = genes[j].slotId;
      if (qualified(f, j) || !free(f, sj) || facBusy(f.id, sj, j)) continue;
      genes[j] = { ...genes[j], facultyId: f.id };
      return out(name(j) + " now taught by " + f.name + ", who does not have " + sections[j].requiredSpecialization + ".");
    }
    return { error: "Every teacher is qualified or busy." };
  }
  if (kind === "unavailable") {
    for (const j of idx) {
      if (!notFixed(j)) continue;
      const f = fById[genes[j].facultyId];
      if (!f) continue;
      const u = (f.unavailableSlotIds || []).find(sid => sid !== genes[j].slotId && !facBusy(f.id, sid, j) && !roomBusy(genes[j].roomId, sid, j));
      if (u == null) continue;
      genes[j] = { ...genes[j], slotId: u };
      return out(name(j) + " moved to " + slotLabel(u) + ", a time " + f.name + " marked unavailable.");
    }
    return { error: "No teacher has an unavailable time that a class could be moved into." };
  }
  if (kind === "capacity") {
    const maxCap = Math.max(0, ...rooms.map(r => r.capacity));
    for (const j of idx) {
      if (E.isOnline(sections[j])) continue;
      const sj = genes[j].slotId;
      const small = rooms.filter(r => r.capacity < sections[j].enrolledStudents && !roomBusy(r.id, sj, j));
      if (small.length) { genes[j] = { ...genes[j], roomId: small[0].id }; return out(name(j) + " (" + sections[j].enrolledStudents + " students) moved into " + small[0].name + ", which seats " + small[0].capacity + "."); }
    }
    // Every lab is big enough for every class: raise one class's enrollment above its lab's size
    // (still within the biggest lab, so "Update affected classes" can fix it).
    for (const j of idx) {
      if (E.isOnline(sections[j])) continue;
      const r = rById[genes[j].roomId];
      if (!r || r.capacity >= maxCap) continue;
      const newCount = Math.min(maxCap, r.capacity + 5);
      const secs = sections.map((s2, k) => k === j ? { ...s2, enrolledStudents: newCount } : s2);
      return out(name(j) + "'s enrollment raised to " + newCount + "; it stays in " + r.name + ", which seats " + r.capacity + ".", { sections: secs });
    }
    return { error: "Needs a laboratory class and labs of different sizes." };
  }
  if (kind === "roomType") {
    for (const j of idx) {
      if (!E.isOnline(sections[j])) continue;
      const r = rooms.find(r2 => !roomBusy(r2.id, genes[j].slotId, j));
      if (!r) continue;
      genes[j] = { ...genes[j], roomId: r.id };
      return out(name(j) + " is an online class but was given " + r.name + ".");
    }
    return { error: "No online class with a free lab at its time." };
  }
  if (kind === "fixed") {
    for (const j of idx) {
      if (!notFixed(j)) continue;
      const f = fById[genes[j].facultyId];
      // Pin it to a time its teacher could actually make, so an update can fix it.
      const target = timeSlots.find(t => t.id !== genes[j].slotId && f && free(f, t.id) && !facBusy(f.id, t.id, j));
      if (!target) continue;
      const secs = sections.map((s2, k) => k === j ? { ...s2, fixedSlotId: target.id } : s2);
      return out(name(j) + " is now fixed to " + slotLabel(target.id) + " but is still scheduled at " + slotLabel(genes[j].slotId) + ".", { sections: secs });
    }
    return { error: "No class could be pinned to another time." };
  }
  if (kind === "overload") {
    const loads = faculty.map(f => ({ f, u: genes.reduce((a, g, i) => g.facultyId === f.id && sections[i] ? a + sections[i].units : a, 0) })).filter(x => x.u >= 3);
    if (!loads.length) return { error: "No teacher has at least 3 units." };
    const top = loads.sort((a, b) => b.u - a.u)[0];
    const fac2 = faculty.map(f => f.id === top.f.id ? { ...f, maxUnits: top.u - 1 } : f);
    return out(top.f.name + "'s maximum lowered to " + (top.u - 1) + " units; they teach " + top.u + ". (Overload shows on Workload and Departments; it is not counted as a conflict.)", { faculty: fac2 });
  }
  return { error: "Unknown conflict type: " + kind };
}

/* ---------------------------------------------------------------------
   4. SAVING & LOADING
   All app data is stored in the browser under one key. try/catch is used
   because some browsers (private mode, storage full) can refuse access —
   in that case the app simply keeps working without saving.
   --------------------------------------------------------------------- */
function loadState() {
  try {
    const raw = localStorage.getItem("schedwiseai_prototype_v1");
    if (raw) return JSON.parse(raw);
  } catch (e) { console.warn("localStorage read failed", e); }
  return null;
}
function saveState(data) {
  try { localStorage.setItem("schedwiseai_prototype_v1", JSON.stringify(data)); }
  catch (e) { console.warn("localStorage write failed", e); }
}

// freshData(): creates a brand-new sample dataset (9 faculty, 18 sections, 6 rooms)
// with a random seed, used on first visit and by "Reset Demo Data".
function freshData(kind) {
  const seed = 100 + Math.floor(Math.random() * 900);
  // "expanded" = the larger multi-program sample (BSIT, BSCS, BSIS; about 22 faculty,
  // 48 subjects, 10 labs). Anything else = the standard sample (9 faculty, 18 subjects, 6 labs).
  const d = kind === "expanded" ? E.generateExpandedData(seed) : E.generateSyntheticData(9, 18, 6, seed);
  return { faculty: d.faculty, rooms: d.rooms, sections: d.sections, timeSlots: d.timeSlots, result: null, datasetKind: kind === "expanded" ? "expanded" : "standard" };
}

/* ---------------------------------------------------------------------
   5. FORM BUILDING BLOCKS
   --------------------------------------------------------------------- */

// Modal: a pop-up dialog. Clicking the dark background closes it;
// clicking inside the white box does not (stopPropagation).
function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      {/* max-h + overflow-y-auto: long forms scroll inside the pop-up instead of running off small screens.
          `wide` gives extra room for the weekly time picker. */}
      <div className={"bg-white rounded-2xl w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto " + (wide ? "max-w-3xl" : "max-w-md")}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg text-slate-900">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><IconX size={18}/></button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Field: a label placed above any input.
function Field({ label, children }) {
  return (
    <div className="mb-3">
      <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
      {children}
    </div>
  );
}
// Shared Tailwind CSS classes so every text box and dropdown looks the same.
const inputCls = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400";

// CheckboxGroup: a grid of checkboxes for picking several options
// (used for Specializations and Preferred Days).
function CheckboxGroup({ options, selected, onToggle, columns = 2 }) {
  return (
    <div className={"grid gap-1.5 " + (columns === 2 ? "grid-cols-2" : "grid-cols-1")}>
      {options.map(opt => (
        <label key={opt} className="flex items-center gap-2 text-sm text-slate-700 border border-slate-200 rounded-lg px-2.5 py-1.5 cursor-pointer hover:bg-slate-50">
          <input type="checkbox" checked={selected.includes(opt)} onChange={() => onToggle(opt)} className="accent-amber-500" />
          {opt}
        </label>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------------
   6. FORMS (MODALS)
   Each form keeps its own copy of the fields in local state while the
   user types. Nothing changes in the real data until "Save" is pressed,
   which calls onSave(...) with the finished record. If `initial` is
   given, the form is in "edit" mode and starts pre-filled.
   --------------------------------------------------------------------- */

// FacultyModal: add/edit a faculty member (specializations, preferred days,
// max units, employment status, academic rank).
function FacultyModal({ initial, onSave, onClose }) {
  const [name, setName] = useState(initial ? initial.name : "");
  const [specs, setSpecs] = useState(initial ? initial.specializations : ["Programming"]);
  const [maxUnits, setMaxUnits] = useState(initial ? initial.maxUnits : 21);
  const [preferredDays, setPreferredDays] = useState(initial ? initial.preferredDays : ["Mon", "Wed", "Fri"]);
  const [employmentStatus, setEmploymentStatus] = useState(initial ? initial.employmentStatus : E.EMPLOYMENT_STATUSES[0]);
  const [academicRank, setAcademicRank] = useState(initial ? initial.academicRank : E.ACADEMIC_RANKS[0]);

  function toggleSpec(s) {
    setSpecs(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  }
  function toggleDay(d) {
    setPreferredDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  }

  return (
    <Modal title={initial ? "Edit Faculty" : "Add Faculty"} onClose={onClose}>
      <Field label="Full Name">
        <input className={inputCls} value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Maria Santos" />
      </Field>
      <Field label="Specializations">
        <CheckboxGroup options={E.SPECIALIZATIONS} selected={specs} onToggle={toggleSpec} />
      </Field>
      <Field label="Preferred Days">
        <CheckboxGroup options={E.DAYS} selected={preferredDays} onToggle={toggleDay} columns={3} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Maximum Teaching Units">
          <input type="number" className={inputCls} value={maxUnits} onChange={e=>setMaxUnits(Number(e.target.value))} />
        </Field>
        <Field label="Employment Status">
          <select className={inputCls} value={employmentStatus} onChange={e=>setEmploymentStatus(e.target.value)}>
            {E.EMPLOYMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Academic Rank">
        <select className={inputCls} value={academicRank} onChange={e=>setAcademicRank(e.target.value)}>
          {E.ACADEMIC_RANKS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </Field>
      <button
        className="w-full bg-amber-400 hover:bg-amber-300 text-[#0b1d4a] font-medium text-sm py-2.5 rounded-lg mt-2"
        onClick={() => {
          if (!name.trim() || specs.length === 0) return;
          onSave({
            id: initial ? initial.id : Date.now(),
            name: name.trim(),
            specializations: specs,
            maxUnits,
            preferredDays,
            unavailableSlotIds: initial ? initial.unavailableSlotIds : [],
            employmentStatus,
            academicRank,
          });
          onClose();
        }}
      >Save</button>
    </Modal>
  );
}

// SectionModal: add/edit a subject section: school year, Major/Minor, academic
// year level, semester, class type (Online or Laboratory), an optional FIXED
// day/period (the AI must schedule it exactly then), and an optional prerequisite.
function SectionModal({ initial, allSections, onSave, onClose }) {
  const [subjectCode, setSubjectCode] = useState(initial ? initial.subjectCode : "");
  const [subjectName, setSubjectName] = useState(initial ? initial.subjectName : "");
  const [sectionName, setSectionName] = useState(initial ? initial.sectionName : "");
  const [units, setUnits] = useState(initial ? initial.units : 3);
  const [spec, setSpec] = useState(initial ? initial.requiredSpecialization : E.SPECIALIZATIONS[0]);
  const [roomType, setRoomType] = useState(initial ? initial.roomTypeRequired : "online");
  const [enrolled, setEnrolled] = useState(initial ? initial.enrolledStudents : 35);
  const [yearLevel, setYearLevel] = useState(initial ? initial.yearLevel : 1);
  const [semester, setSemester] = useState(initial ? initial.semester : "1st Semester");
  const [prerequisiteCode, setPrerequisiteCode] = useState(initial ? (initial.prerequisiteCode || "") : "");
  const [schoolYear, setSchoolYear] = useState(initial && initial.schoolYear ? initial.schoolYear : E.currentSchoolYear());
  const [category, setCategory] = useState(initial && initial.category ? initial.category : "Major");
  // Program (curriculum) this section belongs to. The list includes the sample programs
  // plus this subject's own program if it is something else.
  const [program, setProgram] = useState(initial && initial.program ? initial.program : "BSIT");
  const programOptions = Array.from(new Set(["BSIT", "BSCS", "BSIS"].concat(initial && initial.program ? [initial.program] : [])));
  // Fixed day/period is stored as ONE slot id; the form edits it as a day + a period.
  const allSlots = E.buildTimeSlots();
  const initialFixed = initial && initial.fixedSlotId != null ? allSlots.find(t => t.id === initial.fixedSlotId) : null;
  const [fixedDay, setFixedDay] = useState(initialFixed ? initialFixed.day : "");
  const [fixedPeriod, setFixedPeriod] = useState(initialFixed ? initialFixed.period : 1);
  // Year options: the standard list, plus this subject's own year if it's older/newer.
  const yearOptions = Array.from(new Set(E.schoolYearOptions().concat(initial && initial.schoolYear ? [initial.schoolYear] : [])));

  const uniqueSubjectCodes = Array.from(new Set((allSections || [])
    .map(s => s.subjectCode)
    .filter(code => !initial || code !== initial.subjectCode)));

  return (
    <Modal title={initial ? "Edit Subject" : "Add Subject"} onClose={onClose}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="School Year">
          <select className={inputCls} value={schoolYear} onChange={e=>setSchoolYear(e.target.value)}>
            {yearOptions.map(y => <option key={y} value={y}>SY {y}</option>)}
          </select>
        </Field>
        <Field label="Category">
          <select className={inputCls} value={category} onChange={e=>setCategory(e.target.value)}>
            <option value="Major">Major</option>
            <option value="Minor">Minor (e.g. GE, PE, NSTP)</option>
          </select>
        </Field>
      </div>
      <Field label="Program">
        <select className={inputCls} value={program} onChange={e=>setProgram(e.target.value)}>
          {programOptions.map(pr => <option key={pr} value={pr}>{pr}</option>)}
        </select>
      </Field>
      <Field label="Subject Code"><input className={inputCls} value={subjectCode} onChange={e=>setSubjectCode(e.target.value)} placeholder="IT101" /></Field>
      <Field label="Subject Name"><input className={inputCls} value={subjectName} onChange={e=>setSubjectName(e.target.value)} placeholder="Introduction to Computing" /></Field>
      <Field label="Section Name"><input className={inputCls} value={sectionName} onChange={e=>setSectionName(e.target.value)} placeholder="BSIT-2A" /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Units"><input type="number" className={inputCls} value={units} onChange={e=>setUnits(Number(e.target.value))} /></Field>
        <Field label="Enrolled Students"><input type="number" className={inputCls} value={enrolled} onChange={e=>setEnrolled(Number(e.target.value))} /></Field>
      </div>
      <Field label="Required Specialization">
        <select className={inputCls} value={spec} onChange={e=>setSpec(e.target.value)}>
          {E.SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </Field>
      <Field label="Class Type">
        <select className={inputCls} value={roomType} onChange={e=>setRoomType(e.target.value)}>
          <option value="online">Online (no room needed)</option>
          <option value="laboratory">Laboratory (on campus)</option>
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Academic Year Level">
          <select className={inputCls} value={yearLevel} onChange={e=>setYearLevel(Number(e.target.value))}>
            <option value={1}>1st Year</option>
            <option value={2}>2nd Year</option>
            <option value={3}>3rd Year</option>
            <option value={4}>4th Year</option>
          </select>
        </Field>
        <Field label="Semester">
          <select className={inputCls} value={semester} onChange={e=>setSemester(e.target.value)}>
            <option value="1st Semester">1st Semester</option>
            <option value="2nd Semester">2nd Semester</option>
          </select>
        </Field>
      </div>
      <Field label="Fixed Day & Period (optional)">
        <div className="grid grid-cols-2 gap-3">
          <select className={inputCls} value={fixedDay} onChange={e=>setFixedDay(e.target.value)}>
            <option value="">No fixed time</option>
            {E.DAYS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select className={inputCls} value={fixedPeriod} disabled={!fixedDay} onChange={e=>setFixedPeriod(Number(e.target.value))}>
            {allSlots.filter(t => t.day === "Mon").map(t => <option key={t.period} value={t.period}>P{t.period} ({t.label.split(" ")[1]})</option>)}
          </select>
        </div>
        {category === "Minor" && (
          <p className="text-xs text-slate-500 mt-1.5">If another department (e.g. General Education) sets this subject's time, enter it here. The AI will keep it there and schedule the majors around it.</p>
        )}
      </Field>
      <Field label="Prerequisite Subject (optional)">
        <select className={inputCls} value={prerequisiteCode} onChange={e=>setPrerequisiteCode(e.target.value)}>
          <option value="">None</option>
          {uniqueSubjectCodes.map(code => <option key={code} value={code}>{code}</option>)}
        </select>
      </Field>
      <button
        className="w-full bg-amber-400 hover:bg-amber-300 text-[#0b1d4a] font-medium text-sm py-2.5 rounded-lg mt-2"
        onClick={() => {
          if (!subjectCode.trim() || !sectionName.trim()) return;
          onSave({
            id: initial ? initial.id : Date.now(),
            subjectCode: subjectCode.trim(), subjectName: subjectName.trim(), sectionName: sectionName.trim(),
            units, requiredSpecialization: spec, roomTypeRequired: roomType, enrolledStudents: enrolled,
            yearLevel, semester, prerequisiteCode: prerequisiteCode || null,
            schoolYear, category, program,
            fixedSlotId: fixedDay ? allSlots.find(t => t.day === fixedDay && t.period === fixedPeriod).id : null,
          });
          onClose();
        }}
      >Save</button>
    </Modal>
  );
}

// RoomModal: add/edit a room. Since lecture classes are now held online, the
// only physical rooms the scheduler needs are laboratories, so every room
// is saved with type "laboratory".
function RoomModal({ initial, onSave, onClose }) {
  const [name, setName] = useState(initial ? initial.name : "");
  const type = "laboratory";
  const [capacity, setCapacity] = useState(initial ? initial.capacity : 40);
  return (
    <Modal title={initial ? "Edit Room" : "Add Room"} onClose={onClose}>
      <Field label="Room Name"><input className={inputCls} value={name} onChange={e=>setName(e.target.value)} placeholder="Room 305" /></Field>
      <Field label="Capacity"><input type="number" className={inputCls} value={capacity} onChange={e=>setCapacity(Number(e.target.value))} /></Field>
      <button
        className="w-full bg-amber-400 hover:bg-amber-300 text-[#0b1d4a] font-medium text-sm py-2.5 rounded-lg mt-2"
        onClick={() => {
          if (!name.trim()) return;
          onSave({ id: initial ? initial.id : Date.now(), name: name.trim(), type, capacity });
          onClose();
        }}
      >Save</button>
    </Modal>
  );
}

// AssignmentModal: manual edit of ONE scheduled class after generation.
// The dropdowns only offer qualified faculty and valid rooms for that section,
// so an admin can't accidentally assign an unqualified teacher.
// "Remove" unschedules the class (stored as -1 in the engine).
function AssignmentModal({ assignment, faculty, rooms, sections, timeSlots, onSave, onDelete, onClose }) {
  const sec = sections[assignment.index];
  const qualifiedFacultyIds = E.qualifiedFaculty(faculty, sec);
  const validRoomIds = E.validRooms(rooms, sec);
  const [facultyId, setFacultyId] = useState(assignment.gene.facultyId);
  const [roomId, setRoomId] = useState(E.isOnline(sec) ? E.ONLINE_ROOM_ID : assignment.gene.roomId);
  const [slotId, setSlotId] = useState(assignment.gene.slotId);

  return (
    <Modal title={"Edit Assignment — " + sec.subjectCode + " " + sec.sectionName} onClose={onClose}>
      <Field label="Faculty">
        <select className={inputCls} value={facultyId} onChange={e=>setFacultyId(Number(e.target.value))}>
          {qualifiedFacultyIds.length === 0 && <option value={-1}>No qualified faculty available</option>}
          {faculty.filter(f => qualifiedFacultyIds.includes(f.id)).map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
      </Field>
      <Field label="Room">
        {E.isOnline(sec) ? (
          <div className="text-sm text-slate-700 border border-slate-200 rounded-lg px-3 py-2 bg-slate-50">Online class — no room needed</div>
        ) : (
          <select className={inputCls} value={roomId} onChange={e=>setRoomId(Number(e.target.value))}>
            {validRoomIds.length === 0 && <option value={-1}>No valid room available</option>}
            {rooms.filter(r => validRoomIds.includes(r.id)).map(r => <option key={r.id} value={r.id}>{r.name} ({r.capacity} seats)</option>)}
          </select>
        )}
      </Field>
      <Field label="Time Slot">
        {sec.fixedSlotId != null ? (
          <div className="text-sm text-slate-700 border border-slate-200 rounded-lg px-3 py-2 bg-slate-50">
            📌 Fixed: {(timeSlots.find(t => t.id === sec.fixedSlotId) || {}).label} — change it in Subjects
          </div>
        ) : (
        <select className={inputCls} value={slotId} onChange={e=>setSlotId(Number(e.target.value))}>
          {/* Slots the chosen teacher marked unavailable are labelled, so the admin can avoid them. */}
          {timeSlots.map(t => {
            const fac = faculty.find(f => f.id === facultyId);
            const blocked = fac && (fac.unavailableSlotIds || []).includes(t.id);
            return <option key={t.id} value={t.id}>{t.label}{blocked ? " — teacher unavailable" : ""}</option>;
          })}
        </select>
        )}
      </Field>
      <div className="flex gap-2 mt-2">
        <button
          className="flex-1 bg-amber-400 hover:bg-amber-300 text-[#0b1d4a] font-medium text-sm py-2.5 rounded-lg"
          onClick={() => { onSave(assignment.index, { facultyId, roomId, slotId }); onClose(); }}
        >Save Changes</button>
        <button
          className="px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 font-medium text-sm py-2.5 rounded-lg"
          onClick={() => { onDelete(assignment.index); onClose(); }}
        >Remove</button>
      </div>
    </Modal>
  );
}

// FacultyProfileModal: read-only profile card (rank, status, specializations,
// preferred days, unavailable times, and current load from the live schedule).
function FacultyProfileModal({ faculty, sections, result, slotById, onClose }) {
  const assignedUnits = result
    ? result.genes.reduce((sum, g, i) => g.facultyId === faculty.id ? sum + sections[i].units : sum, 0)
    : 0;
  const loadPct = Math.round((assignedUnits / faculty.maxUnits) * 100);
  return (
    <Modal title="Faculty Profile" onClose={onClose}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-amber-400 flex items-center justify-center text-[#0b1d4a] font-semibold text-lg shrink-0">
          {faculty.name.split(" ").map(p=>p[0]).slice(0,2).join("")}
        </div>
        <div>
          <div className="font-semibold text-slate-900">{faculty.name}</div>
          <div className="text-xs text-slate-400">{faculty.academicRank || "—"}</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm mb-3">
        <div><div className="text-xs text-slate-400 mb-0.5">Employment Status</div><div className="font-medium text-slate-800">{faculty.employmentStatus || "—"}</div></div>
        <div><div className="text-xs text-slate-400 mb-0.5">Academic Rank</div><div className="font-medium text-slate-800">{faculty.academicRank || "—"}</div></div>
        <div><div className="text-xs text-slate-400 mb-0.5">Max Units</div><div className="font-medium text-slate-800">{faculty.maxUnits}</div></div>
        <div><div className="text-xs text-slate-400 mb-0.5">Current Load</div><div className="font-medium text-slate-800">{assignedUnits} units ({loadPct}%)</div></div>
      </div>
      <div className="mb-3">
        <div className="text-xs text-slate-400 mb-1">Specializations</div>
        <div className="flex flex-wrap gap-1.5">
          {faculty.specializations.map(s => (
            <span key={s} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium">{s}</span>
          ))}
        </div>
      </div>
      <div>
        <div className="text-xs text-slate-400 mb-1">Preferred Days</div>
        <div className="flex flex-wrap gap-1.5">
          {faculty.preferredDays.map(d => (
            <span key={d} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full font-medium">{d}</span>
          ))}
        </div>
      </div>
      <div className="mt-3">
        <div className="text-xs text-slate-400 mb-1">Unavailable Times</div>
        <div className="text-sm text-slate-700">{(faculty.unavailableSlotIds || []).length ? describeSlots(faculty.unavailableSlotIds, slotById) : "None"}</div>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------
// SlotPicker — the weekly day-and-period picker.
// Shows Mon–Sat × periods 1–6 (plus a greyed-out Sunday column, since no
// classes run on Sunday). Each cell can show:
//   • grey  "Unavailable" — already blocked from an earlier approved request
//   • rose  "Requested"   — selected in THIS request (click to toggle)
//   • a blue subject code — the teacher currently has a class at that time
// Clicking a day's name selects/clears that whole day.
// ---------------------------------------------------------------------
function SlotPicker({ timeSlots, selected, onToggle, onToggleDay, unavailable, classSlots }) {
  const periods = Array.from({ length: E.PERIODS }, (_, i) => i + 1);
  // slotAt["Fri"][4] -> the slot object for Friday period 4
  const slotAt = {};
  timeSlots.forEach(t => { (slotAt[t.day] = slotAt[t.day] || {})[t.period] = t; });
  return (
    <div className="overflow-x-auto">
      <table className="text-xs border-collapse w-full min-w-[560px]">
        <thead><tr>
          <th className="p-1.5 text-slate-400 font-medium text-left w-24">Period</th>
          {E.CALENDAR_DAYS.map(d => (
            <th key={d} className="p-1.5 font-medium">
              {d === "Sun" ? <span className="text-slate-300">Sun</span> : (
                <button type="button" onClick={() => onToggleDay(d)} title={"Select / clear all of " + d}
                  className="text-slate-600 hover:text-blue-800 underline decoration-dotted">{d}</button>
              )}
            </th>
          ))}
        </tr></thead>
        <tbody>
          {periods.map(p => {
            const anySlot = slotAt["Mon"][p];
            const time = anySlot ? anySlot.label.split(" ")[1] : "";
            return (
              <tr key={p}>
                <td className="p-1.5 text-slate-500 whitespace-nowrap"><span className="font-semibold">P{p}</span> <span className="text-slate-400">{time}</span></td>
                {E.CALENDAR_DAYS.map(d => {
                  if (d === "Sun") return <td key={d} className="p-0.5"><div className="h-10 rounded bg-slate-100" title="No classes on Sunday" /></td>;
                  const t = slotAt[d][p];
                  const isBlocked = unavailable.includes(t.id);
                  const isSel = selected.includes(t.id);
                  const cls = classSlots[t.id];
                  let look = "bg-white border-slate-200 hover:bg-rose-50 cursor-pointer";
                  if (isBlocked) look = "bg-slate-200 border-slate-300 text-slate-600 cursor-not-allowed";
                  else if (isSel) look = "bg-rose-600 border-rose-600 text-white cursor-pointer";
                  return (
                    <td key={d} className="p-0.5">
                      <button type="button" disabled={isBlocked} onClick={() => onToggle(t.id)}
                        className={"w-full h-10 rounded border text-[10px] leading-tight font-medium " + look}
                        aria-label={t.label + (isSel ? " selected" : "")}>
                        {isBlocked ? "Unavailable" : isSel ? "Requested" : ""}
                        {cls && <div className={isSel ? "text-white" : "text-blue-800"}>{cls.join(", ")}</div>}
                      </button>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="flex flex-wrap gap-3 mt-2 text-[11px] text-slate-500">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-rose-600 inline-block" /> Requested</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-slate-200 inline-block" /> Already unavailable</span>
        <span className="flex items-center gap-1"><span className="text-blue-800 font-semibold">IT101</span> Current class</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// AvailabilityRequestModal — request an Availability Change or Leave by
// picking time slots on the weekly grid.
//   Availability Change = a lasting change to the teacher's weekly hours.
//   Leave Request       = temporary; once approved the slots are blocked
//                         until an admin/chair presses "End Leave".
// If lockedFacultyId is set (Faculty role) the request is for that person
// only; otherwise a dropdown lets an admin file on someone's behalf.
// Nothing changes until an Admin/Chair approves — see handleRequestDecision in App().
// ---------------------------------------------------------------------
function AvailabilityRequestModal({ faculty, lockedFacultyId, timeSlots, sections, result, onSave, onClose }) {
  const locked = lockedFacultyId != null;
  const [facultyId, setFacultyId] = useState(locked ? lockedFacultyId : (faculty[0] ? faculty[0].id : null));
  const [type, setType] = useState("Availability Change");
  const [description, setDescription] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [slotIds, setSlotIds] = useState([]);
  const [error, setError] = useState("");

  const fac = faculty.find(f => f.id === facultyId);
  const unavailable = fac ? (fac.unavailableSlotIds || []) : [];

  // Which slots this teacher currently teaches in, so they can see what a request would affect.
  const classSlots = {};
  if (result) result.genes.forEach((g, i) => {
    if (g.facultyId === facultyId && g.slotId >= 0) (classSlots[g.slotId] = classSlots[g.slotId] || []).push(sections[i].subjectCode);
  });
  const affected = slotIds.filter(id => classSlots[id]).length;

  function toggle(id) {
    setSlotIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : prev.concat([id]));
  }
  // Whole-day toggle: if every open slot that day is already picked, clear them; otherwise pick them all.
  function toggleDay(day) {
    const daySlots = timeSlots.filter(t => t.day === day && !unavailable.includes(t.id)).map(t => t.id);
    const allPicked = daySlots.every(id => slotIds.includes(id));
    setSlotIds(prev => allPicked ? prev.filter(id => !daySlots.includes(id)) : Array.from(new Set(prev.concat(daySlots))));
  }
  const slotById = Object.fromEntries(timeSlots.map(t => [t.id, t]));

  return (
    <Modal title="Request Availability Change / Leave" onClose={onClose} wide>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Faculty Member">
          {locked ? (
            <div className="text-sm font-medium text-slate-800 border border-slate-200 rounded-lg px-3 py-2 bg-slate-50">{fac ? fac.name : "—"}</div>
          ) : (
            <select className={inputCls} value={facultyId} onChange={e => { setFacultyId(Number(e.target.value)); setSlotIds([]); }}>
              {faculty.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          )}
        </Field>
        <Field label="Request Type">
          <select className={inputCls} value={type} onChange={e => setType(e.target.value)}>
            <option>Availability Change</option>
            <option>Leave Request</option>
          </select>
        </Field>
      </div>
      {type === "Leave Request" && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Leave from"><input type="date" className={inputCls} value={dateFrom} onChange={e => setDateFrom(e.target.value)} /></Field>
          <Field label="Leave until"><input type="date" className={inputCls} value={dateTo} onChange={e => setDateTo(e.target.value)} /></Field>
        </div>
      )}
      <Field label={type === "Leave Request" ? "Times you'll be away (click cells, or a day name for the whole day)" : "Times you can no longer teach (click cells, or a day name for the whole day)"}>
        <SlotPicker timeSlots={timeSlots} selected={slotIds} onToggle={toggle} onToggleDay={toggleDay}
          unavailable={unavailable} classSlots={classSlots} />
      </Field>
      <div className="text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-2 mb-3">
        <span className="font-semibold">Selected:</span> {describeSlots(slotIds, slotById)}
        {affected > 0 && <div className="text-orange-700 mt-1">{affected} of these time(s) currently have a class. If approved, the schedule will be flagged for regeneration.</div>}
      </div>
      <Field label="Reason">
        <textarea className={inputCls} rows={2} value={description} onChange={e => setDescription(e.target.value)}
          placeholder={type === "Leave Request" ? "e.g. Attending a conference" : "e.g. New Friday afternoon admin duties"} />
      </Field>
      {error && <div className="text-xs text-rose-700 mb-2">{error}</div>}
      <button
        className="w-full bg-amber-400 hover:bg-amber-300 text-[#0b1d4a] font-medium text-sm py-2.5 rounded-lg mt-1"
        onClick={() => {
          if (facultyId == null) return setError("Choose a faculty member.");
          if (slotIds.length === 0) return setError("Pick at least one time slot on the grid.");
          if (!description.trim()) return setError("Please give a reason.");
          onSave({
            id: Date.now(), facultyId, type, description: description.trim(),
            slotIds: slotIds.slice().sort((a, b) => a - b),
            dateFrom: type === "Leave Request" ? dateFrom : "", dateTo: type === "Leave Request" ? dateTo : "",
            status: "Pending", createdAt: new Date().toISOString(),
          });
          onClose();
        }}
      >Submit Request</button>
    </Modal>
  );
}

// validateCurriculumSequence(sections)
// Checks prerequisites: a subject's prerequisite must be offered in an
// EARLIER term. Terms are turned into a single number so they can be
// compared: order = yearLevel × 2 + (0 for 1st sem, 1 for 2nd sem).
// e.g. Year 2 1st Sem = 4, Year 2 2nd Sem = 5, Year 3 1st Sem = 6.
function validateCurriculumSequence(sections) {
  // Flags cases where a subject's declared prerequisite is not actually scheduled
  // in an earlier year level + semester than the subject that depends on it.
  const bySubjectCode = {};
  sections.forEach(s => { bySubjectCode[s.subjectCode] = s; });
  const order = (s) => s.yearLevel * 2 + (s.semester === "2nd Semester" ? 1 : 0);
  const issues = [];
  sections.forEach(s => {
    if (!s.prerequisiteCode) return;
    const prereq = bySubjectCode[s.prerequisiteCode];
    if (!prereq) {
      issues.push({ section: s, text: s.subjectCode + " (" + s.sectionName + ") requires prerequisite " + s.prerequisiteCode + ", which is not in the curriculum." });
    } else if (order(prereq) >= order(s)) {
      issues.push({ section: s, text: s.subjectCode + " (Year " + s.yearLevel + ", " + s.semester + ") lists " + prereq.subjectCode + " as a prerequisite, but it is scheduled in Year " + prereq.yearLevel + ", " + prereq.semester + " — not earlier." });
    }
  });
  return issues;
}

// CSVImportModal: bulk-add faculty, subjects, or rooms by pasting CSV text.
// Columns are matched by header NAME (not position), so column order doesn't
// matter. Multi-value fields use semicolons, e.g. "Programming;Databases".
function CSVImportModal({ kind, onImportFaculty, onImportSections, onImportRooms, onClose }) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  const templates = {
    faculty: "name,specializations,maxUnits,preferredDays,employmentStatus,academicRank\nJuan Dela Cruz,\"Programming;Databases\",21,\"Mon;Wed;Fri\",Full-time,Instructor I",
    subjects: "program,schoolYear,category,subjectCode,subjectName,sectionName,units,requiredSpecialization,classType,enrolledStudents,yearLevel,semester,fixedDay,fixedPeriod\nBSIT," + E.currentSchoolYear() + ",Major,IT103,Web Systems,BSIT-2A,3,Web Development,laboratory,35,2,1st Semester,,\nBSIT," + E.currentSchoolYear() + ",Minor,NSTP1,National Service Training Program 1,BSIT-1A,3,General Education,online,40,1,1st Semester,Sat,1",
    rooms: "name,capacity\nLab 210,40",
  };

  function handleImport() {
    try {
      const { headers, rows } = parseCSV(text);
      if (rows.length === 0) { setError("No data rows found."); return; }
      // Find a column by its header name, so column order in the CSV doesn't matter.
      const idx = (name) => headers.indexOf(name);

      if (kind === "faculty") {
        const records = rows.map((r, i) => ({
          id: Date.now() + i,
          name: r[idx("name")] || "Unnamed",
          specializations: (r[idx("specializations")] || "").split(";").map(s=>s.trim()).filter(Boolean),
          maxUnits: Number(r[idx("maxUnits")]) || 21,
          preferredDays: (r[idx("preferredDays")] || "Mon;Wed;Fri").split(";").map(s=>s.trim()).filter(Boolean),
          unavailableSlotIds: [],
          employmentStatus: r[idx("employmentStatus")] || E.EMPLOYMENT_STATUSES[0],
          academicRank: r[idx("academicRank")] || E.ACADEMIC_RANKS[0],
        }));
        onImportFaculty(records);
      } else if (kind === "subjects") {
        const records = rows.map((r, i) => ({
          id: Date.now() + i,
          subjectCode: r[idx("subjectCode")] || ("NEW" + i),
          subjectName: r[idx("subjectName")] || "",
          sectionName: r[idx("sectionName")] || "",
          units: Number(r[idx("units")]) || 3,
          requiredSpecialization: r[idx("requiredSpecialization")] || E.SPECIALIZATIONS[0],
          // Accepts a "classType" (or older "roomTypeRequired") column. Anything that isn't
          // "laboratory" — including the old value "lecture" — is treated as online.
          roomTypeRequired: ((r[idx("classType")] || r[idx("roomTypeRequired")] || "online").trim().toLowerCase() === "laboratory") ? "laboratory" : "online",
          enrolledStudents: Number(r[idx("enrolledStudents")]) || 35,
          yearLevel: Number(r[idx("yearLevel")]) || 1,
          semester: r[idx("semester")] || "1st Semester",
          prerequisiteCode: null,
          schoolYear: r[idx("schoolYear")] || E.currentSchoolYear(),
          program: (r[idx("program")] || "").trim() || ((r[idx("sectionName")] || "").split("-")[0] || "BSIT"),
          category: (r[idx("category")] || "").trim().toLowerCase() === "minor" ? "Minor" : "Major",
          // fixedDay + fixedPeriod (e.g. "Sat", 1) -> the matching slot id; blank = no fixed time.
          fixedSlotId: (() => {
            const day = (r[idx("fixedDay")] || "").trim(), per = Number(r[idx("fixedPeriod")]);
            const hit = day && per ? E.buildTimeSlots().find(t => t.day.toLowerCase() === day.slice(0, 3).toLowerCase() && t.period === per) : null;
            return hit ? hit.id : null;
          })(),
        }));
        onImportSections(records);
      } else if (kind === "rooms") {
        const records = rows.map((r, i) => ({
          id: Date.now() + i,
          name: r[idx("name")] || ("Room " + i),
          type: "laboratory",
          capacity: Number(r[idx("capacity")]) || 40,
        }));
        onImportRooms(records);
      }
      onClose();
    } catch (e) {
      setError("Could not parse CSV: " + e.message);
    }
  }

  return (
    <Modal title={"Bulk Import — " + kind} onClose={onClose}>
      <p className="text-xs text-slate-500 mb-2">Paste CSV data below (comma-separated, first row = headers). Use semicolons to separate multiple values within a single field, e.g. specializations.</p>
      <Field label="CSV Data">
        <textarea className={inputCls} rows={6} value={text} onChange={e=>setText(e.target.value)} placeholder={templates[kind]} />
      </Field>
      <button className="text-xs text-blue-800 hover:underline mb-3" onClick={() => setText(templates[kind])}>Load example template</button>
      {error && <div className="text-xs text-rose-700 mb-2">{error}</div>}
      <button className="w-full bg-amber-400 hover:bg-amber-300 text-[#0b1d4a] font-medium text-sm py-2.5 rounded-lg" onClick={handleImport}>Import</button>
    </Modal>
  );
}

/* ---------------------------------------------------------------------
   7. LOGIN & NOTIFICATIONS
   --------------------------------------------------------------------- */

// LoginScreen: prototype sign-in. The user types a name and picks a role.
// There is intentionally no password — this is a respondent-testing build.
function LoginScreen({ onLogin }) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("admin");
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#eef1f8] px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 w-full max-w-sm">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-10 h-10 rounded-xl bg-amber-400 flex items-center justify-center">
            <IconCalendar size={20} className="text-[#0b1d4a]" />
          </div>
          <div>
            <div className="font-semibold text-slate-900 text-lg leading-tight">SchedWiseAI</div>
            <div className="text-slate-400 text-xs leading-tight">World Citi Colleges</div>
          </div>
        </div>
        <Field label="Full Name">
          <input className={inputCls} value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Alex Dela Cruz" />
        </Field>
        <Field label="Sign in as">
          <select className={inputCls} value={role} onChange={e=>setRole(e.target.value)}>
            {ROLES.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
          </select>
        </Field>
        <button
          className="w-full bg-amber-400 hover:bg-amber-300 text-[#0b1d4a] font-medium text-sm py-2.5 rounded-lg mt-2"
          onClick={() => onLogin(name.trim() || "Alex Dela Cruz", role)}
        >Sign In</button>
        <p className="text-xs text-slate-400 mt-4 text-center">This is a prototype — any name works, no password required.</p>
      </div>
    </div>
  );
}

// NotificationPanel: the drop-down list under the bell icon.
// Clicking one marks it read; "Mark all read" clears the badge.
function NotificationPanel({ notifications, onMarkRead, onMarkAllRead, onClose }) {
  return (
    <div className="absolute right-0 top-11 w-80 bg-white rounded-xl shadow-xl border border-slate-100 z-50 max-h-96 overflow-y-auto">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <span className="font-semibold text-sm text-slate-900">Notifications</span>
        <button onClick={onMarkAllRead} className="text-xs text-blue-800 hover:underline">Mark all read</button>
      </div>
      {notifications.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-slate-400">No notifications yet.</div>
      ) : (
        <div className="divide-y divide-slate-50">
          {notifications.map(n => (
            <div key={n.id} onClick={() => onMarkRead(n.id)}
              className={"px-4 py-3 text-sm cursor-pointer hover:bg-slate-50 " + (n.read ? "opacity-60" : "")}>
              <div className="flex items-start gap-2">
                {!n.read && <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />}
                <div>
                  <div className="text-slate-800">{n.message}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{new Date(n.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------
   8. CHARTS & CARDS
   Charts are drawn by hand as SVG (no chart library needed).
   --------------------------------------------------------------------- */

// StatCard: a small box with a label and a big number.
function StatCard({ label, value, sub, color }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
      <div className="text-slate-400 text-xs font-medium mb-1">{label}</div>
      <div className="text-2xl font-bold" style={{ color: color || "#0f172a" }}>{value}</div>
      {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------
// ConvergenceChart — the AI's learning curve for one run.
//   Gold line  (LEFT scale):  score of the BEST schedule in each generation.
//   Blue line  (RIGHT scale): AVERAGE score of all candidate schedules.
// Each line has its OWN vertical scale. The average starts far below zero
// (random candidates full of conflicts), which would otherwise flatten the
// best line so its improvement couldn't be seen.
// Axis numbers come from niceTicks(), which picks round values (0, 10, 20...).
// ---------------------------------------------------------------------

// niceTicks(min, max, count): about `count` evenly spaced round numbers that
// cover min..max, e.g. niceTicks(24.8, 44.1, 4) -> [20, 25, 30, 35, 40, 45].
function niceTicks(min, max, count) {
  if (!isFinite(min) || !isFinite(max)) return [0, 1];
  if (min === max) { const pad = Math.abs(min) * 0.1 || 1; min -= pad; max += pad; }
  const rough = (max - min) / Math.max(1, count);
  const mag = Math.pow(10, Math.floor(Math.log10(rough)));
  const step = [1, 2, 2.5, 5, 10].map(m => m * mag).find(st => st >= rough);
  const start = Math.floor(min / step) * step, end = Math.ceil(max / step) * step;
  const ticks = [];
  for (let v = start; v <= end + step * 1e-9; v += step) ticks.push(Math.round(v * 1e6) / 1e6);
  return ticks;
}

// Score as text: typographic minus, thousands separators, "k" for big numbers
// on the axes (e.g. −1,269.7 in text, −1.2k on an axis).
function fmtScore(v, compact) {
  const sign = v < 0 ? "−" : "";
  const a = Math.abs(v);
  if (compact && a >= 1000) return sign + (a / 1000).toFixed(a >= 10000 ? 0 : 1).replace(/\.0$/, "") + "k";
  if (compact) return sign + a.toLocaleString("en-US", { maximumFractionDigits: 2 });   // axis ticks such as 4.75
  const r = Math.round(a * 10) / 10;
  return sign + (Number.isInteger(r) ? r.toLocaleString("en-US") : r.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 }));
}

// useElementWidth(fallback): returns [ref, width] — the live pixel width of the
// element `ref` is attached to (it updates when the window is resized). Used so
// the chart is drawn at its real size: a fixed, compact height, with text that
// stays the same readable size on any screen.
function useElementWidth(fallback) {
  const ref = useRef(null);
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setWidth(el.clientWidth || fallback);
    update();
    if (typeof ResizeObserver === "undefined") {   // (fallback is a constant, so it is safe in the deps below)      // very old browsers: fall back to window resize
      window.addEventListener("resize", update);
      return () => window.removeEventListener("resize", update);
    }
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [fallback]);
  return [ref, width];
}

function ConvergenceChart({ convergence, height }) {
  const [boxRef, boxWidth] = useElementWidth(640);
  if (!convergence || convergence.length === 0) return null;
  const W = Math.max(280, boxWidth), H = height || 150;   // compact: 150 px tall by default
  const L = 44, R = 46, T = 8, B = 22;                    // margins for the axis numbers
  const n = convergence.length;
  const best = convergence.map(c => c.best), avg = convergence.map(c => c.avg);
  const bT = niceTicks(Math.min(...best), Math.max(...best), 3);
  const aT = niceTicks(Math.min(...avg), Math.max(...avg), 3);
  const bMin = bT[0], bMax = bT[bT.length - 1], aMin = aT[0], aMax = aT[aT.length - 1];
  const plotW = W - L - R, plotH = H - T - B;
  // generation index -> x pixel; score -> y pixel on its own scale (SVG y grows downward).
  const x = i => L + (n === 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const yB = v => T + (1 - (v - bMin) / (bMax - bMin)) * plotH;
  const yA = v => T + (1 - (v - aMin) / (aMax - aMin)) * plotH;
  const path = (vals, y) => vals.map((v, i) => (i === 0 ? "M" : "L") + x(i).toFixed(1) + "," + y(v).toFixed(1)).join(" ");
  // Generation ticks: whole numbers only, never past the last generation (fewer on narrow screens).
  const gT = niceTicks(0, Math.max(1, n - 1), W < 420 ? 3 : 5).filter(g => Number.isInteger(g) && g <= n - 1);
  // Colours: gold line (3.6:1 on white; lines need 3:1), deeper gold for gold TEXT (4.9:1; text needs 4.5:1).
  const GOLD = "#b7791f", GOLD_TEXT = "#a16207", BLUE = "#2563eb", INK = "#475569";
  return (
    <div ref={boxRef} className="w-full">
      <svg width={W} height={H} viewBox={"0 0 " + W + " " + H} role="img" className="block"
        aria-label={"Line chart of best and average fitness over " + n + " generations"}>
        {bT.map(t => <line key={"g" + t} x1={L} x2={W - R} y1={yB(t)} y2={yB(t)} stroke="#eef2f7" strokeWidth="1" />)}
        {bT.map(t => <text key={"b" + t} x={L - 6} y={yB(t) + 4} textAnchor="end" fontSize="11" fill={GOLD_TEXT}>{fmtScore(t, true)}</text>)}
        {aT.map(t => <text key={"a" + t} x={W - R + 6} y={yA(t) + 4} textAnchor="start" fontSize="11" fill={BLUE}>{fmtScore(t, true)}</text>)}
        <line x1={L} x2={W - R} y1={T + plotH} y2={T + plotH} stroke="#cbd5e1" />
        {gT.map(g => (
          <g key={"x" + g}>
            <line x1={x(g)} x2={x(g)} y1={T + plotH} y2={T + plotH + 4} stroke="#cbd5e1" />
            <text x={x(g)} y={T + plotH + 16} textAnchor="middle" fontSize="11" fill={INK}>{g}</text>
          </g>
        ))}
        <path d={path(avg, yA)} fill="none" stroke={BLUE} strokeWidth="1.75" opacity="0.85" />
        <path d={path(best, yB)} fill="none" stroke={GOLD} strokeWidth="2.5" />
        <circle cx={x(0)} cy={yB(best[0])} r="3" fill={GOLD} />
        <circle cx={x(n - 1)} cy={yB(best[n - 1])} r="3" fill={GOLD} />
      </svg>
    </div>
  );
}

// ChartLegend: the small key shown in the chart card's header.
function ChartLegend() {
  return (
    <span className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
      <span className="flex items-center gap-1.5"><span className="inline-block w-5 h-[3px] rounded" style={{ background: "#b7791f" }} />Best schedule (left scale)</span>
      <span className="flex items-center gap-1.5"><span className="inline-block w-5 h-[2px] rounded" style={{ background: "#2563eb" }} />Average of all candidates (right scale)</span>
      <span className="text-slate-500">Bottom: generation</span>
    </span>
  );
}

// ConvergenceCaption: a one-line summary of the run, plus a "How to read this
// chart" toggle with the full explanation (kept closed to save space).
function ConvergenceCaption({ result }) {
  const [open, setOpen] = useState(false);
  const c = result.convergence || [];
  if (c.length === 0) return null;
  const maxGen = result.settings && result.settings.generations;
  const f = c[0], l = c[c.length - 1];
  return (
    <div className="mt-2 text-xs text-slate-600 space-y-1.5">
      <p>
        <span className="font-semibold text-slate-800">Best:</span> {fmtScore(f.best)} → {fmtScore(l.best)}
        <span className="text-slate-400"> · </span>
        <span className="font-semibold text-slate-800">Average:</span> {fmtScore(f.avg)} → {fmtScore(l.avg)}
        <span className="text-slate-400"> · </span>
        {maxGen && c.length < maxGen
          ? "Stopped early at generation " + l.generation + " of " + maxGen + ", because the best score had stopped improving."
          : "Ran " + c.length + " generation" + (c.length === 1 ? "" : "s") + (maxGen ? " (the maximum)" : "") + "."}
        {" "}
        <button onClick={() => setOpen(v => !v)} aria-expanded={open} className="text-blue-800 hover:underline font-medium">
          {open ? "Hide explanation" : "How to read this chart"}
        </button>
      </p>
      {open && (
        <p>
          The AI scores every candidate schedule; <span className="font-semibold">higher is better</span>. Each broken rule
          (for example a double-booked teacher) costs 1,000 points, so scores far below 0 mean conflicts. The gold line is the best
          schedule in each generation. The blue line is the average of all candidates, which starts low and rises as the AI learns.
          The two lines use <span className="font-semibold">different scales</span> (left and right).
        </p>
      )}
      {result.kind === "update" && (
        <p className="text-slate-500">This was an update: only the {result.updateSummary ? result.updateSummary.moved : ""} moved class(es) were re-optimized; every other class was locked.</p>
      )}
    </div>
  );
}

// BarChart: simple vertical bars. `data` is [{ label, value }].
// Bars are scaled so the tallest value fills the chart height.
function BarChart({ data, colorFn, maxOverride }) {
  const w = 600, h = 220, pad = 36;
  const maxV = maxOverride || Math.max(...data.map(d => d.value), 1);
  const bw = (w - 2*pad) / data.length;
  return (
    <svg viewBox={"0 0 " + w + " " + h} className="w-full h-56">
      <line x1={pad} y1={h-pad} x2={w-pad} y2={h-pad} stroke="#e2e8f0" />
      {data.map((d, i) => {
        const barH = (d.value / maxV) * (h - 2*pad - 10);
        const x = pad + i*bw + bw*0.15;
        const bw2 = bw*0.7;
        return (
          <g key={i}>
            <rect x={x} y={h-pad-barH} width={bw2} height={barH} rx="3" fill={colorFn ? colorFn(d) : "#1e3a8a"} />
            <text x={x+bw2/2} y={h-pad+14} fontSize="9" fill="#64748b" textAnchor="middle">{d.label}</text>
            <text x={x+bw2/2} y={h-pad-barH-4} fontSize="9" fill="#0f172a" textAnchor="middle" fontWeight="600">{d.value}</text>
          </g>
        );
      })}
    </svg>
  );
}

/* =====================================================================
   9. App() — THE MAIN COMPONENT
   ---------------------------------------------------------------------
   Holds ALL of the app's data (faculty, rooms, sections, the current
   schedule, requests, notifications, history...) and all the actions that
   change it. Every page component receives just the pieces it needs as
   props. The page shown is chosen by the `page` state value.
   ===================================================================== */
function App() {
  // On startup: use saved data if it exists, otherwise generate sample data.
  // normalizeData() upgrades anything saved by an older version (see its comment).
  const saved = loadState();
  const init = normalizeData(saved || freshData());

  // ---- Core data ----
  const [faculty, setFaculty] = useState(init.faculty);
  const [rooms, setRooms] = useState(init.rooms);
  const [sections, setSections] = useState(init.sections);
  const [timeSlots] = useState(init.timeSlots);   // Mon–Sat × 6 periods (from normalizeData)
  const [result, setResult] = useState(init.result);      // the CURRENT schedule (output of the GA), or null
  const [role, setRole] = useState(init.role || "admin"); // which role is signed in
  const [page, setPage] = useState("dashboard");          // which page is on screen

  // ---- UI state (which pop-up is open, which tab is selected, etc.) ----
  const [generating, setGenerating] = useState(false);
  const [facultyModal, setFacultyModal] = useState(null);
  const [sectionModal, setSectionModal] = useState(null);
  const [roomModal, setRoomModal] = useState(null);
  const [scheduleTab, setScheduleTab] = useState("grid");
  const [selectedFacultyId, setSelectedFacultyId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // ---- Feature data (the `|| []` fallbacks keep older saved data working) ----
  const [leaveRequests, setLeaveRequests] = useState(init.leaveRequests || []);
  const [curriculumAware, setCurriculumAware] = useState(init.curriculumAware || false);
  const [facultyProfileModal, setFacultyProfileModal] = useState(null);
  const [assignmentModal, setAssignmentModal] = useState(null);
  const [leaveRequestModal, setLeaveRequestModal] = useState(false);
  const [facultyTab, setFacultyTab] = useState("list");
  const [notifications, setNotifications] = useState(init.notifications || []);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [scheduleHistory, setScheduleHistory] = useState(init.scheduleHistory || []);
  const [loggedIn, setLoggedIn] = useState(init.loggedIn || false);
  const [userName, setUserName] = useState(init.userName || "Alex Dela Cruz");
  const [csvImportKind, setCsvImportKind] = useState(null);
  const [datasetKind, setDatasetKind] = useState(init.datasetKind || "standard");   // which sample is loaded
  const [testLog, setTestLog] = useState([]);                                         // results of test-conflict buttons
  const [activityLog, setActivityLog] = useState(init.activityLog || []);   // import/export log (IT overview)
  const [chairDept, setChairDept] = useState(init.chairDept || "All");       // department filter (Chair overview)
  const [leaveRequestLockedTo, setLeaveRequestLockedTo] = useState(null);    // faculty id a request form is locked to

  // Save everything to the browser whenever any of these values change.

  useEffect(() => {
    saveState({ faculty, rooms, sections, timeSlots, result, role, leaveRequests, curriculumAware, notifications, scheduleHistory, loggedIn, userName, activityLog, chairDept, datasetKind });
  }, [faculty, rooms, sections, timeSlots, result, role, leaveRequests, curriculumAware, notifications, scheduleHistory, loggedIn, userName, activityLog, chairDept, datasetKind]);

  // Adds an entry to the import/export activity log (newest first, max 30 kept).
  function logActivity(kind, detail) {
    setActivityLog(prev => [{ id: Date.now() + Math.random(), kind, detail, timestamp: new Date().toISOString() }, ...prev].slice(0, 30));
  }

  // Listen for the "schedwise:export" event fired by downloadCSV(), so every
  // CSV export from any page is recorded — without each page needing extra code.
  // The returned function removes the listener if App is ever unmounted.
  useEffect(() => {
    function onExport(e) { logActivity("Export", e.detail.filename + " (" + e.detail.rows + " rows)"); }
    window.addEventListener("schedwise:export", onExport);
    return () => window.removeEventListener("schedwise:export", onExport);
  }, []);

  // Sidebar items this role may see (RBAC). If the role changes and the current
  // page isn't allowed anymore, jump to the first allowed page.
  const visibleNav = NAV_ITEMS.filter(n => n.roles.includes(role));
  // Runs ONLY when the role changes (on purpose), so it can't fight normal navigation.
  // Settings lives in the Account menu, not NAV_ITEMS, and every role may open it.
  useEffect(() => {
    if (page !== "settings" && !visibleNav.find(n => n.key === page)) setPage(visibleNav[0].key);
  }, [role]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep the matching history entry in sync with the live schedule, so approvals and
  // manual edits are preserved when a version is restored later.
  useEffect(() => {
    if (result && result.id) {
      setScheduleHistory(prev => prev.map(h => (h.id === result.id ? result : h)));
    }
  }, [result]);

  // Adds a new unread notification to the top of the bell list.
  // Math.random() is added to the id so two notifications in the same
  // millisecond still get unique ids.
  function pushNotification(message) {
    setNotifications(prev => [{ id: Date.now() + Math.random(), message, timestamp: new Date().toISOString(), read: false }, ...prev]);
  }

  // ------------------------------------------------------------------
  // handleGenerate: runs the AI Optimization Engine.
  //  1. Shows "Generating..." (the short setTimeout lets the screen redraw
  //     before the heavy calculation blocks the browser).
  //  2. Runs E.runGA and times it with performance.now().
  //  3. Stamps the result with an id, timestamp, "Pending Review" status,
  //     run time, and settings — these feed Approval, History, and IT views.
  //  4. Saves it as the current schedule AND at the top of history (max 20).
  // ------------------------------------------------------------------
  function handleGenerate() {
    setGenerating(true);
    setTimeout(() => {
      const settings = { generations: 140, popSize: 50, curriculumAware };
      const t0 = performance.now();
      const r = E.runGA(faculty, rooms, sections, timeSlots, settings);
      const elapsedMs = Math.round(performance.now() - t0);
      const stamped = { ...r, id: Date.now(), generatedAt: new Date().toISOString(), approvalStatus: "Pending Review", approvalComment: "",
        elapsedMs, settings: { generations: settings.generations, popSize: settings.popSize }, kind: "full" };
      setResult(stamped);
      setScheduleHistory(prev => [stamped, ...prev].slice(0, 20));
      setGenerating(false);
      setPage("schedules");
      pushNotification(
        stamped.feasible
          ? "New schedule generated — fully conflict-free, awaiting approval."
          : "New schedule generated with " + stamped.violations.total + " unresolved conflict(s)."
      );
    }, 60);
  }

  // ------------------------------------------------------------------
  // handleUpdateSchedule: UPDATE only the classes that now break a rule
  // (after approved availability/leave, a new subject, or a fixed time).
  // Uses E.repairSchedule, so every class that is still valid stays exactly
  // where it is. Afterwards it checks that each approved "blocked times"
  // request is actually respected, and records exactly what moved.
  // ------------------------------------------------------------------
  function handleUpdateSchedule() {
    if (!result) return;
    setGenerating(true);
    setTimeout(() => {
      const t0 = performance.now();
      const r = E.repairSchedule(faculty, rooms, sections, timeSlots, result.genes, { curriculumAware, generations: 100, popSize: 40 });
      const elapsedMs = Math.round(performance.now() - t0);
      const triggers = (result.needsRegeneration && result.needsRegeneration.triggers) || [];
      const honoured = triggers.filter(t => t.kind === "blocked").map(t => {
        const fac = faculty.find(f => f.id === t.facultyId);
        const clashes = r.genes.filter(g => g.facultyId === t.facultyId && t.slotIds.includes(g.slotId)).length;
        return { name: fac ? fac.name : "Faculty", slots: describeSlots(t.slotIds, slotById), clashes };
      });
      setGenerating(false);
      if (r.changes.length === 0) {
        // Nothing had to move (e.g. a leave ended): keep this version, just clear the flag.
        setResult({ ...result, violations: r.violations, feasible: r.feasible, needsRegeneration: null });
        pushNotification("Schedule checked — no classes needed to move.");
        return;
      }
      const stamped = { ...r, id: Date.now(), generatedAt: new Date().toISOString(), approvalStatus: "Pending Review", approvalComment: "",
        elapsedMs, settings: { generations: 100, popSize: 40 }, kind: "update",
        updateSummary: { changes: r.changes, moved: r.changes.length, unchanged: r.genes.length - r.changes.length,
          shifted: r.shiftedToMakeRoom || 0, honoured, reasons: triggers.map(t => t.reason) } };
      setResult(stamped);
      setScheduleHistory(prev => [stamped, ...prev].slice(0, 20));
      setPage("schedules");
      pushNotification("Schedule updated: " + r.changes.length + " class(es) moved, " + (r.genes.length - r.changes.length) + " unchanged.");
    }, 60);
  }

  // Save a subject (add or edit). If a schedule exists and this change means
  // some class must be (re)placed — a new subject, a new fixed time, a new
  // requirement — the schedule is flagged so it can be updated.
  function handleSaveSection(sec, isNew) {
    const next = isNew ? [...sections, sec] : sections.map(x => x.id === sec.id ? sec : x);
    setSections(next);
    if (!result) return;
    const padded = result.genes.concat(next.slice(result.genes.length).map(() => ({ facultyId: -1, roomId: -1, slotId: -1, isNew: true })));
    const affected = E.findConflictingIndices(faculty, rooms, next, timeSlots, padded).size;
    if (affected > 0) {
      flagForUpdate(faculty, next, { kind: "subject",
        reason: isNew ? "New subject " + sec.subjectCode + " (" + sec.sectionName + ") needs to be placed."
          : sec.subjectCode + " (" + sec.sectionName + ") changed — " + affected + " class(es) need re-placing." });
    }
  }

  // Delete a subject. A schedule stores classes BY POSITION (genes[i] belongs to
  // sections[i]), so the matching gene must be removed too — otherwise every
  // class after it would shift onto the wrong subject.
  function handleDeleteSection(id) {
    const k = sections.findIndex(x => x.id === id);
    if (k < 0) return;
    const next = sections.filter(x => x.id !== id);
    setSections(next);
    const dropK = (res) => (res && res.genes && res.genes.length > k) ? { ...res, genes: res.genes.filter((_, i) => i !== k), updateSummary: null } : res;
    if (result) {
      const r2 = dropK(result);
      const violations = E.countViolations(faculty, rooms, next, timeSlots, r2.genes);
      setResult({ ...r2, violations, feasible: violations.total === 0 });
    }
    setScheduleHistory(prev => prev.map(dropK));
  }

  // Manual edit of one class. Arrays in state must not be changed in place,
  // so we copy the genes, change one entry, then re-run the rule checker.
  // Any edit sends the schedule back to "Pending Review".
  function handleEditAssignment(index, newGene) {
    if (!result) return;
    const newGenes = result.genes.slice();
    newGenes[index] = newGene;
    const violations = E.countViolations(faculty, rooms, sections, timeSlots, newGenes);
    setResult({ ...result, genes: newGenes, violations, feasible: violations.total === 0, approvalStatus: "Pending Review" });
  }

  // Manual removal of one class: mark it -1 ("unscheduled") and re-check rules.
  function handleDeleteAssignment(index) {
    if (!result) return;
    const newGenes = result.genes.slice();
    newGenes[index] = { facultyId: -1, roomId: -1, slotId: -1 };
    const violations = E.countViolations(faculty, rooms, sections, timeSlots, newGenes);
    setResult({ ...result, genes: newGenes, violations, feasible: violations.total === 0, approvalStatus: "Pending Review" });
  }

  // Approve / Reject the current schedule (Admin & Chair only; the buttons
  // aren't shown to other roles). Also sends a notification.
  function handleApprovalDecision(status, comment) {
    if (!result) return;
    setResult({ ...result, approvalStatus: status, approvalComment: comment || "" });
    pushNotification("Schedule " + (status === "Approved" ? "approved" : "rejected") + (comment ? " — \"" + comment + "\"" : "") + ".");
  }

  // Make an older saved version the current schedule again.
  function handleRestoreHistory(entry) {
    // Re-check the old version against TODAY's data (e.g. availability may have
    // changed since it was generated), so its conflict count is accurate.
    const violations = E.countViolations(faculty, rooms, sections, timeSlots, entry.genes);
    entry = { ...entry, violations, feasible: violations.total === 0 };
    setResult(entry);
    pushNotification("Restored schedule from " + new Date(entry.generatedAt).toLocaleString() + ".");
    setPage("schedules");
  }

  // ------------------------------------------------------------------
  // AVAILABILITY / LEAVE REQUESTS
  // ------------------------------------------------------------------

  // A new request was submitted from the picker. It stays "Pending" and
  // changes nothing until an Admin or Chair decides on it.
  function handleSubmitRequest(req) {
    setLeaveRequests(prev => [req, ...prev]);
    const fac = faculty.find(f => f.id === req.facultyId);
    pushNotification("New " + req.type.toLowerCase() + " from " + (fac ? fac.name : "faculty") + ": " + describeSlots(req.slotIds, slotById) + ".");
  }

  // After a teacher's availability changes, the current schedule may now put
  // them in a class at a time they can't teach. This re-counts conflicts with
  // the updated teacher list, flags the schedule as needing regeneration, and
  // sends it back to "Pending Review" so it gets looked at again.
  // `trigger` = { kind, reason, facultyId?, slotIds? } describing WHY. Triggers
  // pile up until the next update, so several approvals can be handled at once,
  // and the update can then confirm each blocked-times request was respected.
  function flagForUpdate(nextFaculty, nextSections, trigger) {
    if (!result) return;
    const violations = E.countViolations(nextFaculty, rooms, nextSections, timeSlots, result.genes);
    const prev = result.needsRegeneration;
    const triggers = ((prev && prev.triggers) || []).concat([trigger]);
    setResult({ ...result, violations, feasible: violations.total === 0, approvalStatus: "Pending Review",
      needsRegeneration: { reason: trigger.reason, triggers, at: new Date().toISOString() } });
  }

  // Approve or deny a request (Admin/Chair). On APPROVAL the requested slots
  // are added to the teacher's unavailableSlotIds — the same list the AI
  // engine reads — so the next generated schedule avoids those times.
  // `addedSlotIds` remembers which slots THIS request added, so a leave can
  // be undone precisely later without touching other blocked times.
  function handleRequestDecision(id, status) {
    const req = leaveRequests.find(r => r.id === id);
    if (!req) return;
    const fac = faculty.find(f => f.id === req.facultyId);
    let addedSlotIds = [];
    if (status === "Approved" && fac) {
      const current = fac.unavailableSlotIds || [];
      addedSlotIds = (req.slotIds || []).filter(sid => !current.includes(sid));
      const updatedFaculty = faculty.map(f => f.id === fac.id ? { ...f, unavailableSlotIds: current.concat(addedSlotIds) } : f);
      setFaculty(updatedFaculty);
      // How many of this teacher's current classes now fall in a blocked slot?
      const clashes = result ? result.genes.filter(g => g.facultyId === fac.id && addedSlotIds.includes(g.slotId)).length : 0;
      flagForUpdate(updatedFaculty, sections, {
        kind: "blocked", facultyId: fac.id, slotIds: req.slotIds || [],
        reason: fac.name + "'s availability changed (" + describeSlots(addedSlotIds, slotById) + ")" +
          (clashes ? " — " + clashes + " current class(es) now clash." : "."),
      });
    }
    setLeaveRequests(prev => prev.map(r => r.id === id ? { ...r, status, addedSlotIds, decidedAt: new Date().toISOString() } : r));
    pushNotification(req.type + " for " + (fac ? fac.name : "faculty") + " was " + status.toLowerCase() +
      (status === "Approved" ? " — schedule needs an update." : "."));
  }

  // End an approved leave early/on time: remove ONLY the slots that leave added,
  // then flag the schedule so the teacher can be given classes in those times again.
  function handleEndLeave(id) {
    const req = leaveRequests.find(r => r.id === id);
    if (!req) return;
    const fac = faculty.find(f => f.id === req.facultyId);
    if (fac) {
      const remove = req.addedSlotIds || [];
      const updatedFaculty = faculty.map(f => f.id === fac.id
        ? { ...f, unavailableSlotIds: (f.unavailableSlotIds || []).filter(sid => !remove.includes(sid)) } : f);
      setFaculty(updatedFaculty);
      flagForUpdate(updatedFaculty, sections, {
        kind: "freed", facultyId: fac.id, slotIds: remove,
        reason: fac.name + " is back from leave (" + describeSlots(remove, slotById) + " available again).",
      });
    }
    setLeaveRequests(prev => prev.map(r => r.id === id ? { ...r, status: "Ended" } : r));
    pushNotification("Leave ended for " + (fac ? fac.name : "faculty") + " — schedule can be updated.");
  }

  // Opens the picker. lockedId = the only faculty member the request may be for
  // (used for the Faculty role). Faculty always file from their schedule page.
  function openRequestPicker(lockedId) {
    setLeaveRequestLockedTo(lockedId == null ? null : lockedId);
    setLeaveRequestModal(true);
    if (lockedId != null) { setScheduleTab("faculty"); setPage("schedules"); }
  }

  // Replace all data with a fresh sample dataset (asks for confirmation first).
  // Replace all data with fresh sample data (asks for confirmation first).
  // `kind` = "standard" or "expanded"; the sidebar's Reset keeps whichever sample is loaded.
  function resetDemoData(kind) {
    const k = kind === "expanded" || kind === "standard" ? kind : datasetKind;
    const label = k === "expanded" ? "the expanded multi-program sample (about 22 faculty, 48 subjects, 10 labs)" : "the standard sample (9 faculty, 18 subjects, 6 labs)";
    if (!confirm("Replace all data with " + label + "? This clears faculty, subjects, rooms, requests, history and the current schedule.")) return;
    const d = freshData(k);
    setFaculty(d.faculty); setRooms(d.rooms); setSections(d.sections); setResult(null); setLeaveRequests([]); setScheduleHistory([]); setActivityLog([]);
    setDatasetKind(k); setTestLog([]);
    pushNotification("Loaded " + (k === "expanded" ? "the expanded multi-program sample." : "the standard sample."));
  }

  // Testing tools: deliberately add a conflict (or all of them) to the current schedule.
  // The result is recounted, sent back to "Pending Review", and flagged so testers can
  // try "Update affected classes" on it. Each step is logged and notified.
  function handleCreateTestConflict(kind) {
    if (!result) return;
    const kinds = kind === "all" ? TEST_CONFLICT_KINDS.map(k => k[0]) : [kind];
    let data = { faculty, rooms, sections, timeSlots, genes: result.genes };
    const messages = [];
    kinds.forEach(k => {
      const res = makeTestConflict(k, data);
      const label = (TEST_CONFLICT_KINDS.find(x => x[0] === k) || [k, k])[1];
      if (res.error) { messages.push({ ok: false, text: label + ": skipped. " + res.error }); return; }
      data = { ...data, genes: res.genes, sections: res.sections, faculty: res.faculty };
      messages.push({ ok: true, text: label + ": " + res.message });
    });
    if (messages.some(m => m.ok)) {
      if (data.sections !== sections) setSections(data.sections);
      if (data.faculty !== faculty) setFaculty(data.faculty);
      const violations = E.countViolations(data.faculty, rooms, data.sections, timeSlots, data.genes);
      const prev = result.needsRegeneration;
      const trigger = { kind: "test", reason: "Test conflicts were added (" + messages.filter(m => m.ok).length + ")." };
      setResult({ ...result, genes: data.genes, violations, feasible: violations.total === 0, approvalStatus: "Pending Review", updateSummary: null,
        needsRegeneration: { reason: trigger.reason, triggers: ((prev && prev.triggers) || []).concat([trigger]), at: new Date().toISOString() } });
      pushNotification("Test conflict(s) added: " + messages.filter(m => m.ok).length + ". Conflicts now: " + violations.total + ".");
      logActivity("Test", messages.filter(m => m.ok).length + " test conflict(s) added");
    }
    setTestLog(prev => messages.concat(prev).slice(0, 20));
  }

  // Lookup tables: find a faculty member / room / time slot by id instantly.
  const facultyById = Object.fromEntries(faculty.map(f => [f.id, f]));
  const roomById = Object.fromEntries(rooms.map(r => [r.id, r]));
  const slotById = Object.fromEntries(timeSlots.map(t => [t.id, t]));

  const roleLabel = ROLES.find(r => r.key === role).label;
  // Who "I" am when signed in as Faculty: the faculty record whose name matches
  // the login name; if none matches (it's a prototype), the first faculty member.
  const myFaculty = faculty.find(f => f.name === userName) || faculty[0] || null;
  const currentUserName = role === "faculty" && myFaculty ? myFaculty.name : userName;
  const unreadCount = notifications.filter(n => !n.read).length;

  // Change page and close the mobile sidebar.
  function goToPage(key) {
    setPage(key);
    setSidebarOpen(false);
  }

  // Not signed in yet → show only the login screen.
  if (!loggedIn) {
    return <LoginScreen onLogin={(name, r) => { setUserName(name); setRole(r); setLoggedIn(true); }} />;
  }

  return (
    <div className="flex min-h-screen">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={
        "no-print w-64 shrink-0 bg-[#0b1d4a] flex flex-col justify-between py-5 h-screen fixed md:sticky top-0 left-0 z-50 " +
        "transition-transform duration-200 ease-in-out " +
        (sidebarOpen ? "translate-x-0" : "-translate-x-full") + " md:translate-x-0"
      }>
        <div className="overflow-y-auto">
          <div className="flex items-center justify-between px-5 pb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-400 flex items-center justify-center shrink-0">
                <IconCalendar size={18} className="text-[#0b1d4a]" />
              </div>
              <div>
                <div className="text-white font-semibold text-[15px] leading-tight">SchedWiseAI</div>
                <div className="text-slate-400 text-[11px] leading-tight">World Citi Colleges</div>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-white p-1">
              <IconX size={18} />
            </button>
          </div>

          <div className="px-5 pb-2 pt-2 text-[11px] tracking-wide text-slate-500 font-medium">Workspace</div>
          <nav className="px-3 space-y-0.5">
            {visibleNav.map(item => {
              const Icon2 = item.icon;
              const active = page === item.key;
              const badge = item.key === "conflicts" && result && !result.feasible ? result.violations.total : null;
              return (
                <button key={item.key} onClick={() => goToPage(item.key)}
                  className={"w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors " +
                    (active ? "bg-white/10 text-white border-l-2 border-amber-400 pl-3" : "text-slate-400 hover:text-white hover:bg-white/5")}>
                  <Icon2 size={17} className={active ? "text-amber-400" : ""} />
                  <span className="flex-1 text-left">{item.label}</span>
                  {badge ? <span className="bg-rose-600 text-white text-[10px] font-semibold rounded-full w-5 h-5 flex items-center justify-center">{badge}</span> : null}
                </button>
              );
            })}
          </nav>

          <div className="px-5 pb-2 pt-6 text-[11px] tracking-wide text-slate-500 font-medium">Account</div>
          <nav className="px-3 space-y-0.5">
            <button onClick={() => resetDemoData()} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5">
              <IconRefresh size={17} /><span>Reset Demo Data</span>
            </button>
            <button onClick={() => goToPage("settings")} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5">
              <IconSettings size={17} /><span>Settings</span>
            </button>
            <button onClick={() => { setLoggedIn(false); setSidebarOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5">
              <IconLogOut size={17} /><span>Sign Out</span>
            </button>
          </nav>
        </div>

        <div className="mx-3 px-2 shrink-0">
          <div className="text-[10px] uppercase tracking-wide text-slate-500 mb-1.5 px-1">Viewing as</div>
          <select value={role} onChange={e => setRole(e.target.value)}
            className="w-full bg-white/5 border border-white/10 text-white text-xs rounded-lg px-2 py-2 mb-2 focus:outline-none">
            {ROLES.map(r => <option key={r.key} value={r.key} className="text-slate-900">{r.label}</option>)}
          </select>
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg bg-white/5">
            <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center text-[#0b1d4a] font-semibold text-xs shrink-0">
              {currentUserName.split(" ").map(p=>p[0]).slice(0,2).join("")}
            </div>
            <div className="min-w-0">
              <div className="text-white text-[13px] font-medium leading-tight truncate">{currentUserName}</div>
              <div className="text-slate-400 text-[11px] leading-tight truncate">{roleLabel}</div>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="no-print bg-white border-b border-slate-100 px-4 sm:px-8 py-3.5 flex items-center gap-3 sm:gap-4">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden shrink-0 w-9 h-9 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center">
            <IconMenu size={18} className="text-slate-600" />
          </button>
          <div className="flex-1 relative max-w-xl min-w-0">
            <IconSearch size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input readOnly placeholder="Search faculty, subjects, rooms..."
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm placeholder:text-slate-400 focus:outline-none" />
          </div>
          <div className="relative shrink-0">
            <button onClick={() => setNotificationsOpen(o => !o)} aria-label="Notifications"
              className="relative w-9 h-9 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center">
              <IconBell size={16} className="text-slate-500" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[10px] font-semibold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">{unreadCount}</span>
              )}
            </button>
            {notificationsOpen && (
              <NotificationPanel notifications={notifications}
                onMarkRead={id => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))}
                onMarkAllRead={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
                onClose={() => setNotificationsOpen(false)} />
            )}
          </div>
          <div className="text-right hidden lg:block shrink-0">
            <div className="text-slate-900 text-sm font-semibold leading-tight">This is a prototype</div>
            <div className="text-slate-400 text-[12px] leading-tight">Data is local to your browser</div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6">

          {page === "dashboard" && (
            <DashboardPage role={role} userName={currentUserName}
              faculty={faculty} rooms={rooms} sections={sections} result={result} slotById={slotById}
              generating={generating} onGenerate={handleGenerate}
              leaveRequests={leaveRequests} notifications={notifications} scheduleHistory={scheduleHistory}
              activityLog={activityLog} myFaculty={myFaculty}
              chairDept={chairDept} setChairDept={setChairDept}
              onNavigate={goToPage}
              onOpenRequests={() => { setFacultyTab("requests"); goToPage("faculty"); }}
              onUpdateSchedule={handleUpdateSchedule}
              onApprovalDecision={handleApprovalDecision}
              onUpdateRequestStatus={handleRequestDecision}
              onNewRequest={openRequestPicker}
            />
          )}

          {page === "faculty" && (
            <FacultyPage faculty={faculty} sections={sections} result={result} role={role}
              leaveRequests={leaveRequests}
              onImport={() => setCsvImportKind("faculty")}
              tab={facultyTab} setTab={setFacultyTab}
              onAdd={() => setFacultyModal("new")}
              onEdit={f => setFacultyModal(f)}
              onDelete={id => setFaculty(faculty.filter(f=>f.id!==id))}
              onViewProfile={f => setFacultyProfileModal(f)}
              onViewSchedule={f => { setSelectedFacultyId(f.id); setScheduleTab("faculty"); setPage("schedules"); }}
              onNewRequest={() => openRequestPicker(null)}
              onUpdateRequestStatus={handleRequestDecision}
              onEndLeave={handleEndLeave}
              slotById={slotById}
            />
          )}

          {page === "workload" && <WorkloadPage faculty={faculty} sections={sections} result={result} slotById={slotById} roomById={roomById} />}

          {page === "subjects" && (
            <SubjectsPage sections={sections}
              onImport={() => setCsvImportKind("subjects")}
              onAdd={() => setSectionModal("new")}
              onEdit={s => setSectionModal(s)}
              onDelete={handleDeleteSection}
            />
          )}

          {page === "rooms" && (
            <RoomsPage rooms={rooms}
              onImport={() => setCsvImportKind("rooms")}
              onAdd={() => setRoomModal("new")}
              onEdit={r => setRoomModal(r)}
              onDelete={id => setRooms(rooms.filter(r=>r.id!==id))}
            />
          )}

          {page === "departments" && <DepartmentsPage faculty={faculty} sections={sections} result={result} />}

          {page === "schedules" && (
            <SchedulesPage result={result} sections={sections} facultyById={facultyById} roomById={roomById}
              slotById={slotById} timeSlots={timeSlots} generating={generating} onGenerate={handleGenerate}
              tab={scheduleTab} setTab={setScheduleTab} role={role} faculty={faculty} rooms={rooms}
              selectedFacultyId={selectedFacultyId} setSelectedFacultyId={setSelectedFacultyId}
              curriculumAware={curriculumAware} setCurriculumAware={setCurriculumAware}
              onEditAssignment={(index, gene) => setAssignmentModal({ index, gene })}
              onApprovalDecision={handleApprovalDecision}
              onUpdateSchedule={handleUpdateSchedule}
              myFacultyId={myFaculty ? myFaculty.id : null}
              leaveRequests={leaveRequests}
              onNewRequest={openRequestPicker}
            />
          )}

          {page === "history" && (
            <HistoryPage history={scheduleHistory} currentId={result ? result.id : null} onRestore={handleRestoreHistory} />
          )}

          {page === "conflicts" && <ConflictsPage result={result} onGenerate={handleGenerate} generating={generating} />}

          {page === "reports" && <ReportsPage faculty={faculty} rooms={rooms} sections={sections} result={result} slotById={slotById} />}

          {page === "settings" && (
            <SettingsPage role={role} hasSchedule={!!result} datasetKind={datasetKind}
              violationsTotal={result ? result.violations.total : 0}
              onLoadDataset={resetDemoData} onCreateTestConflict={handleCreateTestConflict}
              testLog={testLog} onGoTo={goToPage} />
          )}

        </main>
      </div>

      {facultyModal && (
        <FacultyModal initial={facultyModal === "new" ? null : facultyModal}
          onSave={f => setFaculty(facultyModal === "new" ? [...faculty, f] : faculty.map(x=>x.id===f.id?f:x))}
          onClose={() => setFacultyModal(null)} />
      )}
      {sectionModal && (
        <SectionModal initial={sectionModal === "new" ? null : sectionModal} allSections={sections}
          onSave={s => handleSaveSection(s, sectionModal === "new")}
          onClose={() => setSectionModal(null)} />
      )}
      {roomModal && (
        <RoomModal initial={roomModal === "new" ? null : roomModal}
          onSave={r => setRooms(roomModal === "new" ? [...rooms, r] : rooms.map(x=>x.id===r.id?r:x))}
          onClose={() => setRoomModal(null)} />
      )}
      {facultyProfileModal && (
        <FacultyProfileModal faculty={facultyProfileModal} sections={sections} result={result} slotById={slotById}
          onClose={() => setFacultyProfileModal(null)} />
      )}
      {assignmentModal && (
        <AssignmentModal assignment={assignmentModal} faculty={faculty} rooms={rooms} sections={sections} timeSlots={timeSlots}
          onSave={handleEditAssignment} onDelete={handleDeleteAssignment} onClose={() => setAssignmentModal(null)} />
      )}
      {leaveRequestModal && (
        <AvailabilityRequestModal faculty={faculty} lockedFacultyId={leaveRequestLockedTo}
          timeSlots={timeSlots} sections={sections} result={result}
          onSave={handleSubmitRequest}
          onClose={() => setLeaveRequestModal(false)} />
      )}
      {csvImportKind && (
        <CSVImportModal kind={csvImportKind}
          onImportFaculty={recs => { setFaculty([...faculty, ...recs]); pushNotification("Imported " + recs.length + " faculty record(s)."); logActivity("Import", recs.length + " faculty record(s)"); }}
          onImportSections={recs => {
            const next = [...sections, ...recs];
            setSections(next);
            pushNotification("Imported " + recs.length + " subject record(s).");
            logActivity("Import", recs.length + " subject record(s)");
            // Imported subjects aren't in the current schedule yet, so flag it for an update.
            if (result) flagForUpdate(faculty, next, { kind: "subject", reason: recs.length + " imported subject(s) need to be placed." });
          }}
          onImportRooms={recs => { setRooms([...rooms, ...recs]); pushNotification("Imported " + recs.length + " room record(s)."); logActivity("Import", recs.length + " room record(s)"); }}
          onClose={() => setCsvImportKind(null)} />
      )}
    </div>
  );
}

/* =====================================================================
   10. OVERVIEW (DASHBOARD) PAGE — ROLE-SPECIFIC
   ---------------------------------------------------------------------
   The Overview page is the first thing a user sees after signing in.
   Instead of one generic page, each role gets its own version that
   surfaces the information that role actually acts on:

     Admin   -> approvals, leave requests, system-wide issues, load snapshot
     Chair   -> approval queue with quick actions, leave decisions inline,
                department-level workload (filterable by department)
     Faculty -> my classes this week, my load, my requests, preference match
     IT      -> AI engine performance, data health, room utilization,
                recent import/export activity

   DashboardPage below is only a "dispatcher": it looks at the current
   role and renders the matching overview component.
   ===================================================================== */

// Counts how many faculty fall into each workload status bucket.
// Re-uses loadStatusFor() so the labels match the Faculty/Workload pages exactly.
function computeLoadBuckets(faculty, sections, result) {
  const buckets = { "Overloaded": 0, "Near capacity": 0, "Balanced": 0, "Light load": 0, "Underloaded": 0, "No assignment yet": 0 };
  faculty.forEach(f => {
    const label = loadStatusFor(f, sections, result, faculty).label;
    buckets[label] = (buckets[label] || 0) + 1;
  });
  return buckets;
}

// Scans the raw data (before any schedule is generated) for records that would make
// scheduling impossible or unreliable. This is what the IT overview calls "data health".
function computeDataHealth(faculty, rooms, sections) {
  const problems = [];
  sections.forEach(s => {
    // A section nobody is qualified to teach can never be scheduled correctly.
    if (E.qualifiedFaculty(faculty, s).length === 0)
      problems.push(s.subjectCode + " (" + s.sectionName + ") has no qualified faculty for " + s.requiredSpecialization + ".");
    // A section with no room of the right type and size can never be placed.
    if (E.validRooms(rooms, s).length === 0)
      problems.push(s.subjectCode + " (" + s.sectionName + ") has no " + s.roomTypeRequired + " room that fits " + s.enrolledStudents + " students.");
  });
  faculty.forEach(f => {
    if (!f.specializations || f.specializations.length === 0) problems.push(f.name + " has no specializations listed.");
    if (!f.preferredDays || f.preferredDays.length === 0) problems.push(f.name + " has no preferred days set.");
  });
  // A fixed time that no qualified teacher is available for can never be met.
  const slotsById = Object.fromEntries(E.buildTimeSlots().map(t => [t.id, t]));
  sections.forEach(s => {
    if (s.fixedSlotId == null) return;
    const canTeach = faculty.filter(f => f.specializations.includes(s.requiredSpecialization) && !(f.unavailableSlotIds || []).includes(s.fixedSlotId));
    if (canTeach.length === 0)
      problems.push(s.subjectCode + " (" + s.sectionName + ") is fixed to " + describeSlots([s.fixedSlotId], slotsById) + ", but no qualified teacher is available then.");
  });
  // Prerequisite ordering problems (same check the Subjects page uses).
  validateCurriculumSequence(sections).forEach(iss => problems.push(iss.text));
  return problems;
}

// ---------- Small shared building blocks used by all four overviews ----------

// The coloured banner at the top of every overview. `children` holds the action buttons.
function OverviewHero({ eyebrow, title, subtitle, children }) {
  return (
    <section className="rounded-3xl overflow-hidden bg-gradient-to-br from-[#0b1d4a] via-[#13306e] to-[#1d4ed8] px-5 sm:px-10 py-7 sm:py-9">
      <span className="inline-flex items-center gap-1.5 bg-white/10 text-white text-xs font-medium px-3 py-1.5 rounded-full mb-4">
        <IconSparkles size={13} /> {eyebrow}
      </span>
      <h1 className="text-white font-bold text-2xl sm:text-3xl leading-tight mb-2">{title}</h1>
      <p className="text-slate-300 text-sm sm:text-[15px] leading-relaxed mb-5 max-w-2xl">{subtitle}</p>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </section>
  );
}

// A white card with a title row and an optional action (usually a "View all" link).
function Panel({ title, action, onAction, children }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-900 text-sm">{title}</h3>
        {action && <button onClick={onAction} className="text-xs font-medium text-blue-800 hover:underline">{action}</button>}
      </div>
      {children}
    </div>
  );
}

// Grey placeholder text for empty lists.
function EmptyNote({ children }) {
  return <div className="text-sm text-slate-400 py-4 text-center">{children}</div>;
}

// Coloured pill showing a schedule's approval status.
function ApprovalBadge({ status }) {
  const s = status || "Pending Review";
  const cls = s === "Approved" ? "bg-emerald-50 text-emerald-700" : s === "Rejected" ? "bg-rose-50 text-rose-700" : "bg-orange-50 text-orange-700";
  return <span className={"text-xs font-semibold px-2.5 py-1 rounded-full " + cls}>{s}</span>;
}

// The primary "Generate Schedule" button used in the hero of Admin, Chair, and IT overviews.
function GenerateButton({ generating, onGenerate }) {
  return (
    <button onClick={onGenerate} disabled={generating}
      className="bg-amber-400 text-[#0b1d4a] font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-amber-300 transition-colors disabled:opacity-60 flex items-center gap-2">
      <IconZap size={15} />{generating ? "Generating..." : "Generate Schedule"}
    </button>
  );
}

// Horizontal stacked bar showing how faculty are distributed across load statuses.
function LoadSnapshotBar({ buckets, total }) {
  const order = [
    ["Overloaded", "#e11d48"], ["Near capacity", "#f97316"], ["Balanced", "#10b981"],
    ["Light load", "#60a5fa"], ["Underloaded", "#94a3b8"], ["No assignment yet", "#cbd5e1"],
  ];
  return (
    <div>
      <div className="flex h-3 w-full rounded-full overflow-hidden bg-slate-100">
        {order.map(([label, color]) => buckets[label] > 0 && (
          <div key={label} style={{ width: (buckets[label] / Math.max(1, total)) * 100 + "%", background: color }} title={label + ": " + buckets[label]} />
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5 mt-3">
        {order.map(([label, color]) => (
          <div key={label} className="flex items-center gap-2 text-xs text-slate-600">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: color }} />
            {label}: <span className="font-semibold text-slate-900">{buckets[label] || 0}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Compact list of issue strings with a coloured dot per severity.
function IssueList({ issues, max = 5 }) {
  if (issues.length === 0) return <EmptyNote>No issues detected.</EmptyNote>;
  return (
    <ul className="space-y-1.5">
      {issues.slice(0, max).map((iss, i) => (
        <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
          <span className={"mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 " + (iss.severity === "high" ? "bg-rose-500" : "bg-orange-500")} />
          {iss.text}
        </li>
      ))}
      {issues.length > max && <li className="text-xs text-slate-400">+ {issues.length - max} more</li>}
    </ul>
  );
}

// ---------- ADMIN OVERVIEW ----------
// Focus: "what needs my decision, and is anything broken institution-wide?"
function AdminOverview(props) {
  const { userName, faculty, rooms, sections, result, generating, onGenerate, leaveRequests, notifications, scheduleHistory, onNavigate, onOpenRequests } = props;
  const { issues } = computeAllDepartments(faculty, sections, result);
  // Prerequisite problems are also institution-wide, so they are merged into the admin's issue list.
  const allIssues = issues.concat(validateCurriculumSequence(sections).map(i => ({ severity: "medium", text: i.text })));
  const buckets = computeLoadBuckets(faculty, sections, result);
  const pendingLeave = leaveRequests.filter(r => r.status === "Pending");
  // Every saved version still waiting for a decision (the current one included).
  const pendingVersions = scheduleHistory.filter(h => (h.approvalStatus || "Pending Review") === "Pending Review").length;

  return (
    <div className="space-y-6">
      <OverviewHero eyebrow="Academic Administrator" title={"Welcome back, " + userName.split(" ")[0]}
        subtitle="Here's what needs your attention across the institution today.">
        <GenerateButton generating={generating} onGenerate={onGenerate} />
        {result && <span className="text-sm text-slate-200 flex items-center gap-2">Current schedule: <ApprovalBadge status={result.approvalStatus} /></span>}
      </OverviewHero>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Pending Approvals" value={pendingVersions} sub="schedule versions awaiting review" color={pendingVersions ? "#c2410c" : "#047857"} />
        <StatCard label="Pending Leave Requests" value={pendingLeave.length} color={pendingLeave.length ? "#c2410c" : "#047857"} />
        <StatCard label="Open Issues" value={allIssues.length} color={allIssues.length ? "#c0392b" : "#047857"} />
        <StatCard label="Faculty / Sections / Rooms" value={faculty.length + " / " + sections.length + " / " + rooms.length} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Panel title="Schedule Approval" action="Review schedule" onAction={() => onNavigate("schedules")}>
          {result ? (
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between"><span className="text-slate-500">Status</span><ApprovalBadge status={result.approvalStatus} /></div>
              <div className="flex items-center justify-between"><span className="text-slate-500">Conflicts</span>
                <span className={"font-semibold " + (result.violations.total ? "text-rose-700" : "text-emerald-700")}>{result.violations.total}</span></div>
              <div className="flex items-center justify-between"><span className="text-slate-500">Generated</span>
                <span className="text-slate-700">{result.generatedAt ? new Date(result.generatedAt).toLocaleString() : "—"}</span></div>
              {result.approvalComment && <div className="text-xs text-slate-500 italic">“{result.approvalComment}”</div>}
              {result.needsRegeneration && (
                <div className="text-xs text-orange-700 bg-orange-50 rounded-lg px-2 py-1.5 flex items-center justify-between gap-2">
                  <span>Needs update: {result.needsRegeneration.reason}</span>
                  <button onClick={props.onUpdateSchedule} className="shrink-0 font-semibold underline">Update</button>
                </div>
              )}
            </div>
          ) : <EmptyNote>No schedule generated yet.</EmptyNote>}
        </Panel>

        <Panel title="Pending Leave & Availability Requests" action="Open requests" onAction={onOpenRequests}>
          {pendingLeave.length === 0 ? <EmptyNote>No pending requests.</EmptyNote> : (
            <ul className="divide-y divide-slate-50">
              {pendingLeave.slice(0, 4).map(r => {
                const fac = faculty.find(f => f.id === r.facultyId);
                return (
                  <li key={r.id} className="py-2 text-sm">
                    <div className="font-medium text-slate-900">{fac ? fac.name : "Unknown"} — {r.type}</div>
                    <div className="text-xs text-slate-600">{describeSlots(r.slotIds, props.slotById)}</div>
                    <div className="text-xs text-slate-500 truncate">{r.description}</div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel title="Issues Requiring Attention" action="Open departments" onAction={() => onNavigate("departments")}>
          <IssueList issues={allIssues} />
        </Panel>

        <Panel title="Faculty Load Snapshot" action="Workload details" onAction={() => onNavigate("workload")}>
          {result ? <LoadSnapshotBar buckets={buckets} total={faculty.length} /> : <EmptyNote>Generate a schedule to see workload distribution.</EmptyNote>}
        </Panel>
      </section>

      <Panel title="Recent Notifications">
        {notifications.length === 0 ? <EmptyNote>No notifications yet.</EmptyNote> : (
          <ul className="divide-y divide-slate-50">
            {notifications.slice(0, 4).map(n => (
              <li key={n.id} className="py-2 flex items-start justify-between gap-3 text-sm">
                <span className={n.read ? "text-slate-500" : "text-slate-900 font-medium"}>{n.message}</span>
                <span className="text-xs text-slate-400 shrink-0">{new Date(n.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

// ---------- DEPARTMENT CHAIR OVERVIEW ----------
// Focus: "act quickly" — approve/reject the schedule and leave requests without leaving the page.
// A department filter narrows workload, issues, and leave requests to one specialization.
function ChairOverview(props) {
  const { userName, faculty, sections, result, generating, onGenerate, leaveRequests, chairDept, setChairDept,
    onNavigate, onApprovalDecision, onUpdateRequestStatus } = props;
  const { allSpecs, deptStats, issues } = computeAllDepartments(faculty, sections, result);

  // Apply the department filter ("All" shows everything).
  const inDept = (spec) => chairDept === "All" || spec === chairDept;
  const visibleDepts = deptStats.filter(d => inDept(d.spec));
  const visibleIssues = issues.filter(i => inDept(i.spec));
  const deptFacultyIds = new Set(faculty.filter(f => chairDept === "All" || f.specializations.includes(chairDept)).map(f => f.id));
  const pendingLeave = leaveRequests.filter(r => r.status === "Pending" && deptFacultyIds.has(r.facultyId));
  const needsDecision = result && (result.approvalStatus || "Pending Review") === "Pending Review";

  return (
    <div className="space-y-6">
      <OverviewHero eyebrow="Department Chair" title={"Welcome back, " + userName.split(" ")[0]}
        subtitle="Review schedules and faculty requests for your department in one place.">
        <GenerateButton generating={generating} onGenerate={onGenerate} />
        <label className="flex items-center gap-2 text-sm text-slate-200">
          Department:
          <select value={chairDept} onChange={e => setChairDept(e.target.value)}
            className="bg-white/10 border border-white/20 text-white text-sm rounded-lg px-2 py-1.5 focus:outline-none">
            <option value="All" className="text-slate-900">All departments</option>
            {allSpecs.map(sp => <option key={sp} value={sp} className="text-slate-900">{sp}</option>)}
          </select>
        </label>
      </OverviewHero>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* My Approvals Queue — quick approve/reject right here, or open the full review page. */}
        <Panel title="My Approvals Queue" action="Review in detail" onAction={() => onNavigate("schedules")}>
          {!result ? <EmptyNote>No schedule generated yet.</EmptyNote> : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Current schedule</span><ApprovalBadge status={result.approvalStatus} />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Conflicts</span>
                <span className={"font-semibold " + (result.violations.total ? "text-rose-700" : "text-emerald-700")}>{result.violations.total}</span>
              </div>
              {result.needsRegeneration && (
                <div className="text-xs text-orange-700 bg-orange-50 rounded-lg px-2 py-1.5 flex items-center justify-between gap-2">
                  <span>Needs update: {result.needsRegeneration.reason}</span>
                  <button onClick={props.onUpdateSchedule} disabled={generating} className="shrink-0 font-semibold underline">Update</button>
                </div>
              )}
              {needsDecision ? (
                <div className="flex gap-2 pt-1">
                  <button onClick={() => onApprovalDecision("Approved", "")}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium py-2 rounded-lg">
                    <IconThumbsUp size={15} /> Approve
                  </button>
                  <button onClick={() => onApprovalDecision("Rejected", "")}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium py-2 rounded-lg">
                    <IconThumbsDown size={15} /> Reject
                  </button>
                </div>
              ) : <div className="text-xs text-slate-400">No decision needed right now.</div>}
            </div>
          )}
        </Panel>

        {/* Leave requests with inline Approve / Deny, filtered to the chosen department. */}
        <Panel title={"Faculty Leave Requests (" + pendingLeave.length + ")"}>
          {pendingLeave.length === 0 ? <EmptyNote>No pending requests{chairDept !== "All" ? " in " + chairDept : ""}.</EmptyNote> : (
            <ul className="divide-y divide-slate-50">
              {pendingLeave.map(r => {
                const fac = faculty.find(f => f.id === r.facultyId);
                return (
                  <li key={r.id} className="py-2.5 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-900">{fac ? fac.name : "Unknown"} — {r.type}</div>
                      <div className="text-xs text-slate-600">{describeSlots(r.slotIds, props.slotById)}</div>
                      <div className="text-xs text-slate-500 truncate">{r.description}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => onUpdateRequestStatus(r.id, "Approved")} className="text-xs font-medium text-emerald-700 hover:underline">Approve</button>
                      <button onClick={() => onUpdateRequestStatus(r.id, "Denied")} className="text-xs font-medium text-rose-700 hover:underline">Deny</button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </section>

      {/* Condensed department table: only the numbers a chair scans for (no charts). */}
      <Panel title="Department Workload Snapshot" action="Full department view" onAction={() => onNavigate("departments")}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-slate-400 text-xs border-b border-slate-100">
              <th className="py-2 pr-3 font-medium">Specialization</th><th className="py-2 pr-3 font-medium">Faculty</th>
              <th className="py-2 pr-3 font-medium">Load</th><th className="py-2 pr-3 font-medium">Overloads</th><th className="py-2 font-medium">Conflicts</th>
            </tr></thead>
            <tbody>
              {visibleDepts.map(({ spec, stats }) => (
                <tr key={spec} className="border-b border-slate-50">
                  <td className="py-2 pr-3 font-medium text-slate-900">{spec}</td>
                  <td className="py-2 pr-3 text-slate-500">{stats.deptFaculty.length}</td>
                  <td className="py-2 pr-3 text-slate-500">{result ? stats.loadPct + "%" : "—"}</td>
                  <td className={"py-2 pr-3 " + (stats.overloads ? "text-rose-700 font-semibold" : "text-slate-400")}>{stats.overloads}</td>
                  <td className={"py-2 " + (stats.conflicts ? "text-rose-700 font-semibold" : "text-slate-400")}>{stats.conflicts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Issues Requiring Attention">
        <IssueList issues={visibleIssues} />
      </Panel>
    </div>
  );
}

// ---------- FACULTY OVERVIEW ----------
// Focus: "what am I teaching, how heavy is my load, and did my requests go through?"
// Faculty never generate schedules, so there is no Generate button here.
function FacultyOverview(props) {
  const { myFaculty, sections, result, slotById, leaveRequests, onNavigate, onNewRequest } = props;
  if (!myFaculty) return <EmptyNote>No faculty profile found. Ask an administrator to add you to the Faculty list.</EmptyNote>;

  const status = loadStatusFor(myFaculty, sections, result, props.faculty);

  // Collect this faculty member's scheduled classes (skipping manually removed ones).
  const myClasses = result
    ? result.genes.map((g, i) => ({ g, sec: sections[i], slot: slotById[g.slotId] }))
        .filter(x => x.g.facultyId === myFaculty.id && x.slot)
    : [];

  // Group classes by weekday, in Mon→Fri order, sorted by period within each day.
  const byDay = {};
  E.DAYS.forEach(d => { byDay[d] = []; });
  myClasses.forEach(c => byDay[c.slot.day].push(c));
  E.DAYS.forEach(d => byDay[d].sort((a, b) => a.slot.period - b.slot.period));

  // Preference match: share of my classes that land on one of my preferred days.
  const prefHits = myClasses.filter(c => myFaculty.preferredDays.includes(c.slot.day)).length;
  const prefPct = myClasses.length ? Math.round((prefHits / myClasses.length) * 100) : 0;

  const myRequests = leaveRequests.filter(r => r.facultyId === myFaculty.id);
  const approval = result ? (result.approvalStatus || "Pending Review") : null;

  return (
    <div className="space-y-6">
      <OverviewHero eyebrow="Faculty Member" title={"Welcome back, " + myFaculty.name.split(" ")[0]}
        subtitle={myFaculty.academicRank ? myFaculty.academicRank + " · " + (myFaculty.employmentStatus || "") : "Your teaching schedule and requests at a glance."}>
        <button onClick={() => onNavigate("schedules")}
          className="bg-amber-400 text-[#0b1d4a] font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-amber-300 transition-colors flex items-center gap-2">
          <IconCalendar size={15} /> View My Full Schedule
        </button>
        <button onClick={() => onNewRequest(myFaculty.id)}
          className="border border-white/30 text-white font-medium text-sm px-5 py-2.5 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2">
          <IconPlus size={15} /> Request Availability Change / Leave
        </button>
      </OverviewHero>

      {/* Tell faculty whether their schedule is final or may still change. */}
      {approval && (
        <div className={"rounded-2xl p-4 border text-sm " + (approval === "Approved" ? "bg-emerald-50 border-emerald-100 text-emerald-800"
          : approval === "Rejected" ? "bg-rose-50 border-rose-100 text-rose-800" : "bg-orange-50 border-orange-100 text-orange-800")}>
          {result.needsRegeneration ? "Availability was updated — only the affected classes will be moved in the next update."
            : approval === "Approved" ? "Your schedule has been approved and is final."
            : approval === "Rejected" ? "The current schedule was rejected and is being revised."
            : "The current schedule is still pending review and may change."}
        </div>
      )}

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="My Current Load" value={status.assigned + " / " + myFaculty.maxUnits} sub="units" />
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="text-slate-400 text-xs font-medium mb-2">Load Status</div>
          <span className={"text-sm font-semibold px-2.5 py-1 rounded-full " + status.color}>{status.label}</span>
        </div>
        <StatCard label="Classes This Week" value={myClasses.length} />
        <StatCard label="Preference Match" value={myClasses.length ? prefPct + "%" : "—"}
          sub={myClasses.length ? prefHits + " of " + myClasses.length + " on preferred days" : "no classes yet"} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <Panel title="My Schedule This Week">
            {myClasses.length === 0 ? <EmptyNote>{result ? "You have no classes in the current schedule." : "No schedule has been generated yet."}</EmptyNote> : (
              <div className="space-y-3">
                {E.DAYS.filter(d => byDay[d].length > 0).map(d => (
                  <div key={d}>
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5 flex items-center gap-2">
                      {d}
                      {myFaculty.preferredDays.includes(d) && <span className="normal-case tracking-normal text-[10px] bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded-full">preferred</span>}
                    </div>
                    <div className="space-y-1.5">
                      {byDay[d].map((c, i) => (
                        <div key={i} className="flex items-center justify-between border border-slate-100 rounded-lg px-3 py-2">
                          <div>
                            <div className="text-sm font-medium text-slate-900">{c.sec.subjectCode} — {c.sec.subjectName}</div>
                            <div className="text-xs text-slate-400">{c.sec.sectionName}</div>
                          </div>
                          <div className="text-xs text-slate-500 text-right">{c.slot.label.split(" ")[1]}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>

        <Panel title="My Requests" action="+ New" onAction={() => onNewRequest(myFaculty.id)}>
          {myRequests.length === 0 ? <EmptyNote>You haven't submitted any requests.</EmptyNote> : (
            <ul className="divide-y divide-slate-50">
              {myRequests.map(r => {
                const cls = r.status === "Approved" ? "text-emerald-700 bg-emerald-50" : r.status === "Denied" ? "text-rose-700 bg-rose-50"
                  : r.status === "Ended" ? "text-slate-600 bg-slate-100" : "text-orange-700 bg-orange-50";
                return (
                  <li key={r.id} className="py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-slate-900">{r.type}</span>
                      <span className={"text-xs font-medium px-2 py-0.5 rounded-full " + cls}>{r.status}</span>
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5">{describeSlots(r.slotIds, slotById)}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{r.description}</div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </section>
    </div>
  );
}

// ---------- IT PROFESSIONAL / STAFF OVERVIEW ----------
// Focus: technical health — how the AI engine is performing, whether the data is clean,
// how rooms are being used, and what data operations (imports/exports) happened recently.
function ITOverview(props) {
  const { userName, faculty, rooms, sections, result, slotById, generating, onGenerate, scheduleHistory, activityLog, onNavigate } = props;
  const health = computeDataHealth(faculty, rooms, sections);

  // Average engine run time across every saved version that recorded a timing.
  const timed = scheduleHistory.filter(h => typeof h.elapsedMs === "number");
  const avgMs = timed.length ? Math.round(timed.reduce((s, h) => s + h.elapsedMs, 0) / timed.length) : null;

  // Rows for the "Last Engine Run" table: [label, value].
  const engineRows = result ? [
    ["Run time", typeof result.elapsedMs === "number" ? result.elapsedMs + " ms" : "not recorded"],
    ["Generations run", result.convergence.length + (result.settings ? " of " + result.settings.generations + " max" : "")],
    ["Population size", result.settings ? result.settings.popSize : "—"],
    ["Final fitness", result.fitness.toFixed(1)],
    ["Hard-constraint violations", result.violations.total],
    ["Curriculum-aware", result.curriculumAware ? "On" : "Off"],
  ] : [];

  return (
    <div className="space-y-6">
      <OverviewHero eyebrow="IT Professional / Staff" title={"Welcome back, " + userName.split(" ")[0]}
        subtitle="System health, AI engine performance, and data operations.">
        <GenerateButton generating={generating} onGenerate={onGenerate} />
        <button onClick={() => onNavigate("reports")}
          className="border border-white/30 text-white font-medium text-sm px-5 py-2.5 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2">
          <IconChart size={15} /> Open Reports
        </button>
      </OverviewHero>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Last Run Time" value={result && typeof result.elapsedMs === "number" ? result.elapsedMs + " ms" : "—"}
          sub={avgMs != null ? "avg " + avgMs + " ms over " + timed.length + " run(s)" : undefined} />
        <StatCard label="Saved Versions" value={scheduleHistory.length} />
        <StatCard label="Data Health Issues" value={health.length} color={health.length ? "#c0392b" : "#047857"} />
        <StatCard label="Records" value={faculty.length + sections.length + rooms.length} sub={faculty.length + " faculty · " + sections.length + " sections · " + rooms.length + " rooms"} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Panel title="Last AI Engine Run" action="Convergence chart" onAction={() => onNavigate("schedules")}>
          {!result ? <EmptyNote>The engine hasn't been run yet.</EmptyNote> : (
            <table className="w-full text-sm">
              <tbody>
                {engineRows.map(([k, v]) => (
                  <tr key={k} className="border-b border-slate-50">
                    <td className="py-1.5 text-slate-500">{k}</td>
                    <td className="py-1.5 text-right font-medium text-slate-900">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>

        <Panel title="Data Health">
          {health.length === 0
            ? <div className="flex items-center gap-2 text-sm text-emerald-700"><IconCheckCircle size={16} /> All records are valid for scheduling.</div>
            : <IssueList issues={health.map(t => ({ severity: "high", text: t }))} max={6} />}
        </Panel>
      </section>

      <Panel title="Room Utilization Overview" action="Full report" onAction={() => onNavigate("reports")}>
        {result ? <RoomHeatmap rooms={rooms} result={result} slotById={slotById} /> : <EmptyNote>Generate a schedule to see room usage.</EmptyNote>}
      </Panel>

      <Panel title="Recent Import / Export Activity">
        {activityLog.length === 0 ? <EmptyNote>No imports or exports yet.</EmptyNote> : (
          <ul className="divide-y divide-slate-50">
            {activityLog.slice(0, 8).map(a => (
              <li key={a.id} className="py-2 flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-2">
                  {a.kind === "Import" ? <IconUpload size={14} className="text-blue-600" /> : <IconDownload size={14} className="text-amber-600" />}
                  <span className="font-medium text-slate-900">{a.kind}</span>
                  <span className="text-slate-500">{a.detail}</span>
                </span>
                <span className="text-xs text-slate-400 shrink-0">{new Date(a.timestamp).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

// Dispatcher: picks the overview that matches the signed-in role.
function DashboardPage(props) {
  if (props.role === "admin") return <AdminOverview {...props} />;
  if (props.role === "chair") return <ChairOverview {...props} />;
  if (props.role === "faculty") return <FacultyOverview {...props} />;
  return <ITOverview {...props} />;
}

/* =====================================================================
   11. OTHER PAGES
   ===================================================================== */

// TableShell: the shared white card around every data table, with optional
// Export CSV / Import CSV / Add buttons in its header. `no-print` hides the
// buttons when printing.
function TableShell({ title, onAdd, addLabel, onImport, onExport, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="flex items-center justify-between flex-wrap gap-2 px-6 py-4 border-b border-slate-100">
        <h2 className="font-semibold text-slate-900">{title}</h2>
        <div className="flex items-center gap-2 no-print">
          {onExport && (
            <button onClick={onExport} className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium px-3 py-2 rounded-lg">
              <IconDownload size={15} /> Export CSV
            </button>
          )}
          {onImport && (
            <button onClick={onImport} className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium px-3 py-2 rounded-lg">
              <IconUpload size={15} /> Import CSV
            </button>
          )}
          {onAdd && (
            <button onClick={onAdd} className="flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-[#0b1d4a] text-sm font-medium px-3.5 py-2 rounded-lg">
              <IconPlus size={15} /> {addLabel}
            </button>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------
// LOAD STATUS — the ONE place that decides a teacher's workload label.
// Every page (Faculty, Workload Management, Departments, the Overviews and
// Reports) calls loadStatusFor(), so they always show the same status, and
// the "How is load status calculated?" panel reads LOAD_RULES, so its text
// always matches the rule actually used.
//
//   Load %  = assigned units ÷ the teacher's own maximum units × 100,
//             rounded to the nearest whole number.
//   Assigned units = the units of the classes the teacher has in the
//             CURRENT schedule (manually removed classes don't count).
//   Average units  = all assigned units ÷ number of teachers (the same
//             quantity the AI tries to make even when it generates).
//
// Rules, checked in this order:
//   1. Overloaded     more units than the teacher's maximum
//   2. Near capacity  load % is LOAD_RULES.nearCapacityPct (80) or more
//   3. Underloaded    0 units assigned
//   4. Light load     fewer than LOAD_RULES.lightLoadShare (half) of the
//                     average units per teacher — compared with COLLEAGUES
//   5. Balanced       everything else
// Before any schedule exists, everyone is "No assignment yet".
// ---------------------------------------------------------------------
const LOAD_RULES = {
  nearCapacityPct: 80,   // a prototype setting, not a CHED or school rule
  lightLoadShare: 0.5,   // "Light load" = below half of the average units per teacher
};

// assignedUnits(f, sections, result): total units of the classes teacher f has in the schedule.
function assignedUnits(facultyMember, sections, result) {
  if (!result) return 0;
  return result.genes.reduce((sum, g, i) => (g.facultyId === facultyMember.id && sections[i] ? sum + sections[i].units : sum), 0);
}
// averageUnits(faculty, sections, result): all assigned units ÷ number of teachers.
function averageUnits(faculty, sections, result) {
  if (!result || !faculty || faculty.length === 0) return 0;
  return faculty.reduce((a, f) => a + assignedUnits(f, sections, result), 0) / faculty.length;
}

// `faculty` (the whole list) is needed for the Light load comparison. Every
// page passes it; if it is ever left out, Light load is simply not checked.
function loadStatusFor(facultyMember, sections, result, faculty) {
  const max = facultyMember.maxUnits;
  if (!result) {
    return { label: "No assignment yet", assigned: 0, pct: 0, color: "text-slate-400 bg-slate-50",
      reason: "No schedule has been generated yet." };
  }
  const assigned = assignedUnits(facultyMember, sections, result);
  // Guard: a maximum of 0 (or less) would divide by zero. Treat it as 0% with
  // nothing assigned, and as over the limit (999) with anything assigned.
  const pct = max > 0 ? Math.round((assigned / max) * 100) : (assigned > 0 ? 999 : 0);
  const ofText = assigned + " of " + max + " units" + (max > 0 ? " = " + pct + "%" : "");
  const cut = LOAD_RULES.nearCapacityPct;
  if (assigned > max) return { label: "Overloaded", assigned, pct, color: "text-rose-700 bg-rose-50",
    reason: ofText + ". More than the maximum of " + max + " units." };
  if (pct >= cut) return { label: "Near capacity", assigned, pct, color: "text-orange-700 bg-orange-50",
    reason: ofText + ". At or above the " + cut + "% cutoff, but not over the maximum." };
  if (assigned === 0) return { label: "Underloaded", assigned, pct, color: "text-slate-600 bg-slate-100",
    reason: "0 units. This teacher has no classes in the current schedule." };
  if (faculty && faculty.length > 1) {
    const avg = averageUnits(faculty, sections, result);
    const lightBelow = avg * LOAD_RULES.lightLoadShare;
    if (assigned < lightBelow) return { label: "Light load", assigned, pct, color: "text-blue-800 bg-blue-50",
      reason: ofText + ". Fewer than half the average load in this schedule (" + avg.toFixed(1) + " units per teacher, so below " + lightBelow.toFixed(1) + ")." };
  }
  return { label: "Balanced", assigned, pct, color: "text-emerald-700 bg-emerald-50",
    reason: ofText + ". Below the " + cut + "% cutoff and at least half the average load per teacher." };
}

// FacultyPage: two tabs.
//   "Faculty List" — table with load/status, and View Profile / View Schedule /
//                    Edit / Delete actions per row.
//   "Leave & Availability" — all requests with the requested time slots.
//                            Admin/Chair can Approve (blocks those slots for the
//                            teacher), Deny, or End an approved leave.
function FacultyPage({ faculty, sections, result, role, leaveRequests, tab, setTab, onImport, onAdd, onEdit, onDelete, onViewProfile, onViewSchedule, onNewRequest, onUpdateRequestStatus, onEndLeave, slotById }) {
  const facultyById = Object.fromEntries(faculty.map(f => [f.id, f]));
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button onClick={()=>setTab("list")} className={"text-sm font-medium px-4 py-2 rounded-lg " + (tab==="list"?"bg-slate-900 text-white":"bg-white text-slate-600 border border-slate-200")}>Faculty List</button>
        <button onClick={()=>setTab("requests")} className={"text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-1.5 " + (tab==="requests"?"bg-slate-900 text-white":"bg-white text-slate-600 border border-slate-200")}>
          Leave &amp; Availability
          {leaveRequests.filter(r=>r.status==="Pending").length > 0 && (
            <span className={"text-[10px] font-semibold rounded-full w-5 h-5 flex items-center justify-center " + (tab==="requests" ? "bg-white/20 text-white" : "bg-rose-600 text-white")}>
              {leaveRequests.filter(r=>r.status==="Pending").length}
            </span>
          )}
        </button>
      </div>

      {tab === "list" && (
        <TableShell title={"Faculty (" + faculty.length + ")"} onAdd={onAdd} addLabel="Add Faculty" onImport={onImport}
          onExport={() => downloadCSV("faculty.csv",
            ["Name","Specializations","Max Units","Current Load","Status","Preferred Days","Employment Status","Academic Rank"],
            faculty.map(f => { const st = loadStatusFor(f, sections, result, faculty); return [f.name, f.specializations.join("; "), f.maxUnits, st.assigned, st.label, f.preferredDays.join("; "), f.employmentStatus || "", f.academicRank || ""]; }))}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-slate-400 text-xs border-b border-slate-100">
                <th className="px-6 py-3 font-medium">Name</th><th className="px-6 py-3 font-medium">Specializations</th>
                <th className="px-6 py-3 font-medium">Current Load</th><th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Preferred Days</th><th className="px-6 py-3 font-medium"></th>
              </tr></thead>
              <tbody>
                {faculty.map(f => {
                  const status = loadStatusFor(f, sections, result, faculty);
                  return (
                    <tr key={f.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="px-6 py-3 font-medium text-slate-900">{f.name}</td>
                      <td className="px-6 py-3 text-slate-500">{f.specializations.join(", ")}</td>
                      <td className="px-6 py-3 text-slate-500">{status.assigned}/{f.maxUnits} units</td>
                      <td className="px-6 py-3"><span title={status.reason} className={"text-xs font-medium px-2 py-1 rounded-full " + status.color}>{status.label}</span></td>
                      <td className="px-6 py-3 text-slate-500">{f.preferredDays.join(", ")}</td>
                      <td className="px-6 py-3 text-right whitespace-nowrap">
                        <button onClick={()=>onViewProfile(f)} title="View Profile" className="text-slate-400 hover:text-blue-800 p-1"><IconEye size={15}/></button>
                        <button onClick={()=>onViewSchedule(f)} title="View Schedule" className="text-slate-400 hover:text-blue-600 p-1"><IconCalendar size={15}/></button>
                        <button onClick={()=>onEdit(f)} title="Edit" className="text-slate-400 hover:text-blue-600 p-1"><IconEdit size={15}/></button>
                        <button onClick={()=>onDelete(f.id)} title="Delete" className="text-slate-400 hover:text-rose-700 p-1"><IconTrash size={15}/></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </TableShell>
      )}

      {tab === "requests" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Leave / Availability Requests</h2>
            <button onClick={onNewRequest} className="flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-[#0b1d4a] text-sm font-medium px-3.5 py-2 rounded-lg">
              <IconPlus size={15} /> New Request
            </button>
          </div>
          {leaveRequests.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-slate-400">No leave or availability requests yet.</div>
          ) : (
            <div className="divide-y divide-slate-50">
              {leaveRequests.map(r => {
                const fac = facultyById[r.facultyId];
                const statusColor = r.status === "Approved" ? "text-emerald-700 bg-emerald-50" : r.status === "Denied" ? "text-rose-700 bg-rose-50"
                  : r.status === "Ended" ? "text-slate-600 bg-slate-100" : "text-orange-700 bg-orange-50";
                return (
                  <div key={r.id} className="px-6 py-4 flex items-start justify-between gap-4">
                    <div>
                      <div className="font-medium text-slate-900 text-sm">{fac ? fac.name : "Unknown faculty"} — {r.type}
                        {r.dateFrom && <span className="text-xs font-normal text-slate-500"> · {r.dateFrom}{r.dateTo ? " to " + r.dateTo : ""}</span>}
                      </div>
                      <div className="text-xs text-slate-700 mt-0.5"><span className="font-medium">Times:</span> {describeSlots(r.slotIds, slotById)}</div>
                      <div className="text-sm text-slate-500 mt-0.5">{r.description}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={"text-xs font-medium px-2 py-1 rounded-full " + statusColor}>{r.status}</span>
                      {role !== "faculty" && r.status === "Pending" && (
                        <>
                          <button onClick={()=>onUpdateRequestStatus(r.id, "Approved")} className="text-xs font-medium text-emerald-700 hover:underline">Approve</button>
                          <button onClick={()=>onUpdateRequestStatus(r.id, "Denied")} className="text-xs font-medium text-rose-700 hover:underline">Deny</button>
                        </>
                      )}
                      {/* An approved LEAVE can be ended; this makes its time slots available again. */}
                      {role !== "faculty" && r.status === "Approved" && r.type === "Leave Request" && (
                        <button onClick={()=>onEndLeave(r.id)} className="text-xs font-medium text-slate-600 hover:underline">End Leave</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// SubjectsPage: subject/section table (School Year, Major/Minor, Year Level,
// Semester, Class Type, Fixed Time columns) with School Year / Category /
// Year Level filters, plus a warning box for prerequisite-order problems.
// Note: filters only change what is SHOWN — every listed subject is scheduled.
function SubjectsPage({ sections, onImport, onAdd, onEdit, onDelete }) {
  const curriculumIssues = validateCurriculumSequence(sections);
  // Filters (only affect what's displayed, not what gets scheduled).
  const [yearFilter, setYearFilter] = useState("all");
  const [syFilter, setSyFilter] = useState("all");
  const [catFilter, setCatFilter] = useState("all");
  const [progFilter, setProgFilter] = useState("all");
  const programs = Array.from(new Set(sections.map(s => s.program).filter(Boolean))).sort();
  const slotById = Object.fromEntries(E.buildTimeSlots().map(t => [t.id, t]));
  const schoolYears = Array.from(new Set(sections.map(s => s.schoolYear).filter(Boolean))).sort();
  const shown = sections.filter(s =>
    (yearFilter === "all" || String(s.yearLevel) === yearFilter) &&
    (syFilter === "all" || s.schoolYear === syFilter) &&
    (catFilter === "all" || s.category === catFilter) &&
    (progFilter === "all" || s.program === progFilter));
  return (
    <div className="space-y-4">
      {curriculumIssues.length > 0 && (
        <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <IconAlertCircle size={18} className="text-orange-700" />
            <h3 className="font-semibold text-slate-900 text-sm">Curriculum Prerequisite Issues</h3>
          </div>
          <ul className="space-y-1">
            {curriculumIssues.map((iss, i) => (
              <li key={i} className="text-sm text-orange-800 flex items-start gap-2">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />{iss.text}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm text-slate-500 flex items-center gap-2">School Year:
          <select className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm bg-white" value={syFilter} onChange={e => setSyFilter(e.target.value)}>
            <option value="all">All</option>
            {schoolYears.map(y => <option key={y} value={y}>SY {y}</option>)}
          </select>
        </label>
        <label className="text-sm text-slate-500 flex items-center gap-2">Program:
          <select className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm bg-white" value={progFilter} onChange={e => setProgFilter(e.target.value)}>
            <option value="all">All</option>
            {programs.map(pr => <option key={pr} value={pr}>{pr}</option>)}
          </select>
        </label>
        <label className="text-sm text-slate-500 flex items-center gap-2">Category:
          <select className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm bg-white" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
            <option value="all">All</option><option value="Major">Major</option><option value="Minor">Minor</option>
          </select>
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-slate-500">Year Level:</span>
        {[["all", "All"], ["1", "1st Year"], ["2", "2nd Year"], ["3", "3rd Year"], ["4", "4th Year"]].map(([val, lbl]) => (
          <button key={val} onClick={() => setYearFilter(val)}
            className={"text-sm font-medium px-3 py-1.5 rounded-lg " + (yearFilter === val ? "bg-slate-900 text-white" : "bg-white text-slate-600 border border-slate-200")}>
            {lbl} <span className="opacity-60">({val === "all" ? sections.length : sections.filter(s => String(s.yearLevel) === val).length})</span>
          </button>
        ))}
      </div>
      <TableShell title={"Subjects / Sections (" + shown.length + ")"} onAdd={onAdd} addLabel="Add Subject" onImport={onImport}
        onExport={() => downloadCSV("subjects.csv",
          ["Program","School Year","Category","Code","Subject","Section","Year Level","Semester","Units","Specialization","Class Type","Fixed Time","Enrolled","Prerequisite"],
          shown.map(s => [s.program || "", s.schoolYear || "", s.category || "", s.subjectCode, s.subjectName, s.sectionName, yearLabel(s.yearLevel), s.semester || "", s.units, s.requiredSpecialization, classTypeLabel(s),
            s.fixedSlotId != null ? describeSlots([s.fixedSlotId], slotById) : "", s.enrolledStudents, s.prerequisiteCode || ""]))}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-slate-400 text-xs border-b border-slate-100">
              <th className="px-6 py-3 font-medium">Program</th><th className="px-6 py-3 font-medium">School Year</th><th className="px-6 py-3 font-medium">Category</th>
              <th className="px-6 py-3 font-medium">Code</th><th className="px-6 py-3 font-medium">Subject</th>
              <th className="px-6 py-3 font-medium">Section</th><th className="px-6 py-3 font-medium">Year Level</th>
              <th className="px-6 py-3 font-medium">Semester</th><th className="px-6 py-3 font-medium">Units</th>
              <th className="px-6 py-3 font-medium">Specialization</th><th className="px-6 py-3 font-medium">Class Type</th>
              <th className="px-6 py-3 font-medium">Fixed Time</th><th className="px-6 py-3 font-medium">Prerequisite</th>
              <th className="px-6 py-3 font-medium">Enrolled</th><th className="px-6 py-3 font-medium"></th>
            </tr></thead>
            <tbody>
              {shown.map(s => (
                <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-6 py-3 text-slate-700 font-medium">{s.program || "—"}</td>
                  <td className="px-6 py-3 text-slate-500 whitespace-nowrap">{s.schoolYear ? "SY " + s.schoolYear : "—"}</td>
                  <td className="px-6 py-3">
                    <span className={"text-xs font-medium px-2 py-1 rounded-full " + (s.category === "Minor" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700")}>{s.category || "—"}</span>
                  </td>
                  <td className="px-6 py-3 font-medium text-slate-900">{s.subjectCode}</td>
                  <td className="px-6 py-3 text-slate-500">{s.subjectName}</td>
                  <td className="px-6 py-3 text-slate-500">{s.sectionName}</td>
                  <td className="px-6 py-3 text-slate-500 whitespace-nowrap">{yearLabel(s.yearLevel)}</td>
                  <td className="px-6 py-3 text-slate-500 whitespace-nowrap">{s.semester || "—"}</td>
                  <td className="px-6 py-3 text-slate-500">{s.units}</td>
                  <td className="px-6 py-3 text-slate-500">{s.requiredSpecialization}</td>
                  <td className="px-6 py-3">
                    <span className={"text-xs font-medium px-2 py-1 rounded-full " + (E.isOnline(s) ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-800")}>{classTypeLabel(s)}</span>
                  </td>
                  <td className="px-6 py-3 text-slate-500 whitespace-nowrap">{s.fixedSlotId != null ? "📌 " + describeSlots([s.fixedSlotId], slotById) : "—"}</td>
                  <td className="px-6 py-3 text-slate-500">{s.prerequisiteCode || "—"}</td>
                  <td className="px-6 py-3 text-slate-500">{s.enrolledStudents}</td>
                  <td className="px-6 py-3 text-right whitespace-nowrap">
                    <button onClick={()=>onEdit(s)} className="text-slate-400 hover:text-blue-600 p-1"><IconEdit size={15}/></button>
                    <button onClick={()=>onDelete(s.id)} className="text-slate-400 hover:text-rose-700 p-1"><IconTrash size={15}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TableShell>
    </div>
  );
}

// RoomsPage: laboratory room table with CSV import/export.
function RoomsPage({ rooms, onImport, onAdd, onEdit, onDelete }) {
  return (
    <TableShell title={"Laboratory Rooms (" + rooms.length + ")"} onAdd={onAdd} addLabel="Add Room" onImport={onImport}
      onExport={() => downloadCSV("rooms.csv", ["Name","Capacity"], rooms.map(r => [r.name, r.capacity]))}>
      <p className="px-6 pt-3 text-xs text-slate-500">Online classes don't need a room, so only laboratory rooms are listed here.</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-slate-400 text-xs border-b border-slate-100">
            <th className="px-6 py-3 font-medium">Name</th>
            <th className="px-6 py-3 font-medium">Capacity</th><th className="px-6 py-3 font-medium"></th>
          </tr></thead>
          <tbody>
            {rooms.map(r => (
              <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                <td className="px-6 py-3 font-medium text-slate-900">{r.name}</td>
                <td className="px-6 py-3 text-slate-500">{r.capacity}</td>
                <td className="px-6 py-3 text-right whitespace-nowrap">
                  <button onClick={()=>onEdit(r)} className="text-slate-400 hover:text-blue-600 p-1"><IconEdit size={15}/></button>
                  <button onClick={()=>onDelete(r.id)} className="text-slate-400 hover:text-rose-700 p-1"><IconTrash size={15}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </TableShell>
  );
}

// computeDepartmentStats(spec, faculty, sections, result)
// Treats each specialization (e.g. "Networking") as a department and works out:
//   • its faculty and sections
//   • each member's assigned units and status
//   • teaching load % = total assigned units ÷ total max units
//   • how many members are overloaded / underloaded
//   • how many of its sections have a conflict (unqualified teacher,
//     teacher double-booked, or room double-booked)
function computeDepartmentStats(spec, faculty, sections, result) {
  // Members of this department = anyone who lists this specialization.
  const deptFaculty = faculty.filter(f => f.specializations.includes(spec));
  // Keep each section's original index `i`, because genes[i] belongs to sections[i].
  const deptSectionEntries = sections.map((s, i) => ({ s, i })).filter(({s}) => s.requiredSpecialization === spec);

  let facSlot = {}, roomSlot = {};
  if (result) {
    result.genes.forEach(g => {
      if (g.facultyId === -1) return;
      const fk = g.facultyId + "-" + g.slotId, rk = g.roomId + "-" + g.slotId;
      facSlot[fk] = (facSlot[fk] || 0) + 1;
      if (g.roomId !== E.ONLINE_ROOM_ID) roomSlot[rk] = (roomSlot[rk] || 0) + 1;   // online classes share no room
    });
  }

  let totalAssigned = 0, totalCapacity = 0, overloads = 0, underloads = 0, conflicts = 0;
  const facultyStats = deptFaculty.map(f => {
    totalCapacity += f.maxUnits;
    let assigned = 0;
    if (result) result.genes.forEach((g, i) => { if (g.facultyId === f.id) assigned += sections[i].units; });
    totalAssigned += assigned;
    // Status comes from the shared loadStatusFor() so Departments matches every other page.
    const st = loadStatusFor(f, sections, result, faculty);
    if (st.label === "Overloaded") overloads++;
    if (st.label === "Underloaded") underloads++;
    return { faculty: f, assigned, pct: st.pct, status: st.label, color: st.color, reason: st.reason };
  });

  if (result) {
    deptSectionEntries.forEach(({ s, i }) => {
      const g = result.genes[i];
      if (!g || g.facultyId === -1) return;
      const fac = faculty.find(f => f.id === g.facultyId);
      const unqualified = !fac || !fac.specializations.includes(spec);
      const facConflict = (facSlot[g.facultyId + "-" + g.slotId] || 0) > 1;
      const roomConflict = (roomSlot[g.roomId + "-" + g.slotId] || 0) > 1;
      if (unqualified || facConflict || roomConflict) conflicts++;
    });
  }

  const noQualifiedFaculty = deptFaculty.length === 0 && deptSectionEntries.length > 0;
  const loadPct = totalCapacity > 0 ? Math.round((totalAssigned / totalCapacity) * 100) : 0;
  return {
    deptFaculty, deptSections: deptSectionEntries.map(d => d.s),
    facultyStats, totalAssigned, totalCapacity, loadPct, overloads, underloads, conflicts, noQualifiedFaculty,
  };
}

// computeAllDepartments(faculty, sections, result)
// Runs computeDepartmentStats for every specialization and turns the numbers
// into a list of human-readable issues. Shared by the Departments page and
// the Admin/Chair overviews so they always report the same issues.
function computeAllDepartments(faculty, sections, result) {
  const allSpecs = Array.from(new Set([
    ...faculty.flatMap(f => f.specializations),
    ...sections.map(s => s.requiredSpecialization),
  ]));
  const deptStats = allSpecs.map(spec => ({ spec, stats: computeDepartmentStats(spec, faculty, sections, result) }));
  const avgLoadPct = deptStats.length
    ? Math.round(deptStats.reduce((s, d) => s + d.stats.loadPct, 0) / deptStats.length)
    : 0;
  const issues = [];
  deptStats.forEach(({ spec, stats }) => {
    if (stats.noQualifiedFaculty) issues.push({ spec, severity: "high", text: "No qualified faculty available for " + stats.deptSections.length + " section(s) in " + spec + "." });
    if (stats.overloads > 0) issues.push({ spec, severity: "high", text: stats.overloads + " faculty member(s) in " + spec + " are overloaded beyond their maximum units." });
    if (stats.conflicts > 0) issues.push({ spec, severity: "medium", text: stats.conflicts + " section(s) in " + spec + " have an unresolved scheduling conflict." });
  });
  return { allSpecs, deptStats, avgLoadPct, issues };
}

// DepartmentsPage: summary cards, the "Issues Requiring Attention" box, and a
// table where clicking a row expands it (the `expanded` object remembers
// which rows are open) to show a workload chart and per-faculty statuses.
function DepartmentsPage({ faculty, sections, result }) {
  const [expanded, setExpanded] = useState({});
  const { allSpecs, deptStats, avgLoadPct, issues } = computeAllDepartments(faculty, sections, result);
  const totalFaculty = faculty.length;

  function toggle(spec) { setExpanded(prev => ({ ...prev, [spec]: !prev[spec] })); }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Departments" value={allSpecs.length} />
        <StatCard label="Total Faculty" value={totalFaculty} />
        <StatCard label="Average Teaching Load" value={result ? avgLoadPct + "%" : "—"} color={result && avgLoadPct > 100 ? "#c0392b" : undefined} />
        <StatCard label="Open Issues" value={issues.length} color={issues.length > 0 ? "#c0392b" : "#047857"} />
      </div>

      {issues.length > 0 && (
        <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <IconAlertCircle size={18} className="text-orange-700" />
            <h3 className="font-semibold text-slate-900 text-sm">Issues Requiring Attention</h3>
          </div>
          <ul className="space-y-1.5">
            {issues.map((issue, idx) => (
              <li key={idx} className="text-sm text-orange-800 flex items-start gap-2">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                {issue.text}
              </li>
            ))}
          </ul>
        </div>
      )}
      {issues.length === 0 && result && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-2">
          <IconCheckCircle size={18} className="text-emerald-700" />
          <span className="text-sm text-emerald-800 font-medium">No department issues detected in the current schedule.</span>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Departments (by specialization)</h2>
          <p className="text-xs text-slate-400 mt-0.5">Click a specialization area to view detailed workload and issues.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-slate-400 text-xs border-b border-slate-100">
              <th className="px-6 py-3 font-medium">Specialization Area</th>
              <th className="px-6 py-3 font-medium">Faculty</th>
              <th className="px-6 py-3 font-medium">Sections</th>
              <th className="px-6 py-3 font-medium">Teaching Load</th>
              <th className="px-6 py-3 font-medium">Overloads</th>
              <th className="px-6 py-3 font-medium">Conflicts</th>
              <th className="px-6 py-3 font-medium"></th>
            </tr></thead>
            <tbody>
              {deptStats.map(({ spec, stats }) => (
                <React.Fragment key={spec}>
                  <tr onClick={() => toggle(spec)} className="border-b border-slate-50 hover:bg-slate-50/50 cursor-pointer">
                    <td className="px-6 py-3 font-medium text-slate-900 flex items-center gap-2">
                      <IconChevronDown size={14} className={"text-slate-400 transition-transform " + (expanded[spec] ? "rotate-180" : "")} />
                      {spec}
                    </td>
                    <td className="px-6 py-3 text-slate-500">{stats.deptFaculty.length}</td>
                    <td className="px-6 py-3 text-slate-500">{stats.deptSections.length}</td>
                    <td className="px-6 py-3 text-slate-500">{result ? stats.loadPct + "%" : "—"}</td>
                    <td className="px-6 py-3">
                      {stats.overloads > 0
                        ? <span className="text-xs font-medium px-2 py-1 rounded-full text-rose-700 bg-rose-50">{stats.overloads} overloaded</span>
                        : <span className="text-xs font-medium px-2 py-1 rounded-full text-slate-400 bg-slate-50">—</span>}
                    </td>
                    <td className="px-6 py-3">
                      {stats.conflicts > 0
                        ? <span className="text-xs font-medium px-2 py-1 rounded-full text-rose-700 bg-rose-50">{stats.conflicts}</span>
                        : <span className="text-xs font-medium px-2 py-1 rounded-full text-emerald-700 bg-emerald-50">0</span>}
                    </td>
                    <td className="px-6 py-3 text-right text-xs text-slate-400">{expanded[spec] ? "Hide" : "Details"}</td>
                  </tr>
                  {expanded[spec] && (
                    <tr className="bg-slate-50/60">
                      <td colSpan={7} className="px-6 py-5">
                        {stats.deptFaculty.length === 0 ? (
                          <div className="text-sm text-slate-500">No faculty members currently list {spec} as a specialization.</div>
                        ) : (
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Workload Distribution</h4>
                              <BarChart
                                data={stats.facultyStats.map(fs => ({ label: fs.faculty.name.split(" ")[0], value: fs.assigned }))}
                                colorFn={(d, i) => "#1e3a8a"}
                              />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {stats.facultyStats.map(fs => {
                                const badgeColor = fs.color;   // same colours as every other page
                                return (
                                  <div key={fs.faculty.id} className="flex items-center justify-between bg-white border border-slate-100 rounded-lg px-3 py-2">
                                    <div>
                                      <div className="text-sm font-medium text-slate-900">{fs.faculty.name}</div>
                                      <div className="text-xs text-slate-400">{fs.assigned}/{fs.faculty.maxUnits} units ({fs.pct}%)</div>
                                    </div>
                                    <span title={fs.reason} className={"text-xs font-medium px-2 py-1 rounded-full " + badgeColor}>{fs.status}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// WorkloadPage — teaching load for every faculty member.
//   • "How is load status calculated?" panel: the exact rules, built from
//     LOAD_RULES so the text always matches what loadStatusFor() does.
//   • Summary cards: how many teachers are in each status, total units
//     assigned against total capacity, the average load, and the gap between
//     the most and least loaded teacher.
//   • Table: assigned and maximum units, a Load % bar (with a tick at the
//     cutoff), "vs. average" (how far each teacher is above or below the
//     group's average load), and the status (hover it to see why).
//   • Click a row to see the exact classes that make up that teacher's units.
// ---------------------------------------------------------------------
function WorkloadPage({ faculty, sections, result, slotById, roomById }) {
  const [showRules, setShowRules] = useState(false);
  const [expanded, setExpanded] = useState({});      // { facultyId: true } for rows that are open
  const cut = LOAD_RULES.nearCapacityPct;

  // Status for every teacher, from the shared rule.
  const rows = faculty.map(f => ({ f, st: loadStatusFor(f, sections, result, faculty) }));

  // Group numbers. Teachers with a maximum of 0 are left out of the averages
  // (a load % can't be calculated for them).
  const measurable = rows.filter(r => r.f.maxUnits > 0);
  const avgPct = result && measurable.length ? Math.round(measurable.reduce((a, r) => a + r.st.pct, 0) / measurable.length) : null;
  const totalAssigned = rows.reduce((a, r) => a + r.st.assigned, 0);
  const totalCapacity = faculty.reduce((a, f) => a + Math.max(0, f.maxUnits), 0);
  const byPct = measurable.slice().sort((x, y) => y.st.pct - x.st.pct);
  const highest = result && byPct.length ? byPct[0] : null;
  const lowest = result && byPct.length ? byPct[byPct.length - 1] : null;
  const counts = { "Overloaded": 0, "Near capacity": 0, "Balanced": 0, "Light load": 0, "Underloaded": 0 };
  const avgUnitsNow = averageUnits(faculty, sections, result);              // for the Light load explanation
  const lightBelow = avgUnitsNow * LOAD_RULES.lightLoadShare;
  if (result) rows.forEach(r => { if (counts[r.st.label] != null) counts[r.st.label]++; });

  // Example ranges for a 21-unit maximum, CALCULATED from the rule (not typed in),
  // so they stay correct if the cutoff is ever changed.
  const exMax = 21;
  let lastBalanced = 0;
  for (let u = 1; u <= exMax; u++) if (Math.round((u / exMax) * 100) < cut) lastBalanced = u;

  // The classes one teacher teaches, in weekly order.
  function classesOf(fid) {
    if (!result) return [];
    return result.genes.map((g, i) => ({ g, sec: sections[i] }))
      .filter(x => x.sec && x.g.facultyId === fid && x.g.slotId >= 0)
      .sort((a, b) => a.g.slotId - b.g.slotId);
  }
  const barColor = { "Overloaded": "bg-rose-500", "Near capacity": "bg-orange-400", "Balanced": "bg-emerald-500", "Light load": "bg-blue-400", "Underloaded": "bg-slate-300", "No assignment yet": "bg-slate-200" };

  return (
    <div className="space-y-5">
      {/* ---- How is this calculated? ---- */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
        <button onClick={() => setShowRules(v => !v)} aria-expanded={showRules}
          className="w-full flex items-center justify-between px-5 py-4 text-left">
          <span className="flex items-center gap-2 font-semibold text-slate-900 text-sm">
            <IconAlertCircle size={16} className="text-blue-600" /> How is load status calculated?
          </span>
          <IconChevronDown size={16} className={"text-slate-400 transition-transform " + (showRules ? "rotate-180" : "")} />
        </button>
        {showRules && (
          <div className="px-5 pb-5 text-sm text-slate-600 space-y-3 border-t border-slate-100 pt-4">
            <p><span className="font-semibold text-slate-800">Load %</span> = assigned units ÷ the teacher's own maximum units × 100, rounded to a whole number. <span className="font-semibold text-slate-800">Assigned units</span> are the units of the classes the teacher has in the current schedule. Classes you removed by hand don't count.</p>
            <div>
              <p className="font-semibold text-slate-800 mb-1">The rules, checked in this order:</p>
              <ol className="list-decimal pl-5 space-y-0.5">
                <li><span className="font-medium text-rose-700">Overloaded</span>: more units than the teacher's maximum.</li>
                <li><span className="font-medium text-orange-700">Near capacity</span>: load is {cut}% or more (but not over the maximum).</li>
                <li><span className="font-medium text-slate-600">Underloaded</span>: 0 units, no classes in the current schedule.</li>
                <li><span className="font-medium text-blue-800">Light load</span>: fewer than half the <span className="font-semibold">average units per teacher</span> in this schedule{result ? " (now " + avgUnitsNow.toFixed(1) + " units per teacher, so below " + lightBelow.toFixed(1) + " units)" : ""}. This one compares the teacher with colleagues.</li>
                <li><span className="font-medium text-emerald-700">Balanced</span>: everything else: below {cut}% of their own maximum and at least half the average load.</li>
              </ol>
            </div>
            <p><span className="font-semibold text-slate-800">Example, {exMax}-unit maximum:</span> 0 units Underloaded · 1–{lastBalanced} Balanced or Light load (depending on the average) · {lastBalanced + 1}–{exMax} Near capacity · {exMax + 1} or more Overloaded.</p>
            <div className="bg-slate-50 rounded-lg p-3 space-y-1.5 text-xs text-slate-600">
              <p><span className="font-semibold">Overloaded and Near capacity compare a teacher with their own maximum; Light load compares them with colleagues.</span> A teacher can still be Balanced at 15% if everyone's load is low. Use the <span className="font-semibold">vs. average</span> column and the <span className="font-semibold">Load gap</span> card for exact comparisons.</p>
              <p>The {cut}% cutoff is a setting of this prototype, not a CHED or school rule.</p>
              <p>When generating a schedule, the AI tries to spread teaching units evenly across all teachers. Light load uses that same measure (units compared with the average), so it shows where that evening-out could not reach a teacher, usually because few subjects match their specializations.</p>
              <p>Only teaching units are counted. Research, extension and administrative load are not included yet.</p>
            </div>
            <div>
              <p className="font-semibold text-slate-800 mb-1">Why can a teacher's load be low (for example 3 of 18)?</p>
              <ul className="list-disc pl-5 space-y-0.5">
                <li><span className="font-medium">Few subjects they can teach.</span> A teacher can only get subjects that match their specializations. If only one or two subjects match, their load stays small however the AI arranges things. Click a teacher to see how many subjects they qualify for.</li>
                <li><span className="font-medium">Little teaching to share.</span> {result ? "This schedule has " + totalAssigned + " units of classes for " + totalCapacity + " units of teacher capacity, about " + (faculty.length ? (totalAssigned / faculty.length).toFixed(1) : "0") + " units per teacher on average. When demand is low, most teachers are well below their maximum." : "When there is less teaching than teacher capacity, most teachers are well below their maximum."}</li>
                <li><span className="font-medium">How the AI balances.</span> It tries to make teaching units as even as possible across all teachers, but only among teachers who are qualified and available, and it also weighs preferred days and room fit. It never gives a subject to an unqualified teacher just to even things out.</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* ---- Summary cards ---- */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Overloaded" value={result ? counts["Overloaded"] : "—"} color={result && counts["Overloaded"] ? "#e11d48" : undefined} />
        <StatCard label="Near capacity" value={result ? counts["Near capacity"] : "—"} color={result && counts["Near capacity"] ? "#c2410c" : undefined} />
        <StatCard label="Balanced" value={result ? counts["Balanced"] : "—"} color={result ? "#047857" : undefined} />
        <StatCard label="Light load" value={result ? counts["Light load"] : "—"} color={result && counts["Light load"] ? "#1e40af" : undefined} />
        <StatCard label="Underloaded" value={result ? counts["Underloaded"] : "—"} />
      </section>
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Units assigned / capacity" value={result ? totalAssigned + " / " + totalCapacity : "—"}
          sub={result && totalCapacity ? Math.round((totalAssigned / totalCapacity) * 100) + "% of all teachers' maximum units" : undefined} />
        <StatCard label="Average load" value={avgPct != null ? avgPct + "%" : "—"} sub={result ? "across " + measurable.length + " teachers" : undefined} />
        <StatCard label="Load gap (highest − lowest)" value={highest ? (highest.st.pct - lowest.st.pct) + " pts" : "—"}
          sub={highest ? "Highest: " + highest.f.name + " " + highest.st.pct + "% · Lowest: " + lowest.f.name + " " + lowest.st.pct + "%" : undefined} />
      </section>

      {/* ---- Table ---- */}
      <TableShell title="Academic Workload Management">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-slate-400 text-xs border-b border-slate-100">
              <th className="px-6 py-3 font-medium">Faculty</th><th className="px-6 py-3 font-medium">Assigned Units</th>
              <th className="px-6 py-3 font-medium">Max Units</th><th className="px-6 py-3 font-medium">Load %</th>
              <th className="px-6 py-3 font-medium">vs. average</th><th className="px-6 py-3 font-medium">Load Status</th>
            </tr></thead>
            <tbody>
              {rows.map(({ f, st }) => {
                const open = !!expanded[f.id];
                const pctText = f.maxUnits > 0 ? st.pct + "%" : "—";
                // How far this teacher is from the group's average load, in percentage points.
                const diff = avgPct != null && f.maxUnits > 0 ? st.pct - avgPct : null;
                const list = open ? classesOf(f.id) : [];
                return (
                  <React.Fragment key={f.id}>
                    <tr onClick={() => setExpanded(prev => ({ ...prev, [f.id]: !prev[f.id] }))}
                      className="border-b border-slate-50 hover:bg-slate-50/50 cursor-pointer">
                      <td className="px-6 py-3 font-medium text-slate-900">
                        <span className="flex items-center gap-2">
                          <IconChevronDown size={14} className={"text-slate-400 shrink-0 transition-transform " + (open ? "rotate-180" : "")} />
                          {f.name}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-slate-500">{st.assigned}</td>
                      <td className="px-6 py-3 text-slate-500">{f.maxUnits}</td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2 min-w-[140px]">
                          {/* Bar fills to the load % (capped at 100); the dark tick marks the cutoff. */}
                          <div className="relative h-2 w-24 rounded-full bg-slate-100 overflow-hidden">
                            <div className={"absolute inset-y-0 left-0 " + barColor[st.label]} style={{ width: Math.min(100, f.maxUnits > 0 ? st.pct : 0) + "%" }} />
                            <div className="absolute inset-y-0 w-0.5 bg-slate-500" style={{ left: cut + "%" }} title={cut + "% cutoff"} />
                          </div>
                          <span className="text-xs text-slate-600 w-10">{pctText}</span>
                        </div>
                      </td>
                      <td className={"px-6 py-3 text-xs font-medium " + (diff == null ? "text-slate-400" : diff > 0 ? "text-rose-700" : diff < 0 ? "text-blue-600" : "text-slate-500")}>
                        {diff == null ? "—" : diff > 0 ? "+" + diff + " pts" : diff < 0 ? "−" + Math.abs(diff) + " pts" : "±0 pts"}
                      </td>
                      <td className="px-6 py-3">
                        <span title={st.reason} className={"text-xs font-medium px-2 py-1 rounded-full " + st.color}>{st.label}</span>
                      </td>
                    </tr>
                    {open && (
                      <tr className="bg-slate-50/60">
                        <td colSpan={6} className="px-6 py-4">
                          <div className="text-xs text-slate-600 mb-1"><span className="font-semibold text-slate-800">Why {st.label}:</span> {st.reason}</div>
                          {(() => {
                            // How much teaching this teacher COULD get: subjects matching their specializations.
                            const canTeach = sections.filter(sec => f.specializations.includes(sec.requiredSpecialization));
                            const canUnits = canTeach.reduce((a, sec) => a + sec.units, 0);
                            const avgUnits = faculty.length ? totalAssigned / faculty.length : 0;
                            return (
                              <div className="text-xs text-slate-600 mb-2">
                                <span className="font-semibold text-slate-800">Can teach:</span> {canTeach.length} of {sections.length} subjects ({canUnits} units in total), from their specializations: {f.specializations.join(", ") || "none"}.
                                {result && <> Average per teacher in this schedule: {avgUnits.toFixed(1)} units.</>}
                                {result && canUnits < avgUnits && <span className="text-orange-700"> Even with every subject they qualify for, they would stay below the average.</span>}
                              </div>
                            );
                          })()}
                          {list.length === 0 ? (
                            <div className="text-sm text-slate-400">{result ? "No classes in the current schedule." : "Generate a schedule to see this teacher's classes."}</div>
                          ) : (
                            <div>
                              <ul className="divide-y divide-slate-100 bg-white border border-slate-100 rounded-lg">
                                {list.map(({ g, sec }) => {
                                  const slot = slotById[g.slotId];
                                  return (
                                    <li key={sec.id} className="px-3 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-sm">
                                      <span><span className="font-medium text-slate-900">{sec.subjectCode}</span> <span className="text-slate-500">{sec.subjectName} · {sec.sectionName}</span></span>
                                      <span className="text-xs text-slate-500 whitespace-nowrap">
                                        {slot ? describeSlots([g.slotId], slotById) + " (" + slot.label.split(" ")[1] + ")" : "—"} · {roomLabel(g.roomId, roomById)} · <span className="font-semibold text-slate-700">{sec.units} units</span>
                                      </span>
                                    </li>
                                  );
                                })}
                              </ul>
                              <div className="text-xs text-slate-600 mt-2">Total: <span className="font-semibold">{list.reduce((a, x) => a + x.sec.units, 0)} units</span> across {list.length} class{list.length === 1 ? "" : "es"}, out of a maximum of {f.maxUnits}.</div>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        {!result && <div className="px-6 py-4 text-sm text-slate-400">Generate a schedule to see assigned units per faculty member.</div>}
        {result && <div className="px-6 py-3 text-xs text-slate-400 border-t border-slate-50">Click a teacher to see their classes. Hover a status to see why.</div>}
      </TableShell>
    </div>
  );
}

// CurriculumToggle: the checkbox that turns curriculum-aware scheduling on/off.
function CurriculumToggle({ curriculumAware, setCurriculumAware }) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 cursor-pointer">
      <input type="checkbox" checked={curriculumAware} onChange={e=>setCurriculumAware(e.target.checked)} className="accent-amber-500" />
      <span>Use curriculum (avoid overlaps within the same program, year level &amp; semester)</span>
    </label>
  );
}

// RegenerationBanner: shown when something (an approved availability change,
// an ended leave, a new subject, a new fixed time) means the schedule should
// be updated.
//   "Update affected classes" — moves ONLY the classes that now break a rule
//                               (recommended; everything else stays put).
//   "Full regenerate"         — builds a brand-new schedule from scratch.
// Faculty are only told that an update is coming.
function RegenerationBanner({ result, canEdit, generating, onGenerate, onUpdate }) {
  if (!result || !result.needsRegeneration) return null;
  const n = (result.needsRegeneration.triggers || []).length;
  return (
    <div className="no-print bg-orange-50 border border-orange-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-start gap-2 text-sm text-orange-900">
        <IconAlertCircle size={18} className="text-orange-700 shrink-0 mt-0.5" />
        <div>
          <div className="font-semibold">Schedule needs an update</div>
          <div>{result.needsRegeneration.reason}{n > 1 ? " (+" + (n - 1) + " earlier change" + (n > 2 ? "s" : "") + ")" : ""}</div>
        </div>
      </div>
      {canEdit ? (
        <div className="flex flex-col items-stretch sm:items-end gap-1.5 shrink-0">
          <button onClick={onUpdate} disabled={generating}
            className="flex items-center justify-center gap-1.5 bg-orange-700 hover:bg-orange-800 text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-60">
            <IconRefresh size={14} /> {generating ? "Updating..." : "Update affected classes"}
          </button>
          <button onClick={onGenerate} disabled={generating} className="text-xs text-orange-800 underline">or full regenerate (rebuilds everything)</button>
        </div>
      ) : <span className="text-xs text-orange-800 shrink-0">Your schedule will be updated soon.</span>}
    </div>
  );
}

// UpdateSummary: after an "Update affected classes", lists exactly which
// classes moved (from → to), how many stayed put, and confirms that every
// approved blocked-times request is respected.
function UpdateSummary({ result, sections, facultyById, slotById }) {
  const u = result.updateSummary;
  if (result.kind !== "update" || !u) return null;
  const where = (g) => {
    if (!g || g.slotId === -1 || g.isNew) return "not scheduled";
    const f = facultyById[g.facultyId];
    return describeSlots([g.slotId], slotById) + " · " + (f ? f.name : "—");
  };
  return (
    <div className="no-print bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <h3 className="font-semibold text-slate-900 text-sm">What changed in this update</h3>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700">{u.moved} moved</span>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">{u.unchanged} unchanged</span>
        {u.shifted > 0 && <span className="text-xs text-slate-500">({u.shifted} shifted to make room)</span>}
      </div>
      {u.honoured.map((h, i) => (
        <div key={i} className={"text-xs rounded-lg px-3 py-1.5 mb-2 " + (h.clashes ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700")}>
          {h.clashes ? "⚠ " + h.name + " still has " + h.clashes + " class(es) in " + h.slots + " — try Full regenerate."
            : "✓ " + h.name + "'s request is respected — no classes in " + h.slots + "."}
        </div>
      ))}
      <ul className="divide-y divide-slate-50">
        {u.changes.map(c => {
          const sec = sections[c.index];
          if (!sec) return null;
          return (
            <li key={c.index} className="py-2 text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
              <span className="font-medium text-slate-900">{sec.subjectCode} · {sec.sectionName}</span>
              <span className="text-xs text-slate-500">{where(c.from)} <span className="text-slate-400">→</span> <span className="text-slate-800 font-medium">{where(c.to)}</span></span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// MyAvailabilitySection: the Faculty member's availability & leave area,
// shown inside "My Schedule". It lists the times they are currently blocked,
// a button that opens the weekly picker, and the status of every request they filed.
function MyAvailabilitySection({ me, leaveRequests, slotById, onNewRequest }) {
  if (!me) return null;
  const mine = leaveRequests.filter(r => r.facultyId === me.id);
  const statusCls = (st) => st === "Approved" ? "text-emerald-700 bg-emerald-50" : st === "Denied" ? "text-rose-700 bg-rose-50"
    : st === "Ended" ? "text-slate-600 bg-slate-100" : "text-orange-700 bg-orange-50";
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div>
          <h3 className="font-semibold text-slate-900 text-sm">My Availability & Leave</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Currently unavailable: <span className="font-medium text-slate-700">{(me.unavailableSlotIds || []).length ? describeSlots(me.unavailableSlotIds, slotById) : "none"}</span>
          </p>
        </div>
        <button onClick={() => onNewRequest(me.id)}
          className="shrink-0 flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-[#0b1d4a] text-sm font-medium px-3.5 py-2 rounded-lg">
          <IconPlus size={15} /> Request Availability Change / Leave
        </button>
      </div>
      {mine.length === 0 ? <EmptyNote>You haven't submitted any requests.</EmptyNote> : (
        <ul className="divide-y divide-slate-50">
          {mine.map(r => (
            <li key={r.id} className="py-2.5 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-medium text-slate-900">{r.type}
                  {r.dateFrom && <span className="text-xs font-normal text-slate-500"> · {r.dateFrom}{r.dateTo ? " to " + r.dateTo : ""}</span>}
                </div>
                <div className="text-xs text-slate-600">{describeSlots(r.slotIds, slotById)}</div>
                <div className="text-xs text-slate-400">{r.description}</div>
              </div>
              <span className={"shrink-0 text-xs font-medium px-2 py-0.5 rounded-full " + statusCls(r.status)}>{r.status}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// SchedulesPage: where schedules are generated, reviewed, approved, and edited.
//   • Approval panel (Approve/Reject for Admin & Chair, Export CSV, Print/PDF)
//   • Convergence chart for the latest run
//   • "Weekly Grid": builds grid[day][period] from the genes, then draws it
//   • "By Faculty" / "My Schedule": one person's classes in time order
// Clicking a class opens AssignmentModal (not available to Faculty role).
// For the Faculty role, the person shown is always myFacultyId.
function SchedulesPage({ result, sections, facultyById, roomById, slotById, timeSlots, generating, onGenerate, tab, setTab, role, faculty, rooms, selectedFacultyId, setSelectedFacultyId, curriculumAware, setCurriculumAware, onEditAssignment, onApprovalDecision, myFacultyId, leaveRequests, onNewRequest, onUpdateSchedule }) {
  // Permissions for this page: faculty can only view; only Admin/Chair approve.
  const canEdit = role !== "faculty";
  const canApprove = role === "admin" || role === "chair";
  const [approvalComment, setApprovalComment] = useState("");
  const [showChart, setShowChart] = useState(true);     // "Hide chart" toggle in the convergence card
  const me = faculty.find(f => f.id === myFacultyId) || null;   // the signed-in faculty member (Faculty role)

  if (!result) {
    return (
      <div className="space-y-5">
      {/* Faculty can manage availability even before any schedule exists. */}
      {role === "faculty" && <MyAvailabilitySection me={me} leaveRequests={leaveRequests} slotById={slotById} onNewRequest={onNewRequest} />}
      <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-100 text-center">
        <IconCalendar size={40} className="mx-auto text-slate-300 mb-4" />
        <h3 className="font-semibold text-slate-900 mb-2">No schedule generated yet</h3>
        <p className="text-sm text-slate-500 mb-5">Run the AI Optimization Engine to generate a conflict-free schedule from your current faculty, subjects, and rooms.</p>
        {canEdit && (
          <div className="max-w-md mx-auto mb-5">
            <CurriculumToggle curriculumAware={curriculumAware} setCurriculumAware={setCurriculumAware} />
          </div>
        )}
        {canEdit && (
          <button onClick={onGenerate} disabled={generating}
            className="bg-amber-400 hover:bg-amber-300 text-[#0b1d4a] font-medium text-sm px-5 py-2.5 rounded-lg disabled:opacity-60">
            {generating ? "Generating..." : "Generate Schedule"}
          </button>
        )}
      </div>
      </div>
    );
  }

  const facultyList = role === "faculty" ? faculty.filter(f => f.id === myFacultyId) : faculty;
  const activeFacultyId = role === "faculty"
    ? myFacultyId
    : (selectedFacultyId != null ? selectedFacultyId : facultyList[0]?.id);

  // Build the weekly grid: grid["Mon"][3] = a LIST of every class held Monday
  // period 3. It must be a list: several sections can run at the same time in
  // different rooms (or online). Removed classes (slotId -1) are skipped.
  const grid = {};
  E.DAYS.forEach(d => grid[d] = {});
  result.genes.forEach((g, i) => {
    const slot = slotById[g.slotId];
    if (!slot) return;
    (grid[slot.day][slot.period] = grid[slot.day][slot.period] || []).push(
      { section: sections[i], faculty: facultyById[g.facultyId], roomId: g.roomId, index: i });
  });

  const periods = Array.from({length: E.PERIODS}, (_,i) => i+1);
  const unscheduledCount = result.violations.unscheduled || 0;
  // Classes moved by the last "Update affected classes" get an amber outline in the grid.
  const movedSet = new Set(result.kind === "update" && result.updateSummary ? result.updateSummary.changes.map(c => c.index) : []);

  return (
    <div className="space-y-5">
      <RegenerationBanner result={result} canEdit={canEdit} generating={generating} onGenerate={onGenerate} onUpdate={onUpdateSchedule} />
      <UpdateSummary result={result} sections={sections} facultyById={facultyById} slotById={slotById} />
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <span className={"text-sm font-medium px-3 py-1.5 rounded-lg " + (result.feasible ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700")}>
            {result.feasible ? "✓ Conflict-free" : "⚠ " + result.violations.total + " conflicts remaining"}
          </span>
          {result.curriculumAware && (
            <span className={"text-sm font-medium px-3 py-1.5 rounded-lg " + (result.curriculumConflicts === 0 ? "bg-blue-50 text-blue-700" : "bg-orange-50 text-orange-700")}>
              Curriculum: {result.curriculumConflicts === 0 ? "no overlaps" : result.curriculumConflicts + " overlaps"}
            </span>
          )}
          {unscheduledCount > 0 && (
            <span className="text-sm font-medium px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600">{unscheduledCount} unscheduled (manually removed)</span>
          )}
          <span className="text-sm text-slate-400">Fitness score: {result.fitness.toFixed(1)} · {result.convergence.length} generations</span>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && <CurriculumToggle curriculumAware={curriculumAware} setCurriculumAware={setCurriculumAware} />}
          {canEdit && (
            <button onClick={onGenerate} disabled={generating} title="Builds a brand-new schedule from scratch; every class may move."
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium px-3.5 py-2 rounded-lg disabled:opacity-60">
              <IconRefresh size={14}/> {generating ? "Regenerating..." : "Full Regenerate"}
            </button>
          )}
        </div>
      </div>

      <div className="no-print bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-900">Approval Status:</span>
            <span className={"text-xs font-semibold px-2.5 py-1 rounded-full " +
              (result.approvalStatus === "Approved" ? "bg-emerald-50 text-emerald-700"
                : result.approvalStatus === "Rejected" ? "bg-rose-50 text-rose-700"
                : "bg-orange-50 text-orange-700")}>
              {result.approvalStatus || "Pending Review"}
            </span>
            {result.approvalComment && <span className="text-xs text-slate-500 italic">“{result.approvalComment}”</span>}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => {
                const rows = result.genes.map((g, i) => {
                  const sec = sections[i], fac = facultyById[g.facultyId], slot = slotById[g.slotId];
                  if (!sec) return null;   // safety: a gene with no matching subject is skipped
                  return [slot ? slot.day : "Unscheduled", slot ? slot.label : "", sec.program || "", sec.subjectCode, sec.subjectName, sec.sectionName, yearLabel(sec.yearLevel), classTypeLabel(sec), fac ? fac.name : "", g.roomId === -1 ? "" : roomLabel(g.roomId, roomById)];
                }).filter(Boolean);
                downloadCSV("timetable.csv", ["Day","Time","Program","Code","Subject","Section","Year Level","Class Type","Faculty","Room"], rows);
              }}
              className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium px-3 py-2 rounded-lg">
              <IconDownload size={15} /> Export CSV
            </button>
            <button onClick={() => window.print()}
              className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium px-3 py-2 rounded-lg">
              <IconPrinter size={15} /> Print / Save PDF
            </button>
          </div>
        </div>
        {canApprove && (result.approvalStatus || "Pending Review") === "Pending Review" && (
          <div className="mt-4 flex flex-col sm:flex-row gap-2">
            <input className={inputCls + " flex-1"} value={approvalComment} onChange={e => setApprovalComment(e.target.value)}
              placeholder="Optional comment for this decision" />
            <button onClick={() => { onApprovalDecision("Approved", approvalComment); setApprovalComment(""); }}
              className="flex items-center justify-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium px-4 py-2 rounded-lg">
              <IconThumbsUp size={15} /> Approve
            </button>
            <button onClick={() => { onApprovalDecision("Rejected", approvalComment); setApprovalComment(""); }}
              className="flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
              <IconThumbsDown size={15} /> Reject
            </button>
          </div>
        )}
      </div>

      <div className="no-print bg-white rounded-2xl px-5 py-4 shadow-sm border border-slate-100">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <h3 className="font-semibold text-slate-900 text-sm">GA Convergence <span className="font-normal text-slate-500">· how the AI improved this schedule</span></h3>
          <div className="flex flex-wrap items-center gap-3">
            {showChart && <ChartLegend />}
            <button onClick={() => setShowChart(v => !v)} className="text-xs font-medium text-blue-800 hover:underline">{showChart ? "Hide chart" : "Show chart"}</button>
          </div>
        </div>
        {showChart && (
          <>
            <ConvergenceChart convergence={result.convergence} />
            <ConvergenceCaption result={result} />
          </>
        )}
      </div>

      <div className="no-print flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2">
          <button onClick={()=>setTab("grid")} className={"text-sm font-medium px-4 py-2 rounded-lg " + (tab==="grid"?"bg-slate-900 text-white":"bg-white text-slate-600 border border-slate-200")}>Weekly Grid</button>
          <button onClick={()=>setTab("faculty")} className={"text-sm font-medium px-4 py-2 rounded-lg " + (tab==="faculty"?"bg-slate-900 text-white":"bg-white text-slate-600 border border-slate-200")}>{role === "faculty" ? "My Schedule" : "By Faculty"}</button>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-50 border border-blue-100 inline-block" />Online</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-50 border border-amber-200 inline-block" />Laboratory</span>
          {canEdit && <span>· Click any class to edit or remove it</span>}
        </div>
      </div>

      {tab === "grid" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead><tr>
              <th className="p-2 border border-slate-100 bg-slate-50 w-20">Period</th>
              {E.CALENDAR_DAYS.map(d => <th key={d} className={"p-2 border border-slate-100 " + (d === "Sun" ? "bg-slate-100 text-slate-400" : "bg-slate-50")}>{d}</th>)}
            </tr></thead>
            <tbody>
              {periods.map(p => (
                <tr key={p}>
                  <td className="p-2 border border-slate-100 text-slate-400 text-center font-medium">P{p}</td>
                  {E.CALENDAR_DAYS.map(d => {
                    // Sunday: one tall greyed cell spanning all periods (no classes on Sunday).
                    if (d === "Sun") {
                      return p === 1 ? (
                        <td key={d} rowSpan={E.PERIODS} className="border border-slate-100 bg-slate-50 text-center text-slate-400 min-w-[70px] align-middle">
                          No classes
                        </td>
                      ) : null;
                    }
                    const cells = grid[d][p] || [];
                    return (
                      <td key={d} className="p-1.5 border border-slate-100 align-top min-w-[140px]">
                        <div className="space-y-1.5">
                          {cells.map(cell => (
                            <div key={cell.index}
                              onClick={() => canEdit && onEditAssignment(cell.index, result.genes[cell.index])}
                              className={(E.isOnline(cell.section) ? "bg-blue-50 border-blue-100" : "bg-amber-50 border-amber-200") +
                                " border rounded-lg p-2 " + (movedSet.has(cell.index) ? "ring-2 ring-orange-400 " : "") +
                                (canEdit ? "cursor-pointer hover:brightness-95 transition" : "")}>
                              {movedSet.has(cell.index) && <div className="text-[10px] font-semibold text-orange-700 uppercase">Moved</div>}
                              <div className="font-semibold text-slate-900">{cell.section.subjectCode} · {cell.section.sectionName}
                                {cell.section.fixedSlotId != null && <span title="Fixed day/period" className="ml-1 text-[10px] text-slate-500">📌</span>}
                              </div>
                              <div className="text-slate-500">{cell.faculty ? cell.faculty.name : "—"}</div>
                              <div className="text-slate-400">{roomLabel(cell.roomId, roomById)}</div>
                            </div>
                          ))}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Faculty members manage availability and leave right inside their schedule. */}
      {tab === "faculty" && role === "faculty" && (
        <MyAvailabilitySection me={me} leaveRequests={leaveRequests} slotById={slotById} onNewRequest={onNewRequest} />
      )}

      {tab === "faculty" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          {role !== "faculty" && (
            <select value={activeFacultyId} onChange={e=>setSelectedFacultyId(Number(e.target.value))} className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
              {facultyList.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          )}
          <div className="mt-4 space-y-2">
            {result.genes.map((g,i) => ({g,i}))
              .filter(({g}) => g.facultyId === activeFacultyId)
              .sort((a,b) => a.g.slotId - b.g.slotId)
              .map(({g,i}) => {
                const slot = slotById[g.slotId], sec = sections[i];
                return (
                  <div key={i} onClick={() => canEdit && onEditAssignment(i, g)}
                    className={"flex items-center justify-between border border-slate-100 rounded-lg px-4 py-2.5 " + (canEdit ? "cursor-pointer hover:bg-slate-50 transition-colors" : "")}>
                    <div>
                      <div className="font-medium text-slate-900 text-sm">{sec.subjectCode} — {sec.subjectName}</div>
                      <div className="text-xs text-slate-400">{sec.sectionName} · {yearLabel(sec.yearLevel)} · {roomLabel(g.roomId, roomById)}</div>
                    </div>
                    <div className="text-sm text-slate-500">{slot ? slot.label : "—"}</div>
                  </div>
                );
              })}
            {result.genes.filter(g => g.facultyId === activeFacultyId).length === 0 && (
              <div className="text-sm text-slate-400 text-center py-6">No sections assigned to this faculty member in the current schedule.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// HistoryPage: every generated version (newest first). "Best" = highest
// fitness, "Current" = the one in use. Restore makes an older one current.
function HistoryPage({ history, currentId, onRestore }) {
  if (history.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-100 text-center">
        <IconHistory size={40} className="mx-auto text-slate-300 mb-4" />
        <h3 className="font-semibold text-slate-900 mb-2">No schedule versions yet</h3>
        <p className="text-sm text-slate-500">Every time you generate a schedule, a version is saved here so you can compare and restore earlier runs.</p>
      </div>
    );
  }
  const best = history.reduce((a, b) => (b.fitness > a.fitness ? b : a));
  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h3 className="font-semibold text-slate-900 mb-1 text-sm">Fitness Across Versions</h3>
        <p className="text-xs text-slate-400 mb-3">Higher is better. Each bar is one generated schedule (oldest to newest).</p>
        <BarChart
          data={history.slice().reverse().map((h, i) => ({ label: "v" + (i + 1), value: Math.max(0, Math.round(h.fitness)) }))}
          colorFn={() => "#b7791f"} />
      </div>
      <TableShell title={"Schedule History (" + history.length + ")"}
        onExport={() => downloadCSV("schedule_history.csv",
          ["Version","Type","Generated","Feasible","Conflicts","Fitness","Generations","Curriculum-aware","Approval"],
          history.slice().reverse().map((h, i) => ["v" + (i + 1), h.kind === "update" ? "Update" : "Full", new Date(h.generatedAt).toLocaleString(), h.feasible ? "Yes" : "No", h.violations.total, h.fitness.toFixed(1), h.convergence.length, h.curriculumAware ? "Yes" : "No", h.approvalStatus || "Pending Review"]))}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-slate-400 text-xs border-b border-slate-100">
              <th className="px-6 py-3 font-medium">Version</th><th className="px-6 py-3 font-medium">Type</th><th className="px-6 py-3 font-medium">Generated</th>
              <th className="px-6 py-3 font-medium">Conflicts</th><th className="px-6 py-3 font-medium">Fitness</th>
              <th className="px-6 py-3 font-medium">Generations</th><th className="px-6 py-3 font-medium">Curriculum</th>
              <th className="px-6 py-3 font-medium"></th>
            </tr></thead>
            <tbody>
              {history.map((h, idx) => {
                const versionNum = history.length - idx;
                const isCurrent = h.id === currentId;
                return (
                  <tr key={h.id} className={"border-b border-slate-50 " + (isCurrent ? "bg-amber-50/70" : "hover:bg-slate-50/50")}>
                    <td className="px-6 py-3 font-medium text-slate-900">
                      v{versionNum}
                      {h.id === best.id && <span className="ml-2 text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-full">Best</span>}
                      {isCurrent && <span className="ml-2 text-[10px] font-semibold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full">Current</span>}
                    </td>
                    <td className="px-6 py-3 text-slate-500 whitespace-nowrap">
                      {h.kind === "update" ? "Update (" + (h.updateSummary ? h.updateSummary.moved : 0) + " moved)" : "Full"}
                    </td>
                    <td className="px-6 py-3 text-slate-500 whitespace-nowrap">{new Date(h.generatedAt).toLocaleString()}</td>
                    <td className="px-6 py-3">
                      <span className={"text-xs font-semibold px-2 py-1 rounded-full " + (h.violations.total > 0 ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700")}>{h.violations.total}</span>
                    </td>
                    <td className="px-6 py-3 text-slate-500">{h.fitness.toFixed(1)}</td>
                    <td className="px-6 py-3 text-slate-500">{h.convergence.length}</td>
                    <td className="px-6 py-3 text-slate-500">{h.curriculumAware ? "On" : "Off"}</td>
                    <td className="px-6 py-3 text-right">
                      {!isCurrent && (
                        <button onClick={() => onRestore(h)} className="text-xs font-medium text-blue-800 hover:underline">Restore</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </TableShell>
    </div>
  );
}

// ConflictsPage: the hard-constraint report from countViolations(), one row
// per rule, with a plain-language description.
function ConflictsPage({ result, onGenerate, generating }) {
  if (!result) {
    return (
      <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-100 text-center">
        <IconAlert size={40} className="mx-auto text-slate-300 mb-4" />
        <h3 className="font-semibold text-slate-900 mb-2">No schedule to check yet</h3>
        <p className="text-sm text-slate-500 mb-5">Generate a schedule first, then this page will show a full conflict breakdown.</p>
        <button onClick={onGenerate} disabled={generating} className="bg-amber-400 hover:bg-amber-300 text-[#0b1d4a] font-medium text-sm px-5 py-2.5 rounded-lg disabled:opacity-60">
          {generating ? "Generating..." : "Generate Schedule"}
        </button>
      </div>
    );
  }
  const v = result.violations;
  const rows = [
    ["Faculty double-booking", v.facultyConflicts, "A faculty member assigned to two classes at the same time"],
    ["Room double-booking", v.roomConflicts, "A room assigned to two classes at the same time"],
    ["Unqualified assignment", v.unqualified, "Faculty assigned to a subject outside their specialization"],
    ["Faculty unavailable", v.unavailable, "Faculty scheduled during a declared unavailable time slot"],
    ["Room type mismatch", v.roomTypeMismatch, "A laboratory class without a lab room, or an online class given a room"],
    ["Fixed time not respected", v.fixedSlot || 0, "A subject with a fixed day/period is scheduled at a different time"],
    ["Room capacity exceeded", v.capacityViol, "Enrolled students exceed the assigned room's capacity"],
    ["Faculty overload (units)", v.overload, "Total units assigned beyond a faculty member's maximum load"],
  ];
  return (
    <div className="space-y-5">
      <div className={"rounded-2xl p-6 border " + (result.feasible ? "bg-emerald-50 border-emerald-100" : "bg-rose-50 border-rose-100")}>
        <div className="flex items-center gap-3">
          {result.feasible ? <IconCheckCircle size={24} className="text-emerald-700" /> : <IconAlert size={24} className="text-rose-700" />}
          <div>
            <div className="font-semibold text-slate-900">{result.feasible ? "No conflicts detected" : v.total + " conflicts detected"}</div>
            <div className="text-sm text-slate-500">Checked across {rows.length} constraint categories after {result.convergence.length} generations of optimization.</div>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-slate-400 text-xs border-b border-slate-100">
            <th className="px-6 py-3 font-medium">Constraint</th><th className="px-6 py-3 font-medium">Count</th><th className="px-6 py-3 font-medium">Description</th>
          </tr></thead>
          <tbody>
            {rows.map(([name, count, desc]) => (
              <tr key={name} className="border-b border-slate-50">
                <td className="px-6 py-3 font-medium text-slate-900">{name}</td>
                <td className="px-6 py-3">
                  <span className={"text-xs font-semibold px-2 py-1 rounded-full " + (count>0?"bg-rose-50 text-rose-700":"bg-emerald-50 text-emerald-700")}>{count}</span>
                </td>
                <td className="px-6 py-3 text-slate-500">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ReportCard: a titled card with its own CSV export button (used for each report).
function ReportCard({ title, subtitle, onExport, children }) {
  return (
    <div className="print-area bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="font-semibold text-slate-900">{title}</h3>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        {onExport && (
          <button onClick={onExport} className="no-print shrink-0 flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium px-2.5 py-1.5 rounded-lg">
            <IconDownload size={13} /> CSV
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

// RoomHeatmap: a room × day grid. Each cell counts how many of the 6 periods
// that room is used on that day; darker blue = busier.
function RoomHeatmap({ rooms, result, slotById }) {
  const usage = {};
  result.genes.forEach(g => {
    const slot = slotById[g.slotId];
    if (!slot || g.roomId === -1) return;
    const key = g.roomId + "-" + slot.day;
    usage[key] = (usage[key] || 0) + 1;
  });
  const max = E.PERIODS;
  const shade = (n) => {
    if (!n) return "#f1f5f9";
    const t = n / max;
    if (t <= 0.25) return "#dbeafe";
    if (t <= 0.5) return "#93c5fd";
    if (t <= 0.75) return "#2563eb";
    return "#1e3a8a";
  };
  return (
    <div className="overflow-x-auto">
      <table className="text-xs border-collapse">
        <thead><tr>
          <th className="p-2 text-left text-slate-400 font-medium">Room</th>
          {E.DAYS.map(d => <th key={d} className="p-2 text-slate-400 font-medium">{d}</th>)}
        </tr></thead>
        <tbody>
          {rooms.map(r => (
            <tr key={r.id}>
              <td className="p-2 text-slate-700 font-medium whitespace-nowrap">{r.name}</td>
              {E.DAYS.map(d => {
                const n = usage[r.id + "-" + d] || 0;
                return (
                  <td key={d} className="p-1">
                    <div title={n + " of " + max + " periods used"}
                      className="w-12 h-8 rounded flex items-center justify-center font-semibold"
                      style={{ background: shade(n), color: n / max > 0.5 ? "white" : "#334155" }}>
                      {n}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center gap-2 mt-3 text-[11px] text-slate-400">
        <span>Periods used per day (max {max}):</span>
        {[0, 1, 3, 4, 6].map(n => <span key={n} className="w-5 h-3 rounded inline-block" style={{ background: shade(n) }} />)}
        <span>low → high</span>
      </div>
    </div>
  );
}

// ReportsPage: the four reports named in the thesis (Faculty Teaching Load,
// Room Utilization + heatmap, Department Summary, Conflict Report), each
// exportable to CSV, plus "Print All Reports" for a PDF.
function ReportsPage({ faculty, rooms, sections, result, slotById }) {
  if (!result) {
    return <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-100 text-center text-slate-400">Generate a schedule to see analytics and reports here.</div>;
  }
  const unitsByFaculty = {};
  faculty.forEach(f => unitsByFaculty[f.id] = 0);
  result.genes.forEach((g,i) => { if (g.facultyId !== -1) unitsByFaculty[g.facultyId] = (unitsByFaculty[g.facultyId]||0) + sections[i].units; });
  const workloadData = faculty.map(f => ({ label: f.name.split(" ")[0], value: unitsByFaculty[f.id] || 0 }));

  const roomUsage = {};
  rooms.forEach(r => roomUsage[r.id] = 0);
  result.genes.forEach(g => { if (g.roomId !== -1) roomUsage[g.roomId] = (roomUsage[g.roomId]||0) + 1; });
  const totalSlots = E.DAYS.length * E.PERIODS;
  const roomData = rooms.map(r => ({ label: r.name.replace("Room ",""), value: roomUsage[r.id] || 0 }));

  const allSpecs = Array.from(new Set([...faculty.flatMap(f => f.specializations), ...sections.map(s => s.requiredSpecialization)]));
  const deptRows = allSpecs.map(spec => {
    const st = computeDepartmentStats(spec, faculty, sections, result);
    return [spec, st.deptFaculty.length, st.deptSections.length, st.loadPct + "%", st.overloads, st.conflicts];
  });

  return (
    <div className="space-y-5">
      <div className="no-print flex justify-end">
        <button onClick={() => window.print()} className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium px-3.5 py-2 rounded-lg">
          <IconPrinter size={15} /> Print All Reports / Save PDF
        </button>
      </div>

      <ReportCard title="Faculty Teaching Load Report" subtitle="Assigned teaching units per faculty member in the current schedule"
        onExport={() => downloadCSV("faculty_teaching_load_report.csv",
          ["Faculty","Academic Rank","Employment Status","Assigned Units","Max Units","Load %","Status"],
          faculty.map(f => { const st = loadStatusFor(f, sections, result, faculty); return [f.name, f.academicRank || "", f.employmentStatus || "", st.assigned, f.maxUnits, st.pct + "%", st.label]; }))}>
        <BarChart data={workloadData} colorFn={() => "#1e3a8a"} />
      </ReportCard>

      <ReportCard title="Room Utilization Report" subtitle={"Sessions held per room (out of " + totalSlots + " weekly periods)"}
        onExport={() => downloadCSV("room_utilization_report.csv",
          ["Room","Type","Capacity","Sessions","Utilization %"],
          rooms.map(r => [r.name, r.type, r.capacity, roomUsage[r.id] || 0, Math.round(((roomUsage[r.id] || 0) / totalSlots) * 100) + "%"]))}>
        <BarChart data={roomData} colorFn={() => "#b7791f"} />
        <div className="mt-5">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Utilization Heatmap (room × day)</h4>
          <RoomHeatmap rooms={rooms} result={result} slotById={slotById} />
        </div>
      </ReportCard>

      <ReportCard title="Department Summary" subtitle="Teaching load, overloads, and conflicts per specialization area"
        onExport={() => downloadCSV("department_summary.csv",
          ["Specialization","Faculty","Sections","Teaching Load","Overloads","Conflicts"], deptRows)}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-slate-400 text-xs border-b border-slate-100">
              {["Specialization","Faculty","Sections","Teaching Load","Overloads","Conflicts"].map(h => <th key={h} className="px-3 py-2 font-medium">{h}</th>)}
            </tr></thead>
            <tbody>
              {deptRows.map(r => (
                <tr key={r[0]} className="border-b border-slate-50">
                  {r.map((c, i) => <td key={i} className={"px-3 py-2 " + (i === 0 ? "font-medium text-slate-900" : "text-slate-500")}>{c}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ReportCard>

      <ReportCard title="Conflict Report" subtitle="Hard-constraint check across the current schedule"
        onExport={() => downloadCSV("conflict_report.csv", ["Constraint","Count"], [
          ["Faculty double-booking", result.violations.facultyConflicts],
          ["Room double-booking", result.violations.roomConflicts],
          ["Unqualified assignment", result.violations.unqualified],
          ["Faculty unavailable", result.violations.unavailable],
          ["Room type mismatch", result.violations.roomTypeMismatch],
          ["Fixed time not respected", result.violations.fixedSlot || 0],
          ["Room capacity exceeded", result.violations.capacityViol],
          ["Faculty overload (units)", result.violations.overload],
          ["Unscheduled (manually removed)", result.violations.unscheduled || 0],
        ])}>
        <div className="text-sm text-slate-600">
          Total hard-constraint violations: <span className={"font-semibold " + (result.violations.total ? "text-rose-700" : "text-emerald-700")}>{result.violations.total}</span>
          {" "}· Approval: <span className="font-semibold">{result.approvalStatus || "Pending Review"}</span>
        </div>
      </ReportCard>
    </div>
  );
}

// SettingsPage: short "about this prototype" text.
// SettingsPage: "About this prototype", plus Testing tools for Admin and IT:
//   • Sample data: load the standard or the expanded multi-program sample.
//   • Create test conflicts: break one rule on purpose (see makeTestConflict),
//     then check Conflict Detection and try "Update affected classes".
function SettingsPage({ role, hasSchedule, datasetKind, violationsTotal, onLoadDataset, onCreateTestConflict, testLog, onGoTo }) {
  const canTest = role === "admin" || role === "it";
  const btn = "text-left border border-slate-200 hover:border-amber-400 hover:bg-amber-50 rounded-lg px-3 py-2 text-sm text-slate-800 disabled:opacity-50 disabled:hover:bg-white";
  return (
    <div className="space-y-5 max-w-3xl">
      <div className="bg-white rounded-2xl p-5 sm:p-8 shadow-sm border border-slate-100">
        <h2 className="font-semibold text-slate-900 mb-4">About this prototype</h2>
        <p className="text-sm text-slate-500 leading-relaxed mb-3">
          This is a working prototype of SchedWiseAI built for respondent testing as part of a capstone research study.
          The AI Optimization Engine (a Genetic Algorithm with constraint checking) runs entirely in your browser —
          no data is sent to a server. Everything you enter is stored only in this browser's local storage.
        </p>
        <p className="text-sm text-slate-500 leading-relaxed">
          Use the role selector in the sidebar to explore the system from the perspective of an Academic Administrator,
          Department Chair, Faculty Member, or IT Professional/Staff.
        </p>
      </div>

      {canTest && (
        <div className="bg-white rounded-2xl p-5 sm:p-8 shadow-sm border border-slate-100 space-y-6">
          <div>
            <h2 className="font-semibold text-slate-900">Testing tools</h2>
            <p className="text-xs text-slate-500 mt-1">For Admin and IT testers. These change the data in this browser only.</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-800 mb-1">Sample data</h3>
            <p className="text-xs text-slate-500 mb-2">Currently loaded: <span className="font-medium text-slate-700">{datasetKind === "expanded" ? "expanded multi-program sample" : "standard sample"}</span>. Loading replaces all data. The sidebar's Reset Demo Data reloads whichever sample is current.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button className={btn} onClick={() => onLoadDataset("standard")}>
                <div className="font-medium">Standard sample</div>
                <div className="text-xs text-slate-500">9 faculty · 18 subjects · 6 labs (BSIT). Used by the testing guide.</div>
              </button>
              <button className={btn} onClick={() => onLoadDataset("expanded")}>
                <div className="font-medium">Expanded multi-program sample</div>
                <div className="text-xs text-slate-500">About 22 faculty (6 part-time) · 48 subjects · 10 labs. BSIT, BSCS and BSIS, 1st to 4th year, with GE minors.</div>
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-800 mb-1">Create test conflicts</h3>
            <p className="text-xs text-slate-500 mb-2">
              Each button breaks one rule in the current schedule on purpose and says exactly what it changed. Then open
              <button className="text-blue-800 hover:underline mx-1" onClick={() => onGoTo("conflicts")}>Conflict Detection</button>
              to see it counted, or
              <button className="text-blue-800 hover:underline mx-1" onClick={() => onGoTo("schedules")}>Class Schedules</button>
              and press <span className="font-medium">Update affected classes</span> to watch the AI repair it.
            </p>
            {!hasSchedule ? (
              <div className="text-sm text-slate-500 bg-slate-50 rounded-lg px-3 py-2">Generate a schedule first (Class Schedules → Generate Schedule).</div>
            ) : (
              <>
                <div className="text-xs text-slate-600 mb-2">Conflicts in the current schedule: <span className={"font-semibold " + (violationsTotal ? "text-rose-700" : "text-emerald-700")}>{violationsTotal}</span></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {TEST_CONFLICT_KINDS.map(([k, label]) => (
                    <button key={k} className={btn} onClick={() => onCreateTestConflict(k)}>{label}{k === "overload" ? " (not a conflict)" : ""}</button>
                  ))}
                  <button className="sm:col-span-2 bg-amber-400 hover:bg-amber-300 text-[#0b1d4a] font-semibold text-sm py-2 rounded-lg" onClick={() => onCreateTestConflict("all")}>Create all of them</button>
                </div>
              </>
            )}
            {testLog.length > 0 && (
              <ul className="mt-3 space-y-1 text-xs">
                {testLog.map((m, i) => (
                  <li key={i} className={"rounded-lg px-3 py-1.5 " + (m.ok ? "bg-orange-50 text-orange-800" : "bg-slate-50 text-slate-600")}>{m.text}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Start the app: draw <App /> inside the <div id="root"> in index.html.
ReactDOM.createRoot(document.getElementById("root")).render(<App />);
