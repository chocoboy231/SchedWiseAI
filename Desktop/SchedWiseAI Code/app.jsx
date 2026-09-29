const { useState, useEffect, useRef, useMemo } = React;
const E = window.SchedEngine;

// ---------------- Icons (hand-rolled, no external icon dependency) ----------------
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

// ---------------- Export / print / CSV helpers ----------------
function downloadCSV(filename, headers, rows) {
  const escape = (v) => {
    const s = String(v == null ? "" : v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const lines = [headers.map(escape).join(",")].concat(rows.map(r => r.map(escape).join(",")));
  const csv = lines.join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : filename + ".csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

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

function freshData() {
  const seed = 100 + Math.floor(Math.random() * 900);
  const d = E.generateSyntheticData(9, 18, 6, seed);
  return { faculty: d.faculty, rooms: d.rooms, sections: d.sections, timeSlots: d.timeSlots, result: null };
}

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

function Field({ label, children }) {
  return (
    <div className="mb-3">
      <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
      {children}
    </div>
  );
}
const inputCls = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400";

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

function LeaveRequestModal({ faculty, onSave, onClose }) {
  const [facultyId, setFacultyId] = useState(faculty[0] ? faculty[0].id : null);
  const [type, setType] = useState("Leave Request");
  const [description, setDescription] = useState("");
  return (
    <Modal title="New Leave / Availability Request" onClose={onClose}>
      <Field label="Faculty Member">
        <select className={inputCls} value={facultyId} onChange={e=>setFacultyId(Number(e.target.value))}>
          {faculty.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
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

function StatCard({ label, value, sub, color }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
      <div className="text-slate-400 text-xs font-medium mb-1">{label}</div>
      <div className="text-2xl font-bold" style={{ color: color || "#0f172a" }}>{value}</div>
      {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
    </div>
  );
}

function ConvergenceChart({ convergence }) {
  if (!convergence || convergence.length === 0) return null;
  const w = 600, h = 180, pad = 30;
  const allVals = convergence.flatMap(c => [c.best, c.avg]);
  const maxV = Math.max(...allVals, 1), minV = Math.min(...allVals, -1);
  const range = maxV - minV || 1;
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

function App() {
  const saved = loadState();
  const init = saved || freshData();
  const [faculty, setFaculty] = useState(init.faculty);
  const [rooms, setRooms] = useState(init.rooms);
  const [sections, setSections] = useState(init.sections);
  const [timeSlots] = useState(init.timeSlots || E.buildTimeSlots());
  const [result, setResult] = useState(init.result);
  const [role, setRole] = useState(init.role || "admin");
  const [page, setPage] = useState("dashboard");
  const [generating, setGenerating] = useState(false);
  const [facultyModal, setFacultyModal] = useState(null);
  const [sectionModal, setSectionModal] = useState(null);
  const [roomModal, setRoomModal] = useState(null);
  const [scheduleTab, setScheduleTab] = useState("grid");
  const [selectedFacultyId, setSelectedFacultyId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

  useEffect(() => {
    saveState({ faculty, rooms, sections, timeSlots, result, role, leaveRequests, curriculumAware, notifications, scheduleHistory, loggedIn, userName });
  }, [faculty, rooms, sections, timeSlots, result, role, leaveRequests, curriculumAware, notifications, scheduleHistory, loggedIn, userName]);

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

  function pushNotification(message) {
    setNotifications(prev => [{ id: Date.now(), message, timestamp: new Date().toISOString(), read: false }, ...prev]);
  }

  function handleGenerate() {
    setGenerating(true);
    setTimeout(() => {
      const r = E.runGA(faculty, rooms, sections, timeSlots, { generations: 140, popSize: 50, curriculumAware });
      const stamped = { ...r, id: Date.now(), generatedAt: new Date().toISOString(), approvalStatus: "Pending Review", approvalComment: "" };
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

  function handleEditAssignment(index, newGene) {
    if (!result) return;
    const newGenes = result.genes.slice();
    newGenes[index] = newGene;
    const violations = E.countViolations(faculty, rooms, sections, timeSlots, newGenes);
    setResult({ ...result, genes: newGenes, violations, feasible: violations.total === 0, approvalStatus: "Pending Review" });
  }

  function handleDeleteAssignment(index) {
    if (!result) return;
    const newGenes = result.genes.slice();
    newGenes[index] = { facultyId: -1, roomId: -1, slotId: -1 };
    const violations = E.countViolations(faculty, rooms, sections, timeSlots, newGenes);
    setResult({ ...result, genes: newGenes, violations, feasible: violations.total === 0, approvalStatus: "Pending Review" });
  }

  function handleApprovalDecision(status, comment) {
    if (!result) return;
    setResult({ ...result, approvalStatus: status, approvalComment: comment || "" });
    pushNotification("Schedule " + (status === "Approved" ? "approved" : "rejected") + (comment ? " — \"" + comment + "\"" : "") + ".");
  }

  function handleRestoreHistory(entry) {
    setResult(entry);
    pushNotification("Restored schedule from " + new Date(entry.generatedAt).toLocaleString() + ".");
    setPage("schedules");
  }

  function resetDemoData() {
    if (!confirm("Reset all data to a fresh demo dataset? This clears faculty, subjects, rooms, and the current schedule.")) return;
    const d = freshData();
    setFaculty(d.faculty); setRooms(d.rooms); setSections(d.sections); setResult(null); setLeaveRequests([]); setScheduleHistory([]);
  }

  const facultyById = Object.fromEntries(faculty.map(f => [f.id, f]));
  const roomById = Object.fromEntries(rooms.map(r => [r.id, r]));
  const slotById = Object.fromEntries(timeSlots.map(t => [t.id, t]));

  const roleLabel = ROLES.find(r => r.key === role).label;
  const currentUserName = role === "faculty" && faculty[0] ? faculty[0].name : userName;
  const unreadCount = notifications.filter(n => !n.read).length;

  function goToPage(key) {
    setPage(key);
    setSidebarOpen(false);
  }

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
            <DashboardPage faculty={faculty} rooms={rooms} sections={sections} result={result}
              generating={generating} onGenerate={handleGenerate} role={role} />
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
              onNewRequest={() => setLeaveRequestModal(true)}
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
        <LeaveRequestModal faculty={faculty}
          onSave={req => {
            setLeaveRequests([req, ...leaveRequests]);
            const fac = faculty.find(f => f.id === req.facultyId);
            pushNotification("New " + req.type.toLowerCase() + " submitted by " + (fac ? fac.name : "faculty") + ".");
          }}
          onClose={() => setLeaveRequestModal(false)} />
      )}
      {csvImportKind && (
        <CSVImportModal kind={csvImportKind}
          onImportFaculty={recs => { setFaculty([...faculty, ...recs]); pushNotification("Imported " + recs.length + " faculty record(s)."); }}
          onImportSections={recs => { setSections([...sections, ...recs]); pushNotification("Imported " + recs.length + " subject record(s)."); }}
          onImportRooms={recs => { setRooms([...rooms, ...recs]); pushNotification("Imported " + recs.length + " room record(s)."); }}
          onClose={() => setCsvImportKind(null)} />
      )}
    </div>
  );
}

function DashboardPage({ faculty, rooms, sections, result, generating, onGenerate, role }) {
  const totalUnits = sections.reduce((s,x)=>s+x.units, 0);
  return (
    <div className="space-y-6">
      <section className="rounded-3xl overflow-hidden bg-gradient-to-br from-[#0c1330] via-[#0e3a4a] to-[#127a72] px-5 sm:px-10 py-8 sm:py-10">
        <span className="inline-flex items-center gap-1.5 bg-white/10 text-white text-xs font-medium px-3 py-1.5 rounded-full mb-5 sm:mb-6">
          <IconSparkles size={13} /> Academic planning, made clearer
        </span>
        <h1 className="text-white font-bold text-2xl sm:text-4xl leading-tight mb-3">Welcome to your workspace</h1>
        <p className="text-slate-300 text-sm sm:text-[15px] leading-relaxed mb-6 sm:mb-7 max-w-xl">
          This is a working prototype of SchedWiseAI. Explore Faculty, Subjects, and Rooms, then generate an
          AI-optimized class schedule using a real Genetic Algorithm running in your browser.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={onGenerate} disabled={generating}
            className="bg-teal-400 text-[#0c1330] font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-teal-300 transition-colors disabled:opacity-60 flex items-center gap-2">
            <IconZap size={15} />{generating ? "Generating..." : "Generate Schedule"}
          </button>
          {result && (
            <span className={"text-sm font-medium px-3 py-2 rounded-lg " + (result.feasible ? "bg-emerald-400/20 text-emerald-300" : "bg-rose-400/20 text-rose-300")}>
              {result.feasible ? "✓ Last run: fully conflict-free" : "⚠ Last run: " + result.violations.total + " conflicts"}
            </span>
          )}
        </div>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-5">
        <StatCard label="Faculty Members" value={faculty.length} />
        <StatCard label="Class Sections" value={sections.length} sub={totalUnits + " total units"} />
        <StatCard label="Rooms" value={rooms.length} />
        <StatCard label="Schedule Status" value={result ? (result.feasible ? "Ready" : "Conflicts") : "Not generated"}
          color={result ? (result.feasible ? "#0f8a6b" : "#c0392b") : "#94a3b8"} />
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center mb-4"><IconGauge size={20} className="text-blue-600" /></div>
          <h3 className="font-semibold text-slate-900 mb-1.5">Balanced workloads</h3>
          <p className="text-sm text-slate-500 leading-relaxed">See assigned teaching units per faculty member at a glance in Workload Management.</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center mb-4"><IconCalendar size={20} className="text-blue-600" /></div>
          <h3 className="font-semibold text-slate-900 mb-1.5">Clear scheduling</h3>
          <p className="text-sm text-slate-500 leading-relaxed">Review the generated weekly timetable by grid view or per faculty member.</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center mb-4"><IconShield size={20} className="text-blue-600" /></div>
          <h3 className="font-semibold text-slate-900 mb-1.5">Early conflict review</h3>
          <p className="text-sm text-slate-500 leading-relaxed">Every generation runs a full conflict check across faculty, rooms, and time slots.</p>
        </div>
      </section>

      <section className="bg-white rounded-2xl p-5 sm:p-8 shadow-sm border border-slate-100">
        <div className="text-blue-600 text-xs font-semibold tracking-wide mb-2">How it works</div>
        <h2 className="text-2xl font-bold text-slate-900 mb-6">From faculty data to a review-ready schedule</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            ["1", "Organize resources", "Review or edit faculty, subjects, and available rooms."],
            ["2", "Generate", "The AI Optimization Engine (Genetic Algorithm + constraint checking) builds a conflict-free schedule."],
            ["3", "Review and evaluate", "Check the Class Schedules and Conflict Detection pages, then rate the system."],
          ].map(([n,t,d]) => (
            <div className="flex gap-3" key={n}>
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-sm shrink-0">{n}</div>
              <div><h4 className="font-semibold text-slate-900">{t}</h4><p className="text-sm text-slate-500 mt-1">{d}</p></div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

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

function loadStatusFor(facultyMember, sections, result) {
  if (!result) return { label: "No assignment yet", assigned: 0, pct: 0, color: "text-slate-400 bg-slate-50" };
  const assigned = result.genes.reduce((sum, g, i) => (g.facultyId === facultyMember.id ? sum + sections[i].units : sum), 0);
  const pct = Math.round((assigned / facultyMember.maxUnits) * 100);
  if (assigned > facultyMember.maxUnits) return { label: "Overloaded", assigned, pct, color: "text-rose-600 bg-rose-50" };
  if (pct >= 80) return { label: "Near capacity", assigned, pct, color: "text-amber-600 bg-amber-50" };
  if (pct === 0) return { label: "Underloaded", assigned, pct, color: "text-slate-400 bg-slate-50" };
  return { label: "Balanced", assigned, pct, color: "text-emerald-600 bg-emerald-50" };
}

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

function computeDepartmentStats(spec, faculty, sections, result) {
  const deptFaculty = faculty.filter(f => f.specializations.includes(spec));
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

function DepartmentsPage({ faculty, sections, result }) {
  const [expanded, setExpanded] = useState({});
  const allSpecs = Array.from(new Set([
    ...faculty.flatMap(f => f.specializations),
    ...sections.map(s => s.requiredSpecialization),
  ]));

  const deptStats = allSpecs.map(spec => ({ spec, stats: computeDepartmentStats(spec, faculty, sections, result) }));

  const totalFaculty = faculty.length;
  const totalConflicts = deptStats.reduce((s, d) => s + d.stats.conflicts, 0);
  const totalOverloads = deptStats.reduce((s, d) => s + d.stats.overloads, 0);
  const avgLoadPct = deptStats.length
    ? Math.round(deptStats.reduce((s, d) => s + d.stats.loadPct, 0) / deptStats.length)
    : 0;

  const issues = [];
  deptStats.forEach(({ spec, stats }) => {
    if (stats.noQualifiedFaculty) issues.push({ spec, text: "No qualified faculty available for " + stats.deptSections.length + " section(s) in " + spec + "." });
    if (stats.overloads > 0) issues.push({ spec, text: stats.overloads + " faculty member(s) in " + spec + " are overloaded beyond their maximum units." });
    if (stats.conflicts > 0) issues.push({ spec, text: stats.conflicts + " section(s) in " + spec + " have an unresolved scheduling conflict." });
  });

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

function CurriculumToggle({ curriculumAware, setCurriculumAware }) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 cursor-pointer">
      <input type="checkbox" checked={curriculumAware} onChange={e=>setCurriculumAware(e.target.checked)} className="accent-teal-500" />
      <span>Use curriculum (avoid overlaps within the same year level &amp; semester)</span>
    </label>
  );
}

function SchedulesPage({ result, sections, facultyById, roomById, slotById, timeSlots, generating, onGenerate, tab, setTab, role, faculty, rooms, selectedFacultyId, setSelectedFacultyId, curriculumAware, setCurriculumAware, onEditAssignment, onApprovalDecision }) {
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

  const facultyList = role === "faculty" ? faculty.slice(0,1) : faculty;
  const activeFacultyId = selectedFacultyId != null ? selectedFacultyId : facultyList[0]?.id;

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

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
