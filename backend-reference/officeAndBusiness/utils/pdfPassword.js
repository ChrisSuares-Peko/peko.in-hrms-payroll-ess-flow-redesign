// Detect + decrypt password-protected PDFs via mupdf (pure npm, no system binary).
// processPdf(buffer, password) -> { buffer } | { locked } | { locked, invalidPassword }
async function processPdf(buffer, password) {
    let doc;
    try {
        const mupdfModule = "mupdf";
        const mupdf = await import(mupdfModule);
        doc = mupdf.Document.openDocument(buffer, "application/pdf");
    } catch {
        return { buffer };
    }

    if (!doc.needsPassword()) return { buffer };
    if (!password) return { locked: true };
    if (!doc.authenticatePassword(password)) return { locked: true, invalidPassword: true };

    try {
        const out = doc.asPDF().saveToBuffer("encrypt=none");
        return { buffer: Buffer.from(out.asUint8Array()) };
    } catch {
        return { locked: true, invalidPassword: true };
    }
}

module.exports = { processPdf };
