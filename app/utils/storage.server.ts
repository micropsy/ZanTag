import { type AppLoadContext } from "@remix-run/cloudflare";

export async function uploadImage(
  context: AppLoadContext,
  key: string,
  file: File | Blob,
  contentType?: string
) {
  const env = context.cloudflare.env as Env;
  await env.BUCKET.put(key, file, {
    httpMetadata: {
      contentType: contentType || file.type,
    },
  });
  return key;
}

export async function deleteImage(context: AppLoadContext, key: string) {
  const env = context.cloudflare.env as Env;
  await env.BUCKET.delete(key);
}

export async function getImageUrl(context: AppLoadContext, key: string) {
  // Assuming public access or presigned URL logic if needed.
  // For R2 public buckets, it's usually https://<pub-url>/<key>
  // Or if private, use presigned.
  // For now, returning key or a simple path.
  // Let's implement a basic retrieval if needed, or just upload/delete as requested.
  // User asked for "handle R2 image uploads and deletions".
  return key;
}
