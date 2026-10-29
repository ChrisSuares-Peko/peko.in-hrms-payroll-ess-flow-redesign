/*
 * The FAQ registry: one entry for every figure the accounting portal shows, keyed by the
 * screen, the tab and the exact on-screen label. The reader is the accounts team, so every
 * question, answer and formula is written in their language; `maintainerNotes` is the one
 * developer-facing field and is never shown on the page.
 *
 * Upkeep rule — any change to others/models/use-cases/*Ledger*.js, otherSales.js,
 * accountingDashboard.js, accountingPeriod.js, to the formulas in
 * paymentGateway/utils/computeJournalData.js or sharedServices/utils/journal/lineItemBuilder.js,
 * or to any accounting column, card or label, updates the matching entries here and bumps
 * lastReviewed in the same commit. accountingFaq.coverage.test.ts fails when a label on screen
 * has no entry, or an entry points at a label that no longer exists.
 */
import { FaqConceptId } from './faqConcepts';

export const FAQ_SCREENS = [
    'Dashboard',
    'Vendors',
    'Subscribers',
    'Partners',
    'Payment Gateways',
    'Other Sales',
    'Third-Party Sales',
    'Third Party Configuration',
    'Statements',
    'Order Journals',
    'Approvals',
    'Manual Operations',
    'Transactions',
    'Fee Details',
    'Subscription Details',
] as const;

export type FaqScreen = (typeof FAQ_SCREENS)[number];

export type FaqEntry = {
    id: string;
    screen: FaqScreen;
    tab: string;
    label: string;
    question: string;
    answer: string;
    formula?: string;
    whenMissing: string;
    concepts: FaqConceptId[];
    maintainerNotes: string[];
    lastReviewed: string;
};

type EntryFields = Pick<
    FaqEntry,
    'question' | 'answer' | 'whenMissing' | 'concepts' | 'maintainerNotes'
> &
    Partial<Pick<FaqEntry, 'formula' | 'lastReviewed'>>;

const REVIEWED = '2026-09-24';

// Every discount Peko bears is booked to the one coupon discount expense account, so the
// entries that show it name all three sources together.
const DISCOUNT_WORDS = 'a coupon, Peko Credit or the plan’s own discount';

export const faqSlug = (value: string) =>
    value
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

export const faqEntryId = (screen: FaqScreen, tab: string, label: string) =>
    `${faqSlug(screen)}.${faqSlug(tab)}.${faqSlug(label)}`;

const entry = (screen: FaqScreen, tab: string, label: string, fields: EntryFields): FaqEntry => ({
    id: faqEntryId(screen, tab, label),
    screen,
    tab,
    label,
    lastReviewed: REVIEWED,
    ...fields,
});

const RAW =
    'Always shown — it is taken from the order itself, not worked out from its accounting entry.';
const DASH =
    'Shows a dash when the order’s accounting entry was skipped or never recorded: nothing from it is carried onto this screen until it is posted.';
const RECORD = 'Always shown — it is the entry exactly as it was recorded.';
const NOTHING_TO_ADD = 'Adds nothing for an order whose accounting entry was never worked out.';
const RECORDED_ONLY = 'Adds up recorded entries only.';
const LINES_ONLY =
    'Moves only for entries that reached the books, posted or refused; a skipped or never recorded entry moves nothing.';
const COUNT = 'A count.';

// The columns that mean the same thing wherever they appear.
const COMMON: Record<string, EntryFields> = {
    'In Books': {
        question: 'What does In Books mean?',
        answer: 'Whether an entry recorded by hand has been entered in the books. The portal never posts these entries itself, so the accounts team records each one in the books and then turns this on. Every new entry starts as Not synced, and editing or deleting it turns it back to Not synced so the books are brought up to date again. A deleted entry shows Still in books until you mark it removed; once confirmed it is gone from the portal. Entries not yet in the books are counted in an alert on the dashboard.',
        whenMissing:
            'Never blank: every entry recorded by hand shows its switch, or Still in books once deleted.',
        concepts: ['ledger-corrections'],
        maintainerNotes: [
            'booksSynced, booksSyncedAt, booksSyncedByName on the five ledger entry tables',
            'PATCH …/:id/books → ledgerEntryChanges.tagBooks; dashboard alert ledger_entries_not_in_books',
            'replaces the Posted column on the hand-recorded tables, where it could only read Not applicable',
        ],
        lastReviewed: '2026-10-09',
    },
    Date: {
        question: 'Which date is this?',
        answer: 'The day the transaction happened, or for an entry recorded by hand the date entered on it. A refund or cashback movement carries the day it was processed, not the day of the original order.',
        whenMissing: RAW,
        concepts: ['go-live-floor'],
        maintainerNotes: ['orders.transactionDate', 'the entry’s own date column'],
    },
    'Entry No.': {
        question: 'What is the entry number?',
        answer: 'The number the portal gave the entry when it was recorded. It is unique across the whole portal and never changes, even when the reference is edited, so it names one entry without confusion. Each kind of entry has its own running series: DEP for vendor deposits, VCN for vendor credit notes, COM for commissions recorded by hand, COS for cost of sales, VDN for vendor debit notes, PAY for partner payouts, PDN for partner debit notes, RCT for gateway receipts, BIL for gateway bills and OPB for opening balances on any ledger. A reversal takes the next number in the same series as the entry it reverses. For a commission or credit note recorded by hand it is also the number on the tax invoice or credit note Peko prepares, and the document for a reversal names the entry it reverses. The search box on each table finds an entry by this number.',
        whenMissing:
            'Shows a dash on a row read off an order or a refund, which was not recorded by hand and so has no entry number.',
        concepts: ['ledger-corrections'],
        maintainerNotes: [
            'entryNumber on the five ledger entry tables, claimed from accountingSequences inside the recording transaction (entryNumbers.js)',
            'migration 20261027084901 numbers existing rows in id order per series',
        ],
        lastReviewed: '2026-10-27',
    },
    Reference: {
        question: 'What is the reference?',
        answer: 'For an order it is its transaction id — the same id shown on Order Journals and on the customer’s receipt. For an entry recorded by hand it is the reference typed on it (UTR, cheque number, credit note number); an opening balance row reads Opening balance.',
        lastReviewed: '2026-10-20',
        whenMissing: RAW,
        concepts: [],
        maintainerNotes: ['orders.corporateTxnId', 'the entry’s reference column'],
    },
    Service: {
        question: 'What is the service?',
        answer: 'The service the order was placed for. A Peko subscription has no service, so its plan name is shown instead.',
        whenMissing: 'Shows a dash when the order has neither a service nor a plan.',
        concepts: [],
        maintainerNotes: [
            'serviceOperators.serviceProvider',
            'packages.packageName for subscriptions',
        ],
    },
    Status: {
        question: 'What does the status mean?',
        answer: 'For an order: whether the payment succeeded, failed or was refunded. Refunded is decided by an actual refund having been processed against the order, not by the payment status alone. For an entry recorded by hand: Active (Opening on an opening balance row); Reversal on the reversing entry itself; Reversed, with who reversed it and why; or Deleted, with who deleted it and why, until it is marked removed from the books.',
        whenMissing: RAW,
        concepts: ['journal-states'],
        maintainerNotes: [
            'orders.status',
            'vendorLedger.js → isRefunded',
            'the entry’s status column',
            'deletedAt on the ledger entry tables',
        ],
        lastReviewed: '2026-10-20',
    },
    Posted: {
        question: 'What does Posted mean?',
        answer: 'Whether this line has reached the books. Posted: the books accepted its accounting entry; on an order, its sale and any refund on it are both in the books. Not posted: it has not, and the short line underneath says why. “Books refused it” or “Not recorded yet”: post it from Order Journals. “Recording paused” or “Service set not to post”: that setting has to change first, then post it again. “Waiting for the sale entry”: the sale has to be in the books before its refund can follow. “Commission not configured” or “Platform fee not configured”: the accounts team has not yet marked that commission or platform fee as configured, or it was changed in Settings or on a catalogue screen since it was confirmed; mark it on the service’s Commission, Plans or Platform Fee tab, then post it again from Order Journals. “Could not be prepared”: the entry could not be worked out, usually because an account is missing from the chart of accounts; fix that, then post it again. “Refund:” in front means it is the refund on the order that has not reached the books. Hover over the reason to see the exact message. Not applicable: the line never goes to the books from Peko, such as deposits, payouts, debit notes, gateway receipts and charges, wallet top-ups and money the team added to or took out of a wallet. On their own tables, entries recorded by hand show In Books instead: the switch the accounts team turns on once the entry is in the books.',
        whenMissing:
            'Every entry shows one of the three; only the opening and closing lines of a statement are left blank.',
        concepts: ['journal-states', 'go-live-baseline'],
        lastReviewed: '2026-10-09',
        maintainerNotes: [
            'row.posting { state, note, detail }',
            'journalPosting.js → eventPosting / orderPosting',
            'orders.journalRecordStatus.<event> with journalData.<event>.skipped and .reason',
            'components/common/PostingCell.tsx',
        ],
    },
    Subscriber: {
        question: 'Who is the subscriber?',
        answer: 'The corporate customer who placed the order: the company name, otherwise the contact person, otherwise the account username.',
        whenMissing: RAW,
        concepts: [],
        maintainerNotes: ['corporateUsers.name / contactPersonName', 'credentials.username'],
    },
    Customer: {
        question: 'Who is the customer?',
        answer: 'The account username of the customer who placed the order.',
        whenMissing: RAW,
        concepts: [],
        maintainerNotes: ['credentials.username'],
    },
    Mode: {
        question: 'What is the mode?',
        answer: 'How the money moved for an entry recorded by hand: NEFT, RTGS, IMPS, UPI, cheque or other, as typed when it was recorded.',
        whenMissing: RECORD,
        concepts: [],
        maintainerNotes: ['the entry’s mode column'],
    },
    Note: {
        question: 'What is the note?',
        answer: 'The note typed when the entry was recorded. A reversed entry shows the reason for the reversal and who reversed it underneath; a deleted one shows Deleted with the reason and who deleted it.',
        lastReviewed: '2026-10-20',
        whenMissing: RECORD,
        concepts: [],
        maintainerNotes: ['the entry’s note / voidReason columns'],
    },
    Slip: {
        question: 'What is the slip?',
        answer: 'The supporting document uploaded with the entry — a bank slip, an invoice, a screenshot — opened from the link.',
        whenMissing: 'Shows a dash when no document was attached.',
        concepts: [],
        maintainerNotes: ['the entry’s slipKey / slipName columns', 'utils/s3.js'],
    },
    'Recorded By': {
        question: 'Who recorded it?',
        answer: 'The team member who recorded the entry, kept for the audit trail.',
        whenMissing: RECORD,
        concepts: [],
        maintainerNotes: ['the entry’s recordedByName column'],
    },
    Source: {
        question: 'What is the source?',
        answer: 'Whether the figure came from an order’s accounting entry (Order) or was recorded by hand (Manual).',
        whenMissing: RECORD,
        concepts: [],
        maintainerNotes: ['vendorLedger.js → COMMISSION_ORDER_SELECT / COMMISSION_MANUAL_SELECT'],
    },
    'Txn ID': {
        question: 'What is the transaction id?',
        answer: 'The order’s transaction id — the same id shown on Order Journals and on the customer’s receipt.',
        whenMissing: RAW,
        concepts: [],
        maintainerNotes: ['orders.corporateTxnId'],
    },
    Method: {
        question: 'What is the method?',
        answer: 'How the order was paid: through a gateway, through a gateway with the rest from the wallet, or entirely from the wallet.',
        whenMissing: RAW,
        concepts: [],
        maintainerNotes: ['orders.paymentMode'],
    },
    Type: {
        question: 'What is the type?',
        answer: 'The kind of movement this row is, as the ledger classifies it.',
        whenMissing: RECORD,
        concepts: [],
        maintainerNotes: ['the ledger’s serializer'],
    },
};

const IN_BOOKS_WITH_ORDERS: EntryFields = {
    ...COMMON['In Books'],
    answer: 'Whether the line is in the books. A line worked out from an order or a refund is posted by Peko itself, so it shows Posted, or Not posted with the reason underneath, the same reasons as in the Posted column on Transactions. A line recorded by hand never goes to the books from Peko, so it shows a switch instead: the accounts team enters it in the books and then turns it on. A new entry starts as Not synced, and editing or deleting it turns it back to Not synced. A deleted entry shows Still in books until you mark it removed; once confirmed it is gone from the portal. Entries recorded by hand that are not yet in the books are counted in an alert on the dashboard.',
    whenMissing:
        'Never blank: a line from an order or a refund shows its posting state, and an entry recorded by hand shows its switch.',
    concepts: ['ledger-corrections', 'journal-states'],
    maintainerNotes: [
        'components/ledgers/vendorColumns.tsx → booksOrPostingColumn: source MANUAL renders the switch, ORDER and AUTO render PostingCell',
        'exports: vendorLedgerExport.booksOrPostingLabel uses the posting label for rows without booksSynced',
    ],
    lastReviewed: '2026-10-09',
};

const common = (screen: FaqScreen, tab: string, labels: string[]) =>
    labels.map(label => entry(screen, tab, label, COMMON[label]));

const tabEntry = (
    screen: FaqScreen,
    label: string,
    answer: string,
    concepts: FaqConceptId[],
    lastReviewed?: string
) =>
    entry(screen, 'Tabs', label, {
        question: `What does the ${label} tab show?`,
        answer,
        whenMissing:
            'Every transaction that happened is listed; a figure that was never worked out shows a dash.',
        concepts,
        maintainerNotes: [`${screen} tab copy`],
        ...(lastReviewed ? { lastReviewed } : {}),
    });

// ---------------------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------------------
const journalCount = (label: string, key: string, what: string) =>
    entry('Dashboard', 'KPIs', label, {
        question: `What counts as a ${label.replace(' Entries', '').toLowerCase()} entry?`,
        answer: `Orders whose ${what} entry was accepted by the books in the window, ${
            key === 'transaction'
                ? 'counted on the order’s transaction date. The Transactions page it opens lists every successful order for the same dates, posted or not, so the two can differ'
                : 'counted on the day the entry was posted, not the day of the original order'
        }. Today is the current day; Monthly is the month so far, both on Indian time and both starting at the go-live date.`,
        whenMissing: 'A count of accepted entries; entries the books refused are not in it.',
        concepts: ['journal-states', 'go-live-floor'],
        maintainerNotes: [
            `accountingDashboard.js → buildJournalKpisQuery → recorded("${key}") with eventDateInRange("${key}")`,
        ],
        lastReviewed: '2026-10-20',
    });

const DASHBOARD: FaqEntry[] = [
    entry('Dashboard', 'KPIs', 'Journal Entries', {
        question: 'What is Journal Entries?',
        answer: 'The total of every accounting entry the books accepted in the window: payment, refund, cashback, cashback reversal and admin refund entries added together.',
        formula:
            'Journal entries = transaction + refund + cashback + cashback reversal + admin refund entries',
        whenMissing: 'A count of accepted entries; entries the books refused are not in it.',
        concepts: ['journal-states', 'go-live-floor', 'caches'],
        maintainerNotes: ['accountingDashboard.js → getJournalKpis'],
    }),
    journalCount('Transaction Entries', 'transaction', 'payment'),
    journalCount('Refund Entries', 'refund', 'refund'),
    journalCount('Cashback Entries', 'cashback', 'cashback'),
    journalCount('Cashback Reversal Entries', 'cashbackReversal', 'cashback reversal'),
    journalCount('Admin Triggered Refund Entries', 'adminRefund', 'admin refund'),
    entry('Dashboard', 'KPIs', 'Failed Entries', {
        question: 'What is a failed entry?',
        answer: 'An accounting entry that was sent to the books and refused, counted across every kind of entry. The money still moved, so the ledgers count it; post it again from Order Journals once the cause is fixed. An entry that was held back before it was sent, or could not be prepared, is counted under Skipped Entries instead.',
        whenMissing: COUNT,
        concepts: ['journal-states'],
        maintainerNotes: [
            'accountingDashboard.js → failed(key), which leaves out anything carrying a skip marker',
        ],
        lastReviewed: '2026-09-30',
    }),
    entry('Dashboard', 'KPIs', 'Skipped Entries', {
        question: 'What is a skipped entry?',
        answer: 'An entry that was never sent to the books: held back because posting was paused, the service is set not to post, a refund was waiting for its sale entry or a commission or platform fee was not yet confirmed by the accounts team, or not prepared because an account was missing from the chart of accounts or the lines did not balance. The order stays listed on every screen with every amount dashed, and nothing from it moves until it is posted. Post it again from Order Journals once the cause is fixed.',
        whenMissing: COUNT,
        concepts: ['journal-states', 'go-live-baseline'],
        maintainerNotes: [
            'accountingDashboard.js → skipped(key)',
            'recordJournal.js → persistNotRecorded / skipJournal',
        ],
        lastReviewed: '2026-10-07',
    }),
    entry('Dashboard', 'KPIs', 'Not Recorded Entries', {
        question: 'What is a not-recorded entry?',
        answer: 'A successful order for which no accounting entry was ever attempted: it was neither accepted, refused nor skipped. Nothing was posted to the books, and nothing from the order moves on any screen until it is recorded. These are the entries that silently never happened.',
        whenMissing: COUNT,
        concepts: ['journal-states'],
        maintainerNotes: ['accountingDashboard.js → notRecorded(key)'],
    }),
    entry('Dashboard', 'KPIs', 'Transactions Count', {
        question: 'What is Transactions Count?',
        answer: 'Every successful order in the window, whether or not it has an accounting entry.',
        whenMissing: COUNT,
        concepts: ['lists-vs-totals', 'go-live-floor'],
        maintainerNotes: ['accountingDashboard.js → countWhere("status = \'SUCCESS\'")'],
    }),
    entry('Dashboard', 'KPIs', 'Total GMV', {
        question: 'What is Total GMV?',
        answer: `Gross merchandise value: the full value of every successful order in the window, added up — what customers paid through the gateway and from the wallet plus any discount Peko bore for them, whether ${DISCOUNT_WORDS}. The figure is read from the order’s accounting entry; an order with no entry counts the amount charged on it, so Total GMV moves whether or not an entry exists. Total Discount and Net GMV beside it split the same figure into the part Peko bore and the part the customer paid, and the Transactions page shows the three figures on every record.`,
        formula: 'Total GMV = Paid through gateway + Paid from wallet + Discount borne by Peko',
        whenMissing:
            'Counts every successful order; one with no accounting entry counts the amount charged on it.',
        concepts: ['raw-vs-derived', 'go-live-floor'],
        maintainerNotes: [
            'journalPosting.js → gmvOfOrder',
            'accountingDashboard.js → sumForSuccess(gmvOfOrder())',
        ],
        lastReviewed: '2026-10-20',
    }),
    entry('Dashboard', 'KPIs', 'Total Discount', {
        question: 'What is Total Discount?',
        answer: `Every discount Peko bore on the successful orders in the window, added up — ${DISCOUNT_WORDS} — read from each order’s accounting entry. It is the part of Total GMV the customer did not pay: Total GMV less Total Discount is Net GMV.`,
        formula: 'Total discount = sum of the discount borne by Peko over successful orders',
        whenMissing:
            'An order with no accounting entry adds nothing here, so its Total GMV and Net GMV are the same amount.',
        concepts: ['raw-vs-derived', 'go-live-floor'],
        maintainerNotes: ['journalPosting.js → discountOfOrder', 'journalData.couponTotalDiscount'],
        lastReviewed: '2026-10-20',
    }),
    entry('Dashboard', 'KPIs', 'Net GMV', {
        question: 'What is Net GMV?',
        answer: 'The value of the successful orders in the window as the customers actually paid it, through the gateway and from the wallet, with no discount added back. It is Total GMV less Total Discount.',
        formula: 'Net GMV = Paid through gateway + Paid from wallet = Total GMV − Total discount',
        whenMissing:
            'Counts every successful order; one with no accounting entry counts the amount charged on it, the same figure its Total GMV shows.',
        concepts: ['raw-vs-derived', 'go-live-floor'],
        maintainerNotes: ['journalPosting.js → netGmvOfOrder'],
        lastReviewed: '2026-10-20',
    }),
    entry('Dashboard', 'KPIs', 'Commission (excl. GST)', {
        question: 'What is Commission (excl. GST) on the dashboard?',
        answer: 'Peko’s commission before GST on successful orders in the window, added up. Only orders whose accounting entry worked out a commission contribute. The markup on a sale Peko makes as principal is not commission: it sits in Other Sales, not here.',
        formula: 'Sum of commission excluding GST over successful orders',
        whenMissing: NOTHING_TO_ADD,
        concepts: ['gst-split', 'lists-vs-totals'],
        maintainerNotes: [
            'accountingDashboard.js → AMOUNT_METRICS.commission',
            'computeJournalData.js → commissionExcludingGST, separate from principalCommissionExcludingGST',
        ],
        lastReviewed: '2026-10-20',
    }),
    entry('Dashboard', 'KPIs', 'Platform Fee (excl. GST)', {
        question: 'What is Platform Fee (excl. GST) on the dashboard?',
        answer: 'The platform fee before GST on successful orders in the window, added up.',
        formula: 'Sum of platform fee excluding GST over successful orders',
        whenMissing: NOTHING_TO_ADD,
        concepts: ['gst-split', 'raw-vs-derived'],
        maintainerNotes: ['accountingDashboard.js → AMOUNT_METRICS.platformFee'],
    }),
    entry('Dashboard', 'KPIs', 'Total Subscriptions', {
        question: 'What is Total Subscriptions on the dashboard?',
        answer: 'Peko’s own subscription revenue before GST on successful orders in the window, added up — plans and add-ons together, and Peko’s own services such as Peko Commerce, which are booked as subscriptions. The figure is taken before any discount Peko bore, so a discounted plan still counts at its full price and the discount sits in Total Discount. A one-time purchase such as an extra Corporate Card is a sale, not a subscription, and is counted under Other Sales instead.',
        formula:
            'Sum of subscription revenue excluding GST, before any discount Peko bore, over successful orders, leaving out one-time purchases',
        whenMissing: NOTHING_TO_ADD,
        concepts: ['gst-split'],
        maintainerNotes: [
            'accountingDashboard.js → AMOUNT_METRICS.subscriptions, SUBSCRIPTION_INCOME',
            'oneTimeItems.js → isOneTimeItemOrder',
            'computeJournalData.js → netSubscriptionIncome = pre-GST gateway amount + couponTotalDiscount; isPekoSale = isSubscription || isPhysicalCard',
        ],
        lastReviewed: '2026-10-20',
    }),
    entry('Dashboard', 'KPIs', 'Subscriptions (Monthly)', {
        question: 'What is Subscriptions (Monthly)?',
        answer: 'The part of Total Subscriptions that came from monthly plans, over the same orders and dates; a plan with no billing period recorded counts as monthly. Monthly plus Annual adds up to Total Subscriptions.',
        formula: 'Sum of subscription revenue excluding GST on monthly-billed orders',
        whenMissing: NOTHING_TO_ADD,
        concepts: ['gst-split'],
        maintainerNotes: [
            'accountingDashboard.js → sumForSuccessByBilling with the same transaction-date window as the total',
            'computeJournalData.js → billingType || MONTHLY',
        ],
        lastReviewed: '2026-10-20',
    }),
    entry('Dashboard', 'KPIs', 'Subscriptions (Annual)', {
        question: 'What is Subscriptions (Annual)?',
        answer: 'The part of Total Subscriptions that came from annual plans, over the same orders and dates.',
        formula: 'Sum of subscription revenue excluding GST on annually-billed orders',
        whenMissing: NOTHING_TO_ADD,
        concepts: ['gst-split'],
        maintainerNotes: [
            'accountingDashboard.js → sumForSuccessByBilling with the same transaction-date window as the total',
            'computeJournalData.js → billingType',
        ],
        lastReviewed: '2026-10-20',
    }),
    entry('Dashboard', 'KPIs', 'Other Sales', {
        question: 'What is Other Sales on the dashboard?',
        answer: 'The Full Amount total of the Other Sales screen for the same window: every sale made on a principal-markup basis whose entry reached the books, at its full value, together with one-time purchases Peko sells itself, such as extra Corporate Cards. Clicking the card opens Other Sales for those dates.',
        formula:
            'Sum of the full amount of principal-markup sales and one-time purchases in the window whose entry reached the books',
        whenMissing:
            'Adds up the sales whose entry reached the books, posted or refused; a skipped or never recorded entry adds nothing.',
        lastReviewed: '2026-10-12',
        concepts: ['raw-vs-derived', 'vendor-convention'],
        maintainerNotes: [
            'accountingDashboard.js → getOtherSalesTotals',
            'otherSales.js → buildOtherSalesTotalsQuery',
            'oneTimeItems.js → ONE_TIME_ITEM_KEYS',
        ],
    }),
    entry('Dashboard', 'KPIs', 'Third-Party Sales', {
        question: 'What is Third-Party Sales on the dashboard?',
        answer: 'Money corporates collected from their own customers through Peko’s payment links in the window: every link that was paid, at the amount it asked for, dated by the day the payment came in. It is not Peko’s revenue — the money belongs to the corporate and is passed on to it — so nothing from it is in the books. Clicking the card opens Third-Party Sales for those dates.',
        formula: 'Sum of the amount of payment links paid in the window, by payment date',
        whenMissing:
            'Counts only links whose payment succeeded; a pending, failed or expired link adds nothing.',
        lastReviewed: '2026-10-12',
        concepts: ['go-live-floor', 'lists-vs-totals'],
        maintainerNotes: [
            'accountingDashboard.js → getThirdPartySalesTotals',
            'thirdPartySales.js → buildPaymentLinksTotalsQuery with status paid',
        ],
    }),
    entry('Dashboard', 'Charts', 'Journal Health', {
        question: 'What does Journal Health show?',
        answer: 'How this month’s accounting entries split between four states: recorded (accepted by the books), failed (sent to the books and refused), skipped (never sent: held back or not prepared) and not recorded (never attempted). The four counts are the Journal Entries, Failed Entries, Skipped Entries and Not Recorded Entries cards under Monthly Statistics drawn as one ring, and the number in the middle is the four added together. Each entry counts once, so an order that was later refunded counts twice: once for the payment and once for the refund.',
        formula: 'Ring total = recorded + failed + skipped + not recorded, month to date',
        whenMissing:
            'When all four are zero the ring is drawn empty and reads 0: before the first order of the month, or until the go-live date is set.',
        concepts: ['journal-states', 'go-live-floor', 'caches'],
        maintainerNotes: [
            'accountingDashboard.js → getJournalKpis(monthlyRange)',
            'dashboardCharts.tsx → buildJournalHealth',
        ],
        lastReviewed: '2026-09-30',
    }),
    entry('Dashboard', 'Charts', 'Revenue Mix', {
        question: 'What does Revenue Mix compare?',
        answer: 'Peko’s four income lines for the month so far, side by side: commission excluding GST, platform fee excluding GST, subscription income excluding GST, and sales as principal and one-time purchases at their full value. Every bar is drawn against the largest of the four, so the longest bar is always full width. The amounts are the Commission (excl. GST), Platform Fee (excl. GST), Total Subscriptions and Other Sales cards under Monthly Statistics.',
        whenMissing:
            'An empty line shows no bar and ₹ 0.00. Sales as principal count at full sale value because Peko is the seller of record, while the other three lines are fee income, so the bars compare size; they are not shares of one total.',
        concepts: ['gst-split', 'lists-vs-totals', 'raw-vs-derived', 'vendor-convention'],
        maintainerNotes: [
            'accountingDashboard.js → AMOUNT_METRICS, getOtherSalesTotals',
            'dashboardCharts.tsx → buildRevenueMix',
        ],
        lastReviewed: '2026-10-20',
    }),
    entry('Dashboard', 'Charts', 'Top Performers', {
        question: 'Who are the top performers?',
        answer: 'The six services, vendors or partners with the most business this month so far, one view at a time. Services and partners are ranked by the full value of their successful orders, before any discount Peko bore, the same basis as Total GMV; vendors are ranked by the commission excluding GST that Peko earned on their orders, the same basis as Commission (excl. GST), so only services sold for a vendor count and the markup on sales Peko makes as principal does not. Each row shows the number of successful orders and the amount, with the bar drawn against the largest row. Customers who signed up directly are grouped as Peko (Default).',
        whenMissing:
            'Reads “No successful orders this month yet” before the first order of the month or until the go-live date is set, and “Rankings could not be loaded” when the figures could not be worked out; the rest of the dashboard still shows.',
        concepts: ['go-live-floor', 'lists-vs-totals', 'gst-split', 'caches'],
        maintainerNotes: [
            'accountingRankings.js → SERVICES_SQL, VENDORS_SQL, PARTNERS_SQL, withPartnerNames',
            'journalPosting.js → gmvOfOrder for services and partners; classifiedServices.js → isVendorService for vendors',
            'accountingDashboard.js → safely("rankings", …)',
            'dashboardCharts.tsx → buildRankingRows',
        ],
        lastReviewed: '2026-10-20',
    }),
    entry('Dashboard', 'Alerts', 'Failed journal entries', {
        question: 'What does the Failed journal entries alert mean?',
        answer: 'Accounting entries attempted today that the books refused: a payment, refund, cashback, cashback reversal or admin refund entry. The money moved, so each one has to reach the books. Expand the alert to see every order concerned with the kind of entry, the service, the amount and the reason the books gave, most often an account missing from the chart of accounts. Retry entry opens that order in Order Journals with its entry ready to send again once the cause is fixed. The alert counts entries by the day they were attempted, so a refund entry for an old order counts today.',
        whenMissing:
            'Not shown while no entry was refused today. The list shows up to fifty orders; when there are more, See all opens Order Journals filtered to failed entries.',
        concepts: ['journal-states', 'caches'],
        maintainerNotes: [
            'accountingDashboard.js → findJournalIssues, buildFailedJournalsQuery; buildAlerts items',
            'dashboardData.tsx → ISSUE_OF.failed_journals_today → Order Journals ?search&open',
            'OrderJournalsReport.tsx → search / open params',
        ],
        lastReviewed: '2026-10-20',
    }),
    entry('Dashboard', 'Alerts', 'Journals not recorded', {
        question: 'What does the Journals not recorded alert mean?',
        answer: 'Orders paid successfully today for which no accounting entry was ever attempted: not posted, not refused and not held back. Expand the alert to see each order with its service and amount. Record journal opens the Manual Operations journal for that order, where the entry can be recorded by hand and sent to the books.',
        whenMissing:
            'Not shown while every successful order of the day has an entry, even a refused or held-back one. Up to fifty orders are listed; See all opens Order Journals filtered to not recorded.',
        concepts: ['journal-states', 'manual-journals'],
        maintainerNotes: [
            'accountingDashboard.js → buildNotRecordedJournalsQuery',
            'dashboardData.tsx → ISSUE_OF.journals_not_recorded → manualJournalPath(txn, transaction)',
        ],
        lastReviewed: '2026-10-20',
    }),
    entry('Dashboard', 'Alerts', 'Services without commission', {
        question: 'What does the Services without commission alert mean?',
        answer: 'Vendor services without plans that are switched on but have no commission confirmed by the accounts team. Until it is confirmed, their orders are held back from the books and show as Skipped. Expand the alert to see each service; Set commission opens that service’s Commission tab, where the commission is entered and confirmed.',
        whenMissing:
            'Not shown while every switched-on service without plans has a confirmed commission, or while no service is classified as without plans.',
        concepts: ['journal-states'],
        maintainerNotes: [
            'accountingDashboard.js → findServicesWithoutCommission (label + accessKey)',
            'dashboardData.tsx → accountingServicePath(without_plans, accessKey, commission)',
        ],
        lastReviewed: '2026-10-20',
    }),
    entry('Dashboard', 'Alerts', 'Platform fee not set (without plans)', {
        question: 'What does the Platform fee not set (without plans) alert mean?',
        answer: 'Active packages that include a switched-on vendor service without plans where the platform fee on that package link has not been marked as configured by the accounts team. Until it is, the service’s orders from that package are held back from the books. Expand the alert to see each service and package with the partner the package belongs to; Set platform fee opens that service’s Platform Fee tab on that partner with the package searched. Packages of Peko’s own subscriptions are not counted.',
        whenMissing:
            'Not shown while every active package link of every vendor service without plans has its platform fee marked configured, or while no service is classified as without plans.',
        concepts: ['journal-states'],
        maintainerNotes: [
            'accountingDashboard.js → findPlatformFeeMissing, buildPlatformFeeMissingRowsQuery (same link rule as serviceConfiguration.js PLATFORM_FEE_COUNTS_SQL)',
            'dashboardData.tsx → platformFeeIssue → accountingServicePath(kind, accessKey, platform-fee) ?partner&search; PlatformFeeTab.tsx search param',
        ],
        lastReviewed: '2026-10-20',
    }),
    entry('Dashboard', 'Alerts', 'Partners without share', {
        question: 'What does the Partners without share alert mean?',
        answer: 'Active whitelabel partners with no share percentage set, so nothing is worked out as owed to them from their portal’s orders and their ledger stays empty. Expand the alert to see each partner; Set share opens Whitelabel Partners on that partner with the configuration form already open.',
        whenMissing: 'Not shown while every active partner has a share percentage.',
        concepts: ['partner-share'],
        maintainerNotes: [
            'accountingDashboard.js → findPartnersWithoutShare (label + partnerId = registeredBy)',
            'WhitelabelPartners.tsx → search / configure params',
        ],
        lastReviewed: '2026-10-20',
    }),
    entry('Dashboard', 'Alerts', 'Chart of accounts issues', {
        question: 'What does the Chart of accounts issues alert mean?',
        answer: 'Three kinds of problem with the accounts the portal posts to. A required account is missing, so every entry that needs it is refused: Add account opens the add form with the name filled in. An account failed to sync with the books or has no books id yet: Open account finds it on the Chart of Accounts page. A shared account is booked on the wrong side of the balance sheet, which turns the alert red: Fix account type finds it so its type can be corrected. Expand the alert to see each account with the problem underneath.',
        whenMissing:
            'Not shown while every required account exists, is synced and is on the right side of the balance sheet.',
        concepts: ['journal-states'],
        maintainerNotes: [
            'accountingDashboard.js → findChartOfAccountIssues, REQUIRED_ACCOUNT_NAMES, EXPECTED_ACCOUNT_SIDE',
            'ChartOfAccount.tsx → search / add params; ChartOfAccountModal initialName',
        ],
        lastReviewed: '2026-10-20',
    }),
    entry('Dashboard', 'Alerts', 'Plans missing commission', {
        question: 'What does the Plans missing commission alert mean?',
        answer: 'Plans, packages, gift cards, eSIM plans, hikes, software plans, domain and hosting plans, recharge providers and business or government service catalogue items of a service classified as vendor service with plans that are active but have no commission confirmed. Their orders are held back from the books until it is set. Expand the alert to see each plan with its catalogue; Set commission opens the service’s Plans tab with that plan searched. Packages of Peko’s own services such as Peko Commerce are not counted, as Peko earns no commission on itself, and neither are car report plans yet.',
        whenMissing:
            'Not shown while every active plan of a vendor service with plans has a confirmed commission, or while no service is classified as vendor service with plans. Up to fifty plans are listed; See all opens Vendor service with plans.',
        concepts: ['journal-states'],
        maintainerNotes: [
            'planCatalogues.js → PLAN_CATALOGUES, accessKeyExpressionOf (planEntityConfig.js accessCode for packages)',
            'accountingDashboard.js → buildPlansMissingCommissionRowsQuery',
            'PlansTab.tsx → search param',
        ],
        lastReviewed: '2026-10-20',
    }),
    entry('Dashboard', 'Alerts', 'Platform fee not set (with plans)', {
        question: 'What does the Platform fee not set (with plans) alert mean?',
        answer: 'The same check for switched-on vendor services with plans: active packages that include the service where the platform fee on that package link has not been marked as configured. The plan commission is a separate alert; this one is only about the platform fee carried by the package. Expand the alert to see each service and package with its partner; Set platform fee opens that service’s Platform Fee tab on that partner with the package searched.',
        whenMissing:
            'Not shown while every active package link of every vendor service with plans has its platform fee marked configured, or while no service is classified as with plans.',
        concepts: ['journal-states'],
        maintainerNotes: [
            'accountingDashboard.js → findPlatformFeeMissing (with_plans group)',
            'dashboardData.tsx → platformFeeIssue(with_plans)',
        ],
        lastReviewed: '2026-10-20',
    }),
    entry('Dashboard', 'Alerts', 'Services awaiting approval', {
        question: 'What does the Services awaiting approval alert mean?',
        answer: 'Services switched on in the default menu or in a partner portal that the accounts team has not approved yet, whether still pending or rejected. While the gate is on, such a service is not shown to that portal’s corporates. Expand the alert to see each service with its partner and state; Review opens Approvals on that partner with the service searched.',
        whenMissing:
            'Not shown while every switched-on service of every partner portal is approved. Only genuine partner portals and the default menu are counted, the same list as Whitelabel Partners.',
        concepts: ['approval-gate'],
        maintainerNotes: [
            'serviceApprovalTree.js → findAwaitingApprovals (items with partnerPermissionId, accessKey, status)',
            'approvals.ts → approvalsPath(partner, status, search); ApprovalsList.tsx search param',
        ],
        lastReviewed: '2026-10-20',
    }),
    entry('Dashboard', 'Alerts', 'Approval gate off', {
        question: 'What does the Approval gate off alert mean?',
        answer: 'The approval gate has been switched off, which is meant for development only. While it is off every switched-on service is shown to corporates whether the accounts team approved it or not. The alert names who switched it off and when; Turn the gate on opens Approvals, where the gate card switches it back on.',
        whenMissing: 'Not shown while the gate is on.',
        concepts: ['approval-gate'],
        maintainerNotes: [
            'serviceApprovalGate.js → getApprovalGateSettings',
            'dashboardData.tsx → gateIssues',
        ],
        lastReviewed: '2026-10-20',
    }),
    entry('Dashboard', 'Alerts', 'Entries not in books', {
        question: 'What does the Entries not in books alert mean?',
        answer: 'Deposits, opening balances, credit notes, commissions, payouts, debit notes, receipts and fees recorded by hand that are not yet marked In Books, including deleted entries that are still to be removed from the books. The portal never posts these itself, so the accounts team enters each one in the books and then turns the switch on. Expand the alert to see each entry with its profile, amount and date; Mark in books or Remove from books opens that profile’s tab where the switch is.',
        whenMissing:
            'Not shown while every hand-recorded entry is marked In Books. This alert is counted afresh on every visit, not from the five-minute snapshot.',
        concepts: ['ledger-corrections', 'manual-journals'],
        maintainerNotes: [
            'ledgerBooks.js → countEntriesNotInBooks, listEntriesNotInBooks',
            'accountingDashboard.js → withBooksAlert, booksAlertOf',
            'dashboardData.tsx → ledgerEntryTab → accountingLedgerPath(kind, profileId, tab)',
        ],
        lastReviewed: '2026-10-20',
    }),
    entry('Dashboard', 'Alerts', 'Go-live date not set', {
        question: 'What does the Go-live date not set alert mean?',
        answer: 'No accounting go-live date has been set, so every count and amount on this portal reads zero and no other alert can fire. The go-live date is the first day the portal accounts from; Set go-live date opens the form on the dashboard.',
        whenMissing: 'Not shown once the date is set.',
        concepts: ['go-live-floor', 'go-live-baseline'],
        maintainerNotes: [
            'accountingDashboard.js → buildAlerts goLiveConfigured === false',
            'GoLiveCard.tsx → ?setGoLive=1 opens the drawer',
        ],
        lastReviewed: '2026-10-20',
    }),
    entry('Dashboard', 'Alerts', 'Journal recording off', {
        question: 'What does the Journal recording off alert mean?',
        answer: 'Two switches are checked: the portal-wide pause on journal recording, and each switched-on vendor service whose own journal recording is turned off. While either is off, the orders concerned are held back from the books and show as Skipped with the reason Recording paused or Service set not to post. The alert turns red while the portal-wide pause is on and names who paused it and when; each service is listed on its own. Both switches live in Settings › Service Operators, so the service link opens the service for reference.',
        whenMissing: 'Not shown while recording is on everywhere.',
        concepts: ['journal-states'],
        maintainerNotes: [
            'dashboardAlertFinders.js → findJournalRecordingOff (setting journalRecording.enabled, serviceOperators.recordJournalEntry)',
        ],
        lastReviewed: '2026-10-20',
    }),
    entry('Dashboard', 'Alerts', 'Failures share one reason', {
        question: 'What does the Failures share one reason alert mean?',
        answer: 'When three or more of today’s refused entries carry the same reason and that reason covers at least half of them, the alert says so once instead of leaving the reader to spot it across fifty orders. It almost always points at one problem in the books or in the chart of accounts, not at the orders themselves: fix that first, then post the entries again from Order Journals. Expand the alert to see every reason of the day with its count.',
        whenMissing:
            'Not shown with fewer than three refusals today or when no single reason dominates.',
        concepts: ['journal-states'],
        maintainerNotes: [
            'accountingDashboard.js → buildFailureReasonsQuery, REPEATED_REASON_MIN; buildAlerts failures_share_reason',
        ],
        lastReviewed: '2026-10-20',
    }),
    entry('Dashboard', 'Alerts', 'Entries held back today', {
        question: 'What does the Entries held back today alert mean?',
        answer: 'Entries for today’s orders that were never sent to the books, with the reason each was held: recording paused, service set not to post, commission or platform fee not confirmed, waiting for the sale entry, or could not be prepared. It is the Skipped Entries card with its reasons. Expand the alert to see each order; the link goes to the setting that holds it, Set commission or Set platform fee on the service, Post the sale for a refund waiting on its sale, or Open entry in Order Journals when the entry itself needs looking at.',
        whenMissing:
            'Not shown while nothing was held back today. Counted by the order’s date, like the Skipped Entries card.',
        concepts: ['journal-states'],
        maintainerNotes: [
            'accountingDashboard.js → buildSkippedJournalsQuery, buildSkipReasonsQuery, skipNoteOf',
            'dashboardData.tsx → heldBackIssue routes by note',
        ],
        lastReviewed: '2026-10-20',
    }),
    entry('Dashboard', 'Alerts', 'Refunds waiting for the sale', {
        question: 'What does the Refunds waiting for the sale alert mean?',
        answer: 'Refund, admin refund and cashback reversal entries held back because the original sale never reached the books, whatever the date of the order. The sale has to be in the books before its refund can follow. Post the sale opens that order’s sale entry in Order Journals; once it is posted the refund can be sent again.',
        whenMissing: 'Not shown while no refund is waiting on its sale.',
        concepts: ['journal-states'],
        maintainerNotes: [
            'accountingDashboard.js → buildRefundsWaitingQuery (reason = Transaction journal has not been recorded successfully yet)',
        ],
        lastReviewed: '2026-10-20',
    }),
    entry('Dashboard', 'Alerts', 'Partners without gateway charge', {
        question: 'What does the Partners without gateway charge alert mean?',
        answer: 'Active whitelabel partners with no gateway charge terms set, so no charge comes off Peko’s earnings before the partner’s share is worked out. Set charge terms opens the partner’s configuration on Whitelabel Partners, the same form as the share percentage.',
        whenMissing: 'Not shown while every active partner has charge terms.',
        concepts: ['partner-share'],
        maintainerNotes: ['accountingDashboard.js → findPartnersMissing({ gatewayCharge: null })'],
        lastReviewed: '2026-10-20',
    }),
    entry('Dashboard', 'Alerts', 'Vendors without GST details', {
        question: 'What does the Vendors without GST details alert mean?',
        answer: 'Vendors tied to a switched-on vendor service whose state or GST number is blank. The GST on a vendor’s commission is split into CGST and SGST when the vendor is in Peko’s state and booked as IGST otherwise, so without the state the split cannot be decided and the entry may be refused. Expand the alert to see each vendor with what is missing and the services concerned; Edit vendor opens the service’s Vendor tab where the details are kept.',
        whenMissing: 'Not shown while every such vendor has both details.',
        concepts: ['gst-split'],
        maintainerNotes: [
            'dashboardAlertFinders.js → findVendorsWithoutGstDetails (vendors.state, vendors.gstNo)',
        ],
        lastReviewed: '2026-10-20',
    }),
    entry('Dashboard', 'Alerts', 'Chart of accounts stuck pending', {
        question: 'What does the Chart of accounts stuck pending alert mean?',
        answer: 'Accounts whose last create or update has been pending with the books for more than a day. The books normally confirm within minutes, so a day-old pending state means the request never completed and entries that need the account may be refused. Open account finds it on the Chart of Accounts page, where saving it again resends it.',
        whenMissing: 'Not shown while no account has been pending for over a day.',
        concepts: [],
        maintainerNotes: [
            'dashboardAlertFinders.js → findChartOfAccountsPending (syncStatus CREATE_PENDING / UPDATE_PENDING, updatedAt older than 24 h)',
        ],
        lastReviewed: '2026-10-20',
    }),
    entry('Dashboard', 'Alerts', 'Peko packages without pricing', {
        question: 'What does the Peko packages without pricing alert mean?',
        answer: 'Subscription plans, including partner plans, and the packages of Peko’s own services such as Peko Commerce that are active but carry neither a monthly nor an annual price, so a sale of them would post with no revenue figure. Expand the alert to see each package and whose it is; Set pricing opens Peko Subscriptions with the package searched. A price of zero counts as set.',
        whenMissing: 'Not shown while every active plan and Peko package has a price.',
        concepts: [],
        maintainerNotes: [
            'dashboardAlertFinders.js → findPekoPackagesWithoutPricing (packages.type 1, type 2 with accessCode in peko_service_subscriptions, packagePrices.monthly / annually)',
            'PekoSubscriptions.tsx → ?tab=&search= params',
        ],
        lastReviewed: '2026-10-20',
    }),
    entry('Dashboard', 'Alerts', 'Approved services drifted', {
        question: 'What does the Approved services drifted alert mean?',
        answer: 'Services approved for a partner portal, and still switched on, whose commission, platform fee, vendor, journal recording or partner share changed after the approval was given. The approval still stands, but the accounts team should look at it again. Expand the alert to see each service with what changed; Review opens Approvals on that partner, filtered to approved, with the service searched.',
        whenMissing: 'Not shown while every approved service still matches its approval.',
        concepts: ['approval-gate'],
        maintainerNotes: [
            'dashboardAlertFinders.js → findDriftedApprovals (serviceApprovalReadiness.driftOf over switched-on APPROVED units)',
        ],
        lastReviewed: '2026-10-20',
    }),
    entry('Dashboard', 'Alerts', 'Vendor advance running low', {
        question: 'What does the Vendor advance running low alert mean?',
        answer: 'Vendors whose available advance is below the low-balance threshold set for the Vendors ledger. A vendor whose advance is already exhausted, below zero, turns the alert red, because every further order is being fulfilled on credit. Expand the alert to see each vendor with its available balance; Record deposit opens the vendor’s Deposits tab.',
        whenMissing:
            'Not shown while every vendor is above the threshold. The balances are the ones the Vendors ledger list shows, from the same snapshot.',
        concepts: ['vendor-convention', 'opening-balances', 'caches'],
        maintainerNotes: [
            'dashboardAlertFinders.js → findVendorBalanceIssues (vendorLedger.getVendorLedgerSnapshot, getLowBalanceThreshold)',
        ],
        lastReviewed: '2026-10-20',
    }),
    entry('Dashboard', 'Alerts', 'Partner payable overdue', {
        question: 'What does the Partner payable overdue alert mean?',
        answer: 'Partners still owed money with no payout recorded in the last thirty days, counted from the last payout or, for a partner never paid, from their first order after go-live. Expand the alert to see each partner with what is owed and when they were last paid; Record payout opens the partner’s Payments tab.',
        whenMissing: 'Not shown while every partner owed money was paid within thirty days.',
        concepts: ['partner-share', 'caches'],
        maintainerNotes: [
            'dashboardAlertFinders.js → findPartnersOverdue (partnerLedger.getPartnerLedgerSnapshot, partnerPayouts MAX(payoutDate), FIRST_ORDER_BY_PARTNER)',
        ],
        lastReviewed: '2026-10-20',
    }),
    entry('Dashboard', 'Alerts', 'Gateway settlements short', {
        question: 'What does the Gateway settlements short alert mean?',
        answer: 'Gateway receipts recorded with an expected amount higher than what was actually received, with no fee entry linked to them to explain the difference. Either the fee the gateway kept has to be recorded against the receipt, or the receipt corrected. Expand the alert to see each receipt with the shortfall; Record fee opens the gateway’s Received & Bills tab.',
        whenMissing: 'Not shown while every short receipt has its fee recorded or was reversed.',
        concepts: ['gateway-convention'],
        maintainerNotes: [
            'dashboardAlertFinders.js → findGatewayShortfalls (paymentGatewaySettlements RECEIPT with expectedAmount > amount and no FEE on settlementId)',
        ],
        lastReviewed: '2026-10-20',
    }),
    entry('Dashboard', 'Alerts', 'Opening balances missing', {
        question: 'What does the Opening balances missing alert mean?',
        answer: 'Vendors, partners and payment gateways that had successful orders before the go-live date but have no opening balance entry, so their ledgers start from zero instead of from what was really held or owed on that day. Expand the alert to see each profile with how many orders it had before go-live; Set opening balance opens the tab where the opening entry is recorded: Deposits for a vendor, Payments for a partner, Received & Bills for a gateway.',
        whenMissing:
            'Not shown until the go-live date is set, and not for a profile with no order before it or with an opening balance already recorded.',
        concepts: ['opening-balances', 'go-live-floor'],
        maintainerNotes: [
            'dashboardAlertFinders.js → findOpeningBalancesMissing (VENDORS_BEFORE_GO_LIVE, PARTNERS_BEFORE_GO_LIVE, gatewaysBeforeGoLiveQuery; OPENING entries)',
        ],
        lastReviewed: '2026-10-20',
    }),
];

// ---------------------------------------------------------------------------------------
// Vendors
// ---------------------------------------------------------------------------------------
const VENDORS: FaqEntry[] = [
    entry('Vendors', 'KPIs', 'Total Vendors', {
        question: 'What is Total Vendors?',
        answer: 'Vendors with at least one service mapped to them, whatever the service’s classification. A vendor with no service has no ledger. The list underneath shows only vendors with a vendor-classified service or a service marked in Service Classification as a vendor providing a Peko subscription, so this count can be higher than the list.',
        whenMissing: COUNT,
        concepts: [],
        maintainerNotes: [
            'vendorLedger.js → buildVendorLedgerSnapshot (vendors query, no classification filter) → buildVendorKpis.totalVendors',
            'the list is listVendorsWithServices, filtered by classifiedServices.js → isListedVendorService (vendor lists + peko_subscription_vendors)',
        ],
        lastReviewed: '2026-10-27',
    }),
    entry('Vendors', 'KPIs', 'Deposits Held', {
        question: 'What is Deposits Held?',
        answer: 'Every vendor’s available balance added up. Each balance is the advance held with the vendor: deposits (including the opening balance), plus commissions recorded by hand and debit notes raised on the vendor, less credit notes and cost of sales recorded by hand, less what orders sold on margin took out of the advance net of refunds — the vendor payable on orders sold on margin. Peko’s commission on an order never touches it, and an order sold on a markup basis, agent or principal, never comes out of the advance: the vendor bills Peko for it and the bill is recorded as cost of sales.',
        formula:
            'Deposits held = sum over vendors of (Deposited + Commissions recorded by hand + Debit notes raised on the vendor − Credit notes − Cost of sales recorded by hand − Payable net of refunds on margin orders)',
        lastReviewed: '2026-10-21',
        whenMissing: 'Adds every vendor’s balance.',
        concepts: ['vendor-convention', 'caches'],
        maintainerNotes: ['vendorLedger.js → buildVendorKpis'],
    }),
    entry('Vendors', 'KPIs', 'Low Balance Vendors', {
        question: 'What is Low Balance Vendors?',
        answer: 'Vendors whose available balance has fallen below the low-balance threshold set for the portal.',
        whenMissing: COUNT,
        concepts: ['vendor-convention'],
        maintainerNotes: [
            'vendorLedger.js → getLowBalanceThreshold',
            'settings.vendorLowBalanceThreshold',
        ],
    }),
    entry('Vendors', 'KPIs', 'Open Credit Notes', {
        question: 'What is Open Credit Notes?',
        answer: 'Credit notes recorded by hand against vendors that are still live: not reversed and not deleted, across every vendor and date. The commission that came back with a refund, listed as From refund on the Credit Notes tab, is read off the order and is not counted.',
        lastReviewed: '2026-10-20',
        whenMissing: COUNT,
        concepts: [],
        maintainerNotes: ['vendorLedgerEntries.js → countOpenEntries'],
    }),
    entry('Vendors', 'KPIs', 'Deposited This Month', {
        question: 'What is Deposited This Month?',
        answer: 'Deposits dated this month so far (Indian time), across every vendor, net of any reversed; a deleted deposit drops out at once. An opening balance dated inside the month counts here too.',
        lastReviewed: '2026-10-20',
        whenMissing: RECORDED_ONLY,
        concepts: ['go-live-floor'],
        maintainerNotes: ['vendorDeposits.js → sumDepositsInRange'],
    }),
    entry('Vendors', 'KPIs', 'Used This Month', {
        question: 'What is Used This Month?',
        answer: 'What vendor orders dated this month took out of the advances, net of refunds, less the commissions recorded by hand this month, plus the cost of sales recorded by hand this month, less the debit notes raised on the vendor this month. The order side is the vendor payable on orders sold on margin; an order sold on a markup basis never comes out of the advance. Peko’s commission on the orders is added in and taken out again, so it nets to nothing. A refund is netted against the month of the order it refunds, not the month it was processed.',
        formula:
            'Used this month = Payable net of refunds on margin orders − Commissions recorded by hand + Cost of sales recorded by hand − Debit notes raised on the vendor',
        whenMissing: LINES_ONLY,
        concepts: ['vendor-convention', 'lists-vs-totals'],
        maintainerNotes: ['vendorLedger.js → buildVendorLedgerSnapshot → monthly.used'],
        lastReviewed: '2026-10-21',
    }),
    entry('Vendors', 'KPIs', 'Commission This Month', {
        question: 'What is Commission This Month?',
        answer: 'The commission Peko kept on vendor orders this month, including GST, less the part refunds took back, plus commissions recorded by hand. An order whose entry the books refused still worked out its commission and counts.',
        whenMissing: NOTHING_TO_ADD,
        concepts: ['vendor-convention', 'gst-split', 'lists-vs-totals'],
        maintainerNotes: [
            'vendorLedger.js → buildVendorSplitQuery, buildVendorReversalQuery',
            'vendorLedgerEntries.js → sumManualEntriesInRange',
        ],
        lastReviewed: '2026-10-21',
    }),
    entry('Vendors', 'List', 'Vendor', {
        question: 'What is shown under Vendor?',
        answer: 'The vendor’s name and the services mapped to it that are classified as vendor services or as a vendor providing a Peko subscription. A Peko-own service subscription mapped to the same vendor is not listed. Only orders of vendor-classified services are on this ledger: a vendor listed because it provides a Peko subscription shows no orders, and is here for the deposits and other entries recorded by hand.',
        whenMissing: RAW,
        concepts: [],
        maintainerNotes: [
            'vendors.vendorName',
            'serviceOperators.vendorId',
            'classifiedServices.js → isListedVendorService for the list and the header, isVendorService for every movement',
        ],
        lastReviewed: '2026-10-27',
    }),
    entry('Vendors', 'List', 'Type', {
        question: 'What is the vendor type?',
        answer: 'The vendor’s category as recorded on the vendor.',
        whenMissing: RAW,
        concepts: [],
        maintainerNotes: ['vendors.type'],
    }),
    entry('Vendors', 'List', 'Deposited', {
        question: 'What is Deposited on the list?',
        answer: 'Deposits recorded for the vendor, including its opening balance, net of any reversed.',
        whenMissing: RECORDED_ONLY,
        concepts: ['vendor-convention', 'opening-balances'],
        maintainerNotes: ['vendorDeposits.js → sumActiveDepositsByVendor'],
    }),
    entry('Vendors', 'List', 'Used', {
        question: 'What is Used on the list?',
        answer: 'What the vendor’s orders took out of the advance since go-live, net of refunds, plus every commission: the vendor payable on orders sold on margin, plus Peko’s commission on those orders (including GST, less what refunds took back) and the commissions recorded by hand. Peko’s markup is not in it. It is an all-time figure; the vendor’s own page shows Total Transaction for a period instead, which leaves out commissions recorded by hand, adds credit notes and cost of sales and takes off debit notes.',
        formula:
            'Used = Payable net of refunds on margin orders + Commission on orders (incl. GST, net of reversals) + Commissions recorded by hand',
        whenMissing: LINES_ONLY,
        concepts: ['vendor-convention', 'lists-vs-totals'],
        maintainerNotes: ['vendorLedger.js → buildVendorLedgerSnapshot'],
        lastReviewed: '2026-10-21',
    }),
    entry('Vendors', 'List', 'Available Balance', {
        question: 'What is Available Balance?',
        answer: 'The advance still held with the vendor: deposits (including the opening balance) plus commissions recorded by hand and debit notes raised on the vendor, less credit notes and cost of sales recorded by hand, less what orders sold on margin took out net of refunds. It is not Deposited less Used: Peko’s commission on an order sits inside Used but never leaves the advance, so it is not deducted here, and credit notes and cost of sales are deducted here, and debit notes added, while none of them is in Used. It is flagged when it falls below the low-balance threshold.',
        formula:
            'Available = Deposited + Commissions recorded by hand + Debit notes raised on the vendor − Credit notes − Cost of sales recorded by hand − Payable net of refunds on margin orders',
        whenMissing: 'Worked out; reads zero for a vendor with nothing recorded.',
        lastReviewed: '2026-10-21',
        concepts: ['vendor-convention'],
        maintainerNotes: ['vendorLedger.js → buildPosition'],
    }),
    entry('Vendors', 'List', 'Status', {
        question: 'What is the vendor status?',
        answer: 'Healthy, Low balance (below the threshold) or Inactive.',
        whenMissing: RAW,
        concepts: [],
        maintainerNotes: ['pages/VendorLedgerList.tsx → vendor status pill'],
    }),
    entry('Vendors', 'Summary', 'Opening Balance', {
        question: 'What is Opening Balance?',
        answer: 'The vendor balance through the day before the selected period starts, including the configured opening balance and earlier ledger activity.',
        formula:
            'Opening balance = Deposits (incl. the opening balance) + Commissions recorded by hand + Debit notes raised on the vendor − Credit notes − Cost of sales recorded by hand − Payable net of refunds on margin orders, everything dated before the period',
        whenMissing:
            'Worked out; zero when nothing is dated before the period or no opening balance is set (an alert says so).',
        concepts: ['vendor-convention', 'opening-balances'],
        maintainerNotes: [
            'vendorLedger.js → getVendorLedgerSummary: loadVendorPosition over 1970-01-01 to the day before range.from, then prior.available',
            'the statement’s opening is vendorStatement.js → openingBalanceFor and can differ: it dates refunds by the refund event',
        ],
        lastReviewed: '2026-10-21',
    }),
    entry('Vendors', 'Summary', 'Deposit', {
        question: 'What is Deposit?',
        answer: 'Deposits recorded for this vendor in the selected period, net of any reversed; a deleted deposit drops out at once. An opening balance dated inside the period counts here rather than in Opening Balance.',
        lastReviewed: '2026-10-20',
        whenMissing: RECORDED_ONLY,
        concepts: ['vendor-convention'],
        maintainerNotes: ['vendorDeposits.js → sumActiveDeposits'],
    }),
    entry('Vendors', 'Summary', 'Total Transaction', {
        question: 'What is Total Transaction?',
        answer: 'The vendor-side value of the orders sold on margin and dated in the period — the vendor payable and Peko’s commission including GST — net of refunds, plus credit notes and cost of sales recorded by hand, less debit notes raised on the vendor, net of reversals. An order sold on a markup basis, agent or principal, does not count: it never comes out of the advance; the vendor’s bill for it does, as cost of sales. A refunded payable is netted against the period of the order it refunds; the commission a refund takes back is netted in the period of the refund.',
        formula:
            'Total transaction = (Payable + Commission incl. GST) on margin orders in the period, net of refunds + Credit notes and cost of sales net of reversals − Debit notes net of reversals',
        whenMissing: LINES_ONLY,
        concepts: ['vendor-convention', 'lists-vs-totals'],
        maintainerNotes: ['vendorLedger.js → sumVendorMovements (notMarkupSale), buildPosition'],
        lastReviewed: '2026-10-26',
    }),
    entry('Vendors', 'Summary', 'Commission earned', {
        question: 'What is Commission earned?',
        answer: 'What Peko kept on this vendor’s orders in the period, including GST, less the part refunds took back, plus commissions recorded by hand. Counts every order whose entry reached the books, posted or refused; a skipped or never recorded entry adds nothing.',
        whenMissing: NOTHING_TO_ADD,
        concepts: ['vendor-convention', 'gst-split', 'lists-vs-totals'],
        maintainerNotes: ['vendorLedger.js → sumVendorSplitTotals'],
        lastReviewed: '2026-10-21',
    }),
    entry('Vendors', 'Summary', 'Available', {
        question: 'What is Available?',
        answer: 'The closing balance at the end of the selected period.',
        formula: 'Available = Opening Balance + Deposit − Total Transaction + Commission earned',
        whenMissing: 'Worked out from the period figures above.',
        concepts: ['vendor-convention'],
        maintainerNotes: [
            'vendorLedger.js → getVendorLedgerSummary (opening + deposited − totalTransaction + commission; equals buildPosition.available of the period plus the opening)',
        ],
        lastReviewed: '2026-10-20',
    }),
    tabEntry(
        'Vendors',
        'Transactions',
        'Every order placed for this vendor’s services, with what the vendor is owed and what Peko kept on each, and a tag under the reference saying how it was sold: Margin, Agent Markup or Principal Markup (an order with items sold both ways carries two). Orders sold on a markup basis, agent or principal, are listed at the vendor’s price with Peko’s markup before GST beside them, but they never come out of the advance and never reach the statement: the vendor bills Peko for them and the bill is recorded as cost of sales. Principal sales also appear on Other Sales. Peko’s own service subscriptions, such as Peko Commerce, are never listed here or counted in the balance; they are listed under Peko Subscriptions.',
        ['vendor-convention', 'journal-states'],
        '2026-10-26'
    ),
    tabEntry(
        'Vendors',
        'Commissions',
        'The commission Peko earned on each order, what a refund took back, and commissions recorded by hand. A sale made wholly as principal earns no commission and is not listed; an order with items sold both ways is listed for the commission on its margin items, with the markup on its principal items beside it under Principal Markup, and a few older principal sales whose entry kept a commission are listed for it. An agent markup is booked as commission by the order’s accounting entry, so an agent-markup order is listed here for it even though the Transactions tab shows it as markup.',
        ['vendor-convention', 'gst-split'],
        '2026-10-26'
    ),
    tabEntry(
        'Vendors',
        'Cost of Sales',
        'Cost of sales entries recorded by hand for this vendor: the mirror of a commission recorded by hand. Each comes out of the advance held with the vendor, like an order or a credit note, and sits on the credit side of the statement; it is counted in Total Transaction and never in Commission earned. This is where the vendor’s bills for orders sold on a markup basis are recorded, since those orders never come out of the advance themselves; a wrong entry is put right with a debit note. Nothing is read off orders here, and Peko prepares no tax document for it.',
        ['vendor-convention', 'gst-split'],
        '2026-10-26'
    ),
    tabEntry(
        'Vendors',
        'Debit Notes',
        'Debit notes raised on this vendor by hand: the mirror of a cost of sales. Each puts money back into the advance, sits on the debit side of the statement and comes off Total Transaction. Use one when a cost of sales entry turns out to be wrong or the vendor’s bill is disputed. Peko prepares no tax document for it.',
        ['vendor-convention', 'gst-split'],
        '2026-10-26'
    ),
    tabEntry(
        'Vendors',
        'Deposits',
        'Money Peko paid the vendor in advance, and the opening balance the ledger started from.',
        ['vendor-convention', 'opening-balances']
    ),
    tabEntry(
        'Vendors',
        'Credit Notes',
        'Value the vendor gave back, recorded by hand with or without the order it relates to, and beside them the commission that came back with every refund, read off the order’s accounting entry and marked From refund. Only the hand-recorded notes reduce the balance here; the refund rows are already netted in Commission earned.',
        ['vendor-convention'],
        '2026-10-20'
    ),
    ...common('Vendors', 'Transactions', ['Date', 'Service', 'Customer', 'Status', 'Posted']),
    entry('Vendors', 'Transactions', 'Reference', {
        question: 'What is the reference, and the tag under it?',
        answer: 'The order’s transaction id, with a tag saying how the order was sold. Margin: the vendor sold to the customer and Peko kept a commission out of the collection, with the vendor owed the rest from the advance. Agent Markup: Peko sold at the vendor’s price plus its own markup, booked as commission. Principal Markup: Peko sold in its own name at its own price. An order with items sold both ways carries both Margin and Principal Markup. Only a Margin order, or the margin part of a mixed one, comes out of the advance; the markup kinds are listed here but settled through cost of sales when the vendor bills Peko.',
        whenMissing:
            'The id is always shown. The tag follows the order’s own breakdown when it has one, else how the service is set to be sold today.',
        concepts: ['vendor-convention'],
        maintainerNotes: [
            'sellingMode.js → sellingModeOf / sellingModeSql: journal commissionMode → journal evidence → operator; a margin-shaped order of an AGENT_MARKUP operator reads as AGENT_MARKUP',
            'components/ledgers/vendorColumns.tsx → sellingModeTags',
        ],
        lastReviewed: '2026-10-26',
    }),
    entry('Vendors', 'Transactions', 'Vendor Amount', {
        question: 'What is Vendor Amount on a vendor transaction?',
        answer: 'What the order was worth on the vendor’s side, before Peko’s markup: on a margin order the vendor payable plus Peko’s commission; on an agent-markup order the vendor’s price; on a principal sale the vendor’s price for the goods; on an order with items sold both ways, all of those together. Only the margin part comes out of the advance. It is never what the customer paid — that belongs to the subscriber ledger.',
        formula:
            'Vendor amount = Vendor payable + Commission (incl. GST) + Vendor’s price on items sold as principal',
        whenMissing: DASH,
        concepts: ['vendor-convention'],
        maintainerNotes: ['vendorLedger.js → vendorAmountsFromJournal'],
        lastReviewed: '2026-10-26',
    }),
    entry('Vendors', 'Transactions', 'Commission (incl. VAT)', {
        question: 'What is Commission (incl. VAT)?',
        answer: 'What Peko kept on this order as commission, including tax, on a margin sale. On an order with items sold both ways it is the commission on the margin items only; the margin on the principal items is the Markup beside it, so one row can show both. Blank on an order sold on a markup basis, agent or principal: there Peko’s margin is a markup, shown in its own column, not a commission.',
        whenMissing: DASH,
        concepts: ['gst-split'],
        maintainerNotes: ['journalData.commissionIncludingGST'],
        lastReviewed: '2026-10-26',
    }),
    entry('Vendors', 'Transactions', 'Markup', {
        question: 'What is Markup on a vendor transaction?',
        answer: 'Peko’s markup on an order sold on a markup basis, before GST — the net markup. On a principal sale it is the margin on the items Peko sold in its own name; on an agent-markup order it is the markup Peko added to the vendor’s price, which the order’s accounting entry books as commission. The markup sits on top of the Vendor Amount and never touches the advance. On an order with items sold both ways it covers the principal items only, while Commission (incl. VAT) holds the commission on the margin items, so one row can show both. Blank on an order sold wholly on margin. Other Sales shows the same markup with its GST on top.',
        formula: 'Markup = Markup before GST',
        whenMissing: DASH,
        concepts: ['vendor-convention', 'gst-split'],
        maintainerNotes: [
            'vendorLedger.js → vendorAmountsFromJournal: principalCommissionExcludingGST (plus commissionExcludingGST on an order sold wholly as principal); commissionExcludingGST on an AGENT_MARKUP order',
            'otherSales.js → MARKUP_SELECT still adds outputGSTonPrincipalCommission',
        ],
        lastReviewed: '2026-10-26',
    }),
    entry('Vendors', 'Transactions', 'Payable', {
        question: 'What is Payable?',
        answer: 'What the vendor is owed for this order out of the advance, on a margin sale. Blank on an order sold on a markup basis, agent or principal: nothing comes out of the advance for it. The vendor bills Peko for such orders and the bill is recorded on the Cost of Sales tab, which is what then comes out of the advance.',
        whenMissing: DASH,
        concepts: ['vendor-convention'],
        maintainerNotes: [
            'journalData.vendorPayable, null unless sellingModeOf is MARGIN or MIXED',
        ],
        lastReviewed: '2026-10-26',
    }),
    ...common('Vendors', 'Commissions', ['Date', 'Entry No.', 'Source', 'Recorded By']),
    entry('Vendors', 'Commissions', 'Service', {
        question: 'What is the service on a commission row?',
        answer: 'For an order, the service it was placed for. For a commission recorded by hand, the reason typed on it, or “Recorded by hand” when none was given.',
        whenMissing: 'Never blank on this tab.',
        concepts: [],
        maintainerNotes: [
            'components/ledgers/vendorColumns.tsx → commissionColumns Service: service, else reason, else the fixed text',
        ],
        lastReviewed: '2026-10-20',
    }),
    entry('Vendors', 'Commissions', 'Status', {
        question: 'What does the status mean on a commission row?',
        answer: 'For an order: Earned, or Refunded when part of its commission came back with a refund (the Reversed column shows how much). For a commission recorded by hand: Active; Reversal on the reversing entry, naming the reference it reverses; Reversed, with who reversed it and why; or Deleted, with who deleted it and why, until it is marked removed from the books.',
        whenMissing: RECORD,
        concepts: ['ledger-corrections'],
        maintainerNotes: [
            'components/ledgers/vendorColumns.tsx → commissionEntryPill',
            'vendorLedger.js → serializeCommission: refunded = reversed > 0; COMMISSION_STATUS_FILTERS',
        ],
        lastReviewed: '2026-10-20',
    }),
    entry('Vendors', 'Commissions', 'In Books', IN_BOOKS_WITH_ORDERS),
    entry('Vendors', 'Commissions', 'Order Ref', {
        question: 'What is Order Ref?',
        answer: 'The order’s transaction id. On a commission recorded by hand it is the order the commission was recorded against, when one was given.',
        whenMissing: 'Shows a dash on a commission recorded by hand with no order given.',
        concepts: [],
        maintainerNotes: ['orders.corporateTxnId', 'vendorLedgerEntries.againstCorporateTxnId'],
        lastReviewed: '2026-10-27',
    }),
    entry('Vendors', 'Commissions', 'Order Value', {
        question: 'What is Order Value?',
        answer: 'Vendor payable plus commission, plus the vendor’s price on any items sold as principal — the same figure as Vendor Amount on the Transactions tab, except on the few older principal sales listed here, where it also includes the commission their entry kept and the Transactions tab shows that under Markup. Blank for a commission recorded by hand.',
        formula:
            'Order value = Vendor payable + Commission (incl. GST) + Vendor’s price on items sold as principal',
        whenMissing: DASH,
        concepts: ['vendor-convention'],
        maintainerNotes: ['vendorLedger.js → serializeCommission'],
        lastReviewed: '2026-10-20',
    }),
    entry('Vendors', 'Commissions', 'Commission (excl. GST)', {
        question: 'What is Commission (excl. GST)?',
        answer: 'Peko’s commission on the order before GST. For an entry recorded by hand it is the taxable value: the figure typed when it was entered without GST, or that figure with the GST carved out when it was entered with GST. Older entries show their full amount here.',
        whenMissing: DASH,
        concepts: ['gst-split'],
        maintainerNotes: [
            'journalData.commissionExcludingGST',
            'vendorLedgerEntries.taxableAmount, else amount',
        ],
        lastReviewed: '2026-10-13',
    }),
    entry('Vendors', 'Commissions', 'GST', {
        question: 'What is the GST on a commission row?',
        answer: 'The GST part of the commission: the difference between Commission (incl. GST) and Commission (excl. GST). For an entry recorded by hand it is the GST kept on the entry, at the rate in force when it was recorded.',
        whenMissing:
            'Shows a dash when the order’s accounting entry was skipped or never recorded, and on an entry recorded by hand before the split was kept.',
        concepts: ['gst-split'],
        maintainerNotes: [
            'vendorLedger.js → commissionGstOf: journal commissionIncludingGST − commissionExcludingGST; vendorLedgerEntries.gstAmount for a manual row',
        ],
        lastReviewed: '2026-10-26',
    }),
    entry('Vendors', 'Commissions', 'Commission (incl. GST)', {
        question: 'What is Commission (incl. GST)?',
        answer: 'Peko’s commission on the order including GST — the figure that reaches the balance. For an entry recorded by hand it is the total: the figure typed when it was entered with GST, or that figure plus GST at the rate in force when it was recorded.',
        whenMissing: DASH,
        concepts: ['gst-split'],
        maintainerNotes: ['journalData.commissionIncludingGST', 'vendorLedgerEntries.amount'],
        lastReviewed: '2026-10-13',
    }),
    entry('Vendors', 'Commissions', 'Principal Markup', {
        question: 'What is Principal Markup on a commission row?',
        answer: 'Peko’s margin on the items of this order that it sold as principal, before GST — the same figure as Markup on the Transactions tab. Only an order with items sold both ways shows it here: its margin items earn the commission in the columns beside it, and its principal items earn this markup, which is booked as sales, never as commission, so it is not part of Commission, Reversed or Net.',
        formula: 'Principal markup = Markup before GST',
        whenMissing:
            'Shows a dash on an order sold wholly on margin, on a commission recorded by hand, and on the few older principal sales listed here, whose entry kept the margin as commission.',
        concepts: ['vendor-convention', 'gst-split'],
        maintainerNotes: [
            'vendorLedger.js → serializeCommission: principalCommissionExcludingGST',
            'the same reading as the Transactions tab Markup on a mixed order (principalMarkupOf)',
        ],
        lastReviewed: '2026-10-26',
    }),
    entry('Vendors', 'Commissions', 'Reversed', {
        question: 'What is Reversed?',
        answer: 'The share of the commission that went back with a refund, in the same proportion as the refunded part of the vendor payable.',
        formula: 'Reversed = Commission (incl. GST) × Refunded ÷ Vendor payable',
        whenMissing:
            'Shows a dash when nothing came back, on a commission recorded by hand, and when the order’s accounting entry was skipped or never recorded. An order with no vendor payable has no ratio to apply, so it never shows a reversal here even after a refund.',
        lastReviewed: '2026-10-20',
        concepts: ['vendor-convention'],
        maintainerNotes: ['vendorLedger.js → serializeCommission, REFUNDED_PER_ORDER'],
    }),
    entry('Vendors', 'Commissions', 'Net', {
        question: 'What is Net?',
        answer: 'Commission including GST less what was reversed.',
        formula: 'Net = Commission (incl. GST) − Reversed',
        whenMissing: DASH,
        concepts: [],
        maintainerNotes: ['vendorLedger.js → serializeCommission'],
    }),
    ...common('Vendors', 'Deposits', [
        'Date',
        'Entry No.',
        'Reference',
        'Mode',
        'Note',
        'Slip',
        'Recorded By',
        'Status',
        'In Books',
    ]),
    entry('Vendors', 'Deposits', 'Amount', {
        question: 'What is the deposit amount?',
        answer: 'The amount Peko paid the vendor in advance, as recorded. An opening balance row is the advance already held as at its date; a reversal shows the same amount taken back.',
        whenMissing: RECORD,
        concepts: ['vendor-convention', 'opening-balances'],
        maintainerNotes: ['vendorDeposits.amount'],
    }),
    ...common('Vendors', 'Credit Notes', ['Date', 'Entry No.', 'Recorded By']),
    entry('Vendors', 'Credit Notes', 'Source', {
        question: 'What is the source of a credit note row?',
        answer: 'Manual: a credit note recorded by hand. From refund: the share of Peko’s commission that came back with a refund on one of this vendor’s orders, read off the order’s accounting entry rather than recorded; it cannot be edited, reversed or deleted here.',
        whenMissing: RECORD,
        concepts: ['vendor-convention'],
        maintainerNotes: [
            'components/ledgers/vendorColumns.tsx → entrySourcePill',
            'vendorLedger.js → listCommissionReversals (source AUTO)',
        ],
        lastReviewed: '2026-10-20',
    }),
    entry('Vendors', 'Credit Notes', 'Status', {
        question: 'What does the status mean on a credit note row?',
        answer: 'For a credit note recorded by hand: Active; Reversal on the reversing entry; Reversed, with who reversed it and why; or Deleted, with who deleted it and why, until it is marked removed from the books. A From refund row always reads Active.',
        whenMissing: RECORD,
        concepts: ['ledger-corrections'],
        maintainerNotes: [
            'components/ledgers/vendorColumns.tsx → depositEntryPill (shared with Deposits)',
            'vendorLedgerFilters.js → creditNoteStatusOf',
        ],
        lastReviewed: '2026-10-20',
    }),
    entry('Vendors', 'Credit Notes', 'In Books', IN_BOOKS_WITH_ORDERS),
    entry('Vendors', 'Credit Notes', 'Against Order', {
        question: 'What is Against Order?',
        answer: 'The transaction id of the order the credit note was raised against, when one was given. A From refund row always carries the refunded order.',
        lastReviewed: '2026-10-20',
        whenMissing: 'Shows a dash when no order was given.',
        concepts: [],
        maintainerNotes: ['vendorLedgerEntries.againstCorporateTxnId'],
    }),
    entry('Vendors', 'Credit Notes', 'Reason', {
        question: 'What is the reason?',
        answer: 'Why the credit note was raised, as typed when it was recorded. A From refund row reads “Commission reversed on” followed by the service. A reversed or deleted note shows the reason and who did it underneath.',
        lastReviewed: '2026-10-20',
        whenMissing: RECORD,
        concepts: [],
        maintainerNotes: ['vendorLedgerEntries.reason'],
    }),
    entry('Vendors', 'Credit Notes', 'Taxable Amount', {
        question: 'What is the taxable amount on a credit note row?',
        answer: 'The note before GST: the figure typed when it was recorded without GST, or the figure typed with GST less the GST carved out of it. A manual reversal shows the same amount taken back.',
        whenMissing:
            'Shows a dash on a note recorded before the split was kept, and on every From refund row, which carries no split here.',
        concepts: ['gst-split'],
        maintainerNotes: ['vendorLedgerEntries.taxableAmount', 'ledgerGst.js → splitEntryAmount'],
        lastReviewed: '2026-10-26',
    }),
    entry('Vendors', 'Credit Notes', 'Total (incl. GST)', {
        question: 'What is the total on a credit note row?',
        answer: 'The value the vendor gave back, GST included. When the note is recorded the accountant says whether the figure typed includes GST; if it does not, GST at the rate in force that day is added on top to get this total. It uses the advance the same way an order does; a reversal shows the same amount taken back. On a From refund row it is the share of Peko’s commission, GST included, that the refund took back — the Reversed figure on the Commissions tab — and it does not touch the advance again, because it is already netted in Commission earned.',
        whenMissing: RECORD,
        concepts: ['vendor-convention', 'gst-split'],
        maintainerNotes: [
            'vendorLedgerEntries.amount (total), gstInclusive, gstRate frozen at record time',
        ],
        lastReviewed: '2026-10-20',
    }),
    entry('Vendors', 'Credit Notes', 'GST', {
        question: 'What is the GST on a credit note?',
        answer: 'The GST part of the amount, at the rate in force when the note was recorded: carved out of the figure when it was typed with GST, added on top when it was typed without. The tax credit note prints the same split.',
        whenMissing:
            'Shows a dash on a note recorded before the split was kept, and on every From refund row, which carries no split here.',
        concepts: ['gst-split'],
        maintainerNotes: ['vendorLedgerEntries.gstAmount', 'ledgerGst.js → splitEntryAmount'],
        lastReviewed: '2026-10-20',
    }),
    entry('Vendors', 'Credit Notes', 'Document', {
        question: 'What is Document?',
        answer: 'The document uploaded with the credit note — the vendor’s own credit note, a scan or a screenshot — opened from the link. It is not the tax credit note Peko prepares: that is the Credit note button under Actions, which prints the GST split on a note recorded by hand and, on a From refund row, Peko’s credit note against the order’s commission invoice for the refunded share.',
        whenMissing:
            'Shows a dash when nothing was uploaded; a From refund row never has an upload.',
        concepts: ['gst-split'],
        maintainerNotes: [
            'the entry’s slipKey / slipName columns via components/ledgers/SlipLink.tsx',
            'the Actions download: vendorTaxDocuments.js → manualEntryDocument / orderCreditNoteDocument, VendorTabPanel.tsx → creditNoteActions',
        ],
        lastReviewed: '2026-10-20',
    }),
    ...common('Vendors', 'Debit Notes', ['Date', 'Entry No.', 'Recorded By', 'In Books']),
    entry('Vendors', 'Debit Notes', 'Against Order', {
        question: 'What is Against Order?',
        answer: 'The transaction id of the order the debit note relates to, when one was given.',
        whenMissing: 'Shows a dash when no order was given.',
        concepts: [],
        maintainerNotes: ['vendorLedgerEntries.againstCorporateTxnId'],
        lastReviewed: '2026-10-26',
    }),
    entry('Vendors', 'Debit Notes', 'Reason', {
        question: 'What is the reason?',
        answer: 'Why the debit note was raised, as typed. A reversed or deleted note shows the reason and who did it underneath.',
        whenMissing: RECORD,
        concepts: [],
        maintainerNotes: ['vendorLedgerEntries.reason'],
        lastReviewed: '2026-10-26',
    }),
    entry('Vendors', 'Debit Notes', 'Taxable Amount', {
        question: 'What is the taxable amount on a debit note row?',
        answer: 'The note before GST: the figure typed when it was recorded without GST, or the figure typed with GST less the GST carved out of it. A reversal shows the same amount taken back.',
        whenMissing: 'Shows a dash on a note recorded before the split was kept.',
        concepts: ['gst-split'],
        maintainerNotes: ['vendorLedgerEntries.taxableAmount', 'ledgerGst.js → splitEntryAmount'],
        lastReviewed: '2026-10-26',
    }),
    entry('Vendors', 'Debit Notes', 'Total (incl. GST)', {
        question: 'What is the total on a debit note row?',
        answer: 'The whole note, GST included: the taxable amount plus the GST beside it. When the note is recorded the accountant says whether the figure typed includes GST; if it does not, GST at the rate in force that day is added on top to get this total. This is the figure that goes back into the advance held with the vendor, the one the statement shows and the one that comes off Total Transaction; a reversal takes the same amount out again.',
        whenMissing: RECORD,
        concepts: ['vendor-convention', 'gst-split'],
        maintainerNotes: [
            'vendorLedgerEntries.amount (total), gstInclusive, gstRate frozen at record time',
            'vendorLedger.js → buildPosition adds debitNotes to available; getVendorLedgerSummary takes it off totalTransaction',
        ],
        lastReviewed: '2026-10-26',
    }),
    entry('Vendors', 'Debit Notes', 'GST', {
        question: 'What is the GST on a debit note?',
        answer: 'The GST part of the amount, at the rate in force when the note was recorded: carved out of the figure when it was typed with GST, added on top when it was typed without.',
        whenMissing: 'Shows a dash on a note recorded before the split was kept.',
        concepts: ['gst-split'],
        maintainerNotes: ['vendorLedgerEntries.gstAmount', 'ledgerGst.js → splitEntryAmount'],
        lastReviewed: '2026-10-26',
    }),
    entry('Vendors', 'Debit Notes', 'Document', {
        question: 'What is Document?',
        answer: 'The document uploaded with the debit note — the note itself, a scan or a screenshot — opened from the link. Peko prepares no tax document for a debit note on a vendor.',
        whenMissing: 'Shows a dash when nothing was uploaded.',
        concepts: [],
        maintainerNotes: [
            'the entry’s slipKey / slipName columns via components/ledgers/SlipLink.tsx',
        ],
        lastReviewed: '2026-10-26',
    }),
    entry('Vendors', 'Debit Notes', 'Status', {
        question: 'What does the status mean on a debit note row?',
        answer: 'Active; Reversal on the reversing entry; Reversed, with who reversed it and why; or Deleted, with who deleted it and why, until it is marked removed from the books.',
        whenMissing: RECORD,
        concepts: ['ledger-corrections'],
        maintainerNotes: [
            'components/ledgers/vendorColumns.tsx → depositEntryPill (shared with Deposits and Credit Notes)',
            'vendorLedgerFilters.js → creditNoteStatusOf',
        ],
        lastReviewed: '2026-10-26',
    }),
    ...common('Vendors', 'Cost of Sales', ['Date', 'Entry No.', 'Recorded By', 'In Books']),
    entry('Vendors', 'Cost of Sales', 'Against Order', {
        question: 'What is Against Order?',
        answer: 'The transaction id of the order the entry relates to, when one was given.',
        whenMissing: 'Shows a dash when no order was given.',
        concepts: [],
        maintainerNotes: ['vendorLedgerEntries.againstCorporateTxnId'],
        lastReviewed: '2026-10-21',
    }),
    entry('Vendors', 'Cost of Sales', 'Reason', {
        question: 'What is the reason?',
        answer: 'Why the entry was recorded, as typed. A reversed or deleted entry shows the reason and who did it underneath.',
        whenMissing: RECORD,
        concepts: [],
        maintainerNotes: ['vendorLedgerEntries.reason'],
        lastReviewed: '2026-10-21',
    }),
    entry('Vendors', 'Cost of Sales', 'Taxable Amount', {
        question: 'What is the taxable amount on a cost of sales row?',
        answer: 'The entry before GST: the figure typed when it was recorded without GST, or the figure typed with GST less the GST carved out of it. A reversal shows the same amount taken back.',
        whenMissing: 'Shows a dash on an entry recorded before the split was kept.',
        concepts: ['gst-split'],
        maintainerNotes: ['vendorLedgerEntries.taxableAmount', 'ledgerGst.js → splitEntryAmount'],
        lastReviewed: '2026-10-26',
    }),
    entry('Vendors', 'Cost of Sales', 'Total (incl. GST)', {
        question: 'What is the total on a cost of sales row?',
        answer: 'The whole entry, GST included: the taxable amount plus the GST beside it. When the entry is recorded the accountant says whether the figure typed includes GST; if it does not, GST at the rate in force that day is added on top to get this total. This is the figure that comes out of the advance held with the vendor, the one the statement shows and the one counted in Total Transaction, never in Commission earned; a reversal puts the same amount back.',
        whenMissing: RECORD,
        concepts: ['vendor-convention', 'gst-split'],
        maintainerNotes: [
            'vendorLedgerEntries.amount (total), gstInclusive, gstRate frozen at record time',
            'vendorLedger.js → buildPosition takes costOfSales off available like creditNotes; getVendorLedgerSummary adds it to totalTransaction',
        ],
        lastReviewed: '2026-10-21',
    }),
    entry('Vendors', 'Cost of Sales', 'GST', {
        question: 'What is the GST on a cost of sales entry?',
        answer: 'The GST part of the amount, at the rate in force when the entry was recorded: carved out of the figure when it was typed with GST, added on top when it was typed without.',
        whenMissing: 'Shows a dash on an entry recorded before the split was kept.',
        concepts: ['gst-split'],
        maintainerNotes: ['vendorLedgerEntries.gstAmount', 'ledgerGst.js → splitEntryAmount'],
        lastReviewed: '2026-10-21',
    }),
    entry('Vendors', 'Cost of Sales', 'Document', {
        question: 'What is Document?',
        answer: 'The document uploaded with the entry — a bill, a scan or a screenshot — opened from the link. Peko prepares no tax document for a cost of sales entry.',
        whenMissing: 'Shows a dash when nothing was uploaded.',
        concepts: [],
        maintainerNotes: [
            'the entry’s slipKey / slipName columns via components/ledgers/SlipLink.tsx',
        ],
        lastReviewed: '2026-10-21',
    }),
    entry('Vendors', 'Cost of Sales', 'Status', {
        question: 'What does the status mean on a cost of sales row?',
        answer: 'Active; Reversal on the reversing entry; Reversed, with who reversed it and why; or Deleted, with who deleted it and why, until it is marked removed from the books.',
        whenMissing: RECORD,
        concepts: ['ledger-corrections'],
        maintainerNotes: [
            'components/ledgers/vendorColumns.tsx → depositEntryPill (shared with Deposits and Credit Notes)',
            'vendorLedgerFilters.js → creditNoteStatusOf',
        ],
        lastReviewed: '2026-10-21',
    }),
];

// ---------------------------------------------------------------------------------------
// Subscribers
// ---------------------------------------------------------------------------------------
const SUBSCRIBERS: FaqEntry[] = [
    entry('Subscribers', 'KPIs', 'Total Subscribers', {
        question: 'What is Total Subscribers?',
        answer: 'Every corporate customer account, active or not.',
        whenMissing: COUNT,
        concepts: [],
        maintainerNotes: ['subscriberLedger.js → buildSubscriberKpis'],
    }),
    entry('Subscribers', 'KPIs', 'Cashback and Rewards', {
        question: 'What is Cashback and Rewards?',
        answer: 'Every subscriber’s wallet balance as it stands right now, added up. Wallets hold the cashback subscribers earned and the credits the team gave them, so this is the total still available for them to spend with Peko.',
        whenMissing: 'A wallet figure — it always covers the whole history.',
        concepts: ['subscriber-bases'],
        maintainerNotes: ['subscriberLedger.js → buildSubscriberKpis (walletBalancesHeld)'],
        lastReviewed: '2026-09-30',
    }),
    entry('Subscribers', 'KPIs', 'Subscribers With Balance', {
        question: 'What is Subscribers With Balance?',
        answer: 'Subscribers whose wallet balance is above zero.',
        whenMissing: COUNT,
        concepts: ['subscriber-bases'],
        maintainerNotes: ['subscriberLedger.js → buildSubscriberKpis'],
    }),
    entry('Subscribers', 'KPIs', 'GMV This Month', {
        question: 'What is GMV This Month?',
        answer: `The full value of subscribers’ successful orders this month: what they paid, by gateway and from the wallet, plus any discount Peko bore for them — ${DISCOUNT_WORDS}. The platform fee is part of what they paid, so it is included. It starts at the go-live date.`,
        formula: 'GMV = Paid via gateway + Paid from wallet + Discount borne by Peko',
        whenMissing: 'Where no accounting entry exists, the amount charged on the order is used.',
        concepts: ['go-live-floor', 'subscriber-bases'],
        maintainerNotes: [
            'journalPosting.js → gmvOfOrder (shared with the dashboard and the partner ledger)',
            'journalData.paymentThroughGateway + paymentThroughWallet + couponTotalDiscount, else orders.amountInINR',
        ],
        lastReviewed: '2026-10-20',
    }),
    entry('Subscribers', 'KPIs', 'Cashbacks Spent This Month', {
        question: 'What is Cashbacks Spent This Month?',
        answer: 'Cashback and credits that subscribers spent from their wallets on purchases this month, less refunds put back into the wallets.',
        formula: 'Cashbacks spent = Wallet purchases − Refunds to the wallet',
        whenMissing: 'A wallet figure.',
        concepts: ['subscriber-bases'],
        maintainerNotes: ['subscriberLedger.js → POSITION_SELECT (purchases − refunds)'],
        lastReviewed: '2026-09-30',
    }),
    entry('Subscribers', 'KPIs', 'Platform Fee This Month', {
        question: 'What is Platform Fee This Month?',
        answer: 'The platform fee on successful orders this month, including GST — the same figure as Platform Fee on a subscriber’s summary, across every subscriber. Only orders whose accounting entry reached the books count, posted or refused, and it starts at the go-live date. The fee is read from the entry, or from the order itself where the entry carries no split.',
        whenMissing:
            'Adds nothing for an order whose accounting entry was skipped or never recorded, even though the fee is charged on the order itself.',
        concepts: ['journal-states', 'lists-vs-totals', 'go-live-floor'],
        maintainerNotes: [
            'subscriberLedger.js → buildSubscriberKpis reads ORDER_TOTALS_SELECT (platformFee, gated on SALE_REACHED_BOOKS)',
            'subscriberLedger.js → PLATFORM_FEE_OF_ORDER',
        ],
        lastReviewed: '2026-10-20',
    }),
    entry('Subscribers', 'KPIs', 'Cashbacks Provided This Month', {
        question: 'What is Cashbacks Provided This Month?',
        answer: 'Cashback credited to subscribers’ wallets on their purchases this month, less cashback taken back on refunds. Credits made by the team are not counted here; they show in Cashback and Rewards once credited.',
        whenMissing: 'A wallet figure.',
        concepts: ['subscriber-bases'],
        maintainerNotes: [
            'subscriberLedger.js → POSITION_SELECT (cashbackEarned − cashbackReversed)',
        ],
        lastReviewed: '2026-09-30',
    }),
    entry('Subscribers', 'List', 'Subscriber', {
        question: 'What is shown under Subscriber?',
        answer: 'The company name, otherwise the contact person, otherwise the account username, with the username underneath when it differs.',
        lastReviewed: '2026-10-20',
        whenMissing: RAW,
        concepts: [],
        maintainerNotes: ['corporateUsers.name / contactPersonName', 'credentials.username'],
    }),
    entry('Subscribers', 'List', 'Partner', {
        question: 'Which partner is this?',
        answer: 'The whitelabel partner that brought the subscriber on board, or Peko (Default) when they signed up directly.',
        whenMissing: RAW,
        concepts: ['partner-share'],
        maintainerNotes: ['credentials.registeredBy'],
    }),
    entry('Subscribers', 'List', 'Plan', {
        question: 'Which plan is this?',
        answer: 'The Peko plan the subscriber is currently on, by name.',
        whenMissing: 'Shows a dash when the subscriber is not on a plan.',
        concepts: [],
        maintainerNotes: ['corporateUsers.packageId → packages.packageName'],
        lastReviewed: '2026-10-20',
    }),
    entry('Subscribers', 'List', 'Wallet Balance', {
        question: 'What is Wallet Balance on the list?',
        answer: 'The wallet balance as it stands right now.',
        whenMissing: 'A wallet figure — it always covers the whole history.',
        concepts: ['subscriber-bases'],
        maintainerNotes: ['wallets.balance'],
    }),
    entry('Subscribers', 'List', 'Status', {
        question: 'What is the subscriber status?',
        answer: 'Inactive when the account is switched off; otherwise Negative balance when the wallet is below zero, and Active when it is not.',
        whenMissing: 'Always shown.',
        concepts: ['subscriber-bases'],
        maintainerNotes: [
            'corporateUsers.isActive (missing reads as active), wallets.balance',
            'pages/SubscriberLedgerDetail.tsx → subscriberStatusPill, shared with the list',
        ],
        lastReviewed: '2026-10-20',
    }),
    entry('Subscribers', 'Summary', 'Top-ups', {
        question: 'What is Top-ups?',
        answer: 'Money added to the wallet in the period: gateway top-ups and credits made by the team.',
        whenMissing: 'A wallet figure.',
        concepts: ['subscriber-bases'],
        maintainerNotes: ['subscriberLedger.js → loadWalletPosition'],
    }),
    entry('Subscribers', 'Summary', 'Spent from Wallet', {
        question: 'What is Spent from Wallet?',
        answer: 'Purchases paid from the wallet in the period, less refunds back into it.',
        whenMissing: 'A wallet figure.',
        concepts: ['subscriber-bases'],
        maintainerNotes: ['subscriberLedger.js → loadWalletPosition'],
    }),
    entry('Subscribers', 'Summary', 'Paid via Gateway', {
        question: 'What is Paid via Gateway?',
        answer: 'The part of successful orders in the period that was paid through a gateway rather than from the wallet, as each order’s accounting entry recorded it. Only orders whose entry reached the books count, posted or refused, and the total never falls back on the gateway’s own record the way a row on Transactions can. It starts at the go-live date.',
        whenMissing: NOTHING_TO_ADD,
        concepts: ['subscriber-bases', 'lists-vs-totals', 'journal-states', 'go-live-floor'],
        maintainerNotes: [
            'subscriberLedger.js → sumOrderTotals / ORDER_TOTALS_SELECT (gated on SALE_REACHED_BOOKS)',
        ],
        lastReviewed: '2026-10-20',
    }),
    entry('Subscribers', 'Summary', 'Platform Fee', {
        question: 'What is Platform Fee?',
        answer: 'The platform fee on successful orders in the period, including GST. Only orders whose accounting entry reached the books count.',
        whenMissing: NOTHING_TO_ADD,
        concepts: ['journal-states', 'lists-vs-totals'],
        maintainerNotes: ['subscriberLedger.js → PLATFORM_FEE_OF_ORDER'],
    }),
    entry('Subscribers', 'Summary', 'Cashback', {
        question: 'What is Cashback?',
        answer: 'Cashback credited to the wallet in the period, less cashback reversed.',
        whenMissing: 'A wallet figure.',
        concepts: ['subscriber-bases'],
        maintainerNotes: ['subscriberLedger.js → loadWalletPosition'],
    }),
    entry('Subscribers', 'Summary', 'Wallet Balance', {
        question: 'What is Wallet Balance?',
        answer: 'The wallet as it stands right now, whatever period is chosen. The profile compares it with the net of every wallet movement and flags any difference above the tabs.',
        whenMissing: 'A wallet figure — it always covers the whole history.',
        concepts: ['subscriber-bases'],
        maintainerNotes: ['wallets.balance', 'subscriberLedger.js → buildSummary walletDifference'],
        lastReviewed: '2026-10-27',
    }),
    {
        ...tabEntry(
            'Subscribers',
            'Transactions',
            'Every order the subscriber placed, Peko plan and add-on payments included, with how it was paid. The payment receipt can be downloaded from the row where one was issued.',
            ['subscriber-bases', 'journal-states']
        ),
        lastReviewed: '2026-10-28',
    },
    {
        ...tabEntry(
            'Subscribers',
            'Cashbacks & Rewards',
            'Cashback earned on orders and taken back on refunds, with every other movement on the wallet: purchases paid from it, refunds into it, top-ups, and credits or withdrawals made by the team, with the balance after each.',
            ['subscriber-bases']
        ),
        lastReviewed: '2026-10-22',
    },
    {
        ...tabEntry(
            'Subscribers',
            'Bills',
            'Every invoice issued to the subscriber: the invoice for what was bought, and the separate platform fee invoice where a platform fee was charged on top of a vendor’s service. An order shows one row per invoice, each with its own number and its GST split. Payment receipts are downloaded from the Transactions tab instead.',
            ['gst-split']
        ),
        lastReviewed: '2026-10-28',
    },
    ...common('Subscribers', 'Transactions', ['Date', 'Reference', 'Service', 'Posted']),
    entry('Subscribers', 'Transactions', 'Status', {
        question: 'What does the status mean here?',
        answer: 'The order’s own payment status as the gateway left it: Success, Refunded or Failed. Unlike the vendor ledger, this tab does not check whether a refund was actually processed, so an order refunded without its status being updated still reads as the gateway left it; the Posted column and the Cashbacks & Rewards tab show the refund itself. The Status filter above the table uses the same three words.',
        whenMissing: RAW,
        concepts: ['journal-states'],
        maintainerNotes: [
            'orders.status',
            'subscriberColumns.tsx → orderStatusPill(row.status), without the refunded flag the vendor ledger passes',
            'journalPosting.js → ORDER_STATUS_FILTERS / ORDER_STATUS_LABELS',
        ],
        lastReviewed: '2026-10-20',
    }),
    entry('Subscribers', 'Transactions', 'Order Amount', {
        question: 'What is Order Amount on a subscriber transaction?',
        answer: 'What the order was worth in total, as the accounting entry recorded it: the service price with the platform fee and any add-ons, before any discount. Where the entry reached the books without that total, the amount charged on the order stands in. Peko’s own sales — a plan, an add-on, Peko Commerce or the corporate cards — never record a total, so for them it is the amount charged, which is what the subscriber paid after any discount.',
        lastReviewed: '2026-10-20',
        whenMissing:
            'A dash when the entry was skipped or never recorded, like every other amount on the row.',
        concepts: ['raw-vs-derived'],
        maintainerNotes: ['journalData.totalTransactionAmount', 'orders.amountInINR'],
    }),
    entry('Subscribers', 'Transactions', 'Discount', {
        question: 'What is Discount?',
        answer: `The discount Peko bore on the order — ${DISCOUNT_WORDS} — the part of its value the subscriber did not pay, as the accounting entry recorded it. On a vendor-service order, Order Amount less Discount is what they paid from the wallet and through the gateway together. It is booked to the coupon discount expense account whatever its source.`,
        lastReviewed: '2026-10-20',
        whenMissing: DASH,
        concepts: [],
        maintainerNotes: ['journalData.couponTotalDiscount'],
    }),
    entry('Subscribers', 'Transactions', 'Paid from Wallet', {
        question: 'What is Paid from Wallet?',
        answer: 'The part of the order paid out of the wallet: what was left of the order after the discount and the gateway payment. Peko’s own sales — a plan, an add-on, Peko Commerce or the corporate cards — record no wallet figure, so this column is a dash for them even when they were paid from the wallet; the Cashbacks & Rewards tab shows that movement.',
        formula: 'Paid from wallet = Order Amount − Discount − Paid via Gateway',
        whenMissing:
            'A dash when the entry was skipped or never recorded, and always a dash on Peko’s own sales.',
        concepts: ['subscriber-bases', 'journal-states'],
        maintainerNotes: [
            'journalData.paymentThroughWallet',
            'computeJournalData.js → walletAmount, spread only when !isPekoSale',
        ],
        lastReviewed: '2026-10-20',
    }),
    entry('Subscribers', 'Transactions', 'Paid via Gateway', {
        question: 'What is Paid via Gateway on a transaction?',
        answer: 'The part of the order paid through a gateway, as the accounting entry recorded it. If the entry reached the books without that figure, the gateway’s own record of the payment stands in.',
        whenMissing: DASH,
        concepts: ['journal-states'],
        maintainerNotes: [
            'journalData.paymentThroughGateway',
            'orders.paymentModeResponse → pgAmount',
        ],
    }),
    ...common('Subscribers', 'Cashbacks & Rewards', ['Date', 'Reference']),
    entry('Subscribers', 'Cashbacks & Rewards', 'Posted', {
        question: 'What does Posted mean on a wallet movement?',
        answer: 'Whether the accounting entry behind this movement has reached the books. A Purchase row reads the order’s sale entry and a Refund row its refund entry, with the same reasons as the Posted column on Transactions. A Cashback row reads the cashback entry and a Cashback reversal row the entry that took it back; each is its own entry, so a purchase can be posted while its cashback is not. Not applicable: a top-up, a credit or a withdrawal by the team, and any movement on an order dated before the go-live date or that no order could be matched to.',
        whenMissing: 'Every movement shows one of the three.',
        concepts: ['journal-states', 'go-live-floor'],
        maintainerNotes: [
            'subscriberStatement.js → walletLines: postingDue gates expected; keys transaction / refund / cashback / cashbackReversal',
            'subscriberWallet.js → serializeWalletMovement',
            'recordJournal.js → WALLET_JOURNAL_KEYS',
            'components/common/PostingCell.tsx',
        ],
        lastReviewed: '2026-10-20',
    }),
    entry('Subscribers', 'Cashbacks & Rewards', 'Type', {
        question: 'What kinds of wallet movement are there?',
        answer: 'Purchase is money paid from the wallet for an order. Refund is money put back into the wallet. Cashback is earned on an order and Cashback reversal is cashback taken back when that order is refunded. Top-up is money the subscriber added, and Admin credit or Admin withdrawal is money the team added or took out.',
        whenMissing: RECORD,
        concepts: ['subscriber-bases'],
        maintainerNotes: [
            'subscriberStatement.js → walletLines',
            'subscriberWallet.js → serializeWalletMovement',
        ],
        lastReviewed: '2026-09-30',
    }),
    entry('Subscribers', 'Cashbacks & Rewards', 'Particulars', {
        question: 'What is Particulars?',
        answer: 'What the movement was for: the service of the order for a purchase, refund or cashback, or the team member who added or took out the money, with the note they left underneath.',
        whenMissing: RECORD,
        concepts: [],
        maintainerNotes: [
            'serviceOperators.serviceProvider or orderResponse.serviceName',
            'transactions.providerId',
            'transactions.remarks',
        ],
        lastReviewed: '2026-09-30',
    }),
    entry('Subscribers', 'Cashbacks & Rewards', 'Debit', {
        question: 'What is Debit on the wallet?',
        answer: 'Money out of the wallet: a purchase paid from it, cashback taken back on a refund, or a withdrawal by the team.',
        whenMissing: 'Shows a dash when nothing went out.',
        concepts: ['subscriber-bases'],
        maintainerNotes: ['transactions.debitAmount, or a negative transactions.creditAmount'],
        lastReviewed: '2026-09-30',
    }),
    entry('Subscribers', 'Cashbacks & Rewards', 'Credit', {
        question: 'What is Credit on the wallet?',
        answer: 'Money into the wallet: a refund, cashback, a top-up or a credit by the team.',
        whenMissing: 'Shows a dash when nothing came in.',
        concepts: ['subscriber-bases'],
        maintainerNotes: ['transactions.creditAmount, or a negative transactions.debitAmount'],
        lastReviewed: '2026-09-30',
    }),
    entry('Subscribers', 'Cashbacks & Rewards', 'Balance After', {
        question: 'What is Balance After?',
        answer: 'The wallet balance after this movement. When a purchase and its cashback, or a refund and the cashback taken back, land together, the lower of the two lines shows the balance between them.',
        whenMissing: 'Shows a dash when the wallet recorded no balance.',
        concepts: ['subscriber-bases'],
        maintainerNotes: [
            'transactions.balance',
            'subscriberWallet.js → debitMovements balanceAfter',
        ],
        lastReviewed: '2026-09-30',
    }),
    ...common('Subscribers', 'Bills', ['Date', 'Reference', 'Service']),
    entry('Subscribers', 'Bills', 'Document', {
        question: 'What does Document say?',
        answer: 'Which invoice the row is. Invoice is the invoice for what was bought: the vendor’s service invoiced on its behalf, or Peko’s own plan or add-on. Platform Fee Invoice is Peko’s separate invoice for the platform fee charged on top of a vendor’s service. An order shows one row for each it was issued; payment receipts are downloaded from the Transactions tab instead.',
        whenMissing: 'Every row is one of the two.',
        concepts: ['gst-split'],
        maintainerNotes: [
            'orders.pekoInvoiceDetails.corporate.planInvoiceData → Invoice (agent markup: on behalf of the vendor; principal markup: Peko’s own sale)',
            'orders.pekoInvoiceDetails.corporate.invoiceData → Platform Fee Invoice when its only lines are the platform fee, else Invoice (Peko plans and add-ons)',
            'subscriberLedger.js → BILL_SOURCES, billKindOf, serializeBill (receipts dropped 2026-10-28)',
        ],
        lastReviewed: '2026-10-28',
    }),
    entry('Subscribers', 'Bills', 'Document No.', {
        question: 'What is Document No.?',
        answer: 'The invoice number printed on the invoice when it was issued. Each invoice has its own, so an order with two rows shows two numbers.',
        whenMissing: 'A dash when the stored invoice carries no number.',
        concepts: [],
        maintainerNotes: ['invoiceNumber on the stored invoice'],
        lastReviewed: '2026-10-28',
    }),
    entry('Subscribers', 'Bills', 'Taxable', {
        question: 'What is Taxable?',
        answer: 'What the invoice charges before GST, as printed on it.',
        formula: 'Taxable = Total − GST',
        whenMissing: 'A dash when the stored invoice carries no figures.',
        concepts: ['gst-split'],
        maintainerNotes: ['subtotal on the stored invoice'],
        lastReviewed: '2026-10-28',
    }),
    entry('Subscribers', 'Bills', 'GST', {
        question: 'What is GST here?',
        answer: 'The GST on the invoice as printed: IGST when the subscriber is in another state, CGST and SGST together when in Peko’s own state.',
        formula: 'GST = the tax lines on the invoice added up',
        whenMissing: 'A dash when the stored invoice carries no tax lines.',
        concepts: ['gst-split'],
        maintainerNotes: ['taxLines on the stored invoice, summed by serializeBill'],
        lastReviewed: '2026-10-28',
    }),
    entry('Subscribers', 'Bills', 'Total', {
        question: 'What is Total?',
        answer: 'What the invoice comes to with GST, as printed on it.',
        formula: 'Total = Taxable + GST',
        whenMissing: 'A dash when the stored invoice carries no figures.',
        concepts: ['gst-split'],
        maintainerNotes: ['total on the stored invoice'],
        lastReviewed: '2026-10-28',
    }),
];

// ---------------------------------------------------------------------------------------
// Partners
// ---------------------------------------------------------------------------------------
const PARTNERS: FaqEntry[] = [
    entry('Partners', 'KPIs', 'Total Partners', {
        question: 'What is Total Partners?',
        answer: 'Every whitelabel partner account.',
        whenMissing: COUNT,
        concepts: [],
        maintainerNotes: ['partnerLedger.js → listPartners'],
    }),
    entry('Partners', 'KPIs', 'Owed To Partners', {
        question: 'What is Owed To Partners?',
        answer: 'Each partner’s opening balance plus what it earned, less what was paid and less its debit notes, added up over every partner: what Peko still owes them in total.',
        formula:
            'Owed to partners = sum over partners of (Opening balance + Earned − Paid − Debit notes)',
        whenMissing: 'Adds every partner’s balance.',
        concepts: ['partner-share', 'caches'],
        maintainerNotes: [
            'partnerLedger.js → buildPartnerKpis',
            'partnerLedger.js → buildPosition',
        ],
        lastReviewed: '2026-10-20',
    }),
    entry('Partners', 'KPIs', 'Awaiting Payout', {
        question: 'What is Awaiting Payout?',
        answer: 'Partners with something still to be paid.',
        whenMissing: COUNT,
        concepts: ['partner-share'],
        maintainerNotes: ['partnerLedger.js → buildPartnerKpis'],
    }),
    entry('Partners', 'KPIs', 'No Share Configured', {
        question: 'What is No Share Configured?',
        answer: 'Partners with no share percentage set, so their customers’ orders earn them nothing.',
        whenMissing: COUNT,
        concepts: ['partner-share'],
        maintainerNotes: ['systemUsers.sharePercentage'],
    }),
    entry('Partners', 'KPIs', 'Earned This Month', {
        question: 'What is Earned This Month?',
        answer: 'The share partners earned this month so far on their customers’ orders, with refunds already taken off.',
        whenMissing: LINES_ONLY,
        concepts: ['partner-share', 'lists-vs-totals'],
        maintainerNotes: ['partnerLedger.js → sumEarned'],
        lastReviewed: '2026-09-30',
    }),
    entry('Partners', 'KPIs', 'Paid This Month', {
        question: 'What is Paid This Month?',
        answer: 'Payouts recorded this month, net of any reversed.',
        whenMissing: RECORDED_ONLY,
        concepts: [],
        maintainerNotes: ['partnerPayouts.js → sumPaidInRange'],
    }),
    entry('Partners', 'KPIs', 'GMV This Month', {
        question: 'What is GMV This Month?',
        answer: `Gross merchandise value: the full value of every successful order for all partners from the start of this month through today — what the customer paid plus any discount Peko bore, whether ${DISCOUNT_WORDS}. An order with no accounting entry counts the amount charged on it.`,
        formula:
            'GMV = sum of (Paid through gateway + Paid from wallet + Discount borne by Peko) over successful partner-customer orders in the month-to-date window',
        whenMissing: LINES_ONLY,
        concepts: ['partner-share', 'lists-vs-totals'],
        maintainerNotes: [
            'partnerLedger.js → buildPartnerGmvQuery',
            'journalPosting.js → gmvOfOrder',
        ],
        lastReviewed: '2026-10-20',
    }),
    entry('Partners', 'List', 'Partner', {
        question: 'What is shown under Partner?',
        answer: 'The partner’s name, brand and portal address.',
        whenMissing: RAW,
        concepts: [],
        maintainerNotes: ['credentials.name', 'systemUsers.branding / portalUrl'],
    }),
    entry('Partners', 'List', 'Share %', {
        question: 'What is Share %?',
        answer: 'The partner’s share percentage today. Each order carries the rate that applied when it was placed, which the tabs work back from the money.',
        whenMissing: 'Shows “Not set” when none is configured.',
        lastReviewed: '2026-10-20',
        concepts: ['partner-share'],
        maintainerNotes: ['systemUsers.sharePercentage'],
    }),
    entry('Partners', 'List', 'Earned', {
        question: 'What is Earned on the list?',
        answer: 'Everything the partner has earned to date on its customers’ orders, with refunds taken off: the share credited to it, GST included, from the go-live date, or from the day after its opening balance date when one is set. The opening balance itself is not in this figure; it is added in Left To Pay. Orders the partner placed on its own account never count as its customers’ orders.',
        formula:
            'Earned = Partner share (incl. GST) on sales that reached the books − share taken back on refunds that reached the books',
        whenMissing: LINES_ONLY,
        concepts: ['partner-share', 'opening-balances', 'go-live-floor'],
        maintainerNotes: [
            'partnerLedger.js → sumEarned, AFTER_FLOOR, IS_PARTNER_CUSTOMER',
            'credits less debits on Partnership Fee Payable across transaction / refund / adminRefund / cashback / cashbackReversal',
        ],
        lastReviewed: '2026-10-20',
    }),
    entry('Partners', 'List', 'Paid', {
        question: 'What is Paid on the list?',
        answer: 'Payouts recorded to the partner, net of any reversed. The opening balance is not a payout and is never counted here.',
        whenMissing: RECORDED_ONLY,
        concepts: ['opening-balances'],
        maintainerNotes: ['partnerPayouts.js → sumByPartnerAndKind (entryKind PAYOUT only)'],
        lastReviewed: '2026-10-20',
    }),
    entry('Partners', 'List', 'Debit Notes', {
        question: 'What is Debit Notes on the list?',
        answer: 'Debit notes raised against the partner by hand, net of any reversed. Each one takes back part of what was earned, so it reduces what is left to pay the same way a payout does.',
        whenMissing: RECORDED_ONLY,
        concepts: ['partner-share'],
        maintainerNotes: ['partnerLedgerEntries.js → sumEntriesByPartner'],
        lastReviewed: '2026-10-07',
    }),
    entry('Partners', 'List', 'Left To Pay', {
        question: 'What is Left To Pay?',
        answer: 'The opening balance plus earned, less paid and less debit notes. Red when negative: the partner has been paid more than it is owed.',
        formula: 'Left to pay = Opening balance + Earned − Paid − Debit notes',
        whenMissing: 'Worked out from the opening balance and the three figures beside it.',
        concepts: ['partner-share', 'opening-balances'],
        maintainerNotes: ['partnerLedger.js → buildPosition'],
        lastReviewed: '2026-10-20',
    }),
    entry('Partners', 'List', 'Status', {
        question: 'What is the partner status?',
        answer: 'Inactive when the partner account is switched off; otherwise No share set when no percentage is configured, Payout due when something is still owed, and Settled when nothing is.',
        whenMissing: RAW,
        concepts: [],
        maintainerNotes: [
            'pages/PartnerLedgerList.tsx → partnerStatusPill',
            'systemUsers.brandingStatus → isActive',
        ],
        lastReviewed: '2026-10-20',
    }),
    entry('Partners', 'Summary', 'Earned', {
        question: 'What is Earned?',
        answer: 'The share earned in the selected period on this partner’s customers’ orders, GST included, with refunds already taken off on the day they came back. The opening balance is not in it; it is added in Left To Pay.',
        formula:
            'Earned = Partner share (incl. GST) on sales in the period − share taken back on refunds in the period',
        whenMissing: LINES_ONLY,
        concepts: ['partner-share', 'opening-balances', 'lists-vs-totals'],
        maintainerNotes: [
            'partnerLedger.js → sumEarned with range; eventDate = the event’s journalDate',
        ],
        lastReviewed: '2026-10-20',
    }),
    entry('Partners', 'Summary', 'Paid', {
        question: 'What is Paid?',
        answer: 'Payouts dated in the period, net of any reversed. A reversal is dated the day it was made, so it falls in that period, not the original payout’s.',
        whenMissing: RECORDED_ONLY,
        concepts: [],
        maintainerNotes: [
            'partnerPayouts.js → sumPaidToPartner (entryKind PAYOUT, payoutDate in range)',
        ],
        lastReviewed: '2026-10-20',
    }),
    entry('Partners', 'Summary', 'Debit Notes', {
        question: 'What is Debit Notes?',
        answer: 'Debit notes raised against this partner in the period, net of any reversed. Each one takes back part of what was earned.',
        whenMissing: RECORDED_ONLY,
        concepts: ['partner-share', 'lists-vs-totals'],
        maintainerNotes: ['partnerLedgerEntries.js → sumEntries'],
        lastReviewed: '2026-10-07',
    }),
    entry('Partners', 'Summary', 'GMV', {
        question: 'What is GMV?',
        answer: `Gross merchandise value: the full value of every successful order for this partner in the selected date range — what the customer paid plus any discount Peko bore, whether ${DISCOUNT_WORDS}. An order with no accounting entry counts the amount charged on it.`,
        formula:
            'GMV = sum of (Paid through gateway + Paid from wallet + Discount borne by Peko) over successful partner-customer orders in the selected period',
        whenMissing: LINES_ONLY,
        concepts: ['partner-share', 'lists-vs-totals'],
        maintainerNotes: [
            'partnerLedger.js → buildPartnerGmvQuery',
            'journalPosting.js → gmvOfOrder',
        ],
        lastReviewed: '2026-10-20',
    }),
    entry('Partners', 'Summary', 'Left To Pay', {
        question: 'What is Left To Pay?',
        answer: 'The opening balance plus everything earned to date, less everything paid and every debit note raised, whatever period is chosen: the date range scopes the cards beside it, never the debt.',
        formula:
            'Left to pay = Opening balance + Earned to date − Paid to date − Debit notes to date',
        whenMissing:
            'Worked out from the standing balances, not from the period figures beside it.',
        concepts: ['partner-share', 'opening-balances'],
        maintainerNotes: [
            'partnerLedger.js → buildPosition; getPartnerLedgerSummary returns standing.owed',
        ],
        lastReviewed: '2026-10-20',
    }),
    entry('Partners', 'Summary', 'Last Payment', {
        question: 'What is Last Payment?',
        answer: 'The date of the most recent payout that is still in force.',
        whenMissing: 'Shows “None yet” when nothing has been paid.',
        concepts: [],
        maintainerNotes: ['partnerPayouts.js → lastPayoutDate'],
    }),
    tabEntry(
        'Partners',
        'Transactions',
        'Every service order placed by this partner’s customers, with Peko’s earnings and the partner’s share of them.',
        ['partner-share', 'journal-states']
    ),
    tabEntry(
        'Partners',
        'Own Subscriptions',
        'Peko plan and add-on payments by this partner’s customers, with the share on each.',
        ['partner-share', 'gst-split']
    ),
    tabEntry(
        'Partners',
        'Payments',
        'Payouts recorded to the partner, and the opening balance the ledger started from.',
        ['opening-balances']
    ),
    tabEntry(
        'Partners',
        'Debit Notes',
        'Debit notes raised against the partner by hand: share taken back, which reduces what is left to pay the same way a payout does.',
        ['partner-share']
    ),
    ...common('Partners', 'Transactions', [
        'Date',
        'Txn ID',
        'Subscriber',
        'Service',
        'Status',
        'Posted',
    ]),
    entry('Partners', 'Transactions', 'Full Amount', {
        question: 'What is Full Amount?',
        answer: 'What the order was worth in total, as the accounting entry recorded it.',
        whenMissing:
            'A dash when the entry was skipped or never recorded, like every other amount on the row.',
        concepts: ['raw-vs-derived'],
        maintainerNotes: ['journalData.totalTransactionAmount', 'orders.amountInINR'],
    }),
    entry('Partners', 'Transactions', 'Net Platform Fee', {
        question: 'What is Net Platform Fee?',
        answer: 'The platform fee before GST, as recorded in the order accounting breakdown.',
        whenMissing: DASH,
        concepts: ['raw-vs-derived', 'gst-split'],
        maintainerNotes: ['journalData.platformFeeExcludingGST'],
    }),
    entry('Partners', 'Transactions', 'Net Commission', {
        question: 'What is Net Commission?',
        answer: 'Peko’s commission on the order before GST, as recorded in the order accounting breakdown: the commission on margin items plus Peko’s margin on principal-markup items, which the partner shares in alike.',
        whenMissing: DASH,
        concepts: ['gst-split', 'partner-share'],
        maintainerNotes: ['journalData.commissionExcludingGST + principalCommissionExcludingGST'],
        lastReviewed: '2026-10-08',
    }),
    entry('Partners', 'Transactions', 'Coupon', {
        question: 'What is Coupon?',
        answer: `The discount Peko bore on the order — ${DISCOUNT_WORDS} — all of it Peko’s own cost. It is booked to the coupon discount expense account whatever its source, which is why the column keeps the coupon’s name.`,
        whenMissing:
            'Shows a dash when there was no discount on the order, and when the order’s accounting entry was skipped or never recorded.',
        concepts: ['partner-share'],
        maintainerNotes: ['journalData.couponTotalDiscount (coupon + Peko Credit + plan discount)'],
        lastReviewed: '2026-10-20',
    }),
    entry('Partners', 'Transactions', 'Gateway Charge', {
        question: 'What is Gateway Charge?',
        answer: 'The payment gateway’s charge on this order, which the partner bears: a percentage of what was paid through the gateway plus a fixed sum per transaction, both from the partner’s terms on the Whitelabel Partners page. It comes off Peko’s earnings before the share is worked out. It is zero for a partner who does not bear it, nothing on an order paid wholly from the wallet, and on a part-wallet order it is worked out on the gateway part alone. Nothing is posted for it: the gateway account still carries the full amount collected, and the charge reaches the books only as a Bill on the gateway’s profile.',
        formula: 'Gateway charge = Paid through gateway × Charge % + Fixed charge per transaction',
        whenMissing:
            'A dash on an order recorded before the charge existed or under a partner with no terms set, and whenever the entry was skipped or never recorded.',
        concepts: ['partner-share', 'gateway-convention'],
        maintainerNotes: [
            'journalData.gatewayCharge',
            'systemUsers.gatewayCharge → { percentage, fixed }',
            'computeJournalData.js → gatewayChargeOn',
        ],
        lastReviewed: '2026-10-14',
    }),
    entry('Partners', 'Transactions', 'Share Base', {
        question: 'What is Share Base?',
        answer: 'What the share is a percentage of on an ordinary order: Peko’s commission and platform fee before GST, less the gateway charge the partner bears. Never below zero: when the charge is more than Peko earned, the base is zero and nothing is shared.',
        formula: 'Share base = Net commission + Net platform fee − Gateway charge',
        whenMissing: DASH,
        concepts: ['partner-share'],
        maintainerNotes: [
            'partnerLedger.js → ORDER_SHARE_BASE (GREATEST(…, 0))',
            'computeJournalData.js → partnerShareBase',
        ],
        lastReviewed: '2026-10-20',
    }),
    entry('Partners', 'Transactions', 'Share Applied', {
        question: 'What is Share Applied?',
        answer: 'The rate that actually applied to this order, worked back as the share divided by the share base — because the order keeps the money, not the rate.',
        formula: 'Share applied = Share (excl. GST) ÷ Share base',
        whenMissing:
            'Shows a dash when there was nothing to share, including when the gateway charge used up Peko’s earnings, and when the entry was never worked out.',
        concepts: ['partner-share'],
        maintainerNotes: ['partnerLedger.js → shareSelect, ORDER_SHARE_BASE'],
        lastReviewed: '2026-10-20',
    }),
    entry('Partners', 'Transactions', 'Partner Share', {
        question: 'What is Partner Share?',
        answer: 'What Peko owes the partner for this order: the share worked out on Peko’s earnings less the gateway charge the partner bears, plus GST on it. The line beneath shows the share and the GST that make up the headline.',
        formula: 'Partner share = Share (excl. GST) + GST on the share',
        whenMissing: DASH,
        concepts: ['partner-share', 'gst-split'],
        maintainerNotes: [
            'journalData.partnerPayable',
            'journalData.partnerShipFee',
            'journalData.inputGSTonPartnerShipFee',
        ],
        lastReviewed: '2026-10-14',
    }),
    ...common('Partners', 'Own Subscriptions', [
        'Date',
        'Txn ID',
        'Subscriber',
        'Status',
        'Posted',
    ]),
    entry('Partners', 'Own Subscriptions', 'Plan', {
        question: 'What is Plan?',
        answer: 'The Peko plan or add-on paid for.',
        whenMissing: RAW,
        concepts: [],
        maintainerNotes: ['packages.packageName'],
    }),
    entry('Partners', 'Own Subscriptions', 'Billing', {
        question: 'What is Billing?',
        answer: 'Monthly or annually, as the subscription record behind the payment states it.',
        whenMissing: 'Shows a dash when no subscription record is linked to the payment.',
        concepts: [],
        maintainerNotes: [
            'subscriptions.billingType via the latest subscription per corporateTxnId',
        ],
        lastReviewed: '2026-10-20',
    }),
    entry('Partners', 'Own Subscriptions', 'Kind', {
        question: 'What is Kind?',
        answer: 'Whether the payment was for a plan or for an add-on.',
        whenMissing: RAW,
        concepts: [],
        maintainerNotes: ['orders.optional'],
    }),
    entry('Partners', 'Own Subscriptions', 'Amount (incl. GST)', {
        question: 'What is Amount (incl. GST)?',
        answer: 'What the customer was charged for the subscription, GST included.',
        whenMissing:
            'Shows a dash when the payment’s accounting entry was skipped or never recorded, like every other amount on the row.',
        concepts: ['raw-vs-derived'],
        maintainerNotes: ['orders.amountInINR, blanked unless the sale reached the books'],
        lastReviewed: '2026-10-20',
    }),
    entry('Partners', 'Own Subscriptions', 'Coupon', {
        question: 'What is Coupon here?',
        answer: `The discount Peko bore on the subscription — ${DISCOUNT_WORDS} — all of it Peko’s own cost. It is added back into the share base, because the plan is still worth its full price, and booked to the coupon discount expense account whatever its source.`,
        whenMissing:
            'Shows a dash when there was no discount on the payment, and when its accounting entry was skipped or never recorded.',
        concepts: ['partner-share'],
        maintainerNotes: ['journalData.couponTotalDiscount (coupon + Peko Credit + plan discount)'],
        lastReviewed: '2026-10-20',
    }),
    entry('Partners', 'Own Subscriptions', 'Gateway Charge', {
        question: 'What is Gateway Charge here?',
        answer: 'The payment gateway’s charge on this subscription payment, which the partner bears: a percentage of what was paid through the gateway plus a fixed sum per transaction, from the partner’s terms on the Whitelabel Partners page. It comes off the share base before the share is worked out, and nothing is posted for it.',
        formula: 'Gateway charge = Paid through gateway × Charge % + Fixed charge per transaction',
        whenMissing:
            'A dash on a payment recorded before the charge existed or under a partner with no terms set, and whenever the entry was skipped or never recorded.',
        concepts: ['partner-share', 'gateway-convention'],
        maintainerNotes: ['journalData.gatewayCharge'],
        lastReviewed: '2026-10-14',
    }),
    entry('Partners', 'Own Subscriptions', 'Share Base', {
        question: 'What is Share Base here?',
        answer: 'What the share is a percentage of on a subscription: the amount paid through the gateway with its GST taken out, plus any discount Peko bore, less the gateway charge the partner bears — Net Revenue less the charge. Never below zero.',
        formula:
            'Share base = Paid through gateway (excl. GST) + Discount borne by Peko − Gateway charge = Net Revenue − Gateway charge',
        whenMissing: DASH,
        concepts: ['partner-share'],
        maintainerNotes: [
            'partnerLedger.js → SUBSCRIPTION_SHARE_BASE = netSubscriptionIncome − gatewayCharge, aligned on 2026-10-20 with computeJournalData.js → partnerShareBase (isPekoSale branch)',
        ],
        lastReviewed: '2026-10-20',
    }),
    entry('Partners', 'Own Subscriptions', 'Share Applied', {
        question: 'What is Share Applied here?',
        answer: 'The rate that applied, worked back as the share divided by the share base.',
        formula: 'Share applied = Share (excl. GST) ÷ Share base',
        whenMissing:
            'Shows a dash when there was nothing to share, including when the gateway charge used up the plan’s price, and when the entry was never worked out.',
        concepts: ['partner-share'],
        maintainerNotes: ['partnerLedger.js → shareSelect over SUBSCRIPTION_SHARE_BASE'],
        lastReviewed: '2026-10-20',
    }),
    entry('Partners', 'Own Subscriptions', 'Partner Share', {
        question: 'What is Partner Share here?',
        answer: 'The share base times the partner’s rate, plus GST on the share.',
        formula:
            'Partner share = (Paid through gateway excl. GST + Discount borne by Peko − Gateway charge) × Rate, plus GST on that share',
        whenMissing: DASH,
        concepts: ['partner-share', 'gst-split'],
        maintainerNotes: [
            'journalData.partnerPayable = partnerShipFee + inputGSTonPartnerShipFee',
            'computeJournalData.js → partnerShareBase (isPekoSale branch)',
        ],
        lastReviewed: '2026-10-20',
    }),
    entry('Partners', 'Own Subscriptions', 'Net Revenue (excl. GST)', {
        question: 'What is Net Revenue (excl. GST)?',
        answer: 'The plan’s price before GST: the amount paid through the gateway with its GST taken out, plus any discount Peko bore. Less the gateway charge, this is the figure the partner’s share was worked out on.',
        whenMissing: DASH,
        concepts: ['gst-split'],
        maintainerNotes: ['journalData.netSubscriptionIncome'],
    }),
    ...common('Partners', 'Payments', [
        'Date',
        'Entry No.',
        'Reference',
        'Mode',
        'Note',
        'Slip',
        'Recorded By',
        'In Books',
    ]),
    entry('Partners', 'Payments', 'Status', {
        question: 'What does the status mean on a payment?',
        answer: 'Paid: a payout still in force. Opening: the opening balance row. Reversal: the row that puts a reversed payout or opening back. Reversed: the original that was reversed, with who reversed it and why underneath. Deleted: removed, with who deleted it and why, until it is marked removed from the books.',
        whenMissing: RECORD,
        concepts: ['ledger-corrections', 'opening-balances'],
        maintainerNotes: [
            'components/ledgers/partnerColumns.tsx → payoutEntryPill',
            'partnerPayouts.js → PAYOUT_STATUS_FILTERS',
        ],
        lastReviewed: '2026-10-20',
    }),
    entry('Partners', 'Payments', 'Paid', {
        question: 'What is Paid?',
        answer: 'The payout amount as recorded. An opening balance row is what Peko already owed as at its date; a reversal shows the payout put back.',
        whenMissing: RECORD,
        concepts: ['opening-balances'],
        maintainerNotes: ['partnerPayouts.amount'],
    }),
    entry('Partners', 'Payments', 'Calculated', {
        question: 'What is Calculated?',
        answer: 'What the portal worked out was left to pay when the payout was recorded: the opening balance plus earned to date, less paid and less debit notes at that moment. The line underneath reads Short by or Over by the difference, so a payout entered below or above it is visible on the row. A reversal carries its original’s figure.',
        formula:
            'Calculated = Opening balance + Earned − Paid − Debit notes, as at the moment the payout was recorded',
        whenMissing: 'Shows a dash when it was not captured.',
        concepts: ['partner-share'],
        maintainerNotes: [
            'partnerPayouts.calculatedAmount, stamped server-side from getPartnerLedgerSummary().owed',
            'serializePayout → difference',
        ],
        lastReviewed: '2026-10-20',
    }),
    entry('Partners', 'Payments Cards', 'Left to pay', {
        question: 'What is Left to pay on the Payments tab?',
        answer: 'The opening balance plus everything the partner has earned to date, less everything already paid and every debit note raised — the amount a new payout is prefilled with. The date range on the page does not change it.',
        formula: 'Left to pay = Opening balance + Earned − Paid − Debit notes',
        lastReviewed: '2026-10-20',
        whenMissing: 'Worked out from the balances.',
        concepts: ['partner-share'],
        maintainerNotes: [
            'partnerLedger.js → buildPosition',
            'controllers/admin/partnerLedger.js → getPartnerPayoutSuggestion',
        ],
    }),
    entry('Partners', 'Payments Cards', 'Last payment', {
        question: 'What is Last payment?',
        answer: 'The date of the most recent payout that is still in force.',
        whenMissing: 'Shows “None yet” when nothing has been paid.',
        concepts: [],
        maintainerNotes: ['partnerPayouts.js → lastPayoutDate'],
    }),
    ...common('Partners', 'Debit Notes', [
        'Date',
        'Entry No.',
        'Recorded By',
        'Status',
        'In Books',
    ]),
    entry('Partners', 'Debit Notes', 'Against Order', {
        question: 'What is Against Order?',
        answer: 'The transaction id of the order the debit note was raised against, when one was given.',
        whenMissing: 'Shows a dash when no order was given.',
        concepts: [],
        maintainerNotes: ['partnerLedgerEntries.againstCorporateTxnId'],
        lastReviewed: '2026-10-07',
    }),
    entry('Partners', 'Debit Notes', 'Reason', {
        question: 'What is the reason?',
        answer: 'Why the debit note was raised, as typed when it was recorded. A reversed note also shows why it was reversed and by whom.',
        whenMissing: RECORD,
        concepts: [],
        maintainerNotes: ['partnerLedgerEntries.reason', 'partnerLedgerEntries.voidReason'],
        lastReviewed: '2026-10-07',
    }),
    entry('Partners', 'Debit Notes', 'Taxable Amount', {
        question: 'What is the taxable amount on a debit note row?',
        answer: 'The note before GST: the figure typed when it was recorded without GST, or the figure typed with GST less the GST carved out of it. A reversal shows the same amount given back.',
        whenMissing: 'Shows a dash on a note recorded before the split was kept.',
        concepts: ['gst-split'],
        maintainerNotes: ['partnerLedgerEntries.taxableAmount', 'ledgerGst.js → splitEntryAmount'],
        lastReviewed: '2026-10-26',
    }),
    entry('Partners', 'Debit Notes', 'Total (incl. GST)', {
        question: 'What is the total on a debit note row?',
        answer: 'The share taken back from the partner, GST included. When the note is recorded the accountant says whether the figure typed includes GST; if it does not, GST at the rate in force that day is added on top to get this total. It reduces what is left to pay the same way a payout does; a reversal shows the same amount given back.',
        whenMissing: RECORD,
        concepts: ['partner-share', 'gst-split'],
        maintainerNotes: [
            'partnerLedgerEntries.amount (total), gstInclusive, gstRate frozen at record time',
        ],
        lastReviewed: '2026-10-13',
    }),
    entry('Partners', 'Debit Notes', 'GST', {
        question: 'What is the GST on a debit note?',
        answer: 'The GST part of the amount, at the rate in force when the note was recorded: carved out of the figure when it was typed with GST, added on top when it was typed without.',
        whenMissing: 'Shows a dash on a note recorded before the split was kept.',
        concepts: ['gst-split'],
        maintainerNotes: ['partnerLedgerEntries.gstAmount', 'ledgerGst.js → splitEntryAmount'],
        lastReviewed: '2026-10-13',
    }),
    entry('Partners', 'Debit Notes', 'Document', {
        question: 'What is Document?',
        answer: 'The file attached when the debit note was recorded, if one was.',
        whenMissing: 'Shows a dash when none was attached.',
        concepts: [],
        maintainerNotes: ['partnerLedgerEntries.slipKey'],
        lastReviewed: '2026-10-07',
    }),
];

// ---------------------------------------------------------------------------------------
// Payment gateways
// ---------------------------------------------------------------------------------------
// The receipt and fee tables share one pill vocabulary, which is not the Active / Reversed /
// Deleted one of the other hand-recorded tables.
const GATEWAY_ENTRY_STATUS: EntryFields = {
    ...COMMON.Status,
    answer: 'What the entry is: Received for a receipt, Opening for the opening balance, Charged for a fee. Reversal is the entry a reversal added; Reversed is the original once reversed, with who reversed it and why under the note. Deleted, with who deleted it and why, stays until the entry is marked removed from the books. The Status filter offers the same names.',
    whenMissing: RECORD,
    concepts: ['ledger-corrections'],
    maintainerNotes: [
        'components/ledgers/paymentGatewayColumns.tsx → settlementEntryPill',
        'paymentGatewaySettlements.js → SETTLEMENT_STATUS_FILTERS',
        'paymentGatewayLedgerExport.js → settlementStatus',
    ],
    lastReviewed: '2026-10-20',
};

const PAYMENT_GATEWAYS: FaqEntry[] = [
    entry('Payment Gateways', 'KPIs', 'Gateways', {
        question: 'What is Gateways?',
        answer: 'The payment gateways that have taken money for Peko: every chart-of-accounts account that an order’s accounting entry has named as its gateway. A gateway appears the moment one such entry exists; there is no list to maintain.',
        whenMissing: COUNT,
        concepts: ['gateway-convention', 'caches'],
        maintainerNotes: [
            'paymentGatewayLedger.js → GATEWAY_FROM (distinct journalAccountIds.paymentGateway) → snapshot totalGateways',
        ],
        lastReviewed: '2026-10-20',
    }),
    entry('Payment Gateways', 'KPIs', 'Yet To Receive', {
        question: 'What is Yet To Receive across gateways?',
        answer: 'Each gateway’s Yet To Receive — its opening balance plus what it collected, less what it has handed over and the charges it kept — added up over every gateway. A gateway below zero reduces the total.',
        formula:
            'Yet to receive = Opening balance + Collected − Received − Charges, added up over every gateway',
        whenMissing: 'Adds every gateway’s balance.',
        concepts: ['gateway-convention', 'opening-balances', 'caches'],
        maintainerNotes: [
            'paymentGatewayLedger.js → buildPaymentGatewayLedgerSnapshot (outstandingTotal) → buildPosition',
        ],
        lastReviewed: '2026-10-20',
    }),
    entry('Payment Gateways', 'KPIs', 'Awaiting Settlement', {
        question: 'What is Awaiting Settlement?',
        answer: 'Gateways with something still to receive: those whose Yet To Receive is above zero, from the same five-minute snapshot as the list.',
        formula: 'Awaiting settlement = number of gateways with Yet To Receive above zero',
        whenMissing: COUNT,
        concepts: ['gateway-convention', 'caches'],
        maintainerNotes: ['paymentGatewayLedger.js → buildPaymentGatewayKpis'],
        lastReviewed: '2026-10-20',
    }),
    entry('Payment Gateways', 'KPIs', 'Collected This Month', {
        question: 'What is Collected This Month?',
        answer: 'What every gateway took in this month so far, with refunds through them taken off: the movements on each gateway’s account from entries that reached the books, counted on the entry’s own date (a refund on the day it went back), from the go-live date and after each gateway’s opening balance date. Month so far is on Indian time.',
        formula:
            'Collected this month = money into the gateway accounts − money back out through them, for entries dated this month',
        whenMissing: LINES_ONLY,
        concepts: [
            'gateway-convention',
            'lists-vs-totals',
            'go-live-floor',
            'opening-balances',
            'caches',
        ],
        maintainerNotes: [
            'paymentGatewayLedger.js → sumCollected({ range: istMonthToDateRange }) → buildCollectedQuery',
        ],
        lastReviewed: '2026-10-20',
    }),
    entry('Payment Gateways', 'KPIs', 'Received This Month', {
        question: 'What is Received This Month?',
        answer: 'Receipts from every gateway dated this month so far, by the date on the receipt. A reversal is taken off in the month it was reversed, and a deleted receipt drops out at once.',
        whenMissing: RECORDED_ONLY,
        concepts: ['caches', 'ledger-corrections'],
        maintainerNotes: [
            'paymentGatewaySettlements.js → sumReceivedInRange (RECEIPT rows, net of REVERSAL, paranoid)',
        ],
        lastReviewed: '2026-10-20',
    }),
    entry('Payment Gateways', 'List', 'Gateway', {
        question: 'What is shown under Gateway?',
        answer: 'The gateway’s name — its account in the chart of accounts.',
        whenMissing: RAW,
        concepts: ['gateway-convention'],
        maintainerNotes: ['chartOfAccounts.account_name'],
    }),
    entry('Payment Gateways', 'List', 'Collected', {
        question: 'What is Collected on the list?',
        answer: 'Everything the gateway has taken in since its opening balance date — or since the go-live date where no opening balance is set — with refunds through it taken off. It is the movement on the gateway’s account from entries that reached the books, each on the entry’s own date. The opening balance is not in it; it is added in Yet To Receive.',
        whenMissing: LINES_ONLY,
        concepts: ['gateway-convention', 'opening-balances', 'go-live-floor'],
        maintainerNotes: [
            'paymentGatewayLedger.js → sumCollected (no range) → buildCollectedQuery; AFTER_FLOOR joins the live opening’s date',
        ],
        lastReviewed: '2026-10-20',
    }),
    entry('Payment Gateways', 'List', 'Received', {
        question: 'What is Received on the list?',
        answer: 'Receipts recorded from the gateway, net of any reversed. A deleted receipt drops out at once, before it is marked removed from the books.',
        whenMissing: RECORDED_ONLY,
        concepts: ['gateway-convention', 'ledger-corrections'],
        maintainerNotes: [
            'paymentGatewaySettlements.js → sumSettledByGateway (list snapshot), sumReceivedFromGateway (detail)',
        ],
        lastReviewed: '2026-10-20',
    }),
    entry('Payment Gateways', 'List', 'Charges', {
        question: 'What is Charges?',
        answer: 'The fees the gateway kept, recorded by hand as Bills, net of any reversed. The gateway charge worked out on a partner’s order is a figure used to net the partner’s share; it is never posted and is not in here.',
        whenMissing: RECORDED_ONLY,
        concepts: ['gateway-convention', 'partner-share'],
        maintainerNotes: [
            'paymentGatewaySettlements.js → sumSettledByGateway (list), sumFeesForGateway (detail)',
            'journalData.gatewayCharge is a figure only; no line is built from it',
        ],
        lastReviewed: '2026-10-20',
    }),
    entry('Payment Gateways', 'List', 'Yet To Receive', {
        question: 'What is Yet To Receive?',
        answer: 'The opening balance plus collected, less received and less charges: what the gateway is still holding for Peko. Shown in red when below zero, which means more has been received and charged than was collected.',
        formula: 'Yet to receive = Opening balance + Collected − Received − Charges',
        whenMissing:
            'Worked out from the figures beside it and the gateway’s opening balance, which the list does not show.',
        concepts: ['gateway-convention', 'opening-balances'],
        maintainerNotes: ['paymentGatewayLedger.js → buildPosition'],
        lastReviewed: '2026-10-20',
    }),
    entry('Payment Gateways', 'List', 'Status', {
        question: 'What is the gateway status?',
        answer: 'Settlement pending when something is still to receive, otherwise Reconciled.',
        whenMissing: RAW,
        concepts: [],
        maintainerNotes: ['pages/PaymentGatewayLedgerList.tsx → gatewayStatusPill'],
    }),
    entry('Payment Gateways', 'Summary', 'Collected', {
        question: 'What is Collected?',
        answer: 'What the gateway took in during the chosen period, with refunds through it taken off: the movement on its account from entries that reached the books, each on the entry’s own date, a refund on the day it went back. The opening balance is not in it, and nothing dated on or before the opening balance date is.',
        whenMissing: LINES_ONLY,
        concepts: ['gateway-convention', 'opening-balances', 'lists-vs-totals'],
        maintainerNotes: [
            'paymentGatewayLedger.js → getPaymentGatewayLedgerSummary → sumCollected({ range }); period position built with opening 0',
        ],
        lastReviewed: '2026-10-20',
    }),
    entry('Payment Gateways', 'Summary', 'Received', {
        question: 'What is Received?',
        answer: 'Receipts dated in the period, net of any reversed; a deleted receipt drops out at once.',
        whenMissing: RECORDED_ONLY,
        concepts: ['gateway-convention'],
        maintainerNotes: [
            'paymentGatewaySettlements.js → sumReceivedFromGateway(gatewayAccountId, range)',
        ],
        lastReviewed: '2026-10-20',
    }),
    entry('Payment Gateways', 'Summary', 'Charges', {
        question: 'What is Charges?',
        answer: 'The fees the gateway kept, dated in the period, recorded by hand as Bills and net of any reversed. A partner’s gateway charge is never posted and is not in here.',
        whenMissing: RECORDED_ONLY,
        concepts: ['gateway-convention'],
        maintainerNotes: [
            'paymentGatewaySettlements.js → sumFeesForGateway(gatewayAccountId, range)',
        ],
        lastReviewed: '2026-10-20',
    }),
    entry('Payment Gateways', 'Summary', 'Yet To Receive', {
        question: 'What is Yet To Receive?',
        answer: 'The opening balance plus everything collected to date, less everything received and every charge to date, whatever period is chosen: the period narrows Collected, Received and Charges, never this figure. Highlighted while above zero.',
        formula: 'Yet to receive = Opening balance + Collected − Received − Charges, all to date',
        lastReviewed: '2026-10-20',
        whenMissing: 'Worked out from the figures beside it.',
        concepts: ['gateway-convention'],
        maintainerNotes: ['paymentGatewayLedger.js → buildPosition'],
    }),
    entry('Payment Gateways', 'Summary', 'Last Receipt', {
        question: 'What is Last Receipt?',
        answer: 'The date on the most recent receipt still in force — not reversed, not deleted — whatever period is chosen.',
        whenMissing: 'Shows “None yet” when nothing has been received.',
        concepts: [],
        maintainerNotes: [
            'paymentGatewaySettlements.js → findLastReceipt (ACTIVE RECEIPT ENTRY, latest entryDate)',
        ],
        lastReviewed: '2026-10-20',
    }),
    tabEntry(
        'Payment Gateways',
        'Transactions',
        'Every payment that went through this gateway from the go-live date, with the full order value and the part the gateway handled. An order is listed when it names this gateway — on its accounting entry, or on the gateway’s own record of the payment matched by name to the chart of accounts — and money actually went through it. An order paid entirely from the wallet is left out whatever gateway name it carries, and so is one the gateway never answered on. Orders dated on or before the opening balance stay listed as history, marked “before opening”, and do not add to the balance.',
        ['gateway-convention', 'raw-vs-derived', 'go-live-floor', 'opening-balances'],
        '2026-10-20'
    ),
    tabEntry(
        'Payment Gateways',
        'Received & Bills',
        'What the gateway has handed over to Peko’s bank and what it kept as its charges, each recorded by hand as its own entry: a receipt from Record receipt, a charge from Record fee, each on its own date. The opening balance, where set, sits in the Received table as the position the receipts work down. Every entry can be edited, deleted or reversed and carries the In Books switch; a receipt and charge recorded together under the earlier design can only be reversed, and reverse together.',
        ['gateway-convention', 'opening-balances', 'ledger-corrections'],
        '2026-10-20'
    ),
    ...common('Payment Gateways', 'Transactions', [
        'Txn ID',
        'Subscriber',
        'Service',
        'Method',
        'Posted',
    ]),
    entry('Payment Gateways', 'Transactions', 'Date', {
        ...COMMON.Date,
        answer: 'The day the order was placed. An order dated on or before the gateway’s opening balance is marked “before opening”: it is listed as history and does not add to the balance above.',
        concepts: ['go-live-floor', 'opening-balances'],
        maintainerNotes: [
            'orders.transactionDate',
            'paymentGatewayLedger.js → serializeTransaction → beforeOpening against the live opening’s date',
        ],
        lastReviewed: '2026-10-20',
    }),
    entry('Payment Gateways', 'Transactions', 'Status', {
        ...COMMON.Status,
        answer: 'Whether the payment succeeded, failed or was refunded, read from the order’s own status alone: Success, Refunded or Failed. Unlike the vendor and subscriber tabs, a refund processed later is not looked up here, so an order left as failed after a refund reads Failed. The Status filter follows the same reading.',
        maintainerNotes: [
            'orders.status only — serializeTransaction carries no refunded flag; vendorColumns.tsx → orderStatusPill(row.status)',
            'journalPosting.js → ORDER_STATUS_FILTERS',
        ],
        lastReviewed: '2026-10-20',
    }),
    entry('Payment Gateways', 'Transactions', 'Full Amount', {
        question: 'What is Full Amount?',
        answer: 'What the order was worth in total, as the accounting entry recorded it. For a Peko subscription, whose entry carries no total, it is the amount charged on the order.',
        whenMissing:
            'A dash until the order’s sale entry has reached the books, posted or refused; every amount on the row follows the same rule.',
        concepts: ['raw-vs-derived', 'journal-states'],
        maintainerNotes: [
            'journalData.totalTransactionAmount, else orders.amountInINR',
            'paymentGatewayLedger.js → serializeTransaction nulls it unless saleReachedBooksOfRow',
        ],
        lastReviewed: '2026-10-20',
    }),
    entry('Payment Gateways', 'Transactions', 'Through Gateway', {
        question: 'What is Through Gateway?',
        answer: 'The part of the order that went through this gateway, as the accounting entry recorded it, else as the gateway’s own record of the payment reported it. An order appears on this tab when the gateway named on its entry or on that record is this one and the amount through it is above zero; the figure itself shows only once the sale entry has reached the books.',
        whenMissing:
            'A dash until the sale entry reaches the books, posted or refused. The order is not listed when nothing went through a gateway, even if it carries a gateway name.',
        concepts: ['raw-vs-derived', 'gateway-convention', 'journal-states'],
        maintainerNotes: [
            'journalData.paymentThroughGateway, else paymentModeResponse pgAmount (GATEWAY_AMOUNT_OF_ORDER)',
            'EFFECTIVE_GATEWAY_OF_ORDER: journalAccountIds.paymentGateway, else the gateway name joined to chartOfAccounts.account_name',
            'serializeTransaction nulls it unless the sale reached the books',
        ],
        lastReviewed: '2026-10-20',
    }),
    ...common('Payment Gateways', 'Received', [
        'Date',
        'Entry No.',
        'Reference',
        'Mode',
        'Note',
        'Slip',
        'Recorded By',
        'In Books',
    ]),
    entry('Payment Gateways', 'Received', 'Status', GATEWAY_ENTRY_STATUS),
    entry('Payment Gateways', 'Received', 'Received', {
        question: 'What is Received?',
        answer: 'The amount that reached Peko’s bank from the gateway, as recorded. An opening balance row is the net still to receive as at its date.',
        whenMissing: RECORD,
        concepts: ['gateway-convention', 'opening-balances'],
        maintainerNotes: ['paymentGatewaySettlements.amount (RECEIPT / OPENING)'],
    }),
    entry('Payment Gateways', 'Received', 'Expected', {
        question: 'What is Expected?',
        answer: 'What the portal said was still to receive when the receipt was recorded, kept only on receipts recorded before charges became their own entries. On those rows a receipt below it shows the difference as “kept as charges”: the fee that was recorded together with it at the time. A receipt recorded now carries no expected figure; its charge is recorded on its own under Bills.',
        whenMissing:
            'Shows a dash on every receipt recorded since charges became separate entries, and on the opening balance row.',
        concepts: ['gateway-convention'],
        maintainerNotes: [
            'paymentGatewaySettlements.expectedAmount — written only by the earlier paired flow; createReceipt sets it null (2026-09-30)',
            'controllers/admin/paymentGatewayLedger.js → createPaymentGatewaySettlement',
            'components/ledgers/paymentGatewayColumns.tsx → expectedCell; export column Kept as Charges',
        ],
        lastReviewed: '2026-10-20',
    }),
    ...common('Payment Gateways', 'Bills', [
        'Date',
        'Entry No.',
        'Reference',
        'Note',
        'Recorded By',
        'In Books',
    ]),
    entry('Payment Gateways', 'Bills', 'Status', GATEWAY_ENTRY_STATUS),
    entry('Payment Gateways', 'Bills', 'Fee', {
        question: 'What is Fee?',
        answer: 'A charge the gateway kept, recorded on its own from Record fee with its own date, reference and note. It reduces what is still to receive the same way a receipt does, and it is the only way a gateway charge reaches this ledger: the gateway charge worked out on a partner’s order is a figure for the partner’s share and is never posted or listed here. The amount is as typed, with no GST split. A reversal row shows the amount with a minus sign. A charge recorded together with a receipt under the earlier design can only be reversed, which reverses its receipt too.',
        whenMissing: RECORD,
        concepts: ['gateway-convention', 'ledger-corrections'],
        maintainerNotes: [
            'paymentGatewaySettlements.js → createFee; amount (FEE) net of REVERSAL rows',
            'controllers/admin/paymentGatewayLedger.js → createPaymentGatewayFee',
            'settlementId only on the earlier paired rows → RECORDED_WITH_FEE guard; frontend changeable={!row.settlementId}',
            'no gst columns on paymentGatewaySettlements; ledgerGst.js is not used by the gateway code',
        ],
        lastReviewed: '2026-10-20',
    }),
];

// ---------------------------------------------------------------------------------------
// Other sales
// ---------------------------------------------------------------------------------------
const OTHER_SALES: FaqEntry[] = [
    ...common('Other Sales', 'Columns', ['Date', 'Txn ID', 'Service', 'Status', 'Posted']),
    entry('Other Sales', 'Columns', 'Vendor', {
        question: 'Which vendor?',
        answer: 'The vendor behind the service the sale was made on.',
        whenMissing: 'Shows a dash when the service has no vendor behind it.',
        concepts: [],
        maintainerNotes: ['vendors.vendorName through serviceOperators.vendorId, left join'],
        lastReviewed: '2026-10-20',
    }),
    entry('Other Sales', 'Columns', 'Partner', {
        question: 'Which partner?',
        answer: 'The whitelabel partner that brought the buyer on board, or Peko (Default).',
        whenMissing: RAW,
        concepts: [],
        maintainerNotes: ['credentials.registeredBy'],
    }),
    entry('Other Sales', 'Columns', 'Full Amount', {
        question: 'What is Full Amount?',
        answer: 'What the sale was worth in total, read off its accounting entry: the price before any coupon, and it already contains the platform fee and the markup. An entry that carries no total of its own — a one-time purchase such as an extra Corporate Card — shows the amount the customer was charged instead. An order with both principal-markup and margin items is listed for its principal items only, in their share of the order, and the rest sits on the vendor’s profile.',
        whenMissing: DASH,
        concepts: ['raw-vs-derived', 'journal-states', 'vendor-convention'],
        maintainerNotes: [
            'journalData.totalTransactionAmount',
            'orders.amountInINR',
            'otherSales.js → serializeOtherSale',
            'computeJournalData.js → totalTransactionAmount = amount + surcharge + add-ons, omitted on Peko sales',
        ],
        lastReviewed: '2026-10-20',
    }),
    entry('Other Sales', 'Columns', 'Platform Fee', {
        question: 'What is Platform Fee here?',
        answer: 'The platform fee including GST on the sale; on an order with both principal-markup and margin items, the principal items’ share of it.',
        whenMissing:
            'Shows a dash when the order’s accounting entry was skipped or never recorded, and on a one-time purchase, which carries no platform fee.',
        concepts: ['gst-split'],
        maintainerNotes: [
            'journalData.platformFeeIncludingGST',
            'otherSales.js → shared() share for MIXED',
        ],
        lastReviewed: '2026-10-20',
    }),
    entry('Other Sales', 'Columns', 'Markup', {
        question: 'What is Markup?',
        answer: 'Peko’s margin on a principal-markup sale, including GST. On these services Peko sells at its own price and books the margin as sales, not as commission. On an order with both principal-markup and margin items only the principal items’ margin counts here; the commission on the margin items belongs to the vendor’s profile. The same markup is shown beside the vendor’s price on the vendor’s Transactions tab.',
        whenMissing:
            'Shows a dash when the order’s accounting entry was skipped or never recorded, on a sale recorded as Peko’s own revenue, which carries no markup, and on a one-time purchase with no markup figure at all.',
        concepts: ['vendor-convention'],
        maintainerNotes: [
            'otherSales.js → MARKUP_SELECT: principalCommissionExcludingGST + outputGSTonPrincipalCommission, plus commissionIncludingGST unless MIXED; NULL for OWN_REVENUE or when all three figures are absent',
            'sellingMode.js → commissionModeSql decides membership, principalShareSql the share',
            'vendorLedger.js → principalMarkupOf reads the same figure for the vendor profile',
        ],
        lastReviewed: '2026-10-20',
    }),
    entry('Other Sales', 'Columns', 'Coupon', {
        question: 'What is Coupon?',
        answer: `The discount Peko bore on the sale — ${DISCOUNT_WORDS} — all of it Peko’s own cost, booked to the coupon discount expense account whatever its source. It is shown with a minus because it reduced what the customer paid.`,
        whenMissing:
            'Shows a dash when no discount was given on the sale, and when the order’s accounting entry was skipped or never recorded.',
        concepts: [],
        maintainerNotes: ['journalData.couponTotalDiscount (coupon + Peko Credit + plan discount)'],
        lastReviewed: '2026-10-20',
    }),
    entry('Other Sales', 'Summary', 'Full Amount', {
        question: 'What is the Full Amount total?',
        answer: 'Full Amount added up over the sales in the period whose entry reached the books, so the footer matches the rows that show a figure.',
        whenMissing:
            'Adds up the sales whose entry reached the books, posted or refused; a skipped or never recorded entry adds nothing.',
        concepts: ['lists-vs-totals', 'journal-states'],
        maintainerNotes: ['otherSales.js → TOTALS_SELECT'],
        lastReviewed: '2026-10-08',
    }),
    entry('Other Sales', 'Summary', 'Platform Fee', {
        question: 'What is the Platform Fee total?',
        answer: 'The platform fee added up over the sales whose entry reached the books.',
        whenMissing:
            'Adds up the sales whose entry reached the books, posted or refused; a skipped or never recorded entry adds nothing.',
        concepts: ['lists-vs-totals', 'journal-states'],
        maintainerNotes: ['otherSales.js → TOTALS_SELECT'],
        lastReviewed: '2026-10-08',
    }),
    entry('Other Sales', 'Summary', 'Markup', {
        question: 'What is the Markup total?',
        answer: 'Markup added up over the sales whose entry reached the books.',
        whenMissing:
            'Adds up the sales whose entry reached the books, posted or refused; a skipped or never recorded entry adds nothing.',
        concepts: ['lists-vs-totals', 'journal-states'],
        maintainerNotes: ['otherSales.js → TOTALS_SELECT'],
        lastReviewed: '2026-10-08',
    }),
    entry('Other Sales', 'Summary', 'Coupon', {
        question: 'What is the Coupon total?',
        answer: `The discounts Peko bore — ${DISCOUNT_WORDS} — added up over the sales whose entry reached the books.`,
        whenMissing:
            'Adds up the sales whose entry reached the books, posted or refused; a skipped or never recorded entry adds nothing.',
        concepts: ['lists-vs-totals', 'journal-states'],
        maintainerNotes: ['otherSales.js → TOTALS_SELECT'],
        lastReviewed: '2026-10-08',
    }),
];

// ---------------------------------------------------------------------------------------
// Third-party sales
// ---------------------------------------------------------------------------------------
const thirdPartyEntry = (tab: string, label: string, fields: EntryFields) =>
    entry('Third-Party Sales', tab, label, { lastReviewed: '2026-10-12', ...fields });

const THIRD_PARTY_SALES: FaqEntry[] = [
    thirdPartyEntry('Tabs', 'Payment Links', {
        question: 'What does the Payment Links tab show?',
        answer: 'Every payment link raised by a corporate or by an admin, paid or not: who it was for, how much it asked for, whether it was paid, when, and whether the money has reached the corporate’s bank account. The money collected belongs to the corporate, so none of it is Peko’s revenue and nothing from it is in the books.',
        whenMissing:
            'Every link raised is listed, paid or not; nothing on this screen is worked out from an accounting entry.',
        concepts: ['go-live-floor'],
        maintainerNotes: ['Third-Party Sales tab copy'],
        lastReviewed: '2026-10-20',
    }),
    thirdPartyEntry('Columns', 'Date', {
        question: 'Which date is this?',
        answer: 'For a paid or failed link, the day the payment was answered; for a link still open or expired unpaid, the day it was raised. The date range on the page and the go-live date both apply to this date, so the paid links listed for the dashboard card’s dates are exactly the links the card added up.',
        whenMissing: 'Always shown — it is read from the link itself.',
        concepts: ['go-live-floor'],
        lastReviewed: '2026-10-20',
        maintainerNotes: [
            'paymentLinks.successOrFailDate, else updatedAt, for paid and failed links',
            'paymentLinks.createdAt otherwise',
        ],
    }),
    thirdPartyEntry('Columns', 'Link ID', {
        question: 'What is the Link ID?',
        answer: 'The link’s own id, or its reference number when it was raised before ids were given to links. The note typed when the link was raised sits underneath it.',
        whenMissing:
            'Always shown — it is read from the link itself. The note is left out when nothing was typed.',
        concepts: [],
        maintainerNotes: [
            'paymentLinks.transactionId, else reference_id',
            'paymentLinks.purpose_message',
        ],
    }),
    thirdPartyEntry('Columns', 'Type', {
        question: 'What is the Type?',
        answer: 'Payment link for a link raised on its own; Invoice link for one generated to collect an invoice the corporate issued.',
        whenMissing: 'Always shown — it is read from the link itself.',
        concepts: [],
        maintainerNotes: ['paymentLinks.accessKey'],
    }),
    thirdPartyEntry('Columns', 'Raised by', {
        question: 'Who raised the link?',
        answer: 'Corporate when the corporate raised the link for its own customer; Admin when a Peko admin raised it to bill the corporate.',
        whenMissing: 'Always shown — it is read from the link itself.',
        concepts: [],
        maintainerNotes: ['paymentLinks.type = ADMIN'],
    }),
    thirdPartyEntry('Columns', 'Corporate', {
        question: 'Which corporate?',
        answer: 'The corporate account the link belongs to, with its login name underneath. For a link an admin raised it is the corporate that was billed.',
        whenMissing:
            'Shows a dash when the corporate account no longer exists, or when a link an admin raised carried no name.',
        concepts: [],
        maintainerNotes: [
            'credentials.name and username through paymentLinks.credentialId',
            'sentPayload.full_name for admin-raised links',
        ],
        lastReviewed: '2026-10-20',
    }),
    thirdPartyEntry('Columns', 'Customer', {
        question: 'Who is the customer?',
        answer: 'Who was asked to pay, with the phone number the link was sent to. Blank for a link an admin raised, where the corporate itself was asked to pay.',
        whenMissing: 'Shows a dash when no customer was recorded on the link.',
        concepts: [],
        maintainerNotes: [
            'paymentLinks.customerName and customerPhone, else sentPayload.full_name',
        ],
    }),
    thirdPartyEntry('Columns', 'Provider', {
        question: 'What is the Provider?',
        answer: 'The payment partner that collected the money: NuPay, or Decentro for older links.',
        whenMissing: 'Always shown — it is read from the link itself.',
        concepts: [],
        maintainerNotes: ['paymentLinks.vendor'],
    }),
    thirdPartyEntry('Columns', 'Amount', {
        question: 'What is the Amount?',
        answer: 'The amount the link asked for. It is the figure the dashboard adds up once the link is paid; any convenience fee the provider charged on top is not kept here.',
        whenMissing: 'Shows a dash only when the link carries no amount.',
        concepts: [],
        maintainerNotes: ['paymentLinks.amount'],
    }),
    thirdPartyEntry('Columns', 'Status', {
        question: 'What does the Status mean?',
        answer: 'Paid when the payment succeeded, settlement included; Failed when the provider answered that it failed, was declined, cancelled or expired on its side; Expired when a link the provider never answered is past its expiry time; Pending otherwise. Expiry is read when the page loads, so an open link turns Expired on its own.',
        whenMissing: 'Always shown — it is read from the link itself.',
        concepts: [],
        lastReviewed: '2026-10-20',
        maintainerNotes: [
            'thirdPartySales.js → OUTCOME: PAID_STATUSES, FAILED_STATUSES, expireDate against the IST clock',
        ],
    }),
    thirdPartyEntry('Columns', 'Paid on', {
        question: 'Which day is Paid on?',
        answer: 'The day the payment came in, with the bank reference of the payment underneath it. For older links that never recorded the day, it is the day the link was last updated.',
        whenMissing:
            'Shows a dash until the link is paid; the reference is left out when the provider gave none.',
        concepts: [],
        maintainerNotes: ['paymentLinks.successOrFailDate, else updatedAt', 'paymentLinks.utr'],
    }),
    thirdPartyEntry('Columns', 'Expires', {
        question: 'What is Expires?',
        answer: 'The time after which the link can no longer be paid.',
        whenMissing: 'Shows a dash when the link was raised without an expiry.',
        concepts: [],
        maintainerNotes: ['paymentLinks.expireDate'],
    }),
    thirdPartyEntry('Summary', 'Links', {
        question: 'What does Links count?',
        answer: 'How many links are listed for the dates and filters chosen, whatever their status.',
        whenMissing: 'A count; reads zero when nothing is listed.',
        concepts: ['lists-vs-totals', 'go-live-floor'],
        maintainerNotes: ['thirdPartySales.js → TOTALS_SELECT'],
    }),
    thirdPartyEntry('Summary', 'Collected', {
        question: 'What is Collected?',
        answer: 'The amounts of the links that were paid, added up — the same figure the dashboard card shows for the same dates.',
        whenMissing: 'Adds nothing for a link that is pending, failed or expired.',
        concepts: ['lists-vs-totals', 'go-live-floor'],
        maintainerNotes: ['thirdPartySales.js → TOTALS_SELECT, outcome paid'],
    }),
    thirdPartyEntry('Summary', 'Pending', {
        question: 'What is Pending?',
        answer: 'The amounts asked for on links still open and not yet past their expiry.',
        whenMissing: 'Reads zero when no link in the period is in this state.',
        concepts: ['lists-vs-totals', 'go-live-floor'],
        maintainerNotes: ['thirdPartySales.js → TOTALS_SELECT, outcome pending'],
    }),
    thirdPartyEntry('Summary', 'Failed', {
        question: 'What is Failed?',
        answer: 'The amounts asked for on links whose payment failed, was declined or cancelled, or that the provider itself marked expired.',
        whenMissing: 'Reads zero when no link in the period is in this state.',
        concepts: ['lists-vs-totals', 'go-live-floor'],
        maintainerNotes: [
            'thirdPartySales.js → TOTALS_SELECT, outcome failed (FAILED_STATUSES incl. EXPIRED)',
        ],
        lastReviewed: '2026-10-20',
    }),
    thirdPartyEntry('Summary', 'Expired', {
        question: 'What is Expired?',
        answer: 'The amounts asked for on links the provider never answered that are now past their expiry.',
        whenMissing: 'Reads zero when no link in the period is in this state.',
        concepts: ['lists-vs-totals', 'go-live-floor'],
        maintainerNotes: ['thirdPartySales.js → TOTALS_SELECT, outcome expired'],
        lastReviewed: '2026-10-20',
    }),
];

// ---------------------------------------------------------------------------------------
// Statements (the same table on all four ledgers)
// ---------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------
// Third party configuration
// ---------------------------------------------------------------------------------------
const thirdPartyConfigEntry = (tab: string, label: string, fields: EntryFields) =>
    entry('Third Party Configuration', tab, label, { lastReviewed: '2026-10-28', ...fields });

const CHARGE_SHAPE =
    'a percentage of the amount collected plus a fixed sum per transaction, as agreed with the payment provider';

const THIRD_PARTY_CONFIGURATION: FaqEntry[] = [
    thirdPartyConfigEntry('Tabs', 'Payment Links', {
        question: 'What does the Payment Links tab show?',
        answer: `The charge Peko takes on each payment link collection, corporate by corporate. One default charge applies to every corporate onboarded for payment links; a corporate whose agreement carries its own charge is recorded here with that charge instead and marked Custom. The list carries every corporate that has applied for payment links, whatever its onboarding stands at. The portal records the terms; it does not yet work the charge out on each link.`,
        whenMissing:
            'Nothing on this tab is worked out from an accounting entry; it is the configuration exactly as the accounts team recorded it.',
        concepts: [],
        maintainerNotes: [
            'custom charge = paymentLinkOnboardings.accountingCharge JSON { percentage, fixed, setBy, setById, setAt } on the latest onboarding row per corporate',
            'default charge = settings row paymentLinkCharge, same JSON shape',
            'GET /accounting/third-party-configuration/payment-links → paymentLinkCharges.js listPaymentLinkCorporates',
        ],
    }),
    thirdPartyConfigEntry('Cards', 'Default charge', {
        question: 'What is the Default charge?',
        answer: `The charge applied to every corporate that has no custom charge of its own: ${CHARGE_SHAPE}. Changing it changes the charge for every corporate on the default at once; corporates with a custom charge keep theirs. The line underneath says when it was last set, by whom, and how many of the listed corporates carry a custom charge instead.`,
        whenMissing:
            'Not set until the accounts team records it; until then every corporate without a custom charge shows Not set.',
        concepts: [],
        maintainerNotes: [
            'PUT /accounting/third-party-configuration/payment-links/default → setDefaultCharge → settings row paymentLinkCharge',
            'audited as Payment link charge (percentage, fixed) through auditSettingChange',
        ],
    }),
    thirdPartyConfigEntry('Columns', 'Corporate', {
        question: 'Which corporate?',
        answer: 'The corporate account the charge applies to, with its login name underneath.',
        whenMissing: 'Shows a dash when the account no longer carries a name.',
        concepts: [],
        maintainerNotes: ['credentials.name and username'],
    }),
    thirdPartyConfigEntry('Columns', 'Onboarding', {
        question: 'What does Onboarding show?',
        answer: 'Where the corporate stands with the payment provider for payment links: Active once collections are switched on; Pending or Approval pending while the application is being processed; On hold or Suspended when the provider has paused it; Rejected when it was turned down.',
        whenMissing: 'Always shown: every corporate listed has applied for payment links.',
        concepts: [],
        maintainerNotes: ['paymentLinkOnboardings.status, latest row per corporate'],
    }),
    thirdPartyConfigEntry('Columns', 'Provider', {
        question: 'What is the Provider?',
        answer: 'The payment provider the corporate was onboarded with for payment links: NuPay, or Decentro for older onboardings.',
        whenMissing: 'Shows a dash when the application carries no provider yet.',
        concepts: [],
        maintainerNotes: ['paymentLinkOnboardings.vendor'],
    }),
    thirdPartyConfigEntry('Columns', 'Charge', {
        question: 'What is the Charge?',
        answer: `The charge that applies to this corporate’s payment link collections: ${CHARGE_SHAPE}. It is the corporate’s own charge where one was recorded, otherwise the default. None means a charge of nothing was recorded on purpose.`,
        formula: 'Charge on a collection = Amount collected × Charge % + Charge per transaction',
        whenMissing:
            'Not set when the corporate has no custom charge and no default has been recorded yet.',
        concepts: [],
        maintainerNotes: [
            'effective.percentage and effective.fixed: the onboarding row’s accountingCharge, else the settings row',
        ],
    }),
    thirdPartyConfigEntry('Columns', 'Source', {
        question: 'What does Source mean?',
        answer: 'Custom when the corporate has its own charge recorded here; Default when it follows the default charge; Not set when it has no custom charge and no default exists yet.',
        whenMissing: 'Always shown.',
        concepts: [],
        maintainerNotes: ['effective.source'],
    }),
    thirdPartyConfigEntry('Columns', 'Last Set', {
        question: 'What is Last Set?',
        answer: 'The day the corporate’s own charge was last saved, and who saved it.',
        whenMissing:
            'Shows a dash for a corporate on the default charge; the default’s own date sits on its card.',
        concepts: [],
        maintainerNotes: ['accountingCharge.setAt and setBy on the onboarding row'],
    }),
    thirdPartyConfigEntry('Form', 'Charge (%)', {
        question: 'What goes in Charge (%)?',
        answer: 'The percentage of each collection that Peko charges. Enter 0 when the agreement carries no percentage.',
        whenMissing:
            'Required; a charge is always recorded with both parts, even when one of them is 0.',
        concepts: [],
        maintainerNotes: ['accountingCharge.percentage, four decimals'],
    }),
    thirdPartyConfigEntry('Form', 'Charge per transaction (₹)', {
        question: 'What goes in Charge per transaction (₹)?',
        answer: 'The fixed sum Peko charges on every collection, on top of the percentage. Enter 0 when the agreement carries no fixed part.',
        whenMissing:
            'Required; a charge is always recorded with both parts, even when one of them is 0.',
        concepts: [],
        maintainerNotes: ['accountingCharge.fixed, two decimals'],
    }),
];

const STATEMENTS: FaqEntry[] = [
    ...common('Statements', 'Columns', ['Date', 'Reference', 'Entry No.', 'Type', 'Posted']),
    entry('Statements', 'Columns', 'Particulars', {
        question: 'What is Particulars?',
        answer: 'What the line is, one line per movement. For an order: its event and service — Order value, Order value reversed, Refund, Cashback, Earned or Purchase, followed by the service — and on a vendor statement a second line, Commission or Commission reversed, for Peko’s commission in it; a gateway statement names the transaction instead of the service. For an entry recorded by hand: Opening balance, Deposit, Payout or Received with the mode, Gateway charges, Commission, Cost of sales, Credit note or Debit note with its reference, Wallet top-up or funds added or withdrawn by the team, and Reversal with what it reverses. An order whose entry has not reached the books is listed by its event with no amount.',
        whenMissing: RECORD,
        concepts: ['statement-conventions'],
        maintainerNotes: ['*Statement.js → entryRow', 'vendorStatement.js → orderLines'],
        lastReviewed: '2026-10-21',
    }),
    entry('Statements', 'Columns', 'Debit', {
        question: 'What is Debit on a statement?',
        answer: 'It depends on the ledger. For a vendor it raises the advance Peko holds: a deposit or the opening balance, Peko’s commission on an order (charged to the vendor, so it never left the advance), a refund putting an order’s value back, a debit note raised on the vendor, or the reversal of a credit note or a cost of sales. For a partner it settles or takes back what Peko owes: a payout, a debit note, or a refund taking back share. For a gateway it is money the gateway took in, or the reversal of a receipt or charge. For a subscriber it is money out of the wallet: a purchase, a withdrawal by the team, or cashback taken back.',
        lastReviewed: '2026-10-20',
        whenMissing:
            'Blank when the line is on the other side. A dash on both sides means the entry was skipped or never recorded: it is listed, but it moves nothing.',
        concepts: ['statement-conventions'],
        maintainerNotes: ['*_STATEMENT_CONVENTION'],
    }),
    entry('Statements', 'Columns', 'Credit', {
        question: 'What is Credit on a statement?',
        answer: 'The other side. For a vendor it consumes the advance: an order sold on margin at its vendor-side value (an order sold on a markup basis, agent or principal, is never listed), a credit note, a cost of sales recorded by hand, the commission given back on a refund, or the reversal of a deposit or a debit note. For a partner it raises what Peko owes: share earned, the opening balance, or the reversal of a payout or debit note. For a gateway it reduces what is still to come: a receipt or the charge the gateway kept. For a subscriber it is money into the wallet: a top-up, funds added by the team, a refund or cashback.',
        lastReviewed: '2026-10-20',
        whenMissing:
            'Blank when the line is on the other side. A dash on both sides means the entry was skipped or never recorded: it is listed, but it moves nothing.',
        concepts: ['statement-conventions'],
        maintainerNotes: ['*_STATEMENT_CONVENTION'],
    }),
    entry('Statements', 'Columns', 'Balance', {
        question: 'What is Balance?',
        answer: 'The running balance after the line, starting from the opening balance for the range.',
        whenMissing: 'Worked out from the lines above.',
        concepts: ['statement-conventions'],
        maintainerNotes: ['ledgerStatement.js → tallyStatement'],
    }),
    entry('Statements', 'Cards', 'Opening Balance', {
        question: 'What is Opening Balance?',
        answer: 'The balance carried into the range from everything before it, so the running balance never restarts at zero. Zero on a statement with no date range.',
        whenMissing: 'Worked out.',
        concepts: ['statement-conventions', 'opening-balances'],
        maintainerNotes: ['*Statement.js → openingBalance'],
    }),
    entry('Statements', 'Cards', 'Total Debit', {
        question: 'What is Total Debit?',
        answer: 'The debit column added up over every line in the period. A search or the Debit / Credit filter narrows the lines listed, not this figure.',
        lastReviewed: '2026-10-20',
        whenMissing: 'Worked out.',
        concepts: ['statement-conventions'],
        maintainerNotes: ['ledgerStatement.js → tallyStatement'],
    }),
    entry('Statements', 'Cards', 'Total Credit', {
        question: 'What is Total Credit?',
        answer: 'The credit column added up over every line in the period. A search or the Debit / Credit filter narrows the lines listed, not this figure.',
        lastReviewed: '2026-10-20',
        whenMissing: 'Worked out.',
        concepts: ['statement-conventions'],
        maintainerNotes: ['ledgerStatement.js → tallyStatement'],
    }),
    entry('Statements', 'Cards', 'Closing Balance', {
        question: 'What is Closing Balance?',
        answer: 'The opening balance plus the side that raises this ledger’s balance, less the side that lowers it.',
        formula:
            'Vendor and gateway: Closing balance = Opening balance + Total debit − Total credit. Partner and subscriber: Closing balance = Opening balance + Total credit − Total debit',
        lastReviewed: '2026-10-20',
        whenMissing: 'Worked out.',
        concepts: ['statement-conventions'],
        maintainerNotes: ['ledgerStatement.js → tallyStatement'],
    }),
];

// ---------------------------------------------------------------------------------------
// Order journals (the operations screen)
// ---------------------------------------------------------------------------------------
const ORDER_JOURNALS: FaqEntry[] = [
    entry('Order Journals', 'Journal Status', 'Recorded', {
        question: 'What does Recorded mean?',
        answer: 'The accounting entry for this event was accepted by the books. The table’s Journal Status column and the status filter call the same state Success.',
        whenMissing: 'One of four states.',
        concepts: ['journal-states'],
        maintainerNotes: [
            'orders.journalRecordStatus',
            'journalStatus.tsx → renderJournalStatusSummary',
        ],
        lastReviewed: '2026-10-20',
    }),
    entry('Order Journals', 'Journal Status', 'Failed', {
        question: 'What does Failed mean?',
        answer: 'The entry was sent to the books and refused. Its lines exist; post it again from the order’s journal view once the cause is fixed — the retry beside the line, or Retry Failed Journals for all of them — or record it by hand from the Record link or the Fix in Manual Operations button on the journal. The reason is shown on the info icon. An entry that was never sent reads Skipped instead.',
        whenMissing: 'One of four states.',
        concepts: ['journal-states'],
        maintainerNotes: [
            'orders.journalRecordStatus',
            'journalData.<event>.reason',
            'journalStatus.tsx → outcomeOf',
        ],
        lastReviewed: '2026-09-30',
    }),
    entry('Order Journals', 'Journal Status', 'Skipped', {
        question: 'What does Skipped mean?',
        answer: 'The entry was never sent to the books. Either it was held back — posting paused, the service set not to post, a refund waiting for its sale entry, or a commission or platform fee not yet confirmed by the accounts team or changed outside this portal since it was confirmed — or it could not be prepared, for example because an account was missing from the chart of accounts or the lines did not balance. The reason is on the info icon. Fix the cause, then retry it from the order’s journal view; a retry before that leaves it skipped.',
        whenMissing: 'One of four states.',
        concepts: ['journal-states', 'go-live-baseline'],
        maintainerNotes: [
            'journalData.<event>.skipped, with a false verdict or none',
            'recordJournal.js → persistNotRecorded / skipJournal',
        ],
        lastReviewed: '2026-10-05',
    }),
    entry('Order Journals', 'Journal Status', 'Not recorded', {
        question: 'What does Not recorded mean?',
        answer: 'No entry was ever attempted for this order. Open the order’s journal view: when the order’s figures were stored, Edit & Retry works the entry out and posts it; when nothing was stored, use Record to enter it by hand in Manual Operations. An order dated before the go-live date is refused either way.',
        whenMissing:
            'One of four states. In the journal view only the Transaction line reads Not recorded; a refund or cashback line that was never attempted shows a dash.',
        concepts: ['journal-states', 'go-live-floor', 'manual-journals'],
        maintainerNotes: [
            'controllers/admin/orderJournal.js → resolveOrderJournalsQuery → singleKeyStatusLiteral(key, "notRecorded")',
            'OrderJournalDrawer.tsx → canRetry needs stored figures; JournalStatusBreakdown.tsx → Record link to manualJournalPath',
        ],
        lastReviewed: '2026-10-20',
    }),
];

const MANUAL_REVIEWED = '2026-10-07';

const manualEntry = (tab: string, label: string, fields: EntryFields) =>
    entry('Manual Operations', tab, label, { lastReviewed: MANUAL_REVIEWED, ...fields });

const cardEntry = (label: string, fields: EntryFields) =>
    manualEntry('Cards', label, { lastReviewed: '2026-10-08', ...fields });

const LEDGER_CARD_ACCESS = (ledger: string) =>
    `Shown when your role can open the ${ledger} ledger; changing an entry needs the Update right on ${ledger}.`;

const setupEntry = (label: string, fields: EntryFields) =>
    manualEntry('Set-up', label, { lastReviewed: '2026-10-08', ...fields });

const MANUAL_OPERATIONS: FaqEntry[] = [
    manualEntry('Cards', 'Journal', {
        question: 'What does the Journal operation do?',
        answer: 'It records an accounting entry the automatic posting never made for an order. Find the order by its transaction id, pick the event, check the lines and post. An entry already in the books is left as it is; a wrong figure is put right in the books themselves with a manual commission or a credit note. Every posting is kept in the history underneath, with who did it and why.',
        whenMissing: 'Always offered; posting needs the Update right on Manual Operations.',
        concepts: ['manual-journals', 'journal-states'],
        maintainerNotes: ['pages/ManualJournal.tsx', 'controllers/admin/manualJournal.js'],
    }),
    cardEntry('Commission Invoice', {
        question: 'What does the Commission Invoice operation do?',
        answer: 'It finds a commission invoice by the order’s transaction id, or by the entry number of a commission recorded by hand, and shows it as the vendor would receive it. The accounts team can change who it is billed to — company name, address, state, GSTIN — and send it to the vendor’s email on file or to any other addresses. The place of supply follows the state on the invoice (the state the GSTIN names, when one is given) and the tax is split to match: IGST when the vendor is outside Peko’s own state, CGST and SGST when inside it. The tax amount itself does not change, only how it is split. The billed-to saved here stays on that invoice and is used whenever it is downloaded from the vendor’s Commissions tab or sent again; the invoice number, date and amounts never change. Every change and every send is kept in the Audit Trail under Vendor invoice.',
        whenMissing: LEDGER_CARD_ACCESS('Vendors'),
        concepts: ['ledger-corrections', 'gst-split'],
        maintainerNotes: [
            'pages/CommissionInvoice.tsx, components/manualOperations/CommissionInvoiceEditor.tsx',
            'controllers/admin/vendorCommissionInvoices.js → vendorCommissionInvoices.js; edits live on orders.pekoInvoiceDetails.vendor.edits or vendorLedgerEntries.documentEdits',
        ],
        lastReviewed: '2026-10-26',
    }),
    cardEntry('Vendor Deposits', {
        question: 'What does the Vendor Deposits operation do?',
        answer: 'It lists every vendor. Pick one to open its Deposits tab, where a deposit paid to the vendor is recorded, edited, deleted or reversed. The vendor’s balance is worked out from these deposits.',
        whenMissing: LEDGER_CARD_ACCESS('Vendors'),
        concepts: ['ledger-corrections', 'vendor-convention'],
        maintainerNotes: [
            'config/manualOperations.tsx → vendor-deposits',
            'pages/ManualOperationProfiles.tsx',
        ],
    }),
    cardEntry('Vendor Credit Notes', {
        question: 'What does the Vendor Credit Notes operation do?',
        answer: 'It lists every vendor. Pick one to open its Credit Notes tab, where a credit note raised by hand is recorded, edited, deleted or reversed. A credit note read off a refund comes from the order itself and is not changed there.',
        whenMissing: LEDGER_CARD_ACCESS('Vendors'),
        concepts: ['ledger-corrections', 'vendor-convention'],
        maintainerNotes: ['config/manualOperations.tsx → vendor-credit-notes'],
    }),
    cardEntry('Vendor Commissions', {
        question: 'What does the Vendor Commissions operation do?',
        answer: 'It lists every vendor. Pick one to open its Commissions tab, where a commission recorded by hand is recorded, edited, deleted or reversed. Commission worked out from orders is not changed there; a wrong order figure is put right with a manual commission or a credit note.',
        whenMissing: LEDGER_CARD_ACCESS('Vendors'),
        concepts: ['ledger-corrections', 'vendor-convention'],
        maintainerNotes: ['config/manualOperations.tsx → vendor-commissions'],
    }),
    cardEntry('Vendor Cost of Sales', {
        question: 'What does the Vendor Cost of Sales operation do?',
        answer: 'It lists every vendor. Pick one to open its Cost of Sales tab, where a cost of sales entry recorded by hand is recorded, edited, deleted or reversed. It is the mirror of a commission recorded by hand: it comes out of the advance and is credited on the statement. This is where the vendor’s bills for orders sold on a markup basis are recorded, since those orders never come out of the advance themselves.',
        whenMissing: LEDGER_CARD_ACCESS('Vendors'),
        concepts: ['ledger-corrections', 'vendor-convention'],
        maintainerNotes: ['config/manualOperations.tsx → vendor-cost-of-sales'],
        lastReviewed: '2026-10-26',
    }),
    cardEntry('Vendor Debit Notes', {
        question: 'What does the Vendor Debit Notes operation do?',
        answer: 'It lists every vendor. Pick one to open its Debit Notes tab, where a debit note raised on the vendor is recorded, edited, deleted or reversed. It is the mirror of a cost of sales: it puts money back into the advance and is debited on the statement, so it is how a wrong cost of sales entry or a disputed vendor bill is put right.',
        whenMissing: LEDGER_CARD_ACCESS('Vendors'),
        concepts: ['ledger-corrections', 'vendor-convention'],
        maintainerNotes: ['config/manualOperations.tsx → vendor-debit-notes'],
        lastReviewed: '2026-10-26',
    }),
    cardEntry('Vendor Opening Balances', {
        question: 'What does the Vendor Opening Balances operation do?',
        answer: 'It lists every vendor. Pick one to open its Deposits tab, where the opening balance is listed with the deposits: set it once, then edit, delete or reverse it from its row. It must stay dated before the first entry recorded after it.',
        whenMissing: LEDGER_CARD_ACCESS('Vendors'),
        concepts: ['ledger-corrections', 'opening-balances'],
        maintainerNotes: ['config/manualOperations.tsx → vendor-opening-balances'],
    }),
    cardEntry('Partner Payouts', {
        question: 'What does the Partner Payouts operation do?',
        answer: 'It lists every partner. Pick one to open its Payments tab, where a payout made to the partner is recorded, edited, deleted or reversed. What is left to pay the partner follows at once.',
        whenMissing: LEDGER_CARD_ACCESS('Partners'),
        concepts: ['ledger-corrections', 'partner-share'],
        maintainerNotes: ['config/manualOperations.tsx → partner-payouts'],
    }),
    cardEntry('Partner Debit Notes', {
        question: 'What does the Partner Debit Notes operation do?',
        answer: 'It lists every partner. Pick one to open its Debit Notes tab, where a debit note raised against the partner is recorded, edited, deleted or reversed.',
        whenMissing: LEDGER_CARD_ACCESS('Partners'),
        concepts: ['ledger-corrections', 'partner-share'],
        maintainerNotes: ['config/manualOperations.tsx → partner-debit-notes'],
    }),
    cardEntry('Partner Opening Balances', {
        question: 'What does the Partner Opening Balances operation do?',
        answer: 'It lists every partner. Pick one to open its Payments tab, where the opening balance, what was still owed to the partner when the portal started, is listed with the payouts: set it once, then edit, delete or reverse it from its row.',
        whenMissing: LEDGER_CARD_ACCESS('Partners'),
        concepts: ['ledger-corrections', 'opening-balances'],
        maintainerNotes: ['config/manualOperations.tsx → partner-opening-balances'],
    }),
    cardEntry('Gateway Receipts', {
        question: 'What does the Gateway Receipts operation do?',
        answer: 'It lists every payment gateway. Pick one to open its Received & Bills tab, where money the gateway settled to Peko is recorded, edited, deleted or reversed. A receipt recorded together with its fee can only be reversed.',
        whenMissing: LEDGER_CARD_ACCESS('Payment Gateways'),
        concepts: ['ledger-corrections', 'gateway-convention'],
        maintainerNotes: ['config/manualOperations.tsx → gateway-receipts'],
    }),
    cardEntry('Gateway Fees', {
        question: 'What does the Gateway Fees operation do?',
        answer: 'It lists every payment gateway. Pick one to open its Received & Bills tab, where a fee the gateway kept is recorded, edited, deleted or reversed under Bills / Fees Charged.',
        whenMissing: LEDGER_CARD_ACCESS('Payment Gateways'),
        concepts: ['ledger-corrections', 'gateway-convention'],
        maintainerNotes: ['config/manualOperations.tsx → gateway-fees'],
    }),
    cardEntry('Gateway Opening Balances', {
        question: 'What does the Gateway Opening Balances operation do?',
        answer: 'It lists every payment gateway. Pick one to open its Received & Bills tab, where the opening balance, what the gateway still held when the portal started, is listed with the receipts: set it once, then edit, delete or reverse it from its row.',
        whenMissing: LEDGER_CARD_ACCESS('Payment Gateways'),
        concepts: ['ledger-corrections', 'opening-balances'],
        maintainerNotes: ['config/manualOperations.tsx → gateway-opening-balances'],
    }),
    cardEntry('Subscriber Wallet Adjustments', {
        question: 'What does the Subscriber Wallet Adjustments operation do?',
        answer: 'It lists every subscriber. Pick one to open its Cashbacks & Rewards tab, where Adjust wallet opens Transfer Funds to top the wallet up or withdraw from it. A wallet movement moves real money and is posted to the books, so it is never edited or deleted: a wrong one is put right with a transfer the other way.',
        whenMissing:
            'Shown when your role can open the Subscribers ledger; Transfer Funds needs its own permission.',
        concepts: ['ledger-corrections', 'subscriber-bases'],
        maintainerNotes: [
            'config/manualOperations.tsx → subscriber-wallet-adjustments',
            'SubscriberTabPanel.tsx → ADJUST_WALLET_PATH',
        ],
    }),
    manualEntry('Order', 'Transaction', {
        question: 'What is Transaction?',
        answer: 'The order’s transaction id — the same id shown on Order Journals and on the customer’s receipt.',
        whenMissing: RAW,
        concepts: [],
        maintainerNotes: ['orders.corporateTxnId'],
    }),
    manualEntry('Order', 'Date', {
        question: 'What is Date?',
        answer: 'The day the order was placed. A sale entry is dated here unless you change it.',
        whenMissing: RAW,
        concepts: ['go-live-floor'],
        maintainerNotes: ['orders.transactionDate'],
    }),
    manualEntry('Order', 'Service', {
        question: 'What is Service?',
        answer: 'The service the order was placed for; a Peko subscription shows its plan name instead.',
        whenMissing: 'Shows a dash when the order has neither a service nor a plan.',
        concepts: [],
        maintainerNotes: [
            'serviceOperators.serviceProvider',
            'orderResponse.serviceName / subscriptionDetails.name',
        ],
        lastReviewed: '2026-10-20',
    }),
    manualEntry('Order', 'Customer', {
        question: 'Who is the Customer?',
        answer: 'The corporate that placed the order: its name, otherwise its account username. Underneath, the GSTIN and state on its profile. Peko’s GST on the platform fee, and on a sale where Peko sells in its own name, is charged to this customer, and its state against Peko’s decides whether that GST splits into CGST and SGST (same state) or goes to IGST (another state).',
        whenMissing:
            'The name is always shown; a dash stands for a GSTIN or state missing from the profile, and the entry then assumes the same state as Peko.',
        concepts: [],
        maintainerNotes: [
            'credentials.name / username',
            'corporateUsers.gstNumber / state',
            'journalSuggestion.js → customerInterState',
        ],
    }),
    manualEntry('Order', 'Partner', {
        question: 'What is Partner?',
        answer: 'The whitelabel partner the customer belongs to, or Peko (Default) for Peko’s own customers.',
        whenMissing: 'Reads Peko (Default) when the customer has no partner.',
        concepts: [],
        maintainerNotes: ['credentials.registeredBy → partner credential name'],
    }),
    manualEntry('Order', 'Gateway', {
        question: 'What is Gateway?',
        answer: 'The payment gateway the money came in through, which is the first debit of a sale entry. Read from the accounting entry when there is one, otherwise from the payment record on the order.',
        whenMissing:
            'A dash when neither names a gateway; the suggested first row then has its amount but no account.',
        concepts: [],
        maintainerNotes: [
            'journalData.paymentGatewayName',
            'orders.paymentModeResponse → paymentGatewayName',
        ],
    }),
    manualEntry('Order', 'Amount', {
        question: 'What is Amount?',
        answer: 'What the customer was charged for the order, as recorded on the order itself.',
        whenMissing: RAW,
        concepts: ['raw-vs-derived'],
        maintainerNotes: ['orders.amountInINR'],
    }),
    manualEntry('Order', 'Status', {
        question: 'What does Status mean here?',
        answer: 'Whether the payment succeeded, failed or was refunded, as the order records it. It decides which events can be recorded: a sale needs a paid order, or a failed one whose refund is already in the books; a refund needs a refunded one; a pending order has nothing final to record.',
        whenMissing: RAW,
        concepts: ['manual-journals'],
        maintainerNotes: ['orders.status', 'manualJournal.js → recordReasons'],
    }),
    manualEntry('Events', 'Event', {
        question: 'What is an Event?',
        answer: 'One of the accounting entries an order can have: the sale, a refund, an admin refund, cashback given to the wallet, or cashback taken back. Each is posted to the books on its own.',
        whenMissing:
            'All five are always listed; the ones the records do not show cannot be recorded.',
        concepts: ['manual-journals', 'journal-states'],
        maintainerNotes: ['manualJournal.js → MANUAL_KEYS / EVENT_LABELS'],
    }),
    manualEntry('Events', 'Event Date', {
        question: 'What is Event Date?',
        answer: 'The day the entry carries in the books. For an entry already in the books it is the stored date; otherwise it is the day the event happened — the order date for a sale or an admin refund, the day the money moved for a refund or cashback — which is also the date offered when you record it.',
        whenMissing: 'Always shown.',
        concepts: ['manual-journals'],
        maintainerNotes: ['manualJournal.js → defaultsOf'],
    }),
    manualEntry('Events', 'Posted', COMMON.Posted),
    manualEntry('Events', 'Entry Reference', {
        question: 'What is Entry Reference?',
        answer: 'The books’ own reference for the entry, kept from the moment it is posted. Entries posted before references were kept show a dash.',
        whenMissing: 'A dash until the entry is posted.',
        concepts: ['manual-journals'],
        maintainerNotes: ['journalData.<event>.providerJournalId'],
    }),
    manualEntry('Events', 'Last Change', {
        question: 'What is Last Change?',
        answer: 'Who recorded this entry by hand, and on which day. Entries the automatic posting made show a dash.',
        whenMissing: 'A dash when nobody has touched the entry by hand.',
        concepts: ['manual-journals'],
        maintainerNotes: ['journalData.<event>.manual'],
    }),
    setupEntry('Payment Through', {
        question: 'What is Payment Through?',
        answer: 'How the customer paid: through the gateway, from the wallet, or part from each. It decides which money-in rows the entry carries. Gateway only means the whole amount came through the gateway, wallet only means none of it did, and gateway and wallet asks below how much came through the gateway.',
        whenMissing: 'Prefilled from the way the order was paid; always shown.',
        concepts: ['manual-journals'],
        maintainerNotes: ['manualJournalSetup.js → setupDefaultsFor (orders.paymentMode)'],
    }),
    setupEntry('Gateway Account', {
        question: 'Which account is the gateway money posted to?',
        answer: 'The bank account the gateway collection is debited to. Prefilled from the gateway named on the order when a matching account exists; pick one when it is blank. Greyed out when the order was paid from the wallet alone.',
        whenMissing: 'Greyed out for a wallet-only payment.',
        concepts: ['manual-journals'],
        maintainerNotes: [
            'manualJournalSetup.js → gatewayAccountOf; posted as journalAccountIds.paymentGateway',
        ],
    }),
    setupEntry('Order Amount', {
        question: 'What is Order Amount here?',
        answer: 'What the customer paid for the service before the platform fee. The commission, the vendor’s share, the platform fee and the partner’s share are all worked out from it. For a subscription or a sale with no vendor the entry is worked out from Paid Via Gateway instead.',
        formula: 'Amount charged on the order − platform fee charged on it (GST included)',
        whenMissing: 'Prefilled from the order; always shown.',
        concepts: ['manual-journals'],
        maintainerNotes: [
            'manualJournalSetup.js → setupDefaultsFor: max(0, amountInINR − surcharge); ownRevenueTemplate reads pgAmount only',
        ],
        lastReviewed: '2026-10-20',
    }),
    setupEntry('Paid Via Gateway', {
        question: 'What is Paid Via Gateway?',
        answer: 'How much of the money came through the gateway, platform fee included, when the rest came from the wallet. It equals the full amount for a gateway-only payment and zero for a wallet-only one; it can only be edited when both were used.',
        whenMissing: 'Greyed out unless the order was paid partly from the wallet.',
        concepts: ['manual-journals'],
        maintainerNotes: ['paymentModeResponse.pgAmount'],
    }),
    setupEntry('Subscription Payment', {
        question: 'What is Subscription Payment?',
        answer: 'Yes when the order bought a Peko plan, an add-on or a Peko Commerce plan. A subscription is Peko’s own revenue: the entry carries the revenue and the GST on it, never a vendor, a commission or a platform fee, and the sale is listed under Peko Subscriptions.',
        whenMissing: 'Prefilled from the order; always shown.',
        concepts: ['manual-journals'],
        maintainerNotes: [
            'orders.optional in SUBSCRIPTION_TAGS: SUBSCRIPTION / SUBSCRIPTION-ADDONS / ECOMMERCE-SUBSCRIPTION (manualJournalSetup.js)',
        ],
        lastReviewed: '2026-10-20',
    }),
    setupEntry('Billing Cycle', {
        question: 'What is Billing Cycle?',
        answer: 'Monthly or annual, for a subscription. It is kept with the entry so the subscriptions report can tell the two apart.',
        whenMissing: 'Greyed out unless Subscription Payment is Yes.',
        concepts: ['manual-journals'],
        maintainerNotes: ['journalData.billingType'],
    }),
    setupEntry('Vendor Involved', {
        question: 'What is Vendor Involved?',
        answer: 'Yes when a vendor delivered the service and is owed its share. No when Peko delivered the service itself or settles the vendor outside the portal; the sale is then booked as Peko’s own revenue, the same way as a subscription, and never shows on a vendor profile.',
        whenMissing:
            'Greyed out for a subscription, whose entry is worked out as Peko’s own revenue whatever the field reads.',
        lastReviewed: '2026-10-20',
        concepts: ['manual-journals'],
        maintainerNotes: ['serviceOperator.vendorId; commissionMode OWN_REVENUE when No'],
    }),
    setupEntry('Commission Charged', {
        question: 'What is Commission Charged?',
        answer: 'Yes when Peko keeps a commission or a markup on the vendor’s price. No for a pass-through sale where the vendor’s price reaches the customer unchanged; the mode still applies, so a principal sale with no markup is booked as sales with nothing kept by Peko.',
        whenMissing: 'Greyed out without a vendor.',
        concepts: ['manual-journals'],
        maintainerNotes: ['manualJournalSetup.js → commissionOn'],
    }),
    setupEntry('Commission Type', {
        question: 'What is Commission Type?',
        answer: 'A percentage of the amount sold or a flat sum per order. A fixed per-transaction amount can be added to either below.',
        whenMissing: 'Greyed out when no commission is charged.',
        concepts: ['manual-journals'],
        maintainerNotes: ['serviceOperator.commissionType'],
    }),
    setupEntry('Commission Mode', {
        question: 'What is Commission Mode?',
        answer: 'Margin when the vendor sells to the customer and Peko keeps a commission out of the collection, with the vendor owed the rest. Principal markup when Peko sells the service in its own name: only the markup is Peko’s income, with GST on the markup, and the vendor’s price is owed to the vendor. Mixed when one order carries items sold both ways; the two amounts are then asked for below.',
        whenMissing: 'Greyed out without a vendor.',
        concepts: ['manual-journals'],
        maintainerNotes: ['serviceOperator.commissionMode; sellingMode.js'],
    }),
    setupEntry('Commission Value', {
        question: 'What is Commission Value?',
        answer: 'The percentage or the flat sum, depending on the type. A percentage is applied to the amount sold in that mode.',
        whenMissing: 'Greyed out when no commission is charged.',
        concepts: ['manual-journals'],
        maintainerNotes: ['serviceOperator.providerCommission'],
    }),
    setupEntry('Fixed Per Transaction', {
        question: 'What is Fixed Per Transaction?',
        answer: 'A fixed sum added to the commission on every order, on top of the percentage or the flat sum.',
        whenMissing: 'Greyed out when no commission is charged.',
        concepts: ['manual-journals'],
        maintainerNotes: ['serviceOperator.fixedCommissionPerTransaction'],
    }),
    setupEntry('Commission Quoted Incl. GST', {
        question: 'What does Commission Quoted Incl. GST mean?',
        answer: 'Yes when the commission figure already includes GST, so the GST is carved out of it. No when GST is added on top of it.',
        whenMissing: 'Greyed out when no commission is charged.',
        concepts: ['manual-journals'],
        maintainerNotes: ['serviceOperator.isCommissionInclGST'],
    }),
    setupEntry('Sold As Principal', {
        question: 'What is Sold As Principal?',
        answer: 'For a mixed order, the part of the amount sold in Peko’s own name with a markup. Together with Sold On Margin it must add up to the order amount.',
        whenMissing: 'Greyed out unless the mode is Mixed.',
        concepts: ['manual-journals'],
        maintainerNotes: ['setup.mixed.principalAmount'],
    }),
    setupEntry('Sold On Margin', {
        question: 'What is Sold On Margin?',
        answer: 'For a mixed order, the part of the amount the vendor sells and Peko takes a commission on. Together with Sold As Principal it must add up to the order amount.',
        whenMissing: 'Greyed out unless the mode is Mixed.',
        concepts: ['manual-journals'],
        maintainerNotes: ['setup.mixed.marginAmount'],
    }),
    setupEntry('Platform Fee Type', {
        question: 'What is Platform Fee Type?',
        answer: 'Whether the platform fee charged on top of the order is a flat sum or a percentage of the amount. GST is added on it either way.',
        whenMissing:
            'Greyed out for a subscription or a sale with no vendor: both are Peko’s own revenue and carry no platform fee.',
        concepts: ['manual-journals'],
        maintainerNotes: ['mirrors paymentGateway calculateSurcharge'],
    }),
    setupEntry('Platform Fee Value', {
        question: 'What is Platform Fee Value?',
        answer: 'The fee before GST, as a sum or a percentage. Prefilled from the surcharge on the order with the GST taken out.',
        formula:
            'Prefilled: platform fee on the order ÷ (1 + GST rate). Entry: a flat value as typed, or the percentage of Order Amount; GST is added on top either way',
        whenMissing: 'Greyed out for a subscription or a sale with no vendor.',
        concepts: ['manual-journals'],
        maintainerNotes: [
            'orders.surcharge ÷ (1 + GST rate)',
            'manualJournalSetup.js → vendorSaleTemplate feeExcl / feeIncl',
        ],
        lastReviewed: '2026-10-20',
    }),
    setupEntry('Partner Behind The Order', {
        question: 'What is Partner Behind The Order?',
        answer: 'Yes when the customer was brought in by a partner, read from the customer’s record. It cannot be changed here; when it is Yes, the partner’s share of the income is worked out with the figures.',
        whenMissing: 'Always shown, never editable.',
        concepts: ['manual-journals'],
        maintainerNotes: ['credential.registeredBy'],
    }),
    setupEntry('Partner Share', {
        question: 'What is Partner Share?',
        answer: 'The partner’s percentage of what Peko earns on the order: the commission, the markup and the platform fee before GST, or, for a subscription or a sale with no vendor, what came through the gateway before GST plus any discount Peko bore, in each case less the gateway charge the partner bears. Prefilled from the partner’s record. Nothing is shared when that base is zero or below.',
        formula:
            '(Peko’s earnings − gateway charge) × share % = share excl. GST; GST is added on top to give what Peko owes the partner',
        whenMissing: 'Greyed out when no partner is behind the order.',
        concepts: ['manual-journals', 'partner-share'],
        maintainerNotes: [
            'systemUsers.sharePercentage',
            'manualJournalSetup.js → partnerFigures; ownRevenueTemplate base = pg net of GST + coupon (aligned with computeJournalData.js on 2026-10-20)',
        ],
        lastReviewed: '2026-10-20',
    }),
    setupEntry('Gateway Charge', {
        question: 'What is Gateway Charge in the set-up?',
        answer: 'The percentage of the amount paid through the gateway that the partner bears as the gateway’s charge. Prefilled from the partner’s terms. It comes off Peko’s earnings before the partner’s share is worked out, and the charge is written on the entry as a figure, never posted as a line.',
        whenMissing:
            'Greyed out when no partner is behind the order. Left blank, with the fixed sum, for a partner with no terms, which means no charge.',
        formula:
            'Paid Via Gateway × percentage ÷ 100 + fixed sum per transaction, only when the partner has terms and something came through the gateway',
        concepts: ['manual-journals', 'partner-share'],
        maintainerNotes: [
            'systemUsers.gatewayCharge.percentage',
            'manualJournalSetup.js → partnerFigures; others/utils/gatewayChargeTerms.js → gatewayChargeOn',
        ],
        lastReviewed: '2026-10-20',
    }),
    setupEntry('Gateway Charge Per Transaction', {
        question: 'What is Gateway Charge Per Transaction?',
        answer: 'The fixed sum the partner bears on every gateway payment, on top of the percentage. Prefilled from the partner’s terms.',
        whenMissing:
            'Greyed out when no partner is behind the order. Left blank, with the percentage, for a partner with no terms.',
        concepts: ['manual-journals', 'partner-share'],
        maintainerNotes: ['systemUsers.gatewayCharge.fixed'],
        lastReviewed: '2026-10-14',
    }),
    setupEntry('Coupon Used', {
        question: 'What is Coupon Used?',
        answer: `Yes when anything Peko bore cut the price — ${DISCOUNT_WORDS}. The discount below is then Peko’s own cost, and it changes what the wallet carried. For a Peko subscription or a Peko Commerce plan it opens as Yes when the subscription recorded a discount.`,
        whenMissing: 'Always shown.',
        concepts: ['manual-journals'],
        maintainerNotes: ['couponTotalDiscount', 'manualJournalSetup.js → loadPlanDiscount'],
        lastReviewed: '2026-10-20',
    }),
    setupEntry('Coupon Total', {
        question: 'What is Coupon Total?',
        answer: 'The whole discount the customer got, from every source Peko bears: the coupon, any Peko Credit and the plan’s own discount together. Peko bears all of it; for a subscription it is added back to the revenue, because the plan is still worth its full price. For a Peko subscription the plan’s own discount is prefilled from the subscription, so add any coupon on top; for a Peko Commerce plan the recorded discount already carries the coupon.',
        whenMissing: 'Greyed out unless a discount was given.',
        concepts: ['manual-journals'],
        maintainerNotes: [
            'couponTotalDiscount',
            'subscriptions.discount',
            'serviceSubscriptions.discount',
        ],
        lastReviewed: '2026-10-20',
    }),
    manualEntry('Editor', 'Set-up', {
        question: 'What is the Set-up?',
        answer: 'The first step for an order whose entry was never worked out at payment time. State how the order was sold: how it was paid, whether a vendor and a commission are involved and in which mode, the platform fee, the partner’s share with the gateway charge the partner bears, and any discount Peko bore. The form opens prefilled from the order, the service’s current commission terms, the partner’s record and, for a plan, the discount the subscription recorded; what you confirm or change is all that counts. Press Generate split figures and the figures are worked out from it the same way the automatic posting would have done; nothing is read back from the lines, and the step is not shown for an order that already carries its figures.',
        lastReviewed: '2026-10-20',
        whenMissing: 'Shown only for a sale whose figures were never worked out.',
        concepts: ['manual-journals'],
        maintainerNotes: ['JournalSetup.tsx; manualJournalSetup.js → splitTemplateFor'],
    }),
    manualEntry('Editor', 'Split Figures', {
        question: 'What are the Split Figures?',
        answer: 'The breakdown of the order’s money — vendor payable, commission, platform fee, partner share, coupon — that the tabs, dashboard and statements read. Change them here and press Rebuild lines from split to work the lines out from them again; both are saved when you post. For an order whose figures were never worked out, they are generated from the Set-up above: every figure is shown, only those that apply to the way the order was sold can be edited, and the rest stay greyed out. The step is locked until the figures are generated, and any change to the set-up afterwards clears them to be generated again. The figures are saved with the entry together with the way the order was sold, and every profile reads from them: the vendor profile and Other Sales place the order by the mode stated here, and a sale with no vendor behind it shows on neither. Check each one before rebuilding the lines.',
        lastReviewed: '2026-10-20',
        whenMissing: 'Not shown for cashback events, which carry a single amount.',
        concepts: ['manual-journals', 'lists-vs-totals'],
        maintainerNotes: [
            'journalFields.ts → getFinancialFields',
            'persistJournalRecord → flatFields',
        ],
    }),
    manualEntry('Editor', 'Lines', {
        question: 'What are the Lines?',
        answer: 'The debit and credit lines the entry posts. They start as what the automatic posting would have made from the split figures; adjust an account, an amount or a description, add or remove a line. For an order set up by hand, the lines stay locked until they are rebuilt from the generated figures. When the lines cannot be worked out at all, only the rows the order itself can vouch for are suggested: the gateway debit, the wallet debit when part was paid from it, the platform fee with its GST by the customer’s state, and blank partner rows when a partner is behind the order; the rest is added by hand, never guessed from a service setting. Drag a line by the handle at its left to change the order the lines are posted in. Debits must equal credits before posting. Differs from split means the lines no longer match what the split figures would rebuild — what you post is what you see.',
        lastReviewed: '2026-10-08',
        whenMissing: 'Empty until the lines are worked out or added.',
        concepts: ['manual-journals'],
        maintainerNotes: [
            'JournalEditor.tsx',
            'manualJournal.js (worker) → applyRoundingAdjustment',
        ],
    }),
    manualEntry('Editor', 'Account', {
        question: 'What is Account?',
        answer: 'The account in the chart of accounts the line posts to. Only accounts that exist in the books can be picked.',
        whenMissing: 'Required on every line.',
        concepts: [],
        maintainerNotes: ['GET manual-operations/accounts → synced chart of accounts rows'],
    }),
    manualEntry('Editor', 'Debit', {
        question: 'What is Debit?',
        answer: 'The amount this line debits, in rupees, to two decimals. A line carries either a debit or a credit; typing in one clears the other. A line with no account or no amount above zero keeps Post disabled; remove it. Debits and credits must agree to the paise before posting; where the rebuilt lines themselves leave a gap of up to ten paise, the rebuild adds a Rounding Off Account line for it.',
        whenMissing: 'Empty when the line is a credit.',
        concepts: [],
        maintainerNotes: [
            'line.direction = debit, line.amount',
            'applyRoundingAdjustment threshold 0.1 (preview only); JournalEditor.tsx isBalanced < 0.005, linesComplete',
        ],
    }),
    manualEntry('Editor', 'Credit', {
        question: 'What is Credit?',
        answer: 'The amount this line credits, in rupees, to two decimals. A line carries either a debit or a credit; typing in one clears the other. A line with no account or no amount above zero keeps Post disabled; remove it.',
        whenMissing: 'Empty when the line is a debit.',
        concepts: [],
        maintainerNotes: ['line.direction = credit, line.amount'],
    }),
    manualEntry('Editor', 'Amount', {
        question: 'What is Amount?',
        answer: 'The single amount a cashback event carries: what the wallet received or gave back. The lines are worked out from it; change it and rebuild the lines.',
        whenMissing: 'Only shown for cashback events.',
        concepts: ['manual-journals'],
        maintainerNotes: ['JournalEditor.tsx → amount (wallet events)'],
    }),
    manualEntry('Editor', 'Description', {
        question: 'What is Description?',
        answer: 'The note on the line in the books. Left empty it carries the transaction id, as the automatic posting does.',
        whenMissing: 'Optional.',
        concepts: [],
        maintainerNotes: ['line.description'],
    }),
    manualEntry('Editor', 'Journal Date', {
        question: 'What is Journal Date?',
        answer: 'The day the entry is dated in the books. It starts at the event’s own date and can be changed, but not to a day in the future or before the accounting go-live date. If the books have locked that period, their refusal is shown as the reason.',
        whenMissing: 'Required.',
        concepts: ['go-live-floor', 'manual-journals'],
        maintainerNotes: ['manualJournal.js → journalDateProblem'],
    }),
    manualEntry('Editor', 'Reason', {
        question: 'Why is a Reason required?',
        answer: 'Every posting made by hand is kept in the history with who did it and why. The reason is for the next person reading the books.',
        whenMissing: 'Required, three characters or more.',
        concepts: ['manual-journals'],
        maintainerNotes: ['journalAdjustments.reason'],
    }),
    manualEntry('History', 'Date', {
        question: 'What is Date in the history?',
        answer: 'When the posting was made in this portal.',
        whenMissing: RECORD,
        concepts: [],
        maintainerNotes: ['journalAdjustments.createdAt'],
    }),
    manualEntry('History', 'Event', {
        question: 'What is Event in the history?',
        answer: 'Which of the order’s entries the action was on.',
        whenMissing: RECORD,
        concepts: [],
        maintainerNotes: ['journalAdjustments.journalKey'],
    }),
    manualEntry('History', 'By', {
        question: 'Who is By?',
        answer: 'The team member who made the posting.',
        whenMissing: RECORD,
        concepts: [],
        maintainerNotes: ['journalAdjustments.recordedByName'],
    }),
    manualEntry('History', 'Reason', {
        question: 'What is Reason in the history?',
        answer: 'The reason typed when the action was made.',
        whenMissing: RECORD,
        concepts: [],
        maintainerNotes: ['journalAdjustments.reason'],
    }),
    manualEntry('History', 'Result', {
        question: 'What is Result?',
        answer: 'Posted when the books accepted the entry, Refused when they did not — with their message underneath. A refused posting leaves the books as they were.',
        whenMissing: RECORD,
        concepts: ['manual-journals'],
        maintainerNotes: ['journalAdjustments.result / failureReason'],
    }),
    manualEntry('History', 'Entry Reference', {
        question: 'What is Entry Reference in the history?',
        answer: 'The books’ reference of the entry this action posted.',
        whenMissing: 'A dash when the books refused the entry.',
        concepts: [],
        maintainerNotes: ['journalAdjustments.providerJournalId'],
    }),
];

const APPROVALS_REVIEWED = '2026-09-26';

const approvalEntry = (tab: string, label: string, fields: EntryFields) =>
    entry('Approvals', tab, label, { lastReviewed: APPROVALS_REVIEWED, ...fields });

const APPROVALS: FaqEntry[] = [
    approvalEntry('KPIs', 'Awaiting Approval', {
        question: 'What counts as Awaiting Approval?',
        answer: 'Services this partner has switched on in its menu that the accounts team has not approved for this partner yet — either never reviewed or rejected earlier. While the approval gate is on, this partner’s corporates cannot see them. Services that were already switched on when the checks went live were approved by “system” and never count here.',
        whenMissing: 'Reads zero when every switched-on service is approved.',
        concepts: ['approval-gate', 'go-live-baseline'],
        maintainerNotes: [
            'others/models/use-cases/serviceApprovals.js → countsOf: switchedOn && status !== APPROVED',
        ],
        lastReviewed: '2026-10-05',
    }),
    approvalEntry('KPIs', 'Approved', {
        question: 'What does Approved count?',
        answer: 'How many services this partner has been approved for, switched on or not. An approved service shows to the partner’s corporates as soon as it is switched on in the menu.',
        whenMissing: 'Reads zero until the first approval.',
        concepts: ['approval-gate'],
        maintainerNotes: ['others/models/use-cases/serviceApprovals.js → countsOf.approved'],
    }),
    approvalEntry('KPIs', 'Rejected', {
        question: 'What does Rejected count?',
        answer: 'Services the accounts team has rejected for this partner. A rejected service stays hidden from the partner’s corporates even when it is switched on, until it is approved.',
        whenMissing: 'Reads zero until the first rejection.',
        concepts: ['approval-gate'],
        maintainerNotes: ['others/models/use-cases/serviceApprovals.js → countsOf.rejected'],
    }),
    approvalEntry('Cards', 'Approval Gate', {
        question: 'What does the Approval Gate switch do?',
        answer: 'On means only approved services reach corporates. Off is dev mode: every switched-on service shows whether approved or not, and a red warning stays on every accounting page until it is turned back on. Only an administrator can change it; who changed it and when is kept.',
        whenMissing: 'Reads On until an administrator turns it off.',
        concepts: ['approval-gate'],
        maintainerNotes: [
            'others/models/use-cases/serviceApprovalGate.js → settings row serviceApprovalGate',
        ],
    }),
    approvalEntry('List', 'Service', {
        question: 'Which service is this row about?',
        answer: 'The service as it is named in this partner’s menu, with its short reference underneath. Only services classified under Service with plans or Service without plans are listed. A menu item outside those two lists needs no approval and is never hidden from corporates. Which services count as classified is set in Settings › Service Classification.',
        whenMissing: 'Always shown — it comes from the partner’s menu.',
        concepts: ['approval-gate'],
        maintainerNotes: [
            'others/utils/serviceTree.js → collectServiceNodes (leaves whose accessKey is in servicesTypeConfig service_with_plans + service_without_plans; nodeKey = accessKey)',
            'others/models/use-cases/serviceClassification.js → classifyService',
        ],
    }),
    approvalEntry('List', 'Switched On', {
        question: 'What does Switched On mean?',
        answer: 'Whether the admin has switched this service on in the partner’s menu. On and approved means the partner’s corporates see it; on and not approved means they do not, while the gate is on. A service that was already on when the checks went live stayed visible; one switched on since then waits for approval.',
        whenMissing: 'Always shown.',
        concepts: ['approval-gate', 'go-live-baseline'],
        maintainerNotes: ['partnerPermissions.permissions leaf hasAccess'],
        lastReviewed: '2026-10-05',
    }),
    approvalEntry('List', 'Readiness', {
        question: 'What does Readiness check?',
        answer: 'How many of the required checks pass, and which fail: classified as with or without plans, tied to a vendor, commission marked as configured (per plan where the service sells plans, and for Domain and Hosting also its own commission, which domain registrations use), platform fee marked as configured on every package of the partner that includes the service (while no package includes it, Packages only warns and the platform fee is noted, not required), journal recording switched on for the service, and the partner share on a whitelabel partner. A commission or platform fee counts as configured once the accounts team saves it in this portal or switches its Configured mark on, even when it is zero; until then the service’s accounting entries are held back rather than posted. Approve is refused while a required check fails. Fix opens the screen in this portal where the setting lives, with the partner already picked for packages and platform fee. The service type, the service operator, its vendor and its journal recording are set in Settings, so those checks say where instead of offering Fix. A rate that was in place when the checks went live counts as configured; a rate changed in Settings or on a catalogue screen since then needs confirming again.',
        formula: 'Passed required checks / all required checks',
        whenMissing:
            'Reads “No checks” only if nothing could be checked, which should not happen for a listed service.',
        concepts: ['approval-gate', 'go-live-baseline'],
        maintainerNotes: [
            'others/models/use-cases/serviceApprovalReadiness.js → computeReadiness',
            'utils/approvals.ts → fixPath',
            'cashbacks.isSurchargeConfigured counted per partner in CASHBACK_LINKS_SQL; planEntityConfig.serviceCommissionItems',
            'serviceApprovalReadiness.js → computeUnit: cashbackLink warns and platformFee is info while no package links the service',
        ],
        lastReviewed: '2026-10-20',
    }),
    approvalEntry('List', 'Journal Evidence', {
        question: 'What is Journal Evidence?',
        answer: 'How many successful orders the service has taken since the go-live date and how many orders of the service, whatever their status today, have their sale entry in the books, with the order date of the latest of those. A refunded order can count in the second figure but not the first. Evidence is advisory and never blocks an approval.',
        whenMissing:
            'Reads “No orders yet” before the service’s first order since the go-live date.',
        concepts: ['approval-gate', 'journal-states', 'go-live-floor'],
        maintainerNotes: ['others/models/use-cases/serviceApprovalReadiness.js → buildOrdersQuery'],
    }),
    approvalEntry('List', 'Approval Status', {
        question: 'What does Approval Status show?',
        answer: 'Pending, Approved or Rejected for this partner, with who decided and when. Approved by “system” with the note “Live before the approval gate” means the service was already live for this partner when the checks went live. Approved with the note “Live when classified” means it was already switched on when the service was classified. “Configuration changed since approval” means a watched setting — the service type or operator, the vendor or its state, the commission (mode, type, rate, fixed sum, GST inclusion), plans without commission, the service’s journal recording or the partner share — moved after the approval; hover the tag to see which; nothing happens by itself, the team re-reviews or rejects.',
        whenMissing: 'Reads Pending until the first decision.',
        concepts: ['approval-gate', 'go-live-baseline'],
        maintainerNotes: [
            'serviceApprovals.approvals[] entry status, configHash vs serviceApprovalReadiness.js → fingerprintOf (FINGERPRINT_FIELDS)',
            'serviceApprovals.js → CLASSIFIED_LIVE_NOTE; DriftTag.tsx lists the changed fields',
        ],
        lastReviewed: '2026-10-20',
    }),
    approvalEntry('List', 'Approved', {
        question: 'What does the Approved switch do?',
        answer: 'On means the service is approved for this partner, so its corporates see it as soon as it is switched on in the menu. Turning the switch on approves the service for this partner straight away; it stays greyed out while a required check fails. Turning it off rejects the service for this partner, with a note, and takes it offline for its corporates the moment you confirm. Use Review to decide for several partners at once, or to approve again after the configuration changed.',
        whenMissing:
            'Shown only to users allowed to decide approvals; everyone else sees the status alone.',
        concepts: ['approval-gate'],
        maintainerNotes: [
            'components/approvals/ApprovalSwitch.tsx → decide endpoint for one partner tree',
        ],
    }),
    approvalEntry('Evidence', 'Successful Orders', {
        question: 'What are Successful Orders here?',
        answer: 'Orders for this service dated on or after the go-live date whose status is still Success, whatever the state of their accounting entry. An order refunded since no longer counts here.',
        whenMissing: 'Reads zero before the first order.',
        concepts: ['go-live-floor'],
        maintainerNotes: ['serviceApprovalReadiness.js → buildOrdersQuery: SUM(status = SUCCESS)'],
    }),
    approvalEntry('Evidence', 'Journals Recorded', {
        question: 'What are Journals Recorded?',
        answer: 'How many orders of this service since the go-live date, whatever their status today, have their sale entry accepted by the books. A refunded order with its sale in the books counts here but not under Successful Orders, so this can exceed it.',
        whenMissing: 'Reads zero until an entry has been recorded.',
        concepts: ['journal-states'],
        maintainerNotes: ['serviceApprovalReadiness.js → buildOrdersQuery: recorded(transaction)'],
    }),
    approvalEntry('Evidence', 'Failed', {
        question: 'What does Failed count here?',
        answer: 'Orders whose entry was sent to the books and refused. The money moved, so they still count in balances and can be posted again from Order Journals. An entry that was held back or could not be prepared counts under Skipped instead.',
        whenMissing: 'Reads zero when no entry was refused.',
        concepts: ['journal-states'],
        maintainerNotes: ['serviceApprovalReadiness.js → buildOrdersQuery: failed(transaction)'],
        lastReviewed: '2026-09-30',
    }),
    approvalEntry('Evidence', 'Skipped', {
        question: 'What does Skipped count here?',
        answer: 'Orders whose entry was never sent to the books: held back because posting was paused, the service is set not to post or a commission or platform fee was not yet confirmed, or not prepared, for example because an account was missing. Order Journals shows the reason and can post it again once the cause is fixed.',
        whenMissing: 'Reads zero when nothing was skipped.',
        concepts: ['journal-states', 'go-live-baseline'],
        maintainerNotes: ['serviceApprovalReadiness.js → buildOrdersQuery: skipped(transaction)'],
        lastReviewed: '2026-10-05',
    }),
    approvalEntry('Evidence', 'Not Recorded', {
        question: 'What does Not Recorded count here?',
        answer: 'Successful orders for which no entry was ever attempted.',
        whenMissing: 'Reads zero when every successful order has an entry or a skip reason.',
        concepts: ['journal-states'],
        maintainerNotes: [
            'serviceApprovalReadiness.js → buildOrdersQuery: notRecorded(transaction)',
        ],
    }),
    approvalEntry('Evidence', 'Last Recorded', {
        question: 'What is Last Recorded?',
        answer: 'The date of the most recent order whose accounting entry was recorded.',
        whenMissing: 'Shows a dash until an entry has been recorded.',
        concepts: ['journal-states'],
        maintainerNotes: [
            'serviceApprovalReadiness.js → buildOrdersQuery: MAX(CASE WHEN recorded THEN transactionDate END)',
        ],
    }),
];

// ---------------------------------------------------------------------------------------
// Transactions, Fee Details, Subscription Details — the dashboard cards' drill-down pages
// ---------------------------------------------------------------------------------------
const DRILL_REVIEWED = '2026-10-20';

const txnEntry = (tab: string, label: string, fields: EntryFields) =>
    entry('Transactions', tab, label, { lastReviewed: DRILL_REVIEWED, ...fields });

const TRANSACTIONS: FaqEntry[] = [
    txnEntry('Columns', 'Transaction Date', COMMON.Date),
    txnEntry('Columns', 'Transaction ID', COMMON['Txn ID']),
    txnEntry('Columns', 'Customer', COMMON.Customer),
    txnEntry('Columns', 'Service', COMMON.Service),
    txnEntry('Columns', 'Payment Mode', COMMON.Method),
    txnEntry('Columns', 'Posted', COMMON.Posted),
    txnEntry('Columns', 'Amount', {
        question: 'What is Amount?',
        answer: 'The amount charged on the order, as the order records it. It is not read from the accounting entry, so it is the same whether or not the entry exists. Total GMV, Total Discount and Net GMV beside it are the order’s value as the entry works it out.',
        whenMissing: 'Shows a dash when the order carries no amount.',
        concepts: ['raw-vs-derived'],
        maintainerNotes: [
            'orders.amountInINR',
            'orderJournal.js → getTransactions: order.amountInINR || null (a zero amount also dashes)',
        ],
    }),
    txnEntry('Columns', 'Total GMV', {
        question: 'What is Total GMV on a record?',
        answer: `The full value of the order: what the customer paid through the gateway and from the wallet plus any discount Peko bore, whether ${DISCOUNT_WORDS}. It is read from the order’s accounting entry; an order with no entry shows the amount charged on it. Total GMV = Net GMV + Total Discount on every record.`,
        formula: 'Total GMV = Paid through gateway + Paid from wallet + Discount borne by Peko',
        whenMissing:
            'Always shown; an order with no accounting entry shows the amount charged on it.',
        concepts: ['raw-vs-derived', 'go-live-floor'],
        maintainerNotes: [
            'journalPosting.js → gmvOfOrder("orders")',
            'orderJournal.js → getTransactions attributes gmv / discount / netGmv',
        ],
    }),
    txnEntry('Columns', 'Total Discount', {
        question: 'What is Total Discount on a record?',
        answer: `The discount Peko bore on the order — ${DISCOUNT_WORDS} — read from its accounting entry. It is the part of Total GMV the customer did not pay.`,
        formula: 'Total discount = Total GMV − Net GMV',
        whenMissing:
            'Reads zero for an order with no accounting entry, so its Total GMV and Net GMV are the same amount.',
        concepts: ['raw-vs-derived'],
        maintainerNotes: ['journalPosting.js → discountOfOrder'],
    }),
    txnEntry('Columns', 'Net GMV', {
        question: 'What is Net GMV on a record?',
        answer: 'What the customer actually paid for the order, through the gateway and from the wallet, with no discount added back.',
        formula: 'Net GMV = Paid through gateway + Paid from wallet = Total GMV − Total Discount',
        whenMissing:
            'Always shown; an order with no accounting entry shows the amount charged on it.',
        concepts: ['raw-vs-derived'],
        maintainerNotes: ['journalPosting.js → netGmvOfOrder'],
    }),
    txnEntry('Columns', 'Status', {
        question: 'What does the status mean here?',
        answer: 'The order’s own payment status as the payment left it: Success, Failed, Refunded or Pending. This page does not check whether a refund was actually processed, so an order refunded without its status being updated still reads as the payment left it; the Posted column shows the refund entry. The Status filter above the table uses the same words.',
        whenMissing: RAW,
        concepts: ['journal-states'],
        maintainerNotes: [
            'orders.status',
            'vendorColumns.tsx → orderStatusPill(order.status), without the refunded flag the vendor ledger passes',
        ],
    }),
    txnEntry('Columns', 'Documents', {
        question: 'What does Documents count?',
        answer: 'How many documents Peko generated for the order: the invoice, the invoice on behalf of the vendor and the receipt sent to the subscriber, and the invoice on commission sent to the vendor. The eye opens them for download.',
        whenMissing:
            'Reads 0, with the button greyed out, when no document was generated for the order.',
        concepts: [],
        maintainerNotes: [
            'orders.pekoInvoiceDetails → orderJournal.js getAvailableDocuments',
            'reports/components/OrderJournal/orderDocuments.ts → countOrderDocuments',
        ],
    }),
    txnEntry('Summary', 'Total Transactions', {
        question: 'What does Total Transactions count?',
        answer: 'How many orders are listed for the dates and filters chosen. Opened from a dashboard card it is filtered to successful orders, the same set the card counted; set Status to All and failed and pending orders are counted too.',
        whenMissing: COUNT,
        concepts: ['lists-vs-totals', 'go-live-floor'],
        maintainerNotes: ['orderJournal.js → getTransactions totals.count'],
    }),
    txnEntry('Summary', 'Total GMV', {
        question: 'What is the Total GMV total?',
        answer: 'Total GMV added up over the orders listed. With Status on Success it is the dashboard card’s figure for the same dates; with Status on All it also adds the amount charged on failed and pending orders, which the card never counts.',
        formula: 'Sum of Total GMV over the listed orders',
        whenMissing:
            'Counts every listed order; one with no accounting entry counts the amount charged on it.',
        concepts: ['lists-vs-totals', 'raw-vs-derived', 'go-live-floor'],
        maintainerNotes: [
            'orderJournal.js → getTransactions totals query, same where clause as the rows',
        ],
    }),
    txnEntry('Summary', 'Total Discount', {
        question: 'What is the Total Discount total?',
        answer: 'Total Discount added up over the orders listed, following the same Status filter as the rows.',
        formula: 'Sum of Total Discount over the listed orders',
        whenMissing: 'An order with no accounting entry adds nothing.',
        concepts: ['lists-vs-totals', 'raw-vs-derived'],
        maintainerNotes: ['orderJournal.js → getTransactions totals query'],
    }),
    txnEntry('Summary', 'Net GMV', {
        question: 'What is the Net GMV total?',
        answer: 'Net GMV added up over the orders listed: Total GMV less Total Discount, following the same Status filter as the rows.',
        formula: 'Sum of Net GMV over the listed orders = Total GMV − Total Discount',
        whenMissing:
            'Counts every listed order; one with no accounting entry counts the amount charged on it.',
        concepts: ['lists-vs-totals', 'raw-vs-derived'],
        maintainerNotes: ['orderJournal.js → getTransactions totals query'],
    }),
];

const feeEntry = (tab: string, label: string, fields: EntryFields) =>
    entry('Fee Details', tab, label, { lastReviewed: DRILL_REVIEWED, ...fields });

const FEE_ROW =
    'Listed only when the order succeeded and its accounting entry carries the fee, so the figure is always shown; the Posted column says whether that entry reached the books.';

const FEE_DETAILS: FaqEntry[] = [
    feeEntry('Columns', 'Date', COMMON.Date),
    feeEntry('Columns', 'Order Ref', COMMON['Txn ID']),
    feeEntry('Columns', 'Service', COMMON.Service),
    feeEntry('Columns', 'Posted', COMMON.Posted),
    feeEntry('Columns', 'Vendor', {
        question: 'Which vendor?',
        answer: 'The vendor behind the service the order was placed on. The vendor filter above narrows the list to one vendor.',
        whenMissing: 'Shows a dash when the service has no vendor linked.',
        concepts: [],
        maintainerNotes: ['vendors.vendorName through serviceOperators.vendorId'],
    }),
    feeEntry('Columns', 'Order Value', {
        question: 'What is Order Value here?',
        answer: 'The amount charged on the order, as the order records it. It is not the Order Value of the vendor’s Commissions tab, which is worked out from the entry as vendor payable plus commission.',
        whenMissing: RAW,
        concepts: ['raw-vs-derived'],
        maintainerNotes: ['orders.amountInINR', 'feeDetails.js → row select'],
    }),
    feeEntry('Columns', 'Commission (excl. GST)', {
        question: 'What is Commission (excl. GST)?',
        answer: 'Peko’s commission on the order before GST, read from its accounting entry. Added up over the dates chosen it is the dashboard’s Commission (excl. GST) card.',
        whenMissing: FEE_ROW,
        concepts: ['gst-split', 'lists-vs-totals'],
        maintainerNotes: [
            'journalData.commissionExcludingGST',
            'feeDetails.js → buildWhere mirrors accountingDashboard.js sumForSuccess',
        ],
    }),
    feeEntry('Columns', 'Commission (incl. GST)', {
        question: 'What is Commission (incl. GST)?',
        answer: 'Peko’s commission on the order including GST — the figure invoiced to the vendor.',
        whenMissing: FEE_ROW,
        concepts: ['gst-split'],
        maintainerNotes: ['journalData.commissionIncludingGST'],
    }),
    feeEntry('Columns', 'Platform Fee (excl. GST)', {
        question: 'What is Platform Fee (excl. GST)?',
        answer: 'The platform fee on the order before GST, read from its accounting entry. Added up over the dates chosen it is the dashboard’s Platform Fee (excl. GST) card.',
        whenMissing: FEE_ROW,
        concepts: ['gst-split', 'lists-vs-totals'],
        maintainerNotes: ['journalData.platformFeeExcludingGST'],
    }),
    feeEntry('Columns', 'Platform Fee (incl. GST)', {
        question: 'What is Platform Fee (incl. GST)?',
        answer: 'The platform fee on the order including GST — the figure on the subscriber’s invoice.',
        whenMissing: FEE_ROW,
        concepts: ['gst-split'],
        maintainerNotes: ['journalData.platformFeeIncludingGST'],
    }),
    feeEntry('Columns', 'Reversed', {
        question: 'What is Reversed?',
        answer: 'The share of the commission that went back with a refund, in the same proportion as the refunded part of the vendor payable — the same figure as on the vendor’s Commissions tab. Commission only; a platform fee is never reversed here.',
        formula: 'Reversed = Commission (incl. GST) × Refunded ÷ Vendor payable',
        whenMissing: 'Shows a dash when nothing was refunded on the order.',
        concepts: ['vendor-convention'],
        maintainerNotes: [
            'feeDetails.js → serializeFeeDetail, refunded per order from the vendor payable accounts in the refund and admin refund entries',
        ],
    }),
    feeEntry('Columns', 'Net', {
        question: 'What is Net?',
        answer: 'Commission including GST less what was reversed.',
        formula: 'Net = Commission (incl. GST) − Reversed',
        whenMissing:
            'Always shown on a commission row; equals Commission (incl. GST) when nothing was reversed.',
        concepts: [],
        maintainerNotes: ['feeDetails.js → serializeFeeDetail'],
    }),
    feeEntry('Columns', 'Invoice', {
        question: 'Which invoice does Download give?',
        answer: 'On Commission Details, the invoice on commission Peko issued to the vendor; on Platform Fee Details, the invoice Peko issued to the subscriber. Every document for the order is on the Transactions page under Documents.',
        whenMissing: 'The button is greyed out when that invoice was not generated for the order.',
        concepts: [],
        maintainerNotes: [
            'FeeDetails.tsx → INVOICE_SOURCE',
            'orders.pekoInvoiceDetails vendor.invoiceData / corporate.invoiceData',
        ],
    }),
];

const subEntry = (tab: string, label: string, fields: EntryFields) =>
    entry('Subscription Details', tab, label, { lastReviewed: DRILL_REVIEWED, ...fields });

const REACHED_BOOKS =
    'Shows a dash when the sale’s accounting entry never reached the books; the order is still listed, with Posted saying why.';

const SUBSCRIPTION_DETAILS: FaqEntry[] = [
    subEntry('Columns', 'Date', COMMON.Date),
    subEntry('Columns', 'Order Ref', COMMON['Txn ID']),
    subEntry('Columns', 'Posted', COMMON.Posted),
    subEntry('Columns', 'Subscriber', {
        question: 'Who is the subscriber?',
        answer: 'The account username of the customer who paid, with the account name underneath.',
        whenMissing: 'Shows a dash when the account no longer exists.',
        concepts: [],
        maintainerNotes: ['credentials.username, credentials.name'],
    }),
    subEntry('Columns', 'Partner', {
        question: 'Which partner is this?',
        answer: 'The whitelabel partner that brought the subscriber on board, or Peko (Default) when they signed up directly. The partner filter above narrows the list to one partner, or to Default.',
        whenMissing: 'Never blank: Peko (Default) when there is no partner.',
        concepts: ['partner-share'],
        maintainerNotes: [
            'credentials.registeredBy → subscriptionDetails.js withPartnerNames',
            'subscriberColumns.tsx → partnerLabel',
        ],
    }),
    subEntry('Columns', 'Plan', {
        question: 'Which plan is this?',
        answer: 'The Peko plan or add-on paid for. For a subscription to one of Peko’s own services it is the service’s name.',
        whenMissing: 'Shows a dash when neither a plan nor a service can be found for the order.',
        concepts: [],
        maintainerNotes: [
            'packages.packageName through the latest subscriptions row per transaction, else the order’s service name — subscriptionDetails.js → PLAN',
        ],
    }),
    subEntry('Columns', 'Billing', {
        question: 'What is Billing?',
        answer: 'Monthly or Annually: the cycle the accounting entry recorded, otherwise the cycle the order was placed on. The dashboard’s Monthly and Annual cards split on the entry’s cycle only, so an order whose entry carries none is listed here under its own cycle but was not added to either card.',
        whenMissing: 'Shows a dash when neither the entry nor the order says.',
        concepts: ['raw-vs-derived'],
        maintainerNotes: [
            'subscriptionDetails.js → BILLING_TYPE: journalData.billingType, else orderResponse.billingType',
            'accountingDashboard.js → sumForSuccessByBilling',
        ],
    }),
    subEntry('Columns', 'Order Value', {
        question: 'What is Order Value?',
        answer: 'The amount the subscriber was charged, including GST.',
        whenMissing: REACHED_BOOKS,
        concepts: ['journal-states'],
        maintainerNotes: [
            'orders.amountInINR, blanked unless saleReachedBooksOfRow — subscriptionDetails.js → serializeSubscriptionDetail',
        ],
    }),
    subEntry('Columns', 'Net Revenue (excl. GST)', {
        question: 'What is Net Revenue (excl. GST)?',
        answer: 'Peko’s subscription revenue on the payment before GST, read from its accounting entry. Added up over the dates chosen it is the dashboard’s Total Subscriptions card; one-time purchases such as extra Corporate Cards are left out of both.',
        whenMissing: REACHED_BOOKS,
        concepts: ['gst-split', 'journal-states', 'lists-vs-totals'],
        maintainerNotes: [
            'journalData.netSubscriptionIncome',
            'oneTimeItems.js → isOneTimeItemOperator excluded in buildWhere',
        ],
    }),
    subEntry('Columns', 'Invoice', {
        question: 'Which invoice does Download give?',
        answer: 'The invoice Peko issued to the subscriber for the payment.',
        whenMissing: 'The button is greyed out when no invoice was generated for the order.',
        concepts: [],
        maintainerNotes: ['orders.pekoInvoiceDetails corporate.invoiceData'],
    }),
];

const INTERNAL_PURCHASE_KPIS = [
    'Transactions Count',
    'Total GMV',
    'Total Discount',
    'Net GMV',
    'Commission (excl. GST)',
    'Total Subscriptions',
    'Subscriptions (Monthly)',
    'Subscriptions (Annual)',
    'Other Sales',
    'Third-Party Sales',
];

const INTERNAL_PURCHASES: FaqEntry[] = INTERNAL_PURCHASE_KPIS.map(label =>
    entry('Dashboard', 'Internal Purchases', label, {
        question: `What is ${label} under Internal purchase accounts?`,
        answer: `The same figure as ${label} in the row above, counting only orders placed by the accounts listed under Settings › Internal Accounts, for the same window. There is no platform fee card on this row because the platform fee is always nil on those orders. The row is collapsed by default: open it from the arrow beside its title. The card opens the same details page, filtered to those accounts.`,
        whenMissing:
            'Shows zero until an account is listed under Settings › Internal Accounts, or when those accounts placed nothing in the window.',
        concepts: ['go-live-floor'],
        maintainerNotes: [
            'accountingDashboard.js → sections.today.internal / sections.monthly.internal, narrowed by internalAccounts.js to orders.credentialId in the internalAccounts setting',
            'the details pages read accounts=internal (Transactions, Fee Details, Subscription Details, Other Sales, Third-Party Sales)',
        ],
        lastReviewed: '2026-10-28',
    })
);

export const FAQ_ENTRIES: FaqEntry[] = [
    ...DASHBOARD,
    ...INTERNAL_PURCHASES,
    ...VENDORS,
    ...SUBSCRIBERS,
    ...PARTNERS,
    ...PAYMENT_GATEWAYS,
    ...OTHER_SALES,
    ...THIRD_PARTY_SALES,
    ...THIRD_PARTY_CONFIGURATION,
    ...STATEMENTS,
    ...ORDER_JOURNALS,
    ...APPROVALS,
    ...MANUAL_OPERATIONS,
    ...TRANSACTIONS,
    ...FEE_DETAILS,
    ...SUBSCRIPTION_DETAILS,
];

const BY_ID = new Map(FAQ_ENTRIES.map(item => [item.id, item]));

export const findFaqEntry = (screen: FaqScreen, tab: string, label: string) =>
    BY_ID.get(faqEntryId(screen, tab, label));

export const findFaqEntryById = (id: string) => BY_ID.get(id);

export const faqEntriesForScreen = (screen: FaqScreen) =>
    FAQ_ENTRIES.filter(item => item.screen === screen);
