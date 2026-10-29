export type FaqConceptId =
    | 'journal-states'
    | 'lists-vs-totals'
    | 'raw-vs-derived'
    | 'go-live-floor'
    | 'opening-balances'
    | 'gst-split'
    | 'partner-share'
    | 'vendor-convention'
    | 'gateway-convention'
    | 'subscriber-bases'
    | 'statement-conventions'
    | 'caches'
    | 'approval-gate'
    | 'manual-journals'
    | 'ledger-corrections'
    | 'go-live-baseline';

export type FaqConcept = {
    id: FaqConceptId;
    title: string;
    summary: string;
    body: string[];
    maintainerNotes: string[];
    lastReviewed: string;
};

const REVIEWED = '2026-09-24';

export const FAQ_CONCEPTS: FaqConcept[] = [
    {
        id: 'journal-states',
        title: 'The four states of an order’s accounting entry',
        summary:
            'Every paid order gets an accounting entry: the breakdown of where the money went (vendor, commission, fees, partner share) and the debit and credit lines posted to the books in Zoho Books. That entry can be in one of four states, and the state decides what each screen can show.',
        body: [
            'Recorded — the breakdown was worked out and the entry was accepted by the books. The row reads Posted, and everything about the order counts everywhere.',
            'Failed — the entry was sent to the books and refused, for example because of a connection problem or an account the books did not recognise. The money still moved, so every balance and total counts it. The row reads Not posted, “Books refused it”; post it again from Order Journals.',
            'Skipped — the entry was never sent. Either it was held back (posting paused, the service set not to post, a refund waiting for its sale entry, or a commission or platform fee the accounts team has not yet marked as configured, or changed outside this portal since it was confirmed) or it could not be prepared (an account missing from the chart of accounts, lines that did not balance). The row reads Not posted with that reason, the order stays listed with every amount dashed, and nothing from it moves on any vendor, subscriber, partner or gateway screen. Fix the cause, then post it again; for a commission or platform fee, mark it as configured on the service’s Commission, Plans or Platform Fee tab first, and posting it again checks that mark as it stands then.',
            'Not recorded — the entry was never attempted at all, usually because the service never worked out its breakdown. The row reads Not posted, “Not recorded yet”; it stays listed with its figures dashed and moves nothing, exactly like a skipped one. The dashboard counts these separately from skipped ones so the team can see entries that never happened.',
            'Some lines never go to the books from Peko at all: vendor deposits, credit notes, commissions and cost of sales recorded by hand, partner payouts and debit notes, gateway receipts and charges, wallet top-ups and money the team added to or took out of a wallet. They read Not applicable wherever a Posted column lists them, such as on a statement. On their own tables, entries recorded by hand show In Books instead, the switch the accounts team turns on once the entry is in the books.',
            'Whatever the state, the transaction is listed on every tab it belongs to. For an entry that never reached the books only the date, reference, service and status show; every amount shows as a dash, never as zero.',
        ],
        maintainerNotes: [
            'sharedServices/utils/journal/recordJournal.js → runJournalRecording / persistNotRecorded / skipJournal',
            'sharedServices/models/use-cases/order.js → persistJournalRecord',
            'paymentGateway/utils/paymentGatewayTransaction.js → order.create spreads computeJournalData output into journalData',
            'others/controllers/admin/orderJournal.js → resolveOrderJournalsQuery → singleKeyStatusLiteral',
            'others/models/use-cases/journalPosting.js → eventPosting / orderPosting / reachedBooks',
        ],
        lastReviewed: '2026-10-21',
    },
    {
        id: 'lists-vs-totals',
        title: 'Lists show every transaction; totals add up only what was worked out',
        summary:
            'A table lists every transaction that happened. A balance, footer total, card or dashboard figure adds up only the rows whose figure was actually worked out, so a tab can show more rows than its total covers.',
        body: [
            'The row is the record that something happened; the total is an accounting figure. When an order’s entry was never worked out there is nothing to add for it, so the total is smaller than the row count suggests.',
            'Balances built from an entry’s debit and credit lines — a vendor’s deposit used, a gateway’s collected, a partner’s earned — move for every entry that reached the books, whether the books accepted it or refused it. An entry held back before sending, one that could not be prepared, or one never attempted moves nothing, even where its lines had already been worked out. Figures taken from the order’s breakdown — commission, platform fee, partner share — follow the same rule: they count only once the sale entry has reached the books, even where the breakdown was worked out when the order was placed.',
        ],
        maintainerNotes: [
            'others/models/use-cases/vendorLedger.js → buildVendorMovementQuery vs buildVendorSplitQuery',
            'others/models/use-cases/paymentGatewayLedger.js → countGatewayOrders keeps journal-only membership',
            'others/models/use-cases/journalPosting.js → SALE_REACHED_BOOKS / reachedBooksSql, applied by buildVendorSplitQuery, the partner share query and subscriberLedger sumOrderTotals',
        ],
        lastReviewed: '2026-10-20',
    },
    {
        id: 'raw-vs-derived',
        title: 'Figures taken from the order versus figures worked out from it',
        summary:
            'Some figures are recorded on the order itself and always show: the amount the customer was charged, the gross platform fee, how it was paid, and the gateway’s own record of what went through it. Net fees and other values worked out from the order show a dash until the accounting entry has reached the books; a skipped or never recorded entry shows nothing from its breakdown even where one was worked out.',
        body: [
            'The gross platform fee is charged on the order itself, so it exists even when no entry exists; the net platform fee before GST depends on the accounting breakdown.',
            'Which payment gateway an order went through is known from the entry once it exists, and otherwise from the gateway’s own record kept on the order. Either way the gateway is matched to its account in the chart of accounts.',
        ],
        maintainerNotes: [
            'paymentGateway/utils/computeJournalData.js → platformFeeIncludingGST = amountPrecision(surcharge)',
            'paymentGateway/utils/paymentGatewayTransaction.js → paymentModeResponse',
            'others/models/use-cases/paymentGatewayLedger.js → GATEWAY_NAME_OF_ORDER, GATEWAY_AMOUNT_OF_ORDER',
            'others/models/use-cases/ledgerStatement.js → money()',
            'others/models/use-cases/journalPosting.js → SALE_REACHED_BOOKS',
        ],
        lastReviewed: '2026-10-20',
    },
    {
        id: 'go-live-floor',
        title: 'The accounting go-live date',
        summary:
            'One date, set from the Dashboard, from which this portal keeps its books. Nothing dated before it is counted anywhere — no list row, no dashboard figure, no balance, no statement line. Until it is set, every figure reads zero and every list is empty.',
        body: [
            'The go-live day itself is the first day counted. This works the same way as an opening balance, which already contains everything up to its own date, so the two never overlap and never leave a gap.',
            'Where a vendor, partner or gateway has an opening balance dated after go-live, its own date takes over: the ledger starts from whichever of the two is later.',
            'Changing the date clears the cached figures so nothing keeps showing numbers from the old date. Who set it, when and why is kept alongside the date.',
        ],
        maintainerNotes: [
            'others/models/use-cases/accountingPeriod.js → loadAccountingFloor, flooredAfter, saveGoLiveDate',
            'others/models/use-cases/vendorLedger.js → VENDOR_FLOOR',
            'others/models/use-cases/partnerLedger.js and paymentGatewayLedger.js → AFTER_FLOOR',
        ],
        lastReviewed: REVIEWED,
    },
    {
        id: 'opening-balances',
        title: 'Opening balances',
        summary:
            'A vendor, a partner or a payment gateway can each carry one opening balance: the position as at a date, brought in from before this portal started keeping the books. Movements dated on or before that date are not counted again; the opening balance stands in for them.',
        body: [
            'For a vendor the opening balance is the advance already held with them. For a partner it is what Peko already owed them. For a gateway it is the net amount the gateway was still holding for Peko.',
            'An opening balance cannot be dated earlier than the day before the go-live date, the day the portal’s books start from, and only one live opening balance exists per party: reverse or delete it before recording another.',
            'Transactions dated before an opening balance stay listed as history; the gateway tab marks them “before opening” so a row never quietly disagrees with the card above it.',
        ],
        maintainerNotes: [
            'others/models/use-cases/vendorDeposits.js → createOpeningBalance, findOpeningBalance',
            'others/models/use-cases/partnerPayouts.js and paymentGatewaySettlements.js → createOpeningBalance',
            'others/models/use-cases/accountingPeriod.js → openingBeforeGoLive (refuses only asOf < previousDay(goLive))',
            'paranoid entry tables: a deleted opening frees the slot',
        ],
        lastReviewed: '2026-10-20',
    },
    {
        id: 'gst-split',
        title: 'How GST is split out of a figure',
        summary:
            'Commission, platform fee and partner share are each kept both excluding and including GST, at the GST rate configured for the portal (18% unless changed). A figure marked “incl.” is the amount the money actually moved by; “excl.” is the revenue part.',
        body: [
            'Commission including GST = commission excluding GST + GST on the commission.',
            'Platform fee: the fee the customer paid is the including-GST figure; the excluding-GST figure is that fee with the GST taken back out.',
            'Partner share: the share is worked out excluding GST, GST is added on top, and the total is what Peko owes the partner.',
            'A commission, credit note or debit note recorded by hand is split the same way, at the rate in force when it was recorded: entered inclusive (the default), the GST is carved out of the amount; entered exclusive, it is added on top. The split and the rate stay on the entry, so a later rate change never restates it.',
        ],
        maintainerNotes: [
            'paymentGateway/utils/computeJournalData.js → taxRate, amountPrecision, splitGst',
            'others/models/use-cases/ledgerGst.js → splitEntryAmount, gstPartsOf (taxableAmount, gstAmount, gstRate, gstInclusive on vendorLedgerEntries / partnerLedgerEntries)',
        ],
        lastReviewed: '2026-10-20',
    },
    {
        id: 'partner-share',
        title: 'How a partner’s share is calculated',
        summary:
            'A whitelabel partner earns a percentage of what Peko itself earned on its customers’ orders — not a percentage of the order value. The rate is the partner’s share percentage at the time of the order.',
        body: [
            'On a service order the share is calculated on Peko’s own earnings: commission excluding GST plus platform fee excluding GST, less the gateway’s charge on the order when the partner bears it. On a Peko subscription it is calculated on the amount paid through the gateway before GST plus any discount Peko bore — a coupon, Peko Credit or the plan’s own discount — which is the Net Revenue shown on the Own Subscriptions tab, again less that gateway charge.',
            'The gateway charge is a percentage of what was paid through the gateway plus a fixed sum per transaction, from the partner’s own terms on the Whitelabel Partners page; a partner whose agreement leaves the charge with Peko has both set to zero. It is a figure in the order’s breakdown only: nothing is posted for it, and the gateway account still shows the full amount collected.',
            'Share excluding GST = that base × the partner’s rate. GST is added on top, and the total — the “Partner Share” shown — is what Peko owes the partner for the order.',
            'The rate itself is not stored on the order; the screens work it back from the money as share ÷ base. That is why “Share Applied” on an old order can differ from the partner’s rate today.',
            'A refund takes back the share on the refunded part, in the same proportion, so what a partner is owed falls by exactly the share that was clawed back.',
            'A debit note is share taken back by hand, when no refund did it — for example on an order settled outside the portal. It reduces what is left to pay the same way a payout does, and reversing it puts the amount back. Left to pay is therefore earned, plus the opening balance, less payouts, less debit notes.',
        ],
        maintainerNotes: [
            'paymentGateway/utils/computeJournalData.js → gatewayChargeOn, partnerShipFee, partnerPayable',
            'others/models/use-cases/partnerLedger.js → GATEWAY_CHARGE, ORDER_SHARE_BASE, SUBSCRIPTION_SHARE_BASE, sharePercentageApplied, buildPosition',
            'others/models/use-cases/partnerLedgerEntries.js',
            'systemUsers.gatewayCharge → { percentage, fixed }',
        ],
        lastReviewed: '2026-10-20',
    },
    {
        id: 'vendor-convention',
        title: 'How a vendor balance works',
        summary:
            'Peko pays each vendor in advance, so a vendor’s balance is the advance held with them. The summary shows the balance at the start and end of the selected period and the activity between those dates.',
        body: [
            'Available = opening balance + deposits − total transaction + commission earned. Total transaction includes the order amounts of sales on margin, credit-note adjustments and cost of sales recorded by hand for the selected period, less debit notes raised on the vendor; refunds and reversals are netted.',
            'Commission is what Peko kept on the vendor’s orders (including GST), less the part refunds took back, plus any commission recorded by hand. A cost of sales recorded by hand is the mirror of a commission: it comes out of the advance like a credit note, is credited on the statement and is counted in total transaction, never in commission; no tax document is prepared for it. A debit note raised on the vendor is the mirror of a cost of sales: it puts money back, is debited on the statement and comes off total transaction.',
            'Every order on a vendor’s profile is tagged by how it was sold. Margin: the vendor sold to the customer, Peko kept a commission and the vendor payable comes out of the advance. Agent Markup: Peko sold at the vendor’s price plus a markup of its own, which its accounting entry books as commission. Principal Markup: Peko sold in its own name at its own price, so the sale also appears on Other Sales with the markup and its GST. Orders sold on a markup basis, agent or principal, are listed with the net markup beside them but never come out of the advance and never reach the statement: the vendor bills Peko for them and the bill is recorded as cost of sales, which is what then comes out of the advance. An order with items sold both ways carries both tags and only its margin part comes out of the advance. An order is placed by the mode its entry recorded, else by what its breakdown shows, else by how the service is set to be sold today; an agent markup is never written into the entry, so a margin-shaped order of a service set to agent markup is read as one. A sale recorded by hand as Peko’s own revenue, with no vendor behind it, belongs to neither the vendor’s profile nor Other Sales.',
        ],
        maintainerNotes: [
            'others/models/use-cases/vendorLedger.js → buildVendorMovementQuery, buildVendorSplitQuery, buildPosition, vendorLedgerOrderClause, vendorCommissionOrderClause',
            'others/models/use-cases/vendorStatement.js → principalSaleSelect, principalRefundSelect, partsOf',
            'others/models/use-cases/vendorDeposits.js and vendorLedgerEntries.js',
            'others/models/use-cases/sellingMode.js → commissionModeSql, OWN_REVENUE',
            'others/models/use-cases/vendorLedger.js → buildPosition: costOfSales is a credit like creditNotes, debitNotes a debit; vendorStatement.js → manualEntryLine',
            'others/models/use-cases/vendorLedger.js → notMarkupSale (sellingModeSql NOT IN AGENT_MARKUP / PRINCIPAL_MARKUP) on buildVendorMovementQuery and both statement queries',
        ],
        lastReviewed: '2026-10-26',
    },
    {
        id: 'gateway-convention',
        title: 'How a payment gateway balance works',
        summary:
            'A payment gateway holds Peko’s money between the customer paying and the settlement arriving in the bank. Collected is what the gateway took in; a receipt and the charge the gateway kept are recorded by hand, and both reduce what is still to come.',
        body: [
            'Yet to receive = opening balance + collected − received − charges. Collected starts after the opening balance date, or at go-live where none is set.',
            'The order’s accounting entry may note the gateway’s charge used for a partner’s share, but nothing is posted for it, so charges reach the books only as the “Bills” recorded on the Received & Bills tab. A receipt and a charge are each recorded on their own, on their own date, from the gateway’s statement.',
            'Only money that actually went through a gateway makes an order a gateway transaction; an order paid entirely from the wallet is not one, whatever gateway name it carries.',
        ],
        maintainerNotes: [
            'others/models/use-cases/paymentGatewayLedger.js → buildCollectedQuery, buildPosition, GATEWAY_AMOUNT_OF_ORDER',
            'others/models/use-cases/paymentGatewaySettlements.js → createReceipt / createFee (the paired createSettlement flow ended 2026-09-30)',
            'sharedServices/utils/journal/lineItemBuilder.js → the gateway account is the COA row named after the gateway',
            'journalData.gatewayCharge is a figure only; no line is built from it',
        ],
        lastReviewed: '2026-10-20',
    },
    {
        id: 'subscriber-bases',
        title: 'The subscriber ledger reads on two bases',
        summary:
            'Wallet figures — top-ups, spent, cashback, wallet balance — come from the wallet’s own transaction history and cover the subscriber’s whole life: the wallet balance is a single running figure, so it cannot start from a date. Order figures — GMV, transactions, platform fee, paid via gateway — come from orders and start at the go-live date.',
        body: [
            'Wallet Balance is the wallet as it stands right now. The statement compares it with the net of every wallet transaction and flags any difference.',
            'Paid via Gateway is the gateway part of the order as the entry worked it out; where no entry exists it is the gateway’s own record of the payment.',
        ],
        maintainerNotes: [
            'others/models/use-cases/subscriberLedger.js → loadWalletPosition, sumOrderTotals, gatewayAmountOf',
            'others/models/use-cases/subscriberStatement.js → walletDifference',
        ],
        lastReviewed: '2026-10-20',
    },
    {
        id: 'statement-conventions',
        title: 'Reading a statement of accounts',
        summary:
            'Each ledger’s statement is a running balance built from posted movements and the entries recorded by hand. Which side is debit and which is credit follows the party: for a vendor a debit raises the advance Peko holds with them; for a partner a credit raises what Peko owes; for a gateway a debit is money the gateway is holding for Peko; for a subscriber a credit adds to the wallet.',
        body: [
            'Statements show movements. A transaction whose entry was skipped or never recorded is still listed, with a dash on both sides, so it moves nothing. An order sold on a markup basis, agent or principal, is not listed on a vendor statement at all: it never comes out of the advance.',
            'A statement for a date range still opens from everything before the range, so the running balance never restarts at zero mid-history. Every statement shows one line per movement: on a partner statement each order’s share earned and each refund’s clawback sit beside the payouts and debit notes that settled them, and on a gateway statement a charge recorded on its own is listed at its own date.',
        ],
        maintainerNotes: [
            'others/models/use-cases/vendorStatement.js, partnerStatement.js, paymentGatewayStatement.js, subscriberStatement.js',
            'others/models/use-cases/ledgerStatement.js → tallyStatement',
            'partnerStatement.js → accrualLine (one line per event); paymentGatewayStatement.js → standalone fees at their own date (2026-10-14)',
            'vendorStatement.js → notMarkupSale on buildVendorStatementQuery and buildVendorUnpostedQuery (2026-10-26)',
        ],
        lastReviewed: '2026-10-26',
    },
    {
        id: 'caches',
        title: 'Why a figure can lag by a few minutes',
        summary:
            'The Dashboard and the four ledger list pages show figures refreshed every five minutes; the Refresh button recalculates them on the spot. Changing the go-live date, or posting an entry by hand from Manual Operations, refreshes all of them at once; an approval decision, a change to the service classification or to the approval gate refreshes the Dashboard’s. A deposit, payout, receipt or correction recorded by hand does not: the list pages catch up within five minutes or on Refresh.',
        body: [
            'Detail pages, tabs and statements are calculated live each time they are opened. The list pages show when their figures were last calculated.',
        ],
        maintainerNotes: [
            'others/models/use-cases/accountingPeriod.js → ACCOUNTING_CACHE_KEYS (dashboard v6, vendor-balances v5, subscriber-balances v2, partner-balances v3, payment-gateway-balances v1), dropAccountingCaches, dropDashboardCache',
            'others/models/use-cases/accountingDashboard.js and *Ledger.js → getValue / setValue with a 300 s TTL',
            'drops: controllers/admin/manualJournal.js on success; serviceApprovals, serviceClassification, serviceApprovalGate → dropDashboardCache; none in vendorDeposits, partnerPayouts, paymentGatewaySettlements, ledgerEntryChanges',
        ],
        lastReviewed: '2026-10-20',
    },
    {
        id: 'approval-gate',
        title: 'Why a service must be approved before corporates see it',
        summary:
            'Every service a partner switches on in its menu is checked by the accounts team before that partner’s corporates can see it. Approval is given per partner and per service, so the same service can be live for one partner and still waiting for another. Only services classified as a vendor service with plans or without plans go through it; a service classified as Peko’s own service subscription, such as Peko Commerce, and any other menu item are never gated.',
        body: [
            'The team checks that the service is classified as with or without plans, is tied to a vendor, has its commission marked as configured (per plan where the service sells plans, and for Domain and Hosting also its own commission, which domain registrations use), has the platform fee marked as configured on every package of the partner that includes the service, records its accounting entries and, for a whitelabel partner, that the partner’s share is set. A commission or platform fee counts as configured once the accounts team saves it in this portal or switches its Configured mark on, even when it is zero; until then the service’s accounting entries are held back rather than posted. Approve is refused while one of these fails; the checklist links to the screen in this portal that fixes it, and names the Settings screen for the service type, the service operator, its vendor and its journal recording.',
            'A service is classified in Settings › Service Classification. Classifying a service that is already switched on for a partner approves it for that partner at once, with the note “Live when classified”, so nothing goes offline. Removing the classification, or moving the service to Peko’s own service subscription, takes it out of approvals; earlier decisions are kept but no longer gate anything.',
            'Each row carries an Approved switch: on approves the service for that partner at once, off rejects it with a note and takes it offline for that partner’s corporates. Review opens the checklist and the evidence and can decide for several partners in one go.',
            'Evidence — how many orders had their entry recorded — is shown but never blocks an approval, because production orders only start once the service is live.',
            'Rejecting an approved service takes it offline for that partner’s corporates at once. When a watched setting changes after an approval the row is flagged “Configuration changed since approval”; nothing is switched off by itself, the team re-reviews or rejects.',
            'An administrator can turn the approval gate off for development or testing. Every switched-on service then shows to corporates, and a red warning sits on every accounting page until it is turned back on.',
            'When these checks first went live, every service that was already switched on for a partner was approved for that partner by “system” with the note “Live before the approval gate”, so nothing that was live went offline. Anything switched on since then, for a new partner or an existing one, waits for the accounts team.',
        ],
        maintainerNotes: [
            'others/models/use-cases/serviceApprovalReadiness.js → computeReadiness (required vs advisory items)',
            'users/utils/approvalGate.js → applyApprovalGate marks unapproved leaves hasAccess=false in serviceAccess',
            'others/models/use-cases/serviceApprovalGate.js → settings row serviceApprovalGate',
            'others/models/use-cases/serviceApprovals.js → grandfatherLiveTrees (note "Live when classified")',
            'paymentGateway/utils/journalConfigurationGate.js → configurationGaps; others/models/use-cases/journalConfigurationGate.js → refreshConfigurationGaps on retry',
            'others/migrations/20261005134645-approve-live-services-at-approval-go-live.js (note "Live before the approval gate", actor system; per key, so trees that already had a row are completed too)',
            'others/models/use-cases/accountingServices.js → PLAN_TYPES.peko_subscription is outside VENDOR_PLAN_TYPES; serviceClassification.js → becomesGated',
        ],
        lastReviewed: '2026-10-20',
    },
    {
        id: 'go-live-baseline',
        title: 'What the go-live baseline accepted, and what goes through review since',
        summary:
            'When the accounting checks were switched on, everything already live was taken as it stood: every service a partner had switched on was approved for that partner, and every commission and platform fee that existed was marked as configured. Only what changes after that moment goes through approval or review.',
        body: [
            'Approvals: a service that was switched on for a partner at go-live is approved for that partner by “system”, with the note “Live before the approval gate”. A service switched on later, for a new partner or an existing one, waits for the accounts team’s approval before that partner’s corporates see it. The same happens when a service is first classified: partners that already had it switched on are approved at once.',
            'Commission and platform fee: every rate that existed at go-live counts as configured. A new plan, a new package fee, a cloned package or fee, or a new service starts unconfigured, and its orders’ accounting entries are held back until the accounts team confirms it in this portal.',
            'A later change to a commission or platform fee made in Settings or on a catalogue screen drops the configured mark: the service stays visible and its approval is not touched, but new orders’ entries are held back as “Commission not configured” or “Platform fee not configured” until the accounts team confirms the new value on the Commission, Plans or Platform Fee tab and posts the held entries again. Saving the value in this portal confirms it in the same step. Switching a row active or inactive, and the vendor catalogue refreshes, never change a mark.',
            'The baseline is taken once, when the approval checks are installed on an environment: whatever is live at that moment is recorded as approved in the approval history, decided by “system”, and every existing rate is marked as configured. It is never repeated by itself.',
        ],
        maintainerNotes: [
            'others/migrations/20261005134645-approve-live-services-at-approval-go-live.js and 20261005134649-backfill-configured-flags-at-approval-go-live.js (one-time, run by db:migrate before start)',
            'others/utils/configuredFlag.js, officeAndBusiness/utils/configuredFlag.js, purchase/utils/configuredFlag.js → reviewedChange resets the flag only when a value column changed',
            'others/models/use-cases/cashback.js → update (Settings, reviews) vs updateConfigured / createConfigured (portal routes POST/PUT /accounting/cashbacks)',
            'others/utils/accountingSchemaGuard.js → markExistingRows when a flag column has to be re-added',
        ],
        lastReviewed: '2026-10-05',
    },
    {
        id: 'manual-journals',
        title: 'Recording entries by hand',
        summary:
            'Manual Operations › Journal is where the accounts team records an accounting entry the automatic posting never made for an order. Nothing is posted without a person confirming the lines and giving a reason, and every posting is kept in a history.',
        body: [
            'Record: pick the event. For an order whose breakdown was never worked out, first state how it was sold — how the money came in, whether it is a subscription, whether a vendor is involved, the commission and its mode, the platform fee, the partner share less the gateway charge the partner bears, and any discount Peko bore (a plan’s own discount is already filled in from the subscription) — and generate the split figures from that. The form opens prefilled from the order, the service’s current commission terms and the partner’s record; only what you confirm or change is used, and nothing is read back from the lines. The way the order was sold is saved with the entry, so the vendor profile and Other Sales place it by what was stated, and a sale with no vendor behind it is Peko’s own revenue and shows on neither. Then rebuild the lines from the figures. For an order that already carries a breakdown the figures are there to start from. Adjust the split or the lines if needed, keep or change the date, give a reason and post. The entry is dated on the event, not on the day you press the button, and its note in the books names who recorded it.',
            'Only events the records show can be recorded: a sale on a paid order (or a failed one whose refund is already in the books), a refund on a refunded one, an admin refund the team processed, cashback the wallet actually received or gave back. An order dated before the accounting go-live date is left alone. While journal recording is paused across the platform nothing can be posted; the per-service setting not to post is deliberately ignored, as it is for a retry.',
            'While a service’s commission or platform fee is still waiting to be confirmed on its service page, its sale and refund entries are held here as well: confirm it first, then record. Cashback entries carry no commission and are never held.',
            'An entry already in the books is not changed or taken out here. A wrong split or amount is put right in the books themselves by the accounts team, with a manual commission or a credit note, and the entry stays as it was posted.',
            'The Not posted status on any ledger row, the Order Journals drawer and the dashboard’s Not Recorded Entries card all lead here.',
        ],
        maintainerNotes: [
            'sharedServices/utils/journal/manualJournal.js → buildJournalPreview / recordManualJournal (worker jobs journalPreview, manualJournal)',
            'others/models/use-cases/manualJournal.js → eligibility, defaults, lookup, journalAdjustments history',
            'others/controllers/admin/manualJournal.js → routes under accounting/manual-operations, permission Accounting › Others › Manual Operations (update)',
            'others/models/use-cases/manualJournalSetup.js → setupDefaultsFor / splitTemplateFor / loadPlanDiscount (mirrors paymentGateway/utils/computeJournalData.js)',
            'others/models/use-cases/sellingMode.js → OWN_REVENUE; sharedServices manualJournal.js → statedMode / splitFromLines',
        ],
        lastReviewed: '2026-10-20',
    },
    {
        id: 'ledger-corrections',
        title: 'Correcting entries recorded by hand',
        summary:
            'A deposit, credit note, manual commission, cost of sales entry, payout, debit note, gateway receipt, gateway fee or opening balance recorded by hand can be edited, deleted or reversed from the row it sits on. Each leaves a different trace.',
        body: [
            'Edit changes the entry in place: its amount, whether that amount was entered inclusive of GST, its date, reference, mode, note, reason, order or document. Use it for a typing mistake. The balance follows the corrected figure at once, as if the entry had always been right.',
            'Delete takes the entry out of every balance at once and marks it Deleted. It stays listed, with who deleted it and why, until the books have lost it too: mark it removed from the books, confirm, and it is gone from the portal. Its reference, or its place as the opening balance, is free again at once, so the right entry can be recorded straight away. Use it for an entry recorded twice or against the wrong profile.',
            'Reverse keeps the entry and adds a matching one the other way, dated today. Use it when the entry was real and has since been undone, so both sides stay on the statement.',
            'Edit and delete both need a reason. The Audit Trail keeps who made the change, when, what the entry held before and after, and the reason given, because the ledger itself no longer shows the old figures.',
            'A reversed entry, and the reversal itself, cannot be edited or deleted. A gateway receipt recorded together with its fee can only be reversed. An edited entry must still be dated after the profile’s opening balance, and an opening balance cannot be moved onto or past the first entry recorded after it.',
            'The portal never posts these entries to the books itself, so each one carries an In Books switch: turn it on once the entry has been entered in the books. A new entry starts off, an edit or a delete turns it back off so the books are brought up to date again, and a reversal is a new entry of its own. The dashboard counts every entry still off, and the Audit Trail keeps who turned it on or off.',
            'Subscriber wallet top-ups and withdrawals are different: they move real money and are posted automatically, so they are made, and put right, through Transfer Funds.',
        ],
        maintainerNotes: [
            'others/models/use-cases/ledgerEntryChanges.js → editEntry / deleteEntry write the configAuditLogs row in the same transaction (configType VENDOR_LEDGER / PARTNER_LEDGER / GATEWAY_LEDGER)',
            'others/controllers/admin/{vendorLedger,partnerLedger,paymentGatewayLedger}.js → update* / delete* handlers; PUT and DELETE routes sit beside each reverse route, same ledger write permission',
            'frontend components/ledgers/EntryChangeActions.tsx; VendorEntryDrawers.tsx → withChangeReason, DeleteEntryDrawer',
            'soft delete: paranoid models (deletedAt) keep deleted rows out of every balance and statement; tab lists read them with paranoid false; tagBooks on a deleted row destroys it with force',
            'unique reference and opening keys leave deleted rows out (migration 20261009050943-release-unique-keys-of-deleted-ledger-entries), so a deleted entry never blocks recording its replacement',
            'books switch: components/ledgers/BooksMarkCell.tsx; others/models/use-cases/ledgerBooks.js feeds the dashboard alert, merged fresh on every read',
            'vendorLedgerEntries.js / partnerLedgerEntries.js → ENTRY_FIELDS include gstInclusive, taxableAmount, gstAmount, gstRate',
        ],
        lastReviewed: '2026-10-21',
    },
];

export const findFaqConcept = (id: FaqConceptId) => FAQ_CONCEPTS.find(concept => concept.id === id);
