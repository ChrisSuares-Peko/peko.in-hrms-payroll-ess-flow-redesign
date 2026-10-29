const {
  parseOndcAmount,
  scopeCartItems,
  assignGroupTransactionIds,
  toOndcOrderId,
  ondcRecipientName,
  normalizeOndcNetworkId,
  toOndcContextDomain,
  domainAliases,
  indianPincode,
  pickDefaultAddressPincode,
  stampBuyerFinderFee,
  sumQuoteItemsTotal,
} = require("../ondc_helper");

describe("sumQuoteItemsTotal", () => {
  const row = (titleType, value) => ({
    "@ondc/org/title_type": titleType,
    price: { value: String(value), currency: "INR" },
  });

  it("sums only the item rows", () => {
    const quote = {
      price: { value: "1200.00" },
      breakup: [row("item", 400), row("item", 600), row("delivery", 70), row("tax", 130)],
    };
    expect(sumQuoteItemsTotal(quote)).toBe(1000);
  });

  it("ignores delivery, tax, packing and misc", () => {
    const quote = {
      breakup: [row("item", 500), row("delivery", 40), row("packing", 20), row("misc", 10)],
    };
    expect(sumQuoteItemsTotal(quote)).toBe(500);
  });

  it("does not let a negative discount row corrupt the item sum", () => {
    // discounts arrive as their own title_type with a negative value
    const quote = { breakup: [row("item", 500), row("discount", -50)] };
    expect(sumQuoteItemsTotal(quote)).toBe(500);
  });

  it("is independent of the seller's declared grand total", () => {
    // quote.price.value is the BPP's assertion and is never cross-checked
    const quote = { price: { value: "9999.00" }, breakup: [row("item", 100)] };
    expect(sumQuoteItemsTotal(quote)).toBe(100);
  });

  it("rounds to paise", () => {
    const quote = { breakup: [row("item", 33.333), row("item", 66.667)] };
    expect(sumQuoteItemsTotal(quote)).toBe(100);
  });

  it("returns null — not 0 — when there are no item rows", () => {
    // the caller must distinguish "items worth nothing" from "unreadable breakup"
    expect(sumQuoteItemsTotal({ breakup: [row("delivery", 70)] })).toBeNull();
    expect(sumQuoteItemsTotal({ breakup: [] })).toBeNull();
    expect(sumQuoteItemsTotal({})).toBeNull();
    expect(sumQuoteItemsTotal(undefined)).toBeNull();
  });

  it("returns 0 for item rows that genuinely total nothing", () => {
    expect(sumQuoteItemsTotal({ breakup: [row("item", 0)] })).toBe(0);
  });
});

describe("stampBuyerFinderFee", () => {
  const payment = {
    "@ondc/org/buyer_app_finder_fee_type": "percent",
    "@ondc/org/buyer_app_finder_fee_amount": "2.5",
    type: "ON-FULFILLMENT",
  };

  it("records the declared fee on every line of the order", () => {
    const items = [
      { ondcProductId: "SKU-1", productQuantity: 2 },
      { ondcProductId: "SKU-2", productQuantity: 1 },
    ];
    expect(stampBuyerFinderFee(items, payment)).toEqual([
      {
        ondcProductId: "SKU-1",
        productQuantity: 2,
        buyerFinderFeeType: "percent",
        buyerFinderFeeAmount: "2.5",
      },
      {
        ondcProductId: "SKU-2",
        productQuantity: 1,
        buyerFinderFeeType: "percent",
        buyerFinderFeeAmount: "2.5",
      },
    ]);
  });

  it("keeps the existing line fields intact", () => {
    const [line] = stampBuyerFinderFee(
      [{ ondcProductId: "SKU-1", productName: "Pens", returnable: true, returnWindow: "P2D" }],
      payment
    );
    expect(line.productName).toBe("Pens");
    expect(line.returnable).toBe(true);
    expect(line.returnWindow).toBe("P2D");
  });

  it("does not mutate the caller's items", () => {
    const items = [{ ondcProductId: "SKU-1" }];
    stampBuyerFinderFee(items, payment);
    expect(items[0]).toEqual({ ondcProductId: "SKU-1" });
  });

  it("stores the type too — a bare amount is ambiguous", () => {
    const [line] = stampBuyerFinderFee([{ ondcProductId: "SKU-1" }], {
      "@ondc/org/buyer_app_finder_fee_type": "amount",
      "@ondc/org/buyer_app_finder_fee_amount": "15",
    });
    expect(line.buyerFinderFeeType).toBe("amount");
    expect(line.buyerFinderFeeAmount).toBe("15");
  });

  it("records null rather than inventing a fee when the order declared none", () => {
    const [line] = stampBuyerFinderFee([{ ondcProductId: "SKU-1" }], {});
    expect(line.buyerFinderFeeType).toBeNull();
    expect(line.buyerFinderFeeAmount).toBeNull();
  });

  it("tolerates a missing payment block or empty items", () => {
    expect(stampBuyerFinderFee([], undefined)).toEqual([]);
    expect(stampBuyerFinderFee(undefined, undefined)).toEqual([]);
    expect(stampBuyerFinderFee(null, null)).toEqual([]);
  });
});

describe("toOndcContextDomain", () => {
  it("prefixes a bare Categories-tab code", () => {
    expect(toOndcContextDomain("RET16")).toBe("ONDC:RET16");
    expect(toOndcContextDomain("ret10")).toBe("ONDC:RET10");
  });

  it("leaves an already-prefixed protocol domain as ONDC:CODE", () => {
    expect(toOndcContextDomain("ONDC:RET16")).toBe("ONDC:RET16");
    expect(toOndcContextDomain("ondc:ret14")).toBe("ONDC:RET14");
  });

  it("returns null when the value is empty", () => {
    expect(toOndcContextDomain(null)).toBeNull();
    expect(toOndcContextDomain("")).toBeNull();
    expect(toOndcContextDomain("   ")).toBeNull();
  });
});

describe("domainAliases", () => {
  it("returns protocol and bare spellings", () => {
    expect(domainAliases("RET14")).toEqual(["ONDC:RET14", "RET14"]);
    expect(domainAliases("ONDC:RET14")).toEqual(["ONDC:RET14", "RET14"]);
  });
});

describe("scopeCartItems", () => {
  const items = [
    { ondcProductId: "ITEM-A", productName: "Pens" },
    { ondcProductId: "ITEM-B", productName: "Paper" },
    { ondcProductId: "ITEM-C", productName: "Stapler" },
  ];

  // Buy Now: check out one product, leave the rest of the cart alone.
  it("narrows the cart to the requested ids", () => {
    expect(scopeCartItems(items, ["ITEM-B"])).toEqual([items[1]]);
    expect(scopeCartItems(items, ["ITEM-A", "ITEM-C"])).toEqual([items[0], items[2]]);
  });

  // The normal cart -> checkout path sends no scope and must be untouched.
  it("returns everything when no scope is given", () => {
    expect(scopeCartItems(items)).toBe(items);
    expect(scopeCartItems(items, [])).toBe(items);
    expect(scopeCartItems(items, null)).toBe(items);
    expect(scopeCartItems(items, "ITEM-A")).toBe(items);
  });

  // Caller turns this into a 409 rather than silently ordering the whole cart.
  it("returns empty when the scope matches nothing", () => {
    expect(scopeCartItems(items, ["ITEM-GONE"])).toEqual([]);
  });

  it("compares as strings and ignores blank ids", () => {
    expect(scopeCartItems([{ ondcProductId: 12 }], ["12"])).toHaveLength(1);
    expect(scopeCartItems(items, ["  ITEM-B  "])).toEqual([items[1]]);
    expect(scopeCartItems(items, ["", "   ", "ITEM-A"])).toEqual([items[0]]);
  });

  // Old snapshots predate ondcProductId — they must never match a real scope.
  it("never matches an item with no ondcProductId", () => {
    const withNull = [{ ondcProductId: null }, { ondcProductId: "ITEM-A" }];
    expect(scopeCartItems(withNull, ["ITEM-A"])).toEqual([withNull[1]]);
    expect(scopeCartItems(withNull, [""])).toBe(withNull);
  });

  it("tolerates a missing item list", () => {
    expect(scopeCartItems(undefined, ["ITEM-A"])).toEqual([]);
    expect(scopeCartItems([], ["ITEM-A"])).toEqual([]);
  });
});

describe("parseOndcAmount", () => {
  it("parses the bare numeric strings sellers are supposed to send", () => {
    expect(parseOndcAmount("50.00")).toBe(50);
    expect(parseOndcAmount("50")).toBe(50);
    expect(parseOndcAmount("0")).toBe(0);
  });

  // The reported bug: parseFloat("₹50.00") is NaN, and the caller's `|| 0`
  // fallback turned a real charge into ₹0 — which then reached the vendor split.
  it("strips currency decoration", () => {
    expect(parseOndcAmount("₹50.00")).toBe(50);
    expect(parseOndcAmount("₹ 50")).toBe(50);
    expect(parseOndcAmount("50.00 INR")).toBe(50);
    expect(parseOndcAmount("1,234.50")).toBe(1234.5);
  });

  // A blanket replace(/[^0-9.-]/g,"") leaves ".50" here → 0.5, wrong by 100×.
  it('reads "Rs. 50" as 50, not 0.5', () => {
    expect(parseOndcAmount("Rs. 50")).toBe(50);
    expect(parseOndcAmount("Rs.50")).toBe(50);
  });

  it("keeps negatives, since ONDC discount rows are negative", () => {
    expect(parseOndcAmount("-15.00")).toBe(-15);
    expect(parseOndcAmount("-₹15.00")).toBe(-15);
  });

  it("handles a leading decimal point", () => {
    expect(parseOndcAmount(".50")).toBe(0.5);
  });

  it("passes finite numbers through", () => {
    expect(parseOndcAmount(50)).toBe(50);
    expect(parseOndcAmount(0)).toBe(0);
    expect(parseOndcAmount(-15.5)).toBe(-15.5);
  });

  it("falls back on anything unparseable", () => {
    expect(parseOndcAmount(null)).toBe(0);
    expect(parseOndcAmount(undefined)).toBe(0);
    expect(parseOndcAmount("")).toBe(0);
    expect(parseOndcAmount("abc")).toBe(0);
    expect(parseOndcAmount(NaN)).toBe(0);
  });

  // ondcReturnLifecycle passes NaN so "no parseable quote trail" stays
  // distinguishable from a genuine ₹0 — it must refund the full remaining then.
  it("honours an explicit fallback", () => {
    expect(parseOndcAmount("abc", NaN)).toBeNaN();
    expect(parseOndcAmount(null, NaN)).toBeNaN();
    expect(parseOndcAmount("₹50.00", NaN)).toBe(50);
    expect(parseOndcAmount("0", NaN)).toBe(0);
  });
});

describe("assignGroupTransactionIds", () => {
  // Sequential factory so a "fresh" id is recognisable in the assertions.
  const factory = () => {
    let n = 0;
    return () => `fresh-${(n += 1)}`;
  };

  // The single-seller case, and the one Workbench depends on: the caller's
  // preferred id (a forced scenario id, or a select hint) must reach the wire.
  it("keeps the preferred id for the group that claims it first", () => {
    const ids = assignGroupTransactionIds(
      [{ seller: "A" }],
      () => "forced-txn",
      factory()
    );
    expect(ids).toEqual(["forced-txn"]);
  });

  it("passes the group and its index to preferredIdOf", () => {
    const preferredIdOf = jest.fn(() => null);
    const groups = [{ seller: "A" }, { seller: "B" }];
    assignGroupTransactionIds(groups, preferredIdOf, factory());
    expect(preferredIdOf).toHaveBeenNthCalledWith(1, groups[0], 0);
    expect(preferredIdOf).toHaveBeenNthCalledWith(2, groups[1], 1);
  });

  // A broadcast /search stamps every seller's catalog with one transaction_id,
  // so two groups can ask for the same value — only the first may have it.
  it("gives a later colliding group a fresh id", () => {
    const ids = assignGroupTransactionIds(
      [{ seller: "A" }, { seller: "B" }, { seller: "C" }],
      () => "shared-search-txn",
      factory()
    );
    expect(ids).toEqual(["shared-search-txn", "fresh-1", "fresh-2"]);
    expect(new Set(ids).size).toBe(3);
  });

  it("mints a fresh id when there is no preference", () => {
    expect(
      assignGroupTransactionIds([{}, {}], () => null, factory())
    ).toEqual(["fresh-1", "fresh-2"]);
    expect(
      assignGroupTransactionIds([{}], () => "", factory())
    ).toEqual(["fresh-1"]);
    expect(assignGroupTransactionIds([{}], undefined, factory())).toEqual([
      "fresh-1",
    ]);
  });

  it("falls back to a fresh id when preferredIdOf throws", () => {
    const ids = assignGroupTransactionIds(
      [{}],
      () => {
        throw new Error("bad snapshot");
      },
      factory()
    );
    expect(ids).toEqual(["fresh-1"]);
  });

  it("returns one non-empty id per group, positionally aligned", () => {
    const ids = assignGroupTransactionIds(
      [{ seller: "A" }, { seller: "B" }],
      (group) => (group.seller === "B" ? "b-txn" : null),
      factory()
    );
    expect(ids).toHaveLength(2);
    expect(ids[1]).toBe("b-txn");
    expect(ids.every(Boolean)).toBe(true);
  });

  it("returns an empty list for no groups", () => {
    expect(assignGroupTransactionIds([], () => "x", factory())).toEqual([]);
    expect(assignGroupTransactionIds(undefined, () => "x", factory())).toEqual([]);
  });
});

describe("toOndcOrderId", () => {
  // Workbench ORDER_ID: ^[0-9a-zA-Z/-_]{1,36}$ — `/-_` is a RANGE, so hyphen is
  // NOT allowed and colon unfortunately is.
  const ORDER_ID_RE = /^[0-9a-zA-Z/-_]{1,36}$/;

  it("keeps a hyphen-stripped UUID, which is what confirm mints", () => {
    const id = "550e8400e29b41d4a716446655440000";
    expect(toOndcOrderId(id)).toBe(id);
    expect(toOndcOrderId(id)).toMatch(ORDER_ID_RE);
  });

  it("keeps a short alphanumeric seller id", () => {
    expect(toOndcOrderId("O1")).toBe("O1");
  });

  it("rejects a hyphenated UUID, which the Workbench range does not include", () => {
    expect(toOndcOrderId("550e8400-e29b-41d4-a716-446655440000")).toBeNull();
  });

  it("rejects anything else the validator would NACK", () => {
    expect(toOndcOrderId("")).toBeNull();
    expect(toOndcOrderId("has space")).toBeNull();
    expect(toOndcOrderId("too-long-" + "x".repeat(30))).toBeNull();
  });
});

describe("ondcRecipientName", () => {
  it("prefers the first non-empty candidate", () => {
    expect(ondcRecipientName("  ", null, "Asha Rao")).toBe("Asha Rao");
  });

  it("returns null when nothing usable is given", () => {
    expect(ondcRecipientName(null, "", "   ")).toBeNull();
  });
});

describe("indianPincode", () => {
  it("accepts a 6-digit Indian PIN and strips decoration", () => {
    expect(indianPincode("560001")).toBe("560001");
    expect(indianPincode("  110001  ")).toBe("110001");
    expect(indianPincode("PIN-560001")).toBe("560001");
  });

  it("rejects leading-zero, short, and empty values", () => {
    expect(indianPincode("012345")).toBeNull();
    expect(indianPincode("56001")).toBeNull();
    expect(indianPincode("")).toBeNull();
    expect(indianPincode(null)).toBeNull();
    expect(indianPincode(undefined)).toBeNull();
  });
});

describe("pickDefaultAddressPincode", () => {
  it("prefers the default-flagged row when it has a PIN", () => {
    expect(
      pickDefaultAddressPincode([
        { default: 0, zipCode: "400001" },
        { default: 1, zipCode: "560001" },
      ])
    ).toBe("560001");
  });

  it("falls through to the first usable PIN when the default row has none", () => {
    expect(
      pickDefaultAddressPincode([
        { default: true, zipCode: "000000" },
        { default: false, zipCode: "110001" },
      ])
    ).toBe("110001");
  });

  it("returns null when nothing is usable", () => {
    expect(pickDefaultAddressPincode([])).toBeNull();
    expect(pickDefaultAddressPincode(null)).toBeNull();
    expect(pickDefaultAddressPincode([{ zipCode: "abc" }])).toBeNull();
  });
});

describe("normalizeOndcNetworkId", () => {
  const ID_RE = /^[0-9a-zA-Z/-_]{1,36}$/;

  it("keeps F1, the id we send on select/init", () => {
    expect(normalizeOndcNetworkId("F1")).toBe("F1");
  });

  it("strips hyphens from a UUID so FULFILLMENTS_ID accepts it", () => {
    const out = normalizeOndcNetworkId("550e8400-e29b-41d4-a716-446655440000");
    expect(out).toBe("550e8400e29b41d4a716446655440000");
    expect(out).toMatch(ID_RE);
  });

  it("falls back to F1 when the id is missing, which would otherwise omit the key", () => {
    expect(normalizeOndcNetworkId(null)).toBe("F1");
    expect(normalizeOndcNetworkId("")).toBe("F1");
    expect(normalizeOndcNetworkId("has space")).toBe("F1");
  });

  it("uses the caller fallback for a second fulfillment", () => {
    expect(normalizeOndcNetworkId(undefined, "F2")).toBe("F2");
  });
});
