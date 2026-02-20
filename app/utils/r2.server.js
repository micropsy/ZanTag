export async function uploadImage(env, key, data, contentType) {
    await env.BUCKET.put(key, data, contentType ? { httpMetadata: { contentType } } : undefined);
    return key;
}
