# Shopify Integration add-on for WhatsApp for Business (ADO #30390)

## Context

ADO ticket #30390 asks to add a **Shopify Integration** add-on to WhatsApp for Business, "follow the same design" as the existing **Bot Builder** add-on (checkbox at plan-purchase time, standalone purchase/cancel from Manage Subscription, an info modal, ₹999/month or ₹11,988/year pricing).

Bot Builder today is implemented as a single hardcoded concept threaded through both repos: the `WhatsAppSubscription` row has only a boolean `isCustom` (no type), pricing is read from one hardcoded `Setting` row named `'flowBuilder'`, and roughly a dozen call sites (BE controllers/use-cases in `officeAndBusiness` + `paymentGateway`, a scheduler job, and FE hooks/components) assume "the one `isCustom:true` row = Bot Builder."

Adding Shopify as a second, independently-purchasable add-on means a customer can end up with **two** `isCustom:true` rows for the same subscription (Bot Builder + Shopify). Every place that does `findOne({ isCustom: true, ... })` or groups "the add-on row" by credential needs a way to tell them apart, or it will silently return/merge the wrong one. So this isn't a copy-paste of Bot Builder's UI — it requires a discriminator on the subscription row, and every Bot-Builder-only query needs to filter on it.

**Design decision:** add a nullable `addOnType` column (`'BOT_BUILDER' | 'SHOPIFY_INTEGRATION'`) to the shared `whatsAppSubscriptions` table. Existing/new Bot Builder rows get `'BOT_BUILDER'`; Shopify rows get `'SHOPIFY_INTEGRATION'`. Following the codebase's existing convention (it already duplicates near-identical blocks per concern rather than abstracting — e.g. the 3x-duplicated vendor-cost calc in `paymentGateway/controllers/corporate/whatsAppForBusiness.js`), Shopify gets its **own** parallel hooks/controllers/use-cases mirroring Bot Builder's, not a generic multi-add-on abstraction. The one exception is the single generic payment dispatcher (`botBuilderpayment` / `createBotBuilderSubscription`), which is invoked from one shared branch in `cashFreeGateway.js` keyed only on `req.body.isAddOns` — that one gets parameterized by `addOnType` rather than duplicated, since duplicating it would require a second dispatch branch keyed on something that doesn't exist yet.

The legacy (non-Cashfree-mandate) scheduler auto-renewal path will also be fixed to handle multiple simultaneous add-on rows per credential correctly, instead of silently keeping only one (confirmed scope with Nameer).

Pricing: ₹999/month, ₹11,988/year (= 999 × 12, matches the existing `yearlyAmount = amount * 12` formula already used for Bot Builder — no new formula needed).

---

## 1. Database (shared `whatsAppSubscriptions` table)

**New migration** (add to `paymentGateway/migrations/`, following the exact idempotent pattern of `20260516020000-add-isGracePeriod-to-whatsAppSubscriptions.js`):
- Add nullable `addOnType` column: `Sequelize.ENUM('BOT_BUILDER', 'SHOPIFY_INTEGRATION')`, default `null`.
- Backfill: `UPDATE whatsAppSubscriptions SET addOnType = 'BOT_BUILDER' WHERE isCustom = true AND addOnType IS NULL` (every existing custom row today is Bot Builder).
- Add index on `addOnType`.

**Model changes** — add `addOnType` field to the `WhatsAppSubscription` Sequelize model in all three places it's defined:
- `officeAndBusiness/models/entities/whatsAppSubscription.js`
- `paymentGateway/models/entities/whatsappSubscription.js`
- `scheduler/models/entities/whatsappSubscription.js`

**New Setting row** (via existing admin Settings mechanism / seed): `name: 'shopifyIntegration'`, `details: { amount: 999 }` — mirrors the existing `'flowBuilder'` row read by `getBotBuilderValues()`.

---

## 2. Backend — `officeAndBusiness` (corporate self-service)

Mirror the existing Bot Builder trio in `controllers/corporate/whatsAppForBusiness.js`:
- `getShopifyIntegrationAmount` — mirrors `getBotBuilderAmount` (~line 1380), reads `Setting` `'shopifyIntegration'` instead of `'flowBuilder'`.
- `getActiveShopifyIntegration` — mirrors `getActiveBotBuilder` (~line 1313), calls a new `findActiveShopifyIntegrationByCredentialId` / `findLastExpiredShopifyIntegrationSubscription`.
- `stopShopifyIntegration` — mirrors `stopBotBuilder` (~line 1360), calls a new `stopShopifyIntegrationStatus`.

In `models/use-cases/whatsappBusiness.js`, add Shopify counterparts of the three Bot-Builder-only functions, each identical except `isCustom: true` → `addOnType: 'SHOPIFY_INTEGRATION'` in the `where`:
- `findActiveShopifyIntegrationByCredentialId` (mirrors line 634)
- `findLastExpiredShopifyIntegrationSubscription` (mirrors line 677)
- `stopShopifyIntegrationStatus` (mirrors line 702)

Also **tighten the existing Bot Builder functions** (`findActiveBotBuilderByCredentialId`, `findLastExpiredBotBuilderSubscription`, `stopBotBuilderStatus`) to add `addOnType: 'BOT_BUILDER'` to their `where` clauses — required once Shopify rows exist, otherwise `findOne` can return whichever custom row matches first.

Admin add-on report (`findAllAddOnAndCount` and `AddOnsExport`, same file) stays `isCustom: true` (no filter) so both add-ons keep showing up together — but add `addOnType` to the selected `attributes` and to the exported row shape (new "Add-on" column) so admins can tell the two apart. Update `controllers/admin/whatsAppForBusiness.js` (`AddOnsExcelCSV`, `AddOnsPDF`) and the report template accordingly.

**New routes** in `routes/API/v1/corporate/whatsAppForBusiness.js` (mirroring lines 74/77/80):
```
router.get('/activeShopifyIntegration', getActiveShopifyIntegration);
router.get('/getShopifyIntegrationAmount', getShopifyIntegrationAmount);
router.patch('/stopShopifyIntegration', stopShopifyIntegration);
```

The AiSensy webhook handler (`UpdateProjectWaba`) already emails admins generically on `isCustom` add-on activation — extend its email title to be `addOnType`-aware (currently hardcoded "Bot Builder add-on purchased").

---

## 3. Backend — `paymentGateway` (billing)

**Setting lookup**: add `getShopifyIntegrationValues` to `models/use-cases/setting.js`, mirroring `getBotBuilderValues` (reads `'shopifyIntegration'`).

**Standalone add-on purchase** (used by `ManageSubscription` "Purchase Now" on an existing plan) — this is the one place to **generalize rather than duplicate**, since `cashFreeGateway.js` (~line 1043-1050, and the mirrored block ~1825-1840) dispatches to it from a single `req.body.isAddOns` branch:
- `botBuilderpayment` (`controllers/corporate/whatsAppForBusiness.js:1090`) — read `req.body.addOnType` (default `'BOT_BUILDER'` for back-compat), use it to pick the Setting name (`getBotBuilderValues` vs `getShopifyIntegrationValues`) and the existing-subscription lookup used for proration.
- `createBotBuilderSubscription` (`utils/whatsappForBusiness.js:362`) — accept `addOnType`, stamp it on the created row, use it in the admin notification email title (currently hardcoded "Bot Builder add-on purchased by...").

**Bundled-with-plan-purchase paths** (checkbox ticked at initial purchase/upgrade/renewal time) — mirror the existing `botBuilder` handling with a parallel `shopifyIntegration` amount field, matching the codebase's existing duplication style:
- `createWhatsApSubscription`, `updateWhatsAppSubscription`, `createWhatsAppSubscriptionFromWebhook` (all in `utils/whatsappForBusiness.js`) — each already has an `if (botBuilder) { subscriptions.push({...isCustom:true}) }` block; add a parallel `if (shopifyIntegration) { subscriptions.push({...isCustom:true, addOnType:'SHOPIFY_INTEGRATION'}) }` block, and tag the existing Bot Builder push with `addOnType:'BOT_BUILDER'`.
- `ProjectSubscriptionPayment` (`controllers/corporate/whatsAppForBusiness.js`) — the three near-identical vendor-cost blocks (~371-392 new purchase, ~604-618 upgrade, ~832-847 renewal) each read `botBuilder` from `req.body` and add its vendor cost; add the same for `req.body.shopifyIntegration` using `getShopifyIntegrationValues()`.
- `fetchUpgradingDiscountPrice` (same file, ~line 1352) — currently prorates only an existing Bot Builder add-on's discount on upgrade via `findActiveBotBuilderByCredentialId`; extend to also check/prorate an existing Shopify add-on via the new `findActiveShopifyIntegrationByCredentialId` (paymentGateway's own copy in `models/use-cases/whatsappforBusiness.js`, which also needs the same `addOnType` filter fix as the officeAndBusiness copy).

---

## 4. Scheduler (`scheduler/services/whatsAppSubscriptionAutoRenewal.js`)

Fix the `processedSubscriptions` grouping (lines ~55-70): it currently reduces to a single `addonDetails` per credential (`existingEntry.addonDetails = {...current}`), so a second simultaneous add-on row silently overwrites the first. Change `addonDetails` to an array (`addonDetailsList`) collecting **all** `isCustom` rows for that credential, and update the two downstream usages (~line 105 pricing accumulation, ~128 `idsToUpdate`, ~112/168 cancellation email) to iterate the list — summing all active add-on prices into `pgAmount`, expiring/cancelling all of their ids, and sending one correctly-labeled email per add-on (`addOnType`-aware title instead of hardcoded "Bot Builder add-on cancelled").

---

## 4b. Additional single-add-on assumptions found in follow-up audit (money + reporting correctness)

A second pass specifically hunting for `isCustom: true` used with `findOne`/a single-row `JOIN` (i.e. "assumes at most one add-on row per customer") turned up **five more live call sites** beyond the ones in the original plan above — including the actual Cashfree mandate-charge trigger. These are not optional polish: left unfixed, a customer holding both Bot Builder and Shopify would get silently undercharged/under-renewed on one of the two. All five need the same fix shape as section 4 (single `findOne` → `findAll`/loop over all active `isCustom` rows for the credential, summing amounts and handling each by its own `addOnType`).

Useful reference: the **generic** (non-WhatsApp) Peko+ subscription flow in `paymentGateway/utils/subscription.js` already supports multiple simultaneous add-ons correctly (eSign / Turbo / Invoicing), via `.filter(s => s.isCustom)` over the full row set rather than a single `findOne` — that's the pattern to mirror here. `paymentGateway/models/use-cases/subscription.js` is the same generic (non-WhatsApp) model too — neither file needs changes for this ticket.

1. **`paymentGateway/utils/whatsappForBusiness.js:720` (`renewWhatsAppSubscription`)** — the Cashfree mandate **CHARGE-webhook renewal path** (the live, primary renewal mechanism for mandate-based subscriptions, separate from the legacy scheduler in section 4). It does a single `findOne({ isCustom: true, status: 'ACTIVE' })` (with an `EXPIRED`-row fallback for late charges) to find "the" add-on to renew alongside the base plan, then computes `baseAmountPaid = paymentAmount - botBuilderPrice` and pushes exactly one add-on row into `subsToCreate`. With two active add-ons, only one gets renewed/priced correctly; the other's price silently gets misattributed to the base plan's `subscriptionAmountPaid`, and it never gets a renewed row — it just stays EXPIRED after this runs. **Fix:** change to `findAll`, sum all matched add-on prices for `baseAmountPaid`, and push one new row per matched add-on (each tagged with its own `addOnType`, mirroring the existing row it replaces).

2. **`scheduler/services/whatsAppTriggerSubscriptionCharges.js:63-92`** — the daily job that actually **triggers the Cashfree mandate charge** (real money). Its query does `ws LEFT JOIN whatsAppSubscriptions ba ON ba.credentialId = ws.credentialId AND ba.isCustom = 1` — a single-row join. With two active add-ons for one credential, this produces **two SQL rows for the same base subscription**, each paired with a different add-on. The idempotency guard (`referenceNo = wa_charge_<sub.id>_<endDate>`, checked against `paymentGatewayOrders`) means the loop only actually creates a charge order once — but `amount` (line 125: `subscriptionAmountPaid + botBuilderAmountPaid`) is computed from whichever of the two SQL rows is processed first, so **the second add-on's price is silently dropped from the mandate charge** — the customer is charged too little, and (compounding with #1 above) that add-on then lapses at renewal even though nothing looked wrong to them. **Fix:** change the query to aggregate all matching `ba` rows per `ws.id` (e.g. `GROUP BY ws.id` with `SUM(ba.subscriptionAmountPaid)`, or a subquery) instead of a plain `LEFT JOIN`, so `amount` reflects every active add-on.

3. **`officeAndBusiness/controllers/corporate/whatsAppForBusiness.js:607` (`UpdateProjectWaba` AiSensy webhook)** — already flagged in section 2 for its hardcoded email title, but the underlying `findOne({ projectId, isCustom: true })` also needs to become a loop: when a project has two `isCustom:true` rows (both created together at bundled purchase, both PENDING until WABA verification), only one gets an admin "add-on purchased" notification today. **Fix:** `findAll` instead of `findOne`, send one correctly-labeled email per matched row.

4. **`paymentGateway/controllers/admin/renewalChargeActions.js:73-82` (`computeCanonical`)** — admin tool that computes the "correct" renewal amount for manual retry/verification of a failed WhatsApp charge; single `findOne` for the add-on, same undercounting issue as #1/#2 for a customer with two add-ons. **Fix:** sum all active add-on rows.

5. **`paymentGateway/controllers/admin/schedulerChargeOrders.js:187-197`** and **`paymentGateway/controllers/admin/renewalCharges.js:129-139`** — these back the admin **"Renewal Charges" / scheduled-charges report** the user asked about directly ("subscription listing in report section... actions"). Both compute a `hasBotBuilder` boolean / single add-on amount via `findOne` the same way, feeding the report's displayed "canonical amount" and (in `renewalCharges.js`) its anomaly-warning system (`DUPLICATE_ACTIVE` etc. — line 117-123 already warns about *multiple base subscriptions*, so extending it to sum add-ons and optionally warn `MULTIPLE_ADDONS` is a natural fit rather than a new mechanism). **Fix:** sum all active add-ons into the displayed/report amount; update `hasBotBuilder` to a list of add-on labels (`addOnLabels: ['Bot Builder', 'Shopify Integration']`) so the report can show both.

---

## 4c. Third audit pass — validation middleware + an exhaustive `botBuilder` grep (found during implementation)

After implementing 4b, a targeted re-check (prompted by "did we handle validation/middleware for Shopify") found three more real gaps, all now fixed:

1. **`paymentGateway/controllers/corporate/cashFreeGateway.js`, `createSubscriptionOrder`** — the inline guard that rejects a WhatsApp purchase whose `pgAmount` is less than the add-on cost (protects against a stale/wrong frontend total producing a negative `subscriptionAmountPaid`) only checked `req.body.botBuilder`. Fixed to sum `botBuilder + shopifyIntegration`.

2. **`paymentGateway/utils/whatsappForBusiness.js`, `createWhatsAppSubscriptionFromWebhook`** — this is the function that creates the subscription rows when Cashfree confirms a **brand-new** mandate (the AUTH webhook event) — a completely different, more heavily-used code path than `createWhatsApSubscription`/`updateWhatsAppSubscription`, which were fixed in section 3. It was missed entirely: it read `tags.botBuilder` but never `tags.shopifyIntegration`, and the `shopifyIntegration` tag wasn't even being stamped onto the Cashfree order's `subscription_tags` at creation time (`cashFreeGateway.js`, same `createSubscriptionOrder`, ~line 2459). Fixed all three pieces: tag stamping at creation, reading it back in the webhook handler, and creating the Shopify row (also added the `addOnType: 'BOT_BUILDER'` tag to the existing Bot Builder row there, which this function was also missing).

3. **`scheduler/models/use-cases/subscription.js`, `fetchWhatsAppSubscriptionForAutoRenewalRetry`** (used by `scheduler/services/subscriptionGracePeriodRetry.js`) — the exact same `LEFT JOIN` bug already fixed in `whatsAppTriggerSubscriptionCharges.js` (section 4b item 2), just in the grace-period retry path instead of the initial charge-trigger path. Fixed the same way — correlated `SUM` subquery instead of a join to the isCustom rows — and updated the consumer to read `addOnAmountPaid` instead of `botBuilderAmountPaid`.

After these fixes, an exhaustive case-insensitive grep for `botBuilder` across all three services turned up nothing further unaccounted for — every remaining occurrence is either a Bot-Builder-specific function/branch that already has a Shopify mirror, or is inert (dead code: `paymentGateway/services/validateWhatsappForBusiness.js` is a fully add-on-aware validator that is not wired into any live route — it's referenced only from a commented-out case in `middlewares/validateAmount.js`. Left as-is/unfixed since updating dead code doesn't change runtime behavior and could create false confidence; flagged here for visibility. Note also that `validateAmount.js`'s live `switch` explicitly skips WhatsApp entirely for both add-ons equally — pre-existing, not a regression, out of scope unless asked to fix).

---

## 5. Frontend — `src/domains/dashboard/WhatsappForBusiness/` (Peko-IN-Frontend-1)

**Types** (`types/types.ts`): add `addOnType` to the subscription row type; add a `shopifyIntegrationAmount` type mirroring `botBuilderAmount`.

**API** (`api/index.ts`): add `getShopifyIntegrationAmount`, `activeShopifyIntegrationApi`, `stopShopifyIntegrationBilling` — copies of the three existing bot-builder API functions (lines 187/198/217) pointed at the new BE routes.

**New hooks**, each a direct mirror of its Bot Builder counterpart:
- `useShopifyIntegrationAmount.ts` (mirrors `useBotBuilderAmount.ts`)
- `useGetActiveShopifyIntegration.ts` (mirrors `useGetActiveBotBuilder.ts`)
- `useStopShopifyIntegrationApi.ts` (mirrors `useStopBotBuilder.ts`)
- `useShopifyIntegrationPayment.ts` (mirrors `useBotBuilderPayment.ts` — standalone purchase from Manage Subscription; sends `isAddOns: true, addOnType: 'SHOPIFY_INTEGRATION'`)

**`useSubscriptionPayment.ts`** (bundled plan-purchase flow, `handleSubmission`): add a second add-on amount parameter (`shopifyValue`) alongside the existing `botBuilderValue` — a second "Add on" line in `billSummary`, added into `pgAmount`/`total`, and `...(shopifyValue > 0 && { shopifyIntegration: shopifyValue })` in `requestBody`.

**`PlanDetails.tsx`**: add `isShopifySelected` state (mirrors `isBotBuilderSelected`, line 38) and a second checkbox block mirroring the existing one at lines 271-332 (own copy pulling from `useShopifyIntegrationAmount`/`useGetActiveShopifyIntegration`), independently selectable alongside Bot Builder. Update `handlePurchasePlan` (line 170) to compute and pass both add-on values to `handleSubmission`.

**`ManageSubscription.tsx`**: add a second "Add on" `Card` block mirroring lines 489-710 (own status/purchase/cancel wiring via the new Shopify hooks and `CancelSubscriptionModal`).

**`AboutModal.tsx`**: create a sibling `ShopifyAboutModal.tsx` with the ticket's provided copy (same structure: title, "How Can It Help Your Business?", "Where Can You Use It?", "Why Choose..."), used from both `PlanDetails.tsx` and `ManageSubscription.tsx`'s Shopify "What is it" link.

Remember [[Custom Input Components Convention]]: any new form field (e.g. checkboxes) must use the atomic components from `src/components/atomic/inputs/` under Formik context, not raw antd inputs — check whether `PlanDetails.tsx`'s existing `Checkbox` usage is already inside a Formik form or a plain controlled component before deciding how the new Shopify checkbox should be wired.

---

## 6. Frontend — Admin report

`src/domains/admin/reports/components/WhatsAppForBusiness/WhatsAppAddOn.tsx`: add an "Add-on" column reading the new `addOnType` field (mapped to a readable label, "Bot Builder" / "Shopify Integration") so the two add-ons are distinguishable in the table and CSV/Excel/PDF export.

---

## Verification

- **Backend**: run the existing Jest suites for the touched use-cases (`officeAndBusiness/models/use-cases/__tests__/whatsappBusiness/*`, `paymentGateway/models/use-cases/__tests__/whatsappForBusiness/*`) and add new ones for the Shopify mirrors and the `addOnType`-parameterized `createBotBuilderSubscription`/`botBuilderpayment`. Add a scheduler test covering two simultaneous add-on rows for one credential.
- **Manual, end-to-end** (exercise the actual UI, not just tests):
  1. Purchase a new WhatsApp Basic plan with both Bot Builder and Shopify checked → verify two `isCustom` rows are created with correct `addOnType`, correct combined `pgAmount`, and both show ACTIVE (or PENDING until WABA verification) in Manage Subscription.
  2. From Manage Subscription, purchase Shopify standalone on top of an existing plan (no Bot Builder) → verify pricing/proration and the new row's `addOnType`.
  3. Cancel one add-on, confirm the other is unaffected.
  4. Check the admin WhatsApp Add-ons report shows both rows with correct labels and exports correctly (CSV/Excel/PDF).
  5. Confirm the "What is it" modal shows the right copy for each add-on.
