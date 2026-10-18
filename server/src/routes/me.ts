import { clerkClient } from '@clerk/express';
import { Router } from 'express';
import { currentUserId, forgetUser, upsertUserFromClerk } from '../lib/auth';
import { prisma } from '../lib/prisma';

export const meRouter = Router();

// GET /me  ->  creates the User row on the first call, then returns the user.
meRouter.get('/me', async (_req, res) => {
  const user = await upsertUserFromClerk(currentUserId(res));
  res.json({ id: user.id, email: user.email, name: user.name, createdAt: user.createdAt });
});

// DELETE /me  ->  deletes the account: every row of this user, then the Clerk login.
// Google Play requires that people can delete their account from inside the app.
meRouter.delete('/me', async (_req, res) => {
  const userId = currentUserId(res);
  // Deleting the User row also deletes all their special days, wishes, settings and
  // gift state (onDelete: Cascade in schema.prisma). deleteMany = no error if already gone,
  // so the app can safely try again if something below fails.
  await prisma.user.deleteMany({ where: { id: userId } });
  forgetUser(userId);
  try {
    await clerkClient.users.deleteUser(userId);
  } catch (error) {
    // 404 = the Clerk user is already gone, which is what we wanted.
    const status = (error as { status?: number }).status;
    if (status !== 404) {
      console.error('Could not delete Clerk user', userId, error);
      res.status(502).json({ error: "Your data was deleted, but we couldn't finish closing your login. Please try again." });
      return;
    }
  }
  res.json({ ok: true });
});
