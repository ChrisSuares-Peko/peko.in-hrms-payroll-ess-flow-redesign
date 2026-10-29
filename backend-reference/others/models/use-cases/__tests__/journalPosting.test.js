const {
    POSTED,
    NOT_APPLICABLE,
    postingSelect,
    noPostingSelect,
    ORDER_POSTING_SELECT,
    orderPostingAttributes,
    flagOf,
    factsOfRow,
    eventPosting,
    eventPostingOfRow,
    salePosting,
    orderPostingOfRow,
    orderPostingOfJournal,
    refundKeyOfRow,
    postingLabel,
    reachedBooks,
    reachedBooksSql,
    SALE_REACHED_BOOKS,
    saleReachedBooksOfRow,
    saleReachedBooksOfJournal,
    notReachedBooksSql,
} = require("../journalPosting");

const facts = (verdict = null, skipped = false, reason = null) => ({ verdict, skipped, reason });

const notPosted = (note, detail = null) => ({ state: "notPosted", note, detail });

const orderRow = extra => ({ status: "SUCCESS", ...extra });

describe("the SQL it selects", () => {
    it("reads the verdict, the skip marker and the reason of one event, unquoted", () => {
        expect(postingSelect("refund")).toBe(
            "JSON_UNQUOTE(JSON_EXTRACT(orders.journalRecordStatus, '$.refund')) AS refundVerdict, " +
                "JSON_UNQUOTE(JSON_EXTRACT(orders.journalData, '$.refund.skipped')) AS refundSkipped, " +
                "JSON_UNQUOTE(JSON_EXTRACT(orders.journalData, '$.refund.reason')) AS refundReason"
        );
        expect(postingSelect("cashback", { prefix: "event", table: "o" })).toContain(
            "JSON_UNQUOTE(JSON_EXTRACT(o.journalRecordStatus, '$.cashback')) AS eventVerdict"
        );
    });

    it("gives a union arm with no journal the same three columns as utf8mb4 nulls", () => {
        expect(noPostingSelect("transaction")).toBe(
            "CONVERT(NULL USING utf8mb4) AS transactionVerdict, " +
                "CONVERT(NULL USING utf8mb4) AS transactionSkipped, " +
                "CONVERT(NULL USING utf8mb4) AS transactionReason"
        );
    });

    it("reads the sale and both kinds of refund for an order-level row", () => {
        ["transaction", "refund", "adminRefund"].forEach(key =>
            expect(ORDER_POSTING_SELECT).toContain(`AS ${key}Verdict`)
        );
        expect(ORDER_POSTING_SELECT).not.toContain("cashback");

        const attributes = orderPostingAttributes();
        expect(attributes.map(([, alias]) => alias)).toEqual([
            "transactionVerdict",
            "transactionSkipped",
            "transactionReason",
            "refundVerdict",
            "refundSkipped",
            "refundReason",
            "adminRefundVerdict",
            "adminRefundSkipped",
            "adminRefundReason",
        ]);
        expect(attributes[0][0].val).toBe("JSON_UNQUOTE(JSON_EXTRACT(`orders`.journalRecordStatus, '$.transaction'))");
    });
});

describe("reading the stored flags", () => {
    it("accepts a boolean or its unquoted text and treats anything else as unknown", () => {
        expect(flagOf(true)).toBe(true);
        expect(flagOf("true")).toBe(true);
        expect(flagOf(false)).toBe(false);
        expect(flagOf("false")).toBe(false);
        [null, undefined, "null", "", 1, 0].forEach(value => expect(flagOf(value)).toBeNull());
    });

    it("drops an empty or json-null reason", () => {
        expect(factsOfRow({ refundVerdict: "false", refundReason: "null" }, "refund")).toEqual(facts(false));
        expect(factsOfRow({ refundSkipped: "true", refundReason: "" }, "refund")).toEqual(facts(null, true));
    });
});

describe("whether an entry reached the books", () => {
    it("is true for a posted or refused entry and false for a skipped or never recorded one", () => {
        expect(reachedBooks(facts(true))).toBe(true);
        expect(reachedBooks(facts(false))).toBe(true);
        expect(reachedBooks(facts(false, true, "disabled"))).toBe(false);
        expect(reachedBooks(facts(null, true, "paused"))).toBe(false);
        expect(reachedBooks(facts(null))).toBe(false);
        expect(saleReachedBooksOfRow(orderRow({ transactionVerdict: "true" }))).toBe(true);
        expect(saleReachedBooksOfRow(orderRow({ transactionVerdict: "false", transactionSkipped: "true" }))).toBe(false);
        expect(saleReachedBooksOfRow(orderRow({}))).toBe(false);
        expect(
            saleReachedBooksOfJournal({ journalRecordStatus: { transaction: false }, journalData: { transaction: { lineItems: [] } } })
        ).toBe(true);
        expect(
            saleReachedBooksOfJournal({ journalRecordStatus: '{"transaction":false}', journalData: '{"transaction":{"skipped":true}}' })
        ).toBe(false);
        expect(saleReachedBooksOfJournal({ journalRecordStatus: null, journalData: null })).toBe(false);
    });

    it("spells the same test in SQL against the order's own columns", () => {
        expect(SALE_REACHED_BOOKS).toBe(reachedBooksSql("transaction"));
        expect(SALE_REACHED_BOOKS).toContain("JSON_EXTRACT(orders.journalRecordStatus, '$.transaction')) = 'true'");
        expect(SALE_REACHED_BOOKS).toContain("JSON_EXTRACT(orders.journalData, '$.transaction.skipped')), 'false') <> 'true'");
        expect(reachedBooksSql("refund", "o")).toContain("JSON_EXTRACT(o.journalRecordStatus, '$.refund')) = 'false'");
        expect(notReachedBooksSql("transaction")).toBe(
            "(JSON_UNQUOTE(JSON_EXTRACT(orders.journalRecordStatus, '$.transaction')) IS NULL OR (JSON_UNQUOTE(JSON_EXTRACT(orders.journalRecordStatus, '$.transaction')) = 'false' AND COALESCE(JSON_UNQUOTE(JSON_EXTRACT(orders.journalData, '$.transaction.skipped')), 'false') = 'true'))"
        );
    });
});

describe("one journal event", () => {
    it("reads an accepted entry as posted, whatever marker an older attempt left", () => {
        expect(eventPosting(facts(true))).toBe(POSTED);
        expect(eventPosting(facts(true, true, "Journal recording is currently paused"))).toBe(POSTED);
    });

    it("names each reason an entry was held back before it was sent", () => {
        expect(eventPosting(facts(false, true, "Journal recording is currently paused"))).toEqual(
            notPosted("Recording paused", "Journal recording is currently paused")
        );
        expect(eventPosting(facts(false, true, "recordJournalEntry is disabled for this service operator"))).toEqual(
            notPosted("Service set not to post", "recordJournalEntry is disabled for this service operator")
        );
        expect(eventPosting(facts(false, true, "Transaction journal has not been recorded successfully yet"))).toEqual(
            notPosted("Waiting for the sale entry", "Transaction journal has not been recorded successfully yet")
        );
        expect(eventPosting(facts(false, true, "Missing chart of accounts: Commission"))).toEqual(
            notPosted("Could not be prepared", "Missing chart of accounts: Commission")
        );
    });

    it("names a commission or platform fee the accounts team has not marked as configured", () => {
        expect(eventPosting(facts(false, true, 'Commission not configured for "Electricity Bill"'))).toEqual(
            notPosted("Commission not configured", 'Commission not configured for "Electricity Bill"')
        );
        expect(eventPosting(facts(false, true, 'Surcharge not configured for "Electricity Bill"'))).toEqual(
            notPosted("Platform fee not configured", 'Surcharge not configured for "Electricity Bill"')
        );
        expect(eventPosting(facts(false, false, 'Commission not configured for "Electricity Bill"')).note).toBe(
            "Books refused it"
        );
    });

    it("reads a skip marker with no verdict, as older entries were stored, the same way", () => {
        expect(eventPosting(facts(null, true, "Journal recording is currently paused")).note).toBe("Recording paused");
        expect(eventPosting(facts(null, true))).toEqual(notPosted("Could not be prepared"));
    });

    it("reads a verdict of false with no marker as refused by the books", () => {
        expect(eventPosting(facts(false, false, "Duplicate reference"))).toEqual(
            notPosted("Books refused it", "Duplicate reference")
        );
        expect(eventPosting(facts(false))).toEqual(notPosted("Books refused it"));
    });

    it("tells an entry still owed from one that was never due", () => {
        expect(eventPosting(facts())).toEqual(notPosted("Not recorded yet"));
        expect(eventPosting(facts(), { expected: false })).toBe(NOT_APPLICABLE);
    });

    it("reads an event row by its prefix", () => {
        expect(eventPostingOfRow({ eventVerdict: "true" })).toBe(POSTED);
        expect(eventPostingOfRow({ cashbackVerdict: "false" }, "cashback")).toEqual(notPosted("Books refused it"));
    });
});

describe("the sale", () => {
    it("expects an entry for every paid order, whatever the case of its status", () => {
        ["SUCCESS", "ORDERED", "REFUNDED", "REFUND", "success", " Refunded "].forEach(status =>
            expect(salePosting(status, facts())).toEqual(notPosted("Not recorded yet"))
        );
    });

    it("expects none for an order that never went through, unless an entry was attempted", () => {
        ["FAILED", "FAILURE", "PENDING", "CANCELLED", null].forEach(status =>
            expect(salePosting(status, facts())).toBe(NOT_APPLICABLE)
        );
        expect(salePosting("FAILED", facts(false))).toEqual(notPosted("Books refused it"));
    });
});

describe("an order-level row", () => {
    it("is posted when its sale is posted and nothing was refunded", () => {
        expect(orderPostingOfRow(orderRow({ transactionVerdict: "true" }))).toBe(POSTED);
    });

    it("waits for the refund of a refunded order even when no refund entry was ever attempted", () => {
        expect(orderPostingOfRow(orderRow({ status: "REFUNDED", transactionVerdict: "true" }))).toEqual(
            notPosted("Refund: Not recorded yet")
        );
    });

    it("names the refund when it is the part the books refused", () => {
        expect(
            orderPostingOfRow(
                orderRow({ status: "REFUNDED", transactionVerdict: "true", refundVerdict: "false", refundReason: "Bad account" })
            )
        ).toEqual(notPosted("Refund: Books refused it", "Bad account"));
    });

    it("lets an unposted sale decide the row before the refund", () => {
        expect(
            orderPostingOfRow(orderRow({ status: "REFUNDED", transactionVerdict: "false", refundVerdict: "true" }))
        ).toEqual(notPosted("Books refused it"));
        expect(
            orderPostingOfRow(orderRow({ status: "REFUNDED", refundVerdict: "true" }))
        ).toEqual(notPosted("Not recorded yet"));
    });

    it("flags a failed order whose sale reached the books but was never reversed", () => {
        ["FAILED", "FAILURE", "CANCELLED"].forEach(status =>
            expect(orderPostingOfRow(orderRow({ status, transactionVerdict: "true" }))).toEqual(
                notPosted("Refund: Not recorded yet")
            )
        );
        expect(
            orderPostingOfRow(orderRow({ status: "FAILED", transactionVerdict: "true", refundVerdict: "true" }))
        ).toBe(POSTED);
    });

    it("has nothing to post for a failed order with no entry at all", () => {
        expect(orderPostingOfRow(orderRow({ status: "FAILED" }))).toBe(NOT_APPLICABLE);
        expect(orderPostingOfRow(orderRow({ status: "PENDING" }))).toBe(NOT_APPLICABLE);
    });

    it("reads a refund the team made by hand, held back until the sale posts", () => {
        expect(
            orderPostingOfRow(
                orderRow({
                    transactionVerdict: "true",
                    adminRefundVerdict: "false",
                    adminRefundSkipped: "true",
                    adminRefundReason: "Transaction journal has not been recorded successfully yet",
                })
            )
        ).toEqual(
            notPosted(
                "Refund: Waiting for the sale entry",
                "Transaction journal has not been recorded successfully yet"
            )
        );
    });

    it("checks both kinds of refund when an order carries both", () => {
        expect(
            orderPostingOfRow(
                orderRow({ status: "REFUNDED", transactionVerdict: "true", refundVerdict: "true", adminRefundVerdict: "false" })
            )
        ).toEqual(notPosted("Refund: Books refused it"));
        expect(
            orderPostingOfRow(
                orderRow({ status: "REFUNDED", transactionVerdict: "true", refundVerdict: "true", adminRefundVerdict: "true" })
            )
        ).toBe(POSTED);
    });

    it("reaches the same answer from the stored journal as from the selected columns", () => {
        const cases = [
            [{ status: "SUCCESS" }, {}, {}],
            [{ status: "SUCCESS" }, { transaction: true }, {}],
            [{ status: "REFUNDED" }, { transaction: true, refund: false }, { refund: { reason: "Bad account" } }],
            [{ status: "FAILED" }, { transaction: true }, {}],
            [{ status: "SUCCESS" }, { transaction: false }, { transaction: { skipped: true, reason: "Journal recording is currently paused" } }],
            [{ status: "SUCCESS" }, {}, { transaction: { skipped: true } }],
        ];

        cases.forEach(([order, verdicts, entries]) => {
            const row = { ...order };
            ["transaction", "refund", "adminRefund"].forEach(key => {
                if (key in verdicts) row[`${key}Verdict`] = String(verdicts[key]);
                if (entries[key] && entries[key].skipped) row[`${key}Skipped`] = "true";
                if (entries[key] && entries[key].reason) row[`${key}Reason`] = entries[key].reason;
            });

            const fromJournal = orderPostingOfJournal({
                status: order.status,
                journalRecordStatus: JSON.stringify(verdicts),
                journalData: entries,
            });
            expect(fromJournal).toEqual(orderPostingOfRow(row));
        });
    });

    it("survives a journal that is missing or not json", () => {
        expect(orderPostingOfJournal({ status: "SUCCESS", journalRecordStatus: null, journalData: "{oops" })).toEqual(
            notPosted("Not recorded yet")
        );
        expect(orderPostingOfJournal({ status: "FAILED", journalRecordStatus: "true", journalData: [] })).toBe(
            NOT_APPLICABLE
        );
    });
});

describe("the refund a wallet line belongs to", () => {
    it("takes whichever refund left a trace, and the ordinary refund otherwise", () => {
        expect(refundKeyOfRow({ adminRefundVerdict: "true" })).toBe("adminRefund");
        expect(refundKeyOfRow({ adminRefundSkipped: "true" })).toBe("adminRefund");
        expect(refundKeyOfRow({ refundVerdict: "false", adminRefundVerdict: "true" })).toBe("refund");
        expect(refundKeyOfRow({})).toBe("refund");
    });
});

describe("the label an export prints", () => {
    it("spells out each state and the reason a line is not posted", () => {
        expect(postingLabel(POSTED)).toBe("Posted");
        expect(postingLabel(notPosted("Recording paused"))).toBe("Not posted — Recording paused");
        expect(postingLabel(notPosted(null))).toBe("Not posted");
        expect(postingLabel(NOT_APPLICABLE)).toBe("Not applicable");
        expect(postingLabel(undefined)).toBe("Not applicable");
        expect(postingLabel({ state: "unknown" })).toBe("Not applicable");
    });
});
