import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CATEGORIES } from '@quiz-rush/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    const count = await this.prisma.category.count();
    if (count > 0) return;
    this.logger.log('Empty database detected — seeding MVP content…');
    await this.seed();
  }

  private async seed() {
    const banks = this.buildBank();
    let total = 0;

    for (let i = 0; i < CATEGORIES.length; i++) {
      const cat = CATEGORIES[i];
      const created = await this.prisma.category.create({
        data: {
          name: cat.name,
          slug: cat.slug,
          icon: cat.icon,
          color: cat.color,
          order: i + 1,
        },
      });
      const questions = banks[cat.slug] ?? [];
      await this.prisma.question.createMany({
        data: questions.map((qu) => ({ ...qu, categoryId: created.id, status: 'active' })),
      });
      total += questions.length;
    }

    await this.prisma.mission.createMany({
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

    this.logger.log(`Seed complete: ${total} questions`);
  }

  private buildBank() {
    type Q = {
      text: string;
      answerA: string;
      answerB: string;
      answerC: string;
      answerD: string;
      correctAnswer: string;
      explanation?: string;
      difficulty?: string;
    };

    const q = (
      text: string,
      answers: [string, string, string, string],
      correctAnswer: 'A' | 'B' | 'C' | 'D',
      explanation?: string,
    ): Q => ({
      text,
      answerA: answers[0],
      answerB: answers[1],
      answerC: answers[2],
      answerD: answers[3],
      correctAnswer,
      explanation,
      difficulty: 'medium',
    });

    const expand = (base: Q[], label: string, target: number): Q[] => {
      const out = [...base];
      let i = 1;
      while (out.length < target) {
        const src = base[i % base.length];
        const n = Math.floor(i / base.length) + 1;
        out.push({
          ...src,
          text: `${src.text} (variante ${label} #${n}-${(i % base.length) + 1})`,
          explanation: src.explanation ?? `Seed MVP — ${label}.`,
          difficulty: i % 3 === 0 ? 'hard' : i % 2 === 0 ? 'easy' : 'medium',
        });
        i += 1;
      }
      return out;
    };

    const culture = [
      q('Combien y a-t-il de continents ?', ['5', '6', '7', '8'], 'C'),
      q('Qui a peint la Joconde ?', ['Michel-Ange', 'Léonard de Vinci', 'Raphaël', 'Botticelli'], 'B'),
      q('Quelle planète est la plus proche du Soleil ?', ['Vénus', 'Mars', 'Mercure', 'Terre'], 'C'),
      q('Combien de minutes dans une heure ?', ['50', '60', '100', '90'], 'B'),
      q('Quel animal est le plus rapide sur terre ?', ['Lion', 'Guépard', 'Léopard', 'Antilope'], 'B'),
    ];
    const histoire = [
      q('En quelle année a commencé la Révolution française ?', ['1776', '1789', '1815', '1848'], 'B'),
      q('Qui était le premier empereur romain ?', ['Jules César', 'Auguste', 'Néron', 'Caligula'], 'B'),
      q('Quel mur est tombé en 1989 ?', ['Mur d’Hadrien', 'Mur de Berlin', 'Grande Muraille', 'Mur des Lamentations'], 'B'),
      q('La Seconde Guerre mondiale a commencé en :', ['1914', '1939', '1945', '1929'], 'B'),
      q('Qui a inventé l’imprimerie en Europe ?', ['Galilée', 'Gutemberg', 'Copernic', 'Pascal'], 'B'),
    ];
    const sciences = [
      q('Quelle est la formule chimique de l’eau ?', ['CO2', 'H2O', 'O2', 'NaCl'], 'B'),
      q('Combien d’os dans le corps humain adulte (approx.) ?', ['106', '206', '306', '156'], 'B'),
      q('Quelle planète a des anneaux célèbres ?', ['Mars', 'Jupiter', 'Saturne', 'Vénus'], 'C'),
      q('La photosynthèse produit principalement :', ['Azote', 'Oxygène', 'Hélium', 'Méthane'], 'B'),
      q('Le symbole chimique de l’or est :', ['Ag', 'Au', 'Fe', 'Pb'], 'B'),
    ];
    const geo = [
      q('Capitale de la France ?', ['Lyon', 'Marseille', 'Paris', 'Bordeaux'], 'C'),
      q('Plus haute montagne ?', ['K2', 'Everest', 'Mont Blanc', 'Kilimandjaro'], 'B'),
      q('Capitale du Japon ?', ['Osaka', 'Kyoto', 'Tokyo', 'Nagoya'], 'C'),
      q('Désert le plus grand (chaud) ?', ['Gobi', 'Sahara', 'Kalahari', 'Atacama'], 'B'),
      q('Capitale du Canada ?', ['Toronto', 'Vancouver', 'Ottawa', 'Montréal'], 'C'),
    ];
    const sport = [
      q('Combien de joueurs sur un terrain de football (par équipe) ?', ['9', '10', '11', '12'], 'C'),
      q('Les JO d’été ont lieu tous les :', ['2 ans', '3 ans', '4 ans', '5 ans'], 'C'),
      q('Sport de Rafael Nadal ?', ['Golf', 'Tennis', 'Foot', 'Basket'], 'B'),
      q('NBA est liée au :', ['Foot', 'Basket', 'Baseball', 'Hockey'], 'B'),
      q('Un marathon fait environ :', ['21 km', '42 km', '10 km', '50 km'], 'B'),
    ];

    return {
      'culture-g': expand(culture, 'Culture', 100),
      histoire: expand(histoire, 'Histoire', 100),
      sciences: expand(sciences, 'Sciences', 100),
      geographie: expand(geo, 'Géo', 100),
      sport: expand(sport, 'Sport', 100),
    } as Record<string, Q[]>;
  }
}
