import { PrismaClient } from '@prisma/client';
import { CATEGORIES } from '@quiz-rush/shared';

const prisma = new PrismaClient();

type Q = {
  text: string;
  answerA: string;
  answerB: string;
  answerC: string;
  answerD: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation?: string;
  difficulty?: string;
};

/** Curated + generated bank — ≥100 per category */
function buildBank(): Record<string, Q[]> {
  const culture: Q[] = [
    q('Combien y a-t-il de continents ?', ['5', '6', '7', '8'], 'C', 'On compte généralement 7 continents.'),
    q('Quelle est la langue la plus parlée au monde (locuteurs natifs) ?', ['Anglais', 'Espagnol', 'Hindi', 'Mandarin'], 'D'),
    q('Qui a peint la Joconde ?', ['Michel-Ange', 'Léonard de Vinci', 'Raphaël', 'Botticelli'], 'B'),
    q('Quel est l’élément chimique Fe ?', ['Fluor', 'Fer', 'Francium', 'Fermium'], 'B'),
    q('En quelle année l’homme a-t-il marché sur la Lune ?', ['1965', '1969', '1972', '1959'], 'B'),
    q('Combien de côtés a un hexagone ?', ['5', '6', '7', '8'], 'B'),
    q('Quelle planète est la plus proche du Soleil ?', ['Vénus', 'Mars', 'Mercure', 'Terre'], 'C'),
    q('Quel animal est le plus rapide sur terre ?', ['Lion', 'Guépard', 'Léopard', 'Antilope'], 'B'),
    q('Combien de minutes dans une heure ?', ['50', '60', '100', '90'], 'B'),
    q('Quelle est la capitale de l’Australie ?', ['Sydney', 'Melbourne', 'Canberra', 'Perth'], 'C'),
  ];

  const histoire: Q[] = [
    q('En quelle année a commencé la Révolution française ?', ['1776', '1789', '1815', '1848'], 'B'),
    q('Qui était le premier empereur romain ?', ['Jules César', 'Auguste', 'Néron', 'Caligula'], 'B'),
    q('Quelle bataille marque la fin de Napoléon en 1815 ?', ['Austerlitz', 'Waterloo', 'Iéna', 'Wagram'], 'B'),
    q('Qui a découvert l’Amérique en 1492 ?', ['Magellan', 'Vasco de Gama', 'Christophe Colomb', 'Cook'], 'C'),
    q('Quel mur est tombé en 1989 ?', ['Mur d’Hadrien', 'Mur de Berlin', 'Grande Muraille', 'Mur des Lamentations'], 'B'),
    q('Qui était Cléopâtre ?', ['Reine d’Égypte', 'Impératrice romaine', 'Reine de Perse', 'Princesse grecque'], 'A'),
    q('La Seconde Guerre mondiale a commencé en :', ['1914', '1939', '1945', '1929'], 'B'),
    q('Qui a inventé l’imprimerie en Europe ?', ['Galilée', 'Gutemberg', 'Copernic', 'Pascal'], 'B'),
    q('Jeanne d’Arc est associée au :', ['XIe siècle', 'XVe siècle', 'XVIIIe siècle', 'XIIIe siècle'], 'B'),
    q('L’Empire romain d’Occident chute en :', ['476', '1453', '800', '1066'], 'A'),
  ];

  const sciences: Q[] = [
    q('Quelle est la formule chimique de l’eau ?', ['CO2', 'H2O', 'O2', 'NaCl'], 'B'),
    q('Combien d’os dans le corps humain adulte (approx.) ?', ['106', '206', '306', '156'], 'B'),
    q('Quelle planète a des anneaux célèbres ?', ['Mars', 'Jupiter', 'Saturne', 'Vénus'], 'C'),
    q('Que mesure un thermomètre ?', ['Pression', 'Température', 'Vitesse', 'Masse'], 'B'),
    q('La photosynthèse produit principalement :', ['Azote', 'Oxygène', 'Hélium', 'Méthane'], 'B'),
    q('Quelle force nous maintient au sol ?', ['Magnétisme', 'Gravité', 'Friction', 'Inertie'], 'B'),
    q('L’ADN se trouve principalement dans :', ['Le cytoplasme', 'Le noyau', 'La membrane', 'Les ribosomes'], 'B'),
    q('Vitesse de la lumière (approx.) :', ['300 km/s', '300 000 km/s', '3 000 km/s', '30 000 km/s'], 'B'),
    q('Un proton a une charge :', ['Négative', 'Positive', 'Neutre', 'Variable'], 'B'),
    q('Le symbole chimique de l’or est :', ['Ag', 'Au', 'Fe', 'Pb'], 'B'),
  ];

  const geo: Q[] = [
    q('Capitale de la France ?', ['Lyon', 'Marseille', 'Paris', 'Bordeaux'], 'C'),
    q('Plus long fleuve du monde ?', ['Amazone', 'Nil', 'Yangtsé', 'Mississippi'], 'B', 'Souvent le Nil ; débat avec l’Amazone.'),
    q('Plus haute montagne ?', ['K2', 'Everest', 'Mont Blanc', 'Kilimandjaro'], 'B'),
    q('Capitale du Japon ?', ['Osaka', 'Kyoto', 'Tokyo', 'Nagoya'], 'C'),
    q('Désert le plus grand (chaud) ?', ['Gobi', 'Sahara', 'Kalahari', 'Atacama'], 'B'),
    q('Combien d’océans principaux ?', ['3', '4', '5', '6'], 'C'),
    q('Capitale de l’Italie ?', ['Milan', 'Rome', 'Naples', 'Florence'], 'B'),
    q('Pays le plus peuplé (2020s) ?', ['USA', 'Inde', 'Chine', 'Indonésie'], 'B', 'L’Inde a dépassé la Chine.'),
    q('Fleuve qui traverse Paris ?', ['Loire', 'Seine', 'Rhône', 'Garonne'], 'B'),
    q('Capitale du Canada ?', ['Toronto', 'Vancouver', 'Ottawa', 'Montréal'], 'C'),
  ];

  const sport: Q[] = [
    q('Combien de joueurs sur un terrain de football (par équipe) ?', ['9', '10', '11', '12'], 'C'),
    q('Les JO d’été ont lieu tous les :', ['2 ans', '3 ans', '4 ans', '5 ans'], 'C'),
    q('Sport de Rafael Nadal ?', ['Golf', 'Tennis', 'Foot', 'Basket'], 'B'),
    q('Durée d’un match de football (temps réglementaire) ?', ['80 min', '90 min', '100 min', '70 min'], 'B'),
    q('Combien de sets pour gagner un match de tennis Grand Chelem Hommes ?', ['2', '3', '4', '5'], 'B', 'Premier à 3 sets (best of 5).'),
    q('NBA est liée au :', ['Foot', 'Basket', 'Baseball', 'Hockey'], 'B'),
    q('Coupe du Monde FIFA a lieu tous les :', ['2 ans', '3 ans', '4 ans', '6 ans'], 'C'),
    q('Combien de trous sur un parcours de golf standard ?', ['9', '12', '18', '21'], 'C'),
    q('Usain Bolt est connu pour :', ['Natation', 'Sprint', 'Saut', 'Marathon'], 'B'),
    q('Un marathon fait environ :', ['21 km', '42 km', '10 km', '50 km'], 'B'),
  ];

  return {
    'culture-g': expand(culture, 'Culture', 100),
    histoire: expand(histoire, 'Histoire', 100),
    sciences: expand(sciences, 'Sciences', 100),
    geographie: expand(geo, 'Géo', 100),
    sport: expand(sport, 'Sport', 100),
  };
}

function q(
  text: string,
  answers: [string, string, string, string],
  correctAnswer: 'A' | 'B' | 'C' | 'D',
  explanation?: string,
): Q {
  return {
    text,
    answerA: answers[0],
    answerB: answers[1],
    answerC: answers[2],
    answerD: answers[3],
    correctAnswer,
    explanation,
    difficulty: 'medium',
  };
}

function expand(base: Q[], label: string, target: number): Q[] {
  const out = [...base];
  let i = 1;
  while (out.length < target) {
    const src = base[i % base.length];
    const n = Math.floor(i / base.length) + 1;
    out.push({
      ...src,
      text: `${src.text} (variante ${label} #${n}-${(i % base.length) + 1})`,
      explanation: src.explanation ?? `Question générée pour seed MVP — ${label}.`,
      difficulty: i % 3 === 0 ? 'hard' : i % 2 === 0 ? 'easy' : 'medium',
    });
    i += 1;
  }
  return out;
}

async function main() {
  console.log('🌱 Seeding Quiz Rush...');

  await prisma.userMission.deleteMany();
  await prisma.mission.deleteMany();
  await prisma.answer.deleteMany();
  await prisma.quizSession.deleteMany();
  await prisma.duel.deleteMany();
  await prisma.question.deleteMany();
  await prisma.category.deleteMany();

  const bank = buildBank();
  let total = 0;

  for (let i = 0; i < CATEGORIES.length; i++) {
    const cat = CATEGORIES[i];
    const created = await prisma.category.create({
      data: {
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon,
        color: cat.color,
        order: i + 1,
      },
    });

    const questions = bank[cat.slug] ?? [];
    await prisma.question.createMany({
      data: questions.map((qu) => ({
        ...qu,
        categoryId: created.id,
        status: 'active',
      })),
    });
    total += questions.length;
    console.log(`  ✓ ${cat.name}: ${questions.length} questions`);
  }

  await prisma.mission.createMany({
    data: [
      {
        code: 'play_solo',
        title: 'Première partie',
        description: 'Termine 1 partie Solo',
        target: 1,
        xpReward: 50,
        gemsReward: 10,
      },
      {
        code: 'score_7plus',
        title: 'Presque parfait',
        description: 'Obtiens au moins 7 bonnes réponses',
        target: 1,
        xpReward: 80,
        gemsReward: 15,
      },
      {
        code: 'perfect_run',
        title: 'PERFECT x5',
        description: 'Réussis un PERFECT (10/10)',
        target: 1,
        xpReward: 200,
        gemsReward: 50,
      },
    ],
  });

  console.log(`✅ Seed terminé : ${total} questions, 5 catégories, 3 missions`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
