import { randomUUID } from 'node:crypto';
import express, { Router } from 'express';
import { currentUserId } from '../lib/auth';
import { getPhoto, photosEnabled, photoUrlFromKey, putPhoto } from '../lib/photoStore';

export const photosRouter = Router();

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// POST /photos  ->  uploads one profile photo (the raw image as the body), returns its photoUrl.
// The app shrinks photos to at most 512 px first, so 3 MB is plenty.
photosRouter.post('/photos', express.raw({ type: IMAGE_TYPES, limit: '3mb' }), async (req, res) => {
  if (!photosEnabled) {
    res.status(503).json({ error: 'Photo uploads are not set up on the server yet.' });
    return;
  }
  const contentType = req.header('content-type')?.split(';')[0] ?? '';
  if (!IMAGE_TYPES.includes(contentType) || !Buffer.isBuffer(req.body) || req.body.length === 0) {
    res.status(400).json({ error: 'Please send a JPEG, PNG or WebP image.' });
    return;
  }
  // The owner's id goes first in the name, so only they can read it (see GET below).
  const ext = contentType === 'image/png' ? 'png' : contentType === 'image/webp' ? 'webp' : 'jpg';
  const key = `${currentUserId(res)}/${randomUUID()}.${ext}`;
  await putPhoto(key, req.body, contentType);
  res.status(201).json({ photoUrl: photoUrlFromKey(key) });
});

// GET /photos/<userId>/<file>  ->  the photo, only for the user who uploaded it.
photosRouter.get('/photos/:owner/:file', async (req, res) => {
  if (req.params.owner !== currentUserId(res)) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  const photo = await getPhoto(`${req.params.owner}/${req.params.file}`);
  if (!photo) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  // Each photo has its own random name and never changes, so the phone can keep it.
  res.setHeader('Cache-Control', 'private, max-age=31536000, immutable');
  res.type(photo.contentType).send(photo.body);
});
