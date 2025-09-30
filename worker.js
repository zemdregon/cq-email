import { getAssetFromKV, NotFoundError } from '@cloudflare/kv-asset-handler';

export default {
  async fetch(request, env, ctx) {
    const event = {
      request,
      waitUntil: ctx?.waitUntil?.bind(ctx) ?? (() => {})
    };

    try {
      return await getAssetFromKV(event, {
        ASSET_NAMESPACE: env.__STATIC_CONTENT,
        ASSET_MANIFEST: env.__STATIC_CONTENT_MANIFEST
          ? JSON.parse(env.__STATIC_CONTENT_MANIFEST)
          : undefined,
        cacheControl: {
          browserTTL: 60 * 60,
          edgeTTL: 60 * 60 * 24,
          bypassCache: request.method !== 'GET'
        }
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        return new Response('Not found', { status: 404 });
      }
      console.error('Worker error serving asset', error);
      return new Response('Internal Error', { status: 500 });
    }
  }
};
