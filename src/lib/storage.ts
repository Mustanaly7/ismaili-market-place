import { randomUUID, createHash } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { env, isCloudinaryEnabled, isS3Enabled } from "./env";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB before optimisation

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

/** Lazily load sharp (optional) so builds never fail if it is unavailable. */
async function loadSharp(): Promise<any | null> {
  try {
    const importer = new Function("return import('sharp')") as () => Promise<any>;
    const mod = await importer();
    return mod?.default ?? mod;
  } catch {
    return null;
  }
}

async function optimize(
  buffer: Buffer,
  type: string,
): Promise<{ buffer: Buffer; contentType: string; ext: string }> {
  const ext = EXT_BY_TYPE[type] ?? "jpg";
  const sharp = await loadSharp();
  if (!sharp) return { buffer, contentType: type, ext };
  try {
    const out: Buffer = await sharp(buffer)
      .rotate()
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer();
    return { buffer: out, contentType: "image/jpeg", ext: "jpg" };
  } catch {
    return { buffer, contentType: type, ext };
  }
}

/**
 * Upload a buffer to Cloudinary using their signed REST API (no SDK needed).
 * Returns the public `secure_url`.
 */
async function uploadToCloudinary(
  buffer: Buffer,
  contentType: string,
): Promise<string> {
  const { cloudName, apiKey, apiSecret, folder } = env.cloudinary;
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
  const signature = createHash("sha1")
    .update(paramsToSign + apiSecret)
    .digest("hex");

  const form = new URLSearchParams();
  form.set("file", `data:${contentType};base64,${buffer.toString("base64")}`);
  form.set("api_key", apiKey);
  form.set("timestamp", timestamp);
  form.set("folder", folder);
  form.set("signature", signature);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: form },
  );
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("[cloudinary] upload failed:", res.status, detail.slice(0, 300));
    throw new Error("The photo could not be uploaded. Please try again.");
  }
  const json = (await res.json()) as { secure_url?: string };
  if (!json.secure_url) throw new Error("The photo could not be uploaded. Please try again.");
  return json.secure_url;
}

/**
 * Persist an uploaded image and return its public URL.
 * Uses Cloudinary when configured, then S3/MinIO, otherwise writes to /public/uploads.
 * Images are resized/compressed on upload for slow connections.
 */
export async function saveImage(file: File): Promise<string> {
  if (!file || file.size === 0) throw new Error("Please choose a photo to upload.");
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Please upload a JPG, PNG, WEBP or GIF image.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("That photo is too large. Please use one under 8 MB.");
  }

  const raw = Buffer.from(await file.arrayBuffer());
  const { buffer, contentType, ext } = await optimize(raw, file.type);

  const day = new Date().toISOString().slice(0, 10);
  const key = `uploads/${day}/${randomUUID()}.${ext}`;

  if (isCloudinaryEnabled()) {
    return uploadToCloudinary(buffer, contentType);
  }

  if (isS3Enabled()) {
    const s3 = new S3Client({
      region: env.s3.region,
      endpoint: env.s3.endpoint,
      forcePathStyle: true,
      credentials: {
        accessKeyId: env.s3.accessKey,
        secretAccessKey: env.s3.secretKey,
      },
    });
    await s3.send(
      new PutObjectCommand({
        Bucket: env.s3.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    );
    const base = env.s3.publicUrl.replace(/\/$/, "");
    return `${base}/${key}`;
  }

  const dir = path.join(process.cwd(), "public", "uploads", day);
  await fs.mkdir(dir, { recursive: true });
  const filename = key.split("/").pop() as string;
  await fs.writeFile(path.join(dir, filename), buffer);
  return `/uploads/${day}/${filename}`;
}