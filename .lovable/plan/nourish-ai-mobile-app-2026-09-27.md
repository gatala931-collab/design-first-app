# Nourish AI mobile app

## Goal
Build a production-quality, mobile-first Nourish AI frontend that closely follows the supplied references: clean white surfaces, near-black primary actions, soft gray/lilac panels, large rounded controls, bold typography, generous spacing, circular progress visuals, and a prominent food-logging action.

The app will work end to end with realistic local demo data until the external API is provided. Payments and paywalls are excluded.

## Product flow

### 1. Onboarding
- Welcome screen with Nourish AI positioning and clear start/sign-in actions.
- Guided, back/forward onboarding using the reference pattern: top progress line, large question, selectable rows, and fixed bottom action.
- Collect country, goal, monthly food budget, age, sex, height, weight, desired weight, activity level, diet, and food obstacles/preferences.
- Calculate the calorie target locally with Mifflin–St Jeor and derive editable macro targets.
- Show the plan-generation sequence, projected goal progress, and final daily recommendation.
- Skip every payment/paywall screen and enter the app directly.

### 2. Home
- Mobile dashboard with greeting, date strip, calorie progress, macro progress, water controls, budget summary, daily insight, and recently logged meals.
- Values update immediately when food or water is logged.
- Empty, first-use, and populated states.

### 3. Food logging
- Prominent center action opens Scan, Search, and Manual Entry choices.
- Scan accepts camera/gallery images and shows a realistic analysis state followed by editable detected-food results.
- Search includes local foods, recent foods, favorites, serving controls, meal selection, and add action.
- Manual entry supports name, portion, calories, protein, carbs, fat, and cost.
- Confirming a meal updates daily nutrition, spending, recent foods, and history.

### 4. Coach
- Chat-style nutrition coach using current goal, remaining calories, country, logged meals, and remaining budget.
- Useful suggested prompts and deterministic demo recommendations until the API is connected.
- Clearly structured API adapter so future responses can replace demo logic without redesigning screens.

### 5. History and progress
- Daily history with calories, macros, spending, meals, and date selection.
- Progress overview with weight trend, goal completion, time filters, and weekly summary.
- Use responsive SVG/CSS visualizations that match the circular and line-chart language in the references.

### 6. Profile and settings
- View and edit body data, goal, budget, country, units, food preferences, dietary restrictions, and notifications.
- Changes recalculate recommendations and flow through the rest of the app.
- Include reset-demo-data and restart-onboarding controls.

## Interaction and persistence
- Persist onboarding, profile, logs, water, favorites, and settings in the browser so the full experience survives refreshes.
- Seed realistic Kenyan/local-food examples from the brief while supporting other selected countries.
- Add validation, loading states, confirmations, safe error handling, accessible labels, keyboard support, and reduced-motion behavior.
- Use a single typed data layer so browser persistence can later be replaced by the supplied API.

## Visual system
- Preserve the reference composition: white canvas, ink-black controls, pale neutral cards, subtle cool-gray borders, restrained coral/green/blue nutrition accents, and almost no decorative effects.
- Use a rounded geometric sans-serif close to the reference, with bold large headings and highly legible body text.
- Optimize for phone screens first; on larger screens, center the app in a polished phone-width workspace without stretching the mobile layouts.
- Recreate interface visuals rather than embedding the screenshots themselves.

## Technical approach
- Keep the existing TanStack Start application and create reusable mobile shell, onboarding, progress, food, coach, and settings modules.
- Add route-level metadata and use semantic design tokens throughout.
- Keep all API-dependent features behind typed interfaces; image analysis and coaching use clearly marked demo implementations for now.
- Verify the onboarding-to-dashboard journey, food logging updates, persistence after refresh, all five navigation areas, and key mobile/desktop layouts.

## Deliverable boundary
- Included now: complete frontend experience, local calculations, realistic demo intelligence, image upload/preview, interactions, validation, and browser persistence.
- Deferred until the API arrives: real AI food recognition, live coach responses, cloud accounts/sync, and server-backed data. No payment wall will be added.
