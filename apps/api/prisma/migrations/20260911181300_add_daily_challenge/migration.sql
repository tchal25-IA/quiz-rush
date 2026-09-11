-- CreateTable
CREATE TABLE "DailyChallenge" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "categoryId" TEXT NOT NULL,
    "questionIds" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyChallengeParticipation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "sessionId" TEXT,
    "score" INTEGER NOT NULL DEFAULT 0,
    "correct" INTEGER NOT NULL DEFAULT 0,
    "maxCombo" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyChallengeParticipation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyChallenge_date_key" ON "DailyChallenge"("date");

-- CreateIndex
CREATE INDEX "DailyChallenge_date_idx" ON "DailyChallenge"("date");

-- CreateIndex
CREATE INDEX "DailyChallengeParticipation_challengeId_score_idx" ON "DailyChallengeParticipation"("challengeId", "score");

-- CreateIndex
CREATE INDEX "DailyChallengeParticipation_userId_idx" ON "DailyChallengeParticipation"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyChallengeParticipation_userId_challengeId_key" ON "DailyChallengeParticipation"("userId", "challengeId");

-- AddForeignKey
ALTER TABLE "DailyChallengeParticipation" ADD CONSTRAINT "DailyChallengeParticipation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyChallengeParticipation" ADD CONSTRAINT "DailyChallengeParticipation_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "DailyChallenge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
