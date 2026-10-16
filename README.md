# YouBudget v4.2.1

A local-first personal cash-flow planner.

## What's new in v4.0
- New landing page: “Know what your money looks like tomorrow.”
- Demo mode for first-time users.
- Forward cash-balance forecast with 30 / 90 / 365-day horizons.
- Safety-buffer overlay, lowest-balance warning and 30-day safe-to-spend indicator.
- What-if scenarios that overlay the forecast without changing the real plan.
- Plan-vs-actual matching from imported transactions.
- Recurring-payment detection with user-approved “Add to plan” suggestions.
- Existing statement import, learned categorisation, cash-flow plan and dashboard retained.

## Privacy
YouBudget remains local-first. App state is stored in the browser's localStorage. CSV processing is local. XLSX support uses the existing SheetJS setup from prior versions.

## Run
Open `index.html` in a modern browser. For the most consistent browser behavior, VS Code Live Server is recommended.

## v4.1 visual refresh
- Unified landing-page look across the application.
- Blue primary, purple scenario and green positive/success accents.
- Same Y mark and YouBudget wordmark throughout.
- Fresh-install data reset: no starter plan, transactions, imports, balances or scenarios. Demo remains opt-in.

## v4.2
- Edit and delete controls for every planned cash flow.
- Cash-flow Plan and Calendar now use the same unified planned-flow data model.
- Planned-flow changes propagate to Dashboard, Calendar, Forecast and budget calculations.
- Removed the duplicate yellow upcoming-flow alert and duplicate lower Upcoming panel.
- Added persistent currency selection in Settings; default is USD ($), with €, £ and ¥ prioritised plus a broad currency list.
- Removed the “Edition” label while retaining the Basic / Advanced selector.
- Sidebar tagline reduced to a single line.

## v4.2.1
- Fixed landing-page Start planning / Try demo regression caused by legacy dashboard code referencing UI panels removed in v4.2.
- Legacy optional dashboard render targets are now null-safe.

## v4.4
About and Pricing informational pages; share via prefilled mailto link; delete categories; insights disclaimer; compact landing feature strip. No checkout service is connected.
\n## v4.5\n- About and Pricing are separate HTML pages, linked from the landing page.\n- About has alternating feature descriptions and illustrative interface previews.\n- Green Share YouBudget CTA.\n
## v4.6
- Home is always the initial page when navigating from About/Pricing or opening the app.
- Removed landing-page sentence-ending periods and replaced em dashes with commas.
- About/Pricing: green Share button at top and Back to Home at bottom.

## v4.7 Internationalization foundation
- First-use language and currency selector with browser locale detection and USD/English fallbacks.
- Independent user language and currency overrides, saved locally; controls in Settings.
- All 30 currencies from the existing dropdown mapped to principal locales; 32 language options.
- Indonesian starter translation for core navigation and key static labels. English remains the fallback for untranslated content.
- Language configuration and translation API in `i18n.js` for future complete language packs.
- About and Pricing pages load the same internationalization script.
- Currency setting is denomination/formatting only; **no FX conversion**.
- This release is a foundation, **not yet a fully translated application**. Dynamic reports, recommendations, some static content, and right-to-left layouts require additional translation and QA.
