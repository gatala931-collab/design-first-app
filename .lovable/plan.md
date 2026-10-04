# Nutry AI rename and mobile quality pass

## Goal
Rename the entire product to **Nutry AI** and make the experience reliable, secure, installable, and comfortable on 360–430px phones. The opening onboarding screen will be a single, non-scrolling view with every element and action visible.

## Work
1. **Rename and app identity**
   - Replace old product and placeholder names across UI copy, metadata, AI persona, package details, documentation, and internal product-facing identifiers.
   - Add an installable Nutry AI web app manifest and suitable app icons.

2. **Mobile layout and onboarding**
   - Rebuild onboarding as a full-height layout with safe-area spacing, a fixed action area, compact responsive content, and validated inputs.
   - Make the first screen fit without scrolling at 360×640, while scaling naturally at 390×844 and 430×932.
   - Remove the desktop phone-frame treatment, prevent horizontal overflow, protect content from the bottom navigation, and tighten all key screens.
   - Use mobile drawers for meal logging, with accessible 44px controls and iOS-safe input sizing.

3. **Quality and safety**
   - Fix current console, type, lint, hydration, empty/loading/error, contrast, labeling, focus, calculation, and overflow issues found during the audit.
   - Keep Gemini calls server-side, add strict validation, request timeout, and basic rate limiting.
   - Remove genuinely unused dependencies after checking imports.

4. **Verification**
   - Check the central flows in the running app at 360×640, 390×844, and 430×932.
   - Confirm the opening screen has no scroll, all controls remain visible, logging and coach states work, and no build/runtime errors remain.

## Technical details
- Preserve the existing TanStack Start and Lovable Cloud architecture.
- Keep AI and persistence behind typed adapters.
- Use semantic design tokens and existing controls; no exposed secrets.
- Continue with the existing backend tables and per-user access rules rather than introducing a second data approach.
