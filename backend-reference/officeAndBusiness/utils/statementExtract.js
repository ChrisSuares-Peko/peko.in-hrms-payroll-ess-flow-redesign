/* eslint-disable import/no-unresolved */
// Reads a bank-statement PDF with the Gemini API and returns structured transactions.
const MODEL = process.env.GEMINI_MODEL

const PROMPT = `You are a bank-statement parser for Indian banks (SBI, HDFC, ICICI, Axis, Kotak, etc.).
Read this statement and return ONLY a JSON object:

{
  "openingBalance": 0.00,
  "closingBalance": 0.00,
  "transactions": [
    { "txnDate": "YYYY-MM-DD", "description": "string", "amount": 0.00,
      "type": "Income" | "Expense", "category": "string", "balance": 0.00 }
  ]
}

Rules:
- Include EVERY transaction row, in order. Do NOT invent transactions.
- Join narrations that wrap across lines into one clean description.
- Withdrawal/Debit => Expense; Deposit/Credit => Income. Trust the deposit/withdrawal
  COLUMN, not the payee name.
- A reversal/refund (REV, REVERSAL, REFUND, "REVERSE MONEY") returns money and is
  usually Income (credit) — decide by which column the amount sits in.
- amount is the POSITIVE magnitude only; direction is carried by "type".
- The running-balance column is NOT an amount — put it only in "balance".
- Always set a "category" (best guess, e.g. Interest, Transfer, EMI, Salary,
  Cash Deposit, Bill Payment, Bank Charges); use "Uncategorized" if unsure.
- IGNORE headers, opening/closing-balance lines, page numbers and summary totals.`;

// pdfBuffer: Node Buffer of the PDF bytes.
async function extractStatement(pdfBuffer) {
    if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");
    // @google/genai ships as ESM; dynamic import works from this CommonJS module.
    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    let response;
    try {
        response = await ai.models.generateContent({
            model: MODEL,
            contents: [
                { inlineData: { mimeType: "application/pdf", data: pdfBuffer.toString("base64") } },
                { text: PROMPT },
            ],
            config: { responseMimeType: "application/json", temperature: 0 },
        });
    } catch (error) {
        console.error("Gemini statement extraction request failed:", error?.message || error);
        if (error?.message?.includes('"code":429') || error?.status === 429) {
            throw new Error("Statement parsing is busy right now. Please try again in a minute.");
        }
        throw new Error("Failed to parse the statement. Please try again or contact support.");
    }

    let data;
    try {
        data = JSON.parse(response.text);
    } catch (error) {
        console.error("Gemini statement extraction returned invalid JSON:", error?.message || error);
        throw new Error("Failed to parse the statement. Please try again or contact support.");
    }

    return { ...data, transactions: dedupeTransactions(data.transactions) };
}

// Gemini occasionally re-extracts the same statement line twice (e.g. across a
// page break); drop exact repeats of a row rather than importing it twice.
function dedupeTransactions(transactions) {
    const seen = new Set();
    const deduped = [];
    for (const t of transactions || []) {
        const key = `${t.txnDate}|${t.description}|${t.amount}|${t.type}|${t.balance}`;
        if (seen.has(key)) continue;
        seen.add(key);
        deduped.push(t);
    }
    return deduped;
}

module.exports = { extractStatement };
