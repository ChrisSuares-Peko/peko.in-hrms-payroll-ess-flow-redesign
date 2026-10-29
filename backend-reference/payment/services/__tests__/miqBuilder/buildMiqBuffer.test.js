const ExcelJS = require("exceljs");
const { buildMiqBuffer, MIQ_HEADERS } = require("../../miqBuilder");

// Reads back the generated workbook so we assert on real Excel content, not the input.
const readBack = async (buffer) => {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  const sheet = wb.worksheets[0];
  // ExcelJS row.values is 1-indexed (index 0 is undefined); drop it.
  const header = sheet.getRow(1).values.slice(1);
  const data = sheet.getRow(2).values.slice(1);
  return { header, data };
};

const at = (label, row) => row[MIQ_HEADERS.indexOf(label)];

describe("buildMiqBuffer", () => {
  it("returns a non-empty Buffer", async () => {
    const buf = await buildMiqBuffer({ merchant_name: "Acme" });
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.length).toBeGreaterThan(0);
  });

  it("writes the exact fixed header row", async () => {
    const { header } = await readBack(await buildMiqBuffer({ merchant_name: "Acme" }));
    expect(header).toEqual(MIQ_HEADERS);
    expect(header).toHaveLength(34);
  });

  it("maps merchant fields into the aligned columns", async () => {
    const { data } = await readBack(
      await buildMiqBuffer({
        merchant_name: "Acme Pvt Ltd",
        entity_type: "partnership",
        business_pan: "ABCDE1234F",
        gstin: "27ABCDE1234F1Z5",
        pincode: "560001",
      })
    );
    expect(at("Merchant Name", data)).toBe("Acme Pvt Ltd");
    expect(at("Business Type (Proprietorship/Partnership/Pvt Ltd)", data)).toBe("Partnership");
    expect(at("Business PAN", data)).toBe("ABCDE1234F");
    expect(at("GSTIN", data)).toBe("27ABCDE1234F1Z5");
    expect(at("PIN Code", data)).toBe("560001");
  });

  it("falls back name-derived columns to merchant_name when not supplied", async () => {
    const { data } = await readBack(await buildMiqBuffer({ merchant_name: "Acme" }));
    expect(at("Billing Name ", data)).toBe("Acme");
    expect(at("Legal Business Name", data)).toBe("Acme");
    expect(at("Contact Person Name", data)).toBe("Acme");
  });

  it("leaves missing fields and the Redirection URL blank", async () => {
    const { data } = await readBack(await buildMiqBuffer({ merchant_name: "Acme" }));
    // ExcelJS omits trailing empty cells, so an unset column reads as undefined/"".
    expect(at("CIN", data) ?? "").toBe("");
    expect(at("Redirection URL", data) ?? "").toBe("");
  });

  it("maps every supported entity_type to its NuPay label", async () => {
    const cases = {
      individual: "Individual",
      sole_proprietorship: "Proprietorship",
      partnership: "Partnership",
      private_limited: "Pvt Ltd",
    };
    for (const [entity_type, label] of Object.entries(cases)) {
      const { data } = await readBack(await buildMiqBuffer({ merchant_name: "A", entity_type }));
      expect(at("Business Type (Proprietorship/Partnership/Pvt Ltd)", data)).toBe(label);
    }
  });
});
