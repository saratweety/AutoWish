-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpecialDay" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "occasion" TEXT NOT NULL,
    "customOccasion" TEXT,
    "month" INTEGER NOT NULL,
    "day" INTEGER NOT NULL,
    "year" INTEGER,
    "relationship" TEXT NOT NULL,
    "photoUrl" TEXT,
    "remindDaysBefore" INTEGER NOT NULL,
    "reminderTime" TEXT,
    "sendTime" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpecialDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wish" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "specialDayId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "tone" TEXT NOT NULL,
    "sendAtLocal" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Wish_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "userId" TEXT NOT NULL,
    "userName" TEXT,
    "userPhone" TEXT,
    "userBirthday" JSONB,
    "defaultSendTime" TEXT NOT NULL,
    "defaultRemindDaysBefore" INTEGER NOT NULL,
    "reminderTimeOfDay" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "GiftState" (
    "userId" TEXT NOT NULL,
    "stars" INTEGER NOT NULL,
    "unlocked" JSONB NOT NULL,
    "equipped" JSONB NOT NULL,
    "best" INTEGER NOT NULL DEFAULT 0,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "lastPlayed" TEXT,
    "song" INTEGER NOT NULL DEFAULT 0,
    "sfx" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GiftState_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE INDEX "SpecialDay_userId_updatedAt_idx" ON "SpecialDay"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "SpecialDay_userId_syncedAt_idx" ON "SpecialDay"("userId", "syncedAt");

-- CreateIndex
CREATE INDEX "Wish_userId_updatedAt_idx" ON "Wish"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "Wish_userId_syncedAt_idx" ON "Wish"("userId", "syncedAt");

-- AddForeignKey
ALTER TABLE "SpecialDay" ADD CONSTRAINT "SpecialDay_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wish" ADD CONSTRAINT "Wish_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settings" ADD CONSTRAINT "Settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GiftState" ADD CONSTRAINT "GiftState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

