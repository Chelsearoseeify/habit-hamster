import type { Routine, Completion, GamificationState } from "@/types";

const ROUTINES_KEY = "habit-hamster-routines";
const COMPLETIONS_KEY = "habit-hamster-completions";

const DEFAULT_ROUTINES: Omit<Routine, "id" | "createdAt">[] = [
  {
    name: "Gym",
    category: "Fitness",
    frequency: { type: "weekly", timesPerWeek: 3 },
    timeRange: { start: "07:00", end: "08:30" },
    preferredDays: [1, 3, 5],
  },
  {
    name: "Run",
    category: "Fitness",
    frequency: { type: "weekly", timesPerWeek: 2 },
    timeRange: { start: "18:00", end: "18:30" },
    preferredDays: [3, 7],
  },
  {
    name: "5000 steps",
    category: "Fitness",
    frequency: { type: "daily", timesPerDay: 1 },
  },
  {
    name: "Clean eating",
    category: "Nutrition",
    frequency: { type: "daily", timesPerDay: 1 },
  },
  {
    name: "Meal prep",
    category: "Nutrition",
    frequency: { type: "weekly", timesPerWeek: 1 },
    preferredDays: [7],
    timeRange: { start: "11:00", end: "13:00" },
  },
  {
    name: "Water 1.5L",
    category: "Nutrition",
    frequency: { type: "daily", timesPerDay: 1 },
  },
  {
    name: "Morning Skin care",
    category: "Skincare",
    description: "Vitamin C serum, moisturizer, sunscreen",
    frequency: { type: "daily", timesPerDay: 1 },
    timeRange: { start: "08:30", end: "08:45" },
  },
  {
    name: "Evening Skin care",
    category: "Skincare",
    description: "Cleanser, retinol, moisturizer",
    frequency: { type: "daily", timesPerDay: 1 },
    timeRange: { start: "22:30", end: "22:45" },
  },
  {
    name: "Micro current",
    category: "Skincare",
    frequency: { type: "daily", timesPerDay: 1 },
    timeRange: { start: "08:30", end: "08:45" },
  },
  {
    name: "Luce pulsata",
    category: "Skincare",
    frequency: { type: "weekly", timesPerWeek: 1 },
    timeRange: { start: "11:00", end: "11:30" },
  },
  {
    name: "Hair dye - root",
    category: "Skincare",
    frequency: { type: "interval", days: 45 },
    preferredDays: [6],
  },
  {
    name: "Bromelina",
    category: "Supplements",
    frequency: { type: "daily", timesPerDay: 2 },
    timeRange: { start: "09:00" },
  },
  {
    name: "Centella asiatica",
    category: "Supplements",
    frequency: { type: "daily", timesPerDay: 1 },
    timeRange: { start: "09:00" },
  },
  {
    name: "Dbase",
    category: "Supplements",
    frequency: { type: "daily", timesPerDay: 1 },
    timeRange: { start: "09:00" },
  },
  {
    name: "B12",
    category: "Supplements",
    frequency: { type: "daily", timesPerDay: 1 },
    timeRange: { start: "09:00" },
  },
];

export function getRoutines(): Routine[] {
  const data = localStorage.getItem(ROUTINES_KEY);
  if (data) {
    return JSON.parse(data);
  }
  // Initialize with defaults on first load
  const initialRoutines: Routine[] = DEFAULT_ROUTINES.map((r) => ({
    ...r,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  }));
  saveRoutines(initialRoutines);
  return initialRoutines;
}

export function saveRoutines(routines: Routine[]): void {
  localStorage.setItem(ROUTINES_KEY, JSON.stringify(routines));
}

export function getCompletions(): Completion[] {
  const data = localStorage.getItem(COMPLETIONS_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveCompletions(completions: Completion[]): void {
  localStorage.setItem(COMPLETIONS_KEY, JSON.stringify(completions));
}

const GAMIFICATION_KEY = "habit-hamster-gamification";

const DEFAULT_GAMIFICATION_STATE: GamificationState = {
  xp: 0,
  level: 1,
  achievements: [],
  streakFreezes: 0,
};

export function getGamificationState(): GamificationState {
  const data = localStorage.getItem(GAMIFICATION_KEY);
  return data ? JSON.parse(data) : { ...DEFAULT_GAMIFICATION_STATE };
}

export function saveGamificationState(state: GamificationState): void {
  localStorage.setItem(GAMIFICATION_KEY, JSON.stringify(state));
}
