const DEFAULT_BUCKET = "issue-photos";

function parseDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) {
    return null;
  }

  const mimeType = match[1];
  const base64 = match[2];
  const bytes = Buffer.from(base64, "base64");
  return { mimeType, bytes };
}

function extensionForMime(mimeType: string) {
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  return "bin";
}

export async function uploadIssuePhotoToSupabase(args: { showId: string; caseId: string; issueId: string; dataUrl: string }) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || DEFAULT_BUCKET;

  if (!supabaseUrl || !serviceRoleKey) {
    return { error: "Storage not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY." };
  }

  const parsed = parseDataUrl(args.dataUrl);
  if (!parsed) {
    return { error: "Invalid image payload." };
  }

  const ext = extensionForMime(parsed.mimeType);
  const filePath = `${args.showId}/${args.caseId}/${args.issueId}.${ext}`;
  const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${filePath}`;

  const uploadRes = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
      "Content-Type": parsed.mimeType,
      "x-upsert": "true"
    },
    body: parsed.bytes
  });

  if (!uploadRes.ok) {
    const details = await uploadRes.text();
    return { error: `Storage upload failed (${uploadRes.status}): ${details}` };
  }

  const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${filePath}`;
  return { publicUrl };
}
