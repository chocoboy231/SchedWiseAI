/* =====================================================================
   SchedWiseAI — SIGN-IN AND ACCOUNTS (accounts.js)
   ---------------------------------------------------------------------
   Exposed as window.SchedAccounts. Plain JavaScript, no libraries.

   Every person signs in with their own username and password. The account
   decides the role (Administrator, Department Chair, Faculty Member or IT
   staff); a Faculty Member account is linked to one teacher by name.

   WHERE ACCOUNTS ARE KEPT: in this browser, under their own key
   (schedwiseai_accounts_v1), apart from the school's data. Reset Demo Data,
   uploading a school's workbook and restoring a backup never touch them,
   and backups do not contain them. Who is signed in is kept for the open
   tab only (sessionStorage), so closing the browser signs the person out.

   PASSWORDS are never stored. Each account keeps a random salt and a
   PBKDF2-HMAC-SHA256 hash (100,000 rounds). The browser's own crypto.subtle
   is used when it exists; a page served over plain http on a school
   network has none, so the same calculation is also written out below in
   plain JavaScript (it gives exactly the same result, only slower).

   LIMIT: there is no server. Anyone who can open the browser's developer
   tools on this computer can read or change what the browser stores. The
   sign-in keeps people in their own role on a shared computer; it is not
   protection against someone with full access to the machine.
   ===================================================================== */
(function () {
  "use strict";

  const ROLE_KEYS = ["admin", "chair", "faculty", "it"];
  const MANAGER_ROLES = ["admin", "it"];          // may manage accounts
  const ITERATIONS = 100000;                      // PBKDF2 rounds for new passwords
  const ACCOUNTS_KEY = "schedwiseai_accounts_v1";
  const SESSION_KEY = "schedwiseai_session_v1";

  // ---------------------------------------------------------------------
  // Bytes, text and hex
  // ---------------------------------------------------------------------
  const utf8 = s => new TextEncoder().encode(String(s));
  function toHex(bytes) {
    let s = "";
    for (let i = 0; i < bytes.length; i++) s += (bytes[i] < 16 ? "0" : "") + bytes[i].toString(16);
    return s;
  }
  function fromHex(hex) {
    const out = new Uint8Array(hex.length >> 1);
    for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
    return out;
  }
  function randomHex(byteCount) {
    const b = new Uint8Array(byteCount);
    crypto.getRandomValues(b);                    // available on plain http too
    return toHex(b);
  }

  // ---------------------------------------------------------------------
  // SHA-256 (FIPS 180-4), working on 32-bit words
  // ---------------------------------------------------------------------
  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];
  const H0 = Int32Array.from([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]);
  const W = new Int32Array(64);                   // message schedule; W[0..15] are filled before each call

  // compress(h): one SHA-256 block. W[0..15] hold the block as big-endian words; h is updated.
  function compress(h) {
    for (let t = 16; t < 64; t++) {
      const x = W[t - 15], y = W[t - 2];
      const s0 = ((x >>> 7) | (x << 25)) ^ ((x >>> 18) | (x << 14)) ^ (x >>> 3);
      const s1 = ((y >>> 17) | (y << 15)) ^ ((y >>> 19) | (y << 13)) ^ (y >>> 10);
      W[t] = (W[t - 16] + s0 + W[t - 7] + s1) | 0;
    }
    let a = h[0], b = h[1], c = h[2], d = h[3], e = h[4], f = h[5], g = h[6], k = h[7];
    for (let t = 0; t < 64; t++) {
      const S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
      const t1 = (k + S1 + ((e & f) ^ (~e & g)) + K[t] + W[t]) | 0;
      const S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
      const t2 = (S0 + ((a & b) ^ (a & c) ^ (b & c))) | 0;
      k = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    h[0] = (h[0] + a) | 0; h[1] = (h[1] + b) | 0; h[2] = (h[2] + c) | 0; h[3] = (h[3] + d) | 0;
    h[4] = (h[4] + e) | 0; h[5] = (h[5] + f) | 0; h[6] = (h[6] + g) | 0; h[7] = (h[7] + k) | 0;
  }

  // hashFrom(start, bytes, prefixLength): continues a hash whose first prefixLength bytes
  // (a whole number of blocks) are already in `start`, then pads and finishes it.
  function hashFrom(start, bytes, prefixLength) {
    const h = Int32Array.from(start);
    const n = bytes.length, total = ((n + 9 + 63) >> 6) << 6;
    const buf = new Uint8Array(total);
    buf.set(bytes);
    buf[n] = 0x80;
    const bits = (prefixLength + n) * 8, hi = Math.floor(bits / 0x100000000), lo = bits >>> 0;
    buf[total - 8] = hi >>> 24; buf[total - 7] = hi >>> 16; buf[total - 6] = hi >>> 8; buf[total - 5] = hi;
    buf[total - 4] = lo >>> 24; buf[total - 3] = lo >>> 16; buf[total - 2] = lo >>> 8; buf[total - 1] = lo;
    for (let off = 0; off < total; off += 64) {
      for (let i = 0; i < 16; i++) {
        const p = off + i * 4;
        W[i] = (buf[p] << 24) | (buf[p + 1] << 16) | (buf[p + 2] << 8) | buf[p + 3];
      }
      compress(h);
    }
    return h;
  }
  function wordsToBytes(words) {
    const out = new Uint8Array(words.length * 4);
    for (let i = 0; i < words.length; i++) {
      out[i * 4] = words[i] >>> 24; out[i * 4 + 1] = words[i] >>> 16; out[i * 4 + 2] = words[i] >>> 8; out[i * 4 + 3] = words[i];
    }
    return out;
  }
  const sha256 = bytes => wordsToBytes(hashFrom(H0, bytes, 0));

  // ---------------------------------------------------------------------
  // PBKDF2-HMAC-SHA256 (RFC 8018 / RFC 2104), plain JavaScript
  // ---------------------------------------------------------------------
  // HMAC of a 32-byte message given as 8 words (the PBKDF2 inner loop), written into `out`.
  function hmacWords(innerStart, outerStart, message, scratch, out) {
    scratch.set(innerStart);
    for (let i = 0; i < 8; i++) W[i] = message[i];
    W[8] = 0x80000000 | 0; for (let i = 9; i < 15; i++) W[i] = 0; W[15] = 768;   // 64 + 32 bytes = 768 bits
    compress(scratch);
    out.set(outerStart);
    for (let i = 0; i < 8; i++) W[i] = scratch[i];
    W[8] = 0x80000000 | 0; for (let i = 9; i < 15; i++) W[i] = 0; W[15] = 768;
    compress(out);
  }
  function pbkdf2Sha256(password, salt, iterations, length) {
    const key = password.length > 64 ? sha256(password) : password;
    const ipad = new Uint8Array(64), opad = new Uint8Array(64);
    for (let i = 0; i < 64; i++) { const b = i < key.length ? key[i] : 0; ipad[i] = b ^ 0x36; opad[i] = b ^ 0x5c; }
    const start = block => {                     // hash state after one 64-byte block
      const h = Int32Array.from(H0);
      for (let i = 0; i < 16; i++) W[i] = (block[i * 4] << 24) | (block[i * 4 + 1] << 16) | (block[i * 4 + 2] << 8) | block[i * 4 + 3];
      compress(h);
      return h;
    };
    const innerStart = start(ipad), outerStart = start(opad);
    const blocks = Math.ceil(length / 32), out = new Uint8Array(blocks * 32);
    const u = new Int32Array(8), acc = new Int32Array(8), scratch = new Int32Array(8);
    for (let b = 1; b <= blocks; b++) {
      const first = new Uint8Array(salt.length + 4);
      first.set(salt);
      first[salt.length] = b >>> 24; first[salt.length + 1] = b >>> 16; first[salt.length + 2] = b >>> 8; first[salt.length + 3] = b;
      u.set(hashFrom(outerStart, wordsToBytes(hashFrom(innerStart, first, 64)), 64));   // U1 = HMAC(password, salt || b)
      acc.set(u);
      for (let i = 1; i < iterations; i++) {
        hmacWords(innerStart, outerStart, u, scratch, u);
        for (let j = 0; j < 8; j++) acc[j] ^= u[j];
      }
      out.set(wordsToBytes(acc), (b - 1) * 32);
    }
    return out.slice(0, length);
  }

  // hashPassword(password, saltHex, iterations) -> Promise of the hash as hex.
  // Uses crypto.subtle when the page has it; { pureJs: true } forces the plain version (tests).
  async function hashPassword(password, saltHex, iterations, options) {
    const pw = utf8(password), salt = fromHex(saltHex);
    const subtle = !(options && options.pureJs) && typeof crypto !== "undefined" && crypto.subtle;
    if (subtle) {
      try {
        const key = await subtle.importKey("raw", pw, "PBKDF2", false, ["deriveBits"]);
        const bits = await subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, key, 256);
        return toHex(new Uint8Array(bits));
      } catch (e) { /* fall through to the plain version */ }
    }
    return toHex(pbkdf2Sha256(pw, salt, iterations, 32));
  }

  // ---------------------------------------------------------------------
  // Rules for names, usernames and passwords
  // ---------------------------------------------------------------------
  const canonicalName = s => String(s == null ? "" : s).trim().replace(/\s+/g, " ").toLowerCase();
  const normalizeUsername = s => String(s == null ? "" : s).trim().toLowerCase();

  function checkName(name) {
    const n = String(name == null ? "" : name).trim();
    if (!n) return "Enter the person's full name.";
    if (n.length > 80) return "The name can have at most 80 characters.";
    return null;
  }
  // exceptId: the account being edited, which may keep its own username.
  function checkUsername(username, accounts, exceptId) {
    const u = normalizeUsername(username);
    if (u.length < 3 || u.length > 32) return "A username needs 3 to 32 characters.";
    if (!/^[a-z0-9._-]+$/.test(u)) return "A username can use only letters, numbers, dots (.), dashes (-) and underscores (_), with no spaces.";
    if ((accounts || []).some(a => a.id !== exceptId && a.username === u)) return "The username “" + u + "” is already taken.";
    return null;
  }
  function checkPassword(password, username) {
    const p = String(password == null ? "" : password);
    if (p.length < 8) return "The password needs at least 8 characters.";
    if (p.length > 128) return "The password can have at most 128 characters.";
    if (!p.trim()) return "The password cannot be only spaces.";
    if (username && p.trim().toLowerCase() === normalizeUsername(username)) return "The password cannot be the same as the username.";
    return null;
  }

  // ---------------------------------------------------------------------
  // Accounts
  // ---------------------------------------------------------------------
  // makeAccount({ name, username, role, facultyName, password, mustChangePassword }, accounts)
  //   -> Promise of { account } or { error }. facultyName is kept only for Faculty Member accounts.
  async function makeAccount(input, accounts) {
    const nameErr = checkName(input.name);
    if (nameErr) return { error: nameErr };
    if (!ROLE_KEYS.includes(input.role)) return { error: "Choose a role." };
    const username = normalizeUsername(input.username);
    const userErr = checkUsername(username, accounts);
    if (userErr) return { error: userErr };
    const facultyName = input.role === "faculty" ? String(input.facultyName || "").trim() : null;
    if (input.role === "faculty" && !facultyName) return { error: "Choose the teacher this account belongs to." };
    const passErr = checkPassword(input.password, username);
    if (passErr) return { error: passErr };
    const salt = randomHex(16), now = new Date().toISOString();
    const hash = await hashPassword(input.password, salt, ITERATIONS);
    return { account: {
      id: "acc-" + randomHex(8), username, name: String(input.name).trim().replace(/\s+/g, " "), role: input.role, facultyName,
      salt, hash, iterations: ITERATIONS, mustChangePassword: !!input.mustChangePassword, disabled: false,
      createdAt: now, passwordChangedAt: now,
    } };
  }
  async function verifyPassword(account, password) {
    if (!account || typeof password !== "string" || !password) return false;
    return (await hashPassword(password, account.salt, account.iterations)) === account.hash;
  }
  // A copy of the account with a new password (new salt). Check it with checkPassword first.
  async function withNewPassword(account, password, mustChangePassword) {
    const salt = randomHex(16);
    return Object.assign({}, account, {
      salt, hash: await hashPassword(password, salt, ITERATIONS), iterations: ITERATIONS,
      mustChangePassword: !!mustChangePassword, passwordChangedAt: new Date().toISOString(),
    });
  }
  function findByUsername(accounts, username) {
    const u = normalizeUsername(username);
    return (accounts || []).find(a => a.username === u) || null;
  }
  const activeAdmins = accounts => accounts.filter(a => a.role === "admin" && !a.disabled).length;
  const managerCount = accounts => accounts.filter(a => MANAGER_ROLES.includes(a.role) && !a.disabled).length;

  // checkChange(accounts, actorId, targetId, change) -> null when allowed, else the reason.
  // change: { kind: "delete" } | { kind: "disable" } | { kind: "role", role }.
  // Nobody can delete, turn off or change the role of their own account, and the
  // last active Administrator cannot be removed, turned off or given another role.
  function checkChange(accounts, actorId, targetId, change) {
    const target = accounts.find(a => a.id === targetId);
    if (!target) return "That account no longer exists.";
    if (actorId === targetId) {
      if (change.kind === "delete") return "You cannot delete your own account. Ask another Administrator or IT staff member.";
      if (change.kind === "disable") return "You cannot turn off your own account.";
      if (change.kind === "role" && change.role !== target.role) return "You cannot change your own role. Ask another Administrator or IT staff member.";
    }
    const removesAdmin = target.role === "admin" && !target.disabled &&
      (change.kind === "delete" || change.kind === "disable" || (change.kind === "role" && change.role !== "admin"));
    if (removesAdmin && activeAdmins(accounts) <= 1) return "SchedWiseAI needs at least one active Administrator account. Add or turn on another Administrator first.";
    return null;
  }

  // The teacher a Faculty Member account belongs to (matched by name, ignoring
  // capitals and extra spaces), or null. Never falls back to another teacher.
  function linkedFaculty(account, faculty) {
    if (!account || account.role !== "faculty" || !account.facultyName) return null;
    const key = canonicalName(account.facultyName);
    return (faculty || []).find(f => canonicalName(f.name) === key) || null;
  }
  // After a teacher is renamed: accounts linked to the old name follow the new one.
  function relinkAfterRename(accounts, oldName, newName) {
    const key = canonicalName(oldName);
    return accounts.map(a => a.role === "faculty" && key && canonicalName(a.facultyName) === key
      ? Object.assign({}, a, { facultyName: String(newName).trim() }) : a);
  }

  // normalizeAccounts(list): the saved accounts that are complete and well-formed
  // (anything damaged is dropped, a repeated id is kept once).
  function normalizeAccounts(raw) {
    if (!Array.isArray(raw)) return [];
    const seen = new Set(), out = [];
    raw.forEach(a => {
      const ok = a && typeof a === "object" && typeof a.id === "string" && a.id && !seen.has(a.id)
        && typeof a.username === "string" && /^[a-z0-9._-]{3,32}$/.test(a.username)
        && typeof a.name === "string" && a.name.trim() && ROLE_KEYS.includes(a.role)
        && typeof a.salt === "string" && /^[0-9a-f]{32}$/.test(a.salt)
        && typeof a.hash === "string" && /^[0-9a-f]{64}$/.test(a.hash)
        && Number.isInteger(a.iterations) && a.iterations >= 1000 && a.iterations <= 10000000;
      if (!ok) return;
      seen.add(a.id);
      out.push({
        id: a.id, username: a.username, name: a.name, role: a.role,
        facultyName: a.role === "faculty" && typeof a.facultyName === "string" && a.facultyName.trim() ? a.facultyName : null,
        salt: a.salt, hash: a.hash, iterations: a.iterations,
        mustChangePassword: a.mustChangePassword === true, disabled: a.disabled === true,
        createdAt: typeof a.createdAt === "string" ? a.createdAt : null,
        passwordChangedAt: typeof a.passwordChangedAt === "string" ? a.passwordChangedAt : null,
      });
    });
    return out;
  }

  // ---------------------------------------------------------------------
  // Saving (the app uses these; tests do not)
  // ---------------------------------------------------------------------
  function loadAccounts() {
    try {
      const raw = localStorage.getItem(ACCOUNTS_KEY);
      return raw ? normalizeAccounts((JSON.parse(raw) || {}).accounts) : [];
    } catch (e) { return []; }
  }
  function saveAccounts(accounts) {
    try { localStorage.setItem(ACCOUNTS_KEY, JSON.stringify({ version: 1, accounts })); return true; }
    catch (e) { return false; }
  }
  function loadSession() {
    try { return sessionStorage.getItem(SESSION_KEY); } catch (e) { return null; }
  }
  function saveSession(accountId) {
    try { if (accountId) sessionStorage.setItem(SESSION_KEY, accountId); else sessionStorage.removeItem(SESSION_KEY); }
    catch (e) { /* storage blocked: the person stays signed in until the page is closed */ }
  }

  window.SchedAccounts = {
    ROLE_KEYS, MANAGER_ROLES, ITERATIONS, ACCOUNTS_KEY,
    sha256, pbkdf2Sha256, hashPassword, toHex, fromHex,
    canonicalName, normalizeUsername, checkName, checkUsername, checkPassword,
    makeAccount, verifyPassword, withNewPassword, findByUsername,
    activeAdmins, managerCount, checkChange, linkedFaculty, relinkAfterRename, normalizeAccounts,
    loadAccounts, saveAccounts, loadSession, saveSession,
  };
})();
