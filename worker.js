import { getAssetFromKV, NotFoundError } from '@cloudflare/kv-asset-handler';

let cachedEntryPaths;

async function resolveBuiltEntry(event, request, assetOptions) {
  if (cachedEntryPaths?.script) {
    return cachedEntryPaths;
  }

  const paths = { script: null, styles: [] };

  try {
    const manifestUrl = new URL(request.url);
    manifestUrl.pathname = '/.vite/manifest.json';
    const manifestRequest = new Request(manifestUrl.toString(), {
      headers: request.headers,
      method: 'GET'
    });
    const manifestEvent = { ...event, request: manifestRequest };
    const manifestResponse = await getAssetFromKV(manifestEvent, assetOptions);
    const manifestJson = await manifestResponse.json();
    const entry = manifestJson['index.html'];
    if (entry?.file) {
      paths.script = entry.file;
    }
    if (Array.isArray(entry?.css)) {
      paths.styles = [...entry.css];
    }
  } catch (manifestError) {
    const assetManifest = assetOptions.ASSET_MANIFEST;
    if (assetManifest) {
      for (const assetKey of Object.keys(assetManifest)) {
        if (!paths.script && assetKey.startsWith('assets/') && assetKey.endsWith('.js')) {
          paths.script = assetKey;
        }
        if (assetKey.startsWith('assets/') && assetKey.endsWith('.css')) {
          paths.styles.push(assetKey);
        }
      }
    }
    if (!paths.script) {
      console.warn('Worker could not determine built entry file', manifestError);
    }
  }

  if (paths.styles.length) {
    paths.styles = [...new Set(paths.styles)];
  }

  if (paths.script) {
    cachedEntryPaths = paths;
  }
  return paths;
}

function rewriteIndexHtml(html, entryPaths) {
  let rewritten = html;

  if (entryPaths.script && html.includes('/src/main.jsx')) {
    const scriptPattern = /<script\s+type="module"\s+src="\/src\/main\.jsx"\s*><\/script>/g;
    if (scriptPattern.test(html)) {
      rewritten = rewritten.replace(
        scriptPattern,
        `<script type="module" crossorigin src="/${entryPaths.script}"></script>`
      );
    }
  }

  if (entryPaths.styles?.length) {
    const headClosePattern = /<\/head>/i;
    const existingLinks = new Set();
    const linkPattern = /<link[^>]+href="\/?([^"']+)"/gi;
    let match;
    while ((match = linkPattern.exec(rewritten)) !== null) {
      existingLinks.add(match[1]);
    }

    const linksToInject = entryPaths.styles
      .filter((stylePath) => !existingLinks.has(stylePath) && !existingLinks.has(`/${stylePath}`))
      .map((stylePath) => `    <link rel="stylesheet" href="/${stylePath}" />`);

    if (linksToInject.length && headClosePattern.test(rewritten)) {
      rewritten = rewritten.replace(headClosePattern, `${linksToInject.join('\n')}
</head>`);
    }
  }

  return rewritten;
}

export default {
  async fetch(request, env, ctx) {
    const event = {
      request,
      waitUntil: ctx?.waitUntil?.bind(ctx) ?? (() => {})
    };

    const assetManifest = env.__STATIC_CONTENT_MANIFEST
      ? JSON.parse(env.__STATIC_CONTENT_MANIFEST)
      : undefined;

    const assetOptions = {
      ASSET_NAMESPACE: env.__STATIC_CONTENT,
      ASSET_MANIFEST: assetManifest,
      cacheControl: {
        browserTTL: 60 * 60,
        edgeTTL: 60 * 60 * 24,
        bypassCache: request.method !== 'GET'
      }
    };

    try {
      const response = await getAssetFromKV(event, assetOptions);
      const url = new URL(request.url);
      const path = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
      const shouldRewrite =
        request.method === 'GET' &&
        (path === '' || path === 'index.html' || path.endsWith('/index.html'));

      if (shouldRewrite) {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('text/html')) {
          const entryPaths = await resolveBuiltEntry(event, request, assetOptions);
          if (entryPaths.script) {
            const bodyText = await response.text();
            const rewrittenBody = rewriteIndexHtml(bodyText, entryPaths);
            if (rewrittenBody !== bodyText) {
              const newHeaders = new Headers(response.headers);
              newHeaders.delete('content-length');
              return new Response(rewrittenBody, {
                status: response.status,
                statusText: response.statusText,
                headers: newHeaders
              });
            }
            const passthroughHeaders = new Headers(response.headers);
            passthroughHeaders.delete('content-length');
            return new Response(bodyText, {
              status: response.status,
              statusText: response.statusText,
              headers: passthroughHeaders
            });
          }
        }
      }

      return response;
    } catch (error) {
      if (error instanceof NotFoundError) {
        return new Response('Not found', { status: 404 });
      }
      console.error('Worker error serving asset', error);
      return new Response('Internal Error', { status: 500 });
    }
  }
};
