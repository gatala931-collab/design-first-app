import { createServerFn } from "@tanstack/react-start";
import type { Food, MealType, Profile } from "@/lib/nourish-data";

const MODELS = ["gemini-3.8-flash", "gemini-3-flash-preview", "gemini-3.1-flash-lite"];

type GeminiPart = { text?: string; inlineData?: { mimeType: string; data: string } };

type GeminiBody = {
  contents: { role: "user" | "model"; parts: GeminiPart[] }[];
  systemInstruction?: { parts: { text: string }[] };
  generationConfig?: Record<string, unknown>;
};

async function callGemini(body: GeminiBody): Promise<string> {
  const key = process.env["GEMINI_API_KEY"];
  if (!key) throw new Error("missing-key");
  let lastError = "";
  for (const model of MODELS) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) },
    );
    if (response.ok) {
      const json = (await response.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      const text = (json.candidates?.[0]?.content?.parts ?? [])
        .map((part) => part.text ?? "")
        .join("")
        .trim();
      if (text) return text;
      lastError = "empty-response";
      continue;
    }
    lastError = `${response.status}`;
    // Only retry the next model for overload / unavailable model errors.
    if (response.status !== 503 && response.status !== 404 && response.status !== 429) break;
  }
  throw new Error(lastError || "gemini-failed");
}

export type CoachContext = {
  profile: Profile;
  consumed: { calories: number; protein: number; carbs: number; fat: number; cost: number };
  water: number;
  loggedToday: string[];
};

function coachSystemPrompt(context: CoachContext) {
  const { profile, consumed } = context;
  const dailyBudget = Math.round(profile.budget / 30);
  return [
    "You are Nourish AI, a warm, practical nutrition coach for everyday people in East Africa.",
    "Answer in plain language, 2-5 short sentences or a tight bullet list. No markdown headings.",
    "Always respect the user's calories left and money left for the day. Suggest affordable local foods.",
    "Never give medical advice or diagnose. Add no disclaimers; the app shows one already.",
    "",
    `User: ${profile.name}, ${profile.age}, ${profile.sex}, ${profile.country}.`,
    `Goal: ${profile.goal}. Diet: ${profile.diet}. Activity: ${profile.activity}.`,
    `Body: ${profile.weight} kg, ${profile.height} cm, target ${profile.targetWeight} kg.`,
    `Daily targets: ${profile.calorieTarget} kcal, ${profile.proteinTarget}g protein, ${profile.carbTarget}g carbs, ${profile.fatTarget}g fat.`,
    `Eaten today: ${consumed.calories} kcal, ${consumed.protein}g protein, ${consumed.carbs}g carbs, ${consumed.fat}g fat.`,
    `Calories left: ${Math.max(0, profile.calorieTarget - consumed.calories)}.`,
    `Food budget: KSh ${dailyBudget}/day, KSh ${consumed.cost} already spent today.`,
    `Water: ${context.water} cups. Logged today: ${context.loggedToday.join(", ") || "nothing yet"}.`,
  ].join("\n");
}

export const coachReply = createServerFn({ method: "POST" })
  .validator(
    (input: { message: string; history: { role: "user" | "assistant"; content: string }[]; context: CoachContext }) =>
      input,
  )
  .handler(async ({ data }) => {
    try {
      const text = await callGemini({
        systemInstruction: { parts: [{ text: coachSystemPrompt(data.context) }] },
        contents: [
          ...data.history.slice(-8).map((message) => ({
            role: message.role === "user" ? ("user" as const) : ("model" as const),
            parts: [{ text: message.content }],
          })),
          { role: "user" as const, parts: [{ text: data.message }] },
        ],
      });
      return { ok: true as const, text };
    } catch (error) {
      console.error("coachReply failed", error);
      return { ok: false as const, text: "" };
    }
  });

export type MealAnalysis = {
  food: Food;
  items: string[];
  confidence: "high" | "medium" | "low";
  note: string;
};

export const analyzeMeal = createServerFn({ method: "POST" })
  .validator((input: { imageBase64: string; mimeType: string; country: string; meal: MealType }) => input)
  .handler(async ({ data }): Promise<{ ok: boolean; analysis: MealAnalysis | null }> => {
    try {
      const text = await callGemini({
        systemInstruction: {
          parts: [
            {
              text: `You identify food in photos and estimate nutrition. The user is in ${data.country}; recognise local dishes (ugali, sukuma wiki, githeri, chapati, nyama choma, mandazi, matoke, pilau, omena). Estimate the whole plate as one entry, for a normal adult portion. Cost is the typical street/home cost of that portion in Kenyan shillings. Emoji must be a single food emoji.`,
            },
          ],
        },
        contents: [
          {
            role: "user",
            parts: [
              { inlineData: { mimeType: data.mimeType, data: data.imageBase64 } },
              { text: `This is the user's ${data.meal.toLowerCase()}. Identify it and estimate nutrition.` },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              name: { type: "string" },
              serving: { type: "string" },
              calories: { type: "number" },
              protein: { type: "number" },
              carbs: { type: "number" },
              fat: { type: "number" },
              cost: { type: "number" },
              emoji: { type: "string" },
              items: { type: "array", items: { type: "string" } },
              confidence: { type: "string", enum: ["high", "medium", "low"] },
              note: { type: "string" },
            },
            required: ["name", "serving", "calories", "protein", "carbs", "fat", "cost", "emoji", "items", "confidence", "note"],
          },
        },
      });
      const parsed = JSON.parse(text) as Omit<Food, "id"> & {
        items: string[];
        confidence: MealAnalysis["confidence"];
        note: string;
      };
      return {
        ok: true,
        analysis: {
          food: {
            id: `scan-${Date.now()}`,
            name: parsed.name,
            serving: parsed.serving,
            calories: Math.round(parsed.calories),
            protein: Math.round(parsed.protein),
            carbs: Math.round(parsed.carbs),
            fat: Math.round(parsed.fat),
            cost: Math.round(parsed.cost),
            emoji: parsed.emoji || "◉",
          },
          items: parsed.items ?? [],
          confidence: parsed.confidence ?? "medium",
          note: parsed.note ?? "",
        },
      };
    } catch (error) {
      console.error("analyzeMeal failed", error);
      return { ok: false, analysis: null };
    }
  });
