type Env = {
  BUCKET: any;
};

export async function uploadImage(
  env: Env,
  key: string,
  data: ArrayBuffer | ArrayBufferView | Blob | ReadableStream | string,
  contentType?: string
) {
  await env.BUCKET.put(
    key,
    data,
    contentType ? { httpMetadata: { contentType } } : undefined
  );
  return key;
}
