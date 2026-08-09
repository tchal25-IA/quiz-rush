-- AlterTable
CREATE TABLE "FriendChallenge" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "challengerId" TEXT,
    "categoryId" TEXT NOT NULL,
    "questionIds" TEXT[],
    "creatorScore" INTEGER NOT NULL,
    "creatorCorrect" INTEGER NOT NULL,
    "creatorMaxCombo" INTEGER NOT NULL DEFAULT 0,
    "challengerScore" INTEGER,
    "challengerCorrect" INTEGER,
    "creatorSessionId" TEXT,
    "challengerSessionId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "FriendChallenge_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FriendChallenge_code_key" ON "FriendChallenge"("code");
CREATE INDEX "FriendChallenge_code_idx" ON "FriendChallenge"("code");
CREATE INDEX "FriendChallenge_creatorId_idx" ON "FriendChallenge"("creatorId");
CREATE INDEX "FriendChallenge_status_idx" ON "FriendChallenge"("status");

ALTER TABLE "FriendChallenge" ADD CONSTRAINT "FriendChallenge_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FriendChallenge" ADD CONSTRAINT "FriendChallenge_challengerId_fkey" FOREIGN KEY ("challengerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "props" JSONB,
    "sessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AnalyticsEvent_name_createdAt_idx" ON "AnalyticsEvent"("name", "createdAt");
CREATE INDEX "AnalyticsEvent_userId_idx" ON "AnalyticsEvent"("userId");
CREATE INDEX "AnalyticsEvent_sessionId_idx" ON "AnalyticsEvent"("sessionId");

ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
