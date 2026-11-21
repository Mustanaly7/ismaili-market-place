import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { env, isS3Enabled } from "./env";

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
 * Persist an uploaded image and return its public URL.
 * Uses S3/MinIO when configured; otherwise writes to /public/uploads.
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