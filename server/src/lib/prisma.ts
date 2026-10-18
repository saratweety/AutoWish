import { PrismaClient } from '@prisma/client';

// One database connection pool for the whole server.
export const prisma = new PrismaClient();
