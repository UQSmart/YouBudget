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

## v4.8 — Transaction reconciliation and recurring insights
- Matches opposite-signed, same-amount entries from distinct accounts within three days, requiring transfer/payment evidence; ambiguous matches are left unmatched. Matched entries remain visible with a reconciliation badge and are excluded from spending/income analytics.
- Transactions tab paginates the entire filtered imported history (25/50/100/250 rows per page).
- Dashboard Monthly overview uses imported actuals, including the most recent imported month when the current month has no entries. Chart periods end at the latest imported month.
- Detects significant monthly recurring income and expenditure from imported statements. Suggested upcoming flows are labelled estimated and are not added to the plan until approved. Detection settings are in Settings.
- This is a local-first prototype; reconciliation and recurring inference are heuristic, so review results before making financial decisions. No automatic FX conversion is performed.

## v4.9: Insights-to-scenarios and deficit suggestions
- Forecast & scenarios: new **Suggested saving scenarios** widget. Creates optional monthly saving overlays from category-based saving opportunities and inferred recurring outflows; selections persist locally and do not alter imported transactions or the cash-flow plan.
- Spending insights: new **Close the deficit** widget uses the Dashboard's latest imported-month total surplus/deficit (or plan metrics if there are no imported statements), ranks potential discretionary reductions, shows potential deficit coverage and remaining gap, and links suggestions to the forecast.
- Estimated recurring payments are **not** automatically treated as savings: the suggested scenario is a hypothetical 10% reduction/renegotiation, not cancellation of the whole bill.
- Saving overlays start on the first day of the next calendar month and repeat monthly within the forecast horizon. They are estimates and may overlap planned reductions or each other.
- Important: suggestions are based on transaction patterns, not guarantees; no currency conversion or automatic modification of the actual budget.

## v4.9.2
Restores the v4.9 Suggested saving scenarios and Close the deficit widgets (present in the JavaScript but missing from HTML), and adds distinct comprehensive estimation disclaimers within both widgets.
