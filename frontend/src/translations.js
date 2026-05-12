// ELMAAS — translations.js
// ═══════════════════════════════════════════════════════════
// Système de citations poétiques par langue et par écran
// + Toutes les traductions UI du jeu
// ═══════════════════════════════════════════════════════════

export const LANGUES = [
  { code: "fr", nom: "Français", theme: "theme-fr" },
  { code: "en", nom: "English",  theme: "theme-en" },
  { code: "ar", nom: "العربية",  theme: "theme-ar" },
  { code: "es", nom: "Español",  theme: "theme-es" },
];

// ═══════════════════════════════════════════════════════════
// SLOGANS — 100 quotes par langue par catégorie
// Chaque langue a sa propre âme, pas une traduction
// ═══════════════════════════════════════════════════════════

export const SLOGANS = {

  // ────────────────────────────────────────────────────────
  // FRANÇAIS — Ironique, philosophique, lucide, Cioran + Camus
  // Se moque du Roi, révère l'intelligence
  // ────────────────────────────────────────────────────────
  fr: {
    accueil: [
      "Les échecs sont vieux. ELMAAS pense.",
      "Merci au français d'avoir inventé le mot « les échecs ». Aveu involontaire.",
      "Pas de pièce centrale à protéger — seulement une vision à construire.",
      "Un jeu de stratégie, d'art, et d'un tout petit ego.",
      "Tu ne lances pas une partie. Tu ouvres quelque chose.",
      "Ici, même un pion a des ambitions littéraires.",
      "Les règles existent pour que les vrais joueurs les transcendent.",
      "Un plateau, mille histoires, zéro excuse.",
      "Aux échecs, tu apprends. Ici, tu te découvres.",
      "Ton premier coup révèle déjà tout.",
      "La logique te guide. L'instinct tranche.",
      "Un jeu où perdre peut être élégant.",
      "Chaque partie commence par un mensonge : je maîtrise.",
      "Le hasard ne joue pas ici — ou peut-être qu'il joue mieux que toi.",
      "Un cheval qui saute en L depuis des siècles. Personne n'a demandé pourquoi.",
      "La reine est plus forte que le roi. Les échecs n'ont jamais expliqué ça.",
      "Soixante-quatre cases pour un jeu qui se dit « de stratégie ». ELMAAS sourit.",
      "Tu veux gagner ? Mauvais point de départ.",
      "Chaque case est une décision que tu éviteras trop tard.",
      "On commence toujours confiant. On finit rarement satisfait.",
      "Le premier coup est souvent le plus naïf.",
      "Tu vas comprendre — mais pas tout de suite.",
      "Ici, le silence joue aussi.",
      "Le plateau ne ment jamais. C'est son seul défaut.",
      "Tu n'es pas prêt. Lance quand même.",
      "Un joueur prudent est déjà en retard.",
      "Chaque partie est une autopsie en avance.",
      "Tu cherches la meilleure réponse à la mauvaise question.",
      "La stratégie rassure. L'instinct tranche.",
      "Ce jeu n'est pas juste. Il est précis.",
      "Tu veux contrôler. Tu vas subir.",
      "La confiance est un piège élégant.",
      "Tu vas faire un beau coup. Puis un mauvais. C'est ça, jouer.",
      "Même les bons coups cachent des regrets.",
      "Tu joues contre quelqu'un… et contre toi-même.",
      "Le doute est une mécanique, pas une faiblesse.",
      "Plus tu réfléchis, plus tu vois tes erreurs arriver.",
      "Tu ne perds jamais sans prévenir.",
      "Le plateau attend ta moindre hésitation.",
      "Ce jeu ne juge pas. Il expose.",
      "Tu vas apprendre. Brutalement.",
      "Un seul coup peut suffire à te définir.",
      "Bienvenue dans un jeu qui ne te simplifie pas.",
      "Ici, on ne protège pas une seule pièce. On construit une stratégie.",
      "La tour des échecs ne va jamais en diagonale. On comprend sa frustration.",
      "Un fou limité à une couleur. Même en bois, on peut faire mieux.",
      "Quatre-vingt pour cent des joueurs d'échecs pensent être dans les vingt pour cent supérieurs.",
      "ELMAAS ne tourne pas autour d'une seule pièce. Il tourne autour de chaque décision.",
      "Dans les échecs, le pion qui rêve devient reine. ELMAAS te laisse choisir ce que tu veux devenir.",
      "Ce plateau ne connaît pas la pitié. Mais il connaît l'art.",
      "Chaque couleur raconte une histoire. Laquelle est la tienne ?",
      "Il n'y a pas de bonne ouverture ici. Seulement ta vérité.",
      "Tu viens pour jouer. Tu restes pour comprendre.",
      "Le plateau est vide. Ton esprit ne devrait pas l'être.",
      "Ce que tu poses ici, tu ne pourras pas le reprendre.",
      "Toute décision prise ici était déjà en toi.",
      "Certains jouent aux échecs. D'autres jouent avec leur propre intelligence.",
      "ELMAAS n'a pas d'horloge qui s'arrête. Il a une vérité qui attend.",
      "Si tu cherches un adversaire, regarde le plateau. C'est toi.",
      "Ton cerveau est ton seul outil. C'est déjà suffisant, ou pas.",
      "Le jeu ne te jugera pas. Il te lira.",
      "Chaque partie est un aveu que tu ignorais vouloir faire.",
      "Les règles d'ELMAAS sont simples. Ce qui les entoure ne l'est pas.",
      "Tu poses une pièce. Tu ne sais pas encore ce que tu viens de dire.",
      "Ici, la couleur que tu choisis n'est pas un hasard.",
      "Ce que tu vois sur ce plateau dépend de ce que tu es.",
      "Un plateau plein de décisions et aucune qui soit neutre.",
      "Les grands joueurs ne calculent pas. Ils pressentent.",
      "Le plateau est une page. Chaque coup est un mot.",
      "ELMAAS — parce que les échecs ont eu 1500 ans pour s'améliorer et n'ont rien fait.",
      "Ici, les pions n'attendent pas la promotion. Ils choisissent.",
      "Bienvenue dans le jeu que les échecs auraient voulu inventer.",
      "Ce jeu se souvient de chaque coup. Toi aussi tu devrais.",
      "Il n'y a pas de tirage au sort dans ELMAAS. Seulement des choix.",
      "Tu vas poser une pièce. Ce geste t'appartient.",
      "La patience est une arme. La précipitation est un aveu.",
      "Certains joueurs parlent. D'autres jouent. Les meilleurs font les deux.",
      "Une partie d'ELMAAS est une conversation que personne n'oubliera.",
      "Le plateau te parle. Tu l'écoutes rarement assez tôt.",
      "Chaque case a une mémoire. Prends soin de ce que tu y déposes.",
      "Tu n'as pas encore commencé et tu es déjà en train de perdre ou de gagner.",
      "Le jeu commence avant le premier coup.",
      "Dans les échecs, tout finit autour d'une pièce. ELMAAS préfère une image entière.",
      "ELMAAS : parce qu'une image peut valoir mille plateaux.",
      "Chaque couleur que tu poses est une lettre. Ensemble, elles forment quelque chose.",
      "Tu joues pour gagner. Mais tu resteras pour avoir appris.",
      "L'art du jeu, c'est de ne pas laisser voir qu'on joue.",
      "Le plateau est neutre. Ce que tu y fais ne l'est pas.",
      "Tu vas jouer ta première partie. Elle ne sera jamais oubliée — par toi.",
      "ELMAAS : le jeu qui ne protège pas les faibles ni les forts. Seulement les clairvoyants.",
      "Même le meilleur joueur a un premier coup qu'il regrette.",
      "Ce que tu poses maintenant changera tout ce qui vient après.",
      "Prêt ? Le plateau, lui, l'est toujours.",
      "Quatre couleurs, deux joueurs, une vérité.",
      "Les échecs ont une pièce centrale. ELMAAS place le joueur au centre.",
      "Ce plateau ne t'appartient pas encore. Fais-le tien.",
      "Avant de jouer, regarde. Vraiment regarder, ça prend du temps.",
      "Tu viens ici pour jouer. Tu repartiras différent.",
    ],

    victoire: [
      "Victoire. Mais est-ce que tu as compris pourquoi ?",
      "Tu n'as pas gagné. Tu as imposé ta vision.",
      "Ton adversaire jouait. Toi, tu écrivais.",
      "C'était propre. Presque inquiétant.",
      "Même le plateau a hésité avant de te donner raison.",
      "Tu as vu ce que les autres ne voient pas.",
      "Une victoire calme est la plus dangereuse.",
      "Le génie n'est jamais pressé.",
      "Ce n'était pas un match. C'était une démonstration.",
      "Tu n'as laissé aucune issue.",
      "Gagner avec élégance est un art rare. Tu l'as.",
      "Tu as joué comme si tu connaissais déjà la fin.",
      "La différence entre vous deux était invisible. Tu l'as rendue évidente.",
      "Il jouait contre toi. Tu jouais contre le jeu.",
      "Victoire nette. Comme une phrase sans fioritures.",
      "Tu as été meilleur. Simple. Irréfutable.",
      "Ton adversaire a bien joué. Toi, tu as mieux pensé.",
      "La partie ne pouvait se terminer autrement.",
      "Tu as su quand attaquer et quand laisser venir.",
      "Ce plateau te ressemble maintenant.",
      "Tu as gagné sans bruit. C'est souvent le signe des grands.",
      "Ton adversaire cherchait à te battre. Tu cherchais à comprendre.",
      "La victoire la plus belle est celle qui paraît inévitable.",
      "Tu n'as pas précipité. Tu n'as pas hésité. Tu as joué.",
      "Il y a eu un moment où tu as tout vu. C'est là que tu as gagné.",
      "Certains joueurs gagnent par chance. Toi, tu as gagné par clarté.",
      "Tu as dominé sans écraser. C'est du talent.",
      "Le plateau a rendu son verdict. Tu n'en doutais pas.",
      "Victoire méritée. Mot pour mot.",
      "Tu as construit quelque chose de beau ici.",
      "Ton adversaire n'a pas perdu contre toi. Il a perdu contre ta méthode.",
      "Tu as rendu ce jeu simple. C'est le signe que tu le maîtrises.",
      "Une partie jouée comme ça, ça se retient.",
      "La victoire est souvent dans les détails que l'autre ignore.",
      "Tu as été précis là où il a été approximatif.",
      "Ce plateau porte maintenant ta signature.",
      "Tu as gagné parce que tu savais ce que tu voulais.",
      "Ton adversaire a bien résisté. Tu as mieux insisté.",
      "Les échecs t'auraient donné un trophée. ELMAAS te donne la vérité.",
      "Tu as joué chaque coup comme une nécessité.",
      "Il ne t'a pas vu venir. C'est exactement ce que tu voulais.",
      "Victoire sobre. Les meilleures le sont toujours.",
      "Tu as fait du jeu ce qu'il devrait être : un argument.",
      "Ton adversaire était compétent. Tu étais lucide.",
      "Il n'y avait pas de miracle ici. Juste du travail visible.",
      "Tu as joué sans peur. C'est rare.",
      "La fin était écrite dès le tiers de la partie.",
      "Tu n'as pas gagné par hasard. Le hasard n'existe pas ici.",
      "Bien joué — dans tous les sens du terme.",
      "Tu as transformé un plateau en argumment irréfutable.",
    ],

    defaite: [
      "Tu as perdu. Mais quelque chose en toi vient de grandir.",
      "La vérité fait mal — mais elle enseigne.",
      "Ce coup… tu le reverras ce soir.",
      "Ton adversaire t'a lu comme un livre ouvert.",
      "Perdre, c'est voir clair trop tard.",
      "Tu n'étais pas loin. C'est ça le pire.",
      "Chaque erreur a un goût différent. Celui-là restera.",
      "Tu savais. Mais tu n'as pas écouté.",
      "La prochaine fois, tu hésiteras moins.",
      "Ce n'est pas une fin. C'est un début brutal.",
      "Tu as perdu parce que tu as joué ce que tu voulais, pas ce qu'il fallait.",
      "L'erreur était là depuis le début. Tu l'as juste vue à la fin.",
      "Ton adversaire n'était pas plus intelligent. Il était plus attentif.",
      "Une défaite propre vaut mieux qu'une victoire confuse.",
      "Tu as offert des coups que tu ne pouvais pas te permettre.",
      "La partie a tourné en un instant. Tu l'as vu mais trop tard.",
      "Ce plateau t'a dit la vérité. C'est son rôle.",
      "Tu n'as pas perdu par manque de talent. Par manque de patience.",
      "Il n'y a pas de honte ici. Seulement des leçons.",
      "Ce coup-là était une erreur. Et tu le sais depuis que tu l'as joué.",
      "Perdre n'est pas échouer. C'est apprendre à un coût élevé.",
      "Ton adversaire a trouvé ce que tu cherchais à cacher.",
      "La défaite est une question que la prochaine partie répondra.",
      "Tu as joué vite là où il fallait réfléchir.",
      "Ce que tu as raté était à portée. C'est ça qui reste.",
      "Le plateau t'a exposé. Maintenant tu sais.",
      "Une bonne défaite te rapproche plus d'une victoire qu'une mauvaise.",
      "Tu as été battu par quelqu'un qui a su ce que tu voulais faire.",
      "La patience est ce qui t'a manqué. Elle se travaille.",
      "Ce plateau te devait une leçon. Il vient de te la donner.",
      "Tu as perdu le fil quelque part au milieu. Retrouve-le.",
      "Ton adversaire a eu un coup d'avance. Un seul. C'est tout ce qu'il faut.",
      "La défaite a une géographie précise. Retrouve l'endroit où tout a basculé.",
      "Tu n'as pas joué mal. Tu as juste joué moins bien que lui aujourd'hui.",
      "Ce plateau se souvient de tout. À toi de le battre avec cette mémoire.",
      "Le jeu t'a rendu service : il t'a montré tes limites.",
      "Cherche le coup où tu aurais dû faire autrement. Il existe.",
      "La défaite est le meilleur professeur que tu n'as pas demandé.",
      "Tu as cédé là où il fallait tenir. Note-le.",
      "Ce n'est pas lui qui a gagné. C'est toi qui as offert.",
      "Chaque partie perdue est un plan pour la prochaine.",
      "Tu seras meilleur grâce à ça. C'est ce que tu veux vraiment savoir.",
      "L'orgueil a joué pour toi quelques coups. C'est là que ça a commencé.",
      "Ton adversaire a exploité exactement ce que tu essayais de cacher.",
      "La prochaine fois, tu le verras venir.",
      "Une défaite bien analysée vaut dix victoires oubliées.",
      "Tu as perdu. Et c'est très bien.",
      "Ce plateau t'a montré qui tu es quand tu perds. Regarde.",
      "La capacité à perdre avec lucidité est plus rare que de gagner.",
      "Tu vas revenir. Et tu te souviendras de ça.",
    ],

    attente: [
      "Ton adversaire réfléchit… ou tremble.",
      "Le silence est souvent un mauvais signe pour lui.",
      "Quelqu'un, quelque part, doute déjà.",
      "Patience. Le piège se referme lentement.",
      "Plus il tarde, plus il est perdu.",
      "Même attendre fait partie du jeu.",
      "Tu joues déjà, même immobile.",
      "Chaque seconde est une pression que tu n'as pas à exercer.",
      "Il ne sait pas encore qu'il a perdu.",
      "Le silence entre deux coups en dit plus que mille stratégies.",
      "Tu regardes le plateau. Le plateau te regarde aussi.",
      "L'attente est une arme pour ceux qui savent s'en servir.",
      "Quelque part, il cherche une sortie qui n'existe pas.",
      "Ton calme est déjà une menace.",
      "Il réfléchit. Toi, tu as déjà réfléchi.",
      "Cette seconde d'attente n'appartient qu'à toi.",
      "Le plateau ne change pas. Mais lui, oui.",
      "Laisse-le réfléchir. Chaque seconde le rapproche de son erreur.",
      "Le temps n'est pas ton ennemi ici.",
      "Cette pause est un test. Reste tranquille.",
      "Il cherche. Tu as déjà trouvé.",
      "Observe. Ce moment d'hésitation est une information.",
      "Le meilleur joueur est souvent celui qui attend le mieux.",
      "Son silence dit quelque chose. Écoute.",
      "Pendant qu'il calcule, toi tu respires.",
      "L'incertitude est de son côté. La clarté de ton côté.",
      "Cette pause appartient à la partie autant que les coups.",
      "Il revient sur sa décision. C'est une faiblesse.",
      "Reste. Observe. Il va se trahir.",
      "Le temps qu'il prend est le temps qu'il ne jouera pas.",
    ],

    analyse: [
      "Analyse en cours… la vérité arrive.",
      "Le moteur ne ment jamais.",
      "Chaque erreur va être révélée. Es-tu prêt ?",
      "Tu veux vraiment savoir ce que tu as joué ?",
      "Ce moment où tout devient clair…",
      "La machine voit ce que tu refuses de voir.",
      "Prépare-toi à regretter certains coups.",
      "Analyse en profondeur… ça pique souvent.",
      "Le verdict approche. Il est toujours honnête.",
      "Ici commence la vraie partie : comprendre.",
      "Ce que tu as joué va être pesé, mesuré, jugé.",
      "Le jeu est fini. La vérité, elle, commence.",
      "Ton meilleur coup est peut-être dans cette analyse.",
      "Voir ses erreurs est un luxe que peu s'accordent.",
      "Le moteur ne tient pas compte de tes intentions. Seulement de tes coups.",
      "Cette analyse est un miroir. Regarde dedans.",
      "Ton adversaire voyait quelque chose. Tu vas découvrir quoi.",
      "Il n'y a pas de bonne ou de mauvaise analyse. Il y a la vérité.",
      "Ce que tu pensais avoir joué… et ce que tu as joué.",
      "Chaque coup que tu verras avait une meilleure alternative.",
      "L'analyse ne te demande pas de te justifier. Elle te montre.",
      "Tu vas peut-être découvrir que tu as joué mieux que tu ne le croyais.",
      "Ou pire. Mais dans les deux cas, tu progresseras.",
      "Le moteur voit à une profondeur que l'esprit humain atteint rarement.",
      "Patience. La vérité se construit coup par coup.",
      "Certains coups que tu regrettais étaient les bons. Tu vas le découvrir.",
      "D'autres que tu aimais étaient des erreurs. Tu vas le découvrir aussi.",
      "C'est ici que le joueur devient un élève.",
      "Analyse en cours — dans quelques instants, tu te connaîtras mieux.",
      "La machine analyse. Toi, apprends à écouter ce qu'elle dit.",
    ],
  },

  // ────────────────────────────────────────────────────────
  // ENGLISH — Cold, sharp, precise, Hemingway-esque directness
  // Makes chess feel antiquated, elevates clarity
  // ────────────────────────────────────────────────────────
  en: {
    accueil: [
      "Chess is old. This is alive.",
      "No fixed throne. No excuses. Just choices.",
      "You don't start a game. You start a conversation.",
      "Every move is a statement. Make it count.",
      "You think you're ready. You're not yet.",
      "Rules exist for players who haven't found the edge.",
      "Play smart. Or don't play at all.",
      "A board is just the beginning of what happens here.",
      "You don't react here. You create.",
      "This game remembers everything you do.",
      "One move. One identity.",
      "Chess has sixty-four squares. ELMAAS has no ceiling.",
      "Chess revolves around one central piece. ELMAAS revolves around every decision.",
      "A horse that jumps in an L-shape. We never questioned it. ELMAAS did.",
      "The queen does all the work. The king stands there. Sound familiar?",
      "Pawns dream of becoming queens in chess. Here, you choose what you become.",
      "Sixty-four squares and a thousand limitations. We chose depth over tradition.",
      "Chess is war with metaphors. ELMAAS is art with consequences.",
      "The rook moves in straight lines forever. Admirable rigidity.",
      "Eight soldiers. No left. No right. Just forward. ELMAAS disagrees.",
      "You're here because you've outgrown simple grids.",
      "This game doesn't ask you to protect anything. Only to build.",
      "Every color you place is a decision that cannot be undone.",
      "You don't win ELMAAS. You reveal something about yourself.",
      "The best players don't calculate more. They see more.",
      "Doubt is not weakness here. It's information.",
      "Think before you place. Think again after.",
      "The board is neutral. You are not.",
      "What you see on this board depends entirely on who you are.",
      "This isn't chess with better graphics. This is something else entirely.",
      "Your first move says something. Choose what you want to say.",
      "Confidence is the first thing this game will test.",
      "Strategy is what you do when you're sure. ELMAAS asks for more.",
      "You came to win. You might leave having understood something instead.",
      "This board has no memory of your reputation.",
      "There are no openings here. Only decisions.",
      "Every piece you hold is a possibility. Not all are equally good.",
      "The player who sees furthest doesn't always think longest.",
      "Patience is a strategy. Impatience is a tell.",
      "You're about to learn something about how you think.",
      "The board is waiting. It's always more patient than you.",
      "ELMAAS has no central piece to hide behind. Every choice matters.",
      "This is the game chess wanted to become.",
      "You can't bluff the board. It sees every choice.",
      "Whatever you're about to play — own it.",
      "Two colors. One winner. Zero luck.",
      "The board sees your hesitation before you do.",
      "You're not playing against someone. You're playing against clarity.",
      "This game has no castle that can't be taken.",
      "Your mind is the only piece that matters.",
    ],

    victoire: [
      "Clean. Precise. Inevitable.",
      "You didn't win. You dominated.",
      "That was never close.",
      "You saw further, and it showed.",
      "Control. From start to finish.",
      "That was calculated. All of it.",
      "No mistakes. That's rare.",
      "You broke their logic before they finished building it.",
      "This is what mastery looks like, quietly.",
      "You didn't rush. That's why you won.",
      "They played the game. You played them.",
      "Every move was a message. They read it too late.",
      "You turned uncertainty into inevitability.",
      "The board belongs to you now.",
      "There was a moment where it became obvious. You found it first.",
      "You made it look easy. The hardest things always do.",
      "They had a plan. Yours was better.",
      "Sharp. Direct. Finished.",
      "You won without showing everything you had. That's real strength.",
      "They never understood what they were up against.",
      "You played the right game at the right speed.",
      "Victory without noise is the loudest kind.",
      "You outthought, outplaced, and outlasted.",
      "The gap between you was invisible at the start. You made it undeniable.",
      "Earned. Every point of it.",
      "You gave them nothing to hold onto.",
      "That kind of win is a signature.",
      "You didn't just play better. You thought differently.",
      "The best victories look like they were always going to happen.",
      "Well played isn't strong enough. Well understood.",
    ],

    defaite: [
      "You saw it too late.",
      "That mistake cost everything.",
      "You hesitated once. That was enough.",
      "They were one step ahead. Exactly one.",
      "You knew better. Next time, act on it.",
      "Close isn't a category. It's a warning.",
      "You lost control at a specific moment. Find it.",
      "The game exposed you. That's its job.",
      "You played what you wanted, not what was needed.",
      "The error was small. The consequence wasn't.",
      "They didn't outplay you. They out-waited you.",
      "Your opponent found the crack. You put it there.",
      "Losing here is information. Use it.",
      "You gave away something you couldn't afford to.",
      "There was a better move. You know which one.",
      "The board told you. You didn't listen.",
      "They read your pattern. Change it.",
      "You rushed where patience was the move.",
      "This loss is a blueprint for your next win.",
      "You played with assumption. They played with observation.",
      "What went wrong was small. That's the hardest kind of lesson.",
      "You were good. Just not good enough today.",
      "The game didn't punish you. It educated you.",
      "Every loss here has a name. Find yours.",
      "You'll see this differently next time. That's the point.",
      "They won because they were present. You were somewhere else.",
      "One moment of clarity would have changed everything.",
      "You didn't lose to them. You lost to a version of yourself.",
      "Come back sharper.",
      "This is the game's way of helping you.",
    ],

    attente: [
      "They're thinking. Or they're panicking.",
      "Time reveals weakness. Watch.",
      "Silence here is pressure you didn't have to apply.",
      "They're stuck. You're not.",
      "Every second they take is a second they're uncertain.",
      "Your stillness is already a move.",
      "The board doesn't change. But they do.",
      "They came here to win. Right now they're just surviving.",
      "Let them think. Thinking costs them.",
      "The pause belongs to you. Stay in it.",
      "Their hesitation is a signal. Read it.",
      "You don't have to do anything. The clock is doing it for you.",
      "They're reconsidering. That means they're losing their way.",
      "Patience here isn't waiting. It's pressing.",
      "Your calm is the most unsettling thing on this board right now.",
      "They expected a response. You gave them silence.",
      "They're looking for something they won't find.",
      "Each second that passes shifts the weight further toward you.",
      "The board waits. So do you. The difference is, you chose to.",
      "They're calculating. You've already decided.",
      "Stay composed. The moment is coming to you.",
      "Every great player knows how to use silence.",
      "They're in their head. Stay out of yours.",
      "The longer they wait, the more they've already lost.",
      "Your opponent's silence is their loudest admission.",
      "You don't need to act. The pressure is working without you.",
      "Stillness isn't inaction. It's force held in reserve.",
      "This pause means something. Learn to read what.",
      "They need time. You needed it earlier. That's the difference.",
      "Wait. Then strike. That order matters.",
    ],

    analyse: [
      "Analyzing. No excuses now.",
      "Truth incoming. Brace.",
      "The engine sees everything. Every move. Every alternative.",
      "Mistakes were made. Some were yours. Here's which ones.",
      "Let's see what actually happened.",
      "The game is over. The lesson is just starting.",
      "What you thought you played and what you played are two different things.",
      "The engine doesn't care what you intended.",
      "This is where you stop being a player and start being a student.",
      "Every move you made had a better one. Let's find them.",
      "The analysis doesn't judge you. It shows you.",
      "What you see here will make you uncomfortable. Good.",
      "Some of your best moves weren't your best moves.",
      "Some of your worst moves were worse than you thought.",
      "The engine is faster than any human. It's also less forgiving.",
      "You're about to see the game the way it actually was.",
      "This isn't criticism. This is data.",
      "The move you were proud of might be here. Or it might not.",
      "The truth about this game is arriving.",
      "Understanding one loss here is worth ten casual wins.",
      "The engine found what you missed. Learn its language.",
      "This analysis is a conversation. Are you ready to listen?",
      "What separated you from winning is about to become very clear.",
      "Prepare to see your thinking from the outside.",
      "The board remembered every choice. Now you will too.",
      "Analysis is how good players become great players.",
      "What happened here, really happened here.",
      "Sit with this. It's worth it.",
      "The analysis will show you where the game was still yours.",
      "Your next win starts right here, in what you're about to see.",
    ],
  },

  // ────────────────────────────────────────────────────────
  // العربية — شعر المتنبي، الصوفية، الحكمة الكلاسيكية
  // فخامة، عمق، سخرية ذكية من الشطرنج
  // ────────────────────────────────────────────────────────
  ar: {
    accueil: [
      "الشطرنج قديمٌ كرقعته — وإلماس يولد من كل صورة.",
      "لا قطعة واحدة تحمل اللعبة كلها. أنتَ من يصنع المعنى.",
      "في الشطرنج يتحرك الحصان على شكل حرف. قرونٌ ولم يسأل أحدٌ لماذا.",
      "الوزيرُ يفعل كل شيء، والملك يقف. هذا ليس ذكاءً، هذا عجز.",
      "الجندي يحلم بأن يصبح وزيراً. في إلماس، أنتَ تختار ما تصبح.",
      "أربعٌ وستون خانة ظننّا أنها كافية لقرون. كانت بداية الفهم فقط.",
      "في الشطرنج تبدأ الأبيض. في إلماس، يبدأ من يرى أكثر.",
      "البرج يسير في خطٍّ مستقيم للأبد. الاستقامة المُملّة ليست فضيلة.",
      "هذه ليست لعبةً — هذا كشفٌ يرتدي ثوب اللعبة.",
      "أنتَ لا تبدأ مباراة. أنتَ تبدأ مواجهةً مع نفسك.",
      "كل حركةٍ تقول الحقيقة التي تحاول إخفاءها.",
      "اللوحة صامتة — لكنها تقرأ كل شيء.",
      "لا تبحث عن الفوز. ابحث عن الفهم. الفوز سيتبعه.",
      "في الشطرنج تُتبع القواعد. في إلماس، تختبر حدود عقلك.",
      "كل بداية تحمل وهمَ السيطرة. الحقيقة تأتي لاحقاً.",
      "اللعبة لا تحمي الأقوياء ولا الضعفاء. تحمي الواضحين.",
      "هنا لا تُصان القطع — تُكشف النوايا.",
      "ما تسميه خطةً قد يكون وهماً أنيقاً.",
      "ابدأ — وستفهم لماذا كان الشطرنج بسيطاً جداً.",
      "الشطرنج يطلب الطاعة. إلماس يطلب الجرأة.",
      "اللوحة ليست ساحة حرب — إنها مرآة.",
      "كل لاعبٍ يدخل واثقاً ويخرج صادقاً.",
      "أنتَ لا تلعب ضد خصمك وحده. تلعب ضد حدودك.",
      "كل خطوةٍ محسوبة — حتى تلك التي ستندم عليها.",
      "الشطرنج يعلمك الحذر. إلماس يعلمك الرؤية.",
      "هنا لا يوجد افتتاح محفوظ. بل بداية وعي.",
      "حتى أفضل اللاعبين يبدؤون بوهم.",
      "إلماس لا يرحب بك — بل يختبرك.",
      "ادخل، إن كنتَ مستعداً أن تُفهَم.",
      "الشطرنج أعطى الفروسية لحصانٍ لا يملكها. إلماس يعطيك إياها.",
      "كل لونٍ تضعه هنا يقول شيئاً عنك.",
      "اللوحة تنتظر. صبرها أطول من صبرك.",
      "هذا ليس جلسةً ترفيهية. هذا امتحانٌ تقدمه لنفسك.",
      "في إلماس، لا توجد قطعة مُقيَّدة. كلها تملك إرادة.",
      "قواعد إلماس بسيطة. ما يحيط بها ليس كذلك.",
      "قبل أن تلعب، انظر. النظر الحقيقي يأخذ وقتاً.",
      "ما ستضعه على هذا الطاولة لن تستطيع استرداده.",
      "كل قرارٍ اتخذته هنا كان موجوداً فيك قبل اللعب.",
      "أربع ألوان، لاعبان، حقيقة واحدة.",
      "الشطرنج يدور حول قطعة واحدة. إلماس يدور حول قراراتك كلها.",
      "هذه اللوحة لا تعرف سمعتك. ابنِ واحدة جديدة.",
      "المتأني يصل. المتسرع يُعرِّف نفسه مبكراً.",
      "أعظم اللاعبين لا يحسبون أكثر — يرون أوضح.",
      "الشك ليس ضعفاً هنا. إنه معلومة.",
      "ما رأيته على هذه اللوحة يعكس ما أنتَ عليه.",
      "هذه اللعبة تتذكر كل ما تفعله. وأنتَ؟",
      "الإجابة الصحيحة ليست دائماً المتوقعة.",
      "مرحباً في اللعبة التي أراد الشطرنج أن يكونها.",
      "",
      "تأتي للعب وتغادر وقد فهمتَ أكثر مما كنتَ تعرف.",
    ],

    victoire: [
      "لم تفز — بل كشفتَ الفارق.",
      "كان انتصاراً هادئاً، كأنه كان حتمياً.",
      "لم تترك احتمالاً ولا عذراً.",
      "لقد رأيتَ ما لم يُرَ.",
      "لم تكن أسرع — بل أوضح.",
      "حتى اللوحة وافقتك في النهاية.",
      "هذا ليس حظاً. هذا إدراك.",
      "انتصارٌ بلا ضجيج — أخطر أنواع الانتصار.",
      "لم تلعب جيداً فحسب — بل فهمتَ أكثر.",
      "خصمك كان يلعب. أنتَ كنتَ ترى.",
      "كل حركةٍ كانت إجابة لسؤالٍ لم يُطرح.",
      "لم يكن هناك صراع — كانت هناك نتيجة حتمية.",
      "هذا ما يحدث حين تختفي الأخطاء.",
      "انتصارك لم يكن مفاجئاً — كان متوقعاً منذ البداية.",
      "كنتَ خطوةً أمامه دائماً. هذا يكفي.",
      "لم تتسرع ولم تتردد. لعبتَ.",
      "اللعبة انتهت قبل أن يدرك خصمك.",
      "تفوّق صامت — لكنه كان واضحاً طوال الوقت.",
      "هذا ليس فوزاً فحسب — هذه سيطرة.",
      "جعلتَ اللعبة تبدو سهلة. وهذا مخيف.",
      "في موضعٍ واحد رأيتَ ما رفض هو أن يراه.",
      "الحسم لم يكن في آخر حركة. كان في ترتيبك للنية.",
      "ما أعطاك الفوز لم يكن القوة — بل الوضوح.",
      "أحكمتَ اللعبة حين فتحها. وهذا الأعظم.",
      "خصمك لم يخسر منك — خسر من منهجك.",
      "فوزٌ من هذا النوع يترك أثراً في الذاكرة.",
      "كلُّ ما فكّرتَ فيه وُجد على اللوحة. هذا تناسق.",
      "الفوز جميل. لكن الفوز بهذا الأسلوب، أجمل.",
      "لم يكن التنافس متكافئاً. أنتَ تعرف لماذا.",
      "احتفظ بهذا الشعور. وارجع للمجازفة في المرة القادمة.",
    ],

    defaite: [
      "الخسارة مؤلمة — لكنها صادقة.",
      "كنتَ تعرف. لكنك تجاهلت.",
      "حركةٌ واحدة كانت كافية لتغيير كل شيء.",
      "تعلمتَ — ولكن متأخراً. في المرة القادمة، أبكر.",
      "الخطأ كان واضحاً — بعد فوات الأوان.",
      "لم تخسر فجأة — خسرتَ تدريجياً ببطء.",
      "كل تردد له ثمن. دفعتَه الآن.",
      "كنتَ قريباً. وهذا ما يؤلم أكثر.",
      "اللعبة لم تخدعك — أنتَ خدعتَ نفسك.",
      "الحقيقة ظهرت أخيراً. هذا لصالحك.",
      "لم يكن خصمك أقوى — بل كنتَ أقل وضوحاً.",
      "كل خسارة تحمل درساً، إن كنتَ مستعداً لسماعه.",
      "رأيتَ الفرصة — لكنك لم تتحرك نحوها.",
      "التفكير وحده لا يكفي. القرار يكفي.",
      "أحياناً القرار أهم من الخطة.",
      "الخسارة ليست النهاية — بل كشف البداية الحقيقية.",
      "ما أخطأتَ فيه تعرفه جيداً الآن. سمِّه.",
      "اللوحة لا تنسى. لذا لا تنسَ أنت.",
      "الفرصة كانت هناك — ثم اختفت لأنك لم تمسك بها.",
      "في المرة القادمة لن تتركَ هذه اللحظة تمر.",
      "الغرور لعب بدلاً منك في بعض الحركات.",
      "خصمك استغل ما كنتَ تحاول إخفاءه.",
      "الخسارة بهذا الوضوح، مكسبٌ في حد ذاتها.",
      "العود إلى هذه اللوحة هو الرد الأمثل على هذه الخسارة.",
      "لا يتعلم اللاعب من الفوز إلا القليل. الخسارة تعلّمه أكثر.",
      "ما شعرتَ به الآن هو الوقود الأصح.",
      "حلّل — ثم ارجع.",
      "أفضل اللاعبين عرفوا الخسارة قبل أن يعرفوا الفوز.",
      "هذه الخسارة لم تكن عبثاً. كانت تعليماً مكلفاً.",
      "ارجع. ستكون مختلفاً.",
    ],

    attente: [
      "خصمك يفكر — أو ينهار ببطء.",
      "الصمت هنا ليس هدوءاً — بل ضغط.",
      "كل ثانية تزيد شكوكه.",
      "هو لا يتأخر — هو يضيع.",
      "الوقت يكشف ما تخفيه العقول.",
      "التردد يُطيل اللحظة ويُقصّر النتيجة.",
      "كل تأخير اعترافٌ غير مباشر.",
      "ربما يبحث عن مخرج لا وجود له.",
      "الصمت بين حركتين أبلغ من الكلام.",
      "القرار الصعب يأخذ وقتاً. وهو لم يستعد له.",
      "كلما طال الانتظار، اقترب الخطأ.",
      "هو يرى — لكنه لا يثق بما يرى.",
      "اللحظة تزداد ثقلاً على جانبه.",
      "حتى الزمن يراقب اللوحة الآن.",
      "هناك شيءٌ لا يراه — بعد. دعه يبحث.",
      "هدوؤك هو أكثر ما يُقلقه الآن.",
      "صبرك سلاح. لا تُفصح عنه.",
      "ما يعانيه الآن هو ما أعددتَ له.",
      "هو يحسب. أنتَ قد انتهيتَ من الحساب.",
      "كل ثانية تمر دون قرار منه هي ثانية تصبُّ في مصلحتك.",
      "الصامت أحياناً هو الأقوى.",
      "انتظر. اللحظة ستأتي إليك.",
      "مَن لا يتردد لا يُهزم بالوقت.",
      "تردده رسالة. اقرأها.",
      "الثقة لا تنتظر. التردد نعم.",
      "ثباتك في هذه اللحظة هو فوزك القادم.",
      "هو في رأسه. أنتَ في اللوحة. هذا الفارق.",
      "دعه يفكر. التفكير أحياناً يُكلّف أكثر مما يُفيد.",
      "انتظر بوعي. هذا ليس سلبية — هذا مراقبة.",
      "كل لحظة صمتٍ منك هي ضغطٌ لم تبذل فيه جهداً.",
    ],

    analyse: [
      "جارٍ التحليل — الحقيقة قادمة.",
      "المحرك لا يُجامل. لا أحد.",
      "كل خطأٍ سيظهر. كن مستعداً.",
      "هل تريد فعلاً أن ترى ما حدث؟",
      "ما تجاهلتَه سيعود الآن.",
      "الحقيقة لا تتأخر — لكنها تصل.",
      "كل حركةٍ لها وزن. الآن ستفهمه.",
      "التحليل لا يرحم — ولا يُخطئ.",
      "هنا تبدأ المعرفة الحقيقية.",
      "الآن لا مكان للأعذار.",
      "كل قرارٍ ستراه كما هو، لا كما أردتَه.",
      "ما ظننتَه جيداً قد لا يكون كذلك.",
      "الفرق بينك وبين الأفضل سيتضح الآن.",
      "استعد لبعض الندم — وبعض المفاجآت الإيجابية.",
      "الحقيقة دائماً أوضح بعد النهاية.",
      "التحليل لا يسألك عن نواياك. يسألك عن حركاتك.",
      "المحرك يرى ما رفض عقلك رؤيته.",
      "هذه ليست جلسة انتقاد — بل جلسة تعلم.",
      "ما فاتَك سيصبح ما تبحث عنه في المرة القادمة.",
      "أفضل حركةٍ كانت بمتناولك. أين كانت؟",
      "التحليل يُعلّمك كيف ترى اللوحة بعيون أوضح.",
      "الآن أنتَ تلعب دورَ المراقب، وهو الأصعب.",
      "كل دقيقةٍ تمضيها هنا تساوي عشر مباريات.",
      "لقد لعبتَ. الآن افهم ما لعبتَه.",
      "المحرك وجد ما أضعتَه. تعلم منه.",
      "الانتهاء من التحليل يعني البداية الحقيقية.",
      "ستجد هنا الحركة التي كان يمكن أن تُغير كل شيء.",
      "التحليل مرآة — النظر فيها يحتاج شجاعة.",
      "ما ستراه الآن سيغيّر طريقة لعبك للأبد.",
      "هذه اللحظة، هذا التحليل، هذا هو الفارق بين اللاعبين.",
    ],
  },

  // ────────────────────────────────────────────────────────
  // ESPAÑOL — Neruda, Borges, García Márquez
  // Emocional, humano, lírico, vivo
  // Se burla del ajedrez con ternura
  // ────────────────────────────────────────────────────────
  es: {
    accueil: [
      "El ajedrez tiene seiscientos años. ELMAAS tiene ahora.",
      "No hay una sola pieza que proteger. Solo decisiones que tomar.",
      "Empiezas una partida. En realidad, empiezas un diálogo.",
      "Cada ficha que colocas dice algo de ti.",
      "Crees que estás listo. Nadie lo está del todo.",
      "Las reglas existen para los que no han encontrado los límites.",
      "El caballo del ajedrez salta en L desde hace siglos. Nadie preguntó por qué.",
      "La reina hace todo el trabajo. El rey espera. Ya te digo yo quién manda.",
      "Ocho soldados que solo avanzan. ELMAAS preguntó: ¿y si tuvieran más opciones?",
      "No juegas contra alguien. Juegas contra ti mismo también.",
      "El tablero no miente. Esa es su única crueldad.",
      "Aquí no hay apertura memorizada. Solo tu forma de pensar.",
      "Lo que ves en este tablero depende de quién eres hoy.",
      "La estrategia te tranquiliza. El instinto te revela.",
      "Este juego recuerda todo lo que haces.",
      "Una jugada. Una identidad.",
      "El ajedrez tiene sesenta y cuatro casillas. Nosotros preferimos el infinito.",
      "El peón sueña con ser reina en el ajedrez. Aquí tú eliges lo que quieres ser.",
      "La torre siempre en línea recta. Qué aburrida dignidad la suya.",
      "ELMAAS: porque cada partida merece un tablero nuevo.",
      "Cada color que colocas es una letra. Juntos forman algo.",
      "No ganas ELMAAS. Descubres algo sobre ti.",
      "Los mejores jugadores no calculan más. Ven más.",
      "La duda no es debilidad aquí. Es información valiosa.",
      "Tu primer movimiento ya dice algo. Elige bien qué.",
      "La confianza es lo primero que este juego pondrá a prueba.",
      "Estrategia es lo que haces cuando estás seguro. ELMAAS pide más.",
      "Viniste a ganar. Puede que te vayas habiendo aprendido más.",
      "Este tablero no conoce tu reputación. Construye una nueva.",
      "No hay aperturas aquí. Solo decisiones.",
      "Cada ficha que tienes es una posibilidad. No todas valen igual.",
      "El jugador que ve más lejos no siempre piensa más tiempo.",
      "La paciencia es una estrategia. La impaciencia, una confesión.",
      "Estás a punto de aprender algo sobre cómo piensas.",
      "El tablero espera. Siempre es más paciente que tú.",
      "ELMAAS no depende de una sola pieza. Depende de cada decisión.",
      "No puedes engañar al tablero. Ve cada elección.",
      "Lo que estás a punto de jugar — hazlo tuyo.",
      "Dos colores. Un ganador. Cero suerte.",
      "El tablero ve tu duda antes de que la veas tú.",
      "No juegas contra alguien. Juegas contra la claridad.",
      "Este juego tiene algo que el ajedrez nunca tuvo: libertad real.",
      "Antes de jugar, mira. Mirar de verdad toma tiempo.",
      "Lo que coloques aquí no podrá retirarse.",
      "Cada decisión que tomes ya estaba dentro de ti.",
      "Este es el juego que el ajedrez quería ser.",
      "Cuatro colores, dos jugadores, una verdad.",
      "El tablero es neutro. Tú no lo eres.",
      "Bienvenido al juego que se recuerda.",
      "Juegas para ganar. Pero te quedarás por haber entendido algo.",
    ],

    victoire: [
      "Limpio. Preciso. Inevitable.",
      "No ganaste. Dominaste.",
      "Eso nunca estuvo cerca.",
      "Viste más lejos, y se notó.",
      "Control. De principio a fin.",
      "Calculado. Todo.",
      "Sin errores. Eso es raro.",
      "Rompiste su lógica antes de que terminara de construirla.",
      "Así es como se ve la maestría, en silencio.",
      "No te apresuraste. Por eso ganaste.",
      "Ellos jugaron el juego. Tú los jugaste a ellos.",
      "Cada jugada fue un mensaje. Lo leyeron demasiado tarde.",
      "Convertiste la incertidumbre en inevitabilidad.",
      "Este tablero es tuyo ahora.",
      "Hubo un momento en que todo fue obvio. Lo encontraste primero.",
      "Lo hiciste parecer fácil. Las cosas más difíciles siempre lo parecen.",
      "Tenían un plan. El tuyo era mejor.",
      "Directo. Terminado.",
      "Ganaste sin mostrar todo lo que tenías. Eso es fuerza real.",
      "Nunca entendieron a qué se enfrentaban.",
      "Jugaste el juego correcto al ritmo correcto.",
      "La victoria sin ruido es la más elocuente.",
      "Superaste, colocaste mejor, y duraste más.",
      "La diferencia era invisible al principio. La hiciste innegable.",
      "Merecido. Cada punto.",
      "No les diste nada a lo que aferrarse.",
      "Ese tipo de victoria es una firma.",
      "No solo jugaste mejor. Pensaste diferente.",
      "Las mejores victorias parecen que siempre iban a ocurrir.",
      "Bien jugado no es suficiente. Bien comprendido.",
    ],

    defaite: [
      "Lo viste demasiado tarde.",
      "Ese error costó todo.",
      "Dudaste una vez. Fue suficiente.",
      "Estaban un paso adelante. Exactamente uno.",
      "Sabías mejor. La próxima vez, actúa en consecuencia.",
      "Cerca no es una categoría. Es una advertencia.",
      "Perdiste el control en un momento específico. Encuéntralo.",
      "El juego te expuso. Ese es su trabajo.",
      "Jugaste lo que querías, no lo que se necesitaba.",
      "El error fue pequeño. La consecuencia no.",
      "No te superaron. Te superaron en paciencia.",
      "Tu rival encontró la grieta. Tú la pusiste ahí.",
      "Perder aquí es información. Úsala.",
      "Diste algo que no podías permitirte dar.",
      "Había una jugada mejor. Sabes cuál es.",
      "El tablero te lo dijo. No escuchaste.",
      "Leyeron tu patrón. Cámbialo.",
      "Te apresuraste donde la paciencia era la jugada.",
      "Esta derrota es el plano de tu próxima victoria.",
      "Jugaste con suposiciones. Ellos jugaron con observación.",
      "Lo que salió mal fue pequeño. Ese es el tipo de lección más difícil.",
      "Fuiste bueno. Solo que hoy no lo suficiente.",
      "El juego no te castigó. Te educó.",
      "Cada derrota aquí tiene nombre. Encuentra el tuyo.",
      "Lo verás diferente la próxima vez. Ese es el punto.",
      "Perdiste porque no estabas presente. Ellos sí.",
      "Un momento de claridad lo habría cambiado todo.",
      "No perdiste contra ellos. Perdiste contra una versión de ti mismo.",
      "Vuelve más afilado.",
      "Así te ayuda este juego.",
    ],

    attente: [
      "Están pensando. O están en pánico.",
      "El tiempo revela debilidad. Observa.",
      "Tu silencio es una presión que no tuviste que aplicar.",
      "Están atascados. Tú no.",
      "Cada segundo que toman es un segundo de incertidumbre para ellos.",
      "Tu quietud ya es una jugada.",
      "El tablero no cambia. Pero ellos sí.",
      "Vinieron a ganar. Ahora solo están sobreviviendo.",
      "Déjalos pensar. Pensar les cuesta.",
      "Esta pausa te pertenece. Quédate en ella.",
      "Su duda es una señal. Léela.",
      "No tienes que hacer nada. El reloj lo hace por ti.",
      "Están reconsiderando. Eso significa que están perdidos.",
      "La paciencia aquí no es esperar. Es presionar.",
      "Tu calma es lo más inquietante del tablero ahora mismo.",
      "Esperaban respuesta. Les diste silencio.",
      "Están buscando algo que no encontrarán.",
      "Cada segundo que pasa desplaza el peso más hacia ti.",
      "El tablero espera. Tú también. La diferencia es que tú lo elegiste.",
      "Están calculando. Tú ya decidiste.",
      "Mantén la compostura. El momento viene hacia ti.",
      "Todo gran jugador sabe usar el silencio.",
      "Están en su cabeza. Quédate fuera de la tuya.",
      "Cuanto más esperan, más han perdido ya.",
      "El silencio de tu rival es su admisión más ruidosa.",
      "No necesitas actuar. La presión trabaja sin ti.",
      "La quietud no es inacción. Es fuerza en reserva.",
      "Esta pausa significa algo. Aprende a leer qué.",
      "Ellos necesitan tiempo. Tú lo necesitaste antes. Esa es la diferencia.",
      "Espera. Luego mueve. Ese orden importa.",
    ],

    analyse: [
      "Analizando. Sin excusas ahora.",
      "La verdad viene. Prepárate.",
      "El motor lo ve todo. Cada jugada. Cada alternativa.",
      "Se cometieron errores. Algunos fueron tuyos. Aquí están.",
      "Veamos qué pasó realmente.",
      "El juego terminó. La lección acaba de empezar.",
      "Lo que creías que jugaste y lo que jugaste son cosas distintas.",
      "El motor no tiene en cuenta tus intenciones.",
      "Aquí dejas de ser jugador y empiezas a ser alumno.",
      "Cada jugada que hiciste tenía una mejor. Vamos a encontrarlas.",
      "El análisis no te juzga. Te muestra.",
      "Lo que veas aquí te incomodará. Bien.",
      "Algunas de tus mejores jugadas no eran las mejores.",
      "Algunas de las peores eran peores de lo que pensabas.",
      "El motor es más rápido que cualquier humano. También más implacable.",
      "Estás a punto de ver el juego como realmente fue.",
      "Esto no es crítica. Son datos.",
      "La jugada de la que estabas orgulloso puede estar aquí. O no.",
      "La verdad sobre este juego está llegando.",
      "Entender una derrota aquí vale diez victorias casuales.",
      "El motor encontró lo que te perdiste. Aprende su idioma.",
      "Este análisis es una conversación. ¿Estás listo para escuchar?",
      "Lo que te separó de ganar está a punto de quedar muy claro.",
      "Prepárate para ver tu pensamiento desde fuera.",
      "El tablero recordó cada elección. Ahora tú también.",
      "El análisis es cómo los buenos jugadores se vuelven grandes.",
      "Lo que pasó aquí, realmente pasó aquí.",
      "Siéntate con esto. Vale la pena.",
      "El análisis te mostrará dónde el juego aún era tuyo.",
      "Tu próxima victoria empieza aquí, en lo que estás a punto de ver.",
    ],
  },
};


// ═══════════════════════════════════════════════════════════
// EXTRA SLOGANS — ELMAAS branding safe / photo → board
// Ajout automatique : slogans attirants sans attaque directe des rois
// ═══════════════════════════════════════════════════════════

const EXTRA_SLOGANS = {
  fr: {
    accueil: [
      "Chaque photo devient une bataille.",
      "Ta photo devient le plateau. Ton esprit décide du reste.",
      "Une image. Deux visions. Un seul vainqueur.",
      "Le jeu commence quand l'image devient territoire.",
      "Tu ne joues pas sur un plateau. Tu joues sur une histoire.",
      "Chaque image cache une stratégie différente.",
      "Pas d'ouverture à réciter. Seulement une position à comprendre.",
      "Aux échecs, le plateau attend. Dans ELMAAS, il naît de ton image.",
      "Deux joueurs, une image, mille chemins possibles.",
      "ELMAAS ne répète jamais deux fois la même partie.",
      "Le territoire n'est pas donné. Il se construit.",
      "Une bonne pièce au bon endroit peut changer toute l'histoire.",
      "Ton adversaire voit le même plateau. Pas la même histoire.",
      "Dans ELMAAS, la mémoire ne suffit pas. Il faut s'adapter.",
      "Chaque case peut devenir décisive. Regarde mieux.",
      "Tu arrives avec une image. Tu repars avec une bataille.",
      "La stratégie commence là où la routine s'arrête.",
      "Chaque puzzle terminé est une décision qui prend forme.",
      "L'instinct place la pièce. La stratégie lui donne un sens.",
      "La vraie question n'est pas où jouer, mais pourquoi ici.",
      "Ce plateau n'est jamais neutre. Il porte ton image.",
      "Il ne suffit pas de jouer. Il faut lire ce que l'image devient.",
      "Chaque partie est unique parce que chaque image l'est.",
      "ELMAAS transforme une photo en duel d'intelligence.",
      "Le premier coup commence avant la première pièce.",
      "Ce que tu choisis comme image change ta manière de jouer.",
      "Le plateau apparaît. Maintenant, prouve que tu sais voir.",
      "Chaque couleur posée est une intention.",
      "Un puzzle peut sembler petit. Il peut décider de tout.",
      "Le bon joueur regarde les pièces. Le grand joueur regarde les zones.",
      "Ce n'est pas un plateau fixe. C'est un territoire vivant.",
      "Tu ne connais pas la carte avant de la créer.",
      "Chaque partie commence par une image et finit par une idée.",
      "Le hasard propose. Le joueur dispose.",
      "Une case prise au bon moment vaut parfois une partie entière.",
      "Ce jeu récompense ceux qui voient avant de poser.",
      "Tu ne gagnes pas en répétant. Tu gagnes en t'adaptant.",
      "Chaque image donne une nouvelle question stratégique.",
      "ELMAAS ne demande pas ce que tu sais par cœur. Il demande ce que tu vois.",
      "Le plateau change. Le vrai joueur aussi.",
      "Si tu joues comme hier, l'image te punira aujourd'hui.",
      "Un bon coup occupe une case. Un grand coup occupe l'avenir.",
      "Ici, le plan se construit sous tes yeux.",
      "Tu poses une pièce. Le plateau répond.",
      "La beauté du jeu commence quand la photo devient logique.",
      "Chaque partie raconte ce que les joueurs osent construire.",
      "Le contrôle ne se réclame pas. Il se prouve.",
      "L'image est donnée. La stratégie reste à inventer.",
      "Tu cherches une ouverture. ELMAAS te donne un monde.",
      "Le plateau n'attend pas ta mémoire. Il attend ta lucidité."
    ]
  },

  en: {
    accueil: [
      "Every photo becomes a battle.",
      "Your photo becomes the board. Your mind decides the rest.",
      "One image. Two visions. One winner.",
      "The game begins when the image becomes territory.",
      "You don't play on a board. You play on a story.",
      "Every image hides a different strategy.",
      "No openings to repeat. Only a position to understand.",
      "In chess, the board waits. In ELMAAS, it is born from your image.",
      "Two players, one image, a thousand possible paths.",
      "ELMAAS never repeats the same game twice.",
      "Territory is not given. It is built.",
      "One well-placed piece can change the whole story.",
      "Your opponent sees the same board. Not the same story.",
      "In ELMAAS, memory is not enough. You must adapt.",
      "Every cell can become decisive. Look closer.",
      "You arrive with an image. You leave with a battle.",
      "Strategy begins where routine stops.",
      "Every completed puzzle is a decision taking shape.",
      "Instinct places the piece. Strategy gives it meaning.",
      "The real question is not where to play, but why there.",
      "This board is never neutral. It carries your image.",
      "Playing is not enough. You must read what the image becomes.",
      "Every game is unique because every image is unique.",
      "ELMAAS turns a photo into a duel of intelligence.",
      "The first move begins before the first piece.",
      "The image you choose changes the way you play.",
      "The board appears. Now prove you can see.",
      "Every color you place is an intention.",
      "A puzzle may look small. It can decide everything.",
      "Good players look at pieces. Great players look at zones.",
      "This is not a fixed board. It is living territory.",
      "You don't know the map until you create it.",
      "Every game begins with an image and ends with an idea.",
      "Chance proposes. The player decides.",
      "One cell taken at the right moment can be the whole game.",
      "This game rewards those who see before they place.",
      "You don't win by repeating. You win by adapting.",
      "Every image asks a new strategic question.",
      "ELMAAS doesn't ask what you memorized. It asks what you see.",
      "The board changes. Real players change with it.",
      "Play like yesterday, and today's image will punish you.",
      "A good move takes a cell. A great move takes the future.",
      "Here, the plan builds itself before your eyes.",
      "You place a piece. The board answers.",
      "The beauty begins when the photo becomes logic.",
      "Every game tells what the players dare to build.",
      "Control is not claimed. It is proven.",
      "The image is given. The strategy is invented.",
      "You look for an opening. ELMAAS gives you a world.",
      "The board does not wait for memory. It waits for clarity."
    ]
  },

  ar: {
    accueil: [
      "كل صورة تصبح معركة.",
      "صورتك تتحول إلى رقعة. وعقلك يقرر الباقي.",
      "صورة واحدة. رؤيتان. فائز واحد.",
      "تبدأ اللعبة حين تتحول الصورة إلى أرض استراتيجية.",
      "أنت لا تلعب على رقعة فقط. أنت تلعب داخل قصة.",
      "كل صورة تخفي استراتيجية مختلفة.",
      "لا افتتاحيات محفوظة. فقط وضعية تحتاج إلى فهم.",
      "في الشطرنج تنتظرك الرقعة. في إلماس، الرقعة تولد من صورتك.",
      "لاعبان، صورة واحدة، وألف طريق ممكن.",
      "إلماس لا يكرر المباراة نفسها مرتين.",
      "السيطرة لا تُمنح. السيطرة تُبنى.",
      "قطعة واحدة في المكان الصحيح قد تغيّر القصة كلها.",
      "خصمك يرى نفس الرقعة. لكنه لا يرى نفس القصة.",
      "في إلماس، الذاكرة لا تكفي. يجب أن تتكيف.",
      "كل خانة قد تصبح حاسمة. انظر أكثر.",
      "تدخل بصورة. وتخرج بمعركة.",
      "تبدأ الاستراتيجية حين تتوقف العادة.",
      "كل لغز تكمّله هو قرار يأخذ شكله.",
      "الحدس يضع القطعة. والاستراتيجية تعطيها معناها.",
      "السؤال الحقيقي ليس أين تضع القطعة، بل لماذا هنا.",
      "هذه الرقعة ليست محايدة. إنها تحمل صورتك.",
      "لا يكفي أن تلعب. يجب أن تفهم ما أصبحت عليه الصورة.",
      "كل مباراة فريدة لأن كل صورة فريدة.",
      "إلماس يحوّل الصورة إلى مواجهة ذكاء.",
      "الحركة الأولى تبدأ قبل وضع أول قطعة.",
      "الصورة التي تختارها تغيّر طريقة لعبك.",
      "تظهر الرقعة. الآن أثبت أنك ترى.",
      "كل لون تضعه هو نية.",
      "قد يبدو اللغز صغيراً. لكنه قد يقرر كل شيء.",
      "اللاعب الجيد يرى القطع. اللاعب الكبير يرى المناطق.",
      "هذه ليست رقعة ثابتة. إنها أرض حيّة.",
      "لن تعرف الخريطة حتى تصنعها.",
      "كل مباراة تبدأ بصورة وتنتهي بفكرة.",
      "الاحتمال يقترح. واللاعب يقرر.",
      "خانة واحدة في الوقت الصحيح قد تساوي مباراة كاملة.",
      "هذه اللعبة تكافئ من يرى قبل أن يضع.",
      "لا تفوز بالتكرار. تفوز بالتكيف.",
      "كل صورة تطرح سؤالاً استراتيجياً جديداً.",
      "إلماس لا يسألك ماذا حفظت. يسألك ماذا ترى.",
      "الرقعة تتغير. واللاعب الحقيقي يتغير معها.",
      "إن لعبت مثل الأمس، ستعاقبك صورة اليوم.",
      "الحركة الجيدة تأخذ خانة. الحركة العظيمة تأخذ المستقبل.",
      "هنا تُبنى الخطة أمام عينيك.",
      "تضع قطعة. فتجيبك الرقعة.",
      "يبدأ جمال اللعبة حين تتحول الصورة إلى منطق.",
      "كل مباراة تحكي ما يجرؤ اللاعبان على بنائه.",
      "السيطرة لا تُدّعى. السيطرة تُثبت.",
      "الصورة تُعطى. والاستراتيجية تُخترع.",
      "تبحث عن افتتاحية. إلماس يعطيك عالماً.",
      "الرقعة لا تنتظر ذاكرتك. تنتظر وضوحك."
    ]
  },

  es: {
    accueil: [
      "Cada foto se convierte en una batalla.",
      "Tu foto se convierte en el tablero. Tu mente decide el resto.",
      "Una imagen. Dos visiones. Un ganador.",
      "El juego empieza cuando la imagen se convierte en territorio.",
      "No juegas sobre un tablero. Juegas dentro de una historia.",
      "Cada imagen esconde una estrategia distinta.",
      "No hay aperturas que memorizar. Solo una posición que entender.",
      "En el ajedrez, el tablero espera. En ELMAAS, nace de tu imagen.",
      "Dos jugadores, una imagen, mil caminos posibles.",
      "ELMAAS nunca repite la misma partida dos veces.",
      "El territorio no se recibe. Se construye.",
      "Una pieza bien colocada puede cambiar toda la historia.",
      "Tu rival ve el mismo tablero. No la misma historia.",
      "En ELMAAS, la memoria no basta. Hay que adaptarse.",
      "Cada casilla puede ser decisiva. Mira mejor.",
      "Llegas con una imagen. Te vas con una batalla.",
      "La estrategia empieza donde termina la rutina.",
      "Cada puzzle completado es una decisión tomando forma.",
      "El instinto coloca la pieza. La estrategia le da sentido.",
      "La verdadera pregunta no es dónde jugar, sino por qué ahí.",
      "Este tablero nunca es neutro. Lleva tu imagen.",
      "No basta con jugar. Hay que leer en qué se convierte la imagen.",
      "Cada partida es única porque cada imagen lo es.",
      "ELMAAS transforma una foto en un duelo de inteligencia.",
      "La primera jugada empieza antes de la primera pieza.",
      "La imagen que eliges cambia tu forma de jugar.",
      "Aparece el tablero. Ahora demuestra que sabes ver.",
      "Cada color que colocas es una intención.",
      "Un puzzle puede parecer pequeño. Puede decidirlo todo.",
      "El buen jugador mira piezas. El gran jugador mira zonas.",
      "No es un tablero fijo. Es territorio vivo.",
      "No conoces el mapa hasta que lo creas.",
      "Cada partida empieza con una imagen y termina con una idea.",
      "El azar propone. El jugador decide.",
      "Una casilla tomada en el momento justo puede valer toda la partida.",
      "Este juego premia a quienes ven antes de colocar.",
      "No ganas repitiendo. Ganas adaptándote.",
      "Cada imagen plantea una nueva pregunta estratégica.",
      "ELMAAS no pregunta qué memorizaste. Pregunta qué ves.",
      "El tablero cambia. El jugador real cambia con él.",
      "Si juegas como ayer, la imagen de hoy te castigará.",
      "Una buena jugada toma una casilla. Una gran jugada toma el futuro.",
      "Aquí, el plan se construye ante tus ojos.",
      "Colocas una pieza. El tablero responde.",
      "La belleza empieza cuando la foto se convierte en lógica.",
      "Cada partida cuenta lo que los jugadores se atreven a construir.",
      "El control no se reclama. Se demuestra.",
      "La imagen se da. La estrategia se inventa.",
      "Buscas una apertura. ELMAAS te da un mundo.",
      "El tablero no espera tu memoria. Espera tu claridad."
    ]
  }
};


// ═══════════════════════════════════════════════════════════
// SYSTÈME GÉNÉRATIF — Combinaisons infinies par langue
// Les fragments sont valides grammaticalement et poétiques
// ═══════════════════════════════════════════════════════════

const FRAGMENTS = {
  fr: {
    structures: [
      ["Le plateau", "observe", "tes hésitations."],
      ["Ton adversaire", "attend", "ton erreur."],
      ["Le jeu", "révèle", "ce que tu refuses de voir."],
      ["Le silence", "trahit", "ta manière de penser."],
      ["Chaque case", "questionne", "ta prochaine décision."],
      ["Le temps", "expose", "tes doutes."],
      ["Ton coup", "annonce", "tes intentions."],
      ["L'erreur", "enseigne", "plus que la victoire."],
      ["Ta stratégie", "cache", "ta peur de perdre."],
    ],
  },

  en: {
    structures: [
      ["The board", "reveals", "your hesitation."],
      ["Your opponent", "waits for", "your mistake."],
      ["This game", "questions", "who you truly are."],
      ["Every square", "remembers", "your decisions."],
      ["Silence", "exposes", "your intentions."],
      ["Your move", "announces", "your ambition."],
      ["Time", "punishes", "indecision."],
      ["The game", "sees through", "your strategy."],
      ["Your choice", "defines", "the player behind the move."],
    ],
  },

  ar: {
    structures: [
      ["اللوحة", "تكشف", "ترددك."],
      ["خصمك", "ينتظر", "خطأك القادم."],
      ["هذه اللعبة", "تسأل", "من تكون حقاً."],
      ["كل خانة", "تتذكر", "قراراتك."],
      ["الصمت", "يفضح", "نواياك."],
      ["حركتك", "تعلن", "طموحك."],
      ["الوقت", "يعاقب", "التردد."],
      ["اللعبة", "ترى", "ما وراء استراتيجيتك."],
      ["قرارك", "يكشف", "اللاعب خلف الحركة."],
    ],
  },

  es: {
    structures: [
      ["El tablero", "revela", "tu duda."],
      ["Tu rival", "espera", "tu próximo error."],
      ["Este juego", "cuestiona", "quién eres realmente."],
      ["Cada casilla", "recuerda", "tus decisiones."],
      ["El silencio", "expone", "tus intenciones."],
      ["Tu jugada", "anuncia", "tu ambición."],
      ["El tiempo", "castiga", "la indecisión."],
      ["El juego", "ve a través de", "tu estrategia."],
      ["Tu elección", "define", "al jugador detrás de la jugada."],
    ],
  },
};

function genererCitation(codeLangue) {
  const f = FRAGMENTS[codeLangue] || FRAGMENTS.fr;
  const phrase =
    f.structures[Math.floor(Math.random() * f.structures.length)];

  return `${phrase[0]} ${phrase[1]} ${phrase[2]}`;
}
// ═══════════════════════════════════════════════════════════
// FONCTIONS D'ACCÈS AUX CITATIONS
// ═══════════════════════════════════════════════════════════

let _cache = {};

export function getSloganAccueil(indexLangue) {
  const code = LANGUES[indexLangue]?.code || "fr";
  const base = SLOGANS[code]?.accueil || SLOGANS.fr.accueil;
  const extra = EXTRA_SLOGANS[code]?.accueil || [];
  const liste = [...base, ...extra].filter(Boolean);

  if (Math.random() < 0.12) return genererCitation(code);

  const key = `accueil_${code}`;
  if (_cache[key] === undefined || _cache[key] >= liste.length) {
    _cache[key] = Math.floor(Math.random() * liste.length);
  }
  return liste[_cache[key]];
}

export function getSloganAleatoire(indexLangue) {
  const code = LANGUES[indexLangue]?.code || "fr";
  const base = SLOGANS[code]?.accueil || SLOGANS.fr.accueil;
  const extra = EXTRA_SLOGANS[code]?.accueil || [];
  const liste = [...base, ...extra].filter(Boolean);

  if (Math.random() < 0.12) return genererCitation(code);

  const k = `slogan_${code}_${Math.floor(Date.now() / 30000)}`;
  if (_cache[k] === undefined || _cache[k] >= liste.length) {
    _cache[k] = Math.floor(Math.random() * liste.length);
  }
  return liste[_cache[k]];
}

export function getSloganVictoire(indexLangue) {
  const code = LANGUES[indexLangue]?.code || "fr";
  const liste = SLOGANS[code]?.victoire || SLOGANS.fr.victoire;
  return liste[Math.floor(Math.random() * liste.length)];
}

export function getSloganDefaite(indexLangue) {
  const code = LANGUES[indexLangue]?.code || "fr";
  const liste = SLOGANS[code]?.defaite || SLOGANS.fr.defaite;
  return liste[Math.floor(Math.random() * liste.length)];
}

export function getCitationAttente(indexLangue) {
  const code = LANGUES[indexLangue]?.code || "fr";
  const liste = SLOGANS[code]?.attente || SLOGANS.fr.attente;
  return liste[Math.floor(Math.random() * liste.length)];
}

export function getSloganAnalyse(indexLangue) {
  const code = LANGUES[indexLangue]?.code || "fr";
  const liste = SLOGANS[code]?.analyse || SLOGANS.fr.analyse;
  return liste[Math.floor(Math.random() * liste.length)];
}

// ═══════════════════════════════════════════════════════════
// CLASSIFICATION DES COUPS (analyse)
// ═══════════════════════════════════════════════════════════

export const CLASSIFICATION_COUP = {
  ELMAAS:    { couleur: "#ffd700", ordre: 0 },
  ELMAASYON: { couleur: "#88ff88", ordre: 1 },
  MASSY:     { couleur: "#44cc44", ordre: 2 },
  NOTMESSY:  { couleur: "#88aaff", ordre: 3 },
  MISSED:    { couleur: "#ffaa44", ordre: 4 },
  CHESS:     { couleur: "#ff4422", ordre: 5 },
};

// ═══════════════════════════════════════════════════════════
// TRADUCTIONS UI (toutes les clés de l'interface)
// ═══════════════════════════════════════════════════════════

export const T = {
  sousSlogan: [
    "Là où les règles les plus simples sont les plus difficiles à maîtriser.",
    "Where the simplest rules are the hardest to master.",
    "حيث تكون أبسط القواعد هي الأصعب إتقانًا.",
    "Donde las reglas más simples son las más difíciles de dominar."
  ],


  // Auth
  continuerAvecGoogle: ["Continuer avec Google", "Continue with Google", "المتابعة بواسطة Google", "Continuar con Google"],
  continuerSansCompte: ["Continuer sans compte", "Continue without account", "المتابعة بدون حساب", "Continuar sin cuenta"],
  erreurConnexion: ["Erreur de connexion", "Connection error", "خطأ في الاتصال", "Error de conexión"],

  // Choix pseudo
  choisisPseudo: ["Choisis ton pseudo", "Choose your username", "اختر اسم المستخدم", "Elige tu nombre de usuario"],
  pseudoUnique: ["Chaque joueur doit avoir un pseudo unique.", "Each player must have a unique username.", "كل لاعب يجب أن يكون له اسم مستخدم فريد.", "Cada jugador debe tener un nombre único."],
  pseudoPlaceholder: ["Ton pseudo...", "Your username...", "اسم المستخدم...", "Tu nombre..."],
  pseudoValider: ["Valider mon pseudo", "Confirm username", "تأكيد الاسم", "Confirmar nombre"],
  pseudoDispo: ["✓ Disponible", "✓ Available", "✓ متاح", "✓ Disponible"],
  pseudoPris: ["Ce pseudo est déjà pris", "This username is taken", "هذا الاسم مأخوذ", "Este nombre ya existe"],
  pseudoTropCourt: ["Au moins 2 caractères", "At least 2 characters", "حرفان على الأقل", "Al menos 2 caracteres"],
  motSacreErreur: [
    "Ce mot contient une référence sacrée. Si votre vrai nom contient ce mot (ex: Abdallah), choisissez un autre pseudo. Avec nos excuses.",
    "This word contains a sacred reference. If your real name contains it, please choose another. Our apologies.",
    "هذا الاسم يحتوي على اسم مقدس. إن كان اسمك الحقيقي يحتوي على هذا الاسم، الرجاء اختيار اسم آخر. معذرتنا.",
    "Esta palabra contiene una referencia sagrada. Si tu nombre real la contiene, elige otra. Disculpas."
  ],

  // Taille
  choisissezTaille: ["Choisissez la taille du plateau", "Choose the board size", "اختر حجم اللوحة", "Elige el tamaño del tablero"],
  tailleDuPlateau: ["Taille du plateau", "Board size", "حجم اللوحة", "Tamaño del tablero"],
  plateau: ["plateau", "board", "اللوحة", "tablero"],
  tempsParTour: ["Temps par tour", "Time per turn", "الوقت لكل دور", "Tiempo por turno"],
  modeIA: ["Mode", "mode", "اختيار الخصم", "Modo"],
  deuxJoueurs: ["2 joueurs", "2 players", "لاعبان", "2 jugadores"],
  iaJoueNoir: ["IA joue Noir", "AI plays Black", "الذكاء الاصطناعي يلعب الأسود", "IA juega Negro"],
  iaJoueRouge: ["IA joue Rouge", "AI plays Red", "الذكاء الاصطناعي يلعب الأحمر", "IA juega Rojo"],
  niveauIA: ["Niveau IA :", "AI level:", "مستوى الذكاء الاصطناعي:", "Nivel IA:"],
  facile: ["Facile", "Easy", "سهل", "Fácil"],
  moyen: ["Moyen", "Medium", "متوسط", "Medio"],
  expert: ["Expert", "Expert", "خبير", "Experto"],
  confirmer: ["Confirmer", "Confirm", "تأكيد", "Confirmar"],
  jouerOnline: ["Jouer en ligne", "Play online", "اللعب عبر الإنترنت", "Jugar en línea"],
  jouerContreAmi: ["Jouer contre un ami", "Play against a friend", "اللعب ضد صديق", "Jugar contra un amigo"],
  jouerContreIA: ["Jouer contre l'IA", "Play against AI", "اللعب ضد الذكاء الاصطناعي", "Jugar contra la IA"],

  cheesyTitre: ["That's too cheesy to do here", "That's too cheesy to do here", "هذا مضجر جداً هنا", "Eso es demasiado aburrido aquí"],
  cheesyMessage: [
    "5 minutes par tour ? Ce n'est pas un jeu d'attente. Choisis un autre temps.",
    "5 minutes per turn? This isn't a waiting game. Pick another.",
    "5 دقائق لكل دور؟ هذه ليست لعبة انتظار. اختر وقتاً آخر.",
    "¿5 minutos por turno? Este no es un juego de espera. Elige otro."
  ],

  // Photo
  choisissezPhoto: ["Choisissez une photo pour votre plateau", "Choose a photo for your board", "اختر صورة للوحتك", "Elige una foto para tu tablero"],
  nomSecretPhoto: ["Nom secret de la photo", "Secret photo name", "الاسم السري للصورة", "Nombre secreto de la foto"],
  max10Car: ["(max 10 car.)", "(max 10 chars.)", "(10 أحرف كحد أقصى)", "(máx 10 car.)"],
  min3Car: ["(min 3 caractères)", "(min 3 characters)", "(3 أحرف على الأقل)", "(mín 3 caracteres)"],
  exVacances: ["ex: vacances", "e.g. holiday", "مثال: عطلة", "ej: vacaciones"],
  premiumIllimite: ["Premium — uploads illimités", "Premium — unlimited uploads", "بريميوم — تحميلات غير محدودة", "Premium — subidas ilimitadas"],
  unePhotoGratuite: ["1 photo personnelle gratuite disponible", "1 free personal photo available", "صورة شخصية مجانية متاحة", "1 foto personal gratuita disponible"],
  maPhoto: ["Ma photo", "My photo", "صورتي", "Mi foto"],
  photoUtilisee: ["Photo personnelle utilisée", "Personal photo used", "تم استخدام الصورة الشخصية", "Foto personal usada"],
  passerPremium: ["Passer Premium pour en uploader plus", "Go Premium to upload more", "اشترك في بريميوم لتحميل المزيد", "Hazte Premium para subir más"],
  connectezVous: ["Connectez-vous pour uploader votre propre photo", "Sign in to upload your own photo", "سجل الدخول لتحميل صورتك", "Inicia sesión para subir tu foto"],
  generation: ["Génération...", "Generating...", "جاري التوليد...", "Generando..."],
  jouerAvecPhoto: ["Jouer avec cette photo", "Play with this photo", "اللعب بهذه الصورة", "Jugar con esta foto"],
  erreurCreation: ["Erreur lors de la création.", "Error creating.", "خطأ في الإنشاء.", "Error al crear."],
  photoInvalide: [
    "Photo invalide. Format supporté : JPG, PNG, GIF, WebP. Taille max 5 Mo.",
    "Invalid photo. Supported: JPG, PNG, GIF, WebP. Max 5 MB.",
    "صورة غير صالحة. الصيغ المدعومة: JPG, PNG. الحد الأقصى 5 م.ب.",
    "Foto inválida. Formatos: JPG, PNG. Máx 5 MB."
  ],
  jeSuisJoueur2: ["Je suis le Joueur 2 — Rejoindre", "I am Player 2 — Join", "أنا اللاعب 2 — الانضمام", "Soy el Jugador 2 — Unirse"],

  // Lobby
  partieCreee: ["Partie créée", "Game created", "تم إنشاء اللعبة", "Partida creada"],
  donnezCodeJ2: ["Donne ce code au Joueur 2", "Give this code to Player 2", "أعط هذا الرمز للاعب 2", "Dale este código al Jugador 2"],
  copierCode: ["Copier le code", "Copy code", "نسخ الرمز", "Copiar código"],
  attenteJ2: ["En attente du Joueur 2...", "Waiting for Player 2...", "في انتظار اللاعب 2...", "Esperando al Jugador 2..."],
  j2Connecte: ["Joueur 2 connecté !", "Player 2 connected!", "اللاعب 2 متصل!", "¡Jugador 2 conectado!"],
  rejoindrePartie: ["Rejoindre une partie", "Join a game", "الانضمام إلى لعبة", "Unirse a partida"],
  entrerCode: ["Entre le code du Joueur 1", "Enter Player 1's code", "أدخل رمز اللاعب 1", "Código del Jugador 1"],
  codePartie: ["Code de partie...", "Game code...", "رمز اللعبة...", "Código..."],
  rejoindre: ["Rejoindre", "Join", "انضم", "Unirse"],
  partieIntrouvable: ["Partie introuvable", "Game not found", "اللعبة غير موجودة", "Partida no encontrada"],

  // Matchmaking
  rechercheJoueur: ["Recherche d'un adversaire...", "Searching for opponent...", "البحث عن خصم...", "Buscando rival..."],
  tempsAttente: ["Temps d'attente :", "Wait time:", "وقت الانتظار:", "Tiempo de espera:"],
  elargissementRecherche: ["Zone de recherche : ±", "Search range: ±", "نطاق البحث: ±", "Rango: ±"],
  matchmakingEchec: [
    "Aucun joueur disponible. Joue en mode IA ou invite un ami.",
    "No players available. Play AI or invite a friend.",
    "لا يوجد لاعبون متاحون. العب ضد الذكاء الاصطناعي أو ادع صديقاً.",
    "No hay jugadores. Juega contra IA o invita un amigo."
  ],
  annulerRecherche: ["Annuler", "Cancel", "إلغاء", "Cancelar"],

  rouge: ["Rouge", "Red", "أحمر", "Rojo"],
  noir: ["Noir", "Black", "أسود", "Negro"],

  manche: ["manche", "round", "جولة", "ronda"],
  manches: ["manches", "rounds", "جولات", "rondas"],
  tour: ["Tour", "Turn", "الدور", "Turno"],
  tonTour: ["Ton tour", "Your turn", "دورك", "Tu turno"],
  adversaireJoue: ["Adversaire joue", "Opponent plays", "الخصم يلعب", "El rival juega"],
  doubleTourActif: ["Double tour actif", "Double turn active", "دور مزدوج نشط", "Doble turno activo"],
  serie: ["Série", "Streak", "سلسلة", "Racha"],
  nouvellePartie: ["Nouvelle partie", "New game", "لعبة جديدة", "Nueva partida"],
  scoreContre: ["Score vs", "Score vs", "النتيجة ضد", "Puntuación vs"],

  adversaire: ["Adversaire", "Opponent", "الخصم", "Rival"],
  pieces: ["pièces", "pieces", "قطع", "piezas"],
  mesPieces: ["Mes pièces", "My pieces", "قطعي", "Mis piezas"],
  mainVide: ["Main vide", "Empty hand", "اليد فارغة", "Mano vacía"],
  reserve: ["Réserve :", "Reserve:", "الاحتياطي:", "Reserva:"],
  piecesPosees: ["Pièces posées :", "Pieces placed:", "القطع الموضوعة:", "Piezas colocadas:"],
  serieLabel: ["Série :", "Streak:", "السلسلة:", "Racha:"],

  actions: ["Actions", "Actions", "الإجراءات", "Acciones"],
  repiocher: ["Repiocher", "Redraw", "سحب جديد", "Volver a robar"],
  scout: ["Scout", "Scout", "استكشاف", "Explorar"],
  reconnaitre: ["Reconnaître", "Recognize", "تعرف", "Reconocer"],
  dejaTente: ["Déjà tenté", "Already tried", "تمت المحاولة", "Ya intentado"],
  pause: ["Pause", "Pause", "إيقاف مؤقت", "Pausa"],
  choisirRecompense: ["Choisissez votre récompense", "Choose your reward", "اختر مكافأتك", "Elige tu recompensa"],
  attendsTonTour: ["Attends ton tour...", "Wait your turn...", "انتظر دورك...", "Espera tu turno..."],

  envoyerMessage: ["Envoyer un message (max 30)", "Send a message (max 30)", "إرسال رسالة (30 كحد أقصى)", "Mensaje (máx 30)"],

  puzzleComplete: ["Puzzle complété", "Puzzle completed", "اللغز مكتمل", "Rompecabezas completado"],
  serieDe: ["Série de", "Streak of", "سلسلة من", "Racha de"],
  rienFaire: ["Rien faire", "Do nothing", "لا شيء", "No hacer nada"],
  rienFaireDesc: ["Passer au tour suivant", "Skip to next turn", "الانتقال للدور التالي", "Al siguiente turno"],
  proteger: ["Protéger", "Protect", "حماية", "Proteger"],
  protegerDesc: ["Protège une case du plateau pendant 1 tour", "Protect a board cell for 1 turn", "احمِ خانة من اللوحة لدور واحد", "Protege una casilla del tablero 1 turno"],
  echanger: ["Échanger", "Exchange", "تبادل", "Intercambiar"],
  echangerDesc: ["Recolorie une case adverse", "Recolor opponent's cell", "إعادة تلوين خانة الخصم", "Recolorea casilla rival"],
  extraire: ["Extraire", "Extract", "استخراج", "Extraer"],
  extraireDesc: ["Retire jusqu'à 2 pièces", "Remove up to 2 pieces", "إزالة حتى قطعتين", "Retira hasta 2"],

  scoutProchaines: ["prochaines pièces", "next pieces", "القطع التالية", "próximas piezas"],
  echangeAleatoire: ["échangée(s) aléatoirement", "swapped randomly", "تبديلها عشوائياً", "cambiadas al azar"],

  reconnaissance: ["Reconnaissance", "Recognition", "التعرف", "Reconocimiento"],
  longueur: ["Longueur :", "Length:", "الطول:", "Longitud:"],
  lettres: ["lettres", "letters", "حروف", "letras"],
  commencePar: ["Commence par :", "Starts with:", "يبدأ بـ:", "Comienza con:"],
  tonEstimation: ["Ton estimation...", "Your guess...", "تخمينك...", "Tu estimación..."],
  valider: ["Valider", "Validate", "تحقق", "Validar"],
  bravoDoubleTour: ["Bravo ! Double tour activé", "Great! Double turn activated", "أحسنت! تم تفعيل الدور المزدوج", "¡Bien! Doble turno activado"],
  rateNomEtait: ["Raté. Le nom était :", "Missed. The name was:", "فشلت. الاسم كان:", "Fallaste. El nombre era:"],
  tentativeUtilisee: ["Tentative utilisée.", "Attempt used.", "تم استخدام المحاولة.", "Intento usado."],
  fermer: ["Fermer", "Close", "إغلاق", "Cerrar"],
  min3CarDevinette: ["Min 3 caractères.", "Min 3 chars.", "3 أحرف على الأقل.", "Mín 3 caracteres."],

  manuelTitre: ["Manuel ELMAAS", "ELMAAS Manual", "دليل إلماس", "Manual ELMAAS"],
  manuelIntro: [
    "Un jeu de stratégie, d'art et d'intuition. Une image, des décisions, zéro excuse.",
    "Strategy, art, and instinct. One image, hard choices, no excuses.",
    "استراتيجية، فن، وحدس. صورة واحدة، قرارات حاسمة، بلا مبررات.",
    "Estrategia, arte e instinto. Una imagen, decisiones, cero excusas."
  ],

  // ── Sections du manuel ────────────────────────────────────
  mSecPlateau:    ["Le Plateau", "The Board", "اللوحة", "El Tablero"],
  mSecJouer:      ["Comment jouer", "How to Play", "كيف تلعب", "Cómo Jugar"],
  mSecPuzzles:    ["Les Puzzles", "The Puzzles", "الألغاز", "Los Puzzles"],
  mSecElmaas:     ["Pièces ELMAAS", "ELMAAS Pieces", "قطع إلماس", "Piezas ELMAAS"],
  mSecSeries:     ["Séries & Pouvoirs", "Streaks & Powers", "السلاسل والقوى", "Rachas y Poderes"],
  mSecFin:        ["Fin de partie", "End of Round", "نهاية الجولة", "Fin de Ronda"],
  mSecConseils:   ["Conseils", "Tips", "نصائح", "Consejos"],

  // ── Plateau ───────────────────────────────────────────────
  mPlateauDesc: [
    "Le plateau est recouvert de puzzles délimités par des bords colorés. Certains sont unicolores (rouge ou noir), d'autres sont bicolores — ils nécessitent les deux couleurs pour être complétés. Chaque case du plateau appartient à au plus un puzzle.",
    "The board is covered with puzzles outlined by colored borders. Some are single-color (red or black), others are two-color — they require both colors to be completed. Each cell belongs to at most one puzzle.",
    "اللوحة مغطاة بألغاز محددة بحدود ملونة. بعضها أحادي اللون (أحمر أو أسود)، وبعضها ثنائي اللون — يتطلب كلا اللونين لإكماله. كل خانة تنتمي إلى لغز واحد على الأكثر.",
    "El tablero está cubierto de puzzles delimitados por bordes de colores. Algunos son de un solo color (rojo o negro), otros son bicolores — requieren ambos colores para completarse. Cada celda pertenece a un solo puzzle."
  ],
  mPlateauBords: [
    "Pointe sur les bords d'un puzzle pour voir ses cellules mises en surbrillance et identifier ses limites exactes.",
    "Hover over a puzzle's border to highlight its cells and identify its exact boundaries.",
    "حرك المؤشر فوق حدود أي لغز لإبراز خلاياه ومعرفة حدوده الدقيقة.",
    "Pasa el cursor sobre el borde de un puzzle para resaltar sus celdas e identificar sus límites exactos."
  ],
  mPlateauSurpuzzle: [
    "Certains puzzles contiennent des sous-puzzles. Remporter un sous-puzzle peut voler le puzzle parent à l'adversaire.",
    "Some puzzles contain sub-puzzles. Winning a sub-puzzle can steal the parent puzzle from your opponent.",
    "بعض الألغاز تحتوي على ألغاز فرعية. الفوز بلغز فرعي قد يسرق اللغز الرئيسي من خصمك.",
    "Algunos puzzles contienen sub-puzzles. Ganar un sub-puzzle puede arrebatarle el puzzle principal al rival."
  ],

  // ── Comment jouer ─────────────────────────────────────────
  mJouerPoser: [
    "Poser une pièce — Sélectionne une pièce dans ta main (en bas), puis clique sur le plateau. La pièce doit avoir au moins une case dans un puzzle actif.",
    "Place a piece — Select a piece from your hand (bottom), then click the board. The piece must have at least one cell in an active puzzle.",
    "وضع قطعة — اختر قطعة من يدك (الأسفل)، ثم انقر على اللوحة. يجب أن تحتوي القطعة على خانة واحدة على الأقل في لغز نشط.",
    "Colocar pieza — Selecciona una pieza de tu mano (abajo), luego haz clic en el tablero. La pieza debe tener al menos una celda en un puzzle activo."
  ],
  mJouerRepiocher: [
    "Repiocher — Remplace toute ta main par de nouvelles pièces de ta réserve. Utile quand aucune pièce ne convient.",
    "Redraw — Replace your entire hand with new pieces from your reserve. Useful when no piece fits.",
    "السحب — استبدل يدك بالكامل بقطع جديدة من احتياطيك. مفيد عندما لا تناسب أي قطعة.",
    "Robar — Reemplaza tu mano completa con piezas nuevas de tu reserva. Útil cuando ninguna pieza encaja."
  ],
  mJouerScout: [
    "Scout — Consulte les prochaines pièces de ta réserve et échange certaines si tu le souhaites. Planifie à l'avance.",
    "Scout — Preview your next reserve pieces and optionally swap some. Plan your strategy ahead.",
    "الاستكشاف — راجع القطع القادمة في احتياطيك وبدّل بعضها إن أردت. خطط مسبقاً.",
    "Explorar — Consulta tus próximas piezas de reserva e intercambia algunas si lo deseas. Planifica tu estrategia."
  ],

  // ── Puzzles ───────────────────────────────────────────────
  mPuzzleMono: [
    "Puzzle unicolore — Toutes les cases doivent être remplies par une seule couleur de joueur (rouge OU noir). Pas de diamant.",
    "Single-color puzzle — All cells must be filled with one player color (red OR black). No diamond pieces.",
    "لغز أحادي اللون — يجب أن تُملأ جميع الخلايا بلون لاعب واحد (أحمر أو أسود). بلا قطع ماسية.",
    "Puzzle unicolor — Todas las celdas deben llenarse con un solo color de jugador (rojo O negro). Sin piezas diamante."
  ],
  mPuzzleBicolor: [
    "Puzzle bicolore — Doit contenir au moins une case rouge ET une case noire. Le joueur actif remporte le puzzle quand il est complet.",
    "Two-color puzzle — Must contain at least one red AND one black cell. The active player wins the puzzle when it's complete.",
    "لغز ثنائي اللون — يجب أن يحتوي على خانة حمراء واحدة على الأقل وخانة سوداء. اللاعب النشط يفوز باللغز عند اكتماله.",
    "Puzzle bicolor — Debe contener al menos una celda roja Y una negra. El jugador activo gana el puzzle al completarlo."
  ],
  mPuzzleIntersection: [
    "Intersections — Si deux puzzles se chevauchent, le dernier complété remporte les cases partagées. L'adversaire perd ces points.",
    "Intersections — If two puzzles overlap, the last one completed wins the shared cells. Your opponent loses those points.",
    "التقاطعات — إذا تداخل لغزان، فإن آخر لغز مكتمل يفوز بالخلايا المشتركة. يخسر الخصم هذه النقاط.",
    "Intersecciones — Si dos puzzles se superponen, el último completado gana las celdas compartidas. El rival pierde esos puntos."
  ],
  mPuzzleScore: [
    "Score — Chaque case gagnée vaut 1 point. Une case compte pour un seul joueur. Quand la manche se termine, le joueur avec le plus de cellules gagne.",
    "Scoring — Each won cell is worth 1 point. A cell counts for one player only. When the round ends, the player with the most cells wins.",
    "التسجيل — كل خانة مكتسبة تساوي نقطة واحدة. تُحسب الخانة للاعب واحد فقط. عند نهاية الجولة، اللاعب بأكبر عدد من الخلايا يفوز.",
    "Puntuación — Cada celda ganada vale 1 punto. Una celda cuenta para un solo jugador. Al terminar la ronda, gana quien tenga más celdas."
  ],

  // ── Pièces ELMAAS ─────────────────────────────────────────
  mElmaasQuoi: [
    "Les pièces ELMAAS (diamant) apparaissent lors de la régénération — quand ta réserve est épuisée.",
    "ELMAAS (diamond) pieces appear during regeneration — when your reserve runs out.",
    "تظهر قطع ELMAAS (الماسية) عند التجديد — حين ينفد احتياطيك.",
    "Las piezas ELMAAS (diamante) aparecen durante la regeneración — cuando tu reserva se agota."
  ],
  mElmaasEffet: [
    "Posée sur une case occupée, une pièce ELMAAS efface la pièce adverse et rend la case vide. On ne peut pas poser un ELMAAS sur une case déjà diamant.",
    "Placed on an occupied cell, an ELMAAS piece erases the opponent's piece and leaves the cell empty. You cannot place ELMAAS on a diamond cell.",
    "عند وضعها فوق خانة مشغولة، تمحو قطعة ELMAAS قطعة الخصم وتُفرغ الخانة. لا يمكن وضع ELMAAS فوق خانة ماسية.",
    "Colocada sobre una celda ocupada, una pieza ELMAAS borra la pieza rival y deja la celda vacía. No se puede colocar ELMAAS sobre una celda ya diamante."
  ],
  mElmaasScore: [
    "Poser un ELMAAS sur un puzzle déjà gagné par l'adversaire ne lui retire pas ses points — sauf si tu poses ensuite ta couleur dessus.",
    "Placing ELMAAS on a puzzle already won by your opponent does not remove their points — unless you then place your color on it.",
    "وضع ELMAAS على لغز فاز به الخصم لا يُزيل نقاطه — إلا إذا وضعت لونك فوقه لاحقاً.",
    "Colocar ELMAAS en un puzzle ya ganado por el rival no le quita sus puntos — a menos que luego coloques tu color encima."
  ],

  // ── Séries ────────────────────────────────────────────────
  mSerie3: [
    "3 puzzles d'affilée — Débloque un pouvoir : échange une case adverse contre la tienne, ou extrait jusqu'à 2 pièces du plateau. La série de l'adversaire est remise à zéro.",
    "3 in a row — Unlocks a power: swap one opponent cell for yours, or extract up to 2 pieces from the board. Your opponent's streak resets to zero.",
    "3 ألغاز متتالية — يفتح قوة: بادل خانة خصمك بخانتك، أو استخرج حتى قطعتين من اللوحة. تُصفَّر سلسلة خصمك.",
    "3 seguidos — Desbloquea un poder: cambia una celda rival por la tuya, o extrae hasta 2 piezas del tablero. La racha del rival se resetea."
  ],
  mSerie5: [
    "5 puzzles d'affilée — Victoire immédiate de la manche. Personne ne peut t'arrêter.",
    "5 in a row — Immediate round victory. Nobody can stop you.",
    "5 ألغاز متتالية — نصر فوري للجولة. لا أحد يستطيع إيقافك.",
    "5 seguidos — Victoria inmediata de la ronda. Nadie puede detenerte."
  ],

  // ── Fin de partie ─────────────────────────────────────────
  mFinQuand: [
    "La manche se termine quand un joueur ne peut plus poser aucune pièce intersectant un puzzle actif. Le joueur avec le plus de cellules gagnées remporte la manche.",
    "The round ends when a player can no longer place any piece intersecting an active puzzle. The player with the most won cells wins the round.",
    "تنتهي الجولة عندما لا يستطيع لاعب وضع أي قطعة تتقاطع مع لغز نشط. اللاعب بأكبر عدد من الخلايا المكتسبة يفوز بالجولة.",
    "La ronda termina cuando un jugador no puede colocar ninguna pieza que intersecte un puzzle activo. El jugador con más celdas ganadas gana la ronda."
  ],
  mFinTimer: [
    "Si le timer expire, la manche se termine immédiatement. Le score au moment de l'expiration est définitif.",
    "If the timer expires, the round ends immediately. The score at expiration is final.",
    "إذا انتهى الوقت، تنتهي الجولة فوراً. النتيجة عند انتهاء الوقت نهائية.",
    "Si el tiempo expira, la ronda termina de inmediato. La puntuación al expirar es definitiva."
  ],

  // ── Conseils ──────────────────────────────────────────────
  mConseilBords: [
    "Survole les bords colorés du plateau pour voir les limites exactes de chaque puzzle en surbrillance.",
    "Hover over the colored borders on the board to highlight the exact boundaries of each puzzle.",
    "مرر المؤشر فوق الحدود الملونة في اللوحة لرؤية الحدود الدقيقة لكل لغز مُضاءة.",
    "Pasa el cursor sobre los bordes de color en el tablero para ver los límites exactos de cada puzzle resaltados."
  ],
  mConseilCouleur: [
    "Si le fond du plateau est très sombre et que les pièces sont difficiles à distinguer, utilise le bouton C/J (Cyan/Jaune) dans le header pour changer la palette de couleurs.",
    "If the board background is very dark and pieces are hard to distinguish, use the C/J (Cyan/Yellow) button in the header to switch the color palette.",
    "إذا كانت خلفية اللوحة داكنة جداً ويصعب تمييز القطع، استخدم زر C/J (سماوي/أصفر) في الرأس لتغيير لوحة الألوان.",
    "Si el fondo del tablero es muy oscuro y las piezas son difíciles de distinguir, usa el botón C/J (Cian/Amarillo) en el encabezado para cambiar la paleta de colores."
  ],
  mConseilElmaas: [
    "N'utilise pas les pièces ELMAAS sur des puzzles déjà complétés par l'adversaire — ça ne retire pas ses points. Cible plutôt ses puzzles en cours.",
    "Don't waste ELMAAS pieces on puzzles already completed by your opponent — it won't remove their points. Target their in-progress puzzles instead.",
    "لا تُهدر قطع ELMAAS على ألغاز أكملها خصمك — لن تُزيل نقاطه. استهدف الألغاز التي لا يزال يعمل عليها.",
    "No desperdicies piezas ELMAAS en puzzles ya completados por el rival — no les quitará puntos. Apunta a sus puzzles en progreso."
  ],

  // ── Anciens (gardés pour compatibilité) ───────────────────
  objectif: ["Objectif", "Objective", "الهدف", "Objetivo"],
  objectifDesc: [
    "Complétez le maximum de puzzles à votre couleur pour accumuler des cellules. Le joueur avec le plus de cellules remporte la manche.",
    "Complete as many puzzles as possible in your color to accumulate cells. The player with the most cells wins the round.",
    "أكمل أكبر عدد من الألغاز بلونك لتجميع الخلايا. اللاعب الذي يملك أكبر عدد من الخلايا يفوز بالجولة.",
    "Completa la mayor cantidad de rompecabezas en tu color para acumular celdas. El jugador con más celdas gana la ronda."
  ],
  actionsParTour: ["Actions par tour", "Actions per turn", "الإجراءات لكل دور", "Acciones por turno"],
  actionPoser: [
    "Poser : sélectionne une pièce dans ta main, puis clique sur le plateau pour la placer.",
    "Place: select a piece from your hand, then click the board to place it.",
    "الوضع: اختر قطعة من يدك ثم انقر على اللوحة لوضعها.",
    "Colocar: selecciona una pieza de tu mano, luego haz clic en el tablero."
  ],
  actionRepiocher: [
    "Repiocher : remplace toute ta main par de nouvelles pièces.",
    "Redraw: replace your entire hand with new pieces.",
    "السحب: استبدل يدك بالكامل بقطع جديدة.",
    "Robar: reemplaza tu mano completa con piezas nuevas."
  ],
  actionScout: [
    "Scout : aperçu des 3 prochaines pièces de ta réserve.",
    "Scout: preview the next 3 pieces in your reserve.",
    "الاستكشاف: معاينة القطع الثلاث القادمة في احتياطيك.",
    "Explorar: vista previa de las próximas 3 piezas de tu reserva."
  ],
  series: ["Séries & Récompenses", "Streaks & Rewards", "السلاسل والمكافآت", "Rachas y Recompensas"],
  serie3Desc: [
    "3 puzzles d'affilée → échange une case adverse ou extrait jusqu'à 2 pièces.",
    "3 puzzles in a row → exchange an opponent cell or extract up to 2 pieces.",
    "3 ألغاز متتالية → تبادل خانة الخصم أو استخراج حتى قطعتين.",
    "3 puzzles seguidos → intercambia una celda rival o extrae hasta 2 piezas."
  ],
  serie5Desc: [
    "5 puzzles d'affilée → victoire immédiate !",
    "5 puzzles in a row → immediate victory!",
    "5 ألغاز متتالية → نصر فوري!",
    "5 puzzles seguidos → ¡victoria inmediata!"
  ],
  astuceTitre: ["Astuce", "Pro Tip", "نصيحة الخبراء", "Consejo Pro"],
  astuceDesc: [
    "Survole les bords du plateau pour voir les puzzles en surbrillance.",
    "Hover the board borders to highlight puzzles.",
    "مرر المؤشر فوق الحدود لإبراز الألغاز.",
    "Pasa el cursor sobre los bordes para resaltar los puzzles."
  ],

  tempsEcoule: ["Temps écoulé", "Time's up", "انتهى الوقت", "Tiempo agotado"],
  rougeNonJoue: ["Le Rouge n'a pas joué à temps.", "Red didn't play in time.", "لم يلعب الأحمر في الوقت.", "Rojo no jugó."],
  noirNonJoue: ["Le Noir n'a pas joué à temps.", "Black didn't play in time.", "لم يلعب الأسود في الوقت.", "Negro no jugó."],
  gagne: ["gagne", "wins", "يفوز", "gana"],
  revanche: ["Revanche", "Rematch", "المباراة الثأرية", "Revancha"],
  demanderRevanche: ["Demander revanche", "Request rematch", "طلب مباراة ثأرية", "Pedir revancha"],
  partiePerdue: ["Partie perdue", "Game lost", "فقدت اللعبة", "Partida perdida"],
  serveurRedemarre: ["Le serveur a redémarré.", "Server restarted.", "أعيد تشغيل الخادم.", "Servidor reiniciado."],

  victoire: ["Victoire", "Victory", "النصر", "Victoria"],
  defaite: ["Defaite", "Defeat", "هزيمة", "Derrota"],
  egalite: ["Egalite", "Tie", "تعادل", "Empate"],
  bienJoue: ["Bien joue", "Well played", "أحسنت", "Bien jugado"],
  remporteManche: ["remporte la manche", "wins the round", "يفوز بالجولة", "gana"],

  pauseDemandee: ["Pause demandée", "Pause requested", "تم طلب الإيقاف", "Pausa solicitada"],
  attenteReponseAdverse: ["En attente...", "Waiting...", "في انتظار...", "Esperando..."],
  annuler: ["Annuler", "Cancel", "إلغاء", "Cancelar"],
  adversaireDemandePause: ["Pause demandée par l'adversaire.", "Opponent requests pause.", "يطلب الخصم إيقافاً.", "Rival pide pausa."],
  accepter: ["Accepter", "Accept", "قبول", "Aceptar"],
  refuser: ["Refuser", "Refuse", "رفض", "Rechazar"],
  jeuEnPause: ["Jeu en pause", "Game paused", "اللعبة متوقفة", "Juego pausado"],
  reprendre: ["Reprendre", "Resume", "استئناف", "Reanudar"],

  revancheDemandee: ["Revanche demandée", "Rematch requested", "طلب مباراة ثأرية", "Revancha"],
  adversaireProposeRevanche: ["propose une revanche.", "proposes a rematch.", "يقترح مباراة ثأرية.", "propone revancha."],

  cliquerTienne: ["Clique sur une case que tu possèdes", "Click a cell you own", "انقر على خانة تملكها", "Clic en una casilla tuya"],
  cliquerAdversaire: ["Clique sur une case adverse à récupérer", "Click an opponent cell to take", "انقر على خانة الخصم للاستحواذ", "Clic en casilla rival para tomar"],
  cliquerDonnerPrendre: ["Clique sur une case adverse à échanger", "Click an opponent cell to exchange", "انقر خانة الخصم للتبادل", "Clic casilla rival para intercambiar"],
  cliquer1ou2: ["Clique 1 ou 2 pièces puis Confirmer", "Click 1 or 2 pieces then Confirm", "انقر 1 أو 2 قطع ثم أكد", "1 o 2 piezas luego Confirmar"],
  cliquerPieceAdverse: ["Clique une pièce adverse", "Click opponent piece", "انقر قطعة الخصم", "Clic pieza rival"],
  selectionnee: ["sélectionnée", "selected", "محددة", "seleccionada"],
  selectionnees: ["sélectionnées", "selected", "محددة", "seleccionadas"],
  passer: ["Passer", "Skip", "تخطي", "Saltar"],

  parametres: ["Paramètres", "Settings", "الإعدادات", "Configuración"],
  compte: ["Compte", "Account", "الحساب", "Cuenta"],
  elm: ["ELM :", "ELM:", "ELM:", "ELM:"],
  seDeconnecter: ["Se deconnecter", "Sign out", "تسجيل الخروج", "Cerrar sesión"],
  langue: ["Langue", "Language", "اللغة", "Idioma"],
  theme: ["Thème", "Theme", "السمة", "Tema"],

  plans: ["Formules", "Plans", "الباقات", "Planes"],
  planElmaasyon: ["ELMAASYON", "ELMAASYON", "ELMAASYON", "ELMAASYON"],
  planElmaasyonDesc: ["Uploads illimités + 3 analyses/jour.", "Unlimited uploads + 3 analyses/day.", "تحميلات غير محدودة + 3 تحاليل يومياً.", "Subidas + 3 análisis/día."],
  planElmaas: ["ELMAAS", "ELMAAS", "ELMAAS", "ELMAAS"],
  planElmaasDesc: ["Tout ELMAASYON + analyses illimitées + rejouer coups.", "All ELMAASYON + unlimited analyses + replay moves.", "كل ELMAASYON + تحاليل غير محدودة.", "Todo ELMAASYON + análisis ilimitados."],
  welcomeElmaasyon: ["MOIS DE BIENVENUE ELMAASYON — Gratuit", "ELMAASYON WELCOME MONTH — Free", "شهر الترحيب بـ ELMAASYON — مجاني", "BIENVENIDA ELMAASYON — Gratis"],
  passerPremiumBtn: ["Passer Premium", "Go Premium", "اشترك في بريميوم", "Hazte Premium"],
  premiumActif: ["Premium actif", "Premium active", "بريميوم نشط", "Premium activo"],
  planActif: ["Plan actif :", "Active plan:", "الباقة النشطة:", "Plan activo:"],
  parMois: ["/ mois", "/ month", "/ شهر", "/ mes"],

  classementElm: ["Classement ELM", "ELM ranking", "تصنيف ELM", "Clasificación ELM"],
  aucunClasse: ["Aucun joueur classé.", "No ranked players.", "لا يوجد لاعبون.", "Sin jugadores."],
  parties: ["Parties", "Games", "الألعاب", "Partidas"],
  winPct: ["Win%", "Win%", "فوز%", "% Victorias"],

  analyseTitre: ["Analyse de partie", "Game analysis", "تحليل المباراة", "Análisis"],
  analyseQuotaAtteint: [
    "Quota d'analyse atteint pour aujourd'hui. Passe à ELMAASYON ou ELMAAS pour plus.",
    "Analysis quota reached. Go ELMAASYON or ELMAAS for more.",
    "الحد اليومي للتحليل. اشترك في ELMAASYON أو ELMAAS.",
    "Cuota alcanzada. Actualiza a ELMAASYON o ELMAAS."
  ],
  rejouerCoup: ["Rejouer ce coup", "Replay this move", "إعادة هذه الحركة", "Reproducir"],
  retourAnalyse: ["Retour à l'analyse", "Back to analysis", "العودة للتحليل", "Volver al análisis"],
  coupSur: ["Coup", "Move", "الحركة", "Movimiento"],

  // ── Analyse ──────────────────────────────────────────────────
  analyseLegende: ["Légende", "Legend", "الأسطورة", "Leyenda"],
  analyseCacher: ["Cacher", "Hide", "إخفاء", "Ocultar"],
  analyseClassification: ["Classification des coups", "Move classification", "تصنيف الحركات", "Clasificación de jugadas"],
  analysePlateau: ["Plateau", "Board", "اللوحة", "Tablero"],
  analyseMeilleurCoupPossible: ["Meilleur coup possible", "Best possible move", "أفضل حركة ممكنة", "Mejor jugada posible"],
  analyseChargement: ["Chargement du plateau...", "Loading board...", "جار تحميل اللوحة...", "Cargando tablero..."],
  analyseTour: ["Tour", "Turn", "الدور", "Turno"],
  analyseRang: ["Rang", "Rank", "الترتيب", "Rango"],
  analyseCoupsPossibles: ["coups possibles", "possible moves", "حركات ممكنة", "jugadas posibles"],
  analyseAvant: ["Avant", "Before", "قبل", "Antes"],
  analyseApres: ["Après", "After", "بعد", "Después"],
  analyseCellules: ["cellules", "cells", "خلايا", "celdas"],
  analyseSerie: ["Série", "Streak", "السلسلة", "Racha"],
  analyseForme: ["Forme", "Shape", "الشكل", "Forma"],
  analyseVoirMeilleur: ["Voir le meilleur coup", "See best move", "رؤية أفضل حركة", "Ver mejor jugada"],
  analyseRetourCoup: ["Retour au coup joué", "Back to played move", "العودة للحركة المُلعبة", "Volver a la jugada"],
  analyseMeilleurCoupLabel: ["Meilleur coup", "Best move", "أفضل حركة", "Mejor jugada"],
  analysePiece: ["Pièce", "Piece", "القطعة", "Pieza"],
  analyseOrigine: ["Origine", "Origin", "الأصل", "Origen"],
  analyseElmaasDisponible: ["Coup ELMAAS disponible", "ELMAAS move available", "حركة ELMAAS متاحة", "Jugada ELMAAS disponible"],
  analyseNaviguer: ["pour naviguer", "to navigate", "للتنقل", "para navegar"],
  analyseResume: ["Résumé", "Summary", "الملخص", "Resumen"],
  analysePrecision: ["précision", "accuracy", "دقة", "precisión"],
  analyseAucuneDonnee: ["Aucune donnée d'analyse disponible.", "No analysis data available.", "لا توجد بيانات تحليل.", "Sin datos de análisis."],
  analyseMesPieces: ["Mes pièces", "My pieces", "قطعي", "Mis piezas"],
  analysePiecesAdv: ["Pièces adverses", "Opponent pieces", "قطع الخصم", "Piezas rivales"],
  analyseAucuneDonneeMain: ["Aucune donnée", "No data", "لا توجد بيانات", "Sin datos"],
  analyseAucunePartie: ["Aucune donnée d'analyse.", "No analysis available.", "لا يوجد تحليل.", "Sin análisis."],

  // ── Labels CLASSIF multilangues ───────────────────────────────
  classifElmaasLabel: ["Coup parfait", "Perfect move", "الحركة المثالية", "Jugada perfecta"],
  classifElmaasyonLabel: ["Excellent coup", "Excellent move", "حركة ممتازة", "Jugada excelente"],
  classifMassyLabel: ["Bon coup", "Good move", "حركة جيدة", "Buena jugada"],
  classifNotmessyLabel: ["Coup correct", "Correct move", "حركة صحيحة", "Jugada correcta"],
  classifMissedLabel: ["Opportunité ratée", "Missed opportunity", "فرصة ضائعة", "Oportunidad perdida"],
  classifChessLabel: ["Mauvais coup", "Bad move", "حركة سيئة", "Mala jugada"],

  // ── Paramètres / Settings ────────────────────────────────────
  planGratuit: ["Gratuit", "Free", "مجاني", "Gratis"],
  planGratuitDesc: [
    "1 photo personnalisée · 1 analyse / jour · Robots : Chess, Amal, ELMAASYON",
    "1 custom photo · 1 analysis / day · Bots: Chess, Amal, ELMAASYON",
    "صورة مخصصة · تحليل واحد / يوم · روبوتات: Chess, Amal, ELMAASYON",
    "1 foto · 1 análisis / día · Bots: Chess, Amal, ELMAASYON"
  ],
  planElmaasyonDescFull: [
    "Uploads illimités · 3 analyses / jour · Robots : Chess, Amal, ELMAASYON",
    "Unlimited uploads · 3 analyses / day · Bots: Chess, Amal, ELMAASYON",
    "تحميلات غير محدودة · 3 تحاليل / يوم · روبوتات: Chess, Amal, ELMAASYON",
    "Subidas ilimitadas · 3 análisis / día · Bots: Chess, Amal, ELMAASYON"
  ],
  planElmaasDescFull: [
    "Uploads illimités · Analyses illimitées · Robots : Chess, Amal, ELMAASYON, ELMAAS · Jusqu'à 15s par coup",
    "Unlimited uploads · Unlimited analyses · Bots: Chess, Amal, ELMAASYON, ELMAAS · Up to 15s per move",
    "تحميلات غير محدودة · تحاليل غير محدودة · روبوتات: Chess, Amal, ELMAASYON, ELMAAS · حتى 15 ثانية لكل حركة",
    "Subidas ilimitadas · Análisis ilimitados · Bots: Chess, Amal, ELMAASYON, ELMAAS · Hasta 15s por jugada"
  ],
  planGratuitLancement: ["Gratuit (lancement)", "Free (launch)", "مجاني (إطلاق)", "Gratis (lanzamiento)"],
  planElmaasyonBienvenue: ["Mois de bienvenue — Gratuit", "Welcome month — Free", "شهر الترحيب — مجاني", "Mes de bienvenida — Gratis"],
    // ── Tutoriel ────────────────────────────────────────────────
  tutorielBienvenue: ["Bienvenue dans ELMAAS", "Welcome to ELMAAS", "مرحباً بك في إلماس", "Bienvenido a ELMAAS"],
  tutorielIgnorer: ["Ignorer le tutoriel", "Skip tutorial", "تخطي الدليل", "Omitir tutorial"],
  tutorielCommencer: ["Commencer le tutoriel", "Start tutorial", "ابدأ الدليل", "Iniciar tutorial"],
  tutorielSuivant: ["Suivant", "Next", "التالي", "Siguiente"],
  tutorielPrecedent: ["Précédent", "Previous", "السابق", "Anterior"],
  tutorielJouer: ["C'est parti", "Let's play", "لنلعب", "A jugar"],
  tutorielRelire: ["Relire le tutoriel", "Replay tutorial", "إعادة الدليل", "Repetir tutorial"],
  tutorielRelancer: ["Relancer le tutoriel", "Restart tutorial", "إعادة تشغيل الدليل", "Reiniciar tutorial"],

  tutorielPlateauTitre: ["Le plateau", "The board", "اللوحة", "El tablero"],
  tutorielPlateauLabel: ["Plateau de démo", "Demo board", "لوحة تجريبية", "Tablero demo"],
  tutorielPlateauDesc: [
    "Le plateau est généré depuis une photo, puis divisé en puzzles avec des bords colorés. Chaque case appartient à au plus un puzzle.",
    "The board is generated from a photo, then divided into puzzles with colored borders. Each cell belongs to at most one puzzle.",
    "تُولَّد اللوحة من صورة، ثم تُقسَّم إلى ألغاز محددة بحدود ملونة. كل خانة تنتمي إلى لغز واحد على الأكثر.",
    "El tablero se genera desde una foto, dividido en puzzles con bordes de colores. Cada celda pertenece a un solo puzzle."
  ],

  tutorielPuzzleUniTitre: ["Puzzles unicolores", "Single-color puzzles", "ألغاز أحادية اللون", "Puzzles unicolor"],
  tutorielPuzzleUniLabel: ["Puzzles unicolores", "Single-color puzzles", "ألغاز أحادية اللون", "Puzzles unicolor"],
  tutorielPuzzleUniRouge: ["Puzzle rouge — cases rouges uniquement", "Red puzzle — red cells only", "لغز أحمر — خلايا حمراء فقط", "Puzzle rojo — solo celdas rojas"],
  tutorielPuzzleUniNoir: ["Puzzle noir — cases noires uniquement", "Black puzzle — black cells only", "لغز أسود — خلايا سوداء فقط", "Puzzle negro — solo celdas negras"],
  tutorielPuzzleUniDesc: [
    "Les puzzles unicolores doivent être remplis entièrement par une seule couleur joueur. Aucune pièce ELMAAS (diamant) ne peut les compléter.",
    "Single-color puzzles must be filled entirely by one player color. No ELMAAS (diamond) piece can complete them.",
    "يجب أن تُملأ الألغاز أحادية اللون بلون لاعب واحد بالكامل. لا يمكن لقطع ELMAAS (الماسية) إكمالها.",
    "Los puzzles unicolores deben llenarse completamente con un solo color. Las piezas ELMAAS no pueden completarlos."
  ],

  tutorielPuzzleBiTitre: ["Puzzles bicolores", "Two-color puzzles", "ألغاز ثنائية اللون", "Puzzles bicolor"],
  tutorielPuzzleBiLabel: ["Puzzle bicolore", "Two-color puzzle", "لغز ثنائي اللون", "Puzzle bicolor"],
  tutorielPuzzleBiMixte: ["Rouge + Noir", "Red + Black", "أحمر + أسود", "Rojo + Negro"],
  tutorielPuzzleBiDesc: [
    "Un puzzle bicolore doit contenir au moins une case rouge ET une case noire. Le joueur actif au moment de la complétion remporte le puzzle.",
    "A two-color puzzle must contain at least one red AND one black cell. The active player at completion wins the puzzle.",
    "يجب أن يحتوي اللغز ثنائي اللون على خانة حمراء واحدة على الأقل وخانة سوداء. اللاعب النشط عند الاكتمال يفوز باللغز.",
    "Un puzzle bicolor debe tener al menos una celda roja Y una negra. El jugador activo al completarlo gana el puzzle."
  ],

  tutorielScoreTitre: ["Score & Intersections", "Score & Intersections", "النقاط والتقاطعات", "Puntuación e Intersecciones"],
  tutorielScoreDesc: [
    "Chaque case gagnée vaut 1 point. Une case ne compte que pour un seul joueur. Si deux puzzles se chevauchent, le dernier complété prend les cases partagées — l'autre joueur perd ces points.",
    "Each won cell is worth 1 point. A cell counts for only one player. If two puzzles overlap, the last completed takes the shared cells — the other player loses those points.",
    "كل خانة مكتسبة تساوي نقطة واحدة. تُحسب الخانة للاعب واحد فقط. إذا تداخل لغزان، فإن آخر لغز مكتمل يأخذ الخلايا المشتركة — ويخسر الخصم هذه النقاط.",
    "Cada celda ganada vale 1 punto. Una celda cuenta para un solo jugador. Si dos puzzles se superponen, el último completado se lleva las celdas compartidas — el rival pierde esos puntos."
  ],

  tutorielSurpuzzleTitre: ["Sur-puzzles", "Sub-puzzles", "الألغاز الفرعية", "Sub-puzzles"],
  tutorielSurpuzzleParent: ["Puzzle parent", "Parent puzzle", "اللغز الرئيسي", "Puzzle padre"],
  tutorielSurpuzzleSub: ["Sous-puzzle", "Sub-puzzle", "اللغز الفرعي", "Sub-puzzle"],
  tutorielSurpuzzleVole: ["Volé !", "Stolen!", "مُسْرَق!", "¡Robado!"],
  tutorielSurpuzzleDesc: [
    "Certains puzzles contiennent des sous-puzzles. Compléter un sous-puzzle peut voler le puzzle parent à l'adversaire si celui-ci l'avait déjà remporté.",
    "Some puzzles contain sub-puzzles. Completing a sub-puzzle can steal the parent puzzle from the opponent if they had already won it.",
    "بعض الألغاز تحتوي على ألغاز فرعية. إكمال لغز فرعي قد يسرق اللغز الرئيسي من الخصم إذا كان قد فاز به سابقاً.",
    "Algunos puzzles contienen sub-puzzles. Completar un sub-puzzle puede arrebatarle el puzzle principal al rival si ya lo había ganado."
  ],

  tutorielActionsTitre: ["Actions par tour", "Actions per turn", "الإجراءات لكل دور", "Acciones por turno"],
  tutorielActionPoserTitre: ["Poser", "Place", "وضع", "Colocar"],
  tutorielActionPoserDesc: [
    "Sélectionne une pièce de ta main et clique sur le plateau. La pièce doit intersecter au moins un puzzle actif.",
    "Select a piece from your hand and click the board. The piece must intersect at least one active puzzle.",
    "اختر قطعة من يدك وانقر على اللوحة. يجب أن تتقاطع القطعة مع لغز نشط واحد على الأقل.",
    "Selecciona una pieza de tu mano y haz clic en el tablero. La pieza debe intersectar al menos un puzzle activo."
  ],
  tutorielActionRepiocherTitre: ["Repiocher", "Redraw", "السحب من جديد", "Robar"],
  tutorielActionRepiocherDesc: [
    "Remplace toute ta main par de nouvelles pièces de ta réserve. Utile quand aucune pièce ne convient.",
    "Replace your entire hand with new pieces from your reserve. Useful when no piece fits.",
    "استبدل يدك بالكامل بقطع جديدة من احتياطيك. مفيد عندما لا تناسب أي قطعة.",
    "Reemplaza tu mano completa con piezas nuevas de tu reserva. Útil cuando ninguna encaja."
  ],
  tutorielActionScoutTitre: ["Scout", "Scout", "الاستكشاف", "Explorar"],
  tutorielActionScoutDesc: [
    "Consulte les prochaines pièces de ta réserve et échange certaines si tu le souhaites. Planifie à l'avance.",
    "Preview your next reserve pieces and optionally swap some. Plan your strategy ahead.",
    "راجع القطع القادمة في احتياطيك وبدّل بعضها إن أردت. خطط مسبقاً.",
    "Consulta tus próximas piezas de reserva e intercambia algunas si lo deseas. Planifica tu estrategia."
  ],

  tutorielElmaasTitre: ["Pièces ELMAAS", "ELMAAS Pieces", "قطع إلماس", "Piezas ELMAAS"],
  tutorielElmaasDesc: [
    "Les pièces ELMAAS (diamant) apparaissent lors de la régénération. Posées sur une case adverse, elles l'effacent. Pas de diamant sur diamant. Sur un puzzle déjà complété adverse, les points restent tant que l'adversaire ne repose pas sa couleur dessus.",
    "ELMAAS (diamond) pieces appear during regeneration. Placed on an opponent cell, they erase it. No diamond on diamond. On an opponent's completed puzzle, points remain until they place their color on it again.",
    "تظهر قطع ELMAAS (الماسية) عند التجديد. عند وضعها فوق خانة خصم، تمحوها. لا ماس فوق ماس. على لغز مكتمل للخصم، تبقى النقاط ما لم يضع خصمك لونه فوقها من جديد.",
    "Las piezas ELMAAS (diamante) aparecen en la regeneración. Colocadas sobre una celda rival, la borran. No diamante sobre diamante. En un puzzle completado del rival, los puntos permanecen hasta que vuelva a colocar su color."
  ],

  tutorielSeriesTitre: ["Séries & Fin de manche", "Streaks & Round end", "السلاسل ونهاية الجولة", "Rachas y Fin de ronda"],
  tutorielSerie3Desc: ["3 puzzles d'affilée = pouvoir (échange ou extraction)", "3 in a row = power (exchange or extract)", "3 ألغاز متتالية = قوة (تبادل أو استخراج)", "3 seguidos = poder (intercambio o extracción)"],
  tutorielSerie5Desc: ["5 puzzles d'affilée = victoire immédiate !", "5 in a row = immediate victory!", "5 ألغاز متتالية = نصر فوري!", "5 seguidos = ¡victoria inmediata!"],
  tutorielFinDesc: [
    "La manche se termine quand un joueur ne peut plus poser de pièce intersectant un puzzle actif, ou si le timer expire.",
    "The round ends when a player can no longer place a piece intersecting an active puzzle, or if the timer expires.",
    "تنتهي الجولة عندما لا يستطيع لاعب وضع أي قطعة تتقاطع مع لغز نشط، أو عند انتهاء الوقت.",
    "La ronda termina cuando un jugador no puede colocar ninguna pieza que intersecte un puzzle activo, o si expira el tiempo."
  ],

  tutorielRecapTitre: ["Récapitulatif", "Summary", "الملخص", "Resumen"],
  tutorielRecap1: ["Plateau généré depuis une photo, divisé en puzzles", "Board generated from a photo, divided into puzzles", "لوحة مولدة من صورة، مقسمة إلى ألغاز", "Tablero generado desde foto, dividido en puzzles"],
  tutorielRecap2: ["Puzzles unicolores (rouge/noir) et bicolores (mixtes)", "Single-color (red/black) and two-color (mixed) puzzles", "ألغاز أحادية اللون (أحمر/أسود) وثنائية اللون (مختلطة)", "Puzzles unicolor (rojo/negro) y bicolor (mixtos)"],
  tutorielRecap3: ["Score par cases gagnées, intersections au dernier complété", "Score by won cells, intersections to last completed", "نقاط بالخلايا المكتسبة، التقاطعات لآخر مكتمل", "Puntos por celdas ganadas, intersecciones al último completado"],
  tutorielRecap4: ["Actions : poser, repiocher, scout — plus séries et ELMAAS", "Actions: place, redraw, scout — plus streaks and ELMAAS", "إجراءات: وضع، سحب، استكشاف — بالإضافة إلى السلاسل و ELMAAS", "Acciones: colocar, robar, explorar — además rachas y ELMAAS"],
  tutorielRecap5: ["Fin de manche : plus de coups possibles ou timer expiré", "Round end: no more moves or timer expires", "نهاية الجولة: لا حركات ممكنة أو انتهاء الوقت", "Fin de ronda: sin movimientos o tiempo expirado"],
};


// ═══════════════════════════════════════════════════════════
// FONCTION D'ACCÈS UI
// ═══════════════════════════════════════════════════════════

export function t(cle, indexLangue = 0) {
  const entree = T[cle];
  if (!entree) { console.warn(`[t] clé manquante: ${cle}`); return cle; }
  return entree[indexLangue] || entree[0];
}

export function getIndexLangue(codeLangue) {
  const idx = LANGUES.findIndex(l => l.code === codeLangue);
  return idx >= 0 ? idx : 0;
}