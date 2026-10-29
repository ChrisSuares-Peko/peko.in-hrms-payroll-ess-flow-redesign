const ErrorResponse = require("./error-response");

const BASE64_RE = /^[A-Za-z0-9+/]+={0,2}$/;

// Leading bytes of each accepted type, and the extension it is stored under.
const SIGNATURES = {
  png: { bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], ext: "png" },
  jpeg: { bytes: [0xff, 0xd8, 0xff], ext: "jpg" },
};

const detectType = (buffer) =>
  Object.keys(SIGNATURES).find((type) =>
    SIGNATURES[type].bytes.every((byte, i) => buffer[i] === byte)
  ) || null;

const sizeLabel = (maxKB) => (maxKB % 1024 === 0 ? `${maxKB / 1024} MB` : `${maxKB} KB`);

/**
 * Validate a client-sent base64 image before it is uploaded to public storage.
 * Checks the claimed format against a whitelist, the decoded size, and the
 * file's leading bytes; the stored extension comes from those bytes, never
 * from the client. Throws ErrorResponse(422) on any failure.
 */
const validateBase64Image = ({ base64, format, maxKB = 2048, allowed = ["png", "jpeg"], label = "Image" }) => {
  const cleaned = String(base64 || "")
    .split(";base64,")
    .pop()
    .replace(/\s+/g, "");
  if (!cleaned || cleaned.length % 4 !== 0 || !BASE64_RE.test(cleaned)) {
    throw new ErrorResponse(`${label} must be a valid base64-encoded file`, 422);
  }

  const claimed = String(format || "").trim().toLowerCase().replace(/^jpg$/, "jpeg");
  const allowedLabel = allowed.map((t) => t.toUpperCase()).join(" or ");
  if (!allowed.includes(claimed)) {
    throw new ErrorResponse(`${label} must be a ${allowedLabel} image`, 422);
  }

  const buffer = Buffer.from(cleaned, "base64");
  if (!buffer.length) {
    throw new ErrorResponse(`${label} must be a valid base64-encoded file`, 422);
  }
  if (buffer.length > maxKB * 1024) {
    throw new ErrorResponse(`File size must be smaller than ${sizeLabel(maxKB)}`, 422);
  }

  const detected = detectType(buffer);
  if (!detected || detected !== claimed || !allowed.includes(detected)) {
    throw new ErrorResponse(`${label} must be a ${allowedLabel} image`, 422);
  }

  return { base64: cleaned, ext: SIGNATURES[detected].ext };
};

module.exports = { validateBase64Image };
