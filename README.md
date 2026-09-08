# Multiply

A calm, friendly way to practise the 1–9 times tables. Plain HTML, CSS, and JavaScript; no browser dependencies or build step.

## Build with Codex

Install and sign in to the Codex CLI, and have Git, Node.js 22 or newer, and Python 3 available. Start from a clean checkout:

```sh
gh repo clone alexaivars/multiply
cd multiply
codex exec --approve-for-me - < RUN.md
```

`RUN.md` tells Codex to implement the specification in `AGENTS.md` from scratch, work feature by feature, run the checks, and create local commits. The `-` reads that prompt from standard input; `--approve-for-me` sends approval requests through automatic review using the workspace-write sandbox. This command generates or changes the source files; it is not needed to run the existing app. Review Codex’s final report for completed checks and any verification it could not perform.

There is no compilation or bundling step: `public/` contains the runnable app. After Codex finishes, use the run and test commands below.

## Run

From this directory:

```sh
python3 -m http.server 8000 --bind 127.0.0.1 --directory public
```

Open http://127.0.0.1:8000. Stop with Ctrl+C. Serve **only `public/`**, never the project root.

## Repeatable checks

Use Node.js 22 or newer and Python 3. Test tooling stays outside `public/`.

```sh
npm ci
npx playwright install chromium webkit
npm test
npm run test:browser
```

The browser tests start the same local server automatically if it is not running.

## Practice and scores

- **Series 1–9:** choose this mode, then choose a table to start its nine questions in order.
- **Mixed 1–9:** choose this mode, then choose a table to start its nine shuffled flashcards.
- **Mixed all:** choosing this mode immediately starts a shuffled deck of all 81 ordered pairs. Stop whenever you like.

Each screen asks for one decision. Round scores appear only on the results screen; active questions show the question position and answer feedback. Navigation, the section title, and table context share a compact header. Statistics is available below the choices and on the results screen, outside the header. Installation help is available only on the start screen, collapsed by default. Routine offline readiness messages are omitted; relevant setup and saving problems are still explained. The final choice starts practice without another Start or Continue step. The table screen has a Back to choices action to change modes.

Type a whole-number answer in the numeric field, then press Enter or **Check answer**. That button becomes **Next** after checking; no inactive or disabled alternative is shown. Feedback stays visible until a separate Next action. Double clicks, rapid double taps, and held Enter presses cannot activate the replacement action in the same gesture. Each checked question counts once; only the first submitted answer can be correct. Invalid input and unanswered questions do not count. **Practice again** starts fresh round counters and reshuffles mixed modes.

Success rate is `correct / answered × 100`, rounded to a whole percent. Before any answers it says “No answers yet.” Overall, per-table, and per-mode counts are saved after each answer under `multiply.statistics.v1` in localStorage. In Mixed all, the first factor determines the table. Only aggregate counts are stored; no personal information, answer history, or unfinished rounds.

Open **Statistics → Reset statistics** to reset. Cancel keeps your results. Confirmation removes only this app’s key; a failed reset leaves results unchanged and reports the failure. When storage is unavailable, practice continues in memory with a notice. Statistics belong to the current browser/app and device, are not synced, and can be lost if site data is cleared. Use one practice window at a time.

## Save to iPhone or iPad

1. Host the contents of `public/` on an HTTPS static website, with the app files together at its root or in a dedicated subdirectory. Use a host you control; no backend or accounts are required by the app. Do not upload the project root or private files.
2. Open that HTTPS address in Safari, then use **Share → Add to Home Screen**. Leave **Open as Web App** on if shown, and tap **Add**.
3. Launch Multiply from the Home Screen while connected. Keep it connected for its initial download before going offline. The app also works in Safari without installation.

Localhost is suitable for desktop service-worker tests. A phone opening a computer’s plain HTTP LAN address is not a secure context for offline setup; physical-device tests need HTTPS with a certificate trusted by that device. Safari and the installed app may have separate statistics. Do not assume installation transfers existing Safari results.

After the first successful cache setup, practice and local statistics work offline. Update `CACHE` in `public/sw.js` when changing public assets, then publish them together. A new version waits until all existing app windows close. Reopening uses the update and keeps localStorage statistics. Resetting statistics does not remove the offline app cache. Icons are local PNGs; regenerate with `python3 tools/generate-icons.py`.

The installation behavior follows [Apple’s Home Screen instructions](https://support.apple.com/en-euro/guide/iphone/iphea86e5236/ios); offline setup uses the [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API).

## Device checks

The automated suite uses Chromium and WebKit, deterministic decks, and simulated storage failures. It checks full rounds, summaries, refreshes, reset, keyboard operation, responsive layouts, offline reloads and asset updates. Offline tests disconnect an isolated public-only server in both engines and additionally use Chromium’s simulated offline mode. WebKit’s simulated offline switch produces an internal error even for cached requests in this environment, so its tests use the disconnected server. Keyboard tests use Tab in Chromium and Option-Tab in WebKit to include all controls under its default macOS settings. Browser emulation does not verify physical iOS installation or the actual software keyboard.

On a physical iPhone and iPad, check portrait and landscape in Safari and in the Home Screen app: all controls remain reachable with the keyboard open; feedback is announced with VoiceOver; icons and standalone launch are correct; each mode works offline after cache setup; saved scores survive closing and reopening. Verify both canceled and confirmed resets offline. Repeat the close/reopen check after publishing an updated asset cache.

This implementation run has no physical iPhone/iPad or HTTPS deployment available. Those device installation, actual keyboard, VoiceOver announcement, and installed-app relaunch checks remain unverified.

## Optional reset utility

`RESET.sh` is for deliberately starting over, not normal development or running the app. `bash RESET.sh --dry-run` previews its targets. Running it without that flag deletes everything in the project except `.git`, `AGENTS.md`, `RUN.md`, and `RESET.sh`, including ignored and untracked files.
