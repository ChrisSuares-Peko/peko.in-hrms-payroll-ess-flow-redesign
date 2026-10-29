const { ledgerStatementTemplate } = require("../ledgerStatementTemplate");
const { POSTED, NOT_APPLICABLE } = require("../../models/use-cases/journalPosting");

const line = (particulars, posting) => ({
    date: "2026-09-02",
    particulars,
    reference: "TXN-1",
    type: "Order",
    debit: null,
    credit: 100,
    balance: 100,
    posting,
});

const render = rows =>
    ledgerStatementTemplate({
        partyName: "Cleartrip",
        range: { from: "2026-09-01", to: "2026-09-30" },
        statement: { openingBalance: 0, totalDebit: 0, totalCredit: 100, closingBalance: 100, rows },
        convention: "",
    });

const postingCellOf = (html, particulars) => {
    const row = html
        .split("<tr>")
        .find(chunk => chunk.includes(`<td>${particulars}</td>`))
        .split("</tr>")[0];
    const cells = row
        .split("<td")
        .slice(1)
        .map(cell => cell.slice(cell.indexOf(">") + 1).replace(/<\/td>[\s\S]*$/, ""));
    return cells[cells.length - 1].trim();
};

describe("the posting cell of the statement pdf", () => {
    it("prints every state rather than leaving posted lines blank", () => {
        const html = render([
            line("posted line", POSTED),
            line("manual line", NOT_APPLICABLE),
            line("old line", undefined),
        ]);

        expect(postingCellOf(html, "posted line")).toBe("Posted");
        expect(postingCellOf(html, "manual line")).toBe("Not applicable");
        expect(postingCellOf(html, "old line")).toBe("Not applicable");
    });

    it("prints the reason under a line that is not posted, escaped", () => {
        const html = render([
            line("refused line", { state: "notPosted", note: "Books <refused> it", detail: "never printed" }),
        ]);

        expect(postingCellOf(html, "refused line")).toBe(
            'Not posted<div class="posting-note">Books &lt;refused&gt; it</div>'
        );
        expect(html).not.toContain("never printed");
    });

    it("leaves the opening and closing rows without a status", () => {
        const html = render([]);
        const markers = html.split('<tr class="marker">').slice(1);

        expect(markers).toHaveLength(2);
        markers.forEach(marker => expect(marker).not.toContain("Posted"));
    });
});
