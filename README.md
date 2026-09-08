# Multiply

A calm, friendly way to practise the 1–9 times tables. Plain HTML, CSS, and JavaScript; no browser dependencies or build step.

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
npx playwright install chromium
npm test
npm run test:browser
```

The browser tests start the same local server automatically if it is not running.
