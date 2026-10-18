import { clerkClient, getAuth } from '@clerk/express';
import type { NextFunction, Request, Response } from 'express';
import { prisma } from './prisma';

/**
 * Lets a request through only with a valid Clerk login token
 * (sent by the app as "Authorization: Bearer <token>").
 *
 * RULE: the owner of every row is ALWAYS the user id inside this token.
 * Routes read it from res.locals.userId and never trust a userId sent in the body.
 */
export function requireUser(req: Request, res: Response, next: NextFunction) {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: 'Please log in again.' });
    return;
  }
  res.locals.userId = userId;
  next();
}

/** The logged-in user's id, after requireUser has run. */
export function currentUserId(res: Response): string {
  return res.locals.userId as string;
}

// Users we already know have a row, so /sync doesn't ask Clerk every time.
const knownUsers = new Set<string>();

/**
 * Creates or updates the User row with the email and name from Clerk.
 * Called by GET /me (the first call after login creates the row).
 */
export async function upsertUserFromClerk(userId: string) {
  const clerkUser = await clerkClient.users.getUser(userId);
  const email =
    clerkUser.primaryEmailAddress?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress ?? '';
  const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || null;
  const user = await prisma.user.upsert({
    where: { id: userId },
    create: { id: userId, email, name },
    update: { email, name },
  });
  knownUsers.add(userId);
  return user;
}

/** Makes sure the User row exists before we save rows that point to it. */
export async function ensureUserRow(userId: string) {
  if (knownUsers.has(userId)) return;
  const exists = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (exists) knownUsers.add(userId);
  else await upsertUserFromClerk(userId);
}

/** Forget a user (after they delete their account). */
export function forgetUser(userId: string) {
  knownUsers.delete(userId);
}
