export type Goal = "lose" | "gain" | "maintain" | "healthy";
export type Sex = "male" | "female" | "other";
export type MealType = "Breakfast" | "Lunch" | "Dinner" | "Snack";

export type Profile = {
  name: string;
  country: string;
  goal: Goal;
  budget: number;
  age: number;
  sex: Sex;
  height: number;
  weight: number;
  targetWeight: number;
  activity: string;
  diet: string;
  obstacles: string[];
  calorieTarget: number;
  proteinTarget: number;
  carbTarget: number;
  fatTarget: number;
};

export type Food = {
  id: string;
  name: string;
  serving: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  cost: number;
  emoji: string;
};

export type FoodLog = Food & { logId: string; meal: MealType; time: string };

export type ChatMessage = { id: string; role: "user" | "assistant"; content: string };

export type NourishState = {
  onboarded: boolean;
  profile: Profile;
  logs: FoodLog[];
  water: number;
  favorites: string[];
  weightHistory: { label: string; value: number }[];
  notifications: boolean;
  units: "metric" | "imperial";
};

export const foods: Food[] = [
  { id: "ugali", name: "Ugali", serving: "1 cup", calories: 365, protein: 8, carbs: 79, fat: 2, cost: 35, emoji: "◒" },
  { id: "sukuma", name: "Sukuma wiki", serving: "1 cup", calories: 65, protein: 4, carbs: 9, fat: 2, cost: 25, emoji: "♧" },
  { id: "beans", name: "Stewed beans", serving: "1 cup", calories: 245, protein: 15, carbs: 44, fat: 2, cost: 45, emoji: "●" },
  { id: "githeri", name: "Githeri", serving: "1 bowl", calories: 390, protein: 17, carbs: 70, fat: 6, cost: 90, emoji: "◉" },
  { id: "chapati", name: "Chapati", serving: "1 piece", calories: 210, protein: 5, carbs: 36, fat: 6, cost: 30, emoji: "◯" },
  { id: "avocado", name: "Avocado", serving: "½ fruit", calories: 160, protein: 2, carbs: 9, fat: 15, cost: 45, emoji: "◆" },
  { id: "egg", name: "Boiled egg", serving: "1 large", calories: 74, protein: 6, carbs: 1, fat: 5, cost: 25, emoji: "◍" },
  { id: "rice", name: "Steamed rice", serving: "1 cup", calories: 205, protein: 4, carbs: 45, fat: 1, cost: 40, emoji: "✦" },
  { id: "chicken", name: "Grilled chicken", serving: "120 g", calories: 230, protein: 36, carbs: 0, fat: 9, cost: 180, emoji: "◈" },
  { id: "banana", name: "Banana", serving: "1 medium", calories: 105, protein: 1, carbs: 27, fat: 0, cost: 20, emoji: "◡" },
  { id: "omena", name: "Omena", serving: "1 cup", calories: 180, protein: 27, carbs: 4, fat: 6, cost: 80, emoji: "≈" },
  { id: "porridge", name: "Millet porridge", serving: "1 bowl", calories: 190, protein: 5, carbs: 39, fat: 2, cost: 35, emoji: "∪" },
];

export const defaultProfile: Profile = {
  name: "Guyo",
  country: "Kenya",
  goal: "healthy",
  budget: 12000,
  age: 28,
  sex: "male",
  height: 175,
  weight: 72,
  targetWeight: 68,
  activity: "Moderately active",
  diet: "Balanced",
  obstacles: ["Unhealthy eating habits"],
  calorieTarget: 2050,
  proteinTarget: 120,
  carbTarget: 245,
  fatTarget: 68,
};

export const defaultState: NourishState = {
  onboarded: false,
  profile: defaultProfile,
  logs: [],
  water: 3,
  favorites: ["githeri", "egg"],
  weightHistory: [
    { label: "Apr", value: 75 },
    { label: "May", value: 74.4 },
    { label: "Jun", value: 73.8 },
    { label: "Jul", value: 73.2 },
    { label: "Aug", value: 72.7 },
    { label: "Sep", value: 72 },
  ],
  notifications: true,
  units: "metric",
};

export function calculateTargets(profile: Profile): Profile {
  const base = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age;
  const sexAdjustment = profile.sex === "male" ? 5 : profile.sex === "female" ? -161 : -78;
  const multipliers: Record<string, number> = {
    "Lightly active": 1.35,
    "Moderately active": 1.5,
    "Very active": 1.7,
  };
  const goalAdjustment = profile.goal === "lose" ? -350 : profile.goal === "gain" ? 350 : 0;
  const calories = Math.max(1200, Math.round((base + sexAdjustment) * (multipliers[profile.activity] ?? 1.35) + goalAdjustment));
  return {
    ...profile,
    calorieTarget: calories,
    proteinTarget: Math.round(profile.weight * 1.6),
    fatTarget: Math.round((calories * 0.28) / 9),
    carbTarget: Math.round((calories - profile.weight * 1.6 * 4 - calories * 0.28) / 4),
  };
}

export function getTotals(logs: FoodLog[]) {
  return logs.reduce(
    (total, item) => ({
      calories: total.calories + item.calories,
      protein: total.protein + item.protein,
      carbs: total.carbs + item.carbs,
      fat: total.fat + item.fat,
      cost: total.cost + item.cost,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, cost: 0 },
  );
}

export function demoCoachReply(message: string, state: NourishState) {
  const totals = getTotals(state.logs);
  const remaining = Math.max(0, state.profile.calorieTarget - totals.calories);
  const dailyBudget = Math.round(state.profile.budget / 30);
  const budgetLeft = Math.max(0, dailyBudget - totals.cost);
  const lower = message.toLowerCase();
  if (lower.includes("protein")) return `You have logged ${totals.protein}g protein today. Aim for another ${Math.max(0, state.profile.proteinTarget - totals.protein)}g — eggs with beans would be an affordable fit.`;
  if (lower.includes("cheap") || lower.includes("budget")) return `You have about KSh ${budgetLeft} left in today's food budget. Githeri or beans with sukuma wiki will keep you full without stretching it.`;
  if (lower.includes("eat") || lower.includes("meal")) return `You have ${remaining} calories remaining. Try grilled chicken, sukuma wiki and a small serving of ugali — balanced, local, and around KSh 240.`;
  if (lower.includes("too much") || lower.includes("over")) return "One meal does not undo your progress. Keep your next meal vegetable-forward, drink water, and return to your usual plan — no compensation needed.";
  return `Based on today's ${totals.calories} calories and your ${state.profile.goal === "lose" ? "weight-loss" : "wellness"} goal, focus next on protein and vegetables. What food options do you have nearby?`;
}