// Same as the other ondc service tests: stub the DB lookup so requiring the
// service does not drag in the model layer. libsodium is deliberately NOT
// stubbed here — these tests exist to exercise the real ed25519 / BLAKE-512
// round trip.
jest.mock("../../utils/checkAndFetchServiceDetails", () => ({
  findServiceOperatorByAccessKey: jest.fn(),
}));
jest.mock("axios", () => ({ default: { post: jest.fn() } }));

const sodium = require("libsodium-wrappers");

const {
  createOndcAuthorizationHeader,
  parseOndcAuthorizationHeader,
  verifyOndcAuthorizationHeader,
  probeSenderSerialization,
  pickSigningPublicKey,
  lookupSigningPublicKey,
} = require("../ondc");
const { default: axios } = require("axios");
const {
  findServiceOperatorByAccessKey,
} = require("../../utils/checkAndFetchServiceDetails");

const BAP_ID = "uatinapi.pekoapp.com";
const UNIQUE_KEY_ID = "test-unique-key-id";

let keys;

/** base64 (padded, ORIGINAL alphabet) of a Uint8Array */
const b64 = (bytes) => Buffer.from(bytes).toString("base64");

/** Sign `bodyString` with the test keypair and return the Authorization header. */
const sign = (bodyString) =>
  createOndcAuthorizationHeader(bodyString, {
    bapId: BAP_ID,
    uniqueKeyId: UNIQUE_KEY_ID,
    privateKey: b64(keys.privateKey),
  });

/** Rewrite a single param inside an Authorization header. */
const withParam = (header, key, value) =>
  header.replace(new RegExp(`${key}="[^"]*"`), `${key}="${value}"`);

const sampleBody = {
  context: {
    domain: "ONDC:RET14",
    action: "on_status",
    transaction_id: "txn-1",
    core_version: "1.2.5",
  },
  message: { order: { id: "ORD-1", quote: { price: { value: "100.00" } } } },
};

beforeAll(async () => {
  await sodium.ready;
  keys = sodium.crypto_sign_keypair();
});

describe("parseOndcAuthorizationHeader", () => {
  it("parses the spaced headers= variant and a padded signature", async () => {
    const header = await sign(JSON.stringify(sampleBody));
    const parts = parseOndcAuthorizationHeader(header);

    expect(parts).not.toBeNull();
    expect(parts.subscriberId).toBe(BAP_ID);
    expect(parts.uniqueKeyId).toBe(UNIQUE_KEY_ID);
    expect(parts.algo).toBe("ed25519");
    expect(parts.headers).toBe("(created) (expires) digest");
    // Base64 padding must survive the parse.
    expect(parts.signature).toMatch(/^[A-Za-z0-9+/]+={0,2}$/);
  });

  it("parses the no-space headers= variant", () => {
    const header =
      `Signature keyId="a|b|ed25519",algorithm="ed25519",created="1",` +
      `expires="2",headers="(created)(expires)digest",signature="AA=="`;
    const parts = parseOndcAuthorizationHeader(header);

    expect(parts.headers).toBe("(created)(expires)digest");
    expect(parts.signature).toBe("AA==");
  });

  it("returns null for a header with no signature", () => {
    expect(parseOndcAuthorizationHeader("Signature keyId=\"a|b|ed25519\"")).toBeNull();
    expect(parseOndcAuthorizationHeader("")).toBeNull();
    expect(parseOndcAuthorizationHeader(null)).toBeNull();
  });
});

describe("verifyOndcAuthorizationHeader", () => {
  it("verifies a round trip over the identical body string", async () => {
    const bodyString = JSON.stringify(sampleBody);
    const header = await sign(bodyString);

    const result = await verifyOndcAuthorizationHeader({
      header,
      bodyStrings: [bodyString],
      publicKey: b64(keys.publicKey),
    });

    expect(result).toMatchObject({ valid: true, reason: "ok" });
    expect(result.details.bodyVariant).toBe(0);
  });

  // Regression test for the actual production bug: the sender signed the bytes
  // it put on the wire, but we were digesting JSON.stringify(req.body).
  it("fails on a re-serialized body and passes on the raw bytes", async () => {
    const rawBody = JSON.stringify(sampleBody, null, 2); // pretty-printed sender
    const reserialized = JSON.stringify(JSON.parse(rawBody)); // what req.body gives back
    const header = await sign(rawBody);
    const publicKey = b64(keys.publicKey);

    expect(reserialized).not.toBe(rawBody);

    const reserializedOnly = await verifyOndcAuthorizationHeader({
      header,
      bodyStrings: [reserialized],
      publicKey,
    });
    expect(reserializedOnly.valid).toBe(false);
    expect(reserializedOnly.reason).toBe("digest_mismatch");

    const withRaw = await verifyOndcAuthorizationHeader({
      header,
      bodyStrings: [rawBody, reserialized],
      publicKey,
    });
    expect(withRaw.valid).toBe(true);
    expect(withRaw.details.bodyVariant).toBe(0);
  });

  it("round-trips a non-ASCII body", async () => {
    const bodyString = JSON.stringify({
      message: { name: "Café ₹1,299 — Muñoz", emoji: "🛒" },
    });
    const header = await sign(bodyString);

    const result = await verifyOndcAuthorizationHeader({
      header,
      bodyStrings: [bodyString],
      publicKey: b64(keys.publicKey),
    });

    expect(result.valid).toBe(true);
  });

  it("accepts unpadded and URL-safe base64 public keys", async () => {
    const bodyString = JSON.stringify(sampleBody);
    const header = await sign(bodyString);

    const unpadded = b64(keys.publicKey).replace(/=+$/, "");
    const urlSafe = b64(keys.publicKey).replace(/\+/g, "-").replace(/\//g, "_");

    for (const publicKey of [unpadded, urlSafe]) {
      const result = await verifyOndcAuthorizationHeader({
        header,
        bodyStrings: [bodyString],
        publicKey,
      });
      expect(result.valid).toBe(true);
    }
  });

  it("tolerates small clock skew but rejects a far-future created", async () => {
    const bodyString = JSON.stringify(sampleBody);
    const publicKey = b64(keys.publicKey);
    const header = await sign(bodyString);
    const created = Number(parseOndcAuthorizationHeader(header).created);

    // Within the 300s default skew: the signature is still over the original
    // created value, so re-signing is required for the string to stay valid.
    const nearFuture = await verifyOndcAuthorizationHeader({
      header,
      bodyStrings: [bodyString],
      publicKey,
    });
    expect(nearFuture.valid).toBe(true);

    // A created 10 minutes ahead is outside the tolerance.
    const farFuture = withParam(header, "created", String(created + 600));
    const result = await verifyOndcAuthorizationHeader({
      header: farFuture,
      bodyStrings: [bodyString],
      publicKey,
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("not_yet_valid");
  });

  it("reports expired when the window closed beyond the skew", async () => {
    const bodyString = JSON.stringify(sampleBody);
    const header = await sign(bodyString);
    const stale = withParam(header, "expires", "1000000000"); // 2001

    const result = await verifyOndcAuthorizationHeader({
      header: stale,
      bodyStrings: [bodyString],
      publicKey: b64(keys.publicKey),
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toBe("expired");
  });

  it("reports digest_mismatch for a tampered body and for a wrong key", async () => {
    const bodyString = JSON.stringify(sampleBody);
    const header = await sign(bodyString);

    const tampered = await verifyOndcAuthorizationHeader({
      header,
      bodyStrings: [bodyString.replace("ORD-1", "ORD-2")],
      publicKey: b64(keys.publicKey),
    });
    expect(tampered).toMatchObject({ valid: false, reason: "digest_mismatch" });

    const other = sodium.crypto_sign_keypair();
    const wrongKey = await verifyOndcAuthorizationHeader({
      header,
      bodyStrings: [bodyString],
      publicKey: b64(other.publicKey),
    });
    expect(wrongKey).toMatchObject({ valid: false, reason: "digest_mismatch" });
  });

  it("reports unsupported_headers_list for a non-standard signed header set", async () => {
    const bodyString = JSON.stringify(sampleBody);
    const header = withParam(
      await sign(bodyString),
      "headers",
      "(request-target) (created) digest"
    );

    const result = await verifyOndcAuthorizationHeader({
      header,
      bodyStrings: [bodyString],
      publicKey: b64(keys.publicKey),
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toBe("unsupported_headers_list");
    expect(result.details.signedHeaders).toBe("(request-target) (created) digest");
  });

  it("distinguishes a missing key and a malformed signature from a mismatch", async () => {
    const bodyString = JSON.stringify(sampleBody);
    const header = await sign(bodyString);

    const noKey = await verifyOndcAuthorizationHeader({
      header,
      bodyStrings: [bodyString],
      publicKey: null,
    });
    expect(noKey.reason).toBe("no_public_key");

    const shortSig = withParam(header, "signature", "AAAA");
    const badSig = await verifyOndcAuthorizationHeader({
      header: shortSig,
      bodyStrings: [bodyString],
      publicKey: b64(keys.publicKey),
    });
    expect(badSig.reason).toBe("bad_signature_encoding");

    const shortKey = await verifyOndcAuthorizationHeader({
      header,
      bodyStrings: [bodyString],
      publicKey: "AAAA",
    });
    expect(shortKey.reason).toBe("bad_public_key_length");

    const unparseable = await verifyOndcAuthorizationHeader({
      header: "Signature garbage",
      bodyStrings: [bodyString],
      publicKey: b64(keys.publicKey),
    });
    expect(unparseable.reason).toBe("unparseable_header");
  });

  it("still supports the legacy single bodyString argument", async () => {
    const bodyString = JSON.stringify(sampleBody);
    const header = await sign(bodyString);

    const result = await verifyOndcAuthorizationHeader({
      header,
      bodyString,
      publicKey: b64(keys.publicKey),
    });

    expect(result.valid).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Registry key selection.
//
// Fixture mirrors the real preprod lookup for seller-preprod-ondc.bino.bot:
// many domain rows, all sharing ONE ukId and ONE signing key. The seller's
// Authorization presented a different ukId, which the registry does not have.
// ---------------------------------------------------------------------------
const REGISTERED_UKID = "659110b6-b64e-4aca-bb23-f222b649feda";
const PRESENTED_UKID = "01381c82-27f8-42b3-91b5-7fa106c6001a";
const REGISTERED_KEY = "SaEGwAuwoFG4ReyFwYcahhEEvQ7yqnH31/CA9qMN2cg=";
const SELLER = "seller-preprod-ondc.bino.bot";

const registryRow = (domain, overrides = {}) => ({
  subscriber_id: SELLER,
  status: "SUBSCRIBED",
  ukId: REGISTERED_UKID,
  br_id: REGISTERED_UKID,
  country: "IND",
  domain,
  type: "BPP",
  valid_from: "2026-06-22T09:09:28.546Z",
  valid_until: "2027-06-22T09:09:28.546Z",
  signing_public_key: REGISTERED_KEY,
  ...overrides,
});

const registryRows = ["ONDC:RET10", "ONDC:RET11", "ONDC:RET14", "ONDC:FIS13"].map((d) =>
  registryRow(d)
);

describe("pickSigningPublicKey", () => {
  it("returns the key for a ukId the registry actually has", () => {
    expect(pickSigningPublicKey(registryRows, REGISTERED_UKID, "ONDC:RET10")).toBe(
      REGISTERED_KEY
    );
  });

  // The production bug: this used to return REGISTERED_KEY because every row
  // shared one signing key, guaranteeing an unexplainable digest_mismatch.
  it("returns null when the presented ukId is not in the registry", () => {
    expect(pickSigningPublicKey(registryRows, PRESENTED_UKID, "ONDC:RET10")).toBeNull();
  });

  it("does not fall back to a single-row pool whose ukId differs", () => {
    expect(pickSigningPublicKey([registryRow("ONDC:RET10")], PRESENTED_UKID, null)).toBeNull();
  });

  it("does not fall back to a shared key across a multi-row pool", () => {
    expect(pickSigningPublicKey(registryRows, PRESENTED_UKID, null)).toBeNull();
  });

  it("still returns a ukId match whose validity window has lapsed", () => {
    const expired = registryRows.map((r) =>
      registryRow(r.domain, {
        valid_from: "2020-01-01T00:00:00.000Z",
        valid_until: "2021-01-01T00:00:00.000Z",
      })
    );
    expect(pickSigningPublicKey(expired, REGISTERED_UKID, null)).toBe(REGISTERED_KEY);
  });

  it("matches on br_id and tolerates rows without a status field", () => {
    const rows = [
      registryRow("ONDC:RET10", { ukId: undefined, status: undefined, br_id: REGISTERED_UKID }),
    ];
    expect(pickSigningPublicKey(rows, REGISTERED_UKID, null)).toBe(REGISTERED_KEY);
  });

  it("returns null for empty rows or a missing ukId", () => {
    expect(pickSigningPublicKey([], REGISTERED_UKID, null)).toBeNull();
    expect(pickSigningPublicKey(registryRows, "", null)).toBeNull();
  });
});

describe("lookupSigningPublicKey", () => {
  const NACK_15045 = {
    status: 200,
    data: {
      message: { ack: { status: "NACK" } },
      error: { code: "15045", message: "No matching network participant found. Unrecognized values for: ukId" },
    },
  };

  let seq = 0;
  /** Unique subscriber per test — the module-level key cache is process-wide. */
  const uniqueSubscriber = () => `${SELLER}.${(seq += 1)}`;

  beforeEach(async () => {
    await sodium.ready;
    const vendorKeys = sodium.crypto_sign_keypair();
    axios.post.mockReset();
    findServiceOperatorByAccessKey.mockReset();
    findServiceOperatorByAccessKey.mockResolvedValue({
      vendor: {
        apiUrl: "https://gateway.example/search",
        healthUrl: "https://preprod.registry.ondc.org/v2.0/lookup",
        optional1: b64(vendorKeys.privateKey),
        optional2: "our-unique-key-id",
        optional3: "uatinapi.pekoapp.com",
        optional4: "https://uatinapi.pekoapp.com",
        optional6: "std:080",
        optionals: {},
      },
    });
  });

  it("resolves on the first attempt when the ukId query returns rows", async () => {
    axios.post.mockResolvedValueOnce({ status: 200, data: registryRows });

    const key = await lookupSigningPublicKey({
      subscriberId: uniqueSubscriber(),
      uniqueKeyId: REGISTERED_UKID,
      domain: "ONDC:RET10",
    });

    expect(key).toBe(REGISTERED_KEY);
    expect(axios.post).toHaveBeenCalledTimes(1);
    // The ukId must be on the wire — that is what makes 15045 meaningful.
    expect(JSON.parse(axios.post.mock.calls[0][1])).toMatchObject({ ukId: REGISTERED_UKID });
  });

  it("falls back to the subscriber-only query when the ukId query NACKs", async () => {
    axios.post
      .mockResolvedValueOnce(NACK_15045)
      .mockResolvedValueOnce({ status: 200, data: registryRows });

    const key = await lookupSigningPublicKey({
      subscriberId: uniqueSubscriber(),
      uniqueKeyId: REGISTERED_UKID,
      domain: null,
    });

    expect(key).toBe(REGISTERED_KEY);
    expect(axios.post).toHaveBeenCalledTimes(2);
    expect(JSON.parse(axios.post.mock.calls[1][1])).not.toHaveProperty("ukId");
  });

  it("throws ukid_not_in_registry naming the registry's actual ukIds", async () => {
    axios.post
      .mockResolvedValueOnce(NACK_15045)
      .mockResolvedValueOnce({ status: 200, data: registryRows });

    const promise = lookupSigningPublicKey({
      subscriberId: uniqueSubscriber(),
      uniqueKeyId: PRESENTED_UKID,
      domain: "ONDC:RET10",
    });

    await expect(promise).rejects.toMatchObject({
      code: "ukid_not_in_registry",
      presentedUkId: PRESENTED_UKID,
      registryUkIds: [REGISTERED_UKID],
    });
    await expect(promise).rejects.toThrow(REGISTERED_UKID);
  });

  it("throws subscriber_not_in_registry when no rows come back at all", async () => {
    axios.post.mockResolvedValue(NACK_15045);

    await expect(
      lookupSigningPublicKey({
        subscriberId: uniqueSubscriber(),
        uniqueKeyId: PRESENTED_UKID,
        domain: null,
      })
    ).rejects.toMatchObject({ code: "subscriber_not_in_registry" });
  });

  it("negative-caches a failure so a retrying sender does not re-query", async () => {
    axios.post
      .mockResolvedValueOnce(NACK_15045)
      .mockResolvedValueOnce({ status: 200, data: registryRows });

    const args = {
      subscriberId: uniqueSubscriber(),
      uniqueKeyId: PRESENTED_UKID,
      domain: "ONDC:RET10",
    };

    await expect(lookupSigningPublicKey(args)).rejects.toMatchObject({
      code: "ukid_not_in_registry",
    });
    expect(axios.post).toHaveBeenCalledTimes(2);

    // Second callback from the same misconfigured sender: served from cache.
    await expect(lookupSigningPublicKey(args)).rejects.toMatchObject({
      code: "ukid_not_in_registry",
    });
    expect(axios.post).toHaveBeenCalledTimes(2);
  });

  it("rejects with bad_lookup_args when the keyId parts are missing", async () => {
    await expect(
      lookupSigningPublicKey({ subscriberId: SELLER, uniqueKeyId: null })
    ).rejects.toMatchObject({ code: "bad_lookup_args" });
    expect(axios.post).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Interop with the official ondc-crypto-sdk-nodejs.
//
// Fixture generated once from that SDK with a fixed ed25519 seed and fixed
// created/expires (ed25519 is deterministic), so this pins spec-compliance
// without adding the SDK as a dependency of the purchase service.
// ---------------------------------------------------------------------------
const SDK_PUBLIC_KEY = "ebVWLo/mVPlAeLES6KmLp5AfhTrmlb7X4OORC60ElmQ=";
const SDK_BODY =
  '{"context":{"domain":"ONDC:RET10","action":"on_search","transaction_id":"fixture-txn"},"message":{"catalog":{"name":"Café ₹ fixture"}}}';
const SDK_HEADER =
  'Signature keyId="fixture.example.com|fixture-uk|ed25519",algorithm="ed25519",created="1700000000",expires="4102444800",headers="(created) (expires) digest",signature="UR/2abpwDHS0kq4Od0z7WbwzJVjop+rH2i8VdKjUpjnZfqYut7DkcqfHjQJ55ogB2AX6mzCP12uLyhGczTxGAg=="';
// Same SDK, same body — but the caller passed the OBJECT instead of the JSON
// string, so the SDK hashed the literal "[object Object]".
const SDK_HEADER_OBJECT_BUG =
  'Signature keyId="fixture.example.com|fixture-uk|ed25519",algorithm="ed25519",created="1700000000",expires="4102444800",headers="(created) (expires) digest",signature="qt3WbBUB+lUI96P3cirsSSLgevX2eqnjJIFHPKBYqXuCFa5ApJ/x1Kl1lEHK65XaKWzyrZtzOygPrRxoqfDTDg=="';

describe("interop with ondc-crypto-sdk-nodejs", () => {
  it("accepts a header produced by the official SDK", async () => {
    const result = await verifyOndcAuthorizationHeader({
      header: SDK_HEADER,
      bodyStrings: [SDK_BODY],
      publicKey: SDK_PUBLIC_KEY,
    });

    expect(result).toMatchObject({ valid: true, reason: "ok" });
  });

  it("accepts the SDK header when the body arrives as raw bytes", async () => {
    const result = await verifyOndcAuthorizationHeader({
      header: SDK_HEADER,
      bodyStrings: [new Uint8Array(Buffer.from(SDK_BODY, "utf8"))],
      publicKey: SDK_PUBLIC_KEY,
    });

    expect(result.valid).toBe(true);
  });

  it("rejects the SDK header when the sender passed an object, not a JSON string", async () => {
    const result = await verifyOndcAuthorizationHeader({
      header: SDK_HEADER_OBJECT_BUG,
      bodyStrings: [SDK_BODY],
      publicKey: SDK_PUBLIC_KEY,
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toBe("digest_mismatch");
  });
});

describe("probeSenderSerialization", () => {
  const probeFor = (header, body) =>
    probeSenderSerialization({
      header,
      publicKey: SDK_PUBLIC_KEY,
      rawBodyString: body,
      parsedBody: JSON.parse(body),
    });

  // The production symptom: correct ukId, correct key, valid-looking header,
  // and the digest is over "[object Object]".
  it("names the object-instead-of-JSON-string defect", async () => {
    const probe = await probeFor(SDK_HEADER_OBJECT_BUG, SDK_BODY);
    expect(probe.senderBug).toBe("sender_signed_object_not_json");
  });

  it("names a pretty-printed signing", async () => {
    const payload = JSON.parse(SDK_BODY);
    const header = await sign(JSON.stringify(payload, null, 2));

    const probe = await probeSenderSerialization({
      header,
      publicKey: b64(keys.publicKey),
      rawBodyString: JSON.stringify(payload),
      parsedBody: payload,
    });

    expect(probe.senderBug).toBe("sender_signed_pretty_json");
  });

  it("names a message-only signing", async () => {
    const payload = JSON.parse(SDK_BODY);
    const header = await sign(JSON.stringify(payload.message));

    const probe = await probeSenderSerialization({
      header,
      publicKey: b64(keys.publicKey),
      rawBodyString: JSON.stringify(payload),
      parsedBody: payload,
    });

    expect(probe.senderBug).toBe("sender_signed_message_only");
  });

  it("names an empty-body signing", async () => {
    const payload = JSON.parse(SDK_BODY);
    const header = await sign("");

    const probe = await probeSenderSerialization({
      header,
      publicKey: b64(keys.publicKey),
      rawBodyString: JSON.stringify(payload),
      parsedBody: payload,
    });

    expect(probe.senderBug).toBe("sender_signed_empty_body");
  });

  // Guards against false attribution: a genuinely tampered body must not be
  // blamed on one of the known defects.
  it("returns null for content that matches no known defect", async () => {
    const payload = JSON.parse(SDK_BODY);
    const header = await sign(JSON.stringify({ something: "entirely else" }));

    const probe = await probeSenderSerialization({
      header,
      publicKey: b64(keys.publicKey),
      rawBodyString: JSON.stringify(payload),
      parsedBody: payload,
    });

    expect(probe.senderBug).toBeNull();
    expect(probe.probed).toBeGreaterThan(0);
  });

  it("skips probing an oversized body", async () => {
    const probe = await probeSenderSerialization({
      header: SDK_HEADER_OBJECT_BUG,
      publicKey: SDK_PUBLIC_KEY,
      rawBodyString: "x".repeat(1024 * 1024 + 1),
      parsedBody: {},
    });

    expect(probe.senderBug).toBeNull();
    expect(probe.skipped).toBe("probes_skipped_body_too_large");
  });

  it("never reports a bug when the signature or key is unusable", async () => {
    await expect(
      probeSenderSerialization({
        header: SDK_HEADER_OBJECT_BUG,
        publicKey: "AAAA",
        rawBodyString: SDK_BODY,
        parsedBody: JSON.parse(SDK_BODY),
      })
    ).resolves.toMatchObject({ senderBug: null });
  });
});

describe("raw byte handling", () => {
  it("verifies bytes that are not valid UTF-8 without corrupting the digest", async () => {
    // 0xC3 0x28 is an invalid UTF-8 sequence; toString("utf8") would replace it
    // with U+FFFD and change the digest.
    const bytes = new Uint8Array([
      ...Buffer.from('{"a":"', "utf8"),
      0xc3,
      0x28,
      ...Buffer.from('"}', "utf8"),
    ]);

    await sodium.ready;
    const created = Math.floor(Date.now() / 1000);
    const expires = created + 3600;
    const digestBase64 = sodium.to_base64(
      sodium.crypto_generichash(64, bytes),
      sodium.base64_variants.ORIGINAL
    );
    const signingString = `(created): ${created}\n(expires): ${expires}\ndigest: BLAKE-512=${digestBase64}`;
    const signature = sodium.to_base64(
      sodium.crypto_sign_detached(signingString, keys.privateKey),
      sodium.base64_variants.ORIGINAL
    );
    const header =
      `Signature keyId="x|uk|ed25519",algorithm="ed25519",created="${created}",` +
      `expires="${expires}",headers="(created) (expires) digest",signature="${signature}"`;

    const asBytes = await verifyOndcAuthorizationHeader({
      header,
      bodyStrings: [bytes],
      publicKey: b64(keys.publicKey),
    });
    expect(asBytes.valid).toBe(true);

    // The lossy path this replaced.
    const asString = await verifyOndcAuthorizationHeader({
      header,
      bodyStrings: [Buffer.from(bytes).toString("utf8")],
      publicKey: b64(keys.publicKey),
    });
    expect(asString.valid).toBe(false);
  });
});
