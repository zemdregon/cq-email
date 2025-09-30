# Manor Accountability Dashboard

A React interface inspired by animations from [React Bits](https://reactbits.dev/) for tracking dorm accountability scenarios.
The UI leans on an adapted `BlurText` component from the React Bits library to add animated section prompts.

## Getting started

```bash
npm install
npm run dev
```

The development server listens on port `5173` by default. Visit `http://localhost:5173` to explore the dashboard.

## Available scripts

- `npm run dev` – start the Vite development server.
- `npm run build` – generate an optimized production build in `dist/`.
- `npm run preview` – preview the built assets locally.

## Cloudflare Worker

A `worker.js` file is included for serving the static assets with Cloudflare Workers. The repository ships with a
`wrangler.toml` that binds the `dist/` output directory as `__STATIC_CONTENT` and runs `npm run build` automatically
before each deploy.

The worker reads the generated Vite manifest and rewrites the development `<script type="module" src="/src/main.jsx">`
tag to the hashed production bundle at runtime. This ensures the browser receives a real JavaScript module even if the
HTML file still references the development entry, preventing the `text/jsx` MIME type error seen previously.

```bash
wrangler deploy
```

The command above builds the assets, uploads the `dist/` contents, and deploys the Worker in one step.
