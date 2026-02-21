export async function uploadFile(bucket: string, path: string, file: File): Promise<void> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("path", path);
  formData.append("bucket", bucket);

  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error("Upload failed");
  }
}

export function getPublicUrl(bucket: string, path: string): string {
  // TODO: Replace with actual R2 public domain or proxy URL
  return `/storage/${bucket}/${path}`;
}
