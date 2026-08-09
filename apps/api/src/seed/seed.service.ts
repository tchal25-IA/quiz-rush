import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CATEGORIES } from '@quiz-rush/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    const count = await this.prisma.category.count();
    if (count === 0) {
      this.logger.log('Empty database detected — seeding MVP content…');
      await this.seed();
      return;
    }

    const variants = await this.prisma.question.count({
      where: { text: { contains: 'variante' } },
    });
    if (variants > 0) {
      this.logger.log(`Refreshing ${variants} low-quality variant questions…`);
      await this.refreshQuestions();
    }
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

    await this.ensureMissions();
    this.logger.log(`Seed complete: ${total} questions`);
  }

  private async refreshQuestions() {
    await this.prisma.answer.deleteMany({});
    await this.prisma.question.deleteMany({});
    const banks = this.buildBank();
    const categories = await this.prisma.category.findMany();
    let total = 0;
    for (const cat of categories) {
      const questions = banks[cat.slug] ?? [];
      if (!questions.length) continue;
      await this.prisma.question.createMany({
        data: questions.map((qu) => ({ ...qu, categoryId: cat.id, status: 'active' })),
      });
      total += questions.length;
    }
    await this.ensureMissions();
    this.logger.log(`Question refresh complete: ${total} questions`);
  }

  private async ensureMissions() {
    const missions = [
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
    ];
    for (const m of missions) {
      await this.prisma.mission.upsert({
        where: { code: m.code },
        create: m,
        update: {
          title: m.title,
          description: m.description,
          target: m.target,
          xpReward: m.xpReward,
          gemsReward: m.gemsReward,
          active: true,
        },
      });
    }
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
      difficulty: string = 'medium',
    ): Q => ({
      text,
      answerA: answers[0],
      answerB: answers[1],
      answerC: answers[2],
      answerD: answers[3],
      correctAnswer,
      explanation,
      difficulty,
    });

    const culture = [
      q('Combien y a-t-il de continents ?', ['5', '6', '7', '8'], 'C', 'On compte généralement 7 continents.'),
      q('Qui a peint la Joconde ?', ['Michel-Ange', 'Léonard de Vinci', 'Raphaël', 'Botticelli'], 'B'),
      q('Quelle planète est la plus proche du Soleil ?', ['Vénus', 'Mars', 'Mercure', 'Terre'], 'C'),
      q('Combien de minutes dans une heure ?', ['50', '60', '100', '90'], 'B', undefined, 'easy'),
      q('Quel animal est le plus rapide sur terre ?', ['Lion', 'Guépard', 'Léopard', 'Antilope'], 'B'),
      q('Quelle est la langue la plus parlée au monde (natifs) ?', ['Anglais', 'Espagnol', 'Mandarin', 'Hindi'], 'C'),
      q('Combien de côtés a un hexagone ?', ['5', '6', '7', '8'], 'B', undefined, 'easy'),
      q('Quel instrument a 88 touches ?', ['Guitare', 'Piano', 'Harpe', 'Accordéon'], 'B'),
      q('Qui a écrit « Les Misérables » ?', ['Zola', 'Hugo', 'Balzac', 'Flaubert'], 'B'),
      q('Quelle boisson est faite de raisins fermentés ?', ['Bière', 'Cidre', 'Vin', 'Whisky'], 'C', undefined, 'easy'),
      q('Combien de couleurs dans un arc-en-ciel classique ?', ['5', '6', '7', '8'], 'C'),
      q('Quel pays a inventé les Jeux olympiques antiques ?', ['Italie', 'Égypte', 'Grèce', 'Turquie'], 'C'),
      q('La Tour Eiffel a été construite pour :', ['Exposition 1889', 'JO 1900', 'Révolution', 'Guerre 14'], 'A'),
      q('Quel métal compose principalement les pièces de 1€ ?', ['Or', 'Fer', 'Alliage cupro-nickel', 'Aluminium pur'], 'C'),
      q('Combien de lettres dans l’alphabet français ?', ['24', '25', '26', '27'], 'C', undefined, 'easy'),
      q('Quel est le plus grand océan ?', ['Atlantique', 'Indien', 'Pacifique', 'Arctique'], 'C'),
      q('Qui a composé « La Flûte enchantée » ?', ['Bach', 'Mozart', 'Beethoven', 'Chopin'], 'B'),
      q('Quelle vitamine est surtout apportée par le soleil ?', ['A', 'B12', 'C', 'D'], 'D'),
      q('Le Yin et le Yang viennent de quelle culture ?', ['Japonaise', 'Chinoise', 'Indienne', 'Coréenne'], 'B'),
      q('Combien de jours compte une année bissextile ?', ['364', '365', '366', '367'], 'C'),
      q('Quel peintre a coupé une partie de son oreille ?', ['Monet', 'Van Gogh', 'Picasso', 'Dali'], 'B'),
      q('Quelle est la capitale de l’Australie ?', ['Sydney', 'Melbourne', 'Canberra', 'Perth'], 'C'),
      q('Combien de joueurs dans une équipe de volley (sur terrain) ?', ['5', '6', '7', '8'], 'B'),
      q('Quel gaz les plantes absorbent-elles ?', ['Oxygène', 'Azote', 'CO2', 'Hélium'], 'C'),
      q('Qui a formulé E=mc² ?', ['Newton', 'Einstein', 'Tesla', 'Hawking'], 'B'),
    ];

    const histoire = [
      q('En quelle année a commencé la Révolution française ?', ['1776', '1789', '1815', '1848'], 'B'),
      q('Qui était le premier empereur romain ?', ['Jules César', 'Auguste', 'Néron', 'Caligula'], 'B'),
      q('Quel mur est tombé en 1989 ?', ['Mur d’Hadrien', 'Mur de Berlin', 'Grande Muraille', 'Mur des Lamentations'], 'B'),
      q('La Seconde Guerre mondiale a commencé en :', ['1914', '1939', '1945', '1929'], 'B'),
      q('Qui a inventé l’imprimerie en Europe ?', ['Galilée', 'Gutenberg', 'Copernic', 'Pascal'], 'B'),
      q('Cléopâtre régnait sur :', ['La Perse', 'L’Égypte', 'Babylone', 'La Grèce'], 'B'),
      q('Napoléon est né en :', ['Corse', 'Provence', 'Île-de-France', 'Bretagne'], 'A'),
      q('Le Titanic a coulé en :', ['1905', '1912', '1918', '1923'], 'B'),
      q('Qui a découvert l’Amérique en 1492 (expédition) ?', ['Magellan', 'Colomb', 'Vespucci', 'Cook'], 'B'),
      q('La Déclaration des droits de l’homme date de :', ['1789', '1793', '1804', '1848'], 'A'),
      q('Charlemagne a été couronné empereur en :', ['800', '987', '1066', '1453'], 'A'),
      q('La peste noire a frappé l’Europe au :', ['Xe siècle', 'XIVe siècle', 'XVIe siècle', 'XVIIIe siècle'], 'B'),
      q('Qui était pharaon au temps de Toutânkhamon ?', ['Il l’était', 'Ramsès II', 'Cléopâtre', 'Akhenaton seul'], 'A'),
      q('L’armistice de 1918 a été signé le :', ['11 novembre', '8 mai', '14 juillet', '1er mai'], 'A'),
      q('Jeanne d’Arc est morte à :', ['Orléans', 'Rouen', 'Reims', 'Paris'], 'B'),
      q('La chute de Constantinople a lieu en :', ['1204', '1453', '1492', '1520'], 'B'),
      q('Qui a écrit le « Journal » pendant l’Occupation (Anne) ?', ['Frank', 'Beauvoir', 'Curie', 'Sand'], 'A'),
      q('La Guerre de Cent Ans opposait surtout :', ['France et Angleterre', 'France et Espagne', 'Espagne et Portugal', 'Italie et Autriche'], 'A'),
      q('L’indépendance des USA est proclamée en :', ['1776', '1789', '1812', '1865'], 'A'),
      q('Qui a unifié l’Allemagne au XIXe siècle ?', ['Metternich', 'Bismarck', 'Guillaume Tell', 'Luther'], 'B'),
      q('La Révolution russe a lieu en :', ['1905', '1917', '1922', '1939'], 'B'),
      q('Le traité de Verdun (843) partage :', ['L’Empire romain', 'L’Empire carolingien', 'La France', 'L’Espagne'], 'B'),
      q('Qui a peint le plafond de la chapelle Sixtine ?', ['Raphaël', 'Michel-Ange', 'Donatello', 'Le Bernin'], 'B'),
      q('La Première Guerre mondiale s’achève en :', ['1916', '1917', '1918', '1919'], 'C'),
      q('Mahatma Gandhi est associé à l’indépendance de :', ['Pakistan', 'Inde', 'Sri Lanka', 'Népal'], 'B'),
    ];

    const sciences = [
      q('Quelle est la formule chimique de l’eau ?', ['CO2', 'H2O', 'O2', 'NaCl'], 'B', undefined, 'easy'),
      q('Combien d’os dans le corps humain adulte (approx.) ?', ['106', '206', '306', '156'], 'B'),
      q('Quelle planète a des anneaux célèbres ?', ['Mars', 'Jupiter', 'Saturne', 'Vénus'], 'C'),
      q('La photosynthèse produit principalement :', ['Azote', 'Oxygène', 'Hélium', 'Méthane'], 'B'),
      q('Le symbole chimique de l’or est :', ['Ag', 'Au', 'Fe', 'Pb'], 'B'),
      q('Quelle est la vitesse de la lumière (approx.) ?', ['300 km/s', '300 000 km/s', '30 000 km/s', '3 000 km/s'], 'B'),
      q('Combien de chromosomes chez l’humain ?', ['23', '46', '48', '44'], 'B'),
      q('Quel organe produit l’insuline ?', ['Foie', 'Pancréas', 'Rate', 'Rein'], 'B'),
      q('L’unité de force est :', ['Watt', 'Newton', 'Joule', 'Pascal'], 'B'),
      q('Quel gaz est majoritaire dans l’air ?', ['Oxygène', 'Azote', 'CO2', 'Argon'], 'B'),
      q('La Terre tourne autour du Soleil en :', ['24 h', '30 j', '365 j', '12 h'], 'C', undefined, 'easy'),
      q('Quel animal est un mammifère marin ?', ['Requin', 'Dauphin', 'Thon', 'Méduse'], 'B'),
      q('pH 7 correspond à :', ['Acide', 'Basique', 'Neutre', 'Salé'], 'C'),
      q('Le plus petit os du corps est dans :', ['La main', 'L’oreille', 'Le pied', 'Le nez'], 'B'),
      q('Quelle planète est une géante gazeuse ?', ['Mars', 'Mercure', 'Jupiter', 'Vénus'], 'C'),
      q('ADN signifie :', ['Acide désoxyribonucléique', 'Agent dynamisant naturel', 'Azote dur nuclearisé', 'Acide dinitrique'], 'A'),
      q('Combien de dents permanentes chez l’adulte (souvent) ?', ['28', '30', '32', '36'], 'C'),
      q('Le fer symbole chimique :', ['Fe', 'Fr', 'F', 'Fi'], 'A'),
      q('Un séisme se mesure souvent avec :', ['Beaufort', 'Richter', 'Celsius', 'Kelvin'], 'B'),
      q('La photosynthèse a besoin de :', ['Obscurité', 'Lumière', 'Sel', 'Vent'], 'B', undefined, 'easy'),
      q('Quel satelllite naturel orbite la Terre ?', ['Titan', 'Europe', 'La Lune', 'Phobos'], 'C'),
      q('L’eau bout à (niveau mer) :', ['90°C', '100°C', '110°C', '120°C'], 'B', undefined, 'easy'),
      q('Les abeilles produisent :', ['Cire seule', 'Miel', 'Soie', 'Latex'], 'B'),
      q('Quel scientifique a proposé la relativité ?', ['Newton', 'Einstein', 'Galilée', 'Bohr'], 'B'),
      q('Le sodium a pour symbole :', ['So', 'Na', 'Sd', 'Sm'], 'B'),
    ];

    const geo = [
      q('Capitale de la France ?', ['Lyon', 'Marseille', 'Paris', 'Bordeaux'], 'C', undefined, 'easy'),
      q('Plus haute montagne ?', ['K2', 'Everest', 'Mont Blanc', 'Kilimandjaro'], 'B'),
      q('Capitale du Japon ?', ['Osaka', 'Kyoto', 'Tokyo', 'Nagoya'], 'C'),
      q('Désert chaud le plus grand ?', ['Gobi', 'Sahara', 'Kalahari', 'Atacama'], 'B'),
      q('Capitale du Canada ?', ['Toronto', 'Vancouver', 'Ottawa', 'Montréal'], 'C'),
      q('Fleuve le plus long souvent cité ?', ['Amazone', 'Nil', 'Yangtsé', 'Mississippi'], 'B'),
      q('Plus grand pays du monde (superficie) ?', ['Chine', 'USA', 'Canada', 'Russie'], 'D'),
      q('Capitale de l’Italie ?', ['Milan', 'Rome', 'Naples', 'Turin'], 'B', undefined, 'easy'),
      q('Où se trouve le Machu Picchu ?', ['Mexique', 'Pérou', 'Chili', 'Bolivie'], 'B'),
      q('Capitale de l’Espagne ?', ['Barcelone', 'Madrid', 'Séville', 'Valence'], 'B'),
      q('Le Nil se jette dans :', ['Atlantique', 'Méditerranée', 'Mer Rouge', 'Océan Indien'], 'B'),
      q('Quelle île est la plus grande ?', ['Madagascar', 'Groenland', 'Bornéo', 'Grande-Bretagne'], 'B'),
      q('Capitale de l’Allemagne ?', ['Munich', 'Hambourg', 'Berlin', 'Francfort'], 'C'),
      q('Les Andes se trouvent en :', ['Afrique', 'Asie', 'Amérique du Sud', 'Europe'], 'C'),
      q('Capitale du Brésil ?', ['Rio', 'São Paulo', 'Brasília', 'Salvador'], 'C'),
      q('Mer entre l’Europe et l’Afrique ?', ['Caspienne', 'Méditerranée', 'Baltique', 'Noire'], 'B'),
      q('Capitale de l’Égypte ?', ['Alexandrie', 'Le Caire', 'Louxor', 'Gizeh'], 'B'),
      q('Quel pays a la forme d’une botte ?', ['Espagne', 'Italie', 'Grèce', 'Portugal'], 'B', undefined, 'easy'),
      q('Le Mont Blanc est principalement en :', ['Espagne', 'France/Italie', 'Allemagne', 'Autriche'], 'B'),
      q('Capitale de la Chine ?', ['Shanghai', 'Hong Kong', 'Pékin', 'Canton'], 'C'),
      q('Océan à l’ouest de l’Europe ?', ['Pacifique', 'Indien', 'Atlantique', 'Arctique'], 'C'),
      q('Capitale de la Belgique ?', ['Anvers', 'Bruges', 'Bruxelles', 'Liège'], 'C'),
      q('Le Sahara est principalement en :', ['Asie', 'Afrique', 'Australie', 'Amérique'], 'B', undefined, 'easy'),
      q('Capitale de la Suède ?', ['Oslo', 'Stockholm', 'Helsinki', 'Copenhague'], 'B'),
      q('Quelle ville est coupée par un mur jusqu’en 1989 ?', ['Vienne', 'Berlin', 'Prague', 'Varsovie'], 'B'),
    ];

    const sport = [
      q('Combien de joueurs sur un terrain de football (par équipe) ?', ['9', '10', '11', '12'], 'C'),
      q('Les JO d’été ont lieu tous les :', ['2 ans', '3 ans', '4 ans', '5 ans'], 'C'),
      q('Sport de Rafael Nadal ?', ['Golf', 'Tennis', 'Foot', 'Basket'], 'B', undefined, 'easy'),
      q('NBA est liée au :', ['Foot', 'Basket', 'Baseball', 'Hockey'], 'B'),
      q('Un marathon fait environ :', ['21 km', '42 km', '10 km', '50 km'], 'B'),
      q('Combien de sets pour gagner un match de tennis Grand Chelem (hommes) ?', ['1', '2', '3', 'Sur 5'], 'D'),
      q('Sport inventé par James Naismith ?', ['Volley', 'Basket', 'Handball', 'Rugby'], 'B'),
      q('Coupe du monde football créée en :', ['1920', '1930', '1950', '1966'], 'B'),
      q('Un essai au rugby vaut (sans transformation) :', ['3 pts', '5 pts', '7 pts', '2 pts'], 'B'),
      q('Usain Bolt est associé à :', ['Natation', 'Sprint', 'Saut', 'Lancer'], 'B', undefined, 'easy'),
      q('Combien de trous sur un parcours de golf standard ?', ['9', '12', '18', '24'], 'C'),
      q('Le Tour de France est :', ['Auto', 'Cyclisme', 'Moto', 'Course à pied'], 'B', undefined, 'easy'),
      q('Sport de Michael Phelps ?', ['Athlétisme', 'Natation', 'Plongeon', 'Water-polo'], 'B'),
      q('Un panier à 3 points au basket est tiré :', ['Dans la raquette', 'Derrière l’arc', 'De la ligne médiane', 'Du banc'], 'B'),
      q('Combats de sumo : pays d’origine ?', ['Chine', 'Corée', 'Japon', 'Mongolie'], 'C'),
      q('Formule 1 : combien de points pour une victoire (système actuel) ?', ['10', '25', '20', '15'], 'B'),
      q('Sport de Simone Biles ?', ['Natation', 'Gymnastique', 'Athlétisme', 'Plongeon'], 'B'),
      q('Un match de handball dure :', ['2x20 min', '2x30 min', '4x10 min', '2x45 min'], 'B'),
      q('Wimbledon se joue sur :', ['Terre battue', 'Dur', 'Gazon', 'Synthétique'], 'C'),
      q('Combien de joueurs sur le terrain au basket (par équipe) ?', ['4', '5', '6', '7'], 'B', undefined, 'easy'),
      q('La Coupe Davis concerne :', ['Golf', 'Tennis', 'Voile', 'Équitation'], 'B'),
      q('Sport olympique avec un sabre :', ['Tir', 'Escrime', 'Pentathlon seul', 'Archerie'], 'B'),
      q('Un knock-out concerne surtout :', ['Tennis', 'Boxe', 'Foot', 'Natation'], 'B'),
      q('Les All Blacks représentent :', ['Australie', 'Nouvelle-Zélande', 'Afrique du Sud', 'Fidji'], 'B'),
      q('Combien de mi-temps au football ?', ['1', '2', '3', '4'], 'B', undefined, 'easy'),
    ];

    return {
      'culture-g': culture,
      histoire,
      sciences,
      geographie: geo,
      sport,
    } as Record<string, Q[]>;
  }
}
