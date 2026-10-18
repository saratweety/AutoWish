import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { useEffect, useState } from 'react';
import type { ImageSourcePropType } from 'react-native';
import { api, API_URL, ApiError, authHeaders } from './client';

// Profile photos (CLAUDE.md 14.6). A photo picked on a phone (photoUri) only exists
// on that phone. To show it on other phones too, we shrink it, upload it, and save
// the server's address for it (photoUrl) on the special day.

const MAX_SIZE = 512;

/** Makes a small JPEG copy (longest side at most 512 px) to upload. */
async function shrink(uri: string) {
  const original = await ImageManipulator.manipulate(uri).renderAsync();
  const context = ImageManipulator.manipulate(uri);
  if (Math.max(original.width, original.height) > MAX_SIZE) {
    context.resize(original.width >= original.height ? { width: MAX_SIZE } : { height: MAX_SIZE });
  }
  const small = await (await context.renderAsync()).saveAsync({ compress: 0.8, format: SaveFormat.JPEG });
  return small.uri;
}

// Set when the server says photo storage isn't set up, so we stop trying until the app restarts.
let uploadsOff = false;

/**
 * Uploads a photo and returns its photoUrl, or null if photos can't be uploaded
 * right now (no storage on the server). Throws an ApiError when offline etc.
 */
export async function uploadPhoto(localUri: string): Promise<string | null> {
  if (uploadsOff) return null;
  const file = await shrink(localUri);
  const body = await (await fetch(file)).blob();
  try {
    const { photoUrl } = await api<{ photoUrl: string }>('/photos', { method: 'POST', body, contentType: 'image/jpeg', timeoutMs: 60_000 });
    return photoUrl;
  } catch (error) {
    if (error instanceof ApiError && error.status === 503) {
      uploadsOff = true;
      return null;
    }
    throw error;
  }
}

/**
 * What an <Image> should show for a person: the photo file on this phone if there is
 * one, otherwise the photo saved on the server (downloaded with the login token,
 * because only the owner may see it). undefined = no photo, show the initial.
 */
export function usePhotoSource(photoUri?: string, photoUrl?: string): ImageSourcePropType | undefined {
  // The server photo, remembered with the photoUrl it belongs to.
  const [remote, setRemote] = useState<{ url: string; source: ImageSourcePropType }>();
  const needsRemote = !photoUri && Boolean(photoUrl) && Boolean(API_URL);
  useEffect(() => {
    if (!needsRemote || !photoUrl) return;
    let cancelled = false;
    authHeaders().then((headers) => {
      if (!cancelled && headers) setRemote({ url: photoUrl, source: { uri: API_URL + photoUrl, headers } });
    });
    return () => {
      cancelled = true;
    };
  }, [needsRemote, photoUrl]);
  if (photoUri) return { uri: photoUri };
  return needsRemote && remote && remote.url === photoUrl ? remote.source : undefined;
}
