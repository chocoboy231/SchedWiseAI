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
     4. Saving & loading ............. loadState, saveState, freshData
     5. Form building blocks ......... Modal, Field, CheckboxGroup
     6. Forms (modals) ............... Faculty, Subject, Room, Assignment,
                                       Profile, Leave Request, CSV Import
     7. Login & notifications ........ LoginScreen, NotificationPanel
     8. Charts & cards ............... StatCard, ConvergenceChart, BarChart
     9. App() ........................ the main component: all state + page switching
    10. Overview pages ............... one per role (Admin, Chair, Faculty, IT)
    11. Other pages .................. Faculty, Subjects, Rooms, Departments,
                                       Workload, Schedules, History,
                                       Conflicts, Reports, Settings
   ===================================================================== */

// Pull React's "hooks" out of the global React object (loaded from a CDN in index.html).
const { useState, useEffect, useRef, useMemo } = React;
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
const IconGrid = (p) => <Icon {...p} d={<g><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></g>} />;
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
const IconShield = (p) => <Icon {...p} d={<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z"/>} />;
const IconPlus = (p) => <Icon {...p} d={<path d="M12 5v14M5 12h14"/>} />;
const IconEdit = (p) => <Icon {...p} d={<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>} />;
const IconTrash = (p) => <Icon {...p} d={<path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V6h12z"/>} />;
const IconX = (p) => <Icon {...p} d={<path d="M18 6L6 18M6 6l12 12"/>} />;
const IconRefresh = (p) => <Icon {...p} d={<path d="M21 12a9 9 0 1 1-3-6.7M21 4v5h-5"/>} />;
const IconAlert = (p) => <Icon {...p} d={<g><path d="M12 3l10 18H2L12 3z"/><path d="M12 10v4M12 17h.01"/></g>} />;
const IconZap = (p) => <Icon {...p} d={<path d="M13 2 3 14h7l-1 8 11-14h-7l1-6z"/>} />;
const IconMenu = (p) => <Icon {...p} d={<path d="M3 6h18M3 12h18M3 18h18"/>} />;
const IconEye = (p) => <Icon {...p} d={<g><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></g>} />;
const IconClipboard = (p) => <Icon {...p} d={<g><rect x="6" y="4" width="12" height="17" rx="1.5"/><rect x="9" y="2" width="6" height="4" rx="1"/><path d="M9 11h6M9 15h6"/></g>} />;
const IconChevronDown = (p) => <Icon {...p} d={<path d="M6 9l6 6 6-6"/>} />;
const IconAlertCircle = (p) => <Icon {...p} d={<g><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></g>} />;
const IconDownload = (p) => <Icon {...p} d={<g><path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M4 21h16"/></g>} />;
const IconUpload = (p) => <Icon {...p} d={<g><path d="M12 21V9"/><path d="M7 14l5-5 5 5"/><path d="M4 3h16"/></g>} />;
const IconPrinter = (p) => <Icon {...p} d={<g><rect x="6" y="9" width="12" height="7" rx="1"/><path d="M6 9V4h12v5"/><path d="M6 17v3h12v-3"/></g>} />;
const IconLogOut = (p) => <Icon {...p} d={<g><path d="M9 21H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></g>} />;
const IconHistory = (p) => <Icon {...p} d={<g><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/><path d="M12 7v5l3 3"/></g>} />;
const IconThumbsUp = (p) => <Icon {...p} d={<path d="M7 22V11M2 13v7a2 2 0 0 0 2 2h12.7a2 2 0 0 0 2-1.6l1.3-6A2 2 0 0 0 18 11h-5l1-5a2 2 0 0 0-2-2.4L7 11"/>} />;
const IconThumbsDown = (p) => <Icon {...p} d={<path d="M17 2v11M22 11V4a2 2 0 0 0-2-2H7.3a2 2 0 0 0-2 1.6l-1.3 6A2 2 0 0 0 6 12h5l-1 5a2 2 0 0 0 2 2.4L17 13"/>} />;
const IconGrid2 = (p) => <Icon {...p} d={<g><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></g>} />;

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
function freshData() {
  const seed = 100 + Math.floor(Math.random() * 900);
  const d = E.generateSyntheticData(9, 18, 6, seed);
  return { faculty: d.faculty, rooms: d.rooms, sections: d.sections, timeSlots: d.timeSlots, result: null };
}

/* ---------------------------------------------------------------------
   5. FORM BUILDING BLOCKS
   --------------------------------------------------------------------- */

// Modal: a pop-up dialog. Clicking the dark background closes it;
// clicking inside the white box does not (stopPropagation).
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl" onClick={e => e.stopPropagation()}>
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
const inputCls = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400";

// CheckboxGroup: a grid of checkboxes for picking several options
// (used for Specializations and Preferred Days).
function CheckboxGroup({ options, selected, onToggle, columns = 2 }) {
  return (
    <div className={"grid gap-1.5 " + (columns === 2 ? "grid-cols-2" : "grid-cols-1")}>
      {options.map(opt => (
        <label key={opt} className="flex items-center gap-2 text-sm text-slate-700 border border-slate-200 rounded-lg px-2.5 py-1.5 cursor-pointer hover:bg-slate-50">
          <input type="checkbox" checked={selected.includes(opt)} onChange={() => onToggle(opt)} className="accent-teal-500" />
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
        className="w-full bg-teal-500 hover:bg-teal-600 text-white font-medium text-sm py-2.5 rounded-lg mt-2"
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

// SectionModal: add/edit a subject section, including curriculum year level,
// semester, and an optional prerequisite subject.
function SectionModal({ initial, allSections, onSave, onClose }) {
  const [subjectCode, setSubjectCode] = useState(initial ? initial.subjectCode : "");
  const [subjectName, setSubjectName] = useState(initial ? initial.subjectName : "");
  const [sectionName, setSectionName] = useState(initial ? initial.sectionName : "");
  const [units, setUnits] = useState(initial ? initial.units : 3);
  const [spec, setSpec] = useState(initial ? initial.requiredSpecialization : E.SPECIALIZATIONS[0]);
  const [roomType, setRoomType] = useState(initial ? initial.roomTypeRequired : "lecture");
  const [enrolled, setEnrolled] = useState(initial ? initial.enrolledStudents : 35);
  const [yearLevel, setYearLevel] = useState(initial ? initial.yearLevel : 1);
  const [semester, setSemester] = useState(initial ? initial.semester : "1st Semester");
  const [prerequisiteCode, setPrerequisiteCode] = useState(initial ? (initial.prerequisiteCode || "") : "");

  const uniqueSubjectCodes = Array.from(new Set((allSections || [])
    .map(s => s.subjectCode)
    .filter(code => !initial || code !== initial.subjectCode)));

  return (
    <Modal title={initial ? "Edit Subject" : "Add Subject"} onClose={onClose}>
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
      <Field label="Room Type Required">
        <select className={inputCls} value={roomType} onChange={e=>setRoomType(e.target.value)}>
          <option value="lecture">Lecture</option>
          <option value="laboratory">Laboratory</option>
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Curriculum Year Level">
          <select className={inputCls} value={yearLevel} onChange={e=>setYearLevel(Number(e.target.value))}>
            <option value={1}>Year 1</option>
            <option value={2}>Year 2</option>
            <option value={3}>Year 3</option>
            <option value={4}>Year 4</option>
          </select>
        </Field>
        <Field label="Semester">
          <select className={inputCls} value={semester} onChange={e=>setSemester(e.target.value)}>
            <option value="1st Semester">1st Semester</option>
            <option value="2nd Semester">2nd Semester</option>
          </select>
        </Field>
      </div>
      <Field label="Prerequisite Subject (optional)">
        <select className={inputCls} value={prerequisiteCode} onChange={e=>setPrerequisiteCode(e.target.value)}>
          <option value="">None</option>
          {uniqueSubjectCodes.map(code => <option key={code} value={code}>{code}</option>)}
        </select>
      </Field>
      <button
        className="w-full bg-teal-500 hover:bg-teal-600 text-white font-medium text-sm py-2.5 rounded-lg mt-2"
        onClick={() => {
          if (!subjectCode.trim() || !sectionName.trim()) return;
          onSave({
            id: initial ? initial.id : Date.now(),
            subjectCode: subjectCode.trim(), subjectName: subjectName.trim(), sectionName: sectionName.trim(),
            units, requiredSpecialization: spec, roomTypeRequired: roomType, enrolledStudents: enrolled,
            yearLevel, semester, prerequisiteCode: prerequisiteCode || null,
          });
          onClose();
        }}
      >Save</button>
    </Modal>
  );
}

// RoomModal: add/edit a room (name, lecture/laboratory, capacity).
function RoomModal({ initial, onSave, onClose }) {
  const [name, setName] = useState(initial ? initial.name : "");
  const [type, setType] = useState(initial ? initial.type : "lecture");
  const [capacity, setCapacity] = useState(initial ? initial.capacity : 40);
  return (
    <Modal title={initial ? "Edit Room" : "Add Room"} onClose={onClose}>
      <Field label="Room Name"><input className={inputCls} value={name} onChange={e=>setName(e.target.value)} placeholder="Room 305" /></Field>
      <Field label="Type">
        <select className={inputCls} value={type} onChange={e=>setType(e.target.value)}>
          <option value="lecture">Lecture</option>
          <option value="laboratory">Laboratory</option>
        </select>
      </Field>
      <Field label="Capacity"><input type="number" className={inputCls} value={capacity} onChange={e=>setCapacity(Number(e.target.value))} /></Field>
      <button
        className="w-full bg-teal-500 hover:bg-teal-600 text-white font-medium text-sm py-2.5 rounded-lg mt-2"
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
  const [roomId, setRoomId] = useState(assignment.gene.roomId);
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
        <select className={inputCls} value={roomId} onChange={e=>setRoomId(Number(e.target.value))}>
          {validRoomIds.length === 0 && <option value={-1}>No valid room available</option>}
          {rooms.filter(r => validRoomIds.includes(r.id)).map(r => <option key={r.id} value={r.id}>{r.name} ({r.capacity} seats)</option>)}
        </select>
      </Field>
      <Field label="Time Slot">
        <select className={inputCls} value={slotId} onChange={e=>setSlotId(Number(e.target.value))}>
          {timeSlots.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
      </Field>
      <div className="flex gap-2 mt-2">
        <button
          className="flex-1 bg-teal-500 hover:bg-teal-600 text-white font-medium text-sm py-2.5 rounded-lg"
          onClick={() => { onSave(assignment.index, { facultyId, roomId, slotId }); onClose(); }}
        >Save Changes</button>
        <button
          className="px-4 bg-rose-50 hover:bg-rose-100 text-rose-600 font-medium text-sm py-2.5 rounded-lg"
          onClick={() => { onDelete(assignment.index); onClose(); }}
        >Remove</button>
      </div>
    </Modal>
  );
}

// FacultyProfileModal: read-only profile card (rank, status, specializations,
// preferred days, and current load computed from the live schedule).
function FacultyProfileModal({ faculty, sections, result, onClose }) {
  const assignedUnits = result
    ? result.genes.reduce((sum, g, i) => g.facultyId === faculty.id ? sum + sections[i].units : sum, 0)
    : 0;
  const loadPct = Math.round((assignedUnits / faculty.maxUnits) * 100);
  return (
    <Modal title="Faculty Profile" onClose={onClose}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-teal-400 flex items-center justify-center text-[#0c1330] font-semibold text-lg shrink-0">
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
    </Modal>
  );
}

// LeaveRequestModal: submit a leave or availability-change request.
// If lockedFacultyId is given (Faculty role), the faculty member can only
// file for themselves; otherwise a dropdown lets admins pick anyone.
function LeaveRequestModal({ faculty, lockedFacultyId, onSave, onClose }) {
  const locked = lockedFacultyId != null;
  const [facultyId, setFacultyId] = useState(locked ? lockedFacultyId : (faculty[0] ? faculty[0].id : null));
  const [type, setType] = useState("Leave Request");
  const [description, setDescription] = useState("");
  return (
    <Modal title="New Leave / Availability Request" onClose={onClose}>
      <Field label="Faculty Member">
        {locked ? (
          <div className="text-sm font-medium text-slate-800 border border-slate-200 rounded-lg px-3 py-2 bg-slate-50">
            {(faculty.find(f => f.id === lockedFacultyId) || {}).name || "—"}
          </div>
        ) : (
          <select className={inputCls} value={facultyId} onChange={e=>setFacultyId(Number(e.target.value))}>
            {faculty.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        )}
      </Field>
      <Field label="Request Type">
        <select className={inputCls} value={type} onChange={e=>setType(e.target.value)}>
          <option>Leave Request</option>
          <option>Availability Change</option>
        </select>
      </Field>
      <Field label="Details">
        <textarea className={inputCls} rows={3} value={description} onChange={e=>setDescription(e.target.value)}
          placeholder="e.g. Requesting leave on Dec 1–3 for a conference" />
      </Field>
      <button
        className="w-full bg-teal-500 hover:bg-teal-600 text-white font-medium text-sm py-2.5 rounded-lg mt-2"
        onClick={() => {
          if (facultyId == null || !description.trim()) return;
          onSave({ id: Date.now(), facultyId, type, description: description.trim(), status: "Pending", createdAt: new Date().toISOString() });
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
    subjects: "subjectCode,subjectName,sectionName,units,requiredSpecialization,roomTypeRequired,enrolledStudents,yearLevel,semester\nIT103,Web Systems,BSIT-2A,3,Web Development,laboratory,35,2,1st Semester",
    rooms: "name,type,capacity\nRoom 210,lecture,40",
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
          roomTypeRequired: r[idx("roomTypeRequired")] || "lecture",
          enrolledStudents: Number(r[idx("enrolledStudents")]) || 35,
          yearLevel: Number(r[idx("yearLevel")]) || 1,
          semester: r[idx("semester")] || "1st Semester",
          prerequisiteCode: null,
        }));
        onImportSections(records);
      } else if (kind === "rooms") {
        const records = rows.map((r, i) => ({
          id: Date.now() + i,
          name: r[idx("name")] || ("Room " + i),
          type: r[idx("type")] || "lecture",
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
      <button className="text-xs text-teal-600 hover:underline mb-3" onClick={() => setText(templates[kind])}>Load example template</button>
      {error && <div className="text-xs text-rose-600 mb-2">{error}</div>}
      <button className="w-full bg-teal-500 hover:bg-teal-600 text-white font-medium text-sm py-2.5 rounded-lg" onClick={handleImport}>Import</button>
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
          <div className="w-10 h-10 rounded-xl bg-teal-400 flex items-center justify-center">
            <IconCalendar size={20} className="text-[#0c1330]" />
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
          className="w-full bg-teal-500 hover:bg-teal-600 text-white font-medium text-sm py-2.5 rounded-lg mt-2"
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
        <button onClick={onMarkAllRead} className="text-xs text-teal-600 hover:underline">Mark all read</button>
      </div>
      {notifications.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-slate-400">No notifications yet.</div>
      ) : (
        <div className="divide-y divide-slate-50">
          {notifications.map(n => (
            <div key={n.id} onClick={() => onMarkRead(n.id)}
              className={"px-4 py-3 text-sm cursor-pointer hover:bg-slate-50 " + (n.read ? "opacity-60" : "")}>
              <div className="flex items-start gap-2">
                {!n.read && <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />}
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

// ConvergenceChart: the GA's learning curve. For each generation it plots
// the best score (teal) and the population's average score (purple).
// x() and y() convert a generation number / score into pixel positions.
// The dashed line marks where the score crosses zero.
function ConvergenceChart({ convergence }) {
  if (!convergence || convergence.length === 0) return null;
  const w = 600, h = 180, pad = 30;
  const allVals = convergence.flatMap(c => [c.best, c.avg]);
  const maxV = Math.max(...allVals, 1), minV = Math.min(...allVals, -1);
  const range = maxV - minV || 1;
  // Convert generation number -> horizontal pixel, and score -> vertical pixel
  // (SVG's y axis points down, so higher scores are drawn higher by subtracting).
  const x = i => pad + (i / Math.max(1, convergence.length - 1)) * (w - 2*pad);
  const y = v => h - pad - ((v - minV) / range) * (h - 2*pad);
  const bestPath = convergence.map((c,i) => (i===0?"M":"L") + x(i) + "," + y(c.best)).join(" ");
  const avgPath = convergence.map((c,i) => (i===0?"M":"L") + x(i) + "," + y(c.avg)).join(" ");
  const zeroY = y(Math.min(Math.max(0, minV), maxV));
  return (
    <svg viewBox={"0 0 " + w + " " + h} className="w-full h-44">
      <line x1={pad} y1={zeroY} x2={w-pad} y2={zeroY} stroke="#cbd5e1" strokeDasharray="4 4" />
      <path d={avgPath} fill="none" stroke="#8b5cf6" strokeWidth="2" opacity="0.8" />
      <path d={bestPath} fill="none" stroke="#14b8a6" strokeWidth="2.5" />
      <text x={pad} y={14} fontSize="10" fill="#64748b">Fitness</text>
      <text x={w-pad-70} y={14} fontSize="10" fill="#14b8a6">— Best</text>
      <text x={w-pad-30} y={14} fontSize="10" fill="#8b5cf6">— Avg</text>
    </svg>
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
            <rect x={x} y={h-pad-barH} width={bw2} height={barH} rx="3" fill={colorFn ? colorFn(d) : "#14b8a6"} />
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
  const saved = loadState();
  const init = saved || freshData();

  // ---- Core data ----
  const [faculty, setFaculty] = useState(init.faculty);
  const [rooms, setRooms] = useState(init.rooms);
  const [sections, setSections] = useState(init.sections);
  const [timeSlots] = useState(init.timeSlots || E.buildTimeSlots());
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
  const [activityLog, setActivityLog] = useState(init.activityLog || []);   // import/export log (IT overview)
  const [chairDept, setChairDept] = useState(init.chairDept || "All");       // department filter (Chair overview)
  const [leaveRequestLockedTo, setLeaveRequestLockedTo] = useState(null);    // faculty id a request form is locked to

  // Save everything to the browser whenever any of these values change.

  useEffect(() => {
    saveState({ faculty, rooms, sections, timeSlots, result, role, leaveRequests, curriculumAware, notifications, scheduleHistory, loggedIn, userName, activityLog, chairDept });
  }, [faculty, rooms, sections, timeSlots, result, role, leaveRequests, curriculumAware, notifications, scheduleHistory, loggedIn, userName, activityLog, chairDept]);

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
  useEffect(() => {
    if (!visibleNav.find(n => n.key === page)) setPage(visibleNav[0].key);
  }, [role]);

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
        elapsedMs, settings: { generations: settings.generations, popSize: settings.popSize } };
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
    setResult(entry);
    pushNotification("Restored schedule from " + new Date(entry.generatedAt).toLocaleString() + ".");
    setPage("schedules");
  }

  // Replace all data with a fresh sample dataset (asks for confirmation first).
  function resetDemoData() {
    if (!confirm("Reset all data to a fresh demo dataset? This clears faculty, subjects, rooms, and the current schedule.")) return;
    const d = freshData();
    setFaculty(d.faculty); setRooms(d.rooms); setSections(d.sections); setResult(null); setLeaveRequests([]); setScheduleHistory([]); setActivityLog([]);
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
        "no-print w-64 shrink-0 bg-[#0c1330] flex flex-col justify-between py-5 h-screen fixed md:sticky top-0 left-0 z-50 " +
        "transition-transform duration-200 ease-in-out " +
        (sidebarOpen ? "translate-x-0" : "-translate-x-full") + " md:translate-x-0"
      }>
        <div className="overflow-y-auto">
          <div className="flex items-center justify-between px-5 pb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-teal-400 flex items-center justify-center shrink-0">
                <IconCalendar size={18} className="text-[#0c1330]" />
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
                    (active ? "bg-white/10 text-white border-l-2 border-teal-400 pl-3" : "text-slate-400 hover:text-white hover:bg-white/5")}>
                  <Icon2 size={17} className={active ? "text-teal-400" : ""} />
                  <span className="flex-1 text-left">{item.label}</span>
                  {badge ? <span className="bg-rose-500 text-white text-[10px] font-semibold rounded-full w-5 h-5 flex items-center justify-center">{badge}</span> : null}
                </button>
              );
            })}
          </nav>

          <div className="px-5 pb-2 pt-6 text-[11px] tracking-wide text-slate-500 font-medium">Account</div>
          <nav className="px-3 space-y-0.5">
            <button onClick={resetDemoData} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5">
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
            <div className="w-8 h-8 rounded-full bg-teal-400 flex items-center justify-center text-[#0c1330] font-semibold text-xs shrink-0">
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
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-semibold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">{unreadCount}</span>
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
              onApprovalDecision={handleApprovalDecision}
              onUpdateRequestStatus={(id, status) => {
                setLeaveRequests(leaveRequests.map(r => r.id === id ? { ...r, status } : r));
                const req = leaveRequests.find(r => r.id === id);
                const fac = req && faculty.find(f => f.id === req.facultyId);
                pushNotification((req ? req.type : "Request") + " for " + (fac ? fac.name : "faculty") + " was " + status.toLowerCase() + ".");
              }}
              onNewRequest={(lockedId) => { setLeaveRequestLockedTo(lockedId == null ? null : lockedId); setLeaveRequestModal(true); }}
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
              onNewRequest={() => { setLeaveRequestLockedTo(null); setLeaveRequestModal(true); }}
              onUpdateRequestStatus={(id, status) => {
                setLeaveRequests(leaveRequests.map(r => r.id === id ? { ...r, status } : r));
                const req = leaveRequests.find(r => r.id === id);
                const fac = req && faculty.find(f => f.id === req.facultyId);
                pushNotification((req ? req.type : "Request") + " for " + (fac ? fac.name : "faculty") + " was " + status.toLowerCase() + ".");
              }}
            />
          )}

          {page === "workload" && <WorkloadPage faculty={faculty} sections={sections} result={result} />}

          {page === "subjects" && (
            <SubjectsPage sections={sections}
              onImport={() => setCsvImportKind("subjects")}
              onAdd={() => setSectionModal("new")}
              onEdit={s => setSectionModal(s)}
              onDelete={id => setSections(sections.filter(s=>s.id!==id))}
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
              myFacultyId={myFaculty ? myFaculty.id : null}
            />
          )}

          {page === "history" && (
            <HistoryPage history={scheduleHistory} currentId={result ? result.id : null} onRestore={handleRestoreHistory} />
          )}

          {page === "conflicts" && <ConflictsPage result={result} onGenerate={handleGenerate} generating={generating} />}

          {page === "reports" && <ReportsPage faculty={faculty} rooms={rooms} sections={sections} result={result} slotById={slotById} />}

          {page === "settings" && <SettingsPage />}

        </main>
      </div>

      {facultyModal && (
        <FacultyModal initial={facultyModal === "new" ? null : facultyModal}
          onSave={f => setFaculty(facultyModal === "new" ? [...faculty, f] : faculty.map(x=>x.id===f.id?f:x))}
          onClose={() => setFacultyModal(null)} />
      )}
      {sectionModal && (
        <SectionModal initial={sectionModal === "new" ? null : sectionModal} allSections={sections}
          onSave={s => setSections(sectionModal === "new" ? [...sections, s] : sections.map(x=>x.id===s.id?s:x))}
          onClose={() => setSectionModal(null)} />
      )}
      {roomModal && (
        <RoomModal initial={roomModal === "new" ? null : roomModal}
          onSave={r => setRooms(roomModal === "new" ? [...rooms, r] : rooms.map(x=>x.id===r.id?r:x))}
          onClose={() => setRoomModal(null)} />
      )}
      {facultyProfileModal && (
        <FacultyProfileModal faculty={facultyProfileModal} sections={sections} result={result}
          onClose={() => setFacultyProfileModal(null)} />
      )}
      {assignmentModal && (
        <AssignmentModal assignment={assignmentModal} faculty={faculty} rooms={rooms} sections={sections} timeSlots={timeSlots}
          onSave={handleEditAssignment} onDelete={handleDeleteAssignment} onClose={() => setAssignmentModal(null)} />
      )}
      {leaveRequestModal && (
        <LeaveRequestModal faculty={faculty} lockedFacultyId={leaveRequestLockedTo}
          onSave={req => {
            setLeaveRequests([req, ...leaveRequests]);
            const fac = faculty.find(f => f.id === req.facultyId);
            pushNotification("New " + req.type.toLowerCase() + " submitted by " + (fac ? fac.name : "faculty") + ".");
          }}
          onClose={() => setLeaveRequestModal(false)} />
      )}
      {csvImportKind && (
        <CSVImportModal kind={csvImportKind}
          onImportFaculty={recs => { setFaculty([...faculty, ...recs]); pushNotification("Imported " + recs.length + " faculty record(s)."); logActivity("Import", recs.length + " faculty record(s)"); }}
          onImportSections={recs => { setSections([...sections, ...recs]); pushNotification("Imported " + recs.length + " subject record(s)."); logActivity("Import", recs.length + " subject record(s)"); }}
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
  const buckets = { "Overloaded": 0, "Near capacity": 0, "Balanced": 0, "Underloaded": 0, "No assignment yet": 0 };
  faculty.forEach(f => {
    const label = loadStatusFor(f, sections, result).label;
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
  // Prerequisite ordering problems (same check the Subjects page uses).
  validateCurriculumSequence(sections).forEach(iss => problems.push(iss.text));
  return problems;
}

// ---------- Small shared building blocks used by all four overviews ----------

// The coloured banner at the top of every overview. `children` holds the action buttons.
function OverviewHero({ eyebrow, title, subtitle, children }) {
  return (
    <section className="rounded-3xl overflow-hidden bg-gradient-to-br from-[#0c1330] via-[#0e3a4a] to-[#127a72] px-5 sm:px-10 py-7 sm:py-9">
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
        {action && <button onClick={onAction} className="text-xs font-medium text-teal-600 hover:underline">{action}</button>}
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
  const cls = s === "Approved" ? "bg-emerald-50 text-emerald-700" : s === "Rejected" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700";
  return <span className={"text-xs font-semibold px-2.5 py-1 rounded-full " + cls}>{s}</span>;
}

// The primary "Generate Schedule" button used in the hero of Admin, Chair, and IT overviews.
function GenerateButton({ generating, onGenerate }) {
  return (
    <button onClick={onGenerate} disabled={generating}
      className="bg-teal-400 text-[#0c1330] font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-teal-300 transition-colors disabled:opacity-60 flex items-center gap-2">
      <IconZap size={15} />{generating ? "Generating..." : "Generate Schedule"}
    </button>
  );
}

// Horizontal stacked bar showing how faculty are distributed across load statuses.
function LoadSnapshotBar({ buckets, total }) {
  const order = [
    ["Overloaded", "#e11d48"], ["Near capacity", "#f59e0b"], ["Balanced", "#10b981"],
    ["Underloaded", "#94a3b8"], ["No assignment yet", "#cbd5e1"],
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
          <span className={"mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 " + (iss.severity === "high" ? "bg-rose-500" : "bg-amber-500")} />
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
        <StatCard label="Pending Approvals" value={pendingVersions} sub="schedule versions awaiting review" color={pendingVersions ? "#b45309" : "#0f8a6b"} />
        <StatCard label="Pending Leave Requests" value={pendingLeave.length} color={pendingLeave.length ? "#b45309" : "#0f8a6b"} />
        <StatCard label="Open Issues" value={allIssues.length} color={allIssues.length ? "#c0392b" : "#0f8a6b"} />
        <StatCard label="Faculty / Sections / Rooms" value={faculty.length + " / " + sections.length + " / " + rooms.length} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Panel title="Schedule Approval" action="Review schedule" onAction={() => onNavigate("schedules")}>
          {result ? (
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between"><span className="text-slate-500">Status</span><ApprovalBadge status={result.approvalStatus} /></div>
              <div className="flex items-center justify-between"><span className="text-slate-500">Conflicts</span>
                <span className={"font-semibold " + (result.violations.total ? "text-rose-600" : "text-emerald-600")}>{result.violations.total}</span></div>
              <div className="flex items-center justify-between"><span className="text-slate-500">Generated</span>
                <span className="text-slate-700">{result.generatedAt ? new Date(result.generatedAt).toLocaleString() : "—"}</span></div>
              {result.approvalComment && <div className="text-xs text-slate-500 italic">“{result.approvalComment}”</div>}
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
                <span className={"font-semibold " + (result.violations.total ? "text-rose-600" : "text-emerald-600")}>{result.violations.total}</span>
              </div>
              {needsDecision ? (
                <div className="flex gap-2 pt-1">
                  <button onClick={() => onApprovalDecision("Approved", "")}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium py-2 rounded-lg">
                    <IconThumbsUp size={15} /> Approve
                  </button>
                  <button onClick={() => onApprovalDecision("Rejected", "")}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium py-2 rounded-lg">
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
                      <div className="text-xs text-slate-500 truncate">{r.description}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => onUpdateRequestStatus(r.id, "Approved")} className="text-xs font-medium text-emerald-600 hover:underline">Approve</button>
                      <button onClick={() => onUpdateRequestStatus(r.id, "Denied")} className="text-xs font-medium text-rose-600 hover:underline">Deny</button>
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
                  <td className={"py-2 pr-3 " + (stats.overloads ? "text-rose-600 font-semibold" : "text-slate-400")}>{stats.overloads}</td>
                  <td className={"py-2 " + (stats.conflicts ? "text-rose-600 font-semibold" : "text-slate-400")}>{stats.conflicts}</td>
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

  const status = loadStatusFor(myFaculty, sections, result);

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
          className="bg-teal-400 text-[#0c1330] font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-teal-300 transition-colors flex items-center gap-2">
          <IconCalendar size={15} /> View My Full Schedule
        </button>
        <button onClick={() => onNewRequest(myFaculty.id)}
          className="border border-white/30 text-white font-medium text-sm px-5 py-2.5 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2">
          <IconPlus size={15} /> New Leave / Availability Request
        </button>
      </OverviewHero>

      {/* Tell faculty whether their schedule is final or may still change. */}
      {approval && (
        <div className={"rounded-2xl p-4 border text-sm " + (approval === "Approved" ? "bg-emerald-50 border-emerald-100 text-emerald-800"
          : approval === "Rejected" ? "bg-rose-50 border-rose-100 text-rose-800" : "bg-amber-50 border-amber-100 text-amber-800")}>
          {approval === "Approved" ? "Your schedule has been approved and is final."
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
                      {myFaculty.preferredDays.includes(d) && <span className="normal-case tracking-normal text-[10px] bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded-full">preferred</span>}
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
                const cls = r.status === "Approved" ? "text-emerald-600 bg-emerald-50" : r.status === "Denied" ? "text-rose-600 bg-rose-50" : "text-amber-600 bg-amber-50";
                return (
                  <li key={r.id} className="py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-slate-900">{r.type}</span>
                      <span className={"text-xs font-medium px-2 py-0.5 rounded-full " + cls}>{r.status}</span>
                    </div>
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
        <StatCard label="Data Health Issues" value={health.length} color={health.length ? "#c0392b" : "#0f8a6b"} />
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
                  {a.kind === "Import" ? <IconUpload size={14} className="text-blue-600" /> : <IconDownload size={14} className="text-teal-600" />}
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
            <button onClick={onAdd} className="flex items-center gap-1.5 bg-teal-500 hover:bg-teal-600 text-white text-sm font-medium px-3.5 py-2 rounded-lg">
              <IconPlus size={15} /> {addLabel}
            </button>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

// loadStatusFor(facultyMember, sections, result)
// Adds up the units assigned to one faculty member in the current schedule
// and labels their load. This one function is used everywhere a status badge
// appears, so every page agrees:
//   Overloaded     assigned > max units
//   Near capacity  80% or more of max
//   Underloaded    0 units assigned
//   Balanced       anything in between
function loadStatusFor(facultyMember, sections, result) {
  if (!result) return { label: "No assignment yet", assigned: 0, pct: 0, color: "text-slate-400 bg-slate-50" };
  const assigned = result.genes.reduce((sum, g, i) => (g.facultyId === facultyMember.id ? sum + sections[i].units : sum), 0);
  const pct = Math.round((assigned / facultyMember.maxUnits) * 100);
  if (assigned > facultyMember.maxUnits) return { label: "Overloaded", assigned, pct, color: "text-rose-600 bg-rose-50" };
  if (pct >= 80) return { label: "Near capacity", assigned, pct, color: "text-amber-600 bg-amber-50" };
  if (pct === 0) return { label: "Underloaded", assigned, pct, color: "text-slate-400 bg-slate-50" };
  return { label: "Balanced", assigned, pct, color: "text-emerald-600 bg-emerald-50" };
}

// FacultyPage: two tabs.
//   "Faculty List" — table with load/status, and View Profile / View Schedule /
//                    Edit / Delete actions per row.
//   "Leave & Availability" — all requests; Admin/Chair can Approve or Deny.
function FacultyPage({ faculty, sections, result, role, leaveRequests, tab, setTab, onImport, onAdd, onEdit, onDelete, onViewProfile, onViewSchedule, onNewRequest, onUpdateRequestStatus }) {
  const facultyById = Object.fromEntries(faculty.map(f => [f.id, f]));
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button onClick={()=>setTab("list")} className={"text-sm font-medium px-4 py-2 rounded-lg " + (tab==="list"?"bg-slate-900 text-white":"bg-white text-slate-600 border border-slate-200")}>Faculty List</button>
        <button onClick={()=>setTab("requests")} className={"text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-1.5 " + (tab==="requests"?"bg-slate-900 text-white":"bg-white text-slate-600 border border-slate-200")}>
          Leave &amp; Availability
          {leaveRequests.filter(r=>r.status==="Pending").length > 0 && (
            <span className={"text-[10px] font-semibold rounded-full w-5 h-5 flex items-center justify-center " + (tab==="requests" ? "bg-white/20 text-white" : "bg-rose-500 text-white")}>
              {leaveRequests.filter(r=>r.status==="Pending").length}
            </span>
          )}
        </button>
      </div>

      {tab === "list" && (
        <TableShell title={"Faculty (" + faculty.length + ")"} onAdd={onAdd} addLabel="Add Faculty" onImport={onImport}
          onExport={() => downloadCSV("faculty.csv",
            ["Name","Specializations","Max Units","Current Load","Status","Preferred Days","Employment Status","Academic Rank"],
            faculty.map(f => { const st = loadStatusFor(f, sections, result); return [f.name, f.specializations.join("; "), f.maxUnits, st.assigned, st.label, f.preferredDays.join("; "), f.employmentStatus || "", f.academicRank || ""]; }))}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-slate-400 text-xs border-b border-slate-100">
                <th className="px-6 py-3 font-medium">Name</th><th className="px-6 py-3 font-medium">Specializations</th>
                <th className="px-6 py-3 font-medium">Current Load</th><th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Preferred Days</th><th className="px-6 py-3 font-medium"></th>
              </tr></thead>
              <tbody>
                {faculty.map(f => {
                  const status = loadStatusFor(f, sections, result);
                  return (
                    <tr key={f.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="px-6 py-3 font-medium text-slate-900">{f.name}</td>
                      <td className="px-6 py-3 text-slate-500">{f.specializations.join(", ")}</td>
                      <td className="px-6 py-3 text-slate-500">{status.assigned}/{f.maxUnits} units</td>
                      <td className="px-6 py-3"><span className={"text-xs font-medium px-2 py-1 rounded-full " + status.color}>{status.label}</span></td>
                      <td className="px-6 py-3 text-slate-500">{f.preferredDays.join(", ")}</td>
                      <td className="px-6 py-3 text-right whitespace-nowrap">
                        <button onClick={()=>onViewProfile(f)} title="View Profile" className="text-slate-400 hover:text-teal-600 p-1"><IconEye size={15}/></button>
                        <button onClick={()=>onViewSchedule(f)} title="View Schedule" className="text-slate-400 hover:text-blue-600 p-1"><IconCalendar size={15}/></button>
                        <button onClick={()=>onEdit(f)} title="Edit" className="text-slate-400 hover:text-blue-600 p-1"><IconEdit size={15}/></button>
                        <button onClick={()=>onDelete(f.id)} title="Delete" className="text-slate-400 hover:text-rose-600 p-1"><IconTrash size={15}/></button>
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
            <button onClick={onNewRequest} className="flex items-center gap-1.5 bg-teal-500 hover:bg-teal-600 text-white text-sm font-medium px-3.5 py-2 rounded-lg">
              <IconPlus size={15} /> New Request
            </button>
          </div>
          {leaveRequests.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-slate-400">No leave or availability requests yet.</div>
          ) : (
            <div className="divide-y divide-slate-50">
              {leaveRequests.map(r => {
                const fac = facultyById[r.facultyId];
                const statusColor = r.status === "Approved" ? "text-emerald-600 bg-emerald-50" : r.status === "Denied" ? "text-rose-600 bg-rose-50" : "text-amber-600 bg-amber-50";
                return (
                  <div key={r.id} className="px-6 py-4 flex items-start justify-between gap-4">
                    <div>
                      <div className="font-medium text-slate-900 text-sm">{fac ? fac.name : "Unknown faculty"} — {r.type}</div>
                      <div className="text-sm text-slate-500 mt-0.5">{r.description}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={"text-xs font-medium px-2 py-1 rounded-full " + statusColor}>{r.status}</span>
                      {role !== "faculty" && r.status === "Pending" && (
                        <>
                          <button onClick={()=>onUpdateRequestStatus(r.id, "Approved")} className="text-xs font-medium text-emerald-600 hover:underline">Approve</button>
                          <button onClick={()=>onUpdateRequestStatus(r.id, "Denied")} className="text-xs font-medium text-rose-600 hover:underline">Deny</button>
                        </>
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

// SubjectsPage: subject/section table, plus a warning box listing any
// prerequisite-order problems found by validateCurriculumSequence().
function SubjectsPage({ sections, onImport, onAdd, onEdit, onDelete }) {
  const curriculumIssues = validateCurriculumSequence(sections);
  return (
    <div className="space-y-4">
      {curriculumIssues.length > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <IconAlertCircle size={18} className="text-amber-600" />
            <h3 className="font-semibold text-slate-900 text-sm">Curriculum Prerequisite Issues</h3>
          </div>
          <ul className="space-y-1">
            {curriculumIssues.map((iss, i) => (
              <li key={i} className="text-sm text-amber-800 flex items-start gap-2">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />{iss.text}
              </li>
            ))}
          </ul>
        </div>
      )}
      <TableShell title={"Subjects / Sections (" + sections.length + ")"} onAdd={onAdd} addLabel="Add Subject" onImport={onImport}
        onExport={() => downloadCSV("subjects.csv",
          ["Code","Subject","Section","Units","Specialization","Room Type","Enrolled","Year Level","Semester","Prerequisite"],
          sections.map(s => [s.subjectCode, s.subjectName, s.sectionName, s.units, s.requiredSpecialization, s.roomTypeRequired, s.enrolledStudents, s.yearLevel || "", s.semester || "", s.prerequisiteCode || ""]))}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-slate-400 text-xs border-b border-slate-100">
              <th className="px-6 py-3 font-medium">Code</th><th className="px-6 py-3 font-medium">Subject</th>
              <th className="px-6 py-3 font-medium">Section</th><th className="px-6 py-3 font-medium">Units</th>
              <th className="px-6 py-3 font-medium">Specialization</th><th className="px-6 py-3 font-medium">Room Type</th>
              <th className="px-6 py-3 font-medium">Year / Sem</th><th className="px-6 py-3 font-medium">Prerequisite</th>
              <th className="px-6 py-3 font-medium">Enrolled</th><th className="px-6 py-3 font-medium"></th>
            </tr></thead>
            <tbody>
              {sections.map(s => (
                <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-6 py-3 font-medium text-slate-900">{s.subjectCode}</td>
                  <td className="px-6 py-3 text-slate-500">{s.subjectName}</td>
                  <td className="px-6 py-3 text-slate-500">{s.sectionName}</td>
                  <td className="px-6 py-3 text-slate-500">{s.units}</td>
                  <td className="px-6 py-3 text-slate-500">{s.requiredSpecialization}</td>
                  <td className="px-6 py-3 text-slate-500 capitalize">{s.roomTypeRequired}</td>
                  <td className="px-6 py-3 text-slate-500 whitespace-nowrap">{s.yearLevel ? "Y" + s.yearLevel : "—"} / {s.semester ? s.semester.replace(" Semester","") : "—"}</td>
                  <td className="px-6 py-3 text-slate-500">{s.prerequisiteCode || "—"}</td>
                  <td className="px-6 py-3 text-slate-500">{s.enrolledStudents}</td>
                  <td className="px-6 py-3 text-right whitespace-nowrap">
                    <button onClick={()=>onEdit(s)} className="text-slate-400 hover:text-blue-600 p-1"><IconEdit size={15}/></button>
                    <button onClick={()=>onDelete(s.id)} className="text-slate-400 hover:text-rose-600 p-1"><IconTrash size={15}/></button>
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

// RoomsPage: room table with CSV import/export.
function RoomsPage({ rooms, onImport, onAdd, onEdit, onDelete }) {
  return (
    <TableShell title={"Rooms (" + rooms.length + ")"} onAdd={onAdd} addLabel="Add Room" onImport={onImport}
      onExport={() => downloadCSV("rooms.csv", ["Name","Type","Capacity"], rooms.map(r => [r.name, r.type, r.capacity]))}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-slate-400 text-xs border-b border-slate-100">
            <th className="px-6 py-3 font-medium">Name</th><th className="px-6 py-3 font-medium">Type</th>
            <th className="px-6 py-3 font-medium">Capacity</th><th className="px-6 py-3 font-medium"></th>
          </tr></thead>
          <tbody>
            {rooms.map(r => (
              <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                <td className="px-6 py-3 font-medium text-slate-900">{r.name}</td>
                <td className="px-6 py-3 text-slate-500 capitalize">{r.type}</td>
                <td className="px-6 py-3 text-slate-500">{r.capacity}</td>
                <td className="px-6 py-3 text-right whitespace-nowrap">
                  <button onClick={()=>onEdit(r)} className="text-slate-400 hover:text-blue-600 p-1"><IconEdit size={15}/></button>
                  <button onClick={()=>onDelete(r.id)} className="text-slate-400 hover:text-rose-600 p-1"><IconTrash size={15}/></button>
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
      roomSlot[rk] = (roomSlot[rk] || 0) + 1;
    });
  }

  let totalAssigned = 0, totalCapacity = 0, overloads = 0, underloads = 0, conflicts = 0;
  const facultyStats = deptFaculty.map(f => {
    totalCapacity += f.maxUnits;
    let assigned = 0;
    if (result) result.genes.forEach((g, i) => { if (g.facultyId === f.id) assigned += sections[i].units; });
    totalAssigned += assigned;
    const pct = f.maxUnits ? Math.round((assigned / f.maxUnits) * 100) : 0;
    let status = "No assignment yet";
    if (result) {
      if (assigned > f.maxUnits) { status = "Overloaded"; overloads++; }
      else if (assigned === 0) { status = "Underloaded"; underloads++; }
      else { status = "Balanced"; }
    }
    return { faculty: f, assigned, pct, status };
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
        <StatCard label="Open Issues" value={issues.length} color={issues.length > 0 ? "#c0392b" : "#0f8a6b"} />
      </div>

      {issues.length > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <IconAlertCircle size={18} className="text-amber-600" />
            <h3 className="font-semibold text-slate-900 text-sm">Issues Requiring Attention</h3>
          </div>
          <ul className="space-y-1.5">
            {issues.map((issue, idx) => (
              <li key={idx} className="text-sm text-amber-800 flex items-start gap-2">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                {issue.text}
              </li>
            ))}
          </ul>
        </div>
      )}
      {issues.length === 0 && result && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-2">
          <IconCheckCircle size={18} className="text-emerald-600" />
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
                        ? <span className="text-xs font-medium px-2 py-1 rounded-full text-rose-600 bg-rose-50">{stats.overloads} overloaded</span>
                        : <span className="text-xs font-medium px-2 py-1 rounded-full text-slate-400 bg-slate-50">—</span>}
                    </td>
                    <td className="px-6 py-3">
                      {stats.conflicts > 0
                        ? <span className="text-xs font-medium px-2 py-1 rounded-full text-rose-600 bg-rose-50">{stats.conflicts}</span>
                        : <span className="text-xs font-medium px-2 py-1 rounded-full text-emerald-600 bg-emerald-50">0</span>}
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
                                colorFn={(d, i) => "#0F8A6B"}
                              />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {stats.facultyStats.map(fs => {
                                const badgeColor = fs.status === "Overloaded" ? "text-rose-600 bg-rose-50"
                                  : fs.status === "Underloaded" ? "text-slate-400 bg-slate-50"
                                  : fs.status === "Balanced" ? "text-emerald-600 bg-emerald-50"
                                  : "text-slate-400 bg-slate-50";
                                return (
                                  <div key={fs.faculty.id} className="flex items-center justify-between bg-white border border-slate-100 rounded-lg px-3 py-2">
                                    <div>
                                      <div className="text-sm font-medium text-slate-900">{fs.faculty.name}</div>
                                      <div className="text-xs text-slate-400">{fs.assigned}/{fs.faculty.maxUnits} units ({fs.pct}%)</div>
                                    </div>
                                    <span className={"text-xs font-medium px-2 py-1 rounded-full " + badgeColor}>{fs.status}</span>
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

// WorkloadPage: assigned vs. maximum units for every faculty member.
function WorkloadPage({ faculty, sections, result }) {
  const unitsByFaculty = {};
  faculty.forEach(f => unitsByFaculty[f.id] = 0);
  if (result) {
    result.genes.forEach((g, i) => { unitsByFaculty[g.facultyId] = (unitsByFaculty[g.facultyId]||0) + sections[i].units; });
  }
  return (
    <TableShell title="Academic Workload Management">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-slate-400 text-xs border-b border-slate-100">
            <th className="px-6 py-3 font-medium">Faculty</th><th className="px-6 py-3 font-medium">Assigned Units</th>
            <th className="px-6 py-3 font-medium">Max Units</th><th className="px-6 py-3 font-medium">Load Status</th>
          </tr></thead>
          <tbody>
            {faculty.map(f => {
              const assigned = unitsByFaculty[f.id] || 0;
              const pct = Math.round((assigned / f.maxUnits) * 100);
              const status = assigned > f.maxUnits ? "Overloaded" : pct >= 80 ? "Near capacity" : pct === 0 ? "No assignment yet" : "Balanced";
              const color = assigned > f.maxUnits ? "text-rose-600 bg-rose-50" : pct >= 80 ? "text-amber-600 bg-amber-50" : pct === 0 ? "text-slate-400 bg-slate-50" : "text-emerald-600 bg-emerald-50";
              return (
                <tr key={f.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-6 py-3 font-medium text-slate-900">{f.name}</td>
                  <td className="px-6 py-3 text-slate-500">{assigned}</td>
                  <td className="px-6 py-3 text-slate-500">{f.maxUnits}</td>
                  <td className="px-6 py-3"><span className={"text-xs font-medium px-2 py-1 rounded-full " + color}>{status}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {!result && <div className="px-6 py-4 text-sm text-slate-400">Generate a schedule to see assigned units per faculty member.</div>}
    </TableShell>
  );
}

// CurriculumToggle: the checkbox that turns curriculum-aware scheduling on/off.
function CurriculumToggle({ curriculumAware, setCurriculumAware }) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 cursor-pointer">
      <input type="checkbox" checked={curriculumAware} onChange={e=>setCurriculumAware(e.target.checked)} className="accent-teal-500" />
      <span>Use curriculum (avoid overlaps within the same year level &amp; semester)</span>
    </label>
  );
}

// SchedulesPage: where schedules are generated, reviewed, approved, and edited.
//   • Approval panel (Approve/Reject for Admin & Chair, Export CSV, Print/PDF)
//   • Convergence chart for the latest run
//   • "Weekly Grid": builds grid[day][period] from the genes, then draws it
//   • "By Faculty" / "My Schedule": one person's classes in time order
// Clicking a class opens AssignmentModal (not available to Faculty role).
// For the Faculty role, the person shown is always myFacultyId.
function SchedulesPage({ result, sections, facultyById, roomById, slotById, timeSlots, generating, onGenerate, tab, setTab, role, faculty, rooms, selectedFacultyId, setSelectedFacultyId, curriculumAware, setCurriculumAware, onEditAssignment, onApprovalDecision, myFacultyId }) {
  // Permissions for this page: faculty can only view; only Admin/Chair approve.
  const canEdit = role !== "faculty";
  const canApprove = role === "admin" || role === "chair";
  const [approvalComment, setApprovalComment] = useState("");

  if (!result) {
    return (
      <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-100 text-center">
        <IconCalendar size={40} className="mx-auto text-slate-300 mb-4" />
        <h3 className="font-semibold text-slate-900 mb-2">No schedule generated yet</h3>
        <p className="text-sm text-slate-500 mb-5">Run the AI Optimization Engine to generate a conflict-free schedule from your current faculty, subjects, and rooms.</p>
        {canEdit && (
          <div className="max-w-md mx-auto mb-5">
            <CurriculumToggle curriculumAware={curriculumAware} setCurriculumAware={setCurriculumAware} />
          </div>
        )}
        <button onClick={onGenerate} disabled={generating}
          className="bg-teal-500 hover:bg-teal-600 text-white font-medium text-sm px-5 py-2.5 rounded-lg disabled:opacity-60">
          {generating ? "Generating..." : "Generate Schedule"}
        </button>
      </div>
    );
  }

  const facultyList = role === "faculty" ? faculty.filter(f => f.id === myFacultyId) : faculty;
  const activeFacultyId = role === "faculty"
    ? myFacultyId
    : (selectedFacultyId != null ? selectedFacultyId : facultyList[0]?.id);

  // Build the weekly grid: grid["Mon"][3] = the class held Monday period 3.
  // Removed classes (slotId -1) have no slot, so they are skipped.
  const grid = {};
  E.DAYS.forEach(d => grid[d] = {});
  result.genes.forEach((g, i) => {
    const slot = slotById[g.slotId];
    if (!slot) return;
    grid[slot.day][slot.period] = { section: sections[i], faculty: facultyById[g.facultyId], room: roomById[g.roomId], index: i };
  });

  const periods = Array.from({length: E.PERIODS}, (_,i) => i+1);
  const unscheduledCount = result.violations.unscheduled || 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <span className={"text-sm font-medium px-3 py-1.5 rounded-lg " + (result.feasible ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700")}>
            {result.feasible ? "✓ Conflict-free" : "⚠ " + result.violations.total + " conflicts remaining"}
          </span>
          {result.curriculumAware && (
            <span className={"text-sm font-medium px-3 py-1.5 rounded-lg " + (result.curriculumConflicts === 0 ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700")}>
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
          <button onClick={onGenerate} disabled={generating} className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium px-3.5 py-2 rounded-lg disabled:opacity-60">
            <IconRefresh size={14}/> {generating ? "Regenerating..." : "Regenerate"}
          </button>
        </div>
      </div>

      <div className="no-print bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-900">Approval Status:</span>
            <span className={"text-xs font-semibold px-2.5 py-1 rounded-full " +
              (result.approvalStatus === "Approved" ? "bg-emerald-50 text-emerald-700"
                : result.approvalStatus === "Rejected" ? "bg-rose-50 text-rose-700"
                : "bg-amber-50 text-amber-700")}>
              {result.approvalStatus || "Pending Review"}
            </span>
            {result.approvalComment && <span className="text-xs text-slate-500 italic">“{result.approvalComment}”</span>}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => {
                const rows = result.genes.map((g, i) => {
                  const sec = sections[i], fac = facultyById[g.facultyId], room = roomById[g.roomId], slot = slotById[g.slotId];
                  return [slot ? slot.day : "Unscheduled", slot ? slot.label : "", sec.subjectCode, sec.subjectName, sec.sectionName, fac ? fac.name : "", room ? room.name : ""];
                });
                downloadCSV("timetable.csv", ["Day","Time","Code","Subject","Section","Faculty","Room"], rows);
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
              className="flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium px-4 py-2 rounded-lg">
              <IconThumbsUp size={15} /> Approve
            </button>
            <button onClick={() => { onApprovalDecision("Rejected", approvalComment); setApprovalComment(""); }}
              className="flex items-center justify-center gap-1.5 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium px-4 py-2 rounded-lg">
              <IconThumbsDown size={15} /> Reject
            </button>
          </div>
        )}
      </div>

      <div className="no-print bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h3 className="font-semibold text-slate-900 mb-3 text-sm">GA Convergence (this run)</h3>
        <ConvergenceChart convergence={result.convergence} />
      </div>

      <div className="no-print flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2">
          <button onClick={()=>setTab("grid")} className={"text-sm font-medium px-4 py-2 rounded-lg " + (tab==="grid"?"bg-slate-900 text-white":"bg-white text-slate-600 border border-slate-200")}>Weekly Grid</button>
          <button onClick={()=>setTab("faculty")} className={"text-sm font-medium px-4 py-2 rounded-lg " + (tab==="faculty"?"bg-slate-900 text-white":"bg-white text-slate-600 border border-slate-200")}>{role === "faculty" ? "My Schedule" : "By Faculty"}</button>
        </div>
        {canEdit && <span className="text-xs text-slate-400">Click any class to edit or remove it</span>}
      </div>

      {tab === "grid" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead><tr>
              <th className="p-2 border border-slate-100 bg-slate-50 w-20">Period</th>
              {E.DAYS.map(d => <th key={d} className="p-2 border border-slate-100 bg-slate-50">{d}</th>)}
            </tr></thead>
            <tbody>
              {periods.map(p => (
                <tr key={p}>
                  <td className="p-2 border border-slate-100 text-slate-400 text-center font-medium">P{p}</td>
                  {E.DAYS.map(d => {
                    const cell = grid[d][p];
                    return (
                      <td key={d} className="p-1.5 border border-slate-100 align-top min-w-[140px]">
                        {cell ? (
                          <div
                            onClick={() => canEdit && onEditAssignment(cell.index, result.genes[cell.index])}
                            className={"bg-teal-50 border border-teal-100 rounded-lg p-2 " + (canEdit ? "cursor-pointer hover:bg-teal-100 transition-colors" : "")}>
                            <div className="font-semibold text-slate-900">{cell.section.subjectCode} · {cell.section.sectionName}</div>
                            <div className="text-slate-500">{cell.faculty ? cell.faculty.name : "—"}</div>
                            <div className="text-slate-400">{cell.room ? cell.room.name : "—"}</div>
                          </div>
                        ) : null}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "faculty" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          {role !== "faculty" && (
            <select value={activeFacultyId} onChange={e=>setSelectedFacultyId(Number(e.target.value))} className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
              {facultyList.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          )}
          <div className="mt-4 space-y-2">
            {result.genes.map((g,i) => ({g,i}))
              .filter(({g}) => g.facultyId === activeFacultyId)
              .sort((a,b) => a.g.slotId - b.g.slotId)
              .map(({g,i}) => {
                const slot = slotById[g.slotId], sec = sections[i], room = roomById[g.roomId];
                return (
                  <div key={i} onClick={() => canEdit && onEditAssignment(i, g)}
                    className={"flex items-center justify-between border border-slate-100 rounded-lg px-4 py-2.5 " + (canEdit ? "cursor-pointer hover:bg-slate-50 transition-colors" : "")}>
                    <div>
                      <div className="font-medium text-slate-900 text-sm">{sec.subjectCode} — {sec.subjectName}</div>
                      <div className="text-xs text-slate-400">{sec.sectionName} · {room ? room.name : "—"}</div>
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
          colorFn={() => "#0F8A6B"} />
      </div>
      <TableShell title={"Schedule History (" + history.length + ")"}
        onExport={() => downloadCSV("schedule_history.csv",
          ["Version","Generated","Feasible","Conflicts","Fitness","Generations","Curriculum-aware","Approval"],
          history.slice().reverse().map((h, i) => ["v" + (i + 1), new Date(h.generatedAt).toLocaleString(), h.feasible ? "Yes" : "No", h.violations.total, h.fitness.toFixed(1), h.convergence.length, h.curriculumAware ? "Yes" : "No", h.approvalStatus || "Pending Review"]))}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-slate-400 text-xs border-b border-slate-100">
              <th className="px-6 py-3 font-medium">Version</th><th className="px-6 py-3 font-medium">Generated</th>
              <th className="px-6 py-3 font-medium">Conflicts</th><th className="px-6 py-3 font-medium">Fitness</th>
              <th className="px-6 py-3 font-medium">Generations</th><th className="px-6 py-3 font-medium">Curriculum</th>
              <th className="px-6 py-3 font-medium"></th>
            </tr></thead>
            <tbody>
              {history.map((h, idx) => {
                const versionNum = history.length - idx;
                const isCurrent = h.id === currentId;
                return (
                  <tr key={h.id} className={"border-b border-slate-50 " + (isCurrent ? "bg-teal-50/50" : "hover:bg-slate-50/50")}>
                    <td className="px-6 py-3 font-medium text-slate-900">
                      v{versionNum}
                      {h.id === best.id && <span className="ml-2 text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-full">Best</span>}
                      {isCurrent && <span className="ml-2 text-[10px] font-semibold bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded-full">Current</span>}
                    </td>
                    <td className="px-6 py-3 text-slate-500 whitespace-nowrap">{new Date(h.generatedAt).toLocaleString()}</td>
                    <td className="px-6 py-3">
                      <span className={"text-xs font-semibold px-2 py-1 rounded-full " + (h.violations.total > 0 ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600")}>{h.violations.total}</span>
                    </td>
                    <td className="px-6 py-3 text-slate-500">{h.fitness.toFixed(1)}</td>
                    <td className="px-6 py-3 text-slate-500">{h.convergence.length}</td>
                    <td className="px-6 py-3 text-slate-500">{h.curriculumAware ? "On" : "Off"}</td>
                    <td className="px-6 py-3 text-right">
                      {!isCurrent && (
                        <button onClick={() => onRestore(h)} className="text-xs font-medium text-teal-600 hover:underline">Restore</button>
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
        <button onClick={onGenerate} disabled={generating} className="bg-teal-500 hover:bg-teal-600 text-white font-medium text-sm px-5 py-2.5 rounded-lg disabled:opacity-60">
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
    ["Room type mismatch", v.roomTypeMismatch, "A lecture class placed in a lab room or vice versa"],
    ["Room capacity exceeded", v.capacityViol, "Enrolled students exceed the assigned room's capacity"],
    ["Faculty overload (units)", v.overload, "Total units assigned beyond a faculty member's maximum load"],
  ];
  return (
    <div className="space-y-5">
      <div className={"rounded-2xl p-6 border " + (result.feasible ? "bg-emerald-50 border-emerald-100" : "bg-rose-50 border-rose-100")}>
        <div className="flex items-center gap-3">
          {result.feasible ? <IconCheckCircle size={24} className="text-emerald-600" /> : <IconAlert size={24} className="text-rose-600" />}
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
                  <span className={"text-xs font-semibold px-2 py-1 rounded-full " + (count>0?"bg-rose-50 text-rose-600":"bg-emerald-50 text-emerald-600")}>{count}</span>
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
// that room is used on that day; darker teal = busier.
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
    if (t <= 0.25) return "#ccfbf1";
    if (t <= 0.5) return "#5eead4";
    if (t <= 0.75) return "#14b8a6";
    return "#0f766e";
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
          faculty.map(f => { const st = loadStatusFor(f, sections, result); return [f.name, f.academicRank || "", f.employmentStatus || "", st.assigned, f.maxUnits, st.pct + "%", st.label]; }))}>
        <BarChart data={workloadData} colorFn={() => "#0f8a6b"} />
      </ReportCard>

      <ReportCard title="Room Utilization Report" subtitle={"Sessions held per room (out of " + totalSlots + " weekly periods)"}
        onExport={() => downloadCSV("room_utilization_report.csv",
          ["Room","Type","Capacity","Sessions","Utilization %"],
          rooms.map(r => [r.name, r.type, r.capacity, roomUsage[r.id] || 0, Math.round(((roomUsage[r.id] || 0) / totalSlots) * 100) + "%"]))}>
        <BarChart data={roomData} colorFn={() => "#5B3E96"} />
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
          ["Room capacity exceeded", result.violations.capacityViol],
          ["Faculty overload (units)", result.violations.overload],
          ["Unscheduled (manually removed)", result.violations.unscheduled || 0],
        ])}>
        <div className="text-sm text-slate-600">
          Total hard-constraint violations: <span className={"font-semibold " + (result.violations.total ? "text-rose-600" : "text-emerald-600")}>{result.violations.total}</span>
          {" "}· Approval: <span className="font-semibold">{result.approvalStatus || "Pending Review"}</span>
        </div>
      </ReportCard>
    </div>
  );
}

// SettingsPage: short "about this prototype" text.
function SettingsPage() {
  return (
    <div className="bg-white rounded-2xl p-5 sm:p-8 shadow-sm border border-slate-100 max-w-xl">
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
  );
}

// Start the app: draw <App /> inside the <div id="root"> in index.html.
ReactDOM.createRoot(document.getElementById("root")).render(<App />);
