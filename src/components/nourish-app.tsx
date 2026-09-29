import { useMemo, useRef, useState, type FormEvent } from "react";
import {
  Apple,
  ArrowLeft,
  BarChart3,
  Bell,
  Camera,
  Check,
  ChevronRight,
  CircleUserRound,
  Droplets,
  Flame,
  Heart,
  Home,
  Leaf,
  MessageCircle,
  Minus,
  PencilLine,
  Plus,
  RotateCcw,
  Search,
  Send,
  Settings,
  Target,
  Upload,
  Utensils,
  WalletCards,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { PromptInput, PromptInputFooter, PromptInputSubmit, PromptInputTextarea } from "@/components/ai-elements/prompt-input";
import { useNourish } from "@/hooks/use-nourish";
import { calculateTargets, defaultProfile, demoCoachReply, foods, getTotals, type ChatMessage, type Food, type Goal, type MealType, type Profile } from "@/lib/nourish-data";
import mealImage from "@/assets/nourish-meal.jpg";
import { cn } from "@/lib/utils";
import { useServerFn } from "@tanstack/react-start";
import { analyzeMeal, coachReply, type MealAnalysis } from "@/lib/nourish-ai.functions";
function AddChoice({ icon: Icon, title, detail, onClick }: { icon: typeof Camera; title: string; detail: string; onClick: () => void }) { return <button type="button" onClick={onClick} className="flex min-h-32 flex-col items-start justify-between rounded-3xl bg-surface p-4 text-left transition-colors hover:bg-surface-strong"><span className="grid size-11 place-items-center rounded-full bg-background"><Icon className="size-5" /></span><span><strong className="block">{title}</strong><span className="text-xs text-muted-foreground">{detail}</span></span></button>; }

type Tab = "home" | "coach" | "history" | "progress" | "profile";
type AddMode = "menu" | "search" | "scan" | "manual" | null;

const goals: { value: Goal; label: string; detail: string; icon: string }[] = [
  { value: "lose", label: "Lose weight", detail: "Build a steady, sustainable calorie deficit", icon: "↓" },
  { value: "gain", label: "Gain weight", detail: "Add strength and healthy body mass", icon: "+" },
  { value: "maintain", label: "Maintain weight", detail: "Keep your current balance", icon: "=" },
  { value: "healthy", label: "Eat healthier", detail: "Improve your choices without pressure", icon: "♡" },
];

const countries = ["Kenya", "Uganda", "Tanzania", "Nigeria", "Ghana", "South Africa"];
const countryFlags: Record<string, string> = { Kenya: "🇰🇪", Uganda: "🇺🇬", Tanzania: "🇹🇿", Nigeria: "🇳🇬", Ghana: "🇬🇭", "South Africa": "🇿🇦" };

function Brand({ compact = false }: { compact?: boolean }) {
  return <div className={cn("flex items-center gap-2 font-black tracking-normal", compact ? "text-xl" : "text-2xl")}><span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground"><Leaf className="size-5" /></span>Nourish AI</div>;
}

function Ring({ value, size = 118, children, accent = "stroke-primary" }: { value: number; size?: number; children: React.ReactNode; accent?: string }) {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r={radius} fill="none" className="stroke-surface-strong" strokeWidth="8" />
        <circle cx="50" cy="50" r={radius} fill="none" className={accent} strokeLinecap="round" strokeWidth="8" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - Math.min(1, Math.max(0, value)))} />
      </svg>
      <div className="relative text-center">{children}</div>
    </div>
  );
}

function Onboarding({ initial, onComplete }: { initial: Profile; onComplete: (profile: Profile) => void }) {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState(initial);
  const [generating, setGenerating] = useState(false);
  const steps = 10;
  const update = <K extends keyof Profile>(key: K, value: Profile[K]) => setProfile((current) => ({ ...current, [key]: value }));
  const next = () => {
    if (step === 8) {
      setGenerating(true);
      window.setTimeout(() => { setGenerating(false); setStep(9); }, 1400);
      return;
    }
    if (step === 9) onComplete(calculateTargets(profile));
    else setStep((current) => Math.min(9, current + 1));
  };
  const panels = [
    <div key="welcome" className="flex min-h-[72vh] flex-col justify-between pt-8">
      <div><Brand /><div className="mt-10 overflow-hidden rounded-[2rem] bg-surface"><img src={mealImage} alt="Ugali, greens, beans and avocado" width={1200} height={912} className="aspect-[4/3] w-full object-cover" /></div></div>
      <div className="pb-4 pt-8"><h1 className="text-4xl font-black leading-tight">Eat better.<br />Spend smarter.</h1><p className="mt-4 text-base leading-7 text-muted-foreground">A personal nutrition coach that understands your local food, your body and your budget.</p></div>
    </div>,
    <Question key="country" title="Where are you from?" subtitle="We'll tailor foods and prices to where you live.">
      <div className="space-y-3">{countries.map((country) => <Choice key={country} selected={profile.country === country} onClick={() => update("country", country)} icon={countryFlags[country] ?? "◉"} label={country} />)}</div>
    </Question>,
    <Question key="goal" title="What's your main goal?" subtitle="This shapes your daily nutrition target.">
      <div className="space-y-3">{goals.map((goal) => <Choice key={goal.value} selected={profile.goal === goal.value} onClick={() => update("goal", goal.value)} icon={goal.icon} label={goal.label} detail={goal.detail} />)}</div>
    </Question>,
    <Question key="budget" title="What's your monthly food budget?" subtitle="We'll keep every recommendation realistic.">
      <div className="rounded-3xl bg-surface p-6 text-center"><p className="text-sm text-muted-foreground">Monthly budget</p><div className="mt-2 flex items-baseline justify-center gap-2"><span className="text-xl font-bold">KSh</span><span className="text-5xl font-black">{profile.budget.toLocaleString()}</span></div><Slider className="mt-8" min={5000} max={30000} step={500} value={[profile.budget]} onValueChange={([value]) => update("budget", value ?? 12000)} /><div className="mt-5 flex justify-between text-xs text-muted-foreground"><span>KSh 5k</span><span>KSh 30k</span></div></div>
      <p className="mt-4 text-center text-sm text-muted-foreground">About <strong className="text-foreground">KSh {Math.round(profile.budget / 30)}</strong> per day</p>
    </Question>,
    <Question key="body" title="Tell us about you" subtitle="We use this to estimate your energy needs.">
      <div className="grid grid-cols-2 gap-3"><NumberField label="Age" value={profile.age} suffix="years" onChange={(v) => update("age", v)} /><NumberField label="Height" value={profile.height} suffix="cm" onChange={(v) => update("height", v)} /><NumberField label="Weight" value={profile.weight} suffix="kg" onChange={(v) => update("weight", v)} /><NumberField label="Goal weight" value={profile.targetWeight} suffix="kg" onChange={(v) => update("targetWeight", v)} /></div>
    </Question>,
    <Question key="sex" title="Choose your sex" subtitle="This helps personalize your experience.">
      <div className="space-y-3">{(["male", "female", "other"] as const).map((sex) => <Choice key={sex} selected={profile.sex === sex} onClick={() => update("sex", sex)} icon={sex === "male" ? "♂" : sex === "female" ? "♀" : "◇"} label={sex.charAt(0).toUpperCase() + sex.slice(1)} />)}</div>
    </Question>,
    <Question key="activity" title="How active are you?" subtitle="Include work, walking and planned exercise.">
      <div className="space-y-3">{["Lightly active", "Moderately active", "Very active"].map((activity) => <Choice key={activity} selected={profile.activity === activity} onClick={() => update("activity", activity)} icon="↗" label={activity} />)}</div>
    </Question>,
    <Question key="diet" title="Do you follow a specific diet?" subtitle="We'll keep suggestions relevant to you.">
      <div className="space-y-3">{["Balanced", "Whole-food", "Vegetarian", "Vegan", "Low-carb"].map((diet) => <Choice key={diet} selected={profile.diet === diet} onClick={() => update("diet", diet)} icon={diet === "Balanced" ? "◐" : "◌"} label={diet} />)}</div>
    </Question>,
    <Question key="obstacle" title="What's stopping you from reaching your goals?" subtitle="Choose the biggest challenge right now.">
      <div className="space-y-3">{["Lack of consistency", "Unhealthy eating habits", "Lack of support", "Busy schedule", "Lack of meal options"].map((item) => <Choice key={item} selected={profile.obstacles.includes(item)} onClick={() => update("obstacles", [item])} icon="·" label={item} />)}</div>
    </Question>,
    <PlanReady key="ready" profile={calculateTargets(profile)} />,
  ];
  if (generating) return <div className="flex min-h-dvh flex-col items-center justify-center px-8 text-center"><div className="relative mb-8 grid size-32 place-items-center rounded-full bg-surface"><Leaf className="size-12 animate-pulse" /><div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-primary" /></div><p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Building your plan</p><h1 className="mt-3 text-3xl font-black">Making every meal fit.</h1><div className="mt-8 w-full max-w-xs space-y-3 text-left text-sm"><Status label="Calculating energy needs" /><Status label="Balancing your food budget" /><Status label="Finding local meal matches" /></div></div>;
  return <main className="mx-auto flex min-h-dvh max-w-mobile flex-col bg-background px-5 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-5">
    {step > 0 && <header className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-5"><Button aria-label="Go back" variant="soft" size="icon" className="size-12 rounded-full" onClick={() => setStep((current) => current - 1)}><ArrowLeft className="size-5" /></Button><div className="h-1.5 overflow-hidden rounded-full bg-surface-strong"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(step / (steps - 1)) * 100}%` }} /></div></header>}
    <div className="flex-1">{panels[step]}</div>
    <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-mobile border-t border-border/70 bg-background/95 px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 backdrop-blur"><Button variant="nourish" size="pill" className="w-full" onClick={next}>{step === 0 ? "Get started" : step === 9 ? "View my plan" : "Continue"}</Button>{step === 0 && <button className="mt-3 w-full text-center text-sm font-semibold text-muted-foreground" onClick={() => setStep(1)}>I already have an account</button>}</div>
  </main>;
}

function Question({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return <section className="pt-10"><h1 className="text-3xl font-black leading-tight">{title}</h1><p className="mt-2 text-base text-muted-foreground">{subtitle}</p><div className="mt-12">{children}</div></section>;
}

function Choice({ selected, onClick, icon, label, detail }: { selected: boolean; onClick: () => void; icon: string; label: string; detail?: string }) {
  return <button type="button" aria-pressed={selected} onClick={onClick} className={cn("grid min-h-18 w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 rounded-2xl border bg-background p-4 text-left transition", selected ? "border-2 border-primary" : "border-border")}><span className="grid size-11 shrink-0 place-items-center rounded-full bg-surface text-xl font-bold">{icon}</span><span className="min-w-0"><span className="block font-bold capitalize">{label}</span>{detail && <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{detail}</span>}</span><span className={cn("grid size-6 shrink-0 place-items-center rounded-full border-2", selected ? "border-primary bg-primary" : "border-border")} >{selected && <span className="size-2 rounded-full bg-primary-foreground" />}</span></button>;
}

function NumberField({ label, value, suffix, onChange }: { label: string; value: number; suffix: string; onChange: (value: number) => void }) {
  return <label className="rounded-2xl bg-surface p-4"><span className="text-xs font-semibold text-muted-foreground">{label}</span><span className="mt-2 flex items-baseline gap-1"><input className="min-w-0 flex-1 bg-transparent text-3xl font-black outline-none" type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} /><span className="text-xs text-muted-foreground">{suffix}</span></span></label>;
}

function Status({ label }: { label: string }) { return <div className="flex items-center gap-3 rounded-xl bg-surface p-3"><span className="grid size-6 place-items-center rounded-full bg-success text-success-foreground"><Check className="size-4" /></span>{label}</div>; }

function PlanReady({ profile }: { profile: Profile }) {
  const title = profile.goal === "lose" ? `Reach ${profile.targetWeight} kg steadily` : profile.goal === "gain" ? `Gain strength toward ${profile.targetWeight} kg` : "Build your healthiest routine";
  return <section className="pt-8 text-center"><span className="mx-auto grid size-14 place-items-center rounded-full bg-primary text-primary-foreground"><Check className="size-8" /></span><h1 className="mx-auto mt-6 max-w-sm text-3xl font-black leading-tight">{title}</h1><p className="mt-2 text-muted-foreground">Your practical daily recommendation</p><div className="mt-8 rounded-3xl bg-surface p-6 text-left"><p className="text-sm font-bold">Daily nutrition</p><div className="mt-4 rounded-2xl bg-background p-5"><p className="text-4xl font-black">{profile.calorieTarget.toLocaleString()}</p><p className="text-sm text-muted-foreground">Calories per day</p></div><div className="mt-3 grid grid-cols-3 gap-2"><MacroMini value={`${profile.proteinTarget}g`} label="Protein" tone="text-protein" /><MacroMini value={`${profile.carbTarget}g`} label="Carbs" tone="text-carbs" /><MacroMini value={`${profile.fatTarget}g`} label="Fats" tone="text-fat" /></div></div><div className="mt-4 rounded-2xl border border-border p-4 text-left"><p className="text-sm font-bold">Built around your life</p><p className="mt-1 text-sm text-muted-foreground">{profile.country} · KSh {profile.budget.toLocaleString()}/month · {profile.diet}</p></div></section>;
}

function MacroMini({ value, label, tone }: { value: string; label: string; tone: string }) { return <div className="rounded-2xl bg-background p-3"><span className={cn("text-lg font-black", tone)}>{value}</span><span className="block text-xs text-muted-foreground">{label}</span></div>; }

export function NourishApp() {
  const store = useNourish();
  const [tab, setTab] = useState<Tab>("home");
  const [addMode, setAddMode] = useState<AddMode>(null);
  if (!store.hydrated) return <div className="grid min-h-dvh place-items-center"><Leaf className="size-10 animate-pulse" /></div>;
  if (!store.state.onboarded) return <Onboarding initial={store.state.profile} onComplete={store.completeOnboarding} />;
  return <div className="min-h-dvh bg-app-shell md:py-8"><main className="relative mx-auto min-h-dvh max-w-mobile overflow-hidden bg-background shadow-app md:min-h-[860px] md:rounded-[2.5rem]">
    <div className="min-h-[calc(100dvh-5.5rem)] pb-28 md:min-h-[750px]">{tab === "home" && <HomeScreen store={store} onAdd={() => setAddMode("menu")} />}{tab === "coach" && <CoachScreen state={store.state} />}{tab === "history" && <HistoryScreen store={store} />}{tab === "progress" && <ProgressScreen store={store} />}{tab === "profile" && <ProfileScreen store={store} />}</div>
    <BottomNav tab={tab} onTab={setTab} onAdd={() => setAddMode("menu")} />
    {addMode && <AddFoodSheet mode={addMode} setMode={setAddMode} onAdd={(food, meal) => { store.addFood(food, meal); setAddMode(null); setTab("home"); }} favorites={store.state.favorites} onFavorite={store.toggleFavorite} profile={store.state.profile} />}
  </main></div>;
}

function ScreenHeader({ title, action }: { title: string; action?: React.ReactNode }) { return <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 pb-5 pt-7"><div className="min-w-0"><Brand compact /><h1 className="mt-6 truncate text-3xl font-black">{title}</h1></div>{action}</header>; }

function HomeScreen({ store, onAdd }: { store: ReturnType<typeof useNourish>; onAdd: () => void }) {
  const { state } = store; const totals = getTotals(state.logs); const remaining = Math.max(0, state.profile.calorieTarget - totals.calories); const dailyBudget = Math.round(state.profile.budget / 30);
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  return <div><div className="bg-home-wash px-5 pb-7 pt-7"><div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4"><Brand compact /><span className="rounded-full bg-background px-4 py-2 text-sm font-bold"><Flame className="mr-1 inline size-4 text-accent-warm" /> 4</span></div><div className="mt-7 grid grid-cols-7 gap-2 text-center">{days.map((day, i) => <div key={`${day}-${i}`}><span className={cn("mx-auto grid size-9 place-items-center rounded-full border text-sm font-bold", i < 4 ? "border-success text-success" : i === 4 ? "border-primary bg-primary text-primary-foreground" : "border-transparent text-muted-foreground")}>{day}</span><span className="mt-1 block text-xs">{23 + i}</span></div>)}</div></div>
    <section className="px-5 pt-6"><div className="grid grid-cols-[1.1fr_.9fr] gap-3"><div className="rounded-3xl bg-surface p-5"><p className="text-sm font-semibold text-muted-foreground">Calories today</p><div className="mt-4 flex justify-center"><Ring value={totals.calories / state.profile.calorieTarget}><Flame className="mx-auto size-6" /><strong className="mt-1 block text-xl">{remaining}</strong><span className="text-[10px] text-muted-foreground">remaining</span></Ring></div><p className="mt-3 text-center text-sm font-bold">{totals.calories.toLocaleString()} / {state.profile.calorieTarget.toLocaleString()}</p></div><div className="flex flex-col justify-between rounded-3xl bg-primary p-5 text-primary-foreground"><div><WalletCards className="size-6" /><p className="mt-3 text-sm opacity-70">Today's spend</p><p className="mt-1 text-2xl font-black">KSh {totals.cost}</p></div><div><p className="text-xs opacity-70">KSh {Math.max(0, dailyBudget - totals.cost)} left today</p><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-primary-foreground/20"><div className="h-full rounded-full bg-primary-foreground" style={{ width: `${Math.min(100, totals.cost / dailyBudget * 100)}%` }} /></div></div></div></div>
      <div className="mt-4 grid grid-cols-3 gap-2"><MacroProgress label="Protein" value={totals.protein} target={state.profile.proteinTarget} tone="bg-protein" /><MacroProgress label="Carbs" value={totals.carbs} target={state.profile.carbTarget} tone="bg-carbs" /><MacroProgress label="Fats" value={totals.fat} target={state.profile.fatTarget} tone="bg-fat" /></div>
      <div className="mt-5 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 rounded-2xl border border-border p-4"><span className="grid size-12 place-items-center rounded-2xl bg-water-soft text-water"><Droplets className="size-6" /></span><div className="min-w-0"><p className="font-bold">Water</p><p className="text-sm text-muted-foreground">{state.water} cups · {state.water * 250} ml</p></div><div className="flex shrink-0 gap-2"><Button aria-label="Remove a cup" size="icon" variant="outline" className="rounded-full" onClick={() => store.setWater(state.water - 1)}><Minus /></Button><Button aria-label="Add a cup" size="icon" className="rounded-full" onClick={() => store.setWater(state.water + 1)}><Plus /></Button></div></div>
      <div className="mt-7 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-accent-warm">Today’s insight</p><h2 className="mt-1 text-2xl font-black">Your next meal, sorted.</h2></div><Button variant="ghost" size="sm" onClick={onAdd}>Add food</Button></div><div className="mt-3 overflow-hidden rounded-3xl bg-surface"><img src={mealImage} alt="Suggested balanced Kenyan meal" width={1200} height={912} loading="lazy" className="aspect-[2/1] w-full object-cover" /><div className="p-4"><p className="font-bold">Ugali, beans & sukuma</p><p className="mt-1 text-sm text-muted-foreground">A balanced local option · 675 cal · about KSh 105</p></div></div>
      <h2 className="mt-8 text-2xl font-black">Recently logged</h2><div className="mt-3 space-y-3">{state.logs.length === 0 ? <EmptyLog onAdd={onAdd} /> : state.logs.slice(0, 5).map((item) => <FoodLogRow key={item.logId} food={item} />)}</div>
    </section></div>;
}

function MacroProgress({ label, value, target, tone }: { label: string; value: number; target: number; tone: string }) { return <div className="rounded-2xl bg-surface p-3"><div className={cn("mb-3 h-1.5 rounded-full", tone)} style={{ width: `${Math.max(12, Math.min(100, value / target * 100))}%` }} /><strong>{value}g</strong><span className="block text-[11px] text-muted-foreground">of {target}g {label}</span></div>; }
function FoodLogRow({ food }: { food: Food & { meal?: MealType; time?: string } }) { return <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl bg-surface p-3"><span className="grid size-14 place-items-center rounded-2xl bg-background text-2xl">{food.emoji}</span><div className="min-w-0"><p className="truncate font-bold">{food.name}</p><p className="mt-1 text-sm"><Flame className="mr-1 inline size-4" />{food.calories} calories</p><p className="mt-1 truncate text-xs text-muted-foreground">{food.protein}g protein · {food.carbs}g carbs · KSh {food.cost}</p></div>{food.time && <span className="self-start rounded-full bg-background px-2 py-1 text-[10px]">{food.time}</span>}</div>; }
function EmptyLog({ onAdd }: { onAdd: () => void }) { return <div className="rounded-3xl border border-dashed border-border p-7 text-center"><Utensils className="mx-auto size-8 text-muted-foreground" /><p className="mt-3 font-bold">Nothing logged yet</p><p className="mt-1 text-sm text-muted-foreground">Add your first meal to see today's balance.</p><Button className="mt-4 rounded-full" onClick={onAdd}>Add food</Button></div>; }

function BottomNav({ tab, onTab, onAdd }: { tab: Tab; onTab: (tab: Tab) => void; onAdd: () => void }) {
  const items: { tab: Tab; icon: typeof Home; label: string }[] = [{ tab: "home", icon: Home, label: "Home" }, { tab: "coach", icon: MessageCircle, label: "Coach" }, { tab: "history", icon: BarChart3, label: "History" }, { tab: "profile", icon: CircleUserRound, label: "Profile" }];
  return <nav aria-label="Main navigation" className="absolute inset-x-0 bottom-0 z-20 grid grid-cols-5 items-center border-t border-border bg-background/95 px-3 pb-[calc(.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur">{items.slice(0,2).map((item) => <NavButton key={item.tab} {...item} active={tab === item.tab} onClick={() => onTab(item.tab)} />)}<Button aria-label="Add food" onClick={onAdd} className="mx-auto size-14 rounded-full shadow-fab" size="icon"><Plus className="size-7" /></Button>{items.slice(2).map((item) => <NavButton key={item.tab} {...item} active={tab === item.tab} onClick={() => onTab(item.tab)} />)}</nav>;
}
function NavButton({ icon: Icon, label, active, onClick }: { icon: typeof Home; label: string; active: boolean; onClick: () => void }) { return <button type="button" onClick={onClick} className={cn("flex min-w-0 flex-col items-center gap-1 text-[10px] font-semibold", active ? "text-foreground" : "text-muted-foreground")}><Icon className="size-5" strokeWidth={active ? 2.7 : 2} /><span className="truncate">{label}</span></button>; }

function AddFoodSheet({ mode, setMode, onAdd, favorites, onFavorite, profile }: { mode: Exclude<AddMode, null>; setMode: (mode: AddMode) => void; onAdd: (food: Food, meal: MealType) => void; favorites: string[]; onFavorite: (id: string) => void; profile: Profile }) {
  const [meal, setMeal] = useState<MealType>("Lunch"); const [query, setQuery] = useState(""); const [analyzing, setAnalyzing] = useState(false); const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<MealAnalysis | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const analyze = useServerFn(analyzeMeal);
  const [manual, setManual] = useState<Food>({ id: "manual", name: "", serving: "1 serving", calories: 0, protein: 0, carbs: 0, fat: 0, cost: 0, emoji: "✎" });
  const filtered = foods.filter((food) => food.name.toLowerCase().includes(query.toLowerCase()));
  const startScan = async (event: FormEvent<HTMLInputElement>) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    setScanError(null); setAnalyzing(true); setAnalysis(null);
    const dataUrl = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error("read-failed")); reader.readAsDataURL(file); });
    setPreview(dataUrl);
    try {
      const result = await analyze({ data: { imageBase64: dataUrl.split(",")[1] ?? "", mimeType: file.type || "image/jpeg", country: profile.country, meal } });
      if (result.ok && result.analysis) setAnalysis(result.analysis);
      else setScanError("We couldn't read that photo. Try another one, or enter the meal yourself.");
    } catch { setScanError("We couldn't read that photo. Try another one, or enter the meal yourself."); }
    setAnalyzing(false);
  };
  return <div className="absolute inset-0 z-40 flex items-end bg-overlay/45 backdrop-blur-sm" onMouseDown={(e) => { if (e.currentTarget === e.target) setMode(null); }}><section className="max-h-[92%] w-full overflow-y-auto rounded-t-[2rem] bg-background px-5 pb-10 pt-4 shadow-sheet"><div className="mx-auto h-1.5 w-12 rounded-full bg-border" /><header className="mt-5 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Quick add</p><h2 className="mt-1 text-2xl font-black">{mode === "menu" ? "Log food" : mode === "search" ? "Food database" : mode === "scan" ? "Scan a meal" : "Manual entry"}</h2></div><Button aria-label="Close" variant="soft" size="icon" className="rounded-full" onClick={() => setMode(null)}><X /></Button></header>
    {mode === "menu" && <div className="mt-7 grid grid-cols-2 gap-3"><AddChoice icon={Camera} title="Scan food" detail="Use a photo" onClick={() => setMode("scan")} /><AddChoice icon={Search} title="Search" detail="Local food database" onClick={() => setMode("search")} /><AddChoice icon={PencilLine} title="Enter manually" detail="Add exact values" onClick={() => setMode("manual")} /><AddChoice icon={Upload} title="Scan label" detail="Packaged food" onClick={() => setMode("scan")} /></div>}
    {mode !== "menu" && <MealPicker meal={meal} setMeal={setMeal} />}
    {mode === "search" && <div className="mt-5"><label className="relative block"><Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Describe what you ate" className="h-14 rounded-2xl border-0 bg-surface pl-12" /></label><div className="mt-6 flex items-center justify-between"><h3 className="text-lg font-black">Suggestions</h3><span className="text-xs text-muted-foreground">{filtered.length} foods</span></div><div className="mt-3 space-y-3">{filtered.map((food) => <div key={food.id} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 rounded-2xl bg-surface p-4"><div className="min-w-0"><p className="truncate font-bold">{food.name}</p><p className="text-sm text-muted-foreground">{food.calories} cal · {food.serving}</p></div><button aria-label={favorites.includes(food.id) ? `Remove ${food.name} from favorites` : `Save ${food.name} as favorite`} onClick={() => onFavorite(food.id)} className={favorites.includes(food.id) ? "text-protein" : "text-muted-foreground"}><Heart className={cn("size-5", favorites.includes(food.id) && "fill-current")} /></button><Button aria-label={`Add ${food.name}`} size="icon" className="rounded-full" onClick={() => onAdd(food, meal)}><Plus /></Button></div>)}</div></div>}
    {mode === "scan" && <div className="mt-5">{!analysis ? <div className="rounded-3xl border border-dashed border-border bg-surface p-8 text-center"><div className="mx-auto grid size-20 place-items-center overflow-hidden rounded-full bg-background">{preview && analyzing ? <img src={preview} alt="" className="size-full object-cover" /> : <Camera className="size-9" />}</div><h3 className="mt-5 text-xl font-black">{analyzing ? "Reading your plate…" : "Choose a meal photo"}</h3><p className="mt-2 text-sm text-muted-foreground">{scanError ?? "We'll estimate each food and let you edit before saving."}</p><input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={startScan} />{analyzing ? <div className="mx-auto mt-6 h-2 max-w-xs overflow-hidden rounded-full bg-border"><div className="h-full w-2/3 animate-pulse rounded-full bg-primary" /></div> : <Button variant="nourish" size="pill" className="mt-6 w-full" onClick={() => fileRef.current?.click()}><Camera /> Take or choose photo</Button>}</div> : <div><img src={preview ?? mealImage} alt="Analyzed meal preview" className="aspect-[2/1] w-full rounded-3xl object-cover" /><div className="mt-5 rounded-2xl bg-surface p-4"><div className="flex items-center justify-between gap-3"><div className="min-w-0"><p className="text-xs text-muted-foreground">Foods detected · {analysis.confidence} confidence</p><p className="truncate font-black">{analysis.food.name}</p><p className="mt-1 truncate text-xs text-muted-foreground">{analysis.items.join(" · ") || analysis.food.serving}</p></div><PencilLine className="size-5 shrink-0 text-muted-foreground" /></div><div className="mt-4 grid grid-cols-4 gap-2"><MacroMini value={`${analysis.food.calories}`} label="calories" tone="text-foreground" /><MacroMini value={`${analysis.food.protein}g`} label="protein" tone="text-protein" /><MacroMini value={`${analysis.food.carbs}g`} label="carbs" tone="text-carbs" /><MacroMini value={`${analysis.food.cost}`} label="KSh" tone="text-foreground" /></div><div className="mt-4 grid grid-cols-2 gap-3">{(["calories", "protein", "carbs", "fat", "cost"] as const).map((key) => <Field key={key} label={key === "cost" ? "Cost (KSh)" : key.charAt(0).toUpperCase() + key.slice(1)}><Input type="number" min="0" value={analysis.food[key]} onChange={(e) => setAnalysis({ ...analysis, food: { ...analysis.food, [key]: Number(e.target.value) } })} /></Field>)}</div></div>{analysis.note && <p className="mt-3 text-center text-xs text-muted-foreground">{analysis.note}</p>}<p className="mt-2 text-center text-xs text-muted-foreground">AI estimates may vary. Check the serving before logging.</p><div className="mt-5 grid grid-cols-[auto_minmax(0,1fr)] gap-3"><Button variant="outline" size="pill" onClick={() => { setAnalysis(null); setPreview(null); }}>Retake</Button><Button variant="nourish" size="pill" onClick={() => onAdd(analysis.food, meal)}>Confirm & log</Button></div></div>}</div>}
    {mode === "manual" && <form className="mt-5 space-y-4" onSubmit={(e) => { e.preventDefault(); if (manual.name.trim()) onAdd({ ...manual, id: `manual-${Date.now()}` }, meal); }}><Field label="Food name"><Input required value={manual.name} onChange={(e) => setManual({ ...manual, name: e.target.value })} placeholder="e.g. Homemade stew" /></Field><Field label="Serving"><Input value={manual.serving} onChange={(e) => setManual({ ...manual, serving: e.target.value })} /></Field><div className="grid grid-cols-2 gap-3">{(["calories", "protein", "carbs", "fat", "cost"] as const).map((key) => <Field key={key} label={key === "cost" ? "Cost (KSh)" : key.charAt(0).toUpperCase() + key.slice(1)}><Input type="number" min="0" value={manual[key]} onChange={(e) => setManual({ ...manual, [key]: Number(e.target.value) })} /></Field>)}</div><Button variant="nourish" size="pill" className="w-full" type="submit">Add food</Button></form>}
  </section></div>;
}

function MealPicker({ meal, setMeal }: { meal: MealType; setMeal: (meal: MealType) => void }) { return <div className="mt-5 grid grid-cols-4 rounded-full bg-surface p-1">{(["Breakfast", "Lunch", "Dinner", "Snack"] as MealType[]).map((item) => <button key={item} onClick={() => setMeal(item)} className={cn("truncate rounded-full px-2 py-2 text-xs font-bold", meal === item && "bg-background shadow-sm")}>{item}</button>)}</div>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-sm font-bold">{label}<div className="mt-2">{children}</div></label>; }

function CoachScreen({ state }: { state: ReturnType<typeof useNourish>["state"] }) {
  const [messages, setMessages] = useState<ChatMessage[]>([{ id: "welcome", role: "assistant", content: `Hi ${state.profile.name}. I can help you choose meals that fit today's calories and budget. What are you thinking about?` }]);
  const [input, setInput] = useState(""); const [status, setStatus] = useState<"ready" | "submitted">("ready");
  const ask = useServerFn(coachReply);
  const submit = async (text: string) => {
    const clean = text.trim(); if (!clean || status === "submitted") return;
    const history = messages.map(({ role, content }) => ({ role, content }));
    setMessages((current) => [...current, { id: `u-${Date.now()}`, role: "user", content: clean }]);
    setInput(""); setStatus("submitted");
    const totals = getTotals(state.logs);
    let reply = "";
    try {
      const result = await ask({ data: { message: clean, history, context: { profile: state.profile, consumed: totals, water: state.water, loggedToday: state.logs.map((log) => log.name) } } });
      if (result.ok) reply = result.text;
    } catch { reply = ""; }
    setMessages((current) => [...current, { id: `a-${Date.now()}`, role: "assistant", content: reply || demoCoachReply(clean, state) }]);
    setStatus("ready");
  };
  return <div className="flex h-[calc(100dvh-5.5rem)] min-h-[620px] flex-col md:h-[750px]"><ScreenHeader title="Nutrition coach" action={<span className="grid size-11 place-items-center rounded-full bg-primary text-primary-foreground"><Leaf className="size-5" /></span>} /><div className="px-5"><div className="flex gap-2 overflow-x-auto pb-2">{["What should I eat?", "A cheap protein meal", "Am I on track?"].map((prompt) => <button key={prompt} onClick={() => submit(prompt)} className="shrink-0 rounded-full border border-border px-4 py-2 text-xs font-bold">{prompt}</button>)}</div></div><Conversation className="mt-2"><ConversationContent className="gap-5 px-5">{messages.map((message) => <Message from={message.role} key={message.id}><MessageContent className={message.role === "user" ? "rounded-2xl bg-primary px-4 py-3 text-primary-foreground" : "text-[15px] leading-7"}><MessageResponse>{message.content}</MessageResponse></MessageContent></Message>)}{status === "submitted" && <Message from="assistant"><MessageContent className="animate-pulse text-muted-foreground">Working with today's plan…</MessageContent></Message>}</ConversationContent><ConversationScrollButton /></Conversation><div className="border-t border-border bg-background p-4"><PromptInput onSubmit={(message) => submit(message.text)}><PromptInputTextarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about meals, protein or budget…" /><PromptInputFooter className="justify-end"><PromptInputSubmit status={status} disabled={!input.trim()}><Send className="size-4" /></PromptInputSubmit></PromptInputFooter></PromptInput><p className="mt-2 text-center text-[10px] text-muted-foreground">Coach answers use your plan and today's log. Always confirm nutrition estimates.</p></div></div>;
}


function HistoryScreen({ store }: { store: ReturnType<typeof useNourish> }) { const totals = getTotals(store.state.logs); return <div><ScreenHeader title="History" /><section className="px-5"><div className="grid grid-cols-3 gap-2"><Summary value={totals.calories.toLocaleString()} label="Calories" /><Summary value={`${totals.protein}g`} label="Protein" /><Summary value={`KSh ${totals.cost}`} label="Spent" /></div><h2 className="mt-8 text-xl font-black">Today</h2><div className="mt-3 space-y-3">{store.state.logs.length ? store.state.logs.map((item) => <FoodLogRow key={item.logId} food={item} />) : <EmptyLog onAdd={() => undefined} />}</div><div className="mt-8 rounded-3xl bg-surface p-5"><p className="font-black">Weekly summary</p><p className="mt-2 text-sm leading-6 text-muted-foreground">You’re building momentum. Logging meals consistently will make recommendations more accurate and your budget easier to manage.</p></div></section></div>; }
function Summary({ value, label }: { value: string; label: string }) { return <div className="rounded-2xl bg-surface p-3 text-center"><strong className="block truncate text-lg">{value}</strong><span className="text-[11px] text-muted-foreground">{label}</span></div>; }

function ProgressScreen({ store }: { store: ReturnType<typeof useNourish> }) { const { profile, weightHistory } = store.state; const total = Math.abs(defaultProfile.weight - profile.targetWeight) || 1; const complete = Math.min(1, Math.abs(defaultProfile.weight - profile.weight) / total); const [range, setRange] = useState("90 Days"); const [weight, setWeight] = useState(profile.weight); return <div><ScreenHeader title="Progress" /><section className="px-5"><div className="grid grid-cols-2 gap-3"><div className="rounded-3xl bg-surface p-4 text-center"><Ring value={complete} size={110}><Target className="mx-auto size-6" /></Ring><p className="font-bold">Last weight</p><p className="text-xl font-black">{profile.weight} kg</p></div><div className="rounded-3xl bg-surface p-4 text-center"><Ring value={Math.min(1, store.state.logs.length / 7)} size={110} accent="stroke-chart-blue"><Apple className="mx-auto size-6" /></Ring><p className="font-bold">Days logged</p><p className="text-xl font-black">{store.state.logs.length ? 1 : 0} logged</p></div></div><div className="mt-5 grid grid-cols-4 rounded-2xl bg-surface p-1">{["90 Days", "6 Months", "1 Year", "All time"].map((item) => <button key={item} onClick={() => setRange(item)} className={cn("rounded-xl px-1 py-2 text-xs", range === item && "bg-background font-bold shadow-sm")}>{item}</button>)}</div><div className="mt-5 rounded-3xl border border-border p-5"><div className="flex items-center justify-between"><div><h2 className="text-xl font-black">Goal progress</h2><p className="text-sm text-muted-foreground">Target {profile.targetWeight} kg</p></div><span className="rounded-full bg-success-soft px-3 py-1 text-xs font-bold text-success">{Math.round(complete * 100)}% done</span></div><WeightChart values={weightHistory} /><p className="rounded-xl bg-success-soft p-3 text-center text-sm font-bold text-success">Consistency is the win. Keep showing up.</p></div><div className="mt-5 rounded-2xl bg-surface p-4"><label className="text-sm font-bold">Log current weight</label><div className="mt-3 flex gap-2"><Input type="number" step="0.1" value={weight} onChange={(e) => setWeight(Number(e.target.value))} /><Button className="rounded-xl" onClick={() => store.updateWeight(weight)}>Save</Button></div></div></section></div>; }
function WeightChart({ values }: { values: { label: string; value: number }[] }) { const min = Math.min(...values.map((v) => v.value)) - 1; const max = Math.max(...values.map((v) => v.value)) + 1; const points = values.map((v, i) => `${20 + i * (260 / Math.max(1, values.length - 1))},${130 - ((v.value - min) / (max - min)) * 95}`).join(" "); return <div className="mt-5"><svg viewBox="0 0 300 155" className="w-full" role="img" aria-label="Weight trend"><path d="M20 35H280 M20 82H280 M20 130H280" className="stroke-border" strokeDasharray="4 5" /><polyline points={points} fill="none" className="stroke-primary" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />{values.map((v, i) => <circle key={`${v.label}-${i}`} cx={20 + i * (260 / Math.max(1, values.length - 1))} cy={130 - ((v.value - min) / (max - min)) * 95} r="4" className="fill-background stroke-primary" strokeWidth="3" />)}</svg><div className="grid text-center text-[10px] text-muted-foreground" style={{ gridTemplateColumns: `repeat(${values.length}, minmax(0, 1fr))` }}>{values.map((v, i) => <span key={`${v.label}-label-${i}`} className="truncate">{v.label}</span>)}</div></div>; }

function ProfileScreen({ store }: { store: ReturnType<typeof useNourish> }) { const { profile } = store.state; return <div><ScreenHeader title="Profile" action={<Button variant="soft" size="icon" className="rounded-full"><Settings /></Button>} /><section className="px-5"><div className="flex items-center gap-4 rounded-3xl bg-primary p-5 text-primary-foreground"><span className="grid size-16 place-items-center rounded-full bg-primary-foreground text-primary"><CircleUserRound className="size-8" /></span><div><h2 className="text-xl font-black">{profile.name}</h2><p className="text-sm opacity-70">{profile.country} · {profile.diet}</p></div></div><h3 className="mt-7 text-sm font-bold uppercase tracking-widest text-muted-foreground">Your plan</h3><div className="mt-3 divide-y divide-border overflow-hidden rounded-2xl bg-surface"><ProfileRow label="Goal" value={goals.find((g) => g.value === profile.goal)?.label ?? profile.goal} /><ProfileRow label="Daily target" value={`${profile.calorieTarget} calories`} /><ProfileRow label="Food budget" value={`KSh ${profile.budget.toLocaleString()}/month`} /><ProfileRow label="Body" value={`${profile.weight} kg · ${profile.height} cm`} /></div><h3 className="mt-7 text-sm font-bold uppercase tracking-widest text-muted-foreground">Preferences</h3><div className="mt-3 divide-y divide-border overflow-hidden rounded-2xl bg-surface"><div className="grid grid-cols-[minmax(0,1fr)_auto] items-center p-4"><div><p className="font-bold">Reminders</p><p className="text-xs text-muted-foreground">Meals, water and weekly review</p></div><Switch checked={store.state.notifications} onCheckedChange={store.toggleNotifications} /></div><div className="grid grid-cols-[minmax(0,1fr)_auto] items-center p-4"><div><p className="font-bold">Units</p><p className="text-xs text-muted-foreground">Weight and measurements</p></div><div className="flex rounded-full bg-background p-1">{(["metric", "imperial"] as const).map((unit) => <button key={unit} className={cn("rounded-full px-3 py-1 text-xs capitalize", store.state.units === unit && "bg-primary text-primary-foreground")} onClick={() => store.setUnits(unit)}>{unit}</button>)}</div></div></div><div className="mt-7 space-y-3"><Button variant="outline" size="pill" className="w-full" onClick={() => store.reset()}><RotateCcw /> Restart onboarding</Button></div></section></div>; }
function ProfileRow({ label, value }: { label: string; value: string }) { return <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 p-4"><span className="font-bold">{label}</span><span className="text-right text-sm text-muted-foreground">{value}</span></div>; }