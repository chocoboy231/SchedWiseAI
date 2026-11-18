/* =====================================================================
   SchedWiseAI — START-UP LOADER  (loader.js)
   ---------------------------------------------------------------------
   The interface is written in app.jsx (JSX). Browsers cannot run JSX
   directly, so it must be compiled to plain JavaScript first.

   FAST PATH: app.js is app.jsx compiled ahead of time (by tools/build.html).
   It starts in a fraction of a second.

   SAFE FALLBACK: app.js records a fingerprint ("source-hash") of the
   app.jsx it was built from. If app.jsx has been edited since then (or
   app.js is missing), this loader ignores app.js, loads Babel, and
   compiles app.jsx in the browser instead. That is slower (several
   seconds) but always runs the CURRENT code. The browser console then
   says that app.js should be rebuilt.
   ===================================================================== */
(function () {
  // cyrb53: a small, fast text fingerprint (not for security, only to notice edits).
  // Line endings are normalised first, so a Windows copy (CRLF) and the published
  // copy (LF) of the same app.jsx give the same fingerprint.
  // tools/build.html uses this exact function, so keep the two in step.
  function sourceHash(text) {
    text = text.replace(/\r\n/g, "\n");
    var h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (var i = 0; i < text.length; i++) {
      var ch = text.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
  }
  window.SchedWiseSourceHash = sourceHash;
  // tools/build.html also loads this file, only to use sourceHash(). It has no app to start.
  if (!document.getElementById("root")) return;

  // Run JavaScript text as a normal page script (top-level functions become globals,
  // exactly as when app.jsx was loaded with a <script> tag).
  function run(code, name) {
    var s = document.createElement("script");
    s.text = code + "\n//# sourceURL=" + name;
    document.body.appendChild(s);
  }
  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = src; s.onload = resolve; s.onerror = function () { reject(new Error("Could not load " + src)); };
      document.head.appendChild(s);
    });
  }
  function getText(url) {
    return fetch(url).then(function (r) { if (!r.ok) throw new Error(url + " returned " + r.status); return r.text(); });
  }

  function start() {
    return Promise.all([getText("app.jsx"), getText("app.js").catch(function () { return null; })]).then(function (files) {
      var source = files[0], built = files[1];
      var m = built && built.match(/source-hash: ([0-9a-f]+)/);
      if (m && m[1] === sourceHash(source)) { run(built, "app.js"); return; }
      console.warn("SchedWiseAI: app.js is " + (built ? "older than app.jsx" : "missing") +
        ", so app.jsx is being compiled in the browser (slower start). Rebuild app.js with tools/build.html.");
      return loadScript("vendor/babel.min.js").then(function () {
        run(Babel.transform(source, { presets: ["react"] }).code, "app.jsx");
      });
    });
  }

  start().catch(function (err) {
    console.error("SchedWiseAI could not start:", err);
    var root = document.getElementById("root");
    if (root) root.innerHTML = '<div style="font:15px system-ui,sans-serif;max-width:480px;margin:15vh auto;padding:24px;background:#fff;border-radius:16px;color:#0f172a">' +
      '<h1 style="font-size:18px;margin:0 0 8px">SchedWiseAI could not start</h1>' +
      '<p style="color:#475569;margin:0">The app files could not be loaded. Open it through a web server (see the README, "Run locally"), ' +
      'not by double-clicking index.html.</p></div>';
  });
})();
