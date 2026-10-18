import { clerkMiddleware, getAuth } from '@clerk/express';
import cors from 'cors';
import express, { type ErrorRequestHandler } from 'express';
import { ipKeyGenerator, rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import { requireUser } from './lib/auth';
import { deletePhoto } from './lib/photoStore';
import { prisma } from './lib/prisma';
import { meRouter } from './routes/me';
import { photosRouter } from './routes/photos';
import { syncRouter } from './routes/sync';

const app = express();

// Railway puts one proxy in front of us; this lets us see the phone's real IP address.
app.set('trust proxy', 1);
app.disable('x-powered-by');

// Safe default security headers.
app.use(helmet());
// The app is a phone app, not a website, so no website may call this API from a browser.
app.use(cors({ origin: false }));
app.use(express.json({ limit: '2mb' }));

// GET /health  ->  used to check the deploy works. No login needed.
app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

// Reads the Clerk login token from the "Authorization: Bearer ..." header.
app.use(clerkMiddleware());

const isPhotoDownload = (req: express.Request) => req.method === 'GET' && req.path.startsWith('/photos/');
const rateKey = (req: express.Request) => getAuth(req).userId ?? ipKeyGenerator(req.ip ?? '');

// Showing a list of people downloads one photo each, so photo downloads get their own, bigger limit.
app.use(
  rateLimit({
    windowMs: 60_000,
    limit: 600,
    skip: (req) => !isPhotoDownload(req),
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    keyGenerator: rateKey,
    message: { error: 'Too many requests. Please wait a minute and try again.' },
  }),
);

// About 60 requests per minute per user (per IP address before login).
app.use(
  rateLimit({
    windowMs: 60_000,
    limit: 60,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skip: isPhotoDownload,
    keyGenerator: rateKey,
    message: { error: 'Too many requests. Please wait a minute and try again.' },
  }),
);

// Every route below needs a valid login.
app.use(requireUser);
app.use(meRouter);
app.use(syncRouter);
app.use(photosRouter);

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

const handleErrors: ErrorRequestHandler = (error, _req, res, _next) => {
  // Bad JSON in the request body.
  if ((error as { type?: string }).type === 'entity.parse.failed') {
    res.status(400).json({ error: 'The request was not valid JSON.' });
    return;
  }
  if ((error as { type?: string }).type === 'entity.too.large') {
    res.status(413).json({ error: 'That is too much data in one go.' });
    return;
  }
  console.error(error);
  res.status(500).json({ error: 'Something went wrong on our side. Please try again.' });
};
app.use(handleErrors);

// Cleanup job: rows soft-deleted more than 30 days ago are removed for good.
// By then every phone that was going to sync has learned about the delete.
const DAY_MS = 24 * 60 * 60 * 1000;
async function cleanUpDeletedRows() {
  const before = new Date(Date.now() - 30 * DAY_MS);
  try {
    await prisma.wish.deleteMany({ where: { deletedAt: { lt: before } } });
    const old = await prisma.specialDay.findMany({ where: { deletedAt: { lt: before } }, select: { id: true, photoUrl: true } });
    for (const day of old) await deletePhoto(day.photoUrl);
    await prisma.specialDay.deleteMany({ where: { id: { in: old.map((d) => d.id) } } });
  } catch (error) {
    console.error('Cleanup failed', error);
  }
}

const port = Number(process.env.PORT) || 8080;
app.listen(port, () => {
  console.log(`AutoWish server listening on port ${port}`);
  cleanUpDeletedRows();
  setInterval(cleanUpDeletedRows, DAY_MS);
});
