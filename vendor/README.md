# vendor/

Third-party files that SchedWiseAI needs, stored in the repository so the app **works without an internet connection** (for example in a classroom with poor Wi-Fi). They are unchanged copies of what the app used to load from CDNs.

| File | What it is | Version | Source it was copied from | License |
|---|---|---|---|---|
| `react.production.min.js` | React | 18.2.0 | https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js | MIT, © Meta Platforms, Inc. and affiliates |
| `react-dom.production.min.js` | ReactDOM | 18.2.0 | https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js | MIT, © Meta Platforms, Inc. and affiliates |
| `babel.min.js` | Babel Standalone (turns `app.jsx` into plain JavaScript in the browser) | 7.23.5 | https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.5/babel.min.js | MIT, © Babel contributors |
| `tailwind-3.4.17.js` | Tailwind CSS in-browser build (the "Play CDN" script) | 3.4.17 | https://cdn.tailwindcss.com/3.4.17 | MIT, © Tailwind Labs, Inc. |
| `inter.css`, `fonts/inter-*.woff2` | Inter font (variable, weights 100–900; Latin and Latin Extended) | Google Fonts v20 | https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800 | SIL Open Font License 1.1, © 2016 The Inter Project Authors (https://github.com/rsms/inter) |

Downloaded on 2026-10-14.

**Do not edit these files.** To update one, download the new version from its source, replace the file, and check the app in a browser.

The Tailwind in-browser build is meant for prototypes. It works offline, but the browser console may show a "should not be used in production" notice. That is expected for this project.
