import { useCallback, useEffect, useState } from "react";
import { defaultState, type Food, type FoodLog, type MealType, type NourishState, type Profile } from "@/lib/nourish-data";

const STORAGE_KEY = "nourish-ai-state-v1";

export function useNourish() {
  const [state, setState] = useState<NourishState>(defaultState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) setState({ ...defaultState, ...JSON.parse(saved) });
    } catch {
      // Keep safe defaults when stored data cannot be read.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [hydrated, state]);

  const updateProfile = useCallback((profile: Profile) => setState((current) => ({ ...current, profile })), []);
  const completeOnboarding = useCallback((profile: Profile) => setState((current) => ({ ...current, onboarded: true, profile })), []);
  const addFood = useCallback((food: Food, meal: MealType) => {
    const log: FoodLog = { ...food, meal, logId: `${food.id}-${Date.now()}`, time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) };
    setState((current) => ({ ...current, logs: [log, ...current.logs] }));
  }, []);
  const setWater = useCallback((water: number) => setState((current) => ({ ...current, water: Math.max(0, Math.min(12, water)) })), []);
  const toggleFavorite = useCallback((id: string) => setState((current) => ({ ...current, favorites: current.favorites.includes(id) ? current.favorites.filter((item) => item !== id) : [...current.favorites, id] })), []);
  const updateWeight = useCallback((weight: number) => setState((current) => ({ ...current, profile: { ...current.profile, weight }, weightHistory: [...current.weightHistory.slice(-5), { label: "Now", value: weight }] })), []);
  const toggleNotifications = useCallback(() => setState((current) => ({ ...current, notifications: !current.notifications })), []);
  const setUnits = useCallback((units: NourishState["units"]) => setState((current) => ({ ...current, units })), []);
  const reset = useCallback(() => { window.localStorage.removeItem(STORAGE_KEY); setState(defaultState); }, []);

  return { state, hydrated, updateProfile, completeOnboarding, addFood, setWater, toggleFavorite, updateWeight, toggleNotifications, setUnits, reset };
}