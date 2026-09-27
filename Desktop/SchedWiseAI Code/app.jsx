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
  { key: "rooms", label: "Rooms", icon: IconDoor, roles: ["admin","chair","it"] },
  { key: "departments", label: "Departments", icon: IconBuilding, roles: ["admin","it"] },
  { key: "conflicts", label: "Conflict Detection", icon: IconAlert, roles: ["admin","chair","it"] },
  { key: "reports", label: "Reports", icon: IconChart, roles: ["admin","chair","it"] },
];

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

function FacultyModal({ initial, onSave, onClose }) {
  const [name, setName] = useState(initial ? initial.name : "");
  const [specs, setSpecs] = useState(initial ? initial.specializations.join(", ") : "Programming");
  const [maxUnits, setMaxUnits] = useState(initial ? initial.maxUnits : 21);
  return (
    <Modal title={initial ? "Edit Faculty" : "Add Faculty"} onClose={onClose}>
      <Field label="Full Name">
        <input className={inputCls} value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Maria Santos" />
      </Field>
      <Field label="Specializations (comma-separated)">
        <input className={inputCls} value={specs} onChange={e=>setSpecs(e.target.value)} placeholder="Programming, Databases" />
      </Field>
      <Field label="Maximum Teaching Units">
        <input type="number" className={inputCls} value={maxUnits} onChange={e=>setMaxUnits(Number(e.target.value))} />
      </Field>
      <button
        className="w-full bg-teal-500 hover:bg-teal-600 text-white font-medium text-sm py-2.5 rounded-lg mt-2"
        onClick={() => {
          if (!name.trim()) return;
          onSave({
            id: initial ? initial.id : Date.now(),
            name: name.trim(),
            specializations: specs.split(",").map(s=>s.trim()).filter(Boolean),
            maxUnits,
            preferredDays: initial ? initial.preferredDays : ["Mon","Wed","Fri"],
            unavailableSlotIds: initial ? initial.unavailableSlotIds : [],
          });
          onClose();
        }}
      >Save</button>
    </Modal>
  );
}

function SectionModal({ initial, onSave, onClose }) {
  const [subjectCode, setSubjectCode] = useState(initial ? initial.subjectCode : "");
  const [subjectName, setSubjectName] = useState(initial ? initial.subjectName : "");
  const [sectionName, setSectionName] = useState(initial ? initial.sectionName : "");
  const [units, setUnits] = useState(initial ? initial.units : 3);
  const [spec, setSpec] = useState(initial ? initial.requiredSpecialization : "Programming");
  const [roomType, setRoomType] = useState(initial ? initial.roomTypeRequired : "lecture");
  const [enrolled, setEnrolled] = useState(initial ? initial.enrolledStudents : 35);
  return (
    <Modal title={initial ? "Edit Subject" : "Add Subject"} onClose={onClose}>
      <Field label="Subject Code"><input className={inputCls} value={subjectCode} onChange={e=>setSubjectCode(e.target.value)} placeholder="IT101" /></Field>
      <Field label="Subject Name"><input className={inputCls} value={subjectName} onChange={e=>setSubjectName(e.target.value)} placeholder="Introduction to Computing" /></Field>
      <Field label="Section Name"><input className={inputCls} value={sectionName} onChange={e=>setSectionName(e.target.value)} placeholder="BSIT-2A" /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Units"><input type="number" className={inputCls} value={units} onChange={e=>setUnits(Number(e.target.value))} /></Field>
        <Field label="Enrolled Students"><input type="number" className={inputCls} value={enrolled} onChange={e=>setEnrolled(Number(e.target.value))} /></Field>
      </div>
      <Field label="Required Specialization"><input className={inputCls} value={spec} onChange={e=>setSpec(e.target.value)} /></Field>
      <Field label="Room Type Required">
        <select className={inputCls} value={roomType} onChange={e=>setRoomType(e.target.value)}>
          <option value="lecture">Lecture</option>
          <option value="laboratory">Laboratory</option>
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

  useEffect(() => {
    saveState({ faculty, rooms, sections, timeSlots, result, role });
  }, [faculty, rooms, sections, timeSlots, result, role]);

  const visibleNav = NAV_ITEMS.filter(n => n.roles.includes(role));
  useEffect(() => {
    if (!visibleNav.find(n => n.key === page)) setPage(visibleNav[0].key);
  }, [role]);

  function handleGenerate() {
    setGenerating(true);
    setTimeout(() => {
      const r = E.runGA(faculty, rooms, sections, timeSlots, { generations: 140, popSize: 50 });
      setResult(r);
      setGenerating(false);
      setPage("schedules");
    }, 60);
  }

  function resetDemoData() {
    if (!confirm("Reset all data to a fresh demo dataset? This clears faculty, subjects, rooms, and the current schedule.")) return;
    const d = freshData();
    setFaculty(d.faculty); setRooms(d.rooms); setSections(d.sections); setResult(null);
  }

  const facultyById = Object.fromEntries(faculty.map(f => [f.id, f]));
  const roomById = Object.fromEntries(rooms.map(r => [r.id, r]));
  const slotById = Object.fromEntries(timeSlots.map(t => [t.id, t]));

  const roleLabel = ROLES.find(r => r.key === role).label;
  const currentUserName = role === "faculty" && faculty[0] ? faculty[0].name : "Alex Dela Cruz";

  function goToPage(key) {
    setPage(key);
    setSidebarOpen(false);
  }

  return (
    <div className="flex min-h-screen">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={
        "w-64 shrink-0 bg-[#0c1330] flex flex-col justify-between py-5 h-screen fixed md:sticky top-0 left-0 z-50 " +
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
        <header className="bg-white border-b border-slate-100 px-4 sm:px-8 py-3.5 flex items-center gap-3 sm:gap-4">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden shrink-0 w-9 h-9 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center">
            <IconMenu size={18} className="text-slate-600" />
          </button>
          <div className="flex-1 relative max-w-xl min-w-0">
            <IconSearch size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input readOnly placeholder="Search faculty, subjects, rooms..."
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm placeholder:text-slate-400 focus:outline-none" />
          </div>
          <button className="relative shrink-0 w-9 h-9 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center">
            <IconBell size={16} className="text-slate-500" />
          </button>
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
            <FacultyPage faculty={faculty}
              onAdd={() => setFacultyModal("new")}
              onEdit={f => setFacultyModal(f)}
              onDelete={id => setFaculty(faculty.filter(f=>f.id!==id))}
            />
          )}

          {page === "workload" && <WorkloadPage faculty={faculty} sections={sections} result={result} />}

          {page === "subjects" && (
            <SubjectsPage sections={sections}
              onAdd={() => setSectionModal("new")}
              onEdit={s => setSectionModal(s)}
              onDelete={id => setSections(sections.filter(s=>s.id!==id))}
            />
          )}

          {page === "rooms" && (
            <RoomsPage rooms={rooms}
              onAdd={() => setRoomModal("new")}
              onEdit={r => setRoomModal(r)}
              onDelete={id => setRooms(rooms.filter(r=>r.id!==id))}
            />
          )}

          {page === "departments" && <DepartmentsPage faculty={faculty} sections={sections} />}

          {page === "schedules" && (
            <SchedulesPage result={result} sections={sections} facultyById={facultyById} roomById={roomById}
              slotById={slotById} timeSlots={timeSlots} generating={generating} onGenerate={handleGenerate}
              tab={scheduleTab} setTab={setScheduleTab} role={role} faculty={faculty}
              selectedFacultyId={selectedFacultyId} setSelectedFacultyId={setSelectedFacultyId} />
          )}

          {page === "conflicts" && <ConflictsPage result={result} onGenerate={handleGenerate} generating={generating} />}

          {page === "reports" && <ReportsPage faculty={faculty} rooms={rooms} sections={sections} result={result} />}

          {page === "settings" && <SettingsPage />}

        </main>
      </div>

      {facultyModal && (
        <FacultyModal initial={facultyModal === "new" ? null : facultyModal}
          onSave={f => setFaculty(facultyModal === "new" ? [...faculty, f] : faculty.map(x=>x.id===f.id?f:x))}
          onClose={() => setFacultyModal(null)} />
      )}
      {sectionModal && (
        <SectionModal initial={sectionModal === "new" ? null : sectionModal}
          onSave={s => setSections(sectionModal === "new" ? [...sections, s] : sections.map(x=>x.id===s.id?s:x))}
          onClose={() => setSectionModal(null)} />
      )}
      {roomModal && (
        <RoomModal initial={roomModal === "new" ? null : roomModal}
          onSave={r => setRooms(roomModal === "new" ? [...rooms, r] : rooms.map(x=>x.id===r.id?r:x))}
          onClose={() => setRoomModal(null)} />
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

function TableShell({ title, onAdd, addLabel, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <h2 className="font-semibold text-slate-900">{title}</h2>
        {onAdd && (
          <button onClick={onAdd} className="flex items-center gap-1.5 bg-teal-500 hover:bg-teal-600 text-white text-sm font-medium px-3.5 py-2 rounded-lg">
            <IconPlus size={15} /> {addLabel}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function FacultyPage({ faculty, onAdd, onEdit, onDelete }) {
  return (
    <TableShell title={"Faculty (" + faculty.length + ")"} onAdd={onAdd} addLabel="Add Faculty">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-slate-400 text-xs border-b border-slate-100">
            <th className="px-6 py-3 font-medium">Name</th><th className="px-6 py-3 font-medium">Specializations</th>
            <th className="px-6 py-3 font-medium">Max Units</th><th className="px-6 py-3 font-medium">Preferred Days</th>
            <th className="px-6 py-3 font-medium"></th>
          </tr></thead>
          <tbody>
            {faculty.map(f => (
              <tr key={f.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                <td className="px-6 py-3 font-medium text-slate-900">{f.name}</td>
                <td className="px-6 py-3 text-slate-500">{f.specializations.join(", ")}</td>
                <td className="px-6 py-3 text-slate-500">{f.maxUnits}</td>
                <td className="px-6 py-3 text-slate-500">{f.preferredDays.join(", ")}</td>
                <td className="px-6 py-3 text-right whitespace-nowrap">
                  <button onClick={()=>onEdit(f)} className="text-slate-400 hover:text-blue-600 p-1"><IconEdit size={15}/></button>
                  <button onClick={()=>onDelete(f.id)} className="text-slate-400 hover:text-rose-600 p-1"><IconTrash size={15}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </TableShell>
  );
}

function SubjectsPage({ sections, onAdd, onEdit, onDelete }) {
  return (
    <TableShell title={"Subjects / Sections (" + sections.length + ")"} onAdd={onAdd} addLabel="Add Subject">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-slate-400 text-xs border-b border-slate-100">
            <th className="px-6 py-3 font-medium">Code</th><th className="px-6 py-3 font-medium">Subject</th>
            <th className="px-6 py-3 font-medium">Section</th><th className="px-6 py-3 font-medium">Units</th>
            <th className="px-6 py-3 font-medium">Specialization</th><th className="px-6 py-3 font-medium">Room Type</th>
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
  );
}

function RoomsPage({ rooms, onAdd, onEdit, onDelete }) {
  return (
    <TableShell title={"Rooms (" + rooms.length + ")"} onAdd={onAdd} addLabel="Add Room">
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

function DepartmentsPage({ faculty, sections }) {
  const specs = {};
  faculty.forEach(f => f.specializations.forEach(s => { specs[s] = specs[s] || { faculty: 0, sections: 0 }; specs[s].faculty++; }));
  sections.forEach(s => { specs[s.requiredSpecialization] = specs[s.requiredSpecialization] || { faculty: 0, sections: 0 }; specs[s.requiredSpecialization].sections++; });
  return (
    <TableShell title="Departments (by specialization)">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-slate-400 text-xs border-b border-slate-100">
            <th className="px-6 py-3 font-medium">Specialization Area</th><th className="px-6 py-3 font-medium">Qualified Faculty</th><th className="px-6 py-3 font-medium">Sections Offered</th>
          </tr></thead>
          <tbody>
            {Object.entries(specs).map(([name, v]) => (
              <tr key={name} className="border-b border-slate-50 hover:bg-slate-50/50">
                <td className="px-6 py-3 font-medium text-slate-900">{name}</td>
                <td className="px-6 py-3 text-slate-500">{v.faculty}</td>
                <td className="px-6 py-3 text-slate-500">{v.sections}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </TableShell>
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

function SchedulesPage({ result, sections, facultyById, roomById, slotById, timeSlots, generating, onGenerate, tab, setTab, role, faculty, selectedFacultyId, setSelectedFacultyId }) {
  if (!result) {
    return (
      <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-100 text-center">
        <IconCalendar size={40} className="mx-auto text-slate-300 mb-4" />
        <h3 className="font-semibold text-slate-900 mb-2">No schedule generated yet</h3>
        <p className="text-sm text-slate-500 mb-5">Run the AI Optimization Engine to generate a conflict-free schedule from your current faculty, subjects, and rooms.</p>
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
    grid[slot.day][slot.period] = { section: sections[i], faculty: facultyById[g.facultyId], room: roomById[g.roomId] };
  });

  const periods = Array.from({length: E.PERIODS}, (_,i) => i+1);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className={"text-sm font-medium px-3 py-1.5 rounded-lg " + (result.feasible ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700")}>
            {result.feasible ? "✓ Conflict-free" : "⚠ " + result.violations.total + " conflicts remaining"}
          </span>
          <span className="text-sm text-slate-400">Fitness score: {result.fitness.toFixed(1)} · {result.convergence.length} generations</span>
        </div>
        <button onClick={onGenerate} disabled={generating} className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium px-3.5 py-2 rounded-lg disabled:opacity-60">
          <IconRefresh size={14}/> {generating ? "Regenerating..." : "Regenerate"}
        </button>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h3 className="font-semibold text-slate-900 mb-3 text-sm">GA Convergence (this run)</h3>
        <ConvergenceChart convergence={result.convergence} />
      </div>

      <div className="flex gap-2">
        <button onClick={()=>setTab("grid")} className={"text-sm font-medium px-4 py-2 rounded-lg " + (tab==="grid"?"bg-slate-900 text-white":"bg-white text-slate-600 border border-slate-200")}>Weekly Grid</button>
        <button onClick={()=>setTab("faculty")} className={"text-sm font-medium px-4 py-2 rounded-lg " + (tab==="faculty"?"bg-slate-900 text-white":"bg-white text-slate-600 border border-slate-200")}>{role === "faculty" ? "My Schedule" : "By Faculty"}</button>
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
                          <div className="bg-teal-50 border border-teal-100 rounded-lg p-2">
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
                  <div key={i} className="flex items-center justify-between border border-slate-100 rounded-lg px-4 py-2.5">
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

function ReportsPage({ faculty, rooms, sections, result }) {
  if (!result) {
    return <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-100 text-center text-slate-400">Generate a schedule to see analytics here.</div>;
  }
  const unitsByFaculty = {};
  faculty.forEach(f => unitsByFaculty[f.id] = 0);
  result.genes.forEach((g,i) => { unitsByFaculty[g.facultyId] = (unitsByFaculty[g.facultyId]||0) + sections[i].units; });
  const workloadData = faculty.map(f => ({ label: f.name.split(" ")[0], value: unitsByFaculty[f.id] || 0 }));

  const roomUsage = {};
  rooms.forEach(r => roomUsage[r.id] = 0);
  result.genes.forEach(g => { roomUsage[g.roomId] = (roomUsage[g.roomId]||0) + 1; });
  const roomData = rooms.map(r => ({ label: r.name.replace("Room ",""), value: roomUsage[r.id] || 0 }));

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h3 className="font-semibold text-slate-900 mb-1">Faculty Workload Distribution</h3>
        <p className="text-xs text-slate-400 mb-4">Assigned teaching units per faculty member in the current schedule</p>
        <BarChart data={workloadData} colorFn={d => "#0f8a6b"} />
      </div>
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h3 className="font-semibold text-slate-900 mb-1">Room Utilization</h3>
        <p className="text-xs text-slate-400 mb-4">Number of sessions held per room</p>
        <BarChart data={roomData} colorFn={d => "#5B3E96"} />
      </div>
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
