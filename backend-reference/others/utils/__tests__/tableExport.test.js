const ExcelJS = require("exceljs");

jest.mock("../puppeteerPool", () => ({ renderPdf: jest.fn() }));

const { renderPdf } = require("../puppeteerPool");
const tableExport = require("../tableExport");

const {
    EXPORT_FORMATS,
    EXPORT_MAX_ROWS,
    buildTableExport,
    sendTableExport,
    periodOf,
    sendListExport,
    withVoidedNote,
} = tableExport;

const COLUMNS = [
    { header: "Order Ref", value: row => row.ref },
    { header: "Vendor", value: row => row.vendor },
    { header: "Amount", value: row => row.amount, money: true },
];

const ROWS = [
    { ref: "T-1", vendor: "Acme", amount: 1080.5 },
    { ref: "T-2", vendor: null, amount: null },
];

const request = format => ({ format, title: "Fee Details", subtitle: "Period: a to b", columns: COLUMNS, rows: ROWS });

beforeEach(() => jest.clearAllMocks());

describe("the formats and the row limit every export shares", () => {
    it("offers Excel and PDF", () => {
        expect(EXPORT_FORMATS).toEqual(["excel", "pdf"]);
    });

    it("caps an export at 5000 rows", () => {
        expect(EXPORT_MAX_ROWS).toBe(5000);
    });
});

describe("Excel", () => {
    it("writes the headers, then one line per row, with amounts kept as numbers", async () => {
        const { buffer, contentType, extension } = await buildTableExport(request("excel"));

        expect(contentType).toBe("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        expect(extension).toBe("xlsx");

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);
        const rows = workbook.worksheets[0].getSheetValues().slice(1);
        expect(rows[0].slice(1)).toEqual(["Order Ref", "Vendor", "Amount"]);
        expect(rows[1].slice(1)).toEqual(["T-1", "Acme", 1080.5]);
    });

    it("leaves a blank, not the word null, where a value is missing", async () => {
        const { buffer } = await buildTableExport(request("excel"));

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);
        const row = workbook.worksheets[0].getSheetValues()[3].slice(1);
        expect(row[0]).toBe("T-2");
        expect(row.slice(1).every(value => value === null || value === undefined || value === "")).toBe(true);
    });
});

describe("PDF", () => {
    const htmlOf = async rows => {
        renderPdf.mockResolvedValue(Buffer.from("%PDF"));
        await buildTableExport({ ...request("pdf"), rows });
        return renderPdf.mock.calls[0][0];
    };

    it("renders the title, the filters it was run with, the headers and the rows", async () => {
        const html = await htmlOf(ROWS);

        expect(html).toContain("<h1>Fee Details</h1>");
        expect(html).toContain("Period: a to b");
        expect(html).toContain("2 rows");
        expect(html).toContain("<th>Order Ref</th>");
        expect(html).toContain("<td>T-1</td>");
    });

    it("shows amounts in rupees, grouped the Indian way, right-aligned", async () => {
        const html = await htmlOf([{ ref: "T-1", vendor: "Acme", amount: 1234567.5 }]);

        expect(html).toContain('<td class="num">₹ 12,34,567.50</td>');
        expect(html).toContain('<th class="num">Amount</th>');
    });

    it("escapes values, so a vendor name can never inject markup into the renderer", async () => {
        const html = await htmlOf([{ ref: "T-1", vendor: "<script>alert(1)</script>", amount: 1 }]);

        expect(html).not.toContain("<script>");
        expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    });

    it("returns a PDF file", async () => {
        renderPdf.mockResolvedValue(Buffer.from("%PDF"));
        const file = await buildTableExport(request("pdf"));

        expect(file.contentType).toBe("application/pdf");
        expect(file.extension).toBe("pdf");
        expect(file.buffer.toString()).toBe("%PDF");
    });

    it("fails with a 503 when the renderer returns nothing", async () => {
        renderPdf.mockResolvedValue(Buffer.alloc(0));

        await expect(buildTableExport(request("pdf"))).rejects.toMatchObject({ status_code: 503 });
    });
});

describe("sending the file", () => {
    const mockRes = () => {
        const res = { setHeader: jest.fn(), status: jest.fn(), send: jest.fn() };
        res.status.mockReturnValue(res);
        return res;
    };

    it("sets the type and a download filename, then sends the bytes", () => {
        const res = mockRes();
        const buffer = Buffer.from("x");

        sendTableExport(res, { buffer, contentType: "application/pdf", extension: "pdf" }, "Commission Details 2026-09-01 to 2026-09-30");

        expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "application/pdf");
        expect(res.setHeader).toHaveBeenCalledWith(
            "Content-Disposition",
            'attachment; filename="Commission Details 2026-09-01 to 2026-09-30.pdf"'
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith(buffer);
    });

    it("strips characters a filename can't carry", () => {
        const res = mockRes();

        sendTableExport(res, { buffer: Buffer.from("x"), contentType: "application/pdf", extension: "pdf" }, 'a/b:c"d');

        expect(res.setHeader).toHaveBeenCalledWith("Content-Disposition", 'attachment; filename="a-b-c-d.pdf"');
    });
});

describe("rupee sign", () => {
    it("is on money columns in the PDF, but not on other text", async () => {
        renderPdf.mockResolvedValue(Buffer.from("%PDF"));
        await buildTableExport({ ...request("pdf"), rows: [{ ref: "T-1", vendor: "Acme", amount: 18.73 }] });
        const html = renderPdf.mock.calls[0][0];

        expect(html).toContain('<td class="num">₹ 18.73</td>');
        expect(html).toContain("<td>Acme</td>");
    });

    it("leaves a blank money cell blank, not a lone ₹", async () => {
        renderPdf.mockResolvedValue(Buffer.from("%PDF"));
        await buildTableExport({ ...request("pdf"), rows: [{ ref: "T-1", vendor: "Acme", amount: null }] });

        expect(renderPdf.mock.calls[0][0]).toContain('<td class="num"></td>');
    });

    it("keeps Excel amounts as plain numbers so they can be summed", async () => {
        const { buffer } = await buildTableExport(request("excel"));

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);
        expect(workbook.worksheets[0].getCell("C2").value).toBe(1080.5);
    });
});

describe("requireExportFormat — the guard in front of every export route", () => {
    const { requireExportFormat } = require("../tableExport");

    it("lets Excel and PDF through", () => {
        const next = jest.fn();
        requireExportFormat({ params: { format: "excel" } }, {}, next);
        requireExportFormat({ params: { format: "pdf" } }, {}, next);

        expect(next).toHaveBeenCalledTimes(2);
        expect(next).toHaveBeenNthCalledWith(1);
        expect(next).toHaveBeenNthCalledWith(2);
    });

    it("turns anything else away with a 400", () => {
        const next = jest.fn();
        requireExportFormat({ params: { format: "csv" } }, {}, next);

        expect(next.mock.calls[0][0]).toMatchObject({ status_code: 400 });
    });
});

describe("PDF summary tiles and footnote", () => {
    const withExtras = async extras => {
        renderPdf.mockResolvedValue(Buffer.from("%PDF"));
        await buildTableExport({ ...request("pdf"), ...extras });
        return renderPdf.mock.calls[0][0];
    };

    it("shows the totals above the table, in rupees, when a screen has them", async () => {
        const html = await withExtras({
            summary: [
                { label: "Full Amount", value: 5224.4, money: true },
                { label: "Coupon", value: 0, money: true },
            ],
        });

        expect(html).toContain('<span class="tile-label">Full Amount</span>');
        expect(html).toContain('<span class="tile-value">₹ 5,224.40</span>');
        expect(html).toContain('<span class="tile-value">₹ 0.00</span>');
        expect(html.indexOf('class="tiles"')).toBeLessThan(html.indexOf("<table>"));
    });

    it("shows a footnote under the table", async () => {
        const html = await withExtras({ note: "Totals follow the same filters." });

        expect(html).toContain('<div class="note">Totals follow the same filters.</div>');
        expect(html.indexOf('class="note"')).toBeGreaterThan(html.indexOf("</table>"));
    });

    it("escapes tile labels and the footnote", async () => {
        const html = await withExtras({
            summary: [{ label: "<b>x</b>", value: "<i>y</i>" }],
            note: "<script>alert(1)</script>",
        });

        expect(html).not.toContain("<script>");
        expect(html).not.toContain("<b>x</b>");
        expect(html).toContain("&lt;b&gt;x&lt;/b&gt;");
    });

    it("adds nothing when a screen has no totals, so the other exports look as before", async () => {
        const html = await withExtras({});

        expect(html).not.toContain('<div class="tiles">');
        expect(html).not.toContain('<div class="note">');
    });

    it("leaves Excel as plain data, without the totals", async () => {
        const { buffer } = await buildTableExport({
            ...request("excel"),
            summary: [{ label: "Full Amount", value: 1, money: true }],
            note: "n",
        });

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);
        expect(workbook.worksheets[0].rowCount).toBe(1 + ROWS.length);
    });
});

describe("periodOf", () => {
    it("gives the day the range starts and the day it ends", () => {
        expect(periodOf(new Date(2026, 8, 6), new Date(2026, 9, 6))).toBe("2026-09-06 to 2026-10-06");
    });

    it("ends at today when no end date was given", () => {
        const today = new Date();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");

        expect(periodOf(new Date(2026, 8, 6))).toBe(`2026-09-06 to ${today.getFullYear()}-${month}-${day}`);
    });
});

describe("withVoidedNote", () => {
    it("leaves the text alone when nothing was reversed", () => {
        expect(withVoidedNote("Advance", { voidReason: null, voidedByName: null })).toBe("Advance");
    });

    it("adds why and by whom an entry was reversed", () => {
        expect(withVoidedNote("Advance", { voidReason: "Wrong account", voidedByName: "Asha" })).toBe(
            "Advance — Wrong account · Asha"
        );
        expect(withVoidedNote("Advance", { voidReason: "Wrong account", voidedByName: null })).toBe(
            "Advance — Wrong account"
        );
    });

    it("shows only the reason when there was no text", () => {
        expect(withVoidedNote(null, { voidReason: "Wrong account", voidedByName: "Asha" })).toBe(
            "Wrong account · Asha"
        );
        expect(withVoidedNote(null, { voidReason: null, voidedByName: null })).toBe("");
    });
});

describe("sendListExport — what every list's export goes through", () => {
    const FILE = { buffer: Buffer.from("x"), contentType: "application/pdf", extension: "pdf" };
    const build = jest.spyOn(tableExport, "buildTableExport");
    const send = jest.spyOn(tableExport, "sendTableExport").mockImplementation(() => undefined);

    const exportWith = async ({ list, res = {}, ...overrides }) => {
        const next = jest.fn();
        await sendListExport({
            res,
            next,
            format: "pdf",
            list,
            serialize: row => ({ ref: row.id }),
            columns: COLUMNS,
            title: "Fee Details",
            period: "2026-09-06 to 2026-10-06",
            subtitleOf: () => [],
            ...overrides,
        });
        return next;
    };

    beforeEach(() => build.mockResolvedValue(FILE));

    it("asks the list for every row up to the limit, not a page", async () => {
        const list = jest.fn().mockResolvedValue({ rows: [{ id: 1 }], count: 1 });

        await exportWith({ list });

        expect(list).toHaveBeenCalledWith({ limit: EXPORT_MAX_ROWS, offset: 0 });
    });

    it("tells the user when nothing matches, instead of sending an empty file", async () => {
        const next = await exportWith({ list: async () => ({ rows: [], count: 0 }) });

        expect(next.mock.calls[0][0]).toMatchObject({ status_code: 404 });
        expect(build).not.toHaveBeenCalled();
    });

    it("refuses more rows than the limit rather than silently cutting the file short", async () => {
        const next = await exportWith({
            list: async () => ({ rows: [{ id: 1 }], count: EXPORT_MAX_ROWS + 1 }),
        });

        expect(next.mock.calls[0][0]).toMatchObject({ status_code: 422 });
        expect(build).not.toHaveBeenCalled();
    });

    it("builds the file from the serialized rows, with the period and every extra filter in the subtitle", async () => {
        const res = {};
        await exportWith({
            res,
            list: async () => ({ rows: [{ id: 7 }], count: 1 }),
            subtitleOf: rows => [`Rows: ${rows.length}`, null, 'Search: "acme"'],
        });

        expect(build).toHaveBeenCalledWith({
            format: "pdf",
            title: "Fee Details",
            subtitle: 'Period: 2026-09-06 to 2026-10-06  ·  Rows: 1  ·  Search: "acme"',
            columns: COLUMNS,
            rows: [{ ref: 7 }],
            summary: undefined,
            note: undefined,
        });
        expect(send).toHaveBeenCalledWith(res, FILE, "Fee Details 2026-09-06 to 2026-10-06");
    });

    it("hands the screen's totals and footnote to the file when the list has them", async () => {
        await exportWith({
            list: async () => ({ rows: [{ id: 1 }], count: 1, totals: { amount: 5 } }),
            summaryOf: result => [{ label: "Amount", value: result.totals.amount, money: true }],
            note: "Totals follow the filters.",
        });

        expect(build.mock.calls[0][0].summary).toEqual([{ label: "Amount", value: 5, money: true }]);
        expect(build.mock.calls[0][0].note).toBe("Totals follow the filters.");
    });
});
