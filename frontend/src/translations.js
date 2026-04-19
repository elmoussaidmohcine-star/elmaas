// ELMAAS — translations.js FINAL

export const LANGUES = [
  { code: "fr", nom: "Français", theme: "theme-fr" },
  { code: "en", nom: "English",  theme: "theme-en" },
  { code: "ar", nom: "العربية",  theme: "theme-ar" },
  { code: "es", nom: "Español",  theme: "theme-es" },
];

export const SLOGANS = {
  fr: [
    "Les échecs sont vieux, ELMAAS vaut plus que l'or.",
    "Merci au français d'avoir trouvé le meilleur nom : les échecs. Un aveu franc.",
    "Pas de roi à protéger — c'est toi, le roi.",
    "Un cheval qui vole en L... je jure l'avoir déjà vu quelque part.",
    "Un pion devient reine. Saint Pion, priez pour nous.",
    "Comment gagner une guerre si tes soldats ne voient ni à gauche ni à droite ?",
    "Une guerre à huit soldats — c'est plutôt une bagarre de quartier.",
    "Si la reine est plus forte que le roi, donnez-lui le trône.",
    "La tour est en cours de construction.",
    "Comment les Noirs pourraient-ils commencer ? Il faudrait qu'ils deviennent blancs d'abord.",
    "Je reconnais ce coup : l'ouverture Istobranctuscolobantus, jouée par M. Kholobanfris dans son jardin en 1800,99.",
    "Aux échecs, tu déplaces des statues. Ici, tu peins le monde.",
  ],
  en: [
    "Chess is old, ELMAAS is better than gold.",
    "No king to protect — you are the king.",
    "A flying L-shaped horse... hmm, I swear I've seen that somewhere.",
    "A pawn promoted to queen. Holy pawn, pray for us.",
    "How do you win a war if your soldiers can't see left or right?",
    "A war with 8 soldiers? That's a neighborhood scuffle.",
    "If the queen is stronger than the king, just give her the throne.",
    "The rook is currently under construction.",
    "How could Black move first? They'd have to turn white.",
    "I recognize this move — the Istobranctuscolobantus opening, played by Mr. Kholobanfris in his garden in 1800.99.",
    "Chess moves statues. ELMAAS paints the world.",
    "Sixty-four squares is cute. Try two hundred.",
  ],
  ar: [
    "الشطرنج قديم، وإلماس أثمن من الذهب.",
    "لا ملك تحميه — أنت الملك.",
    "حصان يطير على شكل حرف... أقسم أني رأيت هذه الحركة في مكان ما.",
    "جنديون يسيرون وراء الران. نحن لسنا متفائلين لهذا الحد.",
    "كيف تنتصر في حرب وجنودك لا يرون يميناً ولا يساراً؟",
    "حرب بثمانية جنود؟ هذا مجرد شجار في الحي.",
    "إن كانت الملكة أقوى من الملك، فأعطوها العرش.",
    "القلعة قيد الإنشاء.",
    "كيف يبدأ الأسود أولاً؟ يجب أن يصير أبيض أولاً.",
    "أعرف هذه الافتتاحية — استبرنكتوسكولوبنطوس، لعبها السيد خلوبنفريس في حديقته عام 1800,99.",
    "الشطرنج يحرك التماثيل. إلماس يلون العالم.",
  ],
  es: [
    "El ajedrez es viejo, ELMAAS vale más que el oro.",
    "No hay rey que proteger — tú eres el rey.",
    "Un caballo que vuela en forma de L... juro haberlo visto antes.",
    "Un peón coronado reina. San Peón, ruega por nosotros.",
    "¿Cómo ganar una guerra si tus soldados no ven a izquierda ni derecha?",
    "¿Una guerra con 8 soldados? Eso es una pelea de barrio.",
    "Si la reina es más fuerte que el rey, dale el trono.",
    "La torre está en construcción.",
    "¿Cómo van a empezar las negras? Tendrían que volverse blancas primero.",
    "Reconozco esta jugada — la apertura Istobranctuscolobantus, jugada por el Sr. Kholobanfris en su jardín en 1800,99.",
    "El ajedrez mueve estatuas. ELMAAS pinta el mundo.",
  ],
};

let _sloganCache = null;
export function getSloganAleatoire(indexLangue) {
  if (_sloganCache && _sloganCache.langue === indexLangue) return _sloganCache.phrase;
  const code = LANGUES[indexLangue].code;
  const liste = SLOGANS[code] || SLOGANS.fr;
  const phrase = liste[Math.floor(Math.random() * liste.length)];
  _sloganCache = { langue: indexLangue, phrase };
  return phrase;
}
export function getCitationAttente(indexLangue) {
  const code = LANGUES[indexLangue].code;
  const liste = SLOGANS[code] || SLOGANS.fr;
  return liste[Math.floor(Math.random() * liste.length)];
}

// Classification de coup (analyse)
export const CLASSIFICATION_COUP = {
  ELMAAS:    { couleur: "#ffd700", ordre: 0 },  // Brilliant
  ELMAASYON: { couleur: "#88ff88", ordre: 1 },  // Great
  MASSY:     { couleur: "#44cc44", ordre: 2 },  // Best
  NOTMESSY:  { couleur: "#88aaff", ordre: 3 },  // Good
  MISSED:    { couleur: "#ffaa44", ordre: 4 },  // Very bad
  CHESS:     { couleur: "#ff4422", ordre: 5 },  // Worst
};

export const T = {
  sousSlogan: [
    "Un jeu de stratégie, d'art et d'intuition.",
    "A game of strategy, art, and instinct.",
    "لعبة الاستراتيجية والفن والحدس",
    "Un juego de estrategia, arte e instinto."
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

  // Filtre mots sacrés
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
  modeIA: ["Mode IA", "AI mode", "وضع الذكاء الاصطناعي", "Modo IA"],
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

  // "5 min trop cheesy"
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

  // Couleurs
  rouge: ["Rouge", "Red", "أحمر", "Rojo"],
  noir: ["Noir", "Black", "أسود", "Negro"],

  // Header
  manche: ["manche", "round", "جولة", "ronda"],
  manches: ["manches", "rounds", "جولات", "rondas"],
  tour: ["Tour", "Turn", "الدور", "Turno"],
  tonTour: ["Ton tour", "Your turn", "دورك", "Tu turno"],
  adversaireJoue: ["Adversaire joue", "Opponent plays", "الخصم يلعب", "El rival juega"],
  doubleTourActif: ["Double tour actif", "Double turn active", "دور مزدوج نشط", "Doble turno activo"],
  serie: ["Série", "Streak", "سلسلة", "Racha"],
  nouvellePartie: ["Nouvelle partie", "New game", "لعبة جديدة", "Nueva partida"],

  // Score cumulé
  scoreContre: ["Score vs", "Score vs", "النتيجة ضد", "Puntuación vs"],

  adversaire: ["Adversaire", "Opponent", "الخصم", "Rival"],
  pieces: ["pièces", "pieces", "قطع", "piezas"],
  mesPieces: ["Mes pièces", "My pieces", "قطعي", "Mis piezas"],
  mainVide: ["Main vide", "Empty hand", "اليد فارغة", "Mano vacía"],
  reserve: ["Réserve :", "Reserve:", "الاحتياطي:", "Reserva:"],
  piecesPosees: ["Pièces posées :", "Pieces placed:", "القطع الموضوعة:", "Piezas colocadas:"],
  serieLabel: ["Série :", "Streak:", "السلسلة:", "Racha:"],
  mainAdverseVide: ["Main adverse vide", "Opponent hand empty", "يد الخصم فارغة", "Mano rival vacía"],

  // Actions
  actions: ["Actions", "Actions", "الإجراءات", "Acciones"],
  repiocher: ["Repiocher", "Redraw", "سحب جديد", "Volver a robar"],
  scout: ["Scout", "Scout", "استكشاف", "Explorar"],
  reconnaitre: ["Reconnaître", "Recognize", "تعرف", "Reconocer"],
  dejaTente: ["Déjà tenté", "Already tried", "تمت المحاولة", "Ya intentado"],
  cliquerPlateau: ["Clique sur le plateau pour placer", "Click the board to place", "انقر على اللوحة للوضع", "Clic en el tablero"],
  pause: ["Pause", "Pause", "إيقاف مؤقت", "Pausa"],
  choisirRecompense: ["Choisissez votre récompense", "Choose your reward", "اختر مكافأتك", "Elige tu recompensa"],
  attendsTonTour: ["Attends ton tour...", "Wait your turn...", "انتظر دورك...", "Espera tu turno..."],

  // Message entre joueurs
  envoyerMessage: ["Envoyer un message (max 30)", "Send a message (max 30)", "إرسال رسالة (30 كحد أقصى)", "Mensaje (máx 30)"],
  attentionSpam: ["Patiente 3 secondes...", "Wait 3 seconds...", "انتظر 3 ثوان...", "Espera 3 segundos..."],

  // Pouvoirs
  puzzleComplete: ["Puzzle complété", "Puzzle completed", "اللغز مكتمل", "Rompecabezas completado"],
  serieDe: ["Série de", "Streak of", "سلسلة من", "Racha de"],
  rienFaire: ["Rien faire", "Do nothing", "لا شيء", "No hacer nada"],
  rienFaireDesc: ["Passer au tour suivant", "Skip to next turn", "الانتقال للدور التالي", "Al siguiente turno"],
  proteger: ["Protéger", "Protect", "حماية", "Proteger"],
  protegerDesc: ["Une pièce invulnérable 1 tour", "One piece invulnerable 1 turn", "قطعة محصنة لدور", "Pieza invulnerable 1 turno"],
  echanger: ["Échanger", "Exchange", "تبادل", "Intercambiar"],
  echangerDesc: ["Recolorie une pièce adverse", "Recolor opponent piece", "إعادة تلوين قطعة الخصم", "Recolorea rival"],
  extraire: ["Extraire", "Extract", "استخراج", "Extraer"],
  extraireDesc: ["Retire jusqu'à 2 pièces", "Remove up to 2 pieces", "إزالة قطعتين", "Retira hasta 2"],

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

  // Manuel
  manuelTitre: ["Manuel ELMAAS", "ELMAAS Manual", "دليل إلماس", "Manual ELMAAS"],
  manuelIntro: ["Un jeu où la stratégie rencontre l'art.", "Where strategy meets art.", "حيث تلتقي الاستراتيجية بالفن.", "Donde la estrategia se une al arte."],
  objectif: ["Objectif", "Objective", "الهدف", "Objetivo"],
  objectifDesc: ["Complétez le plus de puzzles à votre couleur.", "Complete the most puzzles in your color.", "أكمل أكبر عدد من الألغاز بلونك.", "Completa más rompecabezas."],
  actionsParTour: ["Actions par tour", "Actions per turn", "الإجراءات لكل دور", "Acciones"],
  actionPoser: ["Poser : choisissez une pièce, cliquez sur le plateau.", "Place: pick a piece, click the board.", "الوضع: اختر قطعة وانقر.", "Colocar."],
  actionRepiocher: ["Repiocher : remplace toute ta main.", "Redraw: replace entire hand.", "السحب: استبدل يدك.", "Robar: reemplaza mano."],
  actionScout: ["Scout : voir 3 prochaines pièces.", "Scout: see next 3 pieces.", "الاستكشاف: القطع الثلاث القادمة.", "Explorar: próximas 3."],
  series: ["Séries", "Streaks", "السلاسل", "Rachas"],
  serie3Desc: ["3 d'affilée → Extraire.", "3 in a row → Extract.", "3 متتالية → استخراج.", "3 seguidos → Extraer."],
  serie5Desc: ["5 d'affilée → victoire.", "5 in a row → victory.", "5 متتالية → نصر.", "5 seguidos → victoria."],
  astuceTitre: ["Astuce", "Tip", "نصيحة", "Consejo"],
  astuceDesc: ["Forcer l'adversaire à rejouer peut valoir plus que jouer.", "Forcing opponent to replay can beat playing.", "إجبار الخصم على اللعب قد يكون أفضل.", "Forzar al rival puede ganar."],

  // Fin partie
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
  manchesRouge: ["Rouge :", "Red:", "الأحمر:", "Rojo:"],
  manchesNoir: ["Noir :", "Black:", "الأسود:", "Negro:"],

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

  cliquerTienne: ["Clique sur une de tes pièces", "Click one of your pieces", "انقر على قطعة لك", "Clic en tu pieza"],
  cliquerDonnerPrendre: ["Clique ta pièce puis celle adverse", "Click your piece then opponent's", "انقر قطعتك ثم قطعة الخصم", "Tu pieza luego rival"],
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

  // Analyse
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
};

export function t(cle, indexLangue = 0) {
  const entree = T[cle];
  if (!entree) { console.warn(`[t] ${cle}?`); return cle; }
  return entree[indexLangue] || entree[0];
}
export function getIndexLangue(codeLangue) {
  const idx = LANGUES.findIndex(l => l.code === codeLangue);
  return idx >= 0 ? idx : 0;
}