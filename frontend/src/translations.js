// ELMAAS — Fichier de traductions
// Chaque entrée est une liste de 4 éléments : [fr, en, ar, es]
// Indices : 0 = français, 1 = anglais, 2 = arabe, 3 = espagnol

export const LANGUES = [
  { code: "fr", nom: "Français" },
  { code: "en", nom: "English" },
  { code: "ar", nom: "العربية" },
  { code: "es", nom: "Español" },
];

export const T = {
  // ── Slogans ──
  slogan: [
    "Chess is old, ELMAAS is better than gold",
    "Chess is old, ELMAAS is better than gold",
    "الشطرنج قديم، إلماس أفضل من الذهب",
    "El ajedrez es viejo, ELMAAS es mejor que el oro",
  ],

  // ── Auth ──
  connexion: ["Connexion", "Login", "تسجيل الدخول", "Iniciar sesión"],
  inscription: ["Inscription", "Sign up", "التسجيل", "Registrarse"],
  email: ["Email", "Email", "البريد الإلكتروني", "Correo"],
  pseudo: ["Pseudo", "Username", "اسم المستخدم", "Usuario"],
  motDePasse: ["Mot de passe", "Password", "كلمة المرور", "Contraseña"],
  seConnecter: ["Se connecter", "Sign in", "تسجيل الدخول", "Iniciar sesión"],
  creerCompte: ["Créer un compte", "Create account", "إنشاء حساب", "Crear cuenta"],
  continuerSansCompte: ["Continuer sans compte", "Continue without account", "المتابعة بدون حساب", "Continuar sin cuenta"],
  erreurConnexion: ["Erreur de connexion", "Connection error", "خطأ في الاتصال", "Error de conexión"],

  // ── Écran Taille ──
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

  // ── Écran Photo ──
  choisissezPhoto: ["Choisissez une photo pour votre plateau", "Choose a photo for your board", "اختر صورة للوحتك", "Elige una foto para tu tablero"],
  nomSecretPhoto: ["Nom secret de la photo", "Secret photo name", "الاسم السري للصورة", "Nombre secreto de la foto"],
  max10Car: ["(max 10 car.)", "(max 10 chars.)", "(10 أحرف كحد أقصى)", "(máx 10 car.)"],
  exVacances: ["ex: vacances", "e.g. holiday", "مثال: عطلة", "ej: vacaciones"],
  premiumIllimite: ["Premium — uploads illimités", "Premium — unlimited uploads", "بريميوم — تحميلات غير محدودة", "Premium — subidas ilimitadas"],
  unePhotoGratuite: ["1 photo personnelle gratuite disponible", "1 free personal photo available", "صورة شخصية مجانية متاحة", "1 foto personal gratuita disponible"],
  maPhoto: ["Ma photo", "My photo", "صورتي", "Mi foto"],
  photoUtilisee: ["Photo personnelle utilisée", "Personal photo used", "تم استخدام الصورة الشخصية", "Foto personal usada"],
  passerPremium: ["Passer Premium pour en uploader plus", "Go Premium to upload more", "اشترك في بريميوم لتحميل المزيد", "Hazte Premium para subir más"],
  connectezVous: ["Connectez-vous pour uploader votre propre photo", "Sign in to upload your own photo", "سجل الدخول لتحميل صورتك", "Inicia sesión para subir tu foto"],
  generation: ["Génération...", "Generating...", "جاري التوليد...", "Generando..."],
  jouerAvecPhoto: ["Jouer avec cette photo", "Play with this photo", "اللعب بهذه الصورة", "Jugar con esta foto"],
  erreurCreation: ["Erreur lors de la création de la partie.", "Error creating the game.", "خطأ في إنشاء اللعبة.", "Error al crear la partida."],
  jeSuisJoueur2: ["Je suis le Joueur 2 — Rejoindre une partie", "I am Player 2 — Join a game", "أنا اللاعب 2 — الانضمام إلى لعبة", "Soy el Jugador 2 — Unirse a partida"],

  // ── Lobby ──
  partieCreee: ["Partie créée", "Game created", "تم إنشاء اللعبة", "Partida creada"],
  donnezCodeJ2: ["Donne ce code au Joueur 2", "Give this code to Player 2", "أعط هذا الرمز للاعب 2", "Dale este código al Jugador 2"],
  copierCode: ["Copier le code", "Copy code", "نسخ الرمز", "Copiar código"],
  attenteJ2: ["En attente du Joueur 2...", "Waiting for Player 2...", "في انتظار اللاعب 2...", "Esperando al Jugador 2..."],
  j2Connecte: ["Joueur 2 connecté !", "Player 2 connected!", "اللاعب 2 متصل!", "¡Jugador 2 conectado!"],
  erreurConnex: ["Erreur de connexion", "Connection error", "خطأ في الاتصال", "Error de conexión"],
  rejoindrePartie: ["Rejoindre une partie", "Join a game", "الانضمام إلى لعبة", "Unirse a partida"],
  entrerCode: ["Entre le code donné par le Joueur 1", "Enter the code given by Player 1", "أدخل الرمز المعطى من اللاعب 1", "Introduce el código del Jugador 1"],
  codePartie: ["Code de partie...", "Game code...", "رمز اللعبة...", "Código de partida..."],
  rejoindre: ["Rejoindre", "Join", "انضم", "Unirse"],
  partieIntrouvable: ["Partie introuvable", "Game not found", "اللعبة غير موجودة", "Partida no encontrada"],

  // ── Timer couleurs ──
  rouge: ["Rouge", "Red", "أحمر", "Rojo"],
  noir: ["Noir", "Black", "أسود", "Negro"],

  // ── Header ──
  manche: ["manche", "round", "جولة", "ronda"],
  manches: ["manches", "rounds", "جولات", "rondas"],
  tour: ["Tour", "Turn", "الدور", "Turno"],
  tonTour: ["Ton tour", "Your turn", "دورك", "Tu turno"],
  adversaireJoue: ["Adversaire joue", "Opponent plays", "الخصم يلعب", "El rival juega"],
  doubleTourActif: ["Double tour actif", "Double turn active", "دور مزدوج نشط", "Doble turno activo"],
  serie: ["Série", "Streak", "سلسلة", "Racha"],
  nouvellePartie: ["Nouvelle partie", "New game", "لعبة جديدة", "Nueva partida"],

  // ── Zone adverse ──
  adversaire: ["Adversaire", "Opponent", "الخصم", "Rival"],
  pieces: ["pièces", "pieces", "قطع", "piezas"],

  // ── Panneau main ──
  mesPieces: ["Mes pièces", "My pieces", "قطعي", "Mis piezas"],
  mainVide: ["Main vide", "Empty hand", "اليد فارغة", "Mano vacía"],
  reserve: ["Réserve :", "Reserve:", "الاحتياطي:", "Reserva:"],
  piecesPosees: ["Pièces posées :", "Pieces placed:", "القطع الموضوعة:", "Piezas colocadas:"],
  serieLabel: ["Série :", "Streak:", "السلسلة:", "Racha:"],
  mainAdverseVide: ["Main adverse vide", "Opponent hand empty", "يد الخصم فارغة", "Mano del rival vacía"],

  // ── Panneau actions ──
  actions: ["Actions", "Actions", "الإجراءات", "Acciones"],
  repiocher: ["Repiocher", "Redraw", "سحب جديد", "Volver a robar"],
  scout: ["Scout", "Scout", "استكشاف", "Explorar"],
  reconnaitre: ["Reconnaître", "Recognize", "تعرف", "Reconocer"],
  dejaTente: ["Déjà tenté", "Already tried", "تمت المحاولة", "Ya intentado"],
  cliquerPlateau: ["Clique sur le plateau pour placer", "Click the board to place", "انقر على اللوحة للوضع", "Haz clic en el tablero para colocar"],
  pause: ["Pause", "Pause", "إيقاف مؤقت", "Pausa"],
  choisirRecompense: ["Choisissez votre récompense", "Choose your reward", "اختر مكافأتك", "Elige tu recompensa"],
  attendsTonTour: ["Attends ton tour...", "Wait your turn...", "انتظر دورك...", "Espera tu turno..."],

  // ── Popup pouvoir ──
  puzzleComplete: ["Puzzle complété", "Puzzle completed", "اللغز مكتمل", "Rompecabezas completado"],
  serieDe: ["Série de", "Streak of", "سلسلة من", "Racha de"],
  rienFaire: ["Rien faire", "Do nothing", "لا شيء", "No hacer nada"],
  rienFaireDesc: ["Passer directement au tour suivant", "Go directly to next turn", "الانتقال للدور التالي", "Pasar al siguiente turno"],
  proteger: ["Protéger", "Protect", "حماية", "Proteger"],
  protegerDesc: ["Une de tes pièces devient invulnérable 1 tour", "One of your pieces is invulnerable 1 turn", "إحدى قطعك محصنة لدور واحد", "Una pieza es invulnerable 1 turno"],
  echanger: ["Échanger", "Exchange", "تبادل", "Intercambiar"],
  echangerDesc: ["Recolorie une pièce adverse à ta couleur", "Recolor an opponent piece", "إعادة تلوين قطعة الخصم", "Recolorea una pieza rival"],
  extraire: ["Extraire", "Extract", "استخراج", "Extraer"],
  extraireDesc: ["Retire jusqu'à 2 pièces du plateau", "Remove up to 2 pieces", "إزالة قطعتين من اللوحة", "Retira hasta 2 piezas"],

  // ── Popup scout ──
  scoutProchaines: ["prochaines pièces", "next pieces", "القطع التالية", "próximas piezas"],
  echangeAleatoire: ["de ta main échangée(s) aléatoirement", "of your hand swapped randomly", "من يدك تم تبديلها عشوائياً", "de tu mano cambiadas aleatoriamente"],

  // ── Popup reconnaissance ──
  reconnaissance: ["Reconnaissance", "Recognition", "التعرف", "Reconocimiento"],
  longueur: ["Longueur :", "Length:", "الطول:", "Longitud:"],
  lettres: ["lettres", "letters", "حروف", "letras"],
  commencePar: ["Commence par :", "Starts with:", "يبدأ بـ:", "Comienza con:"],
  tonEstimation: ["Ton estimation...", "Your guess...", "تخمينك...", "Tu estimación..."],
  valider: ["Valider", "Validate", "تحقق", "Validar"],
  bravoDoubleTour: ["Bravo ! Double tour activé", "Great! Double turn activated", "أحسنت! تم تفعيل الدور المزدوج", "¡Bien! Doble turno activado"],
  rateNomEtait: ["Raté. Le nom était :", "Missed. The name was:", "فشلت. الاسم كان:", "Fallaste. El nombre era:"],
  tentativeUtilisee: ["Tentative déjà utilisée.", "Attempt already used.", "تم استخدام المحاولة.", "Intento ya usado."],
  fermer: ["Fermer", "Close", "إغلاق", "Cerrar"],

  // ── Manuel ──
  manuelTitre: ["Manuel ELMAAS", "ELMAAS Manual", "دليل ELMAAS", "Manual ELMAAS"],
  objectif: ["Objectif", "Objective", "الهدف", "Objetivo"],
  objectifDesc: [
    "Chaque joueur pose des pièces tetrominos sur un plateau généré depuis une photo. Complétez le plus de puzzles à votre couleur pour gagner la manche.",
    "Each player places tetromino pieces on a photo-generated board. Complete the most puzzles in your color to win.",
    "يضع كل لاعب قطعاً رباعية على لوحة مولدة من صورة. أكمل أكبر عدد من الألغاز بلونك لتفوز.",
    "Cada jugador coloca piezas tetrominó en un tablero generado desde una foto. Completa más rompecabezas de tu color para ganar.",
  ],
  typesPuzzles: ["Types de puzzles", "Puzzle types", "أنواع الألغاز", "Tipos de rompecabezas"],
  actionsParTour: ["Actions par tour", "Actions per turn", "الإجراءات لكل دور", "Acciones por turno"],
  apresPuzzle: ["Après un puzzle complété", "After a completed puzzle", "بعد إكمال لغز", "Después de un rompecabezas completado"],
  series: ["Séries", "Streaks", "السلاسل", "Rachas"],

  // ── Popup fin de partie ──
  tempsEcoule: ["Temps écoulé", "Time's up", "انتهى الوقت", "Tiempo agotado"],
  rougeNonJoue: ["Le Rouge n'a pas joué à temps.", "Red didn't play in time.", "لم يلعب الأحمر في الوقت.", "Rojo no jugó a tiempo."],
  noirNonJoue: ["Le Noir n'a pas joué à temps.", "Black didn't play in time.", "لم يلعب الأسود في الوقت.", "Negro no jugó a tiempo."],
  gagne: ["gagne", "wins", "يفوز", "gana"],
  revanche: ["Revanche", "Rematch", "المباراة الثأرية", "Revancha"],
  demanderRevanche: ["Demander revanche", "Request rematch", "طلب مباراة ثأرية", "Pedir revancha"],
  partiePerdue: ["Partie perdue", "Game lost", "فقدت اللعبة", "Partida perdida"],
  serveurRedemarre: [
    "Le serveur a redémarré. Recommencez une nouvelle partie.",
    "The server restarted. Start a new game.",
    "أعيد تشغيل الخادم. ابدأ لعبة جديدة.",
    "El servidor se reinició. Empieza una nueva partida.",
  ],

  // ── Popup fin de manche ──
  victoire: ["Victoire", "Victory", "النصر", "Victoria"],
  defaite: ["Defaite", "Defeat", "هزيمة", "Derrota"],
  egalite: ["Egalite", "Tie", "تعادل", "Empate"],
  bienJoue: ["Bien joue", "Well played", "أحسنت", "Bien jugado"],
  remporteManche: ["remporte la manche", "wins the round", "يفوز بالجولة", "gana la ronda"],
  scoreEnCellules: ["Score en cellules de puzzles completes", "Score in cells of completed puzzles", "النتيجة بخلايا الألغاز المكتملة", "Puntuación en celdas de rompecabezas completados"],
  manchesRouge: ["Manches Rouge :", "Red rounds:", "جولات الأحمر:", "Rondas Rojo:"],
  manchesNoir: ["Manches Noir :", "Black rounds:", "جولات الأسود:", "Rondas Negro:"],

  // ── Pause ──
  pauseDemandee: ["Pause demandée", "Pause requested", "تم طلب الإيقاف", "Pausa solicitada"],
  attenteReponseAdverse: ["En attente de la réponse de l'adversaire...", "Waiting for opponent's reply...", "في انتظار رد الخصم...", "Esperando respuesta del rival..."],
  annuler: ["Annuler", "Cancel", "إلغاء", "Cancelar"],
  adversaireDemandePause: ["L'adversaire demande une pause.", "Opponent requests a pause.", "يطلب الخصم إيقافاً.", "El rival pide una pausa."],
  accepter: ["Accepter", "Accept", "قبول", "Aceptar"],
  refuser: ["Refuser", "Refuse", "رفض", "Rechazar"],
  jeuEnPause: ["Jeu en pause", "Game paused", "اللعبة متوقفة", "Juego en pausa"],
  reprendre: ["Reprendre", "Resume", "استئناف", "Reanudar"],

  // ── Revanche ──
  revancheDemandee: ["Revanche demandée", "Rematch requested", "طلب مباراة ثأرية", "Revancha solicitada"],
  adversaireProposeRevanche: ["propose une revanche.", "proposes a rematch.", "يقترح مباراة ثأرية.", "propone una revancha."],

  // ── Cibles pouvoirs ──
  cliquerTienne: ["Clique sur une de tes pièces dans le panneau gauche", "Click one of your pieces in the left panel", "انقر على إحدى قطعك في اللوحة اليسرى", "Haz clic en una de tus piezas en el panel izquierdo"],
  cliquerDonnerPrendre: ["Clique ta pièce à donner puis la pièce adverse à prendre", "Click your piece to give then opponent's piece to take", "انقر القطعة التي تعطيها ثم قطعة الخصم التي تأخذها", "Clic pieza a dar luego pieza rival a tomar"],
  cliquer1ou2: ["Clique sur 1 ou 2 pièces sur le plateau, puis Confirmer", "Click 1 or 2 pieces on the board, then Confirm", "انقر على 1 أو 2 قطع على اللوحة ثم أكد", "Clic 1 o 2 piezas del tablero, luego Confirmar"],
  cliquerPieceAdverse: ["Clique sur une pièce adverse pour la recolorier", "Click an opponent piece to recolor it", "انقر على قطعة الخصم لإعادة تلوينها", "Clic en una pieza rival para recolorear"],
  selectionnee: ["sélectionnée", "selected", "محددة", "seleccionada"],
  selectionnees: ["sélectionnées", "selected", "محددة", "seleccionadas"],
  passer: ["Passer", "Skip", "تخطي", "Saltar"],

  // ── Paramètres ──
  parametres: ["Parametres", "Settings", "الإعدادات", "Configuración"],
  compte: ["Compte", "Account", "الحساب", "Cuenta"],
  elo: ["ELO :", "ELO:", "ELO:", "ELO:"],
  seDeconnecter: ["Se deconnecter", "Sign out", "تسجيل الخروج", "Cerrar sesión"],
  langue: ["Langue", "Language", "اللغة", "Idioma"],
  passerPremiumBtn: ["Passer Premium — 6.99€/mois", "Go Premium — 6.99€/month", "اشترك في بريميوم — 6.99€/شهر", "Hazte Premium — 6.99€/mes"],
  premiumActif: ["Premium actif", "Premium active", "بريميوم نشط", "Premium activo"],

  // ── Classement ──
  classementElo: ["Classement ELO", "ELO ranking", "تصنيف ELO", "Clasificación ELO"],
  aucunClasse: ["Aucun joueur classé pour l'instant.", "No ranked players yet.", "لا يوجد لاعبون مصنفون حتى الآن.", "Aún no hay jugadores clasificados."],
  parties: ["Parties", "Games", "الألعاب", "Partidas"],
  winPct: ["Win%", "Win%", "نسبة الفوز%", "% Victorias"],
};

// ── Fonction de traduction ──
// Usage : t("confirmer", 0) → "Confirmer"
//         t("confirmer", 1) → "Confirm"
export function t(cle, indexLangue = 0) {
  const entree = T[cle];
  if (!entree) {
    console.warn(`[traduction] Clé manquante : ${cle}`);
    return cle;
  }
  return entree[indexLangue] || entree[0];
}

export function getIndexLangue(codeLangue) {
  const idx = LANGUES.findIndex(l => l.code === codeLangue);
  return idx >= 0 ? idx : 0;
}
