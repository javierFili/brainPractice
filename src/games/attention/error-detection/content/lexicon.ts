import { msg, type Message } from '@/domain/shared';

/**
 * Word lists are language-dependent content: alphabetical order and spelling differ per language.
 * Each word challenge is therefore generated for all five languages together from the same random
 * draws (same words, same positions, same kind of typo), and only kept when every language has
 * its single error on the same row. Switching language mid-challenge shows the same list in the
 * new language with the same solution. Spellings mirror the `kit:words` translations.
 */
export const LANGUAGES = ['es', 'en', 'it', 'fr', 'de'] as const;
export type Language = (typeof LANGUAGES)[number];
export type Localized<T> = Readonly<Record<Language, T>>;

export const localize = <T>(make: (language: Language) => T): Localized<T> =>
  Object.fromEntries(LANGUAGES.map((language) => [language, make(language)])) as Record<
    Language,
    T
  >;

/** Shows each reader the value written for their language. */
export const inLanguages = (values: Localized<string>): Message =>
  msg('attention:shared.inLanguage', values);

/** Alphabetical comparison as each language sorts words. */
export const compareIn = (language: Language, a: string, b: string): number =>
  a.localeCompare(b, language);

/** Every kit word (English id) written in each language. */
export const LEXICON: Readonly<Record<string, Localized<string>>> = {
  chair: { es: 'silla', en: 'chair', it: 'sedia', fr: 'chaise', de: 'Stuhl' },
  table: { es: 'mesa', en: 'table', it: 'tavolo', fr: 'table', de: 'Tisch' },
  lamp: { es: 'lámpara', en: 'lamp', it: 'lampada', fr: 'lampe', de: 'Lampe' },
  door: { es: 'puerta', en: 'door', it: 'porta', fr: 'porte', de: 'Tür' },
  window: { es: 'ventana', en: 'window', it: 'finestra', fr: 'fenêtre', de: 'Fenster' },
  bed: { es: 'cama', en: 'bed', it: 'letto', fr: 'lit', de: 'Bett' },
  clock: { es: 'reloj', en: 'clock', it: 'orologio', fr: 'horloge', de: 'Uhr' },
  mirror: { es: 'espejo', en: 'mirror', it: 'specchio', fr: 'miroir', de: 'Spiegel' },
  sofa: { es: 'sofá', en: 'sofa', it: 'divano', fr: 'canapé', de: 'Sofa' },
  shelf: { es: 'estante', en: 'shelf', it: 'mensola', fr: 'étagère', de: 'Regal' },
  spoon: { es: 'cuchara', en: 'spoon', it: 'cucchiaio', fr: 'cuillère', de: 'Löffel' },
  fork: { es: 'tenedor', en: 'fork', it: 'forchetta', fr: 'fourchette', de: 'Gabel' },
  plate: { es: 'plato', en: 'plate', it: 'piatto', fr: 'assiette', de: 'Teller' },
  cup: { es: 'taza', en: 'cup', it: 'tazza', fr: 'tasse', de: 'Tasse' },
  bowl: { es: 'cuenco', en: 'bowl', it: 'ciotola', fr: 'bol', de: 'Schüssel' },
  knife: { es: 'cuchillo', en: 'knife', it: 'coltello', fr: 'couteau', de: 'Messer' },
  oven: { es: 'horno', en: 'oven', it: 'forno', fr: 'four', de: 'Ofen' },
  kettle: { es: 'hervidor', en: 'kettle', it: 'bollitore', fr: 'bouilloire', de: 'Wasserkocher' },
  pan: { es: 'sartén', en: 'pan', it: 'padella', fr: 'poêle', de: 'Pfanne' },
  jar: { es: 'tarro', en: 'jar', it: 'barattolo', fr: 'bocal', de: 'Einmachglas' },
  river: { es: 'río', en: 'river', it: 'fiume', fr: 'rivière', de: 'Fluss' },
  mountain: { es: 'montaña', en: 'mountain', it: 'montagna', fr: 'montagne', de: 'Berg' },
  forest: { es: 'bosque', en: 'forest', it: 'foresta', fr: 'forêt', de: 'Wald' },
  cloud: { es: 'nube', en: 'cloud', it: 'nuvola', fr: 'nuage', de: 'Wolke' },
  stone: { es: 'piedra', en: 'stone', it: 'pietra', fr: 'pierre', de: 'Stein' },
  leaf: { es: 'hoja', en: 'leaf', it: 'foglia', fr: 'feuille', de: 'Blatt' },
  beach: { es: 'playa', en: 'beach', it: 'spiaggia', fr: 'plage', de: 'Strand' },
  island: { es: 'isla', en: 'island', it: 'isola', fr: 'île', de: 'Insel' },
  lake: { es: 'lago', en: 'lake', it: 'lago', fr: 'lac', de: 'See' },
  hill: { es: 'colina', en: 'hill', it: 'collina', fr: 'colline', de: 'Hügel' },
  horse: { es: 'caballo', en: 'horse', it: 'cavallo', fr: 'cheval', de: 'Pferd' },
  rabbit: { es: 'conejo', en: 'rabbit', it: 'coniglio', fr: 'lapin', de: 'Hase' },
  tiger: { es: 'tigre', en: 'tiger', it: 'tigre', fr: 'tigre', de: 'Tiger' },
  mouse: { es: 'ratón', en: 'mouse', it: 'topo', fr: 'souris', de: 'Maus' },
  eagle: { es: 'águila', en: 'eagle', it: 'aquila', fr: 'aigle', de: 'Adler' },
  whale: { es: 'ballena', en: 'whale', it: 'balena', fr: 'baleine', de: 'Wal' },
  snake: { es: 'serpiente', en: 'snake', it: 'serpente', fr: 'serpent', de: 'Schlange' },
  sheep: { es: 'oveja', en: 'sheep', it: 'pecora', fr: 'mouton', de: 'Schaf' },
  owl: { es: 'búho', en: 'owl', it: 'gufo', fr: 'hibou', de: 'Eule' },
  frog: { es: 'rana', en: 'frog', it: 'rana', fr: 'grenouille', de: 'Frosch' },
  bridge: { es: 'puente', en: 'bridge', it: 'ponte', fr: 'pont', de: 'Brücke' },
  tower: { es: 'torre', en: 'tower', it: 'torre', fr: 'tour', de: 'Turm' },
  street: { es: 'calle', en: 'street', it: 'strada', fr: 'rue', de: 'Straße' },
  market: { es: 'mercado', en: 'market', it: 'mercato', fr: 'marché', de: 'Markt' },
  school: { es: 'escuela', en: 'school', it: 'scuola', fr: 'école', de: 'Schule' },
  garden: { es: 'jardín', en: 'garden', it: 'giardino', fr: 'jardin', de: 'Garten' },
  museum: { es: 'museo', en: 'museum', it: 'museo', fr: 'musée', de: 'Museum' },
  station: { es: 'estación', en: 'station', it: 'stazione', fr: 'gare', de: 'Bahnhof' },
  park: { es: 'parque', en: 'park', it: 'parco', fr: 'parc', de: 'Park' },
  library: {
    es: 'biblioteca',
    en: 'library',
    it: 'biblioteca',
    fr: 'bibliothèque',
    de: 'Bücherei',
  },
  basket: { es: 'cesta', en: 'basket', it: 'cestino', fr: 'panier', de: 'Korb' },
  candle: { es: 'vela', en: 'candle', it: 'candela', fr: 'bougie', de: 'Kerze' },
  ladder: { es: 'escalera', en: 'ladder', it: 'scala', fr: 'échelle', de: 'Leiter' },
  pillow: { es: 'almohada', en: 'pillow', it: 'cuscino', fr: 'oreiller', de: 'Kissen' },
  button: { es: 'botón', en: 'button', it: 'bottone', fr: 'bouton', de: 'Knopf' },
  wallet: { es: 'cartera', en: 'wallet', it: 'portafoglio', fr: 'portefeuille', de: 'Geldbörse' },
  ticket: { es: 'entrada', en: 'ticket', it: 'biglietto', fr: 'billet', de: 'Fahrkarte' },
  helmet: { es: 'casco', en: 'helmet', it: 'casco', fr: 'casque', de: 'Helm' },
  bottle: { es: 'botella', en: 'bottle', it: 'bottiglia', fr: 'bouteille', de: 'Flasche' },
  rope: { es: 'cuerda', en: 'rope', it: 'corda', fr: 'corde', de: 'Seil' },
  bread: { es: 'pan', en: 'bread', it: 'pane', fr: 'pain', de: 'Brot' },
  apple: { es: 'manzana', en: 'apple', it: 'mela', fr: 'pomme', de: 'Apfel' },
  cheese: { es: 'queso', en: 'cheese', it: 'formaggio', fr: 'fromage', de: 'Käse' },
  soup: { es: 'sopa', en: 'soup', it: 'zuppa', fr: 'soupe', de: 'Suppe' },
  rice: { es: 'arroz', en: 'rice', it: 'riso', fr: 'riz', de: 'Reis' },
  honey: { es: 'miel', en: 'honey', it: 'miele', fr: 'miel', de: 'Honig' },
  lemon: { es: 'limón', en: 'lemon', it: 'limone', fr: 'citron', de: 'Zitrone' },
  onion: { es: 'cebolla', en: 'onion', it: 'cipolla', fr: 'oignon', de: 'Zwiebel' },
  butter: { es: 'mantequilla', en: 'butter', it: 'burro', fr: 'beurre', de: 'Butter' },
  salad: { es: 'ensalada', en: 'salad', it: 'insalata', fr: 'salade', de: 'Salat' },
  drum: { es: 'tambor', en: 'drum', it: 'tamburo', fr: 'tambour', de: 'Trommel' },
  piano: { es: 'piano', en: 'piano', it: 'pianoforte', fr: 'piano', de: 'Klavier' },
  guitar: { es: 'guitarra', en: 'guitar', it: 'chitarra', fr: 'guitare', de: 'Gitarre' },
  violin: { es: 'violín', en: 'violin', it: 'violino', fr: 'violon', de: 'Geige' },
  flute: { es: 'flauta', en: 'flute', it: 'flauto', fr: 'flûte', de: 'Flöte' },
  trumpet: { es: 'trompeta', en: 'trumpet', it: 'tromba', fr: 'trompette', de: 'Trompete' },
  bell: { es: 'campana', en: 'bell', it: 'campana', fr: 'cloche', de: 'Glocke' },
  harp: { es: 'arpa', en: 'harp', it: 'arpa', fr: 'harpe', de: 'Harfe' },
  song: { es: 'canción', en: 'song', it: 'canzone', fr: 'chanson', de: 'Lied' },
  choir: { es: 'coro', en: 'choir', it: 'coro', fr: 'chorale', de: 'Chor' },
};

export const WORD_IDS: readonly string[] = Object.keys(LEXICON);

export const spell = (id: string, language: Language): string => LEXICON[id]?.[language] ?? id;

const DICTIONARIES = localize((language) => new Set(WORD_IDS.map((id) => spell(id, language))));

export const isKnownWord = (word: string, language: Language): boolean =>
  DICTIONARIES[language].has(word);
