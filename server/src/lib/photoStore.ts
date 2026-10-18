import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

// Profile photos live in an S3-compatible storage bucket (a Railway Bucket,
// or Cloudflare R2). If the S3_* variables aren't set, photo uploads are
// switched off and everything else keeps working.

const bucket = process.env.S3_BUCKET;
const client =
  bucket && process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY
    ? new S3Client({
        endpoint: process.env.S3_ENDPOINT || undefined,
        region: process.env.S3_REGION || 'auto',
        forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID,
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
        },
      })
    : null;

export const photosEnabled = client !== null;

// Every photo is stored as "<userId>/<random id>.jpg" and the app saves the
// path "/photos/<userId>/<random id>.jpg". The user id in front lets us check
// ownership and delete all of a user's photos at once.
const PREFIX = '/photos/';

export function keyFromPhotoUrl(photoUrl: string) {
  return photoUrl.startsWith(PREFIX) ? photoUrl.slice(PREFIX.length) : null;
}

export function photoUrlFromKey(key: string) {
  return PREFIX + key;
}

export async function putPhoto(key: string, body: Buffer, contentType: string) {
  if (!client) throw new Error('Photo storage is not set up');
  await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType }));
}

export async function getPhoto(key: string) {
  if (!client) return null;
  try {
    const result = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    if (!result.Body) return null;
    return { body: Buffer.from(await result.Body.transformToByteArray()), contentType: result.ContentType ?? 'image/jpeg' };
  } catch {
    return null;
  }
}

/** Best effort: a photo that fails to delete is only wasted space. */
export async function deletePhoto(photoUrl: string | null | undefined) {
  const key = photoUrl ? keyFromPhotoUrl(photoUrl) : null;
  if (!client || !key) return;
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key })).catch(() => {});
}

/** Deletes every photo of one user (when they delete their account). */
export async function deleteAllPhotos(userId: string) {
  if (!client) return;
  let token: string | undefined;
  do {
    const page = await client.send(
      new ListObjectsV2Command({ Bucket: bucket, Prefix: `${userId}/`, ContinuationToken: token }),
    );
    const keys = (page.Contents ?? []).flatMap((o) => (o.Key ? [{ Key: o.Key }] : []));
    if (keys.length > 0) await client.send(new DeleteObjectsCommand({ Bucket: bucket, Delete: { Objects: keys } }));
    token = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (token);
}
