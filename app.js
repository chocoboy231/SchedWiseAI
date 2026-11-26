/* SchedWiseAI build. DO NOT EDIT: this file is app.jsx compiled by tools/build.html.
   Built 2026-11-26T16:04:37.334Z with Babel 7.23.5. source-hash: 1cf9bc6149e548 */
function _extends() { _extends = Object.assign ? Object.assign.bind() : function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }
/* =====================================================================
   SchedWiseAI — USER INTERFACE  (app.jsx)
   ---------------------------------------------------------------------
   Written in React (JSX). The browser turns this file into normal
   JavaScript on the fly using Babel (loaded in index.html), so there is
   no build step — just open index.html through a web server.

   HOW THE PIECES FIT TOGETHER
     engine.js   → the AI scheduling logic (Genetic Algorithm). It exposes
                   `window.SchedEngine`, which this file calls "E".
     accounts.js → sign-in accounts and password hashing. It exposes
                   `window.SchedAccounts`, which this file calls "SA".
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
     page refresh. Nothing is sent to a server. Sign-in accounts are kept
     apart from it, under their own key (see accounts.js).

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
     7. Sign-in, accounts & notifications .. SetupScreen, SignInScreen,
                                       ChangePasswordScreen, AccountsPage,
                                       YourAccountCard, NotificationPanel
     8. Charts & cards ............... StatCard, ConvergenceChart, BarChart
     9. App() ........................ the main component: all state + page switching
    10. Overview pages ............... one per role (Admin, Chair, Faculty, IT)
    11. Other pages .................. Faculty, Subjects, Rooms, Departments,
                                       Workload, Schedules, History,
                                       Conflicts, Reports, Settings
   ===================================================================== */

// Pull React's "hooks" out of the global React object (loaded from a CDN in index.html).
const {
  useState,
  useEffect,
  useRef,
  useMemo
} = React;

// stripTitle(name): drops leading titles so "Dr. Maria Cruz" -> "Maria Cruz".
// firstName(name): the first real name ("Maria"); initials(name): up to two letters.
// Without this, a sign-in name like "Dr. Maria" greeted the user as just "Dr.".
const NAME_TITLES = /^(dr|dra|engr|prof|mr|mrs|ms|mx|atty|sir|madam|ma'am)\.?$/i;
function stripTitle(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  const i = parts.findIndex(p => !NAME_TITLES.test(p));
  return (i === -1 ? parts : parts.slice(i)).join(" "); // a name that is ALL titles is left as typed
}
function firstName(name) {
  return stripTitle(name).split(" ")[0];
}
function initials(name) {
  return stripTitle(name).split(" ").map(p => p[0]).slice(0, 2).join("");
}
// Shortcut to the scheduling engine defined in engine.js (E.runGA, E.DAYS, etc.).
const E = window.SchedEngine;
// Shortcut to the sign-in accounts defined in accounts.js (SA.makeAccount, SA.verifyPassword, etc.).
const SA = window.SchedAccounts;

/* ---------------------------------------------------------------------
   1. ICONS
   Each icon is a tiny SVG drawing. `Icon` is the shared wrapper (size,
   stroke style); each IconXxx just supplies its own shape via `d`.
   Hand-drawn so the app doesn't depend on an external icon library.
   --------------------------------------------------------------------- */
function Icon({
  d,
  size = 18,
  className = ""
}) {
  return /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className: className
  }, d);
}
const IconHome = p => /*#__PURE__*/React.createElement(Icon, _extends({}, p, {
  d: /*#__PURE__*/React.createElement("path", {
    d: "M3 11l9-8 9 8M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10"
  })
}));
const IconUsers = p => /*#__PURE__*/React.createElement(Icon, _extends({}, p, {
  d: /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("circle", {
    cx: "9",
    cy: "8",
    r: "3"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M2 20c0-3.3 3-6 7-6s7 2.7 7 6"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "17",
    cy: "8",
    r: "2.5"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M22 20c0-2.5-2-4.7-5-5.5"
  }))
}));
const IconGauge = p => /*#__PURE__*/React.createElement(Icon, _extends({}, p, {
  d: /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("path", {
    d: "M12 14 15 10"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "14",
    r: "1.2",
    fill: "currentColor"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M4 14a8 8 0 0 1 16 0"
  }))
}));
const IconBook = p => /*#__PURE__*/React.createElement(Icon, _extends({}, p, {
  d: /*#__PURE__*/React.createElement("path", {
    d: "M4 4h11a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3V4z M18 20H7a3 3 0 0 1-3-3"
  })
}));
const IconCalendar = p => /*#__PURE__*/React.createElement(Icon, _extends({}, p, {
  d: /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("rect", {
    x: "3",
    y: "5",
    width: "18",
    height: "16",
    rx: "2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M16 3v4M8 3v4M3 10h18"
  }))
}));
const IconDoor = p => /*#__PURE__*/React.createElement(Icon, _extends({}, p, {
  d: /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("rect", {
    x: "5",
    y: "3",
    width: "14",
    height: "18",
    rx: "1"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "15",
    cy: "12",
    r: "1",
    fill: "currentColor"
  }))
}));
const IconBuilding = p => /*#__PURE__*/React.createElement(Icon, _extends({}, p, {
  d: /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("rect", {
    x: "4",
    y: "3",
    width: "16",
    height: "18"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M9 7h1M14 7h1M9 11h1M14 11h1M9 15h1M14 15h1"
  }))
}));
const IconChart = p => /*#__PURE__*/React.createElement(Icon, _extends({}, p, {
  d: /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("path", {
    d: "M4 20V10M10 20V4M16 20v-7M22 20H2"
  }))
}));
const IconBell = p => /*#__PURE__*/React.createElement(Icon, _extends({}, p, {
  d: /*#__PURE__*/React.createElement("path", {
    d: "M6 8a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6zM10 20a2 2 0 0 0 4 0"
  })
}));
const IconSettings = p => /*#__PURE__*/React.createElement(Icon, _extends({}, p, {
  d: /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "3"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9c.2.7.7 1.2 1.5 1.4h.1a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"
  }))
}));
const IconSearch = p => /*#__PURE__*/React.createElement(Icon, _extends({}, p, {
  d: /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("circle", {
    cx: "11",
    cy: "11",
    r: "7"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M21 21l-4.3-4.3"
  }))
}));
const IconSparkles = p => /*#__PURE__*/React.createElement(Icon, _extends({}, p, {
  d: /*#__PURE__*/React.createElement("path", {
    d: "M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z"
  })
}));
const IconCheckCircle = p => /*#__PURE__*/React.createElement(Icon, _extends({}, p, {
  d: /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "9"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M8.5 12.5l2.3 2.3L16 10"
  }))
}));
const IconPlus = p => /*#__PURE__*/React.createElement(Icon, _extends({}, p, {
  d: /*#__PURE__*/React.createElement("path", {
    d: "M12 5v14M5 12h14"
  })
}));
const IconEdit = p => /*#__PURE__*/React.createElement(Icon, _extends({}, p, {
  d: /*#__PURE__*/React.createElement("path", {
    d: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"
  })
}));
const IconTrash = p => /*#__PURE__*/React.createElement(Icon, _extends({}, p, {
  d: /*#__PURE__*/React.createElement("path", {
    d: "M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V6h12z"
  })
}));
const IconX = p => /*#__PURE__*/React.createElement(Icon, _extends({}, p, {
  d: /*#__PURE__*/React.createElement("path", {
    d: "M18 6L6 18M6 6l12 12"
  })
}));
const IconRefresh = p => /*#__PURE__*/React.createElement(Icon, _extends({}, p, {
  d: /*#__PURE__*/React.createElement("path", {
    d: "M21 12a9 9 0 1 1-3-6.7M21 4v5h-5"
  })
}));
const IconAlert = p => /*#__PURE__*/React.createElement(Icon, _extends({}, p, {
  d: /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("path", {
    d: "M12 3l10 18H2L12 3z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 10v4M12 17h.01"
  }))
}));
const IconZap = p => /*#__PURE__*/React.createElement(Icon, _extends({}, p, {
  d: /*#__PURE__*/React.createElement("path", {
    d: "M13 2 3 14h7l-1 8 11-14h-7l1-6z"
  })
}));
const IconMenu = p => /*#__PURE__*/React.createElement(Icon, _extends({}, p, {
  d: /*#__PURE__*/React.createElement("path", {
    d: "M3 6h18M3 12h18M3 18h18"
  })
}));
const IconEye = p => /*#__PURE__*/React.createElement(Icon, _extends({}, p, {
  d: /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("path", {
    d: "M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "3"
  }))
}));
const IconChevronDown = p => /*#__PURE__*/React.createElement(Icon, _extends({}, p, {
  d: /*#__PURE__*/React.createElement("path", {
    d: "M6 9l6 6 6-6"
  })
}));
const IconAlertCircle = p => /*#__PURE__*/React.createElement(Icon, _extends({}, p, {
  d: /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "9"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 8v5M12 16h.01"
  }))
}));
const IconDownload = p => /*#__PURE__*/React.createElement(Icon, _extends({}, p, {
  d: /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("path", {
    d: "M12 3v12"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M7 10l5 5 5-5"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M4 21h16"
  }))
}));
const IconUpload = p => /*#__PURE__*/React.createElement(Icon, _extends({}, p, {
  d: /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("path", {
    d: "M12 21V9"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M7 14l5-5 5 5"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M4 3h16"
  }))
}));
const IconPrinter = p => /*#__PURE__*/React.createElement(Icon, _extends({}, p, {
  d: /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("rect", {
    x: "6",
    y: "9",
    width: "12",
    height: "7",
    rx: "1"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M6 9V4h12v5"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M6 17v3h12v-3"
  }))
}));
const IconLogOut = p => /*#__PURE__*/React.createElement(Icon, _extends({}, p, {
  d: /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("path", {
    d: "M9 21H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h4"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M16 17l5-5-5-5"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M21 12H9"
  }))
}));
const IconKey = p => /*#__PURE__*/React.createElement(Icon, _extends({}, p, {
  d: /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("circle", {
    cx: "8",
    cy: "15",
    r: "4"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M11 12l9-9M16 7l3 3M14 9l2 2"
  }))
}));
const IconHistory = p => /*#__PURE__*/React.createElement(Icon, _extends({}, p, {
  d: /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("path", {
    d: "M3 12a9 9 0 1 0 3-6.7"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M3 4v5h5"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 7v5l3 3"
  }))
}));
const IconThumbsUp = p => /*#__PURE__*/React.createElement(Icon, _extends({}, p, {
  d: /*#__PURE__*/React.createElement("path", {
    d: "M7 22V11M2 13v7a2 2 0 0 0 2 2h12.7a2 2 0 0 0 2-1.6l1.3-6A2 2 0 0 0 18 11h-5l1-5a2 2 0 0 0-2-2.4L7 11"
  })
}));
const IconThumbsDown = p => /*#__PURE__*/React.createElement(Icon, _extends({}, p, {
  d: /*#__PURE__*/React.createElement("path", {
    d: "M17 2v11M22 11V4a2 2 0 0 0-2-2H7.3a2 2 0 0 0-2 1.6l-1.3 6A2 2 0 0 0 6 12h5l-1 5a2 2 0 0 0 2 2.4L17 13"
  })
}));

/* ---------------------------------------------------------------------
   2. ROLES & NAVIGATION
   ROLES: the four user types from the study's respondent groups.
   NAV_ITEMS: every sidebar page, and the list of roles allowed to see it.
   This is the Role-Based Access Control (RBAC): if a role isn't listed
   for a page, that page never appears in that role's sidebar.
   --------------------------------------------------------------------- */
const ROLES = [{
  key: "admin",
  label: "Academic Administrator"
}, {
  key: "chair",
  label: "Department Chair"
}, {
  key: "faculty",
  label: "Faculty Member"
}, {
  key: "it",
  label: "IT Professional/Staff"
}];
const NAV_ITEMS = [{
  key: "dashboard",
  label: "Overview",
  icon: IconHome,
  roles: ["admin", "chair", "faculty", "it"]
}, {
  key: "faculty",
  label: "Faculty",
  icon: IconUsers,
  roles: ["admin", "chair", "it"]
}, {
  key: "workload",
  label: "Workload Management",
  icon: IconGauge,
  roles: ["admin", "chair", "it"]
}, {
  key: "subjects",
  label: "Subjects",
  icon: IconBook,
  roles: ["admin", "chair", "it"]
}, {
  key: "schedules",
  label: "Class Schedules",
  icon: IconCalendar,
  roles: ["admin", "chair", "faculty", "it"]
}, {
  key: "history",
  label: "Schedule History",
  icon: IconHistory,
  roles: ["admin", "chair", "it"]
}, {
  key: "rooms",
  label: "Rooms",
  icon: IconDoor,
  roles: ["admin", "chair", "it"]
}, {
  key: "departments",
  label: "Departments",
  icon: IconBuilding,
  roles: ["admin", "it"]
}, {
  key: "conflicts",
  label: "Conflict Detection",
  icon: IconAlert,
  roles: ["admin", "chair", "it"]
}, {
  key: "reports",
  label: "Reports",
  icon: IconChart,
  roles: ["admin", "chair", "it"]
}, {
  key: "accounts",
  label: "Accounts",
  icon: IconKey,
  roles: ["admin", "it"]
}];

/* ---------------------------------------------------------------------
   3. CSV / EXPORT HELPERS
   --------------------------------------------------------------------- */

// downloadCSV(filename, headers, rows)
// Turns a table (a header row + data rows) into a .csv file and makes the
// browser download it. CSV files open directly in Excel or Google Sheets.
// Values containing commas, quotes, or line breaks are wrapped in quotes
// (the standard CSV escaping rule). After downloading, it announces a
// "schedwise:export" event so the IT overview can log the export.
// Text that starts with = + - @ (or a tab / carriage return) would be run as a FORMULA by
// Excel or Google Sheets (for example a teacher named =HYPERLINK(...)). Such text gets a
// leading apostrophe, which spreadsheets hide and which makes them show it as plain text.
// Real numbers are left alone, so -5 stays a number.
function downloadCSV(filename, headers, rows) {
  const escape = v => {
    let s = String(v == null ? "" : v);
    if (typeof v !== "number" && /^[=+\-@\t\r]/.test(s)) s = "'" + s;
    return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const lines = [headers.map(escape).join(",")].concat(rows.map(r => r.map(escape).join(",")));
  const csv = lines.join("\r\n");
  // Create an in-memory file, point a hidden link at it, and "click" the link to download.
  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;"
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : filename + ".csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  window.dispatchEvent(new CustomEvent("schedwise:export", {
    detail: {
      filename: a.download,
      rows: rows.length
    }
  }));
}

// parseCSV(text)
// The reverse of downloadCSV: reads pasted CSV text into { headers, rows }.
// It walks each line character by character so that commas INSIDE quotes
// (e.g. "Santos, Maria") are not mistaken for column separators.
function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length === 0) return {
    headers: [],
    rows: []
  };
  const parseLine = line => {
    const out = [];
    let cur = "",
      inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (inQuotes) {
        if (c === '"' && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else if (c === '"') {
          inQuotes = false;
        } else cur += c;
      } else {
        if (c === '"') inQuotes = true;else if (c === ",") {
          out.push(cur);
          cur = "";
        } else cur += c;
      }
    }
    out.push(cur);
    return out;
  };
  const headers = parseLine(lines[0]).map(h => h.trim());
  const rows = lines.slice(1).filter(l => l.trim().length > 0).map(parseLine);
  return {
    headers,
    rows
  };
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
const YEAR_LABELS = {
  1: "1st Year",
  2: "2nd Year",
  3: "3rd Year",
  4: "4th Year"
};
function yearLabel(n) {
  return YEAR_LABELS[n] || "—";
}

// requestTimesText(request, slotById) -> "Can't teach: Mon (all day) · Prefers: Wed (all day)"
// The times a request blocks, plus any "Prefer instead" times it asks for.
function requestTimesText(r, slotById) {
  const parts = [];
  if ((r.slotIds || []).length) parts.push((r.type === "Leave Request" ? "Away: " : "Can't teach: ") + describeSlots(r.slotIds, slotById));
  if ((r.preferredSlotIds || []).length) parts.push("Prefers: " + describeSlots(r.preferredSlotIds, slotById));
  return parts.length ? parts.join(" · ") : "No time slots selected";
}

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
    let start = ps[0],
      prev = ps[0];
    for (let i = 1; i <= ps.length; i++) {
      if (ps[i] === prev + 1) {
        prev = ps[i];
        continue;
      }
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
    program: s.program || (s.sectionName || "").split("-")[0] || "BSIT"
  }));
  const rooms = (d.rooms || []).map(r => r.type === "lecture" ? {
    ...r,
    type: "laboratory"
  } : r);
  const faculty = (d.faculty || []).map(f => ({
    ...f,
    unavailableSlotIds: f.unavailableSlotIds || [],
    preferredSlotIds: f.preferredSlotIds || []
  }));
  const timeSlots = E.buildTimeSlots();
  function fixSchedule(res) {
    if (!res || !res.genes || res.genes.length !== sections.length) return res;
    const genes = res.genes.map((g, i) => E.isOnline(sections[i]) && g.facultyId !== -1 ? {
      ...g,
      roomId: E.ONLINE_ROOM_ID
    } : g);
    const violations = E.countViolations(faculty, rooms, sections, timeSlots, genes);
    return {
      ...res,
      genes,
      violations,
      feasible: violations.total === 0
    };
  }
  return {
    ...d,
    sections,
    rooms,
    faculty,
    timeSlots,
    result: fixSchedule(d.result),
    scheduleHistory: (d.scheduleHistory || []).map(fixSchedule),
    leaveRequests: (d.leaveRequests || []).map(r => ({
      ...r,
      slotIds: r.slotIds || [],
      preferredSlotIds: r.preferredSlotIds || []
    }))
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
const TEST_CONFLICT_KINDS = [["teacher", "Teacher double-booking"], ["room", "Room double-booking"], ["unqualified", "Unqualified teacher"], ["unavailable", "Teacher unavailable"], ["capacity", "Room too small"], ["roomType", "Online class given a room"], ["fixed", "Fixed time not respected"], ["overload", "Teacher overload"]];
function makeTestConflict(kind, data) {
  const {
    faculty,
    rooms,
    sections,
    timeSlots
  } = data;
  const genes = data.genes.map(g => ({
    ...g
  }));
  const fById = Object.fromEntries(faculty.map(f => [f.id, f]));
  const rById = Object.fromEntries(rooms.map(r => [r.id, r]));
  const slotLabel = id => describeSlots([id], Object.fromEntries(timeSlots.map(t => [t.id, t])));
  const name = i => sections[i].subjectCode + " · " + sections[i].sectionName;
  const scheduled = i => genes[i] && genes[i].facultyId >= 0 && genes[i].slotId >= 0;
  // Classes already part of a conflict are left alone, so a new test conflict never
  // undoes an earlier one. "Involved" = every class the rule checker flags PLUS both
  // classes of any teacher or room double-booking (the checker flags only the second).
  const involved = new Set(E.findConflictingIndices(faculty, rooms, sections, timeSlots, genes));
  const seenF = {},
    seenR = {};
  genes.forEach((g, i) => {
    if (!sections[i] || !scheduled(i)) return;
    const fk = g.facultyId + "-" + g.slotId,
      rk = g.roomId + "-" + g.slotId;
    if (seenF[fk] != null) {
      involved.add(i);
      involved.add(seenF[fk]);
    } else seenF[fk] = i;
    if (g.roomId !== E.ONLINE_ROOM_ID) {
      if (seenR[rk] != null) {
        involved.add(i);
        involved.add(seenR[rk]);
      } else seenR[rk] = i;
    }
  });
  const idx = genes.map((_, i) => i).filter(i => sections[i] && scheduled(i) && !involved.has(i));
  const notFixed = i => sections[i].fixedSlotId == null;
  // Who/what is busy at a time, ignoring class `skip` (the one being moved).
  const facBusy = (fid, sid, skip) => genes.some((g, k) => k !== skip && scheduled(k) && g.facultyId === fid && g.slotId === sid);
  const roomBusy = (rid, sid, skip) => rid !== E.ONLINE_ROOM_ID && genes.some((g, k) => k !== skip && scheduled(k) && g.roomId === rid && g.slotId === sid);
  const qualified = (f, i) => f.specializations.includes(sections[i].requiredSpecialization);
  const free = (f, sid) => !(f.unavailableSlotIds || []).includes(sid);
  const out = (msg, extra) => ({
    genes,
    sections: extra && extra.sections || sections,
    faculty: extra && extra.faculty || faculty,
    message: msg
  });
  if (kind === "teacher") {
    // Give class j the same teacher AND time as class i (j is online, so no room clash is added).
    for (const i of idx) for (const j of idx) {
      if (i === j || !notFixed(j) || !E.isOnline(sections[j])) continue;
      const fi = fById[genes[i].facultyId];
      if (!fi || !qualified(fi, j) || genes[j].slotId === genes[i].slotId) continue;
      genes[j] = {
        facultyId: fi.id,
        roomId: E.ONLINE_ROOM_ID,
        slotId: genes[i].slotId
      };
      return out(name(j) + " moved to " + slotLabel(genes[i].slotId) + " with " + fi.name + ", who already teaches " + name(i) + " then.");
    }
    return {
      error: "No online class could be paired with another class's teacher."
    };
  }
  if (kind === "room") {
    // Put lab class j in the same lab AND time as lab class i (keeping j's own, free, teacher).
    for (const i of idx) for (const j of idx) {
      if (i === j || !notFixed(j) || E.isOnline(sections[i]) || E.isOnline(sections[j])) continue;
      const fj = fById[genes[j].facultyId],
        ri = rById[genes[i].roomId],
        si = genes[i].slotId;
      if (!fj || !ri || ri.capacity < sections[j].enrolledStudents || !free(fj, si) || facBusy(fj.id, si, j)) continue;
      genes[j] = {
        facultyId: fj.id,
        roomId: ri.id,
        slotId: si
      };
      return out(name(j) + " moved into " + ri.name + " at " + slotLabel(si) + ", where " + name(i) + " already meets.");
    }
    return {
      error: "Needs two laboratory classes; none could share a lab without other problems."
    };
  }
  if (kind === "unqualified") {
    for (const j of idx) for (const f of faculty) {
      const sj = genes[j].slotId;
      if (qualified(f, j) || !free(f, sj) || facBusy(f.id, sj, j)) continue;
      genes[j] = {
        ...genes[j],
        facultyId: f.id
      };
      return out(name(j) + " now taught by " + f.name + ", who does not have " + sections[j].requiredSpecialization + ".");
    }
    return {
      error: "Every teacher is qualified or busy."
    };
  }
  if (kind === "unavailable") {
    for (const j of idx) {
      if (!notFixed(j)) continue;
      const f = fById[genes[j].facultyId];
      if (!f) continue;
      const u = (f.unavailableSlotIds || []).find(sid => sid !== genes[j].slotId && !facBusy(f.id, sid, j) && !roomBusy(genes[j].roomId, sid, j));
      if (u == null) continue;
      genes[j] = {
        ...genes[j],
        slotId: u
      };
      return out(name(j) + " moved to " + slotLabel(u) + ", a time " + f.name + " marked unavailable.");
    }
    return {
      error: "No teacher has an unavailable time that a class could be moved into."
    };
  }
  if (kind === "capacity") {
    const maxCap = Math.max(0, ...rooms.map(r => r.capacity));
    for (const j of idx) {
      if (E.isOnline(sections[j])) continue;
      const sj = genes[j].slotId;
      const small = rooms.filter(r => r.capacity < sections[j].enrolledStudents && !roomBusy(r.id, sj, j));
      if (small.length) {
        genes[j] = {
          ...genes[j],
          roomId: small[0].id
        };
        return out(name(j) + " (" + sections[j].enrolledStudents + " students) moved into " + small[0].name + ", which seats " + small[0].capacity + ".");
      }
    }
    // Every lab is big enough for every class: raise one class's enrollment above its lab's size
    // (still within the biggest lab, so "Update affected classes" can fix it).
    for (const j of idx) {
      if (E.isOnline(sections[j])) continue;
      const r = rById[genes[j].roomId];
      if (!r || r.capacity >= maxCap) continue;
      const newCount = Math.min(maxCap, r.capacity + 5);
      const secs = sections.map((s2, k) => k === j ? {
        ...s2,
        enrolledStudents: newCount
      } : s2);
      return out(name(j) + "'s enrollment raised to " + newCount + "; it stays in " + r.name + ", which seats " + r.capacity + ".", {
        sections: secs
      });
    }
    return {
      error: "Needs a laboratory class and labs of different sizes."
    };
  }
  if (kind === "roomType") {
    for (const j of idx) {
      if (!E.isOnline(sections[j])) continue;
      const r = rooms.find(r2 => !roomBusy(r2.id, genes[j].slotId, j));
      if (!r) continue;
      genes[j] = {
        ...genes[j],
        roomId: r.id
      };
      return out(name(j) + " is an online class but was given " + r.name + ".");
    }
    return {
      error: "No online class with a free lab at its time."
    };
  }
  if (kind === "fixed") {
    for (const j of idx) {
      if (!notFixed(j)) continue;
      const f = fById[genes[j].facultyId];
      // Pin it to a time its teacher could actually make, so an update can fix it.
      const target = timeSlots.find(t => t.id !== genes[j].slotId && f && free(f, t.id) && !facBusy(f.id, t.id, j));
      if (!target) continue;
      const secs = sections.map((s2, k) => k === j ? {
        ...s2,
        fixedSlotId: target.id
      } : s2);
      return out(name(j) + " is now fixed to " + slotLabel(target.id) + " but is still scheduled at " + slotLabel(genes[j].slotId) + ".", {
        sections: secs
      });
    }
    return {
      error: "No class could be pinned to another time."
    };
  }
  if (kind === "overload") {
    const loads = faculty.map(f => ({
      f,
      u: genes.reduce((a, g, i) => g.facultyId === f.id && sections[i] ? a + sections[i].units : a, 0)
    })).filter(x => x.u >= 3);
    if (!loads.length) return {
      error: "No teacher has at least 3 units."
    };
    const top = loads.sort((a, b) => b.u - a.u)[0];
    const fac2 = faculty.map(f => f.id === top.f.id ? {
      ...f,
      maxUnits: top.u - 1
    } : f);
    return out(top.f.name + "'s maximum lowered to " + (top.u - 1) + " units; they teach " + top.u + ". (Overload shows on Workload and Departments; it is not counted as a conflict.)", {
      faculty: fac2
    });
  }
  return {
    error: "Unknown conflict type: " + kind
  };
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
  } catch (e) {
    console.warn("localStorage read failed", e);
  }
  return null;
}
function saveState(data) {
  try {
    localStorage.setItem("schedwiseai_prototype_v1", JSON.stringify(data));
  } catch (e) {
    console.warn("localStorage write failed", e);
  }
}

/* ---------------------------------------------------------------------
   4b. BACKUP & RESTORE (Settings → Backup and restore)
   All data lives in ONE browser's localStorage, so clearing the browser's data
   would lose it. A backup is a small .json file the user keeps. It holds the
   data (faculty, subjects, rooms, schedule, history, requests, notifications)
   but NOT who is signed in. parseBackup() checks a chosen file thoroughly BEFORE
   anything is replaced, so a wrong or damaged file can never break the app.
   --------------------------------------------------------------------- */
const BACKUP_APP = "SchedWiseAI";
const BACKUP_VERSION = 1;
const BACKUP_MAX_BYTES = 10 * 1024 * 1024;
const BACKUP_KEYS = ["faculty", "rooms", "sections", "result", "leaveRequests", "curriculumAware", "notifications", "scheduleHistory", "activityLog", "chairDept", "datasetKind", "datasetInfo"];

// makeBackup(state): the object that is written to the .json file.
function makeBackup(state) {
  const data = {};
  BACKUP_KEYS.forEach(k => {
    data[k] = state[k] === undefined ? null : state[k];
  });
  return {
    app: BACKUP_APP,
    backupVersion: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data
  };
}

// downloadJSON(filename, object): same idea as downloadCSV, for a .json file.
function downloadJSON(filename, obj) {
  const blob = new Blob([JSON.stringify(obj, null, 1)], {
    type: "application/json"
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ---------------------------------------------------------------------
   4c. EXCEL WORKBOOKS (Settings → Set up with your school's data)
   These only turn an .xlsx file into plain rows and back; importer.js
   (window.SchedImport) does all the checking. The spreadsheet library
   (vendor/xlsx.full.min.js, about 1 MB) is loaded the first time one of
   them is used, so normal page loads stay fast.
   --------------------------------------------------------------------- */
let sheetLibraryPromise = null;
function loadSheetLibrary() {
  if (window.XLSX) return Promise.resolve(window.XLSX);
  if (!sheetLibraryPromise) {
    sheetLibraryPromise = new Promise((resolve, reject) => {
      const failed = () => {
        sheetLibraryPromise = null;
        reject(new Error("The spreadsheet reader could not be loaded."));
      };
      const s = document.createElement("script");
      s.src = "vendor/xlsx.full.min.js";
      s.onload = () => window.XLSX ? resolve(window.XLSX) : failed();
      s.onerror = failed;
      document.head.appendChild(s);
    });
  }
  return sheetLibraryPromise;
}

// readWorkbookFile(file) -> { "Faculty": rows, ... } with rows[0] = Excel row 1, even when a
// sheet's data does not start in cell A1, so every message can name the row Excel shows.
// Only the template's sheets are turned into rows (other sheets come back empty, for the
// "not used" note), and a sheet that reaches past row 2,001 or column CV is refused before
// any rows are built, so a stray cell far away cannot make the page build millions of cells.
const MAX_SHEET_COLUMNS = 100; // columns A to CV; the widest template sheet uses 15
async function readWorkbookFile(file) {
  if (file.size > SchedImport.LIMITS.maxFileBytes) throw new Error("The file is larger than 5 MB.");
  const notWorkbook = new Error("This file could not be read as an Excel workbook (.xlsx).");
  const bytes = new Uint8Array(await file.arrayBuffer());
  // An .xlsx file is a ZIP archive, which starts with "PK\x03\x04". Anything else (a CSV or a photo
  // renamed to .xlsx, a password-protected workbook) is refused before the library sees it.
  if (bytes.length < 4 || bytes[0] !== 0x50 || bytes[1] !== 0x4b || bytes[2] !== 0x03 || bytes[3] !== 0x04) throw notWorkbook;
  const XLSX = await loadSheetLibrary();
  // nodim: each sheet's size is worked out from the cells it really holds, not from the size the
  // file claims (a wrong claim could leave rows out, or make the reader build millions of empty cells).
  let wb;
  try {
    wb = XLSX.read(bytes, {
      type: "array",
      cellFormula: false,
      cellHTML: false,
      nodim: true
    });
  } catch (e) {
    throw notWorkbook;
  }
  const maxRows = SchedImport.LIMITS.maxRows,
    n = x => x.toLocaleString("en-US");
  const sheets = {};
  wb.SheetNames.forEach(name => {
    const ws = wb.Sheets[name];
    const used = SchedImport.SHEETS.some(s => SchedImport.canonical(s) === SchedImport.canonical(name));
    if (!used || !ws || !ws["!ref"]) {
      sheets[name] = [];
      return;
    }
    const end = XLSX.utils.decode_range(ws["!ref"]).e;
    if (end.r + 1 > maxRows + 1) throw new Error("The " + name + " sheet goes down to row " + n(end.r + 1) + ". At most " + n(maxRows) + " rows of data are allowed, in rows 2 to " + n(maxRows + 1) + ". Remove the extra rows (or anything typed below your data), save, and choose the file again.");
    if (end.c + 1 > MAX_SHEET_COLUMNS) throw new Error("The " + name + " sheet has something in column " + XLSX.utils.encode_col(end.c) + ". SchedWiseAI reads columns A to " + XLSX.utils.encode_col(MAX_SHEET_COLUMNS - 1) + " only: delete anything to the right of your data, save, and choose the file again.");
    try {
      sheets[name] = XLSX.utils.sheet_to_json(ws, {
        header: 1,
        raw: true,
        defval: null,
        blankrows: true,
        range: XLSX.utils.encode_range({
          s: {
            r: 0,
            c: 0
          },
          e: end
        })
      });
    } catch (e) {
      throw notWorkbook;
    }
  });
  return sheets;
}

// downloadWorkbook(filename, { "Sheet name": rows, ... }): one sheet per key, in key order.
async function downloadWorkbook(filename, sheets) {
  const XLSX = await loadSheetLibrary();
  const wb = XLSX.utils.book_new();
  Object.keys(sheets).forEach(name => {
    const ws = XLSX.utils.aoa_to_sheet(sheets[name]);
    const widths = [];
    sheets[name].forEach(row => row.forEach((v, i) => {
      widths[i] = Math.min(40, Math.max(widths[i] || 8, String(v == null ? "" : v).length + 2));
    }));
    ws["!cols"] = widths.map(wch => ({
      wch
    }));
    XLSX.utils.book_append_sheet(wb, ws, name);
  });
  XLSX.writeFile(wb, filename);
}

// parseBackup(text) -> { error } or { data, counts, exportedAt }.
// `data` has been through normalizeData(), exactly like data loaded at startup.
function parseBackup(text) {
  if (typeof text !== "string" || text.length > BACKUP_MAX_BYTES) return {
    error: "That file is empty or too large to be a SchedWiseAI backup."
  };
  let b;
  try {
    b = JSON.parse(text);
  } catch (e) {
    return {
      error: "That file is not valid JSON, so it cannot be a SchedWiseAI backup."
    };
  }
  if (!b || b.app !== BACKUP_APP || !b.data || typeof b.data !== "object") return {
    error: "That file is not a SchedWiseAI backup."
  };
  if (!(b.backupVersion >= 1) || b.backupVersion > BACKUP_VERSION) return {
    error: "That backup was made by a newer version of SchedWiseAI and cannot be read by this one."
  };
  const d = {};
  BACKUP_KEYS.forEach(k => {
    if (b.data[k] !== undefined) d[k] = b.data[k];
  });
  // Every field a page DISPLAYS is checked for the right type, because one wrong type
  // (for example a notification whose message is an object) would stop the whole app
  // from drawing, on every reload, until the browser's site data was cleared.
  const num = Number.isFinite,
    str = x => typeof x === "string",
    obj = x => !!x && typeof x === "object" && !Array.isArray(x);
  const opt = test => x => x == null || test(x);
  const arrOf = test => x => Array.isArray(x) && x.every(test);
  const optStr = opt(str),
    optNum = opt(num),
    numArr = arrOf(num),
    optNumArr = opt(numArr),
    strArr = arrOf(str);
  const id = x => num(x) || str(x);
  const gene = x => obj(x) && num(x.facultyId) && num(x.roomId) && num(x.slotId);
  const slotId = x => x == null || Number.isInteger(x) && x >= 0 && x < E.DAYS.length * E.PERIODS;
  const checks = {
    faculty: f => num(f.id) && str(f.name) && strArr(f.specializations) && num(f.maxUnits) && opt(strArr)(f.preferredDays) && optNumArr(f.unavailableSlotIds) && optNumArr(f.preferredSlotIds) && optStr(f.employmentStatus) && optStr(f.academicRank),
    rooms: r => num(r.id) && str(r.name) && str(r.type) && num(r.capacity),
    sections: s => num(s.id) && str(s.subjectCode) && optStr(s.subjectName) && str(s.sectionName) && str(s.requiredSpecialization) && ["online", "laboratory", "lecture"].includes(s.roomTypeRequired) && num(s.units) && num(s.enrolledStudents) && optNum(s.yearLevel) && optStr(s.semester) && slotId(s.fixedSlotId) && optStr(s.prerequisiteCode) && optStr(s.program) && optStr(s.schoolYear) && optStr(s.category),
    leaveRequests: r => id(r.id) && num(r.facultyId) && str(r.type) && str(r.status) && optNumArr(r.slotIds) && optNumArr(r.preferredSlotIds) && optNumArr(r.addedSlotIds) && optNumArr(r.addedPreferredSlotIds) && optStr(r.description) && optStr(r.dateFrom) && optStr(r.dateTo) && optStr(r.decidedAt) && optStr(r.endedAt),
    notifications: n => id(n.id) && str(n.message) && optStr(n.timestamp) && opt(x => typeof x === "boolean")(n.read),
    activityLog: a => id(a.id) && str(a.kind) && str(a.detail) && optStr(a.timestamp)
  };
  const names = {
    faculty: "faculty",
    rooms: "room",
    sections: "subject",
    leaveRequests: "request",
    notifications: "notification",
    activityLog: "activity log"
  };
  for (const k of ["leaveRequests", "notifications", "scheduleHistory", "activityLog"]) d[k] = d[k] == null ? [] : d[k];
  for (const k of Object.keys(checks)) {
    if (!Array.isArray(d[k])) return {
      error: "The " + names[k] + " list in the backup is missing or damaged."
    };
    const bad = d[k].findIndex(x => !obj(x) || !checks[k](x));
    if (bad >= 0) return {
      error: "Entry " + (bad + 1) + " of the " + names[k] + " list in the backup is damaged."
    };
  }
  for (const k of ["faculty", "rooms", "sections"]) {
    if (new Set(d[k].map(x => x.id)).size !== d[k].length) return {
      error: "The " + names[k] + " list in the backup has repeated ids."
    };
  }
  d.faculty = d.faculty.map(f => ({
    ...f,
    preferredDays: f.preferredDays || []
  }));
  // A schedule (the current one or a saved version): its classes must match the subject list,
  // and every value the Schedules, History and Reports pages show must have the right type.
  const n = d.sections.length;
  const trigger = t => obj(t) && optStr(t.kind) && optStr(t.reason) && optNum(t.facultyId) && optNumArr(t.slotIds) && optNumArr(t.preferredSlotIds);
  const honoured = h => obj(h) && optStr(h.name) && optStr(h.slots) && optStr(h.prefSlots) && optNum(h.clashes) && optNum(h.moved) && optNum(h.inPref);
  const change = c => obj(c) && Number.isInteger(c.index) && c.index >= 0 && c.index < n && gene(c.from) && gene(c.to);
  const summary = u => obj(u) && arrOf(change)(u.changes) && optNum(u.moved) && optNum(u.unchanged) && optNum(u.shifted) && opt(arrOf(honoured))(u.honoured) && opt(strArr)(u.reasons);
  const schedule = s => obj(s) && Array.isArray(s.genes) && s.genes.length === n && s.genes.every(gene) && arrOf(c => obj(c) && num(c.best) && num(c.avg))(s.convergence) && num(s.fitness) && opt(v => obj(v) && Object.values(v).every(num) && num(v.total))(s.violations) && optStr(s.approvalStatus) && optStr(s.approvalComment) && optStr(s.generatedAt) && optStr(s.kind) && opt(id)(s.id) && optNum(s.elapsedMs) && optNum(s.curriculumConflicts) && opt(obj)(s.settings) && opt(r => obj(r) && optStr(r.reason) && opt(arrOf(trigger))(r.triggers))(s.needsRegeneration) && opt(summary)(s.updateSummary);
  if (d.result != null && !schedule(d.result)) return {
    error: "The saved schedule in the backup does not match its subject list, or is damaged."
  };
  const badVersion = d.scheduleHistory.findIndex(h => !schedule(h) || !obj(h.violations));
  if (badVersion >= 0) return {
    error: "Version " + (badVersion + 1) + " in the backup's schedule history does not match its subject list, or is damaged."
  };
  // datasetKind: which sample is loaded, or "school" for uploaded data (datasetInfo then says which file and when).
  if (!optStr(d.chairDept) || !opt(k => ["standard", "expanded", "school"].includes(k))(d.datasetKind) || !opt(x => obj(x) && optStr(x.fileName) && optStr(x.uploadedAt))(d.datasetInfo)) return {
    error: "The settings part of the backup is damaged."
  };
  if (d.result && !obj(d.result.violations)) d.result.violations = E.countViolations(d.faculty, d.rooms, d.sections, E.buildTimeSlots(), d.result.genes);
  const data = normalizeData(d);
  return {
    data,
    exportedAt: b.exportedAt || null,
    counts: {
      faculty: data.faculty.length,
      sections: data.sections.length,
      rooms: data.rooms.length,
      hasSchedule: !!data.result,
      versions: data.scheduleHistory.length
    }
  };
}

// freshData(): creates a brand-new sample dataset (9 faculty, 18 sections, 6 rooms)
// with a random seed, used on first visit and by "Reset Demo Data".
function freshData(kind) {
  const seed = 100 + Math.floor(Math.random() * 900);
  // "expanded" = the larger multi-program sample (BSIT, BSCS, BSIS; about 22 faculty,
  // 48 subjects, 10 labs). Anything else = the standard sample (9 faculty, 18 subjects, 6 labs).
  const d = kind === "expanded" ? E.generateExpandedData(seed) : E.generateSyntheticData(9, 18, 6, seed);
  return {
    faculty: d.faculty,
    rooms: d.rooms,
    sections: d.sections,
    timeSlots: d.timeSlots,
    result: null,
    datasetKind: kind === "expanded" ? "expanded" : "standard"
  };
}

/* ---------------------------------------------------------------------
   5. FORM BUILDING BLOCKS
   --------------------------------------------------------------------- */

// Modal: a pop-up dialog. Clicking the dark background closes it;
// clicking inside the white box does not (stopPropagation).
// Keyboard and screen-reader support: Esc closes the pop-up, focus moves into it when it
// opens (first box, else the close button) and goes back to whatever was focused before
// when it closes, and it is announced as a dialog with its title.
function Modal({
  title,
  onClose,
  children,
  wide
}) {
  const boxRef = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose; // always the latest onClose, without re-running the effect
  const titleId = React.useId();
  useEffect(() => {
    const before = document.activeElement;
    const box = boxRef.current;
    const first = box && box.querySelector("input:not([type=hidden]):not([disabled]), select:not([disabled]), textarea");
    (first || box && box.querySelector("button") || box).focus();
    const onKey = e => {
      if (e.key === "Escape") {
        e.stopPropagation();
        closeRef.current();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      if (before && before.focus && document.contains(before)) before.focus();
    };
  }, []);
  return /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4",
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", {
    ref: boxRef,
    role: "dialog",
    "aria-modal": "true",
    "aria-labelledby": titleId,
    tabIndex: -1,
    className: "bg-white rounded-2xl w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto focus:outline-none " + (wide ? "max-w-3xl" : "max-w-md"),
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between mb-4"
  }, /*#__PURE__*/React.createElement("h3", {
    id: titleId,
    className: "font-semibold text-lg text-slate-900"
  }, title), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    "aria-label": "Close",
    title: "Close",
    className: "text-slate-400 hover:text-slate-600"
  }, /*#__PURE__*/React.createElement(IconX, {
    size: 18
  }))), children));
}

// Field: a label placed above any input. When the field holds ONE input, select or
// textarea, the label is linked to it (htmlFor/id), so clicking the label focuses
// the box and screen readers announce the label.
function Field({
  label,
  children
}) {
  const autoId = React.useId();
  const single = React.isValidElement(children) && ["input", "select", "textarea"].includes(children.type);
  const id = single ? children.props.id || autoId : undefined;
  return /*#__PURE__*/React.createElement("div", {
    className: "mb-3"
  }, /*#__PURE__*/React.createElement("label", {
    htmlFor: id,
    className: "block text-xs font-medium text-slate-500 mb-1"
  }, label), single ? React.cloneElement(children, {
    id
  }) : children);
}
// Shared Tailwind CSS classes so every text box and dropdown looks the same.
const inputCls = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400";

// wholeNumberError(text, min, max, what): "" if `text` is a whole number from min to max,
// otherwise a message saying what is wrong. Forms keep number boxes as TEXT while the user
// types (so a box can be cleared and retyped) and check them only when Save is pressed.
function wholeNumberError(text, min, max, what) {
  const s = String(text).trim();
  if (!/^\d+$/.test(s)) return what + " must be a whole number.";
  const n = Number(s);
  if (n < min || n > max) return what + " must be between " + min + " and " + max + ".";
  return "";
}
// FormError: the red message shown above a form's Save button when something is missing
// or wrong (before, the form silently refused to save). role="alert" makes screen readers say it.
function FormError({
  message
}) {
  return message ? /*#__PURE__*/React.createElement("div", {
    role: "alert",
    className: "text-sm text-rose-700 bg-rose-50 rounded-lg px-3 py-2 mt-2"
  }, message) : null;
}
// Same text, ignoring capitals and extra spaces: used to spot duplicate names.
const sameText = (a, b) => String(a || "").trim().replace(/\s+/g, " ").toLowerCase() === String(b || "").trim().replace(/\s+/g, " ").toLowerCase();
// countOf(1, "room") -> "1 room", countOf(3, "room") -> "3 rooms".
const countOf = (n, word) => n + " " + word + (n === 1 ? "" : "s");

// CheckboxGroup: a grid of checkboxes for picking several options
// (used for Specializations and Preferred Days).
function CheckboxGroup({
  options,
  selected,
  onToggle,
  columns = 2
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "grid gap-1.5 " + (columns === 2 ? "grid-cols-2" : "grid-cols-1")
  }, options.map(opt => /*#__PURE__*/React.createElement("label", {
    key: opt,
    className: "flex items-center gap-2 text-sm text-slate-700 border border-slate-200 rounded-lg px-2.5 py-1.5 cursor-pointer hover:bg-slate-50"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: selected.includes(opt),
    onChange: () => onToggle(opt),
    className: "accent-amber-500"
  }), opt)));
}

/* ---------------------------------------------------------------------
   6. FORMS (MODALS)
   Each form keeps its own copy of the fields in local state while the
   user types. Nothing changes in the real data until "Save" is pressed,
   which calls onSave(...) with the finished record. If `initial` is
   given, the form is in "edit" mode and starts pre-filled.
   --------------------------------------------------------------------- */

// The choices a drop-down offers: the built-in values, every value already in the data,
// and the record's own value, so editing never silently changes a value that is not built in.
const choicesOf = (...lists) => Array.from(new Set([].concat(...lists).filter(v => v != null)));

// FacultyModal: add/edit a faculty member (subject areas, preferred days,
// max units, employment status, academic rank). The subject areas offered are the
// school's own (subjectAreas), and a new one can be added with the box below them.
function FacultyModal({
  initial,
  allFaculty,
  subjectAreas,
  onSave,
  onClose
}) {
  const [error, setError] = useState("");
  const [name, setName] = useState(initial ? initial.name : "");
  const [specs, setSpecs] = useState(initial ? initial.specializations : []);
  const [addedAreas, setAddedAreas] = useState([]); // areas typed into "Add subject area" in this form
  const [newArea, setNewArea] = useState("");
  const [maxUnits, setMaxUnits] = useState(initial ? initial.maxUnits : 21);
  const [preferredDays, setPreferredDays] = useState(initial ? initial.preferredDays : ["Mon", "Wed", "Fri"]);
  const [employmentStatus, setEmploymentStatus] = useState(initial ? initial.employmentStatus : E.EMPLOYMENT_STATUSES[0]);
  const [academicRank, setAcademicRank] = useState(initial ? initial.academicRank : E.ACADEMIC_RANKS[0]);
  const areaOptions = choicesOf(subjectAreas || [], initial ? initial.specializations : [], addedAreas);
  const others = (allFaculty || []).filter(f => !initial || f.id !== initial.id);
  const statusOptions = choicesOf(E.EMPLOYMENT_STATUSES, others.map(f => f.employmentStatus), [employmentStatus]).filter(Boolean);
  const rankOptions = choicesOf(E.ACADEMIC_RANKS, others.map(f => f.academicRank), [academicRank]).filter(Boolean);
  function toggleSpec(s) {
    setSpecs(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  }
  function toggleDay(d) {
    setPreferredDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  }
  // "Add subject area": a name that matches an existing one (ignoring capitals) ticks that one instead.
  function addArea() {
    const text = newArea.trim().replace(/\s+/g, " ");
    if (!text) return;
    if (text.length > 120) {
      setError("A subject area can be at most 120 characters.");
      return;
    }
    const existing = areaOptions.find(a => sameText(a, text));
    const area = existing || text;
    if (!existing) setAddedAreas(prev => [...prev, area]);
    setSpecs(prev => prev.includes(area) ? prev : [...prev, area]);
    setNewArea("");
    setError("");
  }
  return /*#__PURE__*/React.createElement(Modal, {
    title: initial ? "Edit Faculty" : "Add Faculty",
    onClose: onClose
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Full Name"
  }, /*#__PURE__*/React.createElement("input", {
    className: inputCls,
    value: name,
    onChange: e => setName(e.target.value),
    placeholder: "e.g. Maria Santos"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Subject areas"
  }, /*#__PURE__*/React.createElement("div", null, areaOptions.length > 0 ? /*#__PURE__*/React.createElement(CheckboxGroup, {
    options: areaOptions,
    selected: specs,
    onToggle: toggleSpec
  }) : /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-500"
  }, "No subject areas yet. Add the first one below."), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-2 mt-2"
  }, /*#__PURE__*/React.createElement("input", {
    className: inputCls,
    value: newArea,
    onChange: e => setNewArea(e.target.value),
    "aria-label": "New subject area",
    placeholder: "Add a subject area, e.g. Accounting",
    onKeyDown: e => {
      if (e.key === "Enter") {
        e.preventDefault();
        addArea();
      }
    }
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: addArea,
    className: "shrink-0 border border-slate-200 hover:border-amber-400 hover:bg-amber-50 rounded-lg px-3 text-sm"
  }, "Add")))), /*#__PURE__*/React.createElement(Field, {
    label: "Preferred Days"
  }, /*#__PURE__*/React.createElement(CheckboxGroup, {
    options: E.DAYS,
    selected: preferredDays,
    onToggle: toggleDay,
    columns: 3
  })), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-3"
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Maximum Teaching Units"
  }, /*#__PURE__*/React.createElement("input", {
    type: "number",
    min: "1",
    max: "40",
    className: inputCls,
    value: maxUnits,
    onChange: e => setMaxUnits(e.target.value)
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Employment Status"
  }, /*#__PURE__*/React.createElement("select", {
    className: inputCls,
    value: employmentStatus,
    onChange: e => setEmploymentStatus(e.target.value)
  }, statusOptions.map(s => /*#__PURE__*/React.createElement("option", {
    key: s,
    value: s
  }, s))))), /*#__PURE__*/React.createElement(Field, {
    label: "Academic Rank"
  }, /*#__PURE__*/React.createElement("select", {
    className: inputCls,
    value: academicRank || "",
    onChange: e => setAcademicRank(e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "\u2014 (none)"), rankOptions.map(r => /*#__PURE__*/React.createElement("option", {
    key: r,
    value: r
  }, r)))), /*#__PURE__*/React.createElement(FormError, {
    message: error
  }), /*#__PURE__*/React.createElement("button", {
    className: "w-full bg-amber-400 hover:bg-amber-300 text-[#0b1d4a] font-medium text-sm py-2.5 rounded-lg mt-2",
    onClick: () => {
      // Faculty sign in by name, so two teachers must not share one.
      const problem = !name.trim() ? "Enter the teacher's full name." : (allFaculty || []).some(f => (!initial || f.id !== initial.id) && sameText(f.name, name)) ? "Another teacher is already called \"" + name.trim() + "\". Names must be different, because a teacher's sign-in account is linked by name." : specs.length === 0 ? "Tick or add at least one subject area." : wholeNumberError(maxUnits, 1, 40, "Maximum teaching units");
      if (problem) {
        setError(problem);
        return;
      }
      // Start from the existing record, so fields this form does not edit are kept:
      // unavailable times and "prefer instead" times from approved requests.
      onSave({
        ...(initial || {
          unavailableSlotIds: [],
          preferredSlotIds: []
        }),
        id: initial ? initial.id : Date.now(),
        name: name.trim(),
        specializations: specs,
        maxUnits: Number(maxUnits),
        preferredDays,
        employmentStatus,
        academicRank
      });
      onClose();
    }
  }, "Save"));
}

// SectionModal: add/edit a subject section: school year, Major/Minor, academic
// year level, semester, class type (Online or Laboratory), an optional FIXED
// day/period (the AI must schedule it exactly then), and an optional prerequisite.
function SectionModal({
  initial,
  allSections,
  subjectAreas,
  programs,
  onSave,
  onClose
}) {
  const [error, setError] = useState("");
  const [subjectCode, setSubjectCode] = useState(initial ? initial.subjectCode : "");
  const [subjectName, setSubjectName] = useState(initial ? initial.subjectName : "");
  const [sectionName, setSectionName] = useState(initial ? initial.sectionName : "");
  const [units, setUnits] = useState(initial ? initial.units : 3);
  // The subject area: one of the school's areas, or a new one typed after choosing "New subject area…".
  const areaChoices = choicesOf(subjectAreas || [], initial ? [initial.requiredSpecialization] : []);
  const [spec, setSpec] = useState(initial ? initial.requiredSpecialization : areaChoices[0] || "");
  const [typingArea, setTypingArea] = useState(areaChoices.length === 0);
  const [newArea, setNewArea] = useState("");
  const [roomType, setRoomType] = useState(initial ? initial.roomTypeRequired : "online");
  const [enrolled, setEnrolled] = useState(initial ? initial.enrolledStudents : 35);
  const [yearLevel, setYearLevel] = useState(initial ? initial.yearLevel : 1);
  const [semester, setSemester] = useState(initial ? initial.semester : "1st Semester");
  const [prerequisiteCode, setPrerequisiteCode] = useState(initial ? initial.prerequisiteCode || "" : "");
  const [schoolYear, setSchoolYear] = useState(initial && initial.schoolYear ? initial.schoolYear : E.currentSchoolYear());
  const [category, setCategory] = useState(initial && initial.category ? initial.category : "Major");
  // Program (curriculum) this section belongs to. The list is the school's programs
  // (passed in as `programs`) plus this subject's own program if it is something else.
  const [program, setProgram] = useState(initial && initial.program ? initial.program : programs && programs[0] || "BSIT");
  const programOptions = choicesOf(programs && programs.length ? programs : ["BSIT", "BSCS", "BSIS"], initial && initial.program ? [initial.program] : []);
  // Fixed day/period is stored as ONE slot id; the form edits it as a day + a period.
  const allSlots = E.buildTimeSlots();
  const initialFixed = initial && initial.fixedSlotId != null ? allSlots.find(t => t.id === initial.fixedSlotId) : null;
  const [fixedDay, setFixedDay] = useState(initialFixed ? initialFixed.day : "");
  const [fixedPeriod, setFixedPeriod] = useState(initialFixed ? initialFixed.period : 1);
  // Year options: the standard list, plus this subject's own year if it's older/newer.
  const yearOptions = Array.from(new Set(E.schoolYearOptions().concat(initial && initial.schoolYear ? [initial.schoolYear] : [])));
  const uniqueSubjectCodes = Array.from(new Set((allSections || []).map(s => s.subjectCode).filter(code => !initial || code !== initial.subjectCode)));
  return /*#__PURE__*/React.createElement(Modal, {
    title: initial ? "Edit Subject" : "Add Subject",
    onClose: onClose
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-3"
  }, /*#__PURE__*/React.createElement(Field, {
    label: "School Year"
  }, /*#__PURE__*/React.createElement("select", {
    className: inputCls,
    value: schoolYear,
    onChange: e => setSchoolYear(e.target.value)
  }, yearOptions.map(y => /*#__PURE__*/React.createElement("option", {
    key: y,
    value: y
  }, "SY ", y)))), /*#__PURE__*/React.createElement(Field, {
    label: "Category"
  }, /*#__PURE__*/React.createElement("select", {
    className: inputCls,
    value: category,
    onChange: e => setCategory(e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: "Major"
  }, "Major"), /*#__PURE__*/React.createElement("option", {
    value: "Minor"
  }, "Minor (e.g. GE, PE, NSTP)")))), /*#__PURE__*/React.createElement(Field, {
    label: "Program"
  }, /*#__PURE__*/React.createElement("select", {
    className: inputCls,
    value: program,
    onChange: e => setProgram(e.target.value)
  }, programOptions.map(pr => /*#__PURE__*/React.createElement("option", {
    key: pr,
    value: pr
  }, pr)))), /*#__PURE__*/React.createElement(Field, {
    label: "Subject Code"
  }, /*#__PURE__*/React.createElement("input", {
    className: inputCls,
    value: subjectCode,
    onChange: e => setSubjectCode(e.target.value),
    placeholder: "IT101"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Subject Name"
  }, /*#__PURE__*/React.createElement("input", {
    className: inputCls,
    value: subjectName,
    onChange: e => setSubjectName(e.target.value),
    placeholder: "Introduction to Computing"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Section Name"
  }, /*#__PURE__*/React.createElement("input", {
    className: inputCls,
    value: sectionName,
    onChange: e => setSectionName(e.target.value),
    placeholder: "BSIT-2A"
  })), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-3"
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Units"
  }, /*#__PURE__*/React.createElement("input", {
    type: "number",
    min: "1",
    max: "10",
    className: inputCls,
    value: units,
    onChange: e => setUnits(e.target.value)
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Enrolled Students"
  }, /*#__PURE__*/React.createElement("input", {
    type: "number",
    min: "1",
    max: "300",
    className: inputCls,
    value: enrolled,
    onChange: e => setEnrolled(e.target.value)
  }))), /*#__PURE__*/React.createElement(Field, {
    label: "Subject area"
  }, /*#__PURE__*/React.createElement("select", {
    className: inputCls,
    value: typingArea ? "__new__" : spec,
    onChange: e => {
      if (e.target.value === "__new__") setTypingArea(true);else {
        setTypingArea(false);
        setSpec(e.target.value);
      }
    }
  }, areaChoices.map(s => /*#__PURE__*/React.createElement("option", {
    key: s,
    value: s
  }, s)), /*#__PURE__*/React.createElement("option", {
    value: "__new__"
  }, "New subject area\u2026"))), typingArea && /*#__PURE__*/React.createElement(Field, {
    label: "New subject area"
  }, /*#__PURE__*/React.createElement("input", {
    className: inputCls,
    value: newArea,
    onChange: e => setNewArea(e.target.value),
    placeholder: "e.g. Midwifery"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Class Type"
  }, /*#__PURE__*/React.createElement("select", {
    className: inputCls,
    value: roomType,
    onChange: e => setRoomType(e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: "online"
  }, "Online (no room needed)"), /*#__PURE__*/React.createElement("option", {
    value: "laboratory"
  }, "Laboratory (on campus)"))), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-3"
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Academic Year Level"
  }, /*#__PURE__*/React.createElement("select", {
    className: inputCls,
    value: yearLevel,
    onChange: e => setYearLevel(Number(e.target.value))
  }, /*#__PURE__*/React.createElement("option", {
    value: 1
  }, "1st Year"), /*#__PURE__*/React.createElement("option", {
    value: 2
  }, "2nd Year"), /*#__PURE__*/React.createElement("option", {
    value: 3
  }, "3rd Year"), /*#__PURE__*/React.createElement("option", {
    value: 4
  }, "4th Year"))), /*#__PURE__*/React.createElement(Field, {
    label: "Semester"
  }, /*#__PURE__*/React.createElement("select", {
    className: inputCls,
    value: semester,
    onChange: e => setSemester(e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: "1st Semester"
  }, "1st Semester"), /*#__PURE__*/React.createElement("option", {
    value: "2nd Semester"
  }, "2nd Semester")))), /*#__PURE__*/React.createElement(Field, {
    label: "Fixed Day & Period (optional)"
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-3"
  }, /*#__PURE__*/React.createElement("select", {
    className: inputCls,
    value: fixedDay,
    onChange: e => setFixedDay(e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "No fixed time"), E.DAYS.map(d => /*#__PURE__*/React.createElement("option", {
    key: d,
    value: d
  }, d))), /*#__PURE__*/React.createElement("select", {
    className: inputCls,
    value: fixedPeriod,
    disabled: !fixedDay,
    onChange: e => setFixedPeriod(Number(e.target.value))
  }, allSlots.filter(t => t.day === "Mon").map(t => /*#__PURE__*/React.createElement("option", {
    key: t.period,
    value: t.period
  }, "P", t.period, " (", t.label.split(" ")[1], ")")))), category === "Minor" && /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-500 mt-1.5"
  }, "If another department (e.g. General Education) sets this subject's time, enter it here. The AI will keep it there and schedule the majors around it.")), /*#__PURE__*/React.createElement(Field, {
    label: "Prerequisite Subject (optional)"
  }, /*#__PURE__*/React.createElement("select", {
    className: inputCls,
    value: prerequisiteCode,
    onChange: e => setPrerequisiteCode(e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "None"), uniqueSubjectCodes.map(code => /*#__PURE__*/React.createElement("option", {
    key: code,
    value: code
  }, code)))), /*#__PURE__*/React.createElement(FormError, {
    message: error
  }), /*#__PURE__*/React.createElement("button", {
    className: "w-full bg-amber-400 hover:bg-amber-300 text-[#0b1d4a] font-medium text-sm py-2.5 rounded-lg mt-2",
    onClick: () => {
      const problem = !subjectCode.trim() ? "Enter the subject code (for example IT101)." : !sectionName.trim() ? "Enter the section name (for example BSIT-2A)." : (allSections || []).some(s => (!initial || s.id !== initial.id) && sameText(s.subjectCode, subjectCode) && sameText(s.sectionName, sectionName)) ? subjectCode.trim() + " is already offered to section " + sectionName.trim() + "." : wholeNumberError(units, 1, 10, "Units") || wholeNumberError(enrolled, 1, 300, "Enrolled students");
      // A typed subject area that matches an existing one (ignoring capitals) uses the existing spelling.
      const typed = newArea.trim().replace(/\s+/g, " ");
      const area = typingArea ? areaChoices.find(a => sameText(a, typed)) || typed : spec;
      const areaProblem = !area ? "Choose a subject area, or type a new one." : area.length > 120 ? "A subject area can be at most 120 characters." : "";
      if (problem || areaProblem) {
        setError(problem || areaProblem);
        return;
      }
      onSave({
        id: initial ? initial.id : Date.now(),
        subjectCode: subjectCode.trim(),
        subjectName: subjectName.trim(),
        sectionName: sectionName.trim(),
        units: Number(units),
        requiredSpecialization: area,
        roomTypeRequired: roomType,
        enrolledStudents: Number(enrolled),
        yearLevel,
        semester,
        prerequisiteCode: prerequisiteCode || null,
        schoolYear,
        category,
        program,
        fixedSlotId: fixedDay ? allSlots.find(t => t.day === fixedDay && t.period === fixedPeriod).id : null
      });
      onClose();
    }
  }, "Save"));
}

// RoomModal: add/edit a room. Since lecture classes are now held online, the
// only physical rooms the scheduler needs are laboratories, so every room
// is saved with type "laboratory".
function RoomModal({
  initial,
  allRooms,
  onSave,
  onClose
}) {
  const [error, setError] = useState("");
  const [name, setName] = useState(initial ? initial.name : "");
  const type = "laboratory";
  const [capacity, setCapacity] = useState(initial ? initial.capacity : 40);
  return /*#__PURE__*/React.createElement(Modal, {
    title: initial ? "Edit Room" : "Add Room",
    onClose: onClose
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Room Name"
  }, /*#__PURE__*/React.createElement("input", {
    className: inputCls,
    value: name,
    onChange: e => setName(e.target.value),
    placeholder: "Room 305"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Capacity"
  }, /*#__PURE__*/React.createElement("input", {
    type: "number",
    min: "1",
    max: "300",
    className: inputCls,
    value: capacity,
    onChange: e => setCapacity(e.target.value)
  })), /*#__PURE__*/React.createElement(FormError, {
    message: error
  }), /*#__PURE__*/React.createElement("button", {
    className: "w-full bg-amber-400 hover:bg-amber-300 text-[#0b1d4a] font-medium text-sm py-2.5 rounded-lg mt-2",
    onClick: () => {
      const problem = !name.trim() ? "Enter the room name." : (allRooms || []).some(r => (!initial || r.id !== initial.id) && sameText(r.name, name)) ? "There is already a room called \"" + name.trim() + "\"." : wholeNumberError(capacity, 1, 300, "Capacity");
      if (problem) {
        setError(problem);
        return;
      }
      onSave({
        id: initial ? initial.id : Date.now(),
        name: name.trim(),
        type,
        capacity: Number(capacity)
      });
      onClose();
    }
  }, "Save"));
}

// AssignmentModal: manual edit of ONE scheduled class after generation.
// The dropdowns only offer qualified faculty and valid rooms for that section,
// so an admin can't accidentally assign an unqualified teacher.
// "Remove" unschedules the class (stored as -1 in the engine).
function AssignmentModal({
  assignment,
  faculty,
  rooms,
  sections,
  timeSlots,
  onSave,
  onDelete,
  onClose
}) {
  const sec = sections[assignment.index];
  const qualifiedFacultyIds = E.qualifiedFaculty(faculty, sec);
  const validRoomIds = E.validRooms(rooms, sec);
  const [facultyId, setFacultyId] = useState(assignment.gene.facultyId);
  const [roomId, setRoomId] = useState(E.isOnline(sec) ? E.ONLINE_ROOM_ID : assignment.gene.roomId);
  const [slotId, setSlotId] = useState(assignment.gene.slotId);
  return /*#__PURE__*/React.createElement(Modal, {
    title: "Edit Assignment — " + sec.subjectCode + " " + sec.sectionName,
    onClose: onClose
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Faculty"
  }, /*#__PURE__*/React.createElement("select", {
    className: inputCls,
    value: facultyId,
    onChange: e => setFacultyId(Number(e.target.value))
  }, qualifiedFacultyIds.length === 0 && /*#__PURE__*/React.createElement("option", {
    value: -1
  }, "No qualified faculty available"), faculty.filter(f => qualifiedFacultyIds.includes(f.id)).map(f => /*#__PURE__*/React.createElement("option", {
    key: f.id,
    value: f.id
  }, f.name)))), /*#__PURE__*/React.createElement(Field, {
    label: "Room"
  }, E.isOnline(sec) ? /*#__PURE__*/React.createElement("div", {
    className: "text-sm text-slate-700 border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
  }, "Online class \u2014 no room needed") : /*#__PURE__*/React.createElement("select", {
    className: inputCls,
    value: roomId,
    onChange: e => setRoomId(Number(e.target.value))
  }, validRoomIds.length === 0 && /*#__PURE__*/React.createElement("option", {
    value: -1
  }, "No valid room available"), rooms.filter(r => validRoomIds.includes(r.id)).map(r => /*#__PURE__*/React.createElement("option", {
    key: r.id,
    value: r.id
  }, r.name, " (", r.capacity, " seats)")))), /*#__PURE__*/React.createElement(Field, {
    label: "Time Slot"
  }, sec.fixedSlotId != null ? /*#__PURE__*/React.createElement("div", {
    className: "text-sm text-slate-700 border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
  }, "\uD83D\uDCCC Fixed: ", (timeSlots.find(t => t.id === sec.fixedSlotId) || {}).label, " \u2014 change it in Subjects") : /*#__PURE__*/React.createElement("select", {
    className: inputCls,
    value: slotId,
    onChange: e => setSlotId(Number(e.target.value))
  }, timeSlots.map(t => {
    const fac = faculty.find(f => f.id === facultyId);
    const blocked = fac && (fac.unavailableSlotIds || []).includes(t.id);
    return /*#__PURE__*/React.createElement("option", {
      key: t.id,
      value: t.id
    }, t.label, blocked ? " — teacher unavailable" : "");
  }))), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-2 mt-2"
  }, /*#__PURE__*/React.createElement("button", {
    className: "flex-1 bg-amber-400 hover:bg-amber-300 text-[#0b1d4a] font-medium text-sm py-2.5 rounded-lg",
    onClick: () => {
      onSave(assignment.index, {
        facultyId,
        roomId,
        slotId
      });
      onClose();
    }
  }, "Save Changes"), /*#__PURE__*/React.createElement("button", {
    className: "px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 font-medium text-sm py-2.5 rounded-lg",
    onClick: () => {
      onDelete(assignment.index);
      onClose();
    }
  }, "Remove")));
}

// FacultyProfileModal: read-only profile card (rank, status, specializations,
// preferred days, unavailable times, and current load from the live schedule).
function FacultyProfileModal({
  faculty,
  sections,
  result,
  slotById,
  onClose
}) {
  const assignedUnits = result ? result.genes.reduce((sum, g, i) => g.facultyId === faculty.id ? sum + sections[i].units : sum, 0) : 0;
  const loadPct = faculty.maxUnits > 0 ? Math.round(assignedUnits / faculty.maxUnits * 100) : 0; // guard: a maximum of 0 would show NaN%
  return /*#__PURE__*/React.createElement(Modal, {
    title: "Faculty Profile",
    onClose: onClose
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3 mb-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-12 h-12 rounded-full bg-amber-400 flex items-center justify-center text-[#0b1d4a] font-semibold text-lg shrink-0"
  }, initials(faculty.name)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "font-semibold text-slate-900"
  }, faculty.name), /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-slate-400"
  }, faculty.academicRank || "—"))), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-3 text-sm mb-3"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-slate-400 mb-0.5"
  }, "Employment Status"), /*#__PURE__*/React.createElement("div", {
    className: "font-medium text-slate-800"
  }, faculty.employmentStatus || "—")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-slate-400 mb-0.5"
  }, "Academic Rank"), /*#__PURE__*/React.createElement("div", {
    className: "font-medium text-slate-800"
  }, faculty.academicRank || "—")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-slate-400 mb-0.5"
  }, "Max Units"), /*#__PURE__*/React.createElement("div", {
    className: "font-medium text-slate-800"
  }, faculty.maxUnits)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-slate-400 mb-0.5"
  }, "Current Load"), /*#__PURE__*/React.createElement("div", {
    className: "font-medium text-slate-800"
  }, assignedUnits, " units (", loadPct, "%)"))), /*#__PURE__*/React.createElement("div", {
    className: "mb-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-slate-400 mb-1"
  }, "Specializations"), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap gap-1.5"
  }, faculty.specializations.map(s => /*#__PURE__*/React.createElement("span", {
    key: s,
    className: "text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium"
  }, s)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-slate-400 mb-1"
  }, "Preferred Days"), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap gap-1.5"
  }, faculty.preferredDays.map(d => /*#__PURE__*/React.createElement("span", {
    key: d,
    className: "text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full font-medium"
  }, d)))), /*#__PURE__*/React.createElement("div", {
    className: "mt-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-slate-400 mb-1"
  }, "Unavailable Times"), /*#__PURE__*/React.createElement("div", {
    className: "text-sm text-slate-700"
  }, (faculty.unavailableSlotIds || []).length ? describeSlots(faculty.unavailableSlotIds, slotById) : "None")), /*#__PURE__*/React.createElement("div", {
    className: "mt-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-slate-400 mb-1"
  }, "Requested Preferred Times"), /*#__PURE__*/React.createElement("div", {
    className: "text-sm text-slate-700"
  }, (faculty.preferredSlotIds || []).length ? describeSlots(faculty.preferredSlotIds, slotById) : "None")));
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
// selected  = times being marked as blocked ("Can't teach" / "Away")
// preferred = times the teacher would like to teach instead (Availability Change only)
function SlotPicker({
  timeSlots,
  selected,
  onToggle,
  onToggleDay,
  unavailable,
  classSlots,
  preferred,
  selectedLabel
}) {
  preferred = preferred || [];
  const selLabel = selectedLabel || "Requested";
  const periods = Array.from({
    length: E.PERIODS
  }, (_, i) => i + 1);
  // slotAt["Fri"][4] -> the slot object for Friday period 4
  const slotAt = {};
  timeSlots.forEach(t => {
    (slotAt[t.day] = slotAt[t.day] || {})[t.period] = t;
  });
  return /*#__PURE__*/React.createElement("div", {
    className: "overflow-x-auto"
  }, /*#__PURE__*/React.createElement("table", {
    className: "text-xs border-collapse w-full min-w-[560px]"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    className: "p-1.5 text-slate-400 font-medium text-left w-24"
  }, "Period"), E.CALENDAR_DAYS.map(d => /*#__PURE__*/React.createElement("th", {
    key: d,
    className: "p-1.5 font-medium"
  }, d === "Sun" ? /*#__PURE__*/React.createElement("span", {
    className: "text-slate-300"
  }, "Sun") : /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => onToggleDay(d),
    title: "Select / clear all of " + d,
    className: "text-slate-600 hover:text-blue-800 underline decoration-dotted"
  }, d))))), /*#__PURE__*/React.createElement("tbody", null, periods.map(p => {
    const anySlot = slotAt["Mon"][p];
    const time = anySlot ? anySlot.label.split(" ")[1] : "";
    return /*#__PURE__*/React.createElement("tr", {
      key: p
    }, /*#__PURE__*/React.createElement("td", {
      className: "p-1.5 text-slate-500 whitespace-nowrap"
    }, /*#__PURE__*/React.createElement("span", {
      className: "font-semibold"
    }, "P", p), " ", /*#__PURE__*/React.createElement("span", {
      className: "text-slate-400"
    }, time)), E.CALENDAR_DAYS.map(d => {
      if (d === "Sun") return /*#__PURE__*/React.createElement("td", {
        key: d,
        className: "p-0.5"
      }, /*#__PURE__*/React.createElement("div", {
        className: "h-10 rounded bg-slate-100",
        title: "No classes on Sunday"
      }));
      const t = slotAt[d][p];
      const isBlocked = unavailable.includes(t.id);
      const isSel = selected.includes(t.id);
      const isPref = preferred.includes(t.id);
      const cls = classSlots[t.id];
      let look = "bg-white border-slate-200 hover:bg-slate-50 cursor-pointer";
      if (isBlocked) look = "bg-slate-200 border-slate-300 text-slate-600 cursor-not-allowed";else if (isSel) look = "bg-rose-600 border-rose-600 text-white cursor-pointer";else if (isPref) look = "bg-emerald-700 border-emerald-700 text-white cursor-pointer";
      return /*#__PURE__*/React.createElement("td", {
        key: d,
        className: "p-0.5"
      }, /*#__PURE__*/React.createElement("button", {
        type: "button",
        disabled: isBlocked,
        onClick: () => onToggle(t.id),
        className: "w-full h-10 rounded border text-[10px] leading-tight font-medium " + look,
        "aria-label": t.label + (isSel ? " " + selLabel : isPref ? " prefer instead" : "")
      }, isBlocked ? "Unavailable" : isSel ? selLabel : isPref ? "Prefer" : "", cls && /*#__PURE__*/React.createElement("div", {
        className: isSel || isPref ? "text-white" : "text-blue-800"
      }, cls.join(", "))));
    }));
  }))), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap gap-3 mt-2 text-[11px] text-slate-500"
  }, /*#__PURE__*/React.createElement("span", {
    className: "flex items-center gap-1"
  }, /*#__PURE__*/React.createElement("span", {
    className: "w-3 h-3 rounded bg-rose-600 inline-block"
  }), " ", selLabel), preferred.length > 0 && /*#__PURE__*/React.createElement("span", {
    className: "flex items-center gap-1"
  }, /*#__PURE__*/React.createElement("span", {
    className: "w-3 h-3 rounded bg-emerald-700 inline-block"
  }), " Prefer instead"), /*#__PURE__*/React.createElement("span", {
    className: "flex items-center gap-1"
  }, /*#__PURE__*/React.createElement("span", {
    className: "w-3 h-3 rounded bg-slate-200 inline-block"
  }), " Already unavailable"), /*#__PURE__*/React.createElement("span", {
    className: "flex items-center gap-1"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-blue-800 font-semibold"
  }, "IT101"), " Current class")));
}

// ---------------------------------------------------------------------
// AvailabilityRequestModal — request an Availability Change or Leave by
// picking time slots on the weekly grid.
//   Availability Change = a lasting change to the teacher's weekly hours.
//   Leave Request       = temporary; once approved the slots are blocked
//                         until an admin/chair presses "End Leave" (an availability change: "Undo change").
// If lockedFacultyId is set (Faculty role) the request is for that person
// only; otherwise a dropdown lets an admin file on someone's behalf.
// Nothing changes until an Admin/Chair approves — see handleRequestDecision in App().
// ---------------------------------------------------------------------
function AvailabilityRequestModal({
  faculty,
  lockedFacultyId,
  timeSlots,
  sections,
  result,
  onSave,
  onClose
}) {
  const locked = lockedFacultyId != null;
  const [facultyId, setFacultyId] = useState(locked ? lockedFacultyId : faculty[0] ? faculty[0].id : null);
  const [type, setType] = useState("Availability Change");
  const [description, setDescription] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [slotIds, setSlotIds] = useState([]); // times blocked: "Can't teach" (or "Away" for leave)
  const [preferIds, setPreferIds] = useState([]); // "Prefer instead" times (Availability Change only)
  const [mode, setMode] = useState("block"); // which kind of cell a click marks
  const [error, setError] = useState("");
  const isChange = type === "Availability Change";
  const fac = faculty.find(f => f.id === facultyId);
  const unavailable = fac ? fac.unavailableSlotIds || [] : [];

  // Which slots this teacher currently teaches in, so they can see what a request would affect.
  const classSlots = {};
  if (result) result.genes.forEach((g, i) => {
    if (g.facultyId === facultyId && g.slotId >= 0) (classSlots[g.slotId] = classSlots[g.slotId] || []).push(sections[i].subjectCode);
  });
  const affected = slotIds.filter(id => classSlots[id]).length;

  // A click marks the cell in the current mode, and clears it from the other mode
  // (a time can't be both "can't teach" and "prefer instead").
  const marking = isChange && mode === "prefer";
  function toggle(id) {
    const [mine, setMine, setOther] = marking ? [preferIds, setPreferIds, setSlotIds] : [slotIds, setSlotIds, setPreferIds];
    setMine(mine.includes(id) ? mine.filter(x => x !== id) : mine.concat([id]));
    setOther(prev => prev.filter(x => x !== id));
  }
  // Whole-day toggle: if every open slot that day is already marked, clear them; otherwise mark them all.
  function toggleDay(day) {
    const daySlots = timeSlots.filter(t => t.day === day && !unavailable.includes(t.id)).map(t => t.id);
    const [mine, setMine, setOther] = marking ? [preferIds, setPreferIds, setSlotIds] : [slotIds, setSlotIds, setPreferIds];
    const allPicked = daySlots.every(id => mine.includes(id));
    setMine(allPicked ? mine.filter(id => !daySlots.includes(id)) : Array.from(new Set(mine.concat(daySlots))));
    if (!allPicked) setOther(prev => prev.filter(id => !daySlots.includes(id)));
  }
  const slotById = Object.fromEntries(timeSlots.map(t => [t.id, t]));
  return /*#__PURE__*/React.createElement(Modal, {
    title: "Request Availability Change / Leave",
    onClose: onClose,
    wide: true
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 sm:grid-cols-2 gap-3"
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Faculty Member"
  }, locked ? /*#__PURE__*/React.createElement("div", {
    className: "text-sm font-medium text-slate-800 border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
  }, fac ? fac.name : "—") : /*#__PURE__*/React.createElement("select", {
    className: inputCls,
    value: facultyId,
    onChange: e => {
      setFacultyId(Number(e.target.value));
      setSlotIds([]);
      setPreferIds([]);
    }
  }, faculty.map(f => /*#__PURE__*/React.createElement("option", {
    key: f.id,
    value: f.id
  }, f.name)))), /*#__PURE__*/React.createElement(Field, {
    label: "Request Type"
  }, /*#__PURE__*/React.createElement("select", {
    className: inputCls,
    value: type,
    onChange: e => {
      setType(e.target.value);
      if (e.target.value !== "Availability Change") {
        setPreferIds([]);
        setMode("block");
      }
    }
  }, /*#__PURE__*/React.createElement("option", null, "Availability Change"), /*#__PURE__*/React.createElement("option", null, "Leave Request")))), type === "Leave Request" && /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-3"
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Leave from"
  }, /*#__PURE__*/React.createElement("input", {
    type: "date",
    className: inputCls,
    value: dateFrom,
    onChange: e => setDateFrom(e.target.value)
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Leave until"
  }, /*#__PURE__*/React.createElement("input", {
    type: "date",
    className: inputCls,
    value: dateTo,
    onChange: e => setDateTo(e.target.value)
  }))), isChange && /*#__PURE__*/React.createElement("div", {
    className: "mb-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-xs font-medium text-slate-600 mb-1"
  }, "What does a click mark?"), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap gap-2"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setMode("block"),
    "aria-pressed": mode === "block",
    className: "text-xs font-semibold px-3 py-1.5 rounded-lg border " + (mode === "block" ? "bg-rose-600 border-rose-600 text-white" : "bg-white border-slate-200 text-slate-700")
  }, "Can't teach (the old times)"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setMode("prefer"),
    "aria-pressed": mode === "prefer",
    className: "text-xs font-semibold px-3 py-1.5 rounded-lg border " + (mode === "prefer" ? "bg-emerald-700 border-emerald-700 text-white" : "bg-white border-slate-200 text-slate-700")
  }, "Prefer instead (the new times)")), /*#__PURE__*/React.createElement("div", {
    className: "text-[11px] text-slate-500 mt-1"
  }, "To move from Monday to Wednesday: mark Monday as ", /*#__PURE__*/React.createElement("span", {
    className: "font-semibold"
  }, "Can't teach"), ", then Wednesday as ", /*#__PURE__*/React.createElement("span", {
    className: "font-semibold"
  }, "Prefer instead"), ".")), /*#__PURE__*/React.createElement(Field, {
    label: type === "Leave Request" ? "Times you'll be away (click cells, or a day name for the whole day)" : "Click cells, or a day name for the whole day"
  }, /*#__PURE__*/React.createElement(SlotPicker, {
    timeSlots: timeSlots,
    selected: slotIds,
    preferred: preferIds,
    onToggle: toggle,
    onToggleDay: toggleDay,
    unavailable: unavailable,
    classSlots: classSlots,
    selectedLabel: isChange ? "Can't teach" : "Away"
  })), /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-2 mb-3 space-y-1"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "font-semibold"
  }, isChange ? "Can't teach:" : "Away:"), " ", slotIds.length ? describeSlots(slotIds, slotById) : "none"), isChange && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "font-semibold"
  }, "Prefer instead:"), " ", preferIds.length ? describeSlots(preferIds, slotById) : "none"), affected > 0 && /*#__PURE__*/React.createElement("div", {
    className: "text-orange-700"
  }, affected, " of these time(s) currently have a class. If approved, those classes will be moved", preferIds.length ? ", into your preferred times first when they are free." : ". Add \"Prefer instead\" times to choose where they go."), isChange && slotIds.length > 0 && affected === 0 && result && /*#__PURE__*/React.createElement("div", {
    className: "text-orange-700"
  }, "None of your classes are at the times you can't teach, so approving this will not move any class. If these are the times you WANT to teach, switch to ", /*#__PURE__*/React.createElement("span", {
    className: "font-semibold"
  }, "Prefer instead"), "."), isChange && slotIds.length === 0 && preferIds.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "text-orange-700"
  }, "Preferred times only guide where classes go when they have to move. To move classes off a day, also mark it as ", /*#__PURE__*/React.createElement("span", {
    className: "font-semibold"
  }, "Can't teach"), ".")), /*#__PURE__*/React.createElement(Field, {
    label: "Reason"
  }, /*#__PURE__*/React.createElement("textarea", {
    className: inputCls,
    rows: 2,
    value: description,
    onChange: e => setDescription(e.target.value),
    placeholder: type === "Leave Request" ? "e.g. Attending a conference" : "e.g. New Friday afternoon admin duties"
  })), error && /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-rose-700 mb-2"
  }, error), /*#__PURE__*/React.createElement("button", {
    className: "w-full bg-amber-400 hover:bg-amber-300 text-[#0b1d4a] font-medium text-sm py-2.5 rounded-lg mt-1",
    onClick: () => {
      if (facultyId == null) return setError("Choose a faculty member.");
      if (slotIds.length === 0 && preferIds.length === 0) return setError("Pick at least one time slot on the grid.");
      if (!description.trim()) return setError("Please give a reason.");
      onSave({
        id: Date.now(),
        facultyId,
        type,
        description: description.trim(),
        slotIds: slotIds.slice().sort((a, b) => a - b),
        preferredSlotIds: isChange ? preferIds.slice().sort((a, b) => a - b) : [],
        dateFrom: type === "Leave Request" ? dateFrom : "",
        dateTo: type === "Leave Request" ? dateTo : "",
        status: "Pending",
        createdAt: new Date().toISOString()
      });
      onClose();
    }
  }, "Submit Request"));
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
  sections.forEach(s => {
    bySubjectCode[s.subjectCode] = s;
  });
  const order = s => s.yearLevel * 2 + (s.semester === "2nd Semester" ? 1 : 0);
  const issues = [];
  sections.forEach(s => {
    if (!s.prerequisiteCode) return;
    const prereq = bySubjectCode[s.prerequisiteCode];
    if (!prereq) {
      issues.push({
        section: s,
        text: s.subjectCode + " (" + s.sectionName + ") requires prerequisite " + s.prerequisiteCode + ", which is not in the curriculum."
      });
    } else if (order(prereq) >= order(s)) {
      issues.push({
        section: s,
        text: s.subjectCode + " (Year " + s.yearLevel + ", " + s.semester + ") lists " + prereq.subjectCode + " as a prerequisite, but it is scheduled in Year " + prereq.yearLevel + ", " + prereq.semester + " — not earlier."
      });
    }
  });
  return issues;
}

// CSVImportModal: bulk-add faculty, subjects, or rooms by pasting CSV text.
// Columns are matched by header NAME (not position), so column order doesn't
// matter. Multi-value fields use semicolons, e.g. "Programming;Databases".
function CSVImportModal({
  kind,
  onImportFaculty,
  onImportSections,
  onImportRooms,
  onClose
}) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const templates = {
    faculty: "name,specializations,maxUnits,preferredDays,employmentStatus,academicRank\nJuan Dela Cruz,\"Programming;Databases\",21,\"Mon;Wed;Fri\",Full-time,Instructor I",
    subjects: "program,schoolYear,category,subjectCode,subjectName,sectionName,units,requiredSpecialization,classType,enrolledStudents,yearLevel,semester,fixedDay,fixedPeriod\nBSIT," + E.currentSchoolYear() + ",Major,IT103,Web Systems,BSIT-2A,3,Web Development,laboratory,35,2,1st Semester,,\nBSIT," + E.currentSchoolYear() + ",Minor,NSTP1,National Service Training Program 1,BSIT-1A,3,General Education,online,40,1,1st Semester,Sat,1",
    rooms: "name,capacity\nLab 210,40"
  };
  function handleImport() {
    try {
      const {
        headers,
        rows
      } = parseCSV(text);
      if (rows.length === 0) {
        setError("No data rows found.");
        return;
      }
      // Find a column by its header name, so column order in the CSV doesn't matter.
      const idx = name => headers.indexOf(name);

      // Reject rows that would silently turn into unschedulable or nameless records.
      const problems = [];
      rows.forEach((r, i) => {
        const line = "Row " + (i + 1) + ": ";
        if (kind === "faculty") {
          if (!(r[idx("name")] || "").trim()) problems.push(line + "name is missing.");
          const specs = (r[idx("specializations")] || "").split(";").map(s => s.trim()).filter(Boolean);
          const tooLong = specs.filter(s => s.length > 120); // any subject area is accepted (the school's own names)
          if (specs.length === 0 || tooLong.length) problems.push(line + (tooLong.length ? "a subject area is longer than 120 characters" : "specialization is missing") + ".");
          {
            const v = (r[idx("maxUnits")] || "").trim();
            if (v && !(Number(v) > 0)) problems.push(line + "maxUnits must be a positive number.");
          }
        } else if (kind === "subjects") {
          if (!(r[idx("subjectCode")] || "").trim()) problems.push(line + "subjectCode is missing.");
          if (!(r[idx("sectionName")] || "").trim()) problems.push(line + "sectionName is missing.");
          const spec = (r[idx("requiredSpecialization")] || "").trim();
          if (!spec) problems.push(line + "requiredSpecialization is missing.");else if (spec.length > 120) problems.push(line + "requiredSpecialization is longer than 120 characters.");
          ["units", "enrolledStudents"].forEach(c => {
            const v = (r[idx(c)] || "").trim();
            if (v && !(Number(v) > 0)) problems.push(line + c + " must be a positive number.");
          });
        } else if (kind === "rooms") {
          if (!(r[idx("name")] || "").trim()) problems.push(line + "name is missing.");
          {
            const v = (r[idx("capacity")] || "").trim();
            if (v && !(Number(v) > 0)) problems.push(line + "capacity must be a positive number.");
          }
        }
      });
      if (problems.length) {
        setError("Nothing was imported. " + problems.slice(0, 5).join(" ") + (problems.length > 5 ? " (+" + (problems.length - 5) + " more)" : ""));
        return;
      }
      if (kind === "faculty") {
        const records = rows.map((r, i) => ({
          id: Date.now() + i,
          name: r[idx("name")] || "Unnamed",
          specializations: (r[idx("specializations")] || "").split(";").map(s => s.trim()).filter(Boolean),
          maxUnits: Number(r[idx("maxUnits")]) || 21,
          preferredDays: (r[idx("preferredDays")] || "Mon;Wed;Fri").split(";").map(s => s.trim()).filter(Boolean),
          unavailableSlotIds: [],
          employmentStatus: r[idx("employmentStatus")] || E.EMPLOYMENT_STATUSES[0],
          academicRank: r[idx("academicRank")] || E.ACADEMIC_RANKS[0]
        }));
        onImportFaculty(records);
      } else if (kind === "subjects") {
        const records = rows.map((r, i) => ({
          id: Date.now() + i,
          subjectCode: r[idx("subjectCode")] || "NEW" + i,
          subjectName: r[idx("subjectName")] || "",
          sectionName: r[idx("sectionName")] || "",
          units: Number(r[idx("units")]) || 3,
          requiredSpecialization: (r[idx("requiredSpecialization")] || "").trim(),
          // Accepts a "classType" (or older "roomTypeRequired") column. Anything that isn't
          // "laboratory" — including the old value "lecture" — is treated as online.
          roomTypeRequired: (r[idx("classType")] || r[idx("roomTypeRequired")] || "online").trim().toLowerCase() === "laboratory" ? "laboratory" : "online",
          enrolledStudents: Number(r[idx("enrolledStudents")]) || 35,
          yearLevel: Number(r[idx("yearLevel")]) || 1,
          semester: r[idx("semester")] || "1st Semester",
          prerequisiteCode: null,
          schoolYear: r[idx("schoolYear")] || E.currentSchoolYear(),
          program: (r[idx("program")] || "").trim() || (r[idx("sectionName")] || "").split("-")[0] || "BSIT",
          category: (r[idx("category")] || "").trim().toLowerCase() === "minor" ? "Minor" : "Major",
          // fixedDay + fixedPeriod (e.g. "Sat", 1) -> the matching slot id; blank = no fixed time.
          fixedSlotId: (() => {
            const day = (r[idx("fixedDay")] || "").trim(),
              per = Number(r[idx("fixedPeriod")]);
            const hit = day && per ? E.buildTimeSlots().find(t => t.day.toLowerCase() === day.slice(0, 3).toLowerCase() && t.period === per) : null;
            return hit ? hit.id : null;
          })()
        }));
        onImportSections(records);
      } else if (kind === "rooms") {
        const records = rows.map((r, i) => ({
          id: Date.now() + i,
          name: r[idx("name")] || "Room " + i,
          type: "laboratory",
          capacity: Number(r[idx("capacity")]) || 40
        }));
        onImportRooms(records);
      }
      onClose();
    } catch (e) {
      setError("Could not parse CSV: " + e.message);
    }
  }
  return /*#__PURE__*/React.createElement(Modal, {
    title: "Bulk Import — " + kind,
    onClose: onClose
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-500 mb-2"
  }, "Paste CSV data below (comma-separated, first row = headers). Use semicolons to separate multiple values within a single field, e.g. specializations."), /*#__PURE__*/React.createElement(Field, {
    label: "CSV Data"
  }, /*#__PURE__*/React.createElement("textarea", {
    className: inputCls,
    rows: 6,
    value: text,
    onChange: e => setText(e.target.value),
    placeholder: templates[kind]
  })), /*#__PURE__*/React.createElement("button", {
    className: "text-xs text-blue-800 hover:underline mb-3",
    onClick: () => setText(templates[kind])
  }, "Load example template"), error && /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-rose-700 mb-2"
  }, error), /*#__PURE__*/React.createElement("button", {
    className: "w-full bg-amber-400 hover:bg-amber-300 text-[#0b1d4a] font-medium text-sm py-2.5 rounded-lg",
    onClick: handleImport
  }, "Import"));
}

/* ---------------------------------------------------------------------
   7. SIGN-IN, ACCOUNTS & NOTIFICATIONS
   Every person signs in with their own account (accounts.js). The very first
   time, when there are no accounts yet, SetupScreen creates the first
   Administrator. Someone whose password was set by another person (a new
   account or a reset) must choose their own before going on. Administrators
   and IT staff manage everyone's accounts on the Accounts page.
   --------------------------------------------------------------------- */

const roleLabelOf = key => (ROLES.find(r => r.key === key) || {}).label || key;
const authBtn = "w-full bg-amber-400 hover:bg-amber-300 text-[#0b1d4a] font-medium text-sm py-2.5 rounded-lg mt-2 disabled:opacity-60";

// AuthCard: the centred card the sign-in screens share.
function AuthCard({
  title,
  subtitle,
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "min-h-screen flex items-center justify-center bg-[#eef1f8] px-4 py-8"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-2xl shadow-sm border border-slate-100 p-8 w-full max-w-sm"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2.5 mb-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-10 h-10 rounded-xl bg-amber-400 flex items-center justify-center"
  }, /*#__PURE__*/React.createElement(IconCalendar, {
    size: 20,
    className: "text-[#0b1d4a]"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "font-semibold text-slate-900 text-lg leading-tight"
  }, "SchedWiseAI"), /*#__PURE__*/React.createElement("div", {
    className: "text-slate-400 text-xs leading-tight"
  }, "World Citi Colleges"))), /*#__PURE__*/React.createElement("h1", {
    className: "font-semibold text-slate-900 mb-1"
  }, title), subtitle && /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-500 mb-4 leading-relaxed"
  }, subtitle), children));
}

// SetupScreen: shown only while there are no accounts at all. Creates the first Administrator.
function SetupScreen({
  onCreate
}) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    if (password !== confirm) {
      setError("The two passwords do not match.");
      return;
    }
    setBusy(true);
    setError("");
    const r = await SA.makeAccount({
      name,
      username,
      role: "admin",
      password
    }, []);
    setBusy(false);
    if (r.error) {
      setError(r.error);
      return;
    }
    onCreate(r.account);
  }
  return /*#__PURE__*/React.createElement(AuthCard, {
    title: "Set up SchedWiseAI",
    subtitle: "Create the first Administrator account. You will use it to sign in and to make accounts for everyone else."
  }, /*#__PURE__*/React.createElement("form", {
    onSubmit: submit,
    noValidate: true
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Full name"
  }, /*#__PURE__*/React.createElement("input", {
    className: inputCls,
    value: name,
    onChange: e => setName(e.target.value),
    autoComplete: "name"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Username"
  }, /*#__PURE__*/React.createElement("input", {
    className: inputCls,
    value: username,
    onChange: e => setUsername(e.target.value),
    autoComplete: "username",
    autoCapitalize: "none",
    spellCheck: false,
    placeholder: "e.g. msantos"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Password (at least 8 characters)"
  }, /*#__PURE__*/React.createElement("input", {
    className: inputCls,
    type: "password",
    value: password,
    onChange: e => setPassword(e.target.value),
    autoComplete: "new-password"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Type the password again"
  }, /*#__PURE__*/React.createElement("input", {
    className: inputCls,
    type: "password",
    value: confirm,
    onChange: e => setConfirm(e.target.value),
    autoComplete: "new-password"
  })), /*#__PURE__*/React.createElement(FormError, {
    message: error
  }), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    className: authBtn,
    disabled: busy
  }, busy ? "Creating…" : "Create account and sign in")));
}

// SignInScreen: username and password. An unknown username and a wrong password get
// the same message, so the screen does not reveal which usernames exist. A turned-off
// account is only mentioned after the right password.
function SignInScreen({
  accounts,
  onSignIn
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    const account = SA.findByUsername(accounts, username);
    const ok = !!account && (await SA.verifyPassword(account, password));
    setBusy(false);
    if (!ok) {
      setError("Wrong username or password.");
      setPassword("");
      return;
    }
    if (account.disabled) {
      setError("This account is turned off. Ask an Administrator or IT staff member.");
      setPassword("");
      return;
    }
    onSignIn(account);
  }
  return /*#__PURE__*/React.createElement(AuthCard, {
    title: "Sign in",
    subtitle: "Use the account your Administrator or IT staff made for you."
  }, /*#__PURE__*/React.createElement("form", {
    onSubmit: submit,
    noValidate: true
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Username"
  }, /*#__PURE__*/React.createElement("input", {
    className: inputCls,
    value: username,
    onChange: e => setUsername(e.target.value),
    autoComplete: "username",
    autoCapitalize: "none",
    spellCheck: false
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Password"
  }, /*#__PURE__*/React.createElement("input", {
    className: inputCls,
    type: "password",
    value: password,
    onChange: e => setPassword(e.target.value),
    autoComplete: "current-password"
  })), /*#__PURE__*/React.createElement(FormError, {
    message: error
  }), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    className: authBtn,
    disabled: busy
  }, busy ? "Checking…" : "Sign In")), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-400 mt-4 text-center"
  }, "Forgot your password? Ask an Administrator or IT staff member to reset it."));
}

// ChangePasswordScreen: after signing in with a password someone else set, the person
// chooses their own (different from the one they were given) before going on.
function ChangePasswordScreen({
  account,
  onSave,
  onSignOut
}) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    const err = SA.checkPassword(password, account.username) || (password !== confirm ? "The two passwords do not match." : "");
    if (err) {
      setError(err);
      return;
    }
    setBusy(true);
    setError("");
    if (await SA.verifyPassword(account, password)) {
      setBusy(false);
      setError("Choose a password different from the one you were given.");
      return;
    }
    const updated = await SA.withNewPassword(account, password, false);
    setBusy(false);
    onSave(updated);
  }
  return /*#__PURE__*/React.createElement(AuthCard, {
    title: "Choose your own password",
    subtitle: "Hello, " + firstName(account.name) + ". Your password was set by someone else. Choose your own to continue."
  }, /*#__PURE__*/React.createElement("form", {
    onSubmit: submit,
    noValidate: true
  }, /*#__PURE__*/React.createElement(Field, {
    label: "New password (at least 8 characters)"
  }, /*#__PURE__*/React.createElement("input", {
    className: inputCls,
    type: "password",
    value: password,
    onChange: e => setPassword(e.target.value),
    autoComplete: "new-password"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Type it again"
  }, /*#__PURE__*/React.createElement("input", {
    className: inputCls,
    type: "password",
    value: confirm,
    onChange: e => setConfirm(e.target.value),
    autoComplete: "new-password"
  })), /*#__PURE__*/React.createElement(FormError, {
    message: error
  }), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    className: authBtn,
    disabled: busy
  }, busy ? "Saving…" : "Save and continue")), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onSignOut,
    className: "w-full text-xs text-slate-500 hover:text-slate-800 mt-3 py-1"
  }, "Sign out"));
}

// suggestPassword(): a random temporary password such as "k7mq-2xw9-hdte"
// (no 0/o, 1/l/i, so it is easy to read out to the person).
function suggestPassword() {
  const abc = "abcdefghjkmnpqrstuvwxyz23456789",
    b = new Uint8Array(12);
  crypto.getRandomValues(b);
  const s = Array.from(b, x => abc[x % abc.length]).join("");
  return s.slice(0, 4) + "-" + s.slice(4, 8) + "-" + s.slice(8);
}

// TempPasswordField: the temporary-password box with a "Suggest" button.
function TempPasswordField({
  value,
  onChange
}) {
  return /*#__PURE__*/React.createElement(Field, {
    label: "Temporary password (at least 8 characters)"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex gap-2"
  }, /*#__PURE__*/React.createElement("input", {
    className: inputCls,
    value: value,
    onChange: e => onChange(e.target.value),
    autoComplete: "off",
    spellCheck: false,
    "aria-label": "Temporary password (at least 8 characters)"
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => onChange(suggestPassword()),
    className: "shrink-0 text-xs font-medium border border-slate-200 rounded-lg px-3 hover:bg-slate-50"
  }, "Suggest")));
}

// AccountModal: add an account, or edit one's name, role and teacher. A new account
// gets a temporary password; the person chooses their own at first sign-in.
function AccountModal({
  initial,
  accounts,
  me,
  faculty,
  onSave,
  onClose
}) {
  const editing = !!initial;
  const self = editing && initial.id === me.id;
  const [name, setName] = useState(initial ? initial.name : "");
  const [username, setUsername] = useState(initial ? initial.username : "");
  const [role, setRole] = useState(initial ? initial.role : "faculty");
  const [teacher, setTeacher] = useState(() => {
    if (!initial || !initial.facultyName) return "";
    const linked = SA.linkedFaculty(initial, faculty);
    return linked ? linked.name : initial.facultyName;
  });
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const teacherNames = faculty.map(f => f.name).sort((a, b) => a.localeCompare(b));
  // The other account already linked to this teacher, if any.
  const takenBy = n => accounts.find(a => a.role === "faculty" && (!editing || a.id !== initial.id) && SA.canonicalName(a.facultyName) === SA.canonicalName(n));
  async function save(e) {
    e.preventDefault();
    if (busy) return;
    if (role === "faculty") {
      if (!teacher) {
        setError("Choose the teacher this account belongs to.");
        return;
      }
      const other = takenBy(teacher);
      if (other) {
        setError(teacher + " already has an account (" + other.username + ").");
        return;
      }
    }
    if (editing) {
      const err = SA.checkName(name) || (role !== initial.role ? SA.checkChange(accounts, me.id, initial.id, {
        kind: "role",
        role
      }) : null);
      if (err) {
        setError(err);
        return;
      }
      onSave({
        ...initial,
        name: name.trim().replace(/\s+/g, " "),
        role,
        facultyName: role === "faculty" ? teacher : null
      }, "Updated the account “" + initial.username + "”");
      return;
    }
    setBusy(true);
    setError("");
    const r = await SA.makeAccount({
      name,
      username,
      role,
      facultyName: teacher,
      password,
      mustChangePassword: true
    }, accounts);
    setBusy(false);
    if (r.error) {
      setError(r.error);
      return;
    }
    onSave(r.account, "Created the account “" + r.account.username + "” (" + roleLabelOf(r.account.role) + ")");
  }
  return /*#__PURE__*/React.createElement(Modal, {
    title: editing ? "Edit account — " + initial.username : "Add account",
    onClose: onClose
  }, /*#__PURE__*/React.createElement("form", {
    onSubmit: save,
    noValidate: true
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Full name"
  }, /*#__PURE__*/React.createElement("input", {
    className: inputCls,
    value: name,
    onChange: e => setName(e.target.value)
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Username"
  }, /*#__PURE__*/React.createElement("input", {
    className: inputCls,
    value: username,
    onChange: e => setUsername(e.target.value),
    disabled: editing,
    autoCapitalize: "none",
    spellCheck: false,
    placeholder: "e.g. acruz"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Role"
  }, /*#__PURE__*/React.createElement("select", {
    className: inputCls,
    value: role,
    onChange: e => setRole(e.target.value),
    disabled: self
  }, ROLES.map(r => /*#__PURE__*/React.createElement("option", {
    key: r.key,
    value: r.key
  }, r.label)))), role === "faculty" && /*#__PURE__*/React.createElement(Field, {
    label: "Teacher (from the Faculty list)"
  }, /*#__PURE__*/React.createElement("select", {
    className: inputCls,
    value: teacher,
    onChange: e => setTeacher(e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "Choose a teacher\u2026"), teacher && !teacherNames.some(n => SA.canonicalName(n) === SA.canonicalName(teacher)) && /*#__PURE__*/React.createElement("option", {
    value: teacher
  }, teacher, " (not in the Faculty list)"), teacherNames.map(n => /*#__PURE__*/React.createElement("option", {
    key: n,
    value: n
  }, n, takenBy(n) ? " — has an account" : "")))), !editing && /*#__PURE__*/React.createElement(TempPasswordField, {
    value: password,
    onChange: setPassword
  }), !editing && /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-500 -mt-1 mb-2"
  }, "Give this password to the person. They must choose their own the first time they sign in."), editing && /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-500 mb-2"
  }, "The username cannot be changed.", self ? " You cannot change your own role." : ""), /*#__PURE__*/React.createElement(FormError, {
    message: error
  }), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-end gap-2 mt-4"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onClose,
    className: "text-sm px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50"
  }, "Cancel"), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    disabled: busy,
    className: "text-sm font-medium px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60"
  }, busy ? "Saving…" : editing ? "Save changes" : "Create account"))));
}

// ResetPasswordModal: gives an account a new temporary password (for someone who forgot theirs).
function ResetPasswordModal({
  account,
  onSave,
  onClose
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function save(e) {
    e.preventDefault();
    if (busy) return;
    const err = SA.checkPassword(password, account.username);
    if (err) {
      setError(err);
      return;
    }
    setBusy(true);
    setError("");
    const updated = await SA.withNewPassword(account, password, true);
    setBusy(false);
    onSave(updated, "Reset the password of “" + account.username + "”");
  }
  return /*#__PURE__*/React.createElement(Modal, {
    title: "Reset password — " + account.username,
    onClose: onClose
  }, /*#__PURE__*/React.createElement("form", {
    onSubmit: save,
    noValidate: true
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-slate-600 mb-3"
  }, account.name, " will sign in with this temporary password, then choose their own."), /*#__PURE__*/React.createElement(TempPasswordField, {
    value: password,
    onChange: setPassword
  }), /*#__PURE__*/React.createElement(FormError, {
    message: error
  }), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-end gap-2 mt-4"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onClose,
    className: "text-sm px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50"
  }, "Cancel"), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    disabled: busy,
    className: "text-sm font-medium px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60"
  }, busy ? "Saving…" : "Reset password"))));
}

// AccountsPage (Administrator and IT): everyone who can sign in. Add, edit, reset a
// password, turn an account off or on, or delete it. The rules that keep the school from
// being locked out (always one active Administrator; nobody removes, turns off or changes
// the role of their own account) are in accounts.js (checkChange).
function AccountsPage({
  accounts,
  me,
  faculty,
  onChange
}) {
  const [modal, setModal] = useState(null); // { kind: "add" } | { kind: "edit" | "reset", account }
  const [msg, setMsg] = useState(null); // { ok, text } about the last action
  const sorted = accounts.slice().sort((a, b) => a.name.localeCompare(b.name));
  const unlinked = accounts.filter(a => a.role === "faculty" && !SA.linkedFaculty(a, faculty));
  function apply(next, text) {
    onChange(next, text);
    setMsg({
      ok: true,
      text: text + "."
    });
    setModal(null);
  }
  function toggle(a) {
    const err = a.disabled ? null : SA.checkChange(accounts, me.id, a.id, {
      kind: "disable"
    });
    if (err) {
      setMsg({
        ok: false,
        text: err
      });
      return;
    }
    apply(accounts.map(x => x.id === a.id ? {
      ...x,
      disabled: !a.disabled
    } : x), (a.disabled ? "Turned on" : "Turned off") + " the account “" + a.username + "”");
  }
  function remove(a) {
    const err = SA.checkChange(accounts, me.id, a.id, {
      kind: "delete"
    });
    if (err) {
      setMsg({
        ok: false,
        text: err
      });
      return;
    }
    if (!confirm("Delete the account “" + a.username + "” (" + a.name + ")? They will no longer be able to sign in. This cannot be undone.")) return;
    apply(accounts.filter(x => x.id !== a.id), "Deleted the account “" + a.username + "”");
  }
  const note = "rounded-xl px-4 py-3 text-sm border";
  const link = "text-blue-800 hover:underline";
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, SA.managerCount(accounts) <= 1 && /*#__PURE__*/React.createElement("div", {
    role: "note",
    className: note + " bg-amber-50 border-amber-200 text-amber-900"
  }, "Only one account can manage accounts. If its password is forgotten, nobody can reset it. Add a second Administrator or IT staff account."), unlinked.length > 0 && /*#__PURE__*/React.createElement("div", {
    role: "note",
    className: note + " bg-amber-50 border-amber-200 text-amber-900"
  }, countOf(unlinked.length, "teacher account"), " ", unlinked.length === 1 ? "is" : "are", " not linked to anyone in the Faculty list (", unlinked.map(a => a.username).join(", "), ").", " ", unlinked.length === 1 ? "That person sees" : "They see", " no schedule until you edit the account and choose the teacher."), msg && /*#__PURE__*/React.createElement("div", {
    role: msg.ok ? "status" : "alert",
    className: note + (msg.ok ? " bg-emerald-50 border-emerald-100 text-emerald-800" : " bg-rose-50 border-rose-100 text-rose-800")
  }, msg.text), /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-2xl shadow-sm border border-slate-100"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between flex-wrap gap-3 px-5 sm:px-6 py-4 border-b border-slate-100"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    className: "font-semibold text-slate-900"
  }, "Accounts (", accounts.length, ")"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-500 mt-0.5"
  }, "Everyone who can sign in. The role decides which pages they see.")), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setMsg(null);
      setModal({
        kind: "add"
      });
    },
    className: "flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium px-3.5 py-2 rounded-lg"
  }, /*#__PURE__*/React.createElement(IconPlus, {
    size: 15
  }), " Add account")), /*#__PURE__*/React.createElement("div", {
    className: "overflow-x-auto"
  }, /*#__PURE__*/React.createElement("table", {
    className: "w-full text-sm"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
    className: "text-left text-xs text-slate-500 border-b border-slate-100"
  }, /*#__PURE__*/React.createElement("th", {
    className: "px-5 sm:px-6 py-3 font-medium"
  }, "Name"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-3 font-medium"
  }, "Username"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-3 font-medium"
  }, "Role"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-3 font-medium"
  }, "Teacher"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-3 font-medium"
  }, "Status"), /*#__PURE__*/React.createElement("th", {
    className: "px-5 sm:px-6 py-3 font-medium text-right"
  }, "Actions"))), /*#__PURE__*/React.createElement("tbody", null, sorted.map(a => {
    const self = a.id === me.id,
      teacher = a.role === "faculty" ? SA.linkedFaculty(a, faculty) : null;
    return /*#__PURE__*/React.createElement("tr", {
      key: a.id,
      className: "border-b border-slate-50 last:border-0"
    }, /*#__PURE__*/React.createElement("td", {
      className: "px-5 sm:px-6 py-3 text-slate-900 font-medium"
    }, a.name, self && /*#__PURE__*/React.createElement("span", {
      className: "ml-1.5 text-[11px] font-normal text-slate-400"
    }, "(you)")), /*#__PURE__*/React.createElement("td", {
      className: "px-3 py-3 font-mono text-xs text-slate-600"
    }, a.username), /*#__PURE__*/React.createElement("td", {
      className: "px-3 py-3 text-slate-600"
    }, roleLabelOf(a.role)), /*#__PURE__*/React.createElement("td", {
      className: "px-3 py-3"
    }, a.role !== "faculty" ? /*#__PURE__*/React.createElement("span", {
      className: "text-slate-300"
    }, "\u2014") : teacher ? /*#__PURE__*/React.createElement("span", {
      className: "text-slate-600"
    }, teacher.name) : /*#__PURE__*/React.createElement("span", {
      className: "text-rose-700"
    }, "Not linked", a.facultyName && /*#__PURE__*/React.createElement("span", {
      className: "block text-[11px] text-slate-400"
    }, "was ", a.facultyName))), /*#__PURE__*/React.createElement("td", {
      className: "px-3 py-3"
    }, /*#__PURE__*/React.createElement("span", {
      className: "inline-block text-xs font-medium px-2 py-1 rounded-full " + (a.disabled ? "bg-slate-100 text-slate-500" : a.mustChangePassword ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-700")
    }, a.disabled ? "Turned off" : a.mustChangePassword ? "Must choose a password" : "Active")), /*#__PURE__*/React.createElement("td", {
      className: "px-5 sm:px-6 py-3 text-xs font-medium"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex flex-wrap justify-end gap-x-3 gap-y-1"
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => {
        setMsg(null);
        setModal({
          kind: "edit",
          account: a
        });
      },
      className: link
    }, "Edit"), !self && /*#__PURE__*/React.createElement("button", {
      onClick: () => {
        setMsg(null);
        setModal({
          kind: "reset",
          account: a
        });
      },
      className: link
    }, "Reset password"), !self && /*#__PURE__*/React.createElement("button", {
      onClick: () => toggle(a),
      className: link
    }, a.disabled ? "Turn on" : "Turn off"), !self && /*#__PURE__*/React.createElement("button", {
      onClick: () => remove(a),
      className: "text-rose-700 hover:underline"
    }, "Delete"))));
  })))), /*#__PURE__*/React.createElement("p", {
    className: "px-5 sm:px-6 py-4 text-xs text-slate-500 border-t border-slate-100 leading-relaxed"
  }, "Passwords are never stored, only a scrambled form of them (PBKDF2). Accounts are kept in this browser, apart from the school's data: Reset Demo Data, uploading a school's workbook and restoring a backup do not change them. To change your own password, open Settings.")), modal && modal.kind === "add" && /*#__PURE__*/React.createElement(AccountModal, {
    accounts: accounts,
    me: me,
    faculty: faculty,
    onClose: () => setModal(null),
    onSave: (account, text) => apply([...accounts, account], text)
  }), modal && modal.kind === "edit" && /*#__PURE__*/React.createElement(AccountModal, {
    initial: modal.account,
    accounts: accounts,
    me: me,
    faculty: faculty,
    onClose: () => setModal(null),
    onSave: (account, text) => apply(accounts.map(x => x.id === account.id ? account : x), text)
  }), modal && modal.kind === "reset" && /*#__PURE__*/React.createElement(ResetPasswordModal, {
    account: modal.account,
    onClose: () => setModal(null),
    onSave: (account, text) => apply(accounts.map(x => x.id === account.id ? account : x), text)
  }));
}

// YourAccountCard (Settings, every role): who is signed in, and changing one's own password.
function YourAccountCard({
  me,
  onChangePassword
}) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    const err = (!current ? "Enter your current password." : "") || SA.checkPassword(next, me.username) || (next !== confirm ? "The two new passwords do not match." : "") || (next === current ? "The new password must be different from the current one." : "");
    if (err) {
      setMsg({
        ok: false,
        text: err
      });
      return;
    }
    setBusy(true);
    setMsg(null);
    if (!(await SA.verifyPassword(me, current))) {
      setBusy(false);
      setMsg({
        ok: false,
        text: "Your current password is not right."
      });
      return;
    }
    const updated = await SA.withNewPassword(me, next, false);
    setBusy(false);
    onChangePassword(updated);
    setCurrent("");
    setNext("");
    setConfirm("");
    setMsg({
      ok: true,
      text: "Your password has been changed."
    });
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-2xl p-5 sm:p-8 shadow-sm border border-slate-100"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "font-semibold text-slate-900"
  }, "Your account"), /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-slate-500 mt-1"
  }, me.name, " \xB7 ", /*#__PURE__*/React.createElement("span", {
    className: "font-mono text-xs"
  }, me.username), " \xB7 ", roleLabelOf(me.role)), /*#__PURE__*/React.createElement("form", {
    onSubmit: submit,
    noValidate: true,
    className: "mt-4 grid grid-cols-1 sm:grid-cols-3 gap-x-3"
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Current password"
  }, /*#__PURE__*/React.createElement("input", {
    className: inputCls,
    type: "password",
    value: current,
    onChange: e => setCurrent(e.target.value),
    autoComplete: "current-password"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "New password"
  }, /*#__PURE__*/React.createElement("input", {
    className: inputCls,
    type: "password",
    value: next,
    onChange: e => setNext(e.target.value),
    autoComplete: "new-password"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "New password again"
  }, /*#__PURE__*/React.createElement("input", {
    className: inputCls,
    type: "password",
    value: confirm,
    onChange: e => setConfirm(e.target.value),
    autoComplete: "new-password"
  })), /*#__PURE__*/React.createElement("div", {
    className: "sm:col-span-3"
  }, msg && /*#__PURE__*/React.createElement("div", {
    role: msg.ok ? "status" : "alert",
    className: "text-sm rounded-lg px-3 py-2 mb-2 " + (msg.ok ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800")
  }, msg.text), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    disabled: busy,
    className: "bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-60"
  }, busy ? "Saving…" : "Change password"))));
}

// GlobalSearch: the search box in the top bar. As the user types it lists matching
// faculty (open their profile), subjects (open the subject) and rooms (open the room),
// up to 5 of each. Arrow keys move through the results, Enter opens one, Esc clears.
// A Faculty Member only searches their OWN classes, and a result opens their schedule.
function GlobalSearch({
  role,
  faculty,
  sections,
  rooms,
  result,
  myFacultyId,
  onOpenFaculty,
  onOpenSection,
  onOpenRoom,
  onOpenMySchedule
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listId = React.useId();
  const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const hit = (...texts) => {
    const t = texts.join(" ").toLowerCase();
    return words.every(w => t.includes(w));
  };
  let groups = [];
  if (words.length) {
    if (role === "faculty") {
      const mine = result ? sections.filter((s, i) => result.genes[i] && result.genes[i].facultyId === myFacultyId) : [];
      groups = [{
        title: "My classes",
        items: mine.filter(s => hit(s.subjectCode, s.subjectName, s.sectionName)).slice(0, 8).map(s => ({
          key: "s" + s.id,
          label: s.subjectCode + " · " + (s.subjectName || ""),
          sub: s.sectionName,
          go: () => onOpenMySchedule()
        }))
      }];
    } else {
      groups = [{
        title: "Faculty",
        items: faculty.filter(f => hit(f.name, f.specializations.join(" "))).slice(0, 5).map(f => ({
          key: "f" + f.id,
          label: f.name,
          sub: f.specializations.join(", "),
          go: () => onOpenFaculty(f)
        }))
      }, {
        title: "Subjects",
        items: sections.filter(s => hit(s.subjectCode, s.subjectName, s.sectionName, s.program)).slice(0, 5).map(s => ({
          key: "s" + s.id,
          label: s.subjectCode + " · " + (s.subjectName || ""),
          sub: s.sectionName,
          go: () => onOpenSection(s)
        }))
      }, {
        title: "Rooms",
        items: rooms.filter(r => hit(r.name)).slice(0, 5).map(r => ({
          key: "r" + r.id,
          label: r.name,
          sub: r.capacity + " seats",
          go: () => onOpenRoom(r)
        }))
      }];
    }
    groups = groups.filter(g => g.items.length);
  }
  const flat = groups.flatMap(g => g.items);
  const choose = item => {
    item.go();
    setQ("");
    setOpen(false);
  };
  function onKeyDown(e) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive(a => Math.min(a + 1, flat.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive(a => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && flat[active]) {
      e.preventDefault();
      choose(flat[active]);
    } else if (e.key === "Escape") {
      setQ("");
      setOpen(false);
    }
  }
  const showList = open && words.length > 0;
  let n = -1;
  return /*#__PURE__*/React.createElement("div", {
    className: "flex-1 relative max-w-xl min-w-0"
  }, /*#__PURE__*/React.createElement(IconSearch, {
    size: 16,
    className: "absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
  }), /*#__PURE__*/React.createElement("input", {
    value: q,
    placeholder: role === "faculty" ? "Search my classes..." : "Search faculty, subjects, rooms...",
    role: "combobox",
    "aria-expanded": showList,
    "aria-controls": listId,
    "aria-autocomplete": "list",
    "aria-label": "Search",
    "aria-activedescendant": showList && flat[active] ? listId + "-" + active : undefined,
    onChange: e => {
      setQ(e.target.value);
      setOpen(true);
      setActive(0);
    },
    onFocus: () => setOpen(true),
    onBlur: () => setTimeout(() => setOpen(false), 150),
    onKeyDown: onKeyDown,
    className: "w-full pl-10 pr-4 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
  }), showList && /*#__PURE__*/React.createElement("div", {
    id: listId,
    role: "listbox",
    className: "absolute left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-slate-100 z-50 max-h-96 overflow-y-auto py-1"
  }, flat.length === 0 && /*#__PURE__*/React.createElement("div", {
    className: "px-4 py-3 text-sm text-slate-500"
  }, "No matches for \"", q.trim(), "\"."), groups.map(g => /*#__PURE__*/React.createElement("div", {
    key: g.title,
    role: "group",
    "aria-label": g.title
  }, /*#__PURE__*/React.createElement("div", {
    className: "px-4 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400"
  }, g.title), g.items.map(item => {
    n++;
    const i = n;
    return /*#__PURE__*/React.createElement("div", {
      key: item.key,
      id: listId + "-" + i,
      role: "option",
      "aria-selected": i === active,
      onMouseDown: e => {
        e.preventDefault();
        choose(item);
      },
      onMouseEnter: () => setActive(i),
      className: "px-4 py-2 cursor-pointer " + (i === active ? "bg-amber-50" : "")
    }, /*#__PURE__*/React.createElement("div", {
      className: "text-sm text-slate-900 truncate"
    }, item.label), item.sub && /*#__PURE__*/React.createElement("div", {
      className: "text-xs text-slate-500 truncate"
    }, item.sub));
  })))));
}

// Toast: a short message at the bottom of the screen that tells the user what just
// happened and what comes next (for example after submitting a request). It closes by
// itself after 8 seconds or with its close button; screen readers announce it.
function Toast({
  message,
  onClose
}) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onClose, 8000);
    return () => clearTimeout(t);
  }, [message]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!message) return null;
  return /*#__PURE__*/React.createElement("div", {
    role: "status",
    "aria-live": "polite",
    className: "no-print fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md bg-[#0b1d4a] text-white text-sm rounded-xl shadow-lg px-4 py-3 flex items-start gap-3"
  }, /*#__PURE__*/React.createElement(IconCheckCircle, {
    size: 18,
    className: "text-amber-400 shrink-0 mt-0.5"
  }), /*#__PURE__*/React.createElement("div", {
    className: "flex-1"
  }, message), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    "aria-label": "Close message",
    className: "text-slate-300 hover:text-white shrink-0"
  }, /*#__PURE__*/React.createElement(IconX, {
    size: 16
  })));
}

// NotificationPanel: the drop-down list under the bell icon.
// Clicking one marks it read; "Mark all read" clears the badge.
function NotificationPanel({
  notifications,
  onMarkRead,
  onMarkAllRead,
  onClose
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "absolute right-0 top-11 w-80 bg-white rounded-xl shadow-xl border border-slate-100 z-50 max-h-96 overflow-y-auto"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between px-4 py-3 border-b border-slate-100"
  }, /*#__PURE__*/React.createElement("span", {
    className: "font-semibold text-sm text-slate-900"
  }, "Notifications"), /*#__PURE__*/React.createElement("button", {
    onClick: onMarkAllRead,
    className: "text-xs text-blue-800 hover:underline"
  }, "Mark all read")), notifications.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "px-4 py-8 text-center text-sm text-slate-400"
  }, "No notifications yet.") : /*#__PURE__*/React.createElement("div", {
    className: "divide-y divide-slate-50"
  }, notifications.map(n => /*#__PURE__*/React.createElement("div", {
    key: n.id,
    onClick: () => onMarkRead(n.id),
    className: "px-4 py-3 text-sm cursor-pointer hover:bg-slate-50 " + (n.read ? "opacity-60" : "")
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-start gap-2"
  }, !n.read && /*#__PURE__*/React.createElement("span", {
    className: "mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "text-slate-800"
  }, n.message), /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-slate-400 mt-0.5"
  }, new Date(n.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  }))))))));
}

/* ---------------------------------------------------------------------
   8. CHARTS & CARDS
   Charts are drawn by hand as SVG (no chart library needed).
   --------------------------------------------------------------------- */

// StatCard: a small box with a label and a big number.
function StatCard({
  label,
  value,
  sub,
  color
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-2xl p-5 shadow-sm border border-slate-100"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-slate-400 text-xs font-medium mb-1"
  }, label), /*#__PURE__*/React.createElement("div", {
    className: "text-2xl font-bold",
    style: {
      color: color || "#0f172a"
    }
  }, value), sub && /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-slate-400 mt-1"
  }, sub));
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
  if (min === max) {
    const pad = Math.abs(min) * 0.1 || 1;
    min -= pad;
    max += pad;
  }
  const rough = (max - min) / Math.max(1, count);
  const mag = Math.pow(10, Math.floor(Math.log10(rough)));
  const step = [1, 2, 2.5, 5, 10].map(m => m * mag).find(st => st >= rough);
  const start = Math.floor(min / step) * step,
    end = Math.ceil(max / step) * step;
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
  if (compact) return sign + a.toLocaleString("en-US", {
    maximumFractionDigits: 2
  }); // axis ticks such as 4.75
  const r = Math.round(a * 10) / 10;
  return sign + (Number.isInteger(r) ? r.toLocaleString("en-US") : r.toLocaleString("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }));
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
    if (typeof ResizeObserver === "undefined") {
      // (fallback is a constant, so it is safe in the deps below)      // very old browsers: fall back to window resize
      window.addEventListener("resize", update);
      return () => window.removeEventListener("resize", update);
    }
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [fallback]);
  return [ref, width];
}
function ConvergenceChart({
  convergence,
  height
}) {
  const [boxRef, boxWidth] = useElementWidth(640);
  if (!convergence || convergence.length === 0) return null;
  const W = Math.max(280, boxWidth),
    H = height || 150; // compact: 150 px tall by default
  const L = 44,
    R = 46,
    T = 8,
    B = 22; // margins for the axis numbers
  const n = convergence.length;
  const best = convergence.map(c => c.best),
    avg = convergence.map(c => c.avg);
  const bT = niceTicks(Math.min(...best), Math.max(...best), 3);
  const aT = niceTicks(Math.min(...avg), Math.max(...avg), 3);
  const bMin = bT[0],
    bMax = bT[bT.length - 1],
    aMin = aT[0],
    aMax = aT[aT.length - 1];
  const plotW = W - L - R,
    plotH = H - T - B;
  // generation index -> x pixel; score -> y pixel on its own scale (SVG y grows downward).
  const x = i => L + (n === 1 ? plotW / 2 : i / (n - 1) * plotW);
  const yB = v => T + (1 - (v - bMin) / (bMax - bMin)) * plotH;
  const yA = v => T + (1 - (v - aMin) / (aMax - aMin)) * plotH;
  const path = (vals, y) => vals.map((v, i) => (i === 0 ? "M" : "L") + x(i).toFixed(1) + "," + y(v).toFixed(1)).join(" ");
  // Generation ticks: whole numbers only, never past the last generation (fewer on narrow screens).
  const gT = niceTicks(0, Math.max(1, n - 1), W < 420 ? 3 : 5).filter(g => Number.isInteger(g) && g <= n - 1);
  // Colours: gold line (3.6:1 on white; lines need 3:1), deeper gold for gold TEXT (4.9:1; text needs 4.5:1).
  const GOLD = "#b7791f",
    GOLD_TEXT = "#a16207",
    BLUE = "#2563eb",
    INK = "#475569";
  return /*#__PURE__*/React.createElement("div", {
    ref: boxRef,
    className: "w-full"
  }, /*#__PURE__*/React.createElement("svg", {
    width: W,
    height: H,
    viewBox: "0 0 " + W + " " + H,
    role: "img",
    className: "block",
    "aria-label": "Line chart of best and average fitness over " + n + " generations"
  }, bT.map(t => /*#__PURE__*/React.createElement("line", {
    key: "g" + t,
    x1: L,
    x2: W - R,
    y1: yB(t),
    y2: yB(t),
    stroke: "#eef2f7",
    strokeWidth: "1"
  })), bT.map(t => /*#__PURE__*/React.createElement("text", {
    key: "b" + t,
    x: L - 6,
    y: yB(t) + 4,
    textAnchor: "end",
    fontSize: "11",
    fill: GOLD_TEXT
  }, fmtScore(t, true))), aT.map(t => /*#__PURE__*/React.createElement("text", {
    key: "a" + t,
    x: W - R + 6,
    y: yA(t) + 4,
    textAnchor: "start",
    fontSize: "11",
    fill: BLUE
  }, fmtScore(t, true))), /*#__PURE__*/React.createElement("line", {
    x1: L,
    x2: W - R,
    y1: T + plotH,
    y2: T + plotH,
    stroke: "#cbd5e1"
  }), gT.map(g => /*#__PURE__*/React.createElement("g", {
    key: "x" + g
  }, /*#__PURE__*/React.createElement("line", {
    x1: x(g),
    x2: x(g),
    y1: T + plotH,
    y2: T + plotH + 4,
    stroke: "#cbd5e1"
  }), /*#__PURE__*/React.createElement("text", {
    x: x(g),
    y: T + plotH + 16,
    textAnchor: "middle",
    fontSize: "11",
    fill: INK
  }, g))), /*#__PURE__*/React.createElement("path", {
    d: path(avg, yA),
    fill: "none",
    stroke: BLUE,
    strokeWidth: "1.75",
    opacity: "0.85"
  }), /*#__PURE__*/React.createElement("path", {
    d: path(best, yB),
    fill: "none",
    stroke: GOLD,
    strokeWidth: "2.5"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: x(0),
    cy: yB(best[0]),
    r: "3",
    fill: GOLD
  }), /*#__PURE__*/React.createElement("circle", {
    cx: x(n - 1),
    cy: yB(best[n - 1]),
    r: "3",
    fill: GOLD
  })));
}

// ChartLegend: the small key shown in the chart card's header.
function ChartLegend() {
  return /*#__PURE__*/React.createElement("span", {
    className: "flex flex-wrap items-center gap-3 text-xs text-slate-600"
  }, /*#__PURE__*/React.createElement("span", {
    className: "flex items-center gap-1.5"
  }, /*#__PURE__*/React.createElement("span", {
    className: "inline-block w-5 h-[3px] rounded",
    style: {
      background: "#b7791f"
    }
  }), "Best schedule (left scale)"), /*#__PURE__*/React.createElement("span", {
    className: "flex items-center gap-1.5"
  }, /*#__PURE__*/React.createElement("span", {
    className: "inline-block w-5 h-[2px] rounded",
    style: {
      background: "#2563eb"
    }
  }), "Average of all candidates (right scale)"), /*#__PURE__*/React.createElement("span", {
    className: "text-slate-500"
  }, "Bottom: generation"));
}

// ConvergenceCaption: a one-line summary of the run, plus a "How to read this
// chart" toggle with the full explanation (kept closed to save space).
function ConvergenceCaption({
  result
}) {
  const [open, setOpen] = useState(false);
  const c = result.convergence || [];
  if (c.length === 0) return null;
  const maxGen = result.settings && result.settings.generations;
  const f = c[0],
    l = c[c.length - 1];
  return /*#__PURE__*/React.createElement("div", {
    className: "mt-2 text-xs text-slate-600 space-y-1.5"
  }, /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("span", {
    className: "font-semibold text-slate-800"
  }, "Best:"), " ", fmtScore(f.best), " \u2192 ", fmtScore(l.best), /*#__PURE__*/React.createElement("span", {
    className: "text-slate-400"
  }, " \xB7 "), /*#__PURE__*/React.createElement("span", {
    className: "font-semibold text-slate-800"
  }, "Average:"), " ", fmtScore(f.avg), " \u2192 ", fmtScore(l.avg), /*#__PURE__*/React.createElement("span", {
    className: "text-slate-400"
  }, " \xB7 "), maxGen && c.length < maxGen ? "Stopped early at generation " + l.generation + " of " + maxGen + ", because the best score had stopped improving." : "Ran " + c.length + " generation" + (c.length === 1 ? "" : "s") + (maxGen ? " (the maximum)" : "") + ".", " ", /*#__PURE__*/React.createElement("button", {
    onClick: () => setOpen(v => !v),
    "aria-expanded": open,
    className: "text-blue-800 hover:underline font-medium"
  }, open ? "Hide explanation" : "How to read this chart")), open && /*#__PURE__*/React.createElement("p", null, "The AI scores every candidate schedule; ", /*#__PURE__*/React.createElement("span", {
    className: "font-semibold"
  }, "higher is better"), ". Each broken rule (for example a double-booked teacher) costs 1,000 points, so scores far below 0 mean conflicts. The gold line is the best schedule in each generation. The blue line is the average of all candidates, which starts low and rises as the AI learns. The two lines use ", /*#__PURE__*/React.createElement("span", {
    className: "font-semibold"
  }, "different scales"), " (left and right)."), result.kind === "update" && /*#__PURE__*/React.createElement("p", {
    className: "text-slate-500"
  }, "This was an update: only the ", result.updateSummary ? result.updateSummary.moved : "", " moved class(es) were re-optimized; every other class was locked."));
}

// BarChart: simple vertical bars. `data` is [{ label, value }].
// Bars are scaled so the tallest value fills the chart height.
function BarChart({
  data,
  colorFn,
  maxOverride
}) {
  const w = 600,
    h = 220,
    pad = 36;
  const maxV = maxOverride || Math.max(...data.map(d => d.value), 1);
  const bw = (w - 2 * pad) / data.length;
  return /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 " + w + " " + h,
    className: "w-full h-56"
  }, /*#__PURE__*/React.createElement("line", {
    x1: pad,
    y1: h - pad,
    x2: w - pad,
    y2: h - pad,
    stroke: "#e2e8f0"
  }), data.map((d, i) => {
    const barH = d.value / maxV * (h - 2 * pad - 10);
    const x = pad + i * bw + bw * 0.15;
    const bw2 = bw * 0.7;
    return /*#__PURE__*/React.createElement("g", {
      key: i
    }, /*#__PURE__*/React.createElement("rect", {
      x: x,
      y: h - pad - barH,
      width: bw2,
      height: barH,
      rx: "3",
      fill: colorFn ? colorFn(d) : "#1e3a8a"
    }), /*#__PURE__*/React.createElement("text", {
      x: x + bw2 / 2,
      y: h - pad + 14,
      fontSize: "9",
      fill: "#64748b",
      textAnchor: "middle"
    }, d.label), /*#__PURE__*/React.createElement("text", {
      x: x + bw2 / 2,
      y: h - pad - barH - 4,
      fontSize: "9",
      fill: "#0f172a",
      textAnchor: "middle",
      fontWeight: "600"
    }, d.value));
  }));
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
  const [timeSlots] = useState(init.timeSlots); // Mon–Sat × 6 periods (from normalizeData)
  const [storedResult, setResult] = useState(init.result); // the CURRENT schedule (output of the GA), or null
  // `result` is what every page reads. Its conflict counts are recalculated from the
  // CURRENT teachers, rooms and subjects, so editing any of them (a maximum, a
  // specialization, a room's type or size...) updates the "Conflict-free" label and
  // the Conflicts page straight away instead of only after the next generate/edit.
  // The check is skipped if the schedule and subject list are out of step (the saved
  // counts are kept), because the rule checker reads sections[i] for every gene.
  const result = useMemo(() => {
    if (!storedResult || !storedResult.genes || storedResult.genes.length !== sections.length) return storedResult;
    const violations = E.countViolations(faculty, rooms, sections, timeSlots, storedResult.genes);
    return {
      ...storedResult,
      violations,
      feasible: violations.total === 0
    };
  }, [storedResult, faculty, rooms, sections, timeSlots]);
  // ---- Sign-in (accounts.js) ----
  // Accounts are kept under their own key, apart from the data above, so resets, uploads
  // and backups never touch them. Who is signed in is kept for this tab only: closing
  // the browser signs the person out, reloading the page does not.
  const [accounts, setAccounts] = useState(() => SA.loadAccounts());
  const [sessionId, setSessionId] = useState(() => SA.loadSession());
  const me = accounts.find(a => a.id === sessionId && !a.disabled) || null; // the signed-in account
  const role = me ? me.role : null; // which role is signed in (null: nobody)
  const [page, setPage] = useState("dashboard"); // which page is on screen

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
  const [csvImportKind, setCsvImportKind] = useState(null);
  const [datasetKind, setDatasetKind] = useState(init.datasetKind || "standard"); // "standard" / "expanded" sample, or "school" (uploaded)
  const [datasetInfo, setDatasetInfo] = useState(init.datasetInfo || null); // { fileName, uploadedAt } of the uploaded school data
  const [testLog, setTestLog] = useState([]); // results of test-conflict buttons
  const [toast, setToast] = useState(null); // short "what happens next" message (see Toast)
  const [activityLog, setActivityLog] = useState(init.activityLog || []); // imports, exports, uploads and account changes (IT overview)
  const [chairDept, setChairDept] = useState(init.chairDept || "All"); // department filter (Chair overview)
  const [leaveRequestLockedTo, setLeaveRequestLockedTo] = useState(null); // faculty id a request form is locked to

  // Save everything to the browser whenever any of these values change.

  useEffect(() => {
    saveState({
      faculty,
      rooms,
      sections,
      timeSlots,
      result,
      leaveRequests,
      curriculumAware,
      notifications,
      scheduleHistory,
      activityLog,
      chairDept,
      datasetKind,
      datasetInfo
    });
  }, [faculty, rooms, sections, timeSlots, result, leaveRequests, curriculumAware, notifications, scheduleHistory, activityLog, chairDept, datasetKind, datasetInfo]);

  // Saves a changed account list. Other open tabs pick it up through the "storage" event below.
  function updateAccounts(next) {
    setAccounts(next);
    if (!SA.saveAccounts(next)) setToast("The accounts could not be saved in this browser (its storage is blocked or full).");
  }
  useEffect(() => {
    function onStorage(e) {
      if (e.key === null || e.key === SA.ACCOUNTS_KEY) setAccounts(SA.loadAccounts());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  function signIn(account) {
    SA.saveSession(account.id);
    setSessionId(account.id);
    setPage("dashboard");
  }
  function signOut() {
    SA.saveSession(null);
    setSessionId(null);
    setSidebarOpen(false);
  }

  // Adds an entry to the activity log: imports, exports, uploads and account changes (newest first, max 30 kept).
  function logActivity(kind, detail) {
    setActivityLog(prev => [{
      id: Date.now() + Math.random(),
      kind,
      detail,
      timestamp: new Date().toISOString()
    }, ...prev].slice(0, 30));
  }

  // Listen for the "schedwise:export" event fired by downloadCSV(), so every
  // CSV export from any page is recorded — without each page needing extra code.
  // The returned function removes the listener if App is ever unmounted.
  useEffect(() => {
    function onExport(e) {
      logActivity("Export", e.detail.filename + " (" + e.detail.rows + " rows)");
    }
    window.addEventListener("schedwise:export", onExport);
    return () => window.removeEventListener("schedwise:export", onExport);
  }, []);

  // Sidebar items this role may see (RBAC). If the role changes and the current
  // page isn't allowed anymore, jump to the first allowed page.
  const visibleNav = NAV_ITEMS.filter(n => n.roles.includes(role));
  // Runs ONLY when the role changes (on purpose), so it can't fight normal navigation.
  // Settings lives in the Account menu, not NAV_ITEMS, and every role may open it.
  useEffect(() => {
    if (!role) return; // nobody signed in: the sign-in screen is showing
    if (page !== "settings" && !visibleNav.find(n => n.key === page)) setPage(visibleNav[0].key);
  }, [role]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep the matching history entry in sync with the live schedule, so approvals and
  // manual edits are preserved when a version is restored later.
  useEffect(() => {
    if (storedResult && storedResult.id) {
      setScheduleHistory(prev => prev.map(h => h.id === storedResult.id ? storedResult : h));
    }
  }, [storedResult]);

  // Adds a new unread notification to the top of the bell list.
  // Math.random() is added to the id so two notifications in the same
  // millisecond still get unique ids.
  function pushNotification(message) {
    // Newest first; the oldest are dropped after 100, so a long session cannot fill the browser's storage.
    setNotifications(prev => [{
      id: Date.now() + Math.random(),
      message,
      timestamp: new Date().toISOString(),
      read: false
    }, ...prev].slice(0, 100));
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
      const settings = {
        generations: 140,
        popSize: 50,
        curriculumAware
      };
      const t0 = performance.now();
      const r = E.runGA(faculty, rooms, sections, timeSlots, settings);
      const elapsedMs = Math.round(performance.now() - t0);
      const stamped = {
        ...r,
        id: Date.now(),
        generatedAt: new Date().toISOString(),
        approvalStatus: "Pending Review",
        approvalComment: "",
        elapsedMs,
        settings: {
          generations: settings.generations,
          popSize: settings.popSize
        },
        kind: "full"
      };
      setResult(stamped);
      setScheduleHistory(prev => [stamped, ...prev].slice(0, 20));
      setGenerating(false);
      setPage("schedules");
      const overloaded = faculty.filter(f => assignedUnits(f, sections, stamped) > f.maxUnits).length;
      pushNotification((stamped.feasible ? "New schedule generated — no rule conflicts, awaiting approval." : "New schedule generated with " + stamped.violations.total + " unresolved conflict(s).") + (overloaded ? " " + overloaded + " teacher(s) are over their maximum units." : ""));
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
      const r = E.repairSchedule(faculty, rooms, sections, timeSlots, result.genes, {
        curriculumAware,
        generations: 100,
        popSize: 40
      });
      const elapsedMs = Math.round(performance.now() - t0);
      const triggers = result.needsRegeneration && result.needsRegeneration.triggers || [];
      const honoured = triggers.filter(t => t.kind === "blocked").map(t => {
        const fac = faculty.find(f => f.id === t.facultyId);
        const clashes = r.genes.filter(g => g.facultyId === t.facultyId && t.slotIds.includes(g.slotId)).length;
        // Of this teacher's classes that moved, how many landed in the "Prefer instead" times?
        const pref = t.preferredSlotIds || [];
        const movedHere = r.changes.filter(c => r.genes[c.index].facultyId === t.facultyId);
        const inPref = movedHere.filter(c => pref.includes(r.genes[c.index].slotId)).length;
        return {
          name: fac ? fac.name : "Faculty",
          slots: describeSlots(t.slotIds, slotById),
          clashes,
          prefSlots: pref.length ? describeSlots(pref, slotById) : "",
          moved: movedHere.length,
          inPref
        };
      });
      setGenerating(false);
      if (r.changes.length === 0) {
        // Nothing had to move (e.g. a leave ended): keep this version, just clear the flag.
        // Keep r.genes: it has one entry per subject, including a new subject that could not be
        // placed. (The old genes would be shorter than the subject list, which stops the live count.)
        setResult({
          ...result,
          genes: r.genes,
          violations: r.violations,
          feasible: r.feasible,
          needsRegeneration: null
        });
        pushNotification("Schedule checked — no classes needed to move.");
        return;
      }
      const stamped = {
        ...r,
        id: Date.now(),
        generatedAt: new Date().toISOString(),
        approvalStatus: "Pending Review",
        approvalComment: "",
        elapsedMs,
        settings: {
          generations: 100,
          popSize: 40
        },
        kind: "update",
        updateSummary: {
          changes: r.changes,
          moved: r.changes.length,
          unchanged: r.genes.length - r.changes.length,
          shifted: r.shiftedToMakeRoom || 0,
          honoured,
          reasons: triggers.map(t => t.reason)
        }
      };
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
    const padded = result.genes.concat(next.slice(result.genes.length).map(() => ({
      facultyId: -1,
      roomId: -1,
      slotId: -1,
      isNew: true
    })));
    const affected = E.findConflictingIndices(faculty, rooms, next, timeSlots, padded).size;
    if (affected > 0) {
      flagForUpdate(faculty, next, {
        kind: "subject",
        reason: isNew ? "New subject " + sec.subjectCode + " (" + sec.sectionName + ") needs to be placed." : sec.subjectCode + " (" + sec.sectionName + ") changed — " + affected + " class(es) need re-placing."
      });
    }
  }

  // Delete a subject. A schedule stores classes BY POSITION (genes[i] belongs to
  // sections[i]), so the matching gene must be removed too — otherwise every
  // class after it would shift onto the wrong subject.
  function handleDeleteSection(id) {
    const k = sections.findIndex(x => x.id === id);
    if (k < 0) return;
    const s = sections[k];
    if (!confirm("Delete " + s.subjectCode + " (" + s.sectionName + ")?\n\nIts class is also removed from the current schedule and from saved versions. This cannot be undone.")) return;
    const next = sections.filter(x => x.id !== id);
    setSections(next);
    const dropK = res => res && res.genes && res.genes.length > k ? {
      ...res,
      genes: res.genes.filter((_, i) => i !== k),
      updateSummary: null
    } : res;
    if (result) {
      const r2 = dropK(result);
      const violations = E.countViolations(faculty, rooms, next, timeSlots, r2.genes);
      setResult({
        ...r2,
        violations,
        feasible: violations.total === 0
      });
    }
    setScheduleHistory(prev => prev.map(dropK));
  }

  // Delete a teacher or room. Classes that were using it now break a rule, so the
  // schedule is flagged for an update (otherwise it would still read "conflict-free").
  function handleDeleteFaculty(id) {
    const who = faculty.find(x => x.id === id);
    const teaching = result ? result.genes.filter(g => g.facultyId === id).length : 0;
    if (!confirm("Delete " + (who ? who.name : "this teacher") + "?\n\n" + (teaching ? "They teach " + teaching + " class(es) in the current schedule; those classes will need a new teacher (Update affected classes). " : "") + "This cannot be undone.")) return;
    const next = faculty.filter(f => f.id !== id);
    setFaculty(next);
    const used = result ? result.genes.filter(g => g.facultyId === id).length : 0;
    if (used > 0) {
      const f = faculty.find(x => x.id === id);
      flagForUpdate(next, sections, {
        kind: "removed",
        reason: (f ? f.name : "A teacher") + " was removed — " + used + " class(es) need a new teacher."
      });
    }
  }
  function handleDeleteRoom(id) {
    const room = rooms.find(x => x.id === id);
    const inUse = result ? result.genes.filter(g => g.roomId === id).length : 0;
    if (!confirm("Delete " + (room ? room.name : "this room") + "?\n\n" + (inUse ? inUse + " class(es) use it in the current schedule; they will need a new room (Update affected classes). " : "") + "This cannot be undone.")) return;
    const next = rooms.filter(r => r.id !== id);
    setRooms(next);
    const used = result ? result.genes.filter(g => g.roomId === id).length : 0;
    if (used > 0) {
      const r = rooms.find(x => x.id === id);
      flagForUpdate(faculty, sections, {
        kind: "removed",
        reason: (r ? r.name : "A room") + " was removed — " + used + " class(es) need a new room."
      }, next);
    }
  }

  // Manual edit of one class. Arrays in state must not be changed in place,
  // so we copy the genes, change one entry, then re-run the rule checker.
  // Any edit sends the schedule back to "Pending Review".
  function handleEditAssignment(index, newGene) {
    if (!result) return;
    const newGenes = result.genes.slice();
    newGenes[index] = newGene;
    const violations = E.countViolations(faculty, rooms, sections, timeSlots, newGenes);
    setResult({
      ...result,
      genes: newGenes,
      violations,
      feasible: violations.total === 0,
      approvalStatus: "Pending Review"
    });
  }

  // Manual removal of one class: mark it -1 ("unscheduled") and re-check rules.
  function handleDeleteAssignment(index) {
    if (!result) return;
    const newGenes = result.genes.slice();
    newGenes[index] = {
      facultyId: -1,
      roomId: -1,
      slotId: -1
    };
    const violations = E.countViolations(faculty, rooms, sections, timeSlots, newGenes);
    setResult({
      ...result,
      genes: newGenes,
      violations,
      feasible: violations.total === 0,
      approvalStatus: "Pending Review"
    });
  }

  // Approve / Reject the current schedule (Admin & Chair only; the buttons
  // aren't shown to other roles). Also sends a notification.
  function handleApprovalDecision(status, comment) {
    if (!result) return;
    setResult({
      ...result,
      approvalStatus: status,
      approvalComment: comment || ""
    });
    pushNotification("Schedule " + (status === "Approved" ? "approved" : "rejected") + (comment ? " — \"" + comment + "\"" : "") + ".");
  }

  // Make an older saved version the current schedule again.
  function handleRestoreHistory(entry) {
    // Re-check the old version against TODAY's data (e.g. availability may have
    // changed since it was generated), so its conflict count is accurate.
    const violations = E.countViolations(faculty, rooms, sections, timeSlots, entry.genes);
    entry = {
      ...entry,
      violations,
      feasible: violations.total === 0
    };
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
    pushNotification("New " + req.type.toLowerCase() + " from " + (fac ? fac.name : "faculty") + ": " + requestTimesText(req, slotById) + ".");
    // Say what happens next: nothing changes until the request is approved.
    setToast(role === "faculty" ? "Request sent for approval. Your schedule changes only after a department chair or administrator approves it." : "Request saved as Pending. Approve it in Faculty → Leave & Availability; if it clashes with a class, an Update affected classes button then appears there.");
  }

  // After a teacher's availability changes, the current schedule may now put
  // them in a class at a time they can't teach. This re-counts conflicts with
  // the updated teacher list, flags the schedule as needing regeneration, and
  // sends it back to "Pending Review" so it gets looked at again.
  // `trigger` = { kind, reason, facultyId?, slotIds? } describing WHY. Triggers
  // pile up until the next update, so several approvals can be handled at once,
  // and the update can then confirm each blocked-times request was respected.
  function flagForUpdate(nextFaculty, nextSections, trigger, nextRooms) {
    if (!result) return;
    const violations = E.countViolations(nextFaculty, nextRooms || rooms, nextSections, timeSlots, result.genes);
    const prev = result.needsRegeneration;
    const triggers = (prev && prev.triggers || []).concat([trigger]);
    setResult({
      ...result,
      violations,
      feasible: violations.total === 0,
      approvalStatus: "Pending Review",
      needsRegeneration: {
        reason: trigger.reason,
        triggers,
        at: new Date().toISOString()
      }
    });
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
    let addedPreferredSlotIds = [];
    let clashes = 0;
    if (status === "Approved" && fac) {
      const current = fac.unavailableSlotIds || [];
      addedSlotIds = (req.slotIds || []).filter(sid => !current.includes(sid));
      const blockedNow = current.concat(addedSlotIds);
      // "Prefer instead" times are saved on the teacher (minus any time now blocked).
      // The engine places this teacher's moved classes there first.
      const preferredNow = Array.from(new Set((fac.preferredSlotIds || []).concat(req.preferredSlotIds || []))).filter(sid => !blockedNow.includes(sid));
      // Remember which preferred times THIS request added, so undoing it can take back exactly those.
      addedPreferredSlotIds = preferredNow.filter(sid => !(fac.preferredSlotIds || []).includes(sid));
      const updatedFaculty = faculty.map(f => f.id === fac.id ? {
        ...f,
        unavailableSlotIds: blockedNow,
        preferredSlotIds: preferredNow
      } : f);
      setFaculty(updatedFaculty);
      // How many of this teacher's current classes now fall in a blocked slot?
      clashes = result ? result.genes.filter(g => g.facultyId === fac.id && addedSlotIds.includes(g.slotId)).length : 0;
      // Flag the schedule ONLY when a class actually has to move. (Before, it was flagged
      // every time, so "Update affected classes" could run and change nothing.)
      if (clashes > 0) {
        flagForUpdate(updatedFaculty, sections, {
          kind: "blocked",
          facultyId: fac.id,
          slotIds: req.slotIds || [],
          preferredSlotIds: req.preferredSlotIds || [],
          reason: fac.name + "'s availability changed (" + describeSlots(addedSlotIds, slotById) + ") — " + clashes + " current class(es) now clash."
        });
      }
    }
    setLeaveRequests(prev => prev.map(r => r.id === id ? {
      ...r,
      status,
      addedSlotIds,
      addedPreferredSlotIds,
      decidedAt: new Date().toISOString()
    } : r));
    pushNotification(req.type + " for " + (fac ? fac.name : "faculty") + " was " + status.toLowerCase() + (status !== "Approved" ? "." : clashes > 0 ? " — " + clashes + " class(es) must move, so the schedule needs an update." : result ? " — none of their classes are at those times, so the schedule did not need to change." + ((req.preferredSlotIds || []).length ? " Their preferred times are saved and will guide future moves." : "") : "."));
  }

  // End an approved request: a LEAVE that is over, or an AVAILABILITY CHANGE that is undone.
  // Removes ONLY what that request added (its blocked times and the preferred times it
  // saved), so the teacher can be given classes in those times by the next full regenerate.
  // A time that another still-approved request of the same teacher also blocks stays blocked.
  function handleEndRequest(id) {
    const req = leaveRequests.find(r => r.id === id);
    if (!req || req.status !== "Approved") return;
    const isLeave = req.type === "Leave Request";
    const fac = faculty.find(f => f.id === req.facultyId);
    const stillBlocked = new Set();
    leaveRequests.forEach(o => {
      if (o.id !== id && o.facultyId === req.facultyId && o.status === "Approved") (o.slotIds || []).forEach(s => stillBlocked.add(s));
    });
    const remove = (req.addedSlotIds || []).filter(sid => !stillBlocked.has(sid));
    const removePref = req.addedPreferredSlotIds || [];
    // A time kept because another approved request also blocks it now belongs to THAT request,
    // so ending that one later frees it (otherwise it would stay blocked for good).
    const handOver = {};
    (req.addedSlotIds || []).filter(sid => stillBlocked.has(sid)).forEach(sid => {
      const o = leaveRequests.find(x => x.id !== id && x.facultyId === req.facultyId && x.status === "Approved" && (x.slotIds || []).includes(sid));
      if (o) (handOver[o.id] = handOver[o.id] || []).push(sid);
    });
    if (!confirm((isLeave ? "End this leave" : "Undo this availability change") + (fac ? " for " + fac.name : "") + "?\n\n" + (remove.length ? describeSlots(remove, slotById) + " will be available again." : "No times will be freed (another approved request still blocks them).") + "\nThe current schedule is not changed. Use Full Regenerate if you want the AI to use these times again.")) return;
    if (fac) {
      const updatedFaculty = faculty.map(f => f.id === fac.id ? {
        ...f,
        unavailableSlotIds: (f.unavailableSlotIds || []).filter(sid => !remove.includes(sid)),
        preferredSlotIds: (f.preferredSlotIds || []).filter(sid => !removePref.includes(sid))
      } : f);
      setFaculty(updatedFaculty);
      // The schedule is NOT flagged: freeing a time cannot create a conflict, so "Update affected
      // classes" would have nothing to move. A full regenerate is what can use the freed times.
    }
    setLeaveRequests(prev => prev.map(r => r.id === id ? {
      ...r,
      status: "Ended",
      endedAt: new Date().toISOString()
    } : handOver[r.id] ? {
      ...r,
      addedSlotIds: (r.addedSlotIds || []).concat(handOver[r.id])
    } : r));
    pushNotification((isLeave ? "Leave ended for " : "Availability change undone for ") + (fac ? fac.name : "faculty") + (result ? ". The current schedule is unchanged; use Full Regenerate if you want the AI to use the freed times." : "."));
  }

  // Opens the picker. lockedId = the only faculty member the request may be for
  // (used for the Faculty role). Faculty always file from their schedule page.
  function openRequestPicker(lockedId) {
    setLeaveRequestLockedTo(lockedId == null ? null : lockedId);
    setLeaveRequestModal(true);
    if (lockedId != null) {
      setScheduleTab("faculty");
      setPage("schedules");
    }
  }

  // Replace all data with fresh sample data (asks for confirmation first).
  // `kind` = "standard" or "expanded"; the sidebar's Reset keeps whichever sample is loaded,
  // and after an upload (kind "school") it loads the standard sample.
  function resetDemoData(kind) {
    if (!canManageData) return; // Chair and Faculty cannot wipe the data (the button is hidden for them too)
    const k = kind === "expanded" || kind === "standard" ? kind : datasetKind === "expanded" ? "expanded" : "standard";
    const label = k === "expanded" ? "the expanded multi-program sample (about 22 faculty, 48 subjects, 10 labs)" : "the standard sample (9 faculty, 18 subjects, 6 labs)";
    const question = datasetKind === "school" ? "Replace your school's data" + (datasetInfo ? " (uploaded from " + datasetInfo.fileName + ")" : "") + " with " + label + "?\n\n" + "This clears your faculty, subjects, rooms, requests, history and the current schedule, and cannot be undone. " + "If you may need your school's data later, press Cancel and download a backup first (Settings → Backup and restore)." : "Replace all data with " + label + "? This clears faculty, subjects, rooms, requests, history and the current schedule.";
    if (!confirm(question)) return;
    const d = normalizeData(freshData(k));
    setFaculty(d.faculty);
    setRooms(d.rooms);
    setSections(d.sections);
    setResult(null);
    setLeaveRequests([]);
    setScheduleHistory([]);
    setActivityLog([]);
    setDatasetKind(k);
    setDatasetInfo(null);
    setTestLog([]);
    pushNotification("Loaded " + (k === "expanded" ? "the expanded multi-program sample." : "the standard sample."));
  }

  // ---- Set up with your school's data (Settings card; see importer.js and section 4c) ----
  function handleDownloadTemplate() {
    return downloadWorkbook("SchedWiseAI-template.xlsx", SchedImport.templateRows()).then(() => logActivity("Export", "SchedWiseAI-template.xlsx (blank template)"));
  }
  function handleDownloadCurrentData() {
    const name = "SchedWiseAI-data-" + new Date().toISOString().slice(0, 10) + ".xlsx";
    return downloadWorkbook(name, SchedImport.currentDataRows({
      faculty,
      sections,
      rooms
    })).then(() => logActivity("Export", name + " (" + faculty.length + " faculty, " + sections.length + " subjects, " + rooms.length + " rooms)"));
  }
  // Replaces the data with a checked upload, all at once. Like Reset Demo Data it clears the
  // schedule, its saved versions and the requests; notifications, the activity log and the
  // curriculum-aware setting are kept.
  function handleApplySchoolData(data, fileName) {
    if (!canManageData) return;
    const d = normalizeData({
      faculty: data.faculty,
      sections: data.sections,
      rooms: data.rooms
    });
    setFaculty(d.faculty);
    setSections(d.sections);
    setRooms(d.rooms);
    setResult(null);
    setScheduleHistory([]);
    setLeaveRequests([]);
    setTestLog([]);
    setChairDept("All");
    setSelectedFacultyId(null);
    setDatasetKind("school");
    setDatasetInfo({
      fileName,
      uploadedAt: new Date().toISOString()
    });
    const counts = countOf(d.faculty.length, "teacher") + ", " + countOf(d.sections.length, "subject") + ", " + countOf(d.rooms.length, "room");
    pushNotification("Uploaded school data from " + fileName + ": " + counts + ".");
    logActivity("Upload", fileName + " (" + counts + ")");
    goToPage("schedules");
  }

  // Backup: download everything as a .json file (see section 4b above).
  function handleDownloadBackup() {
    const stamp = new Date().toISOString().slice(0, 10);
    downloadJSON("schedwiseai-backup-" + stamp + ".json", makeBackup({
      faculty,
      rooms,
      sections,
      result,
      leaveRequests,
      curriculumAware,
      notifications,
      scheduleHistory,
      activityLog,
      chairDept,
      datasetKind,
      datasetInfo
    }));
    logActivity("Backup", "schedwiseai-backup-" + stamp + ".json (" + faculty.length + " faculty, " + sections.length + " subjects)");
    return {
      ok: true,
      message: "Backup downloaded. Keep the file somewhere safe (for example a USB drive or cloud folder)."
    };
  }
  // Restore: the file is fully checked first; nothing changes unless it is valid AND the user confirms.
  // Replaces the data only. Who is signed in, and as which role, stays as it is.
  function handleRestoreBackup(text, fileName) {
    const p = parseBackup(text);
    if (p.error) return {
      ok: false,
      message: p.error
    };
    const c = p.counts;
    const when = p.exportedAt ? new Date(p.exportedAt).toLocaleString() : "an unknown date";
    if (!confirm("Restore \"" + fileName + "\" (saved " + when + ")?\n\nIt contains " + c.faculty + " faculty, " + c.sections + " subjects, " + c.rooms + " rooms" + (c.hasSchedule ? ", a schedule and " + c.versions + " saved version(s)" : ", and no schedule") + ".\n\nThis REPLACES all current data in this browser and cannot be undone. Download a backup first if you want to keep it.")) {
      return {
        ok: false,
        message: "Restore cancelled. Nothing was changed."
      };
    }
    const n = p.data;
    setFaculty(n.faculty);
    setRooms(n.rooms);
    setSections(n.sections);
    setResult(n.result || null);
    setLeaveRequests(n.leaveRequests);
    setCurriculumAware(!!n.curriculumAware);
    setNotifications(n.notifications);
    setScheduleHistory(n.scheduleHistory);
    setActivityLog(n.activityLog);
    setChairDept(n.chairDept || "All");
    setDatasetKind(n.datasetKind === "expanded" || n.datasetKind === "school" ? n.datasetKind : "standard");
    setDatasetInfo(n.datasetKind === "school" ? n.datasetInfo || null : null);
    setTestLog([]);
    setSelectedFacultyId(null);
    pushNotification("Restored data from backup \"" + fileName + "\".");
    return {
      ok: true,
      message: "Restored " + c.faculty + " faculty, " + c.sections + " subjects and " + c.rooms + " rooms from \"" + fileName + "\"."
    };
  }

  // Testing tools: deliberately add a conflict (or all of them) to the current schedule.
  // The result is recounted, sent back to "Pending Review", and flagged so testers can
  // try "Update affected classes" on it. Each step is logged and notified.
  function handleCreateTestConflict(kind) {
    if (!result) return;
    const kinds = kind === "all" ? TEST_CONFLICT_KINDS.map(k => k[0]) : [kind];
    let data = {
      faculty,
      rooms,
      sections,
      timeSlots,
      genes: result.genes
    };
    const messages = [];
    kinds.forEach(k => {
      const res = makeTestConflict(k, data);
      const label = (TEST_CONFLICT_KINDS.find(x => x[0] === k) || [k, k])[1];
      if (res.error) {
        messages.push({
          ok: false,
          text: label + ": skipped. " + res.error
        });
        return;
      }
      data = {
        ...data,
        genes: res.genes,
        sections: res.sections,
        faculty: res.faculty
      };
      messages.push({
        ok: true,
        text: label + ": " + res.message
      });
    });
    if (messages.some(m => m.ok)) {
      if (data.sections !== sections) setSections(data.sections);
      if (data.faculty !== faculty) setFaculty(data.faculty);
      const violations = E.countViolations(data.faculty, rooms, data.sections, timeSlots, data.genes);
      const prev = result.needsRegeneration;
      const trigger = {
        kind: "test",
        reason: "Test conflicts were added (" + messages.filter(m => m.ok).length + ")."
      };
      setResult({
        ...result,
        genes: data.genes,
        violations,
        feasible: violations.total === 0,
        approvalStatus: "Pending Review",
        updateSummary: null,
        needsRegeneration: {
          reason: trigger.reason,
          triggers: (prev && prev.triggers || []).concat([trigger]),
          at: new Date().toISOString()
        }
      });
      pushNotification("Test conflict(s) added: " + messages.filter(m => m.ok).length + ". Conflicts now: " + violations.total + ".");
      logActivity("Test", messages.filter(m => m.ok).length + " test conflict(s) added");
    }
    setTestLog(prev => messages.concat(prev).slice(0, 20));
  }

  // Lookup tables: find a faculty member / room / time slot by id instantly.
  const facultyById = Object.fromEntries(faculty.map(f => [f.id, f]));
  const roomById = Object.fromEntries(rooms.map(r => [r.id, r]));
  const slotById = Object.fromEntries(timeSlots.map(t => [t.id, t]));
  const roleLabel = role ? roleLabelOf(role) : "";
  // Who "I" am when signed in as Faculty: the teacher the account is linked to (by name,
  // on the Accounts page). There is no fallback: an account that is not linked sees a
  // message, never another teacher's schedule.
  const myFaculty = role === "faculty" ? SA.linkedFaculty(me, faculty) : null;
  // Only Administrator and IT may replace all data (Reset Demo Data), the same roles that see
  // Backup and restore and Testing tools in Settings, and the Accounts page.
  const canManageData = role === "admin" || role === "it";
  const currentUserName = me ? me.name : "";
  const unreadCount = notifications.filter(n => !n.read).length;

  // Change page and close the mobile sidebar.
  function goToPage(key) {
    setPage(key);
    setSidebarOpen(false);
  }
  // Replaces one account in the list (after a password change) and records it.
  function saveOwnAccount(updated, detail) {
    updateAccounts(accounts.map(a => a.id === updated.id ? updated : a));
    logActivity("Account", detail);
  }

  // Nobody signed in → the sign-in screen (or, the very first time, the setup screen).
  if (!me) {
    if (accounts.length === 0) {
      return /*#__PURE__*/React.createElement(SetupScreen, {
        onCreate: account => {
          updateAccounts([account]);
          logActivity("Account", "Created the first Administrator account “" + account.username + "”");
          signIn(account);
        }
      });
    }
    return /*#__PURE__*/React.createElement(SignInScreen, {
      accounts: accounts,
      onSignIn: signIn
    });
  }
  // A password someone else set (a new account or a reset) must be replaced before going on.
  if (me.mustChangePassword) {
    return /*#__PURE__*/React.createElement(ChangePasswordScreen, {
      account: me,
      onSignOut: signOut,
      onSave: updated => saveOwnAccount(updated, "“" + updated.username + "” chose their own password")
    });
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "flex min-h-screen"
  }, sidebarOpen && /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 bg-black/40 z-40 md:hidden",
    onClick: () => setSidebarOpen(false)
  }), /*#__PURE__*/React.createElement("aside", {
    className: "no-print w-64 shrink-0 bg-[#0b1d4a] flex flex-col justify-between py-5 h-screen fixed md:sticky top-0 left-0 z-50 " + "transition-transform duration-200 ease-in-out " + (sidebarOpen ? "translate-x-0" : "-translate-x-full") + " md:translate-x-0"
  }, /*#__PURE__*/React.createElement("div", {
    className: "overflow-y-auto"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between px-5 pb-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2.5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-9 h-9 rounded-xl bg-amber-400 flex items-center justify-center shrink-0"
  }, /*#__PURE__*/React.createElement(IconCalendar, {
    size: 18,
    className: "text-[#0b1d4a]"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "text-white font-semibold text-[15px] leading-tight"
  }, "SchedWiseAI"), /*#__PURE__*/React.createElement("div", {
    className: "text-slate-400 text-[11px] leading-tight"
  }, "World Citi Colleges"))), /*#__PURE__*/React.createElement("button", {
    onClick: () => setSidebarOpen(false),
    "aria-label": "Close menu",
    className: "md:hidden text-slate-400 hover:text-white p-1"
  }, /*#__PURE__*/React.createElement(IconX, {
    size: 18
  }))), /*#__PURE__*/React.createElement("div", {
    className: "px-5 pb-2 pt-2 text-[11px] tracking-wide text-slate-500 font-medium"
  }, "Workspace"), /*#__PURE__*/React.createElement("nav", {
    className: "px-3 space-y-0.5"
  }, visibleNav.map(item => {
    const Icon2 = item.icon;
    const active = page === item.key;
    const badge = item.key === "conflicts" && result && !result.feasible ? result.violations.total : null;
    return /*#__PURE__*/React.createElement("button", {
      key: item.key,
      onClick: () => goToPage(item.key),
      className: "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors " + (active ? "bg-white/10 text-white border-l-2 border-amber-400 pl-3" : "text-slate-400 hover:text-white hover:bg-white/5")
    }, /*#__PURE__*/React.createElement(Icon2, {
      size: 17,
      className: active ? "text-amber-400" : ""
    }), /*#__PURE__*/React.createElement("span", {
      className: "flex-1 text-left"
    }, item.label), badge ? /*#__PURE__*/React.createElement("span", {
      className: "bg-rose-600 text-white text-[10px] font-semibold rounded-full w-5 h-5 flex items-center justify-center"
    }, badge) : null);
  })), /*#__PURE__*/React.createElement("div", {
    className: "px-5 pb-2 pt-6 text-[11px] tracking-wide text-slate-500 font-medium"
  }, "Account"), /*#__PURE__*/React.createElement("nav", {
    className: "px-3 space-y-0.5"
  }, canManageData && /*#__PURE__*/React.createElement("button", {
    onClick: () => resetDemoData(),
    className: "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5"
  }, /*#__PURE__*/React.createElement(IconRefresh, {
    size: 17
  }), /*#__PURE__*/React.createElement("span", null, "Reset Demo Data")), /*#__PURE__*/React.createElement("button", {
    onClick: () => goToPage("settings"),
    className: "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5"
  }, /*#__PURE__*/React.createElement(IconSettings, {
    size: 17
  }), /*#__PURE__*/React.createElement("span", null, "Settings")), /*#__PURE__*/React.createElement("button", {
    onClick: signOut,
    className: "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5"
  }, /*#__PURE__*/React.createElement(IconLogOut, {
    size: 17
  }), /*#__PURE__*/React.createElement("span", null, "Sign Out")))), /*#__PURE__*/React.createElement("div", {
    className: "mx-3 px-2 shrink-0"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2.5 px-2 py-2 rounded-lg bg-white/5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center text-[#0b1d4a] font-semibold text-xs shrink-0"
  }, initials(currentUserName)), /*#__PURE__*/React.createElement("div", {
    className: "min-w-0"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-white text-[13px] font-medium leading-tight truncate"
  }, currentUserName), /*#__PURE__*/React.createElement("div", {
    className: "text-slate-400 text-[11px] leading-tight truncate"
  }, roleLabel))))), /*#__PURE__*/React.createElement("div", {
    className: "flex-1 flex flex-col min-w-0"
  }, /*#__PURE__*/React.createElement("header", {
    className: "no-print bg-white border-b border-slate-100 px-4 sm:px-8 py-3.5 flex items-center gap-3 sm:gap-4"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setSidebarOpen(true),
    "aria-label": "Open menu",
    className: "md:hidden shrink-0 w-9 h-9 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center"
  }, /*#__PURE__*/React.createElement(IconMenu, {
    size: 18,
    className: "text-slate-600"
  })), /*#__PURE__*/React.createElement(GlobalSearch, {
    role: role,
    faculty: faculty,
    sections: sections,
    rooms: rooms,
    result: result,
    myFacultyId: myFaculty ? myFaculty.id : null,
    onOpenFaculty: f => setFacultyProfileModal(f),
    onOpenSection: s => setSectionModal(s),
    onOpenRoom: r => setRoomModal(r),
    onOpenMySchedule: () => {
      setScheduleTab("faculty");
      goToPage("schedules");
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "relative shrink-0"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setNotificationsOpen(o => !o),
    "aria-label": "Notifications",
    className: "relative w-9 h-9 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center"
  }, /*#__PURE__*/React.createElement(IconBell, {
    size: 16,
    className: "text-slate-500"
  }), unreadCount > 0 && /*#__PURE__*/React.createElement("span", {
    className: "absolute -top-1 -right-1 bg-rose-600 text-white text-[10px] font-semibold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center"
  }, unreadCount)), notificationsOpen && /*#__PURE__*/React.createElement(NotificationPanel, {
    notifications: notifications,
    onMarkRead: id => setNotifications(prev => prev.map(n => n.id === id ? {
      ...n,
      read: true
    } : n)),
    onMarkAllRead: () => setNotifications(prev => prev.map(n => ({
      ...n,
      read: true
    }))),
    onClose: () => setNotificationsOpen(false)
  })), /*#__PURE__*/React.createElement("div", {
    className: "text-right hidden lg:block shrink-0"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-slate-900 text-sm font-semibold leading-tight"
  }, "This is a prototype"), /*#__PURE__*/React.createElement("div", {
    className: "text-slate-400 text-[12px] leading-tight"
  }, "Data is local to your browser"))), /*#__PURE__*/React.createElement("main", {
    className: "flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6"
  }, page === "dashboard" && /*#__PURE__*/React.createElement(DashboardPage, {
    role: role,
    userName: currentUserName,
    faculty: faculty,
    rooms: rooms,
    sections: sections,
    result: result,
    slotById: slotById,
    generating: generating,
    onGenerate: handleGenerate,
    leaveRequests: leaveRequests,
    notifications: notifications,
    scheduleHistory: scheduleHistory,
    activityLog: activityLog,
    myFaculty: myFaculty,
    chairDept: chairDept,
    setChairDept: setChairDept,
    onNavigate: goToPage,
    onOpenRequests: () => {
      setFacultyTab("requests");
      goToPage("faculty");
    },
    datasetKind: datasetKind,
    onOpenSetup: () => goToPage("settings"),
    onUpdateSchedule: handleUpdateSchedule,
    onApprovalDecision: handleApprovalDecision,
    onUpdateRequestStatus: handleRequestDecision,
    onNewRequest: openRequestPicker
  }), page === "faculty" && /*#__PURE__*/React.createElement(FacultyPage, {
    faculty: faculty,
    sections: sections,
    result: result,
    role: role,
    leaveRequests: leaveRequests,
    onImport: () => setCsvImportKind("faculty"),
    tab: facultyTab,
    setTab: setFacultyTab,
    onAdd: () => setFacultyModal("new"),
    onEdit: f => setFacultyModal(f),
    onDelete: handleDeleteFaculty,
    onViewProfile: f => setFacultyProfileModal(f),
    onViewSchedule: f => {
      setSelectedFacultyId(f.id);
      setScheduleTab("faculty");
      setPage("schedules");
    },
    onNewRequest: () => openRequestPicker(null),
    onUpdateRequestStatus: handleRequestDecision,
    onEndRequest: handleEndRequest,
    canEdit: role !== "faculty",
    generating: generating,
    onGenerate: handleGenerate,
    onUpdateSchedule: handleUpdateSchedule,
    slotById: slotById
  }), page === "workload" && /*#__PURE__*/React.createElement(WorkloadPage, {
    faculty: faculty,
    sections: sections,
    result: result,
    slotById: slotById,
    roomById: roomById
  }), page === "subjects" && /*#__PURE__*/React.createElement(SubjectsPage, {
    sections: sections,
    onImport: () => setCsvImportKind("subjects"),
    onAdd: () => setSectionModal("new"),
    onEdit: s => setSectionModal(s),
    onDelete: handleDeleteSection
  }), page === "rooms" && /*#__PURE__*/React.createElement(RoomsPage, {
    rooms: rooms,
    onImport: () => setCsvImportKind("rooms"),
    onAdd: () => setRoomModal("new"),
    onEdit: r => setRoomModal(r),
    onDelete: handleDeleteRoom
  }), page === "departments" && /*#__PURE__*/React.createElement(DepartmentsPage, {
    faculty: faculty,
    sections: sections,
    result: result
  }), page === "schedules" && /*#__PURE__*/React.createElement(SchedulesPage, {
    result: result,
    sections: sections,
    facultyById: facultyById,
    roomById: roomById,
    slotById: slotById,
    timeSlots: timeSlots,
    generating: generating,
    onGenerate: handleGenerate,
    tab: scheduleTab,
    setTab: setScheduleTab,
    role: role,
    faculty: faculty,
    rooms: rooms,
    selectedFacultyId: selectedFacultyId,
    setSelectedFacultyId: setSelectedFacultyId,
    curriculumAware: curriculumAware,
    setCurriculumAware: setCurriculumAware,
    onEditAssignment: (index, gene) => setAssignmentModal({
      index,
      gene
    }),
    onApprovalDecision: handleApprovalDecision,
    onUpdateSchedule: handleUpdateSchedule,
    myFacultyId: myFaculty ? myFaculty.id : null,
    leaveRequests: leaveRequests,
    onNewRequest: openRequestPicker
  }), page === "history" && /*#__PURE__*/React.createElement(HistoryPage, {
    history: scheduleHistory,
    currentId: result ? result.id : null,
    onRestore: handleRestoreHistory
  }), page === "conflicts" && /*#__PURE__*/React.createElement(ConflictsPage, {
    result: result,
    sections: sections,
    faculty: faculty,
    rooms: rooms,
    onGenerate: handleGenerate,
    generating: generating
  }), page === "reports" && /*#__PURE__*/React.createElement(ReportsPage, {
    faculty: faculty,
    rooms: rooms,
    sections: sections,
    result: result,
    slotById: slotById
  }), page === "accounts" && canManageData && /*#__PURE__*/React.createElement(AccountsPage, {
    accounts: accounts,
    me: me,
    faculty: faculty,
    onChange: (next, text) => {
      updateAccounts(next);
      logActivity("Account", text + " — by " + me.username);
    }
  }), page === "settings" && /*#__PURE__*/React.createElement(SettingsPage, {
    role: role,
    me: me,
    hasSchedule: !!result,
    datasetKind: datasetKind,
    onChangeOwnPassword: updated => saveOwnAccount(updated, "“" + updated.username + "” changed their password"),
    violationsTotal: result ? result.violations.total : 0,
    onLoadDataset: resetDemoData,
    onCreateTestConflict: handleCreateTestConflict,
    onDownloadBackup: handleDownloadBackup,
    onRestoreBackup: handleRestoreBackup,
    datasetInfo: datasetInfo,
    onDownloadTemplate: handleDownloadTemplate,
    onDownloadCurrentData: handleDownloadCurrentData,
    onApplySchoolData: handleApplySchoolData,
    testLog: testLog,
    onGoTo: goToPage
  }))), /*#__PURE__*/React.createElement(Toast, {
    message: toast,
    onClose: () => setToast(null)
  }), facultyModal && /*#__PURE__*/React.createElement(FacultyModal, {
    initial: facultyModal === "new" ? null : facultyModal,
    allFaculty: faculty,
    subjectAreas: subjectAreasOf(faculty, sections),
    onSave: f => {
      // A renamed teacher keeps their sign-in account: accounts are linked by name.
      const old = facultyModal !== "new" && faculty.find(x => x.id === f.id);
      if (old && !sameText(old.name, f.name)) updateAccounts(SA.relinkAfterRename(accounts, old.name, f.name));
      setFaculty(facultyModal === "new" ? [...faculty, f] : faculty.map(x => x.id === f.id ? f : x));
    },
    onClose: () => setFacultyModal(null)
  }), sectionModal && /*#__PURE__*/React.createElement(SectionModal, {
    initial: sectionModal === "new" ? null : sectionModal,
    allSections: sections,
    subjectAreas: subjectAreasOf(faculty, sections),
    programs: choicesOf(sections.map(s => s.program).filter(Boolean), ["BSIT", "BSCS", "BSIS"]),
    onSave: s => handleSaveSection(s, sectionModal === "new"),
    onClose: () => setSectionModal(null)
  }), roomModal && /*#__PURE__*/React.createElement(RoomModal, {
    initial: roomModal === "new" ? null : roomModal,
    allRooms: rooms,
    onSave: r => setRooms(roomModal === "new" ? [...rooms, r] : rooms.map(x => x.id === r.id ? r : x)),
    onClose: () => setRoomModal(null)
  }), facultyProfileModal && /*#__PURE__*/React.createElement(FacultyProfileModal, {
    faculty: facultyProfileModal,
    sections: sections,
    result: result,
    slotById: slotById,
    onClose: () => setFacultyProfileModal(null)
  }), assignmentModal && /*#__PURE__*/React.createElement(AssignmentModal, {
    assignment: assignmentModal,
    faculty: faculty,
    rooms: rooms,
    sections: sections,
    timeSlots: timeSlots,
    onSave: handleEditAssignment,
    onDelete: handleDeleteAssignment,
    onClose: () => setAssignmentModal(null)
  }), leaveRequestModal && /*#__PURE__*/React.createElement(AvailabilityRequestModal, {
    faculty: faculty,
    lockedFacultyId: leaveRequestLockedTo,
    timeSlots: timeSlots,
    sections: sections,
    result: result,
    onSave: handleSubmitRequest,
    onClose: () => setLeaveRequestModal(false)
  }), csvImportKind && /*#__PURE__*/React.createElement(CSVImportModal, {
    kind: csvImportKind,
    onImportFaculty: recs => {
      setFaculty([...faculty, ...recs]);
      pushNotification("Imported " + recs.length + " faculty record(s).");
      logActivity("Import", recs.length + " faculty record(s)");
    },
    onImportSections: recs => {
      const next = [...sections, ...recs];
      setSections(next);
      pushNotification("Imported " + recs.length + " subject record(s).");
      logActivity("Import", recs.length + " subject record(s)");
      // Imported subjects aren't in the current schedule yet, so flag it for an update.
      if (result) flagForUpdate(faculty, next, {
        kind: "subject",
        reason: recs.length + " imported subject(s) need to be placed."
      });
    },
    onImportRooms: recs => {
      setRooms([...rooms, ...recs]);
      pushNotification("Imported " + recs.length + " room record(s).");
      logActivity("Import", recs.length + " room record(s)");
    },
    onClose: () => setCsvImportKind(null)
  }));
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
                recent activity (imports, exports, account changes)

   DashboardPage below is only a "dispatcher": it looks at the current
   role and renders the matching overview component.
   ===================================================================== */

// Counts how many faculty fall into each workload status bucket.
// Re-uses loadStatusFor() so the labels match the Faculty/Workload pages exactly.
function computeLoadBuckets(faculty, sections, result) {
  const buckets = {
    "Overloaded": 0,
    "Near capacity": 0,
    "Balanced": 0,
    "Light load": 0,
    "Underloaded": 0,
    "No assignment yet": 0
  };
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
    if (E.qualifiedFaculty(faculty, s).length === 0) problems.push(s.subjectCode + " (" + s.sectionName + ") has no qualified faculty for " + s.requiredSpecialization + ".");
    // A section with no room of the right type and size can never be placed.
    if (E.validRooms(rooms, s).length === 0) problems.push(s.subjectCode + " (" + s.sectionName + ") has no " + s.roomTypeRequired + " room that fits " + s.enrolledStudents + " students.");
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
    if (canTeach.length === 0) problems.push(s.subjectCode + " (" + s.sectionName + ") is fixed to " + describeSlots([s.fixedSlotId], slotsById) + ", but no qualified teacher is available then.");
  });
  // Prerequisite ordering problems (same check the Subjects page uses).
  validateCurriculumSequence(sections).forEach(iss => problems.push(iss.text));
  return problems;
}

// ---------- Small shared building blocks used by all four overviews ----------

// SampleDataBanner: on the Administrator and IT overviews while sample data is loaded,
// a reminder that the real data can be set up in Settings (see SchoolDataCard).
function SampleDataBanner({
  onSetup
}) {
  return /*#__PURE__*/React.createElement("div", {
    role: "note",
    className: "no-print bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm text-blue-900"
  }, /*#__PURE__*/React.createElement("span", null, "You are looking at sample data."), /*#__PURE__*/React.createElement("button", {
    onClick: onSetup,
    className: "font-semibold text-blue-800 hover:underline text-left"
  }, "Set up with your school's data \u2192"));
}

// The coloured banner at the top of every overview. `children` holds the action buttons.
function OverviewHero({
  eyebrow,
  title,
  subtitle,
  children
}) {
  return /*#__PURE__*/React.createElement("section", {
    className: "rounded-3xl overflow-hidden bg-gradient-to-br from-[#0b1d4a] via-[#13306e] to-[#1d4ed8] px-5 sm:px-10 py-7 sm:py-9"
  }, /*#__PURE__*/React.createElement("span", {
    className: "inline-flex items-center gap-1.5 bg-white/10 text-white text-xs font-medium px-3 py-1.5 rounded-full mb-4"
  }, /*#__PURE__*/React.createElement(IconSparkles, {
    size: 13
  }), " ", eyebrow), /*#__PURE__*/React.createElement("h1", {
    className: "text-white font-bold text-2xl sm:text-3xl leading-tight mb-2"
  }, title), /*#__PURE__*/React.createElement("p", {
    className: "text-slate-300 text-sm sm:text-[15px] leading-relaxed mb-5 max-w-2xl"
  }, subtitle), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap items-center gap-3"
  }, children));
}

// A white card with a title row and an optional action (usually a "View all" link).
function Panel({
  title,
  action,
  onAction,
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-2xl p-5 shadow-sm border border-slate-100"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between mb-3"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "font-semibold text-slate-900 text-sm"
  }, title), action && /*#__PURE__*/React.createElement("button", {
    onClick: onAction,
    className: "text-xs font-medium text-blue-800 hover:underline"
  }, action)), children);
}

// Grey placeholder text for empty lists.
function EmptyNote({
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "text-sm text-slate-400 py-4 text-center"
  }, children);
}

// Coloured pill showing a schedule's approval status.
function ApprovalBadge({
  status
}) {
  const s = status || "Pending Review";
  const cls = s === "Approved" ? "bg-emerald-50 text-emerald-700" : s === "Rejected" ? "bg-rose-50 text-rose-700" : "bg-orange-50 text-orange-700";
  return /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-semibold px-2.5 py-1 rounded-full " + cls
  }, s);
}

// The primary "Generate Schedule" button used in the hero of Admin, Chair, and IT overviews.
function GenerateButton({
  generating,
  onGenerate
}) {
  return /*#__PURE__*/React.createElement("button", {
    onClick: onGenerate,
    disabled: generating,
    className: "bg-amber-400 text-[#0b1d4a] font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-amber-300 transition-colors disabled:opacity-60 flex items-center gap-2"
  }, /*#__PURE__*/React.createElement(IconZap, {
    size: 15
  }), generating ? "Generating..." : "Generate Schedule");
}

// Horizontal stacked bar showing how faculty are distributed across load statuses.
function LoadSnapshotBar({
  buckets,
  total
}) {
  const order = [["Overloaded", "#e11d48"], ["Near capacity", "#f97316"], ["Balanced", "#10b981"], ["Light load", "#60a5fa"], ["Underloaded", "#94a3b8"], ["No assignment yet", "#cbd5e1"]];
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "flex h-3 w-full rounded-full overflow-hidden bg-slate-100"
  }, order.map(([label, color]) => buckets[label] > 0 && /*#__PURE__*/React.createElement("div", {
    key: label,
    style: {
      width: buckets[label] / Math.max(1, total) * 100 + "%",
      background: color
    },
    title: label + ": " + buckets[label]
  }))), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5 mt-3"
  }, order.map(([label, color]) => /*#__PURE__*/React.createElement("div", {
    key: label,
    className: "flex items-center gap-2 text-xs text-slate-600"
  }, /*#__PURE__*/React.createElement("span", {
    className: "w-2.5 h-2.5 rounded-sm shrink-0",
    style: {
      background: color
    }
  }), label, ": ", /*#__PURE__*/React.createElement("span", {
    className: "font-semibold text-slate-900"
  }, buckets[label] || 0)))));
}

// Compact list of issue strings with a coloured dot per severity.
function IssueList({
  issues,
  max = 5
}) {
  if (issues.length === 0) return /*#__PURE__*/React.createElement(EmptyNote, null, "No issues detected.");
  return /*#__PURE__*/React.createElement("ul", {
    className: "space-y-1.5"
  }, issues.slice(0, max).map((iss, i) => /*#__PURE__*/React.createElement("li", {
    key: i,
    className: "text-sm text-slate-700 flex items-start gap-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 " + (iss.severity === "high" ? "bg-rose-500" : "bg-orange-500")
  }), iss.text)), issues.length > max && /*#__PURE__*/React.createElement("li", {
    className: "text-xs text-slate-400"
  }, "+ ", issues.length - max, " more"));
}

// ---------- ADMIN OVERVIEW ----------
// Focus: "what needs my decision, and is anything broken institution-wide?"
function AdminOverview(props) {
  const {
    userName,
    faculty,
    rooms,
    sections,
    result,
    generating,
    onGenerate,
    leaveRequests,
    notifications,
    scheduleHistory,
    onNavigate,
    onOpenRequests,
    datasetKind,
    onOpenSetup
  } = props;
  const {
    issues
  } = computeAllDepartments(faculty, sections, result);
  // Prerequisite problems are also institution-wide, so they are merged into the admin's issue list.
  const allIssues = issues.concat(validateCurriculumSequence(sections).map(i => ({
    severity: "medium",
    text: i.text
  })));
  const buckets = computeLoadBuckets(faculty, sections, result);
  const pendingLeave = leaveRequests.filter(r => r.status === "Pending");
  // Every saved version still waiting for a decision (the current one included).
  const pendingVersions = scheduleHistory.filter(h => (h.approvalStatus || "Pending Review") === "Pending Review").length;
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-6"
  }, /*#__PURE__*/React.createElement(OverviewHero, {
    eyebrow: "Academic Administrator",
    title: "Welcome back, " + firstName(userName),
    subtitle: "Here's what needs your attention across the institution today."
  }, /*#__PURE__*/React.createElement(GenerateButton, {
    generating: generating,
    onGenerate: onGenerate
  }), result && /*#__PURE__*/React.createElement("span", {
    className: "text-sm text-slate-200 flex items-center gap-2"
  }, "Current schedule: ", /*#__PURE__*/React.createElement(ApprovalBadge, {
    status: result.approvalStatus
  }))), datasetKind !== "school" && /*#__PURE__*/React.createElement(SampleDataBanner, {
    onSetup: onOpenSetup
  }), /*#__PURE__*/React.createElement("section", {
    className: "grid grid-cols-2 md:grid-cols-4 gap-4"
  }, /*#__PURE__*/React.createElement(StatCard, {
    label: "Pending Approvals",
    value: pendingVersions,
    sub: "schedule versions awaiting review",
    color: pendingVersions ? "#c2410c" : "#047857"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Pending Leave Requests",
    value: pendingLeave.length,
    color: pendingLeave.length ? "#c2410c" : "#047857"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Open Issues",
    value: allIssues.length,
    color: allIssues.length ? "#c0392b" : "#047857"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Faculty / Sections / Rooms",
    value: faculty.length + " / " + sections.length + " / " + rooms.length
  })), /*#__PURE__*/React.createElement("section", {
    className: "grid grid-cols-1 lg:grid-cols-2 gap-5"
  }, /*#__PURE__*/React.createElement(Panel, {
    title: "Schedule Approval",
    action: "Review schedule",
    onAction: () => onNavigate("schedules")
  }, result ? /*#__PURE__*/React.createElement("div", {
    className: "space-y-2 text-sm"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-slate-500"
  }, "Status"), /*#__PURE__*/React.createElement(ApprovalBadge, {
    status: result.approvalStatus
  })), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-slate-500"
  }, "Conflicts"), /*#__PURE__*/React.createElement("span", {
    className: "font-semibold " + (result.violations.total ? "text-rose-700" : "text-emerald-700")
  }, result.violations.total)), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-slate-500"
  }, "Generated"), /*#__PURE__*/React.createElement("span", {
    className: "text-slate-700"
  }, result.generatedAt ? new Date(result.generatedAt).toLocaleString() : "—")), result.approvalComment && /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-slate-500 italic"
  }, "\u201C", result.approvalComment, "\u201D"), result.needsRegeneration && /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-orange-700 bg-orange-50 rounded-lg px-2 py-1.5 flex items-center justify-between gap-2"
  }, /*#__PURE__*/React.createElement("span", null, "Needs update: ", result.needsRegeneration.reason), /*#__PURE__*/React.createElement("button", {
    onClick: props.onUpdateSchedule,
    className: "shrink-0 font-semibold underline"
  }, "Update"))) : /*#__PURE__*/React.createElement(EmptyNote, null, "No schedule generated yet.")), /*#__PURE__*/React.createElement(Panel, {
    title: "Pending Leave & Availability Requests",
    action: "Open requests",
    onAction: onOpenRequests
  }, pendingLeave.length === 0 ? /*#__PURE__*/React.createElement(EmptyNote, null, "No pending requests.") : /*#__PURE__*/React.createElement("ul", {
    className: "divide-y divide-slate-50"
  }, pendingLeave.slice(0, 4).map(r => {
    const fac = faculty.find(f => f.id === r.facultyId);
    return /*#__PURE__*/React.createElement("li", {
      key: r.id,
      className: "py-2 text-sm"
    }, /*#__PURE__*/React.createElement("div", {
      className: "font-medium text-slate-900"
    }, fac ? fac.name : "Unknown", " \u2014 ", r.type), /*#__PURE__*/React.createElement("div", {
      className: "text-xs text-slate-600"
    }, requestTimesText(r, props.slotById)), /*#__PURE__*/React.createElement("div", {
      className: "text-xs text-slate-500 truncate"
    }, r.description));
  }))), /*#__PURE__*/React.createElement(Panel, {
    title: "Issues Requiring Attention",
    action: "Open departments",
    onAction: () => onNavigate("departments")
  }, /*#__PURE__*/React.createElement(IssueList, {
    issues: allIssues
  })), /*#__PURE__*/React.createElement(Panel, {
    title: "Faculty Load Snapshot",
    action: "Workload details",
    onAction: () => onNavigate("workload")
  }, result ? /*#__PURE__*/React.createElement(LoadSnapshotBar, {
    buckets: buckets,
    total: faculty.length
  }) : /*#__PURE__*/React.createElement(EmptyNote, null, "Generate a schedule to see workload distribution."))), /*#__PURE__*/React.createElement(Panel, {
    title: "Recent Notifications"
  }, notifications.length === 0 ? /*#__PURE__*/React.createElement(EmptyNote, null, "No notifications yet.") : /*#__PURE__*/React.createElement("ul", {
    className: "divide-y divide-slate-50"
  }, notifications.slice(0, 4).map(n => /*#__PURE__*/React.createElement("li", {
    key: n.id,
    className: "py-2 flex items-start justify-between gap-3 text-sm"
  }, /*#__PURE__*/React.createElement("span", {
    className: n.read ? "text-slate-500" : "text-slate-900 font-medium"
  }, n.message), /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-slate-400 shrink-0"
  }, new Date(n.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  })))))));
}

// ---------- DEPARTMENT CHAIR OVERVIEW ----------
// Focus: "act quickly" — approve/reject the schedule and leave requests without leaving the page.
// A department filter narrows workload, issues, and leave requests to one specialization.
function ChairOverview(props) {
  const {
    userName,
    faculty,
    sections,
    result,
    generating,
    onGenerate,
    leaveRequests,
    chairDept,
    setChairDept,
    onNavigate,
    onApprovalDecision,
    onUpdateRequestStatus
  } = props;
  const {
    allSpecs,
    deptStats,
    issues
  } = computeAllDepartments(faculty, sections, result);

  // Apply the department filter ("All" shows everything).
  const inDept = spec => chairDept === "All" || spec === chairDept;
  const visibleDepts = deptStats.filter(d => inDept(d.spec));
  const visibleIssues = issues.filter(i => inDept(i.spec));
  const deptFacultyIds = new Set(faculty.filter(f => chairDept === "All" || f.specializations.includes(chairDept)).map(f => f.id));
  const pendingLeave = leaveRequests.filter(r => r.status === "Pending" && deptFacultyIds.has(r.facultyId));
  const needsDecision = result && (result.approvalStatus || "Pending Review") === "Pending Review";
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-6"
  }, /*#__PURE__*/React.createElement(OverviewHero, {
    eyebrow: "Department Chair",
    title: "Welcome back, " + firstName(userName),
    subtitle: "Review schedules and faculty requests for your department in one place."
  }, /*#__PURE__*/React.createElement(GenerateButton, {
    generating: generating,
    onGenerate: onGenerate
  }), /*#__PURE__*/React.createElement("label", {
    className: "flex items-center gap-2 text-sm text-slate-200"
  }, "Department:", /*#__PURE__*/React.createElement("select", {
    value: chairDept,
    onChange: e => setChairDept(e.target.value),
    className: "bg-white/10 border border-white/20 text-white text-sm rounded-lg px-2 py-1.5 focus:outline-none"
  }, /*#__PURE__*/React.createElement("option", {
    value: "All",
    className: "text-slate-900"
  }, "All departments"), allSpecs.map(sp => /*#__PURE__*/React.createElement("option", {
    key: sp,
    value: sp,
    className: "text-slate-900"
  }, sp))))), /*#__PURE__*/React.createElement("section", {
    className: "grid grid-cols-1 lg:grid-cols-2 gap-5"
  }, /*#__PURE__*/React.createElement(Panel, {
    title: "My Approvals Queue",
    action: "Review in detail",
    onAction: () => onNavigate("schedules")
  }, !result ? /*#__PURE__*/React.createElement(EmptyNote, null, "No schedule generated yet.") : /*#__PURE__*/React.createElement("div", {
    className: "space-y-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between text-sm"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-slate-500"
  }, "Current schedule"), /*#__PURE__*/React.createElement(ApprovalBadge, {
    status: result.approvalStatus
  })), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between text-sm"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-slate-500"
  }, "Conflicts"), /*#__PURE__*/React.createElement("span", {
    className: "font-semibold " + (result.violations.total ? "text-rose-700" : "text-emerald-700")
  }, result.violations.total)), result.needsRegeneration && /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-orange-700 bg-orange-50 rounded-lg px-2 py-1.5 flex items-center justify-between gap-2"
  }, /*#__PURE__*/React.createElement("span", null, "Needs update: ", result.needsRegeneration.reason), /*#__PURE__*/React.createElement("button", {
    onClick: props.onUpdateSchedule,
    disabled: generating,
    className: "shrink-0 font-semibold underline"
  }, "Update")), needsDecision ? /*#__PURE__*/React.createElement("div", {
    className: "flex gap-2 pt-1"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => onApprovalDecision("Approved", ""),
    className: "flex-1 flex items-center justify-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium py-2 rounded-lg"
  }, /*#__PURE__*/React.createElement(IconThumbsUp, {
    size: 15
  }), " Approve"), /*#__PURE__*/React.createElement("button", {
    onClick: () => onApprovalDecision("Rejected", ""),
    className: "flex-1 flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium py-2 rounded-lg"
  }, /*#__PURE__*/React.createElement(IconThumbsDown, {
    size: 15
  }), " Reject")) : /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-slate-400"
  }, "No decision needed right now."))), /*#__PURE__*/React.createElement(Panel, {
    title: "Faculty Leave Requests (" + pendingLeave.length + ")"
  }, pendingLeave.length === 0 ? /*#__PURE__*/React.createElement(EmptyNote, null, "No pending requests", chairDept !== "All" ? " in " + chairDept : "", ".") : /*#__PURE__*/React.createElement("ul", {
    className: "divide-y divide-slate-50"
  }, pendingLeave.map(r => {
    const fac = faculty.find(f => f.id === r.facultyId);
    return /*#__PURE__*/React.createElement("li", {
      key: r.id,
      className: "py-2.5 flex items-start justify-between gap-3"
    }, /*#__PURE__*/React.createElement("div", {
      className: "min-w-0"
    }, /*#__PURE__*/React.createElement("div", {
      className: "text-sm font-medium text-slate-900"
    }, fac ? fac.name : "Unknown", " \u2014 ", r.type), /*#__PURE__*/React.createElement("div", {
      className: "text-xs text-slate-600"
    }, requestTimesText(r, props.slotById)), /*#__PURE__*/React.createElement("div", {
      className: "text-xs text-slate-500 truncate"
    }, r.description)), /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-2 shrink-0"
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => onUpdateRequestStatus(r.id, "Approved"),
      className: "text-xs font-medium text-emerald-700 hover:underline"
    }, "Approve"), /*#__PURE__*/React.createElement("button", {
      onClick: () => onUpdateRequestStatus(r.id, "Denied"),
      className: "text-xs font-medium text-rose-700 hover:underline"
    }, "Deny")));
  })))), /*#__PURE__*/React.createElement(Panel, {
    title: "Department Workload Snapshot",
    action: "Full department view",
    onAction: () => onNavigate("departments")
  }, /*#__PURE__*/React.createElement("div", {
    className: "overflow-x-auto"
  }, /*#__PURE__*/React.createElement("table", {
    className: "w-full text-sm"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
    className: "text-left text-slate-400 text-xs border-b border-slate-100"
  }, /*#__PURE__*/React.createElement("th", {
    className: "py-2 pr-3 font-medium"
  }, "Specialization"), /*#__PURE__*/React.createElement("th", {
    className: "py-2 pr-3 font-medium"
  }, "Faculty"), /*#__PURE__*/React.createElement("th", {
    className: "py-2 pr-3 font-medium"
  }, "Load"), /*#__PURE__*/React.createElement("th", {
    className: "py-2 pr-3 font-medium"
  }, "Overloads"), /*#__PURE__*/React.createElement("th", {
    className: "py-2 font-medium"
  }, "Conflicts"))), /*#__PURE__*/React.createElement("tbody", null, visibleDepts.map(({
    spec,
    stats
  }) => /*#__PURE__*/React.createElement("tr", {
    key: spec,
    className: "border-b border-slate-50"
  }, /*#__PURE__*/React.createElement("td", {
    className: "py-2 pr-3 font-medium text-slate-900"
  }, spec), /*#__PURE__*/React.createElement("td", {
    className: "py-2 pr-3 text-slate-500"
  }, stats.deptFaculty.length), /*#__PURE__*/React.createElement("td", {
    className: "py-2 pr-3 text-slate-500"
  }, result ? stats.loadPct + "%" : "—"), /*#__PURE__*/React.createElement("td", {
    className: "py-2 pr-3 " + (stats.overloads ? "text-rose-700 font-semibold" : "text-slate-400")
  }, stats.overloads), /*#__PURE__*/React.createElement("td", {
    className: "py-2 " + (stats.conflicts ? "text-rose-700 font-semibold" : "text-slate-400")
  }, stats.conflicts))))))), /*#__PURE__*/React.createElement(Panel, {
    title: "Issues Requiring Attention"
  }, /*#__PURE__*/React.createElement(IssueList, {
    issues: visibleIssues
  })));
}

// ---------- FACULTY OVERVIEW ----------
// Focus: "what am I teaching, how heavy is my load, and did my requests go through?"
// Faculty never generate schedules, so there is no Generate button here.
function FacultyOverview(props) {
  const {
    myFaculty,
    sections,
    result,
    slotById,
    leaveRequests,
    onNavigate,
    onNewRequest
  } = props;
  if (!myFaculty) return /*#__PURE__*/React.createElement(EmptyNote, null, "Your account is not linked to a teacher in the Faculty list, so there is no schedule to show yet. Ask an Administrator or IT staff member to check your account on the Accounts page.");
  const status = loadStatusFor(myFaculty, sections, result, props.faculty);

  // Collect this faculty member's scheduled classes (skipping manually removed ones).
  const myClasses = result ? result.genes.map((g, i) => ({
    g,
    sec: sections[i],
    slot: slotById[g.slotId]
  })).filter(x => x.g.facultyId === myFaculty.id && x.slot) : [];

  // Group classes by weekday, in Mon→Fri order, sorted by period within each day.
  const byDay = {};
  E.DAYS.forEach(d => {
    byDay[d] = [];
  });
  myClasses.forEach(c => byDay[c.slot.day].push(c));
  E.DAYS.forEach(d => byDay[d].sort((a, b) => a.slot.period - b.slot.period));

  // Preference match: share of my classes that land on one of my preferred days.
  const prefHits = myClasses.filter(c => myFaculty.preferredDays.includes(c.slot.day)).length;
  const prefPct = myClasses.length ? Math.round(prefHits / myClasses.length * 100) : 0;
  const myRequests = leaveRequests.filter(r => r.facultyId === myFaculty.id);
  const approval = result ? result.approvalStatus || "Pending Review" : null;
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-6"
  }, /*#__PURE__*/React.createElement(OverviewHero, {
    eyebrow: "Faculty Member",
    title: "Welcome back, " + firstName(myFaculty.name),
    subtitle: myFaculty.academicRank ? myFaculty.academicRank + " · " + (myFaculty.employmentStatus || "") : "Your teaching schedule and requests at a glance."
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => onNavigate("schedules"),
    className: "bg-amber-400 text-[#0b1d4a] font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-amber-300 transition-colors flex items-center gap-2"
  }, /*#__PURE__*/React.createElement(IconCalendar, {
    size: 15
  }), " View My Full Schedule"), /*#__PURE__*/React.createElement("button", {
    onClick: () => onNewRequest(myFaculty.id),
    className: "border border-white/30 text-white font-medium text-sm px-5 py-2.5 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2"
  }, /*#__PURE__*/React.createElement(IconPlus, {
    size: 15
  }), " Request Availability Change / Leave")), approval && /*#__PURE__*/React.createElement("div", {
    className: "rounded-2xl p-4 border text-sm " + (approval === "Approved" ? "bg-emerald-50 border-emerald-100 text-emerald-800" : approval === "Rejected" ? "bg-rose-50 border-rose-100 text-rose-800" : "bg-orange-50 border-orange-100 text-orange-800")
  }, result.needsRegeneration ? "Availability was updated — only the affected classes will be moved in the next update." : approval === "Approved" ? "Your schedule has been approved and is final." : approval === "Rejected" ? "The current schedule was rejected and is being revised." : "The current schedule is still pending review and may change."), /*#__PURE__*/React.createElement("section", {
    className: "grid grid-cols-2 md:grid-cols-4 gap-4"
  }, /*#__PURE__*/React.createElement(StatCard, {
    label: "My Current Load",
    value: status.assigned + " / " + myFaculty.maxUnits,
    sub: "units"
  }), /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-2xl p-5 shadow-sm border border-slate-100"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-slate-400 text-xs font-medium mb-2"
  }, "Load Status"), /*#__PURE__*/React.createElement("span", {
    className: "text-sm font-semibold px-2.5 py-1 rounded-full " + status.color
  }, status.label)), /*#__PURE__*/React.createElement(StatCard, {
    label: "Classes This Week",
    value: myClasses.length
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Preference Match",
    value: myClasses.length ? prefPct + "%" : "—",
    sub: myClasses.length ? prefHits + " of " + myClasses.length + " on preferred days" : "no classes yet"
  })), /*#__PURE__*/React.createElement("section", {
    className: "grid grid-cols-1 lg:grid-cols-3 gap-5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lg:col-span-2"
  }, /*#__PURE__*/React.createElement(Panel, {
    title: "My Schedule This Week"
  }, myClasses.length === 0 ? /*#__PURE__*/React.createElement(EmptyNote, null, result ? "You have no classes in the current schedule." : "No schedule has been generated yet.") : /*#__PURE__*/React.createElement("div", {
    className: "space-y-3"
  }, E.DAYS.filter(d => byDay[d].length > 0).map(d => /*#__PURE__*/React.createElement("div", {
    key: d
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5 flex items-center gap-2"
  }, d, myFaculty.preferredDays.includes(d) && /*#__PURE__*/React.createElement("span", {
    className: "normal-case tracking-normal text-[10px] bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded-full"
  }, "preferred")), /*#__PURE__*/React.createElement("div", {
    className: "space-y-1.5"
  }, byDay[d].map((c, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "flex items-center justify-between border border-slate-100 rounded-lg px-3 py-2"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "text-sm font-medium text-slate-900"
  }, c.sec.subjectCode, " \u2014 ", c.sec.subjectName), /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-slate-400"
  }, c.sec.sectionName)), /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-slate-500 text-right"
  }, c.slot.label.split(" ")[1]))))))))), /*#__PURE__*/React.createElement(Panel, {
    title: "My Requests",
    action: "+ New",
    onAction: () => onNewRequest(myFaculty.id)
  }, myRequests.length === 0 ? /*#__PURE__*/React.createElement(EmptyNote, null, "You haven't submitted any requests.") : /*#__PURE__*/React.createElement("ul", {
    className: "divide-y divide-slate-50"
  }, myRequests.map(r => {
    const cls = r.status === "Approved" ? "text-emerald-700 bg-emerald-50" : r.status === "Denied" ? "text-rose-700 bg-rose-50" : r.status === "Ended" ? "text-slate-600 bg-slate-100" : "text-orange-700 bg-orange-50";
    return /*#__PURE__*/React.createElement("li", {
      key: r.id,
      className: "py-2.5"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center justify-between gap-2"
    }, /*#__PURE__*/React.createElement("span", {
      className: "text-sm font-medium text-slate-900"
    }, r.type), /*#__PURE__*/React.createElement("span", {
      className: "text-xs font-medium px-2 py-0.5 rounded-full " + cls
    }, r.status)), /*#__PURE__*/React.createElement("div", {
      className: "text-xs text-slate-600 mt-0.5"
    }, requestTimesText(r, slotById)), /*#__PURE__*/React.createElement("div", {
      className: "text-xs text-slate-500 mt-0.5"
    }, r.description));
  })))));
}

// ---------- IT PROFESSIONAL / STAFF OVERVIEW ----------
// Focus: technical health — how the AI engine is performing, whether the data is clean,
// how rooms are being used, and what data operations (imports/exports) happened recently.
function ITOverview(props) {
  const {
    userName,
    faculty,
    rooms,
    sections,
    result,
    slotById,
    generating,
    onGenerate,
    scheduleHistory,
    activityLog,
    onNavigate,
    datasetKind,
    onOpenSetup
  } = props;
  const health = computeDataHealth(faculty, rooms, sections);

  // Average engine run time across every saved version that recorded a timing.
  const timed = scheduleHistory.filter(h => typeof h.elapsedMs === "number");
  const avgMs = timed.length ? Math.round(timed.reduce((s, h) => s + h.elapsedMs, 0) / timed.length) : null;

  // Rows for the "Last Engine Run" table: [label, value].
  const engineRows = result ? [["Run time", typeof result.elapsedMs === "number" ? result.elapsedMs + " ms" : "not recorded"], ["Generations run", result.convergence.length + (result.settings ? " of " + result.settings.generations + " max" : "")], ["Population size", result.settings ? result.settings.popSize : "—"], ["Final fitness", result.fitness.toFixed(1)], ["Hard-constraint violations", result.violations.total], ["Curriculum-aware", result.curriculumAware ? "On" : "Off"]] : [];
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-6"
  }, /*#__PURE__*/React.createElement(OverviewHero, {
    eyebrow: "IT Professional / Staff",
    title: "Welcome back, " + firstName(userName),
    subtitle: "System health, AI engine performance, and data operations."
  }, /*#__PURE__*/React.createElement(GenerateButton, {
    generating: generating,
    onGenerate: onGenerate
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => onNavigate("reports"),
    className: "border border-white/30 text-white font-medium text-sm px-5 py-2.5 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2"
  }, /*#__PURE__*/React.createElement(IconChart, {
    size: 15
  }), " Open Reports")), datasetKind !== "school" && /*#__PURE__*/React.createElement(SampleDataBanner, {
    onSetup: onOpenSetup
  }), /*#__PURE__*/React.createElement("section", {
    className: "grid grid-cols-2 md:grid-cols-4 gap-4"
  }, /*#__PURE__*/React.createElement(StatCard, {
    label: "Last Run Time",
    value: result && typeof result.elapsedMs === "number" ? result.elapsedMs + " ms" : "—",
    sub: avgMs != null ? "avg " + avgMs + " ms over " + timed.length + " run(s)" : undefined
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Saved Versions",
    value: scheduleHistory.length
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Data Health Issues",
    value: health.length,
    color: health.length ? "#c0392b" : "#047857"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Records",
    value: faculty.length + sections.length + rooms.length,
    sub: faculty.length + " faculty · " + sections.length + " sections · " + rooms.length + " rooms"
  })), /*#__PURE__*/React.createElement("section", {
    className: "grid grid-cols-1 lg:grid-cols-2 gap-5"
  }, /*#__PURE__*/React.createElement(Panel, {
    title: "Last AI Engine Run",
    action: "Convergence chart",
    onAction: () => onNavigate("schedules")
  }, !result ? /*#__PURE__*/React.createElement(EmptyNote, null, "The engine hasn't been run yet.") : /*#__PURE__*/React.createElement("table", {
    className: "w-full text-sm"
  }, /*#__PURE__*/React.createElement("tbody", null, engineRows.map(([k, v]) => /*#__PURE__*/React.createElement("tr", {
    key: k,
    className: "border-b border-slate-50"
  }, /*#__PURE__*/React.createElement("td", {
    className: "py-1.5 text-slate-500"
  }, k), /*#__PURE__*/React.createElement("td", {
    className: "py-1.5 text-right font-medium text-slate-900"
  }, v)))))), /*#__PURE__*/React.createElement(Panel, {
    title: "Data Health"
  }, health.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 text-sm text-emerald-700"
  }, /*#__PURE__*/React.createElement(IconCheckCircle, {
    size: 16
  }), " All records are valid for scheduling.") : /*#__PURE__*/React.createElement(IssueList, {
    issues: health.map(t => ({
      severity: "high",
      text: t
    })),
    max: 6
  }))), /*#__PURE__*/React.createElement(Panel, {
    title: "Room Utilization Overview",
    action: "Full report",
    onAction: () => onNavigate("reports")
  }, result ? /*#__PURE__*/React.createElement(RoomHeatmap, {
    rooms: rooms,
    result: result,
    slotById: slotById
  }) : /*#__PURE__*/React.createElement(EmptyNote, null, "Generate a schedule to see room usage.")), /*#__PURE__*/React.createElement(Panel, {
    title: "Recent Activity"
  }, activityLog.length === 0 ? /*#__PURE__*/React.createElement(EmptyNote, null, "No imports, exports or account changes yet.") : /*#__PURE__*/React.createElement("ul", {
    className: "divide-y divide-slate-50"
  }, activityLog.slice(0, 8).map(a => /*#__PURE__*/React.createElement("li", {
    key: a.id,
    className: "py-2 flex items-center justify-between gap-3 text-sm"
  }, /*#__PURE__*/React.createElement("span", {
    className: "flex items-center gap-2"
  }, a.kind === "Account" ? /*#__PURE__*/React.createElement(IconKey, {
    size: 14,
    className: "text-slate-600"
  }) : a.kind === "Import" || a.kind === "Upload" ? /*#__PURE__*/React.createElement(IconUpload, {
    size: 14,
    className: "text-blue-600"
  }) : /*#__PURE__*/React.createElement(IconDownload, {
    size: 14,
    className: "text-amber-600"
  }), /*#__PURE__*/React.createElement("span", {
    className: "font-medium text-slate-900"
  }, a.kind), /*#__PURE__*/React.createElement("span", {
    className: "text-slate-500"
  }, a.detail)), /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-slate-400 shrink-0"
  }, new Date(a.timestamp).toLocaleString()))))));
}

// Dispatcher: picks the overview that matches the signed-in role.
function DashboardPage(props) {
  if (props.role === "admin") return /*#__PURE__*/React.createElement(AdminOverview, props);
  if (props.role === "chair") return /*#__PURE__*/React.createElement(ChairOverview, props);
  if (props.role === "faculty") return /*#__PURE__*/React.createElement(FacultyOverview, props);
  return /*#__PURE__*/React.createElement(ITOverview, props);
}

/* =====================================================================
   11. OTHER PAGES
   ===================================================================== */

// TableShell: the shared white card around every data table, with optional
// Export CSV / Import CSV / Add buttons in its header. `no-print` hides the
// buttons when printing.
function TableShell({
  title,
  onAdd,
  addLabel,
  onImport,
  onExport,
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between flex-wrap gap-2 px-6 py-4 border-b border-slate-100"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "font-semibold text-slate-900"
  }, title), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 no-print"
  }, onExport && /*#__PURE__*/React.createElement("button", {
    onClick: onExport,
    className: "flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium px-3 py-2 rounded-lg"
  }, /*#__PURE__*/React.createElement(IconDownload, {
    size: 15
  }), " Export CSV"), onImport && /*#__PURE__*/React.createElement("button", {
    onClick: onImport,
    className: "flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium px-3 py-2 rounded-lg"
  }, /*#__PURE__*/React.createElement(IconUpload, {
    size: 15
  }), " Import CSV"), onAdd && /*#__PURE__*/React.createElement("button", {
    onClick: onAdd,
    className: "flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-[#0b1d4a] text-sm font-medium px-3.5 py-2 rounded-lg"
  }, /*#__PURE__*/React.createElement(IconPlus, {
    size: 15
  }), " ", addLabel))), children);
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
  nearCapacityPct: 80,
  // a prototype setting, not a CHED or school rule
  lightLoadShare: 0.5 // "Light load" = below half of the average units per teacher
};

// assignedUnits(f, sections, result): total units of the classes teacher f has in the schedule.
function assignedUnits(facultyMember, sections, result) {
  if (!result) return 0;
  return result.genes.reduce((sum, g, i) => g.facultyId === facultyMember.id && sections[i] ? sum + sections[i].units : sum, 0);
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
    return {
      label: "No assignment yet",
      assigned: 0,
      pct: 0,
      color: "text-slate-400 bg-slate-50",
      reason: "No schedule has been generated yet."
    };
  }
  const assigned = assignedUnits(facultyMember, sections, result);
  // Guard: a maximum of 0 (or less) would divide by zero. Treat it as 0% with
  // nothing assigned, and as over the limit (999) with anything assigned.
  const pct = max > 0 ? Math.round(assigned / max * 100) : assigned > 0 ? 999 : 0;
  const ofText = assigned + " of " + max + " units" + (max > 0 ? " = " + pct + "%" : "");
  const cut = LOAD_RULES.nearCapacityPct;
  if (assigned > max) return {
    label: "Overloaded",
    assigned,
    pct,
    color: "text-rose-700 bg-rose-50",
    reason: ofText + ". More than the maximum of " + max + " units."
  };
  if (pct >= cut) return {
    label: "Near capacity",
    assigned,
    pct,
    color: "text-orange-700 bg-orange-50",
    reason: ofText + ". At or above the " + cut + "% cutoff, but not over the maximum."
  };
  if (assigned === 0) return {
    label: "Underloaded",
    assigned,
    pct,
    color: "text-slate-600 bg-slate-100",
    reason: "0 units. This teacher has no classes in the current schedule."
  };
  if (faculty && faculty.length > 1) {
    const avg = averageUnits(faculty, sections, result);
    const lightBelow = avg * LOAD_RULES.lightLoadShare;
    if (assigned < lightBelow) return {
      label: "Light load",
      assigned,
      pct,
      color: "text-blue-800 bg-blue-50",
      reason: ofText + ". Fewer than half the average load in this schedule (" + avg.toFixed(1) + " units per teacher, so below " + lightBelow.toFixed(1) + ")."
    };
  }
  return {
    label: "Balanced",
    assigned,
    pct,
    color: "text-emerald-700 bg-emerald-50",
    reason: ofText + ". Below the " + cut + "% cutoff and at least half the average load per teacher."
  };
}

// FacultyPage: two tabs.
//   "Faculty List" — table with load/status, and View Profile / View Schedule /
//                    Edit / Delete actions per row.
//   "Leave & Availability" — all requests with the requested time slots.
//                            Admin/Chair can Approve (blocks those slots for the
//                            teacher), Deny, or End an approved leave.
function FacultyPage({
  faculty,
  sections,
  result,
  role,
  leaveRequests,
  tab,
  setTab,
  onImport,
  onAdd,
  onEdit,
  onDelete,
  onViewProfile,
  onViewSchedule,
  onNewRequest,
  onUpdateRequestStatus,
  onEndRequest,
  slotById,
  canEdit,
  generating,
  onGenerate,
  onUpdateSchedule
}) {
  const facultyById = Object.fromEntries(faculty.map(f => [f.id, f]));
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex gap-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setTab("list"),
    className: "text-sm font-medium px-4 py-2 rounded-lg " + (tab === "list" ? "bg-slate-900 text-white" : "bg-white text-slate-600 border border-slate-200")
  }, "Faculty List"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setTab("requests"),
    className: "text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-1.5 " + (tab === "requests" ? "bg-slate-900 text-white" : "bg-white text-slate-600 border border-slate-200")
  }, "Leave & Availability", leaveRequests.filter(r => r.status === "Pending").length > 0 && /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] font-semibold rounded-full w-5 h-5 flex items-center justify-center " + (tab === "requests" ? "bg-white/20 text-white" : "bg-rose-600 text-white")
  }, leaveRequests.filter(r => r.status === "Pending").length))), tab === "list" && /*#__PURE__*/React.createElement(TableShell, {
    title: "Faculty (" + faculty.length + ")",
    onAdd: onAdd,
    addLabel: "Add Faculty",
    onImport: onImport,
    onExport: () => downloadCSV("faculty.csv", ["Name", "Specializations", "Max Units", "Current Load", "Status", "Preferred Days", "Employment Status", "Academic Rank"], faculty.map(f => {
      const st = loadStatusFor(f, sections, result, faculty);
      return [f.name, f.specializations.join("; "), f.maxUnits, st.assigned, st.label, f.preferredDays.join("; "), f.employmentStatus || "", f.academicRank || ""];
    }))
  }, /*#__PURE__*/React.createElement("div", {
    className: "overflow-x-auto"
  }, /*#__PURE__*/React.createElement("table", {
    className: "w-full text-sm"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
    className: "text-left text-slate-400 text-xs border-b border-slate-100"
  }, /*#__PURE__*/React.createElement("th", {
    className: "px-6 py-3 font-medium"
  }, "Name"), /*#__PURE__*/React.createElement("th", {
    className: "px-6 py-3 font-medium"
  }, "Specializations"), /*#__PURE__*/React.createElement("th", {
    className: "px-6 py-3 font-medium"
  }, "Current Load"), /*#__PURE__*/React.createElement("th", {
    className: "px-6 py-3 font-medium"
  }, "Status"), /*#__PURE__*/React.createElement("th", {
    className: "px-6 py-3 font-medium"
  }, "Preferred Days"), /*#__PURE__*/React.createElement("th", {
    className: "px-6 py-3 font-medium"
  }))), /*#__PURE__*/React.createElement("tbody", null, faculty.map(f => {
    const status = loadStatusFor(f, sections, result, faculty);
    return /*#__PURE__*/React.createElement("tr", {
      key: f.id,
      className: "border-b border-slate-50 hover:bg-slate-50/50"
    }, /*#__PURE__*/React.createElement("td", {
      className: "px-6 py-3 font-medium text-slate-900"
    }, f.name), /*#__PURE__*/React.createElement("td", {
      className: "px-6 py-3 text-slate-500"
    }, f.specializations.join(", ")), /*#__PURE__*/React.createElement("td", {
      className: "px-6 py-3 text-slate-500"
    }, status.assigned, "/", f.maxUnits, " units"), /*#__PURE__*/React.createElement("td", {
      className: "px-6 py-3"
    }, /*#__PURE__*/React.createElement("span", {
      title: status.reason,
      className: "text-xs font-medium px-2 py-1 rounded-full " + status.color
    }, status.label)), /*#__PURE__*/React.createElement("td", {
      className: "px-6 py-3 text-slate-500"
    }, f.preferredDays.join(", ")), /*#__PURE__*/React.createElement("td", {
      className: "px-6 py-3 text-right whitespace-nowrap"
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => onViewProfile(f),
      title: "View Profile",
      className: "text-slate-400 hover:text-blue-800 p-1"
    }, /*#__PURE__*/React.createElement(IconEye, {
      size: 15
    })), /*#__PURE__*/React.createElement("button", {
      onClick: () => onViewSchedule(f),
      title: "View Schedule",
      className: "text-slate-400 hover:text-blue-600 p-1"
    }, /*#__PURE__*/React.createElement(IconCalendar, {
      size: 15
    })), /*#__PURE__*/React.createElement("button", {
      onClick: () => onEdit(f),
      title: "Edit",
      className: "text-slate-400 hover:text-blue-600 p-1"
    }, /*#__PURE__*/React.createElement(IconEdit, {
      size: 15
    })), /*#__PURE__*/React.createElement("button", {
      onClick: () => onDelete(f.id),
      title: "Delete",
      className: "text-slate-400 hover:text-rose-700 p-1"
    }, /*#__PURE__*/React.createElement(IconTrash, {
      size: 15
    }))));
  }))))), tab === "requests" && /*#__PURE__*/React.createElement(RegenerationBanner, {
    result: result,
    canEdit: canEdit,
    generating: generating,
    onGenerate: onGenerate,
    onUpdate: onUpdateSchedule
  }), tab === "requests" && /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between px-6 py-4 border-b border-slate-100"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "font-semibold text-slate-900"
  }, "Leave / Availability Requests"), /*#__PURE__*/React.createElement("button", {
    onClick: onNewRequest,
    className: "flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-[#0b1d4a] text-sm font-medium px-3.5 py-2 rounded-lg"
  }, /*#__PURE__*/React.createElement(IconPlus, {
    size: 15
  }), " New Request")), leaveRequests.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "px-6 py-10 text-center text-sm text-slate-400"
  }, "No leave or availability requests yet.") : /*#__PURE__*/React.createElement("div", {
    className: "divide-y divide-slate-50"
  }, leaveRequests.map(r => {
    const fac = facultyById[r.facultyId];
    const statusColor = r.status === "Approved" ? "text-emerald-700 bg-emerald-50" : r.status === "Denied" ? "text-rose-700 bg-rose-50" : r.status === "Ended" ? "text-slate-600 bg-slate-100" : "text-orange-700 bg-orange-50";
    return /*#__PURE__*/React.createElement("div", {
      key: r.id,
      className: "px-6 py-4 flex items-start justify-between gap-4"
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      className: "font-medium text-slate-900 text-sm"
    }, fac ? fac.name : "Unknown faculty", " \u2014 ", r.type, r.dateFrom && /*#__PURE__*/React.createElement("span", {
      className: "text-xs font-normal text-slate-500"
    }, " \xB7 ", r.dateFrom, r.dateTo ? " to " + r.dateTo : "")), /*#__PURE__*/React.createElement("div", {
      className: "text-xs text-slate-700 mt-0.5"
    }, /*#__PURE__*/React.createElement("span", {
      className: "font-medium"
    }, "Times:"), " ", requestTimesText(r, slotById)), /*#__PURE__*/React.createElement("div", {
      className: "text-sm text-slate-500 mt-0.5"
    }, r.description)), /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-2 shrink-0"
    }, /*#__PURE__*/React.createElement("span", {
      className: "text-xs font-medium px-2 py-1 rounded-full " + statusColor
    }, r.status), role !== "faculty" && r.status === "Pending" && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
      onClick: () => onUpdateRequestStatus(r.id, "Approved"),
      className: "text-xs font-medium text-emerald-700 hover:underline"
    }, "Approve"), /*#__PURE__*/React.createElement("button", {
      onClick: () => onUpdateRequestStatus(r.id, "Denied"),
      className: "text-xs font-medium text-rose-700 hover:underline"
    }, "Deny")), role !== "faculty" && r.status === "Approved" && /*#__PURE__*/React.createElement("button", {
      onClick: () => onEndRequest(r.id),
      className: "text-xs font-medium text-slate-600 hover:underline"
    }, r.type === "Leave Request" ? "End Leave" : "Undo change")));
  }))));
}

// SubjectsPage: subject/section table (School Year, Major/Minor, Year Level,
// Semester, Class Type, Fixed Time columns) with School Year / Category /
// Year Level filters, plus a warning box for prerequisite-order problems.
// Note: filters only change what is SHOWN — every listed subject is scheduled.
function SubjectsPage({
  sections,
  onImport,
  onAdd,
  onEdit,
  onDelete
}) {
  const curriculumIssues = validateCurriculumSequence(sections);
  // Filters (only affect what's displayed, not what gets scheduled).
  const [yearFilter, setYearFilter] = useState("all");
  const [syFilter, setSyFilter] = useState("all");
  const [catFilter, setCatFilter] = useState("all");
  const [progFilter, setProgFilter] = useState("all");
  const programs = Array.from(new Set(sections.map(s => s.program).filter(Boolean))).sort();
  const slotById = Object.fromEntries(E.buildTimeSlots().map(t => [t.id, t]));
  const schoolYears = Array.from(new Set(sections.map(s => s.schoolYear).filter(Boolean))).sort();
  const shown = sections.filter(s => (yearFilter === "all" || String(s.yearLevel) === yearFilter) && (syFilter === "all" || s.schoolYear === syFilter) && (catFilter === "all" || s.category === catFilter) && (progFilter === "all" || s.program === progFilter));
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, curriculumIssues.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "bg-orange-50 border border-orange-100 rounded-2xl p-5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 mb-2"
  }, /*#__PURE__*/React.createElement(IconAlertCircle, {
    size: 18,
    className: "text-orange-700"
  }), /*#__PURE__*/React.createElement("h3", {
    className: "font-semibold text-slate-900 text-sm"
  }, "Curriculum Prerequisite Issues")), /*#__PURE__*/React.createElement("ul", {
    className: "space-y-1"
  }, curriculumIssues.map((iss, i) => /*#__PURE__*/React.createElement("li", {
    key: i,
    className: "text-sm text-orange-800 flex items-start gap-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "mt-1.5 w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0"
  }), iss.text)))), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap items-center gap-3"
  }, /*#__PURE__*/React.createElement("label", {
    className: "text-sm text-slate-500 flex items-center gap-2"
  }, "School Year:", /*#__PURE__*/React.createElement("select", {
    className: "border border-slate-200 rounded-lg px-2 py-1.5 text-sm bg-white",
    value: syFilter,
    onChange: e => setSyFilter(e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: "all"
  }, "All"), schoolYears.map(y => /*#__PURE__*/React.createElement("option", {
    key: y,
    value: y
  }, "SY ", y)))), /*#__PURE__*/React.createElement("label", {
    className: "text-sm text-slate-500 flex items-center gap-2"
  }, "Program:", /*#__PURE__*/React.createElement("select", {
    className: "border border-slate-200 rounded-lg px-2 py-1.5 text-sm bg-white",
    value: progFilter,
    onChange: e => setProgFilter(e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: "all"
  }, "All"), programs.map(pr => /*#__PURE__*/React.createElement("option", {
    key: pr,
    value: pr
  }, pr)))), /*#__PURE__*/React.createElement("label", {
    className: "text-sm text-slate-500 flex items-center gap-2"
  }, "Category:", /*#__PURE__*/React.createElement("select", {
    className: "border border-slate-200 rounded-lg px-2 py-1.5 text-sm bg-white",
    value: catFilter,
    onChange: e => setCatFilter(e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: "all"
  }, "All"), /*#__PURE__*/React.createElement("option", {
    value: "Major"
  }, "Major"), /*#__PURE__*/React.createElement("option", {
    value: "Minor"
  }, "Minor")))), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap items-center gap-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-sm text-slate-500"
  }, "Year Level:"), [["all", "All"], ["1", "1st Year"], ["2", "2nd Year"], ["3", "3rd Year"], ["4", "4th Year"]].map(([val, lbl]) => /*#__PURE__*/React.createElement("button", {
    key: val,
    onClick: () => setYearFilter(val),
    className: "text-sm font-medium px-3 py-1.5 rounded-lg " + (yearFilter === val ? "bg-slate-900 text-white" : "bg-white text-slate-600 border border-slate-200")
  }, lbl, " ", /*#__PURE__*/React.createElement("span", {
    className: "opacity-60"
  }, "(", val === "all" ? sections.length : sections.filter(s => String(s.yearLevel) === val).length, ")")))), /*#__PURE__*/React.createElement(TableShell, {
    title: "Subjects / Sections (" + shown.length + ")",
    onAdd: onAdd,
    addLabel: "Add Subject",
    onImport: onImport,
    onExport: () => downloadCSV("subjects.csv", ["Program", "School Year", "Category", "Code", "Subject", "Section", "Year Level", "Semester", "Units", "Specialization", "Class Type", "Fixed Time", "Enrolled", "Prerequisite"], shown.map(s => [s.program || "", s.schoolYear || "", s.category || "", s.subjectCode, s.subjectName, s.sectionName, yearLabel(s.yearLevel), s.semester || "", s.units, s.requiredSpecialization, classTypeLabel(s), s.fixedSlotId != null ? describeSlots([s.fixedSlotId], slotById) : "", s.enrolledStudents, s.prerequisiteCode || ""]))
  }, /*#__PURE__*/React.createElement("div", {
    className: "overflow-x-auto"
  }, /*#__PURE__*/React.createElement("table", {
    className: "w-full text-sm"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
    className: "text-left text-slate-400 text-xs border-b border-slate-100"
  }, /*#__PURE__*/React.createElement("th", {
    className: "px-6 py-3 font-medium"
  }, "Program"), /*#__PURE__*/React.createElement("th", {
    className: "px-6 py-3 font-medium"
  }, "School Year"), /*#__PURE__*/React.createElement("th", {
    className: "px-6 py-3 font-medium"
  }, "Category"), /*#__PURE__*/React.createElement("th", {
    className: "px-6 py-3 font-medium"
  }, "Code"), /*#__PURE__*/React.createElement("th", {
    className: "px-6 py-3 font-medium"
  }, "Subject"), /*#__PURE__*/React.createElement("th", {
    className: "px-6 py-3 font-medium"
  }, "Section"), /*#__PURE__*/React.createElement("th", {
    className: "px-6 py-3 font-medium"
  }, "Year Level"), /*#__PURE__*/React.createElement("th", {
    className: "px-6 py-3 font-medium"
  }, "Semester"), /*#__PURE__*/React.createElement("th", {
    className: "px-6 py-3 font-medium"
  }, "Units"), /*#__PURE__*/React.createElement("th", {
    className: "px-6 py-3 font-medium"
  }, "Specialization"), /*#__PURE__*/React.createElement("th", {
    className: "px-6 py-3 font-medium"
  }, "Class Type"), /*#__PURE__*/React.createElement("th", {
    className: "px-6 py-3 font-medium"
  }, "Fixed Time"), /*#__PURE__*/React.createElement("th", {
    className: "px-6 py-3 font-medium"
  }, "Prerequisite"), /*#__PURE__*/React.createElement("th", {
    className: "px-6 py-3 font-medium"
  }, "Enrolled"), /*#__PURE__*/React.createElement("th", {
    className: "px-6 py-3 font-medium"
  }))), /*#__PURE__*/React.createElement("tbody", null, shown.map(s => /*#__PURE__*/React.createElement("tr", {
    key: s.id,
    className: "border-b border-slate-50 hover:bg-slate-50/50"
  }, /*#__PURE__*/React.createElement("td", {
    className: "px-6 py-3 text-slate-700 font-medium"
  }, s.program || "—"), /*#__PURE__*/React.createElement("td", {
    className: "px-6 py-3 text-slate-500 whitespace-nowrap"
  }, s.schoolYear ? "SY " + s.schoolYear : "—"), /*#__PURE__*/React.createElement("td", {
    className: "px-6 py-3"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-medium px-2 py-1 rounded-full " + (s.category === "Minor" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700")
  }, s.category || "—")), /*#__PURE__*/React.createElement("td", {
    className: "px-6 py-3 font-medium text-slate-900"
  }, s.subjectCode), /*#__PURE__*/React.createElement("td", {
    className: "px-6 py-3 text-slate-500"
  }, s.subjectName), /*#__PURE__*/React.createElement("td", {
    className: "px-6 py-3 text-slate-500"
  }, s.sectionName), /*#__PURE__*/React.createElement("td", {
    className: "px-6 py-3 text-slate-500 whitespace-nowrap"
  }, yearLabel(s.yearLevel)), /*#__PURE__*/React.createElement("td", {
    className: "px-6 py-3 text-slate-500 whitespace-nowrap"
  }, s.semester || "—"), /*#__PURE__*/React.createElement("td", {
    className: "px-6 py-3 text-slate-500"
  }, s.units), /*#__PURE__*/React.createElement("td", {
    className: "px-6 py-3 text-slate-500"
  }, s.requiredSpecialization), /*#__PURE__*/React.createElement("td", {
    className: "px-6 py-3"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-medium px-2 py-1 rounded-full " + (E.isOnline(s) ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-800")
  }, classTypeLabel(s))), /*#__PURE__*/React.createElement("td", {
    className: "px-6 py-3 text-slate-500 whitespace-nowrap"
  }, s.fixedSlotId != null ? "📌 " + describeSlots([s.fixedSlotId], slotById) : "—"), /*#__PURE__*/React.createElement("td", {
    className: "px-6 py-3 text-slate-500"
  }, s.prerequisiteCode || "—"), /*#__PURE__*/React.createElement("td", {
    className: "px-6 py-3 text-slate-500"
  }, s.enrolledStudents), /*#__PURE__*/React.createElement("td", {
    className: "px-6 py-3 text-right whitespace-nowrap"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => onEdit(s),
    title: "Edit",
    "aria-label": "Edit " + s.subjectCode + " " + s.sectionName,
    className: "text-slate-400 hover:text-blue-600 p-1"
  }, /*#__PURE__*/React.createElement(IconEdit, {
    size: 15
  })), /*#__PURE__*/React.createElement("button", {
    onClick: () => onDelete(s.id),
    title: "Delete",
    "aria-label": "Delete " + s.subjectCode + " " + s.sectionName,
    className: "text-slate-400 hover:text-rose-700 p-1"
  }, /*#__PURE__*/React.createElement(IconTrash, {
    size: 15
  }))))))))));
}

// RoomsPage: laboratory room table with CSV import/export.
function RoomsPage({
  rooms,
  onImport,
  onAdd,
  onEdit,
  onDelete
}) {
  return /*#__PURE__*/React.createElement(TableShell, {
    title: "Laboratory Rooms (" + rooms.length + ")",
    onAdd: onAdd,
    addLabel: "Add Room",
    onImport: onImport,
    onExport: () => downloadCSV("rooms.csv", ["Name", "Capacity"], rooms.map(r => [r.name, r.capacity]))
  }, /*#__PURE__*/React.createElement("p", {
    className: "px-6 pt-3 text-xs text-slate-500"
  }, "Online classes don't need a room, so only laboratory rooms are listed here."), /*#__PURE__*/React.createElement("div", {
    className: "overflow-x-auto"
  }, /*#__PURE__*/React.createElement("table", {
    className: "w-full text-sm"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
    className: "text-left text-slate-400 text-xs border-b border-slate-100"
  }, /*#__PURE__*/React.createElement("th", {
    className: "px-6 py-3 font-medium"
  }, "Name"), /*#__PURE__*/React.createElement("th", {
    className: "px-6 py-3 font-medium"
  }, "Capacity"), /*#__PURE__*/React.createElement("th", {
    className: "px-6 py-3 font-medium"
  }))), /*#__PURE__*/React.createElement("tbody", null, rooms.map(r => /*#__PURE__*/React.createElement("tr", {
    key: r.id,
    className: "border-b border-slate-50 hover:bg-slate-50/50"
  }, /*#__PURE__*/React.createElement("td", {
    className: "px-6 py-3 font-medium text-slate-900"
  }, r.name), /*#__PURE__*/React.createElement("td", {
    className: "px-6 py-3 text-slate-500"
  }, r.capacity), /*#__PURE__*/React.createElement("td", {
    className: "px-6 py-3 text-right whitespace-nowrap"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => onEdit(r),
    title: "Edit",
    "aria-label": "Edit " + r.name,
    className: "text-slate-400 hover:text-blue-600 p-1"
  }, /*#__PURE__*/React.createElement(IconEdit, {
    size: 15
  })), /*#__PURE__*/React.createElement("button", {
    onClick: () => onDelete(r.id),
    title: "Delete",
    "aria-label": "Delete " + r.name,
    className: "text-slate-400 hover:text-rose-700 p-1"
  }, /*#__PURE__*/React.createElement(IconTrash, {
    size: 15
  })))))))));
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
  const deptSectionEntries = sections.map((s, i) => ({
    s,
    i
  })).filter(({
    s
  }) => s.requiredSpecialization === spec);
  let facSlot = {},
    roomSlot = {};
  if (result) {
    result.genes.forEach(g => {
      if (g.facultyId === -1) return;
      const fk = g.facultyId + "-" + g.slotId,
        rk = g.roomId + "-" + g.slotId;
      facSlot[fk] = (facSlot[fk] || 0) + 1;
      if (g.roomId !== E.ONLINE_ROOM_ID) roomSlot[rk] = (roomSlot[rk] || 0) + 1; // online classes share no room
    });
  }
  let totalAssigned = 0,
    totalCapacity = 0,
    overloads = 0,
    underloads = 0,
    conflicts = 0;
  const facultyStats = deptFaculty.map(f => {
    totalCapacity += f.maxUnits;
    let assigned = 0;
    if (result) result.genes.forEach((g, i) => {
      if (g.facultyId === f.id) assigned += sections[i].units;
    });
    totalAssigned += assigned;
    // Status comes from the shared loadStatusFor() so Departments matches every other page.
    const st = loadStatusFor(f, sections, result, faculty);
    if (st.label === "Overloaded") overloads++;
    if (st.label === "Underloaded") underloads++;
    return {
      faculty: f,
      assigned,
      pct: st.pct,
      status: st.label,
      color: st.color,
      reason: st.reason
    };
  });
  if (result) {
    deptSectionEntries.forEach(({
      s,
      i
    }) => {
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
  const loadPct = totalCapacity > 0 ? Math.round(totalAssigned / totalCapacity * 100) : 0;
  return {
    deptFaculty,
    deptSections: deptSectionEntries.map(d => d.s),
    facultyStats,
    totalAssigned,
    totalCapacity,
    loadPct,
    overloads,
    underloads,
    conflicts,
    noQualifiedFaculty
  };
}

// subjectAreasOf(faculty, sections): the school's subject areas (each one a "department"),
// taken from the data itself — every teacher's areas and every subject's area — in A–Z order.
function subjectAreasOf(faculty, sections) {
  return Array.from(new Set([...faculty.flatMap(f => f.specializations || []), ...sections.map(s => s.requiredSpecialization)])).filter(Boolean).sort((a, b) => a.localeCompare(b));
}

// computeAllDepartments(faculty, sections, result)
// Runs computeDepartmentStats for every subject area and turns the numbers
// into a list of human-readable issues. Shared by the Departments page and
// the Admin/Chair overviews so they always report the same issues.
function computeAllDepartments(faculty, sections, result) {
  const allSpecs = subjectAreasOf(faculty, sections);
  const deptStats = allSpecs.map(spec => ({
    spec,
    stats: computeDepartmentStats(spec, faculty, sections, result)
  }));
  const avgLoadPct = deptStats.length ? Math.round(deptStats.reduce((s, d) => s + d.stats.loadPct, 0) / deptStats.length) : 0;
  const issues = [];
  deptStats.forEach(({
    spec,
    stats
  }) => {
    if (stats.noQualifiedFaculty) issues.push({
      spec,
      severity: "high",
      text: "No qualified faculty available for " + stats.deptSections.length + " section(s) in " + spec + "."
    });
    if (stats.overloads > 0) issues.push({
      spec,
      severity: "high",
      text: stats.overloads + " faculty member(s) in " + spec + " are overloaded beyond their maximum units."
    });
    if (stats.conflicts > 0) issues.push({
      spec,
      severity: "medium",
      text: stats.conflicts + " section(s) in " + spec + " have an unresolved scheduling conflict."
    });
  });
  return {
    allSpecs,
    deptStats,
    avgLoadPct,
    issues
  };
}

// DepartmentsPage: summary cards, the "Issues Requiring Attention" box, and a
// table where clicking a row expands it (the `expanded` object remembers
// which rows are open) to show a workload chart and per-faculty statuses.
function DepartmentsPage({
  faculty,
  sections,
  result
}) {
  const [expanded, setExpanded] = useState({});
  const {
    allSpecs,
    deptStats,
    avgLoadPct,
    issues
  } = computeAllDepartments(faculty, sections, result);
  const totalFaculty = faculty.length;
  function toggle(spec) {
    setExpanded(prev => ({
      ...prev,
      [spec]: !prev[spec]
    }));
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 md:grid-cols-4 gap-4"
  }, /*#__PURE__*/React.createElement(StatCard, {
    label: "Departments",
    value: allSpecs.length
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Total Faculty",
    value: totalFaculty
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Average Teaching Load",
    value: result ? avgLoadPct + "%" : "—",
    color: result && avgLoadPct > 100 ? "#c0392b" : undefined
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Open Issues",
    value: issues.length,
    color: issues.length > 0 ? "#c0392b" : "#047857"
  })), issues.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "bg-orange-50 border border-orange-100 rounded-2xl p-5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 mb-3"
  }, /*#__PURE__*/React.createElement(IconAlertCircle, {
    size: 18,
    className: "text-orange-700"
  }), /*#__PURE__*/React.createElement("h3", {
    className: "font-semibold text-slate-900 text-sm"
  }, "Issues Requiring Attention")), /*#__PURE__*/React.createElement("ul", {
    className: "space-y-1.5"
  }, issues.map((issue, idx) => /*#__PURE__*/React.createElement("li", {
    key: idx,
    className: "text-sm text-orange-800 flex items-start gap-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "mt-1.5 w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0"
  }), issue.text)))), issues.length === 0 && result && /*#__PURE__*/React.createElement("div", {
    className: "bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-2"
  }, /*#__PURE__*/React.createElement(IconCheckCircle, {
    size: 18,
    className: "text-emerald-700"
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-sm text-emerald-800 font-medium"
  }, "No department issues detected in the current schedule.")), /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
  }, /*#__PURE__*/React.createElement("div", {
    className: "px-6 py-4 border-b border-slate-100"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "font-semibold text-slate-900"
  }, "Departments (by specialization)"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-400 mt-0.5"
  }, "Click a specialization area to view detailed workload and issues.")), /*#__PURE__*/React.createElement("div", {
    className: "overflow-x-auto"
  }, /*#__PURE__*/React.createElement("table", {
    className: "w-full text-sm"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
    className: "text-left text-slate-400 text-xs border-b border-slate-100"
  }, /*#__PURE__*/React.createElement("th", {
    className: "px-6 py-3 font-medium"
  }, "Specialization Area"), /*#__PURE__*/React.createElement("th", {
    className: "px-6 py-3 font-medium"
  }, "Faculty"), /*#__PURE__*/React.createElement("th", {
    className: "px-6 py-3 font-medium"
  }, "Sections"), /*#__PURE__*/React.createElement("th", {
    className: "px-6 py-3 font-medium"
  }, "Teaching Load"), /*#__PURE__*/React.createElement("th", {
    className: "px-6 py-3 font-medium"
  }, "Overloads"), /*#__PURE__*/React.createElement("th", {
    className: "px-6 py-3 font-medium"
  }, "Conflicts"), /*#__PURE__*/React.createElement("th", {
    className: "px-6 py-3 font-medium"
  }))), /*#__PURE__*/React.createElement("tbody", null, deptStats.map(({
    spec,
    stats
  }) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: spec
  }, /*#__PURE__*/React.createElement("tr", {
    onClick: () => toggle(spec),
    className: "border-b border-slate-50 hover:bg-slate-50/50 cursor-pointer"
  }, /*#__PURE__*/React.createElement("td", {
    className: "px-6 py-3 font-medium text-slate-900 flex items-center gap-2"
  }, /*#__PURE__*/React.createElement(IconChevronDown, {
    size: 14,
    className: "text-slate-400 transition-transform " + (expanded[spec] ? "rotate-180" : "")
  }), spec), /*#__PURE__*/React.createElement("td", {
    className: "px-6 py-3 text-slate-500"
  }, stats.deptFaculty.length), /*#__PURE__*/React.createElement("td", {
    className: "px-6 py-3 text-slate-500"
  }, stats.deptSections.length), /*#__PURE__*/React.createElement("td", {
    className: "px-6 py-3 text-slate-500"
  }, result ? stats.loadPct + "%" : "—"), /*#__PURE__*/React.createElement("td", {
    className: "px-6 py-3"
  }, stats.overloads > 0 ? /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-medium px-2 py-1 rounded-full text-rose-700 bg-rose-50"
  }, stats.overloads, " overloaded") : /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-medium px-2 py-1 rounded-full text-slate-400 bg-slate-50"
  }, "\u2014")), /*#__PURE__*/React.createElement("td", {
    className: "px-6 py-3"
  }, stats.conflicts > 0 ? /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-medium px-2 py-1 rounded-full text-rose-700 bg-rose-50"
  }, stats.conflicts) : /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-medium px-2 py-1 rounded-full text-emerald-700 bg-emerald-50"
  }, "0")), /*#__PURE__*/React.createElement("td", {
    className: "px-6 py-3 text-right text-xs text-slate-400"
  }, expanded[spec] ? "Hide" : "Details")), expanded[spec] && /*#__PURE__*/React.createElement("tr", {
    className: "bg-slate-50/60"
  }, /*#__PURE__*/React.createElement("td", {
    colSpan: 7,
    className: "px-6 py-5"
  }, stats.deptFaculty.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "text-sm text-slate-500"
  }, "No faculty members currently list ", spec, " as a specialization.") : /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h4", {
    className: "text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2"
  }, "Workload Distribution"), /*#__PURE__*/React.createElement(BarChart, {
    data: stats.facultyStats.map(fs => ({
      label: firstName(fs.faculty.name),
      value: fs.assigned
    })),
    colorFn: (d, i) => "#1e3a8a"
  })), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 sm:grid-cols-2 gap-2"
  }, stats.facultyStats.map(fs => {
    const badgeColor = fs.color; // same colours as every other page
    return /*#__PURE__*/React.createElement("div", {
      key: fs.faculty.id,
      className: "flex items-center justify-between bg-white border border-slate-100 rounded-lg px-3 py-2"
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      className: "text-sm font-medium text-slate-900"
    }, fs.faculty.name), /*#__PURE__*/React.createElement("div", {
      className: "text-xs text-slate-400"
    }, fs.assigned, "/", fs.faculty.maxUnits, " units (", fs.pct, "%)")), /*#__PURE__*/React.createElement("span", {
      title: fs.reason,
      className: "text-xs font-medium px-2 py-1 rounded-full " + badgeColor
    }, fs.status));
  }))))))))))));
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
function WorkloadPage({
  faculty,
  sections,
  result,
  slotById,
  roomById
}) {
  const [showRules, setShowRules] = useState(false);
  const [expanded, setExpanded] = useState({}); // { facultyId: true } for rows that are open
  const cut = LOAD_RULES.nearCapacityPct;

  // Status for every teacher, from the shared rule.
  const rows = faculty.map(f => ({
    f,
    st: loadStatusFor(f, sections, result, faculty)
  }));

  // Group numbers. Teachers with a maximum of 0 are left out of the averages
  // (a load % can't be calculated for them).
  const measurable = rows.filter(r => r.f.maxUnits > 0);
  const avgPct = result && measurable.length ? Math.round(measurable.reduce((a, r) => a + r.st.pct, 0) / measurable.length) : null;
  const totalAssigned = rows.reduce((a, r) => a + r.st.assigned, 0);
  const totalCapacity = faculty.reduce((a, f) => a + Math.max(0, f.maxUnits), 0);
  const byPct = measurable.slice().sort((x, y) => y.st.pct - x.st.pct);
  const highest = result && byPct.length ? byPct[0] : null;
  const lowest = result && byPct.length ? byPct[byPct.length - 1] : null;
  const counts = {
    "Overloaded": 0,
    "Near capacity": 0,
    "Balanced": 0,
    "Light load": 0,
    "Underloaded": 0
  };
  const avgUnitsNow = averageUnits(faculty, sections, result); // for the Light load explanation
  const lightBelow = avgUnitsNow * LOAD_RULES.lightLoadShare;
  if (result) rows.forEach(r => {
    if (counts[r.st.label] != null) counts[r.st.label]++;
  });

  // Example ranges for a 21-unit maximum, CALCULATED from the rule (not typed in),
  // so they stay correct if the cutoff is ever changed.
  const exMax = 21;
  let lastBalanced = 0;
  for (let u = 1; u <= exMax; u++) if (Math.round(u / exMax * 100) < cut) lastBalanced = u;

  // The classes one teacher teaches, in weekly order.
  function classesOf(fid) {
    if (!result) return [];
    return result.genes.map((g, i) => ({
      g,
      sec: sections[i]
    })).filter(x => x.sec && x.g.facultyId === fid && x.g.slotId >= 0).sort((a, b) => a.g.slotId - b.g.slotId);
  }
  const barColor = {
    "Overloaded": "bg-rose-500",
    "Near capacity": "bg-orange-400",
    "Balanced": "bg-emerald-500",
    "Light load": "bg-blue-400",
    "Underloaded": "bg-slate-300",
    "No assignment yet": "bg-slate-200"
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-2xl shadow-sm border border-slate-100"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowRules(v => !v),
    "aria-expanded": showRules,
    className: "w-full flex items-center justify-between px-5 py-4 text-left"
  }, /*#__PURE__*/React.createElement("span", {
    className: "flex items-center gap-2 font-semibold text-slate-900 text-sm"
  }, /*#__PURE__*/React.createElement(IconAlertCircle, {
    size: 16,
    className: "text-blue-600"
  }), " How is load status calculated?"), /*#__PURE__*/React.createElement(IconChevronDown, {
    size: 16,
    className: "text-slate-400 transition-transform " + (showRules ? "rotate-180" : "")
  })), showRules && /*#__PURE__*/React.createElement("div", {
    className: "px-5 pb-5 text-sm text-slate-600 space-y-3 border-t border-slate-100 pt-4"
  }, /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("span", {
    className: "font-semibold text-slate-800"
  }, "Load %"), " = assigned units \xF7 the teacher's own maximum units \xD7 100, rounded to a whole number. ", /*#__PURE__*/React.createElement("span", {
    className: "font-semibold text-slate-800"
  }, "Assigned units"), " are the units of the classes the teacher has in the current schedule. Classes you removed by hand don't count."), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "font-semibold text-slate-800 mb-1"
  }, "The rules, checked in this order:"), /*#__PURE__*/React.createElement("ol", {
    className: "list-decimal pl-5 space-y-0.5"
  }, /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("span", {
    className: "font-medium text-rose-700"
  }, "Overloaded"), ": more units than the teacher's maximum."), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("span", {
    className: "font-medium text-orange-700"
  }, "Near capacity"), ": load is ", cut, "% or more (but not over the maximum)."), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("span", {
    className: "font-medium text-slate-600"
  }, "Underloaded"), ": 0 units, no classes in the current schedule."), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("span", {
    className: "font-medium text-blue-800"
  }, "Light load"), ": fewer than half the ", /*#__PURE__*/React.createElement("span", {
    className: "font-semibold"
  }, "average units per teacher"), " in this schedule", result ? " (now " + avgUnitsNow.toFixed(1) + " units per teacher, so below " + lightBelow.toFixed(1) + " units)" : "", ". This one compares the teacher with colleagues."), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("span", {
    className: "font-medium text-emerald-700"
  }, "Balanced"), ": everything else: below ", cut, "% of their own maximum and at least half the average load."))), /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("span", {
    className: "font-semibold text-slate-800"
  }, "Example, ", exMax, "-unit maximum:"), " 0 units Underloaded \xB7 1\u2013", lastBalanced, " Balanced or Light load (depending on the average) \xB7 ", lastBalanced + 1, "\u2013", exMax, " Near capacity \xB7 ", exMax + 1, " or more Overloaded."), /*#__PURE__*/React.createElement("div", {
    className: "bg-slate-50 rounded-lg p-3 space-y-1.5 text-xs text-slate-600"
  }, /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("span", {
    className: "font-semibold"
  }, "Overloaded and Near capacity compare a teacher with their own maximum; Light load compares them with colleagues."), " A teacher can still be Balanced at 15% if everyone's load is low. Use the ", /*#__PURE__*/React.createElement("span", {
    className: "font-semibold"
  }, "vs. average"), " column and the ", /*#__PURE__*/React.createElement("span", {
    className: "font-semibold"
  }, "Load gap"), " card for exact comparisons."), /*#__PURE__*/React.createElement("p", null, "The ", cut, "% cutoff is a setting of this prototype, not a CHED or school rule."), /*#__PURE__*/React.createElement("p", null, "When generating a schedule, the AI tries to spread teaching units evenly across all teachers. Light load uses that same measure (units compared with the average), so it shows where that evening-out could not reach a teacher, usually because few subjects match their specializations."), /*#__PURE__*/React.createElement("p", null, "Only teaching units are counted. Research, extension and administrative load are not included yet.")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "font-semibold text-slate-800 mb-1"
  }, "Why can a teacher's load be low (for example 3 of 18)?"), /*#__PURE__*/React.createElement("ul", {
    className: "list-disc pl-5 space-y-0.5"
  }, /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("span", {
    className: "font-medium"
  }, "Few subjects they can teach."), " A teacher can only get subjects that match their specializations. If only one or two subjects match, their load stays small however the AI arranges things. Click a teacher to see how many subjects they qualify for."), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("span", {
    className: "font-medium"
  }, "Little teaching to share."), " ", result ? "This schedule has " + totalAssigned + " units of classes for " + totalCapacity + " units of teacher capacity, about " + (faculty.length ? (totalAssigned / faculty.length).toFixed(1) : "0") + " units per teacher on average. When demand is low, most teachers are well below their maximum." : "When there is less teaching than teacher capacity, most teachers are well below their maximum."), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("span", {
    className: "font-medium"
  }, "How the AI balances."), " It tries to make teaching units as even as possible across all teachers, but only among teachers who are qualified and available, and it also weighs preferred days and room fit. It never gives a subject to an unqualified teacher just to even things out."))))), /*#__PURE__*/React.createElement("section", {
    className: "grid grid-cols-2 md:grid-cols-5 gap-4"
  }, /*#__PURE__*/React.createElement(StatCard, {
    label: "Overloaded",
    value: result ? counts["Overloaded"] : "—",
    color: result && counts["Overloaded"] ? "#e11d48" : undefined
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Near capacity",
    value: result ? counts["Near capacity"] : "—",
    color: result && counts["Near capacity"] ? "#c2410c" : undefined
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Balanced",
    value: result ? counts["Balanced"] : "—",
    color: result ? "#047857" : undefined
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Light load",
    value: result ? counts["Light load"] : "—",
    color: result && counts["Light load"] ? "#1e40af" : undefined
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Underloaded",
    value: result ? counts["Underloaded"] : "—"
  })), /*#__PURE__*/React.createElement("section", {
    className: "grid grid-cols-1 sm:grid-cols-3 gap-4"
  }, /*#__PURE__*/React.createElement(StatCard, {
    label: "Units assigned / capacity",
    value: result ? totalAssigned + " / " + totalCapacity : "—",
    sub: result && totalCapacity ? Math.round(totalAssigned / totalCapacity * 100) + "% of all teachers' maximum units" : undefined
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Average load",
    value: avgPct != null ? avgPct + "%" : "—",
    sub: result ? "across " + measurable.length + " teachers" : undefined
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Load gap (highest \u2212 lowest)",
    value: highest ? highest.st.pct - lowest.st.pct + " pts" : "—",
    sub: highest ? "Highest: " + highest.f.name + " " + highest.st.pct + "% · Lowest: " + lowest.f.name + " " + lowest.st.pct + "%" : undefined
  })), /*#__PURE__*/React.createElement(TableShell, {
    title: "Academic Workload Management"
  }, /*#__PURE__*/React.createElement("div", {
    className: "overflow-x-auto"
  }, /*#__PURE__*/React.createElement("table", {
    className: "w-full text-sm"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
    className: "text-left text-slate-400 text-xs border-b border-slate-100"
  }, /*#__PURE__*/React.createElement("th", {
    className: "px-6 py-3 font-medium"
  }, "Faculty"), /*#__PURE__*/React.createElement("th", {
    className: "px-6 py-3 font-medium"
  }, "Assigned Units"), /*#__PURE__*/React.createElement("th", {
    className: "px-6 py-3 font-medium"
  }, "Max Units"), /*#__PURE__*/React.createElement("th", {
    className: "px-6 py-3 font-medium"
  }, "Load %"), /*#__PURE__*/React.createElement("th", {
    className: "px-6 py-3 font-medium"
  }, "vs. average"), /*#__PURE__*/React.createElement("th", {
    className: "px-6 py-3 font-medium"
  }, "Load Status"))), /*#__PURE__*/React.createElement("tbody", null, rows.map(({
    f,
    st
  }) => {
    const open = !!expanded[f.id];
    const pctText = f.maxUnits > 0 ? st.pct + "%" : "—";
    // How far this teacher is from the group's average load, in percentage points.
    const diff = avgPct != null && f.maxUnits > 0 ? st.pct - avgPct : null;
    const list = open ? classesOf(f.id) : [];
    return /*#__PURE__*/React.createElement(React.Fragment, {
      key: f.id
    }, /*#__PURE__*/React.createElement("tr", {
      onClick: () => setExpanded(prev => ({
        ...prev,
        [f.id]: !prev[f.id]
      })),
      className: "border-b border-slate-50 hover:bg-slate-50/50 cursor-pointer"
    }, /*#__PURE__*/React.createElement("td", {
      className: "px-6 py-3 font-medium text-slate-900"
    }, /*#__PURE__*/React.createElement("span", {
      className: "flex items-center gap-2"
    }, /*#__PURE__*/React.createElement(IconChevronDown, {
      size: 14,
      className: "text-slate-400 shrink-0 transition-transform " + (open ? "rotate-180" : "")
    }), f.name)), /*#__PURE__*/React.createElement("td", {
      className: "px-6 py-3 text-slate-500"
    }, st.assigned), /*#__PURE__*/React.createElement("td", {
      className: "px-6 py-3 text-slate-500"
    }, f.maxUnits), /*#__PURE__*/React.createElement("td", {
      className: "px-6 py-3"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-2 min-w-[140px]"
    }, /*#__PURE__*/React.createElement("div", {
      className: "relative h-2 w-24 rounded-full bg-slate-100 overflow-hidden"
    }, /*#__PURE__*/React.createElement("div", {
      className: "absolute inset-y-0 left-0 " + barColor[st.label],
      style: {
        width: Math.min(100, f.maxUnits > 0 ? st.pct : 0) + "%"
      }
    }), /*#__PURE__*/React.createElement("div", {
      className: "absolute inset-y-0 w-0.5 bg-slate-500",
      style: {
        left: cut + "%"
      },
      title: cut + "% cutoff"
    })), /*#__PURE__*/React.createElement("span", {
      className: "text-xs text-slate-600 w-10"
    }, pctText))), /*#__PURE__*/React.createElement("td", {
      className: "px-6 py-3 text-xs font-medium " + (diff == null ? "text-slate-400" : diff > 0 ? "text-rose-700" : diff < 0 ? "text-blue-600" : "text-slate-500")
    }, diff == null ? "—" : diff > 0 ? "+" + diff + " pts" : diff < 0 ? "−" + Math.abs(diff) + " pts" : "±0 pts"), /*#__PURE__*/React.createElement("td", {
      className: "px-6 py-3"
    }, /*#__PURE__*/React.createElement("span", {
      title: st.reason,
      className: "text-xs font-medium px-2 py-1 rounded-full " + st.color
    }, st.label))), open && /*#__PURE__*/React.createElement("tr", {
      className: "bg-slate-50/60"
    }, /*#__PURE__*/React.createElement("td", {
      colSpan: 6,
      className: "px-6 py-4"
    }, /*#__PURE__*/React.createElement("div", {
      className: "text-xs text-slate-600 mb-1"
    }, /*#__PURE__*/React.createElement("span", {
      className: "font-semibold text-slate-800"
    }, "Why ", st.label, ":"), " ", st.reason), (() => {
      // How much teaching this teacher COULD get: subjects matching their specializations.
      const canTeach = sections.filter(sec => f.specializations.includes(sec.requiredSpecialization));
      const canUnits = canTeach.reduce((a, sec) => a + sec.units, 0);
      const avgUnits = faculty.length ? totalAssigned / faculty.length : 0;
      return /*#__PURE__*/React.createElement("div", {
        className: "text-xs text-slate-600 mb-2"
      }, /*#__PURE__*/React.createElement("span", {
        className: "font-semibold text-slate-800"
      }, "Can teach:"), " ", canTeach.length, " of ", sections.length, " subjects (", canUnits, " units in total), from their specializations: ", f.specializations.join(", ") || "none", ".", result && /*#__PURE__*/React.createElement(React.Fragment, null, " Average per teacher in this schedule: ", avgUnits.toFixed(1), " units."), result && canUnits < avgUnits && /*#__PURE__*/React.createElement("span", {
        className: "text-orange-700"
      }, " Even with every subject they qualify for, they would stay below the average."));
    })(), list.length === 0 ? /*#__PURE__*/React.createElement("div", {
      className: "text-sm text-slate-400"
    }, result ? "No classes in the current schedule." : "Generate a schedule to see this teacher's classes.") : /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("ul", {
      className: "divide-y divide-slate-100 bg-white border border-slate-100 rounded-lg"
    }, list.map(({
      g,
      sec
    }) => {
      const slot = slotById[g.slotId];
      return /*#__PURE__*/React.createElement("li", {
        key: sec.id,
        className: "px-3 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-sm"
      }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("span", {
        className: "font-medium text-slate-900"
      }, sec.subjectCode), " ", /*#__PURE__*/React.createElement("span", {
        className: "text-slate-500"
      }, sec.subjectName, " \xB7 ", sec.sectionName)), /*#__PURE__*/React.createElement("span", {
        className: "text-xs text-slate-500 whitespace-nowrap"
      }, slot ? describeSlots([g.slotId], slotById) + " (" + slot.label.split(" ")[1] + ")" : "—", " \xB7 ", roomLabel(g.roomId, roomById), " \xB7 ", /*#__PURE__*/React.createElement("span", {
        className: "font-semibold text-slate-700"
      }, sec.units, " units")));
    })), /*#__PURE__*/React.createElement("div", {
      className: "text-xs text-slate-600 mt-2"
    }, "Total: ", /*#__PURE__*/React.createElement("span", {
      className: "font-semibold"
    }, list.reduce((a, x) => a + x.sec.units, 0), " units"), " across ", list.length, " class", list.length === 1 ? "" : "es", ", out of a maximum of ", f.maxUnits, ".")))));
  })))), !result && /*#__PURE__*/React.createElement("div", {
    className: "px-6 py-4 text-sm text-slate-400"
  }, "Generate a schedule to see assigned units per faculty member."), result && /*#__PURE__*/React.createElement("div", {
    className: "px-6 py-3 text-xs text-slate-400 border-t border-slate-50"
  }, "Click a teacher to see their classes. Hover a status to see why.")));
}

// CurriculumToggle: the checkbox that turns curriculum-aware scheduling on/off.
function CurriculumToggle({
  curriculumAware,
  setCurriculumAware
}) {
  return /*#__PURE__*/React.createElement("label", {
    className: "flex items-center gap-2 text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 cursor-pointer"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: curriculumAware,
    onChange: e => setCurriculumAware(e.target.checked),
    className: "accent-amber-500"
  }), /*#__PURE__*/React.createElement("span", null, "Use curriculum (avoid overlaps within the same program, year level & semester)"));
}

// RegenerationBanner: shown when something (an approved availability change,
// an ended leave, a new subject, a new fixed time) means the schedule should
// be updated.
//   "Update affected classes" — moves ONLY the classes that now break a rule
//                               (recommended; everything else stays put).
//   "Full regenerate"         — builds a brand-new schedule from scratch.
// Faculty are only told that an update is coming.
function RegenerationBanner({
  result,
  canEdit,
  generating,
  onGenerate,
  onUpdate
}) {
  // Also shown when the live conflict count is above zero but nothing flagged a change
  // (for example a teacher or room was edited directly), so the fix is one click away.
  const flagged = !!(result && result.needsRegeneration);
  if (!result || !flagged && result.violations.total === 0) return null;
  const n = flagged ? (result.needsRegeneration.triggers || []).length : 0;
  // Subjects that cannot be placed at all (no qualified teacher / no big-enough lab) are not
  // fixed by an update, so when they are the ONLY problem the banner says what to change instead.
  const impossible = result.violations.unplaceable || 0;
  const onlyImpossible = !flagged && impossible > 0 && result.violations.total === impossible;
  return /*#__PURE__*/React.createElement("div", {
    className: "no-print bg-orange-50 border border-orange-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-start gap-2 text-sm text-orange-900"
  }, /*#__PURE__*/React.createElement(IconAlertCircle, {
    size: 18,
    className: "text-orange-700 shrink-0 mt-0.5"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "font-semibold"
  }, flagged ? "Schedule needs an update" : onlyImpossible ? "Some subjects cannot be scheduled" : "Conflicts found in this schedule"), /*#__PURE__*/React.createElement("div", null, flagged ? result.needsRegeneration.reason + (n > 1 ? " (+" + (n - 1) + " earlier change" + (n > 2 ? "s" : "") + ")" : "") : onlyImpossible ? impossible + " subject(s) have no qualified teacher or no laboratory big enough. Conflict Detection lists them and what to change." : result.violations.total + " rule violation(s) in this schedule. Update affected classes moves only the classes involved."))), onlyImpossible ? null : canEdit ? /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col items-stretch sm:items-end gap-1.5 shrink-0"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onUpdate,
    disabled: generating,
    className: "flex items-center justify-center gap-1.5 bg-orange-700 hover:bg-orange-800 text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-60"
  }, /*#__PURE__*/React.createElement(IconRefresh, {
    size: 14
  }), " ", generating ? "Updating..." : "Update affected classes"), /*#__PURE__*/React.createElement("button", {
    onClick: onGenerate,
    disabled: generating,
    className: "text-xs text-orange-800 underline"
  }, "or full regenerate (rebuilds everything)")) : /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-orange-800 shrink-0"
  }, "Your schedule will be updated soon."));
}

// UpdateSummary: after an "Update affected classes", lists exactly which
// classes moved (from → to), how many stayed put, and confirms that every
// approved blocked-times request is respected.
function UpdateSummary({
  result,
  sections,
  facultyById,
  slotById
}) {
  const u = result.updateSummary;
  if (result.kind !== "update" || !u) return null;
  const where = g => {
    if (!g || g.slotId === -1 || g.isNew) return "not scheduled";
    const f = facultyById[g.facultyId];
    return describeSlots([g.slotId], slotById) + " · " + (f ? f.name : "—");
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "no-print bg-white rounded-2xl p-5 shadow-sm border border-slate-100"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap items-center gap-2 mb-3"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "font-semibold text-slate-900 text-sm"
  }, "What changed in this update"), /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700"
  }, u.moved, " moved"), /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700"
  }, u.unchanged, " unchanged"), u.shifted > 0 && /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-slate-500"
  }, "(", u.shifted, " shifted to make room)")), u.honoured.map((h, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "text-xs rounded-lg px-3 py-1.5 mb-2 " + (h.clashes ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700")
  }, h.clashes ? "⚠ " + h.name + " still has " + h.clashes + " class(es) in " + h.slots + " — try Full regenerate." : "✓ " + h.name + "'s request is respected — no classes in " + h.slots + ".", !h.clashes && h.prefSlots && h.moved > 0 && /*#__PURE__*/React.createElement("div", {
    className: "mt-0.5"
  }, h.inPref === h.moved ? "All " + h.moved + " moved class(es) went to the preferred times (" + h.prefSlots + ")." : h.inPref + " of " + h.moved + " moved class(es) went to the preferred times (" + h.prefSlots + "). The rest went elsewhere, because those times were taken by other classes or rooms."))), /*#__PURE__*/React.createElement("ul", {
    className: "divide-y divide-slate-50"
  }, u.changes.map(c => {
    const sec = sections[c.index];
    if (!sec) return null;
    return /*#__PURE__*/React.createElement("li", {
      key: c.index,
      className: "py-2 text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1"
    }, /*#__PURE__*/React.createElement("span", {
      className: "font-medium text-slate-900"
    }, sec.subjectCode, " \xB7 ", sec.sectionName), /*#__PURE__*/React.createElement("span", {
      className: "text-xs text-slate-500"
    }, where(c.from), " ", /*#__PURE__*/React.createElement("span", {
      className: "text-slate-400"
    }, "\u2192"), " ", /*#__PURE__*/React.createElement("span", {
      className: "text-slate-800 font-medium"
    }, where(c.to))));
  })));
}

// MyAvailabilitySection: the Faculty member's availability & leave area,
// shown inside "My Schedule". It lists the times they are currently blocked,
// a button that opens the weekly picker, and the status of every request they filed.
function MyAvailabilitySection({
  me,
  leaveRequests,
  slotById,
  onNewRequest
}) {
  if (!me) return null;
  const mine = leaveRequests.filter(r => r.facultyId === me.id);
  const statusCls = st => st === "Approved" ? "text-emerald-700 bg-emerald-50" : st === "Denied" ? "text-rose-700 bg-rose-50" : st === "Ended" ? "text-slate-600 bg-slate-100" : "text-orange-700 bg-orange-50";
  return /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sm:p-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
    className: "font-semibold text-slate-900 text-sm"
  }, "My Availability & Leave"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-500 mt-0.5"
  }, "Currently unavailable: ", /*#__PURE__*/React.createElement("span", {
    className: "font-medium text-slate-700"
  }, (me.unavailableSlotIds || []).length ? describeSlots(me.unavailableSlotIds, slotById) : "none"))), /*#__PURE__*/React.createElement("button", {
    onClick: () => onNewRequest(me.id),
    className: "shrink-0 flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-[#0b1d4a] text-sm font-medium px-3.5 py-2 rounded-lg"
  }, /*#__PURE__*/React.createElement(IconPlus, {
    size: 15
  }), " Request Availability Change / Leave")), mine.length === 0 ? /*#__PURE__*/React.createElement(EmptyNote, null, "You haven't submitted any requests.") : /*#__PURE__*/React.createElement("ul", {
    className: "divide-y divide-slate-50"
  }, mine.map(r => /*#__PURE__*/React.createElement("li", {
    key: r.id,
    className: "py-2.5 flex items-start justify-between gap-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "min-w-0"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-sm font-medium text-slate-900"
  }, r.type, r.dateFrom && /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-normal text-slate-500"
  }, " \xB7 ", r.dateFrom, r.dateTo ? " to " + r.dateTo : "")), /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-slate-600"
  }, requestTimesText(r, slotById)), /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-slate-400"
  }, r.description)), /*#__PURE__*/React.createElement("span", {
    className: "shrink-0 text-xs font-medium px-2 py-0.5 rounded-full " + statusCls(r.status)
  }, r.status)))));
}

// SchedulesPage: where schedules are generated, reviewed, approved, and edited.
//   • Approval panel (Approve/Reject for Admin & Chair, Export CSV, Print/PDF)
//   • Convergence chart for the latest run
//   • "Weekly Grid": builds grid[day][period] from the genes, then draws it
//   • "By Faculty" / "My Schedule": one person's classes in time order
// Clicking a class opens AssignmentModal (not available to Faculty role).
// For the Faculty role, the person shown is always myFacultyId.
function SchedulesPage({
  result,
  sections,
  facultyById,
  roomById,
  slotById,
  timeSlots,
  generating,
  onGenerate,
  tab,
  setTab,
  role,
  faculty,
  rooms,
  selectedFacultyId,
  setSelectedFacultyId,
  curriculumAware,
  setCurriculumAware,
  onEditAssignment,
  onApprovalDecision,
  myFacultyId,
  leaveRequests,
  onNewRequest,
  onUpdateSchedule
}) {
  // Permissions for this page: faculty can only view; only Admin/Chair approve.
  const canEdit = role !== "faculty";
  const canApprove = role === "admin" || role === "chair";
  const [approvalComment, setApprovalComment] = useState("");
  const [showChart, setShowChart] = useState(true); // "Hide chart" toggle in the convergence card
  const me = faculty.find(f => f.id === myFacultyId) || null; // the signed-in faculty member (Faculty role)

  if (!result) {
    return /*#__PURE__*/React.createElement("div", {
      className: "space-y-5"
    }, role === "faculty" && /*#__PURE__*/React.createElement(MyAvailabilitySection, {
      me: me,
      leaveRequests: leaveRequests,
      slotById: slotById,
      onNewRequest: onNewRequest
    }), /*#__PURE__*/React.createElement("div", {
      className: "bg-white rounded-2xl p-12 shadow-sm border border-slate-100 text-center"
    }, /*#__PURE__*/React.createElement(IconCalendar, {
      size: 40,
      className: "mx-auto text-slate-300 mb-4"
    }), /*#__PURE__*/React.createElement("h3", {
      className: "font-semibold text-slate-900 mb-2"
    }, "No schedule generated yet"), /*#__PURE__*/React.createElement("p", {
      className: "text-sm text-slate-500 mb-5"
    }, "Run the AI Optimization Engine to generate a conflict-free schedule from your current faculty, subjects, and rooms."), canEdit && /*#__PURE__*/React.createElement("div", {
      className: "max-w-md mx-auto mb-5"
    }, /*#__PURE__*/React.createElement(CurriculumToggle, {
      curriculumAware: curriculumAware,
      setCurriculumAware: setCurriculumAware
    })), canEdit && /*#__PURE__*/React.createElement("button", {
      onClick: onGenerate,
      disabled: generating,
      className: "bg-amber-400 hover:bg-amber-300 text-[#0b1d4a] font-medium text-sm px-5 py-2.5 rounded-lg disabled:opacity-60"
    }, generating ? "Generating..." : "Generate Schedule")));
  }
  const facultyList = role === "faculty" ? faculty.filter(f => f.id === myFacultyId) : faculty;
  const activeFacultyId = role === "faculty" ? myFacultyId : selectedFacultyId != null ? selectedFacultyId : facultyList[0]?.id;

  // Build the weekly grid: grid["Mon"][3] = a LIST of every class held Monday
  // period 3. It must be a list: several sections can run at the same time in
  // different rooms (or online). Removed classes (slotId -1) are skipped.
  const grid = {};
  E.DAYS.forEach(d => grid[d] = {});
  result.genes.forEach((g, i) => {
    const slot = slotById[g.slotId];
    if (!slot || g.facultyId === -1) return; // removed or impossible classes have no place in the grid
    (grid[slot.day][slot.period] = grid[slot.day][slot.period] || []).push({
      section: sections[i],
      faculty: facultyById[g.facultyId],
      roomId: g.roomId,
      index: i
    });
  });

  // The grid is drawn in 30-minute rows (7:00 AM, 7:30 AM, ...). A period's classes
  // share one block that covers the period's three rows; a free period stays three
  // separate half-hour cells.
  const rows = E.halfHourRows();
  const rowsPerPeriod = rows.length / E.PERIODS;
  const unscheduledCount = result.violations.unscheduled || 0;
  // Overload is not one of the hard rules the engine fixes, so it is flagged here
  // instead: "Conflict-free" no longer hides a teacher who is over their maximum.
  const overloadedTeachers = faculty.filter(f => assignedUnits(f, sections, result) > f.maxUnits);
  // Classes moved by the last "Update affected classes" get an amber outline in the grid.
  const movedSet = new Set(result.kind === "update" && result.updateSummary ? result.updateSummary.changes.map(c => c.index) : []);
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-5"
  }, /*#__PURE__*/React.createElement(RegenerationBanner, {
    result: result,
    canEdit: canEdit,
    generating: generating,
    onGenerate: onGenerate,
    onUpdate: onUpdateSchedule
  }), /*#__PURE__*/React.createElement(UpdateSummary, {
    result: result,
    sections: sections,
    facultyById: facultyById,
    slotById: slotById
  }), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between flex-wrap gap-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3 flex-wrap"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-sm font-medium px-3 py-1.5 rounded-lg " + (result.feasible ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700")
  }, result.feasible ? "✓ Conflict-free" : "⚠ " + result.violations.total + " conflicts remaining"), overloadedTeachers.length > 0 && /*#__PURE__*/React.createElement("span", {
    className: "text-sm font-medium px-3 py-1.5 rounded-lg bg-orange-50 text-orange-700",
    title: overloadedTeachers.map(f => f.name).join(", ")
  }, "\u26A0 ", overloadedTeachers.length, " teacher", overloadedTeachers.length > 1 ? "s" : "", " over maximum units"), result.curriculumAware && /*#__PURE__*/React.createElement("span", {
    className: "text-sm font-medium px-3 py-1.5 rounded-lg " + (result.curriculumConflicts === 0 ? "bg-blue-50 text-blue-700" : "bg-orange-50 text-orange-700")
  }, "Curriculum: ", result.curriculumConflicts === 0 ? "no overlaps" : result.curriculumConflicts + " overlaps"), unscheduledCount > 0 && /*#__PURE__*/React.createElement("span", {
    className: "text-sm font-medium px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600"
  }, unscheduledCount, " unscheduled (manually removed)"), /*#__PURE__*/React.createElement("span", {
    className: "text-sm text-slate-400"
  }, "Fitness score: ", result.fitness.toFixed(1), " \xB7 ", result.convergence.length, " generations")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, canEdit && /*#__PURE__*/React.createElement(CurriculumToggle, {
    curriculumAware: curriculumAware,
    setCurriculumAware: setCurriculumAware
  }), canEdit && /*#__PURE__*/React.createElement("button", {
    onClick: onGenerate,
    disabled: generating,
    title: "Builds a brand-new schedule from scratch; every class may move.",
    className: "flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium px-3.5 py-2 rounded-lg disabled:opacity-60"
  }, /*#__PURE__*/React.createElement(IconRefresh, {
    size: 14
  }), " ", generating ? "Regenerating..." : "Full Regenerate"))), /*#__PURE__*/React.createElement("div", {
    className: "no-print bg-white rounded-2xl p-5 shadow-sm border border-slate-100"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between flex-wrap gap-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-sm font-semibold text-slate-900"
  }, "Approval Status:"), /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-semibold px-2.5 py-1 rounded-full " + (result.approvalStatus === "Approved" ? "bg-emerald-50 text-emerald-700" : result.approvalStatus === "Rejected" ? "bg-rose-50 text-rose-700" : "bg-orange-50 text-orange-700")
  }, result.approvalStatus || "Pending Review"), result.approvalComment && /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-slate-500 italic"
  }, "\u201C", result.approvalComment, "\u201D")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      const rows = result.genes.map((g, i) => {
        const sec = sections[i],
          fac = facultyById[g.facultyId],
          slot = g.facultyId === -1 ? null : slotById[g.slotId];
        if (!sec) return null; // safety: a gene with no matching subject is skipped
        return [slot ? slot.day : "Unscheduled", slot ? slot.label : "", sec.program || "", sec.subjectCode, sec.subjectName, sec.sectionName, yearLabel(sec.yearLevel), classTypeLabel(sec), fac ? fac.name : "", g.roomId === -1 ? "" : roomLabel(g.roomId, roomById)];
      }).filter(Boolean);
      downloadCSV("timetable.csv", ["Day", "Time", "Program", "Code", "Subject", "Section", "Year Level", "Class Type", "Faculty", "Room"], rows);
    },
    className: "flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium px-3 py-2 rounded-lg"
  }, /*#__PURE__*/React.createElement(IconDownload, {
    size: 15
  }), " Export CSV"), /*#__PURE__*/React.createElement("button", {
    onClick: () => window.print(),
    className: "flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium px-3 py-2 rounded-lg"
  }, /*#__PURE__*/React.createElement(IconPrinter, {
    size: 15
  }), " Print / Save PDF"))), canApprove && (result.approvalStatus || "Pending Review") === "Pending Review" && /*#__PURE__*/React.createElement("div", {
    className: "mt-4 flex flex-col sm:flex-row gap-2"
  }, /*#__PURE__*/React.createElement("input", {
    className: inputCls + " flex-1",
    value: approvalComment,
    onChange: e => setApprovalComment(e.target.value),
    placeholder: "Optional comment for this decision"
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      onApprovalDecision("Approved", approvalComment);
      setApprovalComment("");
    },
    className: "flex items-center justify-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium px-4 py-2 rounded-lg"
  }, /*#__PURE__*/React.createElement(IconThumbsUp, {
    size: 15
  }), " Approve"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      onApprovalDecision("Rejected", approvalComment);
      setApprovalComment("");
    },
    className: "flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
  }, /*#__PURE__*/React.createElement(IconThumbsDown, {
    size: 15
  }), " Reject"))), /*#__PURE__*/React.createElement("div", {
    className: "no-print bg-white rounded-2xl px-5 py-4 shadow-sm border border-slate-100"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap items-center justify-between gap-2 mb-2"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "font-semibold text-slate-900 text-sm"
  }, "GA Convergence ", /*#__PURE__*/React.createElement("span", {
    className: "font-normal text-slate-500"
  }, "\xB7 how the AI improved this schedule")), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap items-center gap-3"
  }, showChart && /*#__PURE__*/React.createElement(ChartLegend, null), /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowChart(v => !v),
    className: "text-xs font-medium text-blue-800 hover:underline"
  }, showChart ? "Hide chart" : "Show chart"))), showChart && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(ConvergenceChart, {
    convergence: result.convergence
  }), /*#__PURE__*/React.createElement(ConvergenceCaption, {
    result: result
  }))), /*#__PURE__*/React.createElement("div", {
    className: "no-print flex items-center justify-between flex-wrap gap-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex gap-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setTab("grid"),
    className: "text-sm font-medium px-4 py-2 rounded-lg " + (tab === "grid" ? "bg-slate-900 text-white" : "bg-white text-slate-600 border border-slate-200")
  }, "Weekly Grid"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setTab("faculty"),
    className: "text-sm font-medium px-4 py-2 rounded-lg " + (tab === "faculty" ? "bg-slate-900 text-white" : "bg-white text-slate-600 border border-slate-200")
  }, role === "faculty" ? "My Schedule" : "By Faculty")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3 text-xs text-slate-400"
  }, /*#__PURE__*/React.createElement("span", {
    className: "flex items-center gap-1"
  }, /*#__PURE__*/React.createElement("span", {
    className: "w-3 h-3 rounded bg-blue-50 border border-blue-100 inline-block"
  }), "Online"), /*#__PURE__*/React.createElement("span", {
    className: "flex items-center gap-1"
  }, /*#__PURE__*/React.createElement("span", {
    className: "w-3 h-3 rounded bg-amber-50 border border-amber-200 inline-block"
  }), "Laboratory"), canEdit && /*#__PURE__*/React.createElement("span", null, "\xB7 Click any class to edit or remove it"))), tab === "grid" && /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-2xl shadow-sm border border-slate-100 overflow-x-auto"
  }, /*#__PURE__*/React.createElement("table", {
    className: "w-full text-xs border-collapse"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    className: "p-2 border border-slate-100 bg-slate-50 w-24"
  }, "Time"), E.CALENDAR_DAYS.map(d => /*#__PURE__*/React.createElement("th", {
    key: d,
    className: "p-2 border border-slate-100 " + (d === "Sun" ? "bg-slate-100 text-slate-400" : "bg-slate-50")
  }, d)))), /*#__PURE__*/React.createElement("tbody", null, rows.map((row, r) => /*#__PURE__*/React.createElement("tr", {
    key: row.minutes
  }, /*#__PURE__*/React.createElement("td", {
    className: "h-8 px-2 py-1 border border-slate-100 whitespace-nowrap align-top " + (row.first ? "text-slate-600 font-medium" : "text-slate-400")
  }, row.label, row.first && /*#__PURE__*/React.createElement("span", {
    className: "ml-1 text-[10px] font-normal text-slate-400"
  }, "P", row.period)), E.CALENDAR_DAYS.map(d => {
    // Sunday: one tall greyed cell spanning the whole day (no classes on Sunday).
    if (d === "Sun") {
      return r === 0 ? /*#__PURE__*/React.createElement("td", {
        key: d,
        rowSpan: rows.length,
        className: "border border-slate-100 bg-slate-50 text-center text-slate-400 min-w-[70px] align-middle"
      }, "No classes") : null;
    }
    const cells = grid[d][row.period] || [];
    if (cells.length === 0) return /*#__PURE__*/React.createElement("td", {
      key: d,
      className: "border border-slate-100 min-w-[140px]"
    }); // a free half hour
    if (!row.first) return null; // covered by the block that starts on the period's first row
    return (
      /*#__PURE__*/
      // h-px lets the inner list use h-full, so the class cards stretch over the
      // whole block and a 1.5-hour class visibly covers its three rows.
      React.createElement("td", {
        key: d,
        rowSpan: rowsPerPeriod,
        className: "h-px p-1.5 border border-slate-100 align-top min-w-[140px]"
      }, /*#__PURE__*/React.createElement("div", {
        className: "h-full flex flex-col gap-1.5"
      }, cells.map(cell => /*#__PURE__*/React.createElement("div", {
        key: cell.index,
        onClick: () => canEdit && onEditAssignment(cell.index, result.genes[cell.index]),
        className: (E.isOnline(cell.section) ? "bg-blue-50 border-blue-100" : "bg-amber-50 border-amber-200") + " flex-1 border rounded-lg p-2 " + (movedSet.has(cell.index) ? "ring-2 ring-orange-400 " : "") + (canEdit ? "cursor-pointer hover:brightness-95 transition" : "")
      }, movedSet.has(cell.index) && /*#__PURE__*/React.createElement("div", {
        className: "text-[10px] font-semibold text-orange-700 uppercase"
      }, "Moved"), /*#__PURE__*/React.createElement("div", {
        className: "font-semibold text-slate-900"
      }, cell.section.subjectCode, " \xB7 ", cell.section.sectionName, cell.section.fixedSlotId != null && /*#__PURE__*/React.createElement("span", {
        title: "Fixed day/period",
        className: "ml-1 text-[10px] text-slate-500"
      }, "\uD83D\uDCCC")), /*#__PURE__*/React.createElement("div", {
        className: "text-slate-500"
      }, cell.faculty ? cell.faculty.name : "—"), /*#__PURE__*/React.createElement("div", {
        className: "text-slate-400"
      }, roomLabel(cell.roomId, roomById))))))
    );
  })))))), tab === "faculty" && role === "faculty" && /*#__PURE__*/React.createElement(MyAvailabilitySection, {
    me: me,
    leaveRequests: leaveRequests,
    slotById: slotById,
    onNewRequest: onNewRequest
  }), tab === "faculty" && /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-2xl shadow-sm border border-slate-100 p-6"
  }, role !== "faculty" && /*#__PURE__*/React.createElement("select", {
    value: activeFacultyId,
    onChange: e => setSelectedFacultyId(Number(e.target.value)),
    className: "border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
  }, facultyList.map(f => /*#__PURE__*/React.createElement("option", {
    key: f.id,
    value: f.id
  }, f.name))), /*#__PURE__*/React.createElement("div", {
    className: "mt-4 space-y-2"
  }, result.genes.map((g, i) => ({
    g,
    i
  })).filter(({
    g
  }) => g.facultyId === activeFacultyId).sort((a, b) => a.g.slotId - b.g.slotId).map(({
    g,
    i
  }) => {
    const slot = slotById[g.slotId],
      sec = sections[i];
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      onClick: () => canEdit && onEditAssignment(i, g),
      className: "flex items-center justify-between border border-slate-100 rounded-lg px-4 py-2.5 " + (canEdit ? "cursor-pointer hover:bg-slate-50 transition-colors" : "")
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      className: "font-medium text-slate-900 text-sm"
    }, sec.subjectCode, " \u2014 ", sec.subjectName), /*#__PURE__*/React.createElement("div", {
      className: "text-xs text-slate-400"
    }, sec.sectionName, " \xB7 ", yearLabel(sec.yearLevel), " \xB7 ", roomLabel(g.roomId, roomById))), /*#__PURE__*/React.createElement("div", {
      className: "text-sm text-slate-500"
    }, slot ? slot.label : "—"));
  }), result.genes.filter(g => g.facultyId === activeFacultyId).length === 0 && /*#__PURE__*/React.createElement("div", {
    className: "text-sm text-slate-400 text-center py-6"
  }, "No sections assigned to this faculty member in the current schedule."))));
}

// HistoryPage: every generated version (newest first). "Best" = highest
// fitness, "Current" = the one in use. Restore makes an older one current.
function HistoryPage({
  history,
  currentId,
  onRestore
}) {
  if (history.length === 0) {
    return /*#__PURE__*/React.createElement("div", {
      className: "bg-white rounded-2xl p-12 shadow-sm border border-slate-100 text-center"
    }, /*#__PURE__*/React.createElement(IconHistory, {
      size: 40,
      className: "mx-auto text-slate-300 mb-4"
    }), /*#__PURE__*/React.createElement("h3", {
      className: "font-semibold text-slate-900 mb-2"
    }, "No schedule versions yet"), /*#__PURE__*/React.createElement("p", {
      className: "text-sm text-slate-500"
    }, "Every time you generate a schedule, a version is saved here so you can compare and restore earlier runs."));
  }
  const best = history.reduce((a, b) => b.fitness > a.fitness ? b : a);
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "font-semibold text-slate-900 mb-1 text-sm"
  }, "Fitness Across Versions"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-400 mb-3"
  }, "Higher is better. Each bar is one generated schedule (oldest to newest)."), /*#__PURE__*/React.createElement(BarChart, {
    data: history.slice().reverse().map((h, i) => ({
      label: "v" + (i + 1),
      value: Math.max(0, Math.round(h.fitness))
    })),
    colorFn: () => "#b7791f"
  })), /*#__PURE__*/React.createElement(TableShell, {
    title: "Schedule History (" + history.length + ")",
    onExport: () => downloadCSV("schedule_history.csv", ["Version", "Type", "Generated", "Feasible", "Conflicts", "Fitness", "Generations", "Curriculum-aware", "Approval"], history.slice().reverse().map((h, i) => ["v" + (i + 1), h.kind === "update" ? "Update" : "Full", new Date(h.generatedAt).toLocaleString(), h.feasible ? "Yes" : "No", h.violations.total, h.fitness.toFixed(1), h.convergence.length, h.curriculumAware ? "Yes" : "No", h.approvalStatus || "Pending Review"]))
  }, /*#__PURE__*/React.createElement("div", {
    className: "overflow-x-auto"
  }, /*#__PURE__*/React.createElement("table", {
    className: "w-full text-sm"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
    className: "text-left text-slate-400 text-xs border-b border-slate-100"
  }, /*#__PURE__*/React.createElement("th", {
    className: "px-6 py-3 font-medium"
  }, "Version"), /*#__PURE__*/React.createElement("th", {
    className: "px-6 py-3 font-medium"
  }, "Type"), /*#__PURE__*/React.createElement("th", {
    className: "px-6 py-3 font-medium"
  }, "Generated"), /*#__PURE__*/React.createElement("th", {
    className: "px-6 py-3 font-medium"
  }, "Conflicts"), /*#__PURE__*/React.createElement("th", {
    className: "px-6 py-3 font-medium"
  }, "Fitness"), /*#__PURE__*/React.createElement("th", {
    className: "px-6 py-3 font-medium"
  }, "Generations"), /*#__PURE__*/React.createElement("th", {
    className: "px-6 py-3 font-medium"
  }, "Curriculum"), /*#__PURE__*/React.createElement("th", {
    className: "px-6 py-3 font-medium"
  }))), /*#__PURE__*/React.createElement("tbody", null, history.map((h, idx) => {
    const versionNum = history.length - idx;
    const isCurrent = h.id === currentId;
    return /*#__PURE__*/React.createElement("tr", {
      key: h.id,
      className: "border-b border-slate-50 " + (isCurrent ? "bg-amber-50/70" : "hover:bg-slate-50/50")
    }, /*#__PURE__*/React.createElement("td", {
      className: "px-6 py-3 font-medium text-slate-900"
    }, "v", versionNum, h.id === best.id && /*#__PURE__*/React.createElement("span", {
      className: "ml-2 text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-full"
    }, "Best"), isCurrent && /*#__PURE__*/React.createElement("span", {
      className: "ml-2 text-[10px] font-semibold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full"
    }, "Current")), /*#__PURE__*/React.createElement("td", {
      className: "px-6 py-3 text-slate-500 whitespace-nowrap"
    }, h.kind === "update" ? "Update (" + (h.updateSummary ? h.updateSummary.moved : 0) + " moved)" : "Full"), /*#__PURE__*/React.createElement("td", {
      className: "px-6 py-3 text-slate-500 whitespace-nowrap"
    }, new Date(h.generatedAt).toLocaleString()), /*#__PURE__*/React.createElement("td", {
      className: "px-6 py-3"
    }, /*#__PURE__*/React.createElement("span", {
      className: "text-xs font-semibold px-2 py-1 rounded-full " + (h.violations.total > 0 ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700")
    }, h.violations.total)), /*#__PURE__*/React.createElement("td", {
      className: "px-6 py-3 text-slate-500"
    }, h.fitness.toFixed(1)), /*#__PURE__*/React.createElement("td", {
      className: "px-6 py-3 text-slate-500"
    }, h.convergence.length), /*#__PURE__*/React.createElement("td", {
      className: "px-6 py-3 text-slate-500"
    }, h.curriculumAware ? "On" : "Off"), /*#__PURE__*/React.createElement("td", {
      className: "px-6 py-3 text-right"
    }, !isCurrent && /*#__PURE__*/React.createElement("button", {
      onClick: () => onRestore(h),
      className: "text-xs font-medium text-blue-800 hover:underline"
    }, "Restore")));
  }))))));
}

// ConflictsPage: the hard-constraint report from countViolations(), one row
// per rule, with a plain-language description.
function ConflictsPage({
  result,
  sections,
  faculty,
  rooms,
  onGenerate,
  generating
}) {
  if (!result) {
    return /*#__PURE__*/React.createElement("div", {
      className: "bg-white rounded-2xl p-12 shadow-sm border border-slate-100 text-center"
    }, /*#__PURE__*/React.createElement(IconAlert, {
      size: 40,
      className: "mx-auto text-slate-300 mb-4"
    }), /*#__PURE__*/React.createElement("h3", {
      className: "font-semibold text-slate-900 mb-2"
    }, "No schedule to check yet"), /*#__PURE__*/React.createElement("p", {
      className: "text-sm text-slate-500 mb-5"
    }, "Generate a schedule first, then this page will show a full conflict breakdown."), /*#__PURE__*/React.createElement("button", {
      onClick: onGenerate,
      disabled: generating,
      className: "bg-amber-400 hover:bg-amber-300 text-[#0b1d4a] font-medium text-sm px-5 py-2.5 rounded-lg disabled:opacity-60"
    }, generating ? "Generating..." : "Generate Schedule"));
  }
  const v = result.violations;
  const rows = [["Faculty double-booking", v.facultyConflicts, "A faculty member assigned to two classes at the same time"], ["Room double-booking", v.roomConflicts, "A room assigned to two classes at the same time"], ["Unqualified assignment", v.unqualified, "Faculty assigned to a subject outside their specialization"], ["Faculty unavailable", v.unavailable, "Faculty scheduled during a declared unavailable time slot"], ["Room type mismatch", v.roomTypeMismatch, "A laboratory class without a lab room, or an online class given a room"], ["Fixed time not respected", v.fixedSlot || 0, "A subject with a fixed day/period is scheduled at a different time"], ["Room capacity exceeded", v.capacityViol, "Enrolled students exceed the assigned room's capacity"], ["Cannot be scheduled", v.unplaceable || 0, "No qualified teacher for the subject, or no laboratory big enough for the class, so no schedule can place it"]];
  // Which subjects cannot be placed, and why, so the user knows what to change.
  const impossible = (sections || []).map((s, i) => ({
    s,
    g: result.genes[i]
  })).filter(({
    s,
    g
  }) => s && (!g || g.facultyId === -1) && !E.canBePlaced(faculty, rooms, s)).map(({
    s
  }) => ({
    s,
    why: E.qualifiedFaculty(faculty, s).length === 0 ? "No teacher has the " + s.requiredSpecialization + " specialization. Add one in Faculty, or change the subject's required specialization." : "No laboratory seats " + s.enrolledStudents + " students. Add a larger lab in Rooms, split the section, or make it an online class."
  }));
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "rounded-2xl p-6 border " + (result.feasible ? "bg-emerald-50 border-emerald-100" : "bg-rose-50 border-rose-100")
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3"
  }, result.feasible ? /*#__PURE__*/React.createElement(IconCheckCircle, {
    size: 24,
    className: "text-emerald-700"
  }) : /*#__PURE__*/React.createElement(IconAlert, {
    size: 24,
    className: "text-rose-700"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "font-semibold text-slate-900"
  }, result.feasible ? "No conflicts detected" : v.total + " conflicts detected"), /*#__PURE__*/React.createElement("div", {
    className: "text-sm text-slate-500"
  }, "Checked across ", rows.length, " constraint categories after ", result.convergence.length, " generations of optimization.")))), impossible.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-2xl p-5 shadow-sm border border-rose-100"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "font-semibold text-slate-900 mb-1"
  }, "Subjects that cannot be scheduled"), /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-slate-500 mb-3"
  }, "Regenerating or updating cannot fix these. Change the data as suggested, then press ", /*#__PURE__*/React.createElement("span", {
    className: "font-medium"
  }, "Update affected classes"), " or ", /*#__PURE__*/React.createElement("span", {
    className: "font-medium"
  }, "Full Regenerate"), "."), /*#__PURE__*/React.createElement("ul", {
    className: "space-y-2"
  }, impossible.map(({
    s,
    why
  }) => /*#__PURE__*/React.createElement("li", {
    key: s.id,
    className: "text-sm bg-rose-50 rounded-lg px-3 py-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "font-medium text-slate-900"
  }, s.subjectCode, " \xB7 ", s.sectionName), /*#__PURE__*/React.createElement("span", {
    className: "text-slate-600"
  }, " \u2014 ", why))))), v.overload > 0 && /*#__PURE__*/React.createElement("div", {
    className: "bg-orange-50 border border-orange-100 rounded-2xl px-5 py-3 text-sm text-orange-800"
  }, /*#__PURE__*/React.createElement("span", {
    className: "font-semibold"
  }, "Warning, not a conflict:"), " ", v.overload, " unit(s) are assigned above teachers' maximum loads. See Workload Management."), /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
  }, /*#__PURE__*/React.createElement("table", {
    className: "w-full text-sm"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
    className: "text-left text-slate-400 text-xs border-b border-slate-100"
  }, /*#__PURE__*/React.createElement("th", {
    className: "px-6 py-3 font-medium"
  }, "Constraint"), /*#__PURE__*/React.createElement("th", {
    className: "px-6 py-3 font-medium"
  }, "Count"), /*#__PURE__*/React.createElement("th", {
    className: "px-6 py-3 font-medium"
  }, "Description"))), /*#__PURE__*/React.createElement("tbody", null, rows.map(([name, count, desc]) => /*#__PURE__*/React.createElement("tr", {
    key: name,
    className: "border-b border-slate-50"
  }, /*#__PURE__*/React.createElement("td", {
    className: "px-6 py-3 font-medium text-slate-900"
  }, name), /*#__PURE__*/React.createElement("td", {
    className: "px-6 py-3"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-semibold px-2 py-1 rounded-full " + (count > 0 ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700")
  }, count)), /*#__PURE__*/React.createElement("td", {
    className: "px-6 py-3 text-slate-500"
  }, desc)))))));
}

// ReportCard: a titled card with its own CSV export button (used for each report).
function ReportCard({
  title,
  subtitle,
  onExport,
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "print-area bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-start justify-between gap-3 mb-4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
    className: "font-semibold text-slate-900"
  }, title), subtitle && /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-400 mt-0.5"
  }, subtitle)), onExport && /*#__PURE__*/React.createElement("button", {
    onClick: onExport,
    className: "no-print shrink-0 flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium px-2.5 py-1.5 rounded-lg"
  }, /*#__PURE__*/React.createElement(IconDownload, {
    size: 13
  }), " CSV")), children);
}

// RoomHeatmap: a room × day grid. Each cell counts how many of the 6 periods
// that room is used on that day; darker blue = busier.
function RoomHeatmap({
  rooms,
  result,
  slotById
}) {
  const usage = {};
  result.genes.forEach(g => {
    const slot = slotById[g.slotId];
    if (!slot || g.roomId === -1) return;
    const key = g.roomId + "-" + slot.day;
    usage[key] = (usage[key] || 0) + 1;
  });
  const max = E.PERIODS;
  const shade = n => {
    if (!n) return "#f1f5f9";
    const t = n / max;
    if (t <= 0.25) return "#dbeafe";
    if (t <= 0.5) return "#93c5fd";
    if (t <= 0.75) return "#2563eb";
    return "#1e3a8a";
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "overflow-x-auto"
  }, /*#__PURE__*/React.createElement("table", {
    className: "text-xs border-collapse"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    className: "p-2 text-left text-slate-400 font-medium"
  }, "Room"), E.DAYS.map(d => /*#__PURE__*/React.createElement("th", {
    key: d,
    className: "p-2 text-slate-400 font-medium"
  }, d)))), /*#__PURE__*/React.createElement("tbody", null, rooms.map(r => /*#__PURE__*/React.createElement("tr", {
    key: r.id
  }, /*#__PURE__*/React.createElement("td", {
    className: "p-2 text-slate-700 font-medium whitespace-nowrap"
  }, r.name), E.DAYS.map(d => {
    const n = usage[r.id + "-" + d] || 0;
    return /*#__PURE__*/React.createElement("td", {
      key: d,
      className: "p-1"
    }, /*#__PURE__*/React.createElement("div", {
      title: n + " of " + max + " periods used",
      className: "w-12 h-8 rounded flex items-center justify-center font-semibold",
      style: {
        background: shade(n),
        color: n / max > 0.5 ? "white" : "#334155"
      }
    }, n));
  }))))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 mt-3 text-[11px] text-slate-400"
  }, /*#__PURE__*/React.createElement("span", null, "Periods used per day (max ", max, "):"), [0, 1, 3, 4, 6].map(n => /*#__PURE__*/React.createElement("span", {
    key: n,
    className: "w-5 h-3 rounded inline-block",
    style: {
      background: shade(n)
    }
  })), /*#__PURE__*/React.createElement("span", null, "low \u2192 high")));
}

// ReportsPage: the four reports named in the thesis (Faculty Teaching Load,
// Room Utilization + heatmap, Department Summary, Conflict Report), each
// exportable to CSV, plus "Print All Reports" for a PDF.
function ReportsPage({
  faculty,
  rooms,
  sections,
  result,
  slotById
}) {
  if (!result) {
    return /*#__PURE__*/React.createElement("div", {
      className: "bg-white rounded-2xl p-12 shadow-sm border border-slate-100 text-center text-slate-400"
    }, "Generate a schedule to see analytics and reports here.");
  }
  const unitsByFaculty = {};
  faculty.forEach(f => unitsByFaculty[f.id] = 0);
  result.genes.forEach((g, i) => {
    if (g.facultyId !== -1) unitsByFaculty[g.facultyId] = (unitsByFaculty[g.facultyId] || 0) + sections[i].units;
  });
  const workloadData = faculty.map(f => ({
    label: firstName(f.name),
    value: unitsByFaculty[f.id] || 0
  }));
  const roomUsage = {};
  rooms.forEach(r => roomUsage[r.id] = 0);
  result.genes.forEach(g => {
    if (g.roomId !== -1) roomUsage[g.roomId] = (roomUsage[g.roomId] || 0) + 1;
  });
  const totalSlots = E.DAYS.length * E.PERIODS;
  const roomData = rooms.map(r => ({
    label: r.name.replace("Room ", ""),
    value: roomUsage[r.id] || 0
  }));
  const allSpecs = subjectAreasOf(faculty, sections);
  const deptRows = allSpecs.map(spec => {
    const st = computeDepartmentStats(spec, faculty, sections, result);
    return [spec, st.deptFaculty.length, st.deptSections.length, st.loadPct + "%", st.overloads, st.conflicts];
  });
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "no-print flex justify-end"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => window.print(),
    className: "flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium px-3.5 py-2 rounded-lg"
  }, /*#__PURE__*/React.createElement(IconPrinter, {
    size: 15
  }), " Print All Reports / Save PDF")), /*#__PURE__*/React.createElement(ReportCard, {
    title: "Faculty Teaching Load Report",
    subtitle: "Assigned teaching units per faculty member in the current schedule",
    onExport: () => downloadCSV("faculty_teaching_load_report.csv", ["Faculty", "Academic Rank", "Employment Status", "Assigned Units", "Max Units", "Load %", "Status"], faculty.map(f => {
      const st = loadStatusFor(f, sections, result, faculty);
      return [f.name, f.academicRank || "", f.employmentStatus || "", st.assigned, f.maxUnits, st.pct + "%", st.label];
    }))
  }, /*#__PURE__*/React.createElement(BarChart, {
    data: workloadData,
    colorFn: () => "#1e3a8a"
  })), /*#__PURE__*/React.createElement(ReportCard, {
    title: "Room Utilization Report",
    subtitle: "Sessions held per room (out of " + totalSlots + " weekly periods)",
    onExport: () => downloadCSV("room_utilization_report.csv", ["Room", "Type", "Capacity", "Sessions", "Utilization %"], rooms.map(r => [r.name, r.type, r.capacity, roomUsage[r.id] || 0, Math.round((roomUsage[r.id] || 0) / totalSlots * 100) + "%"]))
  }, /*#__PURE__*/React.createElement(BarChart, {
    data: roomData,
    colorFn: () => "#b7791f"
  }), /*#__PURE__*/React.createElement("div", {
    className: "mt-5"
  }, /*#__PURE__*/React.createElement("h4", {
    className: "text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2"
  }, "Utilization Heatmap (room \xD7 day)"), /*#__PURE__*/React.createElement(RoomHeatmap, {
    rooms: rooms,
    result: result,
    slotById: slotById
  }))), /*#__PURE__*/React.createElement(ReportCard, {
    title: "Department Summary",
    subtitle: "Teaching load, overloads, and conflicts per specialization area",
    onExport: () => downloadCSV("department_summary.csv", ["Specialization", "Faculty", "Sections", "Teaching Load", "Overloads", "Conflicts"], deptRows)
  }, /*#__PURE__*/React.createElement("div", {
    className: "overflow-x-auto"
  }, /*#__PURE__*/React.createElement("table", {
    className: "w-full text-sm"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
    className: "text-left text-slate-400 text-xs border-b border-slate-100"
  }, ["Specialization", "Faculty", "Sections", "Teaching Load", "Overloads", "Conflicts"].map(h => /*#__PURE__*/React.createElement("th", {
    key: h,
    className: "px-3 py-2 font-medium"
  }, h)))), /*#__PURE__*/React.createElement("tbody", null, deptRows.map(r => /*#__PURE__*/React.createElement("tr", {
    key: r[0],
    className: "border-b border-slate-50"
  }, r.map((c, i) => /*#__PURE__*/React.createElement("td", {
    key: i,
    className: "px-3 py-2 " + (i === 0 ? "font-medium text-slate-900" : "text-slate-500")
  }, c)))))))), /*#__PURE__*/React.createElement(ReportCard, {
    title: "Conflict Report",
    subtitle: "Hard-constraint check across the current schedule",
    onExport: () => downloadCSV("conflict_report.csv", ["Constraint", "Count"], [["Faculty double-booking", result.violations.facultyConflicts], ["Room double-booking", result.violations.roomConflicts], ["Unqualified assignment", result.violations.unqualified], ["Faculty unavailable", result.violations.unavailable], ["Room type mismatch", result.violations.roomTypeMismatch], ["Fixed time not respected", result.violations.fixedSlot || 0], ["Room capacity exceeded", result.violations.capacityViol], ["Cannot be scheduled (no qualified teacher or big-enough lab)", result.violations.unplaceable || 0], ["Faculty overload (units; a warning, not a conflict)", result.violations.overload], ["Unscheduled (manually removed)", result.violations.unscheduled || 0]])
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-sm text-slate-600"
  }, "Total hard-constraint violations: ", /*#__PURE__*/React.createElement("span", {
    className: "font-semibold " + (result.violations.total ? "text-rose-700" : "text-emerald-700")
  }, result.violations.total), " ", "\xB7 Approval: ", /*#__PURE__*/React.createElement("span", {
    className: "font-semibold"
  }, result.approvalStatus || "Pending Review"))));
}

// UploadIssueList: one list of the upload check (errors, warnings or notes), grouped by sheet,
// each item prefixed with "Row N, Column:" so the user can find it in Excel. At most 50 are shown.
const ISSUE_LIMIT = 50;
function UploadIssueList({
  title,
  items,
  tone,
  open
}) {
  if (!items.length) return null;
  const shown = items.slice(0, ISSUE_LIMIT);
  const groups = [];
  shown.forEach(it => {
    const name = it.sheet || "Whole file";
    let g = groups.find(x => x.name === name);
    if (!g) {
      g = {
        name,
        items: []
      };
      groups.push(g);
    }
    g.items.push(it);
  });
  const colors = {
    error: "border-rose-200 bg-rose-50 text-rose-900",
    warning: "border-orange-200 bg-orange-50 text-orange-900",
    note: "border-slate-200 bg-slate-50 text-slate-700"
  };
  const where = it => it.row ? "Row " + it.row + (it.column ? ", " + it.column : "") + ": " : it.column ? it.column + ": " : "";
  return /*#__PURE__*/React.createElement("details", {
    open: open,
    className: "rounded-lg border px-3 py-2 text-sm " + colors[tone]
  }, /*#__PURE__*/React.createElement("summary", {
    className: "cursor-pointer font-medium"
  }, title, " (", items.length, ")"), /*#__PURE__*/React.createElement("div", {
    className: "mt-2 space-y-2"
  }, groups.map(g => /*#__PURE__*/React.createElement("div", {
    key: g.name
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-xs font-semibold uppercase tracking-wide opacity-70"
  }, g.name), /*#__PURE__*/React.createElement("ul", {
    className: "list-disc pl-5 space-y-0.5"
  }, g.items.map((it, i) => /*#__PURE__*/React.createElement("li", {
    key: i
  }, where(it), it.message))))), items.length > ISSUE_LIMIT && /*#__PURE__*/React.createElement("div", {
    className: "text-xs opacity-80"
  }, "+ ", items.length - ISSUE_LIMIT, " more")));
}

// SchoolDataCard: Settings → "Set up with your school's data" (Admin and IT).
//   1. Download a blank template, or the current data in the same layout.
//   2. Choose a filled workbook; it is read (readWorkbookFile) and checked (SchedImport.parseWorkbook).
//   3. Read the result; "Replace my data with this file" (only when there are no errors) asks
//      for confirmation, with the chance to download a backup first, then replaces the data.
function SchoolDataCard({
  datasetKind,
  datasetInfo,
  onDownloadTemplate,
  onDownloadCurrent,
  onApply,
  onDownloadBackup
}) {
  const [busy, setBusy] = useState(""); // what is happening now, e.g. "Reading the file…"
  const [fileName, setFileName] = useState("");
  const [readError, setReadError] = useState("");
  const [check, setCheck] = useState(null); // the ImportResult of the chosen file
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState(null); // { ok, text } after a download or a backup
  const btn = "text-left border border-slate-200 hover:border-amber-400 hover:bg-amber-50 rounded-lg px-3 py-2 text-sm text-slate-800 disabled:opacity-50 disabled:hover:bg-white";
  const loaded = datasetKind === "school" ? "your school's data" + (datasetInfo ? ", uploaded " + new Date(datasetInfo.uploadedAt).toLocaleString() + " from " + datasetInfo.fileName : "") : "sample data (" + (datasetKind === "expanded" ? "expanded multi-program sample" : "standard sample") + ")";
  async function download(what, task) {
    setMessage(null);
    setBusy("Preparing the " + what + "…");
    try {
      await task();
      setMessage({
        ok: true,
        text: "Downloaded the " + what + "."
      });
    } catch (e) {
      setMessage({
        ok: false,
        text: e.message
      });
    }
    setBusy("");
  }
  async function onPick(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = ""; // lets the same file be chosen again after fixing it
    if (!file) return;
    setFileName(file.name);
    setCheck(null);
    setReadError("");
    setMessage(null);
    setBusy("Reading and checking " + file.name + "…");
    try {
      setCheck(SchedImport.parseWorkbook(await readWorkbookFile(file)));
    } catch (err) {
      setReadError(err.message);
    }
    setBusy("");
  }
  function replace() {
    onApply(check.data, fileName);
    setConfirming(false);
    setCheck(null);
    setFileName("");
  }
  const c = check && check.counts;
  return /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-2xl p-5 sm:p-8 shadow-sm border border-slate-100 space-y-4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    className: "font-semibold text-slate-900"
  }, "Set up with your school's data"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-500 mt-1"
  }, "Replace the sample data with your school's teachers, subjects and rooms, then generate a real schedule."), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-600 mt-2"
  }, "Currently loaded: ", /*#__PURE__*/React.createElement("span", {
    className: "font-medium text-slate-800"
  }, loaded))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
    className: "text-sm font-semibold text-slate-800 mb-1"
  }, "1. Get the template"), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 sm:grid-cols-2 gap-2"
  }, /*#__PURE__*/React.createElement("button", {
    className: btn,
    disabled: !!busy,
    onClick: () => download("blank template", onDownloadTemplate)
  }, /*#__PURE__*/React.createElement("div", {
    className: "font-medium"
  }, "Download blank template"), /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-slate-500"
  }, "An Excel workbook with instructions and example rows.")), /*#__PURE__*/React.createElement("button", {
    className: btn,
    disabled: !!busy,
    onClick: () => download("current data", onDownloadCurrent)
  }, /*#__PURE__*/React.createElement("div", {
    className: "font-medium"
  }, "Download current data"), /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-slate-500"
  }, "Everything now in SchedWiseAI, in the same layout, to edit in Excel.")))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
    className: "text-sm font-semibold text-slate-800 mb-1"
  }, "2. Upload the filled workbook"), /*#__PURE__*/React.createElement("label", {
    className: btn + " cursor-pointer block focus-within:border-amber-400 focus-within:bg-amber-50" + (busy ? " opacity-50 pointer-events-none" : "")
  }, /*#__PURE__*/React.createElement("div", {
    className: "font-medium"
  }, "Choose filled workbook (.xlsx)\u2026"), /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-slate-500"
  }, "It is checked first. Nothing changes until you confirm."), /*#__PURE__*/React.createElement("input", {
    type: "file",
    accept: ".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    onChange: onPick,
    disabled: !!busy,
    className: "sr-only",
    "aria-label": "Choose a filled school data workbook"
  }))), busy && /*#__PURE__*/React.createElement("div", {
    role: "status",
    className: "text-sm text-slate-600"
  }, busy), message && /*#__PURE__*/React.createElement("div", {
    role: "status",
    className: "text-sm rounded-lg px-3 py-2 " + (message.ok ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800")
  }, message.text), readError && /*#__PURE__*/React.createElement("div", {
    role: "alert",
    className: "text-sm rounded-lg px-3 py-2 bg-rose-50 text-rose-800"
  }, fileName, ": ", readError), check && /*#__PURE__*/React.createElement("div", {
    className: "space-y-2"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "text-sm font-semibold text-slate-800"
  }, "3. Check the result: ", fileName), /*#__PURE__*/React.createElement("div", {
    role: "status",
    className: "text-sm font-medium " + (check.ok ? "text-emerald-700" : "text-rose-700")
  }, check.ok ? "✓ " : "✗ ", countOf(c.faculty, "teacher"), " \xB7 ", countOf(c.sections, "subject"), " \xB7 ", countOf(c.rooms, "room"), !check.ok && " — fix the errors in the file, save it, and choose it again."), /*#__PURE__*/React.createElement(UploadIssueList, {
    title: "Errors",
    items: check.errors,
    tone: "error",
    open: true
  }), /*#__PURE__*/React.createElement(UploadIssueList, {
    title: "Warnings",
    items: check.warnings,
    tone: "warning",
    open: check.ok
  }), /*#__PURE__*/React.createElement(UploadIssueList, {
    title: "Notes",
    items: check.notes,
    tone: "note",
    open: false
  }), /*#__PURE__*/React.createElement("button", {
    disabled: !check.ok,
    onClick: () => {
      setMessage(null);
      setConfirming(true);
    },
    className: "w-full bg-amber-400 hover:bg-amber-300 text-[#0b1d4a] font-semibold text-sm py-2.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
  }, "Replace my data with this file")), confirming && check && /*#__PURE__*/React.createElement(Modal, {
    title: "Replace your data?",
    onClose: () => setConfirming(false)
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-slate-700 mb-2"
  }, "Your faculty, subjects and rooms will be replaced by the ", countOf(c.faculty, "teacher"), ", ", countOf(c.sections, "subject"), " and ", countOf(c.rooms, "room"), " in ", /*#__PURE__*/React.createElement("span", {
    className: "font-medium"
  }, fileName), "."), /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-slate-700 mb-2"
  }, "The current schedule, its saved versions and all leave and availability requests will be cleared. Notifications and the activity log are kept."), /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-slate-700 mb-4"
  }, "This cannot be undone. If you may need the current data later, download a backup first."), message && /*#__PURE__*/React.createElement("div", {
    role: "status",
    className: "text-sm rounded-lg px-3 py-2 mb-3 " + (message.ok ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800")
  }, message.text), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col sm:flex-row gap-2"
  }, /*#__PURE__*/React.createElement("button", {
    className: btn + " flex-1 text-center",
    onClick: () => {
      const r = onDownloadBackup();
      setMessage({
        ok: r.ok,
        text: r.message
      });
    }
  }, "Download a backup first"), /*#__PURE__*/React.createElement("button", {
    className: "flex-1 bg-amber-400 hover:bg-amber-300 text-[#0b1d4a] font-semibold text-sm py-2 rounded-lg",
    onClick: replace
  }, "Replace my data"), /*#__PURE__*/React.createElement("button", {
    className: btn + " flex-1 text-center",
    onClick: () => setConfirming(false)
  }, "Cancel"))));
}

// SettingsPage: "About this prototype", plus, for Admin and IT, the school-data setup card,
// Backup and restore, and Testing tools:
//   • Sample data: load the standard or the expanded multi-program sample.
//   • Create test conflicts: break one rule on purpose (see makeTestConflict),
//     then check Conflict Detection and try "Update affected classes".
function SettingsPage({
  role,
  me,
  onChangeOwnPassword,
  hasSchedule,
  datasetKind,
  violationsTotal,
  onLoadDataset,
  onCreateTestConflict,
  onDownloadBackup,
  onRestoreBackup,
  datasetInfo,
  onDownloadTemplate,
  onDownloadCurrentData,
  onApplySchoolData,
  testLog,
  onGoTo
}) {
  const canTest = role === "admin" || role === "it";
  const [backupMsg, setBackupMsg] = useState(null); // { ok, message } shown under the backup buttons
  // Reads the chosen file as text and hands it to the app, which checks and restores it.
  function onPickBackup(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = ""; // lets the same file be chosen again later
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setBackupMsg(onRestoreBackup(String(reader.result || ""), file.name));
    reader.onerror = () => setBackupMsg({
      ok: false,
      message: "The file could not be read."
    });
    reader.readAsText(file);
  }
  const btn = "text-left border border-slate-200 hover:border-amber-400 hover:bg-amber-50 rounded-lg px-3 py-2 text-sm text-slate-800 disabled:opacity-50 disabled:hover:bg-white";
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-5 max-w-3xl"
  }, /*#__PURE__*/React.createElement(YourAccountCard, {
    me: me,
    onChangePassword: onChangeOwnPassword
  }), /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-2xl p-5 sm:p-8 shadow-sm border border-slate-100"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "font-semibold text-slate-900 mb-4"
  }, "About this prototype"), /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-slate-500 leading-relaxed mb-3"
  }, "This is a working prototype of SchedWiseAI built for respondent testing as part of a capstone research study. The AI Optimization Engine (a Genetic Algorithm with constraint checking) runs entirely in your browser \u2014 no data is sent to a server. Everything you enter is stored only in this browser's local storage."), /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-slate-500 leading-relaxed"
  }, "Each person signs in with their own account, and the account's role (Academic Administrator, Department Chair, Faculty Member or IT Professional/Staff) decides what they can see and do. Administrators and IT staff create accounts and reset forgotten passwords on the Accounts page. Accounts are kept in this browser too: anyone with full access to this computer could still read or change what it stores.")), canTest && /*#__PURE__*/React.createElement(SchoolDataCard, {
    datasetKind: datasetKind,
    datasetInfo: datasetInfo,
    onDownloadTemplate: onDownloadTemplate,
    onDownloadCurrent: onDownloadCurrentData,
    onApply: onApplySchoolData,
    onDownloadBackup: onDownloadBackup
  }), canTest && /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-2xl p-5 sm:p-8 shadow-sm border border-slate-100 space-y-4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    className: "font-semibold text-slate-900"
  }, "Backup and restore"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-500 mt-1"
  }, "Your data is stored only in this browser. Clearing the browser's site data, or using another browser or computer, loses it. A backup is a small file you can keep or move to another browser.")), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 sm:grid-cols-2 gap-2"
  }, /*#__PURE__*/React.createElement("button", {
    className: btn,
    onClick: () => setBackupMsg(onDownloadBackup())
  }, /*#__PURE__*/React.createElement("div", {
    className: "font-medium"
  }, "Download backup"), /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-slate-500"
  }, "Saves faculty, subjects, rooms, the schedule, history and requests as a .json file.")), /*#__PURE__*/React.createElement("label", {
    className: btn + " cursor-pointer block focus-within:border-amber-400 focus-within:bg-amber-50"
  }, /*#__PURE__*/React.createElement("div", {
    className: "font-medium"
  }, "Restore from backup file\u2026"), /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-slate-500"
  }, "Replaces all current data with a backup. The file is checked first."), /*#__PURE__*/React.createElement("input", {
    type: "file",
    accept: ".json,application/json",
    onChange: onPickBackup,
    className: "sr-only",
    "aria-label": "Choose a backup file to restore"
  }))), backupMsg && /*#__PURE__*/React.createElement("div", {
    role: "status",
    className: "text-sm rounded-lg px-3 py-2 " + (backupMsg.ok ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800")
  }, backupMsg.message)), canTest && /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-2xl p-5 sm:p-8 shadow-sm border border-slate-100 space-y-6"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    className: "font-semibold text-slate-900"
  }, "Testing tools"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-500 mt-1"
  }, "For Admin and IT testers. These change the data in this browser only.")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
    className: "text-sm font-semibold text-slate-800 mb-1"
  }, "Sample data"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-500 mb-2"
  }, "Currently loaded: ", /*#__PURE__*/React.createElement("span", {
    className: "font-medium text-slate-700"
  }, datasetKind === "school" ? "your school's data (not a sample)" : datasetKind === "expanded" ? "expanded multi-program sample" : "standard sample"), ". Loading replaces all data. ", datasetKind === "school" ? "The sidebar's Reset Demo Data loads the standard sample." : "The sidebar's Reset Demo Data reloads whichever sample is current."), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 sm:grid-cols-2 gap-2"
  }, /*#__PURE__*/React.createElement("button", {
    className: btn,
    onClick: () => onLoadDataset("standard")
  }, /*#__PURE__*/React.createElement("div", {
    className: "font-medium"
  }, "Standard sample"), /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-slate-500"
  }, "9 faculty \xB7 18 subjects \xB7 6 labs (BSIT). Used by the testing guide.")), /*#__PURE__*/React.createElement("button", {
    className: btn,
    onClick: () => onLoadDataset("expanded")
  }, /*#__PURE__*/React.createElement("div", {
    className: "font-medium"
  }, "Expanded multi-program sample"), /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-slate-500"
  }, "About 22 faculty (6 part-time) \xB7 48 subjects \xB7 10 labs. BSIT, BSCS and BSIS, 1st to 4th year, with GE minors.")))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
    className: "text-sm font-semibold text-slate-800 mb-1"
  }, "Create test conflicts"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-500 mb-2"
  }, "Each button breaks one rule in the current schedule on purpose and says exactly what it changed. Then open", /*#__PURE__*/React.createElement("button", {
    className: "text-blue-800 hover:underline mx-1",
    onClick: () => onGoTo("conflicts")
  }, "Conflict Detection"), "to see it counted, or", /*#__PURE__*/React.createElement("button", {
    className: "text-blue-800 hover:underline mx-1",
    onClick: () => onGoTo("schedules")
  }, "Class Schedules"), "and press ", /*#__PURE__*/React.createElement("span", {
    className: "font-medium"
  }, "Update affected classes"), " to watch the AI repair it."), !hasSchedule ? /*#__PURE__*/React.createElement("div", {
    className: "text-sm text-slate-500 bg-slate-50 rounded-lg px-3 py-2"
  }, "Generate a schedule first (Class Schedules \u2192 Generate Schedule).") : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-slate-600 mb-2"
  }, "Conflicts in the current schedule: ", /*#__PURE__*/React.createElement("span", {
    className: "font-semibold " + (violationsTotal ? "text-rose-700" : "text-emerald-700")
  }, violationsTotal)), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 sm:grid-cols-2 gap-2"
  }, TEST_CONFLICT_KINDS.map(([k, label]) => /*#__PURE__*/React.createElement("button", {
    key: k,
    className: btn,
    onClick: () => onCreateTestConflict(k)
  }, label, k === "overload" ? " (not a conflict)" : "")), /*#__PURE__*/React.createElement("button", {
    className: "sm:col-span-2 bg-amber-400 hover:bg-amber-300 text-[#0b1d4a] font-semibold text-sm py-2 rounded-lg",
    onClick: () => onCreateTestConflict("all")
  }, "Create all of them"))), testLog.length > 0 && /*#__PURE__*/React.createElement("ul", {
    className: "mt-3 space-y-1 text-xs"
  }, testLog.map((m, i) => /*#__PURE__*/React.createElement("li", {
    key: i,
    className: "rounded-lg px-3 py-1.5 " + (m.ok ? "bg-orange-50 text-orange-800" : "bg-slate-50 text-slate-600")
  }, m.text))))));
}

// AppErrorBoundary: if the app ever fails to draw (for example because saved data is
// damaged), React would otherwise show a blank page on every reload. Instead this shows
// a recovery screen: download the saved data as it is, then reset to fresh sample data.
// It uses plain inline styles so it still looks right if something else failed.
class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null
    };
  }
  static getDerivedStateFromError(error) {
    return {
      error
    };
  }
  componentDidCatch(error, info) {
    console.error("SchedWiseAI could not start:", error, info && info.componentStack);
  }
  downloadRaw() {
    let raw = null;
    try {
      raw = localStorage.getItem("schedwiseai_prototype_v1");
    } catch (e) {/* storage blocked */}
    const blob = new Blob([raw || "{}"], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "schedwiseai-saved-data-" + new Date().toISOString().slice(0, 10) + ".json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  reset() {
    if (!confirm("Delete the saved data in this browser and start again with fresh sample data?\n\nDownload the saved data first if you may need it.")) return;
    try {
      localStorage.removeItem("schedwiseai_prototype_v1");
    } catch (e) {/* storage blocked */}
    location.reload();
  }
  render() {
    if (!this.state.error) return this.props.children;
    const btn = {
      padding: "10px 14px",
      borderRadius: 8,
      border: "1px solid #cbd5e1",
      background: "#fff",
      fontSize: 14,
      cursor: "pointer",
      margin: "4px 8px 4px 0"
    };
    return /*#__PURE__*/React.createElement("div", {
      style: {
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#eef1f8",
        padding: 16,
        fontFamily: "system-ui, sans-serif"
      }
    }, /*#__PURE__*/React.createElement("div", {
      role: "alert",
      style: {
        background: "#fff",
        borderRadius: 16,
        padding: 24,
        maxWidth: 480,
        width: "100%",
        boxShadow: "0 1px 3px rgba(0,0,0,.1)",
        color: "#0f172a"
      }
    }, /*#__PURE__*/React.createElement("h1", {
      style: {
        fontSize: 18,
        fontWeight: 600,
        margin: "0 0 8px"
      }
    }, "SchedWiseAI could not start"), /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: 14,
        color: "#475569",
        lineHeight: 1.5,
        margin: "0 0 16px"
      }
    }, "The data saved in this browser seems to be damaged, possibly by a faulty backup file. Download the saved data (to keep a copy, or to send to whoever supports this system), then reset to fresh sample data."), /*#__PURE__*/React.createElement("button", {
      style: btn,
      onClick: () => this.downloadRaw()
    }, "Download saved data"), /*#__PURE__*/React.createElement("button", {
      style: {
        ...btn,
        background: "#fbbf24",
        borderColor: "#fbbf24",
        fontWeight: 600
      },
      onClick: () => this.reset()
    }, "Reset to sample data"), /*#__PURE__*/React.createElement("button", {
      style: btn,
      onClick: () => location.reload()
    }, "Try again")));
  }
}

// Start the app: draw <App /> inside the <div id="root"> in index.html.
ReactDOM.createRoot(document.getElementById("root")).render( /*#__PURE__*/React.createElement(AppErrorBoundary, null, /*#__PURE__*/React.createElement(App, null)));
