const assert = require('node:assert/strict');
const { describe, it } = require('node:test');

require('reflect-metadata');

const {
  DailyChallengeController,
} = require('../dist/src/daily-challenge/daily-challenge.controller');
const {
  DailyChallengeService,
} = require('../dist/src/daily-challenge/daily-challenge.service');

describe('Daily Challenge', () => {
  it('looks up a participation using scalar fields', async () => {
    const expected = { completed: true, score: 900, correct: 9 };
    const findFirst = async (args) => {
      assert.deepEqual(args, {
        where: { userId: 'guest-1', challengeId: 'challenge-1' },
      });
      return expected;
    };
    const service = new DailyChallengeService({
      dailyChallengeParticipation: { findFirst },
    });

    assert.equal(
      await service.getUserParticipation('guest-1', 'challenge-1'),
      expected,
    );
  });

  it('returns today for a new guest user', async () => {
    const controller = createController(null);

    const result = await controller.getToday({ user: { id: 'guest-1' } });

    assert.equal(result.hasParticipated, false);
    assert.equal(result.userScore, null);
    assert.equal(result.userCorrect, null);
  });

  it('returns today with an existing participation', async () => {
    const controller = createController({
      completed: true,
      score: 900,
      correct: 9,
    });

    const result = await controller.getToday({ user: { id: 'user-1' } });

    assert.equal(result.hasParticipated, true);
    assert.equal(result.userScore, 900);
    assert.equal(result.userCorrect, 9);
  });
});

function createController(participation) {
  const challenge = {
    id: 'challenge-1',
    date: new Date('2026-09-11T00:00:00.000Z'),
    categoryId: 'category-1',
    questionIds: Array.from({ length: 10 }, (_, index) => `question-${index}`),
  };
  const dailyChallengeService = {
    getTodayChallenge: async () => challenge,
    getUserParticipation: async () => participation,
  };
  const prisma = {
    category: {
      findUnique: async () => ({
        id: 'category-1',
        name: 'Science',
        slug: 'science',
        icon: 'flask',
        color: '#00AEEF',
      }),
    },
  };

  return new DailyChallengeController(dailyChallengeService, {}, prisma);
}
