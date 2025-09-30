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

A `worker.js` file is included for serving the static assets with Cloudflare Workers KV storage. After running
`npm run build`, upload the generated `dist` directory to `__STATIC_CONTENT` and deploy the worker.

```js
import worker from './worker.js';
export default worker;
```

The worker uses `@cloudflare/kv-asset-handler` and expects `__STATIC_CONTENT` and
`__STATIC_CONTENT_MANIFEST` bindings to be configured in your `wrangler.toml`.
