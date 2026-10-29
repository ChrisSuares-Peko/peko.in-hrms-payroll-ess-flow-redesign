// Validates that a buffer is a real PDF by checking the "%PDF" magic bytes.
// Guards against placeholder/empty buffers being served as a downloadable .pdf.
exports.isPdfBuffer = (buf) =>
    Buffer.isBuffer(buf) &&
    buf.length >= 5 &&
    buf[0] === 0x25 && // %
    buf[1] === 0x50 && // P
    buf[2] === 0x44 && // D
    buf[3] === 0x46; // F
