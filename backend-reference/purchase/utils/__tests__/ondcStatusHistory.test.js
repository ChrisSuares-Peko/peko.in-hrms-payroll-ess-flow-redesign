const { appendStatusHistory, dedupeStatusHistory } = require("../ondcStatusHistory");

const delivery = (code) => ({
  type: "Delivery",
  state: { descriptor: { code } },
});

describe("appendStatusHistory", () => {
  it("seeds a single Order confirmed step when Accepted and Pending mean the same thing", () => {
    const next = appendStatusHistory(
      [],
      { orderState: "Accepted", fulfillments: [delivery("Pending")] },
      "on_confirm",
      "2026-08-20T00:00:00.000Z"
    );
    expect(next.map((e) => e.code)).toEqual(["Accepted"]);
  });

  it("does not duplicate the same order and fulfillment codes on a refresh", () => {
    const first = appendStatusHistory([], {
      orderState: "In-progress",
      fulfillments: [delivery("Agent-assigned")],
    });
    const second = appendStatusHistory(first, {
      orderState: "In-progress",
      fulfillments: [delivery("Agent-assigned")],
    });
    expect(second).toHaveLength(first.length);
  });

  it("appends a new fulfillment code without dropping earlier steps", () => {
    let history = appendStatusHistory([], {
      orderState: "Accepted",
      fulfillments: [delivery("Pending")],
    });
    history = appendStatusHistory(history, {
      orderState: "In-progress",
      fulfillments: [delivery("Agent-assigned")],
    });
    history = appendStatusHistory(history, {
      orderState: "In-progress",
      fulfillments: [delivery("Order-picked-up")],
    });
    expect(history.map((e) => `${e.kind}:${e.code}`)).toEqual([
      "order:Accepted",
      "order:In-progress",
      "fulfillment:Agent-assigned",
      "fulfillment:Order-picked-up",
    ]);
  });

  it("does not add Completed when Order-delivered already means Delivered", () => {
    const history = appendStatusHistory(
      [
        {
          kind: "fulfillment",
          code: "Order-delivered",
          fulfillmentType: "Delivery",
        },
      ],
      {
        orderState: "Completed",
        fulfillments: [
          delivery("Order-delivered"),
          { type: "Return", state: { descriptor: { code: "Return_Initiated" } } },
        ],
      }
    );
    expect(history.map((e) => `${e.fulfillmentType || e.kind}:${e.code}`)).toEqual([
      "Delivery:Order-delivered",
      "Return:Return_Initiated",
    ]);
  });

  it("collapses consecutive Accepted + Pending already stored", () => {
    const out = dedupeStatusHistory([
      { kind: "order", code: "Accepted" },
      { kind: "fulfillment", code: "Pending", fulfillmentType: "Delivery" },
      { kind: "order", code: "In-progress" },
      { kind: "order", code: "Completed" },
      { kind: "fulfillment", code: "Order-delivered", fulfillmentType: "Delivery" },
    ]);
    expect(out.map((e) => e.code)).toEqual(["Accepted", "In-progress", "Completed"]);
  });
});
