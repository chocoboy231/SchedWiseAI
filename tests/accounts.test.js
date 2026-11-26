/* =====================================================================
   SchedWiseAI — sign-in and account tests  (tests/accounts.test.js)
   ---------------------------------------------------------------------
   Tests for accounts.js: password hashing, the account rules (usernames,
   passwords, roles, the last administrator) and teacher links.

   RUN WITH NODE (from the repository folder, Node 19 or newer):
       node tests/accounts.test.js
   RUN IN A BROWSER (no Node needed): serve the folder, then open
       tests/run.html

   Password hashing is asynchronous, so these tests may return a promise.
   They never touch the app's saved data or who is signed in.
   ===================================================================== */
(function () {
  const inNode = typeof module !== "undefined" && module.exports;
  if (inNode) { global.window = global; require("../accounts.js"); }
  const A = window.SchedAccounts;

  // ---------------- tiny test runner (awaits async tests) ----------------
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
  const hex = bytes => Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
  const text = s => new TextEncoder().encode(s);

  // Two existing accounts made once (hashing takes a moment) and reused.
  let ADMIN, IT;
  async function base() {
    if (!ADMIN) {
      ADMIN = (await A.makeAccount({ name: "Maria Santos", username: "msantos", role: "admin", password: "first-admin-pass" }, [])).account;
      IT = (await A.makeAccount({ name: "Jun Reyes", username: "jreyes", role: "it", password: "it-staff-pass" }, [ADMIN])).account;
    }
    return [ADMIN, IT];
  }

  // ====================================================================
  // 1. HASHING
  // ====================================================================
  test("sha256 matches the standard test vectors", () => {
    eq(hex(A.sha256(text("abc"))), "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    eq(hex(A.sha256(text(""))), "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
    eq(hex(A.sha256(text("abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq"))), "248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1", "two blocks");
  });

  test("pbkdf2Sha256 matches the standard test vectors", () => {
    eq(hex(A.pbkdf2Sha256(text("password"), text("salt"), 1, 32)), "120fb6cffcf8b32c43e7225256c4f837a86548c92ccc35480805987cb70be17b");
    eq(hex(A.pbkdf2Sha256(text("password"), text("salt"), 2, 32)), "ae4d0c95af6b46d32d0adff928f06dd02a303f8ef3c251dfd6e2d85a95474c43");
    eq(hex(A.pbkdf2Sha256(text("password"), text("salt"), 4096, 32)), "c5e478d59288c841aa530db6845c4c8d962893a001ce4e11a4963873aa98134a");
  });

  test("hashPassword gives the same result with and without the browser's crypto", async () => {
    const salt = "00112233445566778899aabbccddeeff";
    const plain = await A.hashPassword("Pässwörd 1", salt, 1000, { pureJs: true });
    eq(plain, hex(A.pbkdf2Sha256(text("Pässwörd 1"), A.fromHex(salt), 1000, 32)), "the fallback is plain PBKDF2");
    if (typeof crypto !== "undefined" && crypto.subtle) eq(await A.hashPassword("Pässwörd 1", salt, 1000), plain, "Web Crypto gives the same hash");
  });

  // ====================================================================
  // 2. MAKING ACCOUNTS AND CHECKING PASSWORDS
  // ====================================================================
  test("makeAccount stores a salted hash, never the password", async () => {
    const [admin] = await base();
    const r = await A.makeAccount({ name: "Ana Cruz", username: "ACruz", role: "faculty", facultyName: "Ana Cruz", password: "teach-well-2026", mustChangePassword: true }, [admin]);
    assert(r.account, r.error);
    const acc = r.account;
    eq(acc.username, "acruz", "usernames are stored in small letters");
    eq(acc.role, "faculty"); eq(acc.facultyName, "Ana Cruz"); eq(acc.mustChangePassword, true); eq(acc.disabled, false);
    eq(acc.iterations, A.ITERATIONS);
    assert(/^[0-9a-f]{32}$/.test(acc.salt) && /^[0-9a-f]{64}$/.test(acc.hash), "salt and hash are hex");
    assert(!JSON.stringify(acc).includes("teach-well-2026"), "the password itself is not stored");
    const twin = (await A.makeAccount({ name: "Ana Twin", username: "atwin", role: "chair", password: "teach-well-2026" }, [admin, acc])).account;
    assert(twin.salt !== acc.salt && twin.hash !== acc.hash, "the same password gets a different salt and hash");
    eq(twin.facultyName, null, "only Faculty Member accounts are linked to a teacher");
    eq(await A.verifyPassword(acc, "teach-well-2026"), true, "right password");
    eq(await A.verifyPassword(acc, "teach-well-2025"), false, "wrong password");
    eq(await A.verifyPassword(acc, ""), false, "empty password");
  });

  test("withNewPassword replaces the salt and hash", async () => {
    const [admin] = await base();
    const next = await A.withNewPassword(admin, "a-brand-new-pass", true);
    assert(next.salt !== admin.salt && next.hash !== admin.hash, "new salt and hash");
    eq(next.mustChangePassword, true); eq(next.id, admin.id); eq(next.username, admin.username);
    eq(await A.verifyPassword(next, "a-brand-new-pass"), true);
    eq(await A.verifyPassword(next, "first-admin-pass"), false, "the old password no longer works");
  });

  test("makeAccount refuses missing names, unknown roles and unlinked teacher accounts", async () => {
    const [admin] = await base();
    const make = over => A.makeAccount(Object.assign({ name: "Ben Lim", username: "blim", role: "chair", password: "chair-pass-123" }, over), [admin]);
    assert((await make({ name: "  " })).error, "a name is needed");
    assert((await make({ role: "boss" })).error, "unknown role");
    assert((await make({ role: "faculty", facultyName: "" })).error, "a teacher account must name its teacher");
    assert((await make({ username: "MSantos" })).error, "username taken, ignoring capitals");
    assert((await make({ password: "short" })).error, "password too short");
    assert((await make({})).account, "a correct account is made");
  });

  // ====================================================================
  // 3. RULES
  // ====================================================================
  test("usernames: 3 to 32 letters, digits, dots, dashes or underscores, unique ignoring capitals", async () => {
    const [admin] = await base();
    eq(A.checkUsername("ana.cruz_2-b", [admin]), null);
    assert(A.checkUsername("ab", [admin]), "too short");
    assert(A.checkUsername("a".repeat(33), [admin]), "too long");
    assert(A.checkUsername("ana cruz", [admin]), "no spaces");
    assert(A.checkUsername("añ@cruz", [admin]), "no other characters");
    assert(A.checkUsername(" MSANTOS ", [admin]), "already used, ignoring capitals and spaces around");
    eq(A.checkUsername("msantos", [admin], admin.id), null, "an account may keep its own username");
  });

  test("passwords: 8 to 128 characters and not the username", () => {
    eq(A.checkPassword("eight-ch", "ana"), null);
    assert(A.checkPassword("seven-c", "ana"), "too short");
    assert(A.checkPassword("x".repeat(129), "ana"), "too long");
    assert(A.checkPassword("Ana.Cruz1", "ana.cruz1"), "same as the username");
    assert(A.checkPassword("        ", "ana"), "only spaces");
  });

  test("findByUsername ignores capitals and spaces around", async () => {
    const [admin, it] = await base();
    eq(A.findByUsername([admin, it], "  JReyes "), it);
    eq(A.findByUsername([admin, it], "nobody"), null);
  });

  test("there is always an active Administrator, and nobody can lock themselves out", async () => {
    const [admin, it] = await base();
    const list = [admin, it];
    assert(A.checkChange(list, admin.id, admin.id, { kind: "delete" }), "cannot delete your own account");
    assert(A.checkChange(list, admin.id, admin.id, { kind: "disable" }), "cannot turn off your own account");
    assert(A.checkChange(list, admin.id, admin.id, { kind: "role", role: "it" }), "cannot change your own role");
    assert(A.checkChange(list, it.id, admin.id, { kind: "delete" }), "the only Administrator cannot be deleted");
    assert(A.checkChange(list, it.id, admin.id, { kind: "disable" }), "the only Administrator cannot be turned off");
    assert(A.checkChange(list, it.id, admin.id, { kind: "role", role: "chair" }), "the only Administrator keeps the role");
    eq(A.checkChange(list, admin.id, it.id, { kind: "delete" }), null, "another account can be deleted");
    const second = Object.assign({}, admin, { id: "acc-second", username: "admin2", disabled: false });
    eq(A.checkChange([admin, it, second], it.id, admin.id, { kind: "delete" }), null, "with two Administrators one may go");
    const off = Object.assign({}, second, { disabled: true });
    assert(A.checkChange([admin, it, off], it.id, admin.id, { kind: "disable" }), "a turned-off Administrator does not count");
    eq(A.managerCount([admin, it, off]), 2, "active Administrator and IT accounts");
  });

  // ====================================================================
  // 4. TEACHER LINKS AND SAVED ACCOUNTS
  // ====================================================================
  test("teacher accounts are linked by name, ignoring capitals and extra spaces", () => {
    const faculty = [{ id: 3, name: "Ana  Cruz" }, { id: 4, name: "Ben Lim" }];
    eq(A.linkedFaculty({ role: "faculty", facultyName: " ana cruz" }, faculty), faculty[0]);
    eq(A.linkedFaculty({ role: "faculty", facultyName: "Carla Diaz" }, faculty), null, "no teacher with that name");
    eq(A.linkedFaculty({ role: "chair", facultyName: "Ben Lim" }, faculty), null, "only Faculty Member accounts are linked");
  });

  test("renaming a teacher keeps their account linked", () => {
    const accounts = [{ id: "a", role: "faculty", facultyName: "Ana Cruz" }, { id: "b", role: "faculty", facultyName: "Ben Lim" }];
    const next = A.relinkAfterRename(accounts, "ana  cruz", "Ana M. Cruz");
    eq(next[0].facultyName, "Ana M. Cruz"); eq(next[1].facultyName, "Ben Lim");
    eq(accounts[0].facultyName, "Ana Cruz", "the old list is not changed");
  });

  test("damaged saved accounts are dropped, good ones kept", async () => {
    const [admin, it] = await base();
    const kept = A.normalizeAccounts([admin, null, { username: 5 }, Object.assign({}, it, { role: "boss" }), Object.assign({}, it, { hash: "xyz" }), it]);
    eq(kept.length, 2); eq(kept[0].id, admin.id); eq(kept[1].id, it.id);
    eq(A.normalizeAccounts("not a list").length, 0);
    eq(A.normalizeAccounts([admin, admin]).length, 1, "a repeated id is kept once");
  });

  // ---------------- run ----------------
  (async () => {
    show("\nAccounts tests");
    let passed = 0, failed = 0; const t0 = Date.now();
    for (const t of tests) {
      const t1 = Date.now();
      try { await t.fn(); passed++; show("  ok   " + t.name + "  (" + (Date.now() - t1) + " ms)"); }
      catch (e) { failed++; show("  FAIL " + t.name + "\n         " + e.message); }
    }
    show("\n" + passed + " passed, " + failed + " failed  (" + ((Date.now() - t0) / 1000).toFixed(1) + " s)");
    window.__accountsTestResult = { passed, failed };
    if (inNode) process.exit(failed ? 1 : 0);
  })();
})();
