// ============================================================
// Pre-loaded content applied to every new child profile.
// Real families replace photos/audio later in Caregiver Mode.
// ============================================================

export interface SeedCategory {
  key: string; // stable local key, used to link seed words
  name: string;
  emoji: string;
  color: string;
  words: { word: string; emoji: string; featured?: boolean }[];
}

export const SEED_CATEGORIES: SeedCategory[] = [
  {
    key: "food",
    name: "Food",
    emoji: "🍎",
    color: "#E74C3C",
    words: [
      { word: "Apple", emoji: "🍎", featured: true },
      { word: "Banana", emoji: "🍌" },
      { word: "Rice", emoji: "🍚" },
      { word: "Bread", emoji: "🍞" },
      { word: "Egg", emoji: "🥚" },
      { word: "Cookie", emoji: "🍪", featured: true },
    ],
  },
  {
    key: "drink",
    name: "Drink",
    emoji: "💧",
    color: "#3498DB",
    words: [
      { word: "Water", emoji: "💧", featured: true },
      { word: "Milk", emoji: "🥛" },
      { word: "Juice", emoji: "🧃" },
      { word: "Tea", emoji: "🍵" },
    ],
  },
  {
    key: "toilet",
    name: "Toilet",
    emoji: "🚽",
    color: "#16A085",
    words: [
      { word: "Toilet", emoji: "🚽", featured: true },
      { word: "Wash Hands", emoji: "🧼" },
    ],
  },
  {
    key: "sleep",
    name: "Sleep",
    emoji: "😴",
    color: "#8E44AD",
    words: [
      { word: "Sleep", emoji: "😴" },
      { word: "Bed", emoji: "🛏️" },
      { word: "Blanket", emoji: "🧸" },
    ],
  },
  {
    key: "pain",
    name: "Pain / Hurt",
    emoji: "🤕",
    color: "#C0392B",
    words: [
      { word: "Hurt", emoji: "🤕", featured: true },
      { word: "Tummy", emoji: "🤢" },
      { word: "Head", emoji: "🤯" },
    ],
  },
  {
    key: "feelings",
    name: "Feelings",
    emoji: "😊",
    color: "#F39C12",
    words: [
      { word: "Happy", emoji: "😊", featured: true },
      { word: "Sad", emoji: "😢" },
      { word: "Angry", emoji: "😠" },
      { word: "Scared", emoji: "😨" },
      { word: "Tired", emoji: "🥱" },
    ],
  },
  {
    key: "people",
    name: "People",
    emoji: "👨‍👩‍👧",
    color: "#2980B9",
    words: [
      { word: "Mom", emoji: "👩", featured: true },
      { word: "Dad", emoji: "👨", featured: true },
      { word: "Teacher", emoji: "🧑‍🏫" },
      { word: "Friend", emoji: "🧒" },
      { word: "Doctor", emoji: "🧑‍⚕️" },
    ],
  },
  {
    key: "places",
    name: "Places",
    emoji: "🏠",
    color: "#27AE60",
    words: [
      { word: "Home", emoji: "🏠" },
      { word: "School", emoji: "🏫" },
      { word: "Park", emoji: "🏞️" },
      { word: "Store", emoji: "🏪" },
    ],
  },
  {
    key: "activities",
    name: "Activities",
    emoji: "🎮",
    color: "#9B59B6",
    words: [
      { word: "Play", emoji: "🎮", featured: true },
      { word: "Read", emoji: "📖" },
      { word: "Music", emoji: "🎵" },
      { word: "Walk", emoji: "🚶" },
      { word: "TV", emoji: "📺" },
    ],
  },
];
