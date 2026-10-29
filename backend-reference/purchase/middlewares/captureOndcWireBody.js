const zlib = require("zlib");

/**
 * Body parser for the ONDC webhooks that keeps the EXACT bytes the sender signed.
 *
 * ONDC signs a BLAKE-512 digest of the request body as it was on the wire, and GCR
 * sends Buyer Apps gzip — with the digest computed over the COMPRESSED bytes. The
 * global bodyParser.json cannot give us those: it inflates the stream before its
 * `verify` hook runs (body-parser lib/read.js), so the only buffer it exposes is the
 * decompressed one, whose digest can never match. Turning `inflate` off does not help
 * either — body-parser then rejects every compressed body with a 415.
 *
 * So for these routes we read the stream ourselves and expose both:
 *   req.rawWireBody — exactly what arrived (compressed, if it was)
 *   req.rawBody     — the decoded bytes (same meaning it always had)
 *   req.body        — the parsed JSON
 * and set `req._body`, which makes the global json/urlencoded parsers skip the request.
 */

/** Same ceiling as the global bodyParser.json (`limit: '10000kb'`) in app.js. */
const LIMIT_BYTES = 10000 * 1024;

/** gzip streams always open with these two bytes (RFC 1952). */
const isGzipMagic = (buf) => buf.length >= 2 && buf[0] === 0x1f && buf[1] === 0x8b;

const nack = (res, status, code, message) =>
  res.status(status).json({
    message: { ack: { status: "NACK" } },
    error: { type: "CONTEXT-ERROR", code: String(code), message },
  });

/**
 * Decode by Content-Encoding. The inflated size is capped at LIMIT_BYTES too — the
 * wire limit alone would let a tiny gzip body expand without bound.
 */
const decodeBody = (wire, encoding) => {
  const opts = { maxOutputLength: LIMIT_BYTES };
  switch (encoding) {
    case "gzip":
    case "x-gzip":
      return zlib.gunzipSync(wire, opts);
    case "deflate":
      return zlib.inflateSync(wire, opts);
    case "identity":
      // The GCR PRD never specifies Content-Encoding, only that the body is gzip.
      // A gzip body sent without the header would otherwise fail JSON.parse, so
      // recognise it by its magic bytes.
      return isGzipMagic(wire) ? zlib.gunzipSync(wire, opts) : wire;
    default: {
      const err = new Error(`unsupported content encoding "${encoding}"`);
      err.unsupportedEncoding = true;
      throw err;
    }
  }
};

const captureOndcWireBody = (req, res, next) => {
  // Already parsed, or not a JSON request: leave it to the global parsers so any
  // non-JSON traffic behaves exactly as it did before.
  if (req._body || !req.is("json")) return next();

  const encoding = String(req.headers["content-encoding"] || "identity").trim().toLowerCase();
  const chunks = [];
  let received = 0;
  let settled = false;

  const fail = (status, code, message) => {
    if (settled) return;
    settled = true;
    nack(res, status, code, message);
  };

  req.on("data", (chunk) => {
    if (settled) return;
    received += chunk.length;
    if (received > LIMIT_BYTES) {
      fail(413, 413, "Request body too large");
      return;
    }
    chunks.push(chunk);
  });

  req.on("end", () => {
    if (settled) return;

    const wire = Buffer.concat(chunks);
    let decoded;
    try {
      decoded = decodeBody(wire, encoding);
    } catch (err) {
      if (err.unsupportedEncoding) {
        fail(415, 415, err.message);
      } else if (err.code === "ERR_BUFFER_TOO_LARGE") {
        fail(413, 413, "Request body too large once decompressed");
      } else {
        fail(400, 400, `Could not decode ${encoding} request body`);
      }
      return;
    }

    let body = {};
    if (decoded.length) {
      try {
        body = JSON.parse(decoded.toString("utf8"));
      } catch (err) {
        fail(400, 400, "Request body is not valid JSON");
        return;
      }
    }

    settled = true;
    req.rawWireBody = wire;
    req.rawBody = decoded;
    req.body = body;
    req._body = true;
    next();
  });

  req.on("error", (err) => {
    if (settled) return;
    settled = true;
    next(err);
  });
};

module.exports = { captureOndcWireBody, decodeBody, LIMIT_BYTES };
