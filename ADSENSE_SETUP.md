# YouBudget AdSense deployment checklist (v4.10)

## Current state
Advertising is **not enabled**. Public pages reserve space for potential ads, but no AdSense script or tracking code loads. The financial app (Dashboard, Transactions, Import, Forecast, Spending Insights, Settings) has no ad placements.

## Before enabling ads
1. Verify ownership and ensure the public website is reachable and contains meaningful original content. Review and finalize Privacy, Terms, Help, Guides, and Contact; provide a real contact method and legally required operator details.
2. Apply for AdSense using the correct site/domain and follow Google's site-verification instructions. Wait for approval. Do not use a placeholder publisher ID.
3. Complete applicable privacy and consent requirements. For EEA, UK and Switzerland traffic, review Google's certified CMP and IAB TCF requirements and configure consent management (e.g., Google's Privacy & Messaging) before serving ads where required.
4. Decide where ads may appear. Start with one or two unobtrusive units on public pages only. Do not load advertising scripts on the private budgeting interface, and do not pass financial data into advertising URLs, tags or events.
5. Configure publisher ID and ad-unit slot IDs in a separate, approved deployment change. The shipped `ad-config.js` is disabled and not loaded; setting it to enabled alone will not load ads.
6. Add the exact `ads.txt` line supplied by Google at the **root of the domain** used for AdSense, after verifying the domain and ownership. `https://uqsmart.github.io/YouBudget/ads.txt` is **not** the root of `https://uqsmart.github.io/`. On GitHub Pages project sites, this can complicate root-level ads.txt compliance; a custom domain can simplify it. `ads.txt.example` is documentation only.
7. Check live page source, Google AdSense status, consent behavior, mobile layouts and performance before expanding. Never click your own ads.

## Deployment
This is a static website: deploy the contents of the ZIP to the GitHub Pages project. The existing site URL is https://uqsmart.github.io/YouBudget/. Links are relative for project-path hosting.

## Important limitations
The policy and terms pages are starter drafts, not legal advice; review before commercial publication. A live support address and business details are still needed. Subscription checkout is not implemented.
