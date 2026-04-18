// ELMAAS — translations.js v2
// Chaque entrée = liste [fr, en, ar, es]

export const LANGUES = [
  { code: "fr", nom: "Français", theme: "theme-fr" },
  { code: "en", nom: "English",  theme: "theme-en" },
  { code: "ar", nom: "العربية",  theme: "theme-ar" },
  { code: "es", nom: "Español",  theme: "theme-es" },
];

export const T = {
  // ── SLOGANS CULTURELS (chacun avec sa personnalité) ──
  slogan: [
    "Les échecs ont leur gloire, ELMAAS est le diamant brut.",
    "Chess is old, ELMAAS is better than gold.",
    "الشطرنج ملك الزمان، وإلماس جوهرة الأوان",
    "Ajedrez es historia, ELMAAS es la joya que brilla."
  ],
  sousSlogan: [
    "Un jeu de stratégie, d'art et d'intuition.",
    "A game of strategy, art, and instinct.",
    "لعبة الاستراتيجية والفن والحدس",
    "Un juego de estrategia, arte e instinto."
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
  ouContinuerAvec: ["ou continuer avec", "or continue with", "أو تابع باستخدام", "o continúa con"],
  continuerAvecGoogle: ["Continuer avec Google", "Continue with Google", "المتابعة بواسطة Google", "Continuar con Google"],
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
  erreurCreation: ["Erreur lors de la création de la partie.", "Error creating the game.", "خطأ في إنشاء اللعبة.", "Error al crear la partida."],
  jeSuisJoueur2: ["Je suis le Joueur 2 — Rejoindre une partie", "I am Player 2 — Join a game", "أنا اللاعب 2 — الانضمام إلى لعبة", "Soy el Jugador 2 — Unirse a partida"],
  // OCR
  ocrBlocage: [
    "Le nom de Dieu n'est pas pour jouer. Veuillez choisir une autre photo.",
    "The name of God is not for playing. Please choose another photo.",
    "اسم الله ليس للعب. الرجاء اختيار صورة أخرى.",
    "El nombre de Dios no es para jugar. Elige otra foto."
  ],

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

  // ── Couleurs ──
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

  // ── Scout ──
  scoutProchaines: ["prochaines pièces", "next pieces", "القطع التالية", "próximas piezas"],
  echangeAleatoire: ["de ta main échangée(s) aléatoirement", "of your hand swapped randomly", "من يدك تم تبديلها عشوائياً", "de tu mano cambiadas aleatoriamente"],

  // ── Reconnaissance ──
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
  min3CarDevinette: [
    "La devinette doit faire au moins 3 caractères.",
    "The guess must be at least 3 characters.",
    "يجب أن يتكون التخمين من 3 أحرف على الأقل.",
    "La estimación debe tener al menos 3 caracteres."
  ],

  // ── MANUEL RICHE ──
  manuelTitre: ["Manuel ELMAAS", "ELMAAS Manual", "دليل إلماس", "Manual ELMAAS"],
  manuelIntro: [
    "Bienvenue dans ELMAAS, un jeu où la stratégie rencontre l'art. Chaque photo devient un plateau unique, chaque pièce un choix décisif.",
    "Welcome to ELMAAS, where strategy meets art. Every photo becomes a unique board, every piece a decisive choice.",
    "أهلاً بك في إلماس، حيث تلتقي الاستراتيجية بالفن. كل صورة تصبح لوحة فريدة، وكل قطعة خياراً حاسماً.",
    "Bienvenido a ELMAAS, donde la estrategia se une al arte. Cada foto se convierte en un tablero único, cada pieza en una decisión crucial."
  ],
  objectif: ["Objectif", "Objective", "الهدف", "Objetivo"],
  objectifDesc: [
    "Complétez le plus de puzzles à votre couleur. Le plateau est découpé en zones — conquérez-les avant votre adversaire.",
    "Complete the most puzzles in your color. The board is cut into zones — conquer them before your opponent.",
    "أكمل أكبر عدد من الألغاز بلونك. اللوحة مقسمة إلى مناطق — اغزها قبل خصمك.",
    "Completa más rompecabezas de tu color. El tablero está dividido en zonas — conquístalas antes que tu rival."
  ],
  typesPuzzles: ["Types de puzzles", "Puzzle types", "أنواع الألغاز", "Tipos de rompecabezas"],
  typesPuzzlesDesc: [
    "Mono-Rouge (à compléter en rouge), Mono-Noir (à compléter en noir), Mixte (chacun y met sa marque).",
    "Mono-Red (complete in red), Mono-Black (complete in black), Mixed (both play their colors).",
    "أحمر فقط (يكمل بالأحمر)، أسود فقط (يكمل بالأسود)، مختلط (كل لاعب يضع لونه).",
    "Mono-Rojo (completar en rojo), Mono-Negro (completar en negro), Mixto (ambos ponen sus colores)."
  ],
  actionsParTour: ["Actions par tour", "Actions per turn", "الإجراءات لكل دور", "Acciones por turno"],
  actionPoser: [
    "Poser : choisissez une pièce, cliquez sur le plateau pour la placer.",
    "Place: pick a piece, click on the board to place it.",
    "الوضع: اختر قطعة وانقر على اللوحة لوضعها.",
    "Colocar: elige una pieza, clic en el tablero para colocarla."
  ],
  actionRepiocher: [
    "Repiocher : remplace toute votre main par de nouvelles pièces (coûte votre tour).",
    "Redraw: replace your entire hand with new pieces (costs your turn).",
    "السحب: استبدل يدك بقطع جديدة (يكلفك دورك).",
    "Volver a robar: reemplaza toda tu mano por nuevas piezas (cuesta tu turno)."
  ],
  actionScout: [
    "Scout : voyez les 3 prochaines pièces de votre pioche (mais 1 ou 2 sont échangées au hasard).",
    "Scout: see the next 3 pieces of your draw (but 1 or 2 are randomly swapped).",
    "الاستكشاف: اطلع على القطع الثلاث القادمة (لكن 1 أو 2 قد تتبدل عشوائياً).",
    "Explorar: mira las 3 próximas piezas (pero 1 o 2 se cambian al azar)."
  ],
  apresPuzzle: ["Après un puzzle complété", "After a completed puzzle", "بعد إكمال لغز", "Después de un rompecabezas completado"],
  apresPuzzleDesc: [
    "Choisissez une récompense : Protéger une pièce, Échanger avec l'adversaire, ou Rien faire pour rester discret.",
    "Choose a reward: Protect a piece, Exchange with opponent, or Do nothing to stay discreet.",
    "اختر مكافأتك: حماية قطعة، تبادل مع الخصم، أو لا شيء لتبقى هادئاً.",
    "Elige recompensa: Proteger una pieza, Intercambiar con el rival, o No hacer nada."
  ],
  series: ["Séries", "Streaks", "السلاسل", "Rachas"],
  serie3Desc: [
    "3 puzzles d'affilée → pouvoir Extraire (retirer 1 ou 2 pièces du plateau).",
    "3 puzzles in a row → Extract power (remove 1 or 2 pieces from the board).",
    "3 ألغاز متتالية → قوة الاستخراج (إزالة 1 أو 2 من اللوحة).",
    "3 rompecabezas seguidos → poder Extraer (retira 1 o 2 piezas)."
  ],
  serie5Desc: [
    "5 puzzles d'affilée → victoire immédiate. La série est sacrée, elle se rompt si tu rates.",
    "5 puzzles in a row → instant victory. The streak is sacred, it breaks if you miss.",
    "5 ألغاز متتالية → نصر فوري. السلسلة مقدسة، تنكسر إذا أخطأت.",
    "5 rompecabezas seguidos → victoria instantánea. La racha es sagrada."
  ],
  finPartie: ["Fin de partie", "End of game", "نهاية اللعبة", "Fin del juego"],
  finPartieDesc: [
    "La partie s'achève dans 3 cas : 5 puzzles d'affilée (victoire immédiate), plus aucune pièce disponible, ou fin absolue (résultat mathématiquement certain).",
    "The game ends in 3 cases: 5 puzzles in a row (instant win), no more pieces available, or absolute end (result mathematically certain).",
    "تنتهي اللعبة في 3 حالات: 5 ألغاز متتالية (نصر فوري)، لا مزيد من القطع، أو نهاية مطلقة (نتيجة مؤكدة رياضياً).",
    "El juego termina en 3 casos: 5 rompecabezas seguidos, sin más piezas, o fin absoluto (resultado matemático)."
  ],
  astuceTitre: ["Astuce du maître", "Master's tip", "نصيحة المعلم", "Consejo del maestro"],
  astuceDesc: [
    "Parfois, forcer ton adversaire à rejouer vaut mieux que jouer toi-même. Le double tour est une arme à double tranchant.",
    "Sometimes, forcing your opponent to play again is better than playing yourself. The double turn cuts both ways.",
    "أحياناً إجبار خصمك على اللعب مجدداً أفضل من اللعب بنفسك. الدور المزدوج سلاح ذو حدين.",
    "A veces, forzar a tu rival a jugar es mejor que jugar tú. El doble turno es un arma de doble filo."
  ],

  // ── Fin de partie ──
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
    "El servidor se reinició. Empieza una nueva partida."
  ],

  // ── Manche ──
  victoire: ["Victoire", "Victory", "النصر", "Victoria"],
  defaite: ["Defaite", "Defeat", "هزيمة", "Derrota"],
  egalite: ["Egalite", "Tie", "تعادل", "Empate"],
  bienJoue: ["Bien joue", "Well played", "أحسنت", "Bien jugado"],
  remporteManche: ["remporte la manche", "wins the round", "يفوز بالجولة", "gana la ronda"],
  scoreEnCellules: ["Score en cellules de puzzles completes", "Score in cells of completed puzzles", "النتيجة بخلايا الألغاز المكتملة", "Puntuación en celdas completadas"],
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
  parametres: ["Paramètres", "Settings", "الإعدادات", "Configuración"],
  compte: ["Compte", "Account", "الحساب", "Cuenta"],
  elm: ["ELM :", "ELM:", "ELM:", "ELM:"],
  seDeconnecter: ["Se deconnecter", "Sign out", "تسجيل الخروج", "Cerrar sesión"],
  langue: ["Langue", "Language", "اللغة", "Idioma"],
  theme: ["Thème", "Theme", "السمة", "Tema"],

  // ── PLANS PREMIUM ──
  plans: ["Formules", "Plans", "الباقات", "Planes"],
  planElmaasyon: ["ELMAASYON", "ELMAASYON", "ELMAASYON", "ELMAASYON"],
  planElmaasyonDesc: [
    "Uploads de photos illimités + 1 analyse de partie par jour.",
    "Unlimited photo uploads + 1 game analysis per day.",
    "تحميلات صور غير محدودة + تحليل مباراة واحد يومياً.",
    "Subidas ilimitadas + 1 análisis de partida al día."
  ],
  planElmaas: ["ELMAAS", "ELMAAS", "ELMAAS", "ELMAAS"],
  planElmaasDesc: [
    "Tout ELMAASYON + analyses illimitées + rejouer vos coups + sauvegarde complète.",
    "All ELMAASYON + unlimited analyses + replay your moves + full save.",
    "كل ELMAASYON + تحاليل غير محدودة + إعادة لعب الحركات + حفظ كامل.",
    "Todo ELMAASYON + análisis ilimitados + revivir movimientos + guardado completo."
  ],
  welcomeElmaasyon: [
    "MOIS DE BIENVENUE ELMAASYON — Gratuit",
    "ELMAASYON WELCOME MONTH — Free",
    "شهر الترحيب بـ ELMAASYON — مجاني",
    "MES DE BIENVENIDA ELMAASYON — Gratis"
  ],
  passerPremiumBtn: ["Passer Premium", "Go Premium", "اشترك في بريميوم", "Hazte Premium"],
  premiumActif: ["Premium actif", "Premium active", "بريميوم نشط", "Premium activo"],
  planActif: ["Plan actif :", "Active plan:", "الباقة النشطة:", "Plan activo:"],
  parMois: ["/ mois", "/ month", "/ شهر", "/ mes"],

  // ── Classement ──
  classementElm: ["Classement ELM", "ELM ranking", "تصنيف ELM", "Clasificación ELM"],
  aucunClasse: ["Aucun joueur classé pour l'instant.", "No ranked players yet.", "لا يوجد لاعبون مصنفون حتى الآن.", "Aún no hay jugadores clasificados."],
  parties: ["Parties", "Games", "الألعاب", "Partidas"],
  winPct: ["Win%", "Win%", "نسبة الفوز%", "% Victorias"],

  // ── ANALYSE DE PARTIE (coups) ──
  analyseCoup: ["Qualité du coup", "Move quality", "جودة الحركة", "Calidad del movimiento"],
  coupElmaas: ["ELMAAS", "ELMAAS", "ELMAAS", "ELMAAS"], // Brilliant
  coupElmaasyon: ["ELMAASYON", "ELMAASYON", "ELMAASYON", "ELMAASYON"], // Great
  coupMassy: ["MASSY", "MASSY", "MASSY", "MASSY"], // Best
  coupNotMessy: ["NOTMESSY", "NOTMESSY", "NOTMESSY", "NOTMESSY"], // Good
  coupMessy: ["MESSY", "MESSY", "MESSY", "MESSY"], // Bad
  coupMissed: ["MISSED", "MISSED", "MISSED", "MISSED"], // Very bad

  // ── Bannissement ──
  banniTitre: ["Accès suspendu", "Access suspended", "الوصول موقوف", "Acceso suspendido"],
  banniMessage: [
    "Trop d'abandons. Revenez demain pour jouer.",
    "Too many abandonments. Come back tomorrow.",
    "كثير من الانسحابات. عد غداً.",
    "Demasiados abandonos. Vuelve mañana."
  ],
};

// ── Fonction de traduction ──
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