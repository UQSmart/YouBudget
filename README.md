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

## v4.10 — AdSense readiness
Based on v4.9.2, retaining the suggested saving scenarios, deficit reduction features and both expanded estimation disclaimers. Added public Privacy, Terms, Contact, Help and Guides pages; site-wide public footer; reserved non-tracking ad areas on Home/About/Pricing; disabled AdSense configuration template; `ads.txt.example`; and deployment/consent checklist in `ADSENSE_SETUP.md`. No ads load and no financial data is shared with ad providers.

## v4.11 — historical analytics consistency
- Advanced monthly overview uses the trailing one-month interval ending on the most recent imported transaction date.
- Advanced income counts only positive bank transactions explicitly categorized as `Income` (excluding reconciled internal transfers); applied to monthly overview, annualized yearly budget, cash-flow bars and net-flow bars.
- Advanced yearly budget annualizes the latest up-to-12 distinct months represented in imported transaction dates; it does not stack planned flows on top of imported actuals.
- Spending Insights uses observed transaction months (maximum 12) as the denominator, including merchant/category averages and preset scenario estimates. The selected insights window still limits analysis to 3, 6 or 12 observed months.
- Fewer than six observed months triggers visible caution notices in Category trends and Yearly budget.
- Recurring flows inferred from imports appear in upcoming Dashboard flows and the Calendar as estimated items (subject to the Settings inferred-flow toggle). They are not silently added to confirmed planned flows.
- Category displays and category selection are alphabetically sorted; deletion retains correct underlying index.
- Important: 'observed month' means a distinct calendar month containing imported transactions, not a full certified statement month. Partial months can still bias averages. Review statements and estimated recurring flows before decisions.

## v4.12
- Income now counts positive transactions explicitly tagged Income, even if account metadata is missing; card payments and reconciled transactions remain excluded. Diagnostic: `YouBudgetIncomeAudit()` in browser console.
- Advanced planned flows can be categorized and set to Add or Override for the historical category forecast.
- Advanced monthly cashflow chart stacks top five inflow and outflow categories with residual Other groups; hover includes total and segment amount.
- Spending by category uses the same latest rolling transaction month as Monthly overview.
- Savings opportunities suppress Taxes, Income and Housing.
- Forecast includes an opt-in category-level historical spending baseline consistent with Yearly Budget. Categorized planned flows take precedence to avoid basic double counting.
- Warning: historical category projections are estimates; test with real statements.

## v4.13 — unified forecast and planned-flow integration
- Advanced Dashboard upcoming flows (7 days / 30 days) now draws from dated manual plans and statement-derived recurring estimates.
- Advanced projected balance includes recurring inflows/outflows and historical category run-rates by default, rather than requiring the v4.12 opt-in.
- The historical category baseline is adjusted to avoid counting a detected recurring transaction twice.
- Manual Add remains incremental to observed category run-rates. Manual Override replaces the corresponding category run-rate and inferred recurring entries of that category.
- Advanced Monthly Overview and Yearly Budget apply normalized manual cash-flow entries to income/outflow totals, including Salary categorized as Income.
- No imported transactions are changed. Recurrence detection requires adequate observed monthly history; unmatched future changes are not guaranteed.
- Important: historic averages are indicative, not transaction-level forecasts. Missing/partial statements, account balances, seasonality and mismatched category labels can distort projections.

## v4.14 — income reconciliation and projection cautions
- Latest rolling-month Income is the consistent baseline for both Monthly Overview and annualized Yearly Budget. Annualized income = monthly income × 12; expense categories continue to use observed-history averages.
- Add and Override Income plans operate against the same rolling-month baseline.
- One-off transactions are excluded from category projection run-rates and inferred monthly recurring candidates.
- Projection caution added to forecast chart and upcoming-flow table; verbose forecast explanation removed.
- Yearly Budget limited-history warning moved below its figures; warning styling changed to red.
- Note: the latest rolling month may itself be partial. Annualized income is a planning estimate, not actual trailing-12-month income.

## v4.15
- Basic edition is cash-flow-plan-only: hides transaction-derived Dashboard sections and statement-based pages, suggestions and matching; monthly charts and forecasts continue to use scheduled cash-flow-plan entries. Imported data remains intact for switching back to Advanced.
- Forecast date labels now sit directly beneath the x-axis. The historical-estimates disclaimer appears at the bottom of the chart widget in neutral grey.

## v4.15.1 — Basic Monthly Overview correction
Basic Edition's Monthly Overview is calculated only from scheduled Cash-flow plan occurrences in the current calendar month. All five figures are reset after the complete render chain, preventing imported transactions from leaking into the Basic summary. With no planned flows, all five figures display zero. Advanced Edition remains unchanged.

## v4.15.2 — clean-start distribution
- First launch resets all previously stored YouBudget financial data in the browser:
  imported transactions/statements, planned flows, starting balance, scenarios,
  and saved financial projections. The app starts with zero financial amounts.
- The reset runs **once** per browser origin; new data added afterward persists.
- Browser storage is origin-scoped: deploying this version on an existing
  YouBudget site clears that site's stored app data on first launch. Export a
  backup before deploying if you wish to preserve existing records.
- Sample/demo data is **not** loaded automatically. Selecting 'Explore a demo'
  will still explicitly load sample data, as intended.
